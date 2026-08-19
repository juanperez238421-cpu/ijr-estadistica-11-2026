-- History synchronization sentinel for production migration version 20260819172707.
--
-- Production already records this migration version in supabase_migrations.schema_migrations,
-- but the corresponding version was not present in the Git repository. That caused
-- `supabase db push --include-all` to stop before applying later migrations.
--
-- This file is intentionally a no-op: it makes the local migration version set match
-- the already-applied production history without replaying unknown DDL against production.
-- The subsequent versioned migrations in this repository remain the source of truth for
-- the Colab Lab V3 schema and RPC definitions.
--
-- Do not delete or rename this file unless production migration history is repaired in a
-- coordinated database maintenance operation.

select 1;
