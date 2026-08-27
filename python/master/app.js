(() => {
  'use strict';

  const cfg=window.IJR_PYTHON_MASTER_CONFIG;
  if(!cfg||!window.supabase){document.body.innerHTML='<main style="padding:40px;font-family:sans-serif">Teacher master configuration unavailable.</main>';return;}
  const $=id=>document.getElementById(id);
  const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const topicOrder=['operations','types','arrays','logic','conditions','loops','functions','statistics'];
  const state={token:sessionStorage.getItem(cfg.teacherSessionKey)||'',snapshot:null,stageMatrix:null,group:'',search:'',loading:false,timer:null};

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtTime=v=>{if(!v)return'—';try{return new Date(v).toLocaleString('es-CO',{dateStyle:'short',timeStyle:'short'})}catch{return'—'}};
  const setStatus=(id,text,kind='')=>{const el=$(id);if(!el)return;el.textContent=text||'';el.className=`status ${kind}`.trim();};
  const topicOf=(student,slug)=>Array.isArray(student?.hub?.topics)?student.hub.topics.find(t=>t.slug===slug):null;
  const auditStudent=student=>(state.stageMatrix?.students||[]).find(row=>row.student_registry_id===student.student_registry_id)||null;
  const auditTopic=(student,slug)=>auditStudent(student)?.topics?.find(t=>t.slug===slug)||null;

  async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error)throw new Error(error.message||'Backend request failed');return data;}
  function showOnly(panel){['loginPanel','dashboardPanel'].forEach(id=>$(id).classList.toggle('hidden',id!==panel));}
  function isSessionError(error){return /sesión docente|session|expired|expirada|invalid/i.test(String(error?.message||error));}

  async function login(event){
    event.preventDefault();const code=$('teacherCode').value.trim();
    if(!code){setStatus('loginStatus','Enter the master code.','error');return;}
    $('loginButton').disabled=true;setStatus('loginStatus','Verifying code on the secure server…');
    try{
      const data=await rpc(cfg.rpc.login,{p_code:code,p_user_agent:navigator.userAgent});
      state.token=data.teacher_token;sessionStorage.setItem(cfg.teacherSessionKey,state.token);$('teacherCode').value='';
      setStatus('loginStatus','');showOnly('dashboardPanel');await loadDashboard(true);
    }catch(error){setStatus('loginStatus',error.message,'error');}
    finally{$('loginButton').disabled=false;}
  }

  function filteredStudents(){
    const q=state.search.toLowerCase();
    return (state.snapshot?.students||[]).filter(s=>(!state.group||s.group_code===state.group)&&(!q||String(s.display_name||'').toLowerCase().includes(q)||String(s.hub?.institutional_email||'').toLowerCase().includes(q)||String(auditStudent(s)?.account?.email||'').toLowerCase().includes(q)));
  }
  function filteredRegistrations(){
    const q=state.search.toLowerCase();
    return (state.snapshot?.hub_registrations||[]).filter(r=>(!state.group||r.group_code===state.group)&&(!q||String(r.display_label||'').toLowerCase().includes(q)||(r.members||[]).some(m=>String(m.display_name||m.email||'').toLowerCase().includes(q))));
  }

  function legacyBadge(legacy){
    if(legacy?.status==='completed')return `<span class="status-pill ok">✓ Types credited</span><span class="student-sub">Verified Class 01 · ${esc(fmtTime(legacy.last_activity_at))}</span>`;
    return '<span class="status-pill none">No verified legacy Types credit</span>';
  }
  function hubIdentity(student){
    const audit=auditStudent(student),account=audit?.account;
    if(account){
      const roster=account.identity_status==='verified_roster';
      return `<span class="status-pill ok">✓ Verified @ijr account</span><span class="student-sub">${esc(account.email)}</span><span class="student-sub">${roster?'Roster matched':'Email verified · roster review'}</span>`;
    }
    if(student.hub)return `<span class="status-pill partial">Legacy Hub registration</span><span class="student-sub">${esc(student.hub.institutional_email||'')}</span>`;
    return '<span class="status-pill none">No verified Hub account yet</span>';
  }

  function stageBadges(topic){
    const items=topic?.items||[];
    if(!items.length)return '<span class="student-sub">No stage definitions</span>';
    return `<div class="stage-audit" aria-label="Workshop stage validation">${items.map(item=>{
      const correct=Boolean(item.correct),tries=Number(item.tries||0);
      const source=Array.isArray(item.source_modes)&&item.source_modes.length?` · source ${item.source_modes.join('/')}`:'';
      const tip=`Stage ${item.sequence}: ${item.title} · ${correct?'VALIDATED':'not validated'} · ${tries} attempt${tries===1?'':'s'}${correct?` · ${fmtTime(item.completed_at)}`:''}${source}`;
      return `<span class="stage-audit-chip ${correct?'ok':'pending'}" title="${esc(tip)}" aria-label="${esc(tip)}">${Number(item.sequence)}${correct?'✓':'○'}</span>`;
    }).join('')}</div>`;
  }

  function topicCell(student,slug){
    const audit=auditTopic(student,slug);const p=topicOf(student,slug);
    if(!audit&&!p)return '<td class="topic-cell"><span class="muted">—</span></td>';
    const credit=Boolean(audit?.credit);
    const validated=Number(audit?.validated_count??p?.correct_count??0);
    const total=Number(audit?.total_count??p?.total_count??0);
    const percent=total?Math.round(100*validated/total):0;
    const allCurrent=total>0&&validated>=total;
    let headline=`${validated}/${total} current`;
    let note='Current workshop validation';
    if(allCurrent){headline='✓ Current workshop';note=`${validated}/${total} stages validated`;}
    else if(credit){headline='✓ Topic credit';note=`Historical credit · current workshop ${validated}/${total}`;}
    const creditLine=credit?`<span class="credit-note">Prior Class 01 credit · ${esc(fmtTime(audit.credit_completed_at))}. Stage checks below remain independent.</span>`:'';
    return `<td class="topic-cell"><strong>${esc(headline)}</strong><span class="student-sub">${esc(note)}</span><span class="mini-track"><i style="width:${percent}%"></i></span>${stageBadges(audit)}${creditLine}</td>`;
  }

  function renderMetrics(students,registrations){
    const verified=students.filter(s=>auditStudent(s)?.account).length;
    const credited=slug=>students.filter(s=>auditTopic(s,slug)?.credit).length;
    $('metrics').innerHTML=[
      ['Roster students',students.length],['Verified @ijr accounts',verified],
      ['Operations prior credit',credited('operations')],['Types prior credit',credited('types')],['Arrays prior credit',credited('arrays')]
    ].map(([label,value])=>`<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');
  }
  function renderStudents(students){
    $('studentCount').textContent=`${students.length} students shown`;
    $('studentBody').innerHTML=students.map(student=>{
      const last=auditStudent(student)?.account?.last_verified_at||student.hub?.last_activity_at||student.legacy_types?.last_activity_at;
      return `<tr><td class="student-name">${esc(student.display_name)}<span class="student-sub">${esc(student.group_code)}</span></td><td>${legacyBadge(student.legacy_types)}</td><td>${hubIdentity(student)}</td>${topicOrder.map(slug=>topicCell(student,slug)).join('')}<td>${esc(fmtTime(last))}</td></tr>`;
    }).join('')||'<tr><td colspan="12" class="muted">No roster students match this filter.</td></tr>';
  }
  function renderRegistrations(registrations){
    $('registrationCount').textContent=`${registrations.length} historical/current registrations shown`;
    $('registrationList').innerHTML=registrations.map(r=>{
      const members=(r.members||[]).map(m=>m.display_name||m.email).filter(Boolean);
      const topics=(r.topics||[]).map(t=>`<span>${String(t.sequence).padStart(2,'0')} ${Number(t.correct_count||0)}/${Number(t.total_count||0)}${t.completion_source==='legacy_credit'?' · prior credit':''}</span>`).join('');
      return `<article class="registration-card"><h3>${esc(r.group_code)} · ${r.mode==='team'?`Legacy team (${Number(r.team_size||0)})`:'Individual'}</h3><p>${members.map(esc).join('<br>')}</p><div class="topic-chips">${topics}</div><p class="muted">Updated ${esc(fmtTime(r.last_activity_at))}</p></article>`;
    }).join('')||'<p class="muted">No Hub registrations match this filter.</p>';
  }
  function renderIdentityReview(){
    const q=state.search.toLowerCase();
    const legacy=(state.snapshot?.identity_review||[]).map(item=>({...item,kind:'legacy'}));
    const accounts=(state.stageMatrix?.unmatched_accounts||[]).map(item=>({group_code:item.group_code,display_name:'Verified institutional account',institutional_email:item.email,last_activity_at:item.last_verified_at,kind:'account',reason:item.identity_status}));
    const rows=[...legacy,...accounts].filter(item=>(!state.group||item.group_code===state.group)&&(!q||String(item.display_name||item.institutional_email||'').toLowerCase().includes(q)));
    $('reviewCount').textContent=`${rows.length} records need review`;
    $('identityReview').innerHTML=rows.map(item=>`<div class="review-item"><strong>${esc(item.group_code)} · ${esc(item.display_name||'Unmatched participant')}</strong><code>${esc(item.institutional_email||'')}</code><span class="student-sub">${item.kind==='account'?'Email account is verified, but roster identity is not yet certain.':`Legacy Types evidence: ${Number(item.legacy_types_correct||0)}/3`}</span><span class="student-sub">${esc(item.reason||'Not auto-linked because roster identity is not certain.')} · ${esc(fmtTime(item.last_activity_at))}</span></div>`).join('')||'<p class="muted">No unresolved identities match this filter.</p>';
  }
  function render(){
    if(!state.snapshot||!state.stageMatrix)return;
    const students=filteredStudents(),registrations=filteredRegistrations();
    renderMetrics(students,registrations);renderStudents(students);renderRegistrations(registrations);renderIdentityReview();
    setStatus('dashboardStatus',`Teacher code verified · audited snapshot ${fmtTime(state.stageMatrix.generated_at)} · stage ✓ means an actual server validation, not historical topic credit.`,'ok');
  }

  function schedule(){clearTimeout(state.timer);if(state.token&&!$('dashboardPanel').classList.contains('hidden'))state.timer=setTimeout(()=>{if(!document.hidden)loadDashboard();else schedule();},cfg.refreshMs);}
  async function loadDashboard(force=false){
    if(!state.token||state.loading)return;state.loading=true;
    if(force||!state.snapshot)setStatus('dashboardStatus','Loading secure individual progress and stage audit…');
    try{
      const [snapshot,stageMatrix]=await Promise.all([
        rpc(cfg.rpc.dashboard,{p_teacher_token:state.token}),
        rpc(cfg.rpc.stageMatrix,{p_teacher_token:state.token})
      ]);
      state.snapshot=snapshot;state.stageMatrix=stageMatrix;showOnly('dashboardPanel');render();
    }catch(error){
      if(isSessionError(error)){sessionStorage.removeItem(cfg.teacherSessionKey);state.token='';state.snapshot=null;state.stageMatrix=null;showOnly('loginPanel');setStatus('loginStatus','Teacher session expired. Enter the master code again.','error');}
      else setStatus('dashboardStatus',error.message,'error');
    }finally{state.loading=false;schedule();}
  }

  async function logout(){
    clearTimeout(state.timer);try{if(state.token)await rpc(cfg.rpc.logout,{p_teacher_token:state.token});}catch{}
    state.token='';state.snapshot=null;state.stageMatrix=null;sessionStorage.removeItem(cfg.teacherSessionKey);showOnly('loginPanel');setStatus('loginStatus','Signed out.','ok');
  }
  function bind(){
    $('teacherCodeForm').addEventListener('submit',login);$('logoutButton').addEventListener('click',logout);$('refreshButton').addEventListener('click',()=>loadDashboard(true));
    $('searchInput').addEventListener('input',event=>{state.search=event.target.value.trim();render();});
    document.querySelectorAll('[data-group]').forEach(button=>button.addEventListener('click',()=>{state.group=button.dataset.group||'';document.querySelectorAll('[data-group]').forEach(item=>item.classList.toggle('active',item===button));render();}));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.token)loadDashboard(true);});
  }
  async function init(){bind();if(state.token){showOnly('dashboardPanel');await loadDashboard(true);}else showOnly('loginPanel');}
  document.addEventListener('DOMContentLoaded',init);
})();
