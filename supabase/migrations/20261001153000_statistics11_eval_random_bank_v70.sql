-- Statistics 11 · Modules 01–03 Evaluation V70
-- Larger randomized bank with balanced sampling and least-used spreading.
-- Existing UI, tables, RPC names, scoring, attempts and response records remain unchanged.

-- Expand the private bank from 18 to 54 active questions without changing
-- the page structure, table schema, RPC names, scoring rules, or client contract.
with evaluation as (
  select id
  from public.python_hub_eval_assessments
  where slug='modules-1-3-2026-10-01'
),
bank(id,module_no,question_type,prompt,choices,answer_key) as (
  values
  ('M123-19',1::smallint,'true_false','True or False: in Python, // performs floor division.','["True","False"]'::jsonb,'{"value":"True"}'::jsonb),
  ('M123-20',1::smallint,'true_false','True or False: the % operator returns the remainder of a division.','["True","False"]'::jsonb,'{"value":"True"}'::jsonb),
  ('M123-21',1::smallint,'multiple_choice','What is the output of print(17 // 5)?','["2","3","3.4","4"]'::jsonb,'{"value":"3"}'::jsonb),
  ('M123-22',1::smallint,'multiple_choice','What is the output of print(17 % 5)?','["1","2","3","5"]'::jsonb,'{"value":"2"}'::jsonb),
  ('M123-23',1::smallint,'multiple_choice','What is the output of print(2 + 3 * 4)?','["20","14","24","11"]'::jsonb,'{"value":"14"}'::jsonb),
  ('M123-24',1::smallint,'multiple_choice','Which Python operator performs standard division?','["/","//","%","**"]'::jsonb,'{"value":"/"}'::jsonb),
  ('M123-25',1::smallint,'short_text','Write only the output produced by: print(20 / 4)',null::jsonb,'{"accepted":["5.0","5"]}'::jsonb),
  ('M123-26',1::smallint,'short_text','Write only the output produced by: print(2 ** 5)',null::jsonb,'{"accepted":["32","32.0"]}'::jsonb),
  ('M123-27',1::smallint,'code','Programming: create variables with values 9 and 4, add them, store the result in another variable, and print only the final result.',null::jsonb,'{"expected_output":"13","required_tokens":["+","print"]}'::jsonb),
  ('M123-28',1::smallint,'code','Programming: store 23 and 5 in variables, calculate floor division using //, and print only the result.',null::jsonb,'{"expected_output":"4","required_tokens":["//","print"]}'::jsonb),
  ('M123-29',1::smallint,'code','Programming: store 17 and 5 in variables, calculate the remainder using %, and print only the result.',null::jsonb,'{"expected_output":"2","required_tokens":["%","print"]}'::jsonb),
  ('M123-30',1::smallint,'code','Programming: calculate (8 + 2) * 3 using Python operators and print only the final result.',null::jsonb,'{"expected_output":"30","required_tokens":["+","*","print"]}'::jsonb),

  ('M123-31',2::smallint,'true_false','True or False: after score = 10, the variable score stores an integer value.','["True","False"]'::jsonb,'{"value":"True"}'::jsonb),
  ('M123-32',2::smallint,'true_false','True or False: int("7") returns a string value.','["True","False"]'::jsonb,'{"value":"False"}'::jsonb),
  ('M123-33',2::smallint,'multiple_choice','What is the Python type of False?','["int","float","str","bool"]'::jsonb,'{"value":"bool"}'::jsonb),
  ('M123-34',2::smallint,'multiple_choice','Which is a valid Python variable name?','["2score","student-score","student_score","class"]'::jsonb,'{"value":"student_score"}'::jsonb),
  ('M123-35',2::smallint,'multiple_choice','What value is produced by str(12)?','["12 as text","12.0","True","None"]'::jsonb,'{"value":"12 as text"}'::jsonb),
  ('M123-36',2::smallint,'multiple_choice','What is the type of the result of 3 + 2.0?','["int","float","str","bool"]'::jsonb,'{"value":"float"}'::jsonb),
  ('M123-37',2::smallint,'short_text','Write only the short type name returned by type("3.5").__name__.',null::jsonb,'{"accepted":["str"]}'::jsonb),
  ('M123-38',2::smallint,'short_text','Write only the output produced by: print(int(6.9))',null::jsonb,'{"accepted":["6","6.0"]}'::jsonb),
  ('M123-39',2::smallint,'code','Programming: store the text "18", convert it to an integer, add 2, and print only the result.',null::jsonb,'{"expected_output":"20","required_tokens":["int(","print"]}'::jsonb),
  ('M123-40',2::smallint,'code','Programming: store the integer 5, convert it to a float in another variable, and print the converted value.',null::jsonb,'{"expected_output":"5.0","required_tokens":["float(","print"]}'::jsonb),
  ('M123-41',2::smallint,'code','Programming: store the integer 16, convert it to text with str(), and print only that converted value.',null::jsonb,'{"expected_output":"16","required_tokens":["str(","print"]}'::jsonb),
  ('M123-42',2::smallint,'code','Programming: store True in a variable and print only its short type name using type(...).__name__.',null::jsonb,'{"expected_output":"bool","required_tokens":["type(","__name__","print"]}'::jsonb),

  ('M123-43',3::smallint,'true_false','True or False: for a non-empty Python list, index -1 accesses the last item.','["True","False"]'::jsonb,'{"value":"True"}'::jsonb),
  ('M123-44',3::smallint,'true_false','True or False: list.append(value) leaves the original list unchanged.','["True","False"]'::jsonb,'{"value":"False"}'::jsonb),
  ('M123-45',3::smallint,'multiple_choice','For values = [4, 8, 12], what is values[1]?','["4","8","12","1"]'::jsonb,'{"value":"8"}'::jsonb),
  ('M123-46',3::smallint,'multiple_choice','Which list method adds one item to the end of an existing list?','["append()","remove()","sort()","index()"]'::jsonb,'{"value":"append()"}'::jsonb),
  ('M123-47',3::smallint,'multiple_choice','What is len([2, 4, 6, 8])?','["3","4","8","20"]'::jsonb,'{"value":"4"}'::jsonb),
  ('M123-48',3::smallint,'multiple_choice','What is the result of [10, 20, 30, 40][1:3]?','["[10, 20]","[20, 30]","[20, 30, 40]","[30, 40]"]'::jsonb,'{"value":"[20, 30]"}'::jsonb),
  ('M123-49',3::smallint,'short_text','Write only the value of [3, 7, 11][-1].',null::jsonb,'{"accepted":["11","11.0"]}'::jsonb),
  ('M123-50',3::smallint,'short_text','Write only the value of sum([2, 4, 6]).',null::jsonb,'{"accepted":["12","12.0"]}'::jsonb),
  ('M123-51',3::smallint,'code','Programming: create the list [3, 6], append 9 to the same list, and print the complete list.',null::jsonb,'{"expected_output":"[3, 6, 9]","required_tokens":[".append(","print"]}'::jsonb),
  ('M123-52',3::smallint,'code','Programming: create the list [5, 10, 15] and print only the second item using its index.',null::jsonb,'{"expected_output":"10","required_tokens":["[1]","print"]}'::jsonb),
  ('M123-53',3::smallint,'code','Programming: create the list [2, 4, 6, 8], calculate its total with sum(), and print only the total.',null::jsonb,'{"expected_output":"20","required_tokens":["sum(","print"]}'::jsonb),
  ('M123-54',3::smallint,'code','Programming: create the list [6, 8, 10], calculate its mean with sum(values) / len(values), and print only the result.',null::jsonb,'{"expected_output":"8.0","accepted_outputs":["8","8.0"],"required_tokens":["sum(","len(","print"]}'::jsonb)
)
insert into public.python_hub_eval_questions_private(
  id,evaluation_id,module_no,question_type,prompt,choices,answer_key,points,active
)
select
  b.id,e.id,b.module_no,b.question_type,b.prompt,b.choices,b.answer_key,1,true
