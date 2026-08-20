-- Statistics 11 · Colab Class 01 V10
-- Scope: basic operations, Python data types, and list/array indexing only.
-- Adds teacher detail/edit/delete controls for this activity without changing prior V9 history.

insert into public.learning_activities(slug,title,status,max_points,grade_min,grade_max,updated_at)
values(
  'statistics11-colab-class1-basics-types-arrays-2026',
  'Python Class 01 · Operations, Data Types & Arrays',
  'open',8,1,5,clock_timestamp()
)
on conflict (slug) do update set
  title=excluded.title,
  status='open',
  max_points=8,
  grade_min=1,
  grade_max=5,
  updated_at=clock_timestamp();

with a as (
  select id from public.learning_activities
  where slug='statistics11-colab-class1-basics-types-arrays-2026'
)
insert into public.learning_activity_checkpoints(
  activity_id,checkpoint_key,sequence_no,title,prompt,code,hint,answer_type,expected_text,tolerance,points
)
select a.id,v.checkpoint_key,v.sequence_no,v.title,v.prompt,v.code,v.hint,v.answer_type,v.expected_text,v.tolerance,v.points
from a
cross join (values
  ('A1',1,'Basic operations with variables',
   'Store two integers, add them with Python, and print the result.',
   E'a = 12\nb = 5\nresult = a + b\nprint(result)',
   'Use the variable names a and b with the + operator.','numeric','17',0::numeric,1::numeric),
  ('A2',2,'Multiple choice · order of operations',
   'What is the value of 3 + 4 * 2 in Python?',
   null,
   'Multiplication is evaluated before addition.','numeric','11',0::numeric,1::numeric),
  ('A3',3,'Core Python data types',
   'Inspect int, float, str, bool, and NoneType values with type().',
   E'whole = 28\ndecimal = 4.25\nlabel = "11A"\npassed = True\nmissing = None\nprint(type(decimal).__name__)',
   'The decimal value 4.25 is stored as a float.','text','float',0::numeric,1::numeric),
  ('A4',4,'Multiple choice · identify a string',
   'What is the Python data type of the value "10"?',
   null,
   'Quotation marks make the value text.','text','str',0::numeric,1::numeric),
  ('A5',5,'Multiple choice · same symbols, different data',
   'If a = "10" and b = "5", what does a + b produce?',
   null,
   'With strings, + joins text instead of adding numbers.','text','105',0::numeric,1::numeric),
  ('A6',6,'Lists as basic arrays · index 0',
   'Create an ordered list and read its first element using index 0.',
   E'scores = [12, 7, 15, 9, 11]\nfirst = scores[0]\nprint(first)',
   'Python list indexing starts at zero, so the first element is scores[0].','numeric','12',0::numeric,1::numeric),
  ('A7',7,'Multiple choice · read an index',
   'For values = [8, 13, 21, 34], what is values[2]?',
   null,
   'Index 0 is 8, index 1 is 13, and index 2 is the third value.','numeric','21',0::numeric,1::numeric),
  ('A8',8,'Lists as basic arrays · index 1',
   'Read the second item of a list using index 1 and print it.',
   E'names = ["Ana", "Luis", "Sara"]\nsecond = names[1]\nprint(second)',
   'Because indexing starts at zero, the second item is names[1].','text','Luis',0::numeric,1::numeric)
) as v(checkpoint_key,sequence_no,title,prompt,code,hint,answer_type,expected_text,tolerance,points)
on conflict (activity_id,checkpoint_key) do update set
  sequence_no=excluded.sequence_no,
  title=excluded.title,
  prompt=excluded.prompt,
  code=excluded.code,
  hint=excluded.hint,
  answer_type=excluded.answer_type,
  expected_text=excluded.expected_text,
  tolerance=excluded.tolerance,
  points=excluded.points;

create table if not exists public.learning_activity_teacher_audit(
  id uuid primary key default gen_random_uuid(),
  teacher_session_id uuid not null,
  attempt_id uuid,
  action text not null check (action in ('update_registration','delete_registration')),
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default clock_timestamp()
);

