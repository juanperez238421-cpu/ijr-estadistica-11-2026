-- Statistics 11 · real roster identity resolution v53
-- Mirrors production migration 20260918000607.
-- Purpose: keep workshop activity attributable to the official roster even when
-- earlier Hub records stored only the institutional email.
--
-- Resolution order:
-- 1) persisted Hub identity
-- 2) verified Hub account
-- 3) historical exact-email roster evidence
-- 4) deterministic first/final institutional-email segments against one unique roster name
--
-- A group mismatch is rejected instead of silently attributing work to the wrong class.

create or replace function private.python_hub_resolve_roster_v26(p_email text, p_group_code text)
returns uuid
language plpgsql
security definer
set search_path to 'public','private','pg_catalog'
as $function$
declare
  v_email text := lower(trim(coalesce(p_email,'')));
  v_group text := upper(trim(coalesce(p_group_code,'')));
  v_id uuid;
  v_match_group text;
  v_count integer;
  v_local text;
  v_parts text[];
  v_p1 text;
  v_p2 text;
begin
  if split_part(v_email,'@',2) <> 'ijr.edu.co' or split_part(v_email,'@',1) = '' then
    return null;
  end if;

  if v_group not in ('11A','11B','11C') then
    return null;
  end if;

  select i.student_registry_id, s.group_code
  into v_id, v_match_group
  from public.python_hub_student_identities i
  join public.student_registry s
    on s.id=i.student_registry_id
   and s.active=true
  where lower(trim(i.institutional_email))=v_email
    and i.student_registry_id is not null
  limit 1;

  if v_id is not null then
    if v_match_group <> v_group then
      raise exception 'This institutional email belongs to group %. Select that group.', v_match_group;
    end if;
    return v_id;
  end if;

  select a.student_registry_id, s.group_code
  into v_id, v_match_group
  from public.python_hub_student_accounts a
  join public.student_registry s
    on s.id=a.student_registry_id
   and s.active=true
  where lower(trim(a.institutional_email))=v_email
    and a.student_registry_id is not null
  order by a.last_verified_at desc nulls last
  limit 1;

  if v_id is not null then
    if v_match_group <> v_group then
      raise exception 'This institutional email belongs to group %. Select that group.', v_match_group;
    end if;
    return v_id;
  end if;

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
    select distinct e.student_registry_id, s.group_code
    from evidence e
    join public.student_registry s
      on s.id=e.student_registry_id
     and s.active=true
     and s.group_code in ('11A','11B','11C')
  )
  select count(*), max(student_registry_id::text)::uuid, max(group_code)
  into v_count, v_id, v_match_group
  from valid;

  if v_count=1 then
    if v_match_group <> v_group then
      raise exception 'This institutional email belongs to group %. Select that group.', v_match_group;
    end if;
    return v_id;
  elsif v_count>1 then
    return null;
  end if;

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
          s.group_code,
          regexp_replace(
            translate(lower(s.display_name),'áéíóúüñ','aeiouun'),
            '[^a-z0-9]','','g'
          ) as compact_name
        from public.student_registry s
        where s.active=true
          and s.group_code in ('11A','11B','11C')
      ),
      matched as (
        select id,group_code
        from roster_match
        where compact_name like '%'||v_p1||'%'
          and compact_name like '%'||v_p2||'%'
      )
      select count(*), max(id::text)::uuid, max(group_code)
      into v_count, v_id, v_match_group
      from matched;

      if v_count=1 then
        if v_match_group <> v_group then
          raise exception 'This institutional email belongs to group %. Select that group.', v_match_group;
        end if;
        return v_id;
      end if;
    end if;
  end if;

  return null;
end;
$function$;
