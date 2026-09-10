(() => {
  'use strict';

  const config = window.IJR_PYTHON_HUB_CONFIG;
  const topics = window.IJR_PYTHON_HUB_TOPICS || [];
  if (!config) return;

  const params = new URLSearchParams(location.search);
  const masterPreview = params.get('masterPreview') === '1';
  const TEACHER_SESSION_KEY = 'ijr-stat11-master-teacher-session-v1';
  const PREVIEW_PROGRESS_KEY = 'ijr-stat11-master-preview-progress-v2';
  const MASTER_VALIDATE_RPC = 'python_hub_master_preview_validate_v1';
  const MASTER_SNAPSHOT_RPC = 'python_hub_master_preview_snapshot_v1';
  const RETRYABLE_STATUS = new Set([408, 409, 429, 500, 502, 503, 504, 520, 522, 524]);
  const API_TIMEOUT_MS = 12000;
  const SUBMIT_TIMEOUT_MS = 18000;

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function teacherToken() {
    return sessionStorage.getItem(TEACHER_SESSION_KEY) || '';
  }

  function readPreviewProgress() {
    try { return JSON.parse(sessionStorage.getItem(PREVIEW_PROGRESS_KEY) || '{}') || {}; }
    catch { return {}; }
  }

  function writePreviewProgress(progress) {
    try { sessionStorage.setItem(PREVIEW_PROGRESS_KEY, JSON.stringify(progress)); }
    catch {}
  }

  function markPreviewComplete(topicSlug, itemKey) {
    const progress = readPreviewProgress();
    const completed = new Set(Array.isArray(progress[topicSlug]) ? progress[topicSlug] : []);
    completed.add(itemKey);
    progress[topicSlug] = [...completed];
    writePreviewProgress(progress);
  }

  function buildPreviewSnapshot() {
    const progress = readPreviewProgress();
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
        correct_count: correct,
        total_count: total,
        percent: total ? Math.round(100 * correct / total) : 0,
        items
      };
    });

    return {
      registration: {
        id: 'master-preview',
        mode: 'master-preview',
        group_code: 'MASTER',
        team_size: 1,
        display_label: 'Teacher preview · no student record',
        status: 'active'
      },
      members: [],
      topics: topicRows,
      current_topic: params.get('topic') || topics[0]?.slug || 'operations',
      completed_topics: topicRows.filter(topic => topic.status === 'completed').length,
      total_topics: topicRows.length
    };
  }

  function ensureMasterSessionStub() {
    if (!masterPreview || !teacherToken()) return;
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

  function scheduleMasterGate() {
    setTimeout(() => {
      if (masterPreview) location.replace('./?master=1');
    }, 100);
  }

  async function postRpc(name, args, { timeoutMs = API_TIMEOUT_MS, retries = 0 } = {}) {
    const url = `${config.supabaseUrl}/rest/v1/rpc/${encodeURIComponent(name)}`;
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            apikey: config.supabasePublishableKey,
            Authorization: `Bearer ${config.supabasePublishableKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(args || {}),
          signal: controller.signal,
          cache: 'no-store'
        });
        clearTimeout(timeout);

        const raw = await response.text();
        let payload = null;
        try { payload = raw ? JSON.parse(raw) : null; }
        catch { payload = raw || null; }

        if (response.ok) return { data: payload, error: null };

        const message = payload?.message || payload?.details || payload?.hint || `Backend request failed (${response.status}).`;
        const error = new Error(message);
        error.status = response.status;
        lastError = error;

        if (attempt >= retries || !RETRYABLE_STATUS.has(response.status)) break;
      } catch (error) {
        clearTimeout(timeout);
        lastError = error?.name === 'AbortError'
          ? new Error('Backend request timed out. Check the connection and try again.')
          : new Error(error?.message || 'Network request failed.');
        if (attempt >= retries) break;
      }

      const jitter = Math.floor(Math.random() * 180);
      await sleep(Math.min(1600, 300 * (2 ** attempt)) + jitter);
    }

    return { data: null, error: lastError || new Error('Backend request failed.') };
  }

  async function rpc(name, args = {}) {
    if (masterPreview) {
      const token = teacherToken();
      if (!token) {
        scheduleMasterGate();
        return { data: null, error: new Error('Master preview session is missing or expired.') };
      }

      ensureMasterSessionStub();

      if (name === config.rpc.resume) {
        return { data: { snapshot: buildPreviewSnapshot() }, error: null };
      }

      if (name === config.rpc.submit) {
        const result = await postRpc(MASTER_VALIDATE_RPC, {
          p_teacher_token: token,
          p_topic_slug: String(args.p_topic_slug || ''),
          p_item_key: String(args.p_item_key || ''),
          p_answer: String(args.p_answer ?? ''),
          p_code_snapshot: args.p_code_snapshot ?? null
        }, { timeoutMs: SUBMIT_TIMEOUT_MS, retries: 1 });

        if (result.error) {
          if (/invalid|expired|expirad|inv[aá]lid|teacher session|sesi[oó]n docente/i.test(result.error.message || '')) {
            try { sessionStorage.removeItem(TEACHER_SESSION_KEY); } catch {}
            scheduleMasterGate();
          }
          return result;
        }

        if (result.data?.correct) {
          markPreviewComplete(String(args.p_topic_slug || ''), String(args.p_item_key || ''));
        }

        return {
          data: {
            ...result.data,
            preview: true,
            snapshot: buildPreviewSnapshot()
          },
          error: null
        };
      }

      if (name === MASTER_SNAPSHOT_RPC) {
        return { data: { snapshot: buildPreviewSnapshot() }, error: null };
      }
    }

    const isResume = name === config.rpc.resume;
    return postRpc(name, args, {
      timeoutMs: isResume ? API_TIMEOUT_MS : SUBMIT_TIMEOUT_MS,
      retries: isResume ? 2 : 0
    });
  }

  window.supabase = Object.freeze({
    createClient() {
      return Object.freeze({ rpc });
    }
  });

  let pyodidePromise = null;
  let lazyPyodideProxy = null;

  async function resolvePyodideLoader() {
    if (typeof window.loadPyodide === 'function' && window.loadPyodide !== lazyPyodideProxy) {
      return window.loadPyodide;
    }
    if (pyodidePromise) return pyodidePromise;

    pyodidePromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-ijr-pyodide]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.loadPyodide), { once: true });
        existing.addEventListener('error', () => reject(new Error('Python runtime download failed.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js';
      script.async = true;
      script.dataset.ijrPyodide = '1';

      const timeout = setTimeout(() => {
        script.remove();
        pyodidePromise = null;
        reject(new Error('Python runtime download timed out. Press Run to retry.'));
      }, 20000);

      script.addEventListener('load', () => {
        clearTimeout(timeout);
        const realLoader = window.loadPyodide;
        if (typeof realLoader !== 'function' || realLoader === lazyPyodideProxy) {
          pyodidePromise = null;
          reject(new Error('Python runtime loaded incorrectly. Press Run to retry.'));
          return;
        }
        resolve(realLoader);
      }, { once: true });

      script.addEventListener('error', () => {
        clearTimeout(timeout);
        pyodidePromise = null;
        reject(new Error('Python runtime download failed. Press Run to retry.'));
      }, { once: true });

      document.head.appendChild(script);
    });

    return pyodidePromise;
  }

  lazyPyodideProxy = async function (options = {}) {
    const realLoader = await resolvePyodideLoader();
    return realLoader(options);
  };

  if (typeof window.loadPyodide !== 'function') window.loadPyodide = lazyPyodideProxy;
  window.IJR_loadPyodide = resolvePyodideLoader;

  if (masterPreview) {
    ensureMasterSessionStub();
    document.addEventListener('DOMContentLoaded', () => {
      const rewrite = root => {
        root.querySelectorAll?.('a[href]').forEach(link => {
          const href = link.getAttribute('href') || '';
          if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;
          if (href === './' || href === '.') {
            link.setAttribute('href', './?masterPreview=1');
            return;
          }
          if (!/(?:theory|workshop)\.html(?:\?|$)/.test(href) || /[?&]masterPreview=1(?:&|$)/.test(href)) return;
          link.setAttribute('href', `${href}${href.includes('?') ? '&' : '?'}masterPreview=1`);
        });
      };

      rewrite(document);
      const observer = new MutationObserver(records => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node.nodeType === 1) rewrite(node);
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  window.IJR_WORKSHOP_BOOTSTRAP_V33 = Object.freeze({
    transport: 'native-fetch',
    masterPreview,
    bootDependencies: 'same-origin-only',
    pyodide: 'lazy-load-on-run',
    resumeRetries: 2,
    submitRetries: 0
  });
})();