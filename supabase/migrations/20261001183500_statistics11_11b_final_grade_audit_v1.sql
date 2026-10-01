-- Statistics 11 · 11B final audited gradebook V1
-- Evaluation: modules-1-3-2026-10-01
-- Purpose: preserve raw attempts/responses/events exactly as recorded while
-- storing a separate final teacher-audit overlay for the 11B roster.
--
-- Confirmed technical correction:
--   CARDONA VILLEGAS ANTONIA: 14 -> 15 points.
--   M123-52 accepted semantically equivalent indexing:
--     index=1; print(list[index])
--   The original grader required the literal token [1], causing a false negative.
--
-- No pedagogical-tolerance overrides are applied here.
-- Pedro Pablo Arbeláez remains 17/18: the correct numeric result 32 was present,
-- but the submitted short-text answer also contained extra text.
--
-- The unlinked email antonia.gomez@ijr.edu.co is intentionally not mapped to a
-- roster student by this audit. Its original raw attempt-member record remains intact.

create table if not exists public.python_hub_eval_grade_audit_batches (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.python_hub_eval_assessments(id) on delete restrict,
  group_code text not null check (group_code in ('11A','11B','11C')),
  audit_version integer not null check (audit_version > 0),
  status text not null check (status in ('final')),
  grading_formula text not null,
  policy_note text not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (evaluation_id,group_code,audit_version)
);

create table if not exists public.python_hub_eval_grade_audit_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.python_hub_eval_grade_audit_batches(id) on delete cascade,
  student_registry_id uuid not null references public.student_registry(id) on delete restrict,
  student_name_snapshot text not null,
  source_attempt_id uuid references public.python_hub_eval_attempts(id) on delete restrict,
  source_attempt_group text,
  stored_points numeric(8,2),
  audited_points numeric(8,2),
  grade_5 numeric(4,2),
  result_status text not null check (result_status in ('submitted','no_exam')),
  adjustment_points numeric(8,2) not null default 0,
  audit_code text not null,
  audit_note text not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (batch_id,student_registry_id)
);

alter table public.python_hub_eval_grade_audit_batches enable row level security;
alter table public.python_hub_eval_grade_audit_rows enable row level security;

revoke all on table public.python_hub_eval_grade_audit_batches from anon,authenticated;
revoke all on table public.python_hub_eval_grade_audit_rows from anon,authenticated;

with target_eval as (
  select id
  from public.python_hub_eval_assessments
  where slug='modules-1-3-2026-10-01'
)
insert into public.python_hub_eval_grade_audit_batches(
  evaluation_id,group_code,audit_version,status,grading_formula,policy_note
)
select
  e.id,
  '11B',
  1,
  'final',
  'grade_5 = round(1 + 4 * audited_points / 18, 2)',
  'Final technical audit freeze. Raw attempts, assignments, responses and integrity events remain unchanged. Only confirmed technical false negatives are adjusted. Pedagogical tolerance is excluded. Pedro Pablo Arbeláez remains 17/18. Unlinked email antonia.gomez@ijr.edu.co is excluded from roster attribution until identity is verified.'
from target_eval e
on conflict (evaluation_id,group_code,audit_version) do nothing;

