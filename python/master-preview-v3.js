(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const requested = params.get('masterPreview') === '1';
  if (!requested || !window.supabase || !window.IJR_PYTHON_HUB_CONFIG) return;

  const config = window.IJR_PYTHON_HUB_CONFIG;
  const topics = window.IJR_PYTHON_HUB_TOPICS || [];
  const TEACHER_SESSION_KEY = 'ijr-stat11-master-teacher-session-v1';
  const PREVIEW_PROGRESS_KEY = 'ijr-stat11-master-preview-progress-v2';
  const MASTER_SNAPSHOT_RPC = 'python_hub_master_preview_snapshot_v1';
  const MASTER_VALIDATE_RPC = 'python_hub_master_preview_validate_v1';
  const originalCreateClient = window.supabase.createClient.bind(window.supabase);

  let bannerInstalled = false;
  let observerInstalled = false;
  let redirectScheduled = false;
  let verificationPromise = null;

  function teacherToken() {
    return sessionStorage.getItem(TEACHER_SESSION_KEY) || '';
  }

  function readProgress() {
    try { return JSON.parse(sessionStorage.getItem(PREVIEW_PROGRESS_KEY) || '{}') || {}; }
    catch { return {}; }
  }

  function writeProgress(progress) {
    try { sessionStorage.setItem(PREVIEW_PROGRESS_KEY, JSON.stringify(progress)); }
    catch {}
  }

  function ensureMasterHubSession() {
    if (!teacherToken()) return;
    try {
      localStorage.setItem(config.sessionStorageKey, JSON.stringify({
        registrationId: 'master-preview',
        accessToken: 'master-preview',
        fingerprint: '',
        groupCode: 'MASTER',
        emails: [],
        mode: 'master-preview',
        authProtected: false,
        savedAt: new Date().toISOString()
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

  // The master preview does not need to wait for a network snapshot to render.
  // Course structure and exercise keys are already loaded from the same public
  // curriculum files used by the student Hub. Only answer validation remains
  // server-authoritative through the protected teacher RPC.
  function buildLocalSnapshot() {
    const progress = readProgress();
    const topicRows = topics.map(topic => {
      const completed = new Set(Array.isArray(progress[topic.slug]) ? progress[topic.slug] : []);
      const exercises = Array.isArray(topic.exercises) ? topic.exercises : [];
      const items = exercises.map(exercise => ({
        key: exercise.key,
        correct: completed.has(exercise.key),
        completed: completed.has(exercise.key),
        tries: completed.has(exercise.key) ? 1 : 0
      }));
      const correct = items.filter(item => item.correct).length;
      const total = items.length;
      return {
        slug: topic.slug,
        status: total > 0 && correct >= total ? 'completed' : 'available',
        percent: total ? Math.round(100 * correct / total) : 0,
        correct_count: correct,
        total_count: total,
        items
      };
    });

    return {
      registration: {
        group_code: 'MASTER',
        display_label: 'Teacher preview · no student record'
      },
      completed_topics: topicRows.filter(topic => topic.status === 'completed').length,
      total_topics: topicRows.length,
      topics: topicRows
    };
  }

  function timeoutPromise(ms, label) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out. The preview remains available; retry validation when the connection recovers.`)), ms);
    });
  }

  function looksLikeAuthFailure(error) {
    return /invalid|expired|expirad|inv[aá]lid|teacher session|sesi[oó]n docente/i.test(String(error?.message || error || ''));
  }

  function scheduleMasterGate() {
    if (redirectScheduled) return;
    redirectScheduled = true;
    setTimeout(() => {
      if (!/(?:theory|workshop)\.html$/i.test(location.pathname)) return;
      location.replace('./?master=1');
    }, 150);
  }

  async function verifyTeacher(realClient) {
    if (verificationPromise) return verificationPromise;
    verificationPromise = (async () => {
      const token = teacherToken();
      if (!token) {
        scheduleMasterGate();
        return false;
      }
      try {
        const request = realClient.rpc(MASTER_SNAPSHOT_RPC, { p_teacher_token: token });
        const { data, error } = await Promise.race([request, timeoutPromise(10000, 'Master verification')]);
        if (error) throw new Error(error.message || 'Master verification failed.');
        if (!data?.snapshot?.topics?.length) throw new Error('Master preview snapshot is unavailable.');
        return true;
      } catch (error) {
        if (looksLikeAuthFailure(error)) {
          try { sessionStorage.removeItem(TEACHER_SESSION_KEY); } catch {}
          scheduleMasterGate();
        }
        return false;
      } finally {
        verificationPromise = null;
      }
    })();
    return verificationPromise;
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
    root.querySelectorAll?.('a[href]').forEach(link => {
      const current = link.getAttribute('href');
      const next = decorateHref(current);
      if (next && next !== current) link.setAttribute('href', next);
    });
  }

  function installObserver() {
    if (observerInstalled || !document.body) return;
    observerInstalled = true;
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;
          rewritePreviewLinks(node);
          if (node.matches?.('a[href]')) {
            const current = node.getAttribute('href');
            const next = decorateHref(current);
            if (next && next !== current) node.setAttribute('href', next);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function installBanner() {
    if (bannerInstalled || !document.body || !teacherToken()) return;
    bannerInstalled = true;

    const currentSlug = new URLSearchParams(location.search).get('topic') || topics[0]?.slug || 'operations';
    const currentPage = /workshop\.html$/i.test(location.pathname) ? 'workshop' : 'theory';
    const strip = document.createElement('div');
    strip.id = 'ijrMasterPreviewStrip';
    strip.innerHTML = `<div class="ijr-preview-copy"><strong>MASTER · REAL STUDENT VIEW</strong><span>All topics unlocked · local instant preview · server-authoritative validation · no student writes.</span></div><div class="ijr-preview-actions"><select id="ijrPreviewTopic" aria-label="Preview topic">${topics.map(topic => `<option value="${topic.slug}" ${topic.slug === currentSlug ? 'selected' : ''}>${String(topic.sequence).padStart(2, '0')} · ${String(topic.nav || topic.title)}</option>`).join('')}</select><a class="${currentPage === 'theory' ? 'active' : ''}" href="${previewUrl('theory', currentSlug)}">Theory</a><a class="${currentPage === 'workshop' ? 'active' : ''}" href="${previewUrl('workshop', currentSlug)}">Workshop</a><a href="./?masterPreview=1">All topics</a><button id="ijrResetPreview" type="button">Reset preview</button><a href="../maestro/">Back to master</a></div>`;

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
      get(target, prop) {
        if (prop === 'rpc') {
          return async function (name, rpcArgs = {}) {
            if (name === config.rpc.resume) {
              if (!teacherToken()) {
                scheduleMasterGate();
                return { data: null, error: new Error('Master preview requires an active teacher session.') };
              }

              ensureMasterHubSession();
              // Critical fix: never block page rendering on the verification RPC.
              // Verification runs in the background while the read-only master
              // snapshot is built locally from the loaded curriculum.
              verifyTeacher(target).catch(() => {});
              return { data: { snapshot: buildLocalSnapshot() }, error: null };
            }

            if (name === config.rpc.submit) {
              const token = teacherToken();
              if (!token) {
                scheduleMasterGate();
                return { data: null, error: new Error('Master preview session is not available.') };
              }

              try {
                const request = target.rpc(MASTER_VALIDATE_RPC, {
                  p_teacher_token: token,
                  p_topic_slug: String(rpcArgs.p_topic_slug || ''),
                  p_item_key: String(rpcArgs.p_item_key || ''),
                  p_answer: String(rpcArgs.p_answer ?? ''),
                  p_code_snapshot: rpcArgs.p_code_snapshot ?? null
                });
                const { data, error } = await Promise.race([request, timeoutPromise(15000, 'Workshop validation')]);
                if (error) throw new Error(error.message || 'Workshop validation failed.');
                if (data?.correct) markCompleted(String(rpcArgs.p_topic_slug || ''), String(rpcArgs.p_item_key || ''));
                return { data: { ...data, preview: true, snapshot: buildLocalSnapshot() }, error: null };
              } catch (error) {
                if (looksLikeAuthFailure(error)) {
                  try { sessionStorage.removeItem(TEACHER_SESSION_KEY); } catch {}
                  scheduleMasterGate();
                }
                return { data: null, error };
              }
            }

            return target.rpc(name, rpcArgs);
          };
        }

        const value = Reflect.get(target, prop, target);
        return typeof value === 'function' ? value.bind(target) : value;
      }
    });
  };

  window.IJR_MASTER_PREVIEW_V3 = Object.freeze({
    active: true,
    topicCount: topics.length,
    snapshotMode: 'local-instant',
    validationMode: 'server-authoritative'
  });

  document.addEventListener('DOMContentLoaded', () => {
    if (!teacherToken()) {
      scheduleMasterGate();
      return;
    }

    ensureMasterHubSession();
    installBanner();
    rewritePreviewLinks();
    installObserver();

    const probeClient = originalCreateClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    verifyTeacher(probeClient).catch(() => {});
  });
})();
