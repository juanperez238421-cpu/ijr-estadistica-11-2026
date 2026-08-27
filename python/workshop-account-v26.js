(() => {
  'use strict';
  const config=window.IJR_PYTHON_HUB_CONFIG;
  if(!config||!window.supabase)return;
  const requested=new URLSearchParams(location.search).get('topic')||'operations';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function getSession(){try{return JSON.parse(sessionStorage.getItem(config.sessionStorageKey)||'null');}catch{return null;}}
  async function refreshCreditContext(){
    const saved=getSession();if(!saved?.registrationId||!saved?.accessToken)return;
    const client=window.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    const {data,error}=await client.rpc(config.rpc.resume,{p_registration_id:saved.registrationId,p_access_token:saved.accessToken});
    if(error||!data?.snapshot)return;
    const p=(data.snapshot.topics||[]).find(item=>item.slug===requested);
    if(!p)return;
    const credited=p.completion_source==='legacy_credit'&&Number(p.correct_count||0)<Number(p.total_count||0);
    const paint=()=>{
      const hero=document.getElementById('workshopHero');
      const percent=hero?.querySelector('.workshop-percent');
      if(percent){
        const label=percent.querySelector('span');const small=percent.querySelector('small');
        if(label)label.textContent='Current workshop validation';
        if(small)small.textContent=`${Number(p.correct_count||0)} / ${Number(p.total_count||0)} current stages validated`;
      }
      if(!credited)return;
      const panel=document.getElementById('completionPanel');
      if(panel){
        panel.classList.remove('hidden');
        panel.innerHTML=`<div><p class="eyebrow">VERIFIED PRIOR TOPIC CREDIT</p><h2>Previous Class 01 evidence is preserved.</h2><p>This topic is credited for course progression, but the current workshop is tracked independently: <strong>${Number(p.correct_count||0)} / ${Number(p.total_count||0)}</strong> current stages are server-validated. Complete any current stage you want to document here; prior credit never creates a false stage ✓.</p><p><small>Credit source: ${esc(p.credit_source||'verified historical evidence')}</small></p></div>`;
      }
    };
    paint();setTimeout(paint,150);setTimeout(paint,700);
  }
  document.addEventListener('DOMContentLoaded',()=>{refreshCreditContext().catch(()=>{});});
})();
