(() => {
  'use strict';

  const sessionStorageKey = 'ijr-stat11-python-hub-session-v2';
  const progressCodeStorageKey = 'ijr-stat11-python-hub-progress-code-v3';

  window.IJR_PYTHON_HUB_CONFIG = Object.freeze({
    supabaseUrl: 'https://rlfxnjbqxbozjdzkbwlz.supabase.co',
    supabasePublishableKey: 'sb_publishable_rmVOQ3Orx49KpW_4uMqYew_c2HpcA87',
    institutionalEmailDomain: 'ijr.edu.co',
    sessionStorageKey,
    progressCodeStorageKey,
    rpc: Object.freeze({
      register: 'python_hub_register_v2',
      resume: 'python_hub_resume_v1',
      submit: 'python_hub_submit_v1'
    })
  });

  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = 'resume-code.css?v=20260826-hub-v3';
  document.head.appendChild(style);

  function normalizeCode(value) {
    return String(value || '').trim().toUpperCase();
  }

  function saveProgressCode(registrationId, code) {
    const normalized = normalizeCode(code);
    if (!registrationId || !normalized) return;
    localStorage.setItem(progressCodeStorageKey, JSON.stringify({ registrationId, code: normalized }));
  }

  function readProgressCode() {
    try {
      const value = JSON.parse(localStorage.getItem(progressCodeStorageKey) || 'null');
      return value && value.registrationId && value.code ? value : null;
    } catch {
      return null;
    }
  }

  function showProgressCode(registrationId, code) {
    const normalized = normalizeCode(code);
    if (!registrationId || !normalized) return;
    saveProgressCode(registrationId, normalized);
    const notice = document.getElementById('resumeCodeNotice');
    const output = document.getElementById('resumeCodeValue');
    if (notice && output) {
      output.textContent = normalized;
      notice.classList.remove('hidden');
    }
  }

  function restoreVisibleCode() {
    let active = null;
    try { active = JSON.parse(localStorage.getItem(sessionStorageKey) || 'null'); } catch { active = null; }
    const saved = readProgressCode();
    if (active?.registrationId && saved?.registrationId === active.registrationId) {
      showProgressCode(saved.registrationId, saved.code);
    }
  }

  if (window.supabase?.createClient) {
    const originalCreateClient = window.supabase.createClient.bind(window.supabase);
    window.supabase.createClient = (...factoryArgs) => {
      const client = originalCreateClient(...factoryArgs);
      const originalRpc = client.rpc.bind(client);
      client.rpc = (functionName, rpcArgs = {}, options) => {
        const args = { ...rpcArgs };
        if (functionName === 'python_hub_register_v2') {
          args.p_progress_code = normalizeCode(document.getElementById('progressCode')?.value) || null;
        }
        const request = originalRpc(functionName, args, options);
        if (functionName !== 'python_hub_register_v2') return request;
        return Promise.resolve(request).then(result => {
          if (!result?.error && result?.data?.new_registration && result.data.progress_code) {
            showProgressCode(result.data.registration_id, result.data.progress_code);
          }
          return result;
        });
      };
      return client;
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    restoreVisibleCode();
    const input = document.getElementById('progressCode');
    input?.addEventListener('input', () => { input.value = normalizeCode(input.value).slice(0, 8); });
    document.getElementById('changeRegistrationButton')?.addEventListener('click', () => {
      localStorage.removeItem(progressCodeStorageKey);
      document.getElementById('resumeCodeNotice')?.classList.add('hidden');
      if (input) input.value = '';
    });
  });
})();
