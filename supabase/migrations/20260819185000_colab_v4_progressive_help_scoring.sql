-- Colab Lab 01 V4
-- Progressive learning model:
-- * students may continue after an incorrect result
-- * three help tokens are available across the whole lab
-- * incorrect validations and help usage lower the stage's maximum credit
-- * revealing the complete solution completes the stage for 25% credit
-- * continuing without solving completes the stage for 0% credit
-- * projected grade starts at 5.00 and decreases immediately as penalties are recorded

alter table public.learning_activity_attempts
  add column if not exists help_tokens_used integer not null default 0;

alter table public.learning_activity_responses
  add column if not exists completed boolean not null default false,
  add column if not exists completion_mode text not null default 'pending',
  add column if not exists awarded_points numeric not null default 0,
  add column if not exists help_count integer not null default 0,
  add column if not exists wrong_attempts integer not null default 0,
  add column if not exists solution_revealed boolean not null default false;

update public.learning_activity_responses r
set completed=true,
    completion_mode='solved',
    awarded_points=c.points
from public.learning_activity_checkpoints c
where c.id=r.checkpoint_id
  and r.correct=true
  and r.completed=false;

create or replace function public.learning_activity_stage_credit(
  p_checkpoint_points numeric,
  p_help_count integer,
  p_wrong_attempts integer
)
returns numeric
language sql
immutable
set search_path='public'
as $$
  select greatest(
    round(coalesce(p_checkpoint_points,1) * 0.25,4),
    round(
      coalesce(p_checkpoint_points,1) * (
        1
        - 0.20 * least(greatest(coalesce(p_help_count,0),0),3)
        - 0.10 * least(greatest(coalesce(p_wrong_attempts,0),0),3)
      ),
      4
    )
  );
$$;

