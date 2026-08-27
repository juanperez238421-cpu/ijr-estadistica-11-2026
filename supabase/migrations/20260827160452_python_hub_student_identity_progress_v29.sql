create table if not exists public.python_hub_student_identities (
  id uuid primary key default gen_random_uuid(),
  user_code text not null unique default ('ST11-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  institutional_email text not null unique,
  display_name text not null,
  student_registry_id uuid null references public.student_registry(id),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint python_hub_student_identities_email_check check (
    institutional_email = lower(trim(institutional_email))
    and split_part(institutional_email,'@',2)='ijr.edu.co'
  )
);

alter table public.python_hub_student_identities enable row level security;
revoke all on table public.python_hub_student_identities from anon, authenticated;

alter table public.python_hub_registration_members
  add column if not exists student_identity_id uuid;

insert into public.python_hub_student_identities(institutional_email,display_name,student_registry_id)
select
  m.email_normalized,
  coalesce(
    max(m.display_name) filter (where m.display_name is not null and m.display_name <> m.email_normalized),
    max(m.display_name),
    m.email_normalized
  ) as display_name,
  (min(m.student_registry_id::text) filter (where m.student_registry_id is not null))::uuid as student_registry_id
from public.python_hub_registration_members m
where m.email_normalized is not null
  and split_part(m.email_normalized,'@',2)='ijr.edu.co'
group by m.email_normalized
on conflict (institutional_email) do update
set display_name=case
      when public.python_hub_student_identities.display_name=public.python_hub_student_identities.institutional_email
       and excluded.display_name<>excluded.institutional_email
      then excluded.display_name
      else public.python_hub_student_identities.display_name
    end,
    student_registry_id=coalesce(public.python_hub_student_identities.student_registry_id,excluded.student_registry_id),
    updated_at=clock_timestamp();

update public.python_hub_registration_members m
set student_identity_id=i.id
from public.python_hub_student_identities i
where m.student_identity_id is null
  and i.institutional_email=m.email_normalized;

alter table public.python_hub_registration_members
  drop constraint if exists python_hub_registration_members_student_identity_id_fkey;
alter table public.python_hub_registration_members
  add constraint python_hub_registration_members_student_identity_id_fkey
  foreign key (student_identity_id) references public.python_hub_student_identities(id);

create index if not exists python_hub_registration_members_identity_idx
  on public.python_hub_registration_members(student_identity_id,registration_id);

create or replace function private.python_hub_ensure_student_identity_v29(
  p_email text,
  p_display_name text,
  p_student_registry_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path='public','private','extensions','pg_catalog'
as $$
declare
  v_email text:=lower(trim(coalesce(p_email,'')));
  v_id uuid;
  v_display text:=trim(coalesce(p_display_name,''));
begin
  if split_part(v_email,'@',2)<>'ijr.edu.co' then
    raise exception 'Use a valid @ijr.edu.co institutional email';
  end if;
  if v_display='' then v_display:=v_email; end if;

  select id into v_id
  from public.python_hub_student_identities
  where institutional_email=v_email
  for update;

  if v_id is null then
    insert into public.python_hub_student_identities(
      institutional_email,display_name,student_registry_id
    ) values(v_email,v_display,p_student_registry_id)
    returning id into v_id;
  else
    update public.python_hub_student_identities
    set display_name=case
          when display_name=institutional_email and v_display<>v_email then v_display
          else display_name
        end,
        student_registry_id=coalesce(student_registry_id,p_student_registry_id),
        updated_at=clock_timestamp()
    where id=v_id;
  end if;

  return v_id;
end;
$$;
revoke all on function private.python_hub_ensure_student_identity_v29(text,text,uuid) from public,anon,authenticated;

create or replace function private.python_hub_member_progress_v29(p_identity_id uuid)
returns jsonb
language plpgsql
security definer
set search_path='public','private','extensions','pg_catalog'
as $$
declare
  v_roster_id uuid;
  v_topics jsonb;
  v_correct integer:=0;
  v_total integer:=0;
  v_percent integer:=0;
begin
  select student_registry_id into v_roster_id
  from public.python_hub_student_identities
  where id=p_identity_id;

  select coalesce(jsonb_agg(jsonb_build_object(
      'slug',x.slug,
      'sequence',x.sequence_no,
      'title',x.title,
      'correct_count',x.correct_count,
      'total_count',x.total_count,
      'percent',case when x.total_count=0 then 0 else round(100.0*x.correct_count/x.total_count)::int end,
      'status',case
        when x.total_count>0 and x.correct_count>=x.total_count then 'completed'
        when x.correct_count>0 then 'in_progress'
        when x.historical_credit then 'historical_credit'
        else 'not_started'
      end,
      'historical_credit',x.historical_credit
    ) order by x.sequence_no),'[]'::jsonb),
    coalesce(sum(x.correct_count),0)::int,
    coalesce(sum(x.total_count),0)::int
  into v_topics,v_correct,v_total
  from (
    select t.slug,t.sequence_no,t.title,
      (select count(distinct r.item_key)::int
       from public.python_hub_workshop_responses r
       join public.python_hub_registration_members rm
         on rm.registration_id=r.registration_id
       where rm.student_identity_id=p_identity_id
         and r.topic_slug=t.slug
         and r.correct=true) as correct_count,
      (select count(*)::int from public.python_hub_workshop_keys k where k.topic_slug=t.slug) as total_count,
      case when v_roster_id is null then false else exists(
        select 1 from public.python_hub_student_topic_credits c
        where c.student_registry_id=v_roster_id and c.topic_slug=t.slug
      ) end as historical_credit
    from public.python_hub_topics t
    where t.published=true
  ) x;

  v_percent:=case when v_total=0 then 0 else round(100.0*v_correct/v_total)::int end;
  return jsonb_build_object(
    'correct_count',v_correct,
    'total_count',v_total,
    'percent',v_percent,
    'topics',v_topics
  );
end;
$$;
revoke all on function private.python_hub_member_progress_v29(uuid) from public,anon,authenticated;

create or replace function public.python_hub_register_v3(
  p_registration_mode text,
  p_group_code text,
  p_student_emails jsonb,
  p_session_id uuid,
  p_user_agent text
) returns jsonb
language plpgsql
security definer
set search_path='public','extensions','pg_catalog'
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

grant execute on function public.python_hub_register_v3(text,text,jsonb,uuid,text) to anon,authenticated;

create or replace function public.python_hub_snapshot_v1(p_registration_id uuid, p_access_token text)
returns jsonb
language plpgsql
security definer
set search_path='public','private','extensions','pg_catalog'
as $$
declare
  v_registration public.python_hub_registrations%rowtype;
  v_members jsonb;
  v_topics jsonb;
  v_current text;
begin
  v_registration:=private.python_hub_registration_v1(p_registration_id,p_access_token);
  perform private.python_hub_refresh_v1(v_registration.id);
  update public.python_hub_registrations set last_activity_at=clock_timestamp() where id=v_registration.id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'order',m.member_order,
    'user_id',i.user_code,
    'email',m.institutional_email,
    'display_name',m.display_name,
    'progress',private.python_hub_member_progress_v29(i.id)
  ) order by m.member_order),'[]'::jsonb)
  into v_members
  from public.python_hub_registration_members m
  join public.python_hub_student_identities i on i.id=m.student_identity_id
  where m.registration_id=v_registration.id;

  select coalesce(jsonb_agg(jsonb_build_object(
      'slug',t.slug,'sequence',t.sequence_no,'title',t.title,'nav',t.nav_title,
      'status',p.status,'correct_count',p.correct_count,'total_count',p.total_count,'percent',p.percent,
      'started_at',p.started_at,'completed_at',p.completed_at,
      'completion_source',p.completion_source,'credit_source',p.credit_source,
      'items',coalesce((
        select jsonb_agg(jsonb_build_object(
          'key',k.item_key,'sequence',k.sequence_no,'title',k.title,'mode',k.mode,
          'correct',coalesce(r.correct,false),'tries',coalesce(r.try_count,0)
        ) order by k.sequence_no)
        from public.python_hub_workshop_keys k
        left join public.python_hub_workshop_responses r
          on r.registration_id=v_registration.id and r.topic_slug=k.topic_slug and r.item_key=k.item_key
        where k.topic_slug=t.slug
      ),'[]'::jsonb)
    ) order by t.sequence_no),'[]'::jsonb)
  into v_topics
  from public.python_hub_topics t
  join public.python_hub_topic_progress p
    on p.topic_slug=t.slug and p.registration_id=v_registration.id
  where t.published=true;

  select t.slug into v_current
  from public.python_hub_topics t
  join public.python_hub_topic_progress p
    on p.topic_slug=t.slug and p.registration_id=v_registration.id
  where t.published=true and p.status in ('available','in_progress')
  order by case when t.sequence_no=1 then 99 else t.sequence_no end, t.sequence_no
  limit 1;

  if v_current is null then
    select t.slug into v_current
    from public.python_hub_topics t
    join public.python_hub_topic_progress p
      on p.topic_slug=t.slug and p.registration_id=v_registration.id
    where p.status='completed'
    order by t.sequence_no desc limit 1;
  end if;

  return jsonb_build_object(
    'registration',jsonb_build_object(
      'id',v_registration.id,
      'display_id','REG-'||upper(substr(replace(v_registration.id::text,'-',''),1,8)),
      'mode',v_registration.registration_mode,
      'group_code',v_registration.group_code,
      'team_size',v_registration.team_size,
      'display_label',v_registration.display_label,
      'status',(select status from public.python_hub_registrations where id=v_registration.id)
    ),
    'members',v_members,
    'topics',v_topics,
    'current_topic',v_current,
    'completed_topics',(select count(*) from public.python_hub_topic_progress where registration_id=v_registration.id and status='completed'),
    'total_topics',(select count(*) from public.python_hub_topics where published=true)
  );
end;
$$;

grant execute on function public.python_hub_snapshot_v1(uuid,text) to anon,authenticated;
