-- Statistics 11 · Modules 01–03 Evaluation V2
-- Closure semantics: unanswered questions become incorrect on timeout,
-- manual closure, or integrity lock so a prematurely ended attempt cannot
-- retain unearned points.

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
  v_eval public.python_hub_eval_assessments%rowtype;
  v_answered integer;
  v_missing integer;
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
    select * into v_eval
    from public.python_hub_eval_assessments
    where id=v_attempt.evaluation_id;

    select count(*)::int into v_answered
    from public.python_hub_eval_responses
    where attempt_id=v_attempt.id;

    v_missing:=greatest(0,v_eval.question_count-v_answered);

    update public.python_hub_eval_attempts
    set status='expired',
        submitted_at=coalesce(submitted_at,clock_timestamp()),
        finish_reason=coalesce(finish_reason,'time_expired'),
        points_remaining=greatest(0,points_remaining-(v_missing*v_eval.wrong_answer_penalty)),
        incorrect_count=incorrect_count+v_missing,
        last_activity_at=clock_timestamp()
    where id=v_attempt.id
    returning * into v_attempt;
  end if;

  return v_attempt;
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
  v_answered integer;
  v_missing integer;
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
        select count(*)::int into v_answered
        from public.python_hub_eval_responses
        where attempt_id=v_attempt.id;
        v_missing:=greatest(0,v_eval.question_count-v_answered);

        update public.python_hub_eval_attempts
        set status='integrity_locked',
            submitted_at=clock_timestamp(),
            finish_reason='integrity_limit',
            points_remaining=greatest(0,points_remaining-(v_missing*v_eval.wrong_answer_penalty)),
            incorrect_count=incorrect_count+v_missing,
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
  v_eval public.python_hub_eval_assessments%rowtype;
  v_answered integer;
  v_missing integer;
begin
  v_attempt:=private.python_hub_eval_attempt_v1(p_attempt_id,p_attempt_token);

  if v_attempt.status='active' then
    select * into v_eval
    from public.python_hub_eval_assessments
    where id=v_attempt.evaluation_id;

    select count(*)::int into v_answered
    from public.python_hub_eval_responses
    where attempt_id=v_attempt.id;

    v_missing:=greatest(0,v_eval.question_count-v_answered);

    update public.python_hub_eval_attempts
    set status='submitted',
        submitted_at=clock_timestamp(),
        finish_reason=left(coalesce(nullif(trim(p_reason),''),'manual_finish'),80),
        points_remaining=greatest(0,points_remaining-(v_missing*v_eval.wrong_answer_penalty)),
        incorrect_count=incorrect_count+v_missing,
        last_activity_at=clock_timestamp()
    where id=v_attempt.id;
  end if;

  return private.python_hub_eval_snapshot_v1(v_attempt.id,p_attempt_token);
end;
$$;

revoke all on function public.python_hub_eval_log_event_v1(uuid,text,text,jsonb) from public;
revoke all on function public.python_hub_eval_finish_v1(uuid,text,text) from public;
grant execute on function public.python_hub_eval_log_event_v1(uuid,text,text,jsonb) to anon,authenticated;
grant execute on function public.python_hub_eval_finish_v1(uuid,text,text) to anon,authenticated;
