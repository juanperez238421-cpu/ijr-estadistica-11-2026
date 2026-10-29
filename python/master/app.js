(() => {
  'use strict';

  const cfg=window.IJR_PYTHON_MASTER_CONFIG;
  if(!cfg||!window.supabase){document.body.innerHTML='<main style="padding:40px;font-family:sans-serif">Teacher master configuration unavailable.</main>';return;}
  const $=id=>document.getElementById(id);
  const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  // Display every published Statistics 11 topic, not only the legacy first eight.
  const topicColumns=[
    ['operations','Operations'],['types','Types'],['arrays','Arrays'],
    ['logic','Libraries / XLSX / Pandas'],['conditions','CSV / DataFrames'],
    ['loops','Central tendency'],['functions','Functions'],['statistics','Statistics'],
    ['descriptive','Descriptive'],['position-outliers','Quartiles / IQR'],
    ['pandas-dataframes','Pandas DataFrames'],['data-cleaning','Data cleaning'],
    ['filter-transform','Filter / transform'],['group-aggregate','Aggregation'],
    ['visualization','Visualization'],['analyst-project','Analyst project']
  ];
  const topicOrder=topicColumns.map(([slug])=>slug);
  const state={token:sessionStorage.getItem(cfg.teacherSessionKey)||'',snapshot:null,group:'',search:'',loading:false,timer:null,recovery:null};

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtTime=v=>{if(!v)return'—';try{return new Date(v).toLocaleString('es-CO',{dateStyle:'short',timeStyle:'short'})}catch{return'—'}};
  const setStatus=(id,text,kind='')=>{const el=$(id);if(!el)return;el.textContent=text||'';el.className=`status ${kind}`.trim();};
  const topicOf=(student,slug)=>Array.isArray(student?.effective_progress?.topics)?student.effective_progress.topics.find(t=>t.slug===slug):null;
  const creditOf=(student,slug)=>Array.isArray(student?.topic_credits)?student.topic_credits.find(c=>c.topic_slug===slug):null;
  const displayRegistrationId=id=>id?`REG-${String(id).replace(/-/g,'').slice(0,8).toUpperCase()}`:'—';

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
    return (state.snapshot?.students||[]).filter(s=>{
      const registrationText=(s.registrations||[]).map(r=>`${r.institutional_email||''} ${r.registration_id||''}`).join(' ').toLowerCase();
      return (!state.group||s.group_code===state.group)&&(!q||String(s.display_name||'').toLowerCase().includes(q)||String(s.hub?.institutional_email||'').toLowerCase().includes(q)||registrationText.includes(q));
    });
  }
  function filteredRegistrations(){
    const q=state.search.toLowerCase();
    return (state.snapshot?.hub_registrations||[]).filter(r=>(!state.group||r.group_code===state.group)&&(!q||String(r.display_label||'').toLowerCase().includes(q)||(r.members||[]).some(m=>String(m.display_name||m.email||'').toLowerCase().includes(q))));
  }
  function legacyBadge(legacy){
    if(legacy?.status==='completed')return `<span class="status-pill ok">✓ Types credited</span><span class="student-sub">Verified Class 01 · ${esc(fmtTime(legacy.last_activity_at))}</span>`;
    return '<span class="status-pill none">No verified legacy credit</span>';
  }
  function registrationHistory(student){
    const regs=Array.isArray(student.registrations)?student.registrations:[];
    if(!regs.length)return '<span class="student-sub">Registration history: none</span>';
    return `<span class="student-sub"><strong>Registration history (${regs.length})</strong></span>${regs.map(r=>`<span class="student-sub">${esc(displayRegistrationId(r.registration_id))} · ${r.registration_mode==='team'?`Team (${Number(r.team_size||0)})`:'Individual'} · ${esc(fmtTime(r.created_at))}</span>`).join('')}`;
  }
  function policyBadge(student){
    const p=student.registration_policy;
    if(!p?.force_individual)return'';
    return `<span class="status-pill ok">${p.advanced?'ADVANCED · ':''}INDIVIDUAL ONLY</span><span class="student-sub">${esc(p.note||'This student cannot join team registrations.')}</span>`;
  }
  function hubIdentity(student){
    const current=student.hub
      ?(()=>{const team=student.hub.registration_mode==='team';return `<strong>${team?'Team':'Individual'}</strong>${team?`<span class="team-chip">TEAM · ${Number(student.hub.team_size||0)}</span>`:''}<span class="student-sub">${esc(student.hub.institutional_email||'')}</span><span class="student-sub">${esc(displayRegistrationId(student.hub.registration_id))}</span>`;})()
      :'<span class="status-pill none">Not currently registered in Hub</span>';
    return `${policyBadge(student)}${current}${registrationHistory(student)}`;
  }
  function topicCell(student,slug){
    const p=topicOf(student,slug);
    const credit=creditOf(student,slug);
    if(!p)return '<td class="topic-cell"><span class="muted">Identity not verified</span></td>';
    const recognized=Boolean(p.historical_credit);
    const raw=Number(student?.validated_by_topic?.[slug]||0);
    const awarded=Number(p.correct_count||0),total=Number(p.total_count||0);
    const percentage=total?Math.round(100*awarded/total):0;
    const source=String(credit?.source_key||'');
    const reason=recognized
      ? (source.startsWith('teacher_recognition_')?'Teacher recognition':source?'Historical/team credit':'Verified prior credit')
      : 'Server-validated responses';
    const detail=recognized
      ? `${reason} · ${raw}/${total} individually validated`
      : `${raw}/${total} validated`;
    return `<td class="topic-cell"><strong>${awarded>=total&&total?'✓ ':''}${percentage}%</strong><span class="student-sub">${esc(detail)}</span><span class="mini-track"><i style="width:${Math.max(0,Math.min(100,percentage))}%"></i></span></td>`;
  }

  // The exact same 192-stage denominator as the individual student Hub.
  function globalCell(student){
    const p=student?.effective_progress;
    if(!p)return '<td class="topic-cell"><strong>—</strong><span class="student-sub">Unlinked roster identity</span></td>';
    const correct=Number(p.correct_count||0), total=Number(p.total_count||0);
    const pct=total?Math.round(100*correct/total):0;
    const validated=Object.values(student.validated_by_topic||{}).reduce((sum,n)=>sum+Number(n||0),0);
    return `<td class="topic-cell"><strong>${pct}%</strong><span class="student-sub">${correct}/${total} effective · ${validated} validated</span><span class="mini-track"><i style="width:${Math.max(0,Math.min(100,pct))}%"></i></span></td>`;
  }

  function renderMetrics(students,registrations){
    const linked=students.filter(s=>s.effective_progress);
    const correct=linked.reduce((sum,s)=>sum+Number(s.effective_progress.correct_count||0),0);
    const total=linked.reduce((sum,s)=>sum+Number(s.effective_progress.total_count||0),0);
    const mean=total?(Math.round(1000*correct/total)/10):0;
    const teacherCredits=students.filter(s=>(s.topic_credits||[]).some(c=>String(c.source_key||'').startsWith('teacher_recognition_'))).length;
    const metrics=[
      ['Students in roster',students.length],
      ['Verified identities',linked.length],
      ['Average effective progress',mean.toFixed(1)+'%'],
      ['Teacher-credit students',teacherCredits],
      ['Current Hub registrations',registrations.length]
    ];
    $('metrics').innerHTML=metrics.map(([label,value])=>`<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');
  }
  function renderStudents(students){
    const heading=$('studentColumns');
    if(heading){
      heading.innerHTML='<th>Student</th><th>Legacy Types</th><th>Hub registration</th><th>Global / 192</th>'
        + topicColumns.map(([slug,name],i)=>`<th title="${esc(slug)}">${String(i+1).padStart(2,'0')} ${esc(name)}</th>`).join('')
        + '<th>Last activity</th>';
    }
    $('studentCount').textContent=`${students.length} students shown · canonical per-roster progress`;
    $('studentBody').innerHTML=students.map(student=>{
      const last=student.hub?.last_activity_at||student.legacy_types?.last_activity_at;
      return `<tr><td class="student-name">${esc(student.display_name)}<span class="student-sub">${esc(student.group_code)}</span></td><td>${legacyBadge(student.legacy_types)}</td><td>${hubIdentity(student)}</td>${globalCell(student)}${topicOrder.map(slug=>topicCell(student,slug)).join('')}<td>${esc(fmtTime(last))}</td></tr>`;
    }).join('')||`<tr><td colspan="${topicOrder.length+5}" class="muted">No roster students match this filter.</td></tr>`;
  }

  function renderRegistrations(registrations){
    $('registrationCount').textContent=`${registrations.length} registrations shown`;
    $('registrationList').innerHTML=registrations.map(r=>{
      const members=(r.members||[]).map(m=>m.display_name||m.email).filter(Boolean);
      const topics=(r.topics||[]).map(t=>`<span>${String(t.sequence).padStart(2,'0')} ${Number(t.percent||0)}%${t.completion_source==='legacy_credit'?' · credit':''}</span>`).join('');
      return `<article class="registration-card"><h3>${esc(r.group_code)} · ${r.mode==='team'?`Team (${Number(r.team_size||0)})`:'Individual'}</h3><p><strong>${esc(displayRegistrationId(r.id))}</strong><br>${members.map(esc).join('<br>')}</p><div class="topic-chips">${topics}</div><p class="muted">Updated ${esc(fmtTime(r.last_activity_at))}</p><button type="button" class="recovery-button" data-recover-registration="${esc(r.id)}">Issue 10-minute recovery</button></article>`;
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
    setStatus('dashboardStatus',`Verified teacher session · ${fmtTime(state.snapshot.generated_at)} · canonical roster progress across 16 topics (192 stages); teacher credits distinguished from validated submissions`,'ok');
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
