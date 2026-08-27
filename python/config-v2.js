(() => {
  'use strict';

  const sessionStorageKey='ijr-stat11-python-hub-verified-session-v26';
  const pendingIdentityKey='ijr-stat11-python-hub-pending-identity-v26';
  const legacyStorageKeys=[
    'ijr-stat11-python-hub-active-session-v20',
    'ijr-stat11-python-hub-session-vault-v20',
    'ijr-stat11-python-hub-session-v2'
  ];

  window.IJR_PYTHON_HUB_CONFIG=Object.freeze({
    supabaseUrl:'https://rlfxnjbqxbozjdzkbwlz.supabase.co',
    supabasePublishableKey:'sb_publishable_rmVOQ3Orx49KpW_4uMqYew_c2HpcA87',
    institutionalEmailDomain:'ijr.edu.co',
    sessionStorageKey,
    pendingIdentityKey,
    legacyStorageKeys:Object.freeze(legacyStorageKeys),
    rpc:Object.freeze({
      account:'python_hub_student_account_v1',
      resume:'python_hub_resume_v1',
      submit:'python_hub_submit_v1'
    })
  });

  // Theory/workshop V11/V19 still call localStorage.getItem(config.sessionStorageKey).
  // Route only this one key to sessionStorage so student identity never persists across browser sessions.
  try{
    const nativeGetItem=Storage.prototype.getItem;
    if(!Storage.prototype.__ijrPythonHubV26SessionBridge){
      Object.defineProperty(Storage.prototype,'__ijrPythonHubV26SessionBridge',{value:true,configurable:false});
      Storage.prototype.getItem=function(key){
        if(this===window.localStorage && key===sessionStorageKey){
          return nativeGetItem.call(window.sessionStorage,key);
        }
        return nativeGetItem.call(this,key);
      };
    }
  }catch{}

  // Old reusable browser registrations are intentionally ignored by V26.
  for(const key of legacyStorageKeys){
    try{ localStorage.removeItem(key); }catch{}
  }
})();
