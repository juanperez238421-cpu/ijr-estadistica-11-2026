begin;

create extension if not exists pg_net;

-- -----------------------------------------------------------------------------
-- Email outbox lifecycle: pending -> sending -> sent | failed.
-- ----------------------------------------------------------------------------
alter table public.assessment_email_outbox
  add column if not exists delivery_attempts integer not null default 0,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists provider_message_id text;

alter table public.assessment_email_outbox
  drop constraint if exists assessment_email_outbox_status_check;
alter table public.assessment_email_outbox
  add constraint assessment_email_outbox_status_check
  check(status in ('pending','sending','sent','failed','cancelled'));

-- Queue only fully finalized/scored official attempts. Previously an
-- auto-invalidated status change could enqueue before raw_points/grade existed.
create or replace function public.queue_assessment_email_report()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_email text;
begin
  if new.status not in ('submitted','force_submitted','auto_invalidated','invalidated') then return new; end if;
  if new.student_id like 'TEST-%' then return new; end if;
  if new.raw_points is null or new.grade is null then return new; end if;

  select recipient_email into v_email
  from public.assessment_report_settings
  where assessment_id=new.assessment_id and enabled=true;
  if v_email is null then return new; end if;

  insert into public.assessment_email_outbox(
    assessment_id,attempt_id,recipient_email,subject,payload,status
  ) values(
    new.assessment_id,new.id,v_email,
    'Statistics 11 · Resultado '||coalesce(new.student_name_snapshot,new.student_name_entered,new.student_id),
    jsonb_build_object(
      'attempt_id',new.id,
      'student',coalesce(new.student_name_snapshot,new.student_name_entered,new.student_id),
      'student_email',new.student_email,
      'group',new.group_code,
      'status',new.status,
      'started_at',new.started_at,
      'submitted_at',new.submitted_at,
      'answered_count',new.answered_count,
      'correct_count',new.correct_count,
      'incorrect_count',new.incorrect_count,
      'raw_points',new.raw_points,
      'grade',new.grade,
      'integrity_strikes',new.integrity_strikes,
      'finish_reason',new.finish_reason
    ),
    'pending'
  )
  on conflict(attempt_id,recipient_email) do update set
    subject=excluded.subject,
    payload=excluded.payload,
    status=case when public.assessment_email_outbox.status='sent' then 'sent' else 'pending' end,
    error_message=case when public.assessment_email_outbox.status='sent' then public.assessment_email_outbox.error_message else null end;
  return new;
end;
$$;

-- Atomic/idempotent claim used only by the server-side Edge Function.
create or replace function public.mailer_claim_assessment_email(p_outbox_id bigint)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare v_row public.assessment_email_outbox%rowtype;
begin
  update public.assessment_email_outbox
  set status='sending',
      delivery_attempts=delivery_attempts+1,
      last_attempt_at=clock_timestamp(),
      error_message=null
  where id=p_outbox_id and status='pending'
  returning * into v_row;

  if not found then
    select * into v_row from public.assessment_email_outbox where id=p_outbox_id;
    if not found then return jsonb_build_object('claimable',false,'reason','not_found'); end if;
    return jsonb_build_object('claimable',false,'status',v_row.status,'provider_message_id',v_row.provider_message_id);
  end if;

  return jsonb_build_object(
    'claimable',true,
    'id',v_row.id,
    'attempt_id',v_row.attempt_id,
    'recipient_email',v_row.recipient_email,
    'subject',v_row.subject,
    'payload',v_row.payload,
    'delivery_attempts',v_row.delivery_attempts
  );
end;
$$;

