begin;

-- ============================================================
-- Statistics 11 roster + multi-source academic provenance
-- Student-facing assessment no longer depends on anonymous Auth.
-- The public browser receives only an opaque attempt token.
-- ============================================================

create extension if not exists pgcrypto;

create or replace function public.normalize_student_name(p_value text)
returns text
language sql
immutable
as $$
  select trim(
    regexp_replace(
      upper(
        translate(
          coalesce(p_value,''),
          'ÁÉÍÓÚÜÑáéíóúüñ',
          'AEIOUUNAEIOUUN'
        )
      ),
      '[^A-Z0-9]+',
      ' ',
      'g'
    )
  );
$$;

create table if not exists public.student_registry (
  id uuid primary key default gen_random_uuid(),
  internal_key text not null unique,
  group_code text not null check (group_code in ('11A','11B','11C')),
  source_position integer not null check (source_position > 0),
  display_name text not null,
  normalized_name text not null,
  name_is_truncated boolean not null default false,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(group_code, source_position),
  unique(group_code, normalized_name)
);

create table if not exists public.academic_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  source_system text not null,
  source_kind text not null,
  title text not null,
  source_date date,
  captured_at timestamptz not null default now(),
  description text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.academic_records (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.academic_sources(id) on delete restrict,
  student_registry_id uuid not null references public.student_registry(id) on delete restrict,
  definitiva_periodo numeric(5,2),
  definitiva_por_area numeric(5,2),
  acumulado_asig_ano numeric(5,2),
  acumulado_seguimiento numeric(5,2),
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(source_id, student_registry_id)
);

create index if not exists idx_student_registry_group
  on public.student_registry(group_code, source_position);
create index if not exists idx_academic_records_student
  on public.academic_records(student_registry_id, source_id);
create index if not exists idx_academic_records_source
  on public.academic_records(source_id, student_registry_id);

alter table public.student_registry enable row level security;
alter table public.academic_sources enable row level security;
alter table public.academic_records enable row level security;

drop policy if exists "teacher roster read" on public.student_registry;
create policy "teacher roster read"
on public.student_registry for select
using (public.is_teacher());

drop policy if exists "teacher roster write" on public.student_registry;
create policy "teacher roster write"
on public.student_registry for all
using (public.is_teacher())
with check (public.is_teacher());

drop policy if exists "teacher academic sources read" on public.academic_sources;
create policy "teacher academic sources read"
on public.academic_sources for select
using (public.is_teacher());

drop policy if exists "teacher academic sources write" on public.academic_sources;
create policy "teacher academic sources write"
on public.academic_sources for all
using (public.is_teacher())
with check (public.is_teacher());

drop policy if exists "teacher academic records read" on public.academic_records;
create policy "teacher academic records read"
on public.academic_records for select
using (public.is_teacher());

drop policy if exists "teacher academic records write" on public.academic_records;
create policy "teacher academic records write"
on public.academic_records for all
using (public.is_teacher())
with check (public.is_teacher());

-- Official attempt identity is linked to the roster, not to a user-entered code.
alter table public.attempts alter column auth_user_id drop not null;
alter table public.attempts
  add column if not exists student_registry_id uuid references public.student_registry(id),
  add column if not exists student_name_snapshot text,
  add column if not exists student_name_entered text,
  add column if not exists identity_match_mode text,
  add column if not exists access_token_hash text;

create index if not exists idx_attempts_student_registry
  on public.attempts(assessment_id, student_registry_id);

-- ============================================================
-- Institutional roster snapshot supplied by the teacher.
-- Truncated source names are intentionally preserved as supplied.
-- ============================================================

