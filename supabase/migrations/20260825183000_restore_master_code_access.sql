begin;

create table if not exists private.teacher_master_credentials (
  singleton boolean primary key default true check (singleton),
  code_hash text not null,
  updated_at timestamptz not null default clock_timestamp()
);

revoke all on table private.teacher_master_credentials from public,anon,authenticated;

insert into private.teacher_master_credentials(singleton,code_hash,updated_at)
values(true,'e997c9af23a37016f262c1f8cd0fee05ef6f922434fcbfac9a0b04646e087a77',clock_timestamp())
on conflict(singleton) do update set
  code_hash=excluded.code_hash,
  updated_at=excluded.updated_at;

update public.teacher_code_sessions
set active=false
where active=true;

create or replace function public.teacher_code_session_id(p_token text)
returns uuid
language plpgsql
security definer
set search_path=public,extensions,private
as $$
declare
  v_id uuid;
begin
  if coalesce(length(p_token),0) < 40 then return null; end if;

  select id into v_id
  from public.teacher_code_sessions
  where active=true
    and expires_at>clock_timestamp()
    and token_hash=encode(extensions.digest(p_token,'sha256'),'hex')
  limit 1;

  if v_id is not null then
    update public.teacher_code_sessions
    set last_seen_at=clock_timestamp()
    where id=v_id;
  end if;

  return v_id;
end;
$$;

create or replace function public.teacher_code_login(p_code text,p_user_agent text default null)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions,private
as $$
declare
  v_ip text:=public.request_ip_hash();
  v_failures integer;
  v_expected_hash text;
  v_ok boolean:=false;
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

  select code_hash into v_expected_hash
  from private.teacher_master_credentials
  where singleton=true;

  v_ok:=v_expected_hash is not null
        and encode(extensions.digest(coalesce(p_code,''),'sha256'),'hex')=v_expected_hash;

  insert into public.teacher_code_login_attempts(ip_hash,success)
  values(v_ip,v_ok);

  if not v_ok then
    raise exception 'Código maestro incorrecto';
  end if;

  v_token:=encode(extensions.gen_random_bytes(32),'hex');
  insert into public.teacher_code_sessions(token_hash,expires_at,ip_hash,user_agent,active)
  values(
    encode(extensions.digest(v_token,'sha256'),'hex'),
    clock_timestamp()+interval '4 hours',
    v_ip,
    left(coalesce(p_user_agent,''),1000),
    true
  )
  returning * into v_session;

  return jsonb_build_object(
    'teacher_token',v_token,
    'expires_at',v_session.expires_at
  );
end;
$$;

create or replace function public.teacher_code_logout(p_teacher_token text)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions,private
as $$
declare
  v_id uuid;
begin
  v_id:=public.teacher_code_session_id(p_teacher_token);
  if v_id is not null then
    update public.teacher_code_sessions set active=false where id=v_id;
  end if;
  return jsonb_build_object('ok',true);
end;
$$;

revoke all on function public.teacher_code_session_id(text) from public,anon,authenticated;
revoke all on function public.teacher_code_login(text,text) from public,anon,authenticated;
revoke all on function public.teacher_code_logout(text) from public,anon,authenticated;

grant execute on function public.teacher_code_login(text,text) to anon,authenticated;
grant execute on function public.teacher_code_logout(text) to anon,authenticated;
grant execute on function public.teacher_learning_activity_dashboard_v11(text) to anon,authenticated;
grant execute on function public.teacher_learning_activity_detail_v11(text,uuid) to anon,authenticated;
grant execute on function public.teacher_learning_activity_update_registration_v10(text,uuid,text,jsonb) to anon,authenticated;
grant execute on function public.teacher_learning_activity_delete_v10(text,uuid) to anon,authenticated;

notify pgrst,'reload schema';

commit;
