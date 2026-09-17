(() => {
  'use strict';

  const ROOT = '/home/pyodide';
  const OUTPUTS = `${ROOT}/outputs`;
  const state = { runtime: null, refreshTimer: null };
  const workspaceList = document.getElementById('workspaceFileList');
  const refreshButton = document.getElementById('refreshWorkspaceButton');
  const downloadCodeButton = document.getElementById('downloadCodeButton');
  const legacyFileList = document.getElementById('fileList');
  const fileInput = document.getElementById('fileInput');
  const cellList = document.getElementById('cellList');

  function notice(message, kind = '') {
    const box = document.getElementById('workspaceStatus');
    if (!box) return;
    box.textContent = message;
    box.dataset.state = kind;
  }

  function safeWorkspacePath(path) {
    return typeof path === 'string' && path.startsWith(`${ROOT}/`) && !path.includes('/../');
  }

  function humanBytes(value) {
    const bytes = Number(value) || 0;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function listFiles() {
    if (!state.runtime) return [];
    const proxy = await state.runtime.runPythonAsync(`
import os as _os, json as _json
_root = ${JSON.stringify(ROOT)}
_items = []
for _base, _dirs, _files in _os.walk(_root):
    _dirs[:] = [d for d in _dirs if d != '__pycache__' and not d.startswith('.')]
    for _name in _files:
        if _name.startswith('.'):
            continue
        _path = _os.path.join(_base, _name)
        try:
            _stat = _os.stat(_path)
            _items.append({
                'name': _name,
                'path': _path,
                'relative': _os.path.relpath(_path, _root),
                'size': int(_stat.st_size)
            })
        except OSError:
            pass
_json.dumps(sorted(_items, key=lambda x: x['relative'].lower()))
`);
    const raw = String(proxy || '[]');
    try { proxy?.destroy?.(); } catch {}
    try { return JSON.parse(raw); } catch { return []; }
  }

  async function downloadFile(record) {
    if (!state.runtime || !safeWorkspacePath(record?.path)) return;
    try {
      const bytes = state.runtime.FS.readFile(record.path);
      downloadBlob(new Blob([bytes]), record.name);
      notice(`Downloaded ${record.relative}`, 'success');
    } catch (error) {
      notice(`Download failed: ${error?.message || error}`, 'error');
    }
  }

  async function deleteFile(record) {
    if (!state.runtime || !safeWorkspacePath(record?.path)) return;
    if (!window.confirm(`Delete ${record.relative} from this temporary workspace?`)) return;
    try {
      state.runtime.FS.unlink(record.path);
      await refreshWorkspace();
      notice(`Deleted ${record.relative}`, 'success');
    } catch (error) {
      notice(`Delete failed: ${error?.message || error}`, 'error');
    }
  }

  function renderFiles(records) {
    if (!workspaceList) return;
    workspaceList.replaceChildren();
    if (!records.length) {
      const empty = document.createElement('span');
      empty.className = 'workspace-empty';
      empty.textContent = state.runtime ? 'No workspace files yet.' : 'Run a cell or upload a file to start the Python runtime.';
      workspaceList.appendChild(empty);
      return;
    }

    for (const record of records) {
      const row = document.createElement('div');
      row.className = 'workspace-file';

      const main = document.createElement('div');
      main.className = 'workspace-file-main';
      const title = document.createElement('strong');
      title.textContent = record.name;
      const path = document.createElement('span');
      path.textContent = record.relative;
      const size = document.createElement('small');
      size.textContent = humanBytes(record.size);
      main.append(title, path, size);

      const actions = document.createElement('div');
      actions.className = 'workspace-file-actions';
      const download = document.createElement('button');
      download.type = 'button';
      download.textContent = 'Download';
      download.addEventListener('click', () => downloadFile(record));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'danger';
      remove.textContent = 'Delete';
      remove.addEventListener('click', () => deleteFile(record));
      actions.append(download, remove);
      row.append(main, actions);
      workspaceList.appendChild(row);
    }
  }

  async function refreshWorkspace() {
    if (!state.runtime) {
      renderFiles([]);
      notice('Python runtime has not started yet.');
      return;
    }
    try {
      const records = await listFiles();
      renderFiles(records);
      notice(`${records.length} workspace file${records.length === 1 ? '' : 's'} available.`, 'success');
    } catch (error) {
      notice(`Workspace refresh failed: ${error?.message || error}`, 'error');
    }
  }

  function scheduleRefresh(delay = 250) {
    clearTimeout(state.refreshTimer);
    state.refreshTimer = setTimeout(() => refreshWorkspace(), delay);
  }

  function downloadCurrentCode() {
    const editors = [...document.querySelectorAll('.code-editor')];
    const text = editors.map((editor, index) => `# %% Cell ${index + 1}\n${editor.value}`).join('\n\n');
    downloadBlob(new Blob([text], { type: 'text/x-python' }), 'statistics11_sandbox.py');
    notice('Downloaded current notebook code as statistics11_sandbox.py', 'success');
  }

  const originalLoadPyodide = window.loadPyodide;
  if (typeof originalLoadPyodide === 'function') {
    window.loadPyodide = async (...args) => {
      const runtime = await originalLoadPyodide(...args);
      state.runtime = runtime;
      try { runtime.FS.mkdirTree(OUTPUTS); } catch {}
      try { runtime.runPython(`import os\nos.chdir(${JSON.stringify(ROOT)})`); } catch {}
      window.dispatchEvent(new CustomEvent('ijr-python-runtime-ready'));
      scheduleRefresh(0);
      return runtime;
    };
  }

  refreshButton?.addEventListener('click', refreshWorkspace);
  downloadCodeButton?.addEventListener('click', downloadCurrentCode);
  fileInput?.addEventListener('change', () => scheduleRefresh(800));

  if (legacyFileList) {
    new MutationObserver(() => scheduleRefresh(150)).observe(legacyFileList, { childList: true, subtree: true });
  }
  if (cellList) {
    new MutationObserver(() => {
      if (state.runtime) scheduleRefresh(300);
    }).observe(cellList, { childList: true, subtree: true });
  }

  renderFiles([]);
  window.IJR_SANDBOX_WORKSPACE_V40 = Object.freeze({
    version: 'v40',
    root: ROOT,
    outputs: OUTPUTS,
    refresh: refreshWorkspace
  });
})();
