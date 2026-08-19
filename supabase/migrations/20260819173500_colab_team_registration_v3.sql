-- Colab Lab 01 V3: one workstation = one team of 2 or 3 students.
-- Keeps open-name registration, but records every participant separately and links roster matches when possible.

alter table public.learning_activity_attempts
  add column if not exists team_key text,
  add column if not exists team_size smallint,
  add column if not exists registration_mode text not null default 'individual';

update public.learning_activity_attempts
set team_key = coalesce(team_key, student_name_normalized, public.normalize_student_name(student_name_snapshot)),
    team_size = coalesce(team_size, 1),
    registration_mode = coalesce(nullif(registration_mode,''), 'individual')
where team_key is null or team_size is null or registration_mode is null or registration_mode='';

create index if not exists learning_activity_attempt_team_lookup_idx
  on public.learning_activity_attempts(activity_id, group_code, team_key, started_at desc);

create table if not exists public.learning_activity_attempt_members (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.learning_activity_attempts(id) on delete cascade,
  activity_id uuid not null references public.learning_activities(id) on delete cascade,
  group_code text not null,
  member_order smallint not null check (member_order between 1 and 3),
  student_registry_id uuid references public.student_registry(id),
  display_name text not null,
  normalized_name text not null,
  is_roster_match boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  unique(attempt_id, member_order)
);

create index if not exists learning_activity_attempt_members_registry_idx
  on public.learning_activity_attempt_members(activity_id, student_registry_id)
  where student_registry_id is not null;

create index if not exists learning_activity_attempt_members_name_idx
  on public.learning_activity_attempt_members(activity_id, group_code, normalized_name);

alter table public.learning_activity_attempt_members enable row level security;
revoke all on public.learning_activity_attempt_members from anon, authenticated;

-- Backfill legacy one-person attempts so the dashboard can use one participant model.
insert into public.learning_activity_attempt_members(
  attempt_id, activity_id, group_code, member_order, student_registry_id,
  display_name, normalized_name, is_roster_match
)
select
  x.id, x.activity_id, x.group_code, 1, x.student_registry_id,
  x.student_name_snapshot,
  coalesce(x.student_name_normalized, public.normalize_student_name(x.student_name_snapshot)),
  coalesce(x.is_roster_match, x.student_registry_id is not null)
from public.learning_activity_attempts x
where not exists (
  select 1 from public.learning_activity_attempt_members m where m.attempt_id=x.id
)
on conflict (attempt_id, member_order) do nothing;

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
  v_correct_count integer;
  v_team_label text;
  v_team_size integer;
begin
  select * into v_attempt
  from public.learning_activity_attempts
  where id=p_attempt_id
    and access_token_hash=encode(digest(p_attempt_token,'sha256'),'hex');
  if v_attempt.id is null then raise exception 'Invalid activity session'; end if;

  select * into v_activity from public.learning_activities where id=v_attempt.activity_id;
  select count(*) into v_checkpoint_count from public.learning_activity_checkpoints where activity_id=v_attempt.activity_id;
  select count(*) into v_correct_count from public.learning_activity_responses where attempt_id=v_attempt.id and correct=true;

  select string_agg(m.display_name, ' · ' order by m.member_order), count(*)
  into v_team_label, v_team_size
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
    'checkpoint_count',v_checkpoint_count,
    'correct_count',v_correct_count,
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

