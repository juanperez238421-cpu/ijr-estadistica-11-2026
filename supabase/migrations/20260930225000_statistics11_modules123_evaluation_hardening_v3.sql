-- Statistics 11 · Modules 01–03 Evaluation V3
-- Hardening after Supabase advisor review:
-- * add covering indexes for new foreign keys
-- * expose student token RPCs only to anon (the Hub uses the publishable key
--   without Supabase Auth); authenticated does not need these endpoints.

create index if not exists python_hub_eval_assignments_question_idx
  on public.python_hub_eval_assignments(question_id);
create index if not exists python_hub_eval_attempt_members_identity_idx
  on public.python_hub_eval_attempt_members(student_identity_id)
  where student_identity_id is not null;
create index if not exists python_hub_eval_attempt_members_registry_idx
  on public.python_hub_eval_attempt_members(student_registry_id)
  where student_registry_id is not null;
create index if not exists python_hub_eval_attempts_owner_idx
  on public.python_hub_eval_attempts(owner_registration_id);
create index if not exists python_hub_eval_questions_evaluation_idx
  on public.python_hub_eval_questions_private(evaluation_id,active,module_no);
create index if not exists python_hub_eval_responses_question_idx
  on public.python_hub_eval_responses(question_id);

revoke execute on function public.python_hub_eval_availability_v1(uuid,text,text) from authenticated;
revoke execute on function public.python_hub_eval_start_v1(uuid,text,text,jsonb,uuid,text) from authenticated;
revoke execute on function public.python_hub_eval_resume_v1(uuid,text) from authenticated;
revoke execute on function public.python_hub_eval_submit_v1(uuid,text,text,text,text,text) from authenticated;
revoke execute on function public.python_hub_eval_log_event_v1(uuid,text,text,jsonb) from authenticated;
revoke execute on function public.python_hub_eval_finish_v1(uuid,text,text) from authenticated;
