-- Teacher-gated Seminar 11 longitudinal progress: preserve distinct evidence types.
-- Derived from validated production view/function definitions on 2026-10-14.
CREATE OR REPLACE VIEW private.seminar_student_evidence_v1 AS
 SELECT s.id AS student_registry_id,
    s.group_code,
    s.source_position,
    s.display_name,
    COALESCE(mail.emails, '[]'::jsonb) AS emails,
    COALESCE(reg.attempts, '[]'::jsonb) AS course_attempts,
    COALESCE(reg.attempt_count, 0) AS attempt_count,
    COALESCE(oop.records, '[]'::jsonb) AS oop_sessions,
    COALESCE(oop.s01_count, 0) AS s01_records,
    COALESCE(oop.s02_count, 0) AS s02_records,
    COALESCE(draft.records, '[]'::jsonb) AS drafts,
    COALESCE(draft.draft_count, 0) AS draft_count,
    COALESCE(pro.records, '[]'::jsonb) AS projects,
    COALESCE(pro.project_count, 0) AS project_count,
    COALESCE(pro.confirmed_count, 0) AS project_confirmed_count,
    COALESCE(diag.records, '[]'::jsonb) AS diagnostics,
    COALESCE(studio.records, '[]'::jsonb) AS studio_profiles,
    COALESCE(guided.records, '[]'::jsonb) AS guided_project_cells,
    COALESCE(guided.cell_count, 0) AS guided_cell_count,
    COALESCE(labs.records, '[]'::jsonb) AS legacy_oop_labs,
    COALESCE(access.count_events, 0) AS project_page_accesses,
    ( SELECT count(*) AS count
           FROM backup_20261005_stat11_seminar11_v1.seminar_oop_uml_session_records o
             JOIN seminar_course_attempt_members m ON m.attempt_id = o.attempt_id
          WHERE m.student_registry_id = s.id AND NOT (EXISTS ( SELECT 1
                   FROM seminar_oop_uml_session_records live
                  WHERE live.attempt_id = o.attempt_id AND live.session_key = o.session_key AND NOT live.evidence IS DISTINCT FROM o.evidence))) AS historical_sessions_missing_or_changed
   FROM student_registry s
     LEFT JOIN LATERAL ( SELECT jsonb_agg(z.email ORDER BY z.email) AS emails
           FROM ( SELECT DISTINCT lower(TRIM(BOTH FROM i.institutional_email)) AS email
                   FROM python_hub_student_identities i
                  WHERE i.student_registry_id = s.id AND i.institutional_email IS NOT NULL) z) mail ON true
     LEFT JOIN LATERAL ( SELECT count(*)::integer AS attempt_count,
            jsonb_agg(jsonb_build_object('attempt_id', a.id, 'group_entered', a.group_code, 'team_label', a.team_label, 'team_size', a.team_size, 'status', a.status, 'started_at', a.started_at, 'last_activity_at', a.last_activity_at) ORDER BY a.started_at) AS attempts
           FROM seminar_course_attempts a
          WHERE (EXISTS ( SELECT 1
                   FROM seminar_course_attempt_members m
                  WHERE m.attempt_id = a.id AND m.student_registry_id = s.id))) reg ON true
     LEFT JOIN LATERAL ( SELECT count(*) FILTER (WHERE r.session_key = 's01'::text)::integer AS s01_count,
            count(*) FILTER (WHERE r.session_key = 's02'::text)::integer AS s02_count,
            jsonb_agg(jsonb_build_object('session', r.session_key, 'attempt_id', r.attempt_id, 'record_id', r.id, 'status', r.status, 'completed_at', r.completed_at, 'updated_at', r.updated_at, 'classification_score', COALESCE(r.evidence -> 'uml_classification_score'::text, r.evidence -> 'state_classification_score'::text), 'classification_total', COALESCE(r.evidence -> 'uml_classification_total'::text, r.evidence -> 'state_classification_total'::text), 'visual_score', r.evidence -> 'uml_visual_score'::text, 'visual_total', r.evidence -> 'uml_visual_total'::text, 'model_checked', r.evidence -> 'model'::text, 'code_checked', r.evidence -> 'code'::text, 'test_checked', r.evidence -> 'test'::text, 'run_success', r.evidence -> 'run_success'::text, 'implement_success', r.evidence -> 'implement_success'::text, 'test_success', r.evidence -> 'test_success'::text, 'modify_success', r.evidence -> 'modify_success'::text, 'state_behavior_mastery', r.evidence -> 'state_behavior_mastery'::text, 'state_trace_complete', r.evidence -> 'state_trace_complete'::text, 'validated_implement', r.evidence -> 'state_runtime_implement_validated'::text, 'validated_test', r.evidence -> 'state_runtime_test_validated'::text, 'validated_modify', r.evidence -> 'state_runtime_modify_validated'::text, 'pedagogy_version', r.evidence ->> 'pedagogy_version'::text, 'code_snapshot_present', length(COALESCE(r.evidence ->> 'code_snapshot'::text, ''::text)) > 0, 'code_snapshot_sha256', encode(digest(COALESCE(r.evidence ->> 'code_snapshot'::text, ''::text), 'sha256'::text), 'hex'::text)) ORDER BY r.session_key, r.updated_at) AS records
           FROM seminar_oop_uml_session_records r
          WHERE (EXISTS ( SELECT 1
                   FROM seminar_course_attempt_members m
                  WHERE m.attempt_id = r.attempt_id AND m.student_registry_id = s.id))) oop ON true
     LEFT JOIN LATERAL ( SELECT count(*)::integer AS draft_count,
            jsonb_agg(jsonb_build_object('session', d.session_key, 'attempt_id', d.attempt_id, 'revision', d.revision, 'updated_at', d.updated_at, 'origin', d.payload ->> 'origin'::text, 'cell_ids', ( SELECT COALESCE(jsonb_agg(k.key), '[]'::jsonb) AS "coalesce"
                   FROM jsonb_object_keys(COALESCE(d.payload -> 'cells'::text, '{}'::jsonb)) k(key)), 'saved_model', d.payload -> 'model_evidence'::text) ORDER BY d.session_key, d.updated_at) AS records
           FROM seminar_oop_uml_drafts_v1 d
          WHERE (EXISTS ( SELECT 1
                   FROM seminar_course_attempt_members m
                  WHERE m.attempt_id = d.attempt_id AND m.student_registry_id = s.id))) draft ON true
     LEFT JOIN LATERAL ( SELECT count(*)::integer AS project_count,
            count(*) FILTER (WHERE p.confirmed_at IS NOT NULL OR p.decision_status = 'confirmed'::text)::integer AS confirmed_count,
            jsonb_agg(jsonb_build_object('project_slug', p.project_slug, 'title', p.project_title, 'track', p.track_slug, 'assignment_status', p.assignment_status, 'decision_status', p.decision_status, 'confirmed_at', p.confirmed_at, 'student_decided_at', p.student_decided_at, 'code_files', ( SELECT count(*) AS count
                   FROM seminar_project_code_files f
                  WHERE f.student_registry_id = s.id AND f.project_slug = p.project_slug), 'successful_runs', ( SELECT COALESCE(sum(k.successful_run_count), 0::bigint) AS "coalesce"
                   FROM seminar_project_code_runtime k
                  WHERE k.student_registry_id = s.id AND k.project_slug = p.project_slug), 'units_started', ( SELECT count(*) AS count
                   FROM seminar_project_unit_progress u
                  WHERE u.student_registry_id = s.id AND u.project_slug = p.project_slug), 'units_passed', ( SELECT count(*) AS count
                   FROM seminar_project_unit_progress u
                  WHERE u.student_registry_id = s.id AND u.project_slug = p.project_slug AND u.gate_passed), 'snapshots', ( SELECT count(*) AS count
                   FROM seminar_project_code_snapshots v
                  WHERE v.student_registry_id = s.id AND v.project_slug = p.project_slug)) ORDER BY p.created_at) AS records
           FROM seminar_student_projects p
          WHERE p.student_registry_id = s.id) pro ON true
     LEFT JOIN LATERAL ( SELECT jsonb_agg(jsonb_build_object('track', d.track_slug, 'score', d.score, 'max_score', d.max_score, 'completed_at', d.completed_at, 'started_at', d.started_at) ORDER BY d.started_at) AS records
           FROM seminar_track_diagnostic_attempts d
          WHERE d.student_registry_id = s.id) diag ON true
     LEFT JOIN LATERAL ( SELECT jsonb_agg(jsonb_build_object('track', p.track_slug, 'status', p.status, 'progress_percent', p.progress_percent, 'verified_at', p.identity_verified_at, 'last_activity', p.last_student_activity_at) ORDER BY p.created_at) AS records
           FROM seminar_studio_profiles p
          WHERE p.student_registry_id = s.id) studio ON true
     LEFT JOIN LATERAL ( SELECT count(*)::integer AS cell_count,
            jsonb_agg(jsonb_build_object('project', w.project_key, 'class', w.class_no, 'cell_id', w.cell_id, 'completed_at', w.completed_at, 'code_hash', w.code_hash) ORDER BY w.completed_at) AS records
           FROM private.seminar_workshop_member_progress w
          WHERE (w.email_normalized IN ( SELECT lower(TRIM(BOTH FROM i.institutional_email)) AS lower
                   FROM python_hub_student_identities i
                  WHERE i.student_registry_id = s.id AND i.institutional_email IS NOT NULL))) guided ON true
     LEFT JOIN LATERAL ( SELECT jsonb_agg(jsonb_build_object('activity', la.slug, 'attempt_id', a.id, 'status', a.status, 'grade_recorded', a.grade, 'last_activity', a.last_activity_at) ORDER BY a.started_at) AS records
           FROM learning_activity_attempt_members m
             JOIN learning_activity_attempts a ON a.id = m.attempt_id
             JOIN learning_activities la ON la.id = a.activity_id
          WHERE m.student_registry_id = s.id AND la.slug ~~ 'seminar11%'::text) labs ON true
     LEFT JOIN LATERAL ( SELECT count(*)::integer AS count_events
           FROM seminar_project_access_events ev
          WHERE ev.student_registry_id = s.id AND ev.success) access ON true
  WHERE s.active;;