create or replace function public.learning_activity_refresh_attempt_score(p_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
  v_attempt public.learning_activity_attempts%rowtype;
  v_activity public.learning_activities%rowtype;
  v_points numeric := 0;
  v_completed integer := 0;
  v_total integer := 0;
  v_grade numeric := 1;
begin
  select * into v_attempt
  from public.learning_activity_attempts
  where id=p_attempt_id
  for update;
  if v_attempt.id is null then return; end if;

  select * into v_activity from public.learning_activities where id=v_attempt.activity_id;

  select count(*) into v_total
  from public.learning_activity_checkpoints
  where activity_id=v_attempt.activity_id;

  select count(*) into v_completed
  from public.learning_activity_responses r
  join public.learning_activity_checkpoints c on c.id=r.checkpoint_id
  where r.attempt_id=v_attempt.id
    and c.activity_id=v_attempt.activity_id
    and r.completed=true;

  select coalesce(sum(r.awarded_points),0) into v_points
  from public.learning_activity_responses r
  join public.learning_activity_checkpoints c on c.id=r.checkpoint_id
  where r.attempt_id=v_attempt.id
    and c.activity_id=v_attempt.activity_id
    and r.completed=true;

  v_grade := round(
    v_activity.grade_min
    + (v_activity.grade_max-v_activity.grade_min)
      * (v_points / greatest(v_activity.max_points,1)),
    2
  );

  update public.learning_activity_attempts
  set points=v_points,
      grade=v_grade,
      last_activity_at=clock_timestamp(),
      status=case when v_total>0 and v_completed>=v_total then 'submitted' else 'active' end,
      submitted_at=case
        when v_total>0 and v_completed>=v_total then coalesce(submitted_at,clock_timestamp())
        else null
      end
  where id=v_attempt.id;
end;
$$;

create or replace function public.learning_activity_snapshot(p_attempt_id uuid, p_attempt_token text)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
  v_attempt public.learning_activity_attempts%rowtype;
  v_activity public.learning_activities%rowtype;
  v_checkpoint_count integer;
  v_completed_count integer;
  v_correct_count integer;
  v_projected_points numeric := 0;
  v_projected_grade numeric := 5;
  v_team_label text;
  v_team_size integer;
begin
  select * into v_attempt
  from public.learning_activity_attempts
  where id=p_attempt_id
    and access_token_hash=encode(digest(p_attempt_token,'sha256'),'hex');
  if v_attempt.id is null then raise exception 'Invalid activity session'; end if;

  select * into v_activity from public.learning_activities where id=v_attempt.activity_id;

  select count(*) into v_checkpoint_count
  from public.learning_activity_checkpoints
  where activity_id=v_attempt.activity_id;

  select count(*) into v_completed_count
  from public.learning_activity_responses r
  join public.learning_activity_checkpoints c on c.id=r.checkpoint_id
  where r.attempt_id=v_attempt.id and c.activity_id=v_attempt.activity_id and r.completed=true;

  select count(*) into v_correct_count
  from public.learning_activity_responses r
  join public.learning_activity_checkpoints c on c.id=r.checkpoint_id
  where r.attempt_id=v_attempt.id and c.activity_id=v_attempt.activity_id and r.correct=true;

  select coalesce(sum(
    case
      when coalesce(r.completed,false) then coalesce(r.awarded_points,0)
      else public.learning_activity_stage_credit(c.points,coalesce(r.help_count,0),coalesce(r.wrong_attempts,0))
    end
  ),0)
  into v_projected_points
  from public.learning_activity_checkpoints c
  left join public.learning_activity_responses r
    on r.checkpoint_id=c.id and r.attempt_id=v_attempt.id
  where c.activity_id=v_attempt.activity_id;

  v_projected_grade := round(
    v_activity.grade_min
    + (v_activity.grade_max-v_activity.grade_min)
      * (v_projected_points / greatest(v_activity.max_points,1)),
    2
  );

  select string_agg(m.display_name,' · ' order by m.member_order),count(*)
  into v_team_label,v_team_size
  from public.learning_activity_attempt_members m
  where m.attempt_id=v_attempt.id;

  return jsonb_build_object(
    'attempt_id',v_attempt.id,
    'student_label',coalesce(v_team_label,v_attempt.student_name_snapshot),
    'team_size',coalesce(v_team_size,v_attempt.team_size,1),
    'registration_mode',coalesce(v_attempt.registration_mode,'individual'),
    'participants',(
      select coalesce(jsonb_agg(jsonb_build_object(
        'member_order',m.member_order,
        'student_registry_id',m.student_registry_id,
        'display_name',m.display_name,
        'is_roster_match',m.is_roster_match
      ) order by m.member_order),'[]'::jsonb)
      from public.learning_activity_attempt_members m
      where m.attempt_id=v_attempt.id
    ),
    'group_code',v_attempt.group_code,
    'activity_slug',v_activity.slug,
    'activity_title',v_activity.title,
    'status',v_attempt.status,
    'points',v_attempt.points,
    'grade',v_attempt.grade,
    'projected_points',v_projected_points,
    'projected_grade',v_projected_grade,
    'checkpoint_count',v_checkpoint_count,
    'completed_count',v_completed_count,
    'correct_count',v_correct_count,
    'help_tokens_used',coalesce(v_attempt.help_tokens_used,0),
    'help_tokens_remaining',greatest(0,3-coalesce(v_attempt.help_tokens_used,0)),
    'started_at',v_attempt.started_at,
    'completed',v_attempt.status='submitted',
    'checkpoints',(
      select coalesce(jsonb_agg(jsonb_build_object(
        'key',c.checkpoint_key,
        'sequence',c.sequence_no,
        'title',c.title,
        'prompt',c.prompt,
        'code',c.code,
        'hint',c.hint,
        'points',c.points,
        'correct',coalesce(r.correct,false),
        'completed',coalesce(r.completed,false),
        'completion_mode',coalesce(r.completion_mode,'pending'),
        'awarded_points',coalesce(r.awarded_points,0),
        'help_count',coalesce(r.help_count,0),
        'wrong_attempts',coalesce(r.wrong_attempts,0),
        'solution_revealed',coalesce(r.solution_revealed,false),
        'stage_potential',case
          when coalesce(r.completed,false) then coalesce(r.awarded_points,0)
          else public.learning_activity_stage_credit(c.points,coalesce(r.help_count,0),coalesce(r.wrong_attempts,0))
        end,
        'try_count',coalesce(r.try_count,0)
      ) order by c.sequence_no),'[]'::jsonb)
      from public.learning_activity_checkpoints c
      left join public.learning_activity_responses r
        on r.checkpoint_id=c.id and r.attempt_id=v_attempt.id
      where c.activity_id=v_attempt.activity_id
    )
  );
end;
$$;

create or replace function public.student_learning_activity_submit(
  p_attempt_id uuid,
  p_attempt_token text,
  p_checkpoint_key text,
  p_answer text
)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
  v_attempt public.learning_activity_attempts%rowtype;
  v_cp public.learning_activity_checkpoints%rowtype;
  v_current public.learning_activity_checkpoints%rowtype;
  v_existing public.learning_activity_responses%rowtype;
  v_correct boolean := false;
  v_num numeric;
  v_awarded numeric := 0;
  v_wrong integer := 0;
  v_help integer := 0;
begin
  select * into v_attempt
  from public.learning_activity_attempts
  where id=p_attempt_id
    and access_token_hash=encode(digest(p_attempt_token,'sha256'),'hex')
  for update;
  if v_attempt.id is null then raise exception 'Invalid activity session'; end if;
  if v_attempt.status='submitted' then
    return jsonb_build_object('correct',false,'snapshot',public.learning_activity_snapshot(p_attempt_id,p_attempt_token));
  end if;

  select c.* into v_current
  from public.learning_activity_checkpoints c
  left join public.learning_activity_responses r
    on r.checkpoint_id=c.id and r.attempt_id=v_attempt.id
  where c.activity_id=v_attempt.activity_id and coalesce(r.completed,false)=false
  order by c.sequence_no
  limit 1;
  if v_current.id is null then raise exception 'No pending stage'; end if;
  if v_current.checkpoint_key<>p_checkpoint_key then raise exception 'Complete the current stage first'; end if;
  v_cp:=v_current;

  if v_cp.answer_type='numeric' then
    begin v_num:=replace(trim(p_answer),',','.')::numeric; exception when others then v_num:=null; end;
    v_correct:=v_num is not null and abs(v_num-v_cp.expected_text::numeric)<=v_cp.tolerance;
  else
    v_correct:=lower(trim(p_answer))=lower(trim(v_cp.expected_text));
  end if;

  select * into v_existing
  from public.learning_activity_responses
  where attempt_id=v_attempt.id and checkpoint_id=v_cp.id
  for update;

  if v_existing.id is null then
    if v_correct then
      v_awarded:=public.learning_activity_stage_credit(v_cp.points,0,0);
      insert into public.learning_activity_responses(
        attempt_id,checkpoint_id,latest_answer,correct,try_count,first_try_correct,
        first_answered_at,last_answered_at,completed,completion_mode,awarded_points,wrong_attempts
      ) values (
        v_attempt.id,v_cp.id,p_answer,true,1,true,clock_timestamp(),clock_timestamp(),
        true,'solved',v_awarded,0
      );
    else
      v_wrong:=1;
      insert into public.learning_activity_responses(
        attempt_id,checkpoint_id,latest_answer,correct,try_count,first_try_correct,
        first_answered_at,last_answered_at,completed,completion_mode,awarded_points,wrong_attempts
      ) values (
        v_attempt.id,v_cp.id,p_answer,false,1,false,clock_timestamp(),clock_timestamp(),
        false,'pending',0,1
      );
    end if;
  else
    v_help:=coalesce(v_existing.help_count,0);
    if v_correct then
      v_wrong:=coalesce(v_existing.wrong_attempts,0);
      v_awarded:=public.learning_activity_stage_credit(v_cp.points,v_help,v_wrong);
      update public.learning_activity_responses
      set latest_answer=p_answer,
          correct=true,
          try_count=try_count+1,
          last_answered_at=clock_timestamp(),
          completed=true,
          completion_mode='solved',
          awarded_points=v_awarded
      where id=v_existing.id;
    else
      v_wrong:=coalesce(v_existing.wrong_attempts,0)+1;
      update public.learning_activity_responses
      set latest_answer=p_answer,
          correct=false,
          try_count=try_count+1,
          last_answered_at=clock_timestamp(),
          wrong_attempts=v_wrong
      where id=v_existing.id;
    end if;
  end if;

  perform public.learning_activity_refresh_attempt_score(v_attempt.id);

  return jsonb_build_object(
    'correct',v_correct,
    'awarded_points',case when v_correct then v_awarded else 0 end,
    'wrong_attempts',v_wrong,
    'stage_potential',case
      when v_correct then v_awarded
      else public.learning_activity_stage_credit(v_cp.points,v_help,v_wrong)
    end,
    'snapshot',public.learning_activity_snapshot(p_attempt_id,p_attempt_token)
  );
end;
$$;

create or replace function public.student_learning_activity_use_help(
  p_attempt_id uuid,
  p_attempt_token text,
  p_checkpoint_key text
)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
  v_attempt public.learning_activity_attempts%rowtype;
  v_cp public.learning_activity_checkpoints%rowtype;
  v_response public.learning_activity_responses%rowtype;
  v_level integer;
begin
  select * into v_attempt
  from public.learning_activity_attempts
  where id=p_attempt_id
    and access_token_hash=encode(digest(p_attempt_token,'sha256'),'hex')
  for update;
  if v_attempt.id is null then raise exception 'Invalid activity session'; end if;
  if v_attempt.status='submitted' then raise exception 'Activity already completed'; end if;
  if coalesce(v_attempt.help_tokens_used,0)>=3 then raise exception 'No help tokens remaining'; end if;

  select c.* into v_cp
  from public.learning_activity_checkpoints c
  left join public.learning_activity_responses r
    on r.checkpoint_id=c.id and r.attempt_id=v_attempt.id
  where c.activity_id=v_attempt.activity_id and coalesce(r.completed,false)=false
  order by c.sequence_no
  limit 1;
  if v_cp.id is null or v_cp.checkpoint_key<>p_checkpoint_key then raise exception 'Help is only available for the current stage'; end if;

  insert into public.learning_activity_responses(
    attempt_id,checkpoint_id,correct,try_count,completed,completion_mode,awarded_points,help_count
  ) values (
    v_attempt.id,v_cp.id,false,0,false,'pending',0,1
  )
  on conflict (attempt_id,checkpoint_id)
  do update set help_count=public.learning_activity_responses.help_count+1,
                last_answered_at=clock_timestamp()
  returning * into v_response;

  update public.learning_activity_attempts
  set help_tokens_used=help_tokens_used+1,last_activity_at=clock_timestamp()
  where id=v_attempt.id
  returning help_tokens_used into v_level;

  insert into public.learning_activity_events(attempt_id,event_type,metadata)
  values(v_attempt.id,'HELP_USED',jsonb_build_object(
    'checkpoint_key',p_checkpoint_key,
    'stage_help_level',v_response.help_count,
    'lab_help_token_number',v_level
  ));

  return jsonb_build_object(
    'help_level',v_response.help_count,
    'help_tokens_used',v_level,
    'help_tokens_remaining',greatest(0,3-v_level),
    'stage_potential',public.learning_activity_stage_credit(v_cp.points,v_response.help_count,v_response.wrong_attempts),
    'snapshot',public.learning_activity_snapshot(p_attempt_id,p_attempt_token)
  );
end;
$$;

create or replace function public.student_learning_activity_reveal_solution(
  p_attempt_id uuid,
  p_attempt_token text,
  p_checkpoint_key text
)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
  v_attempt public.learning_activity_attempts%rowtype;
  v_cp public.learning_activity_checkpoints%rowtype;
  v_awarded numeric;
begin
  select * into v_attempt
  from public.learning_activity_attempts
  where id=p_attempt_id
    and access_token_hash=encode(digest(p_attempt_token,'sha256'),'hex')
  for update;
  if v_attempt.id is null then raise exception 'Invalid activity session'; end if;
  if v_attempt.status='submitted' then raise exception 'Activity already completed'; end if;

  select c.* into v_cp
  from public.learning_activity_checkpoints c
  left join public.learning_activity_responses r
    on r.checkpoint_id=c.id and r.attempt_id=v_attempt.id
  where c.activity_id=v_attempt.activity_id and coalesce(r.completed,false)=false
  order by c.sequence_no
  limit 1;
  if v_cp.id is null or v_cp.checkpoint_key<>p_checkpoint_key then raise exception 'Reveal is only available for the current stage'; end if;

  v_awarded:=round(v_cp.points*0.25,4);
  insert into public.learning_activity_responses(
    attempt_id,checkpoint_id,latest_answer,correct,try_count,completed,completion_mode,
    awarded_points,solution_revealed
  ) values (
    v_attempt.id,v_cp.id,v_cp.expected_text,false,0,true,'revealed',v_awarded,true
  )
  on conflict (attempt_id,checkpoint_id)
  do update set latest_answer=v_cp.expected_text,
                correct=false,
                completed=true,
                completion_mode='revealed',
                awarded_points=v_awarded,
                solution_revealed=true,
                last_answered_at=clock_timestamp();

  insert into public.learning_activity_events(attempt_id,event_type,metadata)
  values(v_attempt.id,'SOLUTION_REVEALED',jsonb_build_object('checkpoint_key',p_checkpoint_key,'awarded_points',v_awarded));

  perform public.learning_activity_refresh_attempt_score(v_attempt.id);

  return jsonb_build_object(
    'expected_answer',v_cp.expected_text,
    'awarded_points',v_awarded,
    'snapshot',public.learning_activity_snapshot(p_attempt_id,p_attempt_token)
  );
end;
$$;

create or replace function public.student_learning_activity_skip_stage(
  p_attempt_id uuid,
  p_attempt_token text,
  p_checkpoint_key text
)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
  v_attempt public.learning_activity_attempts%rowtype;
  v_cp public.learning_activity_checkpoints%rowtype;
begin
  select * into v_attempt
  from public.learning_activity_attempts
  where id=p_attempt_id
    and access_token_hash=encode(digest(p_attempt_token,'sha256'),'hex')
  for update;
  if v_attempt.id is null then raise exception 'Invalid activity session'; end if;
  if v_attempt.status='submitted' then raise exception 'Activity already completed'; end if;

  select c.* into v_cp
  from public.learning_activity_checkpoints c
  left join public.learning_activity_responses r
    on r.checkpoint_id=c.id and r.attempt_id=v_attempt.id
  where c.activity_id=v_attempt.activity_id and coalesce(r.completed,false)=false
  order by c.sequence_no
  limit 1;
  if v_cp.id is null or v_cp.checkpoint_key<>p_checkpoint_key then raise exception 'Skip is only available for the current stage'; end if;

  insert into public.learning_activity_responses(
    attempt_id,checkpoint_id,correct,try_count,completed,completion_mode,awarded_points
  ) values (
    v_attempt.id,v_cp.id,false,0,true,'skipped',0
  )
  on conflict (attempt_id,checkpoint_id)
  do update set correct=false,
                completed=true,
                completion_mode='skipped',
                awarded_points=0,
                last_answered_at=clock_timestamp();

  insert into public.learning_activity_events(attempt_id,event_type,metadata)
  values(v_attempt.id,'STAGE_SKIPPED',jsonb_build_object('checkpoint_key',p_checkpoint_key));

  perform public.learning_activity_refresh_attempt_score(v_attempt.id);

  return jsonb_build_object('awarded_points',0,'snapshot',public.learning_activity_snapshot(p_attempt_id,p_attempt_token));
end;
$$;

create or replace function public.teacher_learning_dashboard(p_teacher_token text)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare v_teacher_session uuid;
begin
  v_teacher_session:=public.teacher_code_session_id(p_teacher_token);
  if v_teacher_session is null then raise exception 'Invalid or expired teacher session'; end if;

  return jsonb_build_object(
    'generated_at',clock_timestamp(),
    'activities',(
      select coalesce(jsonb_agg(jsonb_build_object(
        'id',a.id,'slug',a.slug,'title',a.title,'status',a.status,'max_points',a.max_points
      ) order by a.created_at),'[]'::jsonb)
      from public.learning_activities a where a.status<>'draft'
    ),
    'roster',(
      select coalesce(jsonb_agg(jsonb_build_object(
        'id',s.id,'group_code',s.group_code,'source_position',s.source_position,'display_name',s.display_name
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
        'team_size',coalesce(x.team_size,(select count(*) from public.learning_activity_attempt_members mm where mm.attempt_id=x.id),1),
        'registration_mode',coalesce(x.registration_mode,'individual'),
        'participants',(
          select coalesce(jsonb_agg(jsonb_build_object(
            'member_order',m.member_order,'student_registry_id',m.student_registry_id,
            'display_name',m.display_name,'is_roster_match',m.is_roster_match
          ) order by m.member_order),'[]'::jsonb)
          from public.learning_activity_attempt_members m where m.attempt_id=x.id
        ),
        'activity_slug',a.slug,
        'status',x.status,
        'points',x.points,
        'grade',x.grade,
        'projected_grade',(
          select round(a.grade_min+(a.grade_max-a.grade_min)*(
            coalesce(sum(case
              when coalesce(r.completed,false) then coalesce(r.awarded_points,0)
              else public.learning_activity_stage_credit(c.points,coalesce(r.help_count,0),coalesce(r.wrong_attempts,0))
            end),0)/greatest(a.max_points,1)
          ),2)
          from public.learning_activity_checkpoints c
          left join public.learning_activity_responses r on r.checkpoint_id=c.id and r.attempt_id=x.id
          where c.activity_id=x.activity_id
        ),
        'completed_count',(select count(*) from public.learning_activity_responses r join public.learning_activity_checkpoints c on c.id=r.checkpoint_id where r.attempt_id=x.id and c.activity_id=x.activity_id and r.completed=true),
        'correct_count',(select count(*) from public.learning_activity_responses r where r.attempt_id=x.id and r.correct=true),
        'checkpoint_count',(select count(*) from public.learning_activity_checkpoints c where c.activity_id=x.activity_id),
        'help_tokens_used',coalesce(x.help_tokens_used,0),
        'wrong_attempts',(select coalesce(sum(r.wrong_attempts),0) from public.learning_activity_responses r where r.attempt_id=x.id),
        'revealed_count',(select count(*) from public.learning_activity_responses r where r.attempt_id=x.id and r.completion_mode='revealed'),
        'skipped_count',(select count(*) from public.learning_activity_responses r where r.attempt_id=x.id and r.completion_mode='skipped'),
        'restriction_events',(select count(*) from public.learning_activity_events ev where ev.attempt_id=x.id and ev.event_type in ('FULLSCREEN_EXIT','UNAUTHORIZED_LEAVE')),
        'event_count',(select count(*) from public.learning_activity_events ev where ev.attempt_id=x.id),
        'started_at',x.started_at,'last_activity_at',x.last_activity_at,'submitted_at',x.submitted_at
      ) order by x.last_activity_at desc),'[]'::jsonb)
      from public.learning_activity_attempts x
      join public.learning_activities a on a.id=x.activity_id
    ),
    'exam_results',(
      select coalesce(jsonb_agg(jsonb_build_object(
        'student_registry_id',z.student_registry_id,'grade',z.grade,'status',z.status,'submitted_at',z.submitted_at
      )),'[]'::jsonb)
      from (
        select distinct on (t.student_registry_id)
          t.student_registry_id,t.grade,t.status,t.submitted_at,t.started_at
        from public.attempts t
        where t.student_registry_id is not null and t.grade is not null
        order by t.student_registry_id,t.submitted_at desc nulls last,t.started_at desc
      ) z
    )
  );
end;
$$;

grant execute on function public.learning_activity_snapshot(uuid,text) to anon,authenticated;
grant execute on function public.student_learning_activity_submit(uuid,text,text,text) to anon,authenticated;
grant execute on function public.student_learning_activity_use_help(uuid,text,text) to anon,authenticated;
grant execute on function public.student_learning_activity_reveal_solution(uuid,text,text) to anon,authenticated;
grant execute on function public.student_learning_activity_skip_stage(uuid,text,text) to anon,authenticated;
grant execute on function public.teacher_learning_dashboard(text) to anon,authenticated;

notify pgrst,'reload schema';
