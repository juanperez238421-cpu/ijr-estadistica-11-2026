begin;

create extension if not exists pgcrypto;

-- Internal math helper. It is never exposed to browser roles.
create or replace function public.stat11_factorial(p_n integer)
returns numeric
language plpgsql
immutable
set search_path=public
as $$
declare
  v numeric := 1;
  k integer;
begin
  if p_n < 0 then
    raise exception 'factorial requires n >= 0';
  end if;
  if p_n <= 1 then
    return 1;
  end if;
  for k in 2..p_n loop
    v := v * k;
  end loop;
  return v;
end;
$$;

revoke all on function public.stat11_factorial(integer) from public,anon,authenticated;

-- -------------------------------------------------------------------------
-- Private production bank bootstrap.
--
-- The canonical bank remains preferred when it has already been imported.
-- This migration only fills a topic up to 500 active questions when needed.
-- Question parameters are generated inside PostgreSQL at migration time, so
-- the public GitHub source does not reveal the exact private answer bank.
-- -------------------------------------------------------------------------
do $$
declare
  v_count integer;
  i integer;
  inserted integer;
  a integer;
  b integer;
  c integer;
  n integer;
  r integer;
  total_n integer;
  answer numeric;
  qid text;
  tag text;
  prompt_es text;
  prompt_en text;
  opts jsonb;
  diag jsonb;
  formula text;
  sol_es jsonb;
  sol_en jsonb;
