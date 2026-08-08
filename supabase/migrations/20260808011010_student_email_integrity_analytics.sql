begin;

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

alter table public.attempts
  add column if not exists student_email text,
  add column if not exists student_email_normalized text;

create index if not exists idx_attempts_email_normalized
  on public.attempts(assessment_id,student_email_normalized)
  where student_email_normalized is not null;

create or replace function public.normalize_student_email(p_value text)
returns text
language sql
immutable
as $$
  select lower(trim(coalesce(p_value,'')));
$$;

revoke all on function public.normalize_student_email(text) from public,anon,authenticated;

-- -----------------------------------------------------------------------------
-- V2 student start RPC.
-- Name remains permissive; email is mandatory for audit/fraud analysis but is
-- not used as a credential and does not need to match a specific school domain.
-- -----------------------------------------------------------------------------
create or replace function public.student_start_attempt_v2(
  p_assessment_slug text,
  p_student_name text,
  p_student_email text,
  p_group_code text,
  p_session_id uuid,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  v_assessment public.assessments%rowtype;
  v_student_id uuid;
  v_student_key text;
  v_student_label text;
  v_input_name text;
  v_email text;
  v_match_mode text;
  v_match_score numeric;
  v_is_test boolean := false;
  v_attempt public.attempts%rowtype;
  v_token text;
  v_now timestamptz := clock_timestamp();
  v_question jsonb;
begin
  if p_group_code not in ('11A','11B','11C') then
    raise exception 'Grupo no válido';
  end if;

  v_email := public.normalize_student_email(p_student_email);
  if length(v_email) > 180
     or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Ingresa un correo estudiantil válido';
  end if;

  v_input_name := public.normalize_student_name(coalesce(p_student_name,''));

  select * into v_assessment
  from public.assessments
  where slug=p_assessment_slug;

  if not found then
    raise exception 'Evaluación no encontrada';
  end if;

  if v_input_name<>'' then
    select true,t.display_label
    into v_is_test,v_student_label
    from public.assessment_test_identities t
    where t.active=true
      and t.assessment_slug=p_assessment_slug
      and t.group_code=p_group_code
      and t.normalized_alias=v_input_name
    limit 1;
  end if;

  v_is_test := coalesce(v_is_test,false);

  if v_is_test then
    if v_assessment.status not in ('draft','scheduled','open','paused') then
      raise exception 'La evaluación está % y no admite pruebas ocultas.',v_assessment.status;
    end if;
    v_student_id := null;
    v_student_key := 'TEST-JDP-' || replace(left(p_session_id::text,13),'-','');
    v_match_mode := 'hidden_test';
    v_match_score := 1.0000;
  else
    if v_assessment.status <> 'open' then
      raise exception 'La evaluación está %',v_assessment.status;
    end if;
    if v_assessment.starts_at is not null and v_now < v_assessment.starts_at then
      raise exception 'La evaluación aún no ha iniciado';
    end if;
    if v_assessment.ends_at is not null and v_now > v_assessment.ends_at then
      raise exception 'La evaluación está cerrada';
    end if;

    select r.student_registry_id,r.internal_key,r.display_name,r.match_mode,r.match_score
    into v_student_id,v_student_key,v_student_label,v_match_mode,v_match_score
    from public.resolve_roster_student(p_group_code,coalesce(p_student_name,'')) r;
  end if;

  perform pg_advisory_xact_lock(hashtext(v_assessment.id::text || '|' || v_student_key));

  if not v_is_test then
    select * into v_attempt
    from public.attempts
    where assessment_id=v_assessment.id
      and student_id=v_student_key
    for update;

    if found then
      if v_attempt.status in ('submitted','force_submitted','auto_invalidated','invalidated') then
        raise exception 'Ya existe un intento cerrado asociado a esta identificación. Solicita revisión docente si necesitas otro intento.';
      else
        raise exception 'Ya existe un intento activo asociado a esta identificación. Solicita al docente reanudarlo.';
      end if;
    end if;
  end if;

  perform public.allocate_assessment_questions(v_assessment.id,v_student_key);
  v_token := encode(extensions.gen_random_bytes(32),'hex');

  insert into public.attempts(
    assessment_id,auth_user_id,student_registry_id,student_id,
    student_name_snapshot,student_name_entered,student_email,student_email_normalized,
    identity_match_mode,identity_match_score,group_code,session_id,status,expires_at,
    access_token_hash,user_agent,last_activity_at
  ) values(
    v_assessment.id,null,v_student_id,v_student_key,
    v_student_label,coalesce(nullif(trim(p_student_name),''),'SIN NOMBRE DECLARADO'),trim(p_student_email),v_email,
    v_match_mode,v_match_score,p_group_code,p_session_id,'active',
    v_now + make_interval(mins=>v_assessment.duration_minutes),
    encode(extensions.digest(v_token,'sha256'),'hex'),left(coalesce(p_user_agent,''),1000),v_now
  ) returning * into v_attempt;

  v_question := public.assessment_public_question(v_assessment.id,v_student_key,1);

  return jsonb_build_object(
    'attempt_id',v_attempt.id,
    'attempt_token',v_token,
    'expires_at',v_attempt.expires_at,
    'integrity_strikes',0,
    'student_label',v_student_label,
    'group_code',p_group_code,
    'identity_match_mode',v_match_mode,
    'identity_match_score',v_match_score,
    'identity_verified',v_student_id is not null,
    'test_mode',v_is_test,
    'question',v_question
  );
end;
$$;

revoke all on function public.student_start_attempt_v2(text,text,text,text,uuid,text) from public;
grant execute on function public.student_start_attempt_v2(text,text,text,text,uuid,text) to anon,authenticated;

-- Resume now returns email/strike data needed by the restored audit UI.
create or replace function public.student_resume_attempt(
  p_attempt_id uuid,
  p_attempt_token text
)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  v_attempt public.attempts%rowtype;
  v_question jsonb;
begin
  select * into v_attempt from public.attempts where id=p_attempt_id;

  if not found
     or v_attempt.access_token_hash is null
     or v_attempt.access_token_hash <> encode(extensions.digest(coalesce(p_attempt_token,''),'sha256'),'hex') then
    raise exception 'Intento no válido';
  end if;

  if v_attempt.status not in ('active','paused') then
    return jsonb_build_object(
      'closed',true,'status',v_attempt.status,'raw_points',v_attempt.raw_points,
      'grade',v_attempt.grade,'answered_count',v_attempt.answered_count,
      'integrity_strikes',v_attempt.integrity_strikes,'student_email',v_attempt.student_email
    );
  end if;

  if clock_timestamp() > v_attempt.expires_at then
    return jsonb_build_object('closed',false,'expired',true,'integrity_strikes',v_attempt.integrity_strikes);
  end if;

  v_question := public.assessment_public_question(v_attempt.assessment_id,v_attempt.student_id,v_attempt.answered_count+1);

  return jsonb_build_object(
    'closed',false,'attempt_id',v_attempt.id,'expires_at',v_attempt.expires_at,
    'integrity_strikes',v_attempt.integrity_strikes,'student_label',v_attempt.student_name_snapshot,
    'student_email',v_attempt.student_email,'group_code',v_attempt.group_code,'question',v_question
  );
end;
$$;

-- Terminal attempts, including auto-invalidated attempts, no longer accept
-- additional audit events. The third INTEGRITY_STRIKE remains server-enforced.
create or replace function public.student_log_event(
  p_attempt_id uuid,
  p_attempt_token text,
  p_question_id text,
  p_event_type text,
  p_client_timestamp timestamptz default null,
  p_visibility_state text default null,
  p_fullscreen_state boolean default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  v_attempt public.attempts%rowtype;
  v_assessment public.assessments%rowtype;
  v_prev_hash text;
  v_sequence bigint;
  v_server_time timestamptz := clock_timestamp();
  v_payload jsonb;
  v_hash text;
  v_strikes integer;
  v_invalidated boolean := false;
begin
  select * into v_attempt from public.attempts where id=p_attempt_id for update;

  if not found
     or v_attempt.access_token_hash is null
     or v_attempt.access_token_hash <> encode(extensions.digest(coalesce(p_attempt_token,''),'sha256'),'hex') then
    raise exception 'Intento no válido';
  end if;

  if v_attempt.status in ('submitted','force_submitted','auto_invalidated','invalidated') then
    return jsonb_build_object('ok',true,'ignored',true,'integrity_strikes',v_attempt.integrity_strikes,'invalidated',v_attempt.status like '%invalidated%');
  end if;

  select * into v_assessment from public.assessments where id=v_attempt.assessment_id;

  select event_hash,event_sequence into v_prev_hash,v_sequence
  from public.attempt_events where attempt_id=p_attempt_id
  order by event_sequence desc limit 1;

  v_sequence := coalesce(v_sequence,0)+1;
  v_payload := jsonb_build_object(
    'attempt_id',p_attempt_id,'sequence',v_sequence,'event_type',left(coalesce(p_event_type,''),80),
    'client_timestamp',p_client_timestamp,'server_timestamp',v_server_time,'question_id',p_question_id,
    'visibility_state',p_visibility_state,'fullscreen_state',p_fullscreen_state,'metadata',coalesce(p_metadata,'{}'::jsonb)
  );
  v_hash := encode(extensions.digest(coalesce(v_prev_hash,'') || '|' || v_payload::text,'sha256'),'hex');

  insert into public.attempt_events(
    attempt_id,student_id,assessment_id,question_id,event_sequence,event_type,
    client_timestamp,server_timestamp,visibility_state,fullscreen_state,metadata,prev_event_hash,event_hash
  ) values(
    p_attempt_id,v_attempt.student_id,v_attempt.assessment_id,p_question_id,v_sequence,
    left(coalesce(p_event_type,''),80),p_client_timestamp,v_server_time,p_visibility_state,
    p_fullscreen_state,coalesce(p_metadata,'{}'::jsonb),v_prev_hash,v_hash
  );

  v_strikes := v_attempt.integrity_strikes;
  if p_event_type='INTEGRITY_STRIKE' then
    v_strikes := v_strikes+1;
    if v_strikes >= v_assessment.tab_strike_limit then
      v_invalidated := true;
      update public.attempts
      set integrity_strikes=v_strikes,status='auto_invalidated',finish_reason='auto_invalidated_integrity',
          submitted_at=coalesce(submitted_at,v_server_time),last_activity_at=v_server_time
      where id=p_attempt_id;
    else
      update public.attempts set integrity_strikes=v_strikes,last_activity_at=v_server_time where id=p_attempt_id;
    end if;
  else
    update public.attempts set last_activity_at=v_server_time where id=p_attempt_id;
  end if;

  return jsonb_build_object('ok',true,'event_sequence',v_sequence,'integrity_strikes',v_strikes,'invalidated',v_invalidated);
end;
$$;

-- -----------------------------------------------------------------------------
-- Teacher snapshot with attempt-level performance and integrity analytics.
-- -----------------------------------------------------------------------------
create or replace function public.teacher_dashboard_snapshot(p_teacher_token text,p_assessment_slug text)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
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
      'id',s.id,'internal_key',s.internal_key,'group_code',s.group_code,'source_position',s.source_position,
      'display_name',s.display_name,'name_is_truncated',s.name_is_truncated,
      'definitiva_por_area',r.definitiva_por_area,'acumulado_asig_ano',r.acumulado_asig_ano,
      'source_key',src.source_key,'source_date',src.source_date
    ) x
    from public.student_registry s
    left join lateral (
      select ar.* from public.academic_records ar
      where ar.student_registry_id=s.id order by ar.created_at desc limit 1
    ) r on true
    left join public.academic_sources src on src.id=r.source_id
    where s.active=true
  ) q;

  select coalesce(jsonb_agg(jsonb_build_object(
    'source_key',source_key,'source_system',source_system,'source_kind',source_kind,
    'title',title,'source_date',source_date,'captured_at',captured_at
  ) order by source_date desc nulls last,captured_at desc),'[]'::jsonb)
  into v_sources from public.academic_sources;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',a.id,
    'student_id',a.student_id,
    'student_name',coalesce(a.student_name_snapshot,a.student_name_entered,a.student_id),
    'student_name_entered',a.student_name_entered,
    'student_email',a.student_email,
    'identity_match_mode',a.identity_match_mode,
    'identity_match_score',a.identity_match_score,
    'group_code',a.group_code,
    'status',a.status,
    'started_at',a.started_at,
    'expires_at',a.expires_at,
    'last_activity_at',a.last_activity_at,
    'submitted_at',a.submitted_at,
    'answered_count',a.answered_count,
    'raw_points',a.raw_points,
    'grade',a.grade,
    'correct_count',a.correct_count,
    'incorrect_count',a.incorrect_count,
    'integrity_strikes',a.integrity_strikes,
    'finish_reason',a.finish_reason,
    'duration_seconds',greatest(0,floor(extract(epoch from (coalesce(a.submitted_at,a.last_activity_at,clock_timestamp())-a.started_at))))::integer,
    'avg_response_ms',rs.avg_response_ms,
    'selection_changes',rs.selection_changes,
    'tab_switches',ev.tab_switches,
    'fullscreen_exits',ev.fullscreen_exits,
    'screenshot_attempts',ev.screenshot_attempts,
    'clipboard_attempts',ev.clipboard_attempts,
    'duplicate_tab_events',ev.duplicate_tab_events,
    'window_blurs',ev.window_blurs,
    'hidden_ms',ev.hidden_ms,
    'email_reuse_count',em.email_reuse_count,
    'integrity_risk',case
      when a.status like '%invalidated%' then 'BLOCKED'
      when a.integrity_strikes>=2 or ev.screenshot_attempts>0 or ev.duplicate_tab_events>0 or em.email_reuse_count>1 then 'REVIEW'
      when a.integrity_strikes=1 or ev.fullscreen_exits>0 or ev.clipboard_attempts>0 then 'ATTENTION'
      else 'OK'
    end
  ) order by a.started_at desc),'[]'::jsonb)
  into v_attempts
  from public.attempts a
  left join lateral (
    select
      coalesce(round(avg(r.response_time_ms)::numeric,0),0)::integer as avg_response_ms,
      coalesce(sum(r.selection_changes),0)::integer as selection_changes
    from public.responses r where r.attempt_id=a.id
  ) rs on true
  left join lateral (
    select
      count(*) filter(where e.event_type='INTEGRITY_STRIKE' and e.metadata->>'source' like '%pestaña%')::integer as tab_switches,
      count(*) filter(where e.event_type='FULLSCREEN_EXIT')::integer as fullscreen_exits,
      count(*) filter(where e.event_type='SCREENSHOT_KEY_ATTEMPT')::integer as screenshot_attempts,
      count(*) filter(where e.event_type in ('COPY_ATTEMPT','CUT_ATTEMPT','PASTE_ATTEMPT'))::integer as clipboard_attempts,
      count(*) filter(where e.event_type='SECOND_TAB_DETECTED')::integer as duplicate_tab_events,
      count(*) filter(where e.event_type='WINDOW_BLUR')::integer as window_blurs,
      coalesce(sum(case
        when e.event_type='VISIBILITY_VISIBLE' and coalesce(e.metadata->>'hidden_duration_ms','') ~ '^[0-9]+$'
        then (e.metadata->>'hidden_duration_ms')::bigint else 0 end),0)::bigint as hidden_ms
    from public.attempt_events e where e.attempt_id=a.id
  ) ev on true
  left join lateral (
    select case when a.student_email_normalized is null then 0 else count(*)::integer end as email_reuse_count
    from public.attempts a2
    where a.student_email_normalized is not null
      and a2.assessment_id=a.assessment_id
      and a2.student_email_normalized=a.student_email_normalized
      and a2.student_id not like 'TEST-%'
  ) em on true
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
    'average_grade',(select round(avg(grade)::numeric,2) from public.attempts where assessment_id=v_a.id and grade is not null),
    'email_reuse_flags',(select count(*) from (
      select student_email_normalized from public.attempts
      where assessment_id=v_a.id and student_email_normalized is not null and student_id not like 'TEST-%'
      group by student_email_normalized having count(distinct student_id)>1
    ) d),
    'pending_email_reports',v_pending
  ) into v_metrics;

  return jsonb_build_object(
    'assessment',jsonb_build_object(
      'id',v_a.id,'slug',v_a.slug,'title',v_a.title,'status',v_a.status,
      'duration_minutes',v_a.duration_minutes,'questions_per_student',v_a.questions_per_student,
      'max_raw_points',v_a.max_raw_points,'passing_grade',v_a.passing_grade,'release_solutions',v_a.release_solutions
    ),
    'metrics',v_metrics,'roster',v_roster,'sources',v_sources,'attempts',v_attempts,'report_email',v_email
  );
