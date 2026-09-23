begin;

-- Statistics 11 · Python Learning Hub
-- Release the Libraries/XLSX/Pandas topic even when Arrays is not yet complete.
-- The legacy backend slug "logic" is the current "Python Libraries → XLSX Files → Pandas" topic.
-- Topics after Libraries keep the existing sequential release rule.

do $$
begin
  if not exists (
    select 1
    from public.python_hub_topics
    where slug = 'logic'
      and published = true
  ) then
    raise exception 'Libraries unlock migration aborted: published topic slug logic was not found';
  end if;
end;
$$;

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
         case
           when t.sequence_no in (1,2,3) or t.slug = 'logic' then 'available'
           else 'locked'
         end,
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
      when t.sequence_no in (1,2,3) or t.slug = 'logic'
        then case when p.correct_count>0 then 'in_progress' else 'available' end
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

-- Apply the new release rule immediately to all current student registrations.
do $$
declare
  rec record;
begin
  for rec in
    select id
    from public.python_hub_registrations
    where status <> 'disabled'
  loop
    perform private.python_hub_refresh_v1(rec.id);
  end loop;
end;
$$;

-- Deployment guard: no active registration may still see Libraries as locked.
do $$
begin
  if exists (
    select 1
    from public.python_hub_topic_progress p
    join public.python_hub_registrations r on r.id = p.registration_id
    where p.topic_slug = 'logic'
      and r.status <> 'disabled'
      and p.status = 'locked'
  ) then
    raise exception 'Libraries unlock migration failed: at least one active registration remains locked';
  end if;
end;
$$;

notify pgrst, 'reload schema';

commit;
