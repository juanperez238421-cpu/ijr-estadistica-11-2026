alter table public.python_hub_registrations add column if not exists progress_code_hash text;

update public.python_hub_registrations
set progress_code_hash = encode(digest(upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),'sha256'),'hex')
where progress_code_hash is null;

alter table public.python_hub_registrations alter column progress_code_hash set not null;

create index if not exists python_hub_members_registry_idx on public.python_hub_registration_members(student_registry_id) where student_registry_id is not null;
create index if not exists python_hub_progress_topic_idx on public.python_hub_topic_progress(topic_slug);
create index if not exists python_hub_responses_topic_item_idx on public.python_hub_workshop_responses(topic_slug,item_key);

create policy "python hub topics rpc only" on public.python_hub_topics for all to anon, authenticated using (false) with check (false);
create policy "python hub registrations rpc only" on public.python_hub_registrations for all to anon, authenticated using (false) with check (false);
create policy "python hub members rpc only" on public.python_hub_registration_members for all to anon, authenticated using (false) with check (false);
create policy "python hub progress rpc only" on public.python_hub_topic_progress for all to anon, authenticated using (false) with check (false);
create policy "python hub keys rpc only" on public.python_hub_workshop_keys for all to anon, authenticated using (false) with check (false);
create policy "python hub responses rpc only" on public.python_hub_workshop_responses for all to anon, authenticated using (false) with check (false);

create or replace function public.python_hub_register_v2(
  p_registration_mode text,
  p_group_code text,
  p_student_emails jsonb,
  p_session_id uuid,
  p_user_agent text,
  p_progress_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_catalog
as $$
declare
  v_mode text:=lower(trim(coalesce(p_registration_mode,'')));
  v_group text:=upper(trim(coalesce(p_group_code,'')));
  v_size integer;
  v_emails text[];
  v_email text;
  v_team_hash text;
  v_token text;
  v_progress_code text;
  v_is_new boolean:=false;
  v_registration public.python_hub_registrations%rowtype;
  v_label text;
  v_i integer;
  v_student_id uuid;
  v_display text;
begin
  if v_mode not in ('individual','team') then raise exception 'Select individual or team registration'; end if;
  if v_group not in ('11A','11B','11C') then raise exception 'Select a valid group'; end if;
  if p_student_emails is null or jsonb_typeof(p_student_emails)<>'array' then raise exception 'Provide institutional emails'; end if;
  v_size:=jsonb_array_length(p_student_emails);
  if (v_mode='individual' and v_size<>1) or (v_mode='team' and v_size not in (2,3)) then
    raise exception 'Individual registration uses 1 email; team registration uses 2 or 3';
  end if;

  select array_agg(e order by e) into v_emails
  from (select lower(trim(value)) e from jsonb_array_elements_text(p_student_emails)) s;

  if (select count(*) from unnest(v_emails) e where length(e)<12 or e~'\s' or split_part(e,'@',1)='' or split_part(e,'@',2)<>'ijr.edu.co')>0 then
    raise exception 'Use valid @ijr.edu.co institutional emails';
  end if;
  if (select count(*) from unnest(v_emails) e)<>(select count(distinct e) from unnest(v_emails) e) then
    raise exception 'Do not repeat an institutional email';
  end if;

  v_team_hash:=encode(digest(v_group||'|'||array_to_string(v_emails,'|'),'sha256'),'hex');
  v_token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  v_label:=array_to_string(v_emails,' · ');

  select * into v_registration
  from public.python_hub_registrations
  where group_code=v_group and team_key_hash=v_team_hash
  for update;

  if v_registration.id is null then
    v_is_new:=true;
    v_progress_code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
    insert into public.python_hub_registrations(
      registration_mode,group_code,team_key_hash,team_size,display_label,
      access_token_hash,progress_code_hash,last_session_id,user_agent
    ) values(
      v_mode,v_group,v_team_hash,v_size,v_label,
      encode(digest(v_token,'sha256'),'hex'),encode(digest(v_progress_code,'sha256'),'hex'),
      coalesce(p_session_id,gen_random_uuid()),p_user_agent
    ) returning * into v_registration;

    for v_i in 1..v_size loop
      v_email:=v_emails[v_i]; v_student_id:=null; v_display:=v_email;
      select a.student_registry_id,s.display_name into v_student_id,v_display
      from public.attempts a
      join public.student_registry s on s.id=a.student_registry_id and s.active=true
      where a.student_registry_id is not null
        and a.group_code=v_group
        and lower(trim(coalesce(a.student_email_normalized,a.student_email,'')))=v_email
      order by a.started_at desc limit 1;
      v_display:=coalesce(v_display,v_email);
      insert into public.python_hub_registration_members(
        registration_id,member_order,institutional_email,email_normalized,display_name,student_registry_id
      ) values(v_registration.id,v_i,v_email,v_email,v_display,v_student_id);
    end loop;
  else
    if v_registration.status='disabled' then raise exception 'This learning registration is disabled'; end if;
    if coalesce(trim(p_progress_code),'')='' then
      raise exception 'This learning path already exists. Enter its 8-character progress code to resume on this device';
    end if;
    if v_registration.progress_code_hash <> encode(digest(upper(trim(p_progress_code)),'sha256'),'hex') then
      raise exception 'Incorrect progress code';
    end if;
    update public.python_hub_registrations
    set registration_mode=v_mode,
        team_size=v_size,
        display_label=v_label,
        access_token_hash=encode(digest(v_token,'sha256'),'hex'),
        last_session_id=coalesce(p_session_id,gen_random_uuid()),
        user_agent=p_user_agent,
        last_activity_at=clock_timestamp()
    where id=v_registration.id
    returning * into v_registration;
  end if;

  perform private.python_hub_refresh_v1(v_registration.id);
  return jsonb_build_object(
    'registration_id',v_registration.id,
    'access_token',v_token,
    'progress_code',case when v_is_new then v_progress_code else null end,
    'new_registration',v_is_new,
    'snapshot',public.python_hub_snapshot_v1(v_registration.id,v_token)
  );
end;
$$;

revoke all on function public.python_hub_register_v1(text,text,jsonb,uuid,text) from public, anon, authenticated;
revoke all on function public.python_hub_register_v2(text,text,jsonb,uuid,text,text) from public;
grant execute on function public.python_hub_register_v2(text,text,jsonb,uuid,text,text) to anon, authenticated;

notify pgrst, 'reload schema';
