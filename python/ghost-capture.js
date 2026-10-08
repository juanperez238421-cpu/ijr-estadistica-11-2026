(() => {
  'use strict';
  const cfg = window.IJR_PYTHON_HUB_CONFIG;
  const topics = window.IJR_PYTHON_HUB_TOPICS || [];
  if (!cfg || !topics.length) return;
  const requested = new URLSearchParams(location.search).get('topic') || 'operations';
  const percent = requested === 'operations' ? 50 : 0;
  const snapshot = {
    registration:{id:'ghost-qa',group_code:'11A',display_label:'qa.student11@ijr.edu.co'},
    topics:topics.map(t=>({
      slug:t.slug,status:'available',
      percent:t.slug===requested?percent:0,
      correct_count:t.slug===requested?Math.round((t.exercises?.length||12)*percent/100):0,
      total_count:t.exercises?.length||12
    }))
  };
  localStorage.setItem(cfg.sessionStorageKey,JSON.stringify({
    registrationId:'ghost-qa',accessToken:'ghost-qa',groupCode:'11A',
    emails:['qa.student11@ijr.edu.co'],mode:'ghost-capture',savedAt:new Date().toISOString()
  }));
  window.supabase={createClient(){return{async rpc(){return{data:{snapshot},error:null}}}}};
  document.documentElement.dataset.ghostCapture='true';
})();