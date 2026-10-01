-- Statistics 11 · Modules 01–03 Evaluation V1
-- One-shot team assessment for 11A / 11B on 2026-10-01.
-- Topics: operations / notebook basics, variables & data types, arrays / lists.
-- Guarantees:
--   * 1–3 institutional-email participants per workstation
--   * 18 one-shot questions, randomized order
--   * private answer keys (never returned to the browser)
--   * wrong answer = immediate -1 point, immutable after submission
--   * fullscreen / tab-exit integrity events = -1 point, third strike locks attempt
--   * server-side scoring and event audit

create table if not exists public.python_hub_eval_assessments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  status text not null default 'scheduled' check (status in ('scheduled','open','closed')),
  duration_minutes integer not null check (duration_minutes between 5 and 180),
  question_count integer not null check (question_count > 0),
  max_points numeric(8,2) not null check (max_points >= 0),
  wrong_answer_penalty numeric(8,2) not null default 1 check (wrong_answer_penalty >= 0),
  integrity_penalty numeric(8,2) not null default 1 check (integrity_penalty >= 0),
  integrity_strike_limit integer not null default 3 check (integrity_strike_limit > 0),
  require_fullscreen boolean not null default true,
  allowed_groups text[] not null default array['11A','11B']::text[],
  created_at timestamptz not null default clock_timestamp()
);

create table if not exists public.python_hub_eval_windows (
  evaluation_id uuid not null references public.python_hub_eval_assessments(id) on delete cascade,
  group_code text not null check (group_code in ('11A','11B','11C')),
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  primary key (evaluation_id,group_code),
  check (closes_at > opens_at)
);

create table if not exists public.python_hub_eval_questions_private (
  id text primary key,
  evaluation_id uuid not null references public.python_hub_eval_assessments(id) on delete cascade,
  module_no smallint not null check (module_no between 1 and 99),
  question_type text not null check (question_type in ('true_false','multiple_choice','short_text','code')),
  prompt text not null,
  choices jsonb,
  answer_key jsonb not null,
  points numeric(8,2) not null default 1 check (points >= 0),
  active boolean not null default true,
  created_at timestamptz not null default clock_timestamp()
);

create table if not exists public.python_hub_eval_attempts (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.python_hub_eval_assessments(id) on delete restrict,
  owner_registration_id uuid not null references public.python_hub_registrations(id) on delete restrict,
  group_code text not null,
  browser_session_id uuid not null,
  team_size smallint not null check (team_size between 1 and 3),
  team_label text not null,
  access_token_hash text not null,
  status text not null default 'active' check (status in ('active','submitted','integrity_locked','expired')),
  started_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  last_activity_at timestamptz not null default clock_timestamp(),
  submitted_at timestamptz,
  points_remaining numeric(8,2) not null,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  integrity_strikes integer not null default 0,
  finish_reason text,
  user_agent text
);

create table if not exists public.python_hub_eval_attempt_members (
  attempt_id uuid not null references public.python_hub_eval_attempts(id) on delete cascade,
  member_order smallint not null check (member_order between 1 and 3),
  participant_registration_id uuid not null references public.python_hub_registrations(id) on delete restrict,
  student_identity_id uuid references public.python_hub_student_identities(id) on delete set null,
  student_registry_id uuid references public.student_registry(id) on delete set null,
  institutional_email text not null,
  display_name text not null,
  primary key (attempt_id,member_order),
  unique (attempt_id,participant_registration_id)
);

create table if not exists public.python_hub_eval_assignments (
  attempt_id uuid not null references public.python_hub_eval_attempts(id) on delete cascade,
  question_id text not null references public.python_hub_eval_questions_private(id) on delete restrict,
  question_order integer not null check (question_order > 0),
  option_order jsonb not null default '[]'::jsonb,
  primary key (attempt_id,question_id),
  unique (attempt_id,question_order)
);

create table if not exists public.python_hub_eval_responses (
  attempt_id uuid not null references public.python_hub_eval_attempts(id) on delete cascade,
  question_id text not null references public.python_hub_eval_questions_private(id) on delete restrict,
  question_order integer not null,
  answer_text text,
  code_snapshot text,
  observed_output text,
  is_correct boolean not null,
  points_delta numeric(8,2) not null,
  submitted_at timestamptz not null default clock_timestamp(),
  primary key (attempt_id,question_id)
);

