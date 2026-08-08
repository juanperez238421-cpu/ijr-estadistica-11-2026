begin;

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Teacher access by short classroom code.
-- The plain code is never shipped to the browser. The repository
-- stores only its SHA-256 digest. Because a 4-digit code is still
-- low entropy, access is rate-limited and sessions are short-lived.
-- ------------------------------------------------------------

create table if not exists public.teacher_code_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  active boolean not null default true
);

create table if not exists public.teacher_code_login_attempts (
  id bigint generated always as identity primary key,
  attempted_at timestamptz not null default now(),
  ip_hash text,
  success boolean not null
);

create table if not exists public.teacher_code_audit (
  id bigint generated always as identity primary key,
  teacher_session_id uuid references public.teacher_code_sessions(id) on delete set null,
  action_type text not null,
  assessment_id uuid references public.assessments(id) on delete set null,
  attempt_id uuid references public.attempts(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_report_settings (
  assessment_id uuid primary key references public.assessments(id) on delete cascade,
  recipient_email text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessment_email_outbox (
  id bigint generated always as identity primary key,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  recipient_email text not null,
  subject text not null,
  payload jsonb not null,
  status text not null default 'pending' check(status in ('pending','sent','failed','cancelled')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  error_message text,
  unique(attempt_id,recipient_email)
);

alter table public.teacher_code_sessions enable row level security;
alter table public.teacher_code_login_attempts enable row level security;
alter table public.teacher_code_audit enable row level security;
alter table public.assessment_report_settings enable row level security;
alter table public.assessment_email_outbox enable row level security;

-- No direct browser table access. All teacher-code access goes through
-- SECURITY DEFINER RPCs after validating the short-lived teacher token.
revoke all on public.teacher_code_sessions from anon,authenticated;
revoke all on public.teacher_code_login_attempts from anon,authenticated;
revoke all on public.teacher_code_audit from anon,authenticated;
revoke all on public.assessment_report_settings from anon,authenticated;
revoke all on public.assessment_email_outbox from anon,authenticated;

insert into public.assessment_report_settings(assessment_id,recipient_email,enabled)
select id,'juanperez238421@gmail.com',true
from public.assessments
where slug='statistics11-counting-permutations-2026'
on conflict(assessment_id) do update set
  recipient_email=excluded.recipient_email,
  enabled=true,
  updated_at=now();

create or replace function public.request_ip_hash()
returns text
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_headers jsonb;
  v_ip text;
begin
  begin
    v_headers := nullif(current_setting('request.headers',true),'')::jsonb;
  exception when others then
    v_headers := '{}'::jsonb;
  end;
  v_ip := split_part(coalesce(v_headers->>'x-forwarded-for',v_headers->>'cf-connecting-ip','unknown'),',',1);
  return encode(digest('ijr-stat11-teacher|' || trim(v_ip),'sha256'),'hex');
end;
$$;

create or replace function public.teacher_code_session_id(p_token text)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_id uuid;
begin
  if coalesce(length(p_token),0) < 40 then return null; end if;
  select id into v_id
  from public.teacher_code_sessions
  where active=true
    and expires_at>clock_timestamp()
    and token_hash=encode(digest(p_token,'sha256'),'hex')
  limit 1;
  if v_id is not null then
    update public.teacher_code_sessions set last_seen_at=clock_timestamp() where id=v_id;
  end if;
  return v_id;
end;
$$;

revoke all on function public.teacher_code_session_id(text) from public,anon,authenticated;

create or replace function public.teacher_code_login(p_code text,p_user_agent text default null)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_ip text := public.request_ip_hash();
  v_failures integer;
  v_ok boolean;
  v_token text;
  v_session public.teacher_code_sessions%rowtype;
begin
  select count(*) into v_failures
  from public.teacher_code_login_attempts
  where attempted_at>clock_timestamp()-interval '15 minutes'
    and ip_hash=v_ip
    and success=false;

  if v_failures>=8 then
    raise exception 'Demasiados intentos de acceso docente. Espera 15 minutos.';
  end if;

  -- SHA-256("9109") = d8c4d37261d7aaa4bbafe4ccfe334e09fbe181c84de22e9a561dfe02b0958aa0
  -- Only the digest is stored here; the browser never receives the code.
  v_ok := encode(digest(coalesce(p_code,''),'sha256'),'hex') =
          'd8c4d37261d7aaa4bbafe4ccfe334e09fbe181c84de22e9a561dfe02b0958aa0';

  insert into public.teacher_code_login_attempts(ip_hash,success) values(v_ip,v_ok);

  if not v_ok then
    raise exception 'Código docente incorrecto';
  end if;

  v_token := encode(gen_random_bytes(32),'hex');
  insert into public.teacher_code_sessions(token_hash,expires_at,ip_hash,user_agent)
  values(
    encode(digest(v_token,'sha256'),'hex'),
    clock_timestamp()+interval '4 hours',
    v_ip,
    left(coalesce(p_user_agent,''),1000)
  )
  returning * into v_session;

  return jsonb_build_object(
    'teacher_token',v_token,
    'expires_at',v_session.expires_at,
    'report_email','juanperez238421@gmail.com'
  );
end;
$$;

create or replace function public.teacher_code_logout(p_teacher_token text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare v_id uuid;
begin
  v_id := public.teacher_code_session_id(p_teacher_token);
  if v_id is null then return jsonb_build_object('ok',true); end if;
  update public.teacher_code_sessions set active=false where id=v_id;
  return jsonb_build_object('ok',true);
end;
$$;

create or replace function public.teacher_dashboard_snapshot(p_teacher_token text,p_assessment_slug text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_sid uuid;
  v_a public.assessments%rowtype;
  v_roster jsonb;
  v_sources jsonb;
  v_attempts jsonb;
  v_metrics jsonb;
  v_email text;
  v_pending integer;
begin
  v_sid := public.teacher_code_session_id(p_teacher_token);
  if v_sid is null then raise exception 'Sesión docente inválida o expirada'; end if;

  select * into v_a from public.assessments where slug=p_assessment_slug;
  if not found then raise exception 'Evaluación no encontrada'; end if;

  select recipient_email into v_email
  from public.assessment_report_settings
  where assessment_id=v_a.id and enabled=true;

  select count(*) into v_pending
  from public.assessment_email_outbox
  where assessment_id=v_a.id and status='pending';

  select coalesce(jsonb_agg(x order by x->>'group_code',(x->>'source_position')::int),'[]'::jsonb)
  into v_roster
  from (
    select jsonb_build_object(
      'id',s.id,
      'internal_key',s.internal_key,
      'group_code',s.group_code,
      'source_position',s.source_position,
      'display_name',s.display_name,
      'name_is_truncated',s.name_is_truncated,
      'definitiva_por_area',r.definitiva_por_area,
      'acumulado_asig_ano',r.acumulado_asig_ano,
      'source_key',src.source_key,
      'source_date',src.source_date
    ) x
    from public.student_registry s
    left join lateral (
      select ar.* from public.academic_records ar
      where ar.student_registry_id=s.id
      order by ar.created_at desc limit 1
    ) r on true
    left join public.academic_sources src on src.id=r.source_id
    where s.active=true
  ) q;

  select coalesce(jsonb_agg(jsonb_build_object(
    'source_key',source_key,'source_system',source_system,'source_kind',source_kind,
    'title',title,'source_date',source_date,'captured_at',captured_at
  ) order by source_date desc nulls last,captured_at desc),'[]'::jsonb)
  into v_sources
  from public.academic_sources;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',a.id,
    'student_id',a.student_id,
    'student_name',coalesce(a.student_name_snapshot,a.student_name_entered,a.student_id),
    'student_name_entered',a.student_name_entered,
    'identity_match_mode',a.identity_match_mode,
    'identity_match_score',a.identity_match_score,
    'group_code',a.group_code,
    'status',a.status,
    'started_at',a.started_at,
    'last_activity_at',a.last_activity_at,
    'submitted_at',a.submitted_at,
    'answered_count',a.answered_count,
    'raw_points',a.raw_points,
    'grade',a.grade,
    'correct_count',a.correct_count,
    'incorrect_count',a.incorrect_count,
    'integrity_strikes',a.integrity_strikes,
    'finish_reason',a.finish_reason
  ) order by a.started_at desc),'[]'::jsonb)
  into v_attempts
  from public.attempts a
  where a.assessment_id=v_a.id;

  select jsonb_build_object(
    'roster_total',(select count(*) from public.student_registry where active=true),
    'roster_11a',(select count(*) from public.student_registry where active=true and group_code='11A'),
    'roster_11b',(select count(*) from public.student_registry where active=true and group_code='11B'),
    'roster_11c',(select count(*) from public.student_registry where active=true and group_code='11C'),
    'attempts_total',(select count(*) from public.attempts where assessment_id=v_a.id),
    'active',(select count(*) from public.attempts where assessment_id=v_a.id and status='active'),
    'submitted',(select count(*) from public.attempts where assessment_id=v_a.id and status in ('submitted','force_submitted')),
    'invalidated',(select count(*) from public.attempts where assessment_id=v_a.id and status like '%invalidated%'),
    'pending_email_reports',v_pending
  ) into v_metrics;

  return jsonb_build_object(
    'assessment',jsonb_build_object(
      'id',v_a.id,'slug',v_a.slug,'title',v_a.title,'status',v_a.status,
      'duration_minutes',v_a.duration_minutes,'questions_per_student',v_a.questions_per_student,
      'max_raw_points',v_a.max_raw_points,'passing_grade',v_a.passing_grade,
      'release_solutions',v_a.release_solutions
    ),
    'metrics',v_metrics,
    'roster',v_roster,
    'sources',v_sources,
    'attempts',v_attempts,
    'report_email',v_email
  );
end;
$$;

create or replace function public.teacher_attempt_detail(p_teacher_token text,p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_sid uuid;
  v_attempt public.attempts%rowtype;
  v_responses jsonb;
  v_events jsonb;
begin
  v_sid := public.teacher_code_session_id(p_teacher_token);
  if v_sid is null then raise exception 'Sesión docente inválida o expirada'; end if;

  select * into v_attempt from public.attempts where id=p_attempt_id;
  if not found then raise exception 'Intento no encontrado'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'question_order',r.question_order,
    'question_id',r.question_id,
    'prompt',q.prompt_es,
    'selected_option',r.selected_option,
    'is_correct',r.is_correct,
    'correct_answer',q.correct_answer,
    'displayed_option_order',r.displayed_option_order,
    'first_viewed_at',r.first_viewed_at,
    'first_selected_at',r.first_selected_at,
    'submitted_at',r.submitted_at,
    'response_time_ms',r.response_time_ms,
    'selection_changes',r.selection_changes
  ) order by r.question_order),'[]'::jsonb)
  into v_responses
  from public.responses r
  join public.questions_private q on q.id=r.question_id
  where r.attempt_id=p_attempt_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'event_sequence',e.event_sequence,'event_type',e.event_type,
    'server_timestamp',e.server_timestamp,'client_timestamp',e.client_timestamp,
    'question_id',e.question_id,'visibility_state',e.visibility_state,
    'fullscreen_state',e.fullscreen_state,'metadata',e.metadata
  ) order by e.event_sequence),'[]'::jsonb)
  into v_events
  from public.attempt_events e where e.attempt_id=p_attempt_id;

  return jsonb_build_object(
    'attempt',to_jsonb(v_attempt)-'access_token_hash'-'ip_hash',
    'responses',v_responses,
    'events',v_events
  );