create or replace function public.student_learning_activity_start_team(
  p_activity_slug text,
  p_student_names jsonb,
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
  v_attempt public.learning_activity_attempts%rowtype;
  v_student public.student_registry%rowtype;
  v_group text;
  v_token text;
  v_team_key text;
  v_team_label text;
  v_size integer;
  v_i integer;
  v_display text;
  v_norm text;
  v_match_count integer;
  v_names text[] := array[]::text[];
  v_norms text[] := array[]::text[];
  v_all_roster boolean := true;
begin
  v_group := upper(trim(coalesce(p_group_code,'')));
  if v_group not in ('11A','11B','11C') then raise exception 'Select a valid group'; end if;
  if p_student_names is null or jsonb_typeof(p_student_names) <> 'array' then raise exception 'Provide the team members'; end if;

  v_size := jsonb_array_length(p_student_names);
  if v_size not in (2,3) then raise exception 'Each workstation must register 2 or 3 students'; end if;

  select * into v_activity
  from public.learning_activities
  where slug=p_activity_slug and status='open';
  if v_activity.id is null then raise exception 'Activity is not open'; end if;

  for v_i in 0..v_size-1 loop
    v_display := trim(coalesce(p_student_names->>v_i,''));
    if length(v_display) < 2 then raise exception 'Write the complete name for every team member'; end if;
    v_norm := public.normalize_student_name(v_display);
    if coalesce(length(v_norm),0)=0 then v_norm := lower(v_display); end if;
    if v_norm = any(v_norms) then raise exception 'Do not repeat the same name inside one team'; end if;
    v_names := array_append(v_names,v_display);
    v_norms := array_append(v_norms,v_norm);
  end loop;

  select string_agg(n,'|' order by n) into v_team_key from unnest(v_norms) n;
  select string_agg(n,' · ' order by ord) into v_team_label
  from unnest(v_names) with ordinality as t(n,ord);

  select * into v_attempt
  from public.learning_activity_attempts
  where activity_id=v_activity.id
    and group_code=v_group
    and team_key=v_team_key
  order by started_at desc
  limit 1;

  v_token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');

  if v_attempt.id is null then
    insert into public.learning_activity_attempts(
      activity_id,student_registry_id,student_name_snapshot,student_name_normalized,
      is_roster_match,group_code,session_id,access_token_hash,user_agent,
      team_key,team_size,registration_mode
    ) values (
      v_activity.id,null,v_team_label,v_team_key,false,v_group,
      coalesce(p_session_id,gen_random_uuid()),encode(digest(v_token,'sha256'),'hex'),p_user_agent,
      v_team_key,v_size,'team'
    ) returning * into v_attempt;
  else
    update public.learning_activity_attempts
    set student_name_snapshot=v_team_label,
        student_name_normalized=v_team_key,
        access_token_hash=encode(digest(v_token,'sha256'),'hex'),
        last_activity_at=clock_timestamp(),
        user_agent=coalesce(p_user_agent,user_agent),
        team_size=v_size,
        registration_mode='team'
    where id=v_attempt.id
    returning * into v_attempt;
    delete from public.learning_activity_attempt_members where attempt_id=v_attempt.id;
  end if;

  for v_i in 1..v_size loop
    v_display := v_names[v_i];
    v_norm := v_norms[v_i];
    v_match_count := 0;
    v_student := null;

    select count(*) into v_match_count
    from public.student_registry s
    where s.active=true and s.group_code=v_group
      and (s.normalized_name=v_norm or (s.name_is_truncated and v_norm like s.normalized_name || '%'));

    if v_match_count=1 then
      select * into v_student
      from public.student_registry s
      where s.active=true and s.group_code=v_group
        and (s.normalized_name=v_norm or (s.name_is_truncated and v_norm like s.normalized_name || '%'))
      limit 1;

      if exists (
        select 1
        from public.learning_activity_attempt_members m
        join public.learning_activity_attempts other_attempt on other_attempt.id=m.attempt_id
        where m.activity_id=v_activity.id
          and m.student_registry_id=v_student.id
          and m.attempt_id<>v_attempt.id
      ) then
        raise exception '% is already registered in another team for this activity', v_display;
      end if;
    else
      v_all_roster := false;
    end if;

    insert into public.learning_activity_attempt_members(
      attempt_id,activity_id,group_code,member_order,student_registry_id,
      display_name,normalized_name,is_roster_match
    ) values (
      v_attempt.id,v_activity.id,v_group,v_i,
      case when v_match_count=1 then v_student.id else null end,
      v_display,v_norm,(v_match_count=1)
    );
  end loop;

  update public.learning_activity_attempts
  set is_roster_match=v_all_roster
  where id=v_attempt.id
  returning * into v_attempt;

  insert into public.learning_activity_events(attempt_id,event_type,metadata)
  values(v_attempt.id,'TEAM_SESSION_STARTED',jsonb_build_object(
    'team_size',v_size,
    'group_code',v_group,
    'all_roster_matches',v_all_roster
  ));

  return jsonb_build_object(
    'attempt_id',v_attempt.id,
    'attempt_token',v_token,
    'identity_mode','team',
    'team_size',v_size,
    'snapshot',public.learning_activity_snapshot(v_attempt.id,v_token)
  );
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
        'team_size',coalesce(x.team_size,(select count(*) from public.learning_activity_attempt_members mm where mm.attempt_id=x.id),1),
        'registration_mode',coalesce(x.registration_mode,'individual'),
        'participants',(
          select coalesce(jsonb_agg(jsonb_build_object(
            'member_order',m.member_order,
            'student_registry_id',m.student_registry_id,
            'display_name',m.display_name,
            'is_roster_match',m.is_roster_match
          ) order by m.member_order),'[]'::jsonb)
          from public.learning_activity_attempt_members m where m.attempt_id=x.id
        ),
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

grant execute on function public.student_learning_activity_start_team(text,jsonb,text,uuid,text) to anon, authenticated;
grant execute on function public.learning_activity_snapshot(uuid,text) to anon, authenticated;
grant execute on function public.teacher_learning_dashboard(text) to anon, authenticated;

notify pgrst, 'reload schema';