from evaluation e
cross join bank b
on conflict (id) do update
set evaluation_id=excluded.evaluation_id,
    module_no=excluded.module_no,
    question_type=excluded.question_type,
    prompt=excluded.prompt,
    choices=excluded.choices,
    answer_key=excluded.answer_key,
    points=excluded.points,
    active=true;

do $$
declare
  v_bad integer;
begin
  with e as (
    select id from public.python_hub_eval_assessments
    where slug='modules-1-3-2026-10-01'
  ),
  expected(module_no,question_type,min_count) as (
    values
      (1::smallint,'true_false',3),(1::smallint,'multiple_choice',6),(1::smallint,'short_text',3),(1::smallint,'code',6),
      (2::smallint,'true_false',3),(2::smallint,'multiple_choice',6),(2::smallint,'short_text',3),(2::smallint,'code',6),
      (3::smallint,'true_false',3),(3::smallint,'multiple_choice',6),(3::smallint,'short_text',3),(3::smallint,'code',6)
  ),
  actual as (
    select q.module_no,q.question_type,count(*)::int n
    from public.python_hub_eval_questions_private q
    where q.evaluation_id=(select id from e) and q.active=true
    group by q.module_no,q.question_type
  )
  select count(*) into v_bad
  from expected x
  left join actual a using(module_no,question_type)
  where coalesce(a.n,0)<x.min_count;

  if v_bad>0 then
    raise exception 'Statistics 11 evaluation question bank is incomplete';
  end if;
end
$$;

