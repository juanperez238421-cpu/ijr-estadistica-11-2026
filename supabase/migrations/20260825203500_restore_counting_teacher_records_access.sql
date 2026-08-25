begin;

-- The dedicated Counting & Permutations teacher page authenticates with
-- teacher_code_login(), then passes the short-lived teacher token to these
-- read-only RPCs. Both RPCs independently validate the token through
-- teacher_code_session_id() before returning protected assessment records.
revoke all on function public.teacher_dashboard_snapshot(text,text) from public,anon,authenticated;
revoke all on function public.teacher_attempt_detail(text,uuid) from public,anon,authenticated;

grant execute on function public.teacher_dashboard_snapshot(text,text) to anon,authenticated;
grant execute on function public.teacher_attempt_detail(text,uuid) to anon,authenticated;

notify pgrst,'reload schema';

commit;
