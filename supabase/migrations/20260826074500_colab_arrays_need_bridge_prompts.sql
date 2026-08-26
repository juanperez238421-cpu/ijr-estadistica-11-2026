-- Statistics 11 · Arrays bridge · 2026-08-26
-- Pedagogical goal: make the need for an array/list explicit before indexing.
-- The existing 36-pack bank, expected answers, starter code, grading, and RPCs are preserved.

with activity as (
  select id
  from public.learning_activities
  where slug = 'statistics11-colab-class1-basics-types-arrays-2026'
)
update public.learning_activity_variant_bank v
set
  prompt = case v.checkpoint_key
    when 'A6' then
      'You already know how to store one value in one variable. If five scores were stored separately, you would need five variable names. Python can group them in one variable instead. ' || v.prompt
    when 'A7' then
      'Now several values are stored together inside one variable. The values remain ordered, so Python can identify each position with an index. ' || v.prompt
    when 'A8' then
      'The advantage is now visible: one variable stores several ordered values, and an index lets you select only the value you need. ' || v.prompt
    else v.prompt
  end,
  hint = case v.checkpoint_key
    when 'A6' then 'Think first about the storage problem: one list name now replaces several separate variable names. Python indexing starts at zero; use the list name followed by [0].'
    when 'A7' then 'The values are inside one ordered variable. Index 2 is the third element because Python starts counting at zero.'
    when 'A8' then 'One variable contains several values. The second item is index 1 because the first item is index 0.'
    else v.hint
  end,
  metadata = coalesce(v.metadata, '{}'::jsonb) || jsonb_build_object(
    'pedagogy', 'variables_to_array_need',
    'bridge_version', '2026-08-26'
  ),
  updated_at = clock_timestamp()
from activity a
where v.activity_id = a.id
  and v.checkpoint_key in ('A6','A7','A8');

-- QA guard: every randomized pack must still contain the three array stages.
do $qa$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.learning_activity_variant_bank v
  join public.learning_activities a on a.id = v.activity_id
  where a.slug = 'statistics11-colab-class1-basics-types-arrays-2026'
    and v.checkpoint_key in ('A6','A7','A8');

  if v_count <> 108 then
    raise exception 'Arrays bridge QA failed: expected 108 A6-A8 variants, found %', v_count;
  end if;
end;
$qa$;
