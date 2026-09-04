(() => {
  'use strict';

  const config = window.IJR_PYTHON_HUB_CONFIG;
  const topics = window.IJR_PYTHON_HUB_TOPICS || [];
  if (!config || !window.supabase) return;

  const params = new URLSearchParams(location.search);
  const directMasterEntry = params.get('master') === '1';
  const resumeMasterPreview = params.get('masterPreview') === '1';
  const masterRequested = directMasterEntry || resumeMasterPreview;

  const TEACHER_SESSION_KEY = 'ijr-stat11-master-teacher-session-v1';
  const ORIGINAL_STUDENT_SESSION_KEY = 'ijr-stat11-master-preview-original-student-v2';
  const PREVIEW_PROGRESS_KEY = 'ijr-stat11-master-preview-progress-v2';
  const MASTER_LOGIN_RPC = 'teacher_code_login';
  const MASTER_LOGOUT_RPC = 'teacher_code_logout';
  const MASTER_SNAPSHOT_RPC = 'python_hub_master_preview_snapshot_v1';

  function readJson(storage, key, fallback = null) {
    try { return JSON.parse(storage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
  }

  function writeJson(storage, key, value) {
    try { storage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function activeHubSession() {
    return readJson(localStorage, config.sessionStorageKey, null);
  }

  function preserveStudentHubSession() {
    if (sessionStorage.getItem(ORIGINAL_STUDENT_SESSION_KEY) !== null) return;
    const current = localStorage.getItem(config.sessionStorageKey);
    sessionStorage.setItem(ORIGINAL_STUDENT_SESSION_KEY, current == null ? '__EMPTY__' : current);
  }

  function restoreStudentHubSession() {
    const original = sessionStorage.getItem(ORIGINAL_STUDENT_SESSION_KEY);
    if (original === null) return;
    if (original === '__EMPTY__') localStorage.removeItem(config.sessionStorageKey);
    else localStorage.setItem(config.sessionStorageKey, original);
    sessionStorage.removeItem(ORIGINAL_STUDENT_SESSION_KEY);
  }

  // If a teacher returns to the ordinary student URL, cleanly restore whatever
  // Hub session existed before preview mode. Normal students never see master UI.
  if (!masterRequested) {
    if (activeHubSession()?.mode === 'master-preview') restoreStudentHubSession();
    return;
  }

  const client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false }
  });

  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>\"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;'
  }[c]));

  let teacherToken = '';
  let entering = false;

  async function rpc(name, args = {}) {
    const { data, error } = await client.rpc(name, args);
    if (error) throw new Error(error.message || 'Backend request failed');
    return data;
  }

  function rememberMasterHubSession() {
    preserveStudentHubSession();
    writeJson(localStorage, config.sessionStorageKey, {
      registrationId:'master-preview',
      accessToken:'master-preview',
      fingerprint:'',
      groupCode:'MASTER',
      emails:[],
      mode:'master-preview',
      authProtected:false,
      savedAt:new Date().toISOString()
    });
  }

  function showMasterGate(message = '') {
    const registrationPanel = $('registrationPanel');
    const hubPanel = $('hubPanel');
    if (!registrationPanel || !hubPanel) return;

    hubPanel.classList.add('hidden');
    registrationPanel.classList.remove('hidden');
    $('sessionBadge')?.classList.add('hidden');
    $('changeRegistrationButton')?.classList.add('hidden');

    const card = registrationPanel.querySelector('.registration-card');
    if (!card) return;
    card.innerHTML = `
      <p class="eyebrow">MASTER ONLY · STUDENT EXPERIENCE QA</p>
      <h1>Enter the master code to open the complete student Hub.</h1>
      <p class="registration-lead">This is the real Statistics 11 student interface with <strong>all ${topics.length || 16} topics unlocked</strong>. Theory, workshop, Python runtime, and validation can be inspected without changing any student record.</p>

      <div class="sequence-rule" aria-label="Master preview isolation">
        <strong>Isolated teacher preview</strong>
        <span>Master code → verified teacher session → full student view</span>
        <small>No student registration, answer, grade, prerequisite, or saved progress is modified by this preview.</small>
      </div>

      <form id="masterStudentAccessForm" class="hub-registration-form" autocomplete="off">
        <fieldset class="member-fieldset">
          <legend>Master access <small>· Acceso docente</small></legend>
          <div class="member-grid">
            <label>Master code
              <input id="masterStudentCode" type="password" autocomplete="current-password" required placeholder="Enter master code">
            </label>
          </div>
        </fieldset>
        <div class="registration-actions">
          <div><strong>Teacher verification</strong><span>The code is checked by the existing secure Supabase master login. The code itself is never stored in the browser.</span></div>
          <button id="masterStudentAccessButton" class="button button-dark" type="submit">Open full student view</button>
        </div>
        <p id="masterStudentAccessStatus" class="inline-status ${message ? 'error' : ''}" role="status" aria-live="polite">${escapeHtml(message)}</p>
      </form>`;

    const form = $('masterStudentAccessForm');
    const input = $('masterStudentCode');
    form?.addEventListener('submit', handleMasterLogin);
    setTimeout(() => input?.focus(), 0);
  }

  function renderMasterHub(snapshot) {
    const registrationPanel = $('registrationPanel');
    const hubPanel = $('hubPanel');
    if (!registrationPanel || !hubPanel) return;

    rememberMasterHubSession();
    registrationPanel.classList.add('hidden');
    hubPanel.classList.remove('hidden');

    const badge = $('sessionBadge');
    if (badge) {
      badge.classList.remove('hidden');
      badge.textContent = `MASTER · Full access · ${topics.length}/${topics.length} topics unlocked`;
    }

    const exitButton = $('changeRegistrationButton');
    if (exitButton) {
      exitButton.classList.remove('hidden');
      exitButton.textContent = 'Exit master preview';
      exitButton.onclick = exitMasterPreview;
    }

    const heroTitle = hubPanel.querySelector('.hub-overview h1');
    if (heroTitle) heroTitle.textContent = 'Inspect the real student pathway with every topic unlocked.';
    const identity = $('identitySummary');
    if (identity) identity.textContent = 'MASTER · Teacher QA preview · no student account';

    const isolationRule = hubPanel.querySelector('.hub-overview .sequence-rule');
    if (isolationRule) {
      isolationRule.innerHTML = '<strong>MASTER QA · ISOLATED PREVIEW</strong><span>All theory and workshop routes are unlocked for inspection.</span><small>Workshop checks use the real answer/code validation contract, but preview attempts stay local to this tab and are not written to student progress.</small>';
    }

    const globalPercent = $('globalPercent');
    const globalProgressBar = $('globalProgressBar');
    const globalProgressCopy = $('globalProgressCopy');
    if (globalPercent) globalPercent.textContent = 'FULL';
    if (globalProgressBar) globalProgressBar.style.width = '100%';
    if (globalProgressCopy) globalProgressCopy.textContent = `${topics.length} / ${topics.length} topics available for QA`;

    const bySlug = new Map((snapshot?.topics || []).map(item => [item.slug, item]));
    const grid = $('topicGrid');
    if (grid) {
      grid.innerHTML = topics.map(topic => {
        const p = bySlug.get(topic.slug) || {};
        const total = Number(p.total_count || topic.exercises?.length || 12);
        const theoryHref = `theory.html?topic=${encodeURIComponent(topic.slug)}&masterPreview=1`;
        const workshopHref = `workshop.html?topic=${encodeURIComponent(topic.slug)}&masterPreview=1`;
        return `<article class="hub-topic-card available">
          <div class="hub-topic-top"><span class="hub-topic-number">${String(topic.sequence).padStart(2,'0')}</span><span class="hub-topic-status">MASTER · Available</span></div>
          <h2>${escapeHtml(topic.title)}</h2>
          <p>${escapeHtml(topic.lead)}</p>
          <div class="hub-topic-progress"><div><strong>QA</strong><span>${total} workshop stages · unlocked</span></div><div class="progress-track"><span style="width:100%"></span></div></div>
          <div class="hub-topic-actions">
            <a class="button button-light" href="${theoryHref}">Theory</a>
            <a class="button button-dark" href="${workshopHref}">Workshop</a>
          </div>
        </article>`;
      }).join('');
    }

    history.replaceState(null, '', `${location.pathname}?masterPreview=1`);
  }

  async function openMasterHub(token) {
    const data = await rpc(MASTER_SNAPSHOT_RPC, { p_teacher_token:token });
    if (!data?.snapshot?.topics?.length) throw new Error('Master preview snapshot could not be loaded.');
    teacherToken = token;
    sessionStorage.setItem(TEACHER_SESSION_KEY, token);
    renderMasterHub(data.snapshot);
  }

  async function handleMasterLogin(event) {
    event.preventDefault();
    if (entering) return;
    const input = $('masterStudentCode');
    const button = $('masterStudentAccessButton');
    const status = $('masterStudentAccessStatus');
    const code = String(input?.value || '');
    if (!code) return;

    entering = true;
    if (button) button.disabled = true;
    if (status) {
      status.className = 'inline-status';
      status.textContent = 'Verifying master code…';
    }

    try {
      const login = await rpc(MASTER_LOGIN_RPC, { p_code:code, p_user_agent:navigator.userAgent });
      if (input) input.value = '';
      await openMasterHub(login.teacher_token);
    } catch (error) {
      if (input) input.value = '';
      if (status) {
        status.className = 'inline-status error';
        status.textContent = error.message || 'Master access failed.';
      }
      input?.focus();
    } finally {
      entering = false;
      if (button) button.disabled = false;
    }
  }

  async function exitMasterPreview() {
    const token = teacherToken || sessionStorage.getItem(TEACHER_SESSION_KEY) || '';
    if (token) {
      try { await rpc(MASTER_LOGOUT_RPC, { p_teacher_token:token }); } catch {}
    }
    sessionStorage.removeItem(TEACHER_SESSION_KEY);
    sessionStorage.removeItem(PREVIEW_PROGRESS_KEY);
    localStorage.removeItem(config.sessionStorageKey);
    restoreStudentHubSession();
    location.href = './';
  }

  async function startMasterRoute() {
    preserveStudentHubSession();

    // Explicit /?master=1 always presents the code gate as requested, even if
    // an older teacher token exists. /?masterPreview=1 resumes only after a
    // successful code entry on this tab.
    if (directMasterEntry) {
      sessionStorage.removeItem(TEACHER_SESSION_KEY);
      localStorage.removeItem(config.sessionStorageKey);
      showMasterGate();
      return;
    }

    const token = sessionStorage.getItem(TEACHER_SESSION_KEY) || '';
    if (!token) {
      showMasterGate('Master session not found. Enter the master code again.');
      return;
    }

    try {
      await openMasterHub(token);
    } catch (error) {
      sessionStorage.removeItem(TEACHER_SESSION_KEY);
      localStorage.removeItem(config.sessionStorageKey);
      showMasterGate(error.message || 'Master session expired. Enter the master code again.');
    }
  }

  // This handler runs in the capture phase before hub-router.js. In master mode
  // it owns the student Hub page so the ordinary student Auth gate cannot replace
  // the teacher QA view. On every normal URL it is a no-op.
  document.addEventListener('DOMContentLoaded', event => {
    if (!masterRequested) return;
    event.stopImmediatePropagation();
    startMasterRoute();
  }, { capture:true });
})();