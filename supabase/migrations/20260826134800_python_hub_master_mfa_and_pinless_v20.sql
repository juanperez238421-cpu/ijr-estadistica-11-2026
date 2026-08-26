-- Python Learning Hub V20
-- Remove persistent student progress PINs from the active registration path,
-- improve roster matching, and expose an AAL2-only teacher progress snapshot.

create table if not exists private.python_hub_teacher_allowlist (
  email text primary key,
  active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  constraint python_hub_teacher_allowlist_email_chk
    check (email = lower(trim(email)) and position('@' in email) > 1)
);

revoke all on table private.python_hub_teacher_allowlist from public, anon, authenticated;

insert into private.python_hub_teacher_allowlist(email)
select distinct lower(trim(recipient_email))
from public.assessment_report_settings
where enabled = true and coalesce(trim(recipient_email),'') <> ''
on conflict (email) do update set active = true;

create or replace function private.python_hub_provision_teacher_profile()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth, pg_catalog
as $$
begin
  if new.email is not null and exists (
    select 1
    from private.python_hub_teacher_allowlist a
    where a.email = lower(trim(new.email)) and a.active = true
  ) then
    insert into public.profiles(auth_user_id, full_name, group_code, role, active)
    values (
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''), lower(trim(new.email))),
      null,
      'teacher',
      true
    )
    on conflict (auth_user_id) do update
      set role='teacher', active=true,
          full_name=coalesce(nullif(public.profiles.full_name,''),excluded.full_name);
  end if;
  return new;
end;
$$;

revoke all on function private.python_hub_provision_teacher_profile() from public, anon, authenticated;

drop trigger if exists python_hub_teacher_allowlist_profile on auth.users;
create trigger python_hub_teacher_allowlist_profile
after insert or update of email on auth.users
for each row execute function private.python_hub_provision_teacher_profile();

insert into public.profiles(auth_user_id, full_name, group_code, role, active)
select u.id,
       coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'),''), lower(trim(u.email))),
       null,'teacher',true
from auth.users u
join private.python_hub_teacher_allowlist a
  on a.email=lower(trim(u.email)) and a.active=true
on conflict (auth_user_id) do update set role='teacher',active=true;

alter table public.python_hub_registrations
  alter column progress_code_hash drop not null;

