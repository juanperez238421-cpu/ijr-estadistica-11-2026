(() => {
  'use strict';

  const config = window.IJR_PYTHON_HUB_CONFIG;
  const topics = window.IJR_PYTHON_HUB_TOPICS || [];
  if (!config || !topics.length) {
    document.body.innerHTML = '<main style="padding:40px;font-family:sans-serif">Learning Hub configuration could not be loaded.</main>';
    return;
  }

  // Classroom-resilient REST transport. The Hub must remain usable even if the
  // optional Supabase JS CDN bundle is slow or temporarily unavailable.
  const RPC_TIMEOUT_MS = 6500;
  const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
  const sleep = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  function rpcError(message, {status=0, transient=false} = {}) {
    const error = new Error(message || 'Backend request failed.');
    error.status = status;
    error.transient = Boolean(transient);
    return error;
  }

  async function restRpc(name, args = {}, attempt = 0) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
    try {
      const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/${encodeURIComponent(name)}`, {
        method: 'POST',
        headers: {
          apikey: config.supabasePublishableKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-ijr-client': 'statistics11-hub-v65'
        },
        body: JSON.stringify(args || {}),
        signal: controller.signal,
        cache: 'no-store'
      });

      const raw = await response.text();
      let payload = null;
      try { payload = raw ? JSON.parse(raw) : null; }
      catch { payload = raw || null; }

      if (response.ok) return payload;

      const transient = RETRYABLE_STATUS.has(response.status);
      if (transient && attempt === 0) {
        await sleep(350);
        return restRpc(name, args, 1);
      }

      throw rpcError(
        payload?.message || payload?.details || payload?.hint || `Backend request failed (${response.status}).`,
        {status:response.status, transient}
      );
    } catch (rawError) {
      if (rawError?.status) throw rawError;
      const transient = rawError?.name === 'AbortError'
        || /network|fetch|load failed|failed to fetch/i.test(rawError?.message || '');

      if (transient && attempt === 0) {
        await sleep(350);
        return restRpc(name, args, 1);
      }

      throw rpcError(
        rawError?.name === 'AbortError'
          ? 'The service took too long to respond. Retry without closing this page.'
          : (rawError?.message || 'Network request failed.'),
        {transient:true}
      );
    } finally {
      window.clearTimeout(timer);
    }
  }

  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const state = { snapshot:null, registration:null };
  let evaluationAvailabilityTimer = null;
  const requestedReturnTo = new URLSearchParams(location.search).get('returnTo') || '';
  const LAB_LOGIN_RPC = config.rpc?.labLogin || 'python_hub_lab_login_v51';
  const EVALUATION_SLUG = 'modules-1-3-2026-10-01';
  const EVALUATION_ROUTE = 'evaluation-modules-1-3/';

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
    return restRpc(name,args);
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

  function localEvaluationIdentity(){
    const storedEmail=normalizeEmail(state.registration?.emails?.[0]||'');
    const snapshotEmail=normalizeEmail(state.snapshot?.registration?.display_label||'');
    return {
      email: storedEmail || snapshotEmail,
      groupCode:String(
        state.registration?.groupCode
        || state.snapshot?.registration?.group_code
        || ''
      ).trim().toUpperCase()
    };
  }

  function renderEvaluationCard(data){
    const panel=$('evaluationPanel');
    if(!panel) return;

    const windowCopy=data.opens_at&&data.closes_at
      ? `${evaluationTime(data.opens_at)} – ${evaluationTime(data.closes_at)}`
      : '';
    const stateCopy={
      scheduled:'Scheduled · opens automatically in your class window',
      open:data.qa_early_access
        ? 'QA EARLY ACCESS · OPEN NOW'
        : 'OPEN NOW · Start only when the teacher instructs you',
      attempted:'Attempt already registered for this account',
      closed:'Evaluation window closed'
    }[data.state] || data.state || 'Evaluation';

    const canOpen=data.state==='open';
    panel.dataset.state=data.state||'scheduled';
    panel.innerHTML=`
      <div>
        <p class="eyebrow">EVALUATION · MODULES 01–03 · ${escapeHtml(data.group_code||'')}</p>
        <h2>Python foundations · one-shot assessment</h2>
        <p><strong>${escapeHtml(stateCopy)}</strong>. 18 questions · 40 minutes · True/False, multiple choice, open response and programming. Incorrect confirmed answers deduct 1 point and cannot be changed.</p>
        <div class="evaluation-card-meta">
          <span>${data.qa_early_access?'QA account · single student':'Team: 1–3 students'}</span>
          <span>Fullscreen required</span>
          <span>Exit penalty: −1 point</span>
          ${windowCopy?`<span>${escapeHtml(windowCopy)}</span>`:''}
        </div>
      </div>
      <div class="evaluation-action">
        <a class="button ${canOpen?'button-dark':'button-light'} ${canOpen?'':'disabled-link'}"
           href="${canOpen?EVALUATION_ROUTE:'#'}"
           ${canOpen?'':'aria-disabled="true" tabindex="-1"'}>${canOpen?'Start evaluation':'Not available yet'}</a>
      </div>`;
    panel.classList.remove('hidden');
  }

  function evaluationTime(value){
    if(!value) return '';
    try{
      return new Intl.DateTimeFormat('en-CO',{
        timeZone:'America/Bogota',
        weekday:'short',
        hour:'numeric',
        minute:'2-digit'
      }).format(new Date(value));
    }catch{return String(value);}
  }

  async function renderEvaluationPanel(){
    const panel=$('evaluationPanel');
    if(evaluationAvailabilityTimer){
      window.clearTimeout(evaluationAvailabilityTimer);
      evaluationAvailabilityTimer=null;
    }
    if(!panel || !state.registration?.registrationId || !state.registration?.accessToken) return;

    const localIdentity=localEvaluationIdentity();
    const isQaEarlyAccount=localIdentity.email==='qa.student11@ijr.edu.co'
      && localIdentity.groupCode==='11A';

    // student-progress-v29 renders the canonical QA card inside the visible
    // identity panel. Keep this older slot as a fallback only.
    if(isQaEarlyAccount && document.getElementById('qaEvaluationAccessCard')){
      panel.classList.add('hidden');
      return;
    }

    // Render a visible card immediately for the dedicated QA account. The
    // backend remains authoritative for starting the attempt.
    if(isQaEarlyAccount){
      renderEvaluationCard({
        eligible:true,
        state:'open',
        group_code:'11A',
        qa_early_access:true
      });
    }

    try{
      const raw=await rpc(config.rpc?.evalAvailability || 'python_hub_eval_availability_v1',{
        p_registration_id:state.registration.registrationId,
        p_access_token:state.registration.accessToken,
        p_evaluation_slug:EVALUATION_SLUG
      });
      const data=Array.isArray(raw)?raw[0]:raw;

      if(!data?.eligible){
        if(!isQaEarlyAccount) panel.classList.add('hidden');
        return;
      }

      renderEvaluationCard(data);
      if(data.state==='scheduled' || data.state==='open'){
        evaluationAvailabilityTimer=window.setTimeout(renderEvaluationPanel,30000);
      }
    }catch(error){
      if(!isQaEarlyAccount) panel.classList.add('hidden');
      console.warn('Evaluation availability could not be loaded.',error);
    }
  }

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

    renderEvaluationPanel();
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
    }catch(error){
      // Preserve a valid browser session through temporary network/CDN/backend
      // disturbances. Only clear it for a definitive non-transient rejection.
      if(!error?.transient) clearHubSession();
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

    const hadStoredSession=Boolean(getStoredSession()?.registrationId && getStoredSession()?.accessToken);
    if(await resumeStoredSession()) return;
    showIdentityStep({preserve:true});
    if(hadStoredSession && getStoredSession()?.registrationId){
      $('identityStatus').textContent='Temporary connection issue while restoring progress. Your saved session was preserved; retry or reload this page.';
      $('identityStatus').className='inline-status error';
    }
  }

  document.addEventListener('DOMContentLoaded',init);
})();
