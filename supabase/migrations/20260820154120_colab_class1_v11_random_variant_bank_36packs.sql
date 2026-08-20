-- Statistics 11 · Colab Class 01 V11
-- 36 balanced random packs. Every registration receives one persistent pack.
-- During a classroom window, least-used random allocation makes the first 36 sessions distinct.

create table if not exists public.learning_activity_variant_bank(
  activity_id uuid not null references public.learning_activities(id) on delete cascade,
  checkpoint_key text not null,
  pack_no smallint not null check (pack_no between 1 and 36),
  variant_key text not null,
  mode text not null check (mode in ('code','choice')),
  prompt text not null,
  starter_code text,
  solution_code text,
  hint text,
  answer_type text not null check (answer_type in ('numeric','text')),
  expected_text text not null,
  tolerance numeric not null default 0,
  choices jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key(activity_id,checkpoint_key,pack_no),
  unique(activity_id,variant_key),
  foreign key(activity_id,checkpoint_key)
    references public.learning_activity_checkpoints(activity_id,checkpoint_key)
    on delete cascade
);

create table if not exists public.learning_activity_attempt_variant_pack(
  attempt_id uuid primary key references public.learning_activity_attempts(id) on delete cascade,
  activity_id uuid not null references public.learning_activities(id) on delete cascade,
  pack_no smallint not null check (pack_no between 1 and 36),
  assignment_reason text not null default 'least_used_random',
  assigned_at timestamptz not null default clock_timestamp()
);

create index if not exists learning_activity_attempt_variant_pack_activity_time_idx
  on public.learning_activity_attempt_variant_pack(activity_id,assigned_at desc,pack_no);

alter table public.learning_activity_variant_bank enable row level security;
alter table public.learning_activity_attempt_variant_pack enable row level security;
revoke all on table public.learning_activity_variant_bank from anon,authenticated;
revoke all on table public.learning_activity_attempt_variant_pack from anon,authenticated;

with activity as (
  select id from public.learning_activities
  where slug='statistics11-colab-class1-basics-types-arrays-2026'
), p as (
  select n,
    10 + ((n*7)%31) as a1_a,
    3 + ((n*11)%17) as a1_b,
    2 + ((n*5)%11) as a2_x,
    2 + ((n*7)%8) as a2_y,
    3 + ((n*3)%6) as a2_z,
    20 + ((n*13)%70) as a3_whole,
    (1.25 + ((n*17)%60)/10.0)::numeric(5,2) as a3_decimal,
    10 + ((n*19)%89) as a4_value,
    10 + ((n*23)%80) as a5_left,
    2 + ((n*29)%18) as a5_right,
    5+n as a6_0,
    8+n as a6_1,
    13+n as a6_2,
    19+n as a6_3,
    26+n as a6_4,
    20+2*n as a7_0,
    24+2*n as a7_1,
    29+2*n as a7_2,
    35+2*n as a7_3,
    100+n as a8_0,
    107+n as a8_1,
    114+n as a8_2,
    121+n as a8_3
  from generate_series(1,36) n
), q as (
  select p.*,
    a1_a+a1_b as a1_answer,
    a2_x+a2_y*a2_z as a2_answer,
    (a2_x+a2_y)*a2_z as a2_parentheses,
    a2_x+a2_y+a2_z as a2_simple,
    a2_x+a2_y*a2_z+a2_x as a2_plus_x
  from p
), prepared as (
  select q.*,
    case q.n%4
      when 0 then jsonb_build_array(q.a2_answer::text,q.a2_parentheses::text,q.a2_simple::text,q.a2_plus_x::text)
      when 1 then jsonb_build_array(q.a2_simple::text,q.a2_answer::text,q.a2_plus_x::text,q.a2_parentheses::text)
      when 2 then jsonb_build_array(q.a2_plus_x::text,q.a2_parentheses::text,q.a2_answer::text,q.a2_simple::text)
      else jsonb_build_array(q.a2_parentheses::text,q.a2_simple::text,q.a2_plus_x::text,q.a2_answer::text)
    end as a2_choices
  from q
)
insert into public.learning_activity_variant_bank(
  activity_id,checkpoint_key,pack_no,variant_key,mode,prompt,starter_code,solution_code,hint,
  answer_type,expected_text,tolerance,choices,metadata,updated_at
)
select a.id,v.checkpoint_key,p.n,format('%s-P%02s',v.checkpoint_key,p.n),v.mode,v.prompt,v.starter_code,v.solution_code,v.hint,
       v.answer_type,v.expected_text,v.tolerance,v.choices,v.metadata,clock_timestamp()
