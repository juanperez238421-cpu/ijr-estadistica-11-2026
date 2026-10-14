-- OOP/UML shared-team session grace + canonical RPC definitions (2026-10-14).
-- Captured from the successfully tested live schema after rollback-only QA.
-- Credentials are hashed; historical grades and workshop answers remain untouched.
CREATE TABLE IF NOT EXISTS private.seminar_oop_token_grants_v1(
 attempt_id uuid NOT NULL REFERENCES public.seminar_course_attempts(id) ON DELETE CASCADE,
 token_hash text NOT NULL,
 expires_at timestamptz NOT NULL,
 PRIMARY KEY(attempt_id,token_hash)
);
ALTER TABLE private.seminar_oop_token_grants_v1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.seminar_oop_token_grants_v1 FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.seminar_oop_token_valid_v1(p_attempt_id uuid, p_attempt_token text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT EXISTS(
 SELECT 1 FROM public.seminar_course_attempts a
 WHERE a.id=p_attempt_id AND (
 a.access_token_hash=encode(extensions.digest(p_attempt_token,'sha256'),'hex')
 OR EXISTS(SELECT 1 FROM private.seminar_oop_token_grants_v1 g
   WHERE g.attempt_id=a.id AND g.token_hash=encode(extensions.digest(p_attempt_token,'sha256'),'hex') AND g.expires_at>clock_timestamp())
 ));
$function$


CREATE OR REPLACE FUNCTION public.seminar_oop_uml_start_email_v11(p_institutional_email text, p_language text DEFAULT 'python'::text, p_session_id uuid DEFAULT gen_random_uuid(), p_user_agent text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_email text:=lower(btrim(coalesce(p_institutional_email,'')));
 v_registry_id uuid;v_group text;v_team_key text;
BEGIN
 IF char_length(v_email)>254 OR v_email !~ '^[^[:space:]@]+@ijr[.]edu[.]co$' THEN
   RAISE EXCEPTION 'institutional_email_required';
 END IF;
 SELECT psi.student_registry_id INTO v_registry_id
 FROM public.python_hub_student_identities psi
 JOIN public.student_registry s ON s.id=psi.student_registry_id AND s.active
 WHERE lower(btrim(psi.institutional_email))=v_email
 ORDER BY psi.updated_at DESC LIMIT 1;
 IF v_registry_id IS NOT NULL THEN
   INSERT INTO private.seminar_oop_token_grants_v1(attempt_id,token_hash,expires_at)
   SELECT DISTINCT a.id,a.access_token_hash,clock_timestamp()+interval '12 hours'
   FROM public.seminar_course_attempts a
   JOIN public.seminar_course_attempt_members m ON m.attempt_id=a.id
   WHERE m.student_registry_id=v_registry_id AND a.course_slug='seminario-programacion-t3-2026'
     AND a.language=lower(btrim(coalesce(p_language,'python'))) AND a.access_token_hash IS NOT NULL
   ON CONFLICT(attempt_id,token_hash) DO UPDATE SET expires_at=GREATEST(private.seminar_oop_token_grants_v1.expires_at,excluded.expires_at);
 ELSE
   v_team_key:=encode(extensions.digest(v_email,'sha256'),'hex');
   INSERT INTO private.seminar_oop_token_grants_v1(attempt_id,token_hash,expires_at)
   SELECT a.id,a.access_token_hash,clock_timestamp()+interval '12 hours'
   FROM public.seminar_course_attempts a
   WHERE a.team_key=v_team_key AND a.group_code='11-U'
     AND a.course_slug='seminario-programacion-t3-2026' AND a.access_token_hash IS NOT NULL
   ON CONFLICT(attempt_id,token_hash) DO UPDATE SET expires_at=GREATEST(private.seminar_oop_token_grants_v1.expires_at,excluded.expires_at);
 END IF;
 RETURN public.seminar_oop_uml_start_email_v10(v_email,p_language,p_session_id,p_user_agent);
END;
$function$


CREATE OR REPLACE FUNCTION public.seminar_course_snapshot(p_attempt_id uuid, p_attempt_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  a public.seminar_course_attempts%rowtype;
  c record;
begin
  select * into a
  from public.seminar_course_attempts
  where id=p_attempt_id
    and public.seminar_oop_token_valid_v1(p_attempt_id,p_attempt_token);
  if a.id is null then raise exception 'Invalid course session'; end if;

  select * into c from public.seminar_course_calc(a.id);

  return jsonb_build_object(
    'attempt_id',a.id,'course_slug',a.course_slug,'language',a.language,
    'group_code',a.group_code,'team_label',a.team_label,'team_size',a.team_size,
    'status',a.status,'started_at',a.started_at,'last_activity_at',a.last_activity_at,
    'submitted_at',a.submitted_at,'restriction_events',a.restriction_events,
    'completed_count',c.completed_count,'solved_count',c.solved_count,
    'helps',c.helps,'wrongs',c.wrongs,'revealed',c.revealed,'skipped',c.skipped,
    'awarded_points',round(c.awarded_points,3),'projected_points',round(c.projected_points,3),
    'projected_grade',public.seminar_course_grade(c.projected_points),
    'final_grade',case when a.status='submitted' then public.seminar_course_grade(c.awarded_points) else null end,
    'participants',(
      select coalesce(jsonb_agg(jsonb_build_object(
        'member_order',m.member_order,'display_name',m.display_name,
        'student_registry_id',m.student_registry_id,'is_roster_match',m.is_roster_match
      ) order by m.member_order),'[]'::jsonb)
      from public.seminar_course_attempt_members m where m.attempt_id=a.id
    ),
    'modules',(
      select coalesce(jsonb_agg(jsonb_build_object(
        'module_key',r.module_key,'completion_mode',r.completion_mode,
        'help_count',r.help_count,'wrong_count',r.wrong_count,
        'awarded_points',r.awarded_points,'code_snapshot',r.code_snapshot,
        'updated_at',r.updated_at,'completed_at',r.completed_at
      ) order by r.updated_at),'[]'::jsonb)
      from public.seminar_course_module_records r where r.attempt_id=a.id
    )
  );
end;
$function$


CREATE OR REPLACE FUNCTION public.seminar_oop_uml_snapshot(p_attempt_id uuid, p_attempt_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  a public.seminar_course_attempts%rowtype;
  v_sessions jsonb;
begin
  select * into a
  from public.seminar_course_attempts
  where id = p_attempt_id
    and public.seminar_oop_token_valid_v1(p_attempt_id,p_attempt_token);

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
$function$


CREATE OR REPLACE FUNCTION public.seminar_oop_uml_record_session(p_attempt_id uuid, p_attempt_token text, p_session_key text, p_evidence jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
    and public.seminar_oop_token_valid_v1(p_attempt_id,p_attempt_token)
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
    if not v_implement_success
       or not v_test_success
       or not v_modify_success
       or coalesce(v_evidence->>'state_runtime_implement_validated','false') <> 'true'
       or coalesce(v_evidence->>'state_runtime_test_validated','false') <> 'true'
       or coalesce(v_evidence->>'state_runtime_modify_validated','false') <> 'true' then
      raise exception 'Complete and validate all three Session 02 Colab stages before recording evidence';
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
$function$


CREATE OR REPLACE FUNCTION public.seminar_oop_uml_draft_snapshot_v1(p_attempt_id uuid, p_attempt_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_ok boolean; v_drafts jsonb;
BEGIN
 SELECT EXISTS(SELECT 1 FROM public.seminar_course_attempts a WHERE a.id=p_attempt_id AND public.seminar_oop_token_valid_v1(p_attempt_id,p_attempt_token)) INTO v_ok;
 IF NOT v_ok THEN RAISE EXCEPTION 'Invalid course session'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('session_key',d.session_key,'revision',d.revision,'payload',d.payload,'updated_at',d.updated_at) ORDER BY d.session_key),'[]'::jsonb)
 INTO v_drafts FROM public.seminar_oop_uml_drafts_v1 d WHERE d.attempt_id=p_attempt_id;
 RETURN jsonb_build_object('drafts',v_drafts);
END $function$


CREATE OR REPLACE FUNCTION public.seminar_oop_uml_draft_save_v1(p_attempt_id uuid, p_attempt_token text, p_session_key text, p_payload jsonb, p_expected_revision bigint DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_row public.seminar_oop_uml_drafts_v1%ROWTYPE;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.seminar_course_attempts a WHERE a.id=p_attempt_id AND public.seminar_oop_token_valid_v1(p_attempt_id,p_attempt_token)) THEN
  RAISE EXCEPTION 'Invalid course session';
 END IF;
 IF coalesce(p_session_key,'') !~ '^s(0[1-9]|10)$' THEN RAISE EXCEPTION 'Invalid workshop session'; END IF;
 IF jsonb_typeof(p_payload) IS DISTINCT FROM 'object' OR octet_length(p_payload::text)>90000 THEN
  RAISE EXCEPTION 'Invalid draft payload';
 END IF;
 IF coalesce(p_expected_revision,-1)<0 OR p_expected_revision>1999999998 THEN RAISE EXCEPTION 'Invalid draft revision'; END IF;
 INSERT INTO public.seminar_oop_uml_drafts_v1(attempt_id,session_key,revision,payload,updated_at)
 VALUES(p_attempt_id,p_session_key,p_expected_revision+1,p_payload,clock_timestamp())
 ON CONFLICT(attempt_id,session_key) DO UPDATE
   SET revision=excluded.revision,payload=excluded.payload,updated_at=excluded.updated_at
   WHERE public.seminar_oop_uml_drafts_v1.revision=p_expected_revision
 RETURNING * INTO v_row;
 IF v_row.attempt_id IS NULL THEN
  RETURN jsonb_build_object('ok',false,'conflict',true,'message','Another edit was saved. Reload before editing further.');
 END IF;
 RETURN jsonb_build_object('ok',true,'revision',v_row.revision,'updated_at',v_row.updated_at);
END $function$


REVOKE ALL ON FUNCTION public.seminar_oop_token_valid_v1(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seminar_oop_uml_start_email_v11(text,text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seminar_oop_token_valid_v1(uuid,text) TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.seminar_oop_uml_start_email_v11(text,text,uuid,text) TO anon,authenticated,service_role;
