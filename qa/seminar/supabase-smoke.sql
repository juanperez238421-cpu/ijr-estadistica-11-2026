-- Seminar 11 · transactional production smoke suite
-- Safe contract: every write happens inside this transaction and is rolled back.
-- Run with a privileged QA connection after migrations are applied.

begin;

do $$
declare
  v_track text;
  v_token text;
  v_start jsonb;
  v_attempt_id uuid;
  v_questions jsonb;
  v_answers jsonb;
  v_report jsonb;
  v_course jsonb;
  v_course_id uuid;
  v_course_token text;
  v_uml jsonb;
  v_colab jsonb;
begin
  -- Direct diagnostic tables must not be exposed to browser roles.
  if has_table_privilege('anon','public.seminar_track_diagnostic_questions','SELECT') then
    raise exception 'SECURITY FAIL: anon can select diagnostic questions directly';
  end if;
  if has_table_privilege('anon','public.seminar_track_diagnostic_attempts','SELECT') then
    raise exception 'SECURITY FAIL: anon can select diagnostic attempts directly';
  end if;
  if has_table_privilege('authenticated','public.seminar_track_diagnostic_attempts','INSERT') then
    raise exception 'SECURITY FAIL: authenticated can insert diagnostic attempts directly';
  end if;

  -- V2 requires exactly 3 correct answers in each A/B/C/D position, per track.
  if (select count(*) from (
        select track_slug, correct_option, count(*) n
        from public.seminar_track_diagnostic_questions
        where bank_version='2026-08-31-v2' and scored
        group by track_slug, correct_option
      ) x where n=3) <> 20 then
    raise exception 'BANK FAIL: v2 answer-key positions are not 3/3/3/3 for all five tracks';
  end if;

  foreach v_track in array array['web','data-science','cybersecurity','3d-programming','robotics'] loop
    v_questions := public.seminar_track_diagnostic_get_questions(v_track,'2026-08-31-v2');
    if jsonb_array_length(v_questions) <> 15 then
      raise exception 'BANK FAIL: % does not expose exactly 15 questions', v_track;
    end if;
    if exists (select 1 from jsonb_array_elements(v_questions) q where q ? 'correct_option') then
      raise exception 'SECURITY FAIL: % question payload exposes correct_option', v_track;
    end if;

    v_token := 'qa-transaction-' || v_track || '-' || repeat('x',48);
    v_start := public.seminar_track_diagnostic_start(
      v_track,'2026-08-31-v2','QA Transaction ' || v_track,'11-A',v_token,'senior-qa-transaction'
    );
    v_attempt_id := (v_start->>'attempt_id')::uuid;

    select jsonb_object_agg(q.id, case when q.scored then q.correct_option else 2 end)
      into v_answers
    from public.seminar_track_diagnostic_questions q
    where q.track_slug=v_track and q.bank_version='2026-08-31-v2';

    v_report := public.seminar_track_diagnostic_submit(v_attempt_id,v_token,v_answers);
    if (v_report->>'score')::int <> 12 or (v_report->>'max_score')::int <> 12 then
      raise exception 'SCORING FAIL: % did not score 12/12', v_track;
    end if;
    if (v_report->>'knowledge_percent')::numeric <> 100.0 then
      raise exception 'SCORING FAIL: % did not return 100%% knowledge', v_track;
    end if;
    if v_report->>'level' <> 'advanced' then
      raise exception 'PLACEMENT FAIL: % did not return advanced', v_track;
    end if;
    if (v_report->>'confidence_percent')::numeric <> 50.0 then
      raise exception 'PROFILE FAIL: % midpoint self-profile must map to 50%%', v_track;
    end if;
    if (v_report->'domain_scores'->'foundations'->>'score')::int <> 4
       or (v_report->'domain_scores'->'applied_reasoning'->>'score')::int <> 4
       or (v_report->'domain_scores'->'workflow_tools'->>'score')::int <> 4 then
      raise exception 'DOMAIN FAIL: % expected 4/4 in each technical domain', v_track;
    end if;
  end loop;

  -- OOP + UML persistence path: registration → session evidence → snapshot.
  v_course := public.seminar_course_start_team(
    'seminario-programacion-t3-2026','python','["QA Transaction OOP"]'::jsonb,
    '11-A',gen_random_uuid(),'senior-qa-transaction'
  );
  v_course_id := (v_course->>'attempt_id')::uuid;
  v_course_token := v_course->>'attempt_token';
  v_uml := public.seminar_oop_uml_record_session(
    v_course_id,v_course_token,'s02',
    jsonb_build_object(
      'model',true,'code',true,'test',true,'explain',true,
      'runtime','pyodide-0.27.7','run_count',2,'successful_run_count',2,
      'run_success',true,'implement_success',true,'test_success',true,
      'code_snapshot','class Counter: pass','last_output','ok','source','senior-qa-transaction'
    )
  );
  if jsonb_array_length(v_uml->'sessions') <> 1
     or v_uml->'sessions'->0->>'session_key' <> 's02'
     or v_uml->'sessions'->0->>'status' <> 'completed' then
    raise exception 'OOP UML FAIL: session evidence did not persist in snapshot';
  end if;

  -- Standalone OOP Colab path: team registration → 36-pack assignment → 12 checkpoints.
  v_colab := public.seminar_oop_colab_start_v1(
    '["qa-transaction-1@ijr.edu.co","qa-transaction-2@ijr.edu.co"]'::jsonb,
    '11A',gen_random_uuid(),'senior-qa-transaction'
  );
  if v_colab->>'attempt_token' is null then
    raise exception 'OOP COLAB FAIL: no attempt token returned';
  end if;
  if jsonb_array_length(v_colab->'snapshot'->'checkpoints') <> 12 then
    raise exception 'OOP COLAB FAIL: expected 12 checkpoints';
  end if;

  raise notice 'SEMINAR_SMOKE_OK: 5 diagnostics + OOP UML + standalone OOP Colab passed';
end $$;

rollback;
