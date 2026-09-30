create table private.seminar_workshop_teams (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  project_key text not null check (project_key in ('rico','cyber','cad','clients','gta')),
  member_emails text[] not null check (cardinality(member_emails) between 1 and 3),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);
create table private.seminar_workshop_member_progress (
  email_normalized text not null,
  project_key text not null,
  class_no integer not null check (class_no between 1 and 4),
  cell_id text not null,
  team_id uuid not null references private.seminar_workshop_teams(id),
  code_hash text not null check (code_hash ~ '^[a-f0-9]{64}$'),
  output text not null default '',
  completed_at timestamptz not null default now(),
  primary key (email_normalized,project_key,class_no,cell_id)
);
create index seminar_workshop_member_team_idx on private.seminar_workshop_member_progress(team_id);
create table private.seminar_workshop_team_runs (
  id bigint generated always as identity primary key,
  team_id uuid not null references private.seminar_workshop_teams(id),
  request_id uuid not null,
  class_no integer not null,
  cell_id text not null,
  code_hash text not null,
  created_at timestamptz not null default now(),
  unique(team_id,request_id)
);
alter table private.seminar_workshop_teams enable row level security;
alter table private.seminar_workshop_member_progress enable row level security;
alter table private.seminar_workshop_team_runs enable row level security;
revoke all on private.seminar_workshop_teams,private.seminar_workshop_member_progress,private.seminar_workshop_team_runs from public,anon,authenticated;
grant usage on schema private to service_role;
grant all on private.seminar_workshop_teams,private.seminar_workshop_member_progress,private.seminar_workshop_team_runs to service_role;
grant usage,select on sequence private.seminar_workshop_team_runs_id_seq to service_role;

create function public.seminar_workshop_team_start_v1(p_project_key text,p_emails text[],p_token_hash text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_emails text[]; v_id uuid;
begin
  select array_agg(lower(btrim(e)) order by ord) into v_emails from unnest(p_emails) with ordinality t(e,ord);
  if cardinality(v_emails) is null or cardinality(v_emails) not between 1 and 3
     or exists(select 1 from unnest(v_emails) e where e is null or char_length(e)>254 or e !~ '^[^[:space:]@]+@ijr[.]edu[.]co$')
     or (select count(distinct e) from unnest(v_emails) e) <> cardinality(v_emails) then
    raise exception 'institutional_team_emails_required';
  end if;
  insert into private.seminar_workshop_teams(project_key,member_emails,token_hash)
  values(p_project_key,v_emails,p_token_hash) returning id into v_id;
  return jsonb_build_object('team_id',v_id,'member_emails',v_emails,'team_size',cardinality(v_emails));
end;
$$;

create function public.seminar_workshop_team_progress_v1(p_token_hash text,p_class_no integer,p_cell_id text default null,p_code_hash text default null,p_output text default null,p_request_id uuid default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_team private.seminar_workshop_teams%rowtype;
  v_cells jsonb := '{"rico":[["config","first","test","modify"],["implement","test","modify"],["implement","test","modify"],["test","fault","modify"]],"cyber":[["baseline","test"],["policy","test"],["export","test"],["test","export"]],"cad":[["params","test"],["mesh","test","modify"],["export","test"],["test","measurement","export"]],"clients":[["html","css","test"],["app","test"],["test","export"],["test","modify"]],"gta":[["html","css","test"],["app","test"],["test","export"],["test","modify"]]}';
  v_shared jsonb; v_counts jsonb; v_inserted bigint;
begin
  select * into v_team from private.seminar_workshop_teams where token_hash=p_token_hash and expires_at>now() for update;
  if v_team.id is null then raise exception 'team_session_expired'; end if;
  if p_class_no not between 1 and 4 or p_class_no is null then raise exception 'invalid_class'; end if;
  if p_cell_id is not null then
    if not (v_cells->v_team.project_key->(p_class_no-1) ? p_cell_id)
       or p_code_hash is null or p_code_hash !~ '^[a-f0-9]{64}$' or p_request_id is null then
      raise exception 'invalid_workshop_cell';
    end if;
    insert into private.seminar_workshop_team_runs(team_id,request_id,class_no,cell_id,code_hash)
    values(v_team.id,p_request_id,p_class_no,p_cell_id,p_code_hash)
    on conflict (team_id,request_id) do nothing returning id into v_inserted;
    if v_inserted is not null then
      insert into private.seminar_workshop_member_progress(email_normalized,project_key,class_no,cell_id,team_id,code_hash,output)
      select e,v_team.project_key,p_class_no,p_cell_id,v_team.id,p_code_hash,left(coalesce(p_output,''),4000)
      from unnest(v_team.member_emails) e order by e
      on conflict (email_normalized,project_key,class_no,cell_id) do update
      set team_id=excluded.team_id,code_hash=excluded.code_hash,output=excluded.output,completed_at=now();
    end if;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('class_no',class_no,'cell_id',cell_id) order by class_no,cell_id),'[]'::jsonb)
  into v_shared from (
    select class_no,cell_id from private.seminar_workshop_member_progress
    where project_key=v_team.project_key and email_normalized=any(v_team.member_emails)
    group by class_no,cell_id having count(*)=cardinality(v_team.member_emails)
  ) shared;
  select jsonb_agg(jsonb_build_object('email',e,'completed_cells',(
    select count(*) from private.seminar_workshop_member_progress p where p.email_normalized=e and p.project_key=v_team.project_key
  ))) into v_counts from unnest(v_team.member_emails) e;
  return jsonb_build_object('team_id',v_team.id,'project_key',v_team.project_key,'team_size',cardinality(v_team.member_emails),'member_emails',v_team.member_emails,'cells',v_shared,'members',v_counts,'expires_at',v_team.expires_at,'approval','practice_progress_only');
end;
$$;
revoke all on function public.seminar_workshop_team_start_v1(text,text[],text) from public,anon,authenticated;
revoke all on function public.seminar_workshop_team_progress_v1(text,integer,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.seminar_workshop_team_start_v1(text,text[],text) to service_role;
grant execute on function public.seminar_workshop_team_progress_v1(text,integer,text,text,text,uuid) to service_role;
