import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  try{
    const token=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
    const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const {data:{user}}=await admin.auth.getUser(token); if(!user)return json({error:'Invalid session'},401);
    const body=await req.json(), attemptId=String(body.attempt_id||''), questionId=String(body.question_id||''), selected=String(body.selected_option||'');
    if(!/^[A-D]$/.test(selected))return json({error:'Invalid option'},400);
    const {data:attempt}=await admin.from('attempts').select('*').eq('id',attemptId).single();
    if(!attempt||attempt.auth_user_id!==user.id)return json({error:'Attempt not found'},404);
    if(attempt.status!=='active')return json({error:`Attempt is ${attempt.status}`},409);
    if(Date.now()>new Date(attempt.expires_at).getTime())return json({error:'TIME_EXPIRED'},409);
    const nextOrder=attempt.answered_count+1;
    const {data:assignment}=await admin.from('assignments').select('*').eq('assessment_id',attempt.assessment_id).eq('student_id',attempt.student_id).eq('question_order',nextOrder).single();
    if(!assignment||assignment.question_id!==questionId)return json({error:'Question is not the current assignment'},409);
    const {data:existing}=await admin.from('responses').select('id').eq('attempt_id',attemptId).eq('question_id',questionId).maybeSingle();
    if(existing)return json({error:'Answer already submitted'},409);
    const {data:q}=await admin.from('questions_private').select('id,options,correct_answer').eq('id',questionId).single(); if(!q)return json({error:'Question missing'},500);
    const order:number[]=assignment.option_order; const pos=selected.charCodeAt(0)-65; const originalIndex=order[pos];
    const actualValue=String(q.options[originalIndex]); const isCorrect=actualValue===String(q.correct_answer);
    const {data:shown}=await admin.from('attempt_events').select('server_timestamp').eq('attempt_id',attemptId).eq('question_id',questionId).eq('event_type','QUESTION_SHOWN').order('server_timestamp',{ascending:false}).limit(1).maybeSingle();
    const responseMs=shown?Math.max(0,Date.now()-new Date(shown.server_timestamp).getTime()):null;
    const now=new Date().toISOString();
    const {error:rErr}=await admin.from('responses').insert({attempt_id:attemptId,question_id:questionId,question_order:nextOrder,displayed_option_order:order,first_selected_at:now,submitted_at:now,selected_option:selected,response_time_ms:responseMs,is_correct:isCorrect,server_received_at:now});
    if(rErr)throw rErr;
    await admin.from('attempts').update({answered_count:nextOrder,last_activity_at:now}).eq('id',attemptId);
    const {data:assessment}=await admin.from('assessments').select('questions_per_student').eq('id',attempt.assessment_id).single();
    if(nextOrder>=assessment.questions_per_student)return json({ok:true,finished:true});
    const next=await publicQuestion(admin,attempt.assessment_id,attempt.student_id,nextOrder+1);
    return json({ok:true,finished:false,next_question:next});
  }catch(e){console.error(e);return json({error:e instanceof Error?e.message:'Unexpected error'},500);}
});
async function publicQuestion(admin:any,assessmentId:string,studentId:string,orderNo:number){
  const {data:a}=await admin.from('assignments').select('question_id,question_order,option_order').eq('assessment_id',assessmentId).eq('student_id',studentId).eq('question_order',orderNo).single(); if(!a)throw new Error('Next assignment missing');
  const {data:q}=await admin.from('questions_private').select('id,topic_code,prompt_es,options,diagram').eq('id',a.question_id).single(); if(!q)throw new Error('Next question missing');
  const values=Array.isArray(q.options)?q.options:[]; const order:number[]=a.option_order;
  return {id:q.id,order:a.question_order,topic_label:q.topic_code,prompt:q.prompt_es,diagram:q.diagram,options:order.map((idx:number,pos:number)=>({key:String.fromCharCode(65+pos),label:String(values[idx])}))};
}
