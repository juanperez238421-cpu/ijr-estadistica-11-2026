-- Statistics 11 · Python Hub · Student password authentication v31
-- Purpose:
-- 1) Make Supabase Auth the required entry gate for new/returning students.
-- 2) Preserve the existing Python Hub registration/progress model after authentication.
-- 3) Preserve stable student identity progress when an authenticated account is attached.
-- 4) Disable the legacy anonymous registration-creation RPC so the password gate cannot be bypassed.
--
-- IMPORTANT PRIVACY NOTE:
-- Government/personal identification numbers (TI / cedula / document numbers) are intentionally
-- NOT stored or used as passwords. Supabase Auth stores password hashes; the Hub receives only
-- the authenticated user identity through auth.uid()/auth.jwt().

create or replace function public.python_hub_student_account_v1(
  p_group_code text,
  p_session_id uuid,
  p_user_agent text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, auth, extensions, pg_catalog
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  v_group text := upper(trim(coalesce(p_group_code,'')));
  v_email_confirmed_at timestamptz;
  v_known_group text;
  v_known_group_count integer;
  v_student_id uuid;
  v_display text;
  v_identity_status text;
  v_identity_id uuid;
  v_account public.python_hub_student_accounts%rowtype;
  v_registration public.python_hub_registrations%rowtype;
  v_team_hash text;
  v_token text;
  v_expires timestamptz;
begin
  if v_uid is null then
    raise exception 'Sign in with your institutional email and password first';
  end if;

  if coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception 'Anonymous accounts are not allowed';
  end if;

  select u.email_confirmed_at
  into v_email_confirmed_at
  from auth.users u
  where u.id=v_uid;

  if v_email_confirmed_at is null then
    raise exception 'Confirm your institutional email before entering the Learning Hub';
  end if;

  if split_part(v_email,'@',2)<>'ijr.edu.co' or split_part(v_email,'@',1)='' then
    raise exception 'Use and verify your @ijr.edu.co institutional email account';
  end if;

  if v_group not in ('11A','11B','11C') then
    raise exception 'Select 11A, 11B or 11C';
  end if;

  select count(distinct s.group_code), max(s.group_code)
  into v_known_group_count,v_known_group
  from public.learning_activity_attempt_members m
  join public.student_registry s on s.id=m.student_registry_id and s.active=true
  where m.student_registry_id is not null
    and m.is_roster_match=true
    and lower(trim(coalesce(m.email_normalized,m.institutional_email,'')))=v_email
    and s.group_code in ('11A','11B','11C');

  if v_known_group_count=1 and v_known_group<>v_group then
    raise exception 'This verified institutional account is linked to group %. Select that group.',v_known_group;
  end if;

  v_student_id:=private.python_hub_resolve_roster_v26(v_email,v_group);
  if v_student_id is not null then
    select display_name into v_display
    from public.student_registry
    where id=v_student_id;
    v_identity_status:='verified_roster';
  elsif v_known_group_count>1 then
    v_display:=v_email;
    v_identity_status:='verified_email_ambiguous';
  else
    v_display:=v_email;
    v_identity_status:='verified_email';
  end if;

  select * into v_account
  from public.python_hub_student_accounts a
  where a.auth_user_id=v_uid or a.institutional_email=v_email
  order by (a.auth_user_id=v_uid) desc
  limit 1
  for update;

  if v_account.id is not null then
    if v_account.auth_user_id<>v_uid or v_account.institutional_email<>v_email then
      raise exception 'Institutional account identity conflict. Ask the teacher to review the account.';
    end if;
    if v_account.group_code<>v_group then
      raise exception 'This institutional account is already registered in group %',v_account.group_code;
    end if;

    update public.python_hub_student_accounts
    set student_registry_id=coalesce(v_student_id,student_registry_id),
        display_name=case when v_student_id is not null then v_display else display_name end,
        identity_status=case when v_student_id is not null then 'verified_roster' else identity_status end,
        last_verified_at=clock_timestamp(),
        updated_at=clock_timestamp()
    where id=v_account.id
    returning * into v_account;
  else
    insert into public.python_hub_student_accounts(
      auth_user_id,institutional_email,group_code,student_registry_id,display_name,identity_status
    ) values(
      v_uid,v_email,v_group,v_student_id,v_display,v_identity_status
    )
    returning * into v_account;
  end if;

  -- Ensure the identity-progress layer is attached to authenticated accounts as well.
  v_identity_id:=private.python_hub_ensure_student_identity_v29(
    v_email,
    v_account.display_name,
    v_account.student_registry_id
  );

  v_team_hash:=encode(digest(v_group||'|'||v_email,'sha256'),'hex');

  select * into v_registration
  from public.python_hub_registrations r
  where r.group_code=v_group and r.team_key_hash=v_team_hash
  for update;

  if v_registration.id is null then
    v_token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
    v_expires:=clock_timestamp()+interval '4 hours';

    insert into public.python_hub_registrations(
      registration_mode,group_code,team_key_hash,team_size,display_label,
      access_token_hash,progress_code_hash,last_session_id,user_agent,
      student_account_id,access_token_expires_at
    ) values(
      'individual',v_group,v_team_hash,1,v_email,
      encode(digest(v_token,'sha256'),'hex'),null,coalesce(p_session_id,gen_random_uuid()),left(coalesce(p_user_agent,''),1000),
      v_account.id,v_expires
    )
    returning * into v_registration;
  else
    if v_registration.status='disabled' then
      raise exception 'This learning account is disabled';
    end if;
    if v_registration.registration_mode<>'individual' or v_registration.team_size<>1 then
      raise exception 'Existing registration is not an individual account. Ask the teacher to review it.';
    end if;
    if v_registration.student_account_id is not null and v_registration.student_account_id<>v_account.id then
      raise exception 'Registration identity conflict. Ask the teacher to review it.';
    end if;

    v_token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
    v_expires:=clock_timestamp()+interval '4 hours';

    update public.python_hub_registrations
    set display_label=v_email,
        student_account_id=v_account.id,
        access_token_hash=encode(digest(v_token,'sha256'),'hex'),
        access_token_expires_at=v_expires,
        last_session_id=coalesce(p_session_id,gen_random_uuid()),
        user_agent=left(coalesce(p_user_agent,''),1000),
        last_activity_at=clock_timestamp()
    where id=v_registration.id
    returning * into v_registration;
  end if;

  insert into public.python_hub_registration_members(
    registration_id,member_order,institutional_email,email_normalized,display_name,
    student_registry_id,student_identity_id
  ) values(
    v_registration.id,1,v_email,v_email,v_account.display_name,
    v_account.student_registry_id,v_identity_id
  )
  on conflict (registration_id,member_order) do update
  set institutional_email=excluded.institutional_email,
      email_normalized=excluded.email_normalized,
      display_name=excluded.display_name,
      student_registry_id=excluded.student_registry_id,
      student_identity_id=excluded.student_identity_id;

  insert into private.python_hub_student_login_audit(
    auth_user_id,institutional_email,group_code,student_registry_id,student_account_id,
    registration_id,identity_status,session_id,ip_hash,user_agent
  ) values(
    v_uid,v_email,v_group,v_account.student_registry_id,v_account.id,
    v_registration.id,v_account.identity_status,p_session_id,public.request_ip_hash(),left(coalesce(p_user_agent,''),1000)
  );

  perform private.python_hub_refresh_v1(v_registration.id);

  return jsonb_build_object(
    'student_account_id',v_account.id,
    'institutional_email',v_email,
    'identity_status',v_account.identity_status,
    'registration_id',v_registration.id,
    'access_token',v_token,
    'access_token_expires_at',v_expires,
    'snapshot',public.python_hub_snapshot_v1(v_registration.id,v_token)
  );
end;
$$;

comment on function public.python_hub_student_account_v1(text,uuid,text)
is 'Authenticated Statistics 11 student entry. Requires a confirmed @ijr.edu.co Supabase Auth account and creates/rotates the short-lived Python Hub registration token.';

-- Supabase Auth is now the only normal way to create a Python Hub student registration.
-- Keep the legacy function for administrative compatibility, but remove browser execution.
revoke execute on function public.python_hub_register_v3(text,text,jsonb,uuid,text) from public;
revoke execute on function public.python_hub_register_v3(text,text,jsonb,uuid,text) from anon;
revoke execute on function public.python_hub_register_v3(text,text,jsonb,uuid,text) from authenticated;
grant execute on function public.python_hub_register_v3(text,text,jsonb,uuid,text) to service_role;

revoke execute on function public.python_hub_student_account_v1(text,uuid,text) from public;
revoke execute on function public.python_hub_student_account_v1(text,uuid,text) from anon;
grant execute on function public.python_hub_student_account_v1(text,uuid,text) to authenticated, service_role;
