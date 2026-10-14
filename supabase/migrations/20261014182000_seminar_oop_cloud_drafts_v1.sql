-- OOP/UML draft recovery. Grades and completed sessions are unchanged.
-- Deploy after validating against the existing Seminar course tables.
CREATE TABLE IF NOT EXISTS public.seminar_oop_uml_drafts_v1(
 attempt_id uuid NOT NULL REFERENCES public.seminar_course_attempts(id) ON DELETE CASCADE,
 session_key text NOT NULL CHECK(session_key ~ '^s(0[1-9]|10)$'),
 revision bigint NOT NULL CHECK(revision BETWEEN 1 AND 2000000000),
 payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(payload)='object' AND octet_length(payload::text)<=90000),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(attempt_id,session_key)
);
ALTER TABLE public.seminar_oop_uml_drafts_v1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.seminar_oop_uml_drafts_v1 FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.seminar_oop_uml_draft_snapshot_v1(p_attempt_id uuid,p_attempt_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_ok boolean; v_drafts jsonb;
BEGIN
 SELECT EXISTS(SELECT 1 FROM public.seminar_course_attempts a WHERE a.id=p_attempt_id AND a.access_token_hash=encode(extensions.digest(p_attempt_token,'sha256'),'hex')) INTO v_ok;
 IF NOT v_ok THEN RAISE EXCEPTION 'Invalid course session'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('session_key',d.session_key,'revision',d.revision,'payload',d.payload,'updated_at',d.updated_at) ORDER BY d.session_key),'[]'::jsonb)
 INTO v_drafts FROM public.seminar_oop_uml_drafts_v1 d WHERE d.attempt_id=p_attempt_id;
 RETURN jsonb_build_object('drafts',v_drafts);
END $$;

CREATE OR REPLACE FUNCTION public.seminar_oop_uml_draft_save_v1(
 p_attempt_id uuid,p_attempt_token text,p_session_key text,p_payload jsonb,p_expected_revision bigint DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_row public.seminar_oop_uml_drafts_v1%ROWTYPE;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.seminar_course_attempts a WHERE a.id=p_attempt_id AND a.access_token_hash=encode(extensions.digest(p_attempt_token,'sha256'),'hex')) THEN
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
END $$;

REVOKE ALL ON FUNCTION public.seminar_oop_uml_draft_snapshot_v1(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seminar_oop_uml_draft_save_v1(uuid,text,text,jsonb,bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seminar_oop_uml_draft_snapshot_v1(uuid,text) TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.seminar_oop_uml_draft_save_v1(uuid,text,text,jsonb,bigint) TO anon,authenticated,service_role;
