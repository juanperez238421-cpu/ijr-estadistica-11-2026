begin;

create or replace function public.allocate_assessment_questions(
  p_assessment_id uuid,
  p_student_id text
)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  v_expected integer;
  v_existing integer;
  v_fcp integer := 5;
  v_simple integer := 5;
  v_dist integer := 4;
  v_circ integer := 4;
  v_available integer;
begin
  if p_student_id is null or length(trim(p_student_id)) < 3 then
    raise exception 'Invalid student_id';
  end if;

  select questions_per_student into v_expected
  from public.assessments
  where id=p_assessment_id;

  if v_expected is null then
    raise exception 'Assessment not found';
  end if;

  if v_expected <> 18 then
    raise exception 'Dynamic allocator currently requires 18 questions; assessment has %',v_expected;
  end if;

  perform pg_advisory_xact_lock(hashtext(p_assessment_id::text));

  select count(*) into v_existing
  from public.assignments
  where assessment_id=p_assessment_id and student_id=p_student_id;

  if v_existing=v_expected then
    return v_existing;
  elsif v_existing<>0 then
    raise exception 'Partial assignment exists for %, found %/%',p_student_id,v_existing,v_expected;
  end if;

  select count(*) into v_available
  from public.questions_private q
  where q.active=true
    and not exists (
      select 1 from public.assignments a
      where a.assessment_id=p_assessment_id and a.question_id=q.id
    );
  if v_available < v_expected then
    raise exception 'Insufficient unused questions: % available',v_available;
  end if;

  with selected as (
    (select q.id,q.topic_code
     from public.questions_private q
     where q.active=true and q.topic_code='FCP'
       and not exists(select 1 from public.assignments a where a.assessment_id=p_assessment_id and a.question_id=q.id)
     order by md5(q.id||'|'||p_student_id) limit v_fcp)
    union all
    (select q.id,q.topic_code
     from public.questions_private q
     where q.active=true and q.topic_code='P_SIMPLE'
       and not exists(select 1 from public.assignments a where a.assessment_id=p_assessment_id and a.question_id=q.id)
     order by md5(q.id||'|'||p_student_id) limit v_simple)
    union all
    (select q.id,q.topic_code
     from public.questions_private q
     where q.active=true and q.topic_code='P_DIST'
       and not exists(select 1 from public.assignments a where a.assessment_id=p_assessment_id and a.question_id=q.id)
     order by md5(q.id||'|'||p_student_id) limit v_dist)
    union all
    (select q.id,q.topic_code
     from public.questions_private q
     where q.active=true and q.topic_code='P_CIRC'
       and not exists(select 1 from public.assignments a where a.assessment_id=p_assessment_id and a.question_id=q.id)
     order by md5(q.id||'|'||p_student_id) limit v_circ)
  ), randomized as (
    select id,row_number() over(order by md5(id||'|order|'||p_student_id))::integer as question_order
    from selected
  )
  insert into public.assignments(assessment_id,student_id,question_id,question_order,option_order)
  select p_assessment_id,p_student_id,id,question_order,null
  from randomized;

  get diagnostics v_existing = row_count;
  if v_existing<>v_expected then
    raise exception 'Could not allocate complete assignment: %/% questions',v_existing,v_expected;
  end if;
  return v_existing;
end;
$$;

revoke all on function public.allocate_assessment_questions(uuid,text) from public,anon,authenticated;

commit;
