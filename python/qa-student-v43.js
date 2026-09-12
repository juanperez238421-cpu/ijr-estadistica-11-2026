(() => {
  'use strict';

  const config = window.IJR_PYTHON_HUB_CONFIG;
  const topics = window.IJR_PYTHON_HUB_TOPICS || [];
  if (!config || !window.supabase || !topics.length) {
    document.body.innerHTML = '<main style="padding:40px;font-family:sans-serif">QA Learning Hub configuration could not be loaded.</main>';
    return;
  }

  const QA_EMAIL = 'qa.student11@ijr.edu.co';
  const QA_GROUP = '11A';
  const QA_PASSWORD_SHA256 = '192c0b6d86ac758a197ef18e0d530a429e2d5a0f093ac27fed88f918f36f401f';
  const QA_REGISTER_RPC = 'python_hub_register_v1';

  const client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false }
  });

  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  let snapshot = null;

  function readSession(){
    try { return JSON.parse(localStorage.getItem(config.sessionStorageKey) || 'null'); }
    catch { return null; }
  }

  function saveSession(registrationId, accessToken){
    localStorage.setItem(config.sessionStorageKey, JSON.stringify({
      registrationId,
      accessToken,
      fingerprint:'',
      groupCode:QA_GROUP,
      emails:[QA_EMAIL],
      mode:'individual',
      authProtected:false,
      qaTest:true,
      savedAt:new Date().toISOString()
    }));
  }

  function clearSession(){
    localStorage.removeItem(config.sessionStorageKey);
    localStorage.removeItem(config.sessionVaultKey);
  }

  async function rpc(name,args){
    const {data,error}=await client.rpc(name,args);
    if(error) throw new Error(error.message || 'Backend request failed');
    return data;
  }

  async function sha256Hex(value){
    const bytes = new TextEncoder().encode(String(value || ''));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,'0')).join('');
  }

  function progressFor(slug){
    return snapshot?.topics?.find(item=>item.slug===slug) || null;
  }

  function renderHub(){
    if(!snapshot?.registration) throw new Error('QA snapshot is missing the registration object.');
    $('loginPanel').classList.add('hidden');
    $('hubPanel').classList.remove('hidden');
    $('sessionBadge').classList.remove('hidden');
    $('signOutButton').classList.remove('hidden');

    const reg = snapshot.registration;
    $('sessionBadge').textContent = `QA · ${QA_GROUP} · ${snapshot.completed_topics}/${snapshot.total_topics}`;
    $('identitySummary').textContent = `${QA_GROUP} · ${QA_EMAIL} · isolated test account`;

    const totalStages=(snapshot.topics||[]).reduce((sum,item)=>sum+Number(item.total_count||0),0);
    const correctStages=(snapshot.topics||[]).reduce((sum,item)=>sum+Number(item.correct_count||0),0);
    const percent=totalStages?Math.round(100*correctStages/totalStages):0;
    $('globalPercent').textContent=`${percent}%`;
    $('globalProgressBar').style.width=`${percent}%`;
    $('globalProgressCopy').textContent=`${correctStages} / ${totalStages} workshop stages correct`;

    $('topicGrid').innerHTML = topics.map(topic=>{
      const p=progressFor(topic.slug)||{status:'locked',percent:0,correct_count:0,total_count:topic.exercises?.length||12};
      const locked=p.status==='locked';
      const statusLabel=p.status==='completed'?'Complete':p.status==='in_progress'?'In progress':p.status==='available'?'Available':'Locked';
      const theoryHref=locked?'#':`theory.html?topic=${encodeURIComponent(topic.slug)}`;
      const workshopHref=locked?'#':`workshop.html?topic=${encodeURIComponent(topic.slug)}`;
      return `<article class="hub-topic-card ${escapeHtml(p.status)}">
        <div class="hub-topic-top"><span class="hub-topic-number">${String(topic.sequence).padStart(2,'0')}</span><span class="hub-topic-status">${escapeHtml(statusLabel)}</span></div>
        <h2>${escapeHtml(topic.title)}</h2>
        <p>${escapeHtml(topic.lead)}</p>
        <div class="hub-topic-progress"><div><strong>${Number(p.percent||0)}%</strong><span>${Number(p.correct_count||0)} / ${Number(p.total_count||topic.exercises?.length||12)} workshop stages</span></div><div class="progress-track"><span style="width:${Number(p.percent||0)}%"></span></div></div>
        <div class="hub-topic-actions">
          <a class="button button-light ${locked?'disabled-link':''}" href="${theoryHref}" ${locked?'aria-disabled="true" tabindex="-1"':''}>Theory</a>
          <a class="button button-dark ${locked?'disabled-link':''}" href="${workshopHref}" ${locked?'aria-disabled="true" tabindex="-1"':''}>Workshop</a>
        </div>
        ${locked?'<div class="hub-lock-note">Complete the previous workshop to unlock this topic.</div>':''}
      </article>`;
    }).join('');
  }

  async function createQaSession(){
    const data=await rpc(QA_REGISTER_RPC,{
      p_registration_mode:'individual',
      p_group_code:QA_GROUP,
      p_student_emails:[QA_EMAIL],
      p_session_id:crypto.randomUUID(),
      p_user_agent:`QA Student V43 · ${navigator.userAgent}`
    });
    if(!data?.registration_id || !data?.access_token || !data?.snapshot) throw new Error('QA registration backend returned an incomplete response.');
    saveSession(data.registration_id,data.access_token);
    snapshot=data.snapshot;
    renderHub();
  }

  async function resumeQaSession(saved){
    const data=await rpc(config.rpc.resume,{
      p_registration_id:saved.registrationId,
      p_access_token:saved.accessToken
    });
    if(!data?.snapshot) throw new Error('QA session could not be resumed.');
    snapshot=data.snapshot;
    renderHub();
  }

  async function handleLogin(event){
    event.preventDefault();
    const button=$('qaSignInButton');
    const status=$('qaStatus');
    const password=$('qaPassword').value;
    button.disabled=true;
    status.className='inline-status';
    status.textContent='Verifying isolated QA account…';
    try{
      const digest=await sha256Hex(password);
      if(digest!==QA_PASSWORD_SHA256){
        throw new Error('Incorrect QA password.');
      }
      $('qaPassword').value='';
      await createQaSession();
    }catch(error){
      status.className='inline-status error';
      status.textContent=error.message || 'QA sign-in failed.';
      $('qaPassword').focus();
    }finally{
      button.disabled=false;
    }
  }

  function signOut(){
    clearSession();
    snapshot=null;
    $('hubPanel').classList.add('hidden');
    $('sessionBadge').classList.add('hidden');
    $('signOutButton').classList.add('hidden');
    $('loginPanel').classList.remove('hidden');
    $('qaStatus').textContent='QA session cleared.';
    $('qaStatus').className='inline-status ok';
    $('qaPassword').value='';
    $('qaPassword').focus();
  }

  async function init(){
    $('qaEmail').textContent=QA_EMAIL;
    $('qaGroup').textContent=QA_GROUP;
    $('qaLoginForm').addEventListener('submit',handleLogin);
    $('signOutButton').addEventListener('click',signOut);

    const saved=readSession();
    if(saved?.qaTest && saved?.registrationId && saved?.accessToken){
      $('qaStatus').textContent='Resuming QA student session…';
      try{
        await resumeQaSession(saved);
        return;
      }catch{
        clearSession();
      }
    }
    $('qaPassword').focus();
  }

  document.addEventListener('DOMContentLoaded',init);
})();