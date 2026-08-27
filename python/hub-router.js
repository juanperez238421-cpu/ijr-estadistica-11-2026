(() => {
  'use strict';

  const config=window.IJR_PYTHON_HUB_CONFIG;
  const topics=window.IJR_PYTHON_HUB_TOPICS||[];
  if(!config||!window.supabase||!topics.length){
    document.body.innerHTML='<main style="padding:40px;font-family:sans-serif">Learning Hub configuration could not be loaded.</main>';
    return;
  }

  const client=window.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:true}
  });
  const $=id=>document.getElementById(id);
  const escapeHtml=value=>String(value??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const state={snapshot:null,registration:null,verifiedEmail:'',identityStatus:'',loading:false};

  function readSession(){try{return JSON.parse(sessionStorage.getItem(config.sessionStorageKey)||'null');}catch{return null;}}
  function saveSession(value){try{sessionStorage.setItem(config.sessionStorageKey,JSON.stringify(value));}catch{}}
  function clearSession(){try{sessionStorage.removeItem(config.sessionStorageKey);}catch{} state.snapshot=null;state.registration=null;}
  function readPending(){try{return JSON.parse(sessionStorage.getItem(config.pendingIdentityKey)||'null');}catch{return null;}}
  function savePending(value){try{sessionStorage.setItem(config.pendingIdentityKey,JSON.stringify(value));}catch{}}
  function clearPending(){try{sessionStorage.removeItem(config.pendingIdentityKey);}catch{}}
  function institutionalEmail(value){return String(value||'').trim().toLowerCase();}
  function validEmail(email){return email.split('@').length===2&&email.split('@')[0]&&email.endsWith(`@${config.institutionalEmailDomain}`);}
  async function rpc(name,args){const {data,error}=await client.rpc(name,args);if(error)throw new Error(error.message||'Backend request failed');return data;}

  function setStatus(id,text,kind=''){
    const el=$(id);if(!el)return;
    el.textContent=text||'';el.className=`inline-status ${kind}`.trim();
  }
  function showRegistration(){
    $('registrationPanel').classList.remove('hidden');$('hubPanel').classList.add('hidden');
    $('changeRegistrationButton').classList.add('hidden');$('sessionBadge').classList.add('hidden');
  }
  function showHub(){
    $('registrationPanel').classList.add('hidden');$('hubPanel').classList.remove('hidden');
    $('changeRegistrationButton').classList.remove('hidden');$('sessionBadge').classList.remove('hidden');
    renderHub();
  }

  async function resumeVerifiedSession(saved){
    if(!saved?.registrationId||!saved?.accessToken||!saved?.institutionalEmail)return false;
    try{
      const data=await rpc(config.rpc.resume,{p_registration_id:saved.registrationId,p_access_token:saved.accessToken});
      state.registration=saved;state.snapshot=data.snapshot;state.verifiedEmail=saved.institutionalEmail;state.identityStatus=saved.identityStatus||'';
      return true;
    }catch{return false;}
  }

  async function inspectActiveSession(){
    const saved=readSession();
    $('activeSessionPanel').classList.add('hidden');
    if(!saved)return;
    if(await resumeVerifiedSession(saved)){
      $('activeSessionIdentity').textContent=`${saved.groupCode} · ${saved.institutionalEmail}`;
      $('activeSessionPanel').classList.remove('hidden');
    }else clearSession();
  }

  async function sendVerification(event){
    event.preventDefault();
    const group=$('groupCode').value;
    const email=institutionalEmail($('studentEmail').value);
    if(!group){setStatus('identityStatus','Select your group.','error');return;}
    if(!validEmail(email)){setStatus('identityStatus',`Use your institutional @${config.institutionalEmailDomain} account.`,'error');return;}
    $('sendCodeButton').disabled=true;
    setStatus('identityStatus','Sending institutional-account verification…');
    savePending({groupCode:group,institutionalEmail:email,requestedAt:new Date().toISOString()});
    try{
      const {error}=await client.auth.signInWithOtp({
        email,
        options:{shouldCreateUser:true,emailRedirectTo:`${location.origin}${location.pathname}`}
      });
      if(error)throw error;
      $('verificationIdentity').textContent=`Verify ${email}`;
      $('verificationForm').classList.remove('hidden');
      setStatus('identityStatus','Verification sent. Check the institutional inbox.','ok');
      $('verificationCode').focus();
    }catch(error){setStatus('identityStatus',error.message||'Verification could not be sent.','error');}
    finally{$('sendCodeButton').disabled=false;}
  }

  async function finishVerifiedAccount(groupOverride=''){
    const {data:{session}}=await client.auth.getSession();
    const email=institutionalEmail(session?.user?.email);
    const group=groupOverride||$('groupCode').value||readPending()?.groupCode||'';
    if(!session?.access_token||!validEmail(email))throw new Error('Verified @ijr.edu.co email session required.');
    if(!group)throw new Error('Select your group before continuing.');

    const data=await rpc(config.rpc.account,{
      p_group_code:group,
      p_session_id:crypto.randomUUID(),
      p_user_agent:navigator.userAgent
    });
    const saved={
      registrationId:data.registration_id,
      accessToken:data.access_token,
      accessTokenExpiresAt:data.access_token_expires_at,
      institutionalEmail:data.institutional_email,
      groupCode:group,
      identityStatus:data.identity_status,
      verifiedAt:new Date().toISOString()
    };
    saveSession(saved);clearPending();
    state.registration=saved;state.snapshot=data.snapshot;state.verifiedEmail=data.institutional_email;state.identityStatus=data.identity_status;
    history.replaceState(null,'',location.pathname+location.search);
    showHub();
  }

  async function verifyCode(event){
    event.preventDefault();
    const pending=readPending();
    const email=institutionalEmail(pending?.institutionalEmail||$('studentEmail').value);
    const group=pending?.groupCode||$('groupCode').value;
    const token=String($('verificationCode').value||'').trim().replace(/\s+/g,'');
    if(!validEmail(email)||!group){setStatus('verificationStatus','Start with your group and institutional email.','error');return;}
    if(!token){setStatus('verificationStatus','Enter the verification code from your institutional email.','error');return;}
    $('verifyCodeButton').disabled=true;setStatus('verificationStatus','Verifying institutional account…');
    try{
      const {error}=await client.auth.verifyOtp({email,token,type:'email'});
      if(error)throw error;
      await finishVerifiedAccount(group);
    }catch(error){setStatus('verificationStatus',error.message||'Verification failed.','error');}
    finally{$('verifyCodeButton').disabled=false;}
  }

  async function detectVerifiedLink(){
    try{
      const {data:{session}}=await client.auth.getSession();
      const email=institutionalEmail(session?.user?.email);
      if(!session?.access_token||!validEmail(email))return;
      state.verifiedEmail=email;
      $('studentEmail').value=email;
      const pending=readPending();if(pending?.groupCode)$('groupCode').value=pending.groupCode;
      $('verifiedLinkIdentity').textContent=`Verified: ${email}`;
      $('verifiedLinkPanel').classList.remove('hidden');
      setStatus('identityStatus','Institutional email verified. Confirm the group and enter.','ok');
    }catch{}
  }

  function progressFor(slug){return state.snapshot?.topics?.find(item=>item.slug===slug)||null;}
  function renderHub(){
    const snapshot=state.snapshot;if(!snapshot)return;
    const reg=snapshot.registration;
    const email=state.verifiedEmail||state.registration?.institutionalEmail||reg.display_label;
    $('sessionBadge').textContent=`${reg.group_code} · ${email}`;
    $('identitySummary').innerHTML=`<strong>${escapeHtml(email)}</strong> · ${escapeHtml(reg.group_code)} · ${state.identityStatus==='verified_roster'?'Roster matched':'Institutional email verified'}`;

    const totalStages=(snapshot.topics||[]).reduce((sum,item)=>sum+Number(item.total_count||0),0);
    const correctStages=(snapshot.topics||[]).reduce((sum,item)=>sum+Number(item.correct_count||0),0);
    const stagePercent=totalStages?Math.round(100*correctStages/totalStages):0;
    $('globalPercent').textContent=`${stagePercent}%`;$('globalProgressBar').style.width=`${stagePercent}%`;
    $('globalProgressCopy').textContent=`${correctStages} / ${totalStages} current workshop stages validated`;

    $('topicGrid').innerHTML=topics.map(topic=>{
      const p=progressFor(topic.slug)||{status:'locked',percent:0,correct_count:0,total_count:topic.exercises.length,completion_source:'workshop'};
      const locked=p.status==='locked';
      const credited=p.completion_source==='legacy_credit';
      const statusLabel=credited?'Verified prior credit':p.status==='completed'?'Current workshop complete':p.status==='in_progress'?'In progress':p.status==='available'?'Available':'Locked';
      const theoryHref=locked?'#':`theory.html?topic=${encodeURIComponent(topic.slug)}`;
      const workshopHref=locked?'#':`workshop.html?topic=${encodeURIComponent(topic.slug)}`;
      return `<article class="hub-topic-card ${escapeHtml(p.status)}">
        <div class="hub-topic-top"><span class="hub-topic-number">${String(topic.sequence).padStart(2,'0')}</span><span class="hub-topic-status">${escapeHtml(statusLabel)}</span></div>
        <h2>${escapeHtml(topic.title)}</h2><p>${escapeHtml(topic.lead)}</p>
        ${credited?'<div class="hub-lock-note"><strong>Historical topic credit preserved.</strong> Current workshop-stage validations are tracked separately below.</div>':''}
        <div class="hub-topic-progress"><div><strong>${Number(p.percent||0)}%</strong><span>${Number(p.correct_count||0)} / ${Number(p.total_count||topic.exercises.length)} current stages validated</span></div><div class="progress-track"><span style="width:${Number(p.percent||0)}%"></span></div></div>
        <div class="hub-topic-actions"><a class="button button-light ${locked?'disabled-link':''}" href="${theoryHref}" ${locked?'aria-disabled="true" tabindex="-1"':''}>Theory</a><a class="button button-dark ${locked?'disabled-link':''}" href="${workshopHref}" ${locked?'aria-disabled="true" tabindex="-1"':''}>Workshop</a></div>
        ${locked?'<div class="hub-lock-note">Complete the previous required topic to unlock theory and practice.</div>':''}
      </article>`;
    }).join('');
  }

  async function useAnotherAccount(){
    clearSession();clearPending();
    try{await client.auth.signOut({scope:'local'});}catch{}
    $('activeSessionPanel').classList.add('hidden');$('verifiedLinkPanel').classList.add('hidden');$('verificationForm').classList.add('hidden');
    $('studentEmail').value='';$('verificationCode').value='';$('groupCode').value='';
    showRegistration();setStatus('identityStatus','Enter the next student’s institutional account.');
  }

  async function init(){
    showRegistration();
    $('identityForm').addEventListener('submit',sendVerification);
    $('verificationForm').addEventListener('submit',verifyCode);
    $('completeVerifiedButton').addEventListener('click',async()=>{
      try{await finishVerifiedAccount($('groupCode').value);}catch(error){setStatus('identityStatus',error.message,'error');}
    });
    $('continueSessionButton').addEventListener('click',()=>{if(state.snapshot)showHub();});
    $('discardSessionButton').addEventListener('click',useAnotherAccount);
    $('changeRegistrationButton').addEventListener('click',useAnotherAccount);

    await inspectActiveSession();
    await detectVerifiedLink();
  }

  document.addEventListener('DOMContentLoaded',init);
})();
