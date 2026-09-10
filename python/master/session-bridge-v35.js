(() => {
  'use strict';

  const CANONICAL = 'ijr-stat11-master-teacher-session-v1';
  const LEGACY = 'ijr-stat11-python-master-code-session-v1';

  function read(key) {
    try { return sessionStorage.getItem(key) || ''; }
    catch { return ''; }
  }

  function remove(key) {
    try { sessionStorage.removeItem(key); }
    catch {}
  }

  // Migrate an already-open V34 teacher session before app.js reads its state.
  const canonical = read(CANONICAL);
  const legacy = read(LEGACY);
  if (!canonical && legacy) {
    try { sessionStorage.setItem(CANONICAL, legacy); } catch {}
  }
  remove(LEGACY);

  // Defense in depth: signing out from the teacher dashboard clears both the
  // canonical key and the V34 legacy key even if an older cached script exists.
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('logoutButton')?.addEventListener('click', () => {
      remove(CANONICAL);
      remove(LEGACY);
    }, { capture: true });
  }, { once: true });

  window.IJR_MASTER_SESSION_BRIDGE_V35 = Object.freeze({
    canonicalKey: CANONICAL,
    migratedLegacy: !canonical && Boolean(legacy)
  });
})();