create or replace function public.python_hub_register_v3(
  p_registration_mode text,
  p_group_code text,
  p_student_emails jsonb,
  p_session_id uuid,
  p_user_agent text
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

  if (select count(*) from unnest(v_emails) e
      where length(e)<12 or e~'\s' or split_part(e,'@',1)='' or split_part(e,'@',2)<>'ijr.edu.co')>0 then
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

  if v_registration.id is not null then
    if v_registration.status='disabled' then raise exception 'This learning registration is disabled'; end if;
    raise exception 'This learning path already exists. This browser should resume it automatically. On a different device, ask the teacher to recover access from the secure master page.';
  end if;

  insert into public.python_hub_registrations(
    registration_mode,group_code,team_key_hash,team_size,display_label,
    access_token_hash,progress_code_hash,last_session_id,user_agent
  ) values(
    v_mode,v_group,v_team_hash,v_size,v_label,
    encode(digest(v_token,'sha256'),'hex'),null,
    coalesce(p_session_id,gen_random_uuid()),p_user_agent
  ) returning * into v_registration;

  for v_i in 1..v_size loop
    v_email:=v_emails[v_i];
    v_student_id:=null;
    v_display:=v_email;

    select m.student_registry_id,s.display_name into v_student_id,v_display
    from public.learning_activity_attempt_members m
    join public.student_registry s on s.id=m.student_registry_id and s.active=true
    where m.student_registry_id is not null
      and m.is_roster_match=true
      and m.group_code=v_group
      and lower(trim(coalesce(m.email_normalized,m.institutional_email,'')))=v_email
    order by m.created_at desc
    limit 1;

    if v_student_id is null then
      select a.student_registry_id,s.display_name into v_student_id,v_display
      from public.attempts a
      join public.student_registry s on s.id=a.student_registry_id and s.active=true
      where a.student_registry_id is not null
        and a.group_code=v_group
        and lower(trim(coalesce(a.student_email_normalized,a.student_email,'')))=v_email
      order by a.started_at desc
      limit 1;
    end if;

    v_display:=coalesce(v_display,v_email);
    insert into public.python_hub_registration_members(
      registration_id,member_order,institutional_email,email_normalized,display_name,student_registry_id
    ) values(v_registration.id,v_i,v_email,v_email,v_display,v_student_id);
  end loop;

  perform private.python_hub_refresh_v1(v_registration.id);
  return jsonb_build_object(
    'registration_id',v_registration.id,
    'access_token',v_token,
    'new_registration',true,
    'snapshot',public.python_hub_snapshot_v1(v_registration.id,v_token)
  );
end;
$$;

grant execute on function public.python_hub_register_v3(text,text,jsonb,uuid,text) to anon, authenticated;

create or replace function public.python_hub_teacher_master_v2()
returns jsonb
language plpgsql
security definer
set search_path = public, private, auth, pg_catalog
as $$
declare
  v_activity_id uuid;
begin
  if not private.is_teacher_aal2() then raise exception 'Teacher MFA session required'; end if;

  select id into v_activity_id
  from public.learning_activities
  where slug='statistics11-colab-class1-basics-types-arrays-2026'
  limit 1;

  return jsonb_build_object(
    'generated_at',clock_timestamp(),
    'summary_by_group',coalesce((
      with type_cp as (
        select id from public.learning_activity_checkpoints
        where activity_id=v_activity_id and checkpoint_key in ('A3','A4','A5')
      ), per_attempt as (
        select a.id attempt_id,
               count(*) filter (where r.correct and r.completed) correct_count
        from public.learning_activity_attempts a
        cross join type_cp c
        left join public.learning_activity_responses r on r.attempt_id=a.id and r.checkpoint_id=c.id
        where a.activity_id=v_activity_id
        group by a.id
      ), best as (
        select m.student_registry_id,max(pa.correct_count) best_correct
        from public.learning_activity_attempt_members m
        join per_attempt pa on pa.attempt_id=m.attempt_id
        where m.is_roster_match=true and m.student_registry_id is not null
        group by m.student_registry_id
      )
      select jsonb_agg(jsonb_build_object(
        'group_code',g.group_code,
        'roster_students',g.roster_students,
        'hub_registered_students',g.hub_registered_students,
        'legacy_types_complete',g.legacy_types_complete,
        'hub_types_complete',g.hub_types_complete
      ) order by g.group_code)
      from (
        select sr.group_code,
               count(*) roster_students,
               count(*) filter (where exists (
                 select 1 from public.python_hub_registration_members hm
                 join public.python_hub_registrations hr on hr.id=hm.registration_id and hr.status<>'disabled'
                 where hm.student_registry_id=sr.id
               )) hub_registered_students,
               count(*) filter (where coalesce(b.best_correct,0)=3) legacy_types_complete,
               count(*) filter (where exists (
                 select 1 from public.python_hub_registration_members hm
                 join public.python_hub_topic_progress hp on hp.registration_id=hm.registration_id
                    and hp.topic_slug='types' and hp.status='completed'
                 where hm.student_registry_id=sr.id
               )) hub_types_complete
        from public.student_registry sr
        left join best b on b.student_registry_id=sr.id
        where sr.active=true and sr.group_code in ('11A','11B','11C')
        group by sr.group_code
      ) g
    ),'[]'::jsonb),
    'students',coalesce((
      with type_cp as (
        select id from public.learning_activity_checkpoints
        where activity_id=v_activity_id and checkpoint_key in ('A3','A4','A5')
      ), per_attempt as (
        select a.id attempt_id,
               count(*) filter (where r.correct and r.completed) correct_count,
               count(*) filter (where r.completed) completed_count,
               max(a.last_activity_at) last_activity_at
        from public.learning_activity_attempts a
        cross join type_cp c
        left join public.learning_activity_responses r on r.attempt_id=a.id and r.checkpoint_id=c.id
        where a.activity_id=v_activity_id
        group by a.id
      ), best as (
        select m.student_registry_id,max(pa.correct_count) best_correct,
               max(pa.completed_count) best_completed,max(pa.last_activity_at) last_activity_at
        from public.learning_activity_attempt_members m
        join per_attempt pa on pa.attempt_id=m.attempt_id
        where m.is_roster_match=true and m.student_registry_id is not null
        group by m.student_registry_id
      )
      select jsonb_agg(jsonb_build_object(
        'student_registry_id',sr.id,
        'group_code',sr.group_code,
        'source_position',sr.source_position,
        'display_name',sr.display_name,
        'legacy_types',jsonb_build_object(
          'correct_count',coalesce(b.best_correct,0),
          'completed_count',coalesce(b.best_completed,0),
          'status',case when coalesce(b.best_correct,0)=3 then 'completed'
                        when coalesce(b.best_completed,0)>0 then 'partial' else 'none' end,
          'last_activity_at',b.last_activity_at
        ),
        'hub',coalesce((
          select jsonb_build_object(
            'registration_id',hr.id,
            'registration_mode',hr.registration_mode,
            'team_size',hr.team_size,
            'display_label',hr.display_label,
            'institutional_email',hm.institutional_email,
            'last_activity_at',hr.last_activity_at,
            'topics',coalesce((
              select jsonb_agg(jsonb_build_object(
                'slug',ht.slug,'sequence',ht.sequence_no,'status',hp.status,
                'percent',hp.percent,'correct_count',hp.correct_count,'total_count',hp.total_count,
                'completed_at',hp.completed_at
              ) order by ht.sequence_no)
              from public.python_hub_topics ht
              join public.python_hub_topic_progress hp
                on hp.topic_slug=ht.slug and hp.registration_id=hr.id
            ),'[]'::jsonb)
          )
          from public.python_hub_registration_members hm
          join public.python_hub_registrations hr on hr.id=hm.registration_id and hr.status<>'disabled'
          where hm.student_registry_id=sr.id
          order by hr.last_activity_at desc
          limit 1
        ),'null'::jsonb)
      ) order by sr.group_code,sr.source_position)
      from public.student_registry sr
      left join best b on b.student_registry_id=sr.id
      where sr.active=true and sr.group_code in ('11A','11B','11C')
    ),'[]'::jsonb),
    'hub_registrations',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',r.id,'mode',r.registration_mode,'group_code',r.group_code,'team_size',r.team_size,
        'display_label',r.display_label,'status',r.status,'created_at',r.created_at,
        'last_activity_at',r.last_activity_at,
        'members',coalesce((select jsonb_agg(jsonb_build_object(
          'order',m.member_order,'email',m.institutional_email,'display_name',m.display_name,
          'student_registry_id',m.student_registry_id
        ) order by m.member_order) from public.python_hub_registration_members m where m.registration_id=r.id),'[]'::jsonb),
        'topics',coalesce((select jsonb_agg(jsonb_build_object(
          'slug',t.slug,'sequence',t.sequence_no,'status',p.status,'percent',p.percent,
          'correct_count',p.correct_count,'total_count',p.total_count,'completed_at',p.completed_at
        ) order by t.sequence_no)
        from public.python_hub_topics t
        join public.python_hub_topic_progress p on p.topic_slug=t.slug
        where p.registration_id=r.id),'[]'::jsonb)
      ) order by r.group_code,r.last_activity_at desc)
      from public.python_hub_registrations r
    ),'[]'::jsonb),
    'identity_review',coalesce((
      with type_cp as (
        select id from public.learning_activity_checkpoints
        where activity_id=v_activity_id and checkpoint_key in ('A3','A4','A5')
      ), per_attempt as (
        select a.id attempt_id,a.group_code,
               count(*) filter (where r.correct and r.completed) correct_count,
               max(a.last_activity_at) last_activity_at
        from public.learning_activity_attempts a
        cross join type_cp c
        left join public.learning_activity_responses r on r.attempt_id=a.id and r.checkpoint_id=c.id
        where a.activity_id=v_activity_id
        group by a.id,a.group_code
      )
      select jsonb_agg(distinct jsonb_build_object(
        'group_code',pa.group_code,'display_name',m.display_name,
        'institutional_email',m.institutional_email,
        'legacy_types_correct',pa.correct_count,'last_activity_at',pa.last_activity_at
      ))
      from public.learning_activity_attempt_members m
      join per_attempt pa on pa.attempt_id=m.attempt_id
      where pa.correct_count=3 and (m.is_roster_match=false or m.student_registry_id is null)
    ),'[]'::jsonb)
  );
end;
$$;

revoke all on function public.python_hub_teacher_master_v2() from public, anon;
grant execute on function public.python_hub_teacher_master_v2() to authenticated;
