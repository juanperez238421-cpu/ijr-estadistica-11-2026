-- Run after the migration in a disposable Postgres database. Never awards real credit.
begin;
do $$
declare started jsonb; recorded jsonb; replay jsonb; member_count integer;
begin
 started:=public.seminar_workshop_team_start_v1('rico',array['qa.one@ijr.edu.co','qa.two@ijr.edu.co','qa.three@ijr.edu.co'],repeat('a',64));
 recorded:=public.seminar_workshop_team_progress_v1(repeat('a',64),1,'config',repeat('b',64),'QA success','00000000-0000-4000-8000-000000000001');
 if jsonb_array_length(recorded->'cells')<>1 then raise exception 'Shared cell missing'; end if;
 select count(*) into member_count from private.seminar_workshop_member_progress where project_key='rico' and class_no=1 and cell_id='config';
 if member_count<>3 then raise exception 'Expected three equal member records'; end if;
 replay:=public.seminar_workshop_team_progress_v1(repeat('a',64),1,'config',repeat('b',64),'QA retry','00000000-0000-4000-8000-000000000001');
 if (select count(*) from private.seminar_workshop_team_runs)<>1 then raise exception 'Retry duplicated'; end if;
 perform public.seminar_workshop_team_start_v1('rico',array['qa.two@ijr.edu.co'],repeat('c',64));
 recorded:=public.seminar_workshop_team_progress_v1(repeat('c',64),1);
 if jsonb_array_length(recorded->'cells')<>1 then raise exception 'Individual resume lost team progress'; end if;
 begin
  perform public.seminar_workshop_team_start_v1('rico',array['qa.one@ijr.edu.co','qa.one@ijr.edu.co'],repeat('d',64));
  raise exception 'Duplicate email was accepted';
 exception when others then if sqlerrm not like '%institutional_team_emails_required%' then raise; end if; end;
 begin
  perform public.seminar_workshop_team_start_v1('rico',array['qa@gmail.com'],repeat('d',64));
  raise exception 'External email was accepted';
 exception when others then if sqlerrm not like '%institutional_team_emails_required%' then raise; end if; end;
 begin
  perform public.seminar_workshop_team_progress_v1(repeat('a',64),1,'unknown',repeat('b',64),'','00000000-0000-4000-8000-000000000002');
  raise exception 'Unrecognized cell was accepted';
 exception when others then if sqlerrm not like '%invalid_workshop_cell%' then raise; end if; end;
 update private.seminar_workshop_teams set expires_at=now()-interval '1 second' where token_hash=repeat('a',64);
 begin
  perform public.seminar_workshop_team_progress_v1(repeat('a',64),1);
  raise exception 'Expired token was accepted';
 exception when others then if sqlerrm not like '%team_session_expired%' then raise; end if; end;
 if has_function_privilege('anon','public.seminar_workshop_team_start_v1(text,text[],text)','EXECUTE') then raise exception 'Public RPC privilege leak'; end if;
 if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='private' and c.relname in ('seminar_workshop_teams','seminar_workshop_member_progress','seminar_workshop_team_runs') and not c.relrowsecurity) then raise exception 'RLS missing'; end if;
end $$;
rollback;
