-- Statistics 11 · Modules 01–03 Evaluation V5
-- Temporary early-access override for the dedicated QA account only.
-- qa.student11@ijr.edu.co may open the evaluation before the 11A window.
-- During the early-access period the QA attempt is forced to one participant,
-- so no other student can use the override as a teammate.

create table if not exists private.python_hub_eval_early_access (
  evaluation_slug text not null,
  institutional_email text not null,
  enabled boolean not null default true,
  expires_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  primary key (evaluation_slug,institutional_email)
);

insert into private.python_hub_eval_early_access(
  evaluation_slug,institutional_email,enabled,expires_at
) values (
  'modules-1-3-2026-10-01',
  'qa.student11@ijr.edu.co',
  true,
  '2026-10-01 11:45:00-05'::timestamptz
)
on conflict (evaluation_slug,institutional_email) do update
set enabled=excluded.enabled,
    expires_at=excluded.expires_at;

create or replace function public.python_hub_eval_availability_v1(
  p_registration_id uuid,
  p_access_token text,
  p_evaluation_slug text
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
  v_state text;
  v_attempted boolean;
  v_owner_email text;
  v_qa_early boolean:=false;
begin
  v_registration:=private.python_hub_registration_v1(p_registration_id,p_access_token);

  select * into v_eval
  from public.python_hub_eval_assessments
  where slug=trim(coalesce(p_evaluation_slug,''));

  if v_eval.id is null then
    raise exception 'Unknown evaluation';
  end if;

  if not (v_registration.group_code=any(v_eval.allowed_groups)) then
    return jsonb_build_object('eligible',false,'state','ineligible');
  end if;

  select * into v_window
  from public.python_hub_eval_windows
  where evaluation_id=v_eval.id
    and group_code=v_registration.group_code;

  if v_window.evaluation_id is null then
    return jsonb_build_object('eligible',false,'state','ineligible');
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

  select exists(
    select 1
    from private.python_hub_eval_early_access q
    where q.evaluation_slug=v_eval.slug
      and q.institutional_email=v_owner_email
      and q.enabled=true
      and clock_timestamp()<q.expires_at
  )
  into v_qa_early;

  select exists(
    select 1
    from public.python_hub_eval_attempt_members m
    join public.python_hub_eval_attempts a
      on a.id=m.attempt_id
    where a.evaluation_id=v_eval.id
      and m.participant_registration_id=v_registration.id
  )
  into v_attempted;

  if v_attempted then
    v_state:='attempted';
  elsif v_eval.status='closed' then
    v_state:='closed';
  elsif v_qa_early then
    v_state:='open';
  elsif clock_timestamp()>v_window.closes_at then
    v_state:='closed';
  elsif clock_timestamp()<v_window.opens_at then
    v_state:='scheduled';
  else
    v_state:='open';
  end if;

  return jsonb_build_object(
    'eligible',true,
    'state',v_state,
    'group_code',v_registration.group_code,
    'opens_at',v_window.opens_at,
    'closes_at',v_window.closes_at,
    'duration_minutes',v_eval.duration_minutes,
    'question_count',v_eval.question_count,
    'max_points',v_eval.max_points,
    'qa_early_access',v_qa_early
  );
end;
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

  for v_q in
    select q.*
    from public.python_hub_eval_questions_private q
    where q.evaluation_id=v_eval.id
      and q.active=true
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
on function public.python_hub_eval_availability_v1(uuid,text,text)
from public,authenticated;

revoke all
on function public.python_hub_eval_start_v1(uuid,text,text,jsonb,uuid,text)
from public,authenticated;

grant execute
on function public.python_hub_eval_availability_v1(uuid,text,text)
to anon;

grant execute
on function public.python_hub_eval_start_v1(uuid,text,text,jsonb,uuid,text)
to anon;
