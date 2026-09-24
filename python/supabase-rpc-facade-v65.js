(() => {
  'use strict';

  const config = window.IJR_PYTHON_HUB_CONFIG;
  if (!config || typeof window.fetch !== 'function') return;

  const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504, 520, 522, 524]);
  const DEFAULT_TIMEOUT_MS = 6500;
  const MUTATION_TIMEOUT_MS = 9000;
  const sleep = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  function normalizeError(rawError, fallback) {
    if (rawError instanceof Error) return rawError;
    const error = new Error(rawError?.message || fallback || 'Backend request failed.');
    if (rawError?.status) error.status = rawError.status;
    if (rawError?.transient) error.transient = true;
    return error;
  }

  async function postRpc(name, args = {}, { timeoutMs = DEFAULT_TIMEOUT_MS, retries = 1 } = {}) {
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/${encodeURIComponent(name)}`, {
          method: 'POST',
          headers: {
            apikey: config.supabasePublishableKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'x-ijr-client': 'statistics11-rpc-facade-v65'
          },
          body: JSON.stringify(args || {}),
          signal: controller.signal,
          cache: 'no-store'
        });

        const raw = await response.text();
        let payload = null;
        try { payload = raw ? JSON.parse(raw) : null; }
        catch { payload = raw || null; }

        if (response.ok) {
          return { data: payload, error: null };
        }

        const message = payload?.message || payload?.details || payload?.hint || `Backend request failed (${response.status}).`;
        const error = new Error(message);
        error.status = response.status;
        error.transient = RETRYABLE_STATUS.has(response.status);
        lastError = error;

        if (!error.transient || attempt >= retries) break;
      } catch (rawError) {
        const error = normalizeError(rawError, 'Network request failed.');
        error.transient = true;
        if (rawError?.name === 'AbortError') {
          error.message = 'Backend request timed out. Retry without closing this page.';
        }
        lastError = error;
        if (attempt >= retries) break;
      } finally {
        window.clearTimeout(timer);
      }

      await sleep(350);
    }

    return { data: null, error: lastError || new Error('Backend request failed.') };
  }

  const facade = Object.freeze({
    createClient() {
      return Object.freeze({
        rpc(name, args = {}) {
          const isResume = name === config.rpc?.resume;
          return postRpc(name, args, {
            timeoutMs: isResume ? DEFAULT_TIMEOUT_MS : MUTATION_TIMEOUT_MS,
            retries: 1
          });
        }
      });
    }
  });

  // Install the local HTTPS transport before optional teacher/QA/progress modules.
  // The async official SDK may later replace this object, but classroom access
  // never waits for that CDN download.
  window.supabase = facade;
  window.IJR_SUPABASE_RPC_FACADE_V65 = Object.freeze({
    version: 'v65',
    timeoutMs: DEFAULT_TIMEOUT_MS,
    mutationTimeoutMs: MUTATION_TIMEOUT_MS,
    retries: 1
  });
})();