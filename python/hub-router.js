(() => {
  'use strict';

  const config = window.IJR_PYTHON_HUB_CONFIG;
  const topics = window.IJR_PYTHON_HUB_TOPICS || [];
  if (!config || !window.supabase || !topics.length) {
    document.body.innerHTML = '<main style="padding:40px;font-family:sans-serif">Learning Hub configuration could not be loaded.</main>';
    return;
  }

  const client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false }
  });

  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const state = { snapshot:null, registration:null };
  const requestedReturnTo = new URLSearchParams(location.search).get('returnTo') || '';
  const LAB_LOGIN_RPC = config.rpc?.labLogin || 'python_hub_lab_login_v51';

  function readJson(key,fallback=null){
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
  }
  function writeJson(key,value){ try { localStorage.setItem(key,JSON.stringify(value)); } catch {} }
  function removeKey(key){ try { localStorage.removeItem(key); } catch {} }
  function getStoredSession(){ return readJson(config.sessionStorageKey,null); }

  function rememberSession(registrationId,accessToken,meta={}){
    const item={
      registrationId,
      accessToken,
      fingerprint:'',
      groupCode:meta.groupCode||'',
      emails:meta.email?[meta.email]:[],
      mode:'individual-lab',
      authProtected:false,
      labAccessV51:true,
      savedAt:new Date().toISOString()
    };
    writeJson(config.sessionStorageKey,item);
    state.registration=item;
  }

  function clearHubSession(){
    removeKey(config.sessionStorageKey);
    removeKey(config.sessionVaultKey);
    removeKey(config.pendingAuthStorageKey);
    state.snapshot=null;
    state.registration=null;
  }

  async function rpc(name,args){
    const {data,error}=await client.rpc(name,args);
    if(error) throw new Error(error.message || 'Backend request failed');
    return data;
  }

  function normalizeEmail(value){ return String(value||'').trim().toLowerCase(); }
  function validInstitutionalEmail(email){
    if(!email || email.split('@').length!==2) return false;
    const [local,domain]=email.split('@');
    return Boolean(local) && domain===config.institutionalEmailDomain;
  }

  function currentIdentity(){
    return {
      groupCode:String($('groupCode')?.value||'').trim().toUpperCase(),
      email:normalizeEmail($('studentEmail')?.value||'')
    };
  }

  function prepareLabAccessCopy(){
    document.title='Statistics 11 · Python Learning Hub · Lab Access';
    const eyebrow=document.querySelector('#registrationPanel .eyebrow');
    if(eyebrow) eyebrow.textContent='INSTITUTIONAL LAB ACCESS · ACCESO PERSONAL';
    const title=document.querySelector('#registrationPanel h1');
    if(title) title.textContent='Your institutional email identifies your progress.';
    const lead=document.querySelector('#registrationPanel .registration-lead');
    if(lead) lead.innerHTML='Enter your <strong>@ijr.edu.co institutional email</strong> and your class group. In the supervised computer lab, no Outlook confirmation or mobile phone is required. Progress remains attached to the same institutional email.';

    const rules=document.querySelectorAll('#registrationPanel .sequence-rule');
    if(rules[0]){
      const strong=rules[0].querySelector('strong');
      const span=rules[0].querySelector('span');
      const small=rules[0].querySelector('small');
      if(strong) strong.textContent='One-step classroom access';
      if(span) span.textContent='01 Group + institutional email → Python Learning Hub';
      if(small) small.textContent='The backend checks that the institutional email belongs to the selected Statistics 11 group or to an approved QA account.';
    }

    const protection=document.querySelector('#identityStepForm .sequence-rule');
    if(protection){
      const strong=protection.querySelector('strong');
      const span=protection.querySelector('span');
      const small=protection.querySelector('small');
      if(strong) strong.textContent='Institutional identity · no inbox confirmation';
      if(span) span.textContent='Only @ijr.edu.co accounts accepted by the Statistics 11 roster can enter.';
      if(small) small.textContent='Students do not need Outlook, a cellphone, an email confirmation link, or a separate password during the supervised lab session.';
    }

    const actionCopy=document.querySelector('#identityStepForm .registration-actions > div');
    if(actionCopy) actionCopy.innerHTML='<strong>Enter Statistics 11</strong><span>Select 11A, 11B or 11C and type the institutional email that belongs to that student.</span>';
    if($('continueIdentityButton')) $('continueIdentityButton').textContent='Enter Learning Hub';
    if($('passwordStepForm')) $('passwordStepForm').classList.add('hidden');
    if($('confirmationPanel')) $('confirmationPanel').classList.add('hidden');
  }

  function showRegistration(){
    $('registrationPanel').classList.remove('hidden');
    $('hubPanel').classList.add('hidden');
    $('changeRegistrationButton').classList.add('hidden');
    $('sessionBadge').classList.add('hidden');
  }

  function showIdentityStep({preserve=true}={}){
    showRegistration();
    $('identityStepForm').classList.remove('hidden');
    $('passwordStepForm')?.classList.add('hidden');
    $('confirmationPanel')?.classList.add('hidden');
    $('studentEmail').readOnly=false;
    if(!preserve){
      $('groupCode').value='';
      $('studentEmail').value='';
    }
    $('continueIdentityButton').textContent='Enter Learning Hub';
  }

  function progressFor(slug){ return state.snapshot?.topics?.find(item=>item.slug===slug) || null; }

  function renderHub(){
    const snapshot=state.snapshot;
    if(!snapshot?.registration) return;
    const reg=snapshot.registration;
    $('sessionBadge').textContent=`${reg.group_code} · Institutional lab access · ${snapshot.completed_topics}/${snapshot.total_topics}`;
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

  function showHub(){
    $('registrationPanel').classList.add('hidden');
    $('hubPanel').classList.remove('hidden');
    $('changeRegistrationButton').classList.remove('hidden');
    $('sessionBadge').classList.remove('hidden');
    $('changeRegistrationButton').textContent='Switch student';
    renderHub();

    const overviewRule=document.querySelector('#hubPanel .hub-overview .sequence-rule');
    if(overviewRule){
      const span=overviewRule.querySelector('span');
      const small=overviewRule.querySelector('small');
      if(span) span.textContent='Validated workshop progress is saved to the student identity linked to this institutional email.';
      if(small) small.innerHTML='Use <strong>Switch student</strong> before another student uses this computer.';
    }

    const match=requestedReturnTo.match(/^workshop\.html\?topic=([a-z0-9-]+)$/);
    if(match){
      const progress=progressFor(match[1]);
      if(progress && progress.status!=='locked') setTimeout(()=>location.replace(requestedReturnTo),0);
    }
  }

  async function resumeStoredSession(){
    const stored=getStoredSession();
    if(!stored?.registrationId || !stored?.accessToken) return false;
    try{
      const data=await rpc(config.rpc.resume,{
        p_registration_id:stored.registrationId,
        p_access_token:stored.accessToken
      });
      if(!data?.snapshot?.registration || !Array.isArray(data.snapshot.topics)) return false;
      state.registration=stored;
      state.snapshot=data.snapshot;
      showHub();
      return true;
    }catch{
      clearHubSession();
      return false;
    }
  }

  async function handleIdentityStep(event){
    event.preventDefault();
    const status=$('identityStatus');
    const identity=currentIdentity();

    if(!['11A','11B','11C'].includes(identity.groupCode)){
      status.textContent='Select your group: 11A, 11B or 11C.';
      status.className='inline-status error';
      return;
    }
    if(!validInstitutionalEmail(identity.email)){
      status.textContent=`Use your institutional email ending in @${config.institutionalEmailDomain}.`;
      status.className='inline-status error';
      return;
    }

    $('continueIdentityButton').disabled=true;
    status.textContent='Checking institutional email and loading individual progress…';
    status.className='inline-status';

    try{
      const data=await rpc(LAB_LOGIN_RPC,{
        p_group_code:identity.groupCode,
        p_institutional_email:identity.email,
        p_session_id:crypto.randomUUID(),
        p_user_agent:navigator.userAgent
      });
      if(!data?.registration_id || !data?.access_token || !data?.snapshot?.registration){
        throw new Error('The lab access service returned an incomplete session.');
      }
      rememberSession(data.registration_id,data.access_token,{groupCode:identity.groupCode,email:identity.email});
      state.snapshot=data.snapshot;
      status.textContent='Access granted.';
      status.className='inline-status ok';
      showHub();
    }catch(error){
      status.textContent=String(error?.message || 'Access could not be started.');
      status.className='inline-status error';
    }finally{
      $('continueIdentityButton').disabled=false;
    }
  }

  async function signOutAndSwitch(){
    $('changeRegistrationButton').disabled=true;
    clearHubSession();
    showIdentityStep({preserve:false});
    $('identityStatus').textContent='Previous student session closed on this computer. Enter the next student’s institutional email.';
    $('identityStatus').className='inline-status ok';
    $('changeRegistrationButton').disabled=false;
  }

  async function init(){
    prepareLabAccessCopy();
    $('identityStepForm').addEventListener('submit',handleIdentityStep);
    $('changeRegistrationButton').addEventListener('click',signOutAndSwitch);

    // The password and email-confirmation controls remain in the HTML only for
    // backward-compatible markup. V51 does not use them in the supervised lab.
    $('passwordStepForm')?.classList.add('hidden');
    $('confirmationPanel')?.classList.add('hidden');

    if(await resumeStoredSession()) return;
    showIdentityStep({preserve:true});
  }

  document.addEventListener('DOMContentLoaded',init);
})();
