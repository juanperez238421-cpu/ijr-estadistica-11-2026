-- Python Learning Hub V20 hardening
-- The active Hub uses pinless registration v3 and teacher-assisted one-time recovery.
-- Keep the historical function definition for migration compatibility, but make the reusable-PIN registration RPC unreachable from API roles.

revoke all on function public.python_hub_register_v2(text,text,jsonb,uuid,text,text)
from public, anon, authenticated;
