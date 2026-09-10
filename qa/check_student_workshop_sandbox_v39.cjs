const fs = require('fs');
const assert = require('assert');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

const workshop = read('python/workshop.html');
const transport = read('python/student-supabase-transport-v39.js');
const bridge = read('python/student-supabase-bridge-v39.js');
const sandboxHtml = read('python/sandbox.html');
const sandboxJs = read('python/sandbox-v39.js');
const sandboxCss = read('python/sandbox-v39.css');

const transportIndex = workshop.indexOf('student-supabase-transport-v39.js');
const bootstrapIndex = workshop.indexOf('workshop-bootstrap-v33.js');
const bridgeIndex = workshop.indexOf('student-supabase-bridge-v39.js');
const pageIndex = workshop.indexOf('workshop-page.js');
assert(transportIndex > 0, 'Workshop must load the V39 official transport.');
assert(transportIndex < bootstrapIndex, 'Official transport must load before workshop bootstrap.');
assert(bootstrapIndex < bridgeIndex, 'Bridge must capture/replace transport after bootstrap.');
assert(bridgeIndex < pageIndex, 'Bridge must be active before workshop-page creates its client.');
assert(workshop.includes('href="sandbox.html"'), 'Workshop must expose the sandbox link.');
assert(workshop.includes('target="_blank"'), 'Sandbox link must open in a new tab/window.');
assert(workshop.includes('WORKSHOP STARTUP RECOVERY'), 'Workshop must retain startup recovery UI.');

assert(transport.includes('@supabase/supabase-js@2/+esm'), 'V39 must use the official Supabase JS client.');
assert(transport.includes('Promise.race'), 'Official transport must be bounded by timeouts.');
assert(transport.includes('persistSession: false'), 'Workshop RPC client must not create a second auth session.');
assert(bridge.includes('bounded-rest-single-attempt'), 'Bridge must declare one bounded REST fallback.');
assert(bridge.includes('AbortController'), 'REST fallback must be abortable.');
assert(!bridge.includes('while ('), 'Bridge must not contain an unbounded retry loop.');

assert(sandboxHtml.includes('Colab-style Python Sandbox'), 'Sandbox must present a notebook-style student UI.');
assert(sandboxHtml.includes('sandbox-v39.js'), 'Sandbox must load its functional controller.');
assert(sandboxHtml.includes('Choose CSV / TXT'), 'Sandbox must expose file upload.');
assert(sandboxHtml.includes('Open Google Colab'), 'Sandbox must provide an optional real Google Colab exit.');
assert(sandboxJs.includes('pyodide/v${PYODIDE_VERSION}/full/'), 'Sandbox must load real Pyodide.');
assert(sandboxJs.includes('runPythonAsync'), 'Sandbox must execute Python, not emulate output.');
assert(sandboxJs.includes('loadPackagesFromImports'), 'Sandbox must load supported packages from real imports.');
assert(sandboxJs.includes("FS.writeFile"), 'Sandbox must write uploaded files into Python FS.');
assert(sandboxJs.includes("'matplotlib.pyplot'"), 'Sandbox must extract Matplotlib figures.');
assert(sandboxJs.includes('localStorage.setItem'), 'Sandbox code must autosave locally.');
assert(sandboxJs.includes("event.key === 'Enter'"), 'Sandbox must support Ctrl/Cmd + Enter execution.');
assert(sandboxCss.includes('.code-cell'), 'Sandbox notebook code-cell styling must exist.');
assert(sandboxCss.includes('.output-console'), 'Sandbox output styling must exist.');

console.log('V39 source QA passed: workshop transport is bounded + official-first, startup recovery remains, and the new-tab sandbox is wired to real Pyodide, CSV upload and Matplotlib output.');
