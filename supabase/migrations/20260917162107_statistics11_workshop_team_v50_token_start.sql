-- Statistics 11 workshop V50
-- Restores a reliable workshop start path using the existing Learning Hub
-- registration/access-token session while preserving institutional-email teams.

create or replace function public.python_hub_start_workshop_team_v3(
  p_registration_id uuid,
  p_access_token text,
  p_topic_slug text,
  p_student_emails jsonb,
  p_session_id uuid,
  p_user_agent text
)
returns jsonb
language plpgsql
security definer
set search_path = 'public','private','extensions','pg_catalog'
as $$
declare
  v_registration public.python_hub_registrations%rowtype;
  v_progress public.python_hub_topic_progress%rowtype;
  v_workshop public.python_hub_workshop_sessions%rowtype;
  v_size integer;
  v_i integer;
  v_email text;
  v_owner_email text;
  v_member jsonb;
  v_members jsonb := '[]'::jsonb;
  v_label text;
  v_duplicate_count integer;
  v_owner_participant_registration uuid;
begin
  v_registration := private.python_hub_registration_v1(p_registration_id,p_access_token);
  perform private.python_hub_refresh_v1(v_registration.id);

  select lower(trim(coalesce(m.email_normalized,m.institutional_email,'')))
    into v_owner_email
  from public.python_hub_registration_members m
  where m.registration_id=v_registration.id and m.member_order=1
  limit 1;

  if coalesce(v_owner_email,'')='' and v_registration.student_account_id is not null then
    select lower(trim(a.institutional_email)) into v_owner_email
    from public.python_hub_student_accounts a
    where a.id=v_registration.student_account_id;
  end if;

  if coalesce(v_owner_email,'')='' and split_part(lower(trim(v_registration.display_label)),'@',2)='ijr.edu.co' then
    v_owner_email:=lower(trim(v_registration.display_label));
  end if;

  if split_part(coalesce(v_owner_email,''),'@',2)<>'ijr.edu.co' or split_part(coalesce(v_owner_email,''),'@',1)='' then
    raise exception 'Your verified institutional email is missing from this learning session. Return to the Learning Hub and sign in again.';
  end if;

  select * into v_progress
  from public.python_hub_topic_progress
  where registration_id=v_registration.id and topic_slug=trim(coalesce(p_topic_slug,''));

  if v_progress.registration_id is null then raise exception 'Unknown workshop topic'; end if;
  if v_progress.status='locked' then raise exception 'Complete the prerequisite workshop first'; end if;

  if p_student_emails is null or jsonb_typeof(p_student_emails)<>'array' then
    raise exception 'Select how many students are participating';
  end if;
  v_size:=jsonb_array_length(p_student_emails);
  if v_size<1 or v_size>3 then
    raise exception 'Register 1 to 3 participating students';
  end if;

  if lower(trim(p_student_emails->>0))<>v_owner_email then
    raise exception 'Student 1 must be the institutional email currently signed in: %',v_owner_email;
  end if;

  if exists(
    select 1 from jsonb_array_elements_text(p_student_emails) e(value)
    where split_part(lower(trim(e.value)),'@',2)<>'ijr.edu.co'
       or split_part(lower(trim(e.value)),'@',1)=''
  ) then
    raise exception 'Every participant must use an @ijr.edu.co institutional email';
  end if;

  with emails as (
    select ord::integer ord,lower(trim(value)) email
    from jsonb_array_elements_text(p_student_emails) with ordinality t(value,ord)
  )
  select string_agg(email,' · ' order by ord),count(*)-count(distinct email)
  into v_label,v_duplicate_count
  from emails;

  if v_duplicate_count>0 then
    raise exception 'Do not repeat an institutional email in the same workshop team';
  end if;

  for v_i in 1..v_size loop
    v_email:=lower(trim(p_student_emails->>(v_i-1)));
    v_member:=private.python_hub_ensure_participant_registration_v49(
      v_email,v_registration.group_code,coalesce(p_session_id,gen_random_uuid()),p_user_agent
    ) || jsonb_build_object('order',v_i);

    if v_i=1 then
      v_owner_participant_registration:=nullif(v_member->>'participant_registration_id','')::uuid;
      if v_owner_participant_registration is distinct from v_registration.id then
        raise exception 'The signed-in institutional account does not match the active learning registration. Return to the Learning Hub and sign in again.';
      end if;
    end if;

    v_members:=v_members||jsonb_build_array(v_member);
  end loop;

  insert into public.python_hub_workshop_sessions(
    registration_id,topic_slug,group_code,browser_session_id,team_size,team_label,user_agent
  ) values(
    v_registration.id,trim(p_topic_slug),v_registration.group_code,
    coalesce(p_session_id,gen_random_uuid()),v_size,v_label,left(coalesce(p_user_agent,''),1000)
  ) returning * into v_workshop;

  for v_member in select value from jsonb_array_elements(v_members)
  loop
    insert into public.python_hub_workshop_session_members(
      workshop_session_id,member_order,display_name,normalized_name,
      student_identity_id,student_registry_id,institutional_email,email_normalized,participant_registration_id
    ) values(
      v_workshop.id,(v_member->>'order')::smallint,v_member->>'display_name',v_member->>'institutional_email',
      nullif(v_member->>'student_identity_id','')::uuid,nullif(v_member->>'student_registry_id','')::uuid,
      v_member->>'institutional_email',v_member->>'institutional_email',
      (v_member->>'participant_registration_id')::uuid
    );
  end loop;

  update public.python_hub_registrations
  set last_activity_at=clock_timestamp()
  where id=v_registration.id;

  return jsonb_build_object(
    'workshop_session_id',v_workshop.id,
    'topic_slug',v_workshop.topic_slug,
    'group_code',v_workshop.group_code,
    'team_size',v_workshop.team_size,
    'team_label',v_workshop.team_label,
    'started_at',v_workshop.started_at,
    'members',v_members
  );
end;
$$;

revoke all on function public.python_hub_start_workshop_team_v3(uuid,text,text,jsonb,uuid,text) from public;
grant execute on function public.python_hub_start_workshop_team_v3(uuid,text,text,jsonb,uuid,text) to anon, authenticated;