create table if not exists public.python_hub_eval_events (
  id bigserial primary key,
  attempt_id uuid not null references public.python_hub_eval_attempts(id) on delete cascade,
  event_type text not null,
  penalized boolean not null default false,
  points_delta numeric(8,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists python_hub_eval_attempts_eval_group_idx
  on public.python_hub_eval_attempts(evaluation_id,group_code,started_at desc);
create index if not exists python_hub_eval_attempt_members_registration_idx
  on public.python_hub_eval_attempt_members(participant_registration_id,attempt_id);
create index if not exists python_hub_eval_events_attempt_idx
  on public.python_hub_eval_events(attempt_id,created_at desc);

alter table public.python_hub_eval_assessments enable row level security;
alter table public.python_hub_eval_windows enable row level security;
alter table public.python_hub_eval_questions_private enable row level security;
alter table public.python_hub_eval_attempts enable row level security;
alter table public.python_hub_eval_attempt_members enable row level security;
alter table public.python_hub_eval_assignments enable row level security;
alter table public.python_hub_eval_responses enable row level security;
alter table public.python_hub_eval_events enable row level security;

revoke all on table public.python_hub_eval_assessments from anon,authenticated;
revoke all on table public.python_hub_eval_windows from anon,authenticated;
revoke all on table public.python_hub_eval_questions_private from anon,authenticated;
revoke all on table public.python_hub_eval_attempts from anon,authenticated;
revoke all on table public.python_hub_eval_attempt_members from anon,authenticated;
revoke all on table public.python_hub_eval_assignments from anon,authenticated;
revoke all on table public.python_hub_eval_responses from anon,authenticated;
revoke all on table public.python_hub_eval_events from anon,authenticated;

insert into public.python_hub_eval_assessments(
  slug,title,status,duration_minutes,question_count,max_points,
  wrong_answer_penalty,integrity_penalty,integrity_strike_limit,
  require_fullscreen,allowed_groups
) values (
  'modules-1-3-2026-10-01',
  'Statistics 11 · Modules 01–03 Evaluation',
  'scheduled',
  40,
  18,
  18,
  1,
  1,
  3,
  true,
  array['11A','11B']::text[]
)
on conflict (slug) do update set
  title=excluded.title,
  status=excluded.status,
  duration_minutes=excluded.duration_minutes,
  question_count=excluded.question_count,
  max_points=excluded.max_points,
  wrong_answer_penalty=excluded.wrong_answer_penalty,
  integrity_penalty=excluded.integrity_penalty,
  integrity_strike_limit=excluded.integrity_strike_limit,
  require_fullscreen=excluded.require_fullscreen,
  allowed_groups=excluded.allowed_groups;

insert into public.python_hub_eval_windows(evaluation_id,group_code,opens_at,closes_at)
select id,'11A','2026-10-01 11:45:00-05'::timestamptz,'2026-10-01 12:45:00-05'::timestamptz
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (evaluation_id,group_code) do update set opens_at=excluded.opens_at,closes_at=excluded.closes_at;

insert into public.python_hub_eval_windows(evaluation_id,group_code,opens_at,closes_at)
select id,'11B','2026-10-01 12:40:00-05'::timestamptz,'2026-10-01 13:40:00-05'::timestamptz
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (evaluation_id,group_code) do update set opens_at=excluded.opens_at,closes_at=excluded.closes_at;

-- Module 01 · Colab / operations
insert into public.python_hub_eval_questions_private(id,evaluation_id,module_no,question_type,prompt,choices,answer_key)
select 'M123-01',id,1,'true_false',
  'True or False: in Python, the symbol ^ is the exponentiation operator.',
  '["True","False"]'::jsonb,
  '{"value":"False"}'::jsonb
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (id) do update set prompt=excluded.prompt,choices=excluded.choices,answer_key=excluded.answer_key,active=true;

insert into public.python_hub_eval_questions_private(id,evaluation_id,module_no,question_type,prompt,choices,answer_key)
select 'M123-02',id,1,'multiple_choice',
  'Which Python operator calculates a power?',
  '["^","**","//","%%"]'::jsonb,
  '{"value":"**"}'::jsonb
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (id) do update set prompt=excluded.prompt,choices=excluded.choices,answer_key=excluded.answer_key,active=true;

insert into public.python_hub_eval_questions_private(id,evaluation_id,module_no,question_type,prompt,choices,answer_key)
select 'M123-03',id,1,'multiple_choice',
  'Which sequence best describes the normal notebook workflow used in class?',
  '["Write/edit → Run → Inspect output/error","Validate → Run → Write","Copy final answer → Refresh","Run → Close browser → Validate"]'::jsonb,
  '{"value":"Write/edit → Run → Inspect output/error"}'::jsonb
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (id) do update set prompt=excluded.prompt,choices=excluded.choices,answer_key=excluded.answer_key,active=true;

insert into public.python_hub_eval_questions_private(id,evaluation_id,module_no,question_type,prompt,choices,answer_key)
select 'M123-04',id,1,'short_text',
  'Write only the output produced by: a = 17; b = 8; print(a + b)',
  null,
  '{"accepted":["25","25.0"]}'::jsonb
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (id) do update set prompt=excluded.prompt,choices=excluded.choices,answer_key=excluded.answer_key,active=true;

insert into public.python_hub_eval_questions_private(id,evaluation_id,module_no,question_type,prompt,choices,answer_key)
select 'M123-05',id,1,'code',
  'Programming: create two variables with values 14 and 6, calculate their product in another variable, and print only the final result.',
  null,
  '{"expected_output":"84","required_tokens":["=","*","print"]}'::jsonb
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (id) do update set prompt=excluded.prompt,choices=excluded.choices,answer_key=excluded.answer_key,active=true;

insert into public.python_hub_eval_questions_private(id,evaluation_id,module_no,question_type,prompt,choices,answer_key)
select 'M123-06',id,1,'code',
  'Programming: store 81 in a variable, calculate its square root using ** 0.5, and print the result.',
  null,
  '{"expected_output":"9.0","accepted_outputs":["9","9.0"],"required_tokens":["**","0.5","print"]}'::jsonb
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (id) do update set prompt=excluded.prompt,choices=excluded.choices,answer_key=excluded.answer_key,active=true;

-- Module 02 · variables / data types
insert into public.python_hub_eval_questions_private(id,evaluation_id,module_no,question_type,prompt,choices,answer_key)
select 'M123-07',id,2,'true_false',
  'True or False: the value "12" (with quotation marks) is an integer in Python.',
  '["True","False"]'::jsonb,
  '{"value":"False"}'::jsonb
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (id) do update set prompt=excluded.prompt,choices=excluded.choices,answer_key=excluded.answer_key,active=true;

insert into public.python_hub_eval_questions_private(id,evaluation_id,module_no,question_type,prompt,choices,answer_key)
select 'M123-08',id,2,'multiple_choice',
  'What is the Python type of the value 4.5?',
  '["int","float","str","bool"]'::jsonb,
  '{"value":"float"}'::jsonb
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (id) do update set prompt=excluded.prompt,choices=excluded.choices,answer_key=excluded.answer_key,active=true;

insert into public.python_hub_eval_questions_private(id,evaluation_id,module_no,question_type,prompt,choices,answer_key)
select 'M123-09',id,2,'multiple_choice',
  'Which option is the Boolean literal used by Python?',
  '["true","TRUE","True","\"True\""]'::jsonb,
  '{"value":"True"}'::jsonb
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (id) do update set prompt=excluded.prompt,choices=excluded.choices,answer_key=excluded.answer_key,active=true;

insert into public.python_hub_eval_questions_private(id,evaluation_id,module_no,question_type,prompt,choices,answer_key)
select 'M123-10',id,2,'short_text',
  'Write only the short type name returned by type(None).__name__.',
  null,
  '{"accepted":["NoneType"]}'::jsonb
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (id) do update set prompt=excluded.prompt,choices=excluded.choices,answer_key=excluded.answer_key,active=true;

insert into public.python_hub_eval_questions_private(id,evaluation_id,module_no,question_type,prompt,choices,answer_key)
select 'M123-11',id,2,'code',
  'Programming: store the text "25", convert it to an integer, add 5, and print only the calculated result.',
  null,
  '{"expected_output":"30","required_tokens":["int(","print"]}'::jsonb
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (id) do update set prompt=excluded.prompt,choices=excluded.choices,answer_key=excluded.answer_key,active=true;

insert into public.python_hub_eval_questions_private(id,evaluation_id,module_no,question_type,prompt,choices,answer_key)
select 'M123-12',id,2,'code',
  'Programming: store the integer 7, convert it to a float in a second variable, and print the converted value.',
  null,
  '{"expected_output":"7.0","required_tokens":["float(","print"]}'::jsonb
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (id) do update set prompt=excluded.prompt,choices=excluded.choices,answer_key=excluded.answer_key,active=true;

-- Module 03 · arrays / lists
insert into public.python_hub_eval_questions_private(id,evaluation_id,module_no,question_type,prompt,choices,answer_key)
select 'M123-13',id,3,'true_false',
  'True or False: the first item of a Python list has index 0.',
  '["True","False"]'::jsonb,
  '{"value":"True"}'::jsonb
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (id) do update set prompt=excluded.prompt,choices=excluded.choices,answer_key=excluded.answer_key,active=true;

insert into public.python_hub_eval_questions_private(id,evaluation_id,module_no,question_type,prompt,choices,answer_key)
select 'M123-14',id,3,'multiple_choice',
  'For values = [6, 10, 15, 21], which index accesses the third item?',
  '["1","2","3","4"]'::jsonb,
  '{"value":"2"}'::jsonb
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (id) do update set prompt=excluded.prompt,choices=excluded.choices,answer_key=excluded.answer_key,active=true;

insert into public.python_hub_eval_questions_private(id,evaluation_id,module_no,question_type,prompt,choices,answer_key)
select 'M123-15',id,3,'multiple_choice',
  'Which built-in function returns the number of items in a Python list?',
  '["sum(values)","len(values)","max(values)","count(values)"]'::jsonb,
  '{"value":"len(values)"}'::jsonb
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (id) do update set prompt=excluded.prompt,choices=excluded.choices,answer_key=excluded.answer_key,active=true;

insert into public.python_hub_eval_questions_private(id,evaluation_id,module_no,question_type,prompt,choices,answer_key)
select 'M123-16',id,3,'short_text',
  'Write only the value of sum([5, 10, 15]).',
  null,
  '{"accepted":["30","30.0"]}'::jsonb
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (id) do update set prompt=excluded.prompt,choices=excluded.choices,answer_key=excluded.answer_key,active=true;

insert into public.python_hub_eval_questions_private(id,evaluation_id,module_no,question_type,prompt,choices,answer_key)
select 'M123-17',id,3,'code',
  'Programming: create [4, 8], append 12 to the same list, then print the new number of items.',
  null,
  '{"expected_output":"3","required_tokens":[".append(","len(","print"]}'::jsonb
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (id) do update set prompt=excluded.prompt,choices=excluded.choices,answer_key=excluded.answer_key,active=true;

insert into public.python_hub_eval_questions_private(id,evaluation_id,module_no,question_type,prompt,choices,answer_key)
select 'M123-18',id,3,'code',
  'Programming: create [10, 15, 5, 20], calculate the mean using sum(values) / len(values), and print the result.',
  null,
  '{"expected_output":"12.5","required_tokens":["sum(","len(","print"]}'::jsonb
from public.python_hub_eval_assessments where slug='modules-1-3-2026-10-01'
on conflict (id) do update set prompt=excluded.prompt,choices=excluded.choices,answer_key=excluded.answer_key,active=true;

create or replace function private.python_hub_eval_attempt_v1(
  p_attempt_id uuid,
  p_access_token text
)
returns public.python_hub_eval_attempts
language plpgsql
security definer
set search_path to 'public','private','extensions','pg_catalog'
as $$
declare
  v_attempt public.python_hub_eval_attempts%rowtype;
begin
  if coalesce(trim(p_access_token),'')='' then
    raise exception 'Evaluation access token is missing';
  end if;

  select * into v_attempt
  from public.python_hub_eval_attempts a
  where a.id=p_attempt_id
    and a.access_token_hash=encode(digest(p_access_token,'sha256'),'hex');

  if v_attempt.id is null then
    raise exception 'Evaluation session is invalid or expired';
  end if;

  if v_attempt.status='active' and clock_timestamp()>=v_attempt.expires_at then
    update public.python_hub_eval_attempts
    set status='expired',
        submitted_at=coalesce(submitted_at,clock_timestamp()),
        finish_reason=coalesce(finish_reason,'time_expired'),
        last_activity_at=clock_timestamp()
    where id=v_attempt.id
    returning * into v_attempt;
  end if;

  return v_attempt;
end;
$$;

create or replace function private.python_hub_eval_answer_correct_v1(
  p_question_id text,
  p_answer text,
  p_code_snapshot text,
  p_observed_output text
)
returns boolean
language plpgsql
security definer
set search_path to 'public','private','pg_catalog'
as $$
declare
  v_q public.python_hub_eval_questions_private%rowtype;
  v_answer text:=trim(coalesce(p_answer,''));
  v_output text:=trim(replace(coalesce(p_observed_output,''),E'\r',''));
  v_token text;
  v_ok boolean:=false;
begin
  select * into v_q
  from public.python_hub_eval_questions_private
  where id=p_question_id and active=true;

  if v_q.id is null then raise exception 'Unknown evaluation question'; end if;

  if v_q.question_type in ('true_false','multiple_choice') then
    v_ok:=lower(v_answer)=lower(trim(coalesce(v_q.answer_key->>'value','')));
  elsif v_q.question_type='short_text' then
    select exists(
      select 1
      from jsonb_array_elements_text(coalesce(v_q.answer_key->'accepted','[]'::jsonb)) x(value)
      where lower(trim(x.value))=lower(v_answer)
    ) into v_ok;
  elsif v_q.question_type='code' then
    if coalesce(trim(p_code_snapshot),'')='' then return false; end if;

    if jsonb_typeof(v_q.answer_key->'accepted_outputs')='array' then
      select exists(
        select 1 from jsonb_array_elements_text(v_q.answer_key->'accepted_outputs') x(value)
        where trim(replace(x.value,E'\r',''))=v_output
      ) into v_ok;
    else
      v_ok:=v_output=trim(replace(coalesce(v_q.answer_key->>'expected_output',''),E'\r',''));
    end if;

    if v_ok and jsonb_typeof(v_q.answer_key->'required_tokens')='array' then
      for v_token in select value from jsonb_array_elements_text(v_q.answer_key->'required_tokens')
      loop
        if position(lower(v_token) in lower(p_code_snapshot))=0 then
          v_ok:=false;
          exit;
        end if;
      end loop;
    end if;
  end if;

  return coalesce(v_ok,false);
end;
$$;

create or replace function private.python_hub_eval_snapshot_v1(
  p_attempt_id uuid,
  p_access_token text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','private','extensions','pg_catalog'
as $$
declare
  v_attempt public.python_hub_eval_attempts%rowtype;
  v_eval public.python_hub_eval_assessments%rowtype;
  v_members jsonb;
  v_answered integer;
  v_question jsonb;
begin
  v_attempt:=private.python_hub_eval_attempt_v1(p_attempt_id,p_access_token);
  select * into v_eval from public.python_hub_eval_assessments where id=v_attempt.evaluation_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'order',m.member_order,
    'email',m.institutional_email,
    'display_name',m.display_name
  ) order by m.member_order),'[]'::jsonb)
  into v_members
  from public.python_hub_eval_attempt_members m
  where m.attempt_id=v_attempt.id;

  select count(*)::int into v_answered
  from public.python_hub_eval_responses
  where attempt_id=v_attempt.id;

  select jsonb_build_object(
    'id',q.id,
    'order',a.question_order,
    'module',q.module_no,
    'type',q.question_type,
    'prompt',q.prompt,
    'choices',case when q.question_type in ('true_false','multiple_choice') then a.option_order else '[]'::jsonb end
  )
  into v_question
  from public.python_hub_eval_assignments a
  join public.python_hub_eval_questions_private q on q.id=a.question_id
  left join public.python_hub_eval_responses r
    on r.attempt_id=a.attempt_id and r.question_id=a.question_id
  where a.attempt_id=v_attempt.id
    and r.question_id is null
    and v_attempt.status='active'
  order by a.question_order
  limit 1;

  return jsonb_build_object(
    'assessment',jsonb_build_object(
      'slug',v_eval.slug,
      'title',v_eval.title,
      'duration_minutes',v_eval.duration_minutes,
      'question_count',v_eval.question_count,
      'max_points',v_eval.max_points,
      'wrong_answer_penalty',v_eval.wrong_answer_penalty,
      'integrity_penalty',v_eval.integrity_penalty,
      'integrity_strike_limit',v_eval.integrity_strike_limit,
      'require_fullscreen',v_eval.require_fullscreen
    ),
    'attempt',jsonb_build_object(
      'id',v_attempt.id,
      'group_code',v_attempt.group_code,
      'team_size',v_attempt.team_size,
      'team_label',v_attempt.team_label,
      'status',v_attempt.status,
      'started_at',v_attempt.started_at,
      'expires_at',v_attempt.expires_at,
      'points_remaining',v_attempt.points_remaining,
      'correct_count',v_attempt.correct_count,
      'incorrect_count',v_attempt.incorrect_count,
      'integrity_strikes',v_attempt.integrity_strikes,
      'answered_count',v_answered,
      'finish_reason',v_attempt.finish_reason
    ),
    'members',v_members,
    'current_question',v_question
  );
