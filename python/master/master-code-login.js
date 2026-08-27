(() => {
  'use strict';

  const cfg = window.IJR_PYTHON_MASTER_CONFIG;
  if (!cfg || !window.supabase || !cfg.masterCodeUrl) return;

  const form = document.getElementById('masterCodeForm');
  const input = document.getElementById('masterCode');
  const button = document.getElementById('masterCodeButton');
  const status = document.getElementById('masterCodeStatus');
  if (!form || !input || !button || !status) return;

  const setStatus = (text, kind = '') => {
    status.textContent = text || '';
    status.className = `status ${kind}`.trim();
  };

  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: cfg.authStorageKey,
    },
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const code = input.value.trim();
    if (!code) {
      setStatus('Enter the private master code.', 'error');
      return;
    }

    button.disabled = true;
    setStatus('Verifying master code securely…');

    try {
      const response = await fetch(cfg.masterCodeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': cfg.supabasePublishableKey,
        },
        body: JSON.stringify({ code }),
      });

      let payload = {};
      try { payload = await response.json(); } catch {}

      if (!response.ok) {
        if (payload?.error === 'invalid_credentials') throw new Error('Invalid master code.');
        if (payload?.error === 'try_later') throw new Error('Too many failed attempts. Try again in about 15 minutes.');
        throw new Error('Secure master-code service is temporarily unavailable.');
      }

      if (!payload?.token_hash) throw new Error('Secure sign-in token was not returned.');

      const { error } = await sb.auth.verifyOtp({
        token_hash: payload.token_hash,
        type: 'email',
      });
      if (error) throw error;

      input.value = '';
      setStatus('Master code accepted. Continuing to MFA…', 'ok');
      window.setTimeout(() => window.location.reload(), 250);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Secure sign-in failed.', 'error');
    } finally {
      button.disabled = false;
    }
  });
})();
