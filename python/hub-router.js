(() => {
  'use strict';

  const config = window.IJR_PYTHON_HUB_CONFIG;
  const topics = window.IJR_PYTHON_HUB_TOPICS || [];
  if (!config || !window.supabase || !topics.length) {
    document.body.innerHTML = '<main style="padding:40px;font-family:sans-serif">Learning Hub configuration could not be loaded.</main>';
    return;
  }

  const client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const state = {snapshot:null, registration:null};

  function getStoredSession(){
    try { return JSON.parse(localStorage.getItem(config.sessionStorageKey) || 'null'); } catch { return null; }
  }
  function storeSession(registrationId, accessToken){ localStorage.setItem(config.sessionStorageKey, JSON.stringify({registrationId, accessToken})); }
  function clearSession(){ localStorage.removeItem(config.sessionStorageKey); state.snapshot=null; state.registration=null; }
  async function rpc(name,args){
    const {data,error} = await client.rpc(name,args);
    if(error) throw new Error(error.message || 'Backend request failed');
    return data;
  }

  function updateRegistrationFields(){
    const team = $('registrationMode').value === 'team';
    $('teamSizeWrap').classList.toggle('hidden', !team);
    const size = team ? Number($('teamSize').value) : 1;
    $('member2Wrap').classList.toggle('hidden', size < 2);
    $('member3Wrap').classList.toggle('hidden', size < 3);
    $('memberEmail2').required = size >= 2;
    $('memberEmail3').required = size >= 3;
  }
  function collectEmails(){
    const team = $('registrationMode').value === 'team';
    const size = team ? Number($('teamSize').value) : 1;
    return Array.from({length:size},(_,i)=>$(`memberEmail${i+1}`).value.trim().toLowerCase());
  }
  function validateEmails(emails){
    if(new Set(emails).size !== emails.length) return 'Do not repeat the same institutional email.';
    for(const email of emails){
      if(!email.endsWith(`@${config.institutionalEmailDomain}`) || email.split('@').length !== 2) return `Use institutional emails ending in @${config.institutionalEmailDomain}.`;
    }
    return '';
  }

  async function register(event){
    event.preventDefault();
    const status = $('registrationStatus');
    const emails = collectEmails();
    const emailError = validateEmails(emails);
    if(emailError){ status.textContent=emailError; status.className='inline-status error'; return; }
    $('registerButton').disabled=true;
    status.textContent='Registering and loading progress…'; status.className='inline-status';
    try{
      const data = await rpc(config.rpc.register, {
        p_registration_mode:$('registrationMode').value,
        p_group_code:$('groupCode').value,
        p_student_emails:emails,
        p_session_id:crypto.randomUUID(),
        p_user_agent:navigator.userAgent
      });
      storeSession(data.registration_id,data.access_token);
      state.registration={registrationId:data.registration_id,accessToken:data.access_token};
      state.snapshot=data.snapshot;
      showHub();
      status.textContent='Registration ready.'; status.className='inline-status ok';
    }catch(error){
      status.textContent=error.message; status.className='inline-status error';
    }finally{$('registerButton').disabled=false;}
  }

  async function resumeStored(){
    const saved=getStoredSession();
    if(!saved?.registrationId || !saved?.accessToken) return false;
    try{
      const data=await rpc(config.rpc.resume,{p_registration_id:saved.registrationId,p_access_token:saved.accessToken});
      state.registration=saved; state.snapshot=data.snapshot; return true;
    }catch{ clearSession(); return false; }
  }

  function progressFor(slug){ return state.snapshot?.topics?.find(item=>item.slug===slug) || null; }
  function showRegistration(){
    $('registrationPanel').classList.remove('hidden');
    $('hubPanel').classList.add('hidden');
    $('changeRegistrationButton').classList.add('hidden');
    $('sessionBadge').classList.add('hidden');
  }
  function showHub(){
    $('registrationPanel').classList.add('hidden');
    $('hubPanel').classList.remove('hidden');
    $('changeRegistrationButton').classList.remove('hidden');
    $('sessionBadge').classList.remove('hidden');
    renderHub();
  }

  function renderHub(){
    const snapshot=state.snapshot;
    const reg=snapshot.registration;
    $('sessionBadge').textContent=`${reg.group_code} · ${reg.mode === 'team' ? 'Team' : 'Individual'} · ${snapshot.completed_topics}/${snapshot.total_topics}`;
    $('identitySummary').textContent=`${reg.group_code} · ${reg.display_label}`;
    const totalStages=(snapshot.topics || []).reduce((sum,item)=>sum+Number(item.total_count||0),0);
    const correctStages=(snapshot.topics || []).reduce((sum,item)=>sum+Number(item.correct_count||0),0);
    const stagePercent=totalStages ? Math.round(100*correctStages/totalStages) : 0;
    $('globalPercent').textContent=`${stagePercent}%`;
    $('globalProgressBar').style.width=`${stagePercent}%`;
    $('globalProgressCopy').textContent=`${correctStages} / ${totalStages} workshop stages correct`;

    $('topicGrid').innerHTML=topics.map(topic=>{
      const p=progressFor(topic.slug) || {status:'locked',percent:0,correct_count:0,total_count:topic.exercises.length};
      const locked=p.status==='locked';
      const statusLabel=p.status==='completed'?'Complete':p.status==='in_progress'?'In progress':p.status==='available'?'Available':'Locked';
      const theoryHref=locked?'#':`theory.html?topic=${encodeURIComponent(topic.slug)}`;
      const workshopHref=locked?'#':`workshop.html?topic=${encodeURIComponent(topic.slug)}`;
      return `<article class="hub-topic-card ${escapeHtml(p.status)}">
        <div class="hub-topic-top"><span class="hub-topic-number">${String(topic.sequence).padStart(2,'0')}</span><span class="hub-topic-status">${escapeHtml(statusLabel)}</span></div>
        <h2>${escapeHtml(topic.title)}</h2>
        <p>${escapeHtml(topic.lead)}</p>
        <div class="hub-topic-progress"><div><strong>${Number(p.percent||0)}%</strong><span>${Number(p.correct_count||0)} / ${Number(p.total_count||topic.exercises.length)} workshop stages</span></div><div class="progress-track"><span style="width:${Number(p.percent||0)}%"></span></div></div>
        <div class="hub-topic-actions">
          <a class="button button-light ${locked?'disabled-link':''}" href="${theoryHref}" ${locked?'aria-disabled="true" tabindex="-1"':''}>Theory</a>
          <a class="button button-dark ${locked?'disabled-link':''}" href="${workshopHref}" ${locked?'aria-disabled="true" tabindex="-1"':''}>Workshop</a>
        </div>
        ${locked?'<div class="hub-lock-note">Complete the previous workshop to unlock theory and practice.</div>':''}
      </article>`;
    }).join('');
  }

  async function init(){
    $('registrationMode').addEventListener('change',updateRegistrationFields);
    $('teamSize').addEventListener('change',updateRegistrationFields);
    $('registrationForm').addEventListener('submit',register);
    $('changeRegistrationButton').addEventListener('click',()=>{clearSession();showRegistration();});
    updateRegistrationFields();
    const resumed=await resumeStored();
    if(resumed) showHub(); else showRegistration();
  }

  document.addEventListener('DOMContentLoaded',init);
})();
