create or replace function private.python_hub_ensure_participant_registration_v52(
  p_email text,
  p_group_code text,
  p_session_id uuid,
  p_user_agent text
) returns jsonb
language plpgsql
security definer
set search_path to 'public','private','extensions','pg_catalog'
as $function$
declare
  v_email text := lower(trim(coalesce(p_email,'')));
  v_group text := upper(trim(coalesce(p_group_code,'')));
  v_account public.python_hub_student_accounts%rowtype;
  v_registration public.python_hub_registrations%rowtype;
  v_registry_id uuid;
  v_identity_id uuid;
  v_display text;
  v_team_hash text;
  v_throwaway_token text;
begin
  if split_part(v_email,'@',2) <> 'ijr.edu.co' or split_part(v_email,'@',1) = '' then
    raise exception 'Every participant must use an @ijr.edu.co institutional email';
  end if;
  if v_group not in ('11A','11B','11C') then
    raise exception 'Workshop group must be 11A, 11B or 11C';
  end if;

  -- Existing authenticated metadata is optional and only reused when it already
  -- belongs to the selected class group. It is never an admission gate.
  select * into v_account
  from public.python_hub_student_accounts a
  where a.institutional_email = v_email
    and a.group_code = v_group
  limit 1;

  -- Roster resolution enriches names/IDs, but an absent roster match does not block access.
  v_registry_id := private.python_hub_resolve_roster_v26(v_email,v_group);

  if v_registry_id is not null then
    select s.display_name into v_display
    from public.student_registry s
    where s.id = v_registry_id and s.active = true and s.group_code = v_group;
  end if;
  v_display := coalesce(nullif(trim(v_display),''),nullif(trim(v_account.display_name),''),v_email);

  v_identity_id := private.python_hub_ensure_student_identity_v29(v_email,v_display,v_registry_id);
  v_team_hash := encode(digest(v_group||'|'||v_email,'sha256'),'hex');

  select * into v_registration
  from public.python_hub_registrations r
  where r.group_code = v_group and r.team_key_hash = v_team_hash
  for update;

  if v_registration.id is null then
    v_throwaway_token := replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
    insert into public.python_hub_registrations(
      registration_mode,group_code,team_key_hash,team_size,display_label,
      access_token_hash,progress_code_hash,last_session_id,user_agent,
      student_account_id,access_token_expires_at
    ) values(
      'individual',v_group,v_team_hash,1,v_email,
      encode(digest(v_throwaway_token,'sha256'),'hex'),null,coalesce(p_session_id,gen_random_uuid()),left(coalesce(p_user_agent,''),1000),
      v_account.id,clock_timestamp()
    ) returning * into v_registration;
  else
    if v_registration.status = 'disabled' then
      raise exception 'The learning account for % is disabled',v_email;
    end if;
    if v_registration.registration_mode <> 'individual' or v_registration.team_size <> 1 then
      raise exception 'The learning registration for % is not an individual account',v_email;
    end if;
    if v_account.id is not null and v_registration.student_account_id is not null and v_registration.student_account_id <> v_account.id then
      raise exception 'Institutional account conflict for %',v_email;
    end if;

    update public.python_hub_registrations
    set display_label = v_email,
        student_account_id = coalesce(student_account_id,v_account.id),
        last_activity_at = clock_timestamp()
    where id = v_registration.id
    returning * into v_registration;
  end if;

  insert into public.python_hub_registration_members(
    registration_id,member_order,institutional_email,email_normalized,display_name,
    student_registry_id,student_identity_id
  ) values(
    v_registration.id,1,v_email,v_email,v_display,v_registry_id,v_identity_id
  )
  on conflict (registration_id,member_order) do update
  set institutional_email = excluded.institutional_email,
      email_normalized = excluded.email_normalized,
      display_name = excluded.display_name,
      student_registry_id = coalesce(excluded.student_registry_id,public.python_hub_registration_members.student_registry_id),
      student_identity_id = coalesce(excluded.student_identity_id,public.python_hub_registration_members.student_identity_id);

  perform private.python_hub_refresh_v1(v_registration.id);

  return jsonb_build_object(
    'institutional_email',v_email,
    'display_name',v_display,
    'student_registry_id',v_registry_id,
    'student_identity_id',v_identity_id,
    'participant_registration_id',v_registration.id
  );
end;
$function$;

create or replace function private.python_hub_ensure_participant_registration_v49(
  p_email text,
  p_group_code text,
  p_session_id uuid,
  p_user_agent text
) returns jsonb
language sql
security definer
set search_path to 'public','private','extensions','pg_catalog'
as $function$
  select private.python_hub_ensure_participant_registration_v52(
    p_email,
    p_group_code,
    p_session_id,
    p_user_agent
  );
$function$;