alter table public.learning_activity_teacher_audit enable row level security;
revoke all on table public.learning_activity_teacher_audit from anon, authenticated;

create or replace function public.teacher_learning_activity_dashboard_v10(p_teacher_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v_teacher_session uuid;
begin
  v_teacher_session:=public.teacher_code_session_id(p_teacher_token);
  if v_teacher_session is null then raise exception 'Invalid or expired teacher session'; end if;

  return (
    with
    checkpoint_stats as (
      select c.activity_id,count(*)::integer as checkpoint_count
      from public.learning_activity_checkpoints c
      group by c.activity_id
    ),
    member_stats as (
      select m.attempt_id,count(*)::integer as member_count,
        jsonb_agg(jsonb_build_object(
          'member_order',m.member_order,
          'student_registry_id',m.student_registry_id,
          'display_name',m.display_name,
          'institutional_email',m.institutional_email,
          'email_normalized',m.email_normalized,
          'is_roster_match',m.is_roster_match
        ) order by m.member_order) as participants
      from public.learning_activity_attempt_members m
      group by m.attempt_id
    ),
    response_stats as (
      select r.attempt_id,
        count(*) filter (where coalesce(r.completed,false))::integer as completed_count,
        coalesce(sum(r.wrong_attempts),0)::integer as wrong_attempts,
        count(*) filter (where coalesce(r.solution_revealed,false))::integer as revealed_count,
        count(*) filter (where r.completion_mode='skipped')::integer as skipped_count,
        jsonb_agg(jsonb_build_object(
          'checkpoint_key',c.checkpoint_key,
          'sequence',c.sequence_no,
          'title',c.title,
          'latest_answer',r.latest_answer,
          'expected_answer',c.expected_text,
          'correct',coalesce(r.correct,false),
          'completed',coalesce(r.completed,false),
          'completion_mode',coalesce(r.completion_mode,'pending'),
          'awarded_points',coalesce(r.awarded_points,0),
          'wrong_attempts',coalesce(r.wrong_attempts,0),
          'help_count',coalesce(r.help_count,0),
          'last_answered_at',r.last_answered_at
        ) order by c.sequence_no) as responses
      from public.learning_activity_responses r
      join public.learning_activity_checkpoints c on c.id=r.checkpoint_id
      group by r.attempt_id
    ),
    latest_response as (
      select distinct on (r.attempt_id)
        r.attempt_id,c.checkpoint_key,r.latest_answer,c.expected_text,r.correct,r.last_answered_at
      from public.learning_activity_responses r
      join public.learning_activity_checkpoints c on c.id=r.checkpoint_id
      order by r.attempt_id,r.last_answered_at desc nulls last,c.sequence_no desc
    ),
    event_stats as (
      select ev.attempt_id,
        count(*) filter (where ev.event_type in ('FULLSCREEN_EXIT','UNAUTHORIZED_LEAVE'))::integer as restriction_events
      from public.learning_activity_events ev
      group by ev.attempt_id
    ),
    projection_stats as (
      select x.id as attempt_id,
        round(a.grade_min+(a.grade_max-a.grade_min)*(
          coalesce(sum(case when coalesce(r.completed,false)
            then coalesce(r.awarded_points,0)
            else public.learning_activity_stage_credit(c.points,coalesce(r.help_count,0),coalesce(r.wrong_attempts,0)) end),0)
          / greatest(a.max_points,1)
        ),2) as projected_grade
      from public.learning_activity_attempts x
      join public.learning_activities a on a.id=x.activity_id
      join public.learning_activity_checkpoints c on c.activity_id=x.activity_id
      left join public.learning_activity_responses r on r.attempt_id=x.id and r.checkpoint_id=c.id
      group by x.id,a.grade_min,a.grade_max,a.max_points
    )
    select jsonb_build_object(
      'generated_at',clock_timestamp(),
      'activity',(select jsonb_build_object('slug',a.slug,'title',a.title,'status',a.status)
                  from public.learning_activities a
                  where a.slug='statistics11-colab-class1-basics-types-arrays-2026' limit 1),
      'sessions',(
        select coalesce(jsonb_agg(jsonb_build_object(
          'attempt_id',x.id,
          'group_code',x.group_code,
          'status',x.status,
          'team_size',coalesce(x.team_size,ms.member_count,1),
          'registration_mode',coalesce(x.registration_mode,'individual'),
          'participants',coalesce(ms.participants,'[]'::jsonb),
          'grade',x.grade,
          'projected_grade',coalesce(ps.projected_grade,x.grade),
          'help_tokens_used',coalesce(x.help_tokens_used,0),
          'completed_count',coalesce(rs.completed_count,0),
          'checkpoint_count',coalesce(cs.checkpoint_count,0),
          'wrong_attempts',coalesce(rs.wrong_attempts,0),
          'revealed_count',coalesce(rs.revealed_count,0),
          'skipped_count',coalesce(rs.skipped_count,0),
          'restriction_events',coalesce(es.restriction_events,0),
          'latest_checkpoint_key',lr.checkpoint_key,
          'latest_answer',lr.latest_answer,
          'latest_expected_answer',lr.expected_text,
          'latest_answer_correct',lr.correct,
          'latest_answered_at',lr.last_answered_at,
          'responses',coalesce(rs.responses,'[]'::jsonb),
          'started_at',x.started_at,
          'last_activity_at',x.last_activity_at,
          'submitted_at',x.submitted_at
        ) order by x.last_activity_at desc),'[]'::jsonb)
        from public.learning_activity_attempts x
        join public.learning_activities a on a.id=x.activity_id
        left join checkpoint_stats cs on cs.activity_id=x.activity_id
        left join member_stats ms on ms.attempt_id=x.id
        left join response_stats rs on rs.attempt_id=x.id
        left join latest_response lr on lr.attempt_id=x.id
        left join event_stats es on es.attempt_id=x.id
        left join projection_stats ps on ps.attempt_id=x.id
        where a.slug='statistics11-colab-class1-basics-types-arrays-2026'
      )
    )
  );
end;
$function$;

create or replace function public.teacher_learning_activity_detail_v10(
  p_teacher_token text,
  p_attempt_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v_teacher_session uuid;
  v_attempt public.learning_activity_attempts%rowtype;
begin
  v_teacher_session:=public.teacher_code_session_id(p_teacher_token);
  if v_teacher_session is null then raise exception 'Invalid or expired teacher session'; end if;

  select x.* into v_attempt
  from public.learning_activity_attempts x
  join public.learning_activities a on a.id=x.activity_id
  where x.id=p_attempt_id and a.slug='statistics11-colab-class1-basics-types-arrays-2026';
  if v_attempt.id is null then raise exception 'Registration not found'; end if;

  return jsonb_build_object(
    'attempt',jsonb_build_object(
      'attempt_id',v_attempt.id,
      'group_code',v_attempt.group_code,
      'status',v_attempt.status,
      'team_size',v_attempt.team_size,
      'registration_mode',v_attempt.registration_mode,
      'points',v_attempt.points,
      'grade',v_attempt.grade,
      'started_at',v_attempt.started_at,
      'last_activity_at',v_attempt.last_activity_at,
      'submitted_at',v_attempt.submitted_at,
      'session_id',v_attempt.session_id,
      'user_agent',v_attempt.user_agent,
      'help_tokens_used',v_attempt.help_tokens_used
    ),
    'participants',(
      select coalesce(jsonb_agg(jsonb_build_object(
        'member_order',m.member_order,
        'display_name',m.display_name,
        'institutional_email',m.institutional_email,
        'is_roster_match',m.is_roster_match,
        'student_registry_id',m.student_registry_id
      ) order by m.member_order),'[]'::jsonb)
      from public.learning_activity_attempt_members m where m.attempt_id=v_attempt.id
    ),
    'responses',(
      select coalesce(jsonb_agg(jsonb_build_object(
        'sequence',c.sequence_no,
        'checkpoint_key',c.checkpoint_key,
        'title',c.title,
        'prompt',c.prompt,
        'answer_type',c.answer_type,
        'expected_answer',c.expected_text,
        'latest_answer',r.latest_answer,
        'correct',coalesce(r.correct,false),
        'completed',coalesce(r.completed,false),
        'completion_mode',coalesce(r.completion_mode,'pending'),
        'try_count',coalesce(r.try_count,0),
        'wrong_attempts',coalesce(r.wrong_attempts,0),
        'help_count',coalesce(r.help_count,0),
        'solution_revealed',coalesce(r.solution_revealed,false),
        'awarded_points',coalesce(r.awarded_points,0),
        'first_answered_at',r.first_answered_at,
        'last_answered_at',r.last_answered_at
      ) order by c.sequence_no),'[]'::jsonb)
      from public.learning_activity_checkpoints c
      left join public.learning_activity_responses r on r.checkpoint_id=c.id and r.attempt_id=v_attempt.id
      where c.activity_id=v_attempt.activity_id
    ),
    'events',(
      select coalesce(jsonb_agg(jsonb_build_object(
        'event_type',e.event_type,
        'metadata',e.metadata,
        'created_at',e.created_at
      ) order by e.created_at desc),'[]'::jsonb)
      from (select * from public.learning_activity_events where attempt_id=v_attempt.id order by created_at desc limit 100) e
    )
  );
end;
$function$;

create or replace function public.teacher_learning_activity_update_registration_v10(
  p_teacher_token text,
  p_attempt_id uuid,
  p_group_code text,
  p_student_emails jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v_teacher_session uuid;
  v_attempt public.learning_activity_attempts%rowtype;
  v_student public.student_registry%rowtype;
  v_before jsonb;
  v_after jsonb;
  v_group text;
  v_size integer;
  v_i integer;
  v_email text;
  v_display text;
  v_registry_count integer;
  v_team_key text;
  v_team_label text;
  v_emails text[]:=array[]::text[];
  v_names text[]:=array[]::text[];
  v_all_roster boolean:=true;
begin
  v_teacher_session:=public.teacher_code_session_id(p_teacher_token);
  if v_teacher_session is null then raise exception 'Invalid or expired teacher session'; end if;

  select x.* into v_attempt
  from public.learning_activity_attempts x
  join public.learning_activities a on a.id=x.activity_id
  where x.id=p_attempt_id and a.slug='statistics11-colab-class1-basics-types-arrays-2026'
  for update;
  if v_attempt.id is null then raise exception 'Registration not found'; end if;

  v_group:=upper(trim(coalesce(p_group_code,'')));
  if v_group not in ('11A','11B','11C') then raise exception 'Select a valid group'; end if;
  if p_student_emails is null or jsonb_typeof(p_student_emails)<>'array' then raise exception 'Provide institutional emails'; end if;
  v_size:=jsonb_array_length(p_student_emails);
  if v_size not in (2,3) then raise exception 'A registration must contain 2 or 3 students'; end if;

  for v_i in 0..v_size-1 loop
    v_email:=lower(trim(coalesce(p_student_emails->>v_i,'')));
    if length(v_email)<12 or v_email~'\s' or array_length(string_to_array(v_email,'@'),1)<>2
       or split_part(v_email,'@',1)='' or split_part(v_email,'@',2)<>'ijr.edu.co' then
      raise exception 'Use valid @ijr.edu.co institutional emails';
    end if;
    if v_email=any(v_emails) then raise exception 'Do not repeat an email inside the same registration'; end if;
    v_emails:=array_append(v_emails,v_email);
  end loop;

  v_before:=public.teacher_learning_activity_detail_v10(p_teacher_token,p_attempt_id);
  select string_agg(e,'|' order by e) into v_team_key from unnest(v_emails) e;

  for v_i in 1..v_size loop
    v_email:=v_emails[v_i];
    v_student.id:=null;
    select count(distinct t.student_registry_id) into v_registry_count
    from public.attempts t
    where t.student_registry_id is not null
      and lower(trim(coalesce(t.student_email_normalized,t.student_email,'')))=v_email
      and t.group_code=v_group;
    if v_registry_count=1 then
      select s.* into v_student
      from public.student_registry s
      where s.id=(
        select t.student_registry_id from public.attempts t
        where t.student_registry_id is not null
          and lower(trim(coalesce(t.student_email_normalized,t.student_email,'')))=v_email
          and t.group_code=v_group
        order by t.started_at desc limit 1
      ) and s.active=true limit 1;
    end if;
    if v_student.id is not null then v_display:=v_student.display_name;
    else v_display:=v_email; v_all_roster:=false; end if;
    v_names:=array_append(v_names,v_display);
  end loop;

  select string_agg(n,' · ' order by ord) into v_team_label
  from unnest(v_names) with ordinality as t(n,ord);

  delete from public.learning_activity_attempt_members where attempt_id=v_attempt.id;

  for v_i in 1..v_size loop
    v_email:=v_emails[v_i];
    v_display:=v_names[v_i];
    v_student.id:=null;
    select count(distinct t.student_registry_id) into v_registry_count
    from public.attempts t
    where t.student_registry_id is not null
      and lower(trim(coalesce(t.student_email_normalized,t.student_email,'')))=v_email
      and t.group_code=v_group;
    if v_registry_count=1 then
      select s.* into v_student
      from public.student_registry s
      where s.id=(
        select t.student_registry_id from public.attempts t
        where t.student_registry_id is not null
          and lower(trim(coalesce(t.student_email_normalized,t.student_email,'')))=v_email
          and t.group_code=v_group
        order by t.started_at desc limit 1
      ) and s.active=true limit 1;
    end if;

    insert into public.learning_activity_attempt_members(
      attempt_id,activity_id,group_code,member_order,student_registry_id,
      display_name,normalized_name,is_roster_match,institutional_email,email_normalized
    ) values(
      v_attempt.id,v_attempt.activity_id,v_group,v_i,
      case when v_student.id is not null then v_student.id else null end,
      v_display,public.normalize_student_name(v_display),v_student.id is not null,v_email,v_email
    );
  end loop;

  update public.learning_activity_attempts
  set group_code=v_group,
      student_name_snapshot=v_team_label,
      student_name_normalized=v_team_key,
      team_key=v_team_key,
      team_size=v_size,
      registration_mode='team_email',
      is_roster_match=v_all_roster,
      last_activity_at=clock_timestamp()
  where id=v_attempt.id;

  v_after:=public.teacher_learning_activity_detail_v10(p_teacher_token,p_attempt_id);
  insert into public.learning_activity_teacher_audit(teacher_session_id,attempt_id,action,before_data,after_data)
  values(v_teacher_session,p_attempt_id,'update_registration',v_before,v_after);

  return v_after;
end;
$function$;

create or replace function public.teacher_learning_activity_delete_v10(
  p_teacher_token text,
  p_attempt_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v_teacher_session uuid;
  v_attempt_id uuid;
  v_before jsonb;
begin
  v_teacher_session:=public.teacher_code_session_id(p_teacher_token);
  if v_teacher_session is null then raise exception 'Invalid or expired teacher session'; end if;

  select x.id into v_attempt_id
  from public.learning_activity_attempts x
  join public.learning_activities a on a.id=x.activity_id
  where x.id=p_attempt_id and a.slug='statistics11-colab-class1-basics-types-arrays-2026';
  if v_attempt_id is null then raise exception 'Registration not found'; end if;

  v_before:=public.teacher_learning_activity_detail_v10(p_teacher_token,p_attempt_id);
  delete from public.learning_activity_attempts where id=p_attempt_id;

  insert into public.learning_activity_teacher_audit(teacher_session_id,attempt_id,action,before_data,after_data)
  values(v_teacher_session,p_attempt_id,'delete_registration',v_before,jsonb_build_object('deleted',true));

  return jsonb_build_object('deleted',true,'attempt_id',p_attempt_id);
end;
$function$;

grant execute on function public.teacher_learning_activity_dashboard_v10(text) to anon,authenticated,service_role;
grant execute on function public.teacher_learning_activity_detail_v10(text,uuid) to anon,authenticated,service_role;
grant execute on function public.teacher_learning_activity_update_registration_v10(text,uuid,text,jsonb) to anon,authenticated,service_role;
grant execute on function public.teacher_learning_activity_delete_v10(text,uuid) to anon,authenticated,service_role;
