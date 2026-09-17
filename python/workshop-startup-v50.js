(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const masterPreview = params.get('masterPreview') === '1';
  const cfg = window.IJR_PYTHON_HUB_CONFIG;
  if (!cfg || typeof window.fetch !== 'function') return;

  const nativeFetch = window.fetch.bind(window);
  let releaseTeamGate = null;
  let teamReady = masterPreview;
  const teamReadyPromise = masterPreview ? Promise.resolve() : new Promise(resolve => { releaseTeamGate = resolve; });

  if (!masterPreview) {
    window.addEventListener('ijr:stat11-workshop-team-started', () => {
      teamReady = true;
      releaseTeamGate?.();
    }, { once:true });
  }

  function urlText(input){
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.href;
    return input?.url || '';
  }

  function sanitizeHeaders(init){
    const headers = new Headers(init?.headers || {});
    const authorization = headers.get('Authorization') || '';
    if (authorization === `Bearer ${cfg.supabasePublishableKey}`) {
      headers.delete('Authorization');
    }
    return headers;
  }

  window.fetch = async function(input, init){
    const url = urlText(input);
    const isCourseRpc = url.startsWith(`${cfg.supabaseUrl}/rest/v1/rpc/`);

    if (isCourseRpc && !masterPreview && /\/rpc\/python_hub_resume_v1(?:$|\?)/.test(url) && !teamReady) {
      await teamReadyPromise;
    }

    if (!isCourseRpc) return nativeFetch(input, init);

    const nextInit = { ...(init || {}), headers:sanitizeHeaders(init || {}) };
    return nativeFetch(input, nextInit);
  };
})();
