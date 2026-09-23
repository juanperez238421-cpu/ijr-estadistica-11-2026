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
  v_uml_score integer := case when coalesce(v_evidence->>'uml_classification_score','') ~ '^[0-9]+$' then least((v_evidence->>'uml_classification_score')::integer,50) else 0 end;
  v_uml_total integer := case when coalesce(v_evidence->>'uml_classification_total','') ~ '^[0-9]+$' then least((v_evidence->>'uml_classification_total')::integer,50) else 0 end;
  v_uml_mastery boolean := coalesce(v_evidence->>'uml_mastery','false') = 'true';
  v_visual_score integer := case when coalesce(v_evidence->>'uml_visual_score','') ~ '^[0-9]+$' then least((v_evidence->>'uml_visual_score')::integer,20) else 0 end;
  v_visual_total integer := case when coalesce(v_evidence->>'uml_visual_total','') ~ '^[0-9]+$' then least((v_evidence->>'uml_visual_total')::integer,20) else 0 end;
  v_visual_mastery boolean := coalesce(v_evidence->>'uml_visual_mastery','false') = 'true';
  v_state_score integer := case when coalesce(v_evidence->>'state_classification_score','') ~ '^[0-9]+$' then least((v_evidence->>'state_classification_score')::integer,20) else 0 end;
  v_state_total integer := case when coalesce(v_evidence->>'state_classification_total','') ~ '^[0-9]+$' then least((v_evidence->>'state_classification_total')::integer,20) else 0 end;
  v_state_mastery boolean := coalesce(v_evidence->>'state_behavior_mastery','false') = 'true';
  v_state_trace_complete boolean := coalesce(v_evidence->>'state_trace_complete','false') = 'true';
  v_implement_success boolean := coalesce(v_evidence->>'implement_success','false') = 'true';
  v_test_success boolean := coalesce(v_evidence->>'test_success','false') = 'true';
  v_modify_success boolean := coalesce(v_evidence->>'modify_success','false') = 'true';
  v_pedagogy_version text := left(coalesce(v_evidence->>'pedagogy_version','oop-uml-v3'),80);
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

  if v_key = 's01' and v_pedagogy_version in ('oop-uml-v4','oop-uml-v5') then
    if not v_uml_mastery
       or v_uml_total < 6
       or v_uml_score <> v_uml_total
       or length(trim(coalesce(v_evidence->>'uml_draft_class',''))) = 0
       or length(trim(coalesce(v_evidence->>'uml_draft_responsibility',''))) = 0
       or length(trim(coalesce(v_evidence->>'uml_draft_attributes',''))) = 0
       or length(trim(coalesce(v_evidence->>'uml_draft_methods',''))) = 0 then
      raise exception 'Complete the Stage 01 UML identification challenge and class diagram draft before recording evidence';
    end if;
  end if;

  if v_key = 's01' and v_pedagogy_version = 'oop-uml-v5' then
    if not v_visual_mastery
       or v_visual_total < 5
       or v_visual_score <> v_visual_total then
      raise exception 'Complete the Stage 01 Visual Diagram Reading Sprint with a perfect score before recording V5 evidence';
    end if;
  end if;

  if v_key = 's02' and v_pedagogy_version = 'oop-uml-v6' then
    if not v_state_mastery
       or v_state_total < 8
       or v_state_score <> v_state_total
       or not v_state_trace_complete then
      raise exception 'Complete the Session 02 State & Behavior classification and verified transition before recording evidence';
    end if;
    if not v_implement_success or not v_test_success or not v_modify_success then
      raise exception 'Run all three Session 02 Colab stages successfully before recording evidence';
    end if;
  end if;

  v_evidence := jsonb_build_object(
    'model', true,
    'code', true,
    'test', true,
    'explain', true,
    'notes', left(coalesce(v_evidence->>'notes',''),2000),
    'source', left(coalesce(v_evidence->>'source','oop-uml-hub'),80),
    'pedagogy_version', v_pedagogy_version,
    'learning_focus', left(coalesce(v_evidence->>'learning_focus','oop-uml-common-core'),120),
    'runtime', left(coalesce(v_evidence->>'runtime',''),80),
    'run_count', v_run_count,
    'successful_run_count', v_success_count,
    'run_success', coalesce(v_evidence->>'run_success','false') = 'true',
    'implement_success', v_implement_success,
    'test_success', v_test_success,
    'modify_success', v_modify_success,
    'code_snapshot', left(coalesce(v_evidence->>'code_snapshot',''),12000),
    'last_output', left(coalesce(v_evidence->>'last_output',''),4000),
    'uml_practice_version', left(coalesce(v_evidence->>'uml_practice_version',''),80),
    'uml_case', left(coalesce(v_evidence->>'uml_case',''),80),
    'uml_classification_score', v_uml_score,
    'uml_classification_total', v_uml_total,
    'uml_mastery', v_uml_mastery,
    'uml_draft_class', left(coalesce(v_evidence->>'uml_draft_class',''),100),
    'uml_draft_responsibility', left(coalesce(v_evidence->>'uml_draft_responsibility',''),600),
    'uml_draft_attributes', left(coalesce(v_evidence->>'uml_draft_attributes',''),1800),
    'uml_draft_methods', left(coalesce(v_evidence->>'uml_draft_methods',''),1800),
    'uml_visual_version', left(coalesce(v_evidence->>'uml_visual_version',''),80),
    'uml_visual_case', left(coalesce(v_evidence->>'uml_visual_case',''),80),
    'uml_visual_score', v_visual_score,
    'uml_visual_total', v_visual_total,
    'uml_visual_mastery', v_visual_mastery,
    'uml_visual_examples_seen', left(coalesce(v_evidence->>'uml_visual_examples_seen',''),400),
    'state_behavior_version', left(coalesce(v_evidence->>'state_behavior_version',''),80),
    'state_classification_score', v_state_score,
    'state_classification_total', v_state_total,
    'state_behavior_mastery', v_state_mastery,
    'state_trace_initial', left(coalesce(v_evidence->>'state_trace_initial',''),40),
    'state_trace_amount', left(coalesce(v_evidence->>'state_trace_amount',''),40),
    'state_trace_expected', left(coalesce(v_evidence->>'state_trace_expected',''),40),
    'state_trace_complete', v_state_trace_complete,
    'state_runtime_implement_validated', coalesce(v_evidence->>'state_runtime_implement_validated','false') = 'true',
    'state_runtime_test_validated', coalesce(v_evidence->>'state_runtime_test_validated','false') = 'true',
    'state_runtime_modify_validated', coalesce(v_evidence->>'state_runtime_modify_validated','false') = 'true'
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
    'pedagogy_version',v_evidence->>'pedagogy_version',
    'learning_focus',v_evidence->>'learning_focus',
    'runtime',v_evidence->>'runtime',
    'run_count',v_run_count,
    'successful_run_count',v_success_count,
    'uml_case',v_evidence->>'uml_case',
    'uml_mastery',v_uml_mastery,
    'uml_classification_score',v_uml_score,
    'uml_classification_total',v_uml_total,
    'uml_visual_case',v_evidence->>'uml_visual_case',
    'uml_visual_mastery',v_visual_mastery,
    'uml_visual_score',v_visual_score,
    'uml_visual_total',v_visual_total,
    'state_behavior_mastery',v_state_mastery,
    'state_classification_score',v_state_score,
    'state_classification_total',v_state_total,
    'state_trace_complete',v_state_trace_complete,
    'implement_success',v_implement_success,
    'test_success',v_test_success,
    'modify_success',v_modify_success
  ));

  return public.seminar_oop_uml_snapshot(a.id,p_attempt_token);
end;
$function$;

revoke all on function public.seminar_oop_uml_record_session(uuid,text,text,jsonb) from public;
grant execute on function public.seminar_oop_uml_record_session(uuid,text,text,jsonb) to anon, authenticated;