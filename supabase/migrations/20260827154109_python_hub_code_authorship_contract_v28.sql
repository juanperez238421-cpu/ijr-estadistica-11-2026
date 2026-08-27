-- V28 · Functional code-authorship validation for the Statistics 11 Python Hub.
-- Student progress is credited only when both the runtime output and the requested code structure are valid.
-- Expected outputs remain in the existing private validation path; this migration adds no new answer keys.

create or replace function private.python_hub_code_contract_v28(
  p_topic_slug text,
  p_item_key text,
  p_code text
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'extensions', 'pg_catalog'
as $$
declare
  v_code text := lower(coalesce(p_code, ''));
  v_compact text;
  v_assignments integer;
  v_brackets integer;
  v_ok boolean := true;
  v_feedback text := 'Write the Python process requested by the stage. Do not submit only a direct final answer.';
begin
  v_compact := regexp_replace(v_code, '[[:space:]]+', '', 'g');
  v_assignments := length(v_code) - length(replace(v_code, '=', ''));
  v_brackets := length(v_code) - length(replace(v_code, '[', ''));

  if btrim(v_code) = '' then
    return jsonb_build_object('ok', false, 'feedback', 'The code cell is empty. Write the requested Python solution before validating.');
  end if;

  if p_item_key = 'op-01' then
    v_ok := position('+' in v_compact) > 0 and v_assignments >= 3;
  elsif p_item_key = 'op-02' then
    v_ok := position('+' in v_compact) > 0 and position('*' in v_compact) > 0;
  elsif p_item_key = 'op-03' then
    v_ok := position('**' in v_compact) > 0 and v_assignments >= 1;
  elsif p_item_key = 'op-04' then
    v_ok := position('**' in v_compact) > 0 and position('0.5' in v_compact) > 0 and v_assignments >= 1;
  elsif p_item_key = 'op-07' then
    v_ok := position('%' in v_compact) > 0 and v_assignments >= 2;
  elsif p_item_key = 'op-08' then
    v_ok := position('/' in v_compact) > 0 and v_assignments >= 3;
  elsif p_item_key = 'op-09' then
    v_ok := position('+' in v_compact) > 0 and position('*' in v_compact) > 0 and position('(' in v_compact) > 0 and v_assignments >= 2;
  elsif p_item_key = 'op-10' then
    v_ok := position('*' in v_compact) > 0 and position('+' in v_compact) > 0 and v_assignments >= 3;
  elsif p_item_key = 'op-11' then
    v_ok := position('-' in v_compact) > 0 and position('/' in v_compact) > 0 and v_assignments >= 4;
  elsif p_item_key = 'op-12' then
    v_ok := position('*' in v_compact) > 0 and position('+' in v_compact) > 0 and v_assignments >= 5;

  elsif p_item_key in ('type-01','type-02','type-03','type-04','type-06') then
    v_ok := position('type(' in v_compact) > 0 and v_assignments >= 1;
  elsif p_item_key = 'type-05' then
    v_ok := position('int(' in v_compact) > 0 and position('+' in v_compact) > 0 and v_assignments >= 1;
  elsif p_item_key = 'type-07' then
    v_ok := position('int(' in v_compact) > 0 and position('type(' in v_compact) > 0;
  elsif p_item_key = 'type-08' then
    v_ok := position('float(' in v_compact) > 0 and v_assignments >= 2;
  elsif p_item_key = 'type-09' then
    v_ok := position('str(' in v_compact) > 0 and position('type(' in v_compact) > 0;
  elsif p_item_key = 'type-10' then
    v_ok := position('>' in v_compact) > 0 and position('type(' in v_compact) > 0 and v_assignments >= 2;
  elsif p_item_key = 'type-11' then
    v_ok := position('str(' in v_compact) > 0 and v_assignments >= 2;
  elsif p_item_key = 'type-12' then
    v_ok := position('none' in v_compact) > 0 and position('3.5' in v_compact) > 0 and position('type(' in v_compact) > 0 and v_assignments >= 2;

  elsif p_item_key in ('arr-01','arr-07') then
    v_feedback := 'Create the list and retrieve the requested position with bracket indexing. Do not print the visible list item directly.';
    v_ok := v_assignments >= 1 and v_brackets >= 2;
  elsif p_item_key = 'arr-02' then
    v_feedback := 'Create the list and use len() on the list variable. Do not type the count directly.';
    v_ok := v_assignments >= 1 and position('len(' in v_compact) > 0;
  elsif p_item_key = 'arr-03' then
    v_feedback := 'Create the list and use sum() on the complete list. Do not type a pre-calculated total.';
    v_ok := v_assignments >= 1 and position('sum(' in v_compact) > 0;
  elsif p_item_key = 'arr-04' then
    v_feedback := 'Use min() and max() on the list variable and print their results in the requested order.';
    v_ok := v_assignments >= 1 and position('min(' in v_compact) > 0 and position('max(' in v_compact) > 0;
  elsif p_item_key = 'arr-05' then
    v_feedback := 'Create the original list, modify that same list with append(), then print the list variable.';
    v_ok := v_assignments >= 1 and position('.append(' in v_compact) > 0;
  elsif p_item_key = 'arr-06' then
    v_feedback := 'Calculate the mean from the list with sum() and len(). Do not print a pre-calculated mean.';
    v_ok := v_assignments >= 2 and position('sum(' in v_compact) > 0 and position('len(' in v_compact) > 0 and position('/' in v_compact) > 0;
  elsif p_item_key = 'arr-08' then
    v_feedback := 'Use len() to derive the last valid index, then retrieve the final item with bracket indexing. Do not hard-code the last index or item.';
    v_ok := v_assignments >= 1 and position('len(' in v_compact) > 0 and position('-1' in v_compact) > 0 and v_brackets >= 2;
  elsif p_item_key = 'arr-09' then
    v_feedback := 'Append the new observation first, then use len() on the updated list.';
    v_ok := v_assignments >= 1 and position('.append(' in v_compact) > 0 and position('len(' in v_compact) > 0;
  elsif p_item_key = 'arr-10' then
    v_feedback := 'Calculate the list range with max() minus min(). Do not type the numerical range directly.';
    v_ok := v_assignments >= 1 and position('max(' in v_compact) > 0 and position('min(' in v_compact) > 0 and position('-' in v_compact) > 0;
  elsif p_item_key = 'arr-11' then
    v_feedback := 'Append to the original list, then calculate the updated total with sum().';
    v_ok := v_assignments >= 1 and position('.append(' in v_compact) > 0 and position('sum(' in v_compact) > 0;
  elsif p_item_key = 'arr-12' then
    v_feedback := 'Access the first and last list items through indexing, then add the retrieved values. Do not copy the endpoint numbers into a direct calculation.';
    v_ok := v_assignments >= 1 and v_brackets >= 3 and position('+' in v_compact) > 0;

  elsif p_item_key in ('logic-01','logic-07') then
    v_ok := position('>=' in v_compact) > 0 or position('==' in v_compact) > 0;
    if p_item_key = 'logic-07' then v_ok := position('==' in v_compact) > 0; end if;
  elsif p_item_key = 'logic-02' then
    v_ok := position('==' in v_compact) > 0;
  elsif p_item_key in ('logic-03','logic-11') then
    v_ok := position('!=' in v_compact) > 0;
  elsif p_item_key = 'logic-04' then
    v_ok := position('>=' in v_compact) > 0 and position('and' in v_compact) > 0;
  elsif p_item_key = 'logic-05' then
    v_ok := position('<' in v_compact) > 0 and position('>' in v_compact) > 0 and position('or' in v_compact) > 0;
  elsif p_item_key = 'logic-08' then
    v_ok := position('>=' in v_compact) > 0 and position('not' in v_compact) > 0;
  elsif p_item_key = 'logic-09' then
    v_ok := position('<' in v_compact) > 0 and position('>' in v_compact) > 0 and position('or' in v_compact) > 0;
  elsif p_item_key = 'logic-10' then
    v_ok := position('>' in v_compact) > 0 and position('<' in v_compact) > 0 and position('and' in v_compact) > 0;
  elsif p_item_key = 'logic-12' then
    v_ok := position('>=' in v_compact) > 0 and position('and' in v_compact) > 0 and position('not' in v_compact) > 0;

  elsif p_topic_slug = 'conditions' then
    v_ok := position('if' in v_compact) > 0 and position('else' in v_compact) > 0;
    if p_item_key in ('cond-02','cond-07','cond-09','cond-11') then
      v_ok := v_ok and position('elif' in v_compact) > 0;
    end if;
    if p_item_key in ('cond-04','cond-12') then
      v_ok := v_ok and position('and' in v_compact) > 0;
    end if;
    if p_item_key = 'cond-08' then
      v_ok := v_ok and position('%' in v_compact) > 0;
    end if;

  elsif p_topic_slug = 'loops' then
    v_ok := position('for' in v_compact) > 0;
    if p_item_key in ('loop-03','loop-08','loop-09') then v_ok := v_ok and position('if' in v_compact) > 0; end if;
    if p_item_key = 'loop-08' then v_ok := v_ok and position('%' in v_compact) > 0; end if;
    if p_item_key in ('loop-04','loop-10') then v_ok := v_ok and position('range(' in v_compact) > 0; end if;
    if p_item_key in ('loop-07','loop-11') then v_ok := v_ok and position('*' in v_compact) > 0; end if;
    if p_item_key = 'loop-12' then v_ok := v_ok and (position('**' in v_compact) > 0 or position('*' in v_compact) > 0); end if;

  elsif p_topic_slug = 'functions' then
    v_ok := position('def' in v_compact) > 0 and position('return' in v_compact) > 0;
    if p_item_key = 'fn-01' then v_ok := v_ok and position('+' in v_compact) > 0; end if;
    if p_item_key = 'fn-02' then v_ok := v_ok and position('sum(' in v_compact) > 0 and position('len(' in v_compact) > 0; end if;
    if p_item_key = 'fn-03' then v_ok := v_ok and (position('**' in v_compact) > 0 or position('*' in v_compact) > 0); end if;
    if p_item_key = 'fn-04' then v_ok := v_ok and position('max(' in v_compact) > 0; end if;
    if p_item_key = 'fn-07' then v_ok := v_ok and position('-' in v_compact) > 0; end if;
    if p_item_key = 'fn-08' then v_ok := v_ok and position('%' in v_compact) > 0 and position('==' in v_compact) > 0; end if;
    if p_item_key = 'fn-09' then v_ok := v_ok and position('sum(' in v_compact) > 0; end if;
    if p_item_key = 'fn-10' then v_ok := v_ok and position('max(' in v_compact) > 0 and position('min(' in v_compact) > 0; end if;
    if p_item_key = 'fn-11' then v_ok := v_ok and position('for' in v_compact) > 0 and position('if' in v_compact) > 0 and position('>' in v_compact) > 0; end if;
    if p_item_key = 'fn-12' then v_ok := v_ok and v_brackets >= 3; end if;

  elsif p_topic_slug = 'statistics' then
    if p_item_key = 'stat-01' then
      v_ok := position('len(' in v_compact) > 0 and position('sum(' in v_compact) > 0;
    elsif p_item_key = 'stat-02' then
      v_ok := position('sum(' in v_compact) > 0 and position('len(' in v_compact) > 0 and position('/' in v_compact) > 0;
    elsif p_item_key = 'stat-03' then
      v_ok := position('max(' in v_compact) > 0 and position('min(' in v_compact) > 0 and position('-' in v_compact) > 0;
    elsif p_item_key = 'stat-04' then
      v_ok := position('sum(' in v_compact) > 0 and position('len(' in v_compact) > 0 and position('for' in v_compact) > 0 and position('if' in v_compact) > 0;
    elsif p_item_key = 'stat-05' then
      v_ok := position('def' in v_compact) > 0 and position('return' in v_compact) > 0 and position('sum(' in v_compact) > 0 and position('len(' in v_compact) > 0 and position('max(' in v_compact) > 0 and position('min(' in v_compact) > 0;
    elsif p_item_key = 'stat-07' then
      v_ok := position('min(' in v_compact) > 0 and position('max(' in v_compact) > 0;
    elsif p_item_key = 'stat-08' then
      v_ok := position('.append(' in v_compact) > 0 and position('sum(' in v_compact) > 0 and position('len(' in v_compact) > 0;
    elsif p_item_key = 'stat-09' then
      v_ok := position('for' in v_compact) > 0 and position('if' in v_compact) > 0 and position('len(' in v_compact) > 0 and position('>=' in v_compact) > 0 and position('100' in v_compact) > 0;
    elsif p_item_key = 'stat-10' then
      v_ok := position('max(' in v_compact) > 0 and position('min(' in v_compact) > 0;
    elsif p_item_key = 'stat-11' then
      v_ok := position('sum(' in v_compact) > 0 and position('len(' in v_compact) > 0 and position('max(' in v_compact) > 0 and position('min(' in v_compact) > 0;
    elsif p_item_key = 'stat-12' then
      v_ok := position('sum(' in v_compact) > 0 and position('len(' in v_compact) > 0 and position('for' in v_compact) > 0 and position('if' in v_compact) > 0 and position('<' in v_compact) > 0;
    end if;
  end if;

  if not v_ok then
    return jsonb_build_object('ok', false, 'feedback', v_feedback);
  end if;
  return jsonb_build_object('ok', true, 'feedback', 'Code structure matches the stage requirements.');
end;
$$;

revoke all on function private.python_hub_code_contract_v28(text,text,text) from public, anon, authenticated;

create or replace function public.python_hub_submit_v1(
  p_registration_id uuid,
  p_access_token text,
  p_topic_slug text,
  p_item_key text,
  p_answer text,
  p_code_snapshot text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions', 'pg_catalog'
as $$
declare
  v_registration public.python_hub_registrations%rowtype;
  v_progress public.python_hub_topic_progress%rowtype;
  v_key public.python_hub_workshop_keys%rowtype;
  v_existing public.python_hub_workshop_responses%rowtype;
  v_answer text;
  v_expected text;
  v_correct boolean;
  v_total integer;
  v_correct_count integer;
  v_code_check jsonb := jsonb_build_object('ok', true, 'feedback', null);
  v_code_valid boolean := true;
  v_code_feedback text := null;
begin
  v_registration:=private.python_hub_registration_v1(p_registration_id,p_access_token);
  perform private.python_hub_refresh_v1(v_registration.id);
  select * into v_progress from public.python_hub_topic_progress where registration_id=v_registration.id and topic_slug=p_topic_slug for update;
  if v_progress.registration_id is null then raise exception 'Unknown topic'; end if;
  if v_progress.status='locked' then raise exception 'Complete the previous workshop first'; end if;
  select * into v_key from public.python_hub_workshop_keys where topic_slug=p_topic_slug and item_key=p_item_key;
  if v_key.item_key is null then raise exception 'Unknown workshop item'; end if;

  v_answer:=replace(replace(trim(coalesce(p_answer,'')),E'\r\n',E'\n'),E'\r',E'\n');
  v_expected:=replace(replace(trim(v_key.expected_text),E'\r\n',E'\n'),E'\r',E'\n');

  if v_key.mode='code' then
    v_code_check:=private.python_hub_code_contract_v28(p_topic_slug,p_item_key,p_code_snapshot);
    v_code_valid:=coalesce((v_code_check->>'ok')::boolean,false);
    v_code_feedback:=v_code_check->>'feedback';
  end if;

  v_correct:=(v_answer=v_expected) and v_code_valid;

  select * into v_existing from public.python_hub_workshop_responses where registration_id=v_registration.id and topic_slug=p_topic_slug and item_key=p_item_key for update;
  if v_existing.registration_id is null then
    insert into public.python_hub_workshop_responses(registration_id,topic_slug,item_key,latest_answer,code_snapshot,try_count,correct,first_try_correct,first_answered_at,last_answered_at,completed_at)
    values(v_registration.id,p_topic_slug,p_item_key,v_answer,left(coalesce(p_code_snapshot,''),12000),1,v_correct,v_correct,clock_timestamp(),clock_timestamp(),case when v_correct then clock_timestamp() else null end);
  else
    update public.python_hub_workshop_responses
    set latest_answer=v_answer,
        code_snapshot=left(coalesce(p_code_snapshot,code_snapshot),12000),
        try_count=try_count+1,
        correct=correct or v_correct,
        last_answered_at=clock_timestamp(),
        completed_at=case when correct or v_correct then coalesce(completed_at,clock_timestamp()) else null end
    where registration_id=v_registration.id and topic_slug=p_topic_slug and item_key=p_item_key;
  end if;

  select count(*) into v_total from public.python_hub_workshop_keys where topic_slug=p_topic_slug;
  select count(*) into v_correct_count from public.python_hub_workshop_responses where registration_id=v_registration.id and topic_slug=p_topic_slug and correct=true;
  update public.python_hub_topic_progress
  set correct_count=v_correct_count,
      total_count=v_total,
      percent=case when v_total=0 then 0 else round(100.0*v_correct_count/v_total)::int end,
      status=case when v_correct_count>=v_total and v_total>0 then 'completed' when v_correct_count>0 then 'in_progress' else status end,
      started_at=coalesce(started_at,clock_timestamp()),
      completed_at=case when v_correct_count>=v_total and v_total>0 then coalesce(completed_at,clock_timestamp()) else completed_at end,
      updated_at=clock_timestamp()
  where registration_id=v_registration.id and topic_slug=p_topic_slug;
  perform private.python_hub_refresh_v1(v_registration.id);

  return jsonb_build_object(
    'correct',v_correct,
    'code_valid',v_code_valid,
    'code_feedback',v_code_feedback,
    'topic_completed',(select status='completed' from public.python_hub_topic_progress where registration_id=v_registration.id and topic_slug=p_topic_slug),
    'snapshot',public.python_hub_snapshot_v1(v_registration.id,p_access_token)
  );
end;
$$;

notify pgrst, 'reload schema';