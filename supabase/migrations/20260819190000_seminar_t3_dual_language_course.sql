-- Shared production backend for Seminario de Programacion 11 - T3.
-- 16 modules per route, Python + Java, teams of 1-3, formative scoring.

create table if not exists public.seminar_course_attempts (
  id uuid primary key default gen_random_uuid(),
  course_slug text not null,
  language text not null check (language in ('python','java')),
  group_code text not null check (group_code in ('11-A','11-B','11-C')),
  team_key text not null,
  team_label text not null,
  team_size integer not null check (team_size between 1 and 3),
  session_id uuid not null default gen_random_uuid(),
  access_token_hash text not null,
  status text not null default 'active' check (status in ('active','submitted')),
  started_at timestamptz not null default clock_timestamp(),
  last_activity_at timestamptz not null default clock_timestamp(),
  submitted_at timestamptz,
  restriction_events integer not null default 0,
  user_agent text,
  unique(course_slug,language,group_code,team_key)
);

create table if not exists public.seminar_course_attempt_members (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.seminar_course_attempts(id) on delete cascade,
  member_order integer not null check (member_order between 1 and 3),
  display_name text not null,
  normalized_name text not null,
  created_at timestamptz not null default clock_timestamp(),
  unique(attempt_id,member_order)
);

create table if not exists public.seminar_course_module_records (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.seminar_course_attempts(id) on delete cascade,
  module_key text not null,
  completion_mode text not null default 'pending' check (completion_mode in ('pending','solved','revealed','skipped')),
  help_count integer not null default 0 check (help_count between 0 and 3),
  wrong_count integer not null default 0 check (wrong_count >= 0),
  awarded_points numeric(6,3) not null default 0,
  code_snapshot text,
  started_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz,
  unique(attempt_id,module_key)
);

create table if not exists public.seminar_course_events (
  id bigint generated always as identity primary key,
  attempt_id uuid not null references public.seminar_course_attempts(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists seminar_course_attempts_status_idx
  on public.seminar_course_attempts(course_slug,status,last_activity_at desc);
create index if not exists seminar_course_records_attempt_idx
  on public.seminar_course_module_records(attempt_id,module_key);
create index if not exists seminar_course_events_attempt_idx
  on public.seminar_course_events(attempt_id,created_at desc);

alter table public.seminar_course_attempts enable row level security;
alter table public.seminar_course_attempt_members enable row level security;
alter table public.seminar_course_module_records enable row level security;
alter table public.seminar_course_events enable row level security;
revoke all on public.seminar_course_attempts,
              public.seminar_course_attempt_members,
              public.seminar_course_module_records,
              public.seminar_course_events
from anon, authenticated;

create or replace function public.seminar_course_module_credit(
  p_mode text,
  p_help integer,
  p_wrong integer
)
returns numeric
language sql
immutable
as $$
  select case
    when p_mode='solved' then greatest(
      0.25::numeric,
      1.00::numeric
      - 0.20::numeric * least(greatest(coalesce(p_help,0),0),3)
      - 0.10::numeric * least(greatest(coalesce(p_wrong,0),0),3)
    )
    when p_mode='revealed' then 0.25::numeric
    when p_mode='skipped' then 0.00::numeric
    else 0.00::numeric
  end;
$$;

create or replace function public.seminar_course_grade(p_points numeric)
returns numeric
language sql
immutable
as $$
  select round(
    1.00::numeric
    + 4.00::numeric * (least(greatest(coalesce(p_points,0),0),16) / 16.00::numeric),
    2
  );
$$;

create or replace function public.seminar_course_calc(p_attempt_id uuid)
returns table(
  completed_count bigint,
  solved_count bigint,
  helps bigint,
  wrongs bigint,
  revealed bigint,
  skipped bigint,
  awarded_points numeric,
  projected_points numeric
)
language sql
stable
set search_path='public'
as $$
  with keys(module_key) as (
    values
      ('m01'),('m02'),('m03'),('m04'),('m05'),('m06'),('m07'),('m08'),
      ('m09'),('m10'),('m13'),('m14'),('m11'),('m12'),('m15'),('m16')
  ), records as (
    select
      k.module_key,
      r.completion_mode,
      coalesce(r.help_count,0) as help_count,
      coalesce(r.wrong_count,0) as wrong_count,
      coalesce(r.awarded_points,0) as awarded_points
    from keys k
    left join public.seminar_course_module_records r
      on r.attempt_id=p_attempt_id and r.module_key=k.module_key
  )
  select
    count(*) filter(where completion_mode in ('solved','revealed','skipped')),
    count(*) filter(where completion_mode='solved'),
    coalesce(sum(help_count),0),
    coalesce(sum(wrong_count),0),
    count(*) filter(where completion_mode='revealed'),
    count(*) filter(where completion_mode='skipped'),
    coalesce(sum(case when completion_mode in ('solved','revealed','skipped') then awarded_points else 0 end),0),
    coalesce(sum(
      case
        when completion_mode in ('solved','revealed','skipped') then awarded_points
        else greatest(
          0.25::numeric,
          1.00::numeric
          - 0.20::numeric * least(help_count,3)
          - 0.10::numeric * least(wrong_count,3)
        )
      end
    ),16)
  from records;
$$;
revoke execute on function public.seminar_course_calc(uuid) from public;

create or replace function public.seminar_course_snapshot(
  p_attempt_id uuid,
  p_attempt_token text
)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
  a public.seminar_course_attempts%rowtype;
  c record;
begin
  select * into a
  from public.seminar_course_attempts
  where id=p_attempt_id
    and access_token_hash=encode(digest(p_attempt_token,'sha256'),'hex');
  if a.id is null then raise exception 'Invalid course session'; end if;

  select * into c from public.seminar_course_calc(a.id);

  return jsonb_build_object(
    'attempt_id',a.id,
    'course_slug',a.course_slug,
    'language',a.language,
    'group_code',a.group_code,
    'team_label',a.team_label,
    'team_size',a.team_size,
    'status',a.status,
    'started_at',a.started_at,
    'last_activity_at',a.last_activity_at,
    'submitted_at',a.submitted_at,
    'restriction_events',a.restriction_events,
    'completed_count',c.completed_count,
    'solved_count',c.solved_count,
    'helps',c.helps,
    'wrongs',c.wrongs,
    'revealed',c.revealed,
    'skipped',c.skipped,
    'awarded_points',round(c.awarded_points,3),
    'projected_points',round(c.projected_points,3),
    'projected_grade',public.seminar_course_grade(c.projected_points),
    'final_grade',case when a.status='submitted' then public.seminar_course_grade(c.awarded_points) else null end,
    'participants',(
      select coalesce(jsonb_agg(
        jsonb_build_object('member_order',m.member_order,'display_name',m.display_name)
        order by m.member_order
      ),'[]'::jsonb)
      from public.seminar_course_attempt_members m
      where m.attempt_id=a.id
    ),
    'modules',(
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'module_key',r.module_key,
          'completion_mode',r.completion_mode,
          'help_count',r.help_count,
          'wrong_count',r.wrong_count,
          'awarded_points',r.awarded_points,
          'code_snapshot',r.code_snapshot,
          'updated_at',r.updated_at,
          'completed_at',r.completed_at
        ) order by r.updated_at
      ),'[]'::jsonb)
      from public.seminar_course_module_records r
      where r.attempt_id=a.id
    )
  );