begin
  -- Fundamental Counting Principle ------------------------------------------------
  select count(*) into v_count
  from public.questions_private
  where active=true and topic_code='FCP';
  i := 1;
  while v_count < 500 loop
    qid := format('S11-AUTO-FCP-%s',lpad(i::text,5,'0'));
    tag := upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
    a := 2 + floor(random()*8)::integer;
    b := 2 + floor(random()*8)::integer;
    c := 2 + floor(random()*8)::integer;
    answer := (a*b*c)::numeric;
    prompt_es := format('Caso %s. Una configuración se construye eligiendo 1 opción de cada etapa: %s opciones en la etapa A, %s en la etapa B y %s en la etapa C. ¿Cuántas configuraciones distintas son posibles?',tag,a,b,c);
    prompt_en := format('Case %s. A configuration is built by choosing 1 option from each stage: %s choices in stage A, %s in stage B, and %s in stage C. How many different configurations are possible?',tag,a,b,c);
    opts := jsonb_build_array(answer::text,(answer+1)::text,(answer+a+2)::text,(answer+b+12)::text);
    diag := jsonb_build_object('type','stage_tree','stage_labels_es',jsonb_build_array('Etapa A','Etapa B','Etapa C'),'stage_counts',jsonb_build_array(a,b,c));
    formula := format('%s × %s × %s',a,b,c);
    sol_es := jsonb_build_array('Identifica etapas independientes.','Multiplica el número de opciones de cada etapa.',format('%s × %s × %s = %s',a,b,c,answer::text));
    sol_en := jsonb_build_array('Identify the independent stages.','Multiply the number of choices at each stage.',format('%s × %s × %s = %s',a,b,c,answer::text));

    insert into public.questions_private(id,topic_code,difficulty,prompt_es,prompt_en,options,correct_answer,formula_latex,solution_steps_es,solution_steps_en,diagram,fingerprint,active)
    values(qid,'FCP',1+((i-1)%3),prompt_es,prompt_en,opts,answer::text,formula,sol_es,sol_en,diag,encode(digest(qid||'|'||prompt_es||'|'||answer::text,'sha256'),'hex'),true)
    on conflict do nothing;
    get diagnostics inserted = row_count;
    if inserted=1 then v_count := v_count+1; end if;
    i := i+1;
    if i>5000 then raise exception 'Unable to fill FCP bank to 500 unique rows'; end if;
  end loop;

  -- Simple / partial permutations -------------------------------------------------
  select count(*) into v_count
  from public.questions_private
  where active=true and topic_code='P_SIMPLE';
  i := 1;
  while v_count < 500 loop
    qid := format('S11-AUTO-PS-%s',lpad(i::text,5,'0'));
    tag := upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
    n := 6 + floor(random()*9)::integer; -- 6..14
    r := 2 + floor(random()*4)::integer; -- 2..5
    if r >= n then r := n-1; end if;
    answer := public.stat11_factorial(n) / public.stat11_factorial(n-r);
    prompt_es := format('Caso %s. De %s participantes distintos se asignarán %s posiciones ordenadas diferentes. ¿De cuántas maneras puede hacerse la asignación?',tag,n,r);
    prompt_en := format('Case %s. From %s distinct participants, %s different ordered positions will be assigned. In how many ways can the assignment be made?',tag,n,r);
    opts := jsonb_build_array(answer::text,(answer+1)::text,(answer+n+3)::text,(answer+r+17)::text);
    diag := jsonb_build_object('type','ordered_slots','n_items',n,'r_slots',r);
    formula := format('P(%s,%s) = %s!/(%s-%s)!',n,r,n,n,r);
    sol_es := jsonb_build_array('El orden importa y no hay repetición.',format('Usa P(n,r)=n!/(n-r)! con n=%s y r=%s.',n,r),format('P(%s,%s) = %s',n,r,answer::text));
    sol_en := jsonb_build_array('Order matters and repetition is not allowed.',format('Use P(n,r)=n!/(n-r)! with n=%s and r=%s.',n,r),format('P(%s,%s) = %s',n,r,answer::text));

    insert into public.questions_private(id,topic_code,difficulty,prompt_es,prompt_en,options,correct_answer,formula_latex,solution_steps_es,solution_steps_en,diagram,fingerprint,active)
    values(qid,'P_SIMPLE',1+((i-1)%3),prompt_es,prompt_en,opts,answer::text,formula,sol_es,sol_en,diag,encode(digest(qid||'|'||prompt_es||'|'||answer::text,'sha256'),'hex'),true)
    on conflict do nothing;
    get diagnostics inserted = row_count;
    if inserted=1 then v_count := v_count+1; end if;
    i := i+1;
    if i>5000 then raise exception 'Unable to fill P_SIMPLE bank to 500 unique rows'; end if;
  end loop;

  -- Distinguishable permutations --------------------------------------------------
  select count(*) into v_count
  from public.questions_private
  where active=true and topic_code='P_DIST';
  i := 1;
  while v_count < 500 loop
    qid := format('S11-AUTO-PD-%s',lpad(i::text,5,'0'));
    tag := upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
    a := 2 + floor(random()*3)::integer; -- 2..4 identical A
    b := 2 + floor(random()*3)::integer; -- 2..4 identical B
    c := 1 + floor(random()*3)::integer; -- 1..3 identical C
    total_n := a+b+c;
    answer := public.stat11_factorial(total_n)/(public.stat11_factorial(a)*public.stat11_factorial(b)*public.stat11_factorial(c));
    prompt_es := format('Caso %s. Se ordenan en una fila %s fichas: %s son del tipo A, %s del tipo B y %s del tipo C. Las fichas del mismo tipo son indistinguibles. ¿Cuántos arreglos diferentes existen?',tag,total_n,a,b,c);
    prompt_en := format('Case %s. %s tokens are arranged in a row: %s are type A, %s are type B, and %s are type C. Tokens of the same type are indistinguishable. How many different arrangements exist?',tag,total_n,a,b,c);
    opts := jsonb_build_array(answer::text,(answer+1)::text,(answer+total_n+5)::text,(answer+a+b+19)::text);
    diag := jsonb_build_object('type','repeated_tokens','token_labels',jsonb_build_array(format('A × %s',a),format('B × %s',b),format('C × %s',c)));
    formula := format('%s!/(%s!·%s!·%s!)',total_n,a,b,c);
    sol_es := jsonb_build_array('Cuenta el total de objetos y las repeticiones.',format('Usa n!/(n1! n2! n3!) = %s!/(%s! %s! %s!).',total_n,a,b,c),format('Resultado: %s',answer::text));
    sol_en := jsonb_build_array('Count the total objects and each multiplicity.',format('Use n!/(n1! n2! n3!) = %s!/(%s! %s! %s!).',total_n,a,b,c),format('Result: %s',answer::text));

    insert into public.questions_private(id,topic_code,difficulty,prompt_es,prompt_en,options,correct_answer,formula_latex,solution_steps_es,solution_steps_en,diagram,fingerprint,active)
    values(qid,'P_DIST',1+((i-1)%3),prompt_es,prompt_en,opts,answer::text,formula,sol_es,sol_en,diag,encode(digest(qid||'|'||prompt_es||'|'||answer::text,'sha256'),'hex'),true)
    on conflict do nothing;
    get diagnostics inserted = row_count;
    if inserted=1 then v_count := v_count+1; end if;
    i := i+1;
    if i>5000 then raise exception 'Unable to fill P_DIST bank to 500 unique rows'; end if;
  end loop;

  -- Circular permutations ---------------------------------------------------------
  select count(*) into v_count
  from public.questions_private
  where active=true and topic_code='P_CIRC';
  i := 1;
  while v_count < 500 loop
    qid := format('S11-AUTO-PC-%s',lpad(i::text,5,'0'));
    tag := upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
    n := 5 + floor(random()*9)::integer; -- 5..13
    answer := public.stat11_factorial(n-1);
    prompt_es := format('Caso %s. %s personas distintas se sientan alrededor de una mesa circular. Si las rotaciones equivalentes cuentan como el mismo arreglo, ¿cuántas distribuciones diferentes existen?',tag,n);
    prompt_en := format('Case %s. %s distinct people sit around a circular table. If rotationally equivalent seatings count as the same arrangement, how many different arrangements exist?',tag,n);
    opts := jsonb_build_array(answer::text,(answer+1)::text,(answer+n+7)::text,(answer+2*n+23)::text);
    diag := jsonb_build_object('type','circular_seats','n_items',n);
    formula := format('(%s-1)!',n);
    sol_es := jsonb_build_array('En una permutación circular se fija una persona como referencia.',format('Ordena las %s personas restantes.',n-1),format('(%s-1)! = %s',n,answer::text));
    sol_en := jsonb_build_array('For a circular permutation, fix one person as a reference.',format('Arrange the remaining %s people.',n-1),format('(%s-1)! = %s',n,answer::text));

    insert into public.questions_private(id,topic_code,difficulty,prompt_es,prompt_en,options,correct_answer,formula_latex,solution_steps_es,solution_steps_en,diagram,fingerprint,active)
    values(qid,'P_CIRC',1+((i-1)%3),prompt_es,prompt_en,opts,answer::text,formula,sol_es,sol_en,diag,encode(digest(qid||'|'||prompt_es||'|'||answer::text,'sha256'),'hex'),true)
    on conflict do nothing;
    get diagnostics inserted = row_count;
    if inserted=1 then v_count := v_count+1; end if;
    i := i+1;
    if i>5000 then raise exception 'Unable to fill P_CIRC bank to 500 unique rows'; end if;
  end loop;
