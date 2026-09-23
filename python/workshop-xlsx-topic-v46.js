(() => {
  'use strict';

  const VERSION = 'v46';
  const TOPIC = 'logic';
  const CLASS_FILE = 'pandas_excel_students.xlsx';
  const CLASS_DATASET_URL = 'data/pandas_excel_students.xlsx';
  const MAX_FILE_BYTES = 8 * 1024 * 1024;
  const params = new URLSearchParams(location.search);
  const requestedTopic = params.get('topic') || 'statistics';
  if (requestedTopic !== TOPIC) return;

  const state = {
    runtime: null,
    runtimePromise: null,
    packagesPromise: null,
    packagesReady: false,
    preparingRun: false,
    files: new Map(),
    activeFile: null,
    workspace: null,
    queuedSync: false
  };

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[char]));

  function safeFileName(name) {
    const cleaned = String(name || 'dataset.xlsx').replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');
    return cleaned || 'dataset.xlsx';
  }

  function readableBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function setStatus(message, tone = '') {
    const element = document.getElementById('v46FileStatus');
    if (!element) return;
    element.className = `v45-file-status ${tone}`.trim();
    element.textContent = message;
  }

  function setInspector(mode, message) {
    const inspector = document.getElementById('v46InspectorBody');
    if (!inspector) return;
    inspector.dataset.state = mode;
    inspector.innerHTML = `<div class="v45-inspector-placeholder ${escapeHtml(mode)}"><span class="v45-inspector-icon" aria-hidden="true">${mode === 'loading' ? '◌' : mode === 'error' ? '!' : '▦'}</span><p>${escapeHtml(message)}</p></div>`;
  }

  function wrapPyodideLoader() {
    const loader = window.loadPyodide;
    if (typeof loader !== 'function' || loader.__ijrXlsxV46Wrapped) return;
    const wrapped = async function(...args) {
      const runtime = await loader.apply(this, args);
      state.runtime = runtime;
      window.IJR_XLSX_RUNTIME_V46 = runtime;
      window.dispatchEvent(new CustomEvent('ijr:xlsx-runtime-v46-ready'));
      return runtime;
    };
    Object.defineProperty(wrapped, '__ijrXlsxV46Wrapped', { value:true });
    window.loadPyodide = wrapped;
  }

  const originalHeadAppend = document.head.appendChild;
  document.head.appendChild = function(node) {
    if (node?.tagName === 'SCRIPT' && /\/pyodide\.js(?:\?|$)/.test(node.src || '')) {
      const originalOnload = node.onload;
      node.onload = function(event) {
        wrapPyodideLoader();
        return typeof originalOnload === 'function' ? originalOnload.call(this, event) : undefined;
      };
      document.head.appendChild = originalHeadAppend;
    }
    return originalHeadAppend.call(this, node);
  };
  wrapPyodideLoader();

  async function waitForRuntime() {
    if (state.runtime) return state.runtime;
    if (window.IJR_XLSX_RUNTIME_V46) {
      state.runtime = window.IJR_XLSX_RUNTIME_V46;
      return state.runtime;
    }
    if (state.runtimePromise) return state.runtimePromise;

    state.runtimePromise = new Promise((resolve, reject) => {
      let settled = false;
      let poll = null;
      const cleanup = () => {
        window.removeEventListener('ijr:xlsx-runtime-v46-ready', onReady);
        if (poll) clearInterval(poll);
      };
      const finish = runtime => {
        if (settled || !runtime) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        state.runtime = runtime;
        resolve(runtime);
      };
      const onReady = () => finish(window.IJR_XLSX_RUNTIME_V46);
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        state.runtimePromise = null;
        reject(new Error('Python runtime did not become ready in time.'));
      }, 60000);

      window.addEventListener('ijr:xlsx-runtime-v46-ready', onReady);
      document.getElementById('connectButton')?.click();
      poll = setInterval(() => finish(window.IJR_XLSX_RUNTIME_V46), 100);
    }).catch(error => {
      state.runtimePromise = null;
      throw error;
    });

    return state.runtimePromise;
  }

  async function ensurePackages(runtime) {
    if (state.packagesPromise) return state.packagesPromise;
    state.packagesPromise = (async () => {
      setStatus('Preparing pandas + Excel reader…', 'loading');
      try {
        await runtime.loadPackage(['pandas', 'openpyxl']);
      } catch {
        await runtime.loadPackage('pandas');
        await runtime.loadPackage('micropip');
        await runtime.runPythonAsync("import micropip\nawait micropip.install('openpyxl==3.1.5')");
      }
      state.packagesReady = true;
      setStatus('openpyxl + pandas ready in this runtime.', 'ready');
    })().catch(error => {
      state.packagesPromise = null;
      setStatus(`Could not prepare Excel tools: ${error.message}`, 'error');
      throw error;
    });
    return state.packagesPromise;
  }

  function renderFileTree() {
    const tree = document.getElementById('v46FileTree');
    if (!tree) return;
    const files = [...state.files.values()];
    if (!files.length) {
      tree.innerHTML = '<div class="v45-file-empty">No files in session storage yet.</div>';
      return;
    }
    tree.innerHTML = files.map(file => `
      <button type="button" class="v45-file-row ${file.name === state.activeFile ? 'active' : ''}" data-v46-file="${escapeHtml(file.name)}">
        <span class="v45-file-icon" aria-hidden="true">▤</span>
        <span class="v45-file-copy"><strong>${escapeHtml(file.name)}</strong><small>${escapeHtml(readableBytes(file.bytes))} · ${escapeHtml(file.source)}</small></span>
      </button>
    `).join('');
    tree.querySelectorAll('[data-v46-file]').forEach(button => {
      button.addEventListener('click', async () => {
        const name = button.dataset.v46File;
        if (!state.files.has(name)) return;
        state.activeFile = name;
        renderFileTree();
        try { await inspectWorkbook(name); } catch (error) { setInspector('error', error.message); }
      });
    });
  }

  function renderInspector(payload, fileName) {
    const inspector = document.getElementById('v46InspectorBody');
    if (!inspector) return;
    const columns = Array.isArray(payload.column_names) ? payload.column_names : [];
    const preview = Array.isArray(payload.preview) ? payload.preview : [];
    const means = payload.numeric_means || {};
    inspector.dataset.state = 'ready';
    inspector.innerHTML = `
      <div class="v45-inspector-topline">
        <div><span class="v45-inspector-label">Visual inspect</span><strong>${escapeHtml(fileName)}</strong></div>
        <span class="v45-sheet-pill">Sheet: ${escapeHtml(payload.sheet || 'first sheet')}</span>
      </div>
      <div class="v45-metric-grid">
        <div class="v45-metric"><span>Rows</span><strong>${Number(payload.rows || 0)}</strong></div>
        <div class="v45-metric"><span>Columns</span><strong>${Number(payload.columns || 0)}</strong></div>
        <div class="v45-metric v45-metric-wide"><span>Column names</span><strong>${escapeHtml(columns.join(' · '))}</strong></div>
      </div>
      <div class="v45-preview-heading"><strong>First 5 rows</strong><span>Equivalent to <code>df.head()</code></span></div>
      <div class="v45-table-wrap"><table class="v45-preview-table"><thead><tr>${columns.map(column => `<th scope="col">${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${preview.map(row => `<tr>${columns.map(column => `<td>${escapeHtml(row?.[column] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <div class="v45-mean-block">
        <div><strong>Basic numeric inspection</strong><span>Means calculated directly from numeric workbook columns.</span></div>
        <div class="v45-mean-chips">${Object.entries(means).slice(0, 6).map(([column, value]) => `<span><code>${escapeHtml(column)}</code> mean = ${escapeHtml(value)}</span>`).join('')}</div>
      </div>
    `;
  }

  async function inspectWorkbook(fileName) {
    const runtime = await waitForRuntime();
    await ensurePackages(runtime);
    setInspector('loading', `Reading ${fileName} with pandas…`);
    const python = `
import json
import pandas as pd
_v46_excel = pd.ExcelFile(${JSON.stringify(fileName)})
_v46_sheet = _v46_excel.sheet_names[0]
_v46_df = pd.read_excel(_v46_excel, sheet_name=_v46_sheet)
_v46_head = _v46_df.head(5).copy().where(pd.notna(_v46_df.head(5)), "")
_v46_numeric = _v46_df.select_dtypes(include="number")
_v46_means = {str(c): round(float(_v46_numeric[c].mean()), 3) for c in _v46_numeric.columns}
json.dumps({
  "sheet": str(_v46_sheet),
  "rows": int(_v46_df.shape[0]),
  "columns": int(_v46_df.shape[1]),
  "column_names": [str(c) for c in _v46_df.columns],
  "preview": _v46_head.astype(str).to_dict(orient="records"),
  "numeric_means": _v46_means
}, ensure_ascii=False)
`;
    const result = await runtime.runPythonAsync(python);
    let raw;
    try { raw = String(result); } finally { if (result && typeof result.destroy === 'function') result.destroy(); }
    const payload = JSON.parse(raw);
    renderInspector(payload, fileName);
    setStatus(`Mounted and inspected: ${fileName}`, 'ready');
    document.documentElement.dataset.xlsxTopicReady = VERSION;
    return payload;
  }

  async function mountWorkbook(name, bytes, source) {
    if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);
    if (!/\.xlsx$/i.test(name)) throw new Error('Only .xlsx Excel workbooks are supported in this topic.');
    if (bytes.byteLength > MAX_FILE_BYTES) throw new Error('This file is larger than the 8 MB classroom limit.');
    const safeName = safeFileName(name);
    const runtime = await waitForRuntime();
    await ensurePackages(runtime);
    if (!runtime.FS || typeof runtime.FS.writeFile !== 'function') throw new Error('The Python runtime file system is unavailable.');
    const pyPath = `/home/pyodide/${safeName}`;
    try { runtime.FS.unlink(pyPath); } catch {}
    runtime.FS.writeFile(pyPath, bytes);
    state.files.set(safeName, { name:safeName, bytes:bytes.byteLength, source });
    state.activeFile = safeName;
    renderFileTree();
    await inspectWorkbook(safeName);
    return safeName;
  }

  async function loadClassDataset() {
    setStatus('Downloading the class .xlsx workbook…', 'loading');
    setInspector('loading', 'Loading the class workbook into session storage…');
    const response = await fetch(CLASS_DATASET_URL, { cache:'no-store' });
    if (!response.ok) throw new Error(`Class workbook download failed (${response.status}).`);
    return mountWorkbook(CLASS_FILE, new Uint8Array(await response.arrayBuffer()), 'class dataset');
  }

  async function uploadLocalFile(file) {
    if (!file) return;
    return mountWorkbook(file.name, new Uint8Array(await file.arrayBuffer()), 'uploaded file');
  }

  function createWorkspace() {
    if (document.getElementById('xlsxTopicWorkspaceV46')) return document.getElementById('xlsxTopicWorkspaceV46');
    const codeCell = document.getElementById('codeNotebookCell');
    if (!codeCell) return null;

    const section = document.createElement('section');
    section.id = 'xlsxTopicWorkspaceV46';
    section.className = 'v45-excel-workspace';
    section.setAttribute('aria-label', 'XLSX Files panel and DataFrame inspector');
    section.innerHTML = `
      <aside class="v45-files-pane" aria-label="Files">
        <div class="v45-files-head"><div><span class="v45-files-icon" aria-hidden="true">▣</span><strong>Files</strong></div><span>Session storage</span></div>
        <div class="v45-files-toolbar">
          <button id="v46UploadButton" class="v45-upload-button" type="button"><span aria-hidden="true">⇧</span> Upload .xlsx</button>
          <button id="v46ClassDatasetButton" class="v45-class-button" type="button">Use class dataset</button>
          <input id="v46UploadInput" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>
        </div>
        <div id="v46Dropzone" class="v45-dropzone" tabindex="0"><strong>Drop an Excel file here</strong><span>or use Upload .xlsx, like the Colab Files pane.</span></div>
        <div class="v45-class-dataset-note"><div><strong>Class workbook</strong><code>${CLASS_FILE}</code></div><a href="${CLASS_DATASET_URL}" download="${CLASS_FILE}">Download</a></div>
        <div id="v46FileTree" class="v45-file-tree"><div class="v45-file-empty">No files in session storage yet.</div></div>
        <div id="v46FileStatus" class="v45-file-status">Class 1 starts with core libraries. The real XLSX workbook is prepared automatically when a file stage needs it.</div>
      </aside>
      <section class="v45-inspector-pane" aria-label="Dataset visual inspection">
        <div class="v45-inspector-head"><div><span class="v45-inspector-label">Dataset inspector</span><strong>XLSX → pandas DataFrame</strong></div><div class="v45-runtime-badge"><span></span> real workbook</div></div>
        <div id="v46InspectorBody" class="v45-inspector-body" data-state="empty"><div class="v45-inspector-placeholder empty"><span class="v45-inspector-icon" aria-hidden="true">▦</span><p>Load the .xlsx workbook to inspect rows, columns, first records and numeric summaries before coding.</p></div></div>
      </section>
    `;
    codeCell.before(section);
    state.workspace = section;

    const uploadInput = section.querySelector('#v46UploadInput');
    section.querySelector('#v46UploadButton').addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', async () => {
      try { await uploadLocalFile(uploadInput.files?.[0]); }
      catch (error) { setStatus(error.message, 'error'); setInspector('error', error.message); }
      finally { uploadInput.value = ''; }
    });

    const classButton = section.querySelector('#v46ClassDatasetButton');
    classButton.addEventListener('click', async () => {
      classButton.disabled = true;
      try { await loadClassDataset(); }
      catch (error) { setStatus(error.message, 'error'); setInspector('error', error.message); }
      finally { classButton.disabled = false; }
    });

    const dropzone = section.querySelector('#v46Dropzone');
    for (const type of ['dragenter', 'dragover']) dropzone.addEventListener(type, event => { event.preventDefault(); dropzone.classList.add('dragging'); });
    for (const type of ['dragleave', 'drop']) dropzone.addEventListener(type, event => { event.preventDefault(); dropzone.classList.remove('dragging'); });
    dropzone.addEventListener('drop', async event => {
      try { await uploadLocalFile(event.dataTransfer?.files?.[0]); }
      catch (error) { setStatus(error.message, 'error'); setInspector('error', error.message); }
    });
    dropzone.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); uploadInput.click(); }
    });

    const activeStageNumber = () => {
      const text = document.getElementById('problemKicker')?.textContent || '';
      const match = text.match(/STAGE\s+(\d+)/i);
      return match ? Number(match[1]) : 1;
    };
    const needsPackages = stage => stage >= 4;
    const needsClassWorkbook = stage => [4,5,7,8,9,10,11,12].includes(stage);

    document.getElementById('runButton')?.addEventListener('click', event => {
      const choiceMode = !document.getElementById('choiceEditor')?.classList.contains('hidden');
      if (choiceMode) return;
      const stage = activeStageNumber();
      if (!needsPackages(stage)) return;
      const workbookReady = state.files.has(CLASS_FILE);
      if (state.packagesReady && (!needsClassWorkbook(stage) || workbookReady)) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      if (state.preparingRun) return;
      state.preparingRun = true;

      (async () => {
        try {
          setStatus(stage <= 6 ? 'Preparing Class 1 Excel tools…' : 'Preparing Class 2 Pandas tools…', 'loading');
          if (needsClassWorkbook(stage) && !state.files.has(CLASS_FILE)) {
            await loadClassDataset();
          } else {
            const runtime = await waitForRuntime();
            await ensurePackages(runtime);
          }
          state.activeFile = state.files.has(CLASS_FILE) ? CLASS_FILE : state.activeFile;
          renderFileTree();
          setStatus(`Ready for Stage ${stage}: ${stage <= 6 ? 'libraries + XLSX' : 'Pandas + DataFrame'}.`, 'ready');
          requestAnimationFrame(() => document.getElementById('runButton')?.click());
        } catch (error) {
          setStatus(`Could not prepare this stage: ${error.message}`, 'error');
          setInspector('error', error.message);
          section.scrollIntoView({ behavior:'smooth', block:'center' });
        } finally {
          state.preparingRun = false;
        }
      })();
    }, true);

    return section;
  }

  function syncGuide() {
    const concept = document.getElementById('guideConcept');
    const subtitle = document.getElementById('notebookSubtitle');
    const kicker = document.getElementById('problemKicker')?.textContent || '';
    const match = kicker.match(/STAGE\s+(\d+)/i);
    const stage = match ? Number(match[1]) : 1;
    // V63: workshop-v42 now provides stage-specific concepts for Topic 04.
    // Keep those explicit concepts instead of replacing them with one generic class label.
    if (concept && !concept.textContent.trim()) concept.textContent = stage <= 6
      ? 'Class 1 · library → file path → XLSX workbook'
      : 'Class 2 · Pandas → DataFrame → inspect → transform → export';
    if (subtitle) subtitle.textContent = stage <= 6
      ? 'Class 1 of 2 · Libraries + XLSX · Colab workflow'
      : 'Class 2 of 2 · Pandas · Colab workflow';
  }

  function syncUi() {
    createWorkspace();
    syncGuide();
    document.documentElement.dataset.xlsxTopic = VERSION;
  }

  function scheduleSync() {
    if (state.queuedSync) return;
    state.queuedSync = true;
    requestAnimationFrame(() => { state.queuedSync = false; syncUi(); });
  }

  function start() {
    syncUi();
    const app = document.getElementById('workshopApp');
    if (app) {
      const observer = new MutationObserver(scheduleSync);
      observer.observe(app, { subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['class'] });
    }
    document.addEventListener('click', event => {
      if (event.target.closest('[data-stage], #previousButton, #nextButton, #resetButton')) scheduleSync();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();