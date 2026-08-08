begin;

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ============================================================
-- Open-name identity policy
-- ============================================================
-- Registration must never be blocked merely because the typed name does not
-- match the institutional roster. The backend still attempts to resolve a
-- stable official identity first. If it cannot do so confidently, it creates
-- a stable UNVERIFIED identity derived from group + normalized entered name.
-- This preserves the exact text entered for audit and lets the teacher review
-- whether the attempt belongs to a roster student.
-- ============================================================

create or replace function public.resolve_roster_student(
  p_group_code text,
  p_student_name text
)
returns table(
  student_registry_id uuid,
  internal_key text,
  display_name text,
  match_mode text,
  match_score numeric
)
language plpgsql
security definer
set search_path=public
as $$
declare
  v_input text := public.normalize_student_name(coalesce(p_student_name,''));
  v_signature text := public.student_name_signature(coalesce(p_student_name,''));
  v_entered_display text := coalesce(nullif(trim(p_student_name),''),'SIN NOMBRE DECLARADO');
  v_best record;
  v_second_score numeric;
  v_mode text;
  v_score numeric := 0;
  v_unverified_key text;
begin
  if p_group_code not in ('11A','11B','11C') then
    raise exception 'Grupo no válido';
  end if;

  with scored as (
    select
      s.id,
      s.internal_key,
      s.display_name,
      case
        when s.normalized_name=v_input and v_input<>'' then 1
        when s.name_is_truncated and v_input<>'' and v_input like s.normalized_name || '%' then 2
        else 3
      end as priority,
      case
        when s.normalized_name=v_input and v_input<>'' then 1.0000::numeric
        when s.name_is_truncated and v_input<>'' and v_input like s.normalized_name || '%' then 0.9900::numeric
        when v_input='' then 0::numeric
        else greatest(
          similarity(s.normalized_name,v_input),
          similarity(public.student_name_signature(s.display_name),v_signature)
        )::numeric
      end as score,
      case
        when s.normalized_name=v_input and v_input<>'' then 'exact'
        when s.name_is_truncated and v_input<>'' and v_input like s.normalized_name || '%' then 'source_prefix'
        else 'fuzzy'
      end as mode
    from public.student_registry s
    where s.active=true and s.group_code=p_group_code
  )
  select * into v_best
  from scored
  order by priority,score desc,internal_key
  limit 1;

  -- Exact and source-prefix matches are accepted immediately.
  if found and v_best.priority in (1,2) then
    return query
    select v_best.id::uuid,
           v_best.internal_key::text,
           v_best.display_name::text,
           v_best.mode::text,
           round(v_best.score::numeric,4);
    return;
  end if;

  -- Determine whether a fuzzy candidate is sufficiently strong and unique.
  if found then
    v_score := coalesce(v_best.score,0);
    with scored as (
      select greatest(
        similarity(s.normalized_name,v_input),
        similarity(public.student_name_signature(s.display_name),v_signature)
      )::numeric as score
      from public.student_registry s
      where s.active=true
        and s.group_code=p_group_code
        and s.id<>v_best.id
    )
    select max(score) into v_second_score from scored;

    if v_input<>''
       and v_score>=0.5800
       and (v_second_score is null or v_score-v_second_score>=0.0800) then
      return query
      select v_best.id::uuid,
             v_best.internal_key::text,
             v_best.display_name::text,
             'fuzzy'::text,
             round(v_score::numeric,4);
      return;
    end if;

    if v_input='' then
      v_mode := 'blank_unverified';
    elsif v_score>=0.5800 and v_second_score is not null and v_score-v_second_score<0.0800 then
      v_mode := 'ambiguous_unverified';
    else
      v_mode := 'unverified';
    end if;
  else
    v_mode := case when v_input='' then 'blank_unverified' else 'unverified' end;
    v_score := 0;
  end if;

  -- Stable synthetic identity: the same group + same normalized entry maps to
  -- the same internal key, so repeating the same unverified name does not
  -- create a fresh official-looking identity.
  v_unverified_key := 'UNVERIFIED-' || p_group_code || '-' ||
    upper(substr(encode(digest(p_group_code || '|' || v_input,'sha256'),'hex'),1,20));

  return query
  select null::uuid,
         v_unverified_key::text,
         v_entered_display::text,
         v_mode::text,
         round(coalesce(v_score,0)::numeric,4);
end;
$$;

revoke all on function public.resolve_roster_student(text,text)
from public,anon,authenticated;