insert into public.student_registry(
  internal_key,group_code,source_position,display_name,name_is_truncated,normalized_name
)
values
    ('11A-001','11A',1,'ARANGO GIRALDO JUAN PABL...',true,public.normalize_student_name('ARANGO GIRALDO JUAN PABL...')),
    ('11A-002','11A',2,'ARISTIZABAL CORREA MATIA...',true,public.normalize_student_name('ARISTIZABAL CORREA MATIA...')),
    ('11A-003','11A',3,'AVILA GIRALDO ALEJANDRO',false,public.normalize_student_name('AVILA GIRALDO ALEJANDRO')),
    ('11A-004','11A',4,'BOTERO VALENCIA JOSE MAT...',true,public.normalize_student_name('BOTERO VALENCIA JOSE MAT...')),
    ('11A-005','11A',5,'CARDONA VILLEGAS ANTONIA',false,public.normalize_student_name('CARDONA VILLEGAS ANTONIA')),
    ('11A-006','11A',6,'CUBIDES DASUKY DANIEL',false,public.normalize_student_name('CUBIDES DASUKY DANIEL')),
    ('11A-007','11A',7,'DIAZ AGUDELO SIMON',false,public.normalize_student_name('DIAZ AGUDELO SIMON')),
    ('11A-008','11A',8,'ESCOBAR DOMINGUEZ SUSANA',false,public.normalize_student_name('ESCOBAR DOMINGUEZ SUSANA')),
    ('11A-009','11A',9,'GOMEZ CANO SAMUEL',false,public.normalize_student_name('GOMEZ CANO SAMUEL')),
    ('11A-010','11A',10,'GOMEZ CASTRILLON ANTONIA',false,public.normalize_student_name('GOMEZ CASTRILLON ANTONIA')),
    ('11A-011','11A',11,'LONDOÑO PALACIO MIGUEL A...',true,public.normalize_student_name('LONDOÑO PALACIO MIGUEL A...')),
    ('11A-012','11A',12,'MAZO LOPEZ JERONIMO',false,public.normalize_student_name('MAZO LOPEZ JERONIMO')),
    ('11A-013','11A',13,'MORENO CARDEÑO JUAN ANDR...',true,public.normalize_student_name('MORENO CARDEÑO JUAN ANDR...')),
    ('11A-014','11A',14,'ORTIZ MORALES SUSANA',false,public.normalize_student_name('ORTIZ MORALES SUSANA')),
    ('11A-015','11A',15,'OSORIO CAMPILLO MIGUEL A...',true,public.normalize_student_name('OSORIO CAMPILLO MIGUEL A...')),
    ('11A-016','11A',16,'RODRIGUEZ PEÑA JERONIMO',false,public.normalize_student_name('RODRIGUEZ PEÑA JERONIMO')),
    ('11A-017','11A',17,'SORZA OSPINA LUCIANA',false,public.normalize_student_name('SORZA OSPINA LUCIANA')),
    ('11A-018','11A',18,'TORO AVILA JUAN JOSE',false,public.normalize_student_name('TORO AVILA JUAN JOSE')),
    ('11B-001','11B',1,'ARBELAEZ ESCOBAR PEDRO P...',true,public.normalize_student_name('ARBELAEZ ESCOBAR PEDRO P...')),
    ('11B-002','11B',2,'AUBAD ACEBEDO EMMA',false,public.normalize_student_name('AUBAD ACEBEDO EMMA')),
    ('11B-003','11B',3,'BAUTISTA GIRALDO JERONIM...',true,public.normalize_student_name('BAUTISTA GIRALDO JERONIM...')),
    ('11B-004','11B',4,'BETANCUR OSSA MARIA CAMI...',true,public.normalize_student_name('BETANCUR OSSA MARIA CAMI...')),
    ('11B-005','11B',5,'CARDONA GONZALEZ DAREN',false,public.normalize_student_name('CARDONA GONZALEZ DAREN')),
    ('11B-006','11B',6,'CHAVARRIAGA AVENDAÑO SAM...',true,public.normalize_student_name('CHAVARRIAGA AVENDAÑO SAM...')),
    ('11B-007','11B',7,'GALLEGO ORTEGA MARIA DEL...',true,public.normalize_student_name('GALLEGO ORTEGA MARIA DEL...')),
    ('11B-008','11B',8,'GIRALDO HINESTROZA MARIA...',true,public.normalize_student_name('GIRALDO HINESTROZA MARIA...')),
    ('11B-009','11B',9,'GOMEZ TAMAYO MARIA ANTON...',true,public.normalize_student_name('GOMEZ TAMAYO MARIA ANTON...')),
    ('11B-010','11B',10,'GUZMAN GOMEZ JACOBO',false,public.normalize_student_name('GUZMAN GOMEZ JACOBO')),
    ('11B-011','11B',11,'JARAMILLO ALVAREZ PABLO',false,public.normalize_student_name('JARAMILLO ALVAREZ PABLO')),
    ('11B-012','11B',12,'JARAMILLO PALACIO PABLO',false,public.normalize_student_name('JARAMILLO PALACIO PABLO')),
    ('11B-013','11B',13,'LOPEZ VINASCO SOFIA',false,public.normalize_student_name('LOPEZ VINASCO SOFIA')),
    ('11B-014','11B',14,'LOTERO MUÑOZ SARA',false,public.normalize_student_name('LOTERO MUÑOZ SARA')),
    ('11B-015','11B',15,'PALACIO ORREGO ISABELLA',false,public.normalize_student_name('PALACIO ORREGO ISABELLA')),
    ('11B-016','11B',16,'POSADA GONZALEZ MARIA DE...',true,public.normalize_student_name('POSADA GONZALEZ MARIA DE...')),
    ('11B-017','11B',17,'POSADA HIGUITA SOFIA',false,public.normalize_student_name('POSADA HIGUITA SOFIA')),
    ('11B-018','11B',18,'REMACHE LOPEZ EMMANUEL',false,public.normalize_student_name('REMACHE LOPEZ EMMANUEL')),
    ('11B-019','11B',19,'RESTREPO OSPINA ISABEL',false,public.normalize_student_name('RESTREPO OSPINA ISABEL')),
    ('11B-020','11B',20,'RICO PARAMO ALEJANDRO',false,public.normalize_student_name('RICO PARAMO ALEJANDRO')),
    ('11C-001','11C',1,'ARANGO SIERRA JUANA INES',false,public.normalize_student_name('ARANGO SIERRA JUANA INES')),
    ('11C-002','11C',2,'BOLIVAR JARAMILLO ISABEL',false,public.normalize_student_name('BOLIVAR JARAMILLO ISABEL')),
    ('11C-003','11C',3,'BUITRAGO VALENCIA MARIAN...',true,public.normalize_student_name('BUITRAGO VALENCIA MARIAN...')),
    ('11C-004','11C',4,'CORTES PAJON SAMUEL',false,public.normalize_student_name('CORTES PAJON SAMUEL')),
    ('11C-005','11C',5,'DASUKY RIVERA KEMEL',false,public.normalize_student_name('DASUKY RIVERA KEMEL')),
    ('11C-006','11C',6,'ECHAVARRIA GUTIERREZ MAR...',true,public.normalize_student_name('ECHAVARRIA GUTIERREZ MAR...')),
    ('11C-007','11C',7,'GONZALEZ GIRALDO TOMAS',false,public.normalize_student_name('GONZALEZ GIRALDO TOMAS')),
    ('11C-008','11C',8,'GUISAO ECHAVARRIA ISABEL',false,public.normalize_student_name('GUISAO ECHAVARRIA ISABEL')),
    ('11C-009','11C',9,'GUZMAN GOMEZ MATIAS',false,public.normalize_student_name('GUZMAN GOMEZ MATIAS')),
    ('11C-010','11C',10,'HOYOS RESTREPO JERONIMO',false,public.normalize_student_name('HOYOS RESTREPO JERONIMO')),
    ('11C-011','11C',11,'LATORRE AREIZA JUAN ANDR...',true,public.normalize_student_name('LATORRE AREIZA JUAN ANDR...')),
    ('11C-012','11C',12,'MOLINA CASTRO ARIANA',false,public.normalize_student_name('MOLINA CASTRO ARIANA')),
    ('11C-013','11C',13,'MOYA GOMEZ VIOLETA',false,public.normalize_student_name('MOYA GOMEZ VIOLETA')),
    ('11C-014','11C',14,'OTERO ARANGO LUCIANA MAR...',true,public.normalize_student_name('OTERO ARANGO LUCIANA MAR...')),
    ('11C-015','11C',15,'PALACIO MEJIA ANA SOFIA',false,public.normalize_student_name('PALACIO MEJIA ANA SOFIA')),
    ('11C-016','11C',16,'PALACIO ORREGO MARIA PAU...',true,public.normalize_student_name('PALACIO ORREGO MARIA PAU...')),
    ('11C-017','11C',17,'PENAGOS VON WERDER VALEN...',true,public.normalize_student_name('PENAGOS VON WERDER VALEN...')),
    ('11C-018','11C',18,'POVEDA ARTUNDUAGA MANUEL...',true,public.normalize_student_name('POVEDA ARTUNDUAGA MANUEL...')),
    ('11C-019','11C',19,'RINCON TORRES ALEJANDRO',false,public.normalize_student_name('RINCON TORRES ALEJANDRO')),
    ('11C-020','11C',20,'RODRIGUEZ BASTIDAS NICOL...',true,public.normalize_student_name('RODRIGUEZ BASTIDAS NICOL...')),
    ('11C-021','11C',21,'VALENCIA VASQUEZ JERONIM...',true,public.normalize_student_name('VALENCIA VASQUEZ JERONIM...')),
    ('11C-022','11C',22,'VARGAS SUAREZ SIMON',false,public.normalize_student_name('VARGAS SUAREZ SIMON')),
    ('11C-023','11C',23,'VELASQUEZ BELTRAN SAMUEL',false,public.normalize_student_name('VELASQUEZ BELTRAN SAMUEL'))
