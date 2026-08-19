create table if not exists public.learning_activities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  status text not null default 'draft' check (status in ('draft','open','closed')),
  max_points numeric not null default 8,
  grade_min numeric not null default 1,
  grade_max numeric not null default 5,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.learning_activity_checkpoints (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.learning_activities(id) on delete cascade,
  checkpoint_key text not null,
  sequence_no integer not null,
  title text not null,
  prompt text not null,
  code text,
  hint text,
  answer_type text not null default 'numeric' check (answer_type in ('numeric','text')),
  expected_text text not null,
  tolerance numeric not null default 0,
  points numeric not null default 1,
  unique(activity_id, checkpoint_key),
  unique(activity_id, sequence_no)
);

create table if not exists public.learning_activity_attempts (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.learning_activities(id) on delete cascade,
  student_registry_id uuid not null references public.student_registry(id),
  student_name_snapshot text not null,
  group_code text not null,
  session_id uuid not null,
  status text not null default 'active' check (status in ('active','submitted')),
  access_token_hash text not null,
  points numeric not null default 0,
  grade numeric not null default 1,
  started_at timestamptz not null default clock_timestamp(),
  last_activity_at timestamptz not null default clock_timestamp(),
  submitted_at timestamptz,
  user_agent text,
  unique(activity_id, student_registry_id)
);

create table if not exists public.learning_activity_responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.learning_activity_attempts(id) on delete cascade,
  checkpoint_id uuid not null references public.learning_activity_checkpoints(id) on delete cascade,
  latest_answer text,
  correct boolean not null default false,
  try_count integer not null default 0,
  first_try_correct boolean,
  first_answered_at timestamptz,
  last_answered_at timestamptz not null default clock_timestamp(),
  unique(attempt_id, checkpoint_id)
);

alter table public.learning_activities enable row level security;
alter table public.learning_activity_checkpoints enable row level security;
alter table public.learning_activity_attempts enable row level security;
alter table public.learning_activity_responses enable row level security;
revoke all on public.learning_activities, public.learning_activity_checkpoints, public.learning_activity_attempts, public.learning_activity_responses from anon, authenticated;

insert into public.learning_activities(slug,title,status,max_points,grade_min,grade_max)
values ('statistics11-colab-basics-01-2026','Colab Lab 01 · Python to Data','open',8,1,5)
on conflict (slug) do update set title=excluded.title,status=excluded.status,max_points=excluded.max_points,grade_min=excluded.grade_min,grade_max=excluded.grade_max,updated_at=clock_timestamp();

do $$
declare v_activity uuid;
begin
  select id into v_activity from public.learning_activities where slug='statistics11-colab-basics-01-2026';
  delete from public.learning_activity_checkpoints where activity_id=v_activity;
  insert into public.learning_activity_checkpoints(activity_id,checkpoint_key,sequence_no,title,prompt,code,hint,answer_type,expected_text,tolerance,points) values
  (v_activity,'A1',1,'Addition / Suma','Run the cell and submit the value of result.','a = 12\nb = 5\nresult = a + b\nprint(result)','Use the number printed by Colab.','numeric','17',0,1),
  (v_activity,'A2',2,'Multiplication / Multiplicación','Now change the operation. Submit product.','product = a * b\nprint(product)','Do not calculate in the portal; execute the cell in Colab.','numeric','60',0,1),
  (v_activity,'A3',3,'Length of a list','How many values are stored in numbers?','numbers = [12, 7, 15, 9, 11]\nprint(len(numbers))','len(...) counts elements.','numeric','5',0,1),
  (v_activity,'A4',4,'Sum of a list','Submit the total returned by sum(numbers).','print(sum(numbers))','Python can aggregate a list directly.','numeric','54',0,1),
  (v_activity,'A5',5,'Mean / Promedio','Compute the mean using sum and len.','mean_value = sum(numbers) / len(numbers)\nprint(mean_value)','Mean = total / number of values.','numeric','10.8',0.0001,1),
  (v_activity,'A6',6,'Read an external CSV','Load data.csv with pandas. How many rows are there?','import pandas as pd\nurl = "https://juanperez238421-cpu.github.io/ijr-estadistica-11-2026/actividad-colab-01/data.csv"\ndf = pd.read_csv(url)\nprint(df.shape[0])','df.shape returns (rows, columns).','numeric','12',0,1),
  (v_activity,'A7',7,'Average score with Pandas','What is the mean of the score column?','print(df["score"].mean())','Select one column, then call .mean().','numeric','4',0.0001,1),
  (v_activity,'A8',8,'Filter data','How many students have score >= 4?','passed = df[df["score"] >= 4]\nprint(len(passed))','Filtering creates a smaller DataFrame.','numeric','9',0,1);
end $$;

create or replace function public.learning_activity_snapshot(p_attempt_id uuid, p_attempt_token text)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
  v_attempt public.learning_activity_attempts%rowtype;
  v_activity public.learning_activities%rowtype;
  v_checkpoint_count integer;
  v_correct_count integer;
