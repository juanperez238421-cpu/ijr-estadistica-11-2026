-- Statistics 11 · Team Progress Consolidation V66
-- Production migration mirrored from Supabase.
-- Guarantees: 1-3 students per workstation, durable per-identity credit,
-- full team response reconciliation, duplicate-active-team protection,
-- advisory-lock serialization, historical reconciliation and audit trail.

create table if not exists private.python_hub_identity_topic_credits (
  student_identity_id uuid not null references public.python_hub_student_identities(id) on delete cascade,
  topic_slug text not null references public.python_hub_topics(slug) on update cascade on delete cascade,
  source_key text not null,
  evidence_completed_at timestamptz not null default clock_timestamp(),
  evidence jsonb not null default '{}'::jsonb,
  primary key (student_identity_id,topic_slug)
);

create index if not exists python_hub_identity_topic_credits_topic_idx
  on private.python_hub_identity_topic_credits(topic_slug);

create table if not exists private.python_hub_team_sync_audit (
  workshop_session_id uuid not null references public.python_hub_workshop_sessions(id) on delete cascade,
  participant_registration_id uuid not null references public.python_hub_registrations(id) on delete cascade,
  owner_registration_id uuid not null references public.python_hub_registrations(id) on delete cascade,
  topic_slug text not null,
  item_key text not null,
  last_reason text not null,
  correct boolean not null default false,
  sync_count integer not null default 1 check (sync_count > 0),
  first_synced_at timestamptz not null default clock_timestamp(),
  last_synced_at timestamptz not null default clock_timestamp(),
  primary key (workshop_session_id,participant_registration_id,item_key)
);

create index if not exists python_hub_team_sync_audit_last_idx
  on private.python_hub_team_sync_audit(last_synced_at desc);

create index if not exists python_hub_workshop_sessions_active_owner_topic_idx
  on public.python_hub_workshop_sessions(registration_id,topic_slug,started_at desc)
  where status='active';

create index if not exists python_hub_workshop_sessions_active_activity_idx
  on public.python_hub_workshop_sessions(topic_slug,last_activity_at)
  where status='active';

