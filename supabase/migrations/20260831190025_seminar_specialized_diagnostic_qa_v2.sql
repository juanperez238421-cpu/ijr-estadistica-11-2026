-- Seminar 11 Specialized Learning Hubs: QA-hardened diagnostic bank v2
-- Preserves v1 for historical attempts, balances correct-option positions,
-- fixes self-profile scaling to 0/25/50/75/100, and strengthens bank constraints.

create unique index if not exists seminar_track_diag_bank_position_uq
  on public.seminar_track_diagnostic_questions(track_slug, bank_version, position);

do $$
begin
  if exists (
    select 1
    from public.seminar_track_diagnostic_questions q
    where q.bank_version='2026-08-31-v1'
      and q.scored
      and jsonb_array_length(q.options) <> 4
  ) then
    raise exception 'v1_scored_question_option_count_must_be_four';
  end if;
end $$;

insert into public.seminar_track_diagnostic_questions
  (id, track_slug, position, bank_version, domain, kind, prompt, options, correct_option, scored)
select
  q.track_slug || '-v2-q' || lpad(q.position::text,2,'0') as id,
  q.track_slug,
  q.position,
  '2026-08-31-v2' as bank_version,
  q.domain,
  q.kind,
  q.prompt,
  case
    when q.scored then (
      select jsonb_agg(
        q.options -> (((g.i - ((q.position - 1) % 4) + q.correct_option + 4) % 4))
        order by g.i
      )
      from generate_series(0,3) as g(i)
    )
    else q.options
  end as options,
  case when q.scored then ((q.position - 1) % 4)::smallint else null end as correct_option,
  q.scored
from public.seminar_track_diagnostic_questions q
where q.bank_version='2026-08-31-v1'
on conflict (id) do update set
  track_slug=excluded.track_slug,
  position=excluded.position,
  bank_version=excluded.bank_version,
  domain=excluded.domain,
  kind=excluded.kind,
  prompt=excluded.prompt,
  options=excluded.options,
  correct_option=excluded.correct_option,
  scored=excluded.scored;

alter table public.seminar_track_diagnostic_questions
  drop constraint if exists seminar_track_diag_correct_option_valid;
alter table public.seminar_track_diagnostic_questions
  add constraint seminar_track_diag_correct_option_valid
  check (
    (scored and correct_option is not null and correct_option between 0 and jsonb_array_length(options)-1)
    or
    (not scored and correct_option is null)
  ) not valid;
alter table public.seminar_track_diagnostic_questions
  validate constraint seminar_track_diag_correct_option_valid;

create or replace function public.seminar_track_diagnostic_get_questions(p_track_slug text, p_bank_version text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_track text := lower(trim(coalesce(p_track_slug,'')));
  v_version text := trim(coalesce(p_bank_version,''));
  v_questions jsonb;
begin
  if v_track not in ('web','data-science','cybersecurity','3d-programming','robotics') then
    raise exception 'invalid_track';
  end if;
  if v_version not in ('2026-08-31-v1','2026-08-31-v2') then
    raise exception 'invalid_bank_version';
  end if;
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id',q.id,'position',q.position,'domain',q.domain,'kind',q.kind,
        'prompt',q.prompt,'options',q.options,'scored',q.scored
      ) order by q.position
    ),'[]'::jsonb
  )
  into v_questions
  from public.seminar_track_diagnostic_questions q
  where q.track_slug=v_track and q.bank_version=v_version;
  if jsonb_array_length(v_questions) <> 15 then
    raise exception 'question_bank_incomplete';
  end if;
  return v_questions;
end;
$$;