from activity a
cross join prepared p
cross join lateral (values
  ('A1','code',
   format('Use Python variables a = %s and b = %s. Add them with a + b and print the result.',p.a1_a,p.a1_b),
   format(E'a = %s\nb = %s\n\nresult = WRITE_HERE\nprint(result)',p.a1_a,p.a1_b),
   format(E'a = %s\nb = %s\n\nresult = a + b\nprint(result)',p.a1_a,p.a1_b),
   'Use the variable names exactly as shown; do not type the final sum directly.',
   'numeric',p.a1_answer::text,0::numeric,null::jsonb,
   jsonb_build_object('topic','basic_operations','difficulty','basic','pack_no',p.n)),
  ('A2','choice',
   format('What is the value of %s + %s * %s in Python?',p.a2_x,p.a2_y,p.a2_z),
   null::text,null::text,
   'Apply multiplication before addition. Parentheses would change the result.',
   'numeric',p.a2_answer::text,0::numeric,p.a2_choices,
   jsonb_build_object('topic','order_of_operations','difficulty','basic','pack_no',p.n)),
  ('A3','code',
   format('Inspect the decimal value %s with type() and print only its Python type name.',to_char(p.a3_decimal,'FM9990.00')),
   format(E'whole = %s\ndecimal = %s\nlabel = "P%02s"\npassed = %s\nmissing = None\n\nprint(type(WRITE_HERE).__name__)',p.a3_whole,to_char(p.a3_decimal,'FM9990.00'),p.n,case when p.n%2=0 then 'True' else 'False' end),
   format(E'whole = %s\ndecimal = %s\nlabel = "P%02s"\npassed = %s\nmissing = None\n\nprint(type(decimal).__name__)',p.a3_whole,to_char(p.a3_decimal,'FM9990.00'),p.n,case when p.n%2=0 then 'True' else 'False' end),
   'The variable named decimal contains a number with a decimal point.',
   'text','float',0::numeric,null::jsonb,
   jsonb_build_object('topic','data_types','difficulty','basic','pack_no',p.n)),
  ('A4','choice',
   format('What is the Python data type of the value "%s"?',p.a4_value),
   null::text,null::text,
   'Quotation marks make a value text even when the characters are digits.',
   'text','str',0::numeric,jsonb_build_array('int','float','str','bool'),
   jsonb_build_object('topic','data_types','difficulty','basic','pack_no',p.n)),
  ('A5','choice',
   format('If a = "%s" and b = "%s", what does a + b produce?',p.a5_left,p.a5_right),
   null::text,null::text,
   'Both values are strings, so + concatenates them instead of adding numerically.',
   'text',(p.a5_left::text||p.a5_right::text),0::numeric,
   jsonb_build_array((p.a5_left+p.a5_right)::text,(p.a5_left::text||p.a5_right::text),format('%s %s',p.a5_left,p.a5_right),'Error'),
   jsonb_build_object('topic','data_types','difficulty','basic','pack_no',p.n)),
  ('A6','code',
   format('For scores = [%s, %s, %s, %s, %s], read the first element using index 0.',p.a6_0,p.a6_1,p.a6_2,p.a6_3,p.a6_4),
   format(E'scores = [%s, %s, %s, %s, %s]\n\nfirst = WRITE_HERE\nprint(first)',p.a6_0,p.a6_1,p.a6_2,p.a6_3,p.a6_4),
   format(E'scores = [%s, %s, %s, %s, %s]\n\nfirst = scores[0]\nprint(first)',p.a6_0,p.a6_1,p.a6_2,p.a6_3,p.a6_4),
   'Python indexing starts at zero; use the list name followed by [0].',
   'numeric',p.a6_0::text,0::numeric,null::jsonb,
   jsonb_build_object('topic','arrays_indexing','difficulty','basic','pack_no',p.n)),
  ('A7','choice',
   format('For values = [%s, %s, %s, %s], what is values[2]?',p.a7_0,p.a7_1,p.a7_2,p.a7_3),
   null::text,null::text,
   'Index 2 is the third element because Python starts counting at zero.',
   'numeric',p.a7_2::text,0::numeric,jsonb_build_array(p.a7_0::text,p.a7_1::text,p.a7_2::text,p.a7_3::text),
   jsonb_build_object('topic','arrays_indexing','difficulty','basic','pack_no',p.n)),
  ('A8','code',
   format('For values = [%s, %s, %s, %s], read the second element using index 1.',p.a8_0,p.a8_1,p.a8_2,p.a8_3),
   format(E'values = [%s, %s, %s, %s]\n\nsecond = WRITE_HERE\nprint(second)',p.a8_0,p.a8_1,p.a8_2,p.a8_3),
   format(E'values = [%s, %s, %s, %s]\n\nsecond = values[1]\nprint(second)',p.a8_0,p.a8_1,p.a8_2,p.a8_3),
   'The second item is index 1 because the first item is index 0.',
   'numeric',p.a8_1::text,0::numeric,null::jsonb,
   jsonb_build_object('topic','arrays_indexing','difficulty','basic','pack_no',p.n))
) as v(checkpoint_key,mode,prompt,starter_code,solution_code,hint,answer_type,expected_text,tolerance,choices,metadata)
on conflict (activity_id,checkpoint_key,pack_no) do update set
  variant_key=excluded.variant_key,mode=excluded.mode,prompt=excluded.prompt,starter_code=excluded.starter_code,
  solution_code=excluded.solution_code,hint=excluded.hint,answer_type=excluded.answer_type,
  expected_text=excluded.expected_text,tolerance=excluded.tolerance,choices=excluded.choices,metadata=excluded.metadata,
  updated_at=clock_timestamp();

