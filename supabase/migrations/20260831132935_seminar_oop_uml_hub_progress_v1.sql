create table if not exists public.seminar_oop_uml_session_records (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.seminar_course_attempts(id) on delete cascade,
  session_key text not null check (session_key in ('s01','s02','s03','s04','s05','s06','s07','s08','s09','s10')),
  status text not null default 'completed' check (status in ('completed')),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz not null default clock_timestamp(),
  unique (attempt_id, session_key)
);

create index if not exists seminar_oop_uml_session_records_attempt_idx
  on public.seminar_oop_uml_session_records(attempt_id, session_key);

alter table public.seminar_oop_uml_session_records enable row level security;
revoke all on table public.seminar_oop_uml_session_records from anon, authenticated;

create or replace function public.seminar_oop_uml_snapshot(
  p_attempt_id uuid,
  p_attempt_token text
) returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  a public.seminar_course_attempts%rowtype;
  v_sessions jsonb;
begin
  select * into a
  from public.seminar_course_attempts
  where id = p_attempt_id
    and access_token_hash = encode(digest(p_attempt_token,'sha256'),'hex');

  if a.id is null then
    raise exception 'Invalid course session';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'session_key', r.session_key,
        'status', r.status,
        'evidence', r.evidence,
        'completed_at', r.completed_at,
        'updated_at', r.updated_at
      ) order by r.session_key
    ),
    '[]'::jsonb
  ) into v_sessions
  from public.seminar_oop_uml_session_records r
  where r.attempt_id = a.id;

  return jsonb_build_object(
    'attempt_id', a.id,
    'course_slug', a.course_slug,
    'language', a.language,
    'group_code', a.group_code,
    'sessions', v_sessions
  );
end;
$function$;

create or replace function public.seminar_oop_uml_record_session(
  p_attempt_id uuid,
  p_attempt_token text,
  p_session_key text,
  p_evidence jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  a public.seminar_course_attempts%rowtype;
  v_key text := lower(trim(coalesce(p_session_key,'')));
  v_evidence jsonb := coalesce(p_evidence,'{}'::jsonb);
begin
  select * into a
  from public.seminar_course_attempts
  where id = p_attempt_id
    and access_token_hash = encode(digest(p_attempt_token,'sha256'),'hex')
  for update;

  if a.id is null then
    raise exception 'Invalid course session';
  end if;

  if v_key not in ('s01','s02','s03','s04','s05','s06','s07','s08','s09','s10') then
    raise exception 'Unknown OOP UML session';
  end if;

  if not coalesce((v_evidence->>'model')::boolean,false)
     or not coalesce((v_evidence->>'code')::boolean,false)
     or not coalesce((v_evidence->>'test')::boolean,false)
     or not coalesce((v_evidence->>'explain')::boolean,false) then
    raise exception 'Complete model, code, test and explanation evidence before finishing the session';
  end if;

  v_evidence := jsonb_build_object(
    'model', true,
    'code', true,
    'test', true,
    'explain', true,
    'notes', left(coalesce(v_evidence->>'notes',''),2000),
    'source', left(coalesce(v_evidence->>'source','oop-uml-hub'),80)
  );

  insert into public.seminar_oop_uml_session_records(
    attempt_id, session_key, status, evidence, created_at, updated_at, completed_at
  ) values (
    a.id, v_key, 'completed', v_evidence, clock_timestamp(), clock_timestamp(), clock_timestamp()
  )
  on conflict(attempt_id,session_key) do update
  set status='completed',
      evidence=excluded.evidence,
      updated_at=clock_timestamp(),
      completed_at=coalesce(public.seminar_oop_uml_session_records.completed_at,clock_timestamp());

  insert into public.seminar_course_events(attempt_id,event_type,metadata)
  values(a.id,'OOP_UML_SESSION_COMPLETED',jsonb_build_object('session_key',v_key));

  return public.seminar_oop_uml_snapshot(a.id,p_attempt_token);
end;
$function$;

revoke all on function public.seminar_oop_uml_snapshot(uuid,text) from public;
revoke all on function public.seminar_oop_uml_record_session(uuid,text,text,jsonb) from public;
grant execute on function public.seminar_oop_uml_snapshot(uuid,text) to anon, authenticated;
grant execute on function public.seminar_oop_uml_record_session(uuid,text,text,jsonb) to anon, authenticated;
