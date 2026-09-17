(() => {
  'use strict';

  const cfg = window.IJR_MASTER_CONFIG;
  const $ = (id) => document.getElementById(id);
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  const state = {
    data: null,
    group: '',
    topicSlug: '',
    timer: null,
    running: false,
    lastSuccessAt: 0
  };

  const token = () => sessionStorage.getItem(cfg.teacherSessionKey) || '';

  const esc = (value) => String(value ?? '').replace(/[&<>\"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);

  const dateOf = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const fmtTime = (value) => {
    const d = dateOf(value);
    if (!d) return '—';
    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  };

  const latestDate = (values) => values.map(dateOf).filter(Boolean).reduce((a, b) => a > b ? a : b, null);

  function students() {
    return Array.isArray(state.data?.students) ? state.data.students : [];
  }

  function topics() {
    const map = new Map();
    students().forEach((student) => (student.topics || []).forEach((topic) => {
      if (!map.has(topic.slug)) map.set(topic.slug, topic);
    }));
    return [...map.values()].sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0));
  }

  function topicSequence(topic) {
    return Number(topic?.sequence || 0);
  }

  function topicFor(student, slug) {
    return (student.topics || []).find((topic) => topic.slug === slug) || null;
  }

  function selectedStudents() {
    return students()
      .filter((s) => !state.group || s.group_code === state.group)
      .sort((a, b) => String(a.display_name || '').localeCompare(String(b.display_name || ''), 'es'));
  }

  function selectedTopicFor(student) {
    return state.topicSlug ? topicFor(student, state.topicSlug) : null;
  }

  function itemProgress(topic) {
    const items = Array.isArray(topic?.items) ? topic.items : [];
    const total = Number(topic?.total_count || items.length || 0);
    const validated = items.filter((item) => item.correct === true);
    const lastActivity = latestDate(items.flatMap((item) => [item.last_answered_at, item.completed_at]));
    return { items, total, validated, lastActivity, pct: total ? Math.round(validated.length * 100 / total) : 0 };
  }

  function status(topic) {
    const last = itemProgress(topic).lastActivity;
    if (!last) return '<span class="sp2-status none">Sin actividad</span>';
    const age = Date.now() - last.getTime();
    if (age <= 8 * 60 * 1000) return '<span class="sp2-status active">Activo ahora</span>';
    const now = new Date();
    if (last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth() && last.getDate() === now.getDate()) {
      return '<span class="sp2-status today">Trabajó hoy</span>';
    }
    return '<span class="sp2-status historical">Histórico</span>';
  }

  function progressBar(progress) {
    return `<div class="sp2-progress"><div class="sp2-progress-top"><strong>${progress.validated.length}/${progress.total}</strong><span>${progress.pct}%</span></div><div class="sp2-track"><i style="width:${progress.pct}%"></i></div></div>`;
  }

  function exerciseChips(progress) {
    if (!progress.items.length) return '<span class="sp2-muted">Sin ejercicios registrados.</span>';
    return progress.items.map((item) => {
      const valid = item.correct === true;
      const attempted = item.last_answered_at || item.completed_at;
      const cls = valid ? 'validated' : attempted ? 'attempted' : 'pending';
      const title = `${item.title || item.key || 'Ejercicio'}${valid ? ' · validado' : attempted ? ' · intentado, no validado' : ' · pendiente'}`;
      return `<span class="sp2-chip ${cls}" title="${esc(title)}">${esc(item.sequence ?? '·')}${valid ? ' ✓' : ''}</span>`;
    }).join('');
  }

  function studentCard(student) {
    const topic = selectedTopicFor(student);
    const p = itemProgress(topic);
    const selected = topics().find((t) => t.slug === state.topicSlug);
    const topicTitle = selected?.title || topic?.title || 'Workshop';
    const lastExercise = [...p.items].filter((i) => i.last_answered_at || i.completed_at).sort((a, b) => {
      const ad = dateOf(a.last_answered_at || a.completed_at)?.getTime() || 0;
      const bd = dateOf(b.last_answered_at || b.completed_at)?.getTime() || 0;
      return bd - ad;
    })[0];

    return `<article class="sp2-student">
      <div class="sp2-identity">
        <span class="sp2-group">${esc(student.group_code || '—')}</span>
        <div><strong>${esc(student.display_name || 'Estudiante')}</strong><small>${esc(student.account?.email || 'Sin cuenta asociada')}</small></div>
      </div>
      <div class="sp2-workshop">
        <span class="sp2-label">WORKSHOP ${esc(topicSequence(selected))}</span>
        <strong>${esc(topicTitle)}</strong>
        <small>${lastExercise ? `Último ejercicio: ${esc(lastExercise.sequence)} · ${esc(lastExercise.title || lastExercise.key || '')}` : 'No ha registrado respuestas en este workshop'}</small>
      </div>
      <div class="sp2-progress-cell">
        <span class="sp2-label">Avance</span>
        ${progressBar(p)}
      </div>
      <div class="sp2-validated">
        <span class="sp2-label">Ejercicios</span>
        <div class="sp2-chip-row">${exerciseChips(p)}</div>
      </div>
      <div class="sp2-status-cell">${status(topic)}<small>${fmtTime(p.lastActivity)}</small></div>
    </article>`;
  }

  function render() {
    const list = $('studentProgressListV2');
    if (!list) return;
    const selected = topics().find((t) => t.slug === state.topicSlug);
    const groupStudents = selectedStudents();
    const withActivity = groupStudents.filter((s) => itemProgress(selectedTopicFor(s)).lastActivity).length;
    const validated = groupStudents.reduce((sum, s) => sum + itemProgress(selectedTopicFor(s)).validated.length, 0);
    const totalExercises = Number(selected?.total_count || selected?.items?.length || 0);

    $('studentProgressSummaryV2').innerHTML = selected
      ? `<div><span>Grupo</span><strong>${esc(state.group || 'Todos')}</strong></div><div><span>Workshop</span><strong>${esc(topicSequence(selected))}</strong></div><div><span>Ejercicios</span><strong>${esc(totalExercises)}</strong></div><div><span>Estudiantes</span><strong>${esc(groupStudents.length)}</strong></div><div><span>Con actividad</span><strong>${esc(withActivity)}</strong></div><div><span>Validados</span><strong>${esc(validated)}</strong></div>`
      : '';

    $('studentProgressCountV2').textContent = `${groupStudents.length} estudiantes`;
    list.innerHTML = selected
      ? (groupStudents.length ? groupStudents.map(studentCard).join('') : '<div class="sp2-empty">No hay estudiantes en el grupo seleccionado.</div>')
      : '<div class="sp2-empty">Selecciona un workshop para consultar el avance.</div>';
  }

  function populateControls() {
    const groupSelect = $('sp2GroupFilter');
    const topicSelect = $('sp2TopicFilter');
    if (!groupSelect || !topicSelect) return;

    const groups = [...new Set(students().map((s) => s.group_code).filter(Boolean))].sort();
    const currentGroup = state.group;
    groupSelect.innerHTML = '<option value="">Todos los grupos</option>' + groups.map((g) => `<option value="${esc(g)}">${esc(g)}</option>`).join('');
    if (groups.includes(currentGroup)) groupSelect.value = currentGroup;
    else state.group = '';

    const allTopics = topics();
    const currentTopic = state.topicSlug;
    topicSelect.innerHTML = '<option value="">Seleccionar workshop…</option>' + allTopics.map((t) => `<option value="${esc(t.slug)}">Workshop ${esc(t.sequence)} · ${esc(t.title)}</option>`).join('');

    if (allTopics.some((t) => t.slug === currentTopic)) {
      topicSelect.value = currentTopic;
    } else {
      const latestWorked = allTopics.filter((t) => students().some((s) => itemProgress(topicFor(s, t.slug)).lastActivity)).sort((a, b) => Number(b.sequence) - Number(a.sequence))[0];
      state.topicSlug = latestWorked?.slug || '';
      topicSelect.value = state.topicSlug;
    }
  }

  function setLive(mode, text) {
    const el = $('studentProgressLiveV2');
    if (!el) return;
    el.className = `sp2-live ${mode}`;
    el.textContent = text;
  }

  function schedule(ms) {
    clearTimeout(state.timer);
    state.timer = setTimeout(() => load(false), ms);
  }

  async function load(force = false) {
    const t = token();
    if (!t || state.running) return;
    if (navigator.onLine === false && !force) {
      setLive('stale', 'Sin conexión · último dato');
      schedule(15000);
      return;
    }
    state.running = true;
    setLive('loading', 'Actualizando…');
    try {
      const { data, error } = await sb.rpc(cfg.rpc.pythonHubStageMatrix, { p_teacher_token: t });
      if (error) throw new Error(error.message || 'Backend error');
      state.data = data || { students: [] };
      state.lastSuccessAt = Date.now();
      populateControls();
      render();
      setLive('live', `LIVE · ${students().length} estudiantes · actualización 15 s`);
      schedule(document.hidden ? 45000 : 15000);
    } catch (err) {
      const message = String(err?.message || err);
      if (/invalid|expired|sesión docente|teacher session/i.test(message)) {
        setLive('error', 'Sesión maestra requerida');
      } else {
        const age = state.lastSuccessAt ? Math.round((Date.now() - state.lastSuccessAt) / 1000) : null;
        setLive('stale', age == null ? 'No se pudo actualizar' : `Dato anterior · ${age}s`);
      }
      schedule(document.hidden ? 45000 : 15000);
    } finally {
      state.running = false;
    }
  }

  function resetSelection() {
    state.group = '';
    state.topicSlug = '';
    if ($('sp2GroupFilter')) $('sp2GroupFilter').value = '';
    populateControls();
    render();
  }

  function bind() {
    $('sp2GroupFilter')?.addEventListener('change', (e) => {
      state.group = e.target.value;
      render();
    });
    $('sp2TopicFilter')?.addEventListener('change', (e) => {
      state.topicSlug = e.target.value;
      render();
    });
    $('sp2Refresh')?.addEventListener('click', () => load(true));
    $('sp2Reset')?.addEventListener('click', resetSelection);
  }

  function mount() {
    const panel = $('studentProgressPanel');
    if (!panel || !cfg?.rpc?.pythonHubStageMatrix) return;
    panel.innerHTML = `
      <div class="sp2-head">
        <div><span class="eyebrow">MASTER · PROGRESO PYTHON HUB</span><h2>Progreso por grupo y workshop</h2><p>Selecciona el grupo y el workshop. Se muestra el avance de cada estudiante y los ejercicios validados, usando los registros actuales de Supabase.</p></div>
        <div id="studentProgressLiveV2" class="sp2-live loading">Esperando sesión maestra</div>
      </div>
      <div class="sp2-controls">
        <label>Grupo<select id="sp2GroupFilter"><option value="">Todos los grupos</option></select></label>
        <label>Workshop · tema<select id="sp2TopicFilter"><option value="">Seleccionar workshop…</option></select></label>
        <button id="sp2Refresh" type="button" class="quiet">Actualizar</button>
        <button id="sp2Reset" type="button" class="quiet">Restablecer</button>
        <span id="studentProgressCountV2" class="muted">0 estudiantes</span>
      </div>
      <div id="studentProgressSummaryV2" class="sp2-summary"></div>
      <div id="studentProgressListV2" class="sp2-list" aria-live="polite"><div class="sp2-empty">Inicia sesión maestra para ver el progreso.</div></div>
      <div class="sp2-note">✓ = ejercicio validado. Un intento incorrecto no se cuenta como validado. Los registros maestros, respuestas, notas y matrículas existentes no se modifican desde esta vista.</div>`;
    bind();

    const check = () => {
      if (token() && !state.running && !state.data) load(true);
      if (!token() && state.data) {
        state.data = null;
        setLive('error', 'Sesión maestra requerida');
      }
    };
    setInterval(check, 1000);
    window.addEventListener('online', () => { if (token()) load(true); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && token()) load(true); });
    check();
  }

  window.addEventListener('DOMContentLoaded', mount);
})();
