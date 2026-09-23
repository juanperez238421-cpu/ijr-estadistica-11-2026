alter table public.seminar_course_attempts
  drop constraint if exists seminar_course_attempts_group_code_check;

alter table public.seminar_course_attempts
  add constraint seminar_course_attempts_group_code_check
  check (group_code in ('11-A','11-B','11-C','11-U'));

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
  limit 1;

  if v_name is null then
    return jsonb_build_object(
      'ok', true,
      'email', v_email,
      'display_name', v_email,
      'group_code', '11-U',
      'identity_status', 'institutional_email_lab'
    );
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
      end,
    'identity_status', 'roster_matched_lab'
  );
end;
$function$;

revoke all on function public.seminar_email_identity_v1(text) from public;
grant execute on function public.seminar_email_identity_v1(text) to anon, authenticated, service_role;

create or replace function public.seminar_oop_uml_start_email_v9(
  p_institutional_email text,
  p_language text default 'python',
  p_session_id uuid default gen_random_uuid(),
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_email text := lower(btrim(coalesce(p_institutional_email, '')));
  v_language text := lower(btrim(coalesce(p_language, 'python')));
  v_name text;
  v_group text;
  v_group_course text;
  v_registry_id uuid;
  v_result jsonb;
  v_attempt public.seminar_course_attempts%rowtype;
  v_token text;
  v_team_key text;
begin
  if v_email !~ '^[^[:space:]@]+@ijr[.]edu[.]co$' then
    raise exception 'institutional_email_required';
  end if;

  if v_language not in ('python','java') then
    raise exception 'invalid_language';
  end if;

  select psi.student_registry_id,
         coalesce(sr.display_name, psi.display_name),
         sr.group_code
    into v_registry_id, v_name, v_group
  from public.python_hub_student_identities psi
  join public.student_registry sr on sr.id = psi.student_registry_id
  where lower(btrim(psi.institutional_email)) = v_email
    and sr.active is true
  limit 1;

  if v_registry_id is not null then
    v_group_course := case v_group
      when '11A' then '11-A'
      when '11B' then '11-B'
      when '11C' then '11-C'
      else v_group
    end;

    if v_group_course in ('11-A','11-B','11-C') then
      v_result := public.seminar_course_start_team(
        'seminario-programacion-t3-2026',
        v_language,
        jsonb_build_array(v_name),
        v_group_course,
        coalesce(p_session_id, gen_random_uuid()),
        p_user_agent
      );

      return v_result || jsonb_build_object(
        'institutional_email', v_email,
        'student_registry_id', v_registry_id,
        'identity_status', 'roster_matched_lab'
      );
    end if;
  end if;

  v_group_course := '11-U';
  v_name := v_email;
  v_team_key := encode(extensions.digest(v_email, 'sha256'), 'hex');
  v_token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');

  select * into v_attempt
  from public.seminar_course_attempts
  where course_slug = 'seminario-programacion-t3-2026'
    and language = v_language
    and group_code = v_group_course
    and team_key = v_team_key
  order by started_at desc
  limit 1;

  if v_attempt.id is null then
    insert into public.seminar_course_attempts(
      course_slug, language, group_code, team_key, team_label, team_size,
      session_id, access_token_hash, user_agent
    ) values (
      'seminario-programacion-t3-2026', v_language, v_group_course, v_team_key, v_email, 1,
      coalesce(p_session_id, gen_random_uuid()),
      encode(extensions.digest(v_token,'sha256'),'hex'),
      left(coalesce(p_user_agent,''),1000)
    )
    returning * into v_attempt;
  else
    update public.seminar_course_attempts
    set team_label = v_email,
        access_token_hash = encode(extensions.digest(v_token,'sha256'),'hex'),
        last_activity_at = clock_timestamp(),
        session_id = coalesce(p_session_id, session_id),
        user_agent = left(coalesce(p_user_agent,user_agent,''),1000)
    where id = v_attempt.id
    returning * into v_attempt;

    delete from public.seminar_course_attempt_members where attempt_id = v_attempt.id;
  end if;

  insert into public.seminar_course_attempt_members(
    attempt_id, member_order, display_name, normalized_name, student_registry_id, is_roster_match
  ) values (
    v_attempt.id, 1, v_email, v_email, null, false
  );

  insert into public.seminar_course_events(attempt_id,event_type,metadata)
  values(
    v_attempt.id,
    'EMAIL_SESSION_STARTED',
    jsonb_build_object(
      'language', v_language,
      'group_code', v_group_course,
      'identity_mode', 'institutional_email_lab'
    )
  );

  return jsonb_build_object(
    'attempt_id', v_attempt.id,
    'attempt_token', v_token,
    'snapshot', public.seminar_course_snapshot(v_attempt.id, v_token),
    'institutional_email', v_email,
    'student_registry_id', null,
    'identity_status', 'institutional_email_lab'
  );
end;
$function$;

revoke all on function public.seminar_oop_uml_start_email_v9(text,text,uuid,text) from public;
grant execute on function public.seminar_oop_uml_start_email_v9(text,text,uuid,text)
  to anon, authenticated, service_role;