end;
$$;

create or replace function public.seminar_course_start_team(
  p_course_slug text,
  p_language text,
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
  a public.seminar_course_attempts%rowtype;
  v_lang text;
  v_group text;
  v_size integer;
  v_key text;
  v_label text;
  v_token text;
  duplicate_count integer;
begin
  if trim(coalesce(p_course_slug,'')) <> 'seminario-programacion-t3-2026' then
    raise exception 'Unknown course';
  end if;

  v_lang:=lower(trim(coalesce(p_language,'')));
  if v_lang not in ('python','java') then raise exception 'Select Python or Java'; end if;

  v_group:=upper(trim(coalesce(p_group_code,'')));
  if v_group not in ('11-A','11-B','11-C') then raise exception 'Select a valid group'; end if;

  if p_student_names is null or jsonb_typeof(p_student_names)<>'array' then
    raise exception 'Provide team members';
  end if;
  v_size:=jsonb_array_length(p_student_names);
  if v_size < 1 or v_size > 3 then raise exception 'Register 1 to 3 students'; end if;

  if exists(
    select 1
    from jsonb_array_elements_text(p_student_names) as n(value)
    where length(trim(n.value)) < 2
  ) then
    raise exception 'Write every team member name';
  end if;

  with names as (
    select
      ord::integer as ord,
      regexp_replace(trim(value),'[[:space:]]+',' ','g') as display_name
    from jsonb_array_elements_text(p_student_names) with ordinality t(value,ord)
  ), normalized as (
    select ord,display_name,lower(display_name) as normalized_name
    from names
  )
  select
    string_agg(normalized_name,'|' order by normalized_name),
    string_agg(display_name,' · ' order by ord),
    count(*) - count(distinct normalized_name)
  into v_key,v_label,duplicate_count
  from normalized;

  if duplicate_count > 0 then raise exception 'Do not repeat a name inside one team'; end if;

  v_token:=replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');

  select * into a
  from public.seminar_course_attempts
  where course_slug=p_course_slug
    and language=v_lang
    and group_code=v_group
    and team_key=v_key
  order by started_at desc
  limit 1;

  if a.id is null then
    insert into public.seminar_course_attempts(
      course_slug,language,group_code,team_key,team_label,team_size,
      session_id,access_token_hash,user_agent
    ) values (
      p_course_slug,v_lang,v_group,v_key,v_label,v_size,
      coalesce(p_session_id,gen_random_uuid()),
      encode(digest(v_token,'sha256'),'hex'),
      p_user_agent
    ) returning * into a;
  else
    update public.seminar_course_attempts
    set team_label=v_label,
        team_size=v_size,
        access_token_hash=encode(digest(v_token,'sha256'),'hex'),
        last_activity_at=clock_timestamp(),
        user_agent=coalesce(p_user_agent,user_agent)
    where id=a.id
    returning * into a;
    delete from public.seminar_course_attempt_members where attempt_id=a.id;
  end if;

  insert into public.seminar_course_attempt_members(
    attempt_id,member_order,display_name,normalized_name
  )
  select
    a.id,
    ord::integer,
    regexp_replace(trim(value),'[[:space:]]+',' ','g'),
    lower(regexp_replace(trim(value),'[[:space:]]+',' ','g'))
  from jsonb_array_elements_text(p_student_names) with ordinality t(value,ord);

  insert into public.seminar_course_events(attempt_id,event_type,metadata)
  values(a.id,'TEAM_SESSION_STARTED',jsonb_build_object(
    'language',v_lang,'team_size',v_size,'group_code',v_group
  ));

  return jsonb_build_object(
    'attempt_id',a.id,
    'attempt_token',v_token,
    'snapshot',public.seminar_course_snapshot(a.id,v_token)
  );
end;
$$;

create or replace function public.seminar_course_resume(
  p_attempt_id uuid,
  p_attempt_token text
)
returns jsonb
language sql
security definer
set search_path='public','extensions'
as $$
  select jsonb_build_object('snapshot',public.seminar_course_snapshot(p_attempt_id,p_attempt_token));
$$;

create or replace function public.seminar_course_record_module(
  p_attempt_id uuid,
  p_attempt_token text,
  p_module_key text,
  p_completion_mode text,
  p_help_count integer,
  p_wrong_count integer,
  p_code_snapshot text
)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
  a public.seminar_course_attempts%rowtype;
  r public.seminar_course_module_records%rowtype;
  v_mode text;
  v_help integer;
  v_wrong integer;
  v_points numeric;
  v_done integer;
begin
  select * into a
  from public.seminar_course_attempts
  where id=p_attempt_id
    and access_token_hash=encode(digest(p_attempt_token,'sha256'),'hex')
  for update;
  if a.id is null then raise exception 'Invalid course session'; end if;

  if p_module_key not in (
    'm01','m02','m03','m04','m05','m06','m07','m08',
    'm09','m10','m13','m14','m11','m12','m15','m16'
  ) then raise exception 'Unknown module'; end if;

  v_mode:=lower(trim(coalesce(p_completion_mode,'')));
  if v_mode not in ('pending','solved','revealed','skipped') then
    raise exception 'Unknown completion mode';
  end if;

  v_help:=least(greatest(coalesce(p_help_count,0),0),3);
  v_wrong:=greatest(coalesce(p_wrong_count,0),0);

  select * into r
  from public.seminar_course_module_records
  where attempt_id=a.id and module_key=p_module_key
  for update;

  if r.id is not null and r.completion_mode in ('solved','revealed','skipped') then
    return jsonb_build_object('snapshot',public.seminar_course_snapshot(a.id,p_attempt_token));
  end if;

  if r.id is not null then
    v_help:=greatest(v_help,r.help_count);
    v_wrong:=greatest(v_wrong,r.wrong_count);
  end if;

  v_points:=case
    when v_mode='pending' then 0
    else public.seminar_course_module_credit(v_mode,v_help,v_wrong)
  end;

  insert into public.seminar_course_module_records(
    attempt_id,module_key,completion_mode,help_count,wrong_count,
    awarded_points,code_snapshot,updated_at,completed_at
  ) values (
    a.id,p_module_key,v_mode,v_help,v_wrong,v_points,
    left(coalesce(p_code_snapshot,''),50000),clock_timestamp(),
    case when v_mode in ('solved','revealed','skipped') then clock_timestamp() else null end
  )
  on conflict(attempt_id,module_key) do update
  set completion_mode=excluded.completion_mode,
      help_count=excluded.help_count,
      wrong_count=excluded.wrong_count,
      awarded_points=excluded.awarded_points,
      code_snapshot=excluded.code_snapshot,
      updated_at=clock_timestamp(),
      completed_at=case
        when excluded.completion_mode in ('solved','revealed','skipped')
          then coalesce(public.seminar_course_module_records.completed_at,clock_timestamp())
        else public.seminar_course_module_records.completed_at
      end;

  select count(*) into v_done
  from public.seminar_course_module_records
  where attempt_id=a.id and completion_mode in ('solved','revealed','skipped');

  update public.seminar_course_attempts
  set last_activity_at=clock_timestamp(),
      status=case when v_done>=16 then 'submitted' else 'active' end,
      submitted_at=case when v_done>=16 then coalesce(submitted_at,clock_timestamp()) else submitted_at end
  where id=a.id;

  if v_mode in ('solved','revealed','skipped') then
    insert into public.seminar_course_events(attempt_id,event_type,metadata)
    values(a.id,'MODULE_RECORDED',jsonb_build_object(
      'module_key',p_module_key,
      'completion_mode',v_mode,
      'help_count',v_help,
      'wrong_count',v_wrong,
      'awarded_points',v_points
    ));
  end if;

  return jsonb_build_object('snapshot',public.seminar_course_snapshot(a.id,p_attempt_token));
end;
$$;

create or replace function public.seminar_course_event(
  p_attempt_id uuid,
  p_attempt_token text,
  p_event_type text,
  p_metadata jsonb
)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
  v_id uuid;
  v_type text;
begin
  select id into v_id
  from public.seminar_course_attempts
  where id=p_attempt_id
    and access_token_hash=encode(digest(p_attempt_token,'sha256'),'hex');
  if v_id is null then raise exception 'Invalid course session'; end if;

  v_type:=left(upper(trim(coalesce(p_event_type,'EVENT'))),80);
  insert into public.seminar_course_events(attempt_id,event_type,metadata)
  values(v_id,v_type,coalesce(p_metadata,'{}'::jsonb));

  update public.seminar_course_attempts
  set last_activity_at=clock_timestamp(),
      restriction_events=restriction_events + case when v_type in ('FULLSCREEN_EXIT','VISIBILITY_HIDDEN') then 1 else 0 end
  where id=v_id;

  return jsonb_build_object('ok',true);
end;
$$;

create or replace function public.seminar_course_teacher_dashboard(p_teacher_token text)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
  v_teacher uuid;
begin
  v_teacher:=public.teacher_code_session_id(p_teacher_token);
  if v_teacher is null then raise exception 'Invalid or expired teacher session'; end if;

  return jsonb_build_object(
    'generated_at',clock_timestamp(),
    'course_slug','seminario-programacion-t3-2026',
    'attempts',(
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'attempt_id',a.id,
          'group_code',a.group_code,
          'language',a.language,
          'team_label',a.team_label,
          'team_size',a.team_size,
          'status',a.status,
          'started_at',a.started_at,
          'last_activity_at',a.last_activity_at,
          'submitted_at',a.submitted_at,
          'restriction_events',a.restriction_events,
          'completed_count',c.completed_count,
          'solved_count',c.solved_count,
          'helps',c.helps,
          'wrongs',c.wrongs,
          'revealed',c.revealed,
          'skipped',c.skipped,
          'awarded_points',c.awarded_points,
          'projected_points',c.projected_points,
          'projected_grade',public.seminar_course_grade(c.projected_points),
          'final_grade',case when a.status='submitted' then public.seminar_course_grade(c.awarded_points) else null end,
          'display_grade',case when a.status='submitted' then public.seminar_course_grade(c.awarded_points) else public.seminar_course_grade(c.projected_points) end,
          'participants',(
            select coalesce(jsonb_agg(
              jsonb_build_object('member_order',m.member_order,'display_name',m.display_name)
              order by m.member_order
            ),'[]'::jsonb)
            from public.seminar_course_attempt_members m
            where m.attempt_id=a.id
          )
        ) order by a.last_activity_at desc
      ),'[]'::jsonb)
      from public.seminar_course_attempts a
      cross join lateral public.seminar_course_calc(a.id) c
      where a.course_slug='seminario-programacion-t3-2026'
    )
  );
end;
$$;

grant execute on function public.seminar_course_snapshot(uuid,text) to anon,authenticated;
grant execute on function public.seminar_course_start_team(text,text,jsonb,text,uuid,text) to anon,authenticated;
grant execute on function public.seminar_course_resume(uuid,text) to anon,authenticated;
grant execute on function public.seminar_course_record_module(uuid,text,text,text,integer,integer,text) to anon,authenticated;
grant execute on function public.seminar_course_event(uuid,text,text,jsonb) to anon,authenticated;
grant execute on function public.seminar_course_teacher_dashboard(text) to anon,authenticated;
notify pgrst,'reload schema';