begin
  select * into v_attempt from public.learning_activity_attempts
  where id=p_attempt_id and access_token_hash=encode(digest(p_attempt_token,'sha256'),'hex');
  if v_attempt.id is null then raise exception 'Invalid activity session'; end if;
  select * into v_activity from public.learning_activities where id=v_attempt.activity_id;
  select count(*) into v_checkpoint_count from public.learning_activity_checkpoints where activity_id=v_attempt.activity_id;
  select count(*) into v_correct_count from public.learning_activity_responses where attempt_id=v_attempt.id and correct=true;
  return jsonb_build_object(
    'attempt_id',v_attempt.id,'student_label',v_attempt.student_name_snapshot,'group_code',v_attempt.group_code,
    'activity_slug',v_activity.slug,'activity_title',v_activity.title,'status',v_attempt.status,
    'points',v_attempt.points,'grade',v_attempt.grade,'checkpoint_count',v_checkpoint_count,'correct_count',v_correct_count,
    'completed',v_attempt.status='submitted',
    'checkpoints',(select coalesce(jsonb_agg(jsonb_build_object('key',c.checkpoint_key,'sequence',c.sequence_no,'title',c.title,'prompt',c.prompt,'code',c.code,'hint',c.hint,'points',c.points,'correct',coalesce(r.correct,false),'try_count',coalesce(r.try_count,0)) order by c.sequence_no),'[]'::jsonb)
      from public.learning_activity_checkpoints c left join public.learning_activity_responses r on r.checkpoint_id=c.id and r.attempt_id=v_attempt.id where c.activity_id=v_attempt.activity_id)
  );
end;
$$;

create or replace function public.student_learning_activity_start(p_activity_slug text,p_student_name text,p_group_code text,p_session_id uuid,p_user_agent text)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
  v_activity public.learning_activities%rowtype;
  v_student public.student_registry%rowtype;
  v_matches integer;
  v_attempt public.learning_activity_attempts%rowtype;
  v_token text;
  v_norm text;
begin
  select * into v_activity from public.learning_activities where slug=p_activity_slug and status='open';
  if v_activity.id is null then raise exception 'Activity is not open'; end if;
  v_norm := public.normalize_student_name(p_student_name);
  select count(*) into v_matches from public.student_registry s
    where s.active=true and s.group_code=upper(trim(p_group_code))
      and (s.normalized_name=v_norm or (s.name_is_truncated and v_norm like s.normalized_name || '%'));
  if v_matches=0 then raise exception 'Student name was not found in this group'; end if;
  if v_matches>1 then raise exception 'Student name is ambiguous; ask the teacher'; end if;
  select * into v_student from public.student_registry s
    where s.active=true and s.group_code=upper(trim(p_group_code))
      and (s.normalized_name=v_norm or (s.name_is_truncated and v_norm like s.normalized_name || '%')) limit 1;

  select * into v_attempt from public.learning_activity_attempts where activity_id=v_activity.id and student_registry_id=v_student.id;
  if v_attempt.id is null then
    v_token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
    insert into public.learning_activity_attempts(activity_id,student_registry_id,student_name_snapshot,group_code,session_id,access_token_hash,user_agent)
    values(v_activity.id,v_student.id,v_student.display_name,v_student.group_code,coalesce(p_session_id,gen_random_uuid()),encode(digest(v_token,'sha256'),'hex'),p_user_agent)
    returning * into v_attempt;
  else
    v_token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
    update public.learning_activity_attempts set access_token_hash=encode(digest(v_token,'sha256'),'hex'),last_activity_at=clock_timestamp(),user_agent=coalesce(p_user_agent,user_agent) where id=v_attempt.id returning * into v_attempt;
  end if;
  return jsonb_build_object('attempt_id',v_attempt.id,'attempt_token',v_token,'snapshot',public.learning_activity_snapshot(v_attempt.id,v_token));
end;
$$;

create or replace function public.student_learning_activity_resume(p_attempt_id uuid,p_attempt_token text)
returns jsonb
language sql
security definer
set search_path='public','extensions'
as $$
  select jsonb_build_object('snapshot',public.learning_activity_snapshot(p_attempt_id,p_attempt_token));
$$;

create or replace function public.student_learning_activity_submit(p_attempt_id uuid,p_attempt_token text,p_checkpoint_key text,p_answer text)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
  v_attempt public.learning_activity_attempts%rowtype;
  v_activity public.learning_activities%rowtype;
  v_cp public.learning_activity_checkpoints%rowtype;
  v_existing public.learning_activity_responses%rowtype;
  v_correct boolean := false;
  v_num numeric;
  v_points numeric;
  v_grade numeric;
  v_max numeric;
  v_correct_count integer;
