-- Recover validated work across registrations of the same individual identity.
-- Team snapshots remain scoped to the current team; no response rows are copied.
create or replace function private.python_hub_effective_responses_v69(p_registration_id uuid)
returns setof public.python_hub_workshop_responses
language sql stable security invoker
set search_path = ''
as $function$
  with target as (
    select r.id,
      case when r.registration_mode='individual'
        and (select count(*) from public.python_hub_registration_members m where m.registration_id=r.id)=1
        then (select m.student_identity_id from public.python_hub_registration_members m where m.registration_id=r.id limit 1)
      end as identity_id
    from public.python_hub_registrations r where r.id=p_registration_id
  ), sources as (
    select t.id as registration_id from target t
    union
    select m.registration_id from target t
      join public.python_hub_registration_members m on m.student_identity_id=t.identity_id
  )
  select distinct on (r.topic_slug,r.item_key) r.*
  from public.python_hub_workshop_responses r
  join sources s on s.registration_id=r.registration_id
  join public.python_hub_workshop_keys k on k.topic_slug=r.topic_slug and k.item_key=r.item_key
  order by r.topic_slug,r.item_key,r.correct desc,
    r.last_answered_at desc nulls last,r.try_count desc,r.registration_id;
$function$;
revoke all on function private.python_hub_effective_responses_v69(uuid) from public,anon,authenticated;

CREATE OR REPLACE FUNCTION private.python_hub_refresh_v1(p_registration_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_catalog'
AS $function$
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
        else (select count(*) from private.python_hub_effective_responses_v69(p.registration_id) r where r.topic_slug=p.topic_slug and r.correct=true)
      end,
      percent=case
        when private.python_hub_registration_has_topic_credit_v1(p.registration_id,p.topic_slug) then 100
        when (select count(*) from public.python_hub_workshop_keys k where k.topic_slug=p.topic_slug)=0 then 0
        else round(
          100.0*(select count(*) from private.python_hub_effective_responses_v69(p.registration_id) r where r.topic_slug=p.topic_slug and r.correct=true)
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
$function$;

CREATE OR REPLACE FUNCTION public.python_hub_snapshot_v1(p_registration_id uuid, p_access_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'extensions', 'pg_catalog'
AS $function$
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
          'correct',coalesce(r.correct,false),'tries',coalesce(r.try_count,0),
          'code_snapshot',r.code_snapshot,'latest_answer',r.latest_answer
        ) order by k.sequence_no)
        from public.python_hub_workshop_keys k
        left join private.python_hub_effective_responses_v69(v_registration.id) r
          on r.topic_slug=k.topic_slug and r.item_key=k.item_key
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
$function$;
