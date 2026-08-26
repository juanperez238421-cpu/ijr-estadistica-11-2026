-- Python Learning Hub V20
-- Teacher-issued, one-time, 10-minute device recovery. This replaces a reusable student PIN.

create table if not exists private.python_hub_recovery_tokens (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.python_hub_registrations(id) on delete cascade,
  token_hash text not null unique,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  redeemed_at timestamptz null,
  revoked_at timestamptz null
);

revoke all on table private.python_hub_recovery_tokens from public, anon, authenticated;

create index if not exists python_hub_recovery_tokens_registration_idx
on private.python_hub_recovery_tokens(registration_id, created_at desc);

create or replace function public.python_hub_teacher_issue_recovery_v1(p_registration_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, private, auth, extensions, pg_catalog
as $$
declare
  v_token text;
  v_expires timestamptz;
  v_registration public.python_hub_registrations%rowtype;
begin
  if not private.is_teacher_aal2() then raise exception 'Teacher MFA session required'; end if;

  select * into v_registration
  from public.python_hub_registrations
  where id=p_registration_id and status<>'disabled';
  if v_registration.id is null then raise exception 'Registration not found'; end if;

  update private.python_hub_recovery_tokens
  set revoked_at=clock_timestamp()
  where registration_id=p_registration_id
    and redeemed_at is null and revoked_at is null and expires_at>clock_timestamp();

  v_token:=upper(substr(encode(gen_random_bytes(18),'hex'),1,24));
  v_expires:=clock_timestamp()+interval '10 minutes';

  insert into private.python_hub_recovery_tokens(registration_id,token_hash,created_by,expires_at)
  values(p_registration_id,encode(digest(v_token,'sha256'),'hex'),auth.uid(),v_expires);

  return jsonb_build_object(
    'registration_id',p_registration_id,
    'recovery_token',v_token,
    'expires_at',v_expires,
    'group_code',v_registration.group_code,
    'display_label',v_registration.display_label
  );
end;
$$;

revoke all on function public.python_hub_teacher_issue_recovery_v1(uuid) from public, anon;
grant execute on function public.python_hub_teacher_issue_recovery_v1(uuid) to authenticated;

create or replace function public.python_hub_recover_v1(
  p_recovery_token text,
  p_session_id uuid,
  p_user_agent text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions, pg_catalog
as $$
declare
  v_recovery private.python_hub_recovery_tokens%rowtype;
  v_registration public.python_hub_registrations%rowtype;
  v_access_token text;
begin
  if coalesce(trim(p_recovery_token),'')='' then
    raise exception 'Enter the one-time recovery token from your teacher';
  end if;

  select * into v_recovery
  from private.python_hub_recovery_tokens
  where token_hash=encode(digest(upper(trim(p_recovery_token)),'sha256'),'hex')
  for update;

  if v_recovery.id is null then raise exception 'Recovery token is invalid'; end if;
  if v_recovery.redeemed_at is not null then raise exception 'Recovery token has already been used'; end if;
  if v_recovery.revoked_at is not null then raise exception 'Recovery token has been revoked'; end if;
  if v_recovery.expires_at<=clock_timestamp() then raise exception 'Recovery token has expired'; end if;

  select * into v_registration
  from public.python_hub_registrations
  where id=v_recovery.registration_id
  for update;
  if v_registration.id is null or v_registration.status='disabled' then raise exception 'Registration is unavailable'; end if;

  v_access_token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  update public.python_hub_registrations
  set access_token_hash=encode(digest(v_access_token,'sha256'),'hex'),
      last_session_id=coalesce(p_session_id,gen_random_uuid()),
      user_agent=p_user_agent,
      last_activity_at=clock_timestamp()
  where id=v_registration.id;

  update private.python_hub_recovery_tokens
  set redeemed_at=clock_timestamp()
  where id=v_recovery.id;

  perform private.python_hub_refresh_v1(v_registration.id);

  return jsonb_build_object(
    'registration_id',v_registration.id,
    'access_token',v_access_token,
    'snapshot',public.python_hub_snapshot_v1(v_registration.id,v_access_token)
  );
end;
$$;

grant execute on function public.python_hub_recover_v1(text,uuid,text) to anon, authenticated;
