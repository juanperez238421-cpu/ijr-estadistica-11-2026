-- Colab Lab 01 hardening: open self-declared registration + guided fullscreen telemetry.
-- This is a formative activity, so roster matching is preserved when available but is no longer required.

alter table public.learning_activity_attempts
  alter column student_registry_id drop not null;

alter table public.learning_activity_attempts
  add column if not exists student_name_normalized text,
  add column if not exists is_roster_match boolean not null default true;

update public.learning_activity_attempts
set student_name_normalized = public.normalize_student_name(student_name_snapshot)
where student_name_normalized is null;

create unique index if not exists learning_activity_guest_identity_uq
on public.learning_activity_attempts(activity_id, group_code, student_name_normalized)
where student_registry_id is null;

create table if not exists public.learning_activity_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.learning_activity_attempts(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists learning_activity_events_attempt_created_idx
on public.learning_activity_events(attempt_id, created_at desc);

alter table public.learning_activity_events enable row level security;
revoke all on public.learning_activity_events from anon, authenticated;

create or replace function public.student_learning_activity_start(
  p_activity_slug text,
  p_student_name text,
  p_group_code text,
  p_session_id uuid,
  p_user_agent text
)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
  v_activity public.learning_activities%rowtype;
  v_student public.student_registry%rowtype;
  v_matches integer := 0;
  v_attempt public.learning_activity_attempts%rowtype;
  v_token text;
  v_norm text;
  v_group text;
  v_display text;
begin
  v_group := upper(trim(coalesce(p_group_code,'')));
  v_display := trim(coalesce(p_student_name,''));
  if v_group not in ('11A','11B','11C') then raise exception 'Select a valid group'; end if;
  if length(v_display) < 1 then raise exception 'Enter a name'; end if;

  select * into v_activity
  from public.learning_activities
  where slug=p_activity_slug and status='open';
  if v_activity.id is null then raise exception 'Activity is not open'; end if;

  v_norm := public.normalize_student_name(v_display);
  if coalesce(length(v_norm),0)=0 then v_norm := lower(v_display); end if;

  select count(*) into v_matches
  from public.student_registry s
  where s.active=true and s.group_code=v_group
    and (s.normalized_name=v_norm or (s.name_is_truncated and v_norm like s.normalized_name || '%'));

  -- Use institutional identity only when there is one unambiguous match.
  if v_matches=1 then
    select * into v_student
    from public.student_registry s
    where s.active=true and s.group_code=v_group
      and (s.normalized_name=v_norm or (s.name_is_truncated and v_norm like s.normalized_name || '%'))
    limit 1;

    select * into v_attempt
    from public.learning_activity_attempts
    where activity_id=v_activity.id and student_registry_id=v_student.id
    limit 1;
  else
    -- Any non-empty name is allowed. It is recorded as a self-declared identity.
    select * into v_attempt
    from public.learning_activity_attempts
    where activity_id=v_activity.id
      and student_registry_id is null
      and group_code=v_group
      and student_name_normalized=v_norm
    limit 1;
  end if;

  v_token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');

  if v_attempt.id is null then
    insert into public.learning_activity_attempts(
      activity_id,student_registry_id,student_name_snapshot,student_name_normalized,
      is_roster_match,group_code,session_id,access_token_hash,user_agent
    ) values (
      v_activity.id,
      case when v_matches=1 then v_student.id else null end,
      v_display,
      v_norm,
      (v_matches=1),
      v_group,
      coalesce(p_session_id,gen_random_uuid()),
      encode(digest(v_token,'sha256'),'hex'),
      p_user_agent
    ) returning * into v_attempt;
  else
    update public.learning_activity_attempts
    set student_name_snapshot=v_display,
        student_name_normalized=v_norm,
        is_roster_match=(v_matches=1),
        access_token_hash=encode(digest(v_token,'sha256'),'hex'),
        last_activity_at=clock_timestamp(),
        user_agent=coalesce(p_user_agent,user_agent)
    where id=v_attempt.id
    returning * into v_attempt;
  end if;

  insert into public.learning_activity_events(attempt_id,event_type,metadata)
  values(v_attempt.id,'SESSION_STARTED',jsonb_build_object('roster_match',v_attempt.is_roster_match,'group_code',v_group));

  return jsonb_build_object(
    'attempt_id',v_attempt.id,
    'attempt_token',v_token,
    'identity_mode',case when v_attempt.is_roster_match then 'roster_match' else 'self_declared' end,
    'snapshot',public.learning_activity_snapshot(v_attempt.id,v_token)
  );
end;
$$;

create or replace function public.student_learning_activity_event(
  p_attempt_id uuid,
  p_attempt_token text,
  p_event_type text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
  v_attempt public.learning_activity_attempts%rowtype;
  v_count integer;
begin
  select * into v_attempt
  from public.learning_activity_attempts
  where id=p_attempt_id and access_token_hash=encode(digest(p_attempt_token,'sha256'),'hex');
  if v_attempt.id is null then raise exception 'Invalid activity session'; end if;

  insert into public.learning_activity_events(attempt_id,event_type,metadata)
  values(v_attempt.id,left(coalesce(p_event_type,'UNKNOWN'),80),coalesce(p_metadata,'{}'::jsonb));

  update public.learning_activity_attempts
  set last_activity_at=clock_timestamp()
  where id=v_attempt.id;

  select count(*) into v_count
  from public.learning_activity_events
  where attempt_id=v_attempt.id
    and event_type in ('FULLSCREEN_EXIT','UNAUTHORIZED_LEAVE');

  return jsonb_build_object('recorded',true,'restriction_events',v_count);
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
  v_teacher_session := public.teacher_code_session_id(p_teacher_token);
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
        'activity_slug',a.slug,
        'status',x.status,
        'points',x.points,
        'grade',x.grade,
        'correct_count',(select count(*) from public.learning_activity_responses r where r.attempt_id=x.id and r.correct=true),
        'checkpoint_count',(select count(*) from public.learning_activity_checkpoints c where c.activity_id=x.activity_id),
        'restriction_events',(select count(*) from public.learning_activity_events ev where ev.attempt_id=x.id and ev.event_type in ('FULLSCREEN_EXIT','UNAUTHORIZED_LEAVE')),
        'event_count',(select count(*) from public.learning_activity_events ev where ev.attempt_id=x.id),
        'started_at',x.started_at,
        'last_activity_at',x.last_activity_at,
        'submitted_at',x.submitted_at
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

grant execute on function public.student_learning_activity_event(uuid,text,text,jsonb) to anon, authenticated;
grant execute on function public.student_learning_activity_start(text,text,text,uuid,text) to anon, authenticated;
grant execute on function public.teacher_learning_dashboard(text) to anon, authenticated;

notify pgrst, 'reload schema';