on conflict(internal_key) do update set
  group_code=excluded.group_code,
  source_position=excluded.source_position,
  display_name=excluded.display_name,
  name_is_truncated=excluded.name_is_truncated,
  normalized_name=public.normalize_student_name(excluded.display_name),
  active=true,
  updated_at=now();

update public.student_registry
set normalized_name=public.normalize_student_name(display_name),
    updated_at=now()
where normalized_name is distinct from public.normalize_student_name(display_name);

insert into public.academic_sources(
  source_key,source_system,source_kind,title,source_date,description,metadata
)
values(
  'calificar_statistics11_2026_08_07',
  'Calificar',
  'grade_snapshot',
  'Statistics 11 · Calificar snapshot · 11A/11B/11C',
  date '2026-08-07',
  'Snapshot supplied by the teacher. The source showed Definitiva período, Definitiva por Área, Acumulado Asig Año and Acumulado seguimiento. Blank cells are preserved as NULL.',
  jsonb_build_object(
    'groups',jsonb_build_array('11A','11B','11C'),
    'student_count',61,
    'source_note','Some names were truncated with ellipsis in the supplied source and are stored without guessing missing characters.'
  )
)
on conflict(source_key) do update set
  title=excluded.title,
  source_date=excluded.source_date,
  description=excluded.description,
  metadata=excluded.metadata;

