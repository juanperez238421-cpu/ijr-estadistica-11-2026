(() => {
  'use strict';

  const TEACHER_SESSION_KEY = 'ijr-stat11-master-teacher-session-v1';
  const params = new URLSearchParams(location.search);
  const directMasterGate = params.get('master') === '1';
  const explicitPreview = params.get('masterPreview') === '1';
  const teacherToken = (() => {
    try { return sessionStorage.getItem(TEACHER_SESSION_KEY) || ''; }
    catch { return ''; }
  })();

  // Authorization state lives in the verified teacher token, not in a fragile
  // query parameter. If a link drops masterPreview=1, restore it synchronously
  // before the theory/workshop bootstrap reads location.search.
  const inferredPreview = !directMasterGate && Boolean(teacherToken);
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
