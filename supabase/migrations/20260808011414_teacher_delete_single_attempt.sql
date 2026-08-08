begin;

-- Teacher-only destructive maintenance action.
-- Deletes exactly one assessment attempt and its dependent audit payload,
-- while preserving the institutional roster and a tombstone in teacher_code_audit.
create or replace function public.teacher_delete_attempt(
  p_teacher_token text,
  p_assessment_slug text,
  p_attempt_id uuid,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  v_sid uuid;
  v_assessment public.assessments%rowtype;
  v_attempt public.attempts%rowtype;
  v_response_count integer := 0;
  v_event_count integer := 0;
  v_assignment_count integer := 0;
  v_email_count integer := 0;
  v_student_label text;
  v_student_email text;
begin
  v_sid := public.teacher_code_session_id(p_teacher_token);
  if v_sid is null then
    raise exception 'Sesión docente inválida o expirada';
  end if;

  if upper(trim(coalesce(p_confirmation,''))) <> 'ELIMINAR' then
    raise exception 'Confirmación de eliminación inválida';
  end if;

  select * into v_assessment
  from public.assessments
  where slug=p_assessment_slug;

  if not found then
    raise exception 'Evaluación no encontrada';
  end if;

  -- Serialise destructive actions for the same attempt.
  perform pg_advisory_xact_lock(hashtext(p_attempt_id::text));

  select * into v_attempt
  from public.attempts
  where id=p_attempt_id
    and assessment_id=v_assessment.id
  for update;

  if not found then
    raise exception 'Intento no encontrado o ya eliminado';
  end if;

  v_student_label := coalesce(v_attempt.student_name_snapshot,v_attempt.student_name_entered,v_attempt.student_id);
  v_student_email := nullif(to_jsonb(v_attempt)->>'student_email','');

  select count(*) into v_response_count from public.responses where attempt_id=p_attempt_id;
  select count(*) into v_event_count from public.attempt_events where attempt_id=p_attempt_id;
  select count(*) into v_assignment_count
    from public.assignments
    where assessment_id=v_assessment.id and student_id=v_attempt.student_id;

  if to_regclass('public.assessment_email_outbox') is not null then
    execute 'select count(*) from public.assessment_email_outbox where attempt_id=$1'
      into v_email_count using p_attempt_id;
  end if;

  -- Preserve a non-sensitive tombstone before cascading the attempt away.
  insert into public.teacher_code_audit(
    teacher_session_id,action_type,assessment_id,attempt_id,metadata
  ) values (
    v_sid,
    'DELETE_ATTEMPT',
    v_assessment.id,
    p_attempt_id,
    jsonb_build_object(
      'deleted_attempt_id',p_attempt_id,
      'student_id',v_attempt.student_id,
      'student_name',v_student_label,
      'student_email',v_student_email,
      'group_code',v_attempt.group_code,
      'status',v_attempt.status,
      'started_at',v_attempt.started_at,
      'submitted_at',v_attempt.submitted_at,
      'answered_count',v_attempt.answered_count,
      'raw_points',v_attempt.raw_points,
      'grade',v_attempt.grade,
      'integrity_strikes',v_attempt.integrity_strikes,
      'responses_deleted',v_response_count,
      'events_deleted',v_event_count,
      'email_reports_deleted',v_email_count,
      'assignments_released',v_assignment_count,
      'deleted_at',clock_timestamp()
    )
  );

  -- responses, attempt_events and assessment_email_outbox are deleted by
  -- their ON DELETE CASCADE foreign keys. teacher_code_audit keeps the
  -- tombstone because its attempt FK is ON DELETE SET NULL.
  delete from public.attempts
  where id=p_attempt_id and assessment_id=v_assessment.id;

  -- Release the student's assignment as part of a true reset. This allows a
  -- future attempt to receive a clean allocation instead of the old set.
  delete from public.assignments
  where assessment_id=v_assessment.id
    and student_id=v_attempt.student_id;

  return jsonb_build_object(
    'ok',true,
    'deleted',true,
    'attempt_id',p_attempt_id,
    'student_id',v_attempt.student_id,
    'student_name',v_student_label,
    'student_email',v_student_email,
    'group_code',v_attempt.group_code,
    'previous_status',v_attempt.status,
    'responses_deleted',v_response_count,
    'events_deleted',v_event_count,
    'email_reports_deleted',v_email_count,
    'assignments_released',v_assignment_count,
    'roster_preserved',true
  );
end;
$$;

revoke all on function public.teacher_delete_attempt(text,text,uuid,text) from public;
grant execute on function public.teacher_delete_attempt(text,text,uuid,text) to anon,authenticated;

-- Ask PostgREST to expose the new RPC without waiting for cache expiry.
notify pgrst, 'reload schema';

commit;