-- Replace the start RPC so name quality never blocks entry. The only required
-- classroom selector remains group. Identity resolution happens internally.
create or replace function public.student_start_attempt(
  p_assessment_slug text,
  p_student_name text,
  p_group_code text,
  p_session_id uuid,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_assessment public.assessments%rowtype;
  v_student_id uuid;
  v_student_key text;
  v_student_label text;
  v_input_name text;
  v_match_mode text;
  v_match_score numeric;
  v_is_test boolean := false;
  v_attempt public.attempts%rowtype;
  v_token text;
  v_now timestamptz := clock_timestamp();
  v_question jsonb;
begin
  if p_group_code not in ('11A','11B','11C') then
    raise exception 'Grupo no válido';
  end if;

  v_input_name := public.normalize_student_name(coalesce(p_student_name,''));

  select * into v_assessment
  from public.assessments
  where slug=p_assessment_slug;

  if not found then
    raise exception 'Evaluación no encontrada';
  end if;

  -- Preserve the existing hidden smoke-test alias behavior.
  if v_input_name<>'' then
    select true,t.display_label
    into v_is_test,v_student_label
    from public.assessment_test_identities t
    where t.active=true
      and t.assessment_slug=p_assessment_slug
      and t.group_code=p_group_code
      and t.normalized_alias=v_input_name
    limit 1;
  end if;

  v_is_test := coalesce(v_is_test,false);

  if v_is_test then
    if v_assessment.status not in ('draft','scheduled','open','paused') then
      raise exception 'La evaluación está % y no admite pruebas ocultas.',v_assessment.status;
    end if;
    v_student_id := null;
    v_student_key := 'TEST-JDP-' || replace(left(p_session_id::text,13),'-','');
    v_match_mode := 'hidden_test';
    v_match_score := 1.0000;
  else
    if v_assessment.status <> 'open' then
      raise exception 'La evaluación está %',v_assessment.status;
    end if;
    if v_assessment.starts_at is not null and v_now < v_assessment.starts_at then
      raise exception 'La evaluación aún no ha iniciado';
    end if;
    if v_assessment.ends_at is not null and v_now > v_assessment.ends_at then
      raise exception 'La evaluación está cerrada';
    end if;

    select r.student_registry_id,r.internal_key,r.display_name,r.match_mode,r.match_score
    into v_student_id,v_student_key,v_student_label,v_match_mode,v_match_score
    from public.resolve_roster_student(p_group_code,coalesce(p_student_name,'')) r;
  end if;

  perform pg_advisory_xact_lock(
    hashtext(v_assessment.id::text || '|' || v_student_key)
  );

  if not v_is_test then
    select * into v_attempt
    from public.attempts
    where assessment_id=v_assessment.id
      and student_id=v_student_key
    for update;

    if found then
      if v_attempt.status in ('submitted','force_submitted','auto_invalidated','invalidated') then
        raise exception 'Ya existe un intento cerrado asociado a esta identificación. Solicita revisión docente si necesitas otro intento.';
      else
        raise exception 'Ya existe un intento activo asociado a esta identificación. Solicita al docente reanudarlo.';
      end if;
    end if;
  end if;

  perform public.allocate_assessment_questions(v_assessment.id,v_student_key);

  v_token := encode(gen_random_bytes(32),'hex');

  insert into public.attempts(
    assessment_id,
    auth_user_id,
    student_registry_id,
    student_id,
    student_name_snapshot,
    student_name_entered,
    identity_match_mode,
    identity_match_score,
    group_code,
    session_id,
    status,
    expires_at,
    access_token_hash,
    user_agent,
    last_activity_at
  )
  values(
    v_assessment.id,
    null,
    v_student_id,
    v_student_key,
    v_student_label,
    coalesce(nullif(trim(p_student_name),''),'SIN NOMBRE DECLARADO'),
    v_match_mode,
    v_match_score,
    p_group_code,
    p_session_id,
    'active',
    v_now + make_interval(mins=>v_assessment.duration_minutes),
    encode(digest(v_token,'sha256'),'hex'),
    left(coalesce(p_user_agent,''),1000),
    v_now
  )
  returning * into v_attempt;

  v_question := public.assessment_public_question(
    v_assessment.id,
    v_student_key,
    1
  );

  return jsonb_build_object(
    'attempt_id',v_attempt.id,
    'attempt_token',v_token,
    'expires_at',v_attempt.expires_at,
    'integrity_strikes',0,
    'student_label',v_student_label,
    'group_code',p_group_code,
    'identity_match_mode',v_match_mode,
    'identity_match_score',v_match_score,
    'identity_verified',v_student_id is not null,
    'test_mode',v_is_test,
    'question',v_question
  );
end;
$$;

revoke all on function public.student_start_attempt(text,text,text,uuid,text)
from public;
grant execute on function public.student_start_attempt(text,text,text,uuid,text)
to anon,authenticated;

commit;
