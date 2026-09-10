(() => {
  'use strict';

  const CANONICAL_TEACHER_SESSION_KEY = 'ijr-stat11-master-teacher-session-v1';
  const LEGACY_TEACHER_SESSION_KEY = 'ijr-stat11-python-master-code-session-v1';
  const params = new URLSearchParams(location.search);
  const directMasterGate = params.get('master') === '1';
  const explicitPreview = params.get('masterPreview') === '1';

  function readToken(key) {
    try { return sessionStorage.getItem(key) || ''; }
    catch { return ''; }
  }

  const canonicalToken = readToken(CANONICAL_TEACHER_SESSION_KEY);
  const legacyToken = readToken(LEGACY_TEACHER_SESSION_KEY);
  const teacherToken = canonicalToken || legacyToken;

  // V35 compatibility bridge: older teacher-dashboard sessions used a different
  // sessionStorage key. Migrate that token in the same tab before the workshop
  // bootstrap runs. The token never goes into the URL or localStorage.
  if (!canonicalToken && legacyToken) {
    try {
      sessionStorage.setItem(CANONICAL_TEACHER_SESSION_KEY, legacyToken);
      sessionStorage.removeItem(LEGACY_TEACHER_SESSION_KEY);
    } catch {}
  }

  // Authorization state lives in the verified teacher token, not in a fragile
  // query parameter. If a same-tab link ever drops masterPreview=1, restore it
  // synchronously before theory/workshop bootstrap reads location.search.
  const inferredPreview = !directMasterGate && Boolean(teacherToken);
  const active = explicitPreview || inferredPreview;

  if (active && !directMasterGate && !explicitPreview) {
    params.set('masterPreview', '1');
    const query = params.toString();
    const normalized = `${location.pathname}${query ? `?${query}` : ''}${location.hash}`;
    history.replaceState(history.state, '', normalized);
  }

  window.IJR_MASTER_CONTEXT_V34 = Object.freeze({
    version: 'v35-compat',
    active,
    explicit: explicitPreview,
    inferred: inferredPreview,
    hasTeacherToken: Boolean(teacherToken),
    migratedLegacyToken: !canonicalToken && Boolean(legacyToken),
    normalizedUrl: active && !directMasterGate
  });
})();
