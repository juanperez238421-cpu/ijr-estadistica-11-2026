(() => {
  'use strict';

  const config = window.IJR_PYTHON_HUB_CONFIG;
  const topics = window.IJR_PYTHON_HUB_TOPICS || [];
  if (!config || !window.supabase || !topics.length) return;

  const QA_EMAIL = 'qa.student11@ijr.edu.co';
  const QA_GROUP = '11A';
  const QA_LOGIN_RPC = 'python_hub_qa_login_v1';
  const client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false }
  });

  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>\"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;'
  }[c]));

  let qaMode = false;
  let snapshot = null;

  function normalizeEmail(value){ return String(value || '').trim().toLowerCase(); }
  function readJson(key){ try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }
  function writeJson(key,value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  function clearHubSession(){
    try { localStorage.removeItem(config.sessionStorageKey); } catch {}
    try { localStorage.removeItem(config.sessionVaultKey); } catch {}
  }

  function savedQaSession(){
    const saved = readJson(config.sessionStorageKey);
    return saved?.qaTest && saved?.registrationId && saved?.accessToken ? saved : null;
  }

  function rememberQaSession(data){
    writeJson(config.sessionStorageKey, {
      registrationId:data.registration_id,
      accessToken:data.access_token,
      fingerprint:'',
      groupCode:QA_GROUP,
      emails:[QA_EMAIL],
      mode:'individual',
      authProtected:false,
      qaTest:true,
      savedAt:new Date().toISOString()
    });
  }

  async function rpc(name,args){
    const { data, error } = await client.rpc(name,args);
    if (error) throw new Error(error.message || 'Backend request failed');
    return data;
  }

  function progressFor(slug){ return snapshot?.topics?.find(item => item.slug === slug) || null; }

  function renderQaHub(){
    if (!snapshot?.registration) throw new Error('QA snapshot is missing the registration object.');
    qaMode = true;

    $('registrationPanel')?.classList.add('hidden');
    $('hubPanel')?.classList.remove('hidden');
    $('sessionBadge')?.classList.remove('hidden');
    $('changeRegistrationButton')?.classList.remove('hidden');

    if ($('sessionBadge')) $('sessionBadge').textContent = `QA · ${QA_GROUP} · ${snapshot.completed_topics}/${snapshot.total_topics}`;
    if ($('identitySummary')) $('identitySummary').textContent = `${QA_GROUP} · ${QA_EMAIL} · isolated QA student`;

    const totalStages = (snapshot.topics || []).reduce((sum,item) => sum + Number(item.total_count || 0), 0);
    const correctStages = (snapshot.topics || []).reduce((sum,item) => sum + Number(item.correct_count || 0), 0);
    const percent = totalStages ? Math.round(100 * correctStages / totalStages) : 0;
    if ($('globalPercent')) $('globalPercent').textContent = `${percent}%`;
    if ($('globalProgressBar')) $('globalProgressBar').style.width = `${percent}%`;
    if ($('globalProgressCopy')) $('globalProgressCopy').textContent = `${correctStages} / ${totalStages} workshop stages correct`;

    const grid = $('topicGrid');
    if (grid) {
      grid.innerHTML = topics.map(topic => {
        const p = progressFor(topic.slug) || { status:'locked', percent:0, correct_count:0, total_count:topic.exercises?.length || 12 };
        const locked = p.status === 'locked';
        const statusLabel = p.status === 'completed' ? 'Complete' : p.status === 'in_progress' ? 'In progress' : p.status === 'available' ? 'Available' : 'Locked';
        const theoryHref = locked ? '#' : `theory.html?topic=${encodeURIComponent(topic.slug)}`;
        const workshopHref = locked ? '#' : `workshop.html?topic=${encodeURIComponent(topic.slug)}`;
        return `<article class="hub-topic-card ${escapeHtml(p.status)}">
          <div class="hub-topic-top"><span class="hub-topic-number">${String(topic.sequence).padStart(2,'0')}</span><span class="hub-topic-status">${escapeHtml(statusLabel)}</span></div>
          <h2>${escapeHtml(topic.title)}</h2>
          <p>${escapeHtml(topic.lead)}</p>
          <div class="hub-topic-progress"><div><strong>${Number(p.percent || 0)}%</strong><span>${Number(p.correct_count || 0)} / ${Number(p.total_count || topic.exercises?.length || 12)} workshop stages</span></div><div class="progress-track"><span style="width:${Number(p.percent || 0)}%"></span></div></div>
          <div class="hub-topic-actions">
            <a class="button button-light ${locked ? 'disabled-link' : ''}" href="${theoryHref}" ${locked ? 'aria-disabled="true" tabindex="-1"' : ''}>Theory</a>
            <a class="button button-dark ${locked ? 'disabled-link' : ''}" href="${workshopHref}" ${locked ? 'aria-disabled="true" tabindex="-1"' : ''}>Workshop</a>
          </div>
          ${locked ? '<div class="hub-lock-note">Complete the previous workshop to unlock theory and practice.</div>' : ''}
        </article>`;
      }).join('');
    }

    const identityPanel = $('identityProgressPanel');
    if (identityPanel) {
      identityPanel.innerHTML = '<div class="sequence-rule"><strong>QA STUDENT · ISOLATED TEST ACCOUNT</strong><span>This session belongs only to qa.student11@ijr.edu.co.</span><small>It does not use an official roster student.</small></div>';
    }
  }

  function showQaPasswordStep(){
    qaMode = true;
    $('identityStepForm')?.classList.add('hidden');
    $('passwordStepForm')?.classList.remove('hidden');
    $('confirmationPanel')?.classList.add('hidden');

    if ($('selectedIdentity')) $('selectedIdentity').textContent = `${QA_GROUP} · ${QA_EMAIL}`;
    if ($('passwordModeTitle')) $('passwordModeTitle').textContent = 'QA student · Enter the test password';
    if ($('passwordModeCopy')) $('passwordModeCopy').textContent = 'This exact synthetic account uses an isolated QA login path and the normal Statistics 11 progress backend.';
    if ($('passwordActionTitle')) $('passwordActionTitle').textContent = 'Step 2 of 2 · QA student sign in';
    if ($('passwordActionCopy')) $('passwordActionCopy').textContent = 'Enter the QA password. Supabase Auth is intentionally bypassed only for this exact synthetic identity.';
    if ($('passwordSubmitButton')) $('passwordSubmitButton').textContent = 'Sign in';
    if ($('confirmPasswordWrap')) $('confirmPasswordWrap').classList.add('hidden');
    if ($('studentPasswordConfirm')) $('studentPasswordConfirm').required = false;
    if ($('passwordModeToggle')) {
      $('passwordModeToggle').disabled = true;
      $('passwordModeToggle').textContent = 'QA account ready';
    }
    if ($('passwordToggleLabel')) $('passwordToggleLabel').textContent = 'Pre-created QA account';
    if ($('passwordToggleCopy')) $('passwordToggleCopy').textContent = 'Account creation is disabled for this synthetic QA identity.';
    if ($('passwordStatus')) {
      $('passwordStatus').textContent = '';
      $('passwordStatus').className = 'inline-status';
    }
    if ($('studentPassword')) {
      $('studentPassword').value = '';
      $('studentPassword').autocomplete = 'current-password';
      setTimeout(() => $('studentPassword')?.focus(), 0);
    }
  }

  async function handleQaPassword(event){
    event.preventDefault();
    event.stopImmediatePropagation();

    const password = String($('studentPassword')?.value || '');
    const status = $('passwordStatus');
    const button = $('passwordSubmitButton');
    if (password.length < 8) {
      if (status) {
        status.textContent = 'Enter the QA password.';
        status.className = 'inline-status error';
      }
      return;
    }

    if (button) button.disabled = true;
    if (status) {
      status.textContent = 'Opening isolated QA student session…';
      status.className = 'inline-status';
    }

    try {
      const data = await rpc(QA_LOGIN_RPC, {
        p_password:password,
        p_session_id:crypto.randomUUID(),
        p_user_agent:`Official Hub QA V46 · ${navigator.userAgent}`
      });
      if (!data?.registration_id || !data?.access_token || !data?.snapshot) throw new Error('QA login returned an incomplete response.');
      if ($('studentPassword')) $('studentPassword').value = '';
      rememberQaSession(data);
      snapshot = data.snapshot;
      renderQaHub();
    } catch (error) {
      if (status) {
        status.textContent = error?.message || 'QA sign-in failed.';
        status.className = 'inline-status error';
      }
      $('studentPassword')?.focus();
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function resumeQa(saved){
    const data = await rpc(config.rpc.resume, {
      p_registration_id:saved.registrationId,
      p_access_token:saved.accessToken
    });
    if (!data?.snapshot) throw new Error('QA session could not be resumed.');
    snapshot = data.snapshot;
    renderQaHub();
  }

  // Robust interception at the document capture phase. This runs before the
  // ordinary student router can process the same submit event.
  document.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    if (form.id === 'identityStepForm') {
      const email = normalizeEmail($('studentEmail')?.value);
      if (email !== QA_EMAIL) return;

      const group = String($('groupCode')?.value || '').toUpperCase();
      event.preventDefault();
      event.stopImmediatePropagation();

      if (group !== QA_GROUP) {
        const status = $('identityStatus');
        if (status) {
          status.textContent = `The QA test identity belongs to ${QA_GROUP}.`;
          status.className = 'inline-status error';
        }
        return;
      }

      showQaPasswordStep();
      return;
    }

    if (form.id === 'passwordStepForm' && qaMode) {
      handleQaPassword(event);
    }
  }, true);

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest('button, a') : null;
    if (!target) return;

    if (target.id === 'backToIdentityButton' && qaMode) {
      event.preventDefault();
      event.stopImmediatePropagation();
      qaMode = false;
      clearHubSession();
      location.reload();
      return;
    }

    if (target.id === 'changeRegistrationButton' && (qaMode || savedQaSession())) {
      event.preventDefault();
      event.stopImmediatePropagation();
      clearHubSession();
      location.href = './';
    }
  }, true);

  document.addEventListener('DOMContentLoaded', event => {
    const saved = savedQaSession();
    if (!saved) return;

    // Resume QA before hub-router.js clears unauthenticated local sessions.
    event.stopImmediatePropagation();
    qaMode = true;
    resumeQa(saved).catch(() => {
      clearHubSession();
      location.reload();
    });
  }, { capture:true });
})();
