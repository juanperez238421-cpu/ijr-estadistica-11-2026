(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const requested = params.get('masterPreview') === '1';
  const TEACHER_SESSION_KEY = 'ijr-stat11-master-teacher-session-v1';
  const DASHBOARD_RPC = 'teacher_learning_activity_dashboard_v11';
  let authorized = false;

  function buildSnapshot(topics){
    const list = Array.isArray(topics) ? topics : [];
    return {
      registration: {
        group_code: 'MASTER',
        display_label: 'Teacher preview · no student record'
      },
      completed_topics: 0,
      total_topics: list.length,
      topics: list.map(topic => ({
        slug: topic.slug,
        status: 'available',
        percent: 0,
        correct_count: 0,
        total_count: Array.isArray(topic.exercises) ? topic.exercises.length : 0,
        items: (topic.exercises || []).map(exercise => ({
          key: exercise.key,
          correct: false,
          tries: 0,
          completed: false
        }))
      }))
    };
  }

  async function authorize(client){
    if(!requested || !client) return false;
    const token = sessionStorage.getItem(TEACHER_SESSION_KEY) || '';
    if(!token) return false;
    try{
      const {error} = await client.rpc(DASHBOARD_RPC,{p_teacher_token:token});
      if(error) return false;
      authorized = true;
      return true;
    }catch{
      return false;
    }
  }

  function decorate(url){
    if(!authorized) return url;
    const [base,hash=''] = String(url || '').split('#');
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}masterPreview=1${hash ? `#${hash}` : ''}`;
  }

  function mountBanner(){
    if(!authorized || document.getElementById('ijrMasterPreviewStrip')) return;
    const strip = document.createElement('div');
    strip.id = 'ijrMasterPreviewStrip';
    strip.setAttribute('role','status');
    strip.innerHTML = '<div><strong>MASTER · STUDENT VIEW PREVIEW</strong><span>Real student interface · all topics unlocked · no progress or grades are written.</span></div><a href="../maestro/">Back to master panel</a>';
    const style = document.createElement('style');
    style.textContent = '#ijrMasterPreviewStrip{position:sticky;top:0;z-index:10000;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:9px 18px;background:#111827;color:#fff;border-bottom:1px solid #374151;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}#ijrMasterPreviewStrip>div{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}#ijrMasterPreviewStrip strong{font-size:.75rem;letter-spacing:.06em}#ijrMasterPreviewStrip span{font-size:.73rem;color:#d1d5db}#ijrMasterPreviewStrip a{color:#fff;border:1px solid #4b5563;border-radius:7px;padding:5px 8px;text-decoration:none;font-size:.72rem;font-weight:750;white-space:nowrap}#ijrMasterPreviewStrip a:hover{background:#1f2937}@media(max-width:680px){#ijrMasterPreviewStrip{align-items:flex-start;padding:8px 10px}#ijrMasterPreviewStrip span{display:none}}';
    document.head.appendChild(style);
    document.body.prepend(strip);
  }

  function rewriteHubLinks(){
    if(!authorized) return;
    document.querySelectorAll('a[href="./"]').forEach(link => {
      link.href = '../maestro/';
      const text = String(link.textContent || '').trim().toLowerCase();
      if(text === 'all topics' || text === 'python hub' || text === 'return to hub') link.textContent = 'Back to master';
    });
  }

  window.IJR_MASTER_STUDENT_PREVIEW = Object.freeze({
    requested,
    authorize,
    buildSnapshot,
    decorate,
    mountBanner,
    rewriteHubLinks,
    get authorized(){ return authorized; }
  });
})();
