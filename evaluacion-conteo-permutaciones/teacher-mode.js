(() => {
  'use strict';

  const cfg = window.IJR_ASSESSMENT_CONFIG;
  const $ = id => document.getElementById(id);
  if (!cfg || !$('teacherAccessButton')) return;

  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  const TOKEN_KEY = 'ijr-stat11-teacher-code-session-v1';
  let teacherToken = sessionStorage.getItem(TOKEN_KEY) || '';
  let snapshot = null;
  let selectedAttempt = null;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const teacherPanel = $('teacherPanel');
  const teacherLogin = $('teacherLogin');
  const teacherDashboard = $('teacherDashboard');
  const teacherStatus = $('teacherStatus');

  async function rpc(name, args = {}) {
    const { data, error } = await sb.rpc(name, args);
    if (error) throw new Error(error.message || 'Backend error');
    return data;
  }

  function setStatus(message, isError = false) {
    teacherStatus.textContent = message || '';
    teacherStatus.style.color = isError ? '#8b1e1e' : '';
  }

  function showTeacherPanel() {
    teacherPanel.classList.remove('hidden');
    $('setupPanel')?.classList.add('hidden');
    $('finishPanel')?.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (teacherToken) loadDashboard().catch(() => {
      teacherToken = '';
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

  function csv(rows, filename) {
    if (!Array.isArray(rows) || !rows.length) return;
    const keys = Object.keys(rows[0]);
    const quote = v => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const lines = [keys.join(','), ...rows.map(row => keys.map(key => quote(typeof row[key] === 'object' ? JSON.stringify(row[key]) : row[key])).join(','))];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function login(code) {
    const result = await rpc('teacher_code_login', {
      p_code: code,
      p_user_agent: navigator.userAgent
    });
    teacherToken = result.teacher_token;
    sessionStorage.setItem(TOKEN_KEY, teacherToken);
    $('teacherCode').value = '';
    await loadDashboard();
  }

  async function logout() {
    if (teacherToken) {
      try { await rpc('teacher_code_logout', { p_teacher_token: teacherToken }); } catch (_) {}
    }
    teacherToken = '';
    snapshot = null;
    selectedAttempt = null;
    sessionStorage.removeItem(TOKEN_KEY);
    teacherDashboard.classList.add('hidden');
    teacherLogin.classList.remove('hidden');
    setStatus('Sesión docente cerrada.');
  }

  async function loadDashboard() {
    if (!teacherToken) return;
    setStatus('Actualizando panel docente…');
    snapshot = await rpc('teacher_dashboard_snapshot', {
      p_teacher_token: teacherToken,
      p_assessment_slug: cfg.assessmentSlug
    });
    teacherLogin.classList.add('hidden');
    teacherDashboard.classList.remove('hidden');
    renderDashboard();
    setStatus('');
  }

  function renderDashboard() {
    const a = snapshot.assessment || {};
    const m = snapshot.metrics || {};
    $('teacherAssessmentTitle').textContent = `${a.title || 'Assessment'} · ${a.status || '—'}`;
    $('teacherReportEmail').textContent = snapshot.report_email || cfg.reportEmail || '—';
    $('teacherMetrics').innerHTML = [
      ['Estado', a.status || '—'],
      ['Roster', m.roster_total ?? 0],
      ['11A', m.roster_11a ?? 0],
      ['11B', m.roster_11b ?? 0],
      ['11C', m.roster_11c ?? 0],
      ['Intentos', m.attempts_total ?? 0],
      ['Activos', m.active ?? 0],
      ['Finalizados', m.submitted ?? 0],
      ['Anulados', m.invalidated ?? 0],
      ['Reportes correo pendientes', m.pending_email_reports ?? 0]
    ].map(([k,v]) => `<div class="summary-row"><strong>${esc(k)}</strong><span>${esc(v)}</span></div>`).join('');

    const rosterBody = $('teacherRosterTable').querySelector('tbody');
    rosterBody.innerHTML = '';
    (snapshot.roster || []).forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${esc(s.group_code)}</td><td>${esc(s.source_position)}</td><td>${esc(s.display_name)}</td><td>${esc(s.definitiva_por_area ?? '—')}</td><td>${esc(s.acumulado_asig_ano ?? '—')}</td><td>${esc(s.source_key ?? '—')}</td>`;
      [...tr.children].forEach(td => { td.style.padding = '8px'; td.style.borderBottom = '1px solid #e5e5e5'; });
      rosterBody.appendChild(tr);
    });

    const attemptsBody = $('teacherAttemptsTable').querySelector('tbody');
    attemptsBody.innerHTML = '';
    (snapshot.attempts || []).forEach(aRow => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      if (selectedAttempt?.id === aRow.id) tr.style.background = '#f1f1f1';
      tr.innerHTML = `<td>${esc(aRow.student_name)}</td><td>${esc(aRow.group_code)}</td><td>${esc(aRow.status)}</td><td>${esc(aRow.answered_count)}/${cfg.questionsPerAttempt}</td><td>${esc(aRow.raw_points ?? '—')}/${cfg.maxRawPoints}</td><td>${esc(aRow.grade ?? '—')}</td><td>${esc(aRow.integrity_strikes ?? 0)}</td><td>${esc(aRow.identity_match_mode ?? '—')}</td><td>${esc(aRow.last_activity_at ? new Date(aRow.last_activity_at).toLocaleTimeString('es-CO') : '—')}</td>`;
      [...tr.children].forEach(td => { td.style.padding = '8px'; td.style.borderBottom = '1px solid #e5e5e5'; });
      tr.addEventListener('click', () => showAttempt(aRow));
      attemptsBody.appendChild(tr);
    });

    $('teacherSources').innerHTML = (snapshot.sources || []).map(src => `<div class="summary-row"><strong>${esc(src.source_system)} · ${esc(src.source_kind)}</strong><span>${esc(src.source_date || src.captured_at || '')}</span></div>`).join('') || '<p class="small">Sin fuentes registradas.</p>';
  }

  async function showAttempt(attempt) {
    selectedAttempt = attempt;
    renderDashboard();
    const detail = $('teacherAttemptDetail');
    detail.textContent = 'Cargando auditoría…';
    try {
      const data = await rpc('teacher_attempt_detail', {
        p_teacher_token: teacherToken,
        p_attempt_id: attempt.id
      });
      const a = data.attempt || {};
      detail.innerHTML = `
        <h3>${esc(a.student_name_snapshot || a.student_name_entered || a.student_id)} · ${esc(a.status)}</h3>
        <p class="small">Inicio: ${esc(a.started_at ? new Date(a.started_at).toLocaleString('es-CO') : '—')} · Fin: ${esc(a.submitted_at ? new Date(a.submitted_at).toLocaleString('es-CO') : '—')} · Match: ${esc(a.identity_match_mode || '—')} (${esc(a.identity_match_score ?? '—')})</p>
        <h3>Respuestas</h3>
        ${(data.responses || []).map(r => `<div class="notice"><strong>Q${esc(r.question_order)} · ${esc(r.question_id)}</strong><br>${esc(r.prompt)}<br>Marcó: ${esc(r.selected_option)} · Correcta: ${r.is_correct ? 'Sí' : 'No'} · Respuesta canónica: ${esc(r.correct_answer)} · Tiempo: ${r.response_time_ms == null ? '—' : esc((r.response_time_ms / 1000).toFixed(1)) + ' s'} · Cambios: ${esc(r.selection_changes ?? 0)}</div>`).join('') || '<p class="small">Sin respuestas todavía.</p>'}
        <h3>Timeline</h3>
        ${(data.events || []).map(ev => `<div class="summary-row"><span>${esc(ev.server_timestamp ? new Date(ev.server_timestamp).toLocaleTimeString('es-CO') : '')} · ${esc(ev.event_type)}${ev.question_id ? ' · ' + esc(ev.question_id) : ''}</span><span>${ev.metadata && Object.keys(ev.metadata).length ? esc(JSON.stringify(ev.metadata)) : ''}</span></div>`).join('') || '<p class="small">Sin eventos.</p>'}
      `;
      ['teacherPauseStudent','teacherResumeStudent','teacherForceSubmit','teacherInvalidate','teacherReopen'].forEach(id => $(id).disabled = false);
    } catch (err) {
      detail.textContent = `No fue posible cargar el intento: ${err.message}`;
    }
  }

  async function action(name, attemptId = null, confirmText = '') {
    if (confirmText && !confirm(confirmText)) return;
    await rpc('teacher_code_action', {
      p_teacher_token: teacherToken,
      p_assessment_slug: cfg.assessmentSlug,
      p_action: name,
      p_attempt_id: attemptId
    });
    await loadDashboard();
  }

  async function startTeacherTest() {
    const group = $('teacherTestGroup').value;
    if (!group) return setStatus('Selecciona un grupo para el test.', true);
    setStatus(`Creando test docente ${group}…`);
    const sessionId = crypto.randomUUID();
    const result = await rpc('teacher_start_smoke_test', {
      p_teacher_token: teacherToken,
      p_assessment_slug: cfg.assessmentSlug,
      p_group_code: group,
      p_session_id: sessionId,
      p_user_agent: navigator.userAgent
    });
    sessionStorage.setItem(cfg.studentSessionStorageKey, JSON.stringify({
      attemptId: result.attempt_id,
      attemptToken: result.attempt_token,
      studentLabel: result.student_label,
      groupCode: result.group_code
    }));
    const url = new URL(location.href);
    url.searchParams.delete('teacher');
    location.href = url.toString();
  }

  function exportAttempts() {
    csv((snapshot?.attempts || []).map(a => ({
      student_name: a.student_name,
      group_code: a.group_code,
      status: a.status,
      answered_count: a.answered_count,
      raw_points: a.raw_points,
      grade: a.grade,
      integrity_strikes: a.integrity_strikes,
      identity_match_mode: a.identity_match_mode,
      identity_match_score: a.identity_match_score,
      started_at: a.started_at,
      submitted_at: a.submitted_at,
      last_activity_at: a.last_activity_at
    })), 'statistics11_attempts.csv');
  }

  function exportRoster() {
    csv((snapshot?.roster || []).map(s => ({
      group_code: s.group_code,
      source_position: s.source_position,
      student_name: s.display_name,
      definitiva_por_area: s.definitiva_por_area,
      acumulado_asig_ano: s.acumulado_asig_ano,
      source_key: s.source_key,
      source_date: s.source_date
    })), 'statistics11_roster_academic.csv');
  }

  function prepareEmail() {
    const recipient = snapshot?.report_email || cfg.reportEmail || 'juanperez238421@gmail.com';
    const m = snapshot?.metrics || {};
    const a = snapshot?.assessment || {};
    const subject = `Statistics 11 · Reporte ${a.title || 'Counting & Permutations'}`;
    const body = [
      `Estado: ${a.status || '—'}`,
      `Intentos: ${m.attempts_total ?? 0}`,
      `Activos: ${m.active ?? 0}`,
      `Finalizados: ${m.submitted ?? 0}`,
      `Anulados: ${m.invalidated ?? 0}`,
      `Reportes automáticos pendientes de transporte de correo: ${m.pending_email_reports ?? 0}`,
      '',
      'El detalle completo puede exportarse desde el panel docente.'
    ].join('\n');
    location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  $('teacherAccessButton').addEventListener('click', showTeacherPanel);
  $('teacherCloseButton').addEventListener('click', closeTeacherPanel);
  $('teacherLoginForm').addEventListener('submit', async e => {
    e.preventDefault();
    setStatus('Validando código docente…');
    try { await login($('teacherCode').value); }
    catch (err) { setStatus(err.message, true); }
  });
  $('teacherLogout').addEventListener('click', logout);
  $('teacherRefresh').addEventListener('click', () => loadDashboard().catch(err => setStatus(err.message, true)));
  $('teacherOpenAssessment').addEventListener('click', () => action('OPEN_ASSESSMENT').catch(err => setStatus(err.message, true)));
  $('teacherPauseAssessment').addEventListener('click', () => action('PAUSE_ASSESSMENT').catch(err => setStatus(err.message, true)));
  $('teacherCloseAssessment').addEventListener('click', () => action('CLOSE_ASSESSMENT', null, '¿Cerrar la evaluación para estudiantes?').catch(err => setStatus(err.message, true)));
  $('teacherReleaseSolutions').addEventListener('click', () => action('RELEASE_SOLUTIONS', null, '¿Liberar soluciones y cerrar la evaluación?').catch(err => setStatus(err.message, true)));
  $('teacherStartTest').addEventListener('click', () => startTeacherTest().catch(err => setStatus(err.message, true)));
  $('teacherExportAttempts').addEventListener('click', exportAttempts);
  $('teacherExportRoster').addEventListener('click', exportRoster);
  $('teacherPrepareEmail').addEventListener('click', prepareEmail);
  $('teacherPauseStudent').addEventListener('click', () => selectedAttempt && action('PAUSE_STUDENT', selectedAttempt.id).catch(err => setStatus(err.message, true)));
  $('teacherResumeStudent').addEventListener('click', () => selectedAttempt && action('RESUME_STUDENT', selectedAttempt.id).catch(err => setStatus(err.message, true)));
  $('teacherForceSubmit').addEventListener('click', () => selectedAttempt && action('FORCE_SUBMIT', selectedAttempt.id, '¿Forzar entrega del intento seleccionado?').catch(err => setStatus(err.message, true)));
  $('teacherInvalidate').addEventListener('click', () => selectedAttempt && action('INVALIDATE_ATTEMPT', selectedAttempt.id, '¿Anular el intento seleccionado?').catch(err => setStatus(err.message, true)));
  $('teacherReopen').addEventListener('click', () => selectedAttempt && action('REOPEN_ATTEMPT', selectedAttempt.id, '¿Reabrir el intento seleccionado?').catch(err => setStatus(err.message, true)));

  if (new URL(location.href).searchParams.get('teacher') === '1') showTeacherPanel();
})();
