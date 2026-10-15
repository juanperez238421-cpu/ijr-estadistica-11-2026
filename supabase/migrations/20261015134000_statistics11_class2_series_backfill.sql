-- Reconcile only confirmed Class 2 Series validator false negatives.
-- Criteria: latest output exactly Series, valid code under corrected rule,
-- and previously validated stages 07 and 08 (df created and inspected).
-- Leave the original try_count, first_try_correct, code and timestamps untouched.
do $repair$
declare
  v_registrations uuid[] := array[]::uuid[];
  v_registration_id uuid;
  v_correct_count integer;
  v_total_count integer;
begin
  with eligible as (
    select r.registration_id
    from public.python_hub_workshop_responses r
    join public.python_hub_workshop_keys k
      on k.topic_slug = r.topic_slug and k.item_key = r.item_key
    where r.topic_slug = 'logic'
      and r.item_key = 'logic-09'
      and r.correct is false
      and r.latest_answer = k.expected_text
      and coalesce((private.python_hub_code_contract_v28('logic','logic-09',r.code_snapshot)->>'ok')::boolean,false)
      and exists (
        select 1 from public.python_hub_workshop_responses p
        where p.registration_id = r.registration_id
          and p.topic_slug = 'logic' and p.item_key = 'logic-07' and p.correct = true
      )
      and exists (
        select 1 from public.python_hub_workshop_responses p
        where p.registration_id = r.registration_id
          and p.topic_slug = 'logic' and p.item_key = 'logic-08' and p.correct = true
      )
  ), repaired as (
    update public.python_hub_workshop_responses r
    set correct = true,
        completed_at = coalesce(r.completed_at, r.last_answered_at)
    where r.topic_slug = 'logic'
      and r.item_key = 'logic-09'
      and r.correct is false
      and r.registration_id in (select registration_id from eligible)
    returning r.registration_id
  )
  select coalesce(array_agg(registration_id),array[]::uuid[])
    into v_registrations from repaired;

  foreach v_registration_id in array v_registrations loop
    select count(*) into v_correct_count
    from public.python_hub_workshop_responses
    where registration_id = v_registration_id
      and topic_slug = 'logic' and correct = true;

    select count(*) into v_total_count
    from public.python_hub_workshop_keys
    where topic_slug = 'logic';

    update public.python_hub_topic_progress
       set correct_count = v_correct_count,
           total_count = v_total_count,
           percent = case when v_total_count = 0 then 0
                          else round(100.0 * v_correct_count / v_total_count)::integer end,
           status = case when v_total_count > 0 and v_correct_count >= v_total_count
                         then 'completed'
                         when v_correct_count > 0 then 'in_progress'
                         else status end,
           completed_at = case when v_total_count > 0 and v_correct_count >= v_total_count
                                then coalesce(completed_at,clock_timestamp()) else completed_at end,
           updated_at = clock_timestamp()
     where registration_id = v_registration_id and topic_slug = 'logic';
    perform private.python_hub_refresh_v1(v_registration_id);
  end loop;

  raise notice 'Class 2 logic-09 response records repaired: %',cardinality(v_registrations);
end
$repair$;
