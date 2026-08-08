(() => {
  'use strict';

  const cfg = window.IJR_ASSESSMENT_CONFIG;
  const $ = (id) => document.getElementById(id);
  const els = {
    setup: $('setupPanel'), exam: $('examPanel'), finish: $('finishPanel'), config: $('configPanel'),
    form: $('registrationForm'), status: $('setupStatus'), examStatus: $('examStatus'), timer: $('timer'),
    progress: $('progressText'), progressBar: $('progressBar'), topic: $('topicLabel'), prompt: $('questionPrompt'),
    diagram: $('diagram'), answers: $('answerForm'), submit: $('submitAnswer'), attemptBadge: $('attemptBadge'),
    banner: $('integrityBanner'), watermark: $('watermark'), gate: $('fullscreenGate'), returnFullscreen: $('returnFullscreen'),
    finishTitle: $('finishTitle'), finishSummary: $('finishSummary')
  };

  const configured = cfg && /^https:\/\//.test(cfg.supabaseUrl) && cfg.supabaseAnonKey && !cfg.supabaseAnonKey.includes('REPLACE_');
  if (!configured) {
    els.setup.classList.add('hidden');
    els.config.classList.remove('hidden');
    return;
  }

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  const state = {
    attemptId: null,
    attemptToken: null,
    sessionId: crypto.randomUUID(),
    studentLabel: null,
    groupCode: null,
    question: null,
    questionIndex: 0,
    expiresAt: null,
    submitted: false,
    finishing: false,
    strikes: 0,
    hiddenStarted: null,
    heartbeat: null,
    timer: null,
    started: false,
    lastSelected: null
  };

  async function rpc(name, args = {}) {
    const { data, error } = await client.rpc(name, args);
    if (error) throw new Error(error.message || 'Backend error');
    return data;
  }

  function setStatus(el, msg, isError = false) {
    el.textContent = msg || '';
    el.style.color = isError ? '#8b1e1e' : '';
  }

  function shortAttempt() {
    return state.attemptId ? state.attemptId.slice(0, 8).toUpperCase() : '';
  }

  function saveActiveSession() {
    if (!state.attemptId || !state.attemptToken) return;
    sessionStorage.setItem(cfg.studentSessionStorageKey, JSON.stringify({
      attemptId: state.attemptId,
      attemptToken: state.attemptToken,
      studentLabel: state.studentLabel,
      groupCode: state.groupCode
    }));
  }

  function clearActiveSession() {
    sessionStorage.removeItem(cfg.studentSessionStorageKey);
  }

  function updateWatermark() {
    if (!cfg.watermarkEnabled || !state.studentLabel || !state.attemptId) {
      els.watermark.textContent = '';
      return;
    }
    const stamp = new Date().toLocaleTimeString('es-CO', { hour12: false });
    const shortName = state.studentLabel.length > 28 ? `${state.studentLabel.slice(0, 28)}…` : state.studentLabel;
    const token = `${state.groupCode || ''} · ${shortName} · ${shortAttempt()} · ${stamp}`;
    els.watermark.textContent = (token + '     ').repeat(24);
  }

  async function logEvent(type, metadata = {}) {
    if (!state.attemptId || !state.attemptToken) return null;
    try {
      return await rpc(cfg.rpc.event, {
        p_attempt_id: state.attemptId,
        p_attempt_token: state.attemptToken,
        p_question_id: state.question?.id || null,
        p_event_type: type,
        p_client_timestamp: new Date().toISOString(),
        p_visibility_state: document.visibilityState,
        p_fullscreen_state: !!document.fullscreenElement,
        p_metadata: metadata
      });
    } catch (err) {
      console.warn('event log failed', type, err);
      return null;
    }
  }

  function renderDiagram(d) {
    els.diagram.replaceChildren();
    if (!d || !d.type) return;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'border:1px solid #d9d9d9;border-radius:12px;padding:16px;background:#fafafa;display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;min-height:90px';
    const token = (text) => {
      const x = document.createElement('div');
      x.textContent = text;
      x.style.cssText = 'border:1px solid #888;border-radius:8px;padding:9px 12px;background:white;min-width:48px;text-align:center;font-weight:700';
      return x;
    };

    if (d.type === 'stage_tree') {
      const labels = d.stage_labels_es || [];
      const counts = d.stage_counts || [];
      labels.forEach((label, i) => {
        const col = document.createElement('div');
        col.style.textAlign = 'center';
        col.append(token(String(counts[i] ?? '?')));
        const cap = document.createElement('div');
        cap.textContent = label;
        cap.style.cssText = 'font-size:.8rem;color:#555;margin-top:6px';
        col.append(cap);
        wrap.append(col);
        if (i < labels.length - 1) {
          const arrow = document.createElement('span');
          arrow.textContent = '→';
          arrow.style.fontSize = '1.4rem';
          wrap.append(arrow);
        }
      });
    } else if (d.type === 'ordered_slots') {
      wrap.append(token(`${d.n_items ?? '?'} elementos`));
      const arrow = document.createElement('span');
      arrow.textContent = '→';
      wrap.append(arrow);
      for (let i = 0; i < (d.r_slots ?? d.n_items ?? 0); i++) wrap.append(token(`${i + 1}`));
    } else if (d.type === 'repeated_tokens') {
      (d.token_labels || []).forEach(x => wrap.append(token(String(x))));
    } else if (d.type === 'circular_seats') {
      const n = Number(d.n_items || 0);
      const box = document.createElement('div');
      box.style.cssText = 'position:relative;width:180px;height:180px;border:1px solid #aaa;border-radius:50%;background:white';
      for (let i = 0; i < n; i++) {
        const dot = document.createElement('span');
        const a = 2 * Math.PI * i / n - Math.PI / 2;
        dot.textContent = String(i + 1);
        dot.style.cssText = `position:absolute;left:${82 + 68 * Math.cos(a)}px;top:${82 + 68 * Math.sin(a)}px;width:28px;height:28px;border:1px solid #555;border-radius:50%;display:grid;place-items:center;background:#fff;font-size:.75rem;font-weight:700`;
        box.append(dot);
      }
      wrap.append(box);
    }
    els.diagram.append(wrap);
  }

  function renderQuestion(q) {
    state.question = q;
    state.questionIndex = q.order || state.questionIndex + 1;
    state.lastSelected = null;
    els.progress.textContent = `Pregunta ${state.questionIndex} / ${cfg.questionsPerAttempt}`;
    els.progressBar.style.width = `${Math.min(100, state.questionIndex / cfg.questionsPerAttempt * 100)}%`;
    els.topic.textContent = q.topic_label || '';
    els.prompt.textContent = q.prompt || '';
    els.answers.innerHTML = '';
    renderDiagram(q.diagram);
    els.submit.disabled = true;

    (q.options || []).forEach((o, i) => {
      const label = document.createElement('label');
      label.className = 'option';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'answer';
      input.value = o.key;
      input.addEventListener('change', () => {
        const previous = state.lastSelected;
        state.lastSelected = o.key;
        els.submit.disabled = false;
        logEvent('OPTION_SELECTED', { option: o.key, previous_option: previous });
        if (previous && previous !== o.key) logEvent('OPTION_CHANGED', { from: previous, to: o.key });
      });
      const span = document.createElement('span');
      span.textContent = `${String.fromCharCode(65 + i)}. ${o.label}`;
      label.append(input, span);
      els.answers.appendChild(label);
    });

    setStatus(els.examStatus, '');
    logEvent('QUESTION_SHOWN', { order: state.questionIndex });
  }

  function startClocks() {
    clearInterval(state.heartbeat);
    clearInterval(state.timer);
    state.heartbeat = setInterval(() => logEvent('HEARTBEAT', { question_order: state.questionIndex }), cfg.heartbeatMs);
    state.timer = setInterval(timerTick, 500);
    timerTick();
  }

  function timerTick() {
    if (!state.expiresAt) return;
    const ms = new Date(state.expiresAt).getTime() - Date.now();
    const clamped = Math.max(0, ms);
    const s = Math.floor(clamped / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    els.timer.textContent = `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    updateWatermark();
    if (ms <= 0 && !state.finishing) finishAttempt('time_expired');
  }

  async function enterFullscreen() {
    if (!cfg.requireFullscreen || document.fullscreenElement) return true;
    try {
      await document.documentElement.requestFullscreen();
      return true;
    } catch (e) {
      await logEvent('FULLSCREEN_REQUEST_FAILED', { message: e.message });
      return false;
    }
  }

  async function registerStrike(source, durationMs = 0) {
    const result = await logEvent('INTEGRITY_STRIKE', { source, duration_ms: durationMs });
    state.strikes = Number(result?.integrity_strikes ?? (state.strikes + 1));
    els.banner.classList.remove('hidden');
    els.banner.textContent = `Advertencia ${state.strikes}/${cfg.tabStrikeLimit}: se registró ${source}. Al tercer cambio de pestaña confirmado el intento se anula.`;
    if (result?.invalidated || state.strikes >= cfg.tabStrikeLimit) {
      await finishAttempt('auto_invalidated_integrity');
    }
  }

  function showFinish(result, reason = '') {
    state.submitted = true;
    clearInterval(state.heartbeat);
    clearInterval(state.timer);
    els.exam.classList.add('hidden');
    els.setup.classList.add('hidden');
    els.timer.classList.add('hidden');
    els.gate.classList.add('hidden');
    els.finish.classList.remove('hidden');
    const invalid = String(result?.status || reason).includes('invalidated');
    els.finishTitle.textContent = invalid ? 'Intento anulado automáticamente' : 'Evaluación enviada correctamente';
    if (invalid) els.finishTitle.classList.add('invalidated');
    const rows = [
      ['Estado', result?.status || reason || 'submitted'],
      ['Respuestas', `${result?.answered_count ?? state.questionIndex}/${cfg.questionsPerAttempt}`],
      ['Puntaje', result?.raw_points != null ? `${Number(result.raw_points).toFixed(2)} / ${cfg.maxRawPoints}` : 'Pendiente'],
      ['Nota', result?.grade != null ? `${Number(result.grade).toFixed(2)} / ${cfg.gradeMax}` : 'Pendiente'],
      ['Aprobación', result?.grade != null ? (Number(result.grade) >= cfg.passingGrade ? 'Sí' : 'No') : 'Pendiente']
    ];
    els.finishSummary.innerHTML = rows.map(([a, b]) => `<div class="summary-row"><strong>${a}</strong><span>${b}</span></div>`).join('');
  }

  async function finishAttempt(reason = 'student_finished') {
    if (state.finishing || !state.attemptId || !state.attemptToken) return;
    state.finishing = true;
    try {
      const result = await rpc(cfg.rpc.finish, {
        p_attempt_id: state.attemptId,
        p_attempt_token: state.attemptToken,
        p_reason: reason
      });
      clearActiveSession();
      showFinish(result, reason);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch (err) {
      state.finishing = false;
      setStatus(els.examStatus, 'No se pudo confirmar el cierre. Mantén esta pestaña abierta y avisa al docente.', true);
    }
  }

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus(els.status, 'Validando lista institucional y preparando intento…');
    const studentName = $('studentName').value.trim();
    const groupCode = $('groupCode').value;
    if (studentName.length < 5 || !groupCode) {
      setStatus(els.status, 'Selecciona tu grupo y escribe tu nombre completo.', true);
      return;
    }

    try {
      const result = await rpc(cfg.rpc.start, {
        p_assessment_slug: cfg.assessmentSlug,
        p_student_name: studentName,
        p_group_code: groupCode,
        p_session_id: state.sessionId,
        p_user_agent: navigator.userAgent
      });

      state.attemptId = result.attempt_id;
      state.attemptToken = result.attempt_token;
      state.studentLabel = result.student_label || studentName;
      state.groupCode = result.group_code || groupCode;
      state.expiresAt = result.expires_at;
      state.strikes = Number(result.integrity_strikes || 0);
      state.started = true;
      saveActiveSession();

      els.attemptBadge.textContent = `Intento ${shortAttempt()}`;
      els.setup.classList.add('hidden');
      els.exam.classList.remove('hidden');
      els.timer.classList.remove('hidden');
      const fsOk = await enterFullscreen();
      if (cfg.requireFullscreen && !fsOk) els.gate.classList.remove('hidden');
      updateWatermark();
      renderQuestion(result.question);
      startClocks();
      setStatus(els.status, '');
      await logEvent('ATTEMPT_STARTED', { session_id: state.sessionId, registration_mode: 'institutional_roster' });
    } catch (err) {
      setStatus(els.status, `No fue posible iniciar: ${err.message}`, true);
    }
  });

  els.submit.addEventListener('click', async () => {
    const selected = els.answers.querySelector('input[name=answer]:checked');
    if (!selected || !state.question) return;
    els.submit.disabled = true;
    [...els.answers.elements].forEach(x => x.disabled = true);
    setStatus(els.examStatus, 'Enviando respuesta…');

    try {
      await logEvent('ANSWER_SUBMIT_STARTED', { selected_option: selected.value });
      const result = await rpc(cfg.rpc.submit, {
        p_attempt_id: state.attemptId,
        p_attempt_token: state.attemptToken,
        p_question_id: state.question.id,
        p_selected_option: selected.value
      });
      await logEvent('ANSWER_ACKNOWLEDGED', { question_id: state.question.id });
      if (result.finished) {
        await finishAttempt('all_questions_answered');
        return;
      }
      renderQuestion(result.next_question);
    } catch (err) {
      els.submit.disabled = false;
      [...els.answers.elements].forEach(x => x.disabled = false);
      setStatus(els.examStatus, `La respuesta no quedó confirmada: ${err.message}`, true);
    }
  });

  document.addEventListener('visibilitychange', async () => {
    if (!state.started || state.submitted) return;
    if (document.visibilityState === 'hidden') {
      state.hiddenStarted = performance.now();
      await logEvent('VISIBILITY_HIDDEN');
    } else {
      const duration = state.hiddenStarted ? Math.round(performance.now() - state.hiddenStarted) : 0;
      state.hiddenStarted = null;
      await logEvent('VISIBILITY_VISIBLE', { hidden_duration_ms: duration });
      if (duration >= cfg.hiddenGraceMs) await registerStrike('cambio de pestaña', duration);
    }
  });

  window.addEventListener('blur', () => { if (state.started && !state.submitted) logEvent('WINDOW_BLUR'); });
  window.addEventListener('focus', () => { if (state.started && !state.submitted) logEvent('WINDOW_FOCUS'); });

  document.addEventListener('fullscreenchange', async () => {
    if (!state.started || state.submitted) return;
    if (document.fullscreenElement) {
      els.gate.classList.add('hidden');
      await logEvent('FULLSCREEN_ENTER');
    } else {
      await logEvent('FULLSCREEN_EXIT');
      if (cfg.fullscreenPolicy === 'pause') els.gate.classList.remove('hidden');
    }
  });

  els.returnFullscreen.addEventListener('click', async () => {
    const ok = await enterFullscreen();
    if (ok) els.gate.classList.add('hidden');
  });

  ['copy', 'cut', 'paste'].forEach(type => document.addEventListener(type, e => {
    if (!state.started || state.submitted) return;
    logEvent(`${type.toUpperCase()}_ATTEMPT`);
    if (cfg.blockCopyPaste) e.preventDefault();
  }));

  document.addEventListener('contextmenu', e => {
    if (!state.started || state.submitted) return;
    logEvent('CONTEXT_MENU');
    if (cfg.blockContextMenu) e.preventDefault();
  });

  window.addEventListener('offline', () => {
    if (state.started && !state.submitted) {
      logEvent('NETWORK_OFFLINE');
      setStatus(els.examStatus, 'Conexión perdida. No avances hasta recuperar conexión.', true);
    }
  });

  window.addEventListener('online', () => {
    if (state.started && !state.submitted) {
      logEvent('NETWORK_ONLINE');
      setStatus(els.examStatus, 'Conexión recuperada.');
    }
  });

  window.addEventListener('pagehide', () => {
    if (state.started && !state.submitted) logEvent('PAGE_HIDE');
  });

  document.addEventListener('keydown', e => {
    if (!state.started || state.submitted) return;
    if (e.key === 'PrintScreen') {
      logEvent('SCREENSHOT_KEY_ATTEMPT', { key: 'PrintScreen' });
      els.banner.classList.remove('hidden');
      els.banner.textContent = 'Capturas de pantalla prohibidas. Se registró una tecla de captura observable por el navegador.';
    }
    if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 'p') {
      e.preventDefault();
      logEvent('PRINT_SHORTCUT');
    }
  });

  window.addEventListener('beforeunload', e => {
    if (state.started && !state.submitted) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel('ijr-stat11-assessment');
    channel.postMessage({ type: 'HELLO', sessionId: state.sessionId });
    channel.onmessage = (ev) => {
      if (ev.data?.type === 'HELLO' && ev.data.sessionId !== state.sessionId) {
        channel.postMessage({ type: 'ACTIVE', sessionId: state.sessionId });
      }
      if (ev.data?.type === 'ACTIVE' && state.started && !state.submitted) {
        logEvent('SECOND_TAB_DETECTED');
        els.banner.classList.remove('hidden');
        els.banner.textContent = 'Se detectó otra pestaña del examen. Ciérrala y continúa únicamente aquí.';
      }
    };
  }

  async function restoreActiveAttempt() {
    const raw = sessionStorage.getItem(cfg.studentSessionStorageKey);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      if (!saved.attemptId || !saved.attemptToken) return clearActiveSession();
      state.attemptId = saved.attemptId;
      state.attemptToken = saved.attemptToken;
      state.studentLabel = saved.studentLabel || '';
      state.groupCode = saved.groupCode || '';

      const result = await rpc(cfg.rpc.resume, {
        p_attempt_id: state.attemptId,
        p_attempt_token: state.attemptToken
      });

      if (result.closed) {
        clearActiveSession();
        showFinish(result, result.status);
        return;
      }

      state.studentLabel = result.student_label || state.studentLabel;
      state.groupCode = result.group_code || state.groupCode;
      state.expiresAt = result.expires_at;
      state.strikes = Number(result.integrity_strikes || 0);
      state.started = true;
      els.attemptBadge.textContent = `Intento ${shortAttempt()}`;
      els.setup.classList.add('hidden');
      els.exam.classList.remove('hidden');
      els.timer.classList.remove('hidden');

      if (result.expired) {
        await finishAttempt('time_expired');
        return;
      }

      renderQuestion(result.question);
      updateWatermark();
      startClocks();
      if (cfg.requireFullscreen && !document.fullscreenElement) els.gate.classList.remove('hidden');
      await logEvent('ATTEMPT_RESUMED', { reason: 'page_restore' });
    } catch (err) {
      console.warn('Could not restore attempt', err);
      clearActiveSession();
    }
  }

  restoreActiveAttempt();
})();
