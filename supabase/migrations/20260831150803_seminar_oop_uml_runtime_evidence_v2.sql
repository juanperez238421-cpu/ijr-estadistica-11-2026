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
  v_run_count integer := case when coalesce(v_evidence->>'run_count','') ~ '^[0-9]+$' then least((v_evidence->>'run_count')::integer,1000) else 0 end;
  v_success_count integer := case when coalesce(v_evidence->>'successful_run_count','') ~ '^[0-9]+$' then least((v_evidence->>'successful_run_count')::integer,1000) else 0 end;
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

  if coalesce(v_evidence->>'model','false') <> 'true'
     or coalesce(v_evidence->>'code','false') <> 'true'
     or coalesce(v_evidence->>'test','false') <> 'true'
     or coalesce(v_evidence->>'explain','false') <> 'true' then
    raise exception 'Complete model, code, test and explanation evidence before finishing the session';
  end if;

  v_evidence := jsonb_build_object(
    'model', true,
    'code', true,
    'test', true,
    'explain', true,
    'notes', left(coalesce(v_evidence->>'notes',''),2000),
    'source', left(coalesce(v_evidence->>'source','oop-uml-hub'),80),
    'runtime', left(coalesce(v_evidence->>'runtime',''),80),
    'run_count', v_run_count,
    'successful_run_count', v_success_count,
    'run_success', coalesce(v_evidence->>'run_success','false') = 'true',
    'implement_success', coalesce(v_evidence->>'implement_success','false') = 'true',
    'test_success', coalesce(v_evidence->>'test_success','false') = 'true',
    'code_snapshot', left(coalesce(v_evidence->>'code_snapshot',''),12000),
    'last_output', left(coalesce(v_evidence->>'last_output',''),4000)
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
  values(a.id,'OOP_UML_SESSION_COMPLETED',jsonb_build_object(
    'session_key',v_key,
    'runtime',v_evidence->>'runtime',
    'run_count',v_run_count,
    'successful_run_count',v_success_count
  ));

  return public.seminar_oop_uml_snapshot(a.id,p_attempt_token);
end;
$function$;

revoke all on function public.seminar_oop_uml_record_session(uuid,text,text,jsonb) from public;
grant execute on function public.seminar_oop_uml_record_session(uuid,text,text,jsonb) to anon, authenticated;