with src as (
  select id from public.academic_sources
  where source_key='calificar_statistics11_2026_08_07'
),
vals(internal_key,definitiva_por_area,acumulado_asig_ano,raw_payload) as (
  values
    ('11A-001',4.17,4.76,jsonb_build_object('source_row',1,'display_name','ARANGO GIRALDO JUAN PABL...')),
    ('11A-002',5,4.76,jsonb_build_object('source_row',2,'display_name','ARISTIZABAL CORREA MATIA...')),
    ('11A-003',2.5,4.76,jsonb_build_object('source_row',3,'display_name','AVILA GIRALDO ALEJANDRO')),
    ('11A-004',4.22,4.76,jsonb_build_object('source_row',4,'display_name','BOTERO VALENCIA JOSE MAT...')),
    ('11A-005',4.81,4.76,jsonb_build_object('source_row',5,'display_name','CARDONA VILLEGAS ANTONIA')),
    ('11A-006',2.2,4.25,jsonb_build_object('source_row',6,'display_name','CUBIDES DASUKY DANIEL')),
    ('11A-007',3.13,4.76,jsonb_build_object('source_row',7,'display_name','DIAZ AGUDELO SIMON')),
    ('11A-008',4.83,4.76,jsonb_build_object('source_row',8,'display_name','ESCOBAR DOMINGUEZ SUSANA')),
    ('11A-009',1.89,4.1,jsonb_build_object('source_row',9,'display_name','GOMEZ CANO SAMUEL')),
    ('11A-010',3,4.76,jsonb_build_object('source_row',10,'display_name','GOMEZ CASTRILLON ANTONIA')),
    ('11A-011',3.2,4.1,jsonb_build_object('source_row',11,'display_name','LONDOÑO PALACIO MIGUEL A...')),
    ('11A-012',2.78,4.55,jsonb_build_object('source_row',12,'display_name','MAZO LOPEZ JERONIMO')),
    ('11A-013',3.91,4.57,jsonb_build_object('source_row',13,'display_name','MORENO CARDEÑO JUAN ANDR...')),
    ('11A-014',5,4.25,jsonb_build_object('source_row',14,'display_name','ORTIZ MORALES SUSANA')),
    ('11A-015',1.16,5,jsonb_build_object('source_row',15,'display_name','OSORIO CAMPILLO MIGUEL A...')),
    ('11A-016',4.62,4.76,jsonb_build_object('source_row',16,'display_name','RODRIGUEZ PEÑA JERONIMO')),
    ('11A-017',4.95,4.76,jsonb_build_object('source_row',17,'display_name','SORZA OSPINA LUCIANA')),
    ('11A-018',1.89,4.76,jsonb_build_object('source_row',18,'display_name','TORO AVILA JUAN JOSE')),
    ('11B-001',3.44,4.55,jsonb_build_object('source_row',1,'display_name','ARBELAEZ ESCOBAR PEDRO P...')),
    ('11B-002',5,5,jsonb_build_object('source_row',2,'display_name','AUBAD ACEBEDO EMMA')),
    ('11B-003',4.94,5,jsonb_build_object('source_row',3,'display_name','BAUTISTA GIRALDO JERONIM...')),
    ('11B-004',3.95,4.55,jsonb_build_object('source_row',4,'display_name','BETANCUR OSSA MARIA CAMI...')),
    ('11B-005',3.95,4.25,jsonb_build_object('source_row',5,'display_name','CARDONA GONZALEZ DAREN')),
    ('11B-006',4.73,4.55,jsonb_build_object('source_row',6,'display_name','CHAVARRIAGA AVENDAÑO SAM...')),
    ('11B-007',4.04,4.64,jsonb_build_object('source_row',7,'display_name','GALLEGO ORTEGA MARIA DEL...')),
    ('11B-008',4.26,4.64,jsonb_build_object('source_row',8,'display_name','GIRALDO HINESTROZA MARIA...')),
    ('11B-009',4.69,4.85,jsonb_build_object('source_row',9,'display_name','GOMEZ TAMAYO MARIA ANTON...')),
    ('11B-010',4.2,4.76,jsonb_build_object('source_row',10,'display_name','GUZMAN GOMEZ JACOBO')),
    ('11B-011',3.62,4.1,jsonb_build_object('source_row',11,'display_name','JARAMILLO ALVAREZ PABLO')),
    ('11B-012',3.91,4.55,jsonb_build_object('source_row',12,'display_name','JARAMILLO PALACIO PABLO')),
    ('11B-013',4.51,4.76,jsonb_build_object('source_row',13,'display_name','LOPEZ VINASCO SOFIA')),
    ('11B-014',4.71,4.76,jsonb_build_object('source_row',14,'display_name','LOTERO MUÑOZ SARA')),
    ('11B-015',2.9,4.44,jsonb_build_object('source_row',15,'display_name','PALACIO ORREGO ISABELLA')),
    ('11B-016',4.22,4.55,jsonb_build_object('source_row',16,'display_name','POSADA GONZALEZ MARIA DE...')),
    ('11B-017',3.05,4.1,jsonb_build_object('source_row',17,'display_name','POSADA HIGUITA SOFIA')),
    ('11B-018',4.63,4.76,jsonb_build_object('source_row',18,'display_name','REMACHE LOPEZ EMMANUEL')),
    ('11B-019',4.74,4.76,jsonb_build_object('source_row',19,'display_name','RESTREPO OSPINA ISABEL')),
    ('11B-020',4.21,4.76,jsonb_build_object('source_row',20,'display_name','RICO PARAMO ALEJANDRO')),
    ('11C-001',2.93,3.1,jsonb_build_object('source_row',1,'display_name','ARANGO SIERRA JUANA INES')),
    ('11C-002',5,5,jsonb_build_object('source_row',2,'display_name','BOLIVAR JARAMILLO ISABEL')),
    ('11C-003',2.5,3.8,jsonb_build_object('source_row',3,'display_name','BUITRAGO VALENCIA MARIAN...')),
    ('11C-004',4.22,3.64,jsonb_build_object('source_row',4,'display_name','CORTES PAJON SAMUEL')),
    ('11C-005',3.23,4.55,jsonb_build_object('source_row',5,'display_name','DASUKY RIVERA KEMEL')),
    ('11C-006',4.73,3.8,jsonb_build_object('source_row',6,'display_name','ECHAVARRIA GUTIERREZ MAR...')),
    ('11C-007',5,3.02,jsonb_build_object('source_row',7,'display_name','GONZALEZ GIRALDO TOMAS')),
    ('11C-008',4.28,4.7,jsonb_build_object('source_row',8,'display_name','GUISAO ECHAVARRIA ISABEL')),
    ('11C-009',4.78,4.76,jsonb_build_object('source_row',9,'display_name','GUZMAN GOMEZ MATIAS')),
    ('11C-010',3.99,2,jsonb_build_object('source_row',10,'display_name','HOYOS RESTREPO JERONIMO')),
    ('11C-011',5,5,jsonb_build_object('source_row',11,'display_name','LATORRE AREIZA JUAN ANDR...')),
    ('11C-012',3.29,3.96,jsonb_build_object('source_row',12,'display_name','MOLINA CASTRO ARIANA')),
    ('11C-013',4.43,4.85,jsonb_build_object('source_row',13,'display_name','MOYA GOMEZ VIOLETA')),
    ('11C-014',4.91,5,jsonb_build_object('source_row',14,'display_name','OTERO ARANGO LUCIANA MAR...')),
    ('11C-015',null,2,jsonb_build_object('source_row',15,'display_name','PALACIO MEJIA ANA SOFIA')),
    ('11C-016',5,4.76,jsonb_build_object('source_row',16,'display_name','PALACIO ORREGO MARIA PAU...')),
    ('11C-017',3.52,3.76,jsonb_build_object('source_row',17,'display_name','PENAGOS VON WERDER VALEN...')),
    ('11C-018',4.78,4.7,jsonb_build_object('source_row',18,'display_name','POVEDA ARTUNDUAGA MANUEL...')),
    ('11C-019',3.88,4.55,jsonb_build_object('source_row',19,'display_name','RINCON TORRES ALEJANDRO')),
    ('11C-020',4.85,4.76,jsonb_build_object('source_row',20,'display_name','RODRIGUEZ BASTIDAS NICOL...')),
    ('11C-021',2.83,4.4,jsonb_build_object('source_row',21,'display_name','VALENCIA VASQUEZ JERONIM...')),
    ('11C-022',3.23,3.8,jsonb_build_object('source_row',22,'display_name','VARGAS SUAREZ SIMON')),
    ('11C-023',4.68,4.64,jsonb_build_object('source_row',23,'display_name','VELASQUEZ BELTRAN SAMUEL'))
)
insert into public.academic_records(
  source_id,student_registry_id,definitiva_periodo,definitiva_por_area,
  acumulado_asig_ano,acumulado_seguimiento,raw_payload
)
select
  src.id,
  s.id,
  null,
  vals.definitiva_por_area,
  vals.acumulado_asig_ano,
  null,
  vals.raw_payload
