(() => {
  'use strict';

  const cfg=window.IJR_PYTHON_MASTER_CONFIG;
  if(!cfg||!window.supabase){document.body.innerHTML='<main style="padding:40px;font-family:sans-serif">Teacher master configuration unavailable.</main>';return;}
  const $=id=>document.getElementById(id);
  const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:cfg.authStorageKey}});
  const topicOrder=['operations','types','arrays','logic','conditions','loops','functions','statistics'];
  const state={snapshot:null,group:'',search:'',mfaFactorId:'',mfaChallengeId:'',mfaSetupActive:false,loading:false,timer:null,recovery:null};

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtTime=v=>{if(!v)return'—';try{return new Date(v).toLocaleString('en-CO',{dateStyle:'short',timeStyle:'short'})}catch{return'—'}};
  const setStatus=(id,text,kind='')=>{const el=$(id);if(!el)return;el.textContent=text||'';el.className=`status ${kind}`.trim();};
  const topicOf=(student,slug)=>Array.isArray(student?.hub?.topics)?student.hub.topics.find(t=>t.slug===slug):null;

  async function getSession(){const {data,error}=await sb.auth.getSession();if(error)throw error;return data.session;}
  async function gateway(operation,args={}){
    const session=await getSession();
    if(!session?.access_token)throw new Error('Teacher session expired. Sign in again.');
    const response=await fetch(cfg.gatewayUrl,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`,'apikey':cfg.supabasePublishableKey},body:JSON.stringify({operation,args})});
    let payload={};try{payload=await response.json()}catch{}
    if(!response.ok){if(payload?.error==='mfa_required')throw new Error('MFA verification is required.');throw new Error(payload?.error==='not_found'?'Teacher access was not authorized.':payload?.error||`Gateway request failed (${response.status})`);}
    return payload.data;
  }

  function showOnly(panel){['loginPanel','mfaPanel','dashboardPanel'].forEach(id=>$(id).classList.toggle('hidden',id!==panel));}

  async function sendSignIn(event){
    event.preventDefault();
    const email=$('teacherEmail').value.trim().toLowerCase();
    $('sendLoginButton').disabled=true;setStatus('loginStatus','Sending secure sign-in email…');
    try{
      const redirectTo=`${location.origin}${location.pathname}`;
      const {error}=await sb.auth.signInWithOtp({email,options:{shouldCreateUser:true,emailRedirectTo:redirectTo}});
      if(error)throw error;
      setStatus('loginStatus','Secure sign-in sent. Use the link in your email. If your message contains a one-time code instead, enter it below.','ok');
    }catch(error){setStatus('loginStatus',error.message,'error');}
    finally{$('sendLoginButton').disabled=false;}
  }

  async function verifyEmailOtp(){
    const email=$('teacherEmail').value.trim().toLowerCase(),token=$('emailOtp').value.trim();
    if(!email||!token){setStatus('loginStatus','Enter the teacher email and the one-time email code.','error');return;}
    $('verifyEmailOtpButton').disabled=true;setStatus('loginStatus','Verifying email sign-in…');
    try{
      const {error}=await sb.auth.verifyOtp({email,token,type:'email'});if(error)throw error;
      $('emailOtp').value='';await routeAuthenticated();
    }catch(error){setStatus('loginStatus',error.message,'error');}
    finally{$('verifyEmailOtpButton').disabled=false;}
  }

  function factorCandidates(data){
    if(!data)return[];
    const direct=Array.isArray(data.totp)?data.totp:[];
    const all=Array.isArray(data.all)?data.all.filter(f=>f.factor_type==='totp'||f.factorType==='totp'):[];
    return [...direct,...all].filter((factor,index,array)=>array.findIndex(x=>x.id===factor.id)===index);
  }

  async function prepareMfa(){
    showOnly('mfaPanel');setStatus('mfaStatus','Checking authenticator status…');
    const {data:aal,error:aalError}=await sb.auth.mfa.getAuthenticatorAssuranceLevel();if(aalError)throw aalError;
    if(aal?.currentLevel==='aal2'){await openDashboard();return;}

    const {data:factors,error:factorsError}=await sb.auth.mfa.listFactors();if(factorsError)throw factorsError;
    const candidates=factorCandidates(factors);
    const verified=candidates.find(f=>f.status==='verified');
    if(verified){
      state.mfaSetupActive=false;
      state.mfaFactorId=verified.id;
      $('mfaTitle').textContent='Verify your teacher authenticator.';
      $('mfaCopy').textContent='Enter the current 6-digit code from the authenticator app registered to this teacher account.';
      $('mfaQrWrap').classList.add('hidden');
      setStatus('mfaStatus','Verified authenticator found. Enter the current code.');
      return;
    }

    if(state.mfaSetupActive&&state.mfaFactorId){
      const currentPending=candidates.find(f=>f.id===state.mfaFactorId&&f.status!=='verified');
      if(currentPending){
        $('mfaTitle').textContent='Set up teacher MFA.';
        $('mfaCopy').textContent='Keep this QR open while you add it to your authenticator app. This enrollment stays stable until you verify it or sign out.';
        $('mfaQrWrap').classList.remove('hidden');
        setStatus('mfaStatus','QR is active. Scan it once, then enter the current 6-digit code from your authenticator app.','ok');
        return;
      }
      state.mfaSetupActive=false;
      state.mfaFactorId='';
    }

    const incomplete=candidates.filter(f=>f.status!=='verified');
    for(const factor of incomplete){
      const {error:unenrollError}=await sb.auth.mfa.unenroll({factorId:factor.id});
      if(unenrollError)throw unenrollError;
    }

    const {data:enroll,error:enrollError}=await sb.auth.mfa.enroll({factorType:'totp'});if(enrollError)throw enrollError;
    state.mfaFactorId=enroll.id;
    state.mfaSetupActive=true;
    $('mfaTitle').textContent='Set up teacher MFA.';
    $('mfaCopy').textContent='Scan this QR once with an authenticator app. Keep this page open: the QR will remain valid while you finish setup.';
    $('mfaQr').src=enroll.totp.qr_code;
    $('mfaSecret').textContent=enroll.totp.secret||'';
    $('mfaQrWrap').classList.remove('hidden');
    setStatus('mfaStatus',incomplete.length?'Previous incomplete MFA setup was reset. This new QR will stay active while you complete verification.':'QR generated. It will stay active while you complete verification.','ok');
  }

  async function verifyMfa(){
    const code=$('mfaCode').value.trim();
    if(!state.mfaFactorId||!code){setStatus('mfaStatus','Enter the current authenticator code.','error');return;}
    $('verifyMfaButton').disabled=true;setStatus('mfaStatus','Verifying MFA…');
    try{
      const {data:challenge,error:challengeError}=await sb.auth.mfa.challenge({factorId:state.mfaFactorId});if(challengeError)throw challengeError;
      state.mfaChallengeId=challenge.id;
      const {error:verifyError}=await sb.auth.mfa.verify({factorId:state.mfaFactorId,challengeId:state.mfaChallengeId,code});if(verifyError)throw verifyError;
      $('mfaCode').value='';state.mfaChallengeId='';state.mfaSetupActive=false;setStatus('mfaStatus','MFA verified. Opening secure progress dashboard…','ok');
      await openDashboard();
    }catch(error){setStatus('mfaStatus',error.message,'error');}
    finally{$('verifyMfaButton').disabled=false;}
  }

  function filteredStudents(){
    const q=state.search.toLowerCase();
    return (state.snapshot?.students||[]).filter(s=>(!state.group||s.group_code===state.group)&&(!q||String(s.display_name||'').toLowerCase().includes(q)||String(s.hub?.institutional_email||'').toLowerCase().includes(q)));
  }
  function filteredRegistrations(){
    const q=state.search.toLowerCase();
    return (state.snapshot?.hub_registrations||[]).filter(r=>(!state.group||r.group_code===state.group)&&(!q||String(r.display_label||'').toLowerCase().includes(q)||(r.members||[]).some(m=>String(m.display_name||m.email||'').toLowerCase().includes(q))));
  }
  function legacyBadge(legacy){
    if(legacy?.status==='completed')return '<span class="status-pill ok">✓ 3/3 complete</span>';
    if(legacy?.status==='partial')return `<span class="status-pill partial">${Number(legacy.completed_count||0)}/3 attempted</span>`;
    return '<span class="status-pill none">No verified record</span>';
  }
  function hubIdentity(student){
    if(!student.hub)return '<span class="status-pill none">Not registered</span>';
    const team=student.hub.registration_mode==='team';
    return `<strong>${team?'Team':'Individual'}</strong>${team?`<span class="team-chip">TEAM · ${Number(student.hub.team_size||0)}</span>`:''}<span class="student-sub">${esc(student.hub.institutional_email||'')}</span>`;
  }
  function topicCell(student,slug){
    const p=topicOf(student,slug);
    if(!p)return '<td class="topic-cell"><span class="muted">—</span></td>';
    const pct=Number(p.percent||0),done=p.status==='completed';
    return `<td class="topic-cell"><strong>${done?'✓ ':''}${pct}%</strong><span class="student-sub">${Number(p.correct_count||0)}/${Number(p.total_count||0)}</span><span class="mini-track"><i style="width:${Math.max(0,Math.min(100,pct))}%"></i></span></td>`;
  }

  function renderMetrics(students,registrations){
    const roster=students.length;
    const legacyDone=students.filter(s=>s.legacy_types?.status==='completed').length;
    const hubRegistered=students.filter(s=>s.hub).length;
    const hubTypesDone=students.filter(s=>topicOf(s,'types')?.status==='completed').length;
    const teamRegs=registrations.filter(r=>r.mode==='team').length;
    $('metrics').innerHTML=[['Roster students',roster],['Legacy Types 3/3',legacyDone],['Hub registered',hubRegistered],['Hub Types complete',hubTypesDone],['Team registrations',teamRegs]].map(([label,value])=>`<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');
  }

  function renderStudents(students){
    $('studentCount').textContent=`${students.length} students shown`;
    $('studentBody').innerHTML=students.map(student=>{
      const last=student.hub?.last_activity_at||student.legacy_types?.last_activity_at;
      return `<tr><td class="student-name">${esc(student.display_name)}<span class="student-sub">${esc(student.group_code)}</span></td><td>${legacyBadge(student.legacy_types)}</td><td>${hubIdentity(student)}</td>${topicOrder.map(slug=>topicCell(student,slug)).join('')}<td>${esc(fmtTime(last))}</td></tr>`;
    }).join('')||'<tr><td colspan="12" class="muted">No roster students match this filter.</td></tr>';
  }

  function renderRegistrations(registrations){
    $('registrationCount').textContent=`${registrations.length} registrations shown`;
    $('registrationList').innerHTML=registrations.map(r=>{
      const members=(r.members||[]).map(m=>m.display_name||m.email).filter(Boolean);
      const topics=(r.topics||[]).map(t=>`<span>${String(t.sequence).padStart(2,'0')} ${Number(t.percent||0)}%</span>`).join('');
      return `<article class="registration-card"><h3>${esc(r.group_code)} · ${r.mode==='team'?`Team (${Number(r.team_size||0)})`:'Individual'}</h3><p>${members.map(esc).join('<br>')}</p><div class="topic-chips">${topics}</div><p class="muted">Updated ${esc(fmtTime(r.last_activity_at))}</p><button type="button" class="recovery-button" data-recover-registration="${esc(r.id)}">Issue 10-minute recovery</button></article>`;
    }).join('')||'<p class="muted">No Hub registrations match this filter.</p>';
    document.querySelectorAll('[data-recover-registration]').forEach(button=>button.addEventListener('click',()=>issueRecovery(button.dataset.recoverRegistration,button)));
  }

  function renderIdentityReview(){
    const q=state.search.toLowerCase();
    const rows=(state.snapshot?.identity_review||[]).filter(item=>(!state.group||item.group_code===state.group)&&(!q||String(item.display_name||item.institutional_email||'').toLowerCase().includes(q)));
    $('reviewCount').textContent=`${rows.length} records need review`;
    $('identityReview').innerHTML=rows.map(item=>`<div class="review-item"><strong>${esc(item.group_code)} · ${esc(item.display_name||'Unmatched participant')}</strong><code>${esc(item.institutional_email||'')}</code><span class="student-sub">Legacy Variable Types: ${Number(item.legacy_types_correct||0)}/3 correct · ${esc(fmtTime(item.last_activity_at))}</span></div>`).join('')||'<p class="muted">No unresolved historical identities match this filter.</p>';
  }

  function render(){
    if(!state.snapshot)return;
    const students=filteredStudents(),registrations=filteredRegistrations();
    renderMetrics(students,registrations);renderStudents(students);renderRegistrations(registrations);renderIdentityReview();
    setStatus('dashboardStatus',`Secure snapshot updated ${fmtTime(state.snapshot.generated_at)} · auto-refresh ${Math.round(cfg.refreshMs/1000)} s`,'ok');
  }

  async function loadDashboard(){
    if(state.loading)return;state.loading=true;setStatus('dashboardStatus','Loading secure progress…');
    try{state.snapshot=await gateway('python_hub_dashboard');render();}
    catch(error){setStatus('dashboardStatus',error.message,'error');if(/MFA|session|authorized/i.test(error.message))await routeAuthenticated();}
    finally{state.loading=false;scheduleRefresh();}
  }
  function scheduleRefresh(){clearTimeout(state.timer);if(!$('dashboardPanel').classList.contains('hidden'))state.timer=setTimeout(()=>{if(!document.hidden)loadDashboard();else scheduleRefresh();},cfg.refreshMs);}

  async function openDashboard(){
    const {data:aal,error}=await sb.auth.mfa.getAuthenticatorAssuranceLevel();if(error)throw error;
    if(aal?.currentLevel!=='aal2'){await prepareMfa();return;}
    showOnly('dashboardPanel');await loadDashboard();
  }

  async function issueRecovery(registrationId,button){
    button.disabled=true;button.textContent='Issuing…';
    try{
      const data=await gateway('python_hub_issue_recovery',{p_registration_id:registrationId});
      state.recovery=data;
      const link=`${cfg.hubUrl}#recover=${data.recovery_token}`;
      $('recoveryIdentity').textContent=`${data.group_code} · ${data.display_label}`;
      $('recoveryTokenValue').textContent=data.recovery_token;
      $('recoveryExpires').textContent=`Expires ${fmtTime(data.expires_at)}`;
      $('recoveryLink').textContent=link;
      setStatus('recoveryDialogStatus','Give this token/link only to the intended student or team. A newer token revokes any previous unused token for the same registration.','ok');
      $('recoveryDialog').showModal();
    }catch(error){setStatus('dashboardStatus',`Recovery could not be issued: ${error.message}`,'error');}
    finally{button.disabled=false;button.textContent='Issue 10-minute recovery';}
  }
  async function copyText(text,statusMessage){
    try{await navigator.clipboard.writeText(text);setStatus('recoveryDialogStatus',statusMessage,'ok');}catch{setStatus('recoveryDialogStatus','Clipboard access failed. Select and copy the value manually.','error');}
  }

  async function signOut(){clearTimeout(state.timer);state.snapshot=null;state.mfaFactorId='';state.mfaChallengeId='';state.mfaSetupActive=false;await sb.auth.signOut();showOnly('loginPanel');setStatus('loginStatus','Signed out.');}

  async function routeAuthenticated(){
    try{
      const session=await getSession();
      if(!session){showOnly('loginPanel');return;}
      await prepareMfa();
    }catch(error){showOnly('loginPanel');setStatus('loginStatus',error.message,'error');}
  }

  function bind(){
    $('emailLoginForm').addEventListener('submit',sendSignIn);
    $('verifyEmailOtpButton').addEventListener('click',verifyEmailOtp);
    $('verifyMfaButton').addEventListener('click',verifyMfa);
    $('mfaLogoutButton').addEventListener('click',signOut);
    $('logoutButton').addEventListener('click',signOut);
    $('refreshButton').addEventListener('click',loadDashboard);
    $('searchInput').addEventListener('input',event=>{state.search=event.target.value.trim();render();});
    document.querySelectorAll('[data-group]').forEach(button=>button.addEventListener('click',()=>{state.group=button.dataset.group||'';document.querySelectorAll('[data-group]').forEach(item=>item.classList.toggle('active',item===button));render();}));
    $('closeRecoveryDialog').addEventListener('click',()=>$('recoveryDialog').close());
    $('copyRecoveryToken').addEventListener('click',()=>copyText(state.recovery?.recovery_token||'','One-time recovery token copied.'));
    $('copyRecoveryLink').addEventListener('click',()=>copyText($('recoveryLink').textContent||'','One-time recovery link copied.'));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!$('dashboardPanel').classList.contains('hidden'))loadDashboard();});
    sb.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_IN'&&session)setTimeout(routeAuthenticated,0);});
  }

  async function init(){bind();await routeAuthenticated();}
  document.addEventListener('DOMContentLoaded',init);
})();
