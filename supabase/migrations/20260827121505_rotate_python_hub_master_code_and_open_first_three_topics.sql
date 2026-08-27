begin;

-- Rotate the teacher master code. Only the SHA-256 hash is stored server-side.
update private.teacher_master_credentials
set code_hash='d8c4d37261d7aaa4bbafe4ccfe334e09fbe181c84de22e9a561dfe02b0958aa0',
    updated_at=clock_timestamp()
where singleton=true;

-- Invalidate every existing teacher code session so the new code takes effect immediately.
update public.teacher_code_sessions
set active=false
where active=true;

-- Open Topics 01-03 immediately after registration. Topic 04+ remains sequential.
create or replace function private.python_hub_refresh_v1(p_registration_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
begin
  insert into public.python_hub_topic_progress(registration_id,topic_slug,status,total_count)
  select p_registration_id,
         t.slug,
         case when t.sequence_no in (1,2,3) then 'available' else 'locked' end,
         (select count(*) from public.python_hub_workshop_keys k where k.topic_slug=t.slug)
  from public.python_hub_topics t
  where t.published=true
  on conflict (registration_id,topic_slug) do nothing;

  update public.python_hub_topic_progress p
  set total_count=(select count(*) from public.python_hub_workshop_keys k where k.topic_slug=p.topic_slug),
      correct_count=case
        when private.python_hub_registration_has_topic_credit_v1(p.registration_id,p.topic_slug)
          then (select count(*) from public.python_hub_workshop_keys k where k.topic_slug=p.topic_slug)
        else (select count(*) from public.python_hub_workshop_responses r where r.registration_id=p.registration_id and r.topic_slug=p.topic_slug and r.correct=true)
      end,
      percent=case
        when private.python_hub_registration_has_topic_credit_v1(p.registration_id,p.topic_slug) then 100
        when (select count(*) from public.python_hub_workshop_keys k where k.topic_slug=p.topic_slug)=0 then 0
        else round(
          100.0*(select count(*) from public.python_hub_workshop_responses r where r.registration_id=p.registration_id and r.topic_slug=p.topic_slug and r.correct=true)
          /(select count(*) from public.python_hub_workshop_keys k where k.topic_slug=p.topic_slug)
        )::int
      end,
      completion_source=case
        when private.python_hub_registration_has_topic_credit_v1(p.registration_id,p.topic_slug) then 'legacy_credit'
        else 'workshop'
      end,
      credit_source=case
        when private.python_hub_registration_has_topic_credit_v1(p.registration_id,p.topic_slug)
          then private.python_hub_registration_topic_credit_source_v1(p.registration_id,p.topic_slug)
        else null
      end,
      updated_at=clock_timestamp()
  where p.registration_id=p_registration_id;

  update public.python_hub_topic_progress p
  set status=case
      when p.completion_source='legacy_credit' then 'completed'
      when p.total_count>0 and p.correct_count>=p.total_count then 'completed'
      when t.sequence_no in (1,2,3) then case when p.correct_count>0 then 'in_progress' else 'available' end
      when exists (
        select 1
        from public.python_hub_topics prev
        join public.python_hub_topic_progress pp
          on pp.topic_slug=prev.slug and pp.registration_id=p.registration_id
        where prev.sequence_no=t.sequence_no-1 and pp.status='completed'
      ) then case when p.correct_count>0 then 'in_progress' else 'available' end
      else 'locked'
    end,
    started_at=case
      when p.started_at is not null then p.started_at
      when p.completion_source='legacy_credit' then coalesce(private.python_hub_registration_topic_credit_time_v1(p.registration_id,p.topic_slug),clock_timestamp())
      when p.correct_count>0 then clock_timestamp()
      else null
    end,
    completed_at=case
      when p.completion_source='legacy_credit' then coalesce(p.completed_at,private.python_hub_registration_topic_credit_time_v1(p.registration_id,p.topic_slug),clock_timestamp())
      when p.total_count>0 and p.correct_count>=p.total_count then coalesce(p.completed_at,clock_timestamp())
      else null
    end,
    updated_at=clock_timestamp()
  from public.python_hub_topics t
  where p.registration_id=p_registration_id and p.topic_slug=t.slug;

  update public.python_hub_registrations r
  set status=case when not exists (
      select 1
      from public.python_hub_topic_progress p
      where p.registration_id=r.id and p.status<>'completed'
    ) then 'completed' else 'active' end,
      last_activity_at=clock_timestamp()
  where r.id=p_registration_id and r.status<>'disabled';
end;
$$;

-- Refresh all existing registrations so Arrays becomes available immediately now as well.
do $$
declare
  rec record;
begin
  for rec in
    select id from public.python_hub_registrations where status<>'disabled'
  loop
    perform private.python_hub_refresh_v1(rec.id);
  end loop;
end;
$$;

commit;
