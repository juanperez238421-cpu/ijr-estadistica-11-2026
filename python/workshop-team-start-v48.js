(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  if (params.get('masterPreview') === '1') return;

  const config = window.IJR_PYTHON_HUB_CONFIG;
  if (!config) return;

  const topicSlug = params.get('topic') || 'statistics';
  const START_RPC = 'python_hub_start_workshop_team_browser_v1';
  const API_TIMEOUT_MS = 12000;
  let gateOpened = false;

  document.documentElement.classList.add('stat11-team-gate-pending');

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[char]));
  }

  function normalizeName(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }

  function readRegistration() {
    try {
      const stored = JSON.parse(localStorage.getItem(config.sessionStorageKey) || 'null');
      return stored?.registrationId ? {
        registrationId: stored.registrationId,
        groupCode: stored.groupCode || ''
      } : null;
    } catch {
      return null;
    }
  }

  function makeUuid() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  async function postStart(registrationId, names) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    try {
      const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/${START_RPC}`, {
        method: 'POST',
        headers: {
          apikey: config.supabasePublishableKey,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          p_registration_id: registrationId,
          p_topic_slug: topicSlug,
          p_student_names: names,
          p_session_id: makeUuid(),
          p_user_agent: navigator.userAgent
        }),
        signal: controller.signal,
        cache: 'no-store'
      });
      const raw = await response.text();
      let payload = null;
      try { payload = raw ? JSON.parse(raw) : null; } catch { payload = raw || null; }
      if (!response.ok) {
        throw new Error(payload?.message || payload?.details || `Participant registration failed (${response.status}).`);
      }
      return payload;
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error('The participant check timed out. Please try again.');
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  function validateNames(names, size) {
    if (!size) return 'Select 1, 2 or 3 students.';
    if (names.length !== size || names.some(name => name.length < 2)) {
      return 'Write the full name of every participating student.';
    }
    const normalized = names.map(name => name.toLocaleLowerCase());
    if (new Set(normalized).size !== normalized.length) {
      return 'Do not repeat a student name in the same group.';
    }
    return '';
  }

  function addSessionBadge(result, names) {
    const actions = document.querySelector('.titlebar-actions');
    if (!actions) return;
    let badge = document.getElementById('workshopTeamBadge');
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'workshopTeamBadge';
      badge.className = 'workshop-team-badge';
      actions.prepend(badge);
    }
    const count = Number(result?.team_size || names.length || 0);
    badge.textContent = `${count} ${count === 1 ? 'student' : 'students'} · ${result?.team_label || names.join(' · ')}`;
    badge.title = badge.textContent;
  }

  function showGate() {
    if (gateOpened || document.getElementById('stat11TeamGate')) return;
    const registration = readRegistration();
    if (!registration?.registrationId) {
      document.documentElement.classList.remove('stat11-team-gate-pending');
      return;
    }

    gateOpened = true;
    const topicTitle = document.getElementById('topicTitle')?.textContent?.trim() || topicSlug;
    const state = { size: 0, busy: false };
    const overlay = document.createElement('div');
    overlay.className = 'stat11-team-gate-overlay';
    overlay.id = 'stat11TeamGate';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'stat11TeamGateTitle');
    overlay.innerHTML = `
      <section class="stat11-team-gate-card">
        <p class="stat11-team-gate-eyebrow">STATISTICS 11 · LAB WORKSHOP</p>
        <h2 id="stat11TeamGateTitle">Who is working at this computer?</h2>
        <p class="stat11-team-gate-lead">Before every workshop, register the students sharing this workstation. Because the lab has limited computers, each workstation may be used by <strong>1, 2 or 3 students</strong>.</p>

        <div class="stat11-team-gate-context">
          <span class="stat11-team-gate-chip">${escapeHtml(registration.groupCode || 'Grade 11')}</span>
          <span class="stat11-team-gate-chip">${escapeHtml(topicTitle)}</span>
        </div>

        <div class="stat11-team-gate-section">
          <span class="stat11-team-gate-label">How many students are participating?</span>
          <div class="stat11-team-size-grid" role="group" aria-label="Number of participating students">
            <button class="stat11-team-size-button" type="button" data-team-size="1" aria-pressed="false"><strong>1</strong><span>student</span></button>
            <button class="stat11-team-size-button" type="button" data-team-size="2" aria-pressed="false"><strong>2</strong><span>students</span></button>
            <button class="stat11-team-size-button" type="button" data-team-size="3" aria-pressed="false"><strong>3</strong><span>students</span></button>
          </div>
        </div>

        <div id="stat11TeamMemberFields" class="stat11-team-member-list"></div>
        <p class="stat11-team-gate-note"><strong>Required every workshop:</strong> choose the number of students and enter every participant name before the notebook becomes available.</p>
        <p id="stat11TeamGateStatus" class="stat11-team-gate-status" aria-live="polite"></p>

        <div class="stat11-team-gate-actions">
          <a href="./">← Back to Learning Hub</a>
          <button id="stat11TeamStartButton" class="stat11-team-start-button" type="button" disabled>Start workshop</button>
        </div>
      </section>`;

    document.body.appendChild(overlay);

    const fields = overlay.querySelector('#stat11TeamMemberFields');
    const status = overlay.querySelector('#stat11TeamGateStatus');
    const startButton = overlay.querySelector('#stat11TeamStartButton');

    function selectedNames() {
      return [...fields.querySelectorAll('input')]
        .slice(0, state.size)
        .map(input => normalizeName(input.value));
    }

    function setStatus(message = '', isError = false) {
      status.textContent = message;
      status.classList.toggle('is-error', Boolean(isError));
    }

    function validate() {
      const error = validateNames(selectedNames(), state.size);
      startButton.disabled = state.busy || Boolean(error);
      if (!state.busy) setStatus(error && state.size ? error : '', Boolean(error && state.size));
      return !error;
    }

    function renderFields() {
      if (!state.size) {
        fields.innerHTML = '';
        validate();
        return;
      }
      fields.innerHTML = Array.from({ length: state.size }, (_, index) => `
        <label class="stat11-team-member-field">
          <span>Student ${index + 1} full name</span>
          <input type="text" data-member-index="${index}" autocomplete="name" maxlength="120" placeholder="Full name" required>
        </label>`).join('');
      fields.querySelectorAll('input').forEach(input => input.addEventListener('input', validate));
      validate();
      fields.querySelector('input')?.focus();
    }

    overlay.querySelectorAll('[data-team-size]').forEach(button => {
      button.addEventListener('click', () => {
        state.size = Number(button.dataset.teamSize);
        overlay.querySelectorAll('[data-team-size]').forEach(item => {
          const selected = Number(item.dataset.teamSize) === state.size;
          item.classList.toggle('is-selected', selected);
          item.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
        renderFields();
      });
    });

    startButton.addEventListener('click', async () => {
      if (state.busy || !validate()) return;
      const names = selectedNames();
      state.busy = true;
      validate();
      setStatus('Registering this workshop group…');
      try {
        const result = await postStart(registration.registrationId, names);
        if (!result?.workshop_session_id) throw new Error('The participant service returned an incomplete response.');
        window.IJR_STAT11_WORKSHOP_TEAM_SESSION = Object.freeze({ ...result });
        document.documentElement.dataset.workshopTeamSessionId = result.workshop_session_id;
        document.documentElement.dataset.workshopTeamSize = String(result.team_size || names.length);
        document.documentElement.dataset.workshopTeamReady = 'true';
        addSessionBadge(result, names);
        overlay.remove();
        document.documentElement.classList.remove('stat11-team-gate-pending');
      } catch (error) {
        state.busy = false;
        setStatus(error?.message || 'Could not register this workshop group.', true);
        validate();
      }
    });

    overlay.addEventListener('keydown', event => {
      if (event.key === 'Escape') event.preventDefault();
      if (event.key === 'Enter' && event.target?.tagName === 'INPUT' && !startButton.disabled) {
        event.preventDefault();
        startButton.click();
      }
    });

    overlay.querySelector('[data-team-size="1"]')?.focus();
  }

  function inspectWorkshopState() {
    if (document.documentElement.dataset.workshopReady === 'true') {
      document.documentElement.classList.add('stat11-team-gate-pending');
      showGate();
      return true;
    }

    const startup = document.getElementById('startupPanel');
    if (startup && !startup.classList.contains('hidden') && startup.textContent.trim()) {
      document.documentElement.classList.remove('stat11-team-gate-pending');
    }
    return false;
  }

  function init() {
    if (inspectWorkshopState()) return;
    const observer = new MutationObserver(() => {
      if (inspectWorkshopState()) observer.disconnect();
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'data-workshop-ready']
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
