(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const masterPreview = params.get('masterPreview') === '1';
  const official = window.IJR_SUPABASE_OFFICIAL_V38;
  const RPC_TIMEOUT_MS = 10000;

  // Teacher preview deliberately keeps the local master adapter installed by
  // workshop-bootstrap-v33.js. Normal student pages must use the official
  // Supabase browser client so Auth/Data API headers follow the supported SDK.
  if (masterPreview) {
    window.IJR_STUDENT_TRANSPORT_V38 = Object.freeze({
      version: 'v38',
      ready: true,
      mode: 'master-preview-adapter',
      rpcTimeoutMs: null
    });
    return;
  }

  if (!official || typeof official.createClient !== 'function') {
    window.IJR_STUDENT_TRANSPORT_V38 = Object.freeze({
      version: 'v38',
      ready: false,
      mode: 'fallback-bootstrap-adapter',
      error: 'Official Supabase browser client was not captured.'
    });
    return;
  }

  function timeoutResult(name) {
    return new Promise(resolve => {
      window.setTimeout(() => resolve({
        data: null,
        error: { message: `Backend request timed out while loading ${String(name || 'progress')}.` }
      }), RPC_TIMEOUT_MS);
    });
  }

  const transport = Object.freeze({
    createClient(...args) {
      const client = official.createClient(...args);
      const originalRpc = client.rpc.bind(client);

      return new Proxy(client, {
        get(target, prop, receiver) {
          if (prop === 'rpc') {
            return (name, rpcArgs = {}, options) => Promise.race([
              originalRpc(name, rpcArgs, options),
              timeoutResult(name)
            ]);
          }
          const value = Reflect.get(target, prop, receiver);
          return typeof value === 'function' ? value.bind(target) : value;
        }
      });
    }
  });

  window.supabase = transport;
  window.IJR_STUDENT_TRANSPORT_V38 = Object.freeze({
    version: 'v38',
    ready: true,
    mode: 'official-supabase-js',
    rpcTimeoutMs: RPC_TIMEOUT_MS,
    masterPreview: false
  });
})();
