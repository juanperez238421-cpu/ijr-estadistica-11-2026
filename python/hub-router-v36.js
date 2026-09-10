(() => {
  'use strict';

  const config = window.IJR_PYTHON_HUB_CONFIG;
  const topics = window.IJR_PYTHON_HUB_TOPICS || [];
  if (!config || !window.supabase || !topics.length) {
    document.body.innerHTML = '<main style="padding:40px;font-family:sans-serif">Learning Hub configuration could not be loaded.</main>';
    return;
  }

  const client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
  });

  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const QA_EMAIL='qa.student11@ijr.edu.co';
  const QA_GROUP='11A';
  const QA_PASSWORD_SHA256='192c0b6d86ac758a197ef18e0d530a429e2d5a0f093ac27fed88f918f36f401f';
  const QA_REGISTER_RPC='python_hub_register_v1';
  const state = {
    snapshot:null,
    registration:null,
    authSession:null,
    passwordMode:'signup',
    pendingIdentity:null
  };

  function readJson(key, fallback=null){
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
  }
  function writeJson(key,value){ try { localStorage.setItem(key,JSON.stringify(value)); } catch {} }
  function removeKey(key){ try { localStorage.removeItem(key); } catch {} }
  function getStoredSession(){ return readJson(config.sessionStorageKey,null); }
  function getPendingIdentity(){ return readJson(config.pendingAuthStorageKey,null); }

  function rememberSession(registrationId,accessToken,meta={}){
    const item={
      registrationId,
      accessToken,
      fingerprint:'',
      groupCode:meta.groupCode||'',
      emails:meta.email?[meta.email]:[],
      mode:'individual',
      authProtected:meta.authProtected!==false,
      qaTest:Boolean(meta.qaTest),
      savedAt:new Date().toISOString()
    };
    writeJson(config.sessionStorageKey,item);
    state.registration={registrationId,accessToken};
  }

  function clearHubSession(){
    removeKey(config.sessionStorageKey);
    removeKey(config.sessionVaultKey);
    state.snapshot=null;
    state.registration=null;
  }

  function savePendingIdentity(identity){
    state.pendingIdentity=identity;
    writeJson(config.pendingAuthStorageKey,identity);
  }

  function clearPendingIdentity(){
    state.pendingIdentity=null;
    removeKey(config.pendingAuthStorageKey);
  }

  async function rpc(name,args){
    const {data,error} = await client.rpc(name,args);
    if(error) throw new Error(error.message || 'Backend request failed');
    return data;
  }

  function normalizeEmail(value){ return String(value||'').trim().toLowerCase(); }
  function validInstitutionalEmail(email){
    if(!email || email.split('@').length!==2) return false;
    const [local,domain]=email.split('@');
    return Boolean(local) && domain===config.institutionalEmailDomain;
  }
  function isQaEmail(email){ return normalizeEmail(email)===QA_EMAIL; }
  function isQaIdentity(identity){ return Boolean(identity) && isQaEmail(identity.email) && String(identity.groupCode||'').toUpperCase()===QA_GROUP; }

  async function sha256Hex(value){
    const bytes=new TextEncoder().encode(String(value||''));
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,'0')).join('');
  }
  async function verifyQaPassword(password){ return (await sha256Hex(password))===QA_PASSWORD_SHA256; }

  function validatePassword(password,confirmation,needsConfirmation){
    if(password.length<8) return 'Use at least 8 characters.';
    if(!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return 'Use at least one letter and one number.';
    if(needsConfirmation && password!==confirmation) return 'The two passwords do not match. Type the same password in both fields.';
    return '';
  }

  function currentIdentity(){
    const group=String($('groupCode')?.value||state.pendingIdentity?.groupCode||'').toUpperCase();
    const email=normalizeEmail($('studentEmail')?.value||state.pendingIdentity?.email||state.authSession?.user?.email||'');
    return {groupCode:group,email};
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
    $('passwordStepForm').classList.add('hidden');
    $('confirmationPanel').classList.add('hidden');
    if(!preserve){
      $('groupCode').value='';
      $('studentEmail').value='';
      $('identityStatus').textContent='';
    }
    const pending=getPendingIdentity();
    if(pending){
      if(pending.groupCode && !$('groupCode').value) $('groupCode').value=pending.groupCode;
      if(pending.email && !$('studentEmail').value) $('studentEmail').value=pending.email;
    }
    if(state.authSession?.user?.email){
      $('studentEmail').value=normalizeEmail(state.authSession.user.email);
      $('studentEmail').readOnly=true;
      $('identityStatus').textContent='Institutional account is already authenticated. Confirm your group to continue.';
      $('identityStatus').className='inline-status ok';
      $('continueIdentityButton').textContent='Continue to Learning Hub';
    }else{
      $('studentEmail').readOnly=false;
      $('continueIdentityButton').textContent='Continue to password';
    }
  }

  function setPasswordMode(mode){
    const identity=state.pendingIdentity||getPendingIdentity();
    const qaMode=isQaIdentity(identity);
    state.passwordMode=qaMode?'signin':(mode==='signin'?'signin':'signup');
    const signup=state.passwordMode==='signup';
    $('confirmPasswordWrap').classList.toggle('hidden',!signup);
    $('studentPasswordConfirm').required=signup;
    $('studentPassword').autocomplete=signup?'new-password':'current-password';
    $('studentPasswordConfirm').autocomplete='new-password';
    $('passwordModeTitle').textContent=qaMode?'QA student · Enter the test password':(signup?'First access · Create your password':'Returning student · Enter your password');
    $('passwordModeCopy').textContent=qaMode
      ?'This synthetic student uses the same Learning Hub, theory pages, workshops and production progress backend without using the teacher master code.'
      :(signup
        ?'Create a private password and enter it twice. After email verification, this password will protect your individual learning progress.'
        :'Enter the password you created for this institutional account.');
    $('passwordActionTitle').textContent=qaMode?'Step 2 of 2 · QA student sign in':(signup?'Step 2 of 2 · Confirm your password':'Step 2 of 2 · Sign in');
    $('passwordActionCopy').textContent=qaMode
      ?'The QA identity is isolated from the official student roster and starts with clean workshop progress.'
      :(signup
        ?'Both password fields must match exactly before the account can be created.'
        :'Your institutional email and password must match the verified student account.');
    $('passwordSubmitButton').textContent='Sign in';
    if(!qaMode) $('passwordSubmitButton').textContent=signup?'Create account':'Sign in';
    $('passwordToggleLabel').textContent=qaMode?'Pre-created QA account':(signup?'Already created your password?':'First time on this Hub?');
    $('passwordToggleCopy').textContent=qaMode
      ?'Account creation is intentionally disabled for this synthetic QA identity.'
      :(signup
        ?'Switch to sign-in mode. Returning students enter the password only once.'
        :'Switch to first-access mode to create and confirm a new password.');
    $('passwordModeToggle').textContent=qaMode?'QA account ready':(signup?'I already have a password':'Create my password');
    $('passwordModeToggle').disabled=qaMode;
    $('studentPassword').value='';
    $('studentPasswordConfirm').value='';
    $('passwordStatus').textContent='';
    $('passwordStatus').className='inline-status';
  }

  function showPasswordStep(identity,mode='signup'){
    savePendingIdentity(identity);
    showRegistration();
    $('identityStepForm').classList.add('hidden');
    $('passwordStepForm').classList.remove('hidden');
    $('confirmationPanel').classList.add('hidden');
    $('selectedIdentity').textContent=`${identity.groupCode} · ${identity.email}`;
    setPasswordMode(mode);
    setTimeout(()=>$('studentPassword').focus(),0);
  }

  function showConfirmation(email){
    showRegistration();
    $('identityStepForm').classList.add('hidden');
    $('passwordStepForm').classList.add('hidden');
    $('confirmationPanel').classList.remove('hidden');
    $('confirmationEmail').textContent=`A confirmation message was sent to ${email}.`;
  }

  function showHub(){
    $('registrationPanel').classList.add('hidden');
    $('hubPanel').classList.remove('hidden');
    $('changeRegistrationButton').classList.remove('hidden');
    $('sessionBadge').classList.remove('hidden');
    renderHub();
  }

  async function openStudentAccount(identity){
    const status=$('passwordStatus') || $('identityStatus');
    if(status){ status.textContent='Loading your verified learning progress…'; status.className='inline-status'; }
    const data=await rpc(config.rpc.studentAccount,{
      p_group_code:identity.groupCode,
      p_session_id:crypto.randomUUID(),
      p_user_agent:navigator.userAgent
    });
    rememberSession(data.registration_id,data.access_token,{groupCode:identity.groupCode,email:identity.email});
    state.snapshot=data.snapshot;
    clearPendingIdentity();
    showHub();
  }

  async function openQaStudentAccount(identity){
    const status=$('passwordStatus') || $('identityStatus');
    if(status){ status.textContent='Loading the isolated QA student learning path…'; status.className='inline-status'; }
    const data=await rpc(QA_REGISTER_RPC,{
      p_registration_mode:'individual',
      p_group_code:QA_GROUP,
      p_student_emails:[QA_EMAIL],
      p_session_id:crypto.randomUUID(),
      p_user_agent:`QA Student V36 · ${navigator.userAgent}`
    });
    rememberSession(data.registration_id,data.access_token,{
      groupCode:identity.groupCode,
      email:identity.email,
      authProtected:false,
      qaTest:true
    });
    state.authSession=null;
    state.snapshot=data.snapshot;
    clearPendingIdentity();
    showHub();
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
    if(isQaEmail(identity.email) && identity.groupCode!==QA_GROUP){
      status.textContent=`The QA student account belongs to group ${QA_GROUP}.`;
      status.className='inline-status error';
      return;
    }

    savePendingIdentity(identity);
    if(isQaIdentity(identity)){
      showPasswordStep(identity,'signin');
      return;
    }

    status.textContent='Checking institutional account…';
    status.className='inline-status';
    $('continueIdentityButton').disabled=true;
    try{
      const {data:{session}}=await client.auth.getSession();
      state.authSession=session||null;
      if(session?.user?.email){
        const authenticatedEmail=normalizeEmail(session.user.email);
        if(authenticatedEmail!==identity.email){
          await client.auth.signOut();
          state.authSession=null;
          clearHubSession();
          status.textContent='A different student account was active on this device. It was signed out; continue with the selected email.';
          status.className='inline-status';
          showPasswordStep(identity,'signin');
          return;
        }
        await openStudentAccount(identity);
        return;
      }
      showPasswordStep(identity,'signup');
    }catch(error){
      status.textContent=error.message;
      status.className='inline-status error';
    }finally{
      $('continueIdentityButton').disabled=false;
    }
  }

  async function handlePasswordStep(event){
    event.preventDefault();
    const status=$('passwordStatus');
    const identity=state.pendingIdentity||getPendingIdentity();
    if(!identity || !validInstitutionalEmail(identity.email) || !['11A','11B','11C'].includes(identity.groupCode)){
      status.textContent='Return to Step 1 and enter your institutional email and group again.';
      status.className='inline-status error';
      return;
    }

    const qaMode=isQaIdentity(identity);
    const password=$('studentPassword').value;
    const confirmation=$('studentPasswordConfirm').value;
    const needsConfirmation=!qaMode && state.passwordMode==='signup';
    const passwordError=validatePassword(password,confirmation,needsConfirmation);
    if(passwordError){
      status.textContent=passwordError;
      status.className='inline-status error';
      return;
    }

    $('passwordSubmitButton').disabled=true;
    $('passwordModeToggle').disabled=true;
    status.textContent=qaMode?'Signing in as the QA student…':(needsConfirmation?'Creating secure student account…':'Signing in securely…');
    status.className='inline-status';

    try{
      if(qaMode){
        if(!(await verifyQaPassword(password))) throw new Error('Invalid login credentials');
        $('studentPassword').value='';
        await openQaStudentAccount(identity);
        return;
      }

      if(needsConfirmation){
        const redirectTo=`${location.origin}${location.pathname}`;
        const {data,error}=await client.auth.signUp({
          email:identity.email,
          password,
          options:{
            emailRedirectTo:redirectTo,
            data:{course:'statistics-11-python-hub'}
          }
        });
        if(error) throw error;
        state.authSession=data.session||null;
        $('studentPassword').value='';
        $('studentPasswordConfirm').value='';

        if(data.session){
          await openStudentAccount(identity);
          return;
        }

        status.textContent='Account created. Confirm the institutional email before entering the Hub.';
        status.className='inline-status ok';
        showConfirmation(identity.email);
        return;
      }

      const {data,error}=await client.auth.signInWithPassword({email:identity.email,password});
      if(error) throw error;
      state.authSession=data.session||null;
      $('studentPassword').value='';
      await openStudentAccount(identity);
    }catch(error){
      const message=String(error?.message||'Sign-in failed.');
      const normalized=message.toLowerCase();
      if(normalized.includes('invalid login credentials')){
        status.textContent=qaMode?'QA email or test password is incorrect.':'Email or password is incorrect. If this is your first access, choose “Create my password”.';
      }else if(normalized.includes('email not confirmed')){
        status.textContent='Confirm your institutional email from the message in your inbox, then sign in again.';
      }else if(normalized.includes('user already registered')){
        status.textContent='This institutional email already has an account. Choose “I already have a password”.';
      }else{
        status.textContent=message;
      }
      status.className='inline-status error';
    }finally{
      $('passwordSubmitButton').disabled=false;
      $('passwordModeToggle').disabled=isQaIdentity(state.pendingIdentity||getPendingIdentity());
    }
  }

  function progressFor(slug){ return state.snapshot?.topics?.find(item=>item.slug===slug) || null; }

  function renderHub(){
    const snapshot=state.snapshot;
    if(!snapshot?.registration) return;
    const reg=snapshot.registration;
    const stored=getStoredSession();
    $('sessionBadge').textContent=stored?.qaTest
      ?`${reg.group_code} · QA student · ${snapshot.completed_topics}/${snapshot.total_topics}`
      :`${reg.group_code} · Verified student · ${snapshot.completed_topics}/${snapshot.total_topics}`;
    $('identitySummary').textContent=stored?.qaTest
      ?`${reg.group_code} · QA Student 11 · isolated test progress`
      :`${reg.group_code} · ${reg.display_label}`;
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

  async function signOutAndSwitch(){
    $('changeRegistrationButton').disabled=true;
    const stored=getStoredSession();
    if(!stored?.qaTest){
      try{ await client.auth.signOut(); }catch{}
    }
    state.authSession=null;
    clearHubSession();
    clearPendingIdentity();
    $('studentEmail').readOnly=false;
    showIdentityStep({preserve:false});
    $('identityStatus').textContent=stored?.qaTest?'QA student signed out. Enter another student account.':'Previous student signed out. Enter the next student’s institutional account.';
    $('identityStatus').className='inline-status ok';
    $('changeRegistrationButton').disabled=false;
  }

  async function init(){
    $('identityStepForm').addEventListener('submit',handleIdentityStep);
    $('passwordStepForm').addEventListener('submit',handlePasswordStep);
    $('backToIdentityButton').addEventListener('click',()=>showIdentityStep({preserve:true}));
    $('passwordModeToggle').addEventListener('click',()=>setPasswordMode(state.passwordMode==='signup'?'signin':'signup'));
    $('confirmationReturnButton').addEventListener('click',()=>{
      const identity=getPendingIdentity();
      if(identity) showPasswordStep(identity,'signin');
      else showIdentityStep({preserve:false});
    });
    $('changeRegistrationButton').addEventListener('click',signOutAndSwitch);

    state.pendingIdentity=getPendingIdentity();

    const storedQa=getStoredSession();
    if(storedQa?.qaTest===true && storedQa?.registrationId && storedQa?.accessToken &&
       normalizeEmail(storedQa?.emails?.[0])===QA_EMAIL && String(storedQa?.groupCode||'').toUpperCase()===QA_GROUP){
      showRegistration();
      try{
        const data=await rpc(config.rpc.resume,{
          p_registration_id:storedQa.registrationId,
          p_access_token:storedQa.accessToken
        });
        state.registration={registrationId:storedQa.registrationId,accessToken:storedQa.accessToken};
        state.snapshot=data.snapshot;
        clearPendingIdentity();
        showHub();
        return;
      }catch{
        clearHubSession();
      }
    }

    try{
      const {data:{session}}=await client.auth.getSession();
      state.authSession=session||null;
    }catch{
      state.authSession=null;
    }

    if(state.authSession?.user?.email){
      const email=normalizeEmail(state.authSession.user.email);
      const pending=getPendingIdentity();
      const stored=getStoredSession();
      const groupCode=String(pending?.groupCode||stored?.groupCode||'').toUpperCase();
      if(groupCode && ['11A','11B','11C'].includes(groupCode)){
        const identity={groupCode,email};
        savePendingIdentity(identity);
        showRegistration();
        try{
          await openStudentAccount(identity);
          return;
        }catch(error){
          showIdentityStep({preserve:true});
          $('groupCode').value=groupCode;
          $('studentEmail').value=email;
          $('identityStatus').textContent=error.message;
          $('identityStatus').className='inline-status error';
          return;
        }
      }

      showIdentityStep({preserve:true});
      $('studentEmail').value=email;
      $('studentEmail').readOnly=true;
      $('identityStatus').textContent='Institutional account verified. Select your group to load your progress.';
      $('identityStatus').className='inline-status ok';
      return;
    }

    // Real students still require Supabase Auth. Only the exact synthetic QA
    // identity above may use the isolated registration-only test path.
    clearHubSession();
    showIdentityStep({preserve:true});
  }

  document.addEventListener('DOMContentLoaded',init);

  window.IJR_STUDENT_QA_V36=Object.freeze({
    email:QA_EMAIL,
    group:QA_GROUP,
    isolated:true,
    realStudentAuthUnchanged:true
  });
})();