end;
$$;

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
begin
  v_registration:=private.python_hub_registration_v1(p_registration_id,p_access_token);

  select * into v_eval
  from public.python_hub_eval_assessments
  where slug=trim(coalesce(p_evaluation_slug,''));

  if v_eval.id is null then raise exception 'Unknown evaluation'; end if;

  if not (v_registration.group_code=any(v_eval.allowed_groups)) then
    return jsonb_build_object('eligible',false,'state','ineligible');
  end if;

  select * into v_window
  from public.python_hub_eval_windows
  where evaluation_id=v_eval.id and group_code=v_registration.group_code;

  if v_window.evaluation_id is null then
    return jsonb_build_object('eligible',false,'state','ineligible');
  end if;

  select exists(
    select 1
    from public.python_hub_eval_attempt_members m
    join public.python_hub_eval_attempts a on a.id=m.attempt_id
    where a.evaluation_id=v_eval.id
      and m.participant_registration_id=v_registration.id
  ) into v_attempted;

  if v_attempted then
    v_state:='attempted';
  elsif v_eval.status='closed' or clock_timestamp()>v_window.closes_at then
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
    'max_points',v_eval.max_points
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

  if v_eval.id is null then raise exception 'Unknown evaluation'; end if;
  if v_eval.status='closed' then raise exception 'This evaluation is closed'; end if;
  if not (v_registration.group_code=any(v_eval.allowed_groups)) then
    raise exception 'This evaluation is only available to the enabled groups';
  end if;

  select * into v_window
  from public.python_hub_eval_windows
  where evaluation_id=v_eval.id and group_code=v_registration.group_code;

  if v_window.evaluation_id is null then raise exception 'No evaluation window is configured for this group'; end if;
  if clock_timestamp()<v_window.opens_at then raise exception 'The evaluation window has not opened yet'; end if;
  if clock_timestamp()>v_window.closes_at then raise exception 'The evaluation start window is closed'; end if;

  select lower(trim(coalesce(m.institutional_email,'')))
  into v_owner_email
  from public.python_hub_registration_members m
  where m.registration_id=v_registration.id and m.member_order=1
  limit 1;

  if coalesce(v_owner_email,'')='' and v_registration.student_account_id is not null then
    select lower(trim(a.institutional_email)) into v_owner_email
    from public.python_hub_student_accounts a where a.id=v_registration.student_account_id;
  end if;

  if split_part(coalesce(v_owner_email,''),'@',2)<>'ijr.edu.co' then
    raise exception 'Return to the Learning Hub and sign in with your institutional email';
  end if;

  if p_student_emails is null or jsonb_typeof(p_student_emails)<>'array' then
    raise exception 'Select 1, 2 or 3 participating students';
  end if;

  v_size:=jsonb_array_length(p_student_emails);
  if v_size<1 or v_size>3 then raise exception 'Register 1 to 3 participating students'; end if;

  if lower(trim(p_student_emails->>0))<>v_owner_email then
    raise exception 'Student 1 must be the institutional account currently signed in';
  end if;

  if exists(
    select 1 from jsonb_array_elements_text(p_student_emails) e(value)
    where split_part(lower(trim(e.value)),'@',2)<>'ijr.edu.co'
       or split_part(lower(trim(e.value)),'@',1)=''
  ) then
    raise exception 'Every participant must use a valid @ijr.edu.co email';
  end if;

  with emails as (
    select ord::integer ord,lower(trim(value)) email
    from jsonb_array_elements_text(p_student_emails) with ordinality t(value,ord)
  )
  select string_agg(email,' · ' order by ord),count(*)-count(distinct email)
  into v_label,v_duplicate_count
  from emails;

  if v_duplicate_count>0 then raise exception 'Do not repeat an email in the same team'; end if;

  for v_i in 1..v_size loop
    v_email:=lower(trim(p_student_emails->>(v_i-1)));
    v_member:=private.python_hub_ensure_participant_registration_v52(
      v_email,v_registration.group_code,coalesce(p_session_id,gen_random_uuid()),p_user_agent
    ) || jsonb_build_object('order',v_i);

    if v_i=1 then
      v_owner_participant_registration:=nullif(v_member->>'participant_registration_id','')::uuid;
      if v_owner_participant_registration is distinct from v_registration.id then
        raise exception 'Signed-in account does not match Student 1';
      end if;
    end if;

    if exists(
      select 1
      from public.python_hub_eval_attempt_members em
      join public.python_hub_eval_attempts ea on ea.id=em.attempt_id
      where ea.evaluation_id=v_eval.id
        and em.participant_registration_id=(v_member->>'participant_registration_id')::uuid
    ) then
      raise exception 'One selected student already has an evaluation attempt registered';
    end if;

    v_members:=v_members||jsonb_build_array(v_member);
  end loop;

  v_token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');

  insert into public.python_hub_eval_attempts(
    evaluation_id,owner_registration_id,group_code,browser_session_id,team_size,team_label,
    access_token_hash,expires_at,points_remaining,user_agent
  ) values(
    v_eval.id,v_registration.id,v_registration.group_code,coalesce(p_session_id,gen_random_uuid()),
    v_size,v_label,encode(digest(v_token,'sha256'),'hex'),
    clock_timestamp()+make_interval(mins=>v_eval.duration_minutes),
    v_eval.max_points,left(coalesce(p_user_agent,''),1000)
  ) returning * into v_attempt;

  for v_member in select value from jsonb_array_elements(v_members)
  loop
    insert into public.python_hub_eval_attempt_members(
      attempt_id,member_order,participant_registration_id,student_identity_id,student_registry_id,
      institutional_email,display_name
    ) values(
      v_attempt.id,
      (v_member->>'order')::smallint,
      (v_member->>'participant_registration_id')::uuid,
      nullif(v_member->>'student_identity_id','')::uuid,
      nullif(v_member->>'student_registry_id','')::uuid,
      v_member->>'institutional_email',
      coalesce(nullif(v_member->>'display_name',''),v_member->>'institutional_email')
    );
  end loop;

  for v_q in
    select q.*
    from public.python_hub_eval_questions_private q
    where q.evaluation_id=v_eval.id and q.active=true
    order by random()
  loop
    v_order:=v_order+1;
    if v_q.question_type in ('true_false','multiple_choice') then
      select coalesce(jsonb_agg(value order by random()),'[]'::jsonb)
      into v_option_order
      from jsonb_array_elements(v_q.choices);
    else
      v_option_order:='[]'::jsonb;
    end if;

    insert into public.python_hub_eval_assignments(attempt_id,question_id,question_order,option_order)
    values(v_attempt.id,v_q.id,v_order,v_option_order);
  end loop;

  if v_order<>v_eval.question_count then
    raise exception 'Evaluation question bank mismatch: expected %, found %',v_eval.question_count,v_order;
  end if;

  return jsonb_build_object(
    'attempt_id',v_attempt.id,
    'attempt_token',v_token,
    'snapshot',private.python_hub_eval_snapshot_v1(v_attempt.id,v_token)
  );
