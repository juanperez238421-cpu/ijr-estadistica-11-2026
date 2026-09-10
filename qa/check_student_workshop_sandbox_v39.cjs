const fs = require('fs');
const assert = require('assert');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

const workshop = read('python/workshop.html');
const bootstrap = read('python/workshop-bootstrap-v33.js');
const sandboxHtml = read('python/sandbox.html');
const sandboxJs = read('python/sandbox-v39.js');
const sandboxCss = read('python/sandbox-v39.css');

const bootstrapIndex = workshop.indexOf('workshop-bootstrap-v33.js');
const pageIndex = workshop.indexOf('workshop-page.js');
assert(bootstrapIndex > 0, 'Workshop must load the stable V33 bootstrap.');
assert(bootstrapIndex < pageIndex, 'Stable bootstrap must load before workshop-page creates its client.');
assert(!workshop.includes('student-supabase-transport-v39.js'), 'Workshop must not load the V39 ESM transport in its startup critical path.');
assert(!workshop.includes('student-supabase-bridge-v39.js'), 'Workshop must not load the V39 bridge in its startup critical path.');
assert(workshop.includes('workshop-bootstrap-v33.js?v=20260910-stable-v41'), 'Workshop must use the V41 stable bootstrap cache key.');
assert(workshop.includes('workshop-page.js?v=20260910-workshop-v41'), 'Workshop must use the V41 controller cache key.');
assert(workshop.includes('href="sandbox.html"'), 'Workshop must expose the sandbox link.');
assert(workshop.includes('target="_blank"'), 'Sandbox link must open in a new tab/window.');
assert(workshop.includes('WORKSHOP STARTUP RECOVERY'), 'Workshop must retain startup recovery UI.');
assert(workshop.includes('IJR_WORKSHOP_RETRY_BOOT'), 'Recovery UI must call the workshop retry hook before a full reload.');

assert(bootstrap.includes("transport: 'native-fetch'"), 'Student workshop must use the proven bounded native-fetch transport.');
assert(bootstrap.includes('AbortController'), 'Workshop RPC transport must be abortable.');
assert(bootstrap.includes('retries: isResume ? 2 : 0'), 'Resume may retry, while submit must not retry.');
assert(bootstrap.includes("pyodide: 'lazy-load-on-run'"), 'Pyodide must remain outside workshop startup.');

assert(sandboxHtml.includes('Colab-style Python Sandbox'), 'Sandbox must present a notebook-style student UI.');
assert(sandboxHtml.includes('sandbox-v39.js'), 'Sandbox must load its functional controller.');
assert(sandboxHtml.includes('Choose CSV / TXT'), 'Sandbox must expose file upload.');
assert(sandboxHtml.includes('Open Google Colab'), 'Sandbox must provide an optional real Google Colab exit.');
assert(sandboxJs.includes('pyodide/v${PYODIDE_VERSION}/full/'), 'Sandbox must load real Pyodide.');
assert(sandboxJs.includes('runPythonAsync'), 'Sandbox must execute Python, not emulate output.');
assert(sandboxJs.includes('loadPackagesFromImports'), 'Sandbox must load supported packages from real imports.');
assert(sandboxJs.includes('FS.writeFile'), 'Sandbox must write uploaded files into Python FS.');
assert(sandboxJs.includes("'matplotlib.pyplot'"), 'Sandbox must extract Matplotlib figures.');
assert(sandboxJs.includes('localStorage.setItem'), 'Sandbox code must autosave locally.');
assert(sandboxJs.includes("event.key === 'Enter'"), 'Sandbox must support Ctrl/Cmd + Enter execution.');
assert(sandboxCss.includes('.code-cell'), 'Sandbox notebook code-cell styling must exist.');
assert(sandboxCss.includes('.output-console'), 'Sandbox output styling must exist.');

console.log('V41 source QA passed: workshop uses the stable bounded V33 transport with recovery and lazy Pyodide, while the V39 standalone sandbox remains functional.');
