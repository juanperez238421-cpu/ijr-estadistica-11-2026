(() => {
  'use strict';

  const cfg = window.IJR_ASSESSMENT_CONFIG;
  const $ = id => document.getElementById(id);
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false }
  });

  const TOKEN_KEY = 'ijr-stat11-counting-teacher-session-v3';
  let teacherToken = sessionStorage.getItem(TOKEN_KEY) || '';
  let snapshot = null;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  async function rpc(name,args={}) {
    const {data,error} = await sb.rpc(name,args);
    if (error) throw new Error(error.message || 'Backend error');
    return data;
  }

  function fmtDate(value) {
    if (!value) return '—';
    try { return new Date(value).toLocaleString('es-CO',{dateStyle:'short',timeStyle:'short'}); }
    catch { return String(value); }
  }

  function fmtTime(value) {
    if (!value) return '—';
    try { return new Date(value).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit',second:'2-digit'}); }
    catch { return String(value); }
  }

  function fmtMs(value) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? `${(n/1000).toFixed(1)} s` : '—';
  }

  function riskOf(row) {
    if (row.integrity_risk) return row.integrity_risk;
    if (String(row.status || '').includes('invalidated')) return 'BLOCKED';
    return Number(row.integrity_strikes || 0) > 0 ? 'ATTENTION' : 'OK';
  }

  function riskLabel(value) {
    return ({OK:'OK',ATTENTION:'Atención',REVIEW:'Revisar',BLOCKED:'Bloqueado'})[value] || value || 'OK';
  }

  function setLoginStatus(message,isError=false) {
    const node = $('loginStatus');
    node.textContent = message || '';
    node.classList.toggle('error',!!isError);
  }

  function showDashboard() {
    $('loginPanel').classList.add('hidden');
    $('dashboardPanel').classList.remove('hidden');
  }

  function showLogin() {
    $('dashboardPanel').classList.add('hidden');
    $('loginPanel').classList.remove('hidden');
  }

  function filteredAttempts() {
    const rows = Array.from(snapshot?.attempts || []);
    const search = $('searchInput').value.trim().toLowerCase();
    const group = $('groupFilter').value;
    const status = $('statusFilter').value;
    const risk = $('riskFilter').value;
    return rows.filter(row => {
      const haystack = `${row.student_name || ''} ${row.student_name_entered || ''} ${row.student_email || ''}`.toLowerCase();
      if (search && !haystack.includes(search)) return false;
      if (group && row.group_code !== group) return false;
      if (risk && riskOf(row) !== risk) return false;
      if (status === 'active' && row.status !== 'active') return false;
      if (status === 'submitted' && !['submitted','force_submitted'].includes(row.status)) return false;
      if (status === 'invalidated' && !String(row.status || '').includes('invalidated')) return false;
      return true;
    });
  }

  function renderMetrics() {
    const a = snapshot?.assessment || {};
    const m = snapshot?.metrics || {};
    $('assessmentTitle').textContent = a.title || 'Statistics 11 · Counting & Permutations';
    $('assessmentStatus').textContent = a.status || '—';
    $('assessmentStatus').dataset.status = a.status || '';
    $('updatedAt').textContent = `Actualizado ${new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`;

    const rows = [
      ['Roster',m.roster_total ?? 61],
      ['Intentos',m.attempts_total ?? 0],
      ['Activos',m.active ?? 0],
      ['Finalizados',m.submitted ?? 0],
      ['Anulados',m.invalidated ?? 0],
      ['Promedio',m.average_grade == null ? '—' : Number(m.average_grade).toFixed(2)],
      ['Correos repetidos',m.email_reuse_flags ?? 0],
      ['Reportes pendientes',m.pending_email_reports ?? 0]
    ];
    $('metrics').innerHTML = rows.map(([label,value]) => `<article class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></article>`).join('');
  }

  function renderAttempts() {
    const rows = filteredAttempts();
    const all = snapshot?.attempts || [];
    $('attemptCount').textContent = `Mostrando ${rows.length} de ${all.length} intentos. Haz clic en una fila para abrir la auditoría completa.`;
    $('attemptBody').innerHTML = rows.map(row => {
      const risk = riskOf(row);
      const name = row.student_name || row.student_name_entered || row.student_id || '—';
      const progress = `${row.answered_count ?? 0}/${cfg.questionsPerAttempt}`;
      const raw = row.raw_points == null ? '—' : `${row.raw_points}/${cfg.maxRawPoints}`;
      return `<tr data-attempt-id="${esc(row.id)}">
        <td><strong>${esc(name)}</strong><br><span class="muted">${esc(row.identity_match_mode || '')}</span></td>
        <td>${esc(row.student_email || '—')}</td>
        <td>${esc(row.group_code || '—')}</td>
        <td>${esc(row.status || '—')}</td>
        <td>${esc(progress)}</td>
        <td>${esc(raw)}</td>
        <td>${esc(row.grade ?? '—')}</td>
        <td>${esc(row.correct_count ?? '—')}</td>
        <td>${esc(row.integrity_strikes ?? 0)}/${cfg.tabStrikeLimit}</td>
        <td><span class="risk ${esc(risk.toLowerCase())}">${esc(riskLabel(risk))}</span></td>
        <td>${esc(fmtDate(row.started_at))}</td>
        <td>${esc(fmtDate(row.last_activity_at))}</td>
      </tr>`;
    }).join('') || '<tr><td colspan="12" class="empty">No hay intentos que coincidan con los filtros.</td></tr>';

    document.querySelectorAll('[data-attempt-id]').forEach(row => {
      row.addEventListener('click',() => loadDetail(row.dataset.attemptId));
    });
  }

  function render() {
    renderMetrics();
    renderAttempts();
  }

  async function loadDashboard() {
    if (!teacherToken) return;
    try {
      snapshot = await rpc(cfg.teacherRpc.snapshot,{
        p_teacher_token:teacherToken,
        p_assessment_slug:cfg.assessmentSlug
      });
      showDashboard();
      render();
    } catch (err) {
      teacherToken = '';
      snapshot = null;
      sessionStorage.removeItem(TOKEN_KEY);
      showLogin();
      setLoginStatus(`No fue posible cargar los registros: ${err.message}`,true);
    }
  }

  async function loadDetail(attemptId) {
    $('detailPanel').classList.remove('hidden');
    $('detailTitle').textContent = 'Cargando…';
    $('detailStatus').textContent = '';
    $('detailSummary').innerHTML = '';
    $('detailResponses').innerHTML = '';
    $('detailEvents').innerHTML = '';
    $('detailPanel').scrollIntoView({behavior:'smooth',block:'start'});

    try {
      const data = await rpc(cfg.teacherRpc.detail,{
        p_teacher_token:teacherToken,
        p_attempt_id:attemptId
      });
      const a = data?.attempt || {};
      const responses = Array.isArray(data?.responses) ? data.responses : [];
      const events = Array.isArray(data?.events) ? data.events : [];
      const title = a.student_name_snapshot || a.student_name_entered || a.student_id || 'Intento';
      $('detailTitle').textContent = `${title} · ${a.group_code || '—'}`;

      const cards = [
        ['Estado',a.status || '—'],
        ['Correo',a.student_email || '—'],
        ['Inicio',fmtDate(a.started_at)],
        ['Vence',fmtDate(a.expires_at)],
        ['Entrega',fmtDate(a.submitted_at)],
        ['Puntaje',a.raw_points == null ? '—' : `${a.raw_points}/${cfg.maxRawPoints}`],
        ['Nota',a.grade == null ? '—' : `${a.grade}/${cfg.gradeMax}`],
        ['Correctas',a.correct_count ?? responses.filter(r=>r.is_correct).length],
        ['Strikes',`${a.integrity_strikes ?? 0}/${cfg.tabStrikeLimit}`],
        ['Razón de cierre',a.finish_reason || '—']
      ];
      $('detailSummary').innerHTML = cards.map(([label,value]) => `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');

      $('detailResponses').innerHTML = responses.map(r => `<article class="response ${r.is_correct ? 'correct' : 'incorrect'}">
        <div class="response-head"><strong>Q${esc(r.question_order)} · ${r.is_correct ? 'Correcta' : 'Incorrecta'}</strong><span>${esc(fmtMs(r.response_time_ms))}</span></div>
        <p>${esc(r.prompt || '')}</p>
        <div class="response-meta"><span>Marcó: <strong>${esc(r.selected_option ?? '—')}</strong></span><span>Correcta: <strong>${esc(r.correct_answer ?? '—')}</strong></span><span>Cambios: ${esc(r.selection_changes ?? 0)}</span></div>
      </article>`).join('') || '<p class="muted">Sin respuestas registradas.</p>';

      $('detailEvents').innerHTML = events.map(ev => `<div class="event-row"><span>${esc(fmtTime(ev.server_timestamp || ev.created_at))}</span><strong>${esc(ev.event_type || 'EVENT')}</strong><code>${esc(ev.metadata && Object.keys(ev.metadata).length ? JSON.stringify(ev.metadata) : '')}</code></div>`).join('') || '<p class="muted">Sin eventos registrados.</p>';
    } catch (err) {
      $('detailTitle').textContent = 'No fue posible abrir el intento';
      $('detailStatus').textContent = err.message;
      $('detailStatus').classList.add('error');
    }
  }

  $('loginForm').addEventListener('submit',async event => {
    event.preventDefault();
    const code = $('teacherCode').value.trim();
    setLoginStatus('Validando código maestro…');
    try {
      const result = await rpc(cfg.teacherRpc.login,{p_code:code,p_user_agent:navigator.userAgent});
      if (!result?.teacher_token) throw new Error('El backend no devolvió una sesión docente.');
      teacherToken = result.teacher_token;
      sessionStorage.setItem(TOKEN_KEY,teacherToken);
      $('teacherCode').value = '';
      setLoginStatus('');
      await loadDashboard();
    } catch (err) {
      setLoginStatus(`Acceso rechazado: ${err.message}`,true);
    }
  });

  $('logoutButton').addEventListener('click',async () => {
    try { if (teacherToken) await rpc(cfg.teacherRpc.logout,{p_teacher_token:teacherToken}); } catch {}
    teacherToken = '';
    snapshot = null;
    sessionStorage.removeItem(TOKEN_KEY);
    showLogin();
    setLoginStatus('Sesión cerrada.');
  });

  $('refreshButton').addEventListener('click',loadDashboard);
  $('closeDetail').addEventListener('click',() => $('detailPanel').classList.add('hidden'));
  ['searchInput'].forEach(id => $(id).addEventListener('input',renderAttempts));
  ['groupFilter','statusFilter','riskFilter'].forEach(id => $(id).addEventListener('change',renderAttempts));

  if (teacherToken) loadDashboard();
})();
