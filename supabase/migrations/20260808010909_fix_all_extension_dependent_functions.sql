begin;

-- -----------------------------------------------------------------------------
-- Comprehensive extension visibility repair.
--
-- Earlier hotfixes covered student_* / teacher_* functions, but helper
-- functions such as resolve_roster_student() also call pgcrypto/pg_trgm and
-- intentionally pin their search_path. Supabase installs these extensions in
-- the `extensions` schema, so every extension-dependent APPLICATION function
-- must explicitly include it. Extension-owned functions themselves are excluded.
-- -----------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure::text as signature
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.prokind in ('f','p')
      and (
        p.proname like 'student_%'
        or p.proname like 'teacher_%'
        or p.proname like 'statistics11_%'
        or p.proname in ('request_ip_hash','resolve_roster_student')
      )
      and (
        lower(pg_get_functiondef(p.oid)) like '%digest(%'
        or lower(pg_get_functiondef(p.oid)) like '%gen_random_bytes(%'
        or lower(pg_get_functiondef(p.oid)) like '%similarity(%'
      )
  loop
    execute format('alter function %s set search_path to public, extensions', r.signature);
  end loop;
end;
$$;

create or replace function public.statistics11_runtime_smoke()
returns jsonb
language plpgsql
security definer
stable
set search_path=public,extensions
as $$
declare
  v_identity record;
  v_teacher_session uuid;
  v_bad_config integer := 0;
  v_identity_ok boolean := false;
  v_teacher_helper_ok boolean := false;
begin
  begin
    select * into v_identity
    from public.resolve_roster_student('11A','HEALTH PROBE UNVERIFIED IDENTITY')
    limit 1;

    v_identity_ok := v_identity.internal_key like 'UNVERIFIED-11A-%'
                     and v_identity.match_mode in ('unverified','ambiguous_unverified','fuzzy');
  exception when others then
    v_identity_ok := false;
  end;

  begin
    v_teacher_session := public.teacher_code_session_id(repeat('0',64));
    v_teacher_helper_ok := v_teacher_session is null;
  exception when others then
    v_teacher_helper_ok := false;
  end;

  select count(*)::integer into v_bad_config
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.prokind in ('f','p')
    and (
      p.proname like 'student_%'
      or p.proname like 'teacher_%'
      or p.proname like 'statistics11_%'
      or p.proname in ('request_ip_hash','resolve_roster_student')
    )
    and (
      lower(pg_get_functiondef(p.oid)) like '%digest(%'
      or lower(pg_get_functiondef(p.oid)) like '%gen_random_bytes(%'
      or lower(pg_get_functiondef(p.oid)) like '%similarity(%'
    )
    and not exists (
      select 1
      from unnest(coalesce(p.proconfig,array[]::text[])) cfg
      where cfg like 'search_path=%extensions%'
    );

  return jsonb_build_object(
    'ready', v_identity_ok and v_teacher_helper_ok and v_bad_config=0,
    'unverified_identity_path',v_identity_ok,
    'teacher_token_helper',v_teacher_helper_ok,
    'misconfigured_extension_functions',v_bad_config
  );
end;
$$;

revoke all on function public.statistics11_runtime_smoke() from public;
grant execute on function public.statistics11_runtime_smoke() to anon,authenticated;

create or replace function public.statistics11_assessment_health()
returns jsonb
language plpgsql
security definer
stable
set search_path=public,extensions
as $$
declare
  v_status text;
  v_total integer;
  v_fcp integer;
  v_simple integer;
  v_dist integer;
  v_circ integer;
  v_roster integer;
  v_start boolean;
  v_teacher boolean;
  v_crypto boolean := false;
  v_digest text;
  v_runtime jsonb;
begin
  select status into v_status
  from public.assessments
  where slug='statistics11-counting-permutations-2026';

  select count(*)::integer,
         count(*) filter(where topic_code='FCP')::integer,
         count(*) filter(where topic_code='P_SIMPLE')::integer,
         count(*) filter(where topic_code='P_DIST')::integer,
         count(*) filter(where topic_code='P_CIRC')::integer
  into v_total,v_fcp,v_simple,v_dist,v_circ
  from public.questions_private
  where active=true;

  select count(*)::integer into v_roster
  from public.student_registry
  where active=true;

  v_start := to_regprocedure('public.student_start_attempt(text,text,text,uuid,text)') is not null;
  v_teacher := to_regprocedure('public.teacher_code_login(text,text)') is not null;

  begin
    v_digest := encode(extensions.digest('statistics11-health','sha256'),'hex');
    perform extensions.gen_random_bytes(1);
    v_crypto := length(v_digest)=64;
  exception when others then
    v_crypto := false;
  end;

  begin
    v_runtime := public.statistics11_runtime_smoke();
  exception when others then
    v_runtime := jsonb_build_object('ready',false,'error','runtime smoke failed');
  end;

  return jsonb_build_object(
    'ready', v_status='open'
             and v_total>=2000
             and v_fcp>=500 and v_simple>=500 and v_dist>=500 and v_circ>=500
             and v_roster>=61 and v_start and v_teacher and v_crypto
             and coalesce((v_runtime->>'ready')::boolean,false),
    'status',v_status,
    'question_count',v_total,
    'topic_counts',jsonb_build_object('FCP',v_fcp,'P_SIMPLE',v_simple,'P_DIST',v_dist,'P_CIRC',v_circ),
    'roster_count',v_roster,
    'student_rpc',v_start,
    'teacher_rpc',v_teacher,
    'crypto_ready',v_crypto,
    'runtime_smoke',v_runtime
  );
end;
$$;

revoke all on function public.statistics11_assessment_health() from public;
grant execute on function public.statistics11_assessment_health() to anon,authenticated;

notify pgrst, 'reload schema';

commit;
