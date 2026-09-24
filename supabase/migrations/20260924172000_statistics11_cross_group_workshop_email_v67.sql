-- Statistics 11 workshop V67
-- Allow a workshop team to include students from any 11th-grade group.
-- The active workstation/session keeps its context group, while each institutional
-- email is resolved to its canonical roster identity without rejecting 11A/11B/11C
-- cross-group combinations.

create or replace function private.python_hub_resolve_roster_any_group_v67(
  p_email text
) returns uuid
language plpgsql
stable
security definer
set search_path to 'public','private','pg_catalog'
as $function$
declare
  v_email text := lower(trim(coalesce(p_email,'')));
  v_id uuid;
  v_count integer;
  v_local text;
  v_parts text[];
  v_p1 text;
  v_p2 text;
begin
  if split_part(v_email,'@',2) <> 'ijr.edu.co'
     or split_part(v_email,'@',1) = '' then
    return null;
  end if;

  -- 1) Canonical reviewed identity, regardless of class group.
  select i.student_registry_id
    into v_id
  from public.python_hub_student_identities i
  join public.student_registry s
    on s.id=i.student_registry_id
   and s.active=true
   and s.group_code in ('11A','11B','11C')
  where lower(trim(i.institutional_email))=v_email
    and i.student_registry_id is not null
  limit 1;

  if v_id is not null then
    return v_id;
  end if;

  -- 2) Verified account metadata, regardless of class group.
  select a.student_registry_id
    into v_id
  from public.python_hub_student_accounts a
  join public.student_registry s
    on s.id=a.student_registry_id
   and s.active=true
   and s.group_code in ('11A','11B','11C')
  where lower(trim(a.institutional_email))=v_email
    and a.student_registry_id is not null
  order by a.last_verified_at desc nulls last
  limit 1;

  if v_id is not null then
    return v_id;
  end if;

  -- 3) Exact historical identity evidence. Accept only one unique roster match.
  with evidence as (
    select m.student_registry_id
    from public.learning_activity_attempt_members m
    where m.student_registry_id is not null
      and m.is_roster_match=true
      and lower(trim(coalesce(m.email_normalized,m.institutional_email,'')))=v_email

    union all

    select a.student_registry_id
    from public.attempts a
    where a.student_registry_id is not null
      and lower(trim(coalesce(a.student_email_normalized,a.student_email,'')))=v_email

    union all

    select m.student_registry_id
    from public.python_hub_registration_members m
    where m.student_registry_id is not null
      and lower(trim(m.institutional_email))=v_email

    union all

    select m.student_registry_id
    from public.python_hub_workshop_session_members m
    where m.student_registry_id is not null
      and lower(trim(coalesce(m.email_normalized,m.institutional_email,'')))=v_email
  ),
  valid as (
    select distinct e.student_registry_id
    from evidence e
    join public.student_registry s
      on s.id=e.student_registry_id
     and s.active=true
     and s.group_code in ('11A','11B','11C')
  )
  select count(*), max(student_registry_id::text)::uuid
    into v_count,v_id
  from valid;

  if v_count=1 then
    return v_id;
  elsif v_count>1 then
    return null;
  end if;

  -- 4) Deterministic institutional-email fallback across all 11th-grade groups.
  -- First and final local-part segments must both occur in exactly one roster name.
  v_local := split_part(v_email,'@',1);
  v_parts := string_to_array(v_local,'.');

  if array_length(v_parts,1) >= 2 then
    v_p1 := regexp_replace(
      translate(lower(v_parts[1]),'áéíóúüñ','aeiouun'),
      '[^a-z0-9]','','g'
    );
    v_p2 := regexp_replace(
      translate(lower(v_parts[array_length(v_parts,1)]),'áéíóúüñ','aeiouun'),
      '[^a-z0-9]','','g'
    );

    if length(v_p1)>=3 and length(v_p2)>=3 then
      with roster_match as (
        select
          s.id,
          regexp_replace(
            translate(lower(s.display_name),'áéíóúüñ','aeiouun'),
            '[^a-z0-9]','','g'
          ) as compact_name
        from public.student_registry s
        where s.active=true
          and s.group_code in ('11A','11B','11C')
      ),
      matched as (
        select id
        from roster_match
        where compact_name like '%'||v_p1||'%'
          and compact_name like '%'||v_p2||'%'
      )
      select count(*), max(id::text)::uuid
        into v_count,v_id
      from matched;

      if v_count=1 then
        return v_id;
      end if;
    end if;
  end if;

  return null;
end;
$function$;

revoke all on function private.python_hub_resolve_roster_any_group_v67(text) from public;

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
  -- Context group of the active workstation. This is intentionally kept on the
  -- shadow participant registration so the workshop-session integrity invariant
  -- remains intact even when the student's real roster group is different.
  v_group text := upper(trim(coalesce(p_group_code,'')));
  v_account public.python_hub_student_accounts%rowtype;
  v_registration public.python_hub_registrations%rowtype;
  v_registry_id uuid;
  v_identity_id uuid;
  v_display text;
  v_roster_group text;
  v_team_hash text;
  v_throwaway_token text;
