(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const requested = params.get('masterPreview') === '1';
  if(!requested || !window.supabase || !window.IJR_PYTHON_HUB_CONFIG) return;

  const config = window.IJR_PYTHON_HUB_CONFIG;
  const TEACHER_SESSION_KEY = 'ijr-stat11-master-teacher-session-v1';
  const DASHBOARD_RPC = 'teacher_learning_activity_dashboard_v11';
  const PREVIEW_PROGRESS_KEY = 'ijr-stat11-master-preview-progress-v1';
  const originalCreateClient = window.supabase.createClient.bind(window.supabase);
  const originalStudentSession = localStorage.getItem(config.sessionStorageKey);
  let authorized = false;
  let bannerInstalled = false;
  let observerInstalled = false;
  let authPromise = null;

  function readProgress(){
    try{return JSON.parse(sessionStorage.getItem(PREVIEW_PROGRESS_KEY)||'{}')||{};}catch{return {};}
  }

  function writeProgress(progress){
    try{sessionStorage.setItem(PREVIEW_PROGRESS_KEY,JSON.stringify(progress));}catch{}
  }

  function buildSnapshot(){
    const topics = window.IJR_PYTHON_HUB_TOPICS || [];
    const progress = readProgress();
    const topicSnapshots = topics.map(topic => {
      const completed = new Set(Array.isArray(progress[topic.slug]) ? progress[topic.slug] : []);
      const exercises = topic.exercises || [];
      const correctCount = exercises.filter(exercise => completed.has(exercise.key)).length;
      const totalCount = exercises.length;
      const percent = totalCount ? Math.round(100 * correctCount / totalCount) : 0;
      return {
        slug: topic.slug,
        status: totalCount && correctCount === totalCount ? 'completed' : 'available',
        percent,
        correct_count: correctCount,
        total_count: totalCount,
        items: exercises.map(exercise => ({
          key: exercise.key,
          correct: completed.has(exercise.key),
          tries: completed.has(exercise.key) ? 1 : 0,
          completed: completed.has(exercise.key)
        }))
      };
    });
    return {
      registration: {
        group_code: 'MASTER',
        display_label: 'Teacher preview · no student record'
      },
      completed_topics: topicSnapshots.filter(topic => topic.status === 'completed').length,
      total_topics: topicSnapshots.length,
      topics: topicSnapshots
    };
  }

  function markCompleted(topicSlug,itemKey){
    const progress = readProgress();
    const keys = new Set(Array.isArray(progress[topicSlug]) ? progress[topicSlug] : []);
    keys.add(itemKey);
    progress[topicSlug] = [...keys];
    writeProgress(progress);
  }

  async function authorize(realClient){
    if(authorized) return true;
    if(authPromise) return authPromise;
    authPromise = (async()=>{
      const token = sessionStorage.getItem(TEACHER_SESSION_KEY) || '';
      if(!token) return false;
      try{
        const {error} = await realClient.rpc(DASHBOARD_RPC,{p_teacher_token:token});
        if(error) return false;
        authorized = true;
        setTimeout(()=>{
          installBanner();
          rewritePreviewLinks();
          installObserver();
        },0);
        return true;
      }catch{
        return false;
      }
    })();
    return authPromise;
  }

  function decorateHref(href){
    const raw = String(href || '');
    if(!raw || raw.startsWith('http') || raw.startsWith('#') || raw.startsWith('mailto:')) return raw;
    const [baseAndQuery,hash=''] = raw.split('#');
    if(baseAndQuery === './' || baseAndQuery === '.') return '../maestro/';
    if(baseAndQuery.startsWith('../maestro/')) return raw;
    if(!/(?:theory|workshop)\.html/.test(baseAndQuery)) return raw;
    if(/[?&]masterPreview=1(?:&|$)/.test(baseAndQuery)) return raw;
    const separator = baseAndQuery.includes('?') ? '&' : '?';
    return `${baseAndQuery}${separator}masterPreview=1${hash ? `#${hash}` : ''}`;
  }

  function rewritePreviewLinks(root=document){
    if(!authorized) return;
    root.querySelectorAll?.('a[href]').forEach(link=>{
      const current = link.getAttribute('href');
      const next = decorateHref(current);
      if(next && next !== current) link.setAttribute('href',next);
      if(next === '../maestro/'){
        const text = String(link.textContent || '').trim().toLowerCase();
        if(['all topics','python hub','return to hub','course home'].includes(text)) link.textContent = 'Back to master';
      }
    });
  }

  function installObserver(){
    if(observerInstalled || !authorized) return;
    observerInstalled = true;
    const observer = new MutationObserver(mutations=>{
      for(const mutation of mutations){
        for(const node of mutation.addedNodes){
          if(node.nodeType === 1) rewritePreviewLinks(node);
        }
      }
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  function previewUrl(page,slug){
    return `${page}.html?topic=${encodeURIComponent(slug)}&masterPreview=1`;
  }

  function installBanner(){
    if(bannerInstalled || !authorized || !document.body) return;
    bannerInstalled = true;
    const topics = window.IJR_PYTHON_HUB_TOPICS || [];
    const currentSlug = new URLSearchParams(location.search).get('topic') || topics[0]?.slug || 'operations';
    const currentPage = /workshop\.html$/i.test(location.pathname) ? 'workshop' : 'theory';
    const strip = document.createElement('div');
    strip.id = 'ijrMasterPreviewStrip';
    strip.innerHTML = `<div class="ijr-preview-copy"><strong>MASTER · REAL STUDENT VIEW</strong><span>Exact student page · all topics unlocked · validation is simulated · no student progress, grades, answers, or registrations are changed.</span></div><div class="ijr-preview-actions"><select id="ijrPreviewTopic" aria-label="Preview topic">${topics.map(topic=>`<option value="${topic.slug}" ${topic.slug===currentSlug?'selected':''}>${String(topic.sequence).padStart(2,'0')} · ${topic.nav||topic.title}</option>`).join('')}</select><a class="${currentPage==='theory'?'active':''}" href="${previewUrl('theory',currentSlug)}">Theory</a><a class="${currentPage==='workshop'?'active':''}" href="${previewUrl('workshop',currentSlug)}">Workshop</a><button id="ijrResetPreview" type="button">Reset preview</button><a href="../maestro/">Back to master</a></div>`;
    const style = document.createElement('style');
    style.textContent = '#ijrMasterPreviewStrip{position:sticky;top:0;z-index:10000;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:9px 18px;background:#111827;color:#fff;border-bottom:1px solid #374151;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.ijr-preview-copy{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}#ijrMasterPreviewStrip strong{font-size:.75rem;letter-spacing:.06em}#ijrMasterPreviewStrip span{font-size:.73rem;color:#d1d5db}.ijr-preview-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.ijr-preview-actions a,.ijr-preview-actions button,.ijr-preview-actions select{appearance:none;color:#fff;background:transparent;border:1px solid #4b5563;border-radius:7px;padding:5px 8px;text-decoration:none;font-size:.72rem;font-weight:750;white-space:nowrap;cursor:pointer}.ijr-preview-actions select{background:#111827;max-width:230px}.ijr-preview-actions option{background:#fff;color:#111827}.ijr-preview-actions a:hover,.ijr-preview-actions button:hover,.ijr-preview-actions a.active{background:#1f2937;border-color:#6b7280}@media(max-width:980px){#ijrMasterPreviewStrip{align-items:flex-start;padding:8px 10px}.ijr-preview-copy span{display:none}.ijr-preview-actions select{max-width:170px}}@media(max-width:680px){.ijr-preview-actions button{display:none}.ijr-preview-actions select{max-width:145px}}';
    document.head.appendChild(style);
    document.body.prepend(strip);
    document.getElementById('ijrPreviewTopic')?.addEventListener('change',event=>{
      location.href = previewUrl(currentPage,event.target.value);
    });
    document.getElementById('ijrResetPreview')?.addEventListener('click',()=>{
      sessionStorage.removeItem(PREVIEW_PROGRESS_KEY);
      location.reload();
    });
  }

  window.supabase.createClient = function(...args){
    const realClient = originalCreateClient(...args);
    return new Proxy(realClient,{
      get(target,prop,receiver){
        if(prop !== 'rpc') return Reflect.get(target,prop,receiver);
        return async function(name,rpcArgs={}){
          if(name === config.rpc.resume){
            const ok = await authorize(realClient);
            if(!ok) return {data:null,error:new Error('Master preview requires an active authenticated master session.')};
            return {data:{snapshot:buildSnapshot()},error:null};
          }
          if(name === config.rpc.submit){
            const ok = await authorize(realClient);
            if(!ok) return {data:null,error:new Error('Master preview session is not authorized.')};
            markCompleted(String(rpcArgs.p_topic_slug||''),String(rpcArgs.p_item_key||''));
            return {data:{correct:true,preview:true,snapshot:buildSnapshot()},error:null};
          }
          return target.rpc.call(target,name,rpcArgs);
        };
      }
    });
  };

  document.addEventListener('DOMContentLoaded',()=>{
    localStorage.setItem(config.sessionStorageKey,JSON.stringify({
      registrationId:'master-preview',
      accessToken:'master-preview',
      groupCode:'MASTER',
      mode:'master-preview'
    }));
    setTimeout(()=>{
      if(originalStudentSession == null) localStorage.removeItem(config.sessionStorageKey);
      else localStorage.setItem(config.sessionStorageKey,originalStudentSession);
    },0);
  });

  window.addEventListener('beforeunload',()=>{
    if(originalStudentSession == null) localStorage.removeItem(config.sessionStorageKey);
    else localStorage.setItem(config.sessionStorageKey,originalStudentSession);
  });
})();
