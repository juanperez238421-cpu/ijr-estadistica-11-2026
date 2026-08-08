begin;

-- Statistics 11 grading policy:
-- - Raw score remains 0..15 points.
-- - Academic grade is mapped linearly from 3.0..5.0.
-- - Passing grade remains 3.0.
-- No question, timing, integrity, roster, or attempt-allocation logic is changed.

update public.assessments
set grade_min = 3.00,
    grade_max = 5.00,
    passing_grade = 3.00
where slug = 'statistics11-counting-permutations-2026';

-- Recalculate already graded attempts so the teacher dashboard and exports
-- use the same policy as all future submissions.
update public.attempts a
set grade = round((
      ass.grade_min
      + (ass.grade_max - ass.grade_min)
        * a.correct_count::numeric / ass.questions_per_student
    )::numeric, 2)
from public.assessments ass
where a.assessment_id = ass.id
  and ass.slug = 'statistics11-counting-permutations-2026'
  and a.correct_count is not null;

-- Defensive production assertion: fail the migration instead of silently
-- deploying an unexpected grading policy.
do $$
declare
  v_min numeric;
  v_max numeric;
  v_pass numeric;
begin
  select grade_min, grade_max, passing_grade
    into v_min, v_max, v_pass
  from public.assessments
  where slug = 'statistics11-counting-permutations-2026';

  if v_min is distinct from 3.00
     or v_max is distinct from 5.00
     or v_pass is distinct from 3.00 then
    raise exception 'Statistics 11 grading policy mismatch: min=%, max=%, passing=%',
      v_min, v_max, v_pass;
  end if;
end;
$$;

notify pgrst, 'reload schema';

commit;
