(() => {
  'use strict';
  const cfg = window.IJR_COLAB_ACTIVITY_CONFIG;
  const $ = id => document.getElementById(id);
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
  });
  const state = {
    attemptId:null,
    token:null,
    snapshot:null,
    authorizedExternal:false,
    restrictionEvents:0
  };

  async function rpc(name,args={}){
    const {data,error}=await sb.rpc(name,args);
    if(error) throw new Error(error.message||'Backend error');
    return data;
  }
  function setStatus(id,msg,bad=false){const el=$(id);if(!el)return;el.textContent=msg||'';el.style.color=bad?'#9b2020':'';}
  function save(){if(!state.attemptId||!state.token)return;sessionStorage.setItem(cfg.sessionStorageKey,JSON.stringify({attemptId:state.attemptId,token:state.token}));}
  function clear(){sessionStorage.removeItem(cfg.sessionStorageKey);}
  function fmtGrade(v){return Number(v??1).toFixed(2);}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function activityActive(){return !!state.snapshot && !state.snapshot.completed;}
  function fullscreenSupported(){return !!document.documentElement.requestFullscreen;}
  function isFullscreen(){return !!document.fullscreenElement;}

  async function logEvent(type,metadata={}){
    if(!state.attemptId||!state.token||!cfg.rpc.event)return null;
    try{
      const data=await rpc(cfg.rpc.event,{p_attempt_id:state.attemptId,p_attempt_token:state.token,p_event_type:type,p_metadata:metadata});
      if(Number.isFinite(Number(data?.restriction_events))){
        state.restrictionEvents=Number(data.restriction_events);
        updateRestrictionLabel();
      }
      return data;
    }catch(err){console.warn('activity event log failed',type,err);return null;}
  }

  function updateRestrictionLabel(){
    const el=$('restrictionLabel');
    if(!el)return;
    el.textContent=state.restrictionEvents>0?`Salidas no autorizadas: ${state.restrictionEvents}`:'Modo guiado activo';
    el.classList.toggle('attention',state.restrictionEvents>0);
  }

  function showFullscreenGate(message){
    const gate=$('fullscreenGate');
    if(!gate)return;
    $('fullscreenMessage').textContent=message||'Esta actividad solo puede continuar en pantalla completa.';
    gate.classList.remove('hidden');
  }
  function hideFullscreenGate(){ $('fullscreenGate')?.classList.add('hidden'); }

  async function enterFullscreen(){
    if(!cfg.requireFullscreen) return true;
    if(!fullscreenSupported()){
      showFullscreenGate('Este navegador no permite el modo de pantalla completa obligatorio. Usa Chrome o Edge en un computador para continuar.');
      return false;
    }
    if(isFullscreen()){hideFullscreenGate();return true;}
    try{
      await document.documentElement.requestFullscreen();
      hideFullscreenGate();
      await logEvent('FULLSCREEN_ENTER',{source:'student_action'});
      return true;
    }catch(err){
      showFullscreenGate('Debes aceptar la pantalla completa para continuar con los checkpoints.');
      return false;
    }
  }

  function enforceFullscreen(){
    if(!cfg.requireFullscreen||!activityActive()) return true;
    if(isFullscreen()){hideFullscreenGate();return true;}
    showFullscreenGate('Actividad pausada. Vuelve a pantalla completa para continuar.');
    return false;
  }

  function render(snapshot){
    state.snapshot=snapshot;
    $('setupPanel').classList.add('hidden');
    const completed=Number(snapshot.correct_count||0);
    const total=Number(snapshot.checkpoint_count||8);
    const isDone=!!snapshot.completed;
    $('studentLabel').textContent=`${snapshot.group_code} · ${snapshot.student_label}`;
    $('gradeLabel').textContent=`Nota ${fmtGrade(snapshot.grade)} / 5.00`;
    $('progressText').textContent=`${completed}/${total}`;
    $('progressBar').style.width=`${Math.min(100,completed/Math.max(1,total)*100)}%`;
    updateRestrictionLabel();

    if(isDone){
      $('activityPanel').classList.add('hidden');
      $('finishPanel').classList.remove('hidden');
      $('finishPoints').textContent=`${completed}/${total}`;
      $('finishGrade').textContent=fmtGrade(snapshot.grade);
      hideFullscreenGate();
      clear();
      if(document.fullscreenElement) document.exitFullscreen().catch(()=>{});
      return;
    }

    $('finishPanel').classList.add('hidden');
    $('activityPanel').classList.remove('hidden');
    $('checkpointList').innerHTML=(snapshot.checkpoints||[]).map(cp=>{
      const done=!!cp.correct;
      return `<article class="checkpoint ${done?'done':''}" data-key="${esc(cp.key)}">
        <h3>${esc(cp.sequence)}. ${esc(cp.title)}</h3>
        <p>${esc(cp.prompt)}</p>
        ${cp.code?`<div class="code">${esc(cp.code)}</div>`:''}
        ${cp.hint?`<p><strong>Hint:</strong> ${esc(cp.hint)}</p>`:''}
        ${done?'<div class="result ok">✓ Correcto · registrado</div>':`<div class="answer-row"><input inputmode="decimal" placeholder="Escribe el resultado"><button type="button" data-submit="${esc(cp.key)}">Comprobar</button></div><div class="result" data-result="${esc(cp.key)}"></div>`}
      </article>`;
    }).join('');
    document.querySelectorAll('[data-submit]').forEach(btn=>btn.addEventListener('click',()=>submitCheckpoint(btn.dataset.submit,btn)));
    enforceFullscreen();
  }

  async function submitCheckpoint(key,button){
    if(!enforceFullscreen()) return;
    const card=button.closest('.checkpoint');
    const input=card.querySelector('input');
    const result=card.querySelector(`[data-result="${CSS.escape(key)}"]`);
    const answer=input.value.trim();
    if(!answer){result.textContent='Escribe un resultado.';result.className='result bad';return;}
    button.disabled=true;result.textContent='Verificando…';result.className='result';
    try{
      const data=await rpc(cfg.rpc.submit,{p_attempt_id:state.attemptId,p_attempt_token:state.token,p_checkpoint_key:key,p_answer:answer});
      if(data.correct){
        result.textContent='✓ Correcto';result.className='result ok';
        setTimeout(()=>render(data.snapshot),250);
      }else{
        result.textContent='Todavía no. Revisa la salida de Colab y vuelve a intentar.';result.className='result bad';button.disabled=false;input.focus();
      }
    }catch(err){result.textContent=`No se pudo registrar: ${err.message}`;result.className='result bad';button.disabled=false;}
  }

  $('registrationForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const group=$('groupCode').value;
    const name=$('studentName').value.trim();
    if(!group||!name)return;

    if(cfg.requireFullscreen){
      if(!fullscreenSupported()){
        setStatus('setupStatus','Este navegador no permite pantalla completa obligatoria. Usa Chrome o Edge en computador.',true);
        return;
      }
      const ok=await enterFullscreen();
      if(!ok)return;
    }

    $('startButton').disabled=true;
    setStatus('setupStatus','Registrando nombre e iniciando…');
    try{
      const data=await rpc(cfg.rpc.start,{p_activity_slug:cfg.activitySlug,p_student_name:name,p_group_code:group,p_session_id:crypto.randomUUID(),p_user_agent:navigator.userAgent});
      state.attemptId=data.attempt_id;
      state.token=data.attempt_token;
      save();
      render(data.snapshot);
      setStatus('setupStatus','');
      await logEvent('ACTIVITY_READY',{identity_mode:data.identity_mode||'self_declared'});
    }catch(err){
      $('startButton').disabled=false;
      setStatus('setupStatus',`No fue posible iniciar: ${err.message}`,true);
      if(document.fullscreenElement) document.exitFullscreen().catch(()=>{});
    }
  });

  $('openColab')?.addEventListener('click',e=>{
    e.preventDefault();
    if(!enforceFullscreen())return;
    state.authorizedExternal=true;
    const win=window.open(e.currentTarget.href,'ijrColabWorkspace');
    if(!win){
      state.authorizedExternal=false;
      setStatus('activityStatus','El navegador bloqueó la pestaña de Colab. Permite ventanas emergentes para este sitio.',true);
      return;
    }
    try{win.opener=null;}catch(_){ }
    setStatus('activityStatus','Colab abierto. Cuando regreses, la actividad volverá a exigir pantalla completa.');
    logEvent('COLAB_LAUNCH',{authorized_external_transition:true});
  });

  $('enterFullscreenButton')?.addEventListener('click',enterFullscreen);

  document.addEventListener('fullscreenchange',async()=>{
    if(!activityActive()||!cfg.requireFullscreen)return;
    if(isFullscreen()){
      hideFullscreenGate();
      await logEvent('FULLSCREEN_ENTER',{source:'fullscreenchange'});
      return;
    }
    const allowed=state.authorizedExternal;
    showFullscreenGate(allowed?'Regresaste desde Colab. Activa nuevamente pantalla completa para continuar.':'Saliste de pantalla completa. La actividad quedó pausada hasta que regreses.');
    if(!allowed) await logEvent('FULLSCREEN_EXIT',{visibility:document.visibilityState});
  });

  document.addEventListener('visibilitychange',async()=>{
    if(!activityActive())return;
    if(document.visibilityState==='hidden'){
      if(!state.authorizedExternal && isFullscreen()) await logEvent('UNAUTHORIZED_LEAVE',{reason:'visibility_hidden_while_fullscreen'});
    }else{
      const cameFromAuthorizedColab=state.authorizedExternal;
      state.authorizedExternal=false;
      if(cameFromAuthorizedColab) setStatus('activityStatus','Regreso desde Colab confirmado.');
      enforceFullscreen();
    }
  });

  window.addEventListener('beforeunload',e=>{
    if(activityActive()){
      e.preventDefault();
      e.returnValue='';
    }
  });

  async function restore(){
    const raw=sessionStorage.getItem(cfg.sessionStorageKey);
    if(!raw)return;
    try{
      const saved=JSON.parse(raw);
      if(!saved.attemptId||!saved.token)return clear();
      state.attemptId=saved.attemptId;
      state.token=saved.token;
      const data=await rpc(cfg.rpc.resume,{p_attempt_id:state.attemptId,p_attempt_token:state.token});
      render(data.snapshot);
      if(activityActive()) showFullscreenGate('Sesión recuperada. Entra a pantalla completa para continuar.');
    }catch(err){
      clear();
      setStatus('setupStatus','La sesión anterior ya no está disponible. Puedes iniciar nuevamente.',true);
    }
  }
  restore();
})();