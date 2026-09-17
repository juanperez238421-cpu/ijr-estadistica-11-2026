(() => {
  'use strict';

  const cfg = window.IJR_MASTER_CONFIG;
  const $ = (id) => document.getElementById(id);
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  const TOPICS = [
    { sequence: 1, slug: 'operations', title: 'Colab interface and general operations', nav: 'Interface & operations' },
    { sequence: 2, slug: 'types', title: 'Variables and data types', nav: 'Variable types' },
    { sequence: 3, slug: 'arrays', title: 'Arrays and Python lists', nav: 'Arrays / lists' },
    { sequence: 4, slug: 'logic', title: 'Excel (.xlsx) files with Pandas', nav: 'XLSX → DataFrame' },
    { sequence: 5, slug: 'conditions', title: 'CSV files and Pandas DataFrames', nav: 'CSV → DataFrame' },
    { sequence: 6, slug: 'loops', title: 'Central tendency from a real dataset', nav: 'Mean · median · mode' },
    { sequence: 7, slug: 'functions', title: 'Functions: name a reusable process', nav: 'Functions' },
    { sequence: 8, slug: 'statistics', title: 'Statistics foundations with lists', nav: 'Statistics foundations' },
    { sequence: 9, slug: 'descriptive', title: 'Descriptive statistics: center and spread', nav: 'Descriptive statistics' },
    { sequence: 10, slug: 'position-outliers', title: 'Quartiles, percentiles, IQR and outliers', nav: 'Position & outliers' },
    { sequence: 11, slug: 'pandas-dataframes', title: 'CSV and Pandas DataFrames', nav: 'CSV → DataFrame' },
    { sequence: 12, slug: 'data-cleaning', title: 'Data cleaning and quality checks', nav: 'Cleaning & quality' },
    { sequence: 13, slug: 'filter-transform', title: 'Filtering, sorting and transformation', nav: 'Filter & transform' },
    { sequence: 14, slug: 'group-aggregate', title: 'Grouping, frequencies and aggregation', nav: 'Group & aggregate' },
    { sequence: 15, slug: 'visualization', title: 'Data visualization with Matplotlib', nav: 'Visualization' },
    { sequence: 16, slug: 'analyst-project', title: 'Data Analyst capstone workflow', nav: 'Analyst capstone' }
  ];

  const topicMap = Object.fromEntries(TOPICS.map((t) => [t.slug, t]));
  const POLL_VISIBLE_MS = 15000;
  const POLL_HIDDEN_MS = 45000;
  const ACTIVE_WINDOW_MS = 8 * 60 * 1000;
  const state = { data: null, expanded: new Set(), lastSuccessAt: 0, timer: null, running: false };

  function token() {
    return sessionStorage.getItem(cfg.teacherSessionKey) || '';
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function asDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function fmtTime(value, full = false) {
    const d = asDate(value);
    if (!d) return '—';
    try {
      return d.toLocaleString('es-CO', full
        ? { dateStyle: 'short', timeStyle: 'medium' }
        : { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '—';
    }
  }

  function isToday(value) {
    const d = asDate(value);
    if (!d) return false;
    const n = new Date();
    return d.getFullYear() === n.getFullYear() &&
      d.getMonth() === n.getMonth() &&
      d.getDate() === n.getDate();
  }

  function minutesSince(value) {
    const d = asDate(value);
    if (!d) return Infinity;
    return Math.max(0, (Date.now() - d.getTime()) / 60000);
  }

  function latestDate(values) {
    const valid = values.map(asDate).filter(Boolean);
    if (!valid.length) return null;
    return valid.reduce((a, b) => a > b ? a : b);
  }

  function itemsForStudent(student) {
    return (Array.isArray(student?.topics) ? student.topics : []).flatMap((topic) =>
      (Array.isArray(topic.items) ? topic.items : []).map((item) => ({
        ...item,
        topic: { ...topic, meta: topicMap[topic.slug] || { sequence: topic.sequence || 0, title: topic.slug, nav: topic.slug } }
      }))
    );
  }

  function studentDerived(student) {
    const topics = Array.isArray(student?.topics) ? student.topics : [];
    const items = itemsForStudent(student);
    const latestItem = items
      .filter((item) => item.last_answered_at || item.completed_at)
      .sort((a, b) => {
        const ad = asDate(a.last_answered_at || a.completed_at)?.getTime() || 0;
        const bd = asDate(b.last_answered_at || b.completed_at)?.getTime() || 0;
        return bd - ad;
      })[0] || null;

    const latestTopic = latestItem?.topic || null;
    const latestActivity = latestDate(items.flatMap((item) => [item.last_answered_at, item.completed_at])) || null;
    const validated = items.filter((item) => item.correct === true);
    const validatedToday = validated.filter((item) => isToday(item.last_answered_at || item.completed_at));
    const attempted = items.filter((item) => item.last_answered_at || item.completed_at);
    const completedTopics = topics.filter((topic) => topic.credit === true || Number(topic.validated_count || 0) >= Number(topic.total_count || 0)).length;
    const currentTopicItems = latestTopic ? items.filter((item) => item.topic.slug === latestTopic.slug) : [];
    const currentValidated = currentTopicItems.filter((item) => item.correct === true).length;
    const currentTotal = Number(latestTopic?.total_count || currentTopicItems.length || 0);
    const currentPct = currentTotal ? Math.round((currentValidated / currentTotal) * 100) : 0;

    return {
      topics,
      items,
      latestItem,
      latestTopic,
      latestActivity,
      validated,
      validatedToday,
      attempted,
      completedTopics,
      currentValidated,
      currentTotal,
      currentPct,
      activeNow: latestActivity ? Date.now() - latestActivity.getTime() <= ACTIVE_WINDOW_MS : false,
      today: Boolean(latestActivity && isToday(latestActivity))
    };
  }

  function normalizeStudents() {
    return Array.isArray(state.data?.students) ? state.data.students.map((s) => ({
      ...s,
      derived: studentDerived(s)
    })) : [];
  }

  function currentFilter() {
    return {
      group: $('spGroupFilter')?.value || '',
      activity: $('spActivityFilter')?.value || 'today',
      search: ($('spSearch')?.value || '').trim().toLowerCase()
    };
  }

  function matches(student, filter) {
    if (filter.group && student.group_code !== filter.group) return false;
    if (filter.search) {
      const hay = [
        student.display_name,
        student.group_code,
        student.account?.email,
        student.derived.latestTopic?.meta?.title,
        student.derived.latestItem?.title
      ].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(filter.search)) return false;
    }
    if (filter.activity === 'today' && !student.derived.today) return false;
    if (filter.activity === 'active' && !student.derived.activeNow) return false;
    if (filter.activity === 'activity' && !student.derived.latestActivity) return false;
    return true;
  }

  function setLive(mode, text) {
    const el = $('studentProgressLive');
    if (!el) return;
    el.className = `sp-live ${mode}`;
    el.textContent = text;
  }

  function schedule(ms) {
    clearTimeout(state.timer);
    state.timer = setTimeout(load, ms);
  }

  function renderMetrics(students) {
    const all = normalizeStudents();
    const withActivity = all.filter((s) => s.derived.latestActivity).length;
    const today = all.filter((s) => s.derived.today).length;
    const activeNow = all.filter((s) => s.derived.activeNow).length;
    const validatedTotal = all.reduce((sum, s) => sum + s.derived.validated.length, 0);
    const validatedToday = all.reduce((sum, s) => sum + s.derived.validatedToday.length, 0);
    const completedTopics = all.reduce((sum, s) => sum + s.derived.completedTopics, 0);
    const groups = new Set(students.map((s) => s.group_code).filter(Boolean)).size;

    $('studentProgressMetrics').innerHTML = [
      ['Estudiantes visibles', students.length, `${groups} grupos`],
      ['Actividad hoy', today, 'al menos una respuesta hoy'],
      ['Activos ahora', activeNow, 'últimos 8 minutos'],
      ['Ejercicios validados', validatedTotal, `${validatedToday} validados hoy`],
      ['Workshops completados', completedTopics, `${withActivity} estudiantes con actividad histórica`]
    ].map(([label, value, note]) => `
      <div class="sp-metric">
        <span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small>
      </div>`).join('');
  }

  function progressHtml(value, total) {
    const pct = total ? Math.max(0, Math.min(100, Math.round((value / total) * 100))) : 0;
    return `<div class="sp-progress-number"><span>${value}/${total || 0}</span><span>${pct}%</span></div>
      <div class="sp-progress-track" aria-label="${pct}%"><div class="sp-progress-fill" style="width:${pct}%"></div></div>`;
  }

  function statusHtml(student) {
    const d = student.derived;
    if (d.activeNow) return '<span class="sp-badge active">Activo ahora</span>';
    if (d.today) return '<span class="sp-badge today">Actividad hoy</span>';
    if (d.latestActivity) return '<span class="sp-badge idle">Histórico</span>';
    return '<span class="sp-badge none">Sin actividad</span>';
  }

  function validatedText(d) {
    if (!d.validated.length) return 'Ninguno todavía';
    return d.validated.map((item) => item.topic.meta.sequence === d.latestTopic?.meta?.sequence
      ? item.sequence
      : `${item.topic.meta.sequence}.${item.sequence}`).join(' · ');
  }

  function chipHtml(item, compact = false) {
    const classes = ['sp-chip'];
    if (item.correct === true) classes.push('valid');
    if (isToday(item.last_answered_at || item.completed_at)) classes.push('today');
    const label = compact ? item.sequence : `W${item.topic.meta.sequence} · ${item.title || item.key}`;
    return `<span class="${classes.join(' ')}" title="${esc(label)}">${esc(item.sequence ?? '·')}</span>`;
  }

  function topicCardHtml(topic) {
    const meta = topicMap[topic.slug] || { sequence: topic.sequence || 0, title: topic.slug, nav: topic.slug };
    const items = Array.isArray(topic.items) ? topic.items : [];
    const validated = items.filter((item) => item.correct === true).length;
    const total = Number(topic.total_count || items.length || 0);
    const pct = total ? Math.round((validated / total) * 100) : 0;
    const current = state.expandedTopicSlug === topic.slug;
    return `<article class="sp-topic-card ${current ? 'current' : ''} ${topic.credit ? 'credit' : ''}">
      <div class="sp-topic-top"><div><div class="sp-topic-seq">WORKSHOP ${esc(meta.sequence)}</div><div class="sp-topic-name">${esc(meta.title)}</div></div>${topic.credit ? '<span class="sp-topic-credit">COMPLETADO</span>' : ''}</div>
      <div class="sp-topic-stats"><span><strong>${validated}/${total}</strong> validados</span><span>${pct}%</span></div>
      <div class="sp-progress-track"><div class="sp-progress-fill" style="width:${pct}%"></div></div>
      <div class="sp-items">${items.map((item) => chipHtml({ ...item, topic: { meta } })).join('') || '<span class="sp-topic-foot">Sin ejercicios registrados.</span>'}</div>
      <div class="sp-topic-foot">${topic.credit ? 'Crédito de workshop registrado.' : items.some((i) => i.last_answered_at) ? `Última respuesta: ${fmtTime(latestDate(items.map((i) => i.last_answered_at)))}` : 'Sin respuesta registrada.'}</div>
    </article>`;
  }

  function detailsHtml(student) {
    const d = student.derived;
    const topics = d.topics.slice().sort((a, b) => Number(a.sequence || topicMap[a.slug]?.sequence || 0) - Number(b.sequence || topicMap[b.slug]?.sequence || 0));
    return `<div class="sp-details">
      <div class="sp-details-head">
        <div><strong>Detalle completo del recorrido</strong><br><span>${esc(d.completedTopics)} de ${topics.length || TOPICS.length} workshops con crédito o validación completa</span></div>
        <span>${esc(d.validated.length)} ejercicios validados en total</span>
      </div>
      <div class="sp-topic-grid">${topics.map(topicCardHtml).join('')}</div>
      <div class="sp-workshop-note">Los ejercicios marcados ✓ fueron validados al menos una vez. El estado "completado" del workshop puede provenir del crédito registrado en Supabase; no convierte ejercicios individuales en validados.</div>
    </div>`;
  }

  function studentCardHtml(student) {
    const d = student.derived;
    const latestTopic = d.latestTopic?.meta || null;
    const latestItem = d.latestItem;
    const key = student.student_registry_id;
    const isOpen = state.expanded.has(key);
    const currentTitle = latestTopic
      ? `Workshop ${latestTopic.sequence} · ${latestTopic.title}`
      : 'Sin workshop trabajado';
    const currentSub = latestItem
      ? `Último ejercicio: ${latestItem.sequence} · ${latestItem.title || latestItem.key}`
      : 'No hay ejercicio con respuesta registrada';
    const email = student.account?.email || '';

    return `<article class="sp-student-card" data-student-id="${esc(key)}">
      <div class="sp-student-summary">
        <div class="sp-student-identity">
          <div><span class="sp-group">${esc(student.group_code || '—')}</span><span class="sp-student-name">${esc(student.display_name || 'Estudiante')}</span></div>
          ${email ? `<div class="sp-student-meta">${esc(email)}</div>` : '<div class="sp-student-meta">Sin cuenta Python Hub asociada</div>'}
        </div>
        <div class="sp-current-topic">
          <span class="label">Último workshop trabajado</span>
          <div class="sp-topic-title">${esc(currentTitle)}</div>
          <div class="sp-topic-sub">${esc(currentSub)}</div>
        </div>
        <div class="sp-progress-block">
          <span class="label">Progreso del último workshop</span>
          ${progressHtml(d.currentValidated, d.currentTotal)}
        </div>
        <div class="sp-validated-block">
          <span class="label">Ejercicios validados</span>
          <div class="sp-validated-list">${esc(validatedText(d))}</div>
          <div class="sp-chip-row">${(d.latestTopic ? d.items.filter((i) => i.topic.slug === d.latestTopic.slug) : []).map((item) => chipHtml(item, true)).join('')}</div>
        </div>
        <div class="sp-status">
          ${statusHtml(student)}
          <div class="sp-last-time">${d.latestActivity ? fmtTime(d.latestActivity, false) : '—'}</div>
          <button type="button" class="sp-detail-button" data-detail-id="${esc(key)}">${isOpen ? 'Ocultar detalle' : 'Ver 16 workshops y ejercicios'}</button>
        </div>
      </div>
      ${isOpen ? detailsHtml(student) : ''}
    </article>`;
  }

  function renderList() {
    if (!$('studentProgressList')) return;
    const filter = currentFilter();
    const students = normalizeStudents().filter((s) => matches(s, filter));
    students.sort((a, b) => {
      const ad = a.derived.latestActivity?.getTime() || 0;
      const bd = b.derived.latestActivity?.getTime() || 0;
      return bd - ad || String(a.display_name || '').localeCompare(String(b.display_name || ''), 'es');
    });

    renderMetrics(students);
    $('studentProgressCount').textContent = `${students.length} mostrados`;
    $('studentProgressList').innerHTML = students.length
      ? students.map(studentCardHtml).join('')
      : '<div class="sp-empty">No hay estudiantes que coincidan con los filtros actuales.</div>';

    document.querySelectorAll('[data-detail-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.detailId;
        if (!id) return;
        if (state.expanded.has(id)) state.expanded.delete(id); else state.expanded.add(id);
        renderList();
      });
    });
  }

  function bindControls() {
    ['spGroupFilter', 'spActivityFilter'].forEach((id) => $(id)?.addEventListener('change', renderList));
    $('spSearch')?.addEventListener('input', renderList);
    $('spRefresh')?.addEventListener('click', () => load(true));
  }

  async function load(force = false) {
    const t = token();
    if (!t || state.running) return;
    if (navigator.onLine === false && !force) {
      setLive('stale', 'Offline · último dato');
      schedule(POLL_VISIBLE_MS);
      return;
    }

    state.running = true;
    setLive('loading', 'Actualizando…');
    try {
      const { data, error } = await sb.rpc(cfg.rpc.pythonHubStageMatrix, { p_teacher_token: t });
      if (error) throw new Error(error.message || 'Backend error');
      state.data = data || { students: [] };
      state.lastSuccessAt = Date.now();
      populateGroupFilter();
      renderList();
      const count = normalizeStudents().length;
      setLive('live', `LIVE · ${count} estudiantes · 15 s`);
      schedule(document.hidden ? POLL_HIDDEN_MS : POLL_VISIBLE_MS);
    } catch (err) {
      const authError = /invalid|expired|sesión docente|teacher session/i.test(String(err?.message || err));
      if (authError) {
        setLive('error', 'Sesión maestra requerida');
        state.data = null;
      } else {
        const age = state.lastSuccessAt ? Math.round((Date.now() - state.lastSuccessAt) / 1000) : null;
        setLive('stale', age == null ? 'No se pudo actualizar' : `Dato anterior · ${age}s`);
      }
      schedule(document.hidden ? POLL_HIDDEN_MS : POLL_VISIBLE_MS);
    } finally {
      state.running = false;
    }
  }

  function populateGroupFilter() {
    const select = $('spGroupFilter');
    if (!select) return;
    const current = select.value;
    const groups = [...new Set(normalizeStudents().map((s) => s.group_code).filter(Boolean))].sort();
    select.innerHTML = '<option value="">Todos los grupos</option>' + groups.map((g) => `<option value="${esc(g)}">${esc(g)}</option>`).join('');
    if (groups.includes(current)) select.value = current;
  }

  function ensurePanelReady() {
    return Boolean($('studentProgressPanel') && cfg?.rpc?.pythonHubStageMatrix);
  }

  function watchTeacherSession() {
    if (!ensurePanelReady()) return;
    const check = () => {
      const t = token();
      if (t && !state.running && !state.data) load(true);
      if (!t && state.data) {
        state.data = null;
        state.expanded.clear();
        $('studentProgressList').innerHTML = '<div class="sp-empty">Inicia sesión maestra para ver el progreso del Python Hub.</div>';
        setLive('error', 'Sesión maestra requerida');
      }
    };
    setInterval(check, 1000);
    window.addEventListener('online', () => { if (token()) load(true); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && token()) load(true); });
    check();
  }

  window.addEventListener('DOMContentLoaded', () => {
    if (!ensurePanelReady()) return;
    bindControls();
    watchTeacherSession();
  });
})();
