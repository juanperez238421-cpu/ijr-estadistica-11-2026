-- V9 repeat-registration compatibility.
-- The previous guest identity index allowed only one registration per activity/group/team.
-- V9 intentionally allows a student/team to register again in a new session, while the
-- same session UUID remains unique for safe retry behavior.

drop index if exists public.learning_activity_guest_identity_uq;

create unique index if not exists learning_activity_guest_identity_session_uq
  on public.learning_activity_attempts(activity_id, group_code, student_name_normalized, session_id)
  where student_registry_id is null;