CREATE OR REPLACE FUNCTION private.python_hub_registration_has_topic_credit_v1(p_registration_id uuid, p_topic_slug text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_catalog'
AS $function$
  select exists(
    select 1
    from public.python_hub_registration_members m
    where m.registration_id=p_registration_id
  )
  and not exists(
    select 1
    from public.python_hub_registration_members m
    where m.registration_id=p_registration_id
      and not (
        (
          m.student_identity_id is not null
          and exists(
            select 1
            from private.python_hub_identity_topic_credits ic
            where ic.student_identity_id=m.student_identity_id
              and ic.topic_slug=p_topic_slug
          )
        )
        or
        (
          m.student_registry_id is not null
          and exists(
            select 1
            from public.python_hub_student_topic_credits c
            where c.student_registry_id=m.student_registry_id
              and c.topic_slug=p_topic_slug
          )
        )
      )
  );
$function$;

CREATE OR REPLACE FUNCTION private.python_hub_registration_topic_credit_source_v1(p_registration_id uuid, p_topic_slug text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_catalog'
AS $function$
  select min(q.source_key)
  from (
    select ic.source_key
    from public.python_hub_registration_members m
    join private.python_hub_identity_topic_credits ic
      on ic.student_identity_id=m.student_identity_id
     and ic.topic_slug=p_topic_slug
    where m.registration_id=p_registration_id

    union all

    select c.source_key
    from public.python_hub_registration_members m
    join public.python_hub_student_topic_credits c
      on c.student_registry_id=m.student_registry_id
     and c.topic_slug=p_topic_slug
    where m.registration_id=p_registration_id
  ) q;
$function$;

CREATE OR REPLACE FUNCTION private.python_hub_registration_topic_credit_time_v1(p_registration_id uuid, p_topic_slug text)
 RETURNS timestamp with time zone
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_catalog'
AS $function$
  select max(q.evidence_completed_at)
  from (
    select ic.evidence_completed_at
    from public.python_hub_registration_members m
    join private.python_hub_identity_topic_credits ic
      on ic.student_identity_id=m.student_identity_id
     and ic.topic_slug=p_topic_slug
    where m.registration_id=p_registration_id

    union all

    select c.evidence_completed_at
    from public.python_hub_registration_members m
    join public.python_hub_student_topic_credits c
      on c.student_registry_id=m.student_registry_id
     and c.topic_slug=p_topic_slug
    where m.registration_id=p_registration_id
  ) q;
$function$;

CREATE OR REPLACE FUNCTION private.python_hub_member_progress_v29(p_identity_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'extensions', 'pg_catalog'
AS $function$
declare
  v_roster_id uuid;
  v_topics jsonb;
  v_correct integer:=0;
  v_total integer:=0;
  v_percent integer:=0;
begin
  select student_registry_id
  into v_roster_id
  from public.python_hub_student_identities
  where id=p_identity_id;

  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'slug',x.slug,
          'sequence',x.sequence_no,
          'title',x.title,
          'correct_count',x.effective_correct,
          'total_count',x.total_count,
          'percent',case when x.total_count=0 then 0 else round(100.0*x.effective_correct/x.total_count)::int end,
          'status',case
            when x.historical_credit then 'historical_credit'
            when x.total_count>0 and x.effective_correct>=x.total_count then 'completed'
            when x.effective_correct>0 then 'in_progress'
            else 'not_started'
          end,
          'historical_credit',x.historical_credit
        )
        order by x.sequence_no
      ),
      '[]'::jsonb
    ),
    coalesce(sum(x.effective_correct),0)::int,
    coalesce(sum(x.total_count),0)::int
  into v_topics,v_correct,v_total
  from (
    select y.*,
      case when y.historical_credit then y.total_count else y.response_correct end as effective_correct
    from (
      select
        t.slug,
        t.sequence_no,
        t.title,
        (
          select count(distinct r.item_key)::int
          from public.python_hub_workshop_responses r
          join public.python_hub_registration_members rm
            on rm.registration_id=r.registration_id
          where rm.student_identity_id=p_identity_id
            and r.topic_slug=t.slug
            and r.correct=true
        ) as response_correct,
        (
          select count(*)::int
          from public.python_hub_workshop_keys k
          where k.topic_slug=t.slug
        ) as total_count,
        (
          exists(
            select 1
            from private.python_hub_identity_topic_credits ic
            where ic.student_identity_id=p_identity_id
              and ic.topic_slug=t.slug
          )
          or
          (
            v_roster_id is not null
            and exists(
              select 1
              from public.python_hub_student_topic_credits c
              where c.student_registry_id=v_roster_id
                and c.topic_slug=t.slug
            )
          )
        ) as historical_credit
      from public.python_hub_topics t
      where t.published=true
    ) y
  ) x;

  v_percent:=case when v_total=0 then 0 else round(100.0*v_correct/v_total)::int end;

  return jsonb_build_object(
    'correct_count',v_correct,
    'total_count',v_total,
    'percent',v_percent,
    'topics',v_topics
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.python_hub_reconcile_team_session_v66(p_workshop_session_id uuid, p_reason text, p_finalize_if_complete boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_catalog'
AS $function$
declare
  v_session public.python_hub_workshop_sessions%rowtype;
  v_member_count integer;
  v_distinct_registration_count integer;
  v_null_registration_count integer;
  v_total integer:=0;
  v_owner_correct integer:=0;
  v_missing_members integer:=0;
  v_now timestamptz:=clock_timestamp();
  v_member record;
begin
  select *
  into v_session
  from public.python_hub_workshop_sessions
  where id=p_workshop_session_id
  for update;

  if v_session.id is null then
    raise exception 'Unknown workshop session';
  end if;

  select
    count(*)::int,
    count(distinct participant_registration_id)::int,
    count(*) filter (where participant_registration_id is null)::int
  into v_member_count,v_distinct_registration_count,v_null_registration_count
  from public.python_hub_workshop_session_members
  where workshop_session_id=v_session.id;

  if v_member_count<>v_session.team_size
     or v_distinct_registration_count<>v_session.team_size
     or v_null_registration_count<>0 then
    raise exception 'Workshop team integrity error: expected % complete members, found % (% distinct registrations, % missing registrations)',
      v_session.team_size,v_member_count,v_distinct_registration_count,v_null_registration_count;
  end if;

  if exists(
    select 1
    from public.python_hub_workshop_session_members sm
    join public.python_hub_registrations r
      on r.id=sm.participant_registration_id
    where sm.workshop_session_id=v_session.id
      and r.group_code<>v_session.group_code
  ) then
    raise exception 'Workshop team integrity error: participant group mismatch';
  end if;

  insert into public.python_hub_workshop_responses(
    registration_id,topic_slug,item_key,latest_answer,code_snapshot,
    try_count,correct,first_try_correct,first_answered_at,last_answered_at,completed_at
  )
  select
    sm.participant_registration_id,
    owner_r.topic_slug,
    owner_r.item_key,
    owner_r.latest_answer,
    owner_r.code_snapshot,
    greatest(owner_r.try_count,1),
    owner_r.correct,
    owner_r.first_try_correct,
    owner_r.first_answered_at,
    owner_r.last_answered_at,
    owner_r.completed_at
  from public.python_hub_workshop_session_members sm
  join public.python_hub_workshop_responses owner_r
    on owner_r.registration_id=v_session.registration_id
   and owner_r.topic_slug=v_session.topic_slug
  where sm.workshop_session_id=v_session.id
    and sm.participant_registration_id<>v_session.registration_id
  on conflict (registration_id,topic_slug,item_key) do update
  set latest_answer=excluded.latest_answer,
      code_snapshot=coalesce(excluded.code_snapshot,public.python_hub_workshop_responses.code_snapshot),
      try_count=greatest(public.python_hub_workshop_responses.try_count,excluded.try_count),
      correct=public.python_hub_workshop_responses.correct or excluded.correct,
      first_try_correct=coalesce(public.python_hub_workshop_responses.first_try_correct,excluded.first_try_correct),
      first_answered_at=case
        when public.python_hub_workshop_responses.first_answered_at is null then excluded.first_answered_at
        when excluded.first_answered_at is null then public.python_hub_workshop_responses.first_answered_at
        else least(public.python_hub_workshop_responses.first_answered_at,excluded.first_answered_at)
      end,
      last_answered_at=case
        when public.python_hub_workshop_responses.last_answered_at is null then excluded.last_answered_at
        when excluded.last_answered_at is null then public.python_hub_workshop_responses.last_answered_at
        else greatest(public.python_hub_workshop_responses.last_answered_at,excluded.last_answered_at)
      end,
      completed_at=case
        when public.python_hub_workshop_responses.correct or excluded.correct then
          case
            when public.python_hub_workshop_responses.completed_at is null then excluded.completed_at
            when excluded.completed_at is null then public.python_hub_workshop_responses.completed_at
            else least(public.python_hub_workshop_responses.completed_at,excluded.completed_at)
          end
        else public.python_hub_workshop_responses.completed_at
      end;

  insert into private.python_hub_team_sync_audit(
    workshop_session_id,participant_registration_id,owner_registration_id,
    topic_slug,item_key,last_reason,correct,sync_count,first_synced_at,last_synced_at
  )
  select
    v_session.id,
    sm.participant_registration_id,
    v_session.registration_id,
    owner_r.topic_slug,
    owner_r.item_key,
    left(coalesce(p_reason,'sync'),80),
    owner_r.correct,
    1,
    v_now,
    v_now
  from public.python_hub_workshop_session_members sm
  join public.python_hub_workshop_responses owner_r
    on owner_r.registration_id=v_session.registration_id
   and owner_r.topic_slug=v_session.topic_slug
  where sm.workshop_session_id=v_session.id
  on conflict (workshop_session_id,participant_registration_id,item_key) do update
  set last_reason=excluded.last_reason,
      correct=private.python_hub_team_sync_audit.correct or excluded.correct,
      sync_count=private.python_hub_team_sync_audit.sync_count+1,
      last_synced_at=v_now;

  for v_member in
    select distinct participant_registration_id
    from public.python_hub_workshop_session_members
    where workshop_session_id=v_session.id
      and participant_registration_id is not null
  loop
    perform private.python_hub_refresh_v1(v_member.participant_registration_id);
  end loop;

  select count(*)::int
  into v_total
  from public.python_hub_workshop_keys
  where topic_slug=v_session.topic_slug;

  select count(*)::int
  into v_owner_correct
  from public.python_hub_workshop_responses
  where registration_id=v_session.registration_id
    and topic_slug=v_session.topic_slug
    and correct=true;

  if p_finalize_if_complete and v_total>0 and v_owner_correct>=v_total then
    select count(*)::int
    into v_missing_members
    from public.python_hub_workshop_session_members sm
    where sm.workshop_session_id=v_session.id
      and (
        select count(*)::int
        from public.python_hub_workshop_responses r
        where r.registration_id=sm.participant_registration_id
          and r.topic_slug=v_session.topic_slug
          and r.correct=true
      ) < v_total;

    if v_missing_members<>0 then
      raise exception 'Workshop team consolidation failed: % member(s) do not have the complete response set',v_missing_members;
    end if;

    insert into private.python_hub_identity_topic_credits(
      student_identity_id,topic_slug,source_key,evidence_completed_at,evidence
    )
    select distinct
      sm.student_identity_id,
      v_session.topic_slug,
      'team_workshop_v66',
      v_now,
      jsonb_build_object(
        'workshop_session_id',v_session.id,
        'team_size',v_session.team_size,
        'owner_registration_id',v_session.registration_id,
        'completed_at',v_now
      )
    from public.python_hub_workshop_session_members sm
    where sm.workshop_session_id=v_session.id
      and sm.student_identity_id is not null
    on conflict (student_identity_id,topic_slug) do nothing;

    insert into public.python_hub_student_topic_credits(
      student_registry_id,topic_slug,source_key,evidence_completed_at,evidence
    )
    select distinct
      sm.student_registry_id,
      v_session.topic_slug,
      'team_workshop_v66',
      v_now,
      jsonb_build_object(
        'workshop_session_id',v_session.id,
        'team_size',v_session.team_size,
        'owner_registration_id',v_session.registration_id,
        'completed_at',v_now
      )
    from public.python_hub_workshop_session_members sm
    where sm.workshop_session_id=v_session.id
      and sm.student_registry_id is not null
    on conflict (student_registry_id,topic_slug) do nothing;

    for v_member in
      select distinct participant_registration_id
      from public.python_hub_workshop_session_members
      where workshop_session_id=v_session.id
        and participant_registration_id is not null
    loop
      perform private.python_hub_refresh_v1(v_member.participant_registration_id);
    end loop;

    update public.python_hub_workshop_sessions
    set status='completed',
        last_activity_at=v_now
    where id=v_session.id;
  else
    update public.python_hub_workshop_sessions
    set last_activity_at=v_now
    where id=v_session.id;
  end if;

  return jsonb_build_object(
    'workshop_session_id',v_session.id,
    'team_size',v_session.team_size,
    'member_count',v_member_count,
    'topic_slug',v_session.topic_slug,
    'total_items',v_total,
    'owner_correct_count',v_owner_correct,
    'complete',p_finalize_if_complete and v_total>0 and v_owner_correct>=v_total
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.python_hub_sync_team_response_v49()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_catalog'
AS $function$
declare
  v_session_id uuid;
begin
  if pg_trigger_depth()>1 then
    return new;
  end if;

  select s.id
  into v_session_id
  from public.python_hub_workshop_sessions s
  where s.registration_id=new.registration_id
    and s.topic_slug=new.topic_slug
    and s.status='active'
  order by s.started_at desc,s.id desc
  limit 1;

  if v_session_id is null then
    return new;
  end if;

  perform private.python_hub_reconcile_team_session_v66(
    v_session_id,
    'team_submit',
    true
  );

  return new;
end;
$function$;

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

  update public.python_hub_workshop_sessions
  set status='abandoned',
      last_activity_at=clock_timestamp()
  where registration_id=v_registration.id
    and topic_slug=trim(p_topic_slug)
    and status='active';

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
    'consolidation',v_reconcile
  );
end;
$function$;

revoke all on function public.python_hub_start_workshop_team_v3(uuid,text,text,jsonb,uuid,text) from public;
grant execute on function public.python_hub_start_workshop_team_v3(uuid,text,text,jsonb,uuid,text) to anon,authenticated;

-- Close stale or overlapping active sessions before reconciling current state.
update public.python_hub_workshop_sessions
set status='abandoned',last_activity_at=clock_timestamp()
where status='active'
  and last_activity_at<clock_timestamp()-interval '2 hours';

with overlapping as (
  select distinct older.id
  from public.python_hub_workshop_sessions older
  join public.python_hub_workshop_session_members om on om.workshop_session_id=older.id
  join public.python_hub_workshop_sessions newer
    on newer.status='active'
   and newer.topic_slug=older.topic_slug
   and (newer.started_at>older.started_at or (newer.started_at=older.started_at and newer.id::text>older.id::text))
  join public.python_hub_workshop_session_members nm
    on nm.workshop_session_id=newer.id
   and nm.participant_registration_id=om.participant_registration_id
  where older.status='active'
    and om.participant_registration_id is not null
)
update public.python_hub_workshop_sessions s
set status='abandoned',last_activity_at=clock_timestamp()
where s.id in (select id from overlapping);

-- Reconcile historical completed sessions without changing their completion semantics.
do $reconcile$
declare v_session record;
begin
  for v_session in
    select id from public.python_hub_workshop_sessions where status='completed' order by started_at,id
  loop
    perform private.python_hub_reconcile_team_session_v66(v_session.id,'historical_reconcile_v66',false);
  end loop;
end;
$reconcile$;

-- Durable completion credit for every identified participant, even when roster resolution is absent.
insert into private.python_hub_identity_topic_credits(
  student_identity_id,topic_slug,source_key,evidence_completed_at,evidence
)
select distinct
  sm.student_identity_id,s.topic_slug,'team_workshop_reconcile_v66',s.last_activity_at,
  jsonb_build_object(
    'workshop_session_id',s.id,
    'team_size',s.team_size,
    'owner_registration_id',s.registration_id,
    'historical_reconcile',true
  )
from public.python_hub_workshop_sessions s
join public.python_hub_workshop_session_members sm on sm.workshop_session_id=s.id
where s.status='completed' and sm.student_identity_id is not null
on conflict (student_identity_id,topic_slug) do nothing;

insert into public.python_hub_student_topic_credits(
  student_registry_id,topic_slug,source_key,evidence_completed_at,evidence
)
select distinct
  sm.student_registry_id,s.topic_slug,'team_workshop_reconcile_v66',s.last_activity_at,
  jsonb_build_object(
    'workshop_session_id',s.id,
    'team_size',s.team_size,
    'owner_registration_id',s.registration_id,
    'historical_reconcile',true
  )
from public.python_hub_workshop_sessions s
join public.python_hub_workshop_session_members sm on sm.workshop_session_id=s.id
where s.status='completed' and sm.student_registry_id is not null
on conflict (student_registry_id,topic_slug) do nothing;

-- Bring still-active classroom sessions onto the V66 invariant immediately.
do $active_reconcile$
declare v_session record;
begin
  for v_session in
    select id from public.python_hub_workshop_sessions where status='active' order by started_at,id
  loop
    perform private.python_hub_reconcile_team_session_v66(v_session.id,'active_reconcile_v66',true);
  end loop;
end;
$active_reconcile$;

do $refresh$
declare v_registration record;
begin
  for v_registration in
    select id from public.python_hub_registrations where status<>'disabled'
  loop
    perform private.python_hub_refresh_v1(v_registration.id);
  end loop;
end;
$refresh$;
