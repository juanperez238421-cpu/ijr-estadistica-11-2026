import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
const digest=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,'0')).join('');
Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  try{
    const token=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
    const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const {data:{user}}=await admin.auth.getUser(token); if(!user)return json({error:'Invalid session'},401);
    const b=await req.json(), attemptId=String(b.attempt_id||''), type=String(b.event_type||'').slice(0,80); if(!attemptId||!type)return json({error:'Missing event data'},400);
    const {data:attempt}=await admin.from('attempts').select('*,assessments(tab_strike_limit)').eq('id',attemptId).single();
    if(!attempt||attempt.auth_user_id!==user.id)return json({error:'Attempt not found'},404);
    if(['submitted','force_submitted','invalidated'].includes(attempt.status))return json({ok:true,ignored:true});
    let inserted:any=null;
    for(let tries=0;tries<4&&!inserted;tries++){
      const {data:last}=await admin.from('attempt_events').select('event_sequence,event_hash').eq('attempt_id',attemptId).order('event_sequence',{ascending:false}).limit(1).maybeSingle();
      const sequence=(last?.event_sequence||0)+1, serverTimestamp=new Date().toISOString(), metadata=b.metadata||{};
      const canonical=JSON.stringify({attempt_id:attemptId,sequence,event_type:type,client_timestamp:b.client_timestamp||null,server_timestamp:serverTimestamp,question_id:b.question_id||null,visibility_state:b.visibility_state||null,fullscreen_state:!!b.fullscreen_state,metadata});
      const prev=last?.event_hash||''; const hash=await digest(prev+'|'+canonical);
      const {data,error}=await admin.from('attempt_events').insert({attempt_id:attemptId,student_id:attempt.student_id,assessment_id:attempt.assessment_id,question_id:b.question_id||null,event_sequence:sequence,event_type:type,client_timestamp:b.client_timestamp||null,server_timestamp:serverTimestamp,visibility_state:b.visibility_state||null,fullscreen_state:!!b.fullscreen_state,metadata,prev_event_hash:prev||null,event_hash:hash}).select('id,event_sequence,event_hash').single();
      if(!error)inserted=data; else if(tries===3)throw error;
    }
    let strikes=attempt.integrity_strikes||0, invalidated=false;
    if(type==='INTEGRITY_STRIKE'){
      strikes=Math.max(strikes+1,Number((b.metadata||{}).strike||0));
      const limit=attempt.assessments?.tab_strike_limit||3;
      const patch:any={integrity_strikes:strikes,last_activity_at:new Date().toISOString()};
      if(strikes>=limit){patch.status='auto_invalidated';patch.finish_reason='auto_invalidated_integrity';patch.submitted_at=new Date().toISOString();invalidated=true;}
      await admin.from('attempts').update(patch).eq('id',attemptId);
    }else{
      await admin.from('attempts').update({last_activity_at:new Date().toISOString()}).eq('id',attemptId);
    }
    return json({ok:true,event_sequence:inserted.event_sequence,integrity_strikes:strikes,invalidated});
  }catch(e){console.error(e);return json({error:e instanceof Error?e.message:'Unexpected error'},500);}
});
