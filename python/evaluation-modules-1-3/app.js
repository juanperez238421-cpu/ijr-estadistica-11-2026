(() => {
  'use strict';

  const EVALUATION_SLUG = 'modules-1-3-2026-10-01';
  const ACTIVE_ATTEMPT_KEY = 'ijr-stat11-eval-modules123-active-v1';
  const cfg = window.IJR_PYTHON_HUB_CONFIG;
  const $ = id => document.getElementById(id);

  const RPC = {
    availability: cfg?.rpc?.evalAvailability || 'python_hub_eval_availability_v1',
    start: cfg?.rpc?.evalStart || 'python_hub_eval_start_v1',
    resume: cfg?.rpc?.evalResume || 'python_hub_eval_resume_v1',
    submit: cfg?.rpc?.evalSubmit || 'python_hub_eval_submit_v1',
    event: cfg?.rpc?.evalEvent || 'python_hub_eval_log_event_v1',
    finish: cfg?.rpc?.evalFinish || 'python_hub_eval_finish_v1'
  };

  const state = {
    hubSession:null,
    availability:null,
    attemptId:null,
    attemptToken:null,
    snapshot:null,
    hiddenAt:null,
    timerHandle:null,
    pyodide:null,
    pyodidePromise:null,
    lastCode:'',
    lastOutput:'',
    codeRan:false,
    pendingSnapshot:null,
    submitting:false,
    started:false,
    duplicateChannel:null,
    availabilityTimer:null,
    tabId:crypto.randomUUID()
  };

  if (!cfg || typeof fetch !== 'function') {
    document.body.innerHTML = '<main style="padding:40px;font-family:sans-serif"><h1>Evaluation configuration unavailable.</h1></main>';
    return;
  }

  function readJson(storage,key){
    try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; }
  }
  function writeJson(storage,key,value){
    try { storage.setItem(key,JSON.stringify(value)); } catch {}
  }
  function remove(storage,key){ try { storage.removeItem(key); } catch {} }
  function normalizeEmail(value){ return String(value || '').trim().toLowerCase(); }
  function validEmail(value){ return /^[^@\s]+@ijr\.edu\.co$/i.test(normalizeEmail(value)); }
  function esc(value){ return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  async function rpc(name,args={}){
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),12000);
    try{
      const res=await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/${encodeURIComponent(name)}`,{
        method:'POST',
        headers:{
          apikey:cfg.supabasePublishableKey,
          'Content-Type':'application/json',
          Accept:'application/json',
          'x-ijr-client':'stat11-mod123-eval-v1'
        },
        body:JSON.stringify(args),
        cache:'no-store',
        signal:controller.signal
      });
      const raw=await res.text();
      let data=null;
      try{ data=raw?JSON.parse(raw):null; }catch{ data=raw||null; }
      if(!res.ok) throw new Error(data?.message||data?.details||data?.hint||`Backend request failed (${res.status}).`);
      return data;
    }catch(err){
      if(err?.name==='AbortError') throw new Error('The evaluation service took too long to respond. Check the connection and retry.');
      throw err;
    }finally{ clearTimeout(timeout); }
  }

  function hubSession(){
    return readJson(localStorage,cfg.sessionStorageKey);
  }
  function ownerEmail(){
    return normalizeEmail(state.hubSession?.emails?.[0]);
  }
  function teamSize(){
    return Number(document.querySelector('input[name="teamSize"]:checked')?.value||0);
  }
  function setStatus(message,kind=''){
    const el=$('startupStatus');
    el.textContent=message||'';
    el.className=`status ${kind}`.trim();
  }
  function fmtWindow(value){
    if(!value) return '';
    return new Intl.DateTimeFormat('en-CO',{
      timeZone:'America/Bogota',weekday:'short',hour:'numeric',minute:'2-digit'
    }).format(new Date(value));
  }

  function updateTeamFields(){
    const size=teamSize();
    for(let i=2;i<=3;i++){
      const wrap=$(`memberWrap${i}`);
      const input=$(`memberEmail${i}`);
      const active=i<=size;
      wrap.classList.toggle('hidden',!active);
      input.required=active;
      if(!active) input.value='';
    }
  }

  async function loadAvailability(){
    if(state.availabilityTimer){
      clearTimeout(state.availabilityTimer);
      state.availabilityTimer=null;
    }
    state.hubSession=hubSession();
    if(!state.hubSession?.registrationId || !state.hubSession?.accessToken || !validEmail(ownerEmail())){
      $('availabilityBox').textContent='Open the Statistics 11 Learning Hub first and enter with your @ijr.edu.co institutional email.';
      setStatus('A valid Learning Hub session is required.','error');
      return false;
    }

    try{
      const raw=await rpc(RPC.availability,{
        p_registration_id:state.hubSession.registrationId,
        p_access_token:state.hubSession.accessToken,
        p_evaluation_slug:EVALUATION_SLUG
      });
      const data=Array.isArray(raw)?raw[0]:raw;
      state.availability=data;
      if(!data?.eligible){
        $('availabilityBox').textContent='This evaluation is not assigned to the current group.';
        return false;
      }

      $('memberEmail1').value=ownerEmail();
      const windowText=`${fmtWindow(data.opens_at)} – ${fmtWindow(data.closes_at)}`;
      if(data.state==='scheduled'){
        $('teamForm').classList.add('hidden');
        $('availabilityBox').innerHTML=`<strong>${esc(data.group_code)} · Scheduled</strong><br>Start window: ${esc(windowText)}. The module will open automatically at the scheduled time.`;
        state.availabilityTimer=setTimeout(loadAvailability,30000);
      }else if(data.state==='open'){
        $('availabilityBox').innerHTML=`<strong>${esc(data.group_code)} · Evaluation open</strong><br>Start window: ${esc(windowText)}. Once started, your team has up to ${Number(data.duration_minutes)} minutes and never beyond the class-window close time.`;
        $('teamForm').classList.remove('hidden');
        state.availabilityTimer=setTimeout(loadAvailability,30000);
      }else if(data.state==='attempted'){
        $('teamForm').classList.add('hidden');
        $('availabilityBox').innerHTML='<strong>Attempt already registered.</strong><br>Each student may participate in only one team attempt for this evaluation.';
      }else{
        $('teamForm').classList.add('hidden');
        $('availabilityBox').innerHTML=`<strong>Evaluation closed.</strong><br>The start window was ${esc(windowText)}.`;
      }
      return data.state==='open';
    }catch(err){
      $('availabilityBox').textContent='Could not verify the evaluation window.';
      setStatus(err.message,'error');
      return false;
    }
  }

  async function requestFullscreen(){
    if(document.fullscreenElement) return true;
    try{
      await document.documentElement.requestFullscreen({navigationUI:'hide'});
      return Boolean(document.fullscreenElement);
    }catch{
      return false;
    }
  }

  function collectEmails(){
    const size=teamSize();
    if(size<1||size>3) return [];
    return Array.from({length:size},(_,i)=>normalizeEmail($(`memberEmail${i+1}`).value));
  }

  function validateTeam(emails){
    if(emails.length<1||emails.length>3) return 'Select 1, 2 or 3 students.';
    if(emails[0]!==ownerEmail()) return 'Student 1 must be the current Learning Hub account.';
    if(emails.some(x=>!validEmail(x))) return 'Every participant must use a valid @ijr.edu.co institutional email.';
    if(new Set(emails).size!==emails.length) return 'Do not repeat the same institutional email.';
    if(!$('rulesConsent').checked) return 'Read and accept the evaluation rules before starting.';
    return '';
  }

  async function startAttempt(event){
    event.preventDefault();
    if(state.submitting) return;
    const emails=collectEmails();
    const issue=validateTeam(emails);
    if(issue){setStatus(issue,'error');return;}

    const fs=await requestFullscreen();
    if(!fs){
      setStatus('Fullscreen permission is required to start this evaluation. Allow fullscreen and try again.','error');
      return;
    }

    state.submitting=true;
    $('startButton').disabled=true;
    setStatus('Creating secure team attempt…');
    try{
      const data=await rpc(RPC.start,{
        p_registration_id:state.hubSession.registrationId,
        p_access_token:state.hubSession.accessToken,
        p_evaluation_slug:EVALUATION_SLUG,
        p_student_emails:emails,
        p_session_id:crypto.randomUUID(),
        p_user_agent:navigator.userAgent
      });
      if(!data?.attempt_id||!data?.attempt_token||!data?.snapshot) throw new Error('Incomplete evaluation session returned by backend.');
      state.attemptId=data.attempt_id;
      state.attemptToken=data.attempt_token;
      state.snapshot=data.snapshot;
      state.started=true;
      writeJson(sessionStorage,ACTIVE_ATTEMPT_KEY,{attemptId:state.attemptId,attemptToken:state.attemptToken});
      activateIntegrity();
      renderExam();
    }catch(err){
      setStatus(err.message,'error');
      if(document.fullscreenElement) document.exitFullscreen().catch(()=>{});
    }finally{
      state.submitting=false;
      $('startButton').disabled=false;
    }
  }

  async function resumeStored(){
    const saved=readJson(sessionStorage,ACTIVE_ATTEMPT_KEY);
    if(!saved?.attemptId||!saved?.attemptToken) return false;
    try{
      const snapshot=await rpc(RPC.resume,{p_attempt_id:saved.attemptId,p_attempt_token:saved.attemptToken});
      state.attemptId=saved.attemptId;
      state.attemptToken=saved.attemptToken;
      state.snapshot=snapshot;
      state.started=snapshot?.attempt?.status==='active';
      if(state.started){
        activateIntegrity();
        renderExam();
        if(!document.fullscreenElement) $('fullscreenGate').classList.remove('hidden');
      }else{
        renderFinish(snapshot);
      }
      return true;
    }catch{
      remove(sessionStorage,ACTIVE_ATTEMPT_KEY);
      return false;
    }
  }

  function updateMetrics(){
    const s=state.snapshot;
    if(!s?.attempt) return;
    const max=Number(s.assessment?.max_points||18);
    const pts=Number(s.attempt.points_remaining||0);
    $('pointsMetric').textContent=`${pts} / ${max} pts`;
    $('strikeMetric').textContent=`${Number(s.attempt.integrity_strikes||0)} / ${Number(s.assessment?.integrity_strike_limit||3)} exits`;
    $('teamBadge').textContent=(s.members||[]).map(m=>m.display_name||m.email).join(' · ');
    $('watermark').textContent=`${s.attempt.group_code||''} · ${(s.members||[]).map(m=>m.email).join(' · ')} · ${String(s.attempt.id||'').slice(0,8).toUpperCase()}`;
  }

  function startTimer(){
    clearInterval(state.timerHandle);
    const tick=async()=>{
      const expires=Date.parse(state.snapshot?.attempt?.expires_at||'');
      if(!Number.isFinite(expires)) return;
      const remaining=Math.max(0,expires-Date.now());
      const total=Math.floor(remaining/1000);
      const mm=String(Math.floor(total/60)).padStart(2,'0');
      const ss=String(total%60).padStart(2,'0');
      $('timer').textContent=`${mm}:${ss}`;
      if(remaining<=0){
        clearInterval(state.timerHandle);
        try{
          const snap=await rpc(RPC.resume,{p_attempt_id:state.attemptId,p_attempt_token:state.attemptToken});
          state.snapshot=snap;
          renderFinish(snap);
        }catch{}
      }
    };
    tick();
    state.timerHandle=setInterval(tick,1000);
  }

  function renderExam(){
    const s=state.snapshot;
    if(!s?.attempt) return;
    if(s.attempt.status!=='active' || !s.current_question){
      renderFinish(s);
      return;
    }
    $('startupPanel').classList.add('hidden');
    $('feedbackPanel').classList.add('hidden');
    $('finishPanel').classList.add('hidden');
    $('examPanel').classList.remove('hidden');
    $('lockGate').classList.add('hidden');

    const q=s.current_question;
    const answered=Number(s.attempt.answered_count||0);
    $('moduleLabel').textContent=`MODULE 0${Number(q.module||0)} · ${String(q.type||'').replace('_',' ').toUpperCase()}`;
    $('questionNumber').textContent=`Question ${answered+1} / ${Number(s.assessment.question_count||18)}`;
    $('questionPrompt').textContent=q.prompt||'';
    $('progressBar').style.width=`${Math.round(100*answered/Number(s.assessment.question_count||18))}%`;
    $('examStatus').textContent='';
    $('confirmButton').disabled=true;
    state.lastCode='';
    state.lastOutput='';
    state.codeRan=false;
    renderAnswer(q);
    updateMetrics();
    startTimer();
  }

  function renderAnswer(q){
    const mount=$('answerMount');
    if(q.type==='true_false'||q.type==='multiple_choice'){
      const choices=Array.isArray(q.choices)?q.choices:[];
      mount.innerHTML=`<div class="options">${choices.map((choice,i)=>`<label class="option"><input type="radio" name="evaluationAnswer" value="${esc(choice)}"><span><strong>${String.fromCharCode(65+i)}.</strong> ${esc(choice)}</span></label>`).join('')}</div>`;
      mount.querySelectorAll('input[name="evaluationAnswer"]').forEach(el=>el.addEventListener('change',()=>{$('confirmButton').disabled=false;}));
      $('answerPolicy').textContent='Your selected option becomes permanent when confirmed.';
    }else if(q.type==='short_text'){
      mount.innerHTML='<textarea id="shortAnswer" class="short-answer" rows="3" maxlength="3000" placeholder="Write your final response"></textarea>';
      $('shortAnswer').addEventListener('input',()=>{$('confirmButton').disabled=!$('shortAnswer').value.trim();});
      $('answerPolicy').textContent='Open response · one submission only.';
    }else if(q.type==='code'){
      mount.innerHTML=`<div class="code-shell">
        <div class="code-toolbar"><strong>Python 3 · code cell</strong><button id="runCode" class="run-button" type="button">▶ Run</button></div>
        <textarea id="codeEditor" class="code-editor" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="# Write your complete Python solution"></textarea>
        <pre id="console" class="console">Python runtime ready to load when you press Run.</pre>
      </div>`;
      $('codeEditor').addEventListener('input',()=>{state.codeRan=false;state.lastCode='';state.lastOutput='';$('confirmButton').disabled=true;});
      $('runCode').addEventListener('click',runCode);
      $('answerPolicy').textContent='Run this exact code successfully before confirming. The code and observed output are stored.';
    }
  }

  async function ensurePyodide(){
    if(state.pyodide) return state.pyodide;
    if(state.pyodidePromise) return state.pyodidePromise;
    state.pyodidePromise=(async()=>{
      if(typeof window.loadPyodide!=='function') throw new Error('Python runtime loader is unavailable.');
      state.pyodide=await window.loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'});
      return state.pyodide;
    })();
    return state.pyodidePromise;
  }

  async function runCode(){
    const button=$('runCode');
    const editor=$('codeEditor');
    const consoleNode=$('console');
    const code=editor.value;
    if(!code.trim()){consoleNode.textContent='Write your Python solution first.';return;}
    button.disabled=true;
    consoleNode.textContent='Running Python…';
    try{
      const py=await ensurePyodide();
      const stdout=[],stderr=[];
      py.setStdout({batched:m=>stdout.push(m)});
      py.setStderr({batched:m=>stderr.push(m)});
      let result;
      try{
        result=await py.runPythonAsync(code);
        if(result!==undefined&&result!==null){
          const txt=String(result);
          if(txt!=='None') stdout.push(txt);
          if(typeof result.destroy==='function') result.destroy();
        }
      }catch(err){stderr.push(String(err?.message||err));}
      const output=stdout.join('\n').trim();
      const errors=stderr.join('\n').trim();
      if(errors){
        state.codeRan=false;
        consoleNode.textContent=`ERROR\n${errors}`;
        $('confirmButton').disabled=true;
      }else{
        state.codeRan=true;
        state.lastCode=code;
        state.lastOutput=output;
        consoleNode.textContent=output||'(No visible output. Use print(...) as requested.)';
        $('confirmButton').disabled=!output;
      }
    }catch(err){
      state.codeRan=false;
      consoleNode.textContent=`Runtime error: ${err.message}`;
      $('confirmButton').disabled=true;
    }finally{button.disabled=false;}
  }

  function finalPayload(q){
    if(q.type==='true_false'||q.type==='multiple_choice'){
      const selected=document.querySelector('input[name="evaluationAnswer"]:checked');
      return selected?{answer:selected.value,code:'',output:''}:null;
    }
    if(q.type==='short_text'){
      const value=$('shortAnswer')?.value.trim();
      return value?{answer:value,code:'',output:''}:null;
    }
    if(q.type==='code'){
      const code=$('codeEditor')?.value||'';
      if(!state.codeRan||code!==state.lastCode||!state.lastOutput) return null;
      return {answer:state.lastOutput,code,output:state.lastOutput};
    }
    return null;
  }

  async function submitAnswer(){
    if(state.submitting) return;
    const q=state.snapshot?.current_question;
    if(!q) return;
    const payload=finalPayload(q);
    if(!payload){$('examStatus').textContent='Complete the final answer first.';return;}

    state.submitting=true;
    $('confirmButton').disabled=true;
    $('examStatus').textContent='Registering final answer…';
    try{
      const data=await rpc(RPC.submit,{
        p_attempt_id:state.attemptId,
        p_attempt_token:state.attemptToken,
        p_question_id:q.id,
        p_answer:payload.answer,
        p_code_snapshot:payload.code,
        p_observed_output:payload.output
      });
      state.pendingSnapshot=data.snapshot;
      state.snapshot=data.snapshot;
      updateMetrics();
      showFeedback(Boolean(data.correct),Number(data.points_delta||0));
    }catch(err){
      $('examStatus').textContent=err.message;
      if(/already registered/i.test(err.message)){
        try{state.snapshot=await rpc(RPC.resume,{p_attempt_id:state.attemptId,p_attempt_token:state.attemptToken});renderExam();}catch{}
      }else $('confirmButton').disabled=false;
    }finally{state.submitting=false;}
  }

  function showFeedback(correct,delta){
    $('examPanel').classList.add('hidden');
    $('feedbackPanel').classList.remove('hidden');
    $('feedbackTitle').className=correct?'feedback-correct':'feedback-wrong';
    $('feedbackTitle').textContent=correct?'Correct response registered.':'Incorrect response registered.';
    $('feedbackCopy').textContent=correct
      ? 'The answer is final. No point was deducted.'
      : `The answer is final and cannot be corrected. ${Math.abs(delta)} point was deducted immediately.`;
    const a=state.snapshot.attempt;
    $('feedbackMetrics').innerHTML=`
      <div><strong>${Number(a.points_remaining)}</strong><span>points remaining</span></div>
      <div><strong>${Number(a.correct_count)}</strong><span>correct</span></div>
      <div><strong>${Number(a.incorrect_count)}</strong><span>incorrect</span></div>`;
    $('nextButton').textContent=a.status==='active'&&state.snapshot.current_question?'Next question':'View final result';
  }

  function renderFinish(snapshot){
    state.snapshot=snapshot||state.snapshot;
    clearInterval(state.timerHandle);
    $('startupPanel').classList.add('hidden');
    $('examPanel').classList.add('hidden');
    $('feedbackPanel').classList.add('hidden');
    $('fullscreenGate').classList.add('hidden');
    $('finishPanel').classList.remove('hidden');
    state.started=false;

    const a=state.snapshot?.attempt||{};
    const assessment=state.snapshot?.assessment||{};
    const status=a.status||'submitted';
    $('finishTitle').textContent=status==='integrity_locked'
      ? 'Evaluation ended by integrity limit'
      : status==='expired'
        ? 'Evaluation time expired'
        : 'Evaluation submitted';
    $('finishSummary').innerHTML=`
      <div><strong>${Number(a.points_remaining||0)} / ${Number(assessment.max_points||18)}</strong><span>final raw points</span></div>
      <div><strong>${Number(a.correct_count||0)}</strong><span>correct answers</span></div>
      <div><strong>${Number(a.integrity_strikes||0)}</strong><span>integrity exits</span></div>`;
    updateMetrics();
    if(document.fullscreenElement) document.exitFullscreen().catch(()=>{});
    if(status!=='active') remove(sessionStorage,ACTIVE_ATTEMPT_KEY);
  }

  async function logIntegrity(type,metadata={},show=true){
    if(!state.started||!state.attemptId||!state.attemptToken) return null;
    try{
      const data=await rpc(RPC.event,{
        p_attempt_id:state.attemptId,
        p_attempt_token:state.attemptToken,
        p_event_type:type,
        p_metadata:metadata
      });
      if(data?.penalized && show){
        $('integrityBanner').classList.remove('hidden');
        $('integrityBanner').textContent=`Integrity event registered: −${Math.abs(Number(data.points_delta||0))} point. Strike ${Number(data.integrity_strikes)} / 3.`;
      }
      if(data?.status==='integrity_locked'){
        state.started=false;
        $('lockGate').classList.remove('hidden');
        const snap=await rpc(RPC.resume,{p_attempt_id:state.attemptId,p_attempt_token:state.attemptToken});
        state.snapshot=snap;
        setTimeout(()=>renderFinish(snap),900);
      }else if(data){
        state.snapshot.attempt.integrity_strikes=data.integrity_strikes;
        state.snapshot.attempt.points_remaining=data.points_remaining;
        updateMetrics();
      }
      return data;
    }catch{return null;}
  }

  function activateIntegrity(){
    if(state.integrityActivated) return;
    state.integrityActivated=true;

    document.addEventListener('visibilitychange',async()=>{
      if(!state.started) return;
      if(document.visibilityState==='hidden'){
        state.hiddenAt=performance.now();
        logIntegrity('VISIBILITY_HIDDEN',{visibility:'hidden'},false);
      }else{
        const ms=state.hiddenAt?Math.round(performance.now()-state.hiddenAt):0;
        state.hiddenAt=null;
        logIntegrity('VISIBILITY_VISIBLE',{hidden_duration_ms:ms},false);
        if(ms>=600) await logIntegrity('VISIBILITY_HIDDEN_CONFIRMED',{hidden_duration_ms:ms},true);
      }
    });

    window.addEventListener('blur',()=>{if(state.started)logIntegrity('WINDOW_BLUR',{},false);});
    window.addEventListener('focus',()=>{if(state.started)logIntegrity('WINDOW_FOCUS',{},false);});

    document.addEventListener('fullscreenchange',async()=>{
      if(!state.started) return;
      if(document.fullscreenElement){
        $('fullscreenGate').classList.add('hidden');
        await logIntegrity('FULLSCREEN_ENTER',{},false);
      }else{
        await logIntegrity('FULLSCREEN_EXIT',{},true);
        if(state.started) $('fullscreenGate').classList.remove('hidden');
      }
    });

    ['copy','cut','paste'].forEach(type=>document.addEventListener(type,e=>{
      if(!state.started) return;
      e.preventDefault();
      logIntegrity(`${type.toUpperCase()}_ATTEMPT`,{},false);
    }));
    document.addEventListener('contextmenu',e=>{
      if(!state.started) return;
      e.preventDefault();
      logIntegrity('CONTEXT_MENU',{},false);
    });
    document.addEventListener('keydown',e=>{
      if(!state.started) return;
      if(e.key==='PrintScreen') logIntegrity('SCREENSHOT_KEY_ATTEMPT',{key:'PrintScreen'},false);
      if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='p'){
        e.preventDefault();logIntegrity('PRINT_SHORTCUT',{},false);
      }
    });
    window.addEventListener('pagehide',()=>{if(state.started)logIntegrity('PAGE_HIDE',{},false);});
    window.addEventListener('beforeunload',e=>{
      if(state.started){e.preventDefault();e.returnValue='';}
    });

    if('BroadcastChannel' in window){
      state.duplicateChannel=new BroadcastChannel('ijr-stat11-modules123-evaluation');
      state.duplicateChannel.postMessage({type:'HELLO',tabId:state.tabId,attemptId:state.attemptId});
      state.duplicateChannel.onmessage=async event=>{
        if(event.data?.tabId===state.tabId) return;
        if(event.data?.type==='HELLO'){
          state.duplicateChannel.postMessage({type:'ACTIVE',tabId:state.tabId,attemptId:state.attemptId});
        }
        if(event.data?.type==='ACTIVE'&&state.started){
          await logIntegrity('SECOND_TAB_DETECTED',{other_attempt_id:event.data?.attemptId||null},true);
        }
      };
    }
  }

  async function returnFullscreen(){
    const ok=await requestFullscreen();
    if(ok) $('fullscreenGate').classList.add('hidden');
  }

  async function init(){
    document.querySelectorAll('input[name="teamSize"]').forEach(el=>el.addEventListener('change',updateTeamFields));
    $('teamForm').addEventListener('submit',startAttempt);
    $('confirmButton').addEventListener('click',submitAnswer);
    $('returnFullscreen').addEventListener('click',returnFullscreen);
    $('nextButton').addEventListener('click',()=>{
      if(state.snapshot?.attempt?.status==='active'&&state.snapshot?.current_question) renderExam();
      else renderFinish(state.snapshot);
    });

    if(await resumeStored()) return;
    await loadAvailability();
  }

  document.addEventListener('DOMContentLoaded',init);
})();