create or replace function public.learning_activity_assign_variant_pack_v11(p_attempt_id uuid)
returns smallint
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v_attempt public.learning_activity_attempts%rowtype;
  v_slug text;
  v_pack smallint;
begin
  select x.* into v_attempt
  from public.learning_activity_attempts x
  where x.id=p_attempt_id
  for update;
  if v_attempt.id is null then raise exception 'Activity attempt not found'; end if;

  select a.slug into v_slug from public.learning_activities a where a.id=v_attempt.activity_id;
  if v_slug<>'statistics11-colab-class1-basics-types-arrays-2026' then return null; end if;

  select pack_no into v_pack from public.learning_activity_attempt_variant_pack where attempt_id=p_attempt_id;
  if v_pack is not null then return v_pack; end if;

  perform pg_advisory_xact_lock(hashtext('statistics11-colab-class1-v11-pack-allocation'));
  select pack_no into v_pack from public.learning_activity_attempt_variant_pack where attempt_id=p_attempt_id;
  if v_pack is not null then return v_pack; end if;

  select p.n::smallint into v_pack
  from generate_series(1,36) p(n)
  left join (
    select ap.pack_no,count(*)::integer as uses
    from public.learning_activity_attempt_variant_pack ap
    join public.learning_activity_attempts x on x.id=ap.attempt_id
    where ap.activity_id=v_attempt.activity_id and x.started_at>=clock_timestamp()-interval '4 hours'
    group by ap.pack_no
  ) u on u.pack_no=p.n
  order by coalesce(u.uses,0),random()
  limit 1;

  insert into public.learning_activity_attempt_variant_pack(attempt_id,activity_id,pack_no)
  values(v_attempt.id,v_attempt.activity_id,v_pack);
  insert into public.learning_activity_events(attempt_id,event_type,metadata)
  values(v_attempt.id,'VARIANT_PACK_ASSIGNED',jsonb_build_object('pack_no',v_pack,'bank_size',36,'strategy','least_used_random_4h'));
  return v_pack;
end;
$function$;