begin
  if split_part(v_email,'@',2) <> 'ijr.edu.co'
     or split_part(v_email,'@',1) = '' then
    raise exception 'Every participant must use an @ijr.edu.co institutional email';
  end if;

  if v_group not in ('11A','11B','11C') then
    raise exception 'Workshop group must be 11A, 11B or 11C';
  end if;

  -- A workshop teammate is admitted by institutional email, not by the active
  -- computer's class group. Resolve canonical roster identity across 11A/11B/11C.
  v_registry_id := private.python_hub_resolve_roster_any_group_v67(v_email);

  -- Reuse authenticated account metadata only when it already belongs to the
  -- workstation context group. Cross-group account metadata is not required for
  -- admission and does not become a conflicting foreign-key association.
  select * into v_account
  from public.python_hub_student_accounts a
  where a.institutional_email = v_email
    and a.group_code = v_group
  order by a.last_verified_at desc nulls last
  limit 1;

  if v_registry_id is not null then
    select s.display_name,s.group_code
      into v_display,v_roster_group
    from public.student_registry s
    where s.id=v_registry_id
      and s.active=true;
  end if;

  v_display := coalesce(
    nullif(trim(v_display),''),
    nullif(trim(v_account.display_name),''),
    v_email
  );

  v_identity_id := private.python_hub_ensure_student_identity_v29(
    v_email,
    v_display,
    v_registry_id
  );

  -- Keep one session-local participant registration per context group/email.
  -- The canonical identity/roster IDs above preserve the student's real group
  -- for durable progress credit and teacher analytics.
  v_team_hash := encode(digest(v_group||'|'||v_email,'sha256'),'hex');

  select * into v_registration
  from public.python_hub_registrations r
  where r.group_code=v_group
    and r.team_key_hash=v_team_hash
  for update;

  if v_registration.id is null then
    v_throwaway_token :=
      replace(gen_random_uuid()::text,'-','')||
      replace(gen_random_uuid()::text,'-','');

    insert into public.python_hub_registrations(
      registration_mode,
      group_code,
      team_key_hash,
      team_size,
      display_label,
      access_token_hash,
      progress_code_hash,
      last_session_id,
      user_agent,
      student_account_id,
      access_token_expires_at
    ) values(
      'individual',
      v_group,
      v_team_hash,
      1,
      v_email,
      encode(digest(v_throwaway_token,'sha256'),'hex'),
      null,
      coalesce(p_session_id,gen_random_uuid()),
      left(coalesce(p_user_agent,''),1000),
      v_account.id,
      clock_timestamp()
    )
    returning * into v_registration;
  else
    if v_registration.status='disabled' then
      raise exception 'The learning account for % is disabled',v_email;
    end if;

    if v_registration.registration_mode<>'individual'
       or v_registration.team_size<>1 then
      raise exception 'The learning registration for % is not an individual account',v_email;
    end if;

    if v_account.id is not null
       and v_registration.student_account_id is not null
       and v_registration.student_account_id<>v_account.id then
      raise exception 'Institutional account conflict for %',v_email;
    end if;

    update public.python_hub_registrations
    set display_label=v_email,
        student_account_id=coalesce(student_account_id,v_account.id),
        last_activity_at=clock_timestamp()
    where id=v_registration.id
    returning * into v_registration;
  end if;

  insert into public.python_hub_registration_members(
    registration_id,
    member_order,
    institutional_email,
    email_normalized,
    display_name,
    student_registry_id,
    student_identity_id
  ) values(
    v_registration.id,
    1,
    v_email,
    v_email,
    v_display,
    v_registry_id,
    v_identity_id
  )
  on conflict (registration_id,member_order) do update
  set institutional_email=excluded.institutional_email,
      email_normalized=excluded.email_normalized,
      display_name=excluded.display_name,
      student_registry_id=coalesce(
        excluded.student_registry_id,
        public.python_hub_registration_members.student_registry_id
      ),
      student_identity_id=coalesce(
        excluded.student_identity_id,
        public.python_hub_registration_members.student_identity_id
      );

  perform private.python_hub_refresh_v1(v_registration.id);

  return jsonb_build_object(
    'institutional_email',v_email,
    'display_name',v_display,
    'student_registry_id',v_registry_id,
    'student_identity_id',v_identity_id,
    'roster_group_code',v_roster_group,
    'participant_registration_id',v_registration.id
  );
end;
$function$;

revoke all on function private.python_hub_ensure_participant_registration_v52(text,text,uuid,text) from public;

comment on function private.python_hub_ensure_participant_registration_v52(text,text,uuid,text)
is 'Workshop participant registration. Any valid @ijr.edu.co email may join a 1-3 student team regardless of 11A/11B/11C roster group; the session-local registration keeps the workstation context group while canonical identity/roster IDs preserve the student real group.';