with target_eval as (
  select id,max_points
  from public.python_hub_eval_assessments
  where slug='modules-1-3-2026-10-01'
),
batch as (
  select b.id
  from public.python_hub_eval_grade_audit_batches b
  join target_eval e on e.id=b.evaluation_id
  where b.group_code='11B' and b.audit_version=1
),
roster as (
  select s.id,s.source_position,s.display_name
  from public.student_registry s
  where s.active=true and s.group_code='11B'
),
member_results as (
  select distinct on (m.student_registry_id)
    m.student_registry_id,
    a.id as attempt_id,
    a.group_code as attempt_group,
    a.status,
    a.points_remaining,
    a.submitted_at
  from public.python_hub_eval_attempt_members m
  join public.python_hub_eval_attempts a on a.id=m.attempt_id
  join target_eval e on e.id=a.evaluation_id
  where m.student_registry_id is not null
  order by m.student_registry_id,a.submitted_at desc nulls last,a.started_at desc
),
prepared as (
  select
    r.id as student_registry_id,
    r.display_name,
    mr.attempt_id,
    mr.attempt_group,
    mr.points_remaining as stored_points,
    case
      when r.display_name='CARDONA VILLEGAS ANTONIA' and mr.attempt_id is not null
        then mr.points_remaining + 1
      else mr.points_remaining
    end as audited_points,
    case when mr.attempt_id is null then 'no_exam' else 'submitted' end as result_status,
    case
      when r.display_name='CARDONA VILLEGAS ANTONIA' and mr.attempt_id is not null then 1
      else 0
    end::numeric(8,2) as adjustment_points,
    case
      when mr.attempt_id is null then 'no_exam'
      when r.display_name='CARDONA VILLEGAS ANTONIA' then 'technical_false_negative_m123_52'
      else 'no_technical_adjustment'
    end as audit_code,
    case
      when mr.attempt_id is null then
        'No linked submitted attempt at the 11B final audit freeze.'
      when r.display_name='CARDONA VILLEGAS ANTONIA' then
        'Confirmed grader false negative on M123-52: code used index=1 and print(list[index]) and produced 10. The original grader required the literal token [1]. Raw response and stored attempt remain unchanged.'
      when r.display_name='ARBELAEZ ESCOBAR PEDRO PABLO' then
        'Technical review found no reader/grader bug. Submitted short-text response contained extra text plus 32; because the prompt required only the output, no technical override was applied.'
      else
        'Technical review found no evidence that the app read or scored a correct submitted response incorrectly.'
    end as audit_note
  from roster r
  left join member_results mr on mr.student_registry_id=r.id
)
insert into public.python_hub_eval_grade_audit_rows(
  batch_id,student_registry_id,student_name_snapshot,
  source_attempt_id,source_attempt_group,
  stored_points,audited_points,grade_5,result_status,
  adjustment_points,audit_code,audit_note
)
select
  b.id,
  p.student_registry_id,
  p.display_name,
  p.attempt_id,
  p.attempt_group,
  p.stored_points,
  p.audited_points,
  case
    when p.audited_points is null then null
    else round(1 + 4 * p.audited_points / e.max_points,2)
  end,
  p.result_status,
  p.adjustment_points,
  p.audit_code,
  p.audit_note
from prepared p
cross join batch b
cross join target_eval e
on conflict (batch_id,student_registry_id) do nothing;

do $audit$
declare
  v_batch uuid;
  v_rows integer;
  v_submitted integer;
  v_no_exam integer;
  v_adjusted integer;
  v_antonia numeric;
  v_pedro numeric;
begin
  select b.id into v_batch
  from public.python_hub_eval_grade_audit_batches b
  join public.python_hub_eval_assessments e on e.id=b.evaluation_id
  where e.slug='modules-1-3-2026-10-01'
    and b.group_code='11B'
    and b.audit_version=1;

  if v_batch is null then
    raise exception '11B final audit batch was not created';
  end if;

  select count(*) into v_rows
  from public.python_hub_eval_grade_audit_rows
  where batch_id=v_batch;

  select count(*) into v_submitted
  from public.python_hub_eval_grade_audit_rows
  where batch_id=v_batch and result_status='submitted';

  select count(*) into v_no_exam
  from public.python_hub_eval_grade_audit_rows
  where batch_id=v_batch and result_status='no_exam';

  select count(*) into v_adjusted
  from public.python_hub_eval_grade_audit_rows
  where batch_id=v_batch and adjustment_points<>0;

  select audited_points into v_antonia
  from public.python_hub_eval_grade_audit_rows
  where batch_id=v_batch and student_name_snapshot='CARDONA VILLEGAS ANTONIA';

  select audited_points into v_pedro
  from public.python_hub_eval_grade_audit_rows
  where batch_id=v_batch and student_name_snapshot='ARBELAEZ ESCOBAR PEDRO PABLO';

  if v_rows<>21 then raise exception '11B audit expected 21 roster rows, found %',v_rows; end if;
  if v_submitted<>17 then raise exception '11B audit expected 17 submitted students, found %',v_submitted; end if;
  if v_no_exam<>4 then raise exception '11B audit expected 4 no-exam students, found %',v_no_exam; end if;
  if v_adjusted<>1 then raise exception '11B audit expected exactly one technical adjustment, found %',v_adjusted; end if;
  if v_antonia<>15 then raise exception 'Antonia Cardona audited points mismatch: %',v_antonia; end if;
  if v_pedro<>17 then raise exception 'Pedro Pablo audited points mismatch: %',v_pedro; end if;
end
$audit$;

comment on table public.python_hub_eval_grade_audit_batches is
  'Immutable-style audit batches that preserve original Statistics 11 evaluation records and store teacher-approved final grading overlays.';

comment on table public.python_hub_eval_grade_audit_rows is
  'Per-roster-student audited grade snapshot. Raw evaluation attempts/responses/events are never overwritten by this table.';
