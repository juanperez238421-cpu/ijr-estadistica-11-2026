begin;

-- Supabase installs pgcrypto in the `extensions` schema. Several SECURITY
-- DEFINER RPCs intentionally pinned search_path to `public`, which made
-- digest() and gen_random_bytes() invisible at runtime even though pgcrypto
-- was installed. Include `extensions` explicitly for every student/teacher
-- RPC and the request IP helper.

do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure::text as signature
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and (
        p.proname like 'student_%'
        or p.proname like 'teacher_%'
        or p.proname='request_ip_hash'
      )
  loop
    execute format('alter function %s set search_path to public, extensions', r.signature);
  end loop;
end;
$$;

-- Re-create the production health function with functional crypto probes.
-- It never exposes secrets or answer keys.
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
    -- Exercise both pgcrypto functions that previously failed at runtime.
    v_digest := encode(extensions.digest('statistics11-health','sha256'),'hex');
    perform extensions.gen_random_bytes(1);
    v_crypto := length(v_digest)=64;
  exception when others then
    v_crypto := false;
  end;

  return jsonb_build_object(
    'ready', v_status='open'
             and v_total>=2000
             and v_fcp>=500 and v_simple>=500 and v_dist>=500 and v_circ>=500
             and v_roster>=61 and v_start and v_teacher and v_crypto,
    'status',v_status,
    'question_count',v_total,
    'topic_counts',jsonb_build_object('FCP',v_fcp,'P_SIMPLE',v_simple,'P_DIST',v_dist,'P_CIRC',v_circ),
    'roster_count',v_roster,
    'student_rpc',v_start,
    'teacher_rpc',v_teacher,
    'crypto_ready',v_crypto
  );
end;
$$;

revoke all on function public.statistics11_assessment_health() from public;
grant execute on function public.statistics11_assessment_health() to anon,authenticated;

notify pgrst, 'reload schema';

commit;
