(() => {
  'use strict';

  const cfg=window.IJR_MASTER_CONFIG;
  const $=id=>document.getElementById(id);
  const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const SNAPSHOT_KEY=`${cfg.teacherSessionKey}-class1-v10`;
  const POLL_VISIBLE_MS=3000,POLL_HIDDEN_MS=12000,MAX_BACKOFF_MS=30000;
  let token='',snapshot=null,timer=null,loading=false,failures=0,lastSuccessAt=0,selectedAttemptId=null,pendingFactorId='',pendingChallengeId='';

  const RPC_OPERATION={
    teacher_learning_activity_dashboard_v11:'statistics_dashboard',
    teacher_learning_activity_detail_v11:'statistics_detail',
    teacher_learning_activity_update_registration_v10:'statistics_update_registration',
    teacher_learning_activity_delete_v10:'statistics_delete_registration'
  };
  async function rpc(name,args={}){
    const operation=RPC_OPERATION[name];
    if(!operation)throw new Error('Operación docente no permitida');
    const {data,error}=await sb.functions.invoke('teacher-auth-gateway',{body:{operation,args}});
    if(error)throw new Error(error.message||'Backend error');
    if(data?.error)throw new Error(data.error);
    return data?.data;
  }
  async function beginMfa(){
    const {data:aal,error:aalError}=await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if(aalError)throw aalError;
    if(aal?.currentLevel==='aal2'){
      const {data:{session}}=await sb.auth.getSession();
      token=session?.access_token||'';
      if(!token)throw new Error('Sesión no disponible');
      $('mfaPanel').classList.add('hidden');
      $('loginStatus').textContent='';
      restoreCachedSnapshot();
      await load(true);
      return;
    }
    const {data:factors,error:factorsError}=await sb.auth.mfa.listFactors();
    if(factorsError)throw factorsError;
    let factor=(factors?.totp||[]).find(item=>item.status==='verified');
    if(!factor){
      const {data:enrolled,error:enrollError}=await sb.auth.mfa.enroll({factorType:'totp',friendlyName:'Panel docente IJR'});
      if(enrollError)throw enrollError;
      factor=enrolled;
      $('mfaQr').src=enrolled.totp.qr_code;
      $('mfaQr').classList.remove('hidden');
      $('mfaHelp').textContent='Escanea el QR con tu aplicación autenticadora y escribe el código de seis dígitos.';
    }else{
      $('mfaQr').classList.add('hidden');
      $('mfaHelp').textContent='Escribe el código de seis dígitos de tu aplicación autenticadora.';
    }
    pendingFactorId=factor.id;
    const {data:challenge,error:challengeError}=await sb.auth.mfa.challenge({factorId:pendingFactorId});
    if(challengeError)throw challengeError;
    pendingChallengeId=challenge.id;
    $('mfaPanel').classList.remove('hidden');
    $('mfaCode').focus();
  }
  async function bootstrapAuth(){
    const {data:{session}}=await sb.auth.getSession();
    if(!session)return;
    try{await beginMfa()}catch(err){$('loginStatus').textContent=`Acceso pendiente: ${err.message}`}
  }
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function fmtGrade(v){return v==null||!Number.isFinite(Number(v))?'—':Number(v).toFixed(2)}
  function fmtTime(v,full=false){if(!v)return'—';try{return new Date(v).toLocaleString('es-CO',full?{dateStyle:'short',timeStyle:'medium'}:{hour:'2-digit',minute:'2-digit',second:'2-digit'})}catch{return'—'}}
  function visibleGrade(s){return s?.status==='submitted'?s.grade:(s?.projected_grade??s?.grade)}
  function participants(s){return Array.isArray(s?.participants)?s.participants:[]}
  function isAuthError(err){return /invalid|expired|teacher session/i.test(String(err?.message||err))}
  function emailOk(v){return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@ijr\.edu\.co$/i.test(String(v||''))}

  function setLive(mode,text){const el=$('liveStatus');if(!el)return;el.className=`live-status ${mode}`;el.textContent=text}
  function schedule(ms){clearTimeout(timer);if(token)timer=setTimeout(()=>load(),ms)}
  function cacheSnapshot(){try{sessionStorage.setItem(SNAPSHOT_KEY,JSON.stringify(snapshot))}catch{}}
  function restoreCachedSnapshot(){try{const raw=sessionStorage.getItem(SNAPSHOT_KEY);if(!raw)return false;snapshot=JSON.parse(raw);if(!snapshot)return false;render();setLive('stale','Saved view');return true}catch{return false}}

  function sessionSearchText(s){return [s.group_code,...participants(s).flatMap(p=>[p.display_name,p.institutional_email,p.email_normalized])].filter(Boolean).join(' ').toLowerCase()}
  function filteredSessions(){
    const group=$('groupFilter').value,search=$('searchInput').value.trim().toLowerCase(),activeOnly=$('activeOnly').checked;
    return Array.from(snapshot?.sessions||[]).filter(s=>(!group||s.group_code===group)&&(!activeOnly||s.status==='active')&&(!search||sessionSearchText(s).includes(search)));
  }

  function studentCell(s){
    const list=participants(s);if(!list.length)return '<span class="muted">Legacy registration</span>';
    return `<div class="students">${list.map(p=>{const name=p.display_name||p.institutional_email||'Student',email=p.institutional_email||p.email_normalized||'',showName=email&&String(name).toLowerCase()!==String(email).toLowerCase();return `<div class="student-line">${showName?`<span class="student-name">${esc(name)}</span>`:''}<span class="student-email">${esc(email||name)}</span></div>`}).join('')}</div>`;
  }

  function answerCell(s){
    const key=s.latest_checkpoint_key||'—',answer=s.latest_answer??'—',correct=s.latest_answer_correct,mark=correct===true?'✓':correct===false?'✗':'·',cls=correct===true?'answer-ok':correct===false?'answer-bad':'';
    const rows=Array.isArray(s.responses)?s.responses:[];
    if(!rows.length)return `<span class="${cls}">${esc(key)} · ${esc(answer)} ${mark}</span>`;
    const history=rows.map(r=>{const rmark=r.correct===true?'✓':r.correct===false?'✗':'·',rcls=r.correct===true?'answer-ok':r.correct===false?'answer-bad':'';return `<div class="answer-row ${rcls}"><strong>${esc(r.checkpoint_key)}</strong><code title="${esc(r.latest_answer??'—')}">${esc(r.latest_answer??'—')}</code><span>${rmark}</span></div>`}).join('');
    return `<details class="answer"><summary class="${cls}">${esc(key)} · ${esc(answer)} ${mark}</summary><div class="answer-history">${history}</div></details>`;
  }

  function actionsCell(s){
    return `<div class="row-actions">
      <button type="button" class="tiny-action" data-action="inspect" data-id="${esc(s.attempt_id)}">Inspect</button>
      <button type="button" class="tiny-action" data-action="edit" data-id="${esc(s.attempt_id)}">Edit</button>
      <button type="button" class="tiny-action danger" data-action="delete" data-id="${esc(s.attempt_id)}">Delete</button>
    </div>`;
  }

  function bindRowActions(){
    document.querySelectorAll('[data-action][data-id]').forEach(btn=>btn.addEventListener('click',async()=>{
      const id=btn.dataset.id,action=btn.dataset.action;
      if(action==='delete')return deleteRegistration(id);
      await openRegistration(id,action==='edit');
    }));
  }

  function render(){
    if(!snapshot)return;
    const rows=filteredSessions(),active=rows.filter(s=>s.status==='active').length,students=rows.reduce((n,s)=>n+Math.max(1,Number(s.team_size||participants(s).length||1)),0),grades=rows.map(visibleGrade).filter(v=>Number.isFinite(Number(v))).map(Number),average=grades.length?grades.reduce((a,b)=>a+b,0)/grades.length:null;
    $('metrics').innerHTML=[['Registrations',rows.length],['Active',active],['Students',students],['Avg. grade / projection',average==null?'—':average.toFixed(2)]].map(([label,value])=>`<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');
    $('rowCount').textContent=`${rows.length} shown`;
    $('sessionBody').innerHTML=rows.map(s=>{
      const completedCount=Number(s.completed_count||0),total=Number(s.checkpoint_count||8),pct=Math.max(0,Math.min(100,completedCount/Math.max(1,total)*100)),support=`H ${Number(s.help_tokens_used||0)} · E ${Number(s.wrong_attempts||0)} · R ${Number(s.revealed_count||0)} · S ${Number(s.skipped_count||0)}`,status=s.status==='submitted'?'submitted':'active';
      return `<tr>
        <td><strong>${esc(s.group_code||'—')}</strong></td>
        <td>${studentCell(s)}</td>
        <td><span class="badge ${status}">${status==='submitted'?'Completed':'Active'}</span></td>
        <td><div class="progress"><span>${completedCount}/${total}</span><span class="bar"><i style="width:${pct}%"></i></span></div></td>
        <td class="grade">${fmtGrade(visibleGrade(s))}</td>
        <td>${answerCell(s)}</td>
        <td class="support"><strong>${esc(support)}</strong><br><span>exit ${Number(s.restriction_events||0)}</span></td>
        <td class="time">${fmtTime(s.last_activity_at)}</td>
        <td>${actionsCell(s)}</td>
      </tr>`;
    }).join('')||'<tr><td colspan="9" class="empty">No registrations match this filter.</td></tr>';
    $('updatedAt').textContent=`Updated ${new Date(snapshot.generated_at||Date.now()).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`;
    bindRowActions();
  }

  function renderDetail(data,editable){
    const a=data?.attempt||{},ps=Array.isArray(data?.participants)?data.participants:[],rs=Array.isArray(data?.responses)?data.responses:[],events=Array.isArray(data?.events)?data.events:[];
    $('dialogTitle').textContent=`${a.group_code||'—'} · ${ps.map(p=>p.institutional_email||p.display_name).filter(Boolean).join(' · ')||'Registration'}`;
    $('editGroup').value=a.group_code||'11A';
    [$('editEmail1'),$('editEmail2'),$('editEmail3')].forEach((el,i)=>{el.value=ps[i]?.institutional_email||'';el.disabled=!editable});
    $('editGroup').disabled=!editable;$('saveRegistrationButton').classList.toggle('hidden',!editable);
    $('detailSummary').innerHTML=`<div><span>Status</span><strong>${esc(a.status||'—')}</strong></div><div><span>Grade</span><strong>${fmtGrade(a.grade)}</strong></div><div><span>Started</span><strong>${esc(fmtTime(a.started_at,true))}</strong></div><div><span>Last activity</span><strong>${esc(fmtTime(a.last_activity_at,true))}</strong></div><div><span>Session</span><code>${esc(a.session_id||'—')}</code></div><div><span>User agent</span><code>${esc(a.user_agent||'—')}</code></div>`;
    $('detailResponses').innerHTML=rs.map(r=>`<div class="detail-response ${r.correct?'ok':r.completed?'done':''}"><div><strong>${esc(r.checkpoint_key)} · ${esc(r.title)}</strong><span>${r.completed?esc(r.completion_mode):'pending'}</span></div><div class="response-pair"><span>Student</span><code>${esc(r.latest_answer??'—')}</code><span>Expected</span><code>${esc(r.expected_answer??'—')}</code></div><small>tries ${Number(r.try_count||0)} · errors ${Number(r.wrong_attempts||0)} · helps ${Number(r.help_count||0)} · points ${Number(r.awarded_points||0).toFixed(2)}</small></div>`).join('');
    $('detailEvents').innerHTML=events.slice(0,100).map(e=>`<div class="event-row"><strong>${esc(e.event_type)}</strong><span>${esc(fmtTime(e.created_at,true))}</span><code>${esc(JSON.stringify(e.metadata||{}))}</code></div>`).join('')||'<span class="muted">No events.</span>';
  }

  async function openRegistration(id,editable=false){
    selectedAttemptId=id;$('dialogStatus').textContent='Loading…';
    try{const data=await rpc(cfg.rpc.detail,{p_teacher_token:token,p_attempt_id:id});renderDetail(data,editable);$('dialogStatus').textContent=editable?'Edit group or institutional emails, then save.':'Read-only detailed inspection.';$('registrationDialog').showModal()}
    catch(err){$('dialogStatus').textContent=`Could not load registration: ${err.message}`}
  }

  async function saveRegistration(){
    if(!selectedAttemptId)return;
    const emails=[$('editEmail1').value.trim(),$('editEmail2').value.trim(),$('editEmail3').value.trim()].filter(Boolean);
    if(!['11A','11B','11C'].includes($('editGroup').value)||![2,3].includes(emails.length)||emails.some(e=>!emailOk(e))){$('dialogStatus').textContent='Use a valid group and 2 or 3 unique @ijr.edu.co emails.';return}
    if(new Set(emails.map(e=>e.toLowerCase())).size!==emails.length){$('dialogStatus').textContent='Do not repeat the same email.';return}
    $('saveRegistrationButton').disabled=true;$('dialogStatus').textContent='Saving…';
    try{const data=await rpc(cfg.rpc.updateRegistration,{p_teacher_token:token,p_attempt_id:selectedAttemptId,p_group_code:$('editGroup').value,p_student_emails:emails});renderDetail(data,true);$('dialogStatus').textContent='Registration updated.';await load(true)}
    catch(err){$('dialogStatus').textContent=`Could not update: ${err.message}`}
    finally{$('saveRegistrationButton').disabled=false}
  }

  async function deleteRegistration(id=selectedAttemptId){
    if(!id)return;
    const row=(snapshot?.sessions||[]).find(s=>s.attempt_id===id),label=row?participants(row).map(p=>p.institutional_email||p.display_name).join(' · '):id;
    if(!window.confirm(`Delete this registration and all of its recorded stage data?\n\n${label}\n\nThis action cannot be undone from the master panel.`))return;
    try{await rpc(cfg.rpc.deleteRegistration,{p_teacher_token:token,p_attempt_id:id});if($('registrationDialog').open)$('registrationDialog').close();selectedAttemptId=null;await load(true)}
    catch(err){if($('registrationDialog').open)$('dialogStatus').textContent=`Could not delete: ${err.message}`;else window.alert(`Could not delete: ${err.message}`)}
  }

  async function load(force=false){
    if(!token||loading)return;
    if(navigator.onLine===false&&!force){setLive('offline','Offline · last data');schedule(5000);return}
    loading=true;if(!snapshot)setLive('syncing','Syncing…');
    try{snapshot=await rpc(cfg.rpc.dashboard,{p_teacher_token:token});lastSuccessAt=Date.now();failures=0;cacheSnapshot();$('loginPanel').classList.add('hidden');$('dashboardPanel').classList.remove('hidden');render();setLive('live','LIVE · 3 s');schedule(document.hidden?POLL_HIDDEN_MS:POLL_VISIBLE_MS)}
    catch(err){if(isAuthError(err)){token='';snapshot=null;clearTimeout(timer);sessionStorage.removeItem(cfg.teacherSessionKey);sessionStorage.removeItem(SNAPSHOT_KEY);$('dashboardPanel').classList.add('hidden');$('loginPanel').classList.remove('hidden');$('loginStatus').textContent=`Session unavailable: ${err.message}`}else{failures+=1;const age=lastSuccessAt?Math.round((Date.now()-lastSuccessAt)/1000):null;setLive(navigator.onLine===false?'offline':'stale',age==null?'Retrying…':`Stale · ${age}s`);schedule(Math.min(MAX_BACKOFF_MS,POLL_VISIBLE_MS*Math.pow(2,Math.min(failures-1,4))))}}
    finally{loading=false}
  }

  $('loginForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const email=$('teacherEmail').value.trim().toLowerCase();
    if(!email.endsWith('@ijr.edu.co')){$('loginStatus').textContent='Usa la cuenta institucional docente @ijr.edu.co.';return}
    $('loginStatus').textContent='Verificando cuenta institucional…';
    try{
      const {error}=await sb.auth.signInWithPassword({email,password:$('teacherPassword').value});
      if(error)throw error;
      $('teacherPassword').value='';
      await beginMfa();
    }catch(err){$('loginStatus').textContent=`No fue posible iniciar sesión: ${err.message}`}
  });
  $('mfaButton').addEventListener('click',async()=>{
    const code=$('mfaCode').value.trim();
    if(!pendingFactorId||!pendingChallengeId||!/^[0-9]{6}$/.test(code)){$('loginStatus').textContent='Escribe un código MFA válido de seis dígitos.';return}
    $('loginStatus').textContent='Verificando segundo factor…';
    try{
      const {error}=await sb.auth.mfa.verify({factorId:pendingFactorId,challengeId:pendingChallengeId,code});
      if(error)throw error;
      $('mfaCode').value='';
      await beginMfa();
    }catch(err){$('loginStatus').textContent=`MFA no verificado: ${err.message}`}
  });
  ['groupFilter','activeOnly'].forEach(id=>$(id).addEventListener('change',render));$('searchInput').addEventListener('input',render);$('refreshButton').addEventListener('click',()=>load(true));
  $('saveRegistrationButton').addEventListener('click',saveRegistration);$('deleteRegistrationButton').addEventListener('click',()=>deleteRegistration());
  $('logoutButton').addEventListener('click',async()=>{await sb.auth.signOut({scope:'local'});token='';snapshot=null;clearTimeout(timer);sessionStorage.removeItem(SNAPSHOT_KEY);$('dashboardPanel').classList.add('hidden');$('loginPanel').classList.remove('hidden')});
  document.addEventListener('visibilitychange',()=>{if(!token)return;document.hidden?schedule(POLL_HIDDEN_MS):load(true)});window.addEventListener('online',()=>{if(token)load(true)});window.addEventListener('offline',()=>{if(token)setLive('offline','Offline · last data')});
  bootstrapAuth();
})();
