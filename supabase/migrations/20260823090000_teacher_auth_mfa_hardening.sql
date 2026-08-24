begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to postgres, service_role;

alter table public.teacher_code_sessions
  add column if not exists auth_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists auth_session_id uuid references auth.sessions(id) on delete cascade;

create unique index if not exists teacher_code_sessions_auth_session_uidx
  on public.teacher_code_sessions(auth_session_id)
  where auth_session_id is not null;

-- Invalidate every legacy teacher session, including already expired rows.
update public.teacher_code_sessions
set active = false,
    last_seen_at = clock_timestamp();

-- Revoke any Supabase Auth session that already belongs to a teacher/admin profile.
-- Requiring a live auth.sessions row below also invalidates access JWTs immediately.
delete from auth.sessions s
using public.profiles p
where p.auth_user_id = s.user_id
  and p.role in ('teacher', 'admin');

create table if not exists public.teacher_auth_gateway_audit (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default clock_timestamp(),
  auth_user_id uuid null references auth.users(id) on delete set null,
  auth_session_id uuid null,
  operation text not null,
  decision text not null check (decision in ('allow','deny','error')),
  reason text null,
  ip_hash text null,
  user_agent text null,
  request_id text null
);

alter table public.teacher_auth_gateway_audit enable row level security;
revoke all on table public.teacher_auth_gateway_audit from public, anon, authenticated;
revoke all on sequence public.teacher_auth_gateway_audit_id_seq from public, anon, authenticated;
grant select, insert on table public.teacher_auth_gateway_audit to service_role;
grant usage, select on sequence public.teacher_auth_gateway_audit_id_seq to service_role;

create or replace function private.is_teacher_aal2()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $function$
  select
    auth.uid() is not null
    and coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
    and exists (
      select 1
      from public.profiles p
      where p.auth_user_id = auth.uid()
        and p.active = true
        and p.role in ('teacher','admin')
    )
    and exists (
      select 1
      from auth.sessions s
      where s.id = case
        when coalesce(auth.jwt()->>'session_id','') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
          then (auth.jwt()->>'session_id')::uuid
        else null
      end
        and s.user_id = auth.uid()
        and s.aal::text = 'aal2'
        and (s.not_after is null or s.not_after > clock_timestamp())
    );
$function$;

revoke all on function private.is_teacher_aal2() from public, anon, authenticated;

create or replace function private.teacher_auth_session_id()
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $function$
declare
  v_auth_session_id uuid;
  v_teacher_session_id uuid;
  v_expires_at timestamptz;
  v_ip_hash text;
  v_user_agent text;
begin
  if not private.is_teacher_aal2() then
    return null;
  end if;

  v_auth_session_id := (auth.jwt()->>'session_id')::uuid;

  select
    coalesce(
      least(s.not_after, to_timestamp((auth.jwt()->>'exp')::bigint)),
      s.not_after,
      to_timestamp((auth.jwt()->>'exp')::bigint),
      clock_timestamp() + interval '1 hour'
    ),
    encode(extensions.digest(coalesce(s.ip::text,''), 'sha256'), 'hex'),
    left(coalesce(s.user_agent,''), 1000)
  into v_expires_at, v_ip_hash, v_user_agent
  from auth.sessions s
  where s.id = v_auth_session_id
    and s.user_id = auth.uid();

  insert into public.teacher_code_sessions(
    token_hash, expires_at, last_seen_at, ip_hash, user_agent,
    active, auth_user_id, auth_session_id
  ) values (
    encode(extensions.digest('supabase-auth:' || v_auth_session_id::text, 'sha256'), 'hex'),
    v_expires_at,
    clock_timestamp(),
    v_ip_hash,
    v_user_agent,
    true,
    auth.uid(),
    v_auth_session_id
  )
  on conflict (auth_session_id) where auth_session_id is not null
  do update set
    expires_at = excluded.expires_at,
    last_seen_at = excluded.last_seen_at,
    ip_hash = excluded.ip_hash,
    user_agent = excluded.user_agent,
    active = true
  returning id into v_teacher_session_id;

  return v_teacher_session_id;
end;
$function$;

revoke all on function private.teacher_auth_session_id() from public, anon, authenticated;

-- Compatibility wrapper: existing teacher RPC bodies keep their signatures, but the
-- supplied legacy token is ignored. Authorization now comes only from Auth + AAL2.
create or replace function public.teacher_code_session_id(p_token text)
returns uuid
language sql
security definer
set search_path = pg_catalog, private
as $function$
  select private.teacher_auth_session_id();
$function$;

revoke all on function public.teacher_code_session_id(text) from public, anon, authenticated;
grant execute on function public.teacher_code_session_id(text) to service_role;

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, private
as $function$
  select private.is_teacher_aal2();
$function$;

revoke all on function public.is_teacher() from public, anon;
grant execute on function public.is_teacher() to authenticated, service_role;

-- Remove the shared-code verifier and its digest from executable database code.
create or replace function public.teacher_code_login(p_code text, p_user_agent text default null)
returns jsonb
language sql
security definer
set search_path = pg_catalog
as $function$
  select jsonb_build_object('ok', false, 'error', 'legacy_teacher_code_disabled');
$function$;

create or replace function public.teacher_code_logout(p_teacher_token text)
returns jsonb
language sql
security definer
set search_path = pg_catalog
as $function$
  select jsonb_build_object('ok', true);
$function$;

revoke all on function public.teacher_code_login(text,text) from public, anon, authenticated;
revoke all on function public.teacher_code_logout(text) from public, anon, authenticated;
grant execute on function public.teacher_code_login(text,text) to service_role;
grant execute on function public.teacher_code_logout(text) to service_role;

-- Teacher/admin RPCs are available only to authenticated callers. Every body still
-- reaches teacher_code_session_id(), which enforces role, live session and AAL2.
do $block$
declare
  v_function regprocedure;
begin
  for v_function in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (
        p.proname like 'teacher_%'
        or p.proname = 'seminar_course_teacher_dashboard'
      )
      and p.proname not in ('teacher_code_login','teacher_code_logout','teacher_code_session_id')
  loop
    execute format('revoke all on function %s from public, anon', v_function);
    execute format('grant execute on function %s to authenticated, service_role', v_function);
  end loop;
end
$block$;

-- Trigger-only and operational helpers must never be callable by browser roles.
do $block$
declare
  v_function regprocedure;
begin
  for v_function in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'dispatch_assessment_email_outbox',
        'queue_assessment_email_report',
        'learning_activity_refresh_attempt_score',
        'request_ip_hash',
        'rls_auto_enable',
        'statistics11_assessment_health',
        'statistics11_english_content_health',
        'statistics11_runtime_smoke'
      )
  loop
    execute format('revoke all on function %s from public, anon, authenticated', v_function);
    execute format('grant execute on function %s to service_role', v_function);
  end loop;
end
$block$;

commit;
