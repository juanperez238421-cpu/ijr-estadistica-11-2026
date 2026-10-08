(() => {
  'use strict';

  function buildSnapshot(){
    const params=new URLSearchParams(location.search);
    const requested=params.get('topic')||'operations';
    const topics=window.IJR_PYTHON_HUB_TOPICS||Object.values(window.IJR_PYTHON_HUB_TOPIC_MAP||{});
    const percent=requested==='operations'?50:0;
    return {
      registration:{id:'ghost-qa',group_code:'11A',display_label:'qa.student11@ijr.edu.co'},
      topics:topics.map(t=>({
        slug:t.slug,status:'available',
        percent:t.slug===requested?percent:0,
        correct_count:t.slug===requested?Math.round((t.exercises?.length||12)*percent/100):0,
        total_count:t.exercises?.length||12
      }))
    };
  }

  window.supabase={
    createClient(){
      return {
        async rpc(){
          return {data:{snapshot:buildSnapshot()},error:null};
        }
      };
    }
  };

  const cfg=window.IJR_PYTHON_HUB_CONFIG;
  if(cfg){
    try{
      localStorage.setItem(cfg.sessionStorageKey,JSON.stringify({
        registrationId:'ghost-qa',
        accessToken:'ghost-qa',
        groupCode:'11A',
        emails:['qa.student11@ijr.edu.co'],
        mode:'ghost-capture',
        savedAt:new Date().toISOString()
      }));
    }catch{}
  }

  document.documentElement.dataset.ghostCapture='true';
})();