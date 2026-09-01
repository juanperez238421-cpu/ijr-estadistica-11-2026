(() => {
  'use strict';

  const sessionStorageKey='ijr-stat11-python-hub-active-session-v20';
  const sessionVaultKey='ijr-stat11-python-hub-session-vault-v20';
  const legacySessionKey='ijr-stat11-python-hub-session-v2';
  const pendingAuthStorageKey='ijr-stat11-python-hub-pending-auth-v31';

  window.IJR_PYTHON_HUB_CONFIG = Object.freeze({
    supabaseUrl: 'https://rlfxnjbqxbozjdzkbwlz.supabase.co',
    supabasePublishableKey: 'sb_publishable_rmVOQ3Orx49KpW_4uMqYew_c2HpcA87',
    institutionalEmailDomain: 'ijr.edu.co',
    sessionStorageKey,
    sessionVaultKey,
    pendingAuthStorageKey,
    rpc: Object.freeze({
      studentAccount: 'python_hub_student_account_v1',
      resume: 'python_hub_resume_v1',
      recover: 'python_hub_recover_v1',
      submit: 'python_hub_submit_v1'
    })
  });

  // Preserve a valid pre-V20 browser session for progress continuity only.
  // Hub entry itself is now protected by Supabase Auth; hub-router.js will not
  // resume this token unless the student has an authenticated institutional session.
  if(!localStorage.getItem(sessionStorageKey)){
    try{
      const legacy=JSON.parse(localStorage.getItem(legacySessionKey)||'null');
      if(legacy?.registrationId&&legacy?.accessToken){
        localStorage.setItem(sessionStorageKey,JSON.stringify({
          registrationId:legacy.registrationId,
          accessToken:legacy.accessToken,
          fingerprint:'',groupCode:'',emails:[],mode:'individual',
          savedAt:new Date().toISOString(),migratedFrom:'v2'
        }));
      }
    }catch{}
  }
})();
