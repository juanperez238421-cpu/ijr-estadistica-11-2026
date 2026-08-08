(() => {
  'use strict';
  const cfg = window.IJR_ASSESSMENT_CONFIG;
  const $ = (id) => document.getElementById(id);
  const els = {
    setup:$('setupPanel'), exam:$('examPanel'), finish:$('finishPanel'), config:$('configPanel'),
    form:$('registrationForm'), status:$('setupStatus'), examStatus:$('examStatus'), timer:$('timer'),
    progress:$('progressText'), progressBar:$('progressBar'), topic:$('topicLabel'), prompt:$('questionPrompt'),
    diagram:$('diagram'), answers:$('answerForm'), submit:$('submitAnswer'), attemptBadge:$('attemptBadge'),
    banner:$('integrityBanner'), watermark:$('watermark'), gate:$('fullscreenGate'), returnFullscreen:$('returnFullscreen'),
    finishTitle:$('finishTitle'), finishSummary:$('finishSummary')
  };
  const configured = cfg && /^https:\/\//.test(cfg.supabaseUrl) && !cfg.supabaseUrl.includes('REPLACE_') && !cfg.supabaseAnonKey.includes('REPLACE_');
  if (!configured) { els.setup.classList.add('hidden'); els.config.classList.remove('hidden'); return; }

  const supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:false}
  });
  const state = {
    attemptId:null, sessionId:crypto.randomUUID(), studentId:null, question:null, questionIndex:0,
    expiresAt:null, submitted:false, finishing:false, strikes:0, hiddenStarted:null, heartbeat:null, timer:null,
    lastVisibility:document.visibilityState, started:false
  };

  async function invoke(name, body={}) {
    const {data,error} = await supabase.functions.invoke(name,{body});
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }
  async function ensureAuth(){
    let {data:{session}}=await supabase.auth.getSession();
    if(!session){const r=await supabase.auth.signInAnonymously(); if(r.error) throw r.error; session=r.data.session;}
    return session;
  }
  async function logEvent(type, metadata={}) {
    if(!state.attemptId) return;
    try { await invoke(cfg.endpoints.event,{attempt_id:state.attemptId,question_id:state.question?.id||null,event_type:type,client_timestamp:new Date().toISOString(),visibility_state:document.visibilityState,fullscreen_state:!!document.fullscreenElement,metadata}); }
    catch(err){ console.warn('event log failed',type,err); }
  }
  function setStatus(el,msg,isError=false){el.textContent=msg||'';el.style.color=isError?'#8b1e1e':'';}
  function shortAttempt(){return state.attemptId?state.attemptId.slice(0,8).toUpperCase():'';}
  function updateWatermark(){
    if(!cfg.watermarkEnabled||!state.studentId||!state.attemptId){els.watermark.textContent='';return;}
    const stamp=new Date().toLocaleTimeString('es-CO',{hour12:false});
    const token=`${state.studentId} · ${shortAttempt()} · ${stamp}`;
    els.watermark.textContent=(token+'     ').repeat(28);
  }
  function renderQuestion(q){
    state.question=q; state.questionIndex=q.order||state.questionIndex+1;
    els.progress.textContent=`Pregunta ${state.questionIndex} / ${cfg.questionsPerAttempt}`;
    els.progressBar.style.width=`${Math.min(100,state.questionIndex/cfg.questionsPerAttempt*100)}%`;
    els.topic.textContent=q.topic_label||''; els.prompt.textContent=q.prompt||''; els.answers.innerHTML='';
    els.diagram.innerHTML=q.diagram_html||''; els.submit.disabled=true;
    const options=q.options||[];
    options.forEach((o,i)=>{
      const label=document.createElement('label'); label.className='option';
      const input=document.createElement('input'); input.type='radio'; input.name='answer'; input.value=o.key; input.addEventListener('change',()=>{els.submit.disabled=false; logEvent('OPTION_SELECTED',{option:o.key});});
      const span=document.createElement('span'); span.textContent=`${String.fromCharCode(65+i)}. ${o.label}`;
      label.append(input,span); els.answers.appendChild(label);
    });
    setStatus(els.examStatus,''); logEvent('QUESTION_SHOWN',{order:state.questionIndex});
  }
  function timerTick(){
    if(!state.expiresAt) return;
    const ms=new Date(state.expiresAt).getTime()-Date.now();
    const clamped=Math.max(0,ms), s=Math.floor(clamped/1000), m=Math.floor(s/60), sec=s%60;
    els.timer.textContent=`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    updateWatermark();
    if(ms<=0 && !state.finishing) finishAttempt('time_expired');
  }
  async function enterFullscreen(){
    if(!cfg.requireFullscreen||document.fullscreenElement) return true;
    try{await document.documentElement.requestFullscreen();return true;}catch(e){await logEvent('FULLSCREEN_REQUEST_FAILED',{message:e.message});return false;}
  }
  async function registerStrike(source,durationMs=0){
    state.strikes += 1;
    await logEvent('INTEGRITY_STRIKE',{source,duration_ms:durationMs,strike:state.strikes,limit:cfg.tabStrikeLimit});
    els.banner.classList.remove('hidden');
    els.banner.textContent=`Advertencia ${state.strikes}/${cfg.tabStrikeLimit}: se registró ${source}. Al tercer cambio de pestaña confirmado el intento se anula.`;
    if(state.strikes>=cfg.tabStrikeLimit){await finishAttempt('auto_invalidated_integrity');}
  }
  async function finishAttempt(reason='student_finished'){
    if(state.finishing||!state.attemptId)return; state.finishing=true;
    try{
      const result=await invoke(cfg.endpoints.finish,{attempt_id:state.attemptId,reason});
      state.submitted=true; clearInterval(state.heartbeat); clearInterval(state.timer);
      els.exam.classList.add('hidden'); els.timer.classList.add('hidden'); els.gate.classList.add('hidden'); els.finish.classList.remove('hidden');
      const invalid=String(reason).startsWith('auto_invalidated');
      els.finishTitle.textContent=invalid?'Intento anulado automáticamente':'Evaluación enviada correctamente';
      if(invalid) els.finishTitle.classList.add('invalidated');
      const rows=[['Estado',result.status||reason],['Respuestas',`${result.answered_count??state.questionIndex}/${cfg.questionsPerAttempt}`],['Puntaje',result.raw_points!=null?`${result.raw_points.toFixed?.(2)??result.raw_points} / ${cfg.maxRawPoints}`:'Pendiente'],['Nota',result.grade!=null?`${result.grade.toFixed?.(2)??result.grade} / ${cfg.gradeMax}`:'Pendiente'],['Aprobación',result.grade!=null?(result.grade>=cfg.passingGrade?'Sí':'No'):'Pendiente']];
      els.finishSummary.innerHTML=rows.map(([a,b])=>`<div class="summary-row"><strong>${a}</strong><span>${b}</span></div>`).join('');
      await logEvent('ATTEMPT_FINISHED',{reason});
      if(document.fullscreenElement) document.exitFullscreen().catch(()=>{});
    }catch(err){state.finishing=false;setStatus(els.examStatus,'No se pudo confirmar el cierre. Mantén esta pestaña abierta y avisa al docente.',true);}
  }

  els.form.addEventListener('submit',async(e)=>{
    e.preventDefault(); setStatus(els.status,'Preparando intento…');
    const studentName=$('studentName').value.trim(), studentId=$('studentId').value.trim().toUpperCase(), groupCode=$('groupCode').value;
    if(!/^[A-Z0-9°_-]{3,30}$/.test(studentId)){setStatus(els.status,'Código de estudiante no válido.',true);return;}
    try{
      await ensureAuth();
      const result=await invoke(cfg.endpoints.start,{assessment_slug:cfg.assessmentSlug,student_name:studentName,student_id:studentId,group_code:groupCode,session_id:state.sessionId});
      state.attemptId=result.attempt_id; state.studentId=studentId; state.expiresAt=result.expires_at; state.strikes=result.integrity_strikes||0; state.started=true;
      els.attemptBadge.textContent=`Intento ${shortAttempt()}`; els.setup.classList.add('hidden'); els.exam.classList.remove('hidden'); els.timer.classList.remove('hidden');
      await enterFullscreen(); updateWatermark(); renderQuestion(result.question);
      state.heartbeat=setInterval(()=>logEvent('HEARTBEAT',{question_order:state.questionIndex}),cfg.heartbeatMs);
      state.timer=setInterval(timerTick,500); timerTick(); setStatus(els.status,''); await logEvent('ATTEMPT_STARTED',{session_id:state.sessionId});
    }catch(err){setStatus(els.status,`No fue posible iniciar: ${err.message}`,true);}
  });

  els.submit.addEventListener('click',async()=>{
    const selected=els.answers.querySelector('input[name=answer]:checked'); if(!selected||!state.question)return;
    els.submit.disabled=true; [...els.answers.elements].forEach(x=>x.disabled=true); setStatus(els.examStatus,'Enviando respuesta…');
    try{
      await logEvent('ANSWER_SUBMIT_STARTED',{selected_option:selected.value});
      const result=await invoke(cfg.endpoints.submit,{attempt_id:state.attemptId,question_id:state.question.id,selected_option:selected.value});
      await logEvent('ANSWER_ACKNOWLEDGED',{question_id:state.question.id});
      if(result.finished){await finishAttempt('all_questions_answered');return;}
      renderQuestion(result.next_question);
    }catch(err){els.submit.disabled=false;[...els.answers.elements].forEach(x=>x.disabled=false);setStatus(els.examStatus,'La respuesta no quedó confirmada. Reintenta sin cerrar la pestaña.',true);}
  });

  document.addEventListener('visibilitychange',async()=>{
    if(!state.started||state.submitted)return;
    if(document.visibilityState==='hidden'){state.hiddenStarted=performance.now();await logEvent('VISIBILITY_HIDDEN');}
    else {const duration=state.hiddenStarted?Math.round(performance.now()-state.hiddenStarted):0;state.hiddenStarted=null;await logEvent('VISIBILITY_VISIBLE',{hidden_duration_ms:duration});if(duration>=cfg.hiddenGraceMs)await registerStrike('cambio de pestaña',duration);}
  });
  window.addEventListener('blur',()=>{if(state.started&&!state.submitted)logEvent('WINDOW_BLUR');});
  window.addEventListener('focus',()=>{if(state.started&&!state.submitted)logEvent('WINDOW_FOCUS');});
  document.addEventListener('fullscreenchange',async()=>{
    if(!state.started||state.submitted)return;
    if(document.fullscreenElement){els.gate.classList.add('hidden');await logEvent('FULLSCREEN_ENTER');}
    else {await logEvent('FULLSCREEN_EXIT');if(cfg.fullscreenPolicy==='pause')els.gate.classList.remove('hidden');}
  });
  els.returnFullscreen.addEventListener('click',enterFullscreen);
  ['copy','cut','paste'].forEach(type=>document.addEventListener(type,e=>{if(!state.started||state.submitted)return;logEvent(`${type.toUpperCase()}_ATTEMPT`);if(cfg.blockCopyPaste)e.preventDefault();}));
  document.addEventListener('contextmenu',e=>{if(!state.started||state.submitted)return;logEvent('CONTEXT_MENU');if(cfg.blockContextMenu)e.preventDefault();});
  window.addEventListener('offline',()=>{if(state.started&&!state.submitted){logEvent('NETWORK_OFFLINE');setStatus(els.examStatus,'Conexión perdida. No avances hasta recuperar conexión.',true);}});
  window.addEventListener('online',()=>{if(state.started&&!state.submitted){logEvent('NETWORK_ONLINE');setStatus(els.examStatus,'Conexión recuperada.');}});
  window.addEventListener('pagehide',()=>{if(state.started&&!state.submitted)logEvent('PAGE_HIDE');});
  document.addEventListener('keydown',e=>{
    if(!state.started||state.submitted)return;
    if(e.key==='PrintScreen'){logEvent('SCREENSHOT_KEY_ATTEMPT',{key:'PrintScreen'});els.banner.classList.remove('hidden');els.banner.textContent='Capturas de pantalla prohibidas. Se registró una tecla de captura observable por el navegador.';}
    if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='p'){e.preventDefault();logEvent('PRINT_SHORTCUT');}
  });
  window.addEventListener('beforeunload',e=>{if(state.started&&!state.submitted){e.preventDefault();e.returnValue='';}});

  if('BroadcastChannel' in window){
    const channel=new BroadcastChannel('ijr-stat11-assessment');
    channel.postMessage({type:'HELLO',sessionId:state.sessionId});
    channel.onmessage=(ev)=>{if(ev.data?.type==='HELLO'&&ev.data.sessionId!==state.sessionId){channel.postMessage({type:'ACTIVE',sessionId:state.sessionId});} if(ev.data?.type==='ACTIVE'&&state.started&&!state.submitted){logEvent('SECOND_TAB_DETECTED');els.banner.classList.remove('hidden');els.banner.textContent='Se detectó otra pestaña del examen. Ciérrala y continúa únicamente aquí.';}};
  }
})();
