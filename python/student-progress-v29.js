(() => {
  'use strict';

  const config=window.IJR_PYTHON_HUB_CONFIG;
  if(!config || !window.supabase) return;

  const $=id=>document.getElementById(id);
  const percent=value=>Math.max(0,Math.min(100,Number(value)||0));
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
      <div class="student-topic-copy"><strong>${escapeHtml(topic.title||topic.slug)}</strong><small>${percent(topic.percent)}% individual stage mastery</small><div class="progress-track" role="progressbar" aria-label="${escapeHtml(topic.title||topic.slug)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent(topic.percent)}"><span style="width:${percent(topic.percent)}%"></span></div></div>
      <div class="student-topic-result"><strong>${Number(topic.correct_count||0)} / ${Number(topic.total_count||0)}</strong>${topic.historical_credit?'<small>Historical credit</small>':''}</div>
    </div>`).join('');
  }

  function qaEvaluationCard(members){
    const qa=(Array.isArray(members)?members:[]).find(member=>
      String(member?.email||'').trim().toLowerCase()==='qa.student11@ijr.edu.co'
    );
    if(!qa) return '';

    return `<section id="qaEvaluationAccessCard" class="evaluation-card qa-evaluation-inline" data-state="open" aria-label="QA evaluation access">
      <div>
        <p class="eyebrow">EVALUATION · MODULES 01–03 · 11A</p>
        <h2>Python foundations · one-shot assessment</h2>
        <p><strong>QA EARLY ACCESS · OPEN NOW</strong>. This dedicated QA account can enter the evaluation immediately. The backend still validates the institutional registration before the attempt starts.</p>
        <div class="evaluation-card-meta">
          <span>QA Student 11 · single student</span>
          <span>18 questions · 40 minutes</span>
          <span>Fullscreen required</span>
          <span>Wrong answer: −1 point</span>
          <span>Integrity exit: −1 point</span>
        </div>
      </div>
      <div class="evaluation-action">
        <a id="qaEvaluationStartButton" class="button button-dark" href="evaluation-modules-1-3/">Start evaluation</a>
      </div>
    </section>`;
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

    // Use the same consolidated server record for the individual header and card.
    if(members.length===1 && members[0].progress){
      const progress=members[0].progress;
      const value=percent(progress.percent);
      if($('globalPercent')) $('globalPercent').textContent=`${value}%`;
      const bar=$('globalProgressBar');
      if(bar){
        bar.style.width=`${value}%`;
        const track=bar.parentElement;
        track.setAttribute('role','progressbar');
        track.setAttribute('aria-label','Individual progress');
        track.setAttribute('aria-valuemin','0');
        track.setAttribute('aria-valuemax','100');
        track.setAttribute('aria-valuenow',String(value));
      }
      if($('globalProgressCopy')) $('globalProgressCopy').textContent=`${Number(progress.correct_count||0)} / ${Number(progress.total_count||0)} workshop stages correct`;
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
      ${qaEvaluationCard(members)}
    </div>`;

    const qaCard=$('qaEvaluationAccessCard');
    const externalEvaluation=$('evaluationPanel');
    if(qaCard && externalEvaluation) externalEvaluation.classList.add('hidden');
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
