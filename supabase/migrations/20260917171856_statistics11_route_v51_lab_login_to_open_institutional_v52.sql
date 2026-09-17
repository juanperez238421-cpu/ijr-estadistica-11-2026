create or replace function public.python_hub_lab_login_v51(
  p_group_code text,
  p_institutional_email text,
  p_session_id uuid,
  p_user_agent text
) returns jsonb
language sql
security definer
set search_path to 'public','private','extensions','pg_catalog'
as $function$
  select public.python_hub_lab_login_v52(
    p_group_code,
    p_institutional_email,
    p_session_id,
    p_user_agent
  );
$function$;

revoke all on function public.python_hub_lab_login_v51(text,text,uuid,text) from public;
grant execute on function public.python_hub_lab_login_v51(text,text,uuid,text) to anon, authenticated;
