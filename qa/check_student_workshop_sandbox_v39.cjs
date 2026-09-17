'use strict';

const fs = require('fs');
const assert = require('assert');

const read = path => fs.readFileSync(path, 'utf8');

const workshop = read('python/workshop.html');
const runtime = read('python/workshop-v42.js');
const arrays = read('python/workshop-array-prompts-v28.js');
const sandboxHtml = read('python/sandbox.html');
const sandboxJs = read('python/sandbox-v39.js');
const sandboxCss = read('python/sandbox-v39.css');

assert(workshop.includes('Guided Colab Workshop V47'), 'Production workshop must identify the current V47 entry point.');
assert(workshop.includes('workshop-v42.js'), 'Production workshop must load the current V42 runtime.');
assert(workshop.includes('workshop-array-prompts-v28.js?v=20260917-arrays-v47'), 'Production workshop must load the V47 Arrays guidance cache key.');
assert(workshop.indexOf('workshop-array-prompts-v28.js') < workshop.indexOf('workshop-v42.js'), 'Arrays guidance must be available before the runtime renders stages.');
assert(runtime.includes('AbortController'), 'Production workshop RPC transport must be abortable.');
assert(runtime.includes('runPythonAsync'), 'Production workshop must execute real Python.');
assert(runtime.includes('pyodide/v0.27.7/full/'), 'Production workshop must pin Pyodide 0.27.7.');
assert(runtime.includes('config.rpc.resume') && runtime.includes('config.rpc.submit'), 'Production workshop must preserve Supabase resume/submit integration.');
assert(!runtime.includes('service_role') && !runtime.includes('sb_secret_'), 'Production workshop must not embed privileged Supabase secrets.');
assert(arrays.includes('IJR_PYTHON_HUB_ARRAY_GUIDANCE_V47'), 'Arrays explicit guidance contract is missing.');
assert(arrays.includes('data-array-v47-step') && arrays.includes('guideFigureArrayV47'), 'Arrays V47 explicit steps and visual model hooks are missing.');

assert(sandboxHtml.includes('Colab-style Python Sandbox'), 'Sandbox must present a notebook-style student UI.');
assert(sandboxHtml.includes('sandbox-v39.js'), 'Sandbox must load its functional controller.');
assert(sandboxHtml.includes('Choose CSV / TXT'), 'Sandbox must expose file upload.');
assert(sandboxHtml.includes('Open Google Colab'), 'Sandbox must provide an optional Google Colab exit.');
assert(sandboxJs.includes('pyodide/v${PYODIDE_VERSION}/full/'), 'Sandbox must load real Pyodide.');
assert(sandboxJs.includes('runPythonAsync'), 'Sandbox must execute Python, not emulate output.');
assert(sandboxJs.includes('loadPackagesFromImports'), 'Sandbox must load supported packages from real imports.');
assert(sandboxJs.includes('FS.writeFile'), 'Sandbox must write uploaded files into Python FS.');
assert(sandboxJs.includes("'matplotlib.pyplot'"), 'Sandbox must extract Matplotlib figures.');
assert(sandboxJs.includes('localStorage.setItem'), 'Sandbox code must autosave locally.');
assert(sandboxJs.includes("event.key === 'Enter'"), 'Sandbox must support Ctrl/Cmd + Enter execution.');
assert(sandboxCss.includes('.code-cell'), 'Sandbox notebook code-cell styling must exist.');
assert(sandboxCss.includes('.output-console'), 'Sandbox output styling must exist.');

console.log('V47 workshop + V39 sandbox source QA passed: current Supabase/Pyodide workshop contract and standalone sandbox remain functional.');
