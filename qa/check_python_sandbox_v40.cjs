'use strict';

const fs = require('fs');
const assert = require('assert');
const read = path => fs.readFileSync(path, 'utf8');

const hub = read('python/index.html');
const sandbox = read('python/sandbox.html');
const runtime = read('python/sandbox-v39.js');
const workspace = read('python/sandbox-workspace-v40.js');
const workspaceCss = read('python/sandbox-workspace-v40.css');

assert(hub.includes('href="sandbox.html">Open Python Sandbox</a>'), 'Hub must expose the Python Sandbox button.');
assert(!hub.includes('href="../actividad-colab-01/">Open graded Class 01</a>'), 'Old graded Class 01 top entry must be replaced.');

assert(sandbox.includes('Colab-style Python Sandbox'), 'Sandbox title is missing.');
assert(sandbox.includes('sandbox-v39.js'), 'Existing functional V39 runtime must remain loaded.');
assert(sandbox.includes('sandbox-workspace-v40.js'), 'V40 workspace controller must be loaded.');
assert(sandbox.includes('sandbox-workspace-v40.css'), 'V40 workspace styles must be loaded.');
assert(sandbox.includes('data-runtime-src="https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js"'), 'Pinned Pyodide loader must be present.');
assert(sandbox.includes('<input id="fileInput" type="file" multiple>'), 'Sandbox must accept multiple arbitrary file uploads.');
assert(sandbox.includes('id="workspaceFileList"'), 'Workspace file manager must exist.');
assert(sandbox.includes('id="downloadCodeButton"'), 'Python source download control must exist.');
assert(sandbox.includes('Open Google Colab'), 'Optional Google Colab link must remain available.');

assert(runtime.includes('runPythonAsync'), 'Existing sandbox must still execute real Python.');
assert(runtime.includes('loadPackagesFromImports'), 'Existing sandbox package loading must remain intact.');
assert(runtime.includes('FS.writeFile'), 'Existing sandbox upload-to-Python-FS behavior must remain intact.');
assert(runtime.includes("'matplotlib.pyplot'"), 'Existing Matplotlib rendering must remain intact.');

assert(workspace.includes('FS.readFile'), 'Workspace must download files from Python FS.');
assert(workspace.includes('FS.unlink'), 'Workspace must allow deleting temporary files.');
assert(workspace.includes('runPythonAsync'), 'Workspace must inspect the real Python filesystem.');
assert(workspace.includes('MutationObserver'), 'Workspace must refresh after runtime activity.');
assert(workspace.includes("new Blob([text], { type: 'text/x-python' })"), 'Current code must export as a Python script.');
assert(workspace.includes("ROOT = '/home/pyodide'"), 'Workspace must be scoped to /home/pyodide.');
assert(!workspace.includes('service_role') && !workspace.includes('sb_secret_'), 'Workspace must not contain privileged Supabase secrets.');
assert(workspaceCss.includes('.workspace-file'), 'Workspace file styling must exist.');

console.log('Python Sandbox V40 source QA passed: isolated real Python runtime, upload/download workspace, and hub entry are intact.');
