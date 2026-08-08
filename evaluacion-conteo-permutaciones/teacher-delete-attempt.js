(() => {
  'use strict';

  const cfg = window.IJR_ASSESSMENT_CONFIG;
  if (!cfg || !window.supabase) return;

  const $ = id => document.getElementById(id);
  const TOKEN_KEY = 'ijr-stat11-teacher-code-session-v2';
  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false }
  });

  let selectedAttempt = null;

  function setStatus(message, isError = false) {
    const node = $('teacherStatus');
    if (!node) return;
    node.textContent = message || '';
    node.style.color = isError ? '#8b1e1e' : '';
  }

  function installStyles() {
    if ($('teacherDeleteAttemptStyle')) return;
    const style = document.createElement('style');
    style.id = 'teacherDeleteAttemptStyle';
    style.textContent = `
      #teacherDeleteAttempt {
        background:#9f1d1d;
        border-color:#9f1d1d;
        color:#fff;
      }
      #teacherDeleteAttempt:hover:not(:disabled) {
        background:#7f1515;
        border-color:#7f1515;
      }
      #teacherDeleteAttempt:disabled {
        background:#d8d8d8;
        border-color:#d8d8d8;
        color:#737373;
        cursor:not-allowed;
      }
      .delete-attempt-note {
        margin-top:8px;
        padding:10px 12px;
        border-left:3px solid #9f1d1d;
        background:#fff7f7;
        font-size:.86rem;
        line-height:1.4;
      }
    `;
    document.head.appendChild(style);
  }

  function installButton() {
    if ($('teacherDeleteAttempt')) return $('teacherDeleteAttempt');
    const actions = document.querySelector('.attempt-actions');
    if (!actions) return null;

    const button = document.createElement('button');
    button.id = 'teacherDeleteAttempt';
    button.type = 'button';
    button.className = 'primary compact';
    button.disabled = true;
    button.textContent = 'Eliminar registro';
    button.title = 'Elimina únicamente el intento seleccionado y su trazabilidad asociada. El roster institucional se conserva.';
    actions.appendChild(button);

    const note = document.createElement('div');
    note.className = 'delete-attempt-note';
    note.innerHTML = '<strong>Eliminación individual:</strong> selecciona una fila. El borrado elimina el intento, respuestas, eventos y reporte asociado, pero conserva el estudiante en el roster. Requiere escribir <strong>ELIMINAR</strong> para confirmar.';
    actions.insertAdjacentElement('afterend', note);

    button.addEventListener('click', deleteSelectedAttempt);
    return button;
  }

  function filteredAttempts(rows) {
    const search = String($('teacherAttemptSearch')?.value || '').trim().toLowerCase();
    const group = $('teacherAttemptGroupFilter')?.value || '';
    const status = $('teacherAttemptStatusFilter')?.value || '';
    const risk = $('teacherIntegrityFilter')?.value || '';

    return Array.from(rows || []).filter(row => {
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

  async function snapshot() {
    const teacherToken = sessionStorage.getItem(TOKEN_KEY) || '';
    if (!teacherToken || teacherToken === 'LOCAL-FALLBACK') throw new Error('La eliminación requiere una sesión docente conectada al backend.');
    const { data, error } = await client.rpc(cfg.teacherRpc.snapshot, {
      p_teacher_token:teacherToken,
      p_assessment_slug:cfg.assessmentSlug
    });
    if (error) throw new Error(error.message || 'No fue posible leer los intentos.');
    return data;
  }

  async function selectFromClickedRow(row) {
    const button = installButton();
    if (!button) return;
    selectedAttempt = null;
    button.disabled = true;

    try {
      const snap = await snapshot();
      const rows = filteredAttempts(snap?.attempts || []);
      const tbody = $('teacherAttemptsTable')?.querySelector('tbody');
      if (!tbody) return;
      const domRows = Array.from(tbody.querySelectorAll('tr'));
      const index = domRows.indexOf(row);
      if (index < 0 || index >= rows.length) return;

      const attempt = rows[index];
      if (!attempt?.id || String(attempt.id).startsWith('LOCAL-')) return;
      selectedAttempt = attempt;
      button.disabled = false;
      button.textContent = `Eliminar registro · ${String(attempt.student_name || 'estudiante').slice(0,28)}`;
    } catch (err) {
      setStatus(err.message, true);
    }
  }

  async function deleteSelectedAttempt() {
    if (!selectedAttempt) {
      setStatus('Selecciona primero un intento en la tabla.', true);
      return;
    }

    const a = selectedAttempt;
    const activeWarning = a.status === 'active'
      ? '\n\nATENCIÓN: este intento está ACTIVO. Eliminarlo terminará inmediatamente la sesión del estudiante.'
      : '';
    const summary = [
      `Estudiante: ${a.student_name || '—'}`,
      `Correo: ${a.student_email || '—'}`,
      `Grupo: ${a.group_code || '—'}`,
      `Estado: ${a.status || '—'}`,
      `Progreso: ${a.answered_count ?? 0}/${cfg.questionsPerAttempt}`
    ].join('\n');

    if (!window.confirm(`¿Eliminar definitivamente este registro?\n\n${summary}${activeWarning}\n\nEl roster institucional NO será eliminado. Esta acción no se puede deshacer desde la interfaz.`)) return;

    const typed = window.prompt('Confirmación final: escribe exactamente ELIMINAR para borrar este intento.');
    if (String(typed || '').trim().toUpperCase() !== 'ELIMINAR') {
      setStatus('Eliminación cancelada: la confirmación escrita no coincide.', true);
      return;
    }

    const button = $('teacherDeleteAttempt');
    if (button) {
      button.disabled = true;
      button.textContent = 'Eliminando…';
    }

    try {
      const teacherToken = sessionStorage.getItem(TOKEN_KEY) || '';
      if (!teacherToken || teacherToken === 'LOCAL-FALLBACK') throw new Error('La sesión docente no está conectada al backend.');

      const { data, error } = await client.rpc('teacher_delete_attempt', {
        p_teacher_token:teacherToken,
        p_assessment_slug:cfg.assessmentSlug,
        p_attempt_id:a.id,
        p_confirmation:'ELIMINAR'
      });
      if (error) throw new Error(error.message || 'No fue posible eliminar el intento.');
      if (!data?.deleted) throw new Error('El backend no confirmó la eliminación.');

      const deletedName = data.student_name || a.student_name || 'estudiante';
      selectedAttempt = null;
      const detail = $('teacherAttemptDetail');
      if (detail) detail.innerHTML = `<div class="notice"><strong>Registro eliminado.</strong> Se eliminó el intento de ${deletedName}. El roster institucional permanece intacto.</div>`;
      setStatus(`Registro eliminado correctamente: ${deletedName}. Respuestas eliminadas: ${data.responses_deleted ?? 0}; eventos eliminados: ${data.events_deleted ?? 0}; asignaciones liberadas: ${data.assignments_released ?? 0}.`);

      // Reuse the existing dashboard refresh pipeline so all metrics and rows
      // are recalculated by the canonical teacher module.
      $('teacherRefresh')?.click();
      window.setTimeout(() => {
        if (button) {
          button.disabled = true;
          button.textContent = 'Eliminar registro';
        }
      }, 700);
    } catch (err) {
      setStatus(`No fue posible eliminar el registro: ${err.message}`, true);
      if (button) {
        button.disabled = false;
        button.textContent = 'Eliminar registro';
      }
    }
  }

  function resetSelection() {
    selectedAttempt = null;
    const button = $('teacherDeleteAttempt');
    if (button) {
      button.disabled = true;
      button.textContent = 'Eliminar registro';
    }
  }

  function init() {
    installStyles();
    installButton();

    const table = $('teacherAttemptsTable');
    if (table) {
      table.addEventListener('click', event => {
        const row = event.target.closest('tbody tr');
        if (!row || row.querySelector('td[colspan]')) return;
        // Let teacher-mode.js finish its own row-selection work first.
        window.setTimeout(() => selectFromClickedRow(row), 0);
      });
    }

    ['teacherRefresh','teacherLogout','teacherAttemptSearch','teacherAttemptGroupFilter','teacherAttemptStatusFilter','teacherIntegrityFilter']
      .forEach(id => $(id)?.addEventListener(id === 'teacherAttemptSearch' ? 'input' : 'click', resetSelection));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
