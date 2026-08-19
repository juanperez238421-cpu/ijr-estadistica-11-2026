-- Remote migration history anchor.
-- Version 20260819180417 already exists as APPLIED in the production Supabase project,
-- but its migration file was missing from Git. This no-op file restores local/remote
-- version parity so `supabase db push --include-all` can safely continue.
--
-- No schema operation is intentionally repeated here: production already contains
-- the effects associated with this historical version.
select 1;
