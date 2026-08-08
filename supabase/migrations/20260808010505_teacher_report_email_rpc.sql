begin;

create or replace function public.teacher_set_report_email(
  p_teacher_token text,
  p_assessment_slug text,
  p_recipient_email text
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_sid uuid;
  v_assessment_id uuid;
  v_email text := lower(trim(coalesce(p_recipient_email,'')));
begin
  v_sid := public.teacher_code_session_id(p_teacher_token);
  if v_sid is null then raise exception 'Sesión docente inválida o expirada'; end if;
  if v_email !~ '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' collate "C" then
    raise exception 'Correo no válido';
  end if;
  select id into v_assessment_id from public.assessments where slug=p_assessment_slug;
  if v_assessment_id is null then raise exception 'Evaluación no encontrada'; end if;

  insert into public.assessment_report_settings(assessment_id,recipient_email,enabled,updated_at)
  values(v_assessment_id,v_email,true,now())
  on conflict(assessment_id) do update set
    recipient_email=excluded.recipient_email,
    enabled=true,
    updated_at=now();

  insert into public.teacher_code_audit(teacher_session_id,action_type,assessment_id,metadata)
  values(v_sid,'SET_REPORT_EMAIL',v_assessment_id,jsonb_build_object('recipient_email',v_email));

  return jsonb_build_object('ok',true,'recipient_email',v_email);
end;
$$;

revoke all on function public.teacher_set_report_email(text,text,text) from public;
grant execute on function public.teacher_set_report_email(text,text,text) to anon,authenticated;

commit;
