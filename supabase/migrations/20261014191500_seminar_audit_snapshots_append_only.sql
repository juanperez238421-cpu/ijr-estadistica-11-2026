-- Preserve verified evidence baselines: no update/delete of captured student audit rows.
-- New snapshots remain insertable by privileged institutional audit processes.
CREATE OR REPLACE FUNCTION private.seminar_audit_snapshot_append_only_v1()
RETURNS trigger LANGUAGE plpgsql SET search_path=''
AS $$
BEGIN
 RAISE EXCEPTION 'Historical seminar audit snapshots are append-only and cannot be altered or deleted';
END $$;

DROP TRIGGER IF EXISTS seminar_audit_snapshot_immutable_v1 ON private.seminar_student_audit_snapshots_v1;
CREATE TRIGGER seminar_audit_snapshot_immutable_v1
BEFORE UPDATE OR DELETE ON private.seminar_student_audit_snapshots_v1
FOR EACH ROW EXECUTE FUNCTION private.seminar_audit_snapshot_append_only_v1();