end;
$$;

create or replace function public.teacher_code_action(
  p_teacher_token text,
  p_assessment_slug text,
  p_action text,
  p_attempt_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_sid uuid;
  v_a public.assessments%rowtype;
  v_attempt public.attempts%rowtype;
  v_answered integer;
  v_correct integer;
  v_raw numeric(6,2);
  v_grade numeric(4,2);
begin
  v_sid := public.teacher_code_session_id(p_teacher_token);
  if v_sid is null then raise exception 'Sesión docente inválida o expirada'; end if;
  select * into v_a from public.assessments where slug=p_assessment_slug for update;
  if not found then raise exception 'Evaluación no encontrada'; end if;

  case upper(p_action)
    when 'OPEN_ASSESSMENT' then update public.assessments set status='open' where id=v_a.id;
    when 'PAUSE_ASSESSMENT' then update public.assessments set status='paused' where id=v_a.id;
    when 'CLOSE_ASSESSMENT' then update public.assessments set status='closed' where id=v_a.id;
    when 'RELEASE_SOLUTIONS' then update public.assessments set status='released',release_solutions=true where id=v_a.id;
    when 'PAUSE_STUDENT' then update public.attempts set status='paused',last_activity_at=now() where id=p_attempt_id and assessment_id=v_a.id;
    when 'RESUME_STUDENT' then update public.attempts set status='active',last_activity_at=now() where id=p_attempt_id and assessment_id=v_a.id;
    when 'INVALIDATE_ATTEMPT' then update public.attempts set status='invalidated',finish_reason='teacher_invalidated',submitted_at=coalesce(submitted_at,now()),last_activity_at=now() where id=p_attempt_id and assessment_id=v_a.id;
    when 'REOPEN_ATTEMPT' then update public.attempts set status='active',submitted_at=null,finish_reason='teacher_reopened',last_activity_at=now() where id=p_attempt_id and assessment_id=v_a.id;
    when 'FORCE_SUBMIT' then
      select * into v_attempt from public.attempts where id=p_attempt_id and assessment_id=v_a.id for update;
      if not found then raise exception 'Intento no encontrado'; end if;
      select count(*),count(*) filter(where is_correct=true) into v_answered,v_correct from public.responses where attempt_id=p_attempt_id;
      v_raw := round((v_a.max_raw_points*v_correct/v_a.questions_per_student)::numeric,2);
      v_grade := round((v_a.grade_min+(v_a.grade_max-v_a.grade_min)*v_correct/v_a.questions_per_student)::numeric,2);
      update public.attempts set status='force_submitted',submitted_at=coalesce(submitted_at,now()),raw_points=v_raw,grade=v_grade,correct_count=v_correct,incorrect_count=v_answered-v_correct,answered_count=v_answered,finish_reason='teacher_force_submit',last_activity_at=now() where id=p_attempt_id;
    else raise exception 'Acción docente no válida';
  end case;

  insert into public.teacher_code_audit(teacher_session_id,action_type,assessment_id,attempt_id)
  values(v_sid,upper(p_action),v_a.id,p_attempt_id);
  return jsonb_build_object('ok',true,'action',upper(p_action));
end;
$$;

create or replace function public.teacher_start_smoke_test(
  p_teacher_token text,
  p_assessment_slug text,
  p_group_code text,
  p_session_id uuid,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_sid uuid;
  v_a public.assessments%rowtype;
  v_key text;
  v_token text;
  v_attempt public.attempts%rowtype;
  v_question jsonb;
begin
  v_sid := public.teacher_code_session_id(p_teacher_token);
  if v_sid is null then raise exception 'Sesión docente inválida o expirada'; end if;
  if p_group_code not in ('11A','11B','11C') then raise exception 'Grupo no válido'; end if;
  select * into v_a from public.assessments where slug=p_assessment_slug;
  if not found then raise exception 'Evaluación no encontrada'; end if;

  v_key := 'TEST-TEACHER-' || p_group_code;
  perform pg_advisory_xact_lock(hashtext(v_a.id::text || '|' || v_key));

  -- Smoke tests are disposable. Remove the previous test for this group so
  -- its 18 questions return to the globally-disjoint production pool.
  delete from public.attempts where assessment_id=v_a.id and student_id=v_key;
  delete from public.assignments where assessment_id=v_a.id and student_id=v_key;

  perform public.allocate_assessment_questions(v_a.id,v_key);
  v_token := encode(gen_random_bytes(32),'hex');

  insert into public.attempts(
    assessment_id,auth_user_id,student_registry_id,student_id,
    student_name_snapshot,student_name_entered,identity_match_mode,identity_match_score,
    group_code,session_id,status,expires_at,access_token_hash,user_agent,last_activity_at
  ) values(
    v_a.id,null,null,v_key,
    'DOCENTE · TEST '||p_group_code,'DOCENTE · TEST','teacher_code_test',1,
    p_group_code,p_session_id,'active',clock_timestamp()+make_interval(mins=>v_a.duration_minutes),
    encode(digest(v_token,'sha256'),'hex'),left(coalesce(p_user_agent,''),1000),clock_timestamp()
  ) returning * into v_attempt;

  v_question := public.assessment_public_question(v_a.id,v_key,1);
  insert into public.teacher_code_audit(teacher_session_id,action_type,assessment_id,attempt_id,metadata)
  values(v_sid,'START_SMOKE_TEST',v_a.id,v_attempt.id,jsonb_build_object('group_code',p_group_code));

  return jsonb_build_object(
    'attempt_id',v_attempt.id,'attempt_token',v_token,'expires_at',v_attempt.expires_at,
    'integrity_strikes',0,'student_label',v_attempt.student_name_snapshot,
    'group_code',p_group_code,'test_mode',true,'question',v_question
  );
end;
$$;

-- Queue a report whenever an official attempt reaches a terminal state.
create or replace function public.queue_assessment_email_report()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare v_email text;
begin
  if new.status not in ('submitted','force_submitted','auto_invalidated','invalidated') then return new; end if;
  if old.status is not distinct from new.status and old.submitted_at is not distinct from new.submitted_at then return new; end if;
  if new.student_id like 'TEST-%' then return new; end if;
  select recipient_email into v_email from public.assessment_report_settings where assessment_id=new.assessment_id and enabled=true;
  if v_email is null then return new; end if;
  insert into public.assessment_email_outbox(assessment_id,attempt_id,recipient_email,subject,payload)
  values(
    new.assessment_id,new.id,v_email,
    'Statistics 11 · Resultado '||coalesce(new.student_name_snapshot,new.student_id),
    jsonb_build_object(
      'student',coalesce(new.student_name_snapshot,new.student_name_entered,new.student_id),
      'group',new.group_code,'status',new.status,'started_at',new.started_at,
      'submitted_at',new.submitted_at,'answered_count',new.answered_count,
      'correct_count',new.correct_count,'incorrect_count',new.incorrect_count,
      'raw_points',new.raw_points,'grade',new.grade,'integrity_strikes',new.integrity_strikes
    )
  ) on conflict(attempt_id,recipient_email) do update set
    subject=excluded.subject,payload=excluded.payload,status='pending',error_message=null;
  return new;
end;
$$;

drop trigger if exists trg_queue_assessment_email_report on public.attempts;
create trigger trg_queue_assessment_email_report
after insert or update of status,submitted_at,raw_points,grade on public.attempts
for each row execute function public.queue_assessment_email_report();

revoke all on function public.teacher_code_login(text,text) from public;
revoke all on function public.teacher_code_logout(text) from public;
revoke all on function public.teacher_dashboard_snapshot(text,text) from public;
revoke all on function public.teacher_attempt_detail(text,uuid) from public;
revoke all on function public.teacher_code_action(text,text,text,uuid) from public;
revoke all on function public.teacher_start_smoke_test(text,text,text,uuid,text) from public;

grant execute on function public.teacher_code_login(text,text) to anon,authenticated;
grant execute on function public.teacher_code_logout(text) to anon,authenticated;
grant execute on function public.teacher_dashboard_snapshot(text,text) to anon,authenticated;
grant execute on function public.teacher_attempt_detail(text,uuid) to anon,authenticated;
grant execute on function public.teacher_code_action(text,text,text,uuid) to anon,authenticated;
grant execute on function public.teacher_start_smoke_test(text,text,text,uuid,text) to anon,authenticated;

commit;