create or replace function public.learning_activity_snapshot_v11(p_attempt_id uuid,p_attempt_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v_base jsonb;
  v_activity_id uuid;
  v_slug text;
  v_pack smallint;
  v_checkpoints jsonb;
begin
  v_base:=public.learning_activity_snapshot(p_attempt_id,p_attempt_token);
  select x.activity_id,a.slug into v_activity_id,v_slug
  from public.learning_activity_attempts x join public.learning_activities a on a.id=x.activity_id
  where x.id=p_attempt_id;
  if v_slug<>'statistics11-colab-class1-basics-types-arrays-2026' then return v_base; end if;

  select pack_no into v_pack from public.learning_activity_attempt_variant_pack where attempt_id=p_attempt_id;
  if v_pack is null then v_pack:=public.learning_activity_assign_variant_pack_v11(p_attempt_id); end if;

  select coalesce(jsonb_agg(
    cp.value || jsonb_build_object(
      'prompt',coalesce(v.prompt,cp.value->>'prompt'),
      'code',coalesce(v.starter_code,cp.value->>'code'),
      'hint',coalesce(v.hint,cp.value->>'hint'),
      'mode',coalesce(v.mode,'code'),
      'choices',coalesce(v.choices,'[]'::jsonb),
      'variant_key',v.variant_key,
      'variant_pack',v.pack_no
    ) order by cp.ord
  ),'[]'::jsonb) into v_checkpoints
  from jsonb_array_elements(v_base->'checkpoints') with ordinality cp(value,ord)
  left join public.learning_activity_variant_bank v
    on v.activity_id=v_activity_id and v.pack_no=v_pack and v.checkpoint_key=cp.value->>'key';

  return jsonb_set(jsonb_set(v_base,'{checkpoints}',v_checkpoints,true),'{variant_pack}',to_jsonb(v_pack),true)
    || jsonb_build_object('variant_bank_size',36,'variant_strategy','least_used_random_4h');
end;
$function$;

create or replace function public.student_learning_activity_start_team_email_v11(
  p_activity_slug text,p_student_emails jsonb,p_group_code text,p_session_id uuid,p_user_agent text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare v_data jsonb;v_attempt_id uuid;v_token text;
begin
  v_data:=public.student_learning_activity_start_team_email(p_activity_slug,p_student_emails,p_group_code,p_session_id,p_user_agent);
  v_attempt_id:=(v_data->>'attempt_id')::uuid;v_token:=v_data->>'attempt_token';
  perform public.learning_activity_assign_variant_pack_v11(v_attempt_id);
  return jsonb_set(v_data,'{snapshot}',public.learning_activity_snapshot_v11(v_attempt_id,v_token),true);
end;
$function$;

create or replace function public.student_learning_activity_resume_v11(p_attempt_id uuid,p_attempt_token text)
returns jsonb
language sql
security definer
set search_path to 'public','extensions'
as $function$
  select jsonb_build_object('snapshot',public.learning_activity_snapshot_v11(p_attempt_id,p_attempt_token));
$function$;

create or replace function public.student_learning_activity_submit_v11(
  p_attempt_id uuid,p_attempt_token text,p_checkpoint_key text,p_answer text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v_attempt public.learning_activity_attempts%rowtype;
  v_cp public.learning_activity_checkpoints%rowtype;
  v_current public.learning_activity_checkpoints%rowtype;
  v_existing public.learning_activity_responses%rowtype;
  v_pack smallint;v_expected text;v_answer_type text;v_tolerance numeric;v_variant_key text;
  v_correct boolean:=false;v_num numeric;v_awarded numeric:=0;v_wrong integer:=0;v_help integer:=0;
begin
  select * into v_attempt from public.learning_activity_attempts
  where id=p_attempt_id and access_token_hash=encode(digest(p_attempt_token,'sha256'),'hex') for update;
  if v_attempt.id is null then raise exception 'Invalid activity session'; end if;
  if v_attempt.status='submitted' then
    return jsonb_build_object('correct',false,'snapshot',public.learning_activity_snapshot_v11(p_attempt_id,p_attempt_token));
  end if;

  select c.* into v_current
  from public.learning_activity_checkpoints c
  left join public.learning_activity_responses r on r.checkpoint_id=c.id and r.attempt_id=v_attempt.id
  where c.activity_id=v_attempt.activity_id and coalesce(r.completed,false)=false
  order by c.sequence_no limit 1;
  if v_current.id is null then raise exception 'No pending stage'; end if;
  if v_current.checkpoint_key<>p_checkpoint_key then raise exception 'Complete the current stage first'; end if;
  v_cp:=v_current;

  v_pack:=public.learning_activity_assign_variant_pack_v11(v_attempt.id);
  select b.expected_text,b.answer_type,b.tolerance,b.variant_key into v_expected,v_answer_type,v_tolerance,v_variant_key
  from public.learning_activity_variant_bank b
  where b.activity_id=v_attempt.activity_id and b.pack_no=v_pack and b.checkpoint_key=v_cp.checkpoint_key;
  if not found then
    v_expected:=v_cp.expected_text;v_answer_type:=v_cp.answer_type;v_tolerance:=v_cp.tolerance;v_variant_key:=v_cp.checkpoint_key;
  end if;

  if v_answer_type='numeric' then
    begin v_num:=replace(trim(p_answer),',','.')::numeric; exception when others then v_num:=null; end;
    v_correct:=v_num is not null and abs(v_num-v_expected::numeric)<=v_tolerance;
  else
    v_correct:=lower(trim(p_answer))=lower(trim(v_expected));
  end if;

  select * into v_existing from public.learning_activity_responses
  where attempt_id=v_attempt.id and checkpoint_id=v_cp.id for update;

  if v_existing.id is null then
    if v_correct then
      v_awarded:=public.learning_activity_stage_credit(v_cp.points,0,0);
      insert into public.learning_activity_responses(
        attempt_id,checkpoint_id,latest_answer,correct,try_count,first_try_correct,
        first_answered_at,last_answered_at,completed,completion_mode,awarded_points,wrong_attempts
      ) values (v_attempt.id,v_cp.id,p_answer,true,1,true,clock_timestamp(),clock_timestamp(),true,'solved',v_awarded,0);
    else
      v_wrong:=1;
      insert into public.learning_activity_responses(
        attempt_id,checkpoint_id,latest_answer,correct,try_count,first_try_correct,
        first_answered_at,last_answered_at,completed,completion_mode,awarded_points,wrong_attempts
      ) values (v_attempt.id,v_cp.id,p_answer,false,1,false,clock_timestamp(),clock_timestamp(),false,'pending',0,1);
    end if;
  else
    v_help:=coalesce(v_existing.help_count,0);
    if v_correct then
      v_wrong:=coalesce(v_existing.wrong_attempts,0);
      v_awarded:=public.learning_activity_stage_credit(v_cp.points,v_help,v_wrong);
      update public.learning_activity_responses
      set latest_answer=p_answer,correct=true,try_count=try_count+1,last_answered_at=clock_timestamp(),completed=true,completion_mode='solved',awarded_points=v_awarded
      where id=v_existing.id;
    else
      v_wrong:=coalesce(v_existing.wrong_attempts,0)+1;
      update public.learning_activity_responses
      set latest_answer=p_answer,correct=false,try_count=try_count+1,last_answered_at=clock_timestamp(),wrong_attempts=v_wrong
      where id=v_existing.id;
    end if;
  end if;

  update public.learning_activity_attempts set last_activity_at=clock_timestamp() where id=v_attempt.id;
  insert into public.learning_activity_events(attempt_id,event_type,metadata)
  values(v_attempt.id,'VARIANT_ANSWER_VALIDATED',jsonb_build_object('checkpoint_key',v_cp.checkpoint_key,'variant_key',v_variant_key,'pack_no',v_pack,'correct',v_correct));
  perform public.learning_activity_refresh_attempt_score(v_attempt.id);

  return jsonb_build_object(
    'correct',v_correct,'awarded_points',case when v_correct then v_awarded else 0 end,'wrong_attempts',v_wrong,
    'stage_potential',case when v_correct then v_awarded else public.learning_activity_stage_credit(v_cp.points,v_help,v_wrong) end,
    'snapshot',public.learning_activity_snapshot_v11(p_attempt_id,p_attempt_token)
  );
end;
$function$;

create or replace function public.student_learning_activity_use_help_v11(p_attempt_id uuid,p_attempt_token text,p_checkpoint_key text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare v_data jsonb;v_hint text;v_pack smallint;v_activity_id uuid;
begin
  v_data:=public.student_learning_activity_use_help(p_attempt_id,p_attempt_token,p_checkpoint_key);
  select activity_id into v_activity_id from public.learning_activity_attempts where id=p_attempt_id;
  v_pack:=public.learning_activity_assign_variant_pack_v11(p_attempt_id);
  select hint into v_hint from public.learning_activity_variant_bank
  where activity_id=v_activity_id and pack_no=v_pack and checkpoint_key=p_checkpoint_key;
  return jsonb_set(v_data,'{snapshot}',public.learning_activity_snapshot_v11(p_attempt_id,p_attempt_token),true)
    || jsonb_build_object('variant_hint',v_hint);
end;
$function$;

create or replace function public.student_learning_activity_reveal_solution_v11(p_attempt_id uuid,p_attempt_token text,p_checkpoint_key text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v_attempt public.learning_activity_attempts%rowtype;v_cp public.learning_activity_checkpoints%rowtype;
  v_pack smallint;v_expected text;v_solution text;v_variant_key text;v_awarded numeric;
begin
  select * into v_attempt from public.learning_activity_attempts
  where id=p_attempt_id and access_token_hash=encode(digest(p_attempt_token,'sha256'),'hex') for update;
  if v_attempt.id is null then raise exception 'Invalid activity session'; end if;
  if v_attempt.status='submitted' then raise exception 'Activity already completed'; end if;

  select c.* into v_cp
  from public.learning_activity_checkpoints c
  left join public.learning_activity_responses r on r.checkpoint_id=c.id and r.attempt_id=v_attempt.id
  where c.activity_id=v_attempt.activity_id and coalesce(r.completed,false)=false
  order by c.sequence_no limit 1;
  if v_cp.id is null or v_cp.checkpoint_key<>p_checkpoint_key then raise exception 'Reveal is only available for the current stage'; end if;

  v_pack:=public.learning_activity_assign_variant_pack_v11(v_attempt.id);
  select expected_text,solution_code,variant_key into v_expected,v_solution,v_variant_key
  from public.learning_activity_variant_bank
  where activity_id=v_attempt.activity_id and pack_no=v_pack and checkpoint_key=v_cp.checkpoint_key;
  if not found then v_expected:=v_cp.expected_text;v_solution:=v_cp.code;v_variant_key:=v_cp.checkpoint_key; end if;

  v_awarded:=round(v_cp.points*0.25,4);
  insert into public.learning_activity_responses(attempt_id,checkpoint_id,latest_answer,correct,try_count,completed,completion_mode,awarded_points,solution_revealed)
  values(v_attempt.id,v_cp.id,v_expected,false,0,true,'revealed',v_awarded,true)
  on conflict (attempt_id,checkpoint_id) do update set
    latest_answer=v_expected,correct=false,completed=true,completion_mode='revealed',awarded_points=v_awarded,solution_revealed=true,last_answered_at=clock_timestamp();

  insert into public.learning_activity_events(attempt_id,event_type,metadata)
  values(v_attempt.id,'SOLUTION_REVEALED',jsonb_build_object('checkpoint_key',p_checkpoint_key,'variant_key',v_variant_key,'pack_no',v_pack,'awarded_points',v_awarded));
  perform public.learning_activity_refresh_attempt_score(v_attempt.id);

  return jsonb_build_object('expected_answer',v_expected,'solution_code',v_solution,'awarded_points',v_awarded,
    'snapshot',public.learning_activity_snapshot_v11(p_attempt_id,p_attempt_token));
end;
$function$;

create or replace function public.student_learning_activity_skip_stage_v11(p_attempt_id uuid,p_attempt_token text,p_checkpoint_key text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare v_data jsonb;
begin
  v_data:=public.student_learning_activity_skip_stage(p_attempt_id,p_attempt_token,p_checkpoint_key);
  return jsonb_set(v_data,'{snapshot}',public.learning_activity_snapshot_v11(p_attempt_id,p_attempt_token),true);
end;
$function$;

create or replace function public.teacher_learning_activity_dashboard_v11(p_teacher_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare v_base jsonb;v_sessions jsonb;
begin
  v_base:=public.teacher_learning_activity_dashboard_v10(p_teacher_token);
  select coalesce(jsonb_agg(
    s.value || jsonb_build_object(
      'variant_pack',ap.pack_no,
      'responses',coalesce((
        select jsonb_agg(r.value || jsonb_build_object(
          'expected_answer',coalesce(v.expected_text,r.value->>'expected_answer'),'variant_key',v.variant_key
        ) order by r.ord)
        from jsonb_array_elements(coalesce(s.value->'responses','[]'::jsonb)) with ordinality r(value,ord)
        left join public.learning_activity_variant_bank v
          on v.activity_id=ap.activity_id and v.pack_no=ap.pack_no and v.checkpoint_key=r.value->>'checkpoint_key'
      ),'[]'::jsonb)
    ) order by s.ord
  ),'[]'::jsonb) into v_sessions
  from jsonb_array_elements(coalesce(v_base->'sessions','[]'::jsonb)) with ordinality s(value,ord)
  left join public.learning_activity_attempt_variant_pack ap on ap.attempt_id=(s.value->>'attempt_id')::uuid;

  return jsonb_set(v_base,'{sessions}',v_sessions,true)
    || jsonb_build_object('variant_bank_size',36,'variant_strategy','least_used_random_4h');
end;
$function$;

create or replace function public.teacher_learning_activity_detail_v11(p_teacher_token text,p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare v_base jsonb;v_activity_id uuid;v_pack smallint;v_responses jsonb;
begin
  v_base:=public.teacher_learning_activity_detail_v10(p_teacher_token,p_attempt_id);
  select activity_id,pack_no into v_activity_id,v_pack from public.learning_activity_attempt_variant_pack where attempt_id=p_attempt_id;

  select coalesce(jsonb_agg(r.value || jsonb_build_object(
    'expected_answer',coalesce(v.expected_text,r.value->>'expected_answer'),
    'prompt',coalesce(v.prompt,r.value->>'prompt'),'variant_key',v.variant_key,'choices',coalesce(v.choices,'[]'::jsonb)
  ) order by r.ord),'[]'::jsonb) into v_responses
  from jsonb_array_elements(coalesce(v_base->'responses','[]'::jsonb)) with ordinality r(value,ord)
  left join public.learning_activity_variant_bank v
    on v.activity_id=v_activity_id and v.pack_no=v_pack and v.checkpoint_key=r.value->>'checkpoint_key';

  v_base:=jsonb_set(v_base,'{responses}',v_responses,true);
  v_base:=jsonb_set(v_base,'{attempt}',coalesce(v_base->'attempt','{}'::jsonb)||jsonb_build_object('variant_pack',v_pack),true);
  return v_base || jsonb_build_object('variant_bank_size',36);
end;
$function$;

revoke all on function public.learning_activity_assign_variant_pack_v11(uuid) from public,anon,authenticated;
revoke all on function public.learning_activity_snapshot_v11(uuid,text) from public,anon,authenticated;

grant execute on function public.student_learning_activity_start_team_email_v11(text,jsonb,text,uuid,text) to anon,authenticated;
grant execute on function public.student_learning_activity_resume_v11(uuid,text) to anon,authenticated;
grant execute on function public.student_learning_activity_submit_v11(uuid,text,text,text) to anon,authenticated;
grant execute on function public.student_learning_activity_use_help_v11(uuid,text,text) to anon,authenticated;
grant execute on function public.student_learning_activity_reveal_solution_v11(uuid,text,text) to anon,authenticated;
grant execute on function public.student_learning_activity_skip_stage_v11(uuid,text,text) to anon,authenticated;
grant execute on function public.teacher_learning_activity_dashboard_v11(text) to anon,authenticated;
grant execute on function public.teacher_learning_activity_detail_v11(text,uuid) to anon,authenticated;

notify pgrst,'reload schema';