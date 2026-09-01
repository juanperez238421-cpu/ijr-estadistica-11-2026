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
      authProtected:true,
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
    state.passwordMode=mode==='signin'?'signin':'signup';
    const signup=state.passwordMode==='signup';
    $('confirmPasswordWrap').classList.toggle('hidden',!signup);
    $('studentPasswordConfirm').required=signup;
    $('studentPassword').autocomplete=signup?'new-password':'current-password';
    $('studentPasswordConfirm').autocomplete='new-password';
    $('passwordModeTitle').textContent=signup?'First access · Create your password':'Returning student · Enter your password';
    $('passwordModeCopy').textContent=signup
      ?'Create a private password and enter it twice. After email verification, this password will protect your individual learning progress.'
      :'Enter the password you created for this institutional account.';
    $('passwordActionTitle').textContent=signup?'Step 2 of 2 · Confirm your password':'Step 2 of 2 · Sign in';
    $('passwordActionCopy').textContent=signup
      ?'Both password fields must match exactly before the account can be created.'
      :'Your institutional email and password must match the verified student account.';
    $('passwordSubmitButton').textContent=signup?'Create account':'Sign in';
    $('passwordToggleLabel').textContent=signup?'Already created your password?':'First time on this Hub?';
    $('passwordToggleCopy').textContent=signup
      ?'Switch to sign-in mode. Returning students enter the password only once.'
      :'Switch to first-access mode to create and confirm a new password.';
    $('passwordModeToggle').textContent=signup?'I already have a password':'Create my password';
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

    savePendingIdentity(identity);
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

    const password=$('studentPassword').value;
    const confirmation=$('studentPasswordConfirm').value;
    const needsConfirmation=state.passwordMode==='signup';
    const passwordError=validatePassword(password,confirmation,needsConfirmation);
    if(passwordError){
      status.textContent=passwordError;
      status.className='inline-status error';
      return;
    }

    $('passwordSubmitButton').disabled=true;
    $('passwordModeToggle').disabled=true;
    status.textContent=needsConfirmation?'Creating secure student account…':'Signing in securely…';
    status.className='inline-status';

    try{
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
        status.textContent='Email or password is incorrect. If this is your first access, choose “Create my password”.';
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
      $('passwordModeToggle').disabled=false;
    }
  }

  function progressFor(slug){ return state.snapshot?.topics?.find(item=>item.slug===slug) || null; }

  function renderHub(){
    const snapshot=state.snapshot;
    if(!snapshot?.registration) return;
    const reg=snapshot.registration;
    $('sessionBadge').textContent=`${reg.group_code} · Verified student · ${snapshot.completed_topics}/${snapshot.total_topics}`;
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

  async function signOutAndSwitch(){
    $('changeRegistrationButton').disabled=true;
    try{ await client.auth.signOut(); }catch{}
    state.authSession=null;
    clearHubSession();
    clearPendingIdentity();
    $('studentEmail').readOnly=false;
    showIdentityStep({preserve:false});
    $('identityStatus').textContent='Previous student signed out. Enter the next student’s institutional account.';
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

    // Deliberately do not resume a legacy email-only Hub token here. The student
    // must authenticate with the institutional email + password gate first.
    clearHubSession();
    showIdentityStep({preserve:true});
  }

  document.addEventListener('DOMContentLoaded',init);
})();
