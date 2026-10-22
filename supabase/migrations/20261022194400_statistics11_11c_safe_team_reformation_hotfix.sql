-- Class 11C urgent hotfix, 2026-10-22.
-- Allow merging fully represented active workshop teams from 1 -> 2 -> 3 participants.
-- Preserve old sessions and response history, reject moves that exclude old teammates.
-- Other groups' enrollment rules are unchanged.
-- Deployed to Supabase via migration statistics11_11c_safe_workshop_team_reformation_20261022.
CREATE OR REPLACE FUNCTION public.python_hub_start_workshop_team_v3(p_registration_id uuid, p_access_token text, p_topic_slug text, p_student_emails jsonb, p_session_id uuid, p_user_agent text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'extensions', 'pg_catalog'
AS $function$
declare
  v_registration public.python_hub_registrations%rowtype;
  v_progress public.python_hub_topic_progress%rowtype;
  v_workshop public.python_hub_workshop_sessions%rowtype;
  v_size integer;
  v_i integer;
  v_email text;
  v_owner_email text;
  v_member jsonb;
  v_members jsonb:='[]'::jsonb;
  v_label text;
  v_duplicate_count integer;
  v_owner_participant_registration uuid;
  v_browser_session_id uuid:=coalesce(p_session_id,gen_random_uuid());
  v_reconcile jsonb;
  v_conflict_count integer;
  v_old_session public.python_hub_workshop_sessions%rowtype;
  v_transfer_count integer := 0;
begin
  v_registration:=private.python_hub_registration_v1(p_registration_id,p_access_token);
  perform private.python_hub_refresh_v1(v_registration.id);

  select lower(trim(coalesce(m.email_normalized,m.institutional_email,'')))
  into v_owner_email
  from public.python_hub_registration_members m
  where m.registration_id=v_registration.id
    and m.member_order=1
  limit 1;

  if coalesce(v_owner_email,'')='' and v_registration.student_account_id is not null then
    select lower(trim(a.institutional_email))
    into v_owner_email
    from public.python_hub_student_accounts a
    where a.id=v_registration.student_account_id;
  end if;

  if coalesce(v_owner_email,'')=''
     and split_part(lower(trim(v_registration.display_label)),'@',2)='ijr.edu.co' then
    v_owner_email:=lower(trim(v_registration.display_label));
  end if;

  if split_part(coalesce(v_owner_email,''),'@',2)<>'ijr.edu.co'
     or split_part(coalesce(v_owner_email,''),'@',1)='' then
    raise exception 'Your verified institutional email is missing from this learning session. Return to the Learning Hub and sign in again.';
  end if;

  select *
  into v_progress
  from public.python_hub_topic_progress
  where registration_id=v_registration.id
    and topic_slug=trim(coalesce(p_topic_slug,''));

  if v_progress.registration_id is null then
    raise exception 'Unknown workshop topic';
  end if;
  if v_progress.status='locked' then
    raise exception 'Complete the prerequisite workshop first';
  end if;

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
    select 1
    from jsonb_array_elements_text(p_student_emails) e(value)
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
    v_member:=private.python_hub_ensure_participant_registration_v52(
      v_email,
      v_registration.group_code,
      v_browser_session_id,
      p_user_agent
    ) || jsonb_build_object('order',v_i);

    if v_i=1 then
      v_owner_participant_registration:=nullif(v_member->>'participant_registration_id','')::uuid;
      if v_owner_participant_registration is distinct from v_registration.id then
        raise exception 'The signed-in institutional account does not match the active learning registration. Return to the Learning Hub and sign in again.';
      end if;
    end if;

    v_members:=v_members||jsonb_build_array(v_member);
  end loop;

  for v_member in
    select value
    from jsonb_array_elements(v_members)
    order by value->>'participant_registration_id'
  loop
    perform pg_advisory_xact_lock(
      hashtextextended(
        (v_member->>'participant_registration_id')||'|'||trim(p_topic_slug),
        0
      )
    );
  end loop;

  update public.python_hub_workshop_sessions
  set status='abandoned',
      last_activity_at=clock_timestamp()
  where status='active'
    and last_activity_at<clock_timestamp()-interval '2 hours';

  -- Idempotent re-entry: same signed-in owner, topic, and exact ordered team
  -- must rejoin the existing active workshop rather than creating a conflict.
  select s.* into v_workshop
  from public.python_hub_workshop_sessions s
  where s.registration_id=v_registration.id
    and s.topic_slug=trim(p_topic_slug)
    and s.status='active'
    and s.team_size=v_size
    and (
      select jsonb_agg(lower(trim(coalesce(sm.email_normalized,sm.institutional_email))) order by sm.member_order)
      from public.python_hub_workshop_session_members sm where sm.workshop_session_id=s.id
    )=(
      select jsonb_agg(lower(trim(e.value)) order by e.ord)
      from jsonb_array_elements_text(p_student_emails) with ordinality e(value,ord)
    )
  order by s.last_activity_at desc
  limit 1 for update;

  if v_workshop.id is not null then
    update public.python_hub_workshop_sessions
      set last_activity_at=clock_timestamp()
      where id=v_workshop.id;
    return jsonb_build_object(
      'workshop_session_id',v_workshop.id,
      'topic_slug',v_workshop.topic_slug,
      'group_code',v_workshop.group_code,
      'team_size',v_workshop.team_size,
      'team_label',v_workshop.team_label,
      'status',v_workshop.status,
      'started_at',v_workshop.started_at,
      'members',v_members,
      'rejoined',true,
      'consolidation',null
    );
  end if;

  -- Keep historical 11A/11B behavior unchanged; 11C must not abandon an
  -- owner team before confirming that every teammate is moving together.
  if v_registration.group_code <> '11C' then
    update public.python_hub_workshop_sessions
    set status='abandoned',
        last_activity_at=clock_timestamp()
    where registration_id=v_registration.id
      and topic_slug=trim(p_topic_slug)
      and status='active';
  end if;

  select count(*)::int
  into v_conflict_count
  from public.python_hub_workshop_sessions s
  join public.python_hub_workshop_session_members sm
    on sm.workshop_session_id=s.id
  where s.status='active'
    and s.topic_slug=trim(p_topic_slug)
    and sm.participant_registration_id in (
      select (value->>'participant_registration_id')::uuid
      from jsonb_array_elements(v_members)
    );

  -- Class 11C: move a fully represented prior team into the newly selected
  -- 1-3 person team. An existing teammate not present in the new group is
  -- never displaced. The old session and all work remain in the audit trail.
  if v_conflict_count>0 and v_registration.group_code='11C' then
    for v_old_session in
      select s.*
      from public.python_hub_workshop_sessions s
      where s.status='active' and s.group_code='11C'
        and s.topic_slug=trim(p_topic_slug)
        and exists (
          select 1
          from public.python_hub_workshop_session_members sm
          where sm.workshop_session_id=s.id
            and sm.participant_registration_id in (
              select (e.value->>'participant_registration_id')::uuid
              from jsonb_array_elements(v_members) e(value)
            )
        )
      order by s.started_at,s.id
      for update of s
    loop
      if exists (
        select 1 from public.python_hub_workshop_session_members old_sm
        where old_sm.workshop_session_id=v_old_session.id
          and not exists (
            select 1 from jsonb_array_elements(v_members) new_sm(value)
            where (new_sm.value->>'participant_registration_id')::uuid=old_sm.participant_registration_id
          )
      ) then
        raise exception 'One of the selected students is working with other classmates in an active team. Add the entire existing team (maximum 3) or return to that team before switching computers.';
      end if;

      perform private.python_hub_reconcile_team_session_v66(
        v_old_session.id, 'team_reform_11c', false
      );
      update public.python_hub_workshop_sessions
      set status='abandoned',last_activity_at=clock_timestamp()
      where id=v_old_session.id and status='active';
      v_transfer_count:=v_transfer_count+1;
    end loop;

    -- Transactional assertion: no participant keeps two active sessions of
    -- the same topic. Advisory locks above serialize competing team starts.
    select count(*)::int into v_conflict_count
    from public.python_hub_workshop_sessions s
    join public.python_hub_workshop_session_members sm
      on sm.workshop_session_id=s.id
    where s.status='active' and s.topic_slug=trim(p_topic_slug)
      and sm.participant_registration_id in (
        select (e.value->>'participant_registration_id')::uuid
        from jsonb_array_elements(v_members) e(value)
      );
  end if;

  if v_conflict_count>0 then
    raise exception 'A selected student already has this workshop active on another computer. Close or finish that active team before joining a second one.';
  end if;

  insert into public.python_hub_workshop_sessions(
    registration_id,topic_slug,group_code,browser_session_id,team_size,team_label,user_agent
  ) values(
    v_registration.id,
    trim(p_topic_slug),
    v_registration.group_code,
    v_browser_session_id,
    v_size,
    v_label,
    left(coalesce(p_user_agent,''),1000)
  )
  returning *
  into v_workshop;

  for v_member in
    select value
    from jsonb_array_elements(v_members)
  loop
    insert into public.python_hub_workshop_session_members(
      workshop_session_id,member_order,display_name,normalized_name,
      student_identity_id,student_registry_id,institutional_email,email_normalized,participant_registration_id
    ) values(
      v_workshop.id,
      (v_member->>'order')::smallint,
      v_member->>'display_name',
      v_member->>'institutional_email',
      nullif(v_member->>'student_identity_id','')::uuid,
      nullif(v_member->>'student_registry_id','')::uuid,
      v_member->>'institutional_email',
      v_member->>'institutional_email',
      (v_member->>'participant_registration_id')::uuid
    );
  end loop;

  v_reconcile:=private.python_hub_reconcile_team_session_v66(
    v_workshop.id,
    'team_start',
    true
  );

  select *
  into v_workshop
  from public.python_hub_workshop_sessions
  where id=v_workshop.id;

  return jsonb_build_object(
    'workshop_session_id',v_workshop.id,
    'topic_slug',v_workshop.topic_slug,
    'group_code',v_workshop.group_code,
    'team_size',v_workshop.team_size,
    'team_label',v_workshop.team_label,
    'status',v_workshop.status,
    'started_at',v_workshop.started_at,
    'members',v_members,
    'consolidation',v_reconcile,
    'transferred_prior_sessions',v_transfer_count
  );
end;
$function$

