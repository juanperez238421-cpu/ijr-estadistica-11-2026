-- Statistics 11 · Colab Lab 01 V9
-- Institutional-email registration, repeatable registrations, and a compact teacher dashboard.

alter table public.learning_activity_attempt_members
  add column if not exists institutional_email text,
  add column if not exists email_normalized text;

create index if not exists learning_activity_members_activity_email_idx
  on public.learning_activity_attempt_members(activity_id, email_normalized)
  where email_normalized is not null;

comment on column public.learning_activity_attempt_members.institutional_email is
  'Institutional email entered by the student for this registration.';
comment on column public.learning_activity_attempt_members.email_normalized is
  'Lowercase trimmed institutional email used for matching and reporting.';

create or replace function public.student_learning_activity_start_team_email(
  p_activity_slug text,
  p_student_emails jsonb,
  p_group_code text,
  p_session_id uuid,
  p_user_agent text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_activity public.learning_activities%rowtype;
  v_attempt public.learning_activity_attempts%rowtype;
  v_student public.student_registry%rowtype;
  v_group text;
  v_token text;
  v_team_key text;
  v_team_label text;
  v_size integer;
  v_i integer;
  v_email text;
  v_display text;
  v_registry_count integer;
  v_emails text[] := array[]::text[];
  v_names text[] := array[]::text[];
  v_all_roster boolean := true;
begin
  v_group := upper(trim(coalesce(p_group_code,'')));
  if v_group not in ('11A','11B','11C') then
    raise exception 'Select a valid group';
  end if;

  if p_student_emails is null or jsonb_typeof(p_student_emails) <> 'array' then
    raise exception 'Provide the institutional email for every team member';
  end if;

  v_size := jsonb_array_length(p_student_emails);
  if v_size not in (2,3) then
    raise exception 'Each workstation must register 2 or 3 students';
  end if;

  select * into v_activity
  from public.learning_activities
  where slug=p_activity_slug and status='open';
  if v_activity.id is null then
    raise exception 'Activity is not open';
  end if;

  -- Validate and normalize all emails before writing anything.
  for v_i in 0..v_size-1 loop
    v_email := lower(trim(coalesce(p_student_emails->>v_i,'')));
    if length(v_email) < 12
       or v_email ~ '\s'
       or array_length(string_to_array(v_email,'@'),1) <> 2
       or split_part(v_email,'@',1) = ''
       or split_part(v_email,'@',2) <> 'ijr.edu.co' then
      raise exception 'Use a valid institutional email ending in @ijr.edu.co for every student';
    end if;
    if v_email = any(v_emails) then
      raise exception 'Do not repeat the same institutional email inside one team';
    end if;
    v_emails := array_append(v_emails,v_email);
  end loop;

  select string_agg(e,'|' order by e) into v_team_key from unnest(v_emails) e;

  -- Resolve a display name when a unique prior institutional-email identity exists.
  -- Unknown institutional emails are still accepted and shown as their email address.
  for v_i in 1..v_size loop
    v_email := v_emails[v_i];
    v_registry_count := 0;
    select count(distinct t.student_registry_id)
      into v_registry_count
    from public.attempts t
    where t.student_registry_id is not null
      and lower(trim(coalesce(t.student_email_normalized,t.student_email,''))) = v_email
      and t.group_code = v_group;

    if v_registry_count = 1 then
      select s.* into v_student
      from public.student_registry s
      where s.id = (
        select t.student_registry_id
        from public.attempts t
        where t.student_registry_id is not null
          and lower(trim(coalesce(t.student_email_normalized,t.student_email,''))) = v_email
          and t.group_code = v_group
        order by t.started_at desc
        limit 1
      )
      and s.active=true
      limit 1;
    else
      v_student.id := null;
    end if;

    if v_student.id is not null then
      v_display := v_student.display_name;
    else
      v_display := v_email;
      v_all_roster := false;
    end if;
    v_names := array_append(v_names,v_display);
  end loop;

  select string_agg(n,' · ' order by ord) into v_team_label
  from unnest(v_names) with ordinality as t(n,ord);

  v_token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');

  -- The session UUID makes network retries idempotent. A new registration creates a
  -- new UUID, so the same institutional email may legitimately register again.
  select * into v_attempt
  from public.learning_activity_attempts
  where activity_id=v_activity.id
    and session_id=p_session_id
  order by started_at desc
  limit 1;

  if v_attempt.id is not null then
    update public.learning_activity_attempts
    set access_token_hash=encode(digest(v_token,'sha256'),'hex'),
        last_activity_at=clock_timestamp(),
        user_agent=coalesce(p_user_agent,user_agent)
    where id=v_attempt.id
    returning * into v_attempt;

    return jsonb_build_object(
      'attempt_id',v_attempt.id,
      'attempt_token',v_token,
      'identity_mode','team_email',
      'team_size',coalesce(v_attempt.team_size,v_size),
      'snapshot',public.learning_activity_snapshot(v_attempt.id,v_token)
    );
  end if;

  insert into public.learning_activity_attempts(
    activity_id,student_registry_id,student_name_snapshot,student_name_normalized,
    is_roster_match,group_code,session_id,access_token_hash,user_agent,
    team_key,team_size,registration_mode
  ) values (
    v_activity.id,null,v_team_label,v_team_key,v_all_roster,v_group,
    coalesce(p_session_id,gen_random_uuid()),encode(digest(v_token,'sha256'),'hex'),p_user_agent,
    v_team_key,v_size,'team_email'
  ) returning * into v_attempt;

  for v_i in 1..v_size loop
    v_email := v_emails[v_i];
    v_registry_count := 0;
    select count(distinct t.student_registry_id)
      into v_registry_count
    from public.attempts t
    where t.student_registry_id is not null
      and lower(trim(coalesce(t.student_email_normalized,t.student_email,''))) = v_email
      and t.group_code = v_group;

    if v_registry_count = 1 then
      select s.* into v_student
      from public.student_registry s
      where s.id = (
        select t.student_registry_id
        from public.attempts t
        where t.student_registry_id is not null
          and lower(trim(coalesce(t.student_email_normalized,t.student_email,''))) = v_email
          and t.group_code = v_group
        order by t.started_at desc
        limit 1
      )
      and s.active=true
      limit 1;
    else
      v_student.id := null;
    end if;

    v_display := case when v_student.id is not null then v_student.display_name else v_email end;

    insert into public.learning_activity_attempt_members(
      attempt_id,activity_id,group_code,member_order,student_registry_id,
      display_name,normalized_name,is_roster_match,institutional_email,email_normalized
    ) values (
      v_attempt.id,v_activity.id,v_group,v_i,
      case when v_student.id is not null then v_student.id else null end,
      v_display,public.normalize_student_name(v_display),(v_student.id is not null),
      v_email,v_email
    );
  end loop;

  insert into public.learning_activity_events(attempt_id,event_type,metadata)
  values(v_attempt.id,'TEAM_EMAIL_SESSION_STARTED',jsonb_build_object(
    'team_size',v_size,
    'group_code',v_group,
    'institutional_domain','ijr.edu.co',
    'all_roster_matches',v_all_roster,
    'repeat_registration_allowed',true
  ));

  return jsonb_build_object(
    'attempt_id',v_attempt.id,
    'attempt_token',v_token,
    'identity_mode','team_email',
    'team_size',v_size,
    'snapshot',public.learning_activity_snapshot(v_attempt.id,v_token)
  );
end;
$function$;

create or replace function public.teacher_learning_activity_dashboard_v9(p_teacher_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
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
      select c.activity_id,count(*)::integer as checkpoint_count
      from public.learning_activity_checkpoints c
      group by c.activity_id
    ),
    member_stats as (
      select
        m.attempt_id,
        count(*)::integer as member_count,
        jsonb_agg(jsonb_build_object(
          'member_order',m.member_order,
          'student_registry_id',m.student_registry_id,
          'display_name',m.display_name,
          'institutional_email',m.institutional_email,
          'email_normalized',m.email_normalized,
          'is_roster_match',m.is_roster_match
        ) order by m.member_order) as participants
      from public.learning_activity_attempt_members m
      group by m.attempt_id
    ),
    response_stats as (
      select
        r.attempt_id,
        count(*) filter (where coalesce(r.completed,false))::integer as completed_count,
        coalesce(sum(r.wrong_attempts),0)::integer as wrong_attempts,
        count(*) filter (where coalesce(r.solution_revealed,false))::integer as revealed_count,
        count(*) filter (where r.completion_mode='skipped')::integer as skipped_count,
        jsonb_agg(jsonb_build_object(
          'checkpoint_key',c.checkpoint_key,
          'sequence',c.sequence_no,
          'latest_answer',r.latest_answer,
          'expected_answer',c.expected_text,
          'correct',coalesce(r.correct,false),
          'completed',coalesce(r.completed,false),
          'completion_mode',coalesce(r.completion_mode,'pending'),
          'awarded_points',coalesce(r.awarded_points,0),
          'wrong_attempts',coalesce(r.wrong_attempts,0),
          'help_count',coalesce(r.help_count,0),
          'last_answered_at',r.last_answered_at
        ) order by c.sequence_no) as responses
      from public.learning_activity_responses r
      join public.learning_activity_checkpoints c on c.id=r.checkpoint_id
      group by r.attempt_id
    ),
    latest_response as (
      select distinct on (r.attempt_id)
        r.attempt_id,c.checkpoint_key,r.latest_answer,c.expected_text,
        r.correct,r.last_answered_at
      from public.learning_activity_responses r
      join public.learning_activity_checkpoints c on c.id=r.checkpoint_id
      order by r.attempt_id,r.last_answered_at desc nulls last,c.sequence_no desc
    ),
    event_stats as (
      select ev.attempt_id,
        count(*) filter (where ev.event_type in ('FULLSCREEN_EXIT','UNAUTHORIZED_LEAVE'))::integer as restriction_events
      from public.learning_activity_events ev
      group by ev.attempt_id
    ),
    projection_stats as (
      select
        x.id as attempt_id,
        round(
          a.grade_min + (a.grade_max-a.grade_min) * (
            coalesce(sum(
              case
                when coalesce(r.completed,false) then coalesce(r.awarded_points,0)
                else public.learning_activity_stage_credit(c.points,coalesce(r.help_count,0),coalesce(r.wrong_attempts,0))
              end
            ),0) / greatest(a.max_points,1)
          ),2
        ) as projected_grade
      from public.learning_activity_attempts x
      join public.learning_activities a on a.id=x.activity_id
      join public.learning_activity_checkpoints c on c.activity_id=x.activity_id
      left join public.learning_activity_responses r on r.attempt_id=x.id and r.checkpoint_id=c.id
      group by x.id,a.grade_min,a.grade_max,a.max_points
    )
    select jsonb_build_object(
      'generated_at',clock_timestamp(),
      'activity',(select jsonb_build_object('slug',a.slug,'title',a.title,'status',a.status)
                  from public.learning_activities a
                  where a.slug='statistics11-colab-basics-01-2026'
                  limit 1),
      'sessions',(
        select coalesce(jsonb_agg(jsonb_build_object(
          'attempt_id',x.id,
          'group_code',x.group_code,
          'status',x.status,
          'team_size',coalesce(x.team_size,ms.member_count,1),
          'registration_mode',coalesce(x.registration_mode,'individual'),
          'participants',coalesce(ms.participants,'[]'::jsonb),
          'grade',x.grade,
          'projected_grade',coalesce(ps.projected_grade,x.grade),
          'help_tokens_used',coalesce(x.help_tokens_used,0),
          'completed_count',coalesce(rs.completed_count,0),
          'checkpoint_count',coalesce(cs.checkpoint_count,0),
          'wrong_attempts',coalesce(rs.wrong_attempts,0),
          'revealed_count',coalesce(rs.revealed_count,0),
          'skipped_count',coalesce(rs.skipped_count,0),
          'restriction_events',coalesce(es.restriction_events,0),
          'latest_checkpoint_key',lr.checkpoint_key,
          'latest_answer',lr.latest_answer,
          'latest_expected_answer',lr.expected_text,
          'latest_answer_correct',lr.correct,
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
        where a.slug='statistics11-colab-basics-01-2026'
      )
    )
  );
end;
$function$;

grant execute on function public.student_learning_activity_start_team_email(text,jsonb,text,uuid,text) to anon, authenticated, service_role;
grant execute on function public.teacher_learning_activity_dashboard_v9(text) to anon, authenticated, service_role;
