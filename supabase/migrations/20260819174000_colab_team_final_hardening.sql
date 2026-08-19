-- Colab Lab 01 V3 final hardening.
-- A roster student may have a historical individual V1/V2 attempt. That legacy record
-- must not prevent the student from joining the new 2–3 person workstation model.
-- Only membership in another V3 team blocks duplicate team registration.

create or replace function public.student_learning_activity_start_team(
  p_activity_slug text,
  p_student_names jsonb,
  p_group_code text,
  p_session_id uuid,
  p_user_agent text
)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
  v_activity public.learning_activities%rowtype;
  v_attempt public.learning_activity_attempts%rowtype;
  v_student public.student_registry%rowtype;
  v_group text;
  v_token text;
  v_team_key text;
  v_team_label text;
  v_size integer;
  v_i integer;
  v_display text;
  v_norm text;
  v_match_count integer;
  v_names text[] := array[]::text[];
  v_norms text[] := array[]::text[];
  v_all_roster boolean := true;
begin
  v_group := upper(trim(coalesce(p_group_code,'')));
  if v_group not in ('11A','11B','11C') then
    raise exception 'Select a valid group';
  end if;
  if p_student_names is null or jsonb_typeof(p_student_names) <> 'array' then
    raise exception 'Provide the team members';
  end if;

  v_size := jsonb_array_length(p_student_names);
  if v_size not in (2,3) then
    raise exception 'Each workstation must register 2 or 3 students';
  end if;

  select * into v_activity
  from public.learning_activities
  where slug=p_activity_slug and status='open';
  if v_activity.id is null then raise exception 'Activity is not open'; end if;

  for v_i in 0..v_size-1 loop
    v_display := trim(coalesce(p_student_names->>v_i,''));
    if length(v_display) < 2 then
      raise exception 'Write the complete name for every team member';
    end if;
    v_norm := public.normalize_student_name(v_display);
    if coalesce(length(v_norm),0)=0 then v_norm := lower(v_display); end if;
    if v_norm = any(v_norms) then
      raise exception 'Do not repeat the same name inside one team';
    end if;
    v_names := array_append(v_names,v_display);
    v_norms := array_append(v_norms,v_norm);
  end loop;

  select string_agg(n,'|' order by n) into v_team_key from unnest(v_norms) n;
  select string_agg(n,' · ' order by ord) into v_team_label
  from unnest(v_names) with ordinality as t(n,ord);

  select * into v_attempt
  from public.learning_activity_attempts
  where activity_id=v_activity.id
    and group_code=v_group
    and team_key=v_team_key
  order by started_at desc
  limit 1;

  v_token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');

  if v_attempt.id is null then
    insert into public.learning_activity_attempts(
      activity_id,student_registry_id,student_name_snapshot,student_name_normalized,
      is_roster_match,group_code,session_id,access_token_hash,user_agent,
      team_key,team_size,registration_mode
    ) values (
      v_activity.id,null,v_team_label,v_team_key,false,v_group,
      coalesce(p_session_id,gen_random_uuid()),encode(digest(v_token,'sha256'),'hex'),p_user_agent,
      v_team_key,v_size,'team'
    ) returning * into v_attempt;
  else
    update public.learning_activity_attempts
    set student_name_snapshot=v_team_label,
        student_name_normalized=v_team_key,
        access_token_hash=encode(digest(v_token,'sha256'),'hex'),
        last_activity_at=clock_timestamp(),
        user_agent=coalesce(p_user_agent,user_agent),
        team_size=v_size,
        registration_mode='team'
    where id=v_attempt.id
    returning * into v_attempt;
    delete from public.learning_activity_attempt_members where attempt_id=v_attempt.id;
  end if;

  for v_i in 1..v_size loop
    v_display := v_names[v_i];
    v_norm := v_norms[v_i];
    v_match_count := 0;

    select count(*) into v_match_count
    from public.student_registry s
    where s.active=true and s.group_code=v_group
      and (s.normalized_name=v_norm or (s.name_is_truncated and v_norm like s.normalized_name || '%'));

    if v_match_count=1 then
      select * into v_student
      from public.student_registry s
      where s.active=true and s.group_code=v_group
        and (s.normalized_name=v_norm or (s.name_is_truncated and v_norm like s.normalized_name || '%'))
      limit 1;

      if exists (
        select 1
        from public.learning_activity_attempt_members m
        join public.learning_activity_attempts other_attempt on other_attempt.id=m.attempt_id
        where m.activity_id=v_activity.id
          and m.student_registry_id=v_student.id
          and m.attempt_id<>v_attempt.id
          and coalesce(other_attempt.registration_mode,'individual')='team'
      ) then
        raise exception '% is already registered in another team for this activity', v_display;
      end if;
    else
      v_all_roster := false;
    end if;

    insert into public.learning_activity_attempt_members(
      attempt_id,activity_id,group_code,member_order,student_registry_id,
      display_name,normalized_name,is_roster_match
    ) values (
      v_attempt.id,v_activity.id,v_group,v_i,
      case when v_match_count=1 then v_student.id else null end,
      v_display,v_norm,(v_match_count=1)
    );
  end loop;

  update public.learning_activity_attempts
  set is_roster_match=v_all_roster
  where id=v_attempt.id
  returning * into v_attempt;

  insert into public.learning_activity_events(attempt_id,event_type,metadata)
  values(v_attempt.id,'TEAM_SESSION_STARTED',jsonb_build_object(
    'team_size',v_size,
    'group_code',v_group,
    'all_roster_matches',v_all_roster
  ));

  return jsonb_build_object(
    'attempt_id',v_attempt.id,
    'attempt_token',v_token,
    'identity_mode','team',
    'team_size',v_size,
    'snapshot',public.learning_activity_snapshot(v_attempt.id,v_token)
  );
end;
$$;

grant execute on function public.student_learning_activity_start_team(text,jsonb,text,uuid,text) to anon, authenticated;
notify pgrst, 'reload schema';
