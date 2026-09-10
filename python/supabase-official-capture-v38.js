(() => {
  'use strict';

  const candidate = window.supabase;
  const valid = Boolean(candidate && typeof candidate.createClient === 'function');

  window.IJR_SUPABASE_OFFICIAL_V38 = valid ? candidate : null;
  window.IJR_SUPABASE_CAPTURE_V38 = Object.freeze({
    version: 'v38',
    captured: valid,
    source: valid ? '@supabase/supabase-js@2' : 'missing'
  });
})();
