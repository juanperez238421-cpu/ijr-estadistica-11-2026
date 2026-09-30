# Shared Workshop teams

Rico and the four Project Studios reuse Statistics 11's `workshop-team-gate-v48.css` and current v50 email form: 1, 2 or 3 participants, one institutional email each, no duplicates. A saved Seminar email fills the first participant; direct entry can enter an institutional email without a roster match.

The `seminar-workshop-team` Edge Function creates a 24-hour team capability, storing only its hash in private Postgres tables. Successful non-terminal cell executions are sent with a request UUID and code hash. One database transaction records the same cell against every team member's normalized email. Repeated requests are idempotent. Individual entry recovers that student's previous team work; a newly assembled team displays only cells completed by all current members. Existing individual progress is retained, never copied indiscriminately to new participants.

The shared bar reads Supabase progress. Failed code runs do not write completion. Temporary transport failures queue successful runs in sessionStorage, bound to the original immutable team; the UI labels them pending and offers retry. Expired pending sessions retain an evidence draft instead of replaying old work into a different team. Downloaded evidence includes the team and pending count, without its bearer token.

This is classroom practice progress, not a teacher-approved grade. Existing project assignments, decisions, teacher gates and official grades are preserved. Unknown institutional emails are not guessed or linked to another student's roster record. As in the requested supervised-lab entry model, email entry asserts an institutional identifier rather than verifying mailbox ownership.

Private tables have RLS and no anonymous/authenticated read or write grants. Atomic team functions are SECURITY INVOKER and callable only by service_role behind the Edge endpoint. The endpoint enforces the existing public-client key and allowed origins, plus temporary team capabilities for progress operations. The SQL manifest explicitly whitelists each project's class and cell IDs; update it when adding or renaming cells.

Verification: real production API tested with isolated `qa.team.*` emails; real browser Python and HTML tested with `qa.browser.*` emails, independent resume and transport interruption. CI runs the same browser flow against an isolated transport fixture, all existing notebooks with real execution, and the actual database migration plus atomic synchronization, expiry, duplicate and permission tests in disposable Postgres 16.
