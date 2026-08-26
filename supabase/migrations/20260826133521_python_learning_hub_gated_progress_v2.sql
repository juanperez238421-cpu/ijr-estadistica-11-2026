create table if not exists public.python_hub_topics (
  slug text primary key,
  sequence_no smallint not null unique check (sequence_no between 1 and 8),
  title text not null,
  nav_title text not null,
  published boolean not null default true,
  workshop_item_count smallint not null default 6 check (workshop_item_count > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.python_hub_registrations (
  id uuid primary key default gen_random_uuid(),
  registration_mode text not null check (registration_mode in ('individual','team')),
  group_code text not null check (group_code in ('11A','11B','11C')),
  team_key_hash text not null,
  team_size smallint not null check (team_size between 1 and 3),
  display_label text not null,
  access_token_hash text not null,
  status text not null default 'active' check (status in ('active','completed','disabled')),
  last_session_id uuid,
  user_agent text,
  created_at timestamptz not null default clock_timestamp(),
  last_activity_at timestamptz not null default clock_timestamp(),
  unique (group_code, team_key_hash)
);

create table if not exists public.python_hub_registration_members (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.python_hub_registrations(id) on delete cascade,
  member_order smallint not null check (member_order between 1 and 3),
  institutional_email text not null,
  email_normalized text not null,
  display_name text not null,
  student_registry_id uuid references public.student_registry(id),
  created_at timestamptz not null default clock_timestamp(),
  unique (registration_id, member_order),
  unique (registration_id, email_normalized)
);

create table if not exists public.python_hub_topic_progress (
  registration_id uuid not null references public.python_hub_registrations(id) on delete cascade,
  topic_slug text not null references public.python_hub_topics(slug) on delete cascade,
  status text not null default 'locked' check (status in ('locked','available','in_progress','completed')),
  correct_count smallint not null default 0,
  total_count smallint not null default 0,
  percent smallint not null default 0 check (percent between 0 and 100),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default clock_timestamp(),
  primary key (registration_id, topic_slug)
);

create table if not exists public.python_hub_workshop_keys (
  topic_slug text not null references public.python_hub_topics(slug) on delete cascade,
  item_key text not null,
  sequence_no smallint not null check (sequence_no > 0),
  title text not null,
  mode text not null default 'code' check (mode in ('code','choice')),
  expected_text text not null,
  created_at timestamptz not null default clock_timestamp(),
  primary key (topic_slug, item_key),
  unique (topic_slug, sequence_no)
);

create table if not exists public.python_hub_workshop_responses (
  registration_id uuid not null references public.python_hub_registrations(id) on delete cascade,
  topic_slug text not null,
  item_key text not null,
  latest_answer text,
  code_snapshot text,
  try_count integer not null default 0 check (try_count >= 0),
  correct boolean not null default false,
  first_try_correct boolean,
  first_answered_at timestamptz,
  last_answered_at timestamptz,
  completed_at timestamptz,
  primary key (registration_id, topic_slug, item_key),
  foreign key (topic_slug, item_key) references public.python_hub_workshop_keys(topic_slug, item_key) on delete cascade
);

alter table public.python_hub_topics enable row level security;
alter table public.python_hub_registrations enable row level security;
alter table public.python_hub_registration_members enable row level security;
alter table public.python_hub_topic_progress enable row level security;
alter table public.python_hub_workshop_keys enable row level security;
alter table public.python_hub_workshop_responses enable row level security;

revoke all on public.python_hub_topics from anon, authenticated;
revoke all on public.python_hub_registrations from anon, authenticated;
revoke all on public.python_hub_registration_members from anon, authenticated;
revoke all on public.python_hub_topic_progress from anon, authenticated;
revoke all on public.python_hub_workshop_keys from anon, authenticated;
revoke all on public.python_hub_workshop_responses from anon, authenticated;

insert into public.python_hub_topics(slug,sequence_no,title,nav_title,published,workshop_item_count) values
('operations',1,'Colab interface and general operations','Interface & operations',true,6),
('types',2,'Variables and data types','Variable types',true,6),
('arrays',3,'Arrays and Python lists','Arrays / lists',true,6),
('logic',4,'Comparisons and logical operators','Comparisons & logic',true,6),
('conditions',5,'Conditions with if, elif and else','Conditions',true,6),
('loops',6,'Loops: repeat without copying code','Loops',true,6),
('functions',7,'Functions: name a reusable process','Functions',true,6),
('statistics',8,'Statistics with lists','Statistics with lists',true,6)
on conflict (slug) do update set sequence_no=excluded.sequence_no,title=excluded.title,nav_title=excluded.nav_title,published=excluded.published,workshop_item_count=excluded.workshop_item_count,updated_at=clock_timestamp();

insert into public.python_hub_workshop_keys(topic_slug,item_key,sequence_no,title,mode,expected_text) values
('operations','op-01',1,'Assignment + addition','code','25'),
('operations','op-02',2,'Order of operations','code','14'),
('operations','op-03',3,'Power','code','81'),
('operations','op-04',4,'Square root','code','9.0'),
('operations','op-05',5,'Operator meaning','choice','**'),
('operations','op-06',6,'Notebook workflow','choice','Run → inspect output → correct if needed'),
('types','type-01',1,'Integer type','code','int'),
('types','type-02',2,'Float type','code','float'),
('types','type-03',3,'String type','code','str'),
('types','type-04',4,'Boolean type','code','bool'),
('types','type-05',5,'Convert text to number','code','15'),
('types','type-06',6,'Missing value','code','NoneType'),
('arrays','arr-01',1,'Zero-based index','code','15'),
('arrays','arr-02',2,'Length','code','4'),
('arrays','arr-03',3,'Total','code','50'),
('arrays','arr-04',4,'Minimum and maximum','code',E'4\n21'),
('arrays','arr-05',5,'Append','code','[6, 12, 18]'),
('arrays','arr-06',6,'Mean from a list','code','12.5'),
('logic','logic-01',1,'Greater or equal','code','True'),
('logic','logic-02',2,'Equality','code','True'),
('logic','logic-03',3,'Different','code','True'),
('logic','logic-04',4,'AND','code','True'),
('logic','logic-05',5,'OR','code','True'),
('logic','logic-06',6,'Assignment vs comparison','choice','=='),
('conditions','cond-01',1,'Two branches','code','pass'),
('conditions','cond-02',2,'Three outcomes','code','close'),
('conditions','cond-03',3,'Text condition','code','lab'),
('conditions','cond-04',4,'Combined condition','code','enter'),
('conditions','cond-05',5,'Indentation','choice','The action executed when the condition is True'),
('conditions','cond-06',6,'Fallback','choice','else'),
('loops','loop-01',1,'Visit values','code',E'3\n6\n9'),
('loops','loop-02',2,'Accumulator','code','20'),
('loops','loop-03',3,'Counter','code','3'),
('loops','loop-04',4,'Range','code',E'0\n1\n2\n3'),
('loops','loop-05',5,'Loop purpose','choice','When the same process must be applied to each item'),
('loops','loop-06',6,'Accumulator placement','choice','Before the loop'),
('functions','fn-01',1,'Simple function','code','10'),
('functions','fn-02',2,'Return a mean','code','6.0'),
('functions','fn-03',3,'Reuse','code',E'9\n25'),
('functions','fn-04',4,'Two parameters','code','12'),
('functions','fn-05',5,'Return meaning','choice','Sends a result back to the caller'),
('functions','fn-06',6,'Function definition','choice','def'),
('statistics','stat-01',1,'Count and total','code',E'5\n50'),
('statistics','stat-02',2,'Mean','code','10.0'),
('statistics','stat-03',3,'Range','code','8'),
('statistics','stat-04',4,'Above the mean','code','2'),
('statistics','stat-05',5,'Summary function','code','(5.0, 6)'),
('statistics','stat-06',6,'Range meaning','choice','maximum - minimum')
on conflict (topic_slug,item_key) do update set sequence_no=excluded.sequence_no,title=excluded.title,mode=excluded.mode,expected_text=excluded.expected_text;

create or replace function private.python_hub_registration_v1(p_registration_id uuid, p_access_token text)
returns public.python_hub_registrations
language plpgsql
security definer
set search_path = public, extensions, pg_catalog
as $$
declare v_registration public.python_hub_registrations%rowtype;
begin
  select * into v_registration from public.python_hub_registrations r
  where r.id=p_registration_id and r.status in ('active','completed')
    and r.access_token_hash=encode(digest(coalesce(p_access_token,''),'sha256'),'hex');
  if v_registration.id is null then raise exception 'Invalid learning hub session'; end if;
  return v_registration;
end;
$$;

create or replace function private.python_hub_refresh_v1(p_registration_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.python_hub_topic_progress(registration_id,topic_slug,status,total_count)
  select p_registration_id,t.slug,case when t.sequence_no=1 then 'available' else 'locked' end,
         (select count(*) from public.python_hub_workshop_keys k where k.topic_slug=t.slug)
  from public.python_hub_topics t where t.published=true
  on conflict (registration_id,topic_slug) do nothing;

  update public.python_hub_topic_progress p
  set total_count=(select count(*) from public.python_hub_workshop_keys k where k.topic_slug=p.topic_slug),
      correct_count=(select count(*) from public.python_hub_workshop_responses r where r.registration_id=p.registration_id and r.topic_slug=p.topic_slug and r.correct=true),
      percent=case when (select count(*) from public.python_hub_workshop_keys k where k.topic_slug=p.topic_slug)=0 then 0 else round(100.0*(select count(*) from public.python_hub_workshop_responses r where r.registration_id=p.registration_id and r.topic_slug=p.topic_slug and r.correct=true)/(select count(*) from public.python_hub_workshop_keys k where k.topic_slug=p.topic_slug))::int end,
      updated_at=clock_timestamp()
  where p.registration_id=p_registration_id;

  update public.python_hub_topic_progress p
  set status=case
      when p.status='completed' then 'completed'
      when t.sequence_no=1 then case when p.correct_count>0 then 'in_progress' else 'available' end
      when exists (
        select 1 from public.python_hub_topics prev
        join public.python_hub_topic_progress pp on pp.topic_slug=prev.slug and pp.registration_id=p.registration_id
        where prev.sequence_no=t.sequence_no-1 and pp.status='completed'
      ) then case when p.correct_count>0 then 'in_progress' else 'available' end
      else 'locked'
    end,
    started_at=case when p.started_at is null and (t.sequence_no=1 or exists (
        select 1 from public.python_hub_topics prev
        join public.python_hub_topic_progress pp on pp.topic_slug=prev.slug and pp.registration_id=p.registration_id
        where prev.sequence_no=t.sequence_no-1 and pp.status='completed'
      )) then clock_timestamp() else p.started_at end,
    updated_at=clock_timestamp()
  from public.python_hub_topics t
  where p.registration_id=p_registration_id and p.topic_slug=t.slug;

  update public.python_hub_registrations r
  set status=case when not exists (
      select 1 from public.python_hub_topic_progress p where p.registration_id=r.id and p.status<>'completed'
    ) then 'completed' else 'active' end,
      last_activity_at=clock_timestamp()
  where r.id=p_registration_id and r.status<>'disabled';
end;
$$;

create or replace function public.python_hub_snapshot_v1(p_registration_id uuid, p_access_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_catalog
as $$
declare v_registration public.python_hub_registrations%rowtype;v_members jsonb;v_topics jsonb;v_current text;
begin
  v_registration:=private.python_hub_registration_v1(p_registration_id,p_access_token);
  perform private.python_hub_refresh_v1(v_registration.id);
  update public.python_hub_registrations set last_activity_at=clock_timestamp() where id=v_registration.id;
  select coalesce(jsonb_agg(jsonb_build_object('order',m.member_order,'email',m.institutional_email,'display_name',m.display_name) order by m.member_order),'[]'::jsonb)
    into v_members from public.python_hub_registration_members m where m.registration_id=v_registration.id;
  select coalesce(jsonb_agg(jsonb_build_object(
      'slug',t.slug,'sequence',t.sequence_no,'title',t.title,'nav',t.nav_title,
      'status',p.status,'correct_count',p.correct_count,'total_count',p.total_count,'percent',p.percent,
      'started_at',p.started_at,'completed_at',p.completed_at,
      'items',coalesce((select jsonb_agg(jsonb_build_object('key',k.item_key,'sequence',k.sequence_no,'title',k.title,'mode',k.mode,'correct',coalesce(r.correct,false),'tries',coalesce(r.try_count,0)) order by k.sequence_no)
        from public.python_hub_workshop_keys k left join public.python_hub_workshop_responses r on r.registration_id=v_registration.id and r.topic_slug=k.topic_slug and r.item_key=k.item_key where k.topic_slug=t.slug),'[]'::jsonb)
    ) order by t.sequence_no),'[]'::jsonb)
    into v_topics
  from public.python_hub_topics t join public.python_hub_topic_progress p on p.topic_slug=t.slug and p.registration_id=v_registration.id
  where t.published=true;
  select t.slug into v_current from public.python_hub_topics t join public.python_hub_topic_progress p on p.topic_slug=t.slug and p.registration_id=v_registration.id
  where t.published=true and p.status in ('available','in_progress') order by t.sequence_no limit 1;
  if v_current is null then select t.slug into v_current from public.python_hub_topics t join public.python_hub_topic_progress p on p.topic_slug=t.slug and p.registration_id=v_registration.id where p.status='completed' order by t.sequence_no desc limit 1; end if;
  return jsonb_build_object(
    'registration',jsonb_build_object('id',v_registration.id,'mode',v_registration.registration_mode,'group_code',v_registration.group_code,'team_size',v_registration.team_size,'display_label',v_registration.display_label,'status',(select status from public.python_hub_registrations where id=v_registration.id)),
    'members',v_members,'topics',v_topics,'current_topic',v_current,
    'completed_topics',(select count(*) from public.python_hub_topic_progress where registration_id=v_registration.id and status='completed'),
    'total_topics',(select count(*) from public.python_hub_topics where published=true)
  );
end;
$$;

create or replace function public.python_hub_register_v1(p_registration_mode text, p_group_code text, p_student_emails jsonb, p_session_id uuid, p_user_agent text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_catalog
as $$
declare
  v_mode text:=lower(trim(coalesce(p_registration_mode,'')));v_group text:=upper(trim(coalesce(p_group_code,'')));v_size integer;
  v_emails text[];v_email text;v_team_hash text;v_token text;v_registration public.python_hub_registrations%rowtype;
  v_label text;v_i integer;v_student_id uuid;v_display text;
begin
  if v_mode not in ('individual','team') then raise exception 'Select individual or team registration'; end if;
  if v_group not in ('11A','11B','11C') then raise exception 'Select a valid group'; end if;
  if p_student_emails is null or jsonb_typeof(p_student_emails)<>'array' then raise exception 'Provide institutional emails'; end if;
  v_size:=jsonb_array_length(p_student_emails);
  if (v_mode='individual' and v_size<>1) or (v_mode='team' and v_size not in (2,3)) then raise exception 'Individual registration uses 1 email; team registration uses 2 or 3'; end if;
  select array_agg(e order by e) into v_emails from (select lower(trim(value)) e from jsonb_array_elements_text(p_student_emails)) s;
  if (select count(*) from unnest(v_emails) e where length(e)<12 or e~'\s' or split_part(e,'@',1)='' or split_part(e,'@',2)<>'ijr.edu.co')>0 then raise exception 'Use valid @ijr.edu.co institutional emails'; end if;
  if (select count(*) from unnest(v_emails) e)<>(select count(distinct e) from unnest(v_emails) e) then raise exception 'Do not repeat an institutional email'; end if;
  v_team_hash:=encode(digest(v_group||'|'||array_to_string(v_emails,'|'),'sha256'),'hex');
  v_token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  v_label:=array_to_string(v_emails,' · ');
  select * into v_registration from public.python_hub_registrations where group_code=v_group and team_key_hash=v_team_hash for update;
  if v_registration.id is null then
    insert into public.python_hub_registrations(registration_mode,group_code,team_key_hash,team_size,display_label,access_token_hash,last_session_id,user_agent)
    values(v_mode,v_group,v_team_hash,v_size,v_label,encode(digest(v_token,'sha256'),'hex'),coalesce(p_session_id,gen_random_uuid()),p_user_agent)
    returning * into v_registration;
    for v_i in 1..v_size loop
      v_email:=v_emails[v_i];v_student_id:=null;v_display:=v_email;
      select a.student_registry_id,s.display_name into v_student_id,v_display
      from public.attempts a join public.student_registry s on s.id=a.student_registry_id and s.active=true
      where a.student_registry_id is not null and a.group_code=v_group and lower(trim(coalesce(a.student_email_normalized,a.student_email,'')))=v_email
      order by a.started_at desc limit 1;
      v_display:=coalesce(v_display,v_email);
      insert into public.python_hub_registration_members(registration_id,member_order,institutional_email,email_normalized,display_name,student_registry_id)
      values(v_registration.id,v_i,v_email,v_email,v_display,v_student_id);
    end loop;
  else
    update public.python_hub_registrations set registration_mode=v_mode,team_size=v_size,display_label=v_label,access_token_hash=encode(digest(v_token,'sha256'),'hex'),last_session_id=coalesce(p_session_id,gen_random_uuid()),user_agent=p_user_agent,last_activity_at=clock_timestamp(),status=case when status='disabled' then status else 'active' end where id=v_registration.id returning * into v_registration;
  end if;
  perform private.python_hub_refresh_v1(v_registration.id);
  return jsonb_build_object('registration_id',v_registration.id,'access_token',v_token,'snapshot',public.python_hub_snapshot_v1(v_registration.id,v_token));
end;
$$;

create or replace function public.python_hub_resume_v1(p_registration_id uuid,p_access_token text)
returns jsonb
language sql
security definer
set search_path = public, extensions, pg_catalog
as $$ select jsonb_build_object('snapshot',public.python_hub_snapshot_v1(p_registration_id,p_access_token)); $$;

create or replace function public.python_hub_submit_v1(p_registration_id uuid,p_access_token text,p_topic_slug text,p_item_key text,p_answer text,p_code_snapshot text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_catalog
as $$
declare
  v_registration public.python_hub_registrations%rowtype;v_progress public.python_hub_topic_progress%rowtype;v_key public.python_hub_workshop_keys%rowtype;
  v_existing public.python_hub_workshop_responses%rowtype;v_answer text;v_expected text;v_correct boolean;v_total integer;v_correct_count integer;
begin
  v_registration:=private.python_hub_registration_v1(p_registration_id,p_access_token);
  perform private.python_hub_refresh_v1(v_registration.id);
  select * into v_progress from public.python_hub_topic_progress where registration_id=v_registration.id and topic_slug=p_topic_slug for update;
  if v_progress.registration_id is null then raise exception 'Unknown topic'; end if;
  if v_progress.status='locked' then raise exception 'Complete the previous workshop first'; end if;
  select * into v_key from public.python_hub_workshop_keys where topic_slug=p_topic_slug and item_key=p_item_key;
  if v_key.item_key is null then raise exception 'Unknown workshop item'; end if;
  v_answer:=replace(replace(trim(coalesce(p_answer,'')),E'\r\n',E'\n'),E'\r',E'\n');
  v_expected:=replace(replace(trim(v_key.expected_text),E'\r\n',E'\n'),E'\r',E'\n');
  v_correct:=v_answer=v_expected;
  select * into v_existing from public.python_hub_workshop_responses where registration_id=v_registration.id and topic_slug=p_topic_slug and item_key=p_item_key for update;
  if v_existing.registration_id is null then
    insert into public.python_hub_workshop_responses(registration_id,topic_slug,item_key,latest_answer,code_snapshot,try_count,correct,first_try_correct,first_answered_at,last_answered_at,completed_at)
    values(v_registration.id,p_topic_slug,p_item_key,v_answer,left(coalesce(p_code_snapshot,''),12000),1,v_correct,v_correct,clock_timestamp(),clock_timestamp(),case when v_correct then clock_timestamp() else null end);
  else
    update public.python_hub_workshop_responses set latest_answer=v_answer,code_snapshot=left(coalesce(p_code_snapshot,code_snapshot),12000),try_count=try_count+1,correct=correct or v_correct,last_answered_at=clock_timestamp(),completed_at=case when correct or v_correct then coalesce(completed_at,clock_timestamp()) else null end where registration_id=v_registration.id and topic_slug=p_topic_slug and item_key=p_item_key;
  end if;
  select count(*) into v_total from public.python_hub_workshop_keys where topic_slug=p_topic_slug;
  select count(*) into v_correct_count from public.python_hub_workshop_responses where registration_id=v_registration.id and topic_slug=p_topic_slug and correct=true;
  update public.python_hub_topic_progress set correct_count=v_correct_count,total_count=v_total,percent=case when v_total=0 then 0 else round(100.0*v_correct_count/v_total)::int end,status=case when v_correct_count>=v_total and v_total>0 then 'completed' when v_correct_count>0 then 'in_progress' else status end,started_at=coalesce(started_at,clock_timestamp()),completed_at=case when v_correct_count>=v_total and v_total>0 then coalesce(completed_at,clock_timestamp()) else completed_at end,updated_at=clock_timestamp() where registration_id=v_registration.id and topic_slug=p_topic_slug;
  perform private.python_hub_refresh_v1(v_registration.id);
  return jsonb_build_object('correct',v_correct,'topic_completed',(select status='completed' from public.python_hub_topic_progress where registration_id=v_registration.id and topic_slug=p_topic_slug),'snapshot',public.python_hub_snapshot_v1(v_registration.id,p_access_token));
end;
$$;

create or replace function public.python_hub_teacher_dashboard_v1()
returns jsonb
language plpgsql
security definer
set search_path = public, private, auth, pg_catalog
as $$
begin
  if not private.is_teacher_aal2() then raise exception 'Teacher MFA session required'; end if;
  return jsonb_build_object(
    'generated_at',clock_timestamp(),
    'registrations',coalesce((select jsonb_agg(jsonb_build_object(
      'id',r.id,'mode',r.registration_mode,'group_code',r.group_code,'team_size',r.team_size,'display_label',r.display_label,'status',r.status,'created_at',r.created_at,'last_activity_at',r.last_activity_at,
      'members',coalesce((select jsonb_agg(jsonb_build_object('order',m.member_order,'email',m.institutional_email,'display_name',m.display_name) order by m.member_order) from public.python_hub_registration_members m where m.registration_id=r.id),'[]'::jsonb),
      'topics',coalesce((select jsonb_agg(jsonb_build_object('slug',t.slug,'sequence',t.sequence_no,'status',p.status,'percent',p.percent,'correct_count',p.correct_count,'total_count',p.total_count,'completed_at',p.completed_at) order by t.sequence_no) from public.python_hub_topics t join public.python_hub_topic_progress p on p.topic_slug=t.slug where p.registration_id=r.id),'[]'::jsonb)
    ) order by r.group_code,r.display_label) from public.python_hub_registrations r),'[]'::jsonb)
  );
end;
$$;

revoke all on function private.python_hub_registration_v1(uuid,text) from public, anon, authenticated;
revoke all on function private.python_hub_refresh_v1(uuid) from public, anon, authenticated;
revoke all on function public.python_hub_snapshot_v1(uuid,text) from public;
revoke all on function public.python_hub_register_v1(text,text,jsonb,uuid,text) from public;
revoke all on function public.python_hub_resume_v1(uuid,text) from public;
revoke all on function public.python_hub_submit_v1(uuid,text,text,text,text,text) from public;
revoke all on function public.python_hub_teacher_dashboard_v1() from public, anon;
grant execute on function public.python_hub_snapshot_v1(uuid,text) to anon, authenticated;
grant execute on function public.python_hub_register_v1(text,text,jsonb,uuid,text) to anon, authenticated;
grant execute on function public.python_hub_resume_v1(uuid,text) to anon, authenticated;
grant execute on function public.python_hub_submit_v1(uuid,text,text,text,text,text) to anon, authenticated;
grant execute on function public.python_hub_teacher_dashboard_v1() to authenticated;

create index if not exists python_hub_registrations_group_hash_idx on public.python_hub_registrations(group_code,team_key_hash);
create index if not exists python_hub_members_email_idx on public.python_hub_registration_members(email_normalized);
create index if not exists python_hub_progress_registration_idx on public.python_hub_topic_progress(registration_id,status);
create index if not exists python_hub_responses_registration_idx on public.python_hub_workshop_responses(registration_id,topic_slug,correct);

notify pgrst, 'reload schema';
