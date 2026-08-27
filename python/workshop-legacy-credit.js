(() => {
  'use strict';

  const config=window.IJR_PYTHON_HUB_CONFIG;
  const topic=new URLSearchParams(location.search).get('topic')||'operations';
  if(!config||!window.supabase||topic!=='types') return;

  const readSession=()=>{try{return JSON.parse(localStorage.getItem(config.sessionStorageKey)||'null');}catch{return null;}};
  const client=window.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});

  async function init(){
    const session=readSession();
    if(!session?.registrationId||!session?.accessToken) return;
    try{
      const {data,error}=await client.rpc(config.rpc.resume,{p_registration_id:session.registrationId,p_access_token:session.accessToken});
      if(error) return;
      const progress=data?.snapshot?.topics?.find(item=>item.slug==='types');
      if(progress?.completion_source!=='legacy_credit') return;

      const banner=document.getElementById('legacyCreditBanner');
      if(!banner) return;
      banner.innerHTML=`<strong>✓ Variable Types already credited</strong><span>Your verified Class 01 evidence from last week has been accepted for this topic. Arrays is unlocked. You may still use the six stages below as optional review; completing them is not required again.</span><small>Credit source: verified roster match · ${progress.credit_source||'legacy Class 01 evidence'}</small>`;
      banner.classList.remove('hidden');
    }catch{}
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
