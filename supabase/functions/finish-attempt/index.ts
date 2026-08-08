import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  try{
    const token=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
    const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const {data:{user}}=await admin.auth.getUser(token); if(!user)return json({error:'Invalid session'},401);
    const b=await req.json(), attemptId=String(b.attempt_id||''), reason=String(b.reason||'student_finished');
    const {data:attempt}=await admin.from('attempts').select('*').eq('id',attemptId).single();
    if(!attempt||attempt.auth_user_id!==user.id)return json({error:'Attempt not found'},404);
    if(['submitted','force_submitted','invalidated'].includes(attempt.status))return json({status:attempt.status,answered_count:attempt.answered_count,raw_points:attempt.raw_points,grade:attempt.grade});
    const {data:assessment}=await admin.from('assessments').select('*').eq('id',attempt.assessment_id).single(); if(!assessment)throw new Error('Assessment missing');
    const {data:responses,error:rErr}=await admin.from('responses').select('is_correct').eq('attempt_id',attemptId); if(rErr)throw rErr;
    const answered=responses?.length||0, correct=(responses||[]).filter((r:any)=>r.is_correct===true).length, incorrect=answered-correct;
    const total=assessment.questions_per_student;
    const raw=Number((assessment.max_raw_points*correct/total).toFixed(2));
    const grade=Number((assessment.grade_min+(assessment.grade_max-assessment.grade_min)*correct/total).toFixed(2));
    const invalidated=attempt.status==='auto_invalidated'||reason.startsWith('auto_invalidated');
    const status=invalidated?'auto_invalidated':'submitted'; const now=new Date().toISOString();
    const {data:closed,error:cErr}=await admin.from('attempts').update({status,submitted_at:attempt.submitted_at||now,raw_points:raw,grade,correct_count:correct,incorrect_count:incorrect,answered_count:answered,finish_reason:invalidated?'auto_invalidated_integrity':reason,last_activity_at:now}).eq('id',attemptId).select('*').single();
    if(cErr)throw cErr;
    return json({status:closed.status,answered_count:answered,correct_count:correct,incorrect_count:incorrect,raw_points:raw,grade,passing_grade:assessment.passing_grade,passed:grade>=assessment.passing_grade});
  }catch(e){console.error(e);return json({error:e instanceof Error?e.message:'Unexpected error'},500);}
});
