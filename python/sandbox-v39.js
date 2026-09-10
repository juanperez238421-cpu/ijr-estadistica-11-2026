(() => {
  'use strict';

  const PYODIDE_VERSION = '0.27.7';
  const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
  const PYODIDE_SCRIPT = `${PYODIDE_BASE}pyodide.js`;
  const STORAGE_KEY = 'ijr-stat11-python-sandbox-v39';
  const DEFAULT_CODE = `# Write and run real Python here.\nvalues = [12, 15, 18, 20, 25]\nprint("Count:", len(values))\nprint("Mean:", sum(values) / len(values))`;

  const badge = document.getElementById('runtimeBadge');
  const notice = document.getElementById('runtimeNotice');
  const cellList = document.getElementById('cellList');
  const template = document.getElementById('codeCellTemplate');
  const runAllButton = document.getElementById('runAllButton');
  const addCellButton = document.getElementById('addCellButton');
  const clearOutputsButton = document.getElementById('clearOutputsButton');
  const resetNotebookButton = document.getElementById('resetNotebookButton');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');

  let runtimePromise = null;
  let pyodide = null;
  let executionCount = 0;
  let running = false;
  const uploadedFiles = [];

  function setRuntimeState(state, text) {
    if (badge) {
      badge.dataset.state = state;
      badge.textContent = text;
    }
  }

  function setNotice(kind, strong, text) {
    if (!notice) return;
    notice.className = `runtime-notice${kind ? ` ${kind}` : ''}`;
    notice.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = strong;
    const copy = document.createElement('span');
    copy.textContent = text;
    notice.append(title, copy);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-runtime-src="${src}"]`);
      if (existing) {
        if (typeof window.loadPyodide === 'function') return resolve();
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', () => reject(new Error('Python runtime script failed to load.')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.runtimeSrc = src;
      const timer = window.setTimeout(() => {
        script.remove();
        reject(new Error('Python runtime download timed out. Check the network and try again.'));
      }, 25000);
      script.addEventListener('load', () => {
        window.clearTimeout(timer);
        resolve();
      }, { once: true });
      script.addEventListener('error', () => {
        window.clearTimeout(timer);
        reject(new Error('Python runtime download failed. Check the network and try again.'));
      }, { once: true });
      document.head.appendChild(script);
    });
  }

  async function getRuntime() {
    if (pyodide) return pyodide;
    if (runtimePromise) return runtimePromise;

    setRuntimeState('loading', 'Python runtime · loading…');
    setNotice('', 'Starting Python…', 'The first run downloads the browser Python runtime. This can take a few seconds.');
    runtimePromise = (async () => {
      await loadScript(PYODIDE_SCRIPT);
      if (typeof window.loadPyodide !== 'function') throw new Error('Pyodide loader is unavailable after download.');
      const runtime = await window.loadPyodide({ indexURL: PYODIDE_BASE });
      runtime.FS.mkdirTree('/home/pyodide/uploads');
      pyodide = runtime;
      setRuntimeState('ready', `Python ${runtime.runPython('import sys; sys.version.split()[0]')} · ready`);
      setNotice('success', 'Python is ready.', 'Run cells, import supported packages, and upload CSV files into /home/pyodide/uploads/.');
      return runtime;
    })().catch(error => {
      runtimePromise = null;
      setRuntimeState('error', 'Python runtime · error');
      setNotice('error', 'Python could not start.', error?.message || 'Runtime initialization failed.');
      throw error;
    });
    return runtimePromise;
  }

  function saveNotebook() {
    try {
      const cells = [...cellList.querySelectorAll('.code-editor')].map(editor => editor.value);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 39, cells, savedAt: new Date().toISOString() }));
    } catch {}
  }

  function readNotebook() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (parsed && Array.isArray(parsed.cells) && parsed.cells.length) return parsed.cells.map(value => String(value ?? ''));
    } catch {}
    return [DEFAULT_CODE];
  }

  function autoSize(editor) {
    editor.style.height = 'auto';
    editor.style.height = `${Math.max(150, Math.min(700, editor.scrollHeight + 4))}px`;
  }

  function updateMoveButtons() {
    const cells = [...cellList.querySelectorAll('.code-cell')];
    cells.forEach((cell, index) => {
      cell.querySelector('.move-up').disabled = index === 0;
      cell.querySelector('.move-down').disabled = index === cells.length - 1;
    });
  }

  function clearOutput(cell) {
    const output = cell.querySelector('.cell-output');
    output.classList.add('hidden');
    output.replaceChildren();
    cell.querySelector('.cell-count').textContent = '[ ]';
  }

  function renderOutput(cell, text, plots = [], isError = false) {
    const output = cell.querySelector('.cell-output');
    output.replaceChildren();
    output.classList.remove('hidden');

    const label = document.createElement('p');
    label.className = 'output-label';
    label.textContent = isError ? 'PYTHON ERROR' : 'OUTPUT';
    output.appendChild(label);

    if (text || isError) {
      const pre = document.createElement('pre');
      pre.className = `output-console${isError ? ' error' : ''}`;
      pre.textContent = text || '(no text output)';
      output.appendChild(pre);
    } else if (!plots.length) {
      const pre = document.createElement('pre');
      pre.className = 'output-console';
      pre.textContent = '(cell completed with no printed output)';
      output.appendChild(pre);
    }

    plots.forEach(base64 => {
      const image = document.createElement('img');
      image.className = 'output-figure';
      image.alt = 'Matplotlib figure generated by this Python cell';
      image.src = `data:image/png;base64,${base64}`;
      output.appendChild(image);
    });
  }

  async function extractPlots(runtime) {
    const json = await runtime.runPythonAsync(`
import sys as __ijr_sys, io as __ijr_io, base64 as __ijr_b64, json as __ijr_json
__ijr_images = []
if 'matplotlib.pyplot' in __ijr_sys.modules:
    import matplotlib.pyplot as __ijr_plt
    for __ijr_num in __ijr_plt.get_fignums():
        __ijr_fig = __ijr_plt.figure(__ijr_num)
        __ijr_buf = __ijr_io.BytesIO()
        __ijr_fig.savefig(__ijr_buf, format='png', dpi=120, bbox_inches='tight')
        __ijr_images.append(__ijr_b64.b64encode(__ijr_buf.getvalue()).decode('ascii'))
    __ijr_plt.close('all')
__ijr_json.dumps(__ijr_images)
`);
    try { return JSON.parse(String(json || '[]')); }
    catch { return []; }
  }

  async function runCell(cell) {
    if (!cell || running) return false;
    const editor = cell.querySelector('.code-editor');
    const code = editor.value;
    const runButton = cell.querySelector('.cell-run');
    const counter = cell.querySelector('.cell-count');
    clearOutput(cell);
    running = true;
    cell.classList.add('cell-running');
    runButton.disabled = true;
    runAllButton.disabled = true;
    addCellButton.disabled = true;
    setNotice('', 'Running cell…', 'Python is executing your code in this browser tab.');

    const stdout = [];
    const stderr = [];
    let result = null;
    try {
      const runtime = await getRuntime();
      runtime.setStdout({ batched: value => stdout.push(String(value)) });
      runtime.setStderr({ batched: value => stderr.push(String(value)) });
      await runtime.loadPackagesFromImports(code);
      result = await runtime.runPythonAsync(code);
      const plots = await extractPlots(runtime);
      const parts = [];
      if (stdout.length) parts.push(stdout.join('\n'));
      if (stderr.length) parts.push(stderr.join('\n'));
      if (result !== undefined && result !== null && String(result) !== 'None') parts.push(String(result));
      executionCount += 1;
      counter.textContent = `[${executionCount}]`;
      renderOutput(cell, parts.join('\n').trim(), plots, false);
      setNotice('success', 'Cell completed.', plots.length ? `Python finished and rendered ${plots.length} figure${plots.length === 1 ? '' : 's'}.` : 'Python finished successfully.');
      return true;
    } catch (error) {
      executionCount += 1;
      counter.textContent = `[${executionCount}]`;
      const errorText = [stderr.join('\n'), error?.message || String(error)].filter(Boolean).join('\n').trim();
      renderOutput(cell, errorText, [], true);
      setNotice('error', 'Python error.', 'Read the traceback in the cell output, edit the code, and run the cell again.');
      return false;
    } finally {
      try { result?.destroy?.(); } catch {}
      running = false;
      cell.classList.remove('cell-running');
      runButton.disabled = false;
      runAllButton.disabled = false;
      addCellButton.disabled = false;
      saveNotebook();
    }
  }

  function createCell(code = '', afterCell = null) {
    const cell = template.content.firstElementChild.cloneNode(true);
    const editor = cell.querySelector('.code-editor');
    editor.value = code;

    cell.querySelector('.cell-run').addEventListener('click', () => runCell(cell));
    cell.querySelector('.delete-cell').addEventListener('click', () => {
      const count = cellList.querySelectorAll('.code-cell').length;
      if (count <= 1) {
        editor.value = '';
        clearOutput(cell);
      } else {
        cell.remove();
      }
      saveNotebook();
      updateMoveButtons();
    });
    cell.querySelector('.move-up').addEventListener('click', () => {
      const previous = cell.previousElementSibling;
      if (previous) cellList.insertBefore(cell, previous);
      saveNotebook();
      updateMoveButtons();
    });
    cell.querySelector('.move-down').addEventListener('click', () => {
      const next = cell.nextElementSibling;
      if (next) cellList.insertBefore(next, cell);
      saveNotebook();
      updateMoveButtons();
    });

    editor.addEventListener('input', () => {
      autoSize(editor);
      saveNotebook();
    });
    editor.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        runCell(cell);
        return;
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.setRangeText('    ', start, end, 'end');
        saveNotebook();
        autoSize(editor);
      }
    });

    if (afterCell?.parentElement === cellList) afterCell.insertAdjacentElement('afterend', cell);
    else cellList.appendChild(cell);
    requestAnimationFrame(() => autoSize(editor));
    updateMoveButtons();
    return cell;
  }

  async function runAll() {
    if (running) return;
    const cells = [...cellList.querySelectorAll('.code-cell')];
    for (const cell of cells) {
      const ok = await runCell(cell);
      if (!ok) break;
    }
  }

  function clearAllOutputs() {
    cellList.querySelectorAll('.code-cell').forEach(clearOutput);
    setNotice('', 'Outputs cleared.', 'Your Python code is unchanged.');
  }

  function resetNotebook() {
    const confirmed = window.confirm('Reset the sandbox notebook? This clears locally saved code and outputs in this browser.');
    if (!confirmed) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    cellList.replaceChildren();
    executionCount = 0;
    createCell(DEFAULT_CODE);
    setNotice('', 'Notebook reset.', 'A fresh code cell is ready. Course workshop progress was not changed.');
  }

  function safeFileName(name) {
    return String(name || 'data.csv').replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^\.+/, '') || 'data.csv';
  }

  function renderFiles() {
    fileList.replaceChildren();
    if (!uploadedFiles.length) {
      const empty = document.createElement('span');
      empty.textContent = 'No files uploaded yet.';
      fileList.appendChild(empty);
      return;
    }
    uploadedFiles.forEach(file => {
      const row = document.createElement('div');
      row.className = 'file-entry';
      row.textContent = `${file.name} → ${file.path}`;
      fileList.appendChild(row);
    });
  }

  async function uploadFiles(files) {
    if (!files?.length) return;
    try {
      const runtime = await getRuntime();
      for (const file of files) {
        const name = safeFileName(file.name);
        const path = `/home/pyodide/uploads/${name}`;
        const bytes = new Uint8Array(await file.arrayBuffer());
        runtime.FS.writeFile(path, bytes);
        const existing = uploadedFiles.findIndex(item => item.path === path);
        const record = { name, path, bytes: bytes.byteLength };
        if (existing >= 0) uploadedFiles.splice(existing, 1, record);
        else uploadedFiles.push(record);
      }
      renderFiles();
      setNotice('success', 'File uploaded.', 'Use the displayed /home/pyodide/uploads/... path from Python, for example with pandas.read_csv().');
    } catch (error) {
      setNotice('error', 'Upload failed.', error?.message || 'The Python runtime could not receive the file.');
    } finally {
      fileInput.value = '';
    }
  }

  runAllButton.addEventListener('click', runAll);
  addCellButton.addEventListener('click', () => {
    const cell = createCell('');
    cell.querySelector('.code-editor').focus();
    saveNotebook();
  });
  clearOutputsButton.addEventListener('click', clearAllOutputs);
  resetNotebookButton.addEventListener('click', resetNotebook);
  fileInput.addEventListener('change', () => uploadFiles([...fileInput.files]));

  readNotebook().forEach(code => createCell(code));
  renderFiles();

  window.IJR_SANDBOX_V39 = Object.freeze({
    version: 'v39',
    pyodideVersion: PYODIDE_VERSION,
    storageKey: STORAGE_KEY,
    runtime: 'real-pyodide-browser-python',
    supports: Object.freeze(['stdout', 'stderr', 'packages-from-imports', 'csv-upload', 'matplotlib-images', 'autosave'])
  });
})();
