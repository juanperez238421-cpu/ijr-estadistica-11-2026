-- Run as a privileged database smoke test while the evaluation windows are open.
-- Synthetic accounts and all exam writes are rolled back; no answer keys are returned.
begin;
do $smoke$
declare
 g text; email text; login jsonb; started jsonb; snap jsonb; result jsonb; availability jsonb;
 rid uuid; token text; aid uuid; atoken text; q public.python_hub_eval_questions_private%rowtype;
 answer text; code text; observed text; correct_total int; wrong_total int; i int; rejected boolean;
begin
 foreach g in array array['11A','11B','11C'] loop
  email:='qa.smoke.exam.'||lower(g)||'.'||replace(gen_random_uuid()::text,'-','')||'@ijr.edu.co';
  login:=public.python_hub_lab_login_v52(g,email,gen_random_uuid(),'Codex smoke transaction rollback');
  rid:=(login->>'registration_id')::uuid; token:=login->>'access_token';
  availability:=public.python_hub_eval_availability_v1(rid,token,'modules-1-3-2026-10-01');
  assert availability->>'state'='open','Smoke account cannot open evaluation';
  started:=public.python_hub_eval_start_v1(rid,token,'modules-1-3-2026-10-01',jsonb_build_array(email),gen_random_uuid(),'Codex smoke');
  aid:=(started->>'attempt_id')::uuid; atoken:=started->>'attempt_token'; snap:=started->'snapshot';
  assert (snap->'assessment'->>'question_count')::int=18,'Incorrect question count';
  assert (snap->'attempt'->>'team_size')::int=1,'Incorrect team size';
  assert (snap->'attempt'->>'expires_at')::timestamptz>(clock_timestamp()+interval '39 minutes'),'Timer unexpectedly short';
  rejected:=false;
  begin perform public.python_hub_eval_start_v1(rid,token,'modules-1-3-2026-10-01',jsonb_build_array(email),gen_random_uuid(),'smoke duplicate'); exception when others then rejected:=true; end;
  assert rejected,'Duplicate exam attempt accepted';
  correct_total:=0; wrong_total:=0;
  for i in 1..18 loop
    assert snap->'current_question' is not null,'Missing current question';
    assert not (snap->'current_question' ? 'answer_key'),'Answer key exposed';
    select * into q from public.python_hub_eval_questions_private where id=snap->'current_question'->>'id';
    code:=null; observed:=null;
    if q.question_type='code' then answer:='smoke wrong'; code:='print("smoke")'; observed:='__smoke_wrong_output__'; wrong_total:=wrong_total+1;
    elsif q.question_type='short_text' then answer:=q.answer_key->'accepted'->>0; correct_total:=correct_total+1;
    else answer:=q.answer_key->>'value'; correct_total:=correct_total+1; end if;
    result:=public.python_hub_eval_submit_v1(aid,atoken,q.id,answer,code,observed);
    assert (result->>'correct')::boolean=(q.question_type<>'code'),'Unexpected scoring';
    if i=1 then
      rejected:=false;
      begin perform public.python_hub_eval_submit_v1(aid,atoken,q.id,answer,code,observed); exception when others then rejected:=true; end;
      assert rejected,'Previously confirmed answer could be changed';
    end if;
    snap:=public.python_hub_eval_resume_v1(aid,atoken);
    assert (snap->'attempt'->>'answered_count')::int=i,'Resume lost confirmed answers';
  end loop;
  assert snap->'attempt'->>'status'='submitted','Exam did not finish';
  assert (snap->'attempt'->>'correct_count')::int=correct_total,'Correct count mismatch';
  assert (snap->'attempt'->>'incorrect_count')::int=wrong_total,'Incorrect count mismatch';
  assert (snap->'attempt'->>'points_remaining')::numeric=18-wrong_total,'Penalty or final score mismatch';
  assert snap->'current_question'='null'::jsonb,'Finished exam still has question';
  availability:=public.python_hub_eval_availability_v1(rid,token,'modules-1-3-2026-10-01');
  assert availability->>'state'='attempted','Completed attempt not recognized';
 end loop;
end $smoke$;
rollback;
select 'PASS: three alternate smoke identities (11A/11B/11C), open access, 40-minute timer, 18 questions each, correct/incorrect grading, resume, duplicate protections and automatic completion; all smoke records rolled back' as verification;