end;
$$;

-- Include student email in queued report payloads.
create or replace function public.queue_assessment_email_report()
returns trigger
language plpgsql
security definer
set search_path=public,extensions
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
      'student_email',new.student_email,'group',new.group_code,'status',new.status,
      'started_at',new.started_at,'submitted_at',new.submitted_at,'answered_count',new.answered_count,
      'correct_count',new.correct_count,'incorrect_count',new.incorrect_count,'raw_points',new.raw_points,
      'grade',new.grade,'integrity_strikes',new.integrity_strikes,'finish_reason',new.finish_reason
    )
  ) on conflict(attempt_id,recipient_email) do update set
    subject=excluded.subject,payload=excluded.payload,status='pending',error_message=null;
  return new;
end;
$$;

-- Production health now requires the email-aware start RPC and storage column.
create or replace function public.statistics11_assessment_health()
returns jsonb
language plpgsql
security definer
stable
set search_path=public,extensions
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
  v_email boolean;
  v_crypto boolean := false;
  v_digest text;
  v_runtime jsonb;
begin
  select status into v_status from public.assessments where slug='statistics11-counting-permutations-2026';

  select count(*)::integer,
         count(*) filter(where topic_code='FCP')::integer,
         count(*) filter(where topic_code='P_SIMPLE')::integer,
         count(*) filter(where topic_code='P_DIST')::integer,
         count(*) filter(where topic_code='P_CIRC')::integer
  into v_total,v_fcp,v_simple,v_dist,v_circ
  from public.questions_private where active=true;

  select count(*)::integer into v_roster from public.student_registry where active=true;
  v_start := to_regprocedure('public.student_start_attempt_v2(text,text,text,text,uuid,text)') is not null;
  v_teacher := to_regprocedure('public.teacher_code_login(text,text)') is not null;
  v_email := exists(select 1 from information_schema.columns where table_schema='public' and table_name='attempts' and column_name='student_email');

  begin
    v_digest := encode(extensions.digest('statistics11-health','sha256'),'hex');
    perform extensions.gen_random_bytes(1);
    v_crypto := length(v_digest)=64;
  exception when others then
    v_crypto := false;
  end;

  begin
    v_runtime := public.statistics11_runtime_smoke();
  exception when others then
    v_runtime := jsonb_build_object('ready',false,'error','runtime smoke failed');
  end;

  return jsonb_build_object(
    'ready',v_status='open' and v_total>=2000 and v_fcp>=500 and v_simple>=500 and v_dist>=500 and v_circ>=500
            and v_roster>=61 and v_start and v_teacher and v_email and v_crypto
            and coalesce((v_runtime->>'ready')::boolean,false),
    'status',v_status,'question_count',v_total,
    'topic_counts',jsonb_build_object('FCP',v_fcp,'P_SIMPLE',v_simple,'P_DIST',v_dist,'P_CIRC',v_circ),
    'roster_count',v_roster,'student_rpc',v_start,'teacher_rpc',v_teacher,
    'email_capture_ready',v_email,'crypto_ready',v_crypto,'runtime_smoke',v_runtime
  );
end;
$$;

revoke all on function public.student_resume_attempt(uuid,text) from public;
revoke all on function public.student_log_event(uuid,text,text,text,timestamptz,text,boolean,jsonb) from public;
revoke all on function public.teacher_dashboard_snapshot(text,text) from public;

grant execute on function public.student_resume_attempt(uuid,text) to anon,authenticated;
grant execute on function public.student_log_event(uuid,text,text,text,timestamptz,text,boolean,jsonb) to anon,authenticated;
grant execute on function public.teacher_dashboard_snapshot(text,text) to anon,authenticated;

grant execute on function public.statistics11_assessment_health() to anon,authenticated;

notify pgrst, 'reload schema';

commit;