create or replace function public.mailer_mark_assessment_email_sent(p_outbox_id bigint,p_provider_message_id text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
begin
  update public.assessment_email_outbox
  set status='sent',sent_at=clock_timestamp(),provider_message_id=left(coalesce(p_provider_message_id,''),500),error_message=null
  where id=p_outbox_id and status='sending';
  return jsonb_build_object('ok',found);
end;
$$;

create or replace function public.mailer_mark_assessment_email_failed(p_outbox_id bigint,p_error_message text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
begin
  update public.assessment_email_outbox
  set status='failed',error_message=left(coalesce(p_error_message,'Unknown mailer error'),2000)
  where id=p_outbox_id and status='sending';
  return jsonb_build_object('ok',found);
end;
$$;

revoke all on function public.mailer_claim_assessment_email(bigint) from public,anon,authenticated;
revoke all on function public.mailer_mark_assessment_email_sent(bigint,text) from public,anon,authenticated;
revoke all on function public.mailer_mark_assessment_email_failed(bigint,text) from public,anon,authenticated;
grant execute on function public.mailer_claim_assessment_email(bigint) to service_role;
grant execute on function public.mailer_mark_assessment_email_sent(bigint,text) to service_role;
grant execute on function public.mailer_mark_assessment_email_failed(bigint,text) to service_role;

-- Asynchronous database-to-Edge dispatch. The Edge Function is deliberately
-- payload-restricted: callers can only ask it to process an outbox row already
-- created by the database; they cannot choose arbitrary recipients/content.
create or replace function public.dispatch_assessment_email_outbox()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.status <> 'pending' then return new; end if;
  perform net.http_post(
    url := 'https://rlfxnjbqxbozjdzkbwlz.supabase.co/functions/v1/send-assessment-email',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('outbox_id',new.id),
    timeout_milliseconds := 5000
  );
  return new;
exception when others then
  -- Never block exam finalization because a network worker is unavailable.
  return new;
end;
$$;

drop trigger if exists trg_dispatch_assessment_email_outbox on public.assessment_email_outbox;
create trigger trg_dispatch_assessment_email_outbox
after insert or update of status,payload,recipient_email on public.assessment_email_outbox
for each row
when (new.status='pending')
execute function public.dispatch_assessment_email_outbox();

-- -----------------------------------------------------------------------------
-- Third integrity strike = terminal server-side finalization in the same RPC.
-- This removes the old dependency on a second browser RPC after the server had
-- already changed the attempt to auto_invalidated.
-- -----------------------------------------------------------------------------
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
  v_final jsonb := null;
begin
  select * into v_attempt from public.attempts where id=p_attempt_id for update;

  if not found
     or v_attempt.access_token_hash is null
     or v_attempt.access_token_hash <> encode(extensions.digest(coalesce(p_attempt_token,''),'sha256'),'hex') then
    raise exception 'Intento no válido';
  end if;

  if v_attempt.status in ('submitted','force_submitted','auto_invalidated','invalidated') then
    return jsonb_build_object(
      'ok',true,'ignored',true,'terminal',true,
      'integrity_strikes',v_attempt.integrity_strikes,
      'invalidated',v_attempt.status like '%invalidated%',
      'final_result',jsonb_build_object(
        'status',v_attempt.status,'answered_count',v_attempt.answered_count,
        'correct_count',v_attempt.correct_count,'incorrect_count',v_attempt.incorrect_count,
        'raw_points',v_attempt.raw_points,'grade',v_attempt.grade
      )
    );
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
      set integrity_strikes=v_strikes,
          last_activity_at=v_server_time
      where id=p_attempt_id;

      -- student_finish_attempt computes score/grade, writes terminal state, and
      -- fires the scored outbox trigger. All happens server-side in this call.
      v_final := public.student_finish_attempt(
        p_attempt_id,p_attempt_token,'auto_invalidated_integrity'
      );
    else
      update public.attempts
      set integrity_strikes=v_strikes,last_activity_at=v_server_time
      where id=p_attempt_id;
    end if;
  else
    update public.attempts set last_activity_at=v_server_time where id=p_attempt_id;
  end if;

  return jsonb_build_object(
    'ok',true,
    'event_sequence',v_sequence,
    'integrity_strikes',v_strikes,
    'invalidated',v_invalidated,
    'terminal',v_invalidated,
    'final_result',v_final
  );
end;
$$;

-- Rebuild payloads for already-scored pending reports using the upgraded trigger.
update public.attempts
set grade=grade
where status in ('submitted','force_submitted','auto_invalidated','invalidated')
  and raw_points is not null and grade is not null
  and student_id not like 'TEST-%';

notify pgrst, 'reload schema';
commit;
