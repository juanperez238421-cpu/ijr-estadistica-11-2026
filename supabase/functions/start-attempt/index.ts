import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
const sha256=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,'0')).join('');
const shuffle=<T,>(a:T[])=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[x[i],x[j]]=[x[j],x[i]];}return x;};

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
  try{
    const auth=req.headers.get('Authorization'); if(!auth) return json({error:'Authentication required'},401);
    const token=auth.replace(/^Bearer\s+/i,'');
    const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const {data:{user},error:userErr}=await admin.auth.getUser(token); if(userErr||!user) return json({error:'Invalid session'},401);
    const body=await req.json();
    const studentId=String(body.student_id||'').trim().toUpperCase();
    const group=String(body.group_code||'').trim(); const fullName=String(body.student_name||'').trim();
    const sessionId=String(body.session_id||''); const slug=String(body.assessment_slug||'');
    if(!studentId||!['11A','11B','11C'].includes(group)||!fullName||!sessionId) return json({error:'Incomplete registration'},400);

    const {data:assessment,error:aErr}=await admin.from('assessments').select('*').eq('slug',slug).single();
    if(aErr||!assessment) return json({error:'Assessment not found'},404);
    if(assessment.status!=='open') return json({error:`Assessment is ${assessment.status}`},409);
    const now=Date.now(); if(assessment.starts_at&&now<new Date(assessment.starts_at).getTime()) return json({error:'Assessment has not started'},409);
    if(assessment.ends_at&&now>new Date(assessment.ends_at).getTime()) return json({error:'Assessment is closed'},409);

    const {data:existingProfile}=await admin.from('profiles').select('*').eq('student_id',studentId).maybeSingle();
    if(existingProfile&&existingProfile.auth_user_id!==user.id) return json({error:'Student ID is already registered to another session. Ask the teacher.'},409);
    await admin.from('profiles').upsert({auth_user_id:user.id,student_id:studentId,full_name:fullName,group_code:group,role:'student',active:true},{onConflict:'auth_user_id'});

    const {data:existing}=await admin.from('attempts').select('*').eq('assessment_id',assessment.id).eq('student_id',studentId).maybeSingle();
    if(existing){
      if(['submitted','force_submitted','auto_invalidated','invalidated'].includes(existing.status)) return json({error:'This student already has a closed attempt.'},409);
      if(existing.session_id!==sessionId) return json({error:'SECOND_SESSION_DETECTED'},409);
      const q=await publicQuestion(admin,assessment.id,studentId,existing.answered_count+1);
      return json({attempt_id:existing.id,expires_at:existing.expires_at,integrity_strikes:existing.integrity_strikes,question:q});
    }

    const {count}=await admin.from('assignments').select('*',{count:'exact',head:true}).eq('assessment_id',assessment.id).eq('student_id',studentId);
    if(count!==assessment.questions_per_student) return json({error:`No complete assignment for ${studentId}. Expected ${assessment.questions_per_student}, found ${count??0}.`},409);

    const forwarded=(req.headers.get('x-forwarded-for')||req.headers.get('cf-connecting-ip')||'unknown').split(',')[0].trim();
    const salt=Deno.env.get('IP_HASH_SALT')||'ijr'; const ipHash=await sha256(`${salt}|${forwarded}`);
    const expiresAt=new Date(Date.now()+assessment.duration_minutes*60_000).toISOString();
    const {data:attempt,error:attErr}=await admin.from('attempts').insert({assessment_id:assessment.id,auth_user_id:user.id,student_id:studentId,group_code:group,session_id:sessionId,status:'active',expires_at:expiresAt,ip_hash:ipHash,user_agent:req.headers.get('user-agent')||null}).select('*').single();
    if(attErr) throw attErr;
    const q=await publicQuestion(admin,assessment.id,studentId,1);
    return json({attempt_id:attempt.id,expires_at:attempt.expires_at,integrity_strikes:0,question:q});
  }catch(e){console.error(e);return json({error:e instanceof Error?e.message:'Unexpected error'},500);}
});

async function publicQuestion(admin:any,assessmentId:string,studentId:string,order:number){
  const {data:assignment,error}=await admin.from('assignments').select('question_id,question_order,option_order').eq('assessment_id',assessmentId).eq('student_id',studentId).eq('question_order',order).single();
  if(error||!assignment) throw new Error('Assigned question not found');
  const {data:q,error:qErr}=await admin.from('questions_private').select('id,topic_code,prompt_es,options,diagram').eq('id',assignment.question_id).single();
  if(qErr||!q) throw new Error('Question not found');
  let orderIdx:number[]=Array.isArray(assignment.option_order)?assignment.option_order:shuffle([0,1,2,3]);
  if(!assignment.option_order) await admin.from('assignments').update({option_order:orderIdx}).eq('assessment_id',assessmentId).eq('student_id',studentId).eq('question_order',order);
  const values=Array.isArray(q.options)?q.options:[];
  return {id:q.id,order:assignment.question_order,topic_label:q.topic_code,prompt:q.prompt_es,diagram:q.diagram,options:orderIdx.map((idx:number,pos:number)=>({key:String.fromCharCode(65+pos),label:String(values[idx])}))};
}
