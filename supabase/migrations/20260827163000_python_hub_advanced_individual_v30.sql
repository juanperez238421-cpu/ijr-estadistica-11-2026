create table if not exists private.python_hub_registration_policies (
  student_registry_id uuid primary key references public.student_registry(id) on delete cascade,
  institutional_email text not null unique,
  force_individual boolean not null default false,
  advanced boolean not null default false,
  note text,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint python_hub_registration_policies_email_ck check (split_part(lower(trim(institutional_email)),'@',2)='ijr.edu.co')
);
revoke all on table private.python_hub_registration_policies from public, anon, authenticated;

insert into private.python_hub_registration_policies(
  student_registry_id,institutional_email,force_individual,advanced,note,updated_at
)
select id,'jeronimo.rodriguez@ijr.edu.co',true,true,
       'Advanced student: individual registration only. Teacher-confirmed Operations, Types and Arrays topic credit.',clock_timestamp()
from public.student_registry
where active=true and group_code='11A' and upper(display_name)='RODRIGUEZ PEÑA JERONIMO'
on conflict (student_registry_id) do update
set institutional_email=excluded.institutional_email,
    force_individual=true,
    advanced=true,
    note=excluded.note,
    updated_at=clock_timestamp();

-- Teacher correction: Arrays historical topic credit belongs only to the named advanced student.
-- Raw Class 01 attempts/responses are intentionally preserved; only the migrated topic-credit flag is corrected.
delete from public.python_hub_student_topic_credits c
using public.student_registry s
where c.student_registry_id=s.id
  and c.topic_slug='arrays'
  and c.source_key='legacy_class01_arrays_2026_08_20'
  and not (s.group_code='11A' and upper(s.display_name)='RODRIGUEZ PEÑA JERONIMO');

update public.python_hub_student_topic_credits c
set source_key='teacher_confirmed_arrays_2026_08_27',
    evidence=coalesce(c.evidence,'{}'::jsonb)||jsonb_build_object(
      'teacher_confirmed',true,
      'confirmed_on','2026-08-27',
      'credit_scope','topic_only_not_current_stage_validation'
    )
from public.student_registry s
where c.student_registry_id=s.id
  and s.group_code='11A'
  and upper(s.display_name)='RODRIGUEZ PEÑA JERONIMO'
  and c.topic_slug='arrays';

create or replace function public.python_hub_register_v3(
  p_registration_mode text,
  p_group_code text,
  p_student_emails jsonb,
  p_session_id uuid,
  p_user_agent text
) returns jsonb
language plpgsql
security definer
set search_path='public','private','extensions','pg_catalog'
as $$
declare
  v_mode text := lower(trim(coalesce(p_registration_mode,'')));
  v_group text := upper(trim(coalesce(p_group_code,'')));
  v_size integer;
  v_emails text[];
  v_email text;
  v_team_hash text;
  v_token text;
  v_registration public.python_hub_registrations%rowtype;
  v_label text;
  v_i integer;
  v_student_id uuid;
  v_identity_id uuid;
  v_display text;
begin
  if v_mode not in ('individual','team') then raise exception 'Select individual or team registration'; end if;
  if v_group not in ('11A','11B','11C') then raise exception 'Select a valid group'; end if;
  if p_student_emails is null or jsonb_typeof(p_student_emails) <> 'array' then raise exception 'Provide institutional emails'; end if;

  v_size := jsonb_array_length(p_student_emails);
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

  if v_mode='team' and exists (
    select 1
    from private.python_hub_registration_policies p
    where p.force_individual=true
      and lower(trim(p.institutional_email))=any(v_emails)
  ) then
    raise exception 'This student is assigned to individual-only registration and cannot join a team registration.';
  end if;

  v_team_hash := encode(digest(v_group||'|'||array_to_string(v_emails,'|'),'sha256'),'hex');
  v_token := replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  v_label := array_to_string(v_emails,' · ');

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
    v_email := v_emails[v_i];
    v_student_id := null;
    v_display := v_email;

    select m.student_registry_id, s.display_name into v_student_id, v_display
    from public.learning_activity_attempt_members m
    join public.student_registry s on s.id=m.student_registry_id and s.active=true
    where m.student_registry_id is not null
      and m.is_roster_match=true
      and m.group_code=v_group
      and lower(trim(coalesce(m.email_normalized,m.institutional_email,'')))=v_email
    order by m.created_at desc
    limit 1;

    if v_student_id is null then
      select a.student_registry_id, s.display_name into v_student_id, v_display
      from public.attempts a
      join public.student_registry s on s.id=a.student_registry_id and s.active=true
      where a.student_registry_id is not null
        and a.group_code=v_group
        and lower(trim(coalesce(a.student_email_normalized,a.student_email,'')))=v_email
      order by a.started_at desc
      limit 1;
    end if;

    if v_mode='team' and v_student_id is not null and exists (
      select 1 from private.python_hub_registration_policies p
      where p.student_registry_id=v_student_id and p.force_individual=true
    ) then
      raise exception 'This student is assigned to individual-only registration and cannot join a team registration.';
    end if;

    v_display := coalesce(v_display,v_email);
    v_identity_id:=private.python_hub_ensure_student_identity_v29(v_email,v_display,v_student_id);

    insert into public.python_hub_registration_members(
      registration_id,member_order,institutional_email,email_normalized,display_name,student_registry_id,student_identity_id
    ) values(v_registration.id,v_i,v_email,v_email,v_display,v_student_id,v_identity_id);
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

