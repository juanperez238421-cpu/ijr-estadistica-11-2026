(() => {
  'use strict';

  const cfg=window.IJR_PYTHON_MASTER_CONFIG;
  if(!cfg||!window.supabase){document.body.innerHTML='<main style="padding:40px;font-family:sans-serif">Teacher master configuration unavailable.</main>';return;}
  const $=id=>document.getElementById(id);
  const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const topicOrder=['operations','types','arrays','logic','conditions','loops','functions','statistics'];
  const state={token:sessionStorage.getItem(cfg.teacherSessionKey)||'',snapshot:null,group:'',search:'',loading:false,timer:null,recovery:null};

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtTime=v=>{if(!v)return'—';try{return new Date(v).toLocaleString('es-CO',{dateStyle:'short',timeStyle:'short'})}catch{return'—'}};
  const setStatus=(id,text,kind='')=>{const el=$(id);if(!el)return;el.textContent=text||'';el.className=`status ${kind}`.trim();};
  const topicOf=(student,slug)=>Array.isArray(student?.hub?.topics)?student.hub.topics.find(t=>t.slug===slug):null;

  async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error)throw new Error(error.message||'Backend request failed');return data;}
  function showOnly(panel){['loginPanel','dashboardPanel'].forEach(id=>$(id).classList.toggle('hidden',id!==panel));}
  function isSessionError(error){return /sesión docente|session|expired|expirada|invalid/i.test(String(error?.message||error));}

  async function login(event){
    event.preventDefault();
    const code=$('teacherCode').value.trim();
    if(!code){setStatus('loginStatus','Enter the master code.','error');return;}
    $('loginButton').disabled=true;setStatus('loginStatus','Verifying code on the secure server…');
    try{
      const data=await rpc(cfg.rpc.login,{p_code:code,p_user_agent:navigator.userAgent});
      state.token=data.teacher_token;
      sessionStorage.setItem(cfg.teacherSessionKey,state.token);
      $('teacherCode').value='';
      setStatus('loginStatus','');
      showOnly('dashboardPanel');
      await loadDashboard(true);
    }catch(error){setStatus('loginStatus',error.message,'error');}
    finally{$('loginButton').disabled=false;}
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
    if(legacy?.status==='completed')return `<span class="status-pill ok">✓ Types credited</span><span class="student-sub">Verified Class 01 · ${esc(fmtTime(legacy.last_activity_at))}</span>`;
    return '<span class="status-pill none">No verified legacy credit</span>';
  }
  function hubIdentity(student){
    if(!student.hub)return '<span class="status-pill none">Not registered in Hub</span>';
    const team=student.hub.registration_mode==='team';
    return `<strong>${team?'Team':'Individual'}</strong>${team?`<span class="team-chip">TEAM · ${Number(student.hub.team_size||0)}</span>`:''}<span class="student-sub">${esc(student.hub.institutional_email||'')}</span>`;
  }
  function topicCell(student,slug){
    const p=topicOf(student,slug);
    if(!p)return '<td class="topic-cell"><span class="muted">—</span></td>';
    const done=p.status==='completed',credited=p.completion_source==='legacy_credit';
    return `<td class="topic-cell"><strong>${done?'✓ ':''}${Number(p.percent||0)}%</strong><span class="student-sub">${credited?'Class 01 credit':`${Number(p.correct_count||0)}/${Number(p.total_count||0)}`}</span><span class="mini-track"><i style="width:${Math.max(0,Math.min(100,Number(p.percent||0)))}%"></i></span></td>`;
  }

  function renderMetrics(students,registrations){
    const legacyDone=students.filter(s=>s.legacy_types?.status==='completed').length;
    const hubRegistered=students.filter(s=>s.hub).length;
    const hubTypesDone=students.filter(s=>topicOf(s,'types')?.status==='completed').length;
    $('metrics').innerHTML=[
      ['Roster students',students.length],
      ['Verified Types credits',legacyDone],
      ['Hub registered students',hubRegistered],
      ['Hub Types complete',hubTypesDone],
      ['Hub registrations',registrations.length]
    ].map(([label,value])=>`<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');
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
      const topics=(r.topics||[]).map(t=>`<span>${String(t.sequence).padStart(2,'0')} ${Number(t.percent||0)}%${t.completion_source==='legacy_credit'?' · credit':''}</span>`).join('');
      return `<article class="registration-card"><h3>${esc(r.group_code)} · ${r.mode==='team'?`Team (${Number(r.team_size||0)})`:'Individual'}</h3><p>${members.map(esc).join('<br>')}</p><div class="topic-chips">${topics}</div><p class="muted">Updated ${esc(fmtTime(r.last_activity_at))}</p><button type="button" class="recovery-button" data-recover-registration="${esc(r.id)}">Issue 10-minute recovery</button></article>`;
    }).join('')||'<p class="muted">No Hub registrations match this filter.</p>';
    document.querySelectorAll('[data-recover-registration]').forEach(button=>button.addEventListener('click',()=>issueRecovery(button.dataset.recoverRegistration,button)));
  }
  function renderIdentityReview(){
    const q=state.search.toLowerCase();
    const rows=(state.snapshot?.identity_review||[]).filter(item=>(!state.group||item.group_code===state.group)&&(!q||String(item.display_name||item.institutional_email||'').toLowerCase().includes(q)));
    $('reviewCount').textContent=`${rows.length} records need review`;
    $('identityReview').innerHTML=rows.map(item=>`<div class="review-item"><strong>${esc(item.group_code)} · ${esc(item.display_name||'Unmatched participant')}</strong><code>${esc(item.institutional_email||'')}</code><span class="student-sub">Types evidence: ${Number(item.legacy_types_correct||0)}/3 · ${esc(fmtTime(item.last_activity_at))}</span><span class="student-sub">Not auto-credited because roster identity is not certain.</span></div>`).join('')||'<p class="muted">No unresolved legacy identities match this filter.</p>';
  }
  function render(){
    if(!state.snapshot)return;
    const students=filteredStudents(),registrations=filteredRegistrations();
    renderMetrics(students,registrations);renderStudents(students);renderRegistrations(registrations);renderIdentityReview();
    setStatus('dashboardStatus',`Code-session verified · snapshot ${fmtTime(state.snapshot.generated_at)} · ${Number(state.snapshot.legacy_credit_count||0)} verified legacy Types credits`,'ok');
  }

  function schedule(){clearTimeout(state.timer);if(state.token&&!$('dashboardPanel').classList.contains('hidden'))state.timer=setTimeout(()=>{if(!document.hidden)loadDashboard();else schedule();},cfg.refreshMs);}
  async function loadDashboard(force=false){
    if(!state.token||state.loading)return;
    state.loading=true;if(force||!state.snapshot)setStatus('dashboardStatus','Loading secure progress…');
    try{
      state.snapshot=await rpc(cfg.rpc.dashboard,{p_teacher_token:state.token});
      showOnly('dashboardPanel');render();
    }catch(error){
      if(isSessionError(error)){sessionStorage.removeItem(cfg.teacherSessionKey);state.token='';state.snapshot=null;showOnly('loginPanel');setStatus('loginStatus','Teacher session expired. Enter the master code again.','error');}
      else setStatus('dashboardStatus',error.message,'error');
    }finally{state.loading=false;schedule();}
  }

  async function issueRecovery(registrationId,button){
    button.disabled=true;button.textContent='Issuing…';
    try{
      const data=await rpc(cfg.rpc.issueRecovery,{p_teacher_token:state.token,p_registration_id:registrationId});
      state.recovery=data;
      const link=`${cfg.hubUrl}#recover=${data.recovery_token}`;
      $('recoveryIdentity').textContent=`${data.group_code} · ${data.display_label}`;
      $('recoveryTokenValue').textContent=data.recovery_token;
      $('recoveryExpires').textContent=`Expires ${fmtTime(data.expires_at)}`;
      $('recoveryLink').textContent=link;
      setStatus('recoveryDialogStatus','Give this one-time token only to the intended student/team.','ok');
      $('recoveryDialog').showModal();
    }catch(error){setStatus('dashboardStatus',`Recovery could not be issued: ${error.message}`,'error');}
    finally{button.disabled=false;button.textContent='Issue 10-minute recovery';}
  }
  async function copyText(text,statusMessage){try{await navigator.clipboard.writeText(text);setStatus('recoveryDialogStatus',statusMessage,'ok');}catch{setStatus('recoveryDialogStatus','Clipboard access failed. Copy it manually.','error');}}
  async function logout(){
    clearTimeout(state.timer);
    try{if(state.token)await rpc(cfg.rpc.logout,{p_teacher_token:state.token});}catch{}
    state.token='';state.snapshot=null;state.recovery=null;
    sessionStorage.removeItem(cfg.teacherSessionKey);
    showOnly('loginPanel');setStatus('loginStatus','Signed out.','ok');
  }

  function bind(){
    $('teacherCodeForm').addEventListener('submit',login);
    $('logoutButton').addEventListener('click',logout);
    $('refreshButton').addEventListener('click',()=>loadDashboard(true));
    $('searchInput').addEventListener('input',event=>{state.search=event.target.value.trim();render();});
    document.querySelectorAll('[data-group]').forEach(button=>button.addEventListener('click',()=>{state.group=button.dataset.group||'';document.querySelectorAll('[data-group]').forEach(item=>item.classList.toggle('active',item===button));render();}));
    $('closeRecoveryDialog').addEventListener('click',()=>$('recoveryDialog').close());
    $('copyRecoveryToken').addEventListener('click',()=>copyText(state.recovery?.recovery_token||'','One-time recovery token copied.'));
    $('copyRecoveryLink').addEventListener('click',()=>copyText($('recoveryLink').textContent||'','One-time recovery link copied.'));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.token)loadDashboard(true);});
  }

  async function init(){bind();if(state.token){showOnly('dashboardPanel');await loadDashboard(true);}else showOnly('loginPanel');}
  document.addEventListener('DOMContentLoaded',init);
})();
