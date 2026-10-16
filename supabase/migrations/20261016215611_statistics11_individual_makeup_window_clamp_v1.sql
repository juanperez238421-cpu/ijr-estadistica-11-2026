-- Statistics 11: individual makeup windows must never reopen the whole group.
-- Reuse the existing private email-specific exception; preserve the live exam implementation.
do $patch$
declare
 v_src text;
 v_old text;
 v_new text;
 v_av text;
begin
 select pg_get_functiondef('public.python_hub_eval_start_v1(uuid,text,text,jsonb,uuid,text)'::regprocedure)
 into v_src;
 v_old := $old$least(
      clock_timestamp()+make_interval(mins=>v_eval.duration_minutes),
      v_window.closes_at
    )$old$;
 v_new := $new$least(
      clock_timestamp()+make_interval(mins=>v_eval.duration_minutes),
      case when v_qa_early then (
        select ea.expires_at
        from private.python_hub_eval_early_access ea
        where ea.evaluation_slug=v_eval.slug
          and ea.institutional_email=v_owner_email
          and ea.enabled=true
          and clock_timestamp()<ea.expires_at
      ) else v_window.closes_at end
    )$new$;
 if strpos(v_src,v_old)=0 then
   if strpos(v_src,'case when v_qa_early then (')=0 then
     raise exception 'Unexpected start RPC definition; refusing to patch';
   end if;
 else
   v_src:=replace(v_src,v_old,v_new);
   v_src:=replace(v_src,
     'QA early access is restricted to qa.student11@ijr.edu.co only',
     'Individual exam access permits only one student');
   execute v_src;
 end if;
 select pg_get_functiondef('public.python_hub_eval_availability_v1(uuid,text,text)'::regprocedure)
 into v_av;
 if strpos(v_av,'''opens_at'',v_window.opens_at')>0 then
   v_av:=replace(v_av,
     '''opens_at'',v_window.opens_at',
     '''opens_at'',case when v_qa_early then clock_timestamp() else v_window.opens_at end');
   v_av:=replace(v_av,
     '''closes_at'',v_window.closes_at',
     '''closes_at'',case when v_qa_early then (select ea.expires_at from private.python_hub_eval_early_access ea where ea.evaluation_slug=v_eval.slug and ea.institutional_email=v_owner_email and ea.enabled=true and clock_timestamp()<ea.expires_at) else v_window.closes_at end');
   execute v_av;
 elsif strpos(v_av,'case when v_qa_early then clock_timestamp()')=0 then
   raise exception 'Unexpected availability RPC definition; refusing to patch';
 end if;
end
$patch$;