create or replace function private.python_hub_teacher_master_payload_v2()
returns jsonb
language plpgsql
security definer
set search_path='public','private','pg_catalog'
as $$
declare
  v_payload jsonb;
  v_students jsonb;
begin
  v_payload:=private.python_hub_teacher_master_payload_v1();

  with base as (
    select value as student
    from jsonb_array_elements(coalesce(v_payload->'students','[]'::jsonb))
  )
  select coalesce(jsonb_agg(
    b.student || jsonb_build_object(
      'registrations',coalesce((
        select jsonb_agg(jsonb_build_object(
          'registration_id',r.id,
          'registration_mode',r.registration_mode,
          'team_size',r.team_size,
          'institutional_email',m.institutional_email,
          'status',r.status,
          'created_at',r.created_at,
          'last_activity_at',r.last_activity_at
        ) order by r.created_at desc)
        from public.python_hub_registration_members m
        join public.python_hub_registrations r on r.id=m.registration_id
        where m.student_registry_id=(b.student->>'student_registry_id')::uuid
      ),'[]'::jsonb),
      'topic_credits',coalesce((
        select jsonb_agg(jsonb_build_object(
          'topic_slug',c.topic_slug,
          'source_key',c.source_key,
          'completed_at',c.evidence_completed_at,
          'evidence',c.evidence
        ) order by t.sequence_no)
        from public.python_hub_student_topic_credits c
        join public.python_hub_topics t on t.slug=c.topic_slug
        where c.student_registry_id=(b.student->>'student_registry_id')::uuid
      ),'[]'::jsonb),
      'registration_policy',coalesce((
        select jsonb_build_object(
          'force_individual',p.force_individual,
          'advanced',p.advanced,
          'note',p.note
        )
        from private.python_hub_registration_policies p
        where p.student_registry_id=(b.student->>'student_registry_id')::uuid
      ),'null'::jsonb)
    )
    order by b.student->>'group_code',(b.student->>'source_position')::int
  ),'[]'::jsonb)
  into v_students
  from base b;

  return jsonb_set(v_payload,'{students}',v_students,true);
end;
$$;
revoke all on function private.python_hub_teacher_master_payload_v2() from public,anon,authenticated;

create or replace function public.python_hub_teacher_master_code_v1(p_teacher_token text)
returns jsonb
language plpgsql
security definer
set search_path='public','private','pg_catalog'
as $$
declare v_sid uuid;
begin
  v_sid:=public.teacher_code_session_id(p_teacher_token);
  if v_sid is null then raise exception 'Sesión docente inválida o expirada'; end if;
  insert into public.teacher_code_audit(teacher_session_id,action_type,metadata)
  values(v_sid,'PYTHON_HUB_MASTER_VIEW',jsonb_build_object('source','python/master','payload_version','v2'));
  return private.python_hub_teacher_master_payload_v2();
end;
$$;

do $$
declare r record;
begin
  for r in
    select distinct hr.id
    from public.python_hub_registrations hr
    join public.python_hub_registration_members m on m.registration_id=hr.id
    join public.student_registry s on s.id=m.student_registry_id
    where s.group_code='11A'
      and upper(s.display_name) in ('CUBIDES DASUKY DANIEL','MAZO LOPEZ JERONIMO','RODRIGUEZ PEÑA JERONIMO')
      and hr.status<>'disabled'
  loop
    perform private.python_hub_refresh_v1(r.id);
  end loop;
end $$;