end;
$$;

create or replace function public.python_hub_eval_resume_v1(
  p_attempt_id uuid,
  p_attempt_token text
)
returns jsonb
language sql
security definer
set search_path to 'public','private','extensions','pg_catalog'
as $$
  select private.python_hub_eval_snapshot_v1(p_attempt_id,p_attempt_token);
$$;

create or replace function public.python_hub_eval_submit_v1(
  p_attempt_id uuid,
  p_attempt_token text,
  p_question_id text,
  p_answer text,
  p_code_snapshot text,
  p_observed_output text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','private','extensions','pg_catalog'
as $$
declare
  v_attempt public.python_hub_eval_attempts%rowtype;
  v_eval public.python_hub_eval_assessments%rowtype;
  v_assignment public.python_hub_eval_assignments%rowtype;
  v_correct boolean;
  v_delta numeric(8,2):=0;
  v_answered integer;
begin
  v_attempt:=private.python_hub_eval_attempt_v1(p_attempt_id,p_attempt_token);
  if v_attempt.status<>'active' then raise exception 'This evaluation attempt is already closed'; end if;

  select * into v_eval from public.python_hub_eval_assessments where id=v_attempt.evaluation_id;
  select * into v_assignment
  from public.python_hub_eval_assignments
  where attempt_id=v_attempt.id and question_id=p_question_id;

  if v_assignment.attempt_id is null then raise exception 'Question is not assigned to this attempt'; end if;

  if exists(
    select 1 from public.python_hub_eval_responses
    where attempt_id=v_attempt.id and question_id=p_question_id
  ) then
    raise exception 'This answer is already registered and cannot be changed';
  end if;

  v_correct:=private.python_hub_eval_answer_correct_v1(
    p_question_id,p_answer,p_code_snapshot,p_observed_output
  );

  if not v_correct then v_delta:=-v_eval.wrong_answer_penalty; end if;

  insert into public.python_hub_eval_responses(
    attempt_id,question_id,question_order,answer_text,code_snapshot,observed_output,
    is_correct,points_delta
  ) values(
    v_attempt.id,p_question_id,v_assignment.question_order,left(coalesce(p_answer,''),10000),
    left(coalesce(p_code_snapshot,''),20000),left(coalesce(p_observed_output,''),10000),
    v_correct,v_delta
  );

  update public.python_hub_eval_attempts
  set points_remaining=greatest(0,points_remaining+v_delta),
      correct_count=correct_count+case when v_correct then 1 else 0 end,
      incorrect_count=incorrect_count+case when v_correct then 0 else 1 end,
      last_activity_at=clock_timestamp()
  where id=v_attempt.id;

  select count(*)::int into v_answered
  from public.python_hub_eval_responses
  where attempt_id=v_attempt.id;

  if v_answered>=v_eval.question_count then
    update public.python_hub_eval_attempts
    set status='submitted',
        submitted_at=clock_timestamp(),
        finish_reason='completed',
        last_activity_at=clock_timestamp()
    where id=v_attempt.id and status='active';
  end if;

  return jsonb_build_object(
    'correct',v_correct,
    'points_delta',v_delta,
    'snapshot',private.python_hub_eval_snapshot_v1(v_attempt.id,p_attempt_token)
  );
end;
$$;

create or replace function public.python_hub_eval_log_event_v1(
  p_attempt_id uuid,
  p_attempt_token text,
  p_event_type text,
  p_metadata jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','private','extensions','pg_catalog'
as $$
declare
  v_attempt public.python_hub_eval_attempts%rowtype;
  v_eval public.python_hub_eval_assessments%rowtype;
  v_penalizing boolean:=false;
  v_penalized boolean:=false;
  v_delta numeric(8,2):=0;
  v_recent boolean:=false;
  v_new_strikes integer;
begin
  v_attempt:=private.python_hub_eval_attempt_v1(p_attempt_id,p_attempt_token);
  select * into v_eval from public.python_hub_eval_assessments where id=v_attempt.evaluation_id;

  v_penalizing:=upper(trim(coalesce(p_event_type,''))) in (
    'FULLSCREEN_EXIT',
    'VISIBILITY_HIDDEN_CONFIRMED',
    'SECOND_TAB_DETECTED'
  );

  if v_attempt.status='active' and v_penalizing then
    select exists(
      select 1 from public.python_hub_eval_events
      where attempt_id=v_attempt.id
        and penalized=true
        and created_at>clock_timestamp()-interval '1500 milliseconds'
    ) into v_recent;

    if not v_recent then
      v_penalized:=true;
      v_delta:=-v_eval.integrity_penalty;

      update public.python_hub_eval_attempts
      set points_remaining=greatest(0,points_remaining+v_delta),
          integrity_strikes=integrity_strikes+1,
          last_activity_at=clock_timestamp()
      where id=v_attempt.id
      returning integrity_strikes into v_new_strikes;

      if v_new_strikes>=v_eval.integrity_strike_limit then
        update public.python_hub_eval_attempts
        set status='integrity_locked',
            submitted_at=clock_timestamp(),
            finish_reason='integrity_limit',
            last_activity_at=clock_timestamp()
        where id=v_attempt.id and status='active';
      end if;
    end if;
  end if;

  insert into public.python_hub_eval_events(attempt_id,event_type,penalized,points_delta,metadata)
  values(
    v_attempt.id,
    upper(trim(coalesce(p_event_type,'UNKNOWN'))),
    v_penalized,
    v_delta,
    coalesce(p_metadata,'{}'::jsonb)
  );

  select * into v_attempt from public.python_hub_eval_attempts where id=v_attempt.id;

  return jsonb_build_object(
    'penalized',v_penalized,
    'points_delta',v_delta,
    'integrity_strikes',v_attempt.integrity_strikes,
    'status',v_attempt.status,
    'points_remaining',v_attempt.points_remaining
  );
end;
$$;

create or replace function public.python_hub_eval_finish_v1(
  p_attempt_id uuid,
  p_attempt_token text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','private','extensions','pg_catalog'
as $$
declare
  v_attempt public.python_hub_eval_attempts%rowtype;
begin
  v_attempt:=private.python_hub_eval_attempt_v1(p_attempt_id,p_attempt_token);

  if v_attempt.status='active' then
    update public.python_hub_eval_attempts
    set status='submitted',
        submitted_at=clock_timestamp(),
        finish_reason=left(coalesce(nullif(trim(p_reason),''),'manual_finish'),80),
        last_activity_at=clock_timestamp()
    where id=v_attempt.id;
  end if;

  return private.python_hub_eval_snapshot_v1(v_attempt.id,p_attempt_token);
end;
$$;

revoke all on function public.python_hub_eval_availability_v1(uuid,text,text) from public;
revoke all on function public.python_hub_eval_start_v1(uuid,text,text,jsonb,uuid,text) from public;
revoke all on function public.python_hub_eval_resume_v1(uuid,text) from public;
revoke all on function public.python_hub_eval_submit_v1(uuid,text,text,text,text,text) from public;
revoke all on function public.python_hub_eval_log_event_v1(uuid,text,text,jsonb) from public;
revoke all on function public.python_hub_eval_finish_v1(uuid,text,text) from public;

grant execute on function public.python_hub_eval_availability_v1(uuid,text,text) to anon,authenticated;
grant execute on function public.python_hub_eval_start_v1(uuid,text,text,jsonb,uuid,text) to anon,authenticated;
grant execute on function public.python_hub_eval_resume_v1(uuid,text) to anon,authenticated;
grant execute on function public.python_hub_eval_submit_v1(uuid,text,text,text,text,text) to anon,authenticated;
grant execute on function public.python_hub_eval_log_event_v1(uuid,text,text,jsonb) to anon,authenticated;
grant execute on function public.python_hub_eval_finish_v1(uuid,text,text) to anon,authenticated;
