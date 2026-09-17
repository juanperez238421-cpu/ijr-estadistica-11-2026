(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  if (params.get('masterPreview') === '1') return;

  document.documentElement.classList.add('stat11-team-gate-pending');

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[char]));
  }

  function normalizeName(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
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

  async function ask(snapshot, topicSlug, onStart) {
    const progress = snapshot?.topics?.find(topic => topic.slug === topicSlug) || null;
    if (!snapshot?.registration || !progress || progress.status === 'locked') {
      document.documentElement.classList.remove('stat11-team-gate-pending');
      return null;
    }

    const registration = snapshot.registration || {};
    const suggested = Array.isArray(snapshot.members)
      ? snapshot.members.map(member => normalizeName(member?.display_name)).filter(Boolean)
      : [];

    return new Promise(resolve => {
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
          <p class="stat11-team-gate-lead">Before every workshop, register the students sharing this workstation. Each computer may be used by <strong>1, 2 or 3 students</strong>.</p>

          <div class="stat11-team-gate-context">
            <span class="stat11-team-gate-chip">${escapeHtml(registration.group_code || 'Grade 11')}</span>
            <span class="stat11-team-gate-chip">${escapeHtml(progress.title || topicSlug)}</span>
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
          <p class="stat11-team-gate-note"><strong>Required every time:</strong> the participant check appears again whenever a Statistics 11 workshop is opened.</p>
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
            <input type="text" data-member-index="${index}" value="${escapeHtml(suggested[index] || '')}" autocomplete="name" maxlength="120" placeholder="Full name" required>
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
          const result = await onStart(names);
          if (!result?.workshop_session_id) throw new Error('The participant service returned an incomplete response.');
          window.IJR_STAT11_WORKSHOP_TEAM_SESSION = Object.freeze({ ...result });
          document.documentElement.dataset.workshopTeamSessionId = result.workshop_session_id;
          document.documentElement.dataset.workshopTeamSize = String(result.team_size || names.length);
          document.documentElement.dataset.workshopTeamReady = 'true';
          addSessionBadge(result, names);
          overlay.remove();
          document.documentElement.classList.remove('stat11-team-gate-pending');
          resolve(result);
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
    });
  }

  function release() {
    document.documentElement.classList.remove('stat11-team-gate-pending');
  }

  window.IJR_STAT11_WORKSHOP_TEAM_GATE = Object.freeze({ ask, release });
})();
