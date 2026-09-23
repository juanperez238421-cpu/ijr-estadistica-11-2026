create or replace function public.seminar_email_identity_v1(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_name text;
  v_group text;
begin
  if char_length(v_email) > 254
     or v_email !~ '^[^[:space:]@]+@ijr[.]edu[.]co$' then
    return jsonb_build_object('ok', false, 'error', 'institutional_email_required');
  end if;

  select coalesce(sr.display_name, psi.display_name), sr.group_code
    into v_name, v_group
  from public.python_hub_student_identities psi
  join public.student_registry sr on sr.id = psi.student_registry_id
  where lower(btrim(psi.institutional_email)) = v_email
    and sr.active is true
    and sr.group_code in ('11A','11B','11C','11-A','11-B','11-C')
  limit 1;

  if v_name is null or v_group is null then
    return jsonb_build_object('ok', false, 'error', 'institutional_email_not_registered');
  end if;

  return jsonb_build_object(
    'ok', true,
    'email', v_email,
    'display_name', v_name,
    'group_code',
      case v_group
        when '11A' then '11-A'
        when '11B' then '11-B'
        when '11C' then '11-C'
        else v_group
      end
  );
end;
$function$;

revoke all on function public.seminar_email_identity_v1(text) from public;
grant execute on function public.seminar_email_identity_v1(text) to anon, authenticated, service_role;

comment on function public.seminar_email_identity_v1(text) is
'Seminar 11 email-only classroom entry. Resolves an exact active Grade 11 institutional email to official display name and normalized group; does not expose roster enumeration.';