from vals
join public.student_registry s using(internal_key)
cross join src
on conflict(source_id,student_registry_id) do update set
  definitiva_periodo=excluded.definitiva_periodo,
  definitiva_por_area=excluded.definitiva_por_area,
  acumulado_asig_ano=excluded.acumulado_asig_ano,
  acumulado_seguimiento=excluded.acumulado_seguimiento,
  raw_payload=excluded.raw_payload;

-- ============================================================
-- Private helper: returns one safe question projection.
-- Never grants direct answer-key access to the browser.
-- ============================================================

create or replace function public.assessment_public_question(
  p_assessment_id uuid,
  p_student_internal_key text,
  p_question_order integer
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_assignment public.assignments%rowtype;
  v_question public.questions_private%rowtype;
  v_order jsonb;
  v_options jsonb;
begin
  select * into v_assignment
  from public.assignments
  where assessment_id=p_assessment_id
    and student_id=p_student_internal_key
    and question_order=p_question_order;

  if not found then
    raise exception 'Assigned question not found';
  end if;

  select * into v_question
  from public.questions_private
  where id=v_assignment.question_id and active=true;

  if not found then
    raise exception 'Question not found';
  end if;

  v_order := v_assignment.option_order;
  if v_order is null or jsonb_array_length(v_order) <> 4 then
    select jsonb_agg(idx order by md5(
      v_assignment.question_id || '|' ||
      p_student_internal_key || '|' ||
      idx::text
    ))
    into v_order
    from generate_series(0,3) idx;

    update public.assignments
    set option_order=v_order
    where id=v_assignment.id;
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'key', chr(64 + ordinality::integer),
      'label', v_question.options ->> (elem::integer)
    )
    order by ordinality
  )
  into v_options
  from jsonb_array_elements_text(v_order)
       with ordinality as x(elem,ordinality);

  return jsonb_build_object(
    'id',v_question.id,
    'order',v_assignment.question_order,
    'topic_label',v_question.topic_code,
    'prompt',v_question.prompt_es,
    'diagram',coalesce(v_question.diagram,'{}'::jsonb),
    'options',coalesce(v_options,'[]'::jsonb)
  );
