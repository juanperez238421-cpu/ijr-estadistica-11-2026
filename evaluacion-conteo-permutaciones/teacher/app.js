(() => {
  'use strict';

  const cfg = window.IJR_ASSESSMENT_CONFIG;
  const $ = (id) => document.getElementById(id);
  const login = $('loginPanel');
  const dash = $('dashboard');
  const status = $('loginStatus');
  const tbody = $('attemptTable').querySelector('tbody');
  const rosterBody = $('rosterTable').querySelector('tbody');
  const detail = $('detail');

  if (!cfg || cfg.supabaseUrl.includes('REPLACE_')) {
    status.textContent = 'Configura Supabase en ../config.js antes de usar el panel.';
    return;
  }

  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  let assessment = null;
  let attempts = [];
  let events = [];
  let roster = [];
  let academicSources = [];
  let academicRecords = [];
  let selectedAttempt = null;

  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function csv(rows, name) {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const quote = v => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const text = [keys.join(','), ...rows.map(r => keys.map(k => quote(typeof r[k] === 'object' ? JSON.stringify(r[k]) : r[k])).join(','))].join('\n');
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function authorize() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return false;
    const { data: p } = await sb.from('profiles').select('role').eq('auth_user_id', user.id).single();
    return ['teacher', 'admin'].includes(p?.role);
  }

  async function teacherAction(action, attemptId = null) {
    const { data, error } = await sb.functions.invoke('teacher-action', {
      body: { action, assessment_id: assessment.id, attempt_id: attemptId }
    });
    if (error || data?.error) throw error || new Error(data.error);
    await load();
    return data;
  }

  function setAttemptButtons(enabled) {
    ['pauseStudent', 'resumeStudent', 'forceSubmit', 'invalidateAttempt', 'reopenAttempt'].forEach(id => $(id).disabled = !enabled);
  }

  async function loadInstitutionalData() {
    const [r1, r2, r3] = await Promise.all([
      sb.from('student_registry').select('id,internal_key,group_code,source_position,display_name,name_is_truncated,active').eq('active', true).order('group_code').order('source_position'),
      sb.from('academic_sources').select('id,source_key,source_system,source_kind,title,source_date,captured_at,description,metadata').order('source_date', { ascending: false }),
      sb.from('academic_records').select('id,source_id,student_registry_id,definitiva_periodo,definitiva_por_area,acumulado_asig_ano,acumulado_seguimiento,raw_payload,created_at')
    ]);
    if (r1.error) throw r1.error;
    if (r2.error) throw r2.error;
    if (r3.error) throw r3.error;
    roster = r1.data || [];
    academicSources = r2.data || [];
    academicRecords = r3.data || [];
  }

  async function load() {
    const { data: a, error: ae } = await sb.from('assessments').select('*').eq('slug', cfg.assessmentSlug).single();
    if (ae) throw ae;
    assessment = a;
    $('assessmentTitle').textContent = `${a.title} · ${a.status}`;

    const { data: ats, error: e1 } = await sb.from('attempts').select('*').eq('assessment_id', a.id).order('started_at', { ascending: true });
    if (e1) throw e1;
    attempts = ats || [];

    const { data: ev, error: e2 } = await sb.from('attempt_events').select('attempt_id,event_type,server_timestamp,question_id,metadata').eq('assessment_id', a.id).order('server_timestamp', { ascending: true });
    if (e2) throw e2;
    events = ev || [];

    await loadInstitutionalData();
    if (selectedAttempt) selectedAttempt = attempts.find(x => x.id === selectedAttempt.id) || null;
    render();
  }

  function latestRecordFor(studentId) {
    const records = academicRecords.filter(r => r.student_registry_id === studentId);
    if (!records.length) return null;
    records.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    return records[0];
  }

  function renderInstitutionalData() {
    const groupCounts = Object.fromEntries(['11A', '11B', '11C'].map(g => [g, roster.filter(s => s.group_code === g).length]));
    $('sourceMetrics').innerHTML = [
      ['Roster total', roster.length],
      ['11A', groupCounts['11A']],
      ['11B', groupCounts['11B']],
      ['11C', groupCounts['11C']],
      ['Fuentes registradas', academicSources.length],
      ['Registros académicos', academicRecords.length]
    ].map(([k, v]) => `<div class="summary-row"><strong>${esc(k)}</strong><span>${esc(v)}</span></div>`).join('');

    const sourceMap = Object.fromEntries(academicSources.map(s => [s.id, s]));
    rosterBody.innerHTML = '';
    roster.forEach(s => {
      const r = latestRecordFor(s.id);
      const src = r ? sourceMap[r.source_id] : null;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${esc(s.group_code)}</td><td>${esc(s.source_position)}</td><td>${esc(s.display_name)}${s.name_is_truncated ? ' <span title="Nombre truncado en la fuente original">…</span>' : ''}</td><td>${esc(r?.definitiva_por_area ?? '—')}</td><td>${esc(r?.acumulado_asig_ano ?? '—')}</td><td>${esc(src?.source_system || '—')}</td>`;
      [...tr.children].forEach(td => { td.style.padding = '9px'; td.style.borderBottom = '1px solid #e5e5e5'; });
      rosterBody.appendChild(tr);
    });
  }

  function render() {
    const counts = {
      active: attempts.filter(a => a.status === 'active').length,
      finished: attempts.filter(a => ['submitted', 'force_submitted'].includes(a.status)).length,
      invalid: attempts.filter(a => String(a.status).includes('invalidated')).length,
      disconnected: attempts.filter(a => a.status === 'active' && Date.now() - new Date(a.last_activity_at).getTime() > 30000).length
    };

    $('metrics').innerHTML = [
      ['Intentos', attempts.length],
      ['Activos', counts.active],
      ['Finalizados', counts.finished],
      ['Anulados', counts.invalid],
      ['Sin heartbeat >30 s', counts.disconnected]
    ].map(([k, v]) => `<div class="summary-row"><strong>${esc(k)}</strong><span>${esc(v)}</span></div>`).join('');

    tbody.innerHTML = '';
    attempts.forEach(a => {
      const ev = events.filter(x => x.attempt_id === a.id);
      const flags = ev.filter(x => ['INTEGRITY_STRIKE', 'VISIBILITY_HIDDEN', 'FULLSCREEN_EXIT', 'COPY_ATTEMPT', 'PASTE_ATTEMPT', 'SCREENSHOT_KEY_ATTEMPT', 'SECOND_TAB_DETECTED', 'NETWORK_OFFLINE'].includes(x.event_type)).length;
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      if (selectedAttempt?.id === a.id) tr.style.background = '#f2f2f2';
      const name = a.student_name_snapshot || a.student_name_entered || a.student_id;
      tr.innerHTML = `<td>${esc(name)}</td><td>${esc(a.group_code)}</td><td>${esc(a.status)}</td><td>${esc(a.answered_count)}/${cfg.questionsPerAttempt}</td><td>${esc(a.raw_points ?? '—')}/${cfg.maxRawPoints}</td><td>${esc(a.grade ?? '—')}</td><td>${esc(flags)}</td><td>${esc(new Date(a.last_activity_at).toLocaleTimeString('es-CO'))}</td>`;
      [...tr.children].forEach(td => { td.style.padding = '9px'; td.style.borderBottom = '1px solid #e5e5e5'; });
      tr.addEventListener('click', () => showDetail(a));
      tbody.appendChild(tr);
    });

    renderInstitutionalData();
    setAttemptButtons(!!selectedAttempt);
  }

  async function showDetail(a) {
    selectedAttempt = a;
    render();
    detail.textContent = 'Cargando auditoría…';

    const { data: rs } = await sb.from('responses').select('*').eq('attempt_id', a.id).order('question_order');
    const ids = (rs || []).map(r => r.question_id);
    const { data: qs } = ids.length
      ? await sb.from('questions_private').select('id,prompt_es,correct_answer').in('id', ids)
      : { data: [] };
    const qmap = Object.fromEntries((qs || []).map(q => [q.id, q]));
    const ev = events.filter(x => x.attempt_id === a.id);
    const name = a.student_name_snapshot || a.student_name_entered || a.student_id;

    detail.innerHTML = `
      <h3>${esc(name)} · ${esc(a.status)}</h3>
      <p>Grupo: ${esc(a.group_code)} · Match identidad: ${esc(a.identity_match_mode || 'legacy')} · Inicio: ${esc(new Date(a.started_at).toLocaleString('es-CO'))} · Fin: ${a.submitted_at ? esc(new Date(a.submitted_at).toLocaleString('es-CO')) : '—'} · Puntaje: ${esc(a.raw_points ?? '—')}/${cfg.maxRawPoints} · Nota: ${esc(a.grade ?? '—')}/${cfg.gradeMax} · Strikes: ${esc(a.integrity_strikes)}</p>
      <h3>Respuestas</h3>
      ${(rs || []).map(r => `<div class="notice"><strong>Q${esc(r.question_order)} · ${esc(r.question_id)}</strong><br>${esc(qmap[r.question_id]?.prompt_es || '')}<br>Marcó: ${esc(r.selected_option)} · Correcta: ${r.is_correct ? 'Sí' : 'No'} · Tiempo: ${r.response_time_ms != null ? esc((r.response_time_ms / 1000).toFixed(1)) + ' s' : '—'}</div>`).join('')}
      <h3>Timeline</h3>
      ${ev.map(x => `<div class="summary-row"><span>${esc(new Date(x.server_timestamp).toLocaleTimeString('es-CO'))} · ${esc(x.event_type)}${x.question_id ? ' · ' + esc(x.question_id) : ''}</span><span>${x.metadata && Object.keys(x.metadata).length ? esc(JSON.stringify(x.metadata)) : ''}</span></div>`).join('')}
    `;
  }

  $('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    status.textContent = 'Ingresando…';
    const { error } = await sb.auth.signInWithPassword({ email: $('email').value.trim(), password: $('password').value });
    if (error) { status.textContent = error.message; return; }
    if (!await authorize()) {
      await sb.auth.signOut();
      status.textContent = 'La cuenta no tiene rol teacher/admin.';
      return;
    }
    login.classList.add('hidden');
    dash.classList.remove('hidden');
    await load();
    subscribe();
  });

  $('logout').onclick = async () => { await sb.auth.signOut(); location.reload(); };
  $('refresh').onclick = load;
  $('exportAttempts').onclick = () => csv(attempts, 'statistics11_attempts.csv');
  $('exportEvents').onclick = () => csv(events, 'statistics11_integrity_events.csv');
  $('exportRoster').onclick = () => csv(roster.map(s => ({ group_code: s.group_code, source_position: s.source_position, display_name: s.display_name, name_is_truncated: s.name_is_truncated, active: s.active })), 'statistics11_roster.csv');
  $('exportAcademic').onclick = () => {
    const studentMap = Object.fromEntries(roster.map(s => [s.id, s]));
    const sourceMap = Object.fromEntries(academicSources.map(s => [s.id, s]));
    csv(academicRecords.map(r => ({
      group_code: studentMap[r.student_registry_id]?.group_code,
      student_name: studentMap[r.student_registry_id]?.display_name,
      source_key: sourceMap[r.source_id]?.source_key,
      source_system: sourceMap[r.source_id]?.source_system,
      source_date: sourceMap[r.source_id]?.source_date,
      definitiva_periodo: r.definitiva_periodo,
      definitiva_por_area: r.definitiva_por_area,
      acumulado_asig_ano: r.acumulado_asig_ano,
      acumulado_seguimiento: r.acumulado_seguimiento
    })), 'statistics11_academic_records.csv');
  };

  $('openAssessment').onclick = () => teacherAction('OPEN_ASSESSMENT').catch(e => alert(e.message || e));
  $('pauseAssessment').onclick = () => teacherAction('PAUSE_ASSESSMENT').catch(e => alert(e.message || e));
  $('closeAssessment').onclick = () => teacherAction('CLOSE_ASSESSMENT').catch(e => alert(e.message || e));
  $('releaseSolutions').onclick = () => teacherAction('RELEASE_SOLUTIONS').catch(e => alert(e.message || e));
  $('pauseStudent').onclick = () => selectedAttempt && teacherAction('PAUSE_STUDENT', selectedAttempt.id).catch(e => alert(e.message || e));
  $('resumeStudent').onclick = () => selectedAttempt && teacherAction('RESUME_STUDENT', selectedAttempt.id).catch(e => alert(e.message || e));
  $('forceSubmit').onclick = () => selectedAttempt && confirm('¿Forzar entrega de este intento?') && teacherAction('FORCE_SUBMIT', selectedAttempt.id).catch(e => alert(e.message || e));
  $('invalidateAttempt').onclick = () => selectedAttempt && confirm('¿Anular este intento?') && teacherAction('INVALIDATE_ATTEMPT', selectedAttempt.id).catch(e => alert(e.message || e));
  $('reopenAttempt').onclick = () => selectedAttempt && confirm('¿Reabrir este intento?') && teacherAction('REOPEN_ATTEMPT', selectedAttempt.id).catch(e => alert(e.message || e));

  function subscribe() {
    sb.channel('assessment-ops')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attempts', filter: `assessment_id=eq.${assessment.id}` }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attempt_events', filter: `assessment_id=eq.${assessment.id}` }, () => load())
      .subscribe();
  }

  (async () => {
    const { data: { session } } = await sb.auth.getSession();
    if (session && await authorize()) {
      login.classList.add('hidden');
      dash.classList.remove('hidden');
      await load();
      subscribe();
    }
  })();
})();
