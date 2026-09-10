(() => {
  'use strict';

  const config = window.IJR_PYTHON_HUB_CONFIG;
  const officialTransport = window.IJR_STUDENT_SUPABASE_V39;
  if (!config || !officialTransport) return;

  const params = new URLSearchParams(location.search);
  if (params.get('masterPreview') === '1') return;

  const previousSupabase = window.supabase;
  const RESUME_TIMEOUT_MS = 4500;
  const SUBMIT_TIMEOUT_MS = 9000;

  async function boundedFetchRpc(name, args, timeoutMs) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/${encodeURIComponent(name)}`, {
        method: 'POST',
        headers: {
          apikey: config.supabasePublishableKey,
          Authorization: `Bearer ${config.supabasePublishableKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-ijr-client': 'statistics11-workshop-v39-fallback'
        },
        body: JSON.stringify(args || {}),
        signal: controller.signal,
        cache: 'no-store'
      });
      const raw = await response.text();
      let payload = null;
      try { payload = raw ? JSON.parse(raw) : null; }
      catch { payload = raw || null; }

      if (response.ok) return { data: payload, error: null };
      const error = new Error(payload?.message || payload?.details || payload?.hint || `Backend request failed (${response.status}).`);
      error.status = response.status;
      return { data: null, error };
    } catch (rawError) {
      const error = rawError?.name === 'AbortError'
        ? new Error('Backend request timed out. Check the connection and retry.')
        : new Error(rawError?.message || 'Network request failed.');
      return { data: null, error };
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function rpc(name, args = {}) {
    const isResume = name === config.rpc.resume;
    const timeoutMs = isResume ? RESUME_TIMEOUT_MS : SUBMIT_TIMEOUT_MS;
    const result = await officialTransport.rpc(name, args, { timeoutMs });

    if (!result.transportUnavailable) {
      return { data: result.data, error: result.error };
    }

    console.warn('[IJR V39] Official Supabase transport unavailable; using one bounded REST fallback.', result.error?.message || '');
    const fallback = await boundedFetchRpc(name, args, timeoutMs);
    if (fallback.error && previousSupabase?.createClient) {
      console.warn('[IJR V39] Bounded fallback failed. Legacy transport is intentionally not retried to avoid a blank loading shell.');
    }
    return fallback;
  }

  const facade = Object.freeze({
    createClient() {
      return Object.freeze({ rpc });
    }
  });

  window.supabase = facade;
  window.IJR_STUDENT_SUPABASE_BRIDGE_V39 = Object.freeze({
    version: 'v39',
    primary: 'official-supabase-js-esm',
    fallback: 'bounded-rest-single-attempt',
    resumeTimeoutMs: RESUME_TIMEOUT_MS,
    submitTimeoutMs: SUBMIT_TIMEOUT_MS,
    legacyFacadePresent: Boolean(previousSupabase?.createClient)
  });
})();
