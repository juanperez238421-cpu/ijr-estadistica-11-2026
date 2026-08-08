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

  function fmtDateTime(value) {
    if (!value) return '—';
    try { return new Date(value).toLocaleString('es-CO', { dateStyle:'short', timeStyle:'medium' }); }
    catch (_) { return String(value); }
  }

  function fmtTime(value) {
    if (!value) return '—';
    try { return new Date(value).toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit', second:'2-digit' }); }
    catch (_) { return String(value); }
  }

  function fmtDuration(seconds) {
    const s = Math.max(0, Number(seconds || 0));
    if (!Number.isFinite(s)) return '—';
    const min = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return `${min}:${String(sec).padStart(2,'0')}`;
  }

  function fmtMs(ms) {
    const n = Number(ms);
    return Number.isFinite(n) && n > 0 ? `${(n / 1000).toFixed(1)} s` : '—';
  }

  function riskLabel(value) {
    return ({ OK:'OK', ATTENTION:'Atención', REVIEW:'Revisar', BLOCKED:'Bloqueado' })[value] || value || 'OK';
  }

  function riskClass(value) {
    return ({ OK:'risk-ok', ATTENTION:'risk-attention', REVIEW:'risk-review', BLOCKED:'risk-blocked' })[value] || 'risk-ok';
  }

  function showTeacherPanel() {
    teacherPanel.classList.remove('hidden');
    $('setupPanel')?.classList.add('hidden');
    $('finishPanel')?.classList.add('hidden');
    window.scrollTo({ top:0, behavior:'smooth' });
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
      const result = await rpc(cfg.teacherRpc.login, { p_code:code, p_user_agent:navigator.userAgent });
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
      try { await rpc(cfg.teacherRpc.logout, { p_teacher_token:teacherToken }); } catch (_) {}
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
      assessment:{ title:'Statistics 11 · Counting & Permutations', status:'LOCAL TEST MODE' },
      metrics:{ roster_total:61, roster_11a:18, roster_11b:20, roster_11c:23, attempts_total:demos.length, active:0, submitted:demos.length, invalidated:0, average_grade:null, email_reuse_flags:0, pending_email_reports:0 },
      roster:[], sources:[], attempts:demos.map((d,i) => ({
        id:`LOCAL-${i}`, student_name:'DOCENTE · TEST LOCAL', student_email:'—', group_code:d.group,
        status:'submitted_local', answered_count:18, raw_points:d.raw_points, grade:d.grade,
        correct_count:d.correct, integrity_strikes:0, identity_match_mode:'local_teacher_test', identity_match_score:1,
        started_at:d.started_at, submitted_at:d.finished_at, last_activity_at:d.finished_at,
        duration_seconds:(new Date(d.finished_at)-new Date(d.started_at))/1000, avg_response_ms:0,
        tab_switches:0, fullscreen_exits:0, screenshot_attempts:0, clipboard_attempts:0,
        duplicate_tab_events:0, hidden_ms:0, email_reuse_count:0, integrity_risk:'OK'
      })),
      report_email:currentEmail()
    };
  }

  async function loadDashboard() {
    if (!teacherToken) return;
    setStatus('Actualizando panel docente…');
    if (localFallback) {
      snapshot = localSnapshot();
      renderDashboard();
      setStatus('Modo docente local de contingencia. Los datos oficiales requieren las RPC de Supabase.', true);
      return;
    }
    try {
      snapshot = await rpc(cfg.teacherRpc.snapshot, { p_teacher_token:teacherToken, p_assessment_slug:cfg.assessmentSlug });
      renderDashboard();
      setStatus('');
    } catch (err) {
      if (!isMissingRpc(err)) throw err;
      localFallback = true;
      teacherToken = 'LOCAL-FALLBACK';
      sessionStorage.setItem(TOKEN_KEY, teacherToken);
      snapshot = localSnapshot();
      renderDashboard();
      setStatus('Supabase no expone temporalmente las RPC. Se activó el modo local de contingencia.', true);
    }
  }

  function renderDashboard() {
    teacherLogin.classList.add('hidden');
    teacherDashboard.classList.remove('hidden');
    const a = snapshot?.assessment || {};
    const m = snapshot?.metrics || {};
    const attempts = snapshot?.attempts || [];
    $('teacherAssessmentTitle').textContent = `${a.title || 'Assessment'} · ${a.status || '—'}`;

    const email = currentEmail();
    $('teacherReportEmail').textContent = email;
    $('teacherReportEmailInput').value = email;

    backendNotice.classList.toggle('hidden', !localFallback);
    if (localFallback) backendNotice.textContent = 'Modo de contingencia local: no muestra registros oficiales de estudiantes.';

    const metricRows = [
      ['Estado',a.status || '—'],['Roster',m.roster_total ?? 61],['Intentos',m.attempts_total ?? 0],
      ['Activos',m.active ?? 0],['Finalizados',m.submitted ?? 0],['Anulados',m.invalidated ?? 0],
      ['Promedio',m.average_grade ?? '—'],['Correos repetidos',m.email_reuse_flags ?? 0],['Reportes pendientes',m.pending_email_reports ?? 0],
      ['11A/11B/11C',`${m.roster_11a ?? 18}/${m.roster_11b ?? 20}/${m.roster_11c ?? 23}`]
    ];
    $('teacherMetrics').innerHTML = metricRows.map(([k,v]) => `<div class="metric-card"><span class="metric-label">${esc(k)}</span><span class="metric-value">${esc(v)}</span></div>`).join('');

    const official = attempts.filter(x => !String(x.student_id || '').startsWith('TEST-'));
    const graded = official.filter(x => Number.isFinite(Number(x.grade)));
    const avgGrade = graded.length ? graded.reduce((s,x) => s + Number(x.grade),0) / graded.length : null;
    const avgDuration = official.length ? official.reduce((s,x) => s + Number(x.duration_seconds || 0),0) / official.length : 0;
    const reviewCount = official.filter(x => ['ATTENTION','REVIEW','BLOCKED'].includes(x.integrity_risk)).length;
    const emailReuse = new Set(official.filter(x => Number(x.email_reuse_count || 0) > 1).map(x => String(x.student_email || '').toLowerCase())).size;
    $('teacherAnalyticsSummary').innerHTML = [
      ['Nota promedio',avgGrade == null ? '—' : avgGrade.toFixed(2)],
      ['Duración promedio',fmtDuration(avgDuration)],
      ['Revisión recomendada',reviewCount],
      ['Correos reutilizados',emailReuse]
    ].map(([k,v]) => `<div class="analytics-pill">${esc(k)}<strong>${esc(v)}</strong></div>`).join('');

    const controlIds = ['teacherOpenAssessment','teacherPauseAssessment','teacherCloseAssessment','teacherReleaseSolutions','teacherPauseStudent','teacherResumeStudent','teacherForceSubmit','teacherInvalidate','teacherReopen'];
    controlIds.forEach(id => { if ($(id)) $(id).disabled = localFallback || id.includes('Student') || ['teacherForceSubmit','teacherInvalidate','teacherReopen'].includes(id); });

    const rosterBody = $('teacherRosterTable').querySelector('tbody');
    rosterBody.innerHTML = '';
    (snapshot?.roster || []).forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${esc(s.group_code)}</td><td>${esc(s.source_position)}</td><td>${esc(s.display_name)}</td><td>${esc(s.definitiva_por_area ?? '—')}</td><td>${esc(s.acumulado_asig_ano ?? '—')}</td><td>${esc(s.source_key ?? '—')}</td>`;
      rosterBody.appendChild(tr);
    });
    if (!(snapshot?.roster || []).length) rosterBody.innerHTML = '<tr><td colspan="6">Roster remoto no disponible en modo local.</td></tr>';

    $('teacherSources').innerHTML = (snapshot?.sources || []).map(src => `<div class="summary-row"><strong>${esc(src.source_system)} · ${esc(src.source_kind)}</strong><span>${esc(src.source_date || src.captured_at || '')}</span></div>`).join('') || '<p class="small">Fuentes remotas no disponibles en modo local.</p>';
    renderAttempts();
  }

  function filteredAttempts() {
    const rows = Array.from(snapshot?.attempts || []);
    const search = String($('teacherAttemptSearch')?.value || '').trim().toLowerCase();
    const group = $('teacherAttemptGroupFilter')?.value || '';
    const status = $('teacherAttemptStatusFilter')?.value || '';
    const risk = $('teacherIntegrityFilter')?.value || '';

    return rows.filter(row => {
      const haystack = `${row.student_name || ''} ${row.student_name_entered || ''} ${row.student_email || ''}`.toLowerCase();
      if (search && !haystack.includes(search)) return false;
      if (group && row.group_code !== group) return false;
      if (risk && (row.integrity_risk || 'OK') !== risk) return false;
      if (status === 'active' && row.status !== 'active') return false;
      if (status === 'submitted' && !['submitted','force_submitted'].includes(row.status)) return false;
      if (status === 'invalidated' && !String(row.status || '').includes('invalidated')) return false;
      return true;
    });
  }

  function renderAttempts() {
    const rows = filteredAttempts();
    const all = snapshot?.attempts || [];
    $('teacherAttemptCount').textContent = `Mostrando ${rows.length} de ${all.length} intentos. Haz clic en una fila para abrir la auditoría completa.`;
    const body = $('teacherAttemptsTable').querySelector('tbody');
    body.innerHTML = '';

    rows.forEach(aRow => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      const risk = aRow.integrity_risk || (String(aRow.status || '').includes('invalidated') ? 'BLOCKED' : (Number(aRow.integrity_strikes || 0) ? 'ATTENTION' : 'OK'));
      tr.innerHTML = `
        <td><strong>${esc(aRow.student_name)}</strong><br><span class="small">${esc(aRow.identity_match_mode || '—')}</span></td>
        <td>${esc(aRow.student_email || '—')}${Number(aRow.email_reuse_count || 0)>1 ? `<br><span class="risk-chip risk-review">usado ${esc(aRow.email_reuse_count)} veces</span>` : ''}</td>
        <td>${esc(aRow.group_code)}</td>
        <td>${esc(aRow.status)}</td>
        <td>${esc(aRow.answered_count ?? 0)}/${cfg.questionsPerAttempt}</td>
        <td>${esc(aRow.raw_points ?? '—')}/${cfg.maxRawPoints}</td>
        <td>${esc(aRow.grade ?? '—')}</td>
        <td>${esc(aRow.correct_count ?? '—')}</td>
        <td>${esc(fmtDuration(aRow.duration_seconds))}</td>
        <td>${esc(fmtMs(aRow.avg_response_ms))}</td>
        <td>${esc(aRow.integrity_strikes ?? 0)}/${cfg.tabStrikeLimit}</td>
        <td><span class="risk-chip ${riskClass(risk)}">${esc(riskLabel(risk))}</span></td>
        <td>${esc(fmtTime(aRow.started_at))}</td>
        <td>${esc(fmtTime(aRow.last_activity_at))}</td>`;
      tr.addEventListener('click', () => showAttempt(aRow));
      body.appendChild(tr);
    });

    if (!rows.length) body.innerHTML = '<tr><td colspan="14">No hay intentos que coincidan con los filtros.</td></tr>';
  }

  async function showAttempt(attempt) {
    selectedAttempt = attempt;
    const detail = $('teacherAttemptDetail');
    if (localFallback || String(attempt.id).startsWith('LOCAL-')) {
      detail.innerHTML = `<h3>${esc(attempt.student_name)} · ${esc(attempt.status)}</h3><p>Puntaje: ${esc(attempt.raw_points)}/${cfg.maxRawPoints} · Nota: ${esc(attempt.grade)}/${cfg.gradeMax}</p><p class="small">Test local del docente; no es un intento oficial.</p>`;
      return;
    }

    detail.textContent = 'Cargando auditoría completa…';
    try {
      const data = await rpc(cfg.teacherRpc.detail, { p_teacher_token:teacherToken, p_attempt_id:attempt.id });
      const a = data.attempt || {};
      const responses = data.responses || [];
      const events = data.events || [];
      const hiddenMs = events.reduce((sum,e) => sum + (e.event_type === 'VISIBILITY_VISIBLE' ? Number(e.metadata?.hidden_duration_ms || 0) : 0),0);
      const avgResponse = responses.filter(r => r.response_time_ms != null).length
        ? responses.filter(r => r.response_time_ms != null).reduce((s,r) => s + Number(r.response_time_ms),0) / responses.filter(r => r.response_time_ms != null).length
        : 0;
      const eventCount = type => events.filter(e => e.event_type === type).length;
      const risk = attempt.integrity_risk || (String(a.status || '').includes('invalidated') ? 'BLOCKED' : 'OK');

      const cards = [
        ['Nombre registrado',a.student_name_snapshot || a.student_name_entered || a.student_id],
        ['Nombre escrito',a.student_name_entered || '—'],
        ['Correo',a.student_email || attempt.student_email || '—'],
        ['Grupo',a.group_code || '—'],
        ['Estado',a.status || '—'],
        ['Integridad',riskLabel(risk)],
        ['Inicio',fmtDateTime(a.started_at)],
        ['Vence',fmtDateTime(a.expires_at)],
        ['Última actividad',fmtDateTime(a.last_activity_at)],
        ['Entrega',fmtDateTime(a.submitted_at)],
        ['Puntaje',a.raw_points == null ? '—' : `${a.raw_points}/${cfg.maxRawPoints}`],
        ['Nota',a.grade == null ? '—' : `${a.grade}/${cfg.gradeMax}`],
        ['Correctas',a.correct_count ?? responses.filter(r => r.is_correct).length],
        ['Promedio/pregunta',fmtMs(avgResponse)],
        ['Fuera de pestaña',fmtMs(hiddenMs)],
        ['Strikes',`${a.integrity_strikes ?? 0}/${cfg.tabStrikeLimit}`],
        ['Match',`${a.identity_match_mode || '—'} (${a.identity_match_score ?? '—'})`],
        ['Session ID',a.session_id || '—'],
        ['User agent',a.user_agent || '—'],
        ['Razón de cierre',a.finish_reason || '—']
      ];

      const eventSummary = [
        ['Cambios pestaña',attempt.tab_switches ?? 0],
        ['Pantalla completa',eventCount('FULLSCREEN_EXIT')],
        ['PrintScreen',eventCount('SCREENSHOT_KEY_ATTEMPT')],
        ['Clipboard',events.filter(e => ['COPY_ATTEMPT','CUT_ATTEMPT','PASTE_ATTEMPT'].includes(e.event_type)).length],
        ['Segunda pestaña',eventCount('SECOND_TAB_DETECTED')],
        ['Blur ventana',eventCount('WINDOW_BLUR')]
      ];

      detail.innerHTML = `
        <div class="detail-grid">${cards.map(([k,v]) => `<div class="detail-card"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div>
        <div class="analytics-strip">${eventSummary.map(([k,v]) => `<div class="analytics-pill">${esc(k)}<strong>${esc(v)}</strong></div>`).join('')}</div>
        <h3>Respuestas (${responses.length}/${cfg.questionsPerAttempt})</h3>
        ${responses.map(r => `<div class="response-audit ${r.is_correct ? 'correct' : 'incorrect'}"><strong>Q${esc(r.question_order)} · ${esc(r.question_id)} · ${r.is_correct ? 'Correcta' : 'Incorrecta'}</strong><div>${esc(r.prompt)}</div><div class="small">Marcó: ${esc(r.selected_option)} · Respuesta canónica: ${esc(r.correct_answer)} · Tiempo: ${esc(fmtMs(r.response_time_ms))} · Cambios de selección: ${esc(r.selection_changes ?? 0)}</div><div class="small">Vista: ${esc(fmtTime(r.first_viewed_at))} · Primera selección: ${esc(fmtTime(r.first_selected_at))} · Envío: ${esc(fmtTime(r.submitted_at))}</div></div>`).join('') || '<p>Sin respuestas registradas.</p>'}
        <h3>Timeline (${events.length} eventos)</h3>
        <div>${events.map(ev => `<div class="timeline-row"><span>${esc(fmtTime(ev.server_timestamp))}</span><strong>${esc(ev.event_type)}</strong><span>${esc(ev.metadata && Object.keys(ev.metadata).length ? JSON.stringify(ev.metadata) : '')}</span></div>`).join('') || '<p>Sin eventos.</p>'}</div>`;

      ['teacherPauseStudent','teacherResumeStudent','teacherForceSubmit','teacherInvalidate','teacherReopen'].forEach(id => { $(id).disabled = false; });
    } catch (err) {
      detail.textContent = `No fue posible cargar el intento: ${err.message}`;
    }
  }

  async function action(name, attemptId = null, confirmText = '') {
    if (localFallback) return setStatus('Ese control requiere el backend Supabase operativo.', true);
    if (confirmText && !confirm(confirmText)) return;
    await rpc(cfg.teacherRpc.action, { p_teacher_token:teacherToken, p_assessment_slug:cfg.assessmentSlug, p_action:name, p_attempt_id:attemptId });
    await loadDashboard();
  }

  function startLocalTeacherTest(group) {
    if (bank.length !== 18) throw new Error('Banco demo incompleto');
    localTest = { group,index:0,correct:0,started_at:new Date().toISOString(),answers:[] };
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
    const form = $('teacherLocalTestOptions');
    form.innerHTML = '';
    q.options.forEach((opt,i) => {
      const label = document.createElement('label'); label.className = 'option';
      const input = document.createElement('input'); input.type = 'radio'; input.name = 'teacherDemoAnswer'; input.value = String(i);
      input.addEventListener('change', () => { $('teacherLocalTestSubmit').disabled = false; });
      const span = document.createElement('span'); span.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
      label.append(input,span); form.appendChild(label);
    });
    $('teacherLocalTestSubmit').disabled = true;
  }

  function submitLocalQuestion() {
    if (!localTest) return;
    const selected = $('teacherLocalTestOptions').querySelector('input[name=teacherDemoAnswer]:checked');
    if (!selected) return;
    const q = bank[localTest.index];
    const idx = Number(selected.value);
    const ok = idx === q.answer;
    if (ok) localTest.correct += 1;
    localTest.answers.push({ question_id:q.id,selected:idx,correct:ok,timestamp:new Date().toISOString() });
    localTest.index += 1;
    if (localTest.index < 18) return renderLocalQuestion();

    const raw = Math.round((15 * localTest.correct / 18) * 100) / 100;
    const grade = Math.round((1 + 4 * localTest.correct / 18) * 100) / 100;
    const finished = { ...localTest,finished_at:new Date().toISOString(),raw_points:raw,grade };
    const demos = JSON.parse(localStorage.getItem(DEMO_KEY) || '[]');
    demos.push(finished);
    localStorage.setItem(DEMO_KEY, JSON.stringify(demos.slice(-30)));
    $('teacherLocalTestPrompt').textContent = 'Test docente finalizado';
    $('teacherLocalTestOptions').innerHTML = '';
    $('teacherLocalTestSubmit').disabled = true;
    $('teacherLocalTestResult').innerHTML = `<div class="summary-row"><strong>Correctas</strong><span>${localTest.correct}/18</span></div><div class="summary-row"><strong>Puntaje</strong><span>${raw}/15</span></div><div class="summary-row"><strong>Nota</strong><span>${grade}/5</span></div>`;
    localTest = null;
    snapshot = localSnapshot();
    renderDashboard();
  }

  async function startTeacherTest() {
    const group = $('teacherTestGroup').value;
    if (!group) return setStatus('Selecciona un grupo para el test.', true);
    if (localFallback) return startLocalTeacherTest(group);
    try {
      const result = await rpc(cfg.teacherRpc.startTest, {
        p_teacher_token:teacherToken,p_assessment_slug:cfg.assessmentSlug,p_group_code:group,
        p_session_id:crypto.randomUUID(),p_user_agent:navigator.userAgent
      });
      sessionStorage.setItem(cfg.studentSessionStorageKey, JSON.stringify({
        attemptId:result.attempt_id,attemptToken:result.attempt_token,studentLabel:result.student_label,studentEmail:'',groupCode:result.group_code
      }));
      const url = new URL(location.href);
      url.searchParams.delete('teacher');
      location.href = url.toString();
    } catch (err) {
      if (isMissingRpc(err)) {
        localFallback = true;
        teacherToken = 'LOCAL-FALLBACK';
        sessionStorage.setItem(TOKEN_KEY,teacherToken);
        startLocalTeacherTest(group);
        renderDashboard();
      } else throw err;
    }
  }

  async function saveEmail() {
    const email = $('teacherReportEmailInput').value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setStatus('Escribe un correo válido.', true);
    localStorage.setItem(EMAIL_KEY,email);
    $('teacherReportEmail').textContent = email;
    if (!localFallback && cfg.teacherRpc.setEmail) {
      try {
        await rpc(cfg.teacherRpc.setEmail, { p_teacher_token:teacherToken,p_assessment_slug:cfg.assessmentSlug,p_recipient_email:email });
      } catch (err) {
        if (!isMissingRpc(err)) return setStatus(`Correo guardado localmente; backend: ${err.message}`, true);
      }
    }
    setStatus(`Correo destino guardado: ${email}`);
  }

  function csv(rows, filename) {
    if (!Array.isArray(rows) || !rows.length) return setStatus('No hay datos para exportar.', true);
    const keys = Object.keys(rows[0]);
    const quote = v => `"${String(typeof v === 'object' && v !== null ? JSON.stringify(v) : (v ?? '')).replaceAll('"','""')}"`;
    const blob = new Blob([[keys.join(','),...rows.map(row => keys.map(k => quote(row[k])).join(','))].join('\n')], { type:'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function prepareEmail() {
    const recipient = currentEmail();
    const m = snapshot?.metrics || {};
    const a = snapshot?.assessment || {};
    const subject = `Statistics 11 · Reporte ${a.title || 'Counting & Permutations'}`;
    const body = [
      `Estado: ${a.status || '—'}`,
      `Intentos: ${m.attempts_total ?? 0}`,
      `Activos: ${m.active ?? 0}`,
      `Finalizados: ${m.submitted ?? 0}`,
      `Anulados: ${m.invalidated ?? 0}`,
      `Promedio: ${m.average_grade ?? '—'}`,
      `Correos reutilizados: ${m.email_reuse_flags ?? 0}`,
      '',
      'El detalle completo de cada estudiante, respuestas y timeline puede exportarse desde el panel docente.'
    ];
    location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.join('\n'))}`;
  }

  $('teacherAccessButton').addEventListener('click', showTeacherPanel);
  $('teacherCloseButton').addEventListener('click', closeTeacherPanel);
  $('teacherLoginForm').addEventListener('submit', async e => { e.preventDefault();setStatus('Validando código docente…');try { await login($('teacherCode').value); } catch (err) { setStatus(err.message,true); } });
  $('teacherLogout').addEventListener('click', logout);
  $('teacherRefresh').addEventListener('click', () => loadDashboard().catch(err => setStatus(err.message,true)));
  $('teacherOpenAssessment').addEventListener('click', () => action('OPEN_ASSESSMENT').catch(err => setStatus(err.message,true)));
  $('teacherPauseAssessment').addEventListener('click', () => action('PAUSE_ASSESSMENT').catch(err => setStatus(err.message,true)));
  $('teacherCloseAssessment').addEventListener('click', () => action('CLOSE_ASSESSMENT',null,'¿Cerrar la evaluación para estudiantes?').catch(err => setStatus(err.message,true)));
  $('teacherReleaseSolutions').addEventListener('click', () => action('RELEASE_SOLUTIONS',null,'¿Liberar soluciones y cerrar la evaluación?').catch(err => setStatus(err.message,true)));
  $('teacherStartTest').addEventListener('click', () => startTeacherTest().catch(err => setStatus(err.message,true)));
  $('teacherLocalTestSubmit').addEventListener('click', submitLocalQuestion);
  $('teacherSaveEmail').addEventListener('click', () => saveEmail().catch(err => setStatus(err.message,true)));
  $('teacherPrepareEmail').addEventListener('click', prepareEmail);
  $('teacherExportAttempts').addEventListener('click', () => csv(snapshot?.attempts || [],'statistics11_attempts_full_audit.csv'));
  $('teacherExportRoster').addEventListener('click', () => csv(snapshot?.roster || [],'statistics11_roster.csv'));
  $('teacherPauseStudent').addEventListener('click', () => selectedAttempt && action('PAUSE_STUDENT',selectedAttempt.id).catch(err => setStatus(err.message,true)));
  $('teacherResumeStudent').addEventListener('click', () => selectedAttempt && action('RESUME_STUDENT',selectedAttempt.id).catch(err => setStatus(err.message,true)));
  $('teacherForceSubmit').addEventListener('click', () => selectedAttempt && action('FORCE_SUBMIT',selectedAttempt.id,'¿Forzar entrega del intento seleccionado?').catch(err => setStatus(err.message,true)));
  $('teacherInvalidate').addEventListener('click', () => selectedAttempt && action('INVALIDATE_ATTEMPT',selectedAttempt.id,'¿Anular el intento seleccionado?').catch(err => setStatus(err.message,true)));
  $('teacherReopen').addEventListener('click', () => selectedAttempt && action('REOPEN_ATTEMPT',selectedAttempt.id,'¿Reabrir el intento seleccionado?').catch(err => setStatus(err.message,true)));

  ['teacherAttemptSearch','teacherAttemptGroupFilter','teacherAttemptStatusFilter','teacherIntegrityFilter'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener(id === 'teacherAttemptSearch' ? 'input' : 'change', renderAttempts);
  });

  if (new URL(location.href).searchParams.get('teacher') === '1') showTeacherPanel();
})();
