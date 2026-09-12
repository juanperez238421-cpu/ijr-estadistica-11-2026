(() => {
  'use strict';

  const VERSION = 'v45';
  const CLASS_FILE = 'stat11_stage4_students.xlsx';
  const CLASS_DATASET_URL = 'data/stat11_stage4_students.xlsx';
  const MAX_FILE_BYTES = 8 * 1024 * 1024;
  const params = new URLSearchParams(location.search);
  const requestedTopic = params.get('topic') || 'statistics';
  const topicMap = window.IJR_PYTHON_HUB_TOPIC_MAP || {};
  const topicList = window.IJR_PYTHON_HUB_TOPICS || [];
  const statisticsTopic = topicMap.statistics || topicList.find(item => item.slug === 'statistics');

  if (requestedTopic !== 'statistics' || !statisticsTopic) return;

  const stage4 = (statisticsTopic.exercises || []).find(exercise => exercise.key === 'stat-04');
  if (stage4) {
    stage4.title = 'Excel dataset: upload, read and operate';
    stage4.prompt = 'Use the Colab-style Files panel below. For this graded stage, load the class workbook "stat11_stage4_students.xlsx". Read it with pandas using pd.read_excel(...), inspect its rows, columns and first records, and perform a basic filter on the score column. In your final validated run, print only the number of rows whose score is at least 90. Do not type the final number directly.';
    stage4.mode = 'code';
    stage4.code = '';
  }

  const excelState = {
    runtime: null,
    runtimePromise: null,
    packagesPromise: null,
    files: new Map(),
    activeFile: null,
    queuedSync: false,
    workspace: null
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[char]));
  }

  function safeFileName(name) {
    const cleaned = String(name || 'dataset.xlsx').replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');
    return cleaned || 'dataset.xlsx';
  }

  function readableBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function isStage4Active() {
    return /^STAGE\s+4\s+OF/i.test(document.getElementById('problemKicker')?.textContent || '');
  }

  function setWorkspaceStatus(message, tone = '') {
    const status = document.getElementById('v45FileStatus');
    if (!status) return;
    status.className = `v45-file-status ${tone}`.trim();
    status.textContent = message;
  }

  function setInspectorState(mode, message) {
    const inspector = document.getElementById('v45InspectorBody');
    if (!inspector) return;
    inspector.dataset.state = mode;
    inspector.innerHTML = `<div class="v45-inspector-placeholder ${escapeHtml(mode)}"><span class="v45-inspector-icon" aria-hidden="true">${mode === 'loading' ? '◌' : mode === 'error' ? '!' : '▦'}</span><p>${escapeHtml(message)}</p></div>`;
  }

  function wrapPyodideLoader() {
    const loader = window.loadPyodide;
    if (typeof loader !== 'function' || loader.__ijrExcelV45Wrapped) return;
    const wrapped = async function(...args) {
      const runtime = await loader.apply(this, args);
      excelState.runtime = runtime;
      window.IJR_EXCEL_RUNTIME_V45 = runtime;
      window.dispatchEvent(new CustomEvent('ijr:excel-runtime-ready', { detail:{ version:VERSION } }));
      return runtime;
    };
    Object.defineProperty(wrapped, '__ijrExcelV45Wrapped', { value:true });
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
    if (excelState.runtime) return excelState.runtime;
    if (window.IJR_EXCEL_RUNTIME_V45) {
      excelState.runtime = window.IJR_EXCEL_RUNTIME_V45;
      return excelState.runtime;
    }
    if (excelState.runtimePromise) return excelState.runtimePromise;

    excelState.runtimePromise = new Promise((resolve, reject) => {
      let settled = false;
      const finish = runtime => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        window.removeEventListener('ijr:excel-runtime-ready', onReady);
        excelState.runtime = runtime;
        resolve(runtime);
      };
      const onReady = () => {
        if (window.IJR_EXCEL_RUNTIME_V45) finish(window.IJR_EXCEL_RUNTIME_V45);
      };
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        window.removeEventListener('ijr:excel-runtime-ready', onReady);
        excelState.runtimePromise = null;
        reject(new Error('Python runtime did not become ready in time.'));
      }, 60000);
      window.addEventListener('ijr:excel-runtime-ready', onReady);

      const connect = document.getElementById('connectButton');
      if (connect) connect.click();

      const poll = setInterval(() => {
        if (settled) return clearInterval(poll);
        if (window.IJR_EXCEL_RUNTIME_V45) {
          clearInterval(poll);
          finish(window.IJR_EXCEL_RUNTIME_V45);
        }
      }, 100);
      setTimeout(() => clearInterval(poll), 60500);
    }).catch(error => {
      excelState.runtimePromise = null;
      throw error;
    });

    return excelState.runtimePromise;
  }

  async function ensureExcelPackages(runtime) {
    if (excelState.packagesPromise) return excelState.packagesPromise;

    excelState.packagesPromise = (async () => {
      setWorkspaceStatus('Preparing pandas + Excel reader…', 'loading');
      try {
        await runtime.loadPackage(['pandas', 'openpyxl']);
      } catch (firstError) {
        await runtime.loadPackage('pandas');
        await runtime.loadPackage('micropip');
        await runtime.runPythonAsync(
          "import micropip\nawait micropip.install('openpyxl==3.1.5')"
        );
      }
      setWorkspaceStatus('Excel tools ready in this runtime.', 'ready');
    })().catch(error => {
      excelState.packagesPromise = null;
      setWorkspaceStatus(`Could not prepare Excel tools: ${error.message}`, 'error');
      throw error;
    });

    return excelState.packagesPromise;
  }

  function renderFileTree() {
    const tree = document.getElementById('v45FileTree');
    if (!tree) return;
    const files = [...excelState.files.values()];
    if (!files.length) {
      tree.innerHTML = '<div class="v45-file-empty">No files in session storage yet.</div>';
      return;
    }
    tree.innerHTML = files.map(file => `
      <button type="button" class="v45-file-row ${file.name === excelState.activeFile ? 'active' : ''}" data-file-name="${escapeHtml(file.name)}">
        <span class="v45-file-icon" aria-hidden="true">▤</span>
        <span class="v45-file-copy"><strong>${escapeHtml(file.name)}</strong><small>${escapeHtml(readableBytes(file.bytes))} · ${escapeHtml(file.source)}</small></span>
      </button>
    `).join('');

    tree.querySelectorAll('[data-file-name]').forEach(button => {
      button.addEventListener('click', async () => {
        const name = button.dataset.fileName;
        const file = excelState.files.get(name);
        if (!file) return;
        excelState.activeFile = name;
        renderFileTree();
        await inspectWorkbook(name).catch(error => setInspectorState('error', error.message));
      });
    });
  }

  function renderInspector(payload, fileName) {
    const inspector = document.getElementById('v45InspectorBody');
    if (!inspector) return;

    const columns = Array.isArray(payload.column_names) ? payload.column_names : [];
    const preview = Array.isArray(payload.preview) ? payload.preview : [];
    const means = payload.numeric_means || {};
    const tableHead = columns.map(column => `<th scope="col">${escapeHtml(column)}</th>`).join('');
    const tableRows = preview.map(row => `<tr>${columns.map(column => `<td>${escapeHtml(row?.[column] ?? '')}</td>`).join('')}</tr>`).join('');
    const meanEntries = Object.entries(means).slice(0, 6);

    inspector.dataset.state = 'ready';
    inspector.innerHTML = `
      <div class="v45-inspector-topline">
        <div>
          <span class="v45-inspector-label">Visual inspect</span>
          <strong>${escapeHtml(fileName)}</strong>
        </div>
        <span class="v45-sheet-pill">Sheet: ${escapeHtml(payload.sheet || 'first sheet')}</span>
      </div>
      <div class="v45-metric-grid">
        <div class="v45-metric"><span>Rows</span><strong>${Number(payload.rows || 0)}</strong></div>
        <div class="v45-metric"><span>Columns</span><strong>${Number(payload.columns || 0)}</strong></div>
        <div class="v45-metric v45-metric-wide"><span>Column names</span><strong>${escapeHtml(columns.join(' · '))}</strong></div>
      </div>
      <div class="v45-preview-heading"><strong>First 5 rows</strong><span>Equivalent to inspecting <code>df.head()</code></span></div>
      <div class="v45-table-wrap">
        <table id="v45PreviewTable" class="v45-preview-table">
          <thead><tr>${tableHead}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
      <div class="v45-mean-block">
        <div><strong>Basic numeric operation</strong><span>Column means calculated from the workbook.</span></div>
        <div class="v45-mean-chips">
          ${meanEntries.map(([column, value]) => `<span><code>${escapeHtml(column)}</code> mean = ${escapeHtml(value)}</span>`).join('')}
        </div>
      </div>
    `;
  }

  async function inspectWorkbook(fileName) {
    const runtime = await waitForRuntime();
    await ensureExcelPackages(runtime);
    setInspectorState('loading', `Reading ${fileName} with pandas…`);

    const python = `
import json
import pandas as pd

_v45_excel = pd.ExcelFile(${JSON.stringify(fileName)})
_v45_sheet = _v45_excel.sheet_names[0]
_v45_df = pd.read_excel(_v45_excel, sheet_name=_v45_sheet)
_v45_head = _v45_df.head(5).copy()
_v45_head = _v45_head.where(pd.notna(_v45_head), "")
_v45_numeric = _v45_df.select_dtypes(include="number")
_v45_means = {
    str(column): round(float(_v45_numeric[column].mean()), 3)
    for column in _v45_numeric.columns
}
json.dumps({
    "sheet": str(_v45_sheet),
    "rows": int(_v45_df.shape[0]),
    "columns": int(_v45_df.shape[1]),
    "column_names": [str(column) for column in _v45_df.columns],
    "preview": _v45_head.astype(str).to_dict(orient="records"),
    "numeric_means": _v45_means
}, ensure_ascii=False)
`;
    const result = await runtime.runPythonAsync(python);
    let raw;
    try {
      raw = String(result);
    } finally {
      if (result && typeof result.destroy === 'function') result.destroy();
    }
    const payload = JSON.parse(raw);
    renderInspector(payload, fileName);
    setWorkspaceStatus(`Mounted and inspected: ${fileName}`, 'ready');
    document.documentElement.dataset.excelStageReady = VERSION;
    return payload;
  }

  async function mountWorkbook(name, bytes, source) {
    if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);
    if (!/\.xlsx$/i.test(name)) throw new Error('Only .xlsx Excel workbooks are supported in this stage.');
    if (bytes.byteLength > MAX_FILE_BYTES) throw new Error('This file is larger than the 8 MB classroom limit.');

    const safeName = safeFileName(name);
    const runtime = await waitForRuntime();
    await ensureExcelPackages(runtime);

    if (!runtime.FS || typeof runtime.FS.writeFile !== 'function') {
      throw new Error('The Python runtime file system is unavailable.');
    }
    const pyPath = `/home/pyodide/${safeName}`;
    try { runtime.FS.unlink(pyPath); } catch {}
    runtime.FS.writeFile(pyPath, bytes);

    excelState.files.set(safeName, {
      name:safeName,
      bytes:bytes.byteLength,
      source,
      mountedAt:Date.now()
    });
    excelState.activeFile = safeName;
    renderFileTree();
    await inspectWorkbook(safeName);
    return safeName;
  }

  async function loadClassDataset() {
    setWorkspaceStatus('Downloading the class .xlsx workbook…', 'loading');
    setInspectorState('loading', 'Loading the class Excel workbook into session storage…');
    const response = await fetch(CLASS_DATASET_URL, { cache:'no-store' });
    if (!response.ok) throw new Error(`Class workbook download failed (${response.status}).`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    return mountWorkbook(CLASS_FILE, bytes, 'class dataset');
  }

  async function uploadLocalFile(file) {
    if (!file) return;
    if (!/\.xlsx$/i.test(file.name)) throw new Error('Choose an Excel .xlsx file.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    return mountWorkbook(file.name, bytes, 'uploaded file');
  }

  function createWorkspace() {
    if (document.getElementById('excelStageWorkspaceV45')) {
      excelState.workspace = document.getElementById('excelStageWorkspaceV45');
      return excelState.workspace;
    }

    const problemCell = document.getElementById('problemCell');
    const codeCell = document.getElementById('codeNotebookCell');
    if (!problemCell || !codeCell) return null;

    const section = document.createElement('section');
    section.id = 'excelStageWorkspaceV45';
    section.className = 'v45-excel-workspace hidden';
    section.setAttribute('aria-label', 'Colab-style Files panel and Excel visual inspector');
    section.innerHTML = `
      <aside class="v45-files-pane" aria-label="Files">
        <div class="v45-files-head">
          <div><span class="v45-files-icon" aria-hidden="true">▣</span><strong>Files</strong></div>
          <span>Session storage</span>
        </div>
        <div class="v45-files-toolbar">
          <button id="v45UploadButton" class="v45-upload-button" type="button" title="Upload Excel file">
            <span aria-hidden="true">⇧</span> Upload .xlsx
          </button>
          <button id="v45ClassDatasetButton" class="v45-class-button" type="button">Use class dataset</button>
          <input id="v45UploadInput" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>
        </div>
        <div id="v45Dropzone" class="v45-dropzone" tabindex="0">
          <strong>Drop an Excel file here</strong>
          <span>or use Upload .xlsx, like the Colab Files pane.</span>
        </div>
        <div class="v45-class-dataset-note">
          <div>
            <strong>Graded workbook</strong>
            <code>${CLASS_FILE}</code>
          </div>
          <a href="${CLASS_DATASET_URL}" download="${CLASS_FILE}">Download</a>
        </div>
        <div id="v45FileTree" class="v45-file-tree"><div class="v45-file-empty">No files in session storage yet.</div></div>
        <div id="v45FileStatus" class="v45-file-status">Load the class dataset before running Stage 4.</div>
      </aside>

      <section class="v45-inspector-pane" aria-label="Dataset visual inspection">
        <div class="v45-inspector-head">
          <div>
            <span class="v45-inspector-label">Dataset inspector</span>
            <strong>Excel → pandas DataFrame</strong>
          </div>
          <div class="v45-runtime-badge"><span></span> real workbook</div>
        </div>
        <div id="v45InspectorBody" class="v45-inspector-body" data-state="empty">
          <div class="v45-inspector-placeholder empty">
            <span class="v45-inspector-icon" aria-hidden="true">▦</span>
            <p>Load an .xlsx workbook to inspect rows, columns, the first records and basic numeric summaries.</p>
          </div>
        </div>
      </section>
    `;

    codeCell.before(section);
    excelState.workspace = section;

    const uploadButton = section.querySelector('#v45UploadButton');
    const uploadInput = section.querySelector('#v45UploadInput');
    const classButton = section.querySelector('#v45ClassDatasetButton');
    const dropzone = section.querySelector('#v45Dropzone');

    uploadButton.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', async () => {
      try {
        await uploadLocalFile(uploadInput.files?.[0]);
      } catch (error) {
        setWorkspaceStatus(error.message, 'error');
        setInspectorState('error', error.message);
      } finally {
        uploadInput.value = '';
      }
    });
    classButton.addEventListener('click', async () => {
      classButton.disabled = true;
      try {
        await loadClassDataset();
      } catch (error) {
        setWorkspaceStatus(error.message, 'error');
        setInspectorState('error', error.message);
      } finally {
        classButton.disabled = false;
      }
    });

    for (const type of ['dragenter', 'dragover']) {
      dropzone.addEventListener(type, event => {
        event.preventDefault();
        dropzone.classList.add('dragging');
      });
    }
    for (const type of ['dragleave', 'drop']) {
      dropzone.addEventListener(type, event => {
        event.preventDefault();
        dropzone.classList.remove('dragging');
      });
    }
    dropzone.addEventListener('drop', async event => {
      try {
        await uploadLocalFile(event.dataTransfer?.files?.[0]);
      } catch (error) {
        setWorkspaceStatus(error.message, 'error');
        setInspectorState('error', error.message);
      }
    });
    dropzone.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        uploadInput.click();
      }
    });

    const runButton = document.getElementById('runButton');
    runButton?.addEventListener('click', event => {
      if (!isStage4Active() || excelState.activeFile) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setWorkspaceStatus('Stage 4 is locked until an Excel workbook is loaded into session storage.', 'error');
      section.scrollIntoView({ behavior:'smooth', block:'center' });
    }, true);

    return section;
  }

  function syncStage4Guide() {
    if (!isStage4Active()) return;

    const concept = document.getElementById('guideConcept');
    const steps = document.getElementById('guideSteps');
    const hintButton = document.getElementById('hintButton');
    const hintBox = document.getElementById('hintBox');

    if (concept) concept.textContent = 'Excel file → DataFrame → inspect → filter';
    if (steps && steps.dataset.v45Signature !== 'stat-04') {
      steps.dataset.v45Signature = 'stat-04';
      steps.innerHTML = [
        'Open the Files panel and click <strong>Use class dataset</strong>. This mounts a real .xlsx workbook into the same Python runtime used by the code cell.',
        'Use <code>import pandas as pd</code> and read the workbook with <code>pd.read_excel("stat11_stage4_students.xlsx")</code>.',
        'Inspect the dataset structure: review the visual table, row/column counts and column names. In Python you can also explore <code>df.head()</code>, <code>df.shape</code> and <code>df["score"].mean()</code>.',
        'Create a filtered DataFrame containing rows where <code>score &gt;= 90</code>.',
        'For the final validated run, print only the number of rows in that filtered DataFrame. The backend will unlock Stage 5 only after the real consolidated output is correct.'
      ].map((step, index) => `<li data-v45-step="${index + 1}"><strong>Step ${index + 1}.</strong> ${step}</li>`).join('');
    }

    if (hintButton && hintBox && !hintBox.classList.contains('hidden')) {
      const secondHint = /Hide hints/i.test(hintButton.textContent || '');
      hintBox.innerHTML = secondHint
        ? '<div>• Start with <code>import pandas as pd</code> and <code>df = pd.read_excel("stat11_stage4_students.xlsx")</code>.</div><div>• Build a Boolean filter with the <code>score</code> column and <code>&gt;= 90</code>, then print the length of the filtered DataFrame. Do not print the preview in the final validation run.</div>'
        : '<div>• The first operation is reading the mounted workbook with <code>pd.read_excel(...)</code>. The filename is shown in the Files panel.</div>';
    }

    const subtitle = document.getElementById('notebookSubtitle');
    if (subtitle) subtitle.textContent = 'Guided notebook · V45 · Excel files + visual inspect';
  }

  function syncUi() {
    const workspace = createWorkspace();
    if (!workspace) return;
    const active = isStage4Active();
    workspace.classList.toggle('hidden', !active);
    document.documentElement.dataset.excelStage = active ? VERSION : 'inactive';
    if (active) syncStage4Guide();
  }

  function scheduleSync() {
    if (excelState.queuedSync) return;
    excelState.queuedSync = true;
    requestAnimationFrame(() => {
      excelState.queuedSync = false;
      syncUi();
    });
  }

  function start() {
    createWorkspace();
    const app = document.getElementById('workshopApp');
    if (app) {
      const observer = new MutationObserver(scheduleSync);
      observer.observe(app, { subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['class', 'disabled'] });
    }
    document.addEventListener('click', event => {
      if (event.target.closest('[data-stage], #previousButton, #nextButton, #hintButton')) scheduleSync();
    });
    scheduleSync();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
