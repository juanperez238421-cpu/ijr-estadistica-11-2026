create or replace function public.seminar_oop_uml_start_email_v10(
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
  v_oop_count integer := 0;
  v_module_count integer := 0;
begin
  if char_length(v_email) > 254
     or v_email !~ '^[^[:space:]@]+@ijr[.]edu[.]co$' then
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
  order by psi.updated_at desc
  limit 1;

  if v_registry_id is not null then
    v_group_course := case v_group
      when '11A' then '11-A'
      when '11B' then '11-B'
      when '11C' then '11-C'
      else v_group
    end;

    if v_group_course in ('11-A','11-B','11-C') then
      select a.*
        into v_attempt
      from public.seminar_course_attempts a
      join public.seminar_course_attempt_members m on m.attempt_id = a.id
      where m.student_registry_id = v_registry_id
        and a.course_slug = 'seminario-programacion-t3-2026'
        and a.language = v_language
      order by
        (select count(*) from public.seminar_oop_uml_session_records os where os.attempt_id = a.id) desc,
        (select count(*) from public.seminar_course_module_records mr where mr.attempt_id = a.id) desc,
        greatest(
          coalesce((select max(os.updated_at) from public.seminar_oop_uml_session_records os where os.attempt_id = a.id), '-infinity'::timestamptz),
          coalesce((select max(mr.updated_at) from public.seminar_course_module_records mr where mr.attempt_id = a.id), '-infinity'::timestamptz),
          a.last_activity_at
        ) desc,
        a.started_at desc
      limit 1;

      if v_attempt.id is not null then
        v_token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');

        update public.seminar_course_attempts
        set access_token_hash = encode(extensions.digest(v_token,'sha256'),'hex'),
            last_activity_at = clock_timestamp(),
            session_id = coalesce(p_session_id, session_id),
            user_agent = left(coalesce(p_user_agent,user_agent,''),1000)
        where id = v_attempt.id
        returning * into v_attempt;

        select count(*) into v_oop_count
        from public.seminar_oop_uml_session_records
        where attempt_id = v_attempt.id;

        select count(*) into v_module_count
        from public.seminar_course_module_records
        where attempt_id = v_attempt.id;

        insert into public.seminar_course_events(attempt_id,event_type,metadata)
        values(
          v_attempt.id,
          'EMAIL_SESSION_RESUMED',
          jsonb_build_object(
            'language', v_language,
            'group_code', v_attempt.group_code,
            'identity_mode', 'roster_canonical_resume',
            'student_registry_id', v_registry_id,
            'oop_session_count', v_oop_count,
            'course_module_count', v_module_count,
            'preserved_team_size', v_attempt.team_size
          )
        );

        return jsonb_build_object(
          'attempt_id', v_attempt.id,
          'attempt_token', v_token,
          'snapshot', public.seminar_course_snapshot(v_attempt.id, v_token),
          'institutional_email', v_email,
          'student_registry_id', v_registry_id,
          'identity_status', 'roster_matched_canonical_resume',
          'reused_attempt', true,
          'oop_session_count', v_oop_count,
          'course_module_count', v_module_count
        );
      end if;

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
        'identity_status', 'roster_matched_new',
        'reused_attempt', false,
        'oop_session_count', 0,
        'course_module_count', 0
      );
    end if;
  end if;

  v_group_course := '11-U';
  v_name := v_email;
  v_team_key := encode(extensions.digest(v_email, 'sha256'), 'hex');
  v_token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');

  select *
    into v_attempt
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

    delete from public.seminar_course_attempt_members
    where attempt_id = v_attempt.id;
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
    'identity_status', 'institutional_email_lab',
    'reused_attempt', true
  );
end;
$function$;

revoke all on function public.seminar_oop_uml_start_email_v10(text,text,uuid,text) from public;
grant execute on function public.seminar_oop_uml_start_email_v10(text,text,uuid,text)
  to anon, authenticated, service_role;