begin
  select * into v_attempt from public.learning_activity_attempts where id=p_attempt_id and access_token_hash=encode(digest(p_attempt_token,'sha256'),'hex') for update;
  if v_attempt.id is null then raise exception 'Invalid activity session'; end if;
  if v_attempt.status='submitted' then return jsonb_build_object('correct',true,'snapshot',public.learning_activity_snapshot(p_attempt_id,p_attempt_token)); end if;
  select * into v_activity from public.learning_activities where id=v_attempt.activity_id;
  select * into v_cp from public.learning_activity_checkpoints where activity_id=v_attempt.activity_id and checkpoint_key=p_checkpoint_key;
  if v_cp.id is null then raise exception 'Unknown checkpoint'; end if;
  if v_cp.answer_type='numeric' then
    begin v_num := replace(trim(p_answer),',','.')::numeric; exception when others then v_num := null; end;
    v_correct := v_num is not null and abs(v_num - v_cp.expected_text::numeric) <= v_cp.tolerance;
  else
    v_correct := lower(trim(p_answer))=lower(trim(v_cp.expected_text));
  end if;
  select * into v_existing from public.learning_activity_responses where attempt_id=v_attempt.id and checkpoint_id=v_cp.id;
  if v_existing.id is null then
    insert into public.learning_activity_responses(attempt_id,checkpoint_id,latest_answer,correct,try_count,first_try_correct,first_answered_at,last_answered_at)
    values(v_attempt.id,v_cp.id,p_answer,v_correct,1,v_correct,clock_timestamp(),clock_timestamp());
  else
    update public.learning_activity_responses set latest_answer=p_answer,correct=(correct or v_correct),try_count=try_count+1,last_answered_at=clock_timestamp() where id=v_existing.id;
  end if;
  select coalesce(sum(c.points),0) into v_points from public.learning_activity_checkpoints c join public.learning_activity_responses r on r.checkpoint_id=c.id where r.attempt_id=v_attempt.id and r.correct=true;
  v_max := greatest(v_activity.max_points,1);
  v_grade := round(v_activity.grade_min + (v_activity.grade_max-v_activity.grade_min)*(v_points/v_max),2);
  select count(*) into v_correct_count from public.learning_activity_responses where attempt_id=v_attempt.id and correct=true;
  update public.learning_activity_attempts set points=v_points,grade=v_grade,last_activity_at=clock_timestamp(),status=case when v_points>=v_max then 'submitted' else 'active' end,submitted_at=case when v_points>=v_max then coalesce(submitted_at,clock_timestamp()) else submitted_at end where id=v_attempt.id;
  return jsonb_build_object('correct',v_correct,'points',v_points,'grade',v_grade,'correct_count',v_correct_count,'snapshot',public.learning_activity_snapshot(p_attempt_id,p_attempt_token));
end;
$$;

create or replace function public.teacher_learning_dashboard(p_teacher_token text)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare v_teacher_session uuid;
begin
  v_teacher_session := public.teacher_code_session_id(p_teacher_token);
  if v_teacher_session is null then raise exception 'Invalid or expired teacher session'; end if;
  return jsonb_build_object(
    'generated_at',clock_timestamp(),
    'activities',(select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'slug',a.slug,'title',a.title,'status',a.status,'max_points',a.max_points) order by a.created_at),'[]'::jsonb) from public.learning_activities a where a.status<>'draft'),
    'roster',(select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'group_code',s.group_code,'source_position',s.source_position,'display_name',s.display_name) order by s.group_code,s.source_position),'[]'::jsonb) from public.student_registry s where s.active=true and s.group_code in ('11A','11B','11C')),
    'activity_results',(select coalesce(jsonb_agg(jsonb_build_object('student_registry_id',x.student_registry_id,'activity_slug',a.slug,'status',x.status,'points',x.points,'grade',x.grade,'correct_count',(select count(*) from public.learning_activity_responses r where r.attempt_id=x.id and r.correct=true),'checkpoint_count',(select count(*) from public.learning_activity_checkpoints c where c.activity_id=x.activity_id),'started_at',x.started_at,'last_activity_at',x.last_activity_at,'submitted_at',x.submitted_at) order by x.last_activity_at desc),'[]'::jsonb) from public.learning_activity_attempts x join public.learning_activities a on a.id=x.activity_id),
    'exam_results',(select coalesce(jsonb_agg(jsonb_build_object('student_registry_id',z.student_registry_id,'grade',z.grade,'status',z.status,'submitted_at',z.submitted_at)),'[]'::jsonb) from (select distinct on (t.student_registry_id) t.student_registry_id,t.grade,t.status,t.submitted_at,t.started_at from public.attempts t where t.student_registry_id is not null and t.grade is not null order by t.student_registry_id,t.submitted_at desc nulls last,t.started_at desc) z)
  );
end;
$$;

grant execute on function public.learning_activity_snapshot(uuid,text) to anon, authenticated;
grant execute on function public.student_learning_activity_start(text,text,text,uuid,text) to anon, authenticated;
grant execute on function public.student_learning_activity_resume(uuid,text) to anon, authenticated;
grant execute on function public.student_learning_activity_submit(uuid,text,text,text) to anon, authenticated;
grant execute on function public.teacher_learning_dashboard(text) to anon, authenticated;
