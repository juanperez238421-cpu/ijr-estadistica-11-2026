-- Statistics 11 · 11B final audited gradebook indexes V1
-- Cover audit-row foreign keys without changing any raw evaluation records.

create index if not exists python_hub_eval_grade_audit_rows_student_idx
  on public.python_hub_eval_grade_audit_rows(student_registry_id);

create index if not exists python_hub_eval_grade_audit_rows_attempt_idx
  on public.python_hub_eval_grade_audit_rows(source_attempt_id)
  where source_attempt_id is not null;