end;
$$;

revoke all on function public.assessment_public_question(uuid,text,integer)
from public,anon,authenticated;

-- ============================================================
-- Student registration: group + full name only.
-- Exact names match exactly. Truncated source names match a prefix.
-- No anonymous Supabase Auth account is created.
-- ============================================================

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
  v_student public.student_registry%rowtype;
  v_input_name text;
  v_match_count integer;
  v_match_mode text;
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
  if v_assessment.status <> 'open' then
    raise exception 'La evaluación está %',v_assessment.status;
  end if;
  if v_assessment.starts_at is not null and v_now < v_assessment.starts_at then
    raise exception 'La evaluación aún no ha iniciado';
  end if;
  if v_assessment.ends_at is not null and v_now > v_assessment.ends_at then
    raise exception 'La evaluación está cerrada';
  end if;

  select count(*) into v_match_count
  from public.student_registry s
  where s.active=true
    and s.group_code=p_group_code
    and (
      (not s.name_is_truncated and s.normalized_name=v_input_name)
      or
      (s.name_is_truncated and v_input_name like s.normalized_name || '%')
    );

  if v_match_count=0 then
    raise exception 'No encontramos ese nombre en %. Revisa grupo y nombre completo.',p_group_code;
  elsif v_match_count>1 then
    raise exception 'El nombre coincide con más de un registro. Solicita validación al docente.';
  end if;

  select * into v_student
  from public.student_registry s
  where s.active=true
    and s.group_code=p_group_code
    and (
      (not s.name_is_truncated and s.normalized_name=v_input_name)
      or
      (s.name_is_truncated and v_input_name like s.normalized_name || '%')
    )
  limit 1;

  v_match_mode := case when v_student.name_is_truncated then 'source_prefix' else 'exact' end;

  -- Serialize starts for the same roster row to prevent double-start races.
  perform pg_advisory_xact_lock(
    hashtext(v_assessment.id::text || '|' || v_student.internal_key)
  );

  select * into v_attempt
  from public.attempts
  where assessment_id=v_assessment.id
    and student_id=v_student.internal_key
  for update;

  if found then
    if v_attempt.status in ('submitted','force_submitted','auto_invalidated','invalidated') then
      raise exception 'Este estudiante ya tiene un intento cerrado.';
    else
      raise exception 'Ya existe un intento activo para este estudiante. Solicita al docente reanudarlo.';
    end if;
  end if;

  perform public.allocate_assessment_questions(v_assessment.id,v_student.internal_key);

  v_token := encode(gen_random_bytes(32),'hex');

  insert into public.attempts(
    assessment_id,
    auth_user_id,
    student_registry_id,
    student_id,
    student_name_snapshot,
    student_name_entered,
    identity_match_mode,
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
    v_student.id,
    v_student.internal_key,
    v_student.display_name,
    trim(p_student_name),
    v_match_mode,
    v_student.group_code,
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
    v_student.internal_key,
    1
  );

  return jsonb_build_object(
    'attempt_id',v_attempt.id,
    'attempt_token',v_token,
    'expires_at',v_attempt.expires_at,
    'integrity_strikes',0,
    'student_label',v_student.display_name,
    'group_code',v_student.group_code,
    'question',v_question
  );
end;
$$;

