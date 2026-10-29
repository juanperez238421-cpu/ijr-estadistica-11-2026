-- V76: teacher master and student Hub must use the same canonical roster-
-- identity calculation; don't manufacture or overwrite student submissions.
-- This preserves the existing teacher-code authentication and audit trail.
CREATE OR REPLACE FUNCTION private.python_hub_teacher_master_payload_v76()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public, private, pg_catalog
AS $$
DECLARE
  v_payload jsonb;
  v_students jsonb;
BEGIN
  v_payload := private.python_hub_teacher_master_payload_v2();

  WITH roster_rows AS (
    SELECT entry.value AS student,
           (entry.value->>'student_registry_id')::uuid AS roster_id
    FROM jsonb_array_elements(COALESCE(v_payload->'students','[]'::jsonb)) AS entry(value)
  ), verified AS (
    SELECT row.student, row.roster_id, identity_row.id AS identity_id
    FROM roster_rows AS row
    LEFT JOIN LATERAL (
      SELECT i.id
      FROM public.python_hub_student_identities AS i
      WHERE i.student_registry_id = row.roster_id
      ORDER BY i.id
      LIMIT 1
    ) AS identity_row ON TRUE
  )
  SELECT COALESCE(
    jsonb_agg(
      v.student || jsonb_build_object(
        'effective_progress',
          CASE WHEN v.identity_id IS NOT NULL
            THEN private.python_hub_member_progress_v29(v.identity_id)
            ELSE 'null'::jsonb END,
        'progress_roster_verified',v.identity_id IS NOT NULL,
        'validated_by_topic',COALESCE((
          SELECT jsonb_object_agg(answers.topic_slug,answers.validated)
          FROM (
            SELECT w.topic_slug,COUNT(DISTINCT w.item_key)::int AS validated
            FROM public.python_hub_workshop_responses w
            JOIN public.python_hub_registration_members m
              ON m.registration_id=w.registration_id
            LEFT JOIN public.python_hub_student_identities linked
              ON linked.id=m.student_identity_id
            WHERE w.correct=true
              AND (m.student_registry_id=v.roster_id OR linked.student_registry_id=v.roster_id)
            GROUP BY w.topic_slug
          ) AS answers
        ),'{}'::jsonb)
      )
      ORDER BY v.student->>'group_code',(v.student->>'source_position')::int
    ),'[]'::jsonb
  ) INTO v_students
  FROM verified v;

  RETURN jsonb_set(v_payload,'{students}',v_students,true);
END;
$$;

REVOKE ALL ON FUNCTION private.python_hub_teacher_master_payload_v76()
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.python_hub_teacher_master_code_v1(p_teacher_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, private, pg_catalog
AS $$
DECLARE v_sid uuid;
BEGIN
  v_sid := public.teacher_code_session_id(p_teacher_token);
  IF v_sid IS NULL THEN
    RAISE EXCEPTION 'Sesión docente inválida o expirada';
  END IF;
  INSERT INTO public.teacher_code_audit(teacher_session_id,action_type,metadata)
  VALUES(v_sid,'PYTHON_HUB_MASTER_VIEW',
    jsonb_build_object('source','python/master','payload_version','v76_canonical_roster'));
  RETURN private.python_hub_teacher_master_payload_v76();
END;
$$;
