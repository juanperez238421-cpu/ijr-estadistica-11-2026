(() => {
  'use strict';

  const config = window.IJR_PYTHON_HUB_CONFIG;
  if (!config) return;

  const SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
  const SDK_LOAD_TIMEOUT_MS = 2500;
  const DEFAULT_RPC_TIMEOUT_MS = 6500;
  let sdkPromise = null;
  let clientPromise = null;
  let mode = 'official-esm-idle';
  let lastError = '';

  function timeoutError(message, ms) {
    return new Promise((_, reject) => {
      window.setTimeout(() => {
        const error = new Error(message);
        error.name = 'TimeoutError';
        error.timeoutMs = ms;
        reject(error);
      }, ms);
    });
  }

  function normalizeError(error, fallback) {
    if (error instanceof Error) return error;
    const normalized = new Error(error?.message || fallback || 'Supabase request failed.');
    if (error?.code) normalized.code = error.code;
    if (error?.status) normalized.status = error.status;
    if (error?.details) normalized.details = error.details;
    return normalized;
  }

  async function loadSdk() {
    if (sdkPromise) return sdkPromise;
    mode = 'official-esm-loading';
    sdkPromise = Promise.race([
      import(SDK_URL),
      timeoutError('Official Supabase client download timed out.', SDK_LOAD_TIMEOUT_MS)
    ]).then(module => {
      if (!module || typeof module.createClient !== 'function') {
        throw new Error('Official Supabase client loaded without createClient().');
      }
      mode = 'official-esm-ready';
      return module;
    }).catch(error => {
      mode = 'official-esm-unavailable';
      lastError = error?.message || 'Official Supabase client unavailable.';
      sdkPromise = null;
      throw error;
    });
    return sdkPromise;
  }

  async function getClient() {
    if (clientPromise) return clientPromise;
    clientPromise = loadSdk().then(module => module.createClient(
      config.supabaseUrl,
      config.supabasePublishableKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            'x-ijr-client': 'statistics11-workshop-v39'
          }
        }
      }
    )).catch(error => {
      clientPromise = null;
      throw error;
    });
    return clientPromise;
  }

  async function rpc(name, args = {}, options = {}) {
    const timeoutMs = Number(options.timeoutMs) || DEFAULT_RPC_TIMEOUT_MS;
    try {
      const client = await getClient();
      mode = 'official-esm-rpc';
      const result = await Promise.race([
        client.rpc(name, args),
        timeoutError(`Supabase RPC timed out after ${timeoutMs} ms.`, timeoutMs)
      ]);

      if (!result || typeof result !== 'object') {
        const error = new Error('Supabase returned an invalid RPC response.');
        lastError = error.message;
        return { data: null, error, transportUnavailable: false, transport: mode };
      }

      if (result.error) {
        const error = normalizeError(result.error, 'Supabase RPC failed.');
        lastError = error.message;
        return { data: null, error, transportUnavailable: false, transport: mode };
      }

      lastError = '';
      mode = 'official-esm-ok';
      return { data: result.data, error: null, transportUnavailable: false, transport: mode };
    } catch (rawError) {
      const error = normalizeError(rawError, 'Official Supabase transport failed.');
      const unavailable = error.name === 'TimeoutError' || /download|import|module|network|fetch|client unavailable/i.test(error.message || '');
      mode = unavailable ? 'official-esm-fallback' : 'official-esm-error';
      lastError = error.message;
      return {
        data: null,
        error,
        transportUnavailable: unavailable,
        transport: mode
      };
    }
  }

  window.IJR_STUDENT_SUPABASE_V39 = Object.freeze({
    rpc,
    diagnostics() {
      return Object.freeze({
        version: 'v39',
        mode,
        sdkUrl: SDK_URL,
        sdkLoadTimeoutMs: SDK_LOAD_TIMEOUT_MS,
        defaultRpcTimeoutMs: DEFAULT_RPC_TIMEOUT_MS,
        lastError
      });
    }
  });
})();
