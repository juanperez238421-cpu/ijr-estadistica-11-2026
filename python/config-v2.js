(() => {
  'use strict';

  const sessionStorageKey='ijr-stat11-python-hub-active-session-v20';
  const sessionVaultKey='ijr-stat11-python-hub-session-vault-v20';
  const legacySessionKey='ijr-stat11-python-hub-session-v2';

  window.IJR_PYTHON_HUB_CONFIG = Object.freeze({
    supabaseUrl: 'https://rlfxnjbqxbozjdzkbwlz.supabase.co',
    supabasePublishableKey: 'sb_publishable_rmVOQ3Orx49KpW_4uMqYew_c2HpcA87',
    institutionalEmailDomain: 'ijr.edu.co',
    sessionStorageKey,
    sessionVaultKey,
    rpc: Object.freeze({
      register: 'python_hub_register_v3',
      resume: 'python_hub_resume_v1',
      recover: 'python_hub_recover_v1',
      submit: 'python_hub_submit_v1'
    })
  });

  // Preserve a valid pre-V20 browser session without preserving the old progress-PIN UX.
  if(!localStorage.getItem(sessionStorageKey)){
    try{
      const legacy=JSON.parse(localStorage.getItem(legacySessionKey)||'null');
      if(legacy?.registrationId&&legacy?.accessToken){
        localStorage.setItem(sessionStorageKey,JSON.stringify({
          registrationId:legacy.registrationId,
          accessToken:legacy.accessToken,
          fingerprint:'',groupCode:'',emails:[],mode:'',
          savedAt:new Date().toISOString(),migratedFrom:'v2'
        }));
      }
    }catch{}
  }
})();