create or replace function public.student_resume_attempt(
  p_attempt_id uuid,
  p_attempt_token text
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_attempt public.attempts%rowtype;
  v_question jsonb;
begin
  select * into v_attempt
  from public.attempts
  where id=p_attempt_id;

  if not found
     or v_attempt.access_token_hash is null
     or v_attempt.access_token_hash <> encode(digest(coalesce(p_attempt_token,''),'sha256'),'hex') then
    raise exception 'Intento no válido';
  end if;

  if v_attempt.status not in ('active','paused') then
    return jsonb_build_object(
      'closed',true,
      'status',v_attempt.status,
      'raw_points',v_attempt.raw_points,
      'grade',v_attempt.grade,
      'answered_count',v_attempt.answered_count
    );
  end if;

  if clock_timestamp() > v_attempt.expires_at then
    return jsonb_build_object('closed',false,'expired',true);
  end if;

  v_question := public.assessment_public_question(
    v_attempt.assessment_id,
    v_attempt.student_id,
    v_attempt.answered_count+1
  );

  return jsonb_build_object(
    'closed',false,
    'attempt_id',v_attempt.id,
    'expires_at',v_attempt.expires_at,
    'integrity_strikes',v_attempt.integrity_strikes,
    'student_label',v_attempt.student_name_snapshot,
    'group_code',v_attempt.group_code,
    'question',v_question
  );
end;
$$;

create or replace function public.student_submit_answer(
  p_attempt_id uuid,
  p_attempt_token text,
  p_question_id text,
  p_selected_option text
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_attempt public.attempts%rowtype;
  v_assessment public.assessments%rowtype;
  v_assignment public.assignments%rowtype;
  v_question public.questions_private%rowtype;
  v_order integer;
  v_pos integer;
  v_actual_value text;
  v_correct boolean;
  v_now timestamptz := clock_timestamp();
  v_shown timestamptz;
  v_first_selection timestamptz;
  v_selection_events integer;
  v_response_ms integer;
  v_next jsonb;
begin
  if p_selected_option !~ '^[A-D]$' then
    raise exception 'Opción no válida';
  end if;

  select * into v_attempt
  from public.attempts
  where id=p_attempt_id
  for update;

  if not found
     or v_attempt.access_token_hash is null
     or v_attempt.access_token_hash <> encode(digest(coalesce(p_attempt_token,''),'sha256'),'hex') then
    raise exception 'Intento no válido';
  end if;

  if v_attempt.status <> 'active' then
    raise exception 'El intento está %',v_attempt.status;
  end if;
  if v_now > v_attempt.expires_at then
    raise exception 'TIME_EXPIRED';
  end if;

  select * into v_assessment
  from public.assessments
  where id=v_attempt.assessment_id;

  select * into v_assignment
  from public.assignments
  where assessment_id=v_attempt.assessment_id
    and student_id=v_attempt.student_id
    and question_order=v_attempt.answered_count+1;

  if not found or v_assignment.question_id <> p_question_id then
    raise exception 'La pregunta no corresponde al turno actual';
  end if;

  if exists(
    select 1 from public.responses
    where attempt_id=p_attempt_id and question_id=p_question_id
  ) then
    raise exception 'La respuesta ya fue enviada';
  end if;

  select * into v_question
  from public.questions_private
  where id=p_question_id;

  v_pos := ascii(p_selected_option)-ascii('A');
  v_order := (v_assignment.option_order ->> v_pos)::integer;
  v_actual_value := v_question.options ->> v_order;
  v_correct := v_actual_value = v_question.correct_answer;

  select min(server_timestamp),count(*)
  into v_first_selection,v_selection_events
  from public.attempt_events
  where attempt_id=p_attempt_id
    and question_id=p_question_id
    and event_type='OPTION_SELECTED';

  select max(server_timestamp) into v_shown
  from public.attempt_events
  where attempt_id=p_attempt_id
    and question_id=p_question_id
    and event_type='QUESTION_SHOWN';

  v_response_ms := case
    when v_shown is null then null
    else greatest(0,(extract(epoch from (v_now-v_shown))*1000)::integer)
  end;

  insert into public.responses(
    attempt_id,question_id,question_order,displayed_option_order,
    first_viewed_at,first_selected_at,submitted_at,selected_option,
    selection_changes,response_time_ms,is_correct,server_received_at
  )
  values(
    p_attempt_id,
    p_question_id,
    v_attempt.answered_count+1,
    v_assignment.option_order,
    coalesce(v_shown,v_now),
    coalesce(v_first_selection,v_now),
    v_now,
    p_selected_option,
    greatest(coalesce(v_selection_events,1)-1,0),
    v_response_ms,
    v_correct,
    v_now
  );

  update public.attempts
  set answered_count=answered_count+1,
      last_activity_at=v_now
  where id=p_attempt_id
  returning * into v_attempt;

  if v_attempt.answered_count >= v_assessment.questions_per_student then
    return jsonb_build_object('ok',true,'finished',true);
  end if;

  v_next := public.assessment_public_question(
    v_attempt.assessment_id,
    v_attempt.student_id,
    v_attempt.answered_count+1
  );

  return jsonb_build_object(
    'ok',true,
    'finished',false,
    'next_question',v_next
  );
end;
$$;

create or replace function public.student_log_event(
  p_attempt_id uuid,
  p_attempt_token text,
  p_question_id text,
  p_event_type text,
  p_client_timestamp timestamptz default null,
  p_visibility_state text default null,
  p_fullscreen_state boolean default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_attempt public.attempts%rowtype;
  v_assessment public.assessments%rowtype;
  v_prev_hash text;
  v_sequence bigint;
  v_server_time timestamptz := clock_timestamp();
  v_payload jsonb;
  v_hash text;
  v_strikes integer;
  v_invalidated boolean := false;
begin
  select * into v_attempt
  from public.attempts
  where id=p_attempt_id
  for update;

  if not found
     or v_attempt.access_token_hash is null
     or v_attempt.access_token_hash <> encode(digest(coalesce(p_attempt_token,''),'sha256'),'hex') then
    raise exception 'Intento no válido';
  end if;

  if v_attempt.status in ('submitted','force_submitted','invalidated') then
    return jsonb_build_object('ok',true,'ignored',true);
  end if;

  select * into v_assessment
  from public.assessments
  where id=v_attempt.assessment_id;

  select event_hash,event_sequence
  into v_prev_hash,v_sequence
  from public.attempt_events
  where attempt_id=p_attempt_id
  order by event_sequence desc
  limit 1;

  v_sequence := coalesce(v_sequence,0)+1;
  v_payload := jsonb_build_object(
    'attempt_id',p_attempt_id,
    'sequence',v_sequence,
    'event_type',left(coalesce(p_event_type,''),80),
    'client_timestamp',p_client_timestamp,
    'server_timestamp',v_server_time,
    'question_id',p_question_id,
    'visibility_state',p_visibility_state,
    'fullscreen_state',p_fullscreen_state,
    'metadata',coalesce(p_metadata,'{}'::jsonb)
  );
  v_hash := encode(
    digest(coalesce(v_prev_hash,'') || '|' || v_payload::text,'sha256'),
    'hex'
  );

  insert into public.attempt_events(
    attempt_id,student_id,assessment_id,question_id,event_sequence,
    event_type,client_timestamp,server_timestamp,visibility_state,
    fullscreen_state,metadata,prev_event_hash,event_hash
  )
  values(
    p_attempt_id,v_attempt.student_id,v_attempt.assessment_id,p_question_id,
    v_sequence,left(coalesce(p_event_type,''),80),p_client_timestamp,
    v_server_time,p_visibility_state,p_fullscreen_state,
    coalesce(p_metadata,'{}'::jsonb),v_prev_hash,v_hash
  );

  v_strikes := v_attempt.integrity_strikes;
  if p_event_type='INTEGRITY_STRIKE' then
    v_strikes := v_strikes+1;
    if v_strikes >= v_assessment.tab_strike_limit then
      v_invalidated := true;
      update public.attempts
      set integrity_strikes=v_strikes,
          status='auto_invalidated',
          finish_reason='auto_invalidated_integrity',
          submitted_at=coalesce(submitted_at,v_server_time),
          last_activity_at=v_server_time
      where id=p_attempt_id;
    else
      update public.attempts
      set integrity_strikes=v_strikes,
          last_activity_at=v_server_time
      where id=p_attempt_id;
    end if;
  else
    update public.attempts
    set last_activity_at=v_server_time
    where id=p_attempt_id;
  end if;

  return jsonb_build_object(
    'ok',true,
    'event_sequence',v_sequence,
    'integrity_strikes',v_strikes,
    'invalidated',v_invalidated
  );
end;
$$;

create or replace function public.student_finish_attempt(
  p_attempt_id uuid,
  p_attempt_token text,
  p_reason text default 'student_finished'
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_attempt public.attempts%rowtype;
  v_assessment public.assessments%rowtype;
  v_answered integer;
  v_correct integer;
  v_incorrect integer;
  v_raw numeric(6,2);
  v_grade numeric(4,2);
  v_status text;
  v_now timestamptz := clock_timestamp();
  v_invalid boolean;
begin
  select * into v_attempt
  from public.attempts
  where id=p_attempt_id
  for update;

  if not found
     or v_attempt.access_token_hash is null
     or v_attempt.access_token_hash <> encode(digest(coalesce(p_attempt_token,''),'sha256'),'hex') then
    raise exception 'Intento no válido';
  end if;

  if v_attempt.status in ('submitted','force_submitted','invalidated')
     and v_attempt.raw_points is not null then
    return jsonb_build_object(
      'status',v_attempt.status,
      'answered_count',v_attempt.answered_count,
      'raw_points',v_attempt.raw_points,
      'grade',v_attempt.grade
    );
  end if;

  select * into v_assessment
  from public.assessments
  where id=v_attempt.assessment_id;

  select count(*),count(*) filter(where is_correct=true)
  into v_answered,v_correct
  from public.responses
  where attempt_id=p_attempt_id;

  v_incorrect := v_answered-v_correct;
  v_raw := round((v_assessment.max_raw_points*v_correct/
                  v_assessment.questions_per_student)::numeric,2);
  v_grade := round((
    v_assessment.grade_min +
    (v_assessment.grade_max-v_assessment.grade_min)*
    v_correct/v_assessment.questions_per_student
  )::numeric,2);

  v_invalid := v_attempt.status='auto_invalidated'
               or coalesce(p_reason,'') like 'auto_invalidated%';
  v_status := case when v_invalid then 'auto_invalidated' else 'submitted' end;

  update public.attempts
  set status=v_status,
      submitted_at=coalesce(submitted_at,v_now),
      raw_points=v_raw,
      grade=v_grade,
      correct_count=v_correct,
      incorrect_count=v_incorrect,
      answered_count=v_answered,
      finish_reason=case
        when v_invalid then 'auto_invalidated_integrity'
        else coalesce(p_reason,'student_finished')
      end,
      last_activity_at=v_now
  where id=p_attempt_id
  returning * into v_attempt;

  return jsonb_build_object(
    'status',v_attempt.status,
    'answered_count',v_answered,
    'correct_count',v_correct,
    'incorrect_count',v_incorrect,
    'raw_points',v_raw,
    'grade',v_grade,
    'passing_grade',v_assessment.passing_grade,
    'passed',v_grade>=v_assessment.passing_grade
  );
end;
$$;

revoke all on function public.student_start_attempt(text,text,text,uuid,text)
from public;
revoke all on function public.student_resume_attempt(uuid,text)
from public;
revoke all on function public.student_submit_answer(uuid,text,text,text)
from public;
revoke all on function public.student_log_event(uuid,text,text,text,timestamptz,text,boolean,jsonb)
from public;
revoke all on function public.student_finish_attempt(uuid,text,text)
from public;

grant execute on function public.student_start_attempt(text,text,text,uuid,text)
to anon,authenticated;
grant execute on function public.student_resume_attempt(uuid,text)
to anon,authenticated;
grant execute on function public.student_submit_answer(uuid,text,text,text)
to anon,authenticated;
grant execute on function public.student_log_event(uuid,text,text,text,timestamptz,text,boolean,jsonb)
to anon,authenticated;
grant execute on function public.student_finish_attempt(uuid,text,text)
to anon,authenticated;

commit;
