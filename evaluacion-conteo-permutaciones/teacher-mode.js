(() => {
  'use strict';

  const cfg = window.IJR_ASSESSMENT_CONFIG;
  const bank = Array.from(window.IJR_TEACHER_DEMO_BANK || []);
  const $ = id => document.getElementById(id);
  if (!cfg || !$('teacherAccessButton')) return;

  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  const TOKEN_KEY = 'ijr-stat11-teacher-code-session-v2';
  const EMAIL_KEY = 'ijr-stat11-teacher-report-email-v1';
  const DEMO_KEY = 'ijr-stat11-teacher-demo-results-v1';
  const CODE_HASH = 'd8c4d37261d7aaa4bbafe4ccfe334e09fbe181c84de22e9a561dfe02b0958aa0';

  let teacherToken = sessionStorage.getItem(TOKEN_KEY) || '';
  let localFallback = teacherToken === 'LOCAL-FALLBACK';
  let snapshot = null;
  let selectedAttempt = null;
  let localTest = null;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const teacherPanel = $('teacherPanel');
  const teacherLogin = $('teacherLogin');
  const teacherDashboard = $('teacherDashboard');
  const teacherStatus = $('teacherStatus');
  const backendNotice = $('teacherBackendNotice');

  async function rpc(name, args = {}) {
    const { data, error } = await sb.rpc(name, args);
    if (error) throw new Error(error.message || 'Backend error');
    return data;
  }

  async function sha256(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function isMissingRpc(err) {
    const m = String(err?.message || err || '').toLowerCase();
    return m.includes('could not find the function') || m.includes('schema cache') || m.includes('pgrst202');
  }

  function setStatus(message, isError = false) {
    teacherStatus.textContent = message || '';
    teacherStatus.style.color = isError ? '#8b1e1e' : '';
  }

  function currentEmail() {
    return localStorage.getItem(EMAIL_KEY) || snapshot?.report_email || cfg.reportEmail || 'juanperez238421@gmail.com';
  }

  function showTeacherPanel() {
    teacherPanel.classList.remove('hidden');
    $('setupPanel')?.classList.add('hidden');
    $('finishPanel')?.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (teacherToken) loadDashboard().catch(() => {
      teacherToken = '';
      localFallback = false;
      sessionStorage.removeItem(TOKEN_KEY);
      teacherDashboard.classList.add('hidden');
      teacherLogin.classList.remove('hidden');
    });
  }

  function closeTeacherPanel() {
    teacherPanel.classList.add('hidden');
    if (!$('examPanel')?.classList.contains('hidden')) return;
    $('setupPanel')?.classList.remove('hidden');
    const url = new URL(location.href);
    url.searchParams.delete('teacher');
    history.replaceState({}, '', url);
  }

  async function login(code) {
    try {
      const result = await rpc('teacher_code_login', { p_code: code, p_user_agent: navigator.userAgent });
      teacherToken = result.teacher_token;
      localFallback = false;
      sessionStorage.setItem(TOKEN_KEY, teacherToken);
      if (result.report_email) localStorage.setItem(EMAIL_KEY, result.report_email);
      $('teacherCode').value = '';
      await loadDashboard();
      return;
    } catch (err) {
      if (!isMissingRpc(err)) throw err;
      const digest = await sha256(code);
      if (digest !== CODE_HASH) throw new Error('Código docente incorrecto');
      teacherToken = 'LOCAL-FALLBACK';
      localFallback = true;
      sessionStorage.setItem(TOKEN_KEY, teacherToken);
      $('teacherCode').value = '';
      await loadDashboard();
    }
  }

  async function logout() {
    if (teacherToken && !localFallback) {
      try { await rpc('teacher_code_logout', { p_teacher_token: teacherToken }); } catch (_) {}
    }
    teacherToken = '';
    localFallback = false;
    snapshot = null;
    selectedAttempt = null;
    sessionStorage.removeItem(TOKEN_KEY);
    teacherDashboard.classList.add('hidden');
    teacherLogin.classList.remove('hidden');
    setStatus('Sesión docente cerrada.');
  }

  function localSnapshot() {
    const demos = JSON.parse(localStorage.getItem(DEMO_KEY) || '[]');
    return {
      assessment: { title: 'Statistics 11 · Counting & Permutations', status: 'LOCAL TEST MODE' },
      metrics: { roster_total: 61, roster_11a: 18, roster_11b: 20, roster_11c: 23, attempts_total: demos.length, active: 0, submitted: demos.length, invalidated: 0, pending_email_reports: 0 },
      roster: [], sources: [], attempts: demos.map((d, i) => ({
        id: `LOCAL-${i}`, student_name: 'DOCENTE · TEST LOCAL', group_code: d.group,
        status: 'submitted_local', answered_count: 18, raw_points: d.raw_points,
        grade: d.grade, integrity_strikes: 0, identity_match_mode: 'local_teacher_test',
        identity_match_score: 1, started_at: d.started_at, submitted_at: d.finished_at, last_activity_at: d.finished_at
      })),
      report_email: currentEmail()
    };
  }

  async function loadDashboard() {
    if (!teacherToken) return;
    setStatus('Actualizando panel docente…');
    if (localFallback) {
      snapshot = localSnapshot();
      renderDashboard();
      setStatus('Modo docente local activo. El backend Supabase aún no expone las RPC de producción.', true);
      return;
    }
    try {
      snapshot = await rpc('teacher_dashboard_snapshot', { p_teacher_token: teacherToken, p_assessment_slug: cfg.assessmentSlug });
      renderDashboard();
      setStatus('');
    } catch (err) {
      if (!isMissingRpc(err)) throw err;
      localFallback = true;
      teacherToken = 'LOCAL-FALLBACK';
      sessionStorage.setItem(TOKEN_KEY, teacherToken);
      snapshot = localSnapshot();
      renderDashboard();
      setStatus('Supabase no tiene aún las RPC. Se activó el panel docente local de contingencia.', true);
    }
  }

  function renderDashboard() {
    teacherLogin.classList.add('hidden');
    teacherDashboard.classList.remove('hidden');
    const a = snapshot?.assessment || {};
    const m = snapshot?.metrics || {};
    $('teacherAssessmentTitle').textContent = `${a.title || 'Assessment'} · ${a.status || '—'}`;
    const email = currentEmail();
    $('teacherReportEmail').textContent = email;
    $('teacherReportEmailInput').value = email;

    backendNotice.classList.toggle('hidden', !localFallback);
    if (localFallback) backendNotice.textContent = 'Modo de contingencia local: el panel y el cuestionario docente funcionan en este navegador, pero los intentos oficiales de estudiantes requieren que las migraciones RPC se apliquen en Supabase.';

    $('teacherMetrics').innerHTML = [
      ['Estado', a.status || '—'], ['Roster esperado', m.roster_total ?? 61], ['11A', m.roster_11a ?? 18], ['11B', m.roster_11b ?? 20], ['11C', m.roster_11c ?? 23],
      ['Intentos visibles', m.attempts_total ?? 0], ['Activos', m.active ?? 0], ['Finalizados', m.submitted ?? 0], ['Anulados', m.invalidated ?? 0], ['Reportes pendientes', m.pending_email_reports ?? 0]
    ].map(([k,v]) => `<div class="summary-row"><strong>${esc(k)}</strong><span>${esc(v)}</span></div>`).join('');

    const controlIds = ['teacherOpenAssessment','teacherPauseAssessment','teacherCloseAssessment','teacherReleaseSolutions','teacherPauseStudent','teacherResumeStudent','teacherForceSubmit','teacherInvalidate','teacherReopen'];
    controlIds.forEach(id => { if ($(id)) $(id).disabled = localFallback || (id.includes('Student') || ['teacherForceSubmit','teacherInvalidate','teacherReopen'].includes(id)); });

    const rosterBody = $('teacherRosterTable').querySelector('tbody');
    rosterBody.innerHTML = '';
    (snapshot?.roster || []).forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${esc(s.group_code)}</td><td>${esc(s.source_position)}</td><td>${esc(s.display_name)}</td><td>${esc(s.definitiva_por_area ?? '—')}</td><td>${esc(s.acumulado_asig_ano ?? '—')}</td><td>${esc(s.source_key ?? '—')}</td>`;
      [...tr.children].forEach(td => { td.style.padding = '8px'; td.style.borderBottom = '1px solid #e5e5e5'; });
      rosterBody.appendChild(tr);
    });
    if (!(snapshot?.roster || []).length) rosterBody.innerHTML = '<tr><td colspan="6" style="padding:12px">Roster remoto no disponible en modo local. Los conteos esperados siguen siendo 18/20/23.</td></tr>';

    const attemptsBody = $('teacherAttemptsTable').querySelector('tbody');
    attemptsBody.innerHTML = '';
    (snapshot?.attempts || []).forEach(aRow => {
      const tr = document.createElement('tr'); tr.style.cursor = 'pointer';
      tr.innerHTML = `<td>${esc(aRow.student_name)}</td><td>${esc(aRow.group_code)}</td><td>${esc(aRow.status)}</td><td>${esc(aRow.answered_count)}/${cfg.questionsPerAttempt}</td><td>${esc(aRow.raw_points ?? '—')}/${cfg.maxRawPoints}</td><td>${esc(aRow.grade ?? '—')}</td><td>${esc(aRow.integrity_strikes ?? 0)}</td><td>${esc(aRow.identity_match_mode ?? '—')}</td><td>${esc(aRow.last_activity_at ? new Date(aRow.last_activity_at).toLocaleTimeString('es-CO') : '—')}</td>`;
      [...tr.children].forEach(td => { td.style.padding = '8px'; td.style.borderBottom = '1px solid #e5e5e5'; });
      tr.addEventListener('click', () => showAttempt(aRow)); attemptsBody.appendChild(tr);
    });

    $('teacherSources').innerHTML = (snapshot?.sources || []).map(src => `<div class="summary-row"><strong>${esc(src.source_system)} · ${esc(src.source_kind)}</strong><span>${esc(src.source_date || src.captured_at || '')}</span></div>`).join('') || '<p class="small">Fuentes remotas no disponibles en modo local.</p>';
  }

  async function showAttempt(attempt) {
    selectedAttempt = attempt;
    const detail = $('teacherAttemptDetail');
    if (localFallback || String(attempt.id).startsWith('LOCAL-')) {
      detail.innerHTML = `<h3>${esc(attempt.student_name)} · ${esc(attempt.status)}</h3><p>Puntaje: ${esc(attempt.raw_points)}/${cfg.maxRawPoints} · Nota: ${esc(attempt.grade)}/${cfg.gradeMax}</p><p class="small">Este es un cuestionario docente local de contingencia. No representa un intento oficial de estudiante.</p>`;
      return;
    }
    detail.textContent = 'Cargando auditoría…';
    try {
      const data = await rpc('teacher_attempt_detail', { p_teacher_token: teacherToken, p_attempt_id: attempt.id });
      const a = data.attempt || {};
      detail.innerHTML = `<h3>${esc(a.student_name_snapshot || a.student_name_entered || a.student_id)} · ${esc(a.status)}</h3><p class="small">Inicio: ${esc(a.started_at ? new Date(a.started_at).toLocaleString('es-CO') : '—')} · Fin: ${esc(a.submitted_at ? new Date(a.submitted_at).toLocaleString('es-CO') : '—')} · Match: ${esc(a.identity_match_mode || '—')} (${esc(a.identity_match_score ?? '—')})</p><h3>Respuestas</h3>${(data.responses || []).map(r => `<div class="notice"><strong>Q${esc(r.question_order)} · ${esc(r.question_id)}</strong><br>${esc(r.prompt)}<br>Marcó: ${esc(r.selected_option)} · Correcta: ${r.is_correct ? 'Sí' : 'No'} · Respuesta canónica: ${esc(r.correct_answer)} · Tiempo: ${r.response_time_ms == null ? '—' : esc((r.response_time_ms / 1000).toFixed(1)) + ' s'}</div>`).join('')}<h3>Timeline</h3>${(data.events || []).map(ev => `<div class="summary-row"><span>${esc(ev.server_timestamp ? new Date(ev.server_timestamp).toLocaleTimeString('es-CO') : '')} · ${esc(ev.event_type)}</span></div>`).join('')}`;
      ['teacherPauseStudent','teacherResumeStudent','teacherForceSubmit','teacherInvalidate','teacherReopen'].forEach(id => $(id).disabled = false);
    } catch (err) { detail.textContent = `No fue posible cargar el intento: ${err.message}`; }
  }

  async function action(name, attemptId = null, confirmText = '') {
    if (localFallback) return setStatus('Ese control requiere el backend Supabase operativo.', true);
    if (confirmText && !confirm(confirmText)) return;
    await rpc('teacher_code_action', { p_teacher_token: teacherToken, p_assessment_slug: cfg.assessmentSlug, p_action: name, p_attempt_id: attemptId });
    await loadDashboard();
  }

  function startLocalTeacherTest(group) {
    if (bank.length !== 18) throw new Error('Banco demo incompleto');
    localTest = { group, index: 0, correct: 0, started_at: new Date().toISOString(), answers: [] };
    $('teacherLocalTest').classList.remove('hidden');
    renderLocalQuestion();
    setStatus(`Cuestionario docente local iniciado para ${group}.`);
  }

  function renderLocalQuestion() {
    const q = bank[localTest.index];
    $('teacherLocalTestProgress').textContent = `Pregunta ${localTest.index + 1} / 18 · ${q.topic}`;
    $('teacherLocalTestBar').style.width = `${(localTest.index + 1) / 18 * 100}%`;
    $('teacherLocalTestScore').textContent = `${localTest.correct} correctas`;
    $('teacherLocalTestPrompt').textContent = q.prompt;
    $('teacherLocalTestResult').innerHTML = '';
    const form = $('teacherLocalTestOptions'); form.innerHTML = '';
    q.options.forEach((opt, i) => {
      const label = document.createElement('label'); label.className = 'option';
      const input = document.createElement('input'); input.type = 'radio'; input.name = 'teacherDemoAnswer'; input.value = String(i);
      input.addEventListener('change', () => $('teacherLocalTestSubmit').disabled = false);
      const span = document.createElement('span'); span.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
      label.append(input, span); form.appendChild(label);
    });
    $('teacherLocalTestSubmit').disabled = true;
  }

  function submitLocalQuestion() {
    if (!localTest) return;
    const selected = $('teacherLocalTestOptions').querySelector('input[name=teacherDemoAnswer]:checked');
    if (!selected) return;
    const q = bank[localTest.index];
    const idx = Number(selected.value); const ok = idx === q.answer;
    if (ok) localTest.correct += 1;
    localTest.answers.push({ question_id: q.id, selected: idx, correct: ok, timestamp: new Date().toISOString() });
    localTest.index += 1;
    if (localTest.index < 18) return renderLocalQuestion();

    const raw = Math.round((15 * localTest.correct / 18) * 100) / 100;
    const grade = Math.round((1 + 4 * localTest.correct / 18) * 100) / 100;
    const finished = { ...localTest, finished_at: new Date().toISOString(), raw_points: raw, grade };
    const demos = JSON.parse(localStorage.getItem(DEMO_KEY) || '[]'); demos.push(finished); localStorage.setItem(DEMO_KEY, JSON.stringify(demos.slice(-30)));
    $('teacherLocalTestPrompt').textContent = 'Test docente finalizado';
    $('teacherLocalTestOptions').innerHTML = '';
    $('teacherLocalTestSubmit').disabled = true;
    $('teacherLocalTestResult').innerHTML = `<div class="summary-row"><strong>Correctas</strong><span>${localTest.correct}/18</span></div><div class="summary-row"><strong>Puntaje</strong><span>${raw}/15</span></div><div class="summary-row"><strong>Nota</strong><span>${grade}/5</span></div>`;
    localTest = null; snapshot = localSnapshot(); renderDashboard();
    prepareEmail(true);
  }

  async function startTeacherTest() {
    const group = $('teacherTestGroup').value;
    if (!group) return setStatus('Selecciona un grupo para el test.', true);
    if (localFallback) return startLocalTeacherTest(group);
    try {
      const result = await rpc('teacher_start_smoke_test', { p_teacher_token: teacherToken, p_assessment_slug: cfg.assessmentSlug, p_group_code: group, p_session_id: crypto.randomUUID(), p_user_agent: navigator.userAgent });
      sessionStorage.setItem(cfg.studentSessionStorageKey, JSON.stringify({ attemptId: result.attempt_id, attemptToken: result.attempt_token, studentLabel: result.student_label, groupCode: result.group_code }));
      const url = new URL(location.href); url.searchParams.delete('teacher'); location.href = url.toString();
    } catch (err) {
      if (isMissingRpc(err)) { localFallback = true; teacherToken = 'LOCAL-FALLBACK'; sessionStorage.setItem(TOKEN_KEY, teacherToken); startLocalTeacherTest(group); renderDashboard(); }
      else throw err;
    }
  }

  async function saveEmail() {
    const email = $('teacherReportEmailInput').value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setStatus('Escribe un correo válido.', true);
    localStorage.setItem(EMAIL_KEY, email); $('teacherReportEmail').textContent = email;
    if (!localFallback) {
      try { await rpc('teacher_set_report_email', { p_teacher_token: teacherToken, p_assessment_slug: cfg.assessmentSlug, p_recipient_email: email }); }
      catch (err) { if (!isMissingRpc(err)) return setStatus(`Correo guardado localmente; backend: ${err.message}`, true); }
    }
    setStatus(`Correo destino guardado: ${email}`);
  }

  function csv(rows, filename) {
    if (!Array.isArray(rows) || !rows.length) return;
    const keys = Object.keys(rows[0]); const quote = v => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const blob = new Blob([[keys.join(','), ...rows.map(row => keys.map(k => quote(row[k])).join(','))].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href);
  }

  function prepareEmail(fromCompletion = false) {
    const recipient = currentEmail(); const m = snapshot?.metrics || {}; const a = snapshot?.assessment || {};
    const demos = JSON.parse(localStorage.getItem(DEMO_KEY) || '[]'); const last = demos.at(-1);
    const subject = `Statistics 11 · Reporte ${a.title || 'Counting & Permutations'}`;
    const body = [`Estado: ${a.status || '—'}`,`Intentos visibles: ${m.attempts_total ?? 0}`,`Finalizados: ${m.submitted ?? 0}`,`Anulados: ${m.invalidated ?? 0}`];
    if (last) body.push('',`Último test docente: ${last.group}`,`Correctas: ${last.correct}/18`,`Puntaje: ${last.raw_points}/15`,`Nota: ${last.grade}/5`);
    body.push('','El detalle completo puede exportarse desde el panel docente.');
    const href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.join('\n'))}`;
    if (fromCompletion) setTimeout(() => { location.href = href; }, 250); else location.href = href;
  }

  $('teacherAccessButton').addEventListener('click', showTeacherPanel);
  $('teacherCloseButton').addEventListener('click', closeTeacherPanel);
  $('teacherLoginForm').addEventListener('submit', async e => { e.preventDefault(); setStatus('Validando código docente…'); try { await login($('teacherCode').value); } catch (err) { setStatus(err.message, true); } });
  $('teacherLogout').addEventListener('click', logout);
  $('teacherRefresh').addEventListener('click', () => loadDashboard().catch(err => setStatus(err.message, true)));
  $('teacherOpenAssessment').addEventListener('click', () => action('OPEN_ASSESSMENT').catch(err => setStatus(err.message, true)));
  $('teacherPauseAssessment').addEventListener('click', () => action('PAUSE_ASSESSMENT').catch(err => setStatus(err.message, true)));
  $('teacherCloseAssessment').addEventListener('click', () => action('CLOSE_ASSESSMENT', null, '¿Cerrar la evaluación para estudiantes?').catch(err => setStatus(err.message, true)));
  $('teacherReleaseSolutions').addEventListener('click', () => action('RELEASE_SOLUTIONS', null, '¿Liberar soluciones y cerrar la evaluación?').catch(err => setStatus(err.message, true)));
  $('teacherStartTest').addEventListener('click', () => startTeacherTest().catch(err => setStatus(err.message, true)));
  $('teacherLocalTestSubmit').addEventListener('click', submitLocalQuestion);
  $('teacherSaveEmail').addEventListener('click', () => saveEmail().catch(err => setStatus(err.message, true)));
  $('teacherPrepareEmail').addEventListener('click', () => prepareEmail(false));
  $('teacherExportAttempts').addEventListener('click', () => csv(snapshot?.attempts || [], 'statistics11_attempts.csv'));
  $('teacherExportRoster').addEventListener('click', () => csv(snapshot?.roster || [], 'statistics11_roster.csv'));
  $('teacherPauseStudent').addEventListener('click', () => selectedAttempt && action('PAUSE_STUDENT', selectedAttempt.id).catch(err => setStatus(err.message, true)));
  $('teacherResumeStudent').addEventListener('click', () => selectedAttempt && action('RESUME_STUDENT', selectedAttempt.id).catch(err => setStatus(err.message, true)));
  $('teacherForceSubmit').addEventListener('click', () => selectedAttempt && action('FORCE_SUBMIT', selectedAttempt.id, '¿Forzar entrega del intento seleccionado?').catch(err => setStatus(err.message, true)));
  $('teacherInvalidate').addEventListener('click', () => selectedAttempt && action('INVALIDATE_ATTEMPT', selectedAttempt.id, '¿Anular el intento seleccionado?').catch(err => setStatus(err.message, true)));
  $('teacherReopen').addEventListener('click', () => selectedAttempt && action('REOPEN_ATTEMPT', selectedAttempt.id, '¿Reabrir el intento seleccionado?').catch(err => setStatus(err.message, true)));

  if (new URL(location.href).searchParams.get('teacher') === '1') showTeacherPanel();
})();
