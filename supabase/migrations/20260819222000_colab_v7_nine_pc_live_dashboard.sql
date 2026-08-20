-- Colab Lab 01 V7
-- Classroom resilience + efficient live teacher dashboard for a 9-workstation lab.
-- Goals:
--   * keep the dashboard query set-based (avoid per-attempt correlated count queries)
--   * expose latest submitted answer + per-stage response detail to the authenticated teacher
--   * keep projected/final grade and support telemetry current
--   * add narrow indexes for the exact classroom access paths

create index if not exists learning_activity_attempts_live_dashboard_idx
  on public.learning_activity_attempts(activity_id, last_activity_at desc);

create index if not exists learning_activity_responses_live_dashboard_idx
  on public.learning_activity_responses(attempt_id, last_answered_at desc);

create index if not exists learning_activity_events_live_dashboard_idx
  on public.learning_activity_events(attempt_id, event_type);

create index if not exists learning_activity_checkpoints_live_dashboard_idx
  on public.learning_activity_checkpoints(activity_id, sequence_no);

create or replace function public.teacher_learning_dashboard(p_teacher_token text)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
  v_teacher_session uuid;
begin
  v_teacher_session := public.teacher_code_session_id(p_teacher_token);
  if v_teacher_session is null then
    raise exception 'Invalid or expired teacher session';
  end if;

  return (
    with
    checkpoint_stats as (
      select c.activity_id, count(*)::integer as checkpoint_count
      from public.learning_activity_checkpoints c
      group by c.activity_id
    ),
    member_stats as (
      select
        m.attempt_id,
        count(*)::integer as member_count,
        jsonb_agg(
          jsonb_build_object(
            'member_order',m.member_order,
            'student_registry_id',m.student_registry_id,
            'display_name',m.display_name,
            'is_roster_match',m.is_roster_match
          ) order by m.member_order
        ) as participants
      from public.learning_activity_attempt_members m
      group by m.attempt_id
    ),
    response_stats as (
      select
        r.attempt_id,
        count(*) filter (where r.correct=true)::integer as correct_count,
        count(*) filter (where coalesce(r.completed,false)=true)::integer as completed_count,
        coalesce(sum(r.wrong_attempts),0)::integer as wrong_attempts,
        count(*) filter (where coalesce(r.solution_revealed,false)=true)::integer as revealed_count,
        count(*) filter (where r.completion_mode='skipped')::integer as skipped_count,
        jsonb_agg(
          jsonb_build_object(
            'checkpoint_key',c.checkpoint_key,
            'sequence',c.sequence_no,
            'title',c.title,
            'latest_answer',r.latest_answer,
            'expected_answer',c.expected_text,
            'correct',coalesce(r.correct,false),
            'completed',coalesce(r.completed,false),
            'completion_mode',coalesce(r.completion_mode,'pending'),
            'awarded_points',coalesce(r.awarded_points,0),
            'wrong_attempts',coalesce(r.wrong_attempts,0),
            'help_count',coalesce(r.help_count,0),
            'try_count',coalesce(r.try_count,0),
            'last_answered_at',r.last_answered_at
          ) order by c.sequence_no
        ) as responses
      from public.learning_activity_responses r
      join public.learning_activity_checkpoints c on c.id=r.checkpoint_id
      group by r.attempt_id
    ),
    latest_response as (
      select distinct on (r.attempt_id)
        r.attempt_id,
        c.checkpoint_key,
        c.sequence_no,
        c.title,
        r.latest_answer,
        c.expected_text,
        r.correct,
        r.completed,
        r.completion_mode,
        r.awarded_points,
        r.wrong_attempts,
        r.help_count,
        r.try_count,
        r.last_answered_at
      from public.learning_activity_responses r
      join public.learning_activity_checkpoints c on c.id=r.checkpoint_id
      order by r.attempt_id, r.last_answered_at desc nulls last, c.sequence_no desc
    ),
    event_stats as (
      select
        ev.attempt_id,
        count(*)::integer as event_count,
        count(*) filter (where ev.event_type in ('FULLSCREEN_EXIT','UNAUTHORIZED_LEAVE'))::integer as restriction_events
      from public.learning_activity_events ev
      group by ev.attempt_id
    ),
    projection_stats as (
      select
        x.id as attempt_id,
        round(
          a.grade_min
          + (a.grade_max-a.grade_min)
            * (
                coalesce(sum(
                  case
                    when coalesce(r.completed,false) then coalesce(r.awarded_points,0)
                    else public.learning_activity_stage_credit(c.points,coalesce(r.help_count,0),coalesce(r.wrong_attempts,0))
                  end
                ),0)
                / greatest(a.max_points,1)
              ),
          2
        ) as projected_grade
      from public.learning_activity_attempts x
      join public.learning_activities a on a.id=x.activity_id
      join public.learning_activity_checkpoints c on c.activity_id=x.activity_id
      left join public.learning_activity_responses r
        on r.attempt_id=x.id and r.checkpoint_id=c.id
      group by x.id,a.grade_min,a.grade_max,a.max_points
    )
    select jsonb_build_object(
      'generated_at',clock_timestamp(),
      'activities',(
        select coalesce(jsonb_agg(jsonb_build_object(
          'id',a.id,
          'slug',a.slug,
          'title',a.title,
          'status',a.status,
          'max_points',a.max_points
        ) order by a.created_at),'[]'::jsonb)
        from public.learning_activities a
        where a.status<>'draft'
      ),
      'roster',(
        select coalesce(jsonb_agg(jsonb_build_object(
          'id',s.id,
          'group_code',s.group_code,
          'source_position',s.source_position,
          'display_name',s.display_name
        ) order by s.group_code,s.source_position),'[]'::jsonb)
        from public.student_registry s
        where s.active=true and s.group_code in ('11A','11B','11C')
      ),
      'activity_results',(
        select coalesce(jsonb_agg(jsonb_build_object(
          'attempt_id',x.id,
          'student_registry_id',x.student_registry_id,
          'student_name',x.student_name_snapshot,
          'group_code',x.group_code,
          'is_roster_match',x.is_roster_match,
          'team_size',coalesce(x.team_size,ms.member_count,1),
          'registration_mode',coalesce(x.registration_mode,'individual'),
          'participants',coalesce(ms.participants,'[]'::jsonb),
          'activity_slug',a.slug,
          'status',x.status,
          'points',x.points,
          'grade',x.grade,
          'projected_grade',coalesce(ps.projected_grade,x.grade),
          'help_tokens_used',coalesce(x.help_tokens_used,0),
          'correct_count',coalesce(rs.correct_count,0),
          'completed_count',coalesce(rs.completed_count,0),
          'checkpoint_count',coalesce(cs.checkpoint_count,0),
          'wrong_attempts',coalesce(rs.wrong_attempts,0),
          'revealed_count',coalesce(rs.revealed_count,0),
          'skipped_count',coalesce(rs.skipped_count,0),
          'restriction_events',coalesce(es.restriction_events,0),
          'event_count',coalesce(es.event_count,0),
          'latest_checkpoint_key',lr.checkpoint_key,
          'latest_checkpoint_sequence',lr.sequence_no,
          'latest_checkpoint_title',lr.title,
          'latest_answer',lr.latest_answer,
          'latest_expected_answer',lr.expected_text,
          'latest_answer_correct',lr.correct,
          'latest_answer_completed',lr.completed,
          'latest_completion_mode',lr.completion_mode,
          'latest_awarded_points',lr.awarded_points,
          'latest_answered_at',lr.last_answered_at,
          'responses',coalesce(rs.responses,'[]'::jsonb),
          'started_at',x.started_at,
          'last_activity_at',x.last_activity_at,
          'submitted_at',x.submitted_at
        ) order by x.last_activity_at desc),'[]'::jsonb)
        from public.learning_activity_attempts x
        join public.learning_activities a on a.id=x.activity_id
        left join checkpoint_stats cs on cs.activity_id=x.activity_id
        left join member_stats ms on ms.attempt_id=x.id
        left join response_stats rs on rs.attempt_id=x.id
        left join latest_response lr on lr.attempt_id=x.id
        left join event_stats es on es.attempt_id=x.id
        left join projection_stats ps on ps.attempt_id=x.id
      ),
      'exam_results',(
        select coalesce(jsonb_agg(jsonb_build_object(
          'student_registry_id',z.student_registry_id,
          'grade',z.grade,
          'status',z.status,
          'submitted_at',z.submitted_at
        )),'[]'::jsonb)
        from (
          select distinct on (t.student_registry_id)
            t.student_registry_id,t.grade,t.status,t.submitted_at,t.started_at
          from public.attempts t
          where t.student_registry_id is not null and t.grade is not null
          order by t.student_registry_id,t.submitted_at desc nulls last,t.started_at desc
        ) z
      )
    )
  );
end;
$$;

grant execute on function public.teacher_learning_dashboard(text) to anon, authenticated;

notify pgrst, 'reload schema';
