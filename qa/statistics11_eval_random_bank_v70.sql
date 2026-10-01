-- Statistics 11 · Evaluation random bank V70 QA
-- Safe to run on production: all synthetic records are rolled back.
-- Verifies the 54-question bank, balanced 18-question papers and spread.

begin;

do $qa$
declare
  v_eval uuid;
  v_bad int;
  v_invalid_keys int;
  i int;
  email text;
  login jsonb;
  started jsonb;
  rid uuid;
  token text;
  aid uuid;
  sig text;
  signatures text[]:=array[]::text[];
  v_distinct int;
  v_spread int;
begin
  select id into v_eval
  from public.python_hub_eval_assessments
  where slug='modules-1-3-2026-10-01';

  assert v_eval is not null,'Evaluation missing';

  assert (
    select count(*)
    from public.python_hub_eval_questions_private
    where evaluation_id=v_eval and active=true
  )=54,'Expected 54 active questions';

  with expected(module_no,question_type,n) as (
    values
      (1::smallint,'true_false',3),(1::smallint,'multiple_choice',6),(1::smallint,'short_text',3),(1::smallint,'code',6),
      (2::smallint,'true_false',3),(2::smallint,'multiple_choice',6),(2::smallint,'short_text',3),(2::smallint,'code',6),
      (3::smallint,'true_false',3),(3::smallint,'multiple_choice',6),(3::smallint,'short_text',3),(3::smallint,'code',6)
  ),
  actual as (
    select module_no,question_type,count(*)::int n
    from public.python_hub_eval_questions_private
    where evaluation_id=v_eval and active=true
    group by module_no,question_type
  )
  select count(*) into v_bad
  from expected e
  left join actual a using(module_no,question_type)
  where coalesce(a.n,0)<>e.n;

  assert v_bad=0,'Question-bank bucket counts are incorrect';

  select count(*) into v_invalid_keys
  from public.python_hub_eval_questions_private q
  where q.evaluation_id=v_eval
    and q.active=true
    and not private.python_hub_eval_answer_correct_v1(
      q.id,
      case
        when q.question_type in ('true_false','multiple_choice') then q.answer_key->>'value'
        when q.question_type='short_text' then q.answer_key->'accepted'->>0
        else coalesce(q.answer_key->>'expected_output',q.answer_key->'accepted_outputs'->>0)
      end,
      case
        when q.question_type='code' then
          coalesce((
            select string_agg(x.value,' ')
            from jsonb_array_elements_text(coalesce(q.answer_key->'required_tokens','[]'::jsonb)) x(value)
          ),'print')
        else null
      end,
      case
        when q.question_type='code' then
          coalesce(q.answer_key->'accepted_outputs'->>0,q.answer_key->>'expected_output')
        else null
      end
    );

  assert v_invalid_keys=0,'One or more declared answer keys fail the server grader';

  for i in 1..12 loop
    email:='qa.bank.v70.'||i||'.'||replace(gen_random_uuid()::text,'-','')||'@ijr.edu.co';
    login:=public.python_hub_lab_login_v52('11A',email,gen_random_uuid(),'Random bank V70 rollback QA');
    rid:=(login->>'registration_id')::uuid;
    token:=login->>'access_token';

    started:=public.python_hub_eval_start_v1(
      rid,token,'modules-1-3-2026-10-01',jsonb_build_array(email),gen_random_uuid(),'Random bank V70 rollback QA'
    );
    aid:=(started->>'attempt_id')::uuid;

    assert (
      select count(*) from public.python_hub_eval_assignments where attempt_id=aid
    )=18,'Attempt does not contain 18 questions';

    assert not exists (
      with expected(module_no,question_type,n) as (
        values
          (1::smallint,'true_false',1),(1::smallint,'multiple_choice',2),(1::smallint,'short_text',1),(1::smallint,'code',2),
          (2::smallint,'true_false',1),(2::smallint,'multiple_choice',2),(2::smallint,'short_text',1),(2::smallint,'code',2),
          (3::smallint,'true_false',1),(3::smallint,'multiple_choice',2),(3::smallint,'short_text',1),(3::smallint,'code',2)
      ),
      actual as (
        select q.module_no,q.question_type,count(*)::int n
        from public.python_hub_eval_assignments a
        join public.python_hub_eval_questions_private q on q.id=a.question_id
        where a.attempt_id=aid
        group by q.module_no,q.question_type
      )
      select 1
      from expected e
      left join actual a using(module_no,question_type)
      where coalesce(a.n,0)<>e.n
    ),'Attempt blueprint is unbalanced';

    select string_agg(question_id,',' order by question_id)
    into sig
    from public.python_hub_eval_assignments
    where attempt_id=aid;
    signatures:=array_append(signatures,sig);
  end loop;

  select count(distinct x) into v_distinct from unnest(signatures) x;
  assert v_distinct>=10,'Randomized papers repeat too often';

  with per_question as (
    select q.module_no,q.question_type,q.id,count(a.question_id)::int uses
    from public.python_hub_eval_questions_private q
    left join public.python_hub_eval_assignments a on a.question_id=q.id
    where q.evaluation_id=v_eval and q.active=true
    group by q.module_no,q.question_type,q.id
  ),
  per_bucket as (
    select module_no,question_type,max(uses)-min(uses) spread
    from per_question
    group by module_no,question_type
  )
  select max(spread) into v_spread from per_bucket;

  assert v_spread<=1,'Least-used balancing drifted by more than one assignment';
end
$qa$;

rollback;

select 'PASS: V70 random bank QA' as verification;