create or replace function public.python_hub_eval_start_v1(
  p_registration_id uuid,
  p_access_token text,
  p_evaluation_slug text,
  p_student_emails jsonb,
  p_session_id uuid,
  p_user_agent text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','private','extensions','pg_catalog'
as $$
declare
  v_registration public.python_hub_registrations%rowtype;
  v_eval public.python_hub_eval_assessments%rowtype;
  v_window public.python_hub_eval_windows%rowtype;
  v_attempt public.python_hub_eval_attempts%rowtype;
  v_size integer;
  v_i integer;
  v_order integer:=0;
  v_email text;
  v_owner_email text;
  v_qa_early boolean:=false;
  v_member jsonb;
  v_members jsonb:='[]'::jsonb;
  v_label text;
  v_duplicate_count integer;
  v_owner_participant_registration uuid;
  v_token text;
  v_option_order jsonb;
  v_q record;
begin
  v_registration:=private.python_hub_registration_v1(p_registration_id,p_access_token);

  select * into v_eval
  from public.python_hub_eval_assessments
  where slug=trim(coalesce(p_evaluation_slug,''));

  if v_eval.id is null then
    raise exception 'Unknown evaluation';
  end if;

  if v_eval.status='closed' then
    raise exception 'This evaluation is closed';
  end if;

  if not (v_registration.group_code=any(v_eval.allowed_groups)) then
    raise exception 'This evaluation is only available to the enabled groups';
  end if;

  select * into v_window
  from public.python_hub_eval_windows
  where evaluation_id=v_eval.id
    and group_code=v_registration.group_code;

  if v_window.evaluation_id is null then
    raise exception 'No evaluation window is configured for this group';
  end if;

  select lower(trim(coalesce(m.institutional_email,'')))
  into v_owner_email
  from public.python_hub_registration_members m
  where m.registration_id=v_registration.id
    and m.member_order=1
  limit 1;

  if coalesce(v_owner_email,'')=''
     and v_registration.student_account_id is not null then
    select lower(trim(a.institutional_email))
    into v_owner_email
    from public.python_hub_student_accounts a
    where a.id=v_registration.student_account_id;
  end if;

  if split_part(coalesce(v_owner_email,''),'@',2)<>'ijr.edu.co' then
    raise exception 'Return to the Learning Hub and sign in with your institutional email';
  end if;

  select exists(
    select 1
    from private.python_hub_eval_early_access q
    where q.evaluation_slug=v_eval.slug
      and q.institutional_email=v_owner_email
      and q.enabled=true
      and clock_timestamp()<q.expires_at
  )
  into v_qa_early;

  if not v_qa_early then
    if clock_timestamp()<v_window.opens_at then
      raise exception 'The evaluation window has not opened yet';
    end if;
    if clock_timestamp()>v_window.closes_at then
      raise exception 'The evaluation start window is closed';
    end if;
  end if;

  if p_student_emails is null
     or jsonb_typeof(p_student_emails)<>'array' then
    raise exception 'Select 1, 2 or 3 participating students';
  end if;

  v_size:=jsonb_array_length(p_student_emails);

  if v_size<1 or v_size>3 then
    raise exception 'Register 1 to 3 participating students';
  end if;

  if v_qa_early and v_size<>1 then
    raise exception 'QA early access is restricted to qa.student11@ijr.edu.co only';
  end if;

  if lower(trim(p_student_emails->>0))<>v_owner_email then
    raise exception 'Student 1 must be the institutional account currently signed in';
  end if;

  if exists(
    select 1
    from jsonb_array_elements_text(p_student_emails) e(value)
    where split_part(lower(trim(e.value)),'@',2)<>'ijr.edu.co'
       or split_part(lower(trim(e.value)),'@',1)=''
  ) then
    raise exception 'Every participant must use a valid @ijr.edu.co email';
  end if;

  with emails as (
    select ord::integer ord,lower(trim(value)) email
    from jsonb_array_elements_text(p_student_emails)
      with ordinality t(value,ord)
  )
  select
    string_agg(email,' · ' order by ord),
    count(*)-count(distinct email)
  into v_label,v_duplicate_count
  from emails;

  if v_duplicate_count>0 then
    raise exception 'Do not repeat an email in the same team';
  end if;

  for v_i in 1..v_size loop
    v_email:=lower(trim(p_student_emails->>(v_i-1)));

    v_member:=private.python_hub_ensure_participant_registration_v52(
      v_email,
      v_registration.group_code,
      coalesce(p_session_id,gen_random_uuid()),
      p_user_agent
    ) || jsonb_build_object('order',v_i);

    if v_i=1 then
      v_owner_participant_registration:=
        nullif(v_member->>'participant_registration_id','')::uuid;

      if v_owner_participant_registration
         is distinct from v_registration.id then
        raise exception 'Signed-in account does not match Student 1';
      end if;
    end if;

    if exists(
      select 1
      from public.python_hub_eval_attempt_members em
      join public.python_hub_eval_attempts ea
        on ea.id=em.attempt_id
      where ea.evaluation_id=v_eval.id
        and em.participant_registration_id=
          (v_member->>'participant_registration_id')::uuid
    ) then
      raise exception 'One selected student already has an evaluation attempt registered';
    end if;

    v_members:=v_members||jsonb_build_array(v_member);
  end loop;

  v_token:=
    replace(gen_random_uuid()::text,'-','')
    ||replace(gen_random_uuid()::text,'-','');

  insert into public.python_hub_eval_attempts(
    evaluation_id,
    owner_registration_id,
    group_code,
    browser_session_id,
    team_size,
    team_label,
    access_token_hash,
    expires_at,
    points_remaining,
    user_agent
  )
  values(
    v_eval.id,
    v_registration.id,
    v_registration.group_code,
    coalesce(p_session_id,gen_random_uuid()),
    v_size,
    v_label,
    encode(digest(v_token,'sha256'),'hex'),
    least(
      clock_timestamp()+make_interval(mins=>v_eval.duration_minutes),
      v_window.closes_at
    ),
    v_eval.max_points,
    left(coalesce(p_user_agent,''),1000)
  )
  returning *
  into v_attempt;

  for v_member in
    select value
    from jsonb_array_elements(v_members)
  loop
    insert into public.python_hub_eval_attempt_members(
      attempt_id,
      member_order,
      participant_registration_id,
      student_identity_id,
      student_registry_id,
      institutional_email,
      display_name
    )
    values(
      v_attempt.id,
      (v_member->>'order')::smallint,
      (v_member->>'participant_registration_id')::uuid,
      nullif(v_member->>'student_identity_id','')::uuid,
      nullif(v_member->>'student_registry_id','')::uuid,
      v_member->>'institutional_email',
      coalesce(
        nullif(v_member->>'display_name',''),
        v_member->>'institutional_email'
      )
    );
  end loop;

  -- Serialize assignment generation for this evaluation so simultaneous
  -- starts do not all receive the same least-used questions.
  perform pg_advisory_xact_lock(
    hashtext('python_hub_eval_start_v1'),
    hashtext(v_eval.id::text)
  );

  -- Keep the same 18-question blueprint used by the original evaluation:
  -- per module = 1 true/false + 2 multiple choice + 1 short text + 2 code.
  -- Within each module/type bucket, prefer the least-used questions and
  -- randomize ties. This spreads variants across the class while preserving
  -- topic and difficulty balance.
  for v_q in
    with usage_counts as (
      select
        q.*,
        coalesce(count(a.question_id),0)::bigint as usage_count
      from public.python_hub_eval_questions_private q
      left join public.python_hub_eval_assignments a
        on a.question_id=q.id
      where q.evaluation_id=v_eval.id
        and q.active=true
        and q.module_no between 1 and 3
      group by q.id
    ),
    ranked as (
      select
        u.*,
        row_number() over (
          partition by u.module_no,u.question_type
          order by u.usage_count asc,random()
        ) as bucket_rank
      from usage_counts u
    ),
    selected as (
      select *
      from ranked
      where
        (question_type='true_false' and bucket_rank<=1)
        or (question_type='multiple_choice' and bucket_rank<=2)
        or (question_type='short_text' and bucket_rank<=1)
        or (question_type='code' and bucket_rank<=2)
    )
    select *
    from selected
    order by random()
  loop
    v_order:=v_order+1;

    if v_q.question_type in ('true_false','multiple_choice') then
      select coalesce(
        jsonb_agg(value order by random()),
        '[]'::jsonb
      )
      into v_option_order
      from jsonb_array_elements(v_q.choices);
    else
      v_option_order:='[]'::jsonb;
    end if;

    insert into public.python_hub_eval_assignments(
      attempt_id,
      question_id,
      question_order,
      option_order
    )
    values(
      v_attempt.id,
      v_q.id,
      v_order,
      v_option_order
    );
  end loop;

  if v_order<>v_eval.question_count then
    raise exception
      'Evaluation question bank mismatch: expected %, found %',
      v_eval.question_count,
      v_order;
  end if;

  return jsonb_build_object(
    'attempt_id',v_attempt.id,
    'attempt_token',v_token,
    'snapshot',
      private.python_hub_eval_snapshot_v1(
        v_attempt.id,
        v_token
      )
  );
end;
$$;

revoke all
on function public.python_hub_eval_start_v1(uuid,text,text,jsonb,uuid,text)
from public,authenticated;

grant execute
on function public.python_hub_eval_start_v1(uuid,text,text,jsonb,uuid,text)
to anon;
