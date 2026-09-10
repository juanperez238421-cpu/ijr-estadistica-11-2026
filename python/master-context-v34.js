(() => {
  'use strict';

  const TEACHER_SESSION_KEY = 'ijr-stat11-master-teacher-session-v1';
  const config = window.IJR_PYTHON_HUB_CONFIG;
  const params = new URLSearchParams(location.search);
  const directMasterGate = params.get('master') === '1';
  const explicitPreview = params.get('masterPreview') === '1';
  const teacherToken = (() => {
    try { return sessionStorage.getItem(TEACHER_SESSION_KEY) || ''; }
    catch { return ''; }
  })();

  let savedSession = null;
  if (config?.sessionStorageKey) {
    try { savedSession = JSON.parse(localStorage.getItem(config.sessionStorageKey) || 'null'); }
    catch { savedSession = null; }
  }

  // A verified teacher token is the durable signal for this browser tab.
  // Query parameters are navigation state, not authorization state, and links
  // may legitimately lose them. Restore the preview marker before downstream
  // page scripts inspect location.search.
  const inferredPreview = !directMasterGate && Boolean(teacherToken) && (
    savedSession?.mode === 'master-preview' ||
    savedSession?.registrationId === 'master-preview' ||
    !savedSession
  );
  const active = explicitPreview || inferredPreview;

  if (active && !directMasterGate && !explicitPreview) {
    params.set('masterPreview', '1');
    const query = params.toString();
    const normalized = `${location.pathname}${query ? `?${query}` : ''}${location.hash}`;
    history.replaceState(history.state, '', normalized);
  }

  window.IJR_MASTER_CONTEXT_V34 = Object.freeze({
    active,
    explicit: explicitPreview,
    inferred: inferredPreview,
    hasTeacherToken: Boolean(teacherToken),
    normalizedUrl: active && !directMasterGate
  });
})();
