(()=>{
'use strict';
const cfg=globalThis.IJR_SPECIALIZED_HUB_CONFIG;
if(!cfg?.supabaseUrl||!cfg?.gatewayFunction)return;
const originalFetch=globalThis.fetch.bind(globalThis);
const gatewaySuffix=`/functions/v1/${cfg.gatewayFunction}`;
const practicalSuffix='/functions/v1/seminar-diagnostic-practical';
globalThis.fetch=(input,init)=>{
  try{
    const url=typeof input==='string'?input:input?.url;
    if(url?.endsWith(gatewaySuffix)&&typeof init?.body==='string'){
      const body=JSON.parse(init.body);
      if(body?.action==='diagnostic-practical'){
        const nextBody={...body};delete nextBody.action;
        const target=`${cfg.supabaseUrl}${practicalSuffix}`;
        return originalFetch(target,{...init,body:JSON.stringify(nextBody)});
      }
    }
  }catch{}
  return originalFetch(input,init);
};
})();
