(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const requested = params.get('masterPreview') === '1';
  if (!requested || !window.supabase || !window.IJR_PYTHON_HUB_CONFIG) return;

  const config = window.IJR_PYTHON_HUB_CONFIG;
  const TEACHER_SESSION_KEY = 'ijr-stat11-master-teacher-session-v1';
  const PREVIEW_PROGRESS_KEY = 'ijr-stat11-master-preview-progress-v2';
  const MASTER_SNAPSHOT_RPC = 'python_hub_master_preview_snapshot_v1';
  const MASTER_VALIDATE_RPC = 'python_hub_master_preview_validate_v1';
  const originalCreateClient = window.supabase.createClient.bind(window.supabase);

  let authorized = false;
  let authPromise = null;
  let serverSnapshot = null;
  let bannerInstalled = false;
  let observerInstalled = false;
  let redirectScheduled = false;

  function teacherToken() {
    return sessionStorage.getItem(TEACHER_SESSION_KEY) || '';
  }

  function readProgress() {
    try { return JSON.parse(sessionStorage.getItem(PREVIEW_PROGRESS_KEY) || '{}') || {}; } catch { return {}; }
  }

  function writeProgress(progress) {
    try { sessionStorage.setItem(PREVIEW_PROGRESS_KEY, JSON.stringify(progress)); } catch {}
  }

  function ensureMasterHubSession() {
    if (!teacherToken()) return;
    try {
      localStorage.setItem(config.sessionStorageKey, JSON.stringify({
        registrationId:'master-preview',
        accessToken:'master-preview',
        fingerprint:'',
        groupCode:'MASTER',
        emails:[],
        mode:'master-preview',
        authProtected:false,
        savedAt:new Date().toISOString()
      }));
    } catch {}
  }

  function markCompleted(topicSlug, itemKey) {
    const progress = readProgress();
    const keys = new Set(Array.isArray(progress[topicSlug]) ? progress[topicSlug] : []);
    keys.add(itemKey);
    progress[topicSlug] = [...keys];
    writeProgress(progress);
  }

  function buildSnapshot() {
    const base = serverSnapshot || { registration:{ group_code:'MASTER', display_label:'Teacher preview · all topics unlocked' }, topics:[] };
    const progress = readProgress();
    const topics = (base.topics || []).map(topic => {
      const completed = new Set(Array.isArray(progress[topic.slug]) ? progress[topic.slug] : []);
      const items = (topic.items || []).map(item => ({
        ...item,
        correct:completed.has(item.key),
        completed:completed.has(item.key),
        tries:completed.has(item.key) ? Math.max(1, Number(item.tries || 0)) : Number(item.tries || 0)
      }));
      const total = Number(topic.total_count || items.length || 0);
      const correct = items.filter(item => item.correct).length;
      const percent = total ? Math.round(100 * correct / total) : 0;
      return {
        ...topic,
        status:total > 0 && correct >= total ? 'completed' : 'available',
        percent,
        correct_count:correct,
        total_count:total,
        items
      };
    });
    return {
      ...base,
      registration:{ group_code:'MASTER', display_label:'Teacher preview · no student record', ...(base.registration || {}) },
      completed_topics:topics.filter(topic => topic.status === 'completed').length,
      total_topics:topics.length,
      topics
    };
  }

  function scheduleMasterGate() {
    if (redirectScheduled) return;
    redirectScheduled = true;
    setTimeout(() => {
      if (!/\/(?:theory|workshop)\.html$/i.test(location.pathname)) return;
      location.replace('./?master=1');
    }, 50);
  }

  async function authorize(realClient) {
    if (authorized && serverSnapshot) return true;
    if (authPromise) return authPromise;

    authPromise = (async () => {
      const token = teacherToken();
      if (!token) {
        scheduleMasterGate();
        return false;
      }
      try {
        const { data, error } = await realClient.rpc(MASTER_SNAPSHOT_RPC, { p_teacher_token:token });
        if (error || !data?.snapshot?.topics?.length) {
          scheduleMasterGate();
          return false;
        }
        serverSnapshot = data.snapshot;
        authorized = true;
        ensureMasterHubSession();
        setTimeout(() => {
          installBanner();
          rewritePreviewLinks();
          installObserver();
        }, 0);
        return true;
      } catch {
        scheduleMasterGate();
        return false;
      }
    })();

    return authPromise;
  }

  function previewUrl(page, slug) {
    return `${page}.html?topic=${encodeURIComponent(slug)}&masterPreview=1`;
  }

  function decorateHref(href) {
    const raw = String(href || '');
    if (!raw || raw.startsWith('http') || raw.startsWith('#') || raw.startsWith('mailto:')) return raw;

    const hashIndex = raw.indexOf('#');
    const hash = hashIndex >= 0 ? raw.slice(hashIndex) : '';
    const baseAndQuery = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;

    if (baseAndQuery === './' || baseAndQuery === '.') return `./?masterPreview=1${hash}`;
    if (baseAndQuery.startsWith('../maestro/')) return raw;
    if (!/(?:theory|workshop)\.html(?:\?|$)/.test(baseAndQuery)) return raw;
    if (/[?&]masterPreview=1(?:&|$)/.test(baseAndQuery)) return raw;

    const separator = baseAndQuery.includes('?') ? '&' : '?';
    return `${baseAndQuery}${separator}masterPreview=1${hash}`;
  }

  function rewritePreviewLinks(root = document) {
    if (!authorized) return;
    root.querySelectorAll?.('a[href]').forEach(link => {
      const current = link.getAttribute('href');
      const next = decorateHref(current);
      if (next && next !== current) link.setAttribute('href', next);
    });
  }

  function installObserver() {
    if (observerInstalled || !authorized || !document.body) return;
    observerInstalled = true;
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            rewritePreviewLinks(node);
            if (node.matches?.('a[href]')) {
              const current = node.getAttribute('href');
              const next = decorateHref(current);
              if (next && next !== current) node.setAttribute('href', next);
            }
          }
        }
      }
    });
    observer.observe(document.body, { childList:true, subtree:true });
  }

  function installBanner() {
    if (bannerInstalled || !authorized || !document.body) return;
    bannerInstalled = true;

    const topics = window.IJR_PYTHON_HUB_TOPICS || [];
    const currentSlug = new URLSearchParams(location.search).get('topic') || topics[0]?.slug || 'operations';
    const currentPage = /workshop\.html$/i.test(location.pathname) ? 'workshop' : 'theory';
    const strip = document.createElement('div');
    strip.id = 'ijrMasterPreviewStrip';
    strip.innerHTML = `<div class="ijr-preview-copy"><strong>MASTER · REAL STUDENT VIEW</strong><span>All topics unlocked · real validation contract · no student writes.</span></div><div class="ijr-preview-actions"><select id="ijrPreviewTopic" aria-label="Preview topic">${topics.map(topic => `<option value="${topic.slug}" ${topic.slug === currentSlug ? 'selected' : ''}>${String(topic.sequence).padStart(2,'0')} · ${topic.nav || topic.title}</option>`).join('')}</select><a class="${currentPage === 'theory' ? 'active' : ''}" href="${previewUrl('theory', currentSlug)}">Theory</a><a class="${currentPage === 'workshop' ? 'active' : ''}" href="${previewUrl('workshop', currentSlug)}">Workshop</a><a href="./?masterPreview=1">All topics</a><button id="ijrResetPreview" type="button">Reset preview</button><a href="../maestro/">Back to master</a></div>`;

    const style = document.createElement('style');
    style.textContent = '#ijrMasterPreviewStrip{position:sticky;top:0;z-index:10000;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:9px 18px;background:#111827;color:#fff;border-bottom:1px solid #374151;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.ijr-preview-copy{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}#ijrMasterPreviewStrip strong{font-size:.75rem;letter-spacing:.06em}#ijrMasterPreviewStrip span{font-size:.73rem;color:#d1d5db}.ijr-preview-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.ijr-preview-actions a,.ijr-preview-actions button,.ijr-preview-actions select{appearance:none;color:#fff;background:transparent;border:1px solid #4b5563;border-radius:7px;padding:5px 8px;text-decoration:none;font-size:.72rem;font-weight:750;white-space:nowrap;cursor:pointer}.ijr-preview-actions select{background:#111827;max-width:250px}.ijr-preview-actions option{background:#fff;color:#111827}.ijr-preview-actions a:hover,.ijr-preview-actions button:hover,.ijr-preview-actions a.active{background:#1f2937;border-color:#6b7280}@media(max-width:980px){#ijrMasterPreviewStrip{align-items:flex-start;padding:8px 10px}.ijr-preview-copy span{display:none}.ijr-preview-actions select{max-width:175px}}@media(max-width:680px){.ijr-preview-actions button{display:none}.ijr-preview-actions select{max-width:145px}}';
    document.head.appendChild(style);
    document.body.prepend(strip);

    document.getElementById('ijrPreviewTopic')?.addEventListener('change', event => {
      location.href = previewUrl(currentPage, event.target.value);
    });
    document.getElementById('ijrResetPreview')?.addEventListener('click', () => {
      sessionStorage.removeItem(PREVIEW_PROGRESS_KEY);
      location.reload();
    });
  }

  ensureMasterHubSession();

  window.supabase.createClient = function (...args) {
    const realClient = originalCreateClient(...args);
    return new Proxy(realClient, {
      get(target, prop, receiver) {
        if (prop !== 'rpc') return Reflect.get(target, prop, receiver);
        return async function (name, rpcArgs = {}) {
          if (name === config.rpc.resume) {
            const ok = await authorize(target);
            if (!ok) return { data:null, error:new Error('Master preview requires a valid master session.') };
            return { data:{ snapshot:buildSnapshot() }, error:null };
          }

          if (name === config.rpc.submit) {
            const ok = await authorize(target);
            if (!ok) return { data:null, error:new Error('Master preview session is not authorized.') };

            const token = teacherToken();
            const { data, error } = await target.rpc(MASTER_VALIDATE_RPC, {
              p_teacher_token:token,
              p_topic_slug:String(rpcArgs.p_topic_slug || ''),
              p_item_key:String(rpcArgs.p_item_key || ''),
              p_answer:String(rpcArgs.p_answer ?? ''),
              p_code_snapshot:rpcArgs.p_code_snapshot ?? null
            });
            if (error) return { data:null, error };

            if (data?.correct) {
              markCompleted(String(rpcArgs.p_topic_slug || ''), String(rpcArgs.p_item_key || ''));
            }

            return {
              data:{ ...data, preview:true, snapshot:buildSnapshot() },
              error:null
            };
          }

          return target.rpc(name, rpcArgs);
        };
      }
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    const probeClient = originalCreateClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth:{ persistSession:false, autoRefreshToken:false, detectSessionInUrl:false }
    });
    authorize(probeClient).then(ok => {
      if (!ok) return;
      installBanner();
      rewritePreviewLinks();
      installObserver();
    });
  });
})();