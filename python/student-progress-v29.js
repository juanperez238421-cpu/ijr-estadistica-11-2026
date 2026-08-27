(() => {
  'use strict';

  const config=window.IJR_PYTHON_HUB_CONFIG;
  if(!config || !window.supabase) return;

  const $=id=>document.getElementById(id);
  const escapeHtml=value=>String(value??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const client=window.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  let loading=false;
  let lastRegistrationId='';

  function getSession(){
    try{return JSON.parse(localStorage.getItem(config.sessionStorageKey)||'null');}catch{return null;}
  }

  function topicRows(member){
    const topics=member?.progress?.topics||[];
    return topics.map(topic=>`<div class="student-topic-progress-row">
      <span class="student-topic-number">${String(Number(topic.sequence||0)).padStart(2,'0')}</span>
      <div class="student-topic-copy"><strong>${escapeHtml(topic.title||topic.slug)}</strong><small>${Number(topic.percent||0)}% individual stage mastery</small></div>
      <div class="student-topic-result"><strong>${Number(topic.correct_count||0)} / ${Number(topic.total_count||0)}</strong>${topic.historical_credit?'<small>Historical credit</small>':''}</div>
    </div>`).join('');
  }

  function render(snapshot){
    if(!snapshot?.registration) return;
    const reg=snapshot.registration;
    const members=Array.isArray(snapshot.members)?snapshot.members:[];
    const regDisplay=reg.display_id||`REG-${String(reg.id||'').replace(/-/g,'').slice(0,8).toUpperCase()}`;

    const badge=$('sessionBadge');
    if(badge){
      badge.textContent=members.length===1
        ? `${members[0].user_id||'Student'} · ${reg.group_code} · ${Number(members[0]?.progress?.percent||0)}% individual`
        : `${regDisplay} · ${reg.group_code} · ${members.length} students`;
    }

    const identitySummary=$('identitySummary');
    if(identitySummary){
      identitySummary.textContent=`${reg.group_code} · ${reg.mode==='team'?'Team registration':'Individual registration'} · ${regDisplay}`;
    }

    const globalCopy=$('globalProgressCopy');
    if(globalCopy && !globalCopy.dataset.v29Label){
      globalCopy.dataset.v29Label='true';
      const current=globalCopy.textContent;
      globalCopy.textContent=`Current registration: ${current}`;
    }

    const mount=$('identityProgressPanel');
    if(!mount) return;

    const modeCopy=members.length>1
      ? 'Each student keeps a stable User ID. Progress below is calculated individually across every individual or team registration that includes that student. A validated stage counts once for each registered member who completed it with the team.'
      : 'This User ID stays attached to the institutional email. Individual progress is calculated across every registration in which this student participates, so validated work follows the student rather than only this browser.';

    mount.innerHTML=`<div class="student-identity-shell">
      <div class="student-identity-head">
        <div><p class="eyebrow">REGISTERED IDENTITY · INDIVIDUAL PROGRESS</p><h2>${members.length>1?'Individual progress for this team':'Your individual learning record'}</h2><p>${escapeHtml(modeCopy)}</p></div>
        <div class="registration-id-card"><span>Registration ID</span><strong>${escapeHtml(regDisplay)}</strong><small>${escapeHtml(reg.group_code)} · ${escapeHtml(reg.mode==='team'?'Team':'Individual')}</small></div>
      </div>
      <div class="student-progress-grid">
        ${members.map(member=>{
          const progress=member.progress||{};
          return `<article class="student-progress-card">
            <div class="student-progress-card-head">
              <div><p class="eyebrow">STUDENT ${Number(member.order||0)}</p><h3>${escapeHtml(member.display_name||member.email)}</h3><p>${escapeHtml(member.email||'')}</p></div>
              <div class="student-user-code"><span>User ID</span><strong>${escapeHtml(member.user_id||'Pending')}</strong></div>
            </div>
            <div class="student-progress-summary"><strong>${Number(progress.percent||0)}%</strong><span>${Number(progress.correct_count||0)} / ${Number(progress.total_count||0)} currently validated workshop stages</span></div>
            <div class="progress-track" aria-label="Individual progress"><span style="width:${Math.max(0,Math.min(100,Number(progress.percent||0)))}%"></span></div>
            <div class="student-topic-progress-list">${topicRows(member)}</div>
          </article>`;
        }).join('')}
      </div>
      <div class="student-identity-note"><strong>Audit rule:</strong> current stage counts come only from server-validated workshop responses. A “Historical credit” badge is shown separately when older verified classroom evidence exists; it does not fabricate completion of the current 12 stages.</div>
    </div>`;
  }

  async function refresh(){
    const saved=getSession();
    if(!saved?.registrationId||!saved?.accessToken||loading) return;
    loading=true;
    try{
      const {data,error}=await client.rpc(config.rpc.resume,{p_registration_id:saved.registrationId,p_access_token:saved.accessToken});
      if(error||!data?.snapshot) return;
      lastRegistrationId=saved.registrationId;
      render(data.snapshot);
    }finally{
      loading=false;
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const hub=$('hubPanel');
    if(hub){
      const observer=new MutationObserver(()=>{
        if(!hub.classList.contains('hidden')) refresh();
      });
      observer.observe(hub,{attributes:true,attributeFilter:['class']});
    }
    refresh();
  });

  window.addEventListener('pageshow',()=>{
    const saved=getSession();
    if(saved?.registrationId!==lastRegistrationId) refresh();
  });
})();
