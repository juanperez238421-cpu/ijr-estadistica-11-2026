-- Statistics 11 · Evaluation end-to-end QA V71
-- Uses alternate institutional emails against the real production RPCs.
-- All synthetic registrations, attempts, answers and events are rolled back.

begin;

do $qa$
declare
  v_eval_id uuid;
  v_email text;
  v_login jsonb;
  v_started jsonb;
  v_snap jsonb;
  v_result jsonb;
  v_event jsonb;
  v_registration uuid;
  v_access_token text;
  v_attempt uuid;
  v_attempt_token text;
  v_q public.python_hub_eval_questions_private%rowtype;
  v_code text;
  v_output text;
  v_answer text;
  v_first boolean;
  v_i integer;
  v_row public.python_hub_eval_attempts%rowtype;
  v_count integer;
begin
  select id into v_eval_id
  from public.python_hub_eval_assessments
  where slug='modules-1-3-2026-10-01';

  assert v_eval_id is not null,'Evaluation not found';

  -- Keep this smoke reusable even after the original class window closes.
  -- The update is transaction-local and is rolled back at the end.
  update public.python_hub_eval_assessments
  set status='scheduled',
      allowed_groups=array['11A','11B','11C']::text[]
  where id=v_eval_id;

  update public.python_hub_eval_windows
  set opens_at=clock_timestamp()-interval '5 minutes',
      closes_at=clock_timestamp()+interval '90 minutes'
  where evaluation_id=v_eval_id and group_code='11A';

  -- Contract test for every programming item in the 54-question bank.
  for v_q in
    select *
    from public.python_hub_eval_questions_private
    where evaluation_id=v_eval_id
      and active=true
      and question_type='code'
    order by id
  loop
    v_code:=case v_q.id
      when 'M123-05' then E'a=14\nb=6\nproduct=a*b\nprint(product)'
      when 'M123-06' then E'value=81\nroot=value ** 0.5\nprint(root)'
      when 'M123-11' then E'text="25"\nnumber=int(text)\nprint(number+5)'
      when 'M123-12' then E'value=7\nconverted=float(value)\nprint(converted)'
      when 'M123-17' then E'values=[4,8]\nvalues.append(12)\nprint(len(values))'
      when 'M123-18' then E'values=[10,15,5,20]\nmean=sum(values)/len(values)\nprint(mean)'
      when 'M123-27' then E'a=9\nb=4\nresult=a+b\nprint(result)'
      when 'M123-28' then E'a=23\nb=5\nresult=a//b\nprint(result)'
      when 'M123-29' then E'a=17\nb=5\nresult=a%b\nprint(result)'
      when 'M123-30' then E'result=(8+2)*3\nprint(result)'
      when 'M123-39' then E'text="18"\nnumber=int(text)\nprint(number+2)'
      when 'M123-40' then E'value=5\nconverted=float(value)\nprint(converted)'
      when 'M123-41' then E'value=16\nconverted=str(value)\nprint(converted)'
      when 'M123-42' then E'value=True\nprint(type(value).__name__)'
      when 'M123-51' then E'values=[3,6]\nvalues.append(9)\nprint(values)'
      when 'M123-52' then E'values=[5,10,15]\nprint(values[1])'
      when 'M123-53' then E'values=[2,4,6,8]\nprint(sum(values))'
      when 'M123-54' then E'values=[6,8,10]\nprint(sum(values)/len(values))'
      else null
    end;

    v_output:=case v_q.id
      when 'M123-05' then '84'
      when 'M123-06' then '9.0'
      when 'M123-11' then '30'
      when 'M123-12' then '7.0'
      when 'M123-17' then '3'
      when 'M123-18' then '12.5'
      when 'M123-27' then '13'
      when 'M123-28' then '4'
      when 'M123-29' then '2'
      when 'M123-30' then '30'
      when 'M123-39' then '20'
      when 'M123-40' then '5.0'
      when 'M123-41' then '16'
      when 'M123-42' then 'bool'
      when 'M123-51' then '[3, 6, 9]'
      when 'M123-52' then '10'
      when 'M123-53' then '20'
      when 'M123-54' then '8.0'
      else null
    end;

    assert v_code is not null,'Canonical code missing for '||v_q.id;
    assert private.python_hub_eval_answer_correct_v1(v_q.id,v_output,v_code,v_output),
      'Server grader rejected canonical terminal result for '||v_q.id;
  end loop;

  -- Alternate email A: complete a perfect 18/18 paper.
  v_email:='qa.alt.perfect.'||replace(gen_random_uuid()::text,'-','')||'@ijr.edu.co';
  v_login:=public.python_hub_lab_login_v52('11A',v_email,gen_random_uuid(),'V71 alternate-email perfect QA');
  v_registration:=(v_login->>'registration_id')::uuid;
  v_access_token:=v_login->>'access_token';

  v_started:=public.python_hub_eval_start_v1(
    v_registration,v_access_token,'modules-1-3-2026-10-01',
    jsonb_build_array(v_email),gen_random_uuid(),'V71 perfect QA'
  );
  v_attempt:=(v_started->>'attempt_id')::uuid;
  v_attempt_token:=v_started->>'attempt_token';
  v_snap:=v_started->'snapshot';

  for v_i in 1..18 loop
    select * into v_q
    from public.python_hub_eval_questions_private
    where id=v_snap->'current_question'->>'id';

    if v_q.question_type='code' then
      v_code:=case v_q.id
        when 'M123-05' then E'a=14\nb=6\nproduct=a*b\nprint(product)'
        when 'M123-06' then E'value=81\nroot=value ** 0.5\nprint(root)'
        when 'M123-11' then E'text="25"\nnumber=int(text)\nprint(number+5)'
        when 'M123-12' then E'value=7\nconverted=float(value)\nprint(converted)'
        when 'M123-17' then E'values=[4,8]\nvalues.append(12)\nprint(len(values))'
        when 'M123-18' then E'values=[10,15,5,20]\nmean=sum(values)/len(values)\nprint(mean)'
        when 'M123-27' then E'a=9\nb=4\nresult=a+b\nprint(result)'
        when 'M123-28' then E'a=23\nb=5\nresult=a//b\nprint(result)'
        when 'M123-29' then E'a=17\nb=5\nresult=a%b\nprint(result)'
        when 'M123-30' then E'result=(8+2)*3\nprint(result)'
        when 'M123-39' then E'text="18"\nnumber=int(text)\nprint(number+2)'
        when 'M123-40' then E'value=5\nconverted=float(value)\nprint(converted)'
        when 'M123-41' then E'value=16\nconverted=str(value)\nprint(converted)'
        when 'M123-42' then E'value=True\nprint(type(value).__name__)'
        when 'M123-51' then E'values=[3,6]\nvalues.append(9)\nprint(values)'
        when 'M123-52' then E'values=[5,10,15]\nprint(values[1])'
        when 'M123-53' then E'values=[2,4,6,8]\nprint(sum(values))'
        when 'M123-54' then E'values=[6,8,10]\nprint(sum(values)/len(values))'
      end;
      v_output:=coalesce(v_q.answer_key->'accepted_outputs'->>0,v_q.answer_key->>'expected_output');
      v_answer:=v_output;
    elsif v_q.question_type='short_text' then
      v_answer:=v_q.answer_key->'accepted'->>0;
      v_code:=null;
      v_output:=null;
    else
      v_answer:=v_q.answer_key->>'value';
      v_code:=null;
      v_output:=null;
    end if;

    v_result:=public.python_hub_eval_submit_v1(
      v_attempt,v_attempt_token,v_q.id,v_answer,v_code,v_output
    );
    assert (v_result->>'correct')::boolean,'Correct answer rejected for '||v_q.id;
    v_snap:=v_result->'snapshot';
  end loop;

  select * into v_row from public.python_hub_eval_attempts where id=v_attempt;
  assert v_row.status='submitted','Perfect attempt not submitted';
  assert v_row.points_remaining=18,'Perfect attempt did not store 18 points';
  assert v_row.correct_count=18,'Perfect attempt correct count mismatch';
  assert v_row.incorrect_count=0,'Perfect attempt incorrect count mismatch';
  select count(*) into v_count from public.python_hub_eval_responses where attempt_id=v_attempt;
  assert v_count=18,'Perfect attempt did not store 18 response rows';

  -- Alternate email B: exactly one wrong answer must persist as 17/18.
  v_email:='qa.alt.mixed.'||replace(gen_random_uuid()::text,'-','')||'@ijr.edu.co';
  v_login:=public.python_hub_lab_login_v52('11A',v_email,gen_random_uuid(),'V71 alternate-email mixed QA');
  v_registration:=(v_login->>'registration_id')::uuid;
  v_access_token:=v_login->>'access_token';
  v_started:=public.python_hub_eval_start_v1(
    v_registration,v_access_token,'modules-1-3-2026-10-01',
    jsonb_build_array(v_email),gen_random_uuid(),'V71 mixed QA'
  );
  v_attempt:=(v_started->>'attempt_id')::uuid;
  v_attempt_token:=v_started->>'attempt_token';
  v_snap:=v_started->'snapshot';
  v_first:=true;

  for v_i in 1..18 loop
    select * into v_q
    from public.python_hub_eval_questions_private
    where id=v_snap->'current_question'->>'id';

    if v_first then
      v_answer:='__deliberately_wrong__';
      v_code:='print("wrong")';
      v_output:='wrong';
      v_first:=false;
    elsif v_q.question_type='code' then
      v_code:=case v_q.id
        when 'M123-05' then E'a=14\nb=6\nproduct=a*b\nprint(product)'
        when 'M123-06' then E'value=81\nroot=value ** 0.5\nprint(root)'
        when 'M123-11' then E'text="25"\nnumber=int(text)\nprint(number+5)'
        when 'M123-12' then E'value=7\nconverted=float(value)\nprint(converted)'
        when 'M123-17' then E'values=[4,8]\nvalues.append(12)\nprint(len(values))'
        when 'M123-18' then E'values=[10,15,5,20]\nmean=sum(values)/len(values)\nprint(mean)'
        when 'M123-27' then E'a=9\nb=4\nresult=a+b\nprint(result)'
        when 'M123-28' then E'a=23\nb=5\nresult=a//b\nprint(result)'
        when 'M123-29' then E'a=17\nb=5\nresult=a%b\nprint(result)'
        when 'M123-30' then E'result=(8+2)*3\nprint(result)'
        when 'M123-39' then E'text="18"\nnumber=int(text)\nprint(number+2)'
        when 'M123-40' then E'value=5\nconverted=float(value)\nprint(converted)'
        when 'M123-41' then E'value=16\nconverted=str(value)\nprint(converted)'
        when 'M123-42' then E'value=True\nprint(type(value).__name__)'
        when 'M123-51' then E'values=[3,6]\nvalues.append(9)\nprint(values)'
        when 'M123-52' then E'values=[5,10,15]\nprint(values[1])'
        when 'M123-53' then E'values=[2,4,6,8]\nprint(sum(values))'
        when 'M123-54' then E'values=[6,8,10]\nprint(sum(values)/len(values))'
      end;
      v_output:=coalesce(v_q.answer_key->'accepted_outputs'->>0,v_q.answer_key->>'expected_output');
      v_answer:=v_output;
    elsif v_q.question_type='short_text' then
      v_answer:=v_q.answer_key->'accepted'->>0;
      v_code:=null;
      v_output:=null;
    else
      v_answer:=v_q.answer_key->>'value';
      v_code:=null;
      v_output:=null;
    end if;

    v_result:=public.python_hub_eval_submit_v1(
      v_attempt,v_attempt_token,v_q.id,v_answer,v_code,v_output
    );
    v_snap:=v_result->'snapshot';
  end loop;

  select * into v_row from public.python_hub_eval_attempts where id=v_attempt;
  assert v_row.status='submitted','Mixed attempt not submitted';
  assert v_row.points_remaining=17,'One wrong answer did not store 17 points';
  assert v_row.correct_count=17,'Mixed attempt correct count mismatch';
  assert v_row.incorrect_count=1,'Mixed attempt incorrect count mismatch';

  -- Alternate email C: client audit event types + real integrity penalties.
  v_email:='qa.alt.integrity.'||replace(gen_random_uuid()::text,'-','')||'@ijr.edu.co';
  v_login:=public.python_hub_lab_login_v52('11A',v_email,gen_random_uuid(),'V71 alternate-email integrity QA');
  v_registration:=(v_login->>'registration_id')::uuid;
  v_access_token:=v_login->>'access_token';
  v_started:=public.python_hub_eval_start_v1(
    v_registration,v_access_token,'modules-1-3-2026-10-01',
    jsonb_build_array(v_email),gen_random_uuid(),'V71 integrity QA'
  );
  v_attempt:=(v_started->>'attempt_id')::uuid;
  v_attempt_token:=v_started->>'attempt_token';

  v_event:=public.python_hub_eval_log_event_v1(v_attempt,v_attempt_token,'COPY_SHORTCUT_ATTEMPT','{"source":"qa"}'::jsonb);
  assert not (v_event->>'penalized')::boolean,'Copy shortcut audit must not alter grade';
  v_event:=public.python_hub_eval_log_event_v1(v_attempt,v_attempt_token,'PASTE_SHORTCUT_ATTEMPT','{"source":"qa"}'::jsonb);
  assert not (v_event->>'penalized')::boolean,'Paste shortcut audit must not alter grade';
  v_event:=public.python_hub_eval_log_event_v1(v_attempt,v_attempt_token,'SCREENSHOT_KEY_ATTEMPT','{"key":"PrintScreen"}'::jsonb);
  assert not (v_event->>'penalized')::boolean,'Screenshot-key audit must not alter grade';

  select count(*) into v_count
  from public.python_hub_eval_events
  where attempt_id=v_attempt
    and event_type in ('COPY_SHORTCUT_ATTEMPT','PASTE_SHORTCUT_ATTEMPT','SCREENSHOT_KEY_ATTEMPT');
  assert v_count=3,'Client integrity audit events were not persisted';

  v_event:=public.python_hub_eval_log_event_v1(v_attempt,v_attempt_token,'FULLSCREEN_EXIT','{"source":"qa"}'::jsonb);
  assert (v_event->>'penalized')::boolean,'Fullscreen exit did not deduct a point';
  assert (v_event->>'points_remaining')::numeric=17,'Fullscreen exit score mismatch';

  update public.python_hub_eval_events
  set created_at=clock_timestamp()-interval '2 seconds'
  where attempt_id=v_attempt and penalized=true;

  v_event:=public.python_hub_eval_log_event_v1(v_attempt,v_attempt_token,'VISIBILITY_HIDDEN_CONFIRMED','{"hidden_duration_ms":900}'::jsonb);
  assert (v_event->>'penalized')::boolean,'Confirmed window exit did not deduct a point';
  assert (v_event->>'points_remaining')::numeric=16,'Confirmed window exit score mismatch';

  update public.python_hub_eval_events
  set created_at=clock_timestamp()-interval '2 seconds'
  where attempt_id=v_attempt and penalized=true;

  v_event:=public.python_hub_eval_log_event_v1(v_attempt,v_attempt_token,'SECOND_TAB_DETECTED','{"source":"qa"}'::jsonb);
  assert (v_event->>'penalized')::boolean,'Second-tab detection did not deduct a point';
  assert v_event->>'status'='integrity_locked','Third integrity strike did not lock attempt';

  select * into v_row from public.python_hub_eval_attempts where id=v_attempt;
  assert v_row.integrity_strikes=3,'Integrity strike count mismatch';
  assert v_row.status='integrity_locked','Integrity attempt status mismatch';
  assert v_row.incorrect_count=18,'Unanswered questions were not closed as incorrect';
  assert v_row.points_remaining=0,'Integrity-locked final score mismatch';
end
$qa$;

rollback;

select 'PASS: alternate emails, perfect/mixed scoring, 18 code grader contracts, clipboard/screenshot audit events, fullscreen/window/second-tab penalties and integrity lock; all synthetic data rolled back' as verification;