create or replace function public.seminar_track_diagnostic_start(
  p_track_slug text,
  p_bank_version text,
  p_full_name text,
  p_group_code text,
  p_attempt_token text,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_track text := lower(trim(coalesce(p_track_slug,'')));
  v_version text := trim(coalesce(p_bank_version,''));
  v_name text := regexp_replace(trim(coalesce(p_full_name,'')), '\s+', ' ', 'g');
  v_group text := upper(trim(coalesce(p_group_code,'')));
  v_token text := trim(coalesce(p_attempt_token,''));
  v_id uuid;
  v_started timestamptz;
begin
  if v_track not in ('web','data-science','cybersecurity','3d-programming','robotics') then
    raise exception 'invalid_track';
  end if;
  if v_version not in ('2026-08-31-v1','2026-08-31-v2') then
    raise exception 'invalid_bank_version';
  end if;
  if char_length(v_name) < 3 or char_length(v_name) > 120 then raise exception 'invalid_name'; end if;
  if v_group not in ('11-A','11-B','11-C') then raise exception 'invalid_group'; end if;
  if char_length(v_token) < 32 or char_length(v_token) > 200 then raise exception 'invalid_token'; end if;
  if (select count(*) from public.seminar_track_diagnostic_questions q where q.track_slug=v_track and q.bank_version=v_version) <> 15 then
    raise exception 'question_bank_incomplete';
  end if;
  insert into public.seminar_track_diagnostic_attempts
    (track_slug,bank_version,full_name,group_code,access_token_hash,user_agent)
  values
    (v_track,v_version,v_name,v_group,encode(extensions.digest(v_token,'sha256'),'hex'),left(coalesce(p_user_agent,''),500))
  returning id,started_at into v_id,v_started;
  insert into public.seminar_track_diagnostic_events(attempt_id,event_type,payload)
  values (v_id,'STARTED',jsonb_build_object('track_slug',v_track,'bank_version',v_version));
  return jsonb_build_object(
    'attempt_id',v_id,'track_slug',v_track,'bank_version',v_version,
    'full_name',v_name,'group_code',v_group,'started_at',v_started,'status','in_progress'
  );
end;
$$;

create or replace function public.seminar_track_diagnostic_submit(p_attempt_id uuid, p_attempt_token text, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.seminar_track_diagnostic_attempts%rowtype;
  v_total integer;
  v_answered integer;
  v_score integer;
  v_max integer;
  v_percent numeric(5,1);
  v_confidence numeric(5,1);
  v_level text;
  v_domain_scores jsonb;
begin
  if jsonb_typeof(p_answers) <> 'object' then raise exception 'answers_must_be_object'; end if;
  if octet_length(p_answers::text) > 20000 then raise exception 'answers_too_large'; end if;
  select * into a
  from public.seminar_track_diagnostic_attempts x
  where x.id=p_attempt_id
    and x.access_token_hash=encode(extensions.digest(trim(coalesce(p_attempt_token,'')),'sha256'),'hex')
  for update;
  if not found then raise exception 'attempt_not_found'; end if;
  if a.completed_at is not null then
    return jsonb_build_object(
      'attempt_id',a.id,'track_slug',a.track_slug,'bank_version',a.bank_version,
      'full_name',a.full_name,'group_code',a.group_code,'started_at',a.started_at,
      'completed_at',a.completed_at,'status','completed','score',a.score,'max_score',a.max_score,
      'knowledge_percent',a.knowledge_percent,'confidence_percent',a.confidence_percent,
      'level',a.level,'domain_scores',a.domain_scores
    );
  end if;
  select count(*) into v_total
  from public.seminar_track_diagnostic_questions q
  where q.track_slug=a.track_slug and q.bank_version=a.bank_version;
  select count(*) into v_answered
  from public.seminar_track_diagnostic_questions q
  where q.track_slug=a.track_slug and q.bank_version=a.bank_version
    and p_answers ? q.id
    and (p_answers->>q.id) ~ '^[0-9]+$'
    and (p_answers->>q.id)::integer between 0 and jsonb_array_length(q.options)-1;
  if v_total <> 15 or v_answered <> v_total then raise exception 'complete_all_questions'; end if;
  select count(*) filter (where q.scored),
         count(*) filter (where q.scored and (p_answers->>q.id)::integer=q.correct_option)
  into v_max,v_score
  from public.seminar_track_diagnostic_questions q
  where q.track_slug=a.track_slug and q.bank_version=a.bank_version;
  v_percent := round((100.0*v_score/greatest(v_max,1))::numeric,1);
  select round(
    avg(
      ((p_answers->>q.id)::numeric / greatest(jsonb_array_length(q.options)-1,1)::numeric) * 100.0
    ),1
  )
  into v_confidence
  from public.seminar_track_diagnostic_questions q
  where q.track_slug=a.track_slug and q.bank_version=a.bank_version and not q.scored;
  select coalesce(
    jsonb_object_agg(
      s.domain,
      jsonb_build_object('score',s.score,'max',s.max_score,'percent',round((100.0*s.score/greatest(s.max_score,1))::numeric,1))
    ),'{}'::jsonb
  )
  into v_domain_scores
  from (
    select q.domain,
           count(*)::integer as max_score,
           count(*) filter (where (p_answers->>q.id)::integer=q.correct_option)::integer as score
    from public.seminar_track_diagnostic_questions q
    where q.track_slug=a.track_slug and q.bank_version=a.bank_version and q.scored
    group by q.domain
  ) s;
  v_level := case
    when v_percent < 35 then 'foundation'
    when v_percent < 60 then 'developing'
    when v_percent < 85 then 'proficient'
    else 'advanced'
  end;
  update public.seminar_track_diagnostic_attempts
  set answers=p_answers,domain_scores=v_domain_scores,score=v_score,max_score=v_max,
      knowledge_percent=v_percent,confidence_percent=v_confidence,level=v_level,
      completed_at=now(),duration_seconds=greatest(0,extract(epoch from (now()-started_at))::integer),updated_at=now()
  where id=a.id;
  insert into public.seminar_track_diagnostic_events(attempt_id,event_type,payload)
  values (a.id,'COMPLETED',jsonb_build_object(
    'track_slug',a.track_slug,'score',v_score,'max_score',v_max,'knowledge_percent',v_percent,
    'confidence_percent',v_confidence,'level',v_level
  ));
  return jsonb_build_object(
    'attempt_id',a.id,'track_slug',a.track_slug,'bank_version',a.bank_version,
    'full_name',a.full_name,'group_code',a.group_code,'started_at',a.started_at,'completed_at',now(),
    'status','completed','score',v_score,'max_score',v_max,'knowledge_percent',v_percent,
    'confidence_percent',v_confidence,'level',v_level,'domain_scores',v_domain_scores
  );
end;
$$;

revoke all on function public.seminar_track_diagnostic_get_questions(text,text) from public;
revoke all on function public.seminar_track_diagnostic_start(text,text,text,text,text,text) from public;
revoke all on function public.seminar_track_diagnostic_submit(uuid,text,jsonb) from public;
grant execute on function public.seminar_track_diagnostic_get_questions(text,text) to anon, authenticated;
grant execute on function public.seminar_track_diagnostic_start(text,text,text,text,text,text) to anon, authenticated;
grant execute on function public.seminar_track_diagnostic_submit(uuid,text,jsonb) to anon, authenticated;