end;
$$;

-- The user explicitly requested a production-ready shareable assessment.
update public.assessments
set status='open',
    duration_minutes=40,
    questions_per_student=18,
    max_raw_points=15,
    grade_min=1,
    grade_max=5,
    passing_grade=3,
    globally_disjoint=true,
    require_fullscreen=true,
    tab_strike_limit=3,
    release_solutions=false,
    starts_at=null,
    ends_at=null
where slug='statistics11-counting-permutations-2026';

-- A safe public health probe exposes counts/status only, never answer keys.
create or replace function public.statistics11_assessment_health()
returns jsonb
language plpgsql
security definer
stable
set search_path=public
as $$
declare
  v_status text;
  v_total integer;
  v_fcp integer;
  v_simple integer;
  v_dist integer;
  v_circ integer;
  v_roster integer;
  v_start boolean;
  v_teacher boolean;
begin
  select status into v_status
  from public.assessments
  where slug='statistics11-counting-permutations-2026';

  select count(*)::integer,
         count(*) filter(where topic_code='FCP')::integer,
         count(*) filter(where topic_code='P_SIMPLE')::integer,
         count(*) filter(where topic_code='P_DIST')::integer,
         count(*) filter(where topic_code='P_CIRC')::integer
  into v_total,v_fcp,v_simple,v_dist,v_circ
  from public.questions_private
  where active=true;

  select count(*)::integer into v_roster
  from public.student_registry
  where active=true;

  v_start := to_regprocedure('public.student_start_attempt(text,text,text,uuid,text)') is not null;
  v_teacher := to_regprocedure('public.teacher_code_login(text,text)') is not null;

  return jsonb_build_object(
    'ready', v_status='open' and v_total>=2000 and v_fcp>=500 and v_simple>=500 and v_dist>=500 and v_circ>=500 and v_roster>=61 and v_start and v_teacher,
    'status',v_status,
    'question_count',v_total,
    'topic_counts',jsonb_build_object('FCP',v_fcp,'P_SIMPLE',v_simple,'P_DIST',v_dist,'P_CIRC',v_circ),
    'roster_count',v_roster,
    'student_rpc',v_start,
    'teacher_rpc',v_teacher
  );
end;
$$;

revoke all on function public.statistics11_assessment_health() from public;
grant execute on function public.statistics11_assessment_health() to anon,authenticated;

-- Force PostgREST to refresh function signatures immediately after migration.
notify pgrst, 'reload schema';

commit;