create or replace function public.seminar_master_dashboard_v3()
returns jsonb
language sql
stable
set search_path = 'public'
as $function$
with base as (
  select public.seminar_master_dashboard_v2() as payload
),
fixed_students as (
  select
    s as student_json,
    (
      select jsonb_build_object(
        'attempt_id',a.id,
        'group_code',a.group_code,
        'language',a.language,
        'team_label',a.team_label,
        'team_size',a.team_size,
        'status',a.status,
        'started_at',a.started_at,
        'last_activity_at',a.last_activity_at,
        'submitted_at',a.submitted_at,
        'restriction_events',a.restriction_events,
        'completed_count',calc.completed_count,
        'solved_count',calc.solved_count,
        'helps',calc.helps,
        'wrongs',calc.wrongs,
        'revealed',calc.revealed,
        'skipped',calc.skipped,
        'projected_grade',public.seminar_course_grade(calc.projected_points),
        'final_grade',case when a.status='submitted' then public.seminar_course_grade(calc.awarded_points) else null end,
        'oop_session_count',(select count(*) from public.seminar_oop_uml_session_records os where os.attempt_id=a.id),
        'selection_mode','canonical_progress_preserved',
        'modules',(
          select coalesce(jsonb_agg(jsonb_build_object(
            'module_key',mr.module_key,
            'completion_mode',mr.completion_mode,
            'help_count',mr.help_count,
            'wrong_count',mr.wrong_count,
            'awarded_points',mr.awarded_points,
            'updated_at',mr.updated_at,
            'completed_at',mr.completed_at
          ) order by mr.module_key),'[]'::jsonb)
          from public.seminar_course_module_records mr
          where mr.attempt_id=a.id
        )
      )
      from public.seminar_course_attempt_members m
      join public.seminar_course_attempts a on a.id=m.attempt_id
      cross join lateral public.seminar_course_calc(a.id) calc
      where m.student_registry_id=(s->>'student_registry_id')::uuid
        and a.course_slug='seminario-programacion-t3-2026'
      order by
        (select count(*) from public.seminar_oop_uml_session_records os where os.attempt_id=a.id) desc,
        calc.completed_count desc,
        (select count(*) from public.seminar_course_module_records mr where mr.attempt_id=a.id) desc,
        greatest(
          coalesce((select max(os.updated_at) from public.seminar_oop_uml_session_records os where os.attempt_id=a.id), '-infinity'::timestamptz),
          coalesce((select max(mr.updated_at) from public.seminar_course_module_records mr where mr.attempt_id=a.id), '-infinity'::timestamptz),
          a.last_activity_at
        ) desc,
        a.started_at desc
      limit 1
    ) as canonical_course
  from base, jsonb_array_elements(base.payload->'students') s
),
students_payload as (
  select coalesce(
    jsonb_agg(
      case
        when canonical_course is null then student_json
        else jsonb_set(student_json,'{course}',canonical_course,true)
      end
      order by student_json->>'group_code', (student_json->>'source_position')::integer
    ),
    '[]'::jsonb
  ) as students
  from fixed_students
),
quality_patch as (
  select jsonb_build_object(
    'duplicate_active_course_students',(
      select count(*)
      from (
        select m.student_registry_id,a.language
        from public.seminar_course_attempt_members m
        join public.seminar_course_attempts a on a.id=m.attempt_id
        where a.course_slug='seminario-programacion-t3-2026'
          and a.status='active'
          and m.student_registry_id is not null
          and (
            exists(select 1 from public.seminar_oop_uml_session_records os where os.attempt_id=a.id)
            or exists(select 1 from public.seminar_course_module_records mr where mr.attempt_id=a.id)
          )
        group by m.student_registry_id,a.language
        having count(distinct a.id)>1
      ) d
    ),
    'empty_shadow_course_attempts',(
      select count(distinct a.id)
      from public.seminar_course_attempts a
      join public.seminar_course_attempt_members m on m.attempt_id=a.id
      where a.course_slug='seminario-programacion-t3-2026'
        and a.status='active'
        and m.student_registry_id is not null
        and not exists(select 1 from public.seminar_oop_uml_session_records os where os.attempt_id=a.id)
        and not exists(select 1 from public.seminar_course_module_records mr where mr.attempt_id=a.id)
        and exists(
          select 1
          from public.seminar_course_attempt_members m2
          join public.seminar_course_attempts a2 on a2.id=m2.attempt_id
          where m2.student_registry_id=m.student_registry_id
            and a2.language=a.language
            and a2.course_slug=a.course_slug
            and a2.id<>a.id
            and (
              exists(select 1 from public.seminar_oop_uml_session_records os2 where os2.attempt_id=a2.id)
              or exists(select 1 from public.seminar_course_module_records mr2 where mr2.attempt_id=a2.id)
            )
        )
    )
  ) as patch
)
select
  (base.payload - 'students' - 'data_quality')
  || jsonb_build_object(
    'students',students_payload.students,
    'data_quality',coalesce(base.payload->'data_quality','{}'::jsonb) || quality_patch.patch,
    'payload_version','seminar_master_dashboard_v3'
  )
from base,students_payload,quality_patch;
$function$;

revoke all on function public.seminar_master_dashboard_v3() from public;
grant execute on function public.seminar_master_dashboard_v3() to service_role;

create or replace function public.seminar_master_code_v1(p_teacher_token text)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'extensions', 'pg_catalog'
as $function$
declare
  v_sid uuid;
begin
  v_sid := public.teacher_code_session_id(p_teacher_token);
  if v_sid is null then
    raise exception 'Sesión docente inválida o expirada';
  end if;

  insert into public.teacher_code_audit(teacher_session_id, action_type, metadata)
  values (
    v_sid,
    'SEMINAR_MASTER_VIEW',
    jsonb_build_object(
      'source','seminar/t3/teacher',
      'payload_version','seminar_master_dashboard_v3'
    )
  );

  return public.seminar_master_dashboard_v3();
end;
$function$;
