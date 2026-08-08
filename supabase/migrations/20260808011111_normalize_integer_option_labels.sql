begin;

-- Counting/permutation answers are cardinalities. NUMERIC arithmetic may keep
-- a decimal scale (e.g. 720.0000000000000000) even when the value is integral.
create or replace function public.stat11_clean_numeric_label(p_value text)
returns text
language sql
immutable
set search_path=public
as $$
  select case
    when p_value is null then null
    when btrim(p_value) ~ '^[+-]?[0-9]+\.0+$'
      then regexp_replace(btrim(p_value), '\.0+$', '')
    else btrim(p_value)
  end;
$$;

revoke all on function public.stat11_clean_numeric_label(text) from public,anon,authenticated;

-- Clean the complete current private bank.
update public.questions_private q
set options = (
      select jsonb_agg(to_jsonb(public.stat11_clean_numeric_label(e.value)) order by e.ord)
      from jsonb_array_elements_text(q.options) with ordinality as e(value,ord)
    ),
    correct_answer = public.stat11_clean_numeric_label(q.correct_answer)
where q.active=true
  and q.topic_code in ('FCP','P_SIMPLE','P_DIST','P_CIRC')
  and jsonb_typeof(q.options)='array';

-- Normalize future generated/imported rows as well.
create or replace function public.stat11_normalize_question_labels_trigger()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  if new.topic_code in ('FCP','P_SIMPLE','P_DIST','P_CIRC')
     and jsonb_typeof(new.options)='array' then
    new.correct_answer := public.stat11_clean_numeric_label(new.correct_answer);
    begin
      select jsonb_agg(to_jsonb(public.stat11_clean_numeric_label(e.value)) order by e.ord)
      into new.options
      from jsonb_array_elements_text(new.options) with ordinality as e(value,ord);
    exception when others then
      -- Preserve non-scalar/custom option structures instead of corrupting them.
      null;
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stat11_normalize_question_labels on public.questions_private;
create trigger trg_stat11_normalize_question_labels
before insert or update of options,correct_answer on public.questions_private
for each row execute function public.stat11_normalize_question_labels_trigger();

notify pgrst, 'reload schema';
commit;