REVOKE ALL ON private.seminar_student_evidence_v1 FROM PUBLIC,anon,authenticated;

CREATE TABLE IF NOT EXISTS private.seminar_student_audit_snapshots_v1(
 snapshot_id uuid NOT NULL,
 student_registry_id uuid NOT NULL REFERENCES public.student_registry(id),
 captured_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 evidence jsonb NOT NULL,
 evidence_sha256 text NOT NULL,
 PRIMARY KEY(snapshot_id,student_registry_id)
);
ALTER TABLE private.seminar_student_audit_snapshots_v1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.seminar_student_audit_snapshots_v1 FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.teacher_seminar_progress_audit_v1(p_teacher_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_students jsonb;v_n integer;v_unmatched jsonb;v_snap uuid;v_snapshot_at timestamptz;v_changed integer;
BEGIN
 IF public.teacher_code_session_id(p_teacher_token) IS NULL THEN RAISE EXCEPTION 'Invalid or expired teacher session'; END IF;
 SELECT count(*),coalesce(jsonb_agg(to_jsonb(v) ORDER BY v.group_code,v.source_position),'[]'::jsonb)
 INTO v_n,v_students FROM private.seminar_student_evidence_v1 v;
 SELECT coalesce(jsonb_agg(jsonb_build_object('name',m.display_name,'group_entered',a.group_code,
 'team_label',a.team_label,'attempt_id',a.id) ORDER BY a.started_at),'[]'::jsonb)
 INTO v_unmatched
 FROM public.seminar_course_attempt_members m
 JOIN public.seminar_course_attempts a ON a.id=m.attempt_id
 WHERE m.student_registry_id IS NULL AND a.group_code IN('11-A','11-B','11-C')
   AND m.display_name NOT LIKE '%@ijr.edu.co';
 SELECT snapshot_id,max(captured_at) INTO v_snap,v_snapshot_at
 FROM private.seminar_student_audit_snapshots_v1
 GROUP BY snapshot_id ORDER BY max(captured_at) DESC LIMIT 1;
 SELECT count(*) INTO v_changed
 FROM private.seminar_student_evidence_v1 live
 LEFT JOIN private.seminar_student_audit_snapshots_v1 old
 ON old.student_registry_id=live.student_registry_id AND old.snapshot_id=v_snap
 WHERE old.student_registry_id IS NULL
 OR old.evidence_sha256<>encode(extensions.digest(convert_to(to_jsonb(live)::text,'UTF8'),'sha256'),'hex');
 RETURN jsonb_build_object(
 'generated_at',clock_timestamp(),'roster_count',v_n,'students',v_students,
 'unmatched_team_members',v_unmatched,
 'baseline_snapshot_id',v_snap,'baseline_captured_at',v_snapshot_at,
 'students_changed_since_baseline',v_changed,
 'meaning','Saved draft, completed record, assigned project, and page access are separate evidence types; none alone establishes a BEAM grade');
END $function$

REVOKE ALL ON FUNCTION public.teacher_seminar_progress_audit_v1(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.teacher_seminar_progress_audit_v1(text) TO anon,authenticated,service_role;
