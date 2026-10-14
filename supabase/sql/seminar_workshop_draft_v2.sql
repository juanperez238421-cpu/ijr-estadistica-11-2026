create table if not exists private.seminar_workshop_drafts_v2 (
 workspace_key text primary key, project_key text not null,
 member_emails text[] not null, revision bigint not null default 0,
 state jsonb not null default '{"cells":{},"notes":{}}'::jsonb,
 updated_at timestamptz not null default now(),
 check (project_key in ('rico','cyber','cad','clients','gta')),
 check (octet_length(state::text)<=600000)
);
alter table private.seminar_workshop_drafts_v2 enable row level security;
revoke all on private.seminar_workshop_drafts_v2 from public,anon,authenticated;
grant select,insert,update on private.seminar_workshop_drafts_v2 to service_role;
create or replace function public.seminar_workshop_draft_v2(
 p_token_hash text,p_action text default 'load',p_state jsonb default null,p_revision bigint default null
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare t private.seminar_workshop_teams%rowtype; d private.seminar_workshop_drafts_v2%rowtype; k text; emails text[];
begin
 select * into t from private.seminar_workshop_teams where token_hash=p_token_hash and expires_at>now();
 if t.id is null then raise exception 'team_session_expired'; end if;
 select array_agg(e order by e) into emails from unnest(t.member_emails) e;
 k=t.project_key||':'||array_to_string(emails,',');
 if p_action not in ('load','save') then raise exception 'invalid_action'; end if;
 insert into private.seminar_workshop_drafts_v2(workspace_key,project_key,member_emails)
 values(k,t.project_key,emails) on conflict do nothing;
 select * into d from private.seminar_workshop_drafts_v2 where workspace_key=k for update;
 if p_action='save' then
  if p_revision is null or p_revision<>d.revision then
   return jsonb_build_object('conflict',true,'revision',d.revision,'updated_at',d.updated_at);
  end if;
  if jsonb_typeof(p_state)<>'object' or jsonb_typeof(p_state->'cells')<>'object'
   or jsonb_typeof(p_state->'notes')<>'object' or octet_length(p_state::text)>600000 then raise exception 'invalid_draft'; end if;
  update private.seminar_workshop_drafts_v2 set state=p_state,revision=revision+1,updated_at=now()
  where workspace_key=k returning * into d;
 end if;
 return jsonb_build_object('conflict',false,'revision',d.revision,'state',d.state,'updated_at',d.updated_at,'workspace_key',k);
end; $$;
revoke all on function public.seminar_workshop_draft_v2(text,text,jsonb,bigint) from public,anon,authenticated;
grant execute on function public.seminar_workshop_draft_v2(text,text,jsonb,bigint) to service_role;

CREATE OR REPLACE FUNCTION public.seminar_workshop_team_progress_v1(p_token_hash text, p_class_no integer, p_cell_id text DEFAULT NULL::text, p_code_hash text DEFAULT NULL::text, p_output text DEFAULT NULL::text, p_request_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_team private.seminar_workshop_teams%rowtype;
  v_cells jsonb := '{"rico":[["config","first","test","modify","student_build","student_check"],["implement","test","modify","student_build","student_check"],["implement","test","modify","student_build","student_check"],["test","fault","modify","student_build","student_check"]],"cyber":[["baseline","test","student_build","student_check"],["policy","test","student_build","student_check"],["export","test","student_build","student_check"],["test","export","student_build","student_check"]],"cad":[["params","test","student_build","student_check"],["mesh","test","modify","student_build","student_check"],["export","test","student_build","student_check"],["test","measurement","export","student_build","student_check"]],"clients":[["html","css","test","student_build","student_check"],["app","test","student_build","student_check"],["test","export","student_build","student_check"],["test","modify","student_build","student_check"]],"gta":[["html","css","test","student_build","student_check"],["app","test","student_build","student_check"],["test","export","student_build","student_check"],["test","modify","student_build","student_check"]]}';
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
$function$
