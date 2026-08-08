begin;

create extension if not exists pg_trgm;

alter table public.attempts
  add column if not exists identity_match_score numeric(5,4);

create table if not exists public.assessment_test_identities (
  id uuid primary key default gen_random_uuid(),
  assessment_slug text not null,
  group_code text not null check (group_code in ('11A','11B','11C')),
  normalized_alias text not null,
  display_label text not null,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(assessment_slug,group_code,normalized_alias)
);

alter table public.assessment_test_identities enable row level security;

drop policy if exists "teacher test identities read" on public.assessment_test_identities;
create policy "teacher test identities read"
on public.assessment_test_identities for select
using (public.is_teacher());

drop policy if exists "teacher test identities write" on public.assessment_test_identities;
create policy "teacher test identities write"
on public.assessment_test_identities for all
using (public.is_teacher())
with check (public.is_teacher());

-- Hidden smoke-test identity. It is not part of student_registry and therefore
-- does not alter official class counts, academic records, or roster exports.
insert into public.assessment_test_identities(
  assessment_slug,group_code,normalized_alias,display_label,metadata
)
select
  'statistics11-counting-permutations-2026',
  g,
  public.normalize_student_name('JUAN DIEGO PEREZ'),
  'JUAN DIEGO PEREZ · TEST',
  jsonb_build_object('hidden',true,'purpose','teacher_smoke_test')
from unnest(array['11A','11B','11C']) as g
on conflict(assessment_slug,group_code,normalized_alias) do update set
  display_label=excluded.display_label,
  active=true,
  metadata=excluded.metadata;

create or replace function public.student_name_signature(p_value text)
returns text
language sql
immutable
as $$
  select coalesce(string_agg(token,' ' order by token),'')
  from regexp_split_to_table(public.normalize_student_name(p_value),'\s+') token
  where length(token) >= 2;
$$;

-- Resolve ordinary students to a stable roster identity. This is intentionally
-- tolerant of accents, token order and small typing errors, but it refuses a
-- fuzzy match when the top two candidates are too close to each other.
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
  v_input text := public.normalize_student_name(p_student_name);
  v_signature text := public.student_name_signature(p_student_name);
  v_best record;
  v_second_score numeric;
begin
  if p_group_code not in ('11A','11B','11C') then
    raise exception 'Grupo no válido';
  end if;
  if length(v_input) < 5 then
    raise exception 'Escribe tu nombre completo';
  end if;

  with scored as (
    select
      s.id,
      s.internal_key,
      s.display_name,
      case
        when s.normalized_name=v_input then 1
        when s.name_is_truncated and v_input like s.normalized_name || '%' then 2
        else 3
      end as priority,
      case
        when s.normalized_name=v_input then 1.0000::numeric
        when s.name_is_truncated and v_input like s.normalized_name || '%' then 0.9900::numeric
        else greatest(
          similarity(s.normalized_name,v_input),
          similarity(public.student_name_signature(s.display_name),v_signature)
        )::numeric
      end as score,
      case
        when s.normalized_name=v_input then 'exact'
        when s.name_is_truncated and v_input like s.normalized_name || '%' then 'source_prefix'
        else 'fuzzy'
      end as mode
    from public.student_registry s
    where s.active=true and s.group_code=p_group_code
  )
  select * into v_best
  from scored
  order by priority,score desc,internal_key
  limit 1;

  if not found then
    raise exception 'No hay estudiantes activos configurados para %.',p_group_code;
  end if;

  if v_best.priority=3 then
    if v_best.score < 0.5800 then
      raise exception 'No pudimos identificar ese nombre en %. Escríbelo de nuevo; se permiten errores menores.',p_group_code;
    end if;

    with scored as (
      select
        s.id,
        greatest(
          similarity(s.normalized_name,v_input),
          similarity(public.student_name_signature(s.display_name),v_signature)
        )::numeric as score
      from public.student_registry s
      where s.active=true and s.group_code=p_group_code and s.id<>v_best.id
    )
    select max(score) into v_second_score from scored;

    if v_second_score is not null and v_best.score-v_second_score < 0.0800 then
      raise exception 'El nombre es ambiguo dentro de %. Escríbelo con más detalle para identificar el intento correcto.',p_group_code;
    end if;
  end if;

  return query
  select v_best.id::uuid,
         v_best.internal_key::text,
         v_best.display_name::text,
         v_best.mode::text,
         round(v_best.score::numeric,4);
end;
$$;

revoke all on function public.resolve_roster_student(text,text)
from public,anon,authenticated;

-- Replace start RPC: ordinary users resolve to the stable roster key even when
-- the name has a small typo; the hidden teacher identity receives a synthetic
-- test key so repeated smoke tests do not masquerade as an official student.
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

  v_input_name := public.normalize_student_name(p_student_name);
  if length(v_input_name) < 5 then
    raise exception 'Escribe tu nombre completo';
  end if;

  select * into v_assessment
  from public.assessments
  where slug=p_assessment_slug;

  if not found then
    raise exception 'Evaluación no encontrada';
  end if;

  select true,t.display_label
  into v_is_test,v_student_label
  from public.assessment_test_identities t
  where t.active=true
    and t.assessment_slug=p_assessment_slug
    and t.group_code=p_group_code
    and t.normalized_alias=v_input_name
  limit 1;

  v_is_test := coalesce(v_is_test,false);

  if v_is_test then
    -- Hidden teacher smoke tests may run while the assessment is draft, paused,
    -- or open. They are blocked after the assessment is closed/released.
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
    from public.resolve_roster_student(p_group_code,p_student_name) r;
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
        raise exception 'Este estudiante ya tiene un intento cerrado. Si necesitas otro intento, debe autorizarlo el docente.';
      else
        raise exception 'Ya existe un intento activo para este estudiante. Solicita al docente reanudarlo.';
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
    trim(p_student_name),
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
