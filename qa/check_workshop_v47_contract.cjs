'use strict';

const fs = require('fs');
const assert = require('assert');

const read = path => fs.readFileSync(path, 'utf8');
const html = read('python/workshop.html');
const runtime = read('python/workshop-v42.js');
const arrays = read('python/workshop-array-prompts-v28.js');
const guideCss = read('python/workshop-guidance-v43.css');

const requiredAssets = [
  'config-v2.js',
  'course-data-v4.js',
  'workshop-catalog-v27.js',
  'data-analyst-extension-v30.js',
  'workshop-array-prompts-v28.js?v=20260917-arrays-v47',
  'curriculum-data-first-v32.js',
  'curriculum-xlsx-first-v46.js',
  'workshop-v42.js',
  'workshop-guidance-v43.js',
  'workshop-progression-guard-v44.js'
];
for (const asset of requiredAssets) assert(html.includes(asset), `Production workshop missing ${asset}`);

for (const id of ['workshopApp','stageList','problemKicker','problemTitle','problemPrompt','guidePanel','guideConcept','guideSteps','hintBox','codeEditor','runButton','outputPanel','validateButton','previousButton','nextButton']) {
  assert(html.includes(`id="${id}"`), `Production workshop missing #${id}`);
}

assert(html.indexOf('workshop-array-prompts-v28.js') < html.indexOf('workshop-v42.js'), 'Arrays guidance must load before the workshop controller renders.');
assert(html.includes('Guided Colab Workshop V47') || html.includes('Libraries, XLSX and Pandas · Colab Workshop'), 'Production page title must identify the current guided workshop.');
assert(html.includes('Guided notebook · V47'), 'Production notebook subtitle must identify V47.');

for (let i = 1; i <= 12; i += 1) {
  const key = `arr-${String(i).padStart(2, '0')}`;
  assert(arrays.includes(`'${key}'`), `Arrays V47 missing ${key}.`);
}
assert(arrays.includes('IJR_PYTHON_HUB_ARRAY_GUIDANCE_V47'), 'Arrays V47 public guidance contract missing.');
assert(arrays.includes('explicitSteps: true'), 'Arrays V47 explicit-step flag missing.');
assert(arrays.includes('visualModels: true'), 'Arrays V47 visual-model flag missing.');
assert(arrays.includes('data-array-v47-step'), 'Arrays V47 rendered step markers missing.');
assert(arrays.includes('arrayV47Directive'), 'Arrays V47 instructional directive missing.');
assert(arrays.includes('guideFigureArrayV47'), 'Arrays V47 visual model container missing.');
assert(arrays.includes('arrayV47Signature') && arrays.includes("steps.querySelector('[data-array-v47-step]')"), 'Arrays V47 mutation observer idempotency guard missing.');
assert(arrays.includes("last_index = len(values) - 1"), 'Arrays V47 must explicitly teach calculated last index.');
assert(arrays.includes("mean = total / count"), 'Arrays V47 must explicitly construct the mean.');
assert(arrays.includes("last_value = values[-1]"), 'Arrays V47 must explicitly teach last-item shorthand.');

assert(runtime.includes('runPythonAsync'), 'Real browser Python execution is missing.');
assert(runtime.includes('pyodide/v0.27.7/full/'), 'Pyodide production version pin is missing.');
assert(runtime.includes('AbortController'), 'Bounded backend request handling is missing.');
assert(runtime.includes('config.rpc.resume') && runtime.includes('config.rpc.submit'), 'Supabase progress/validation RPC integration is missing.');
assert(runtime.includes('p_answer') && runtime.includes('p_code_snapshot'), 'Server validation payload must include output and code evidence.');
assert(!runtime.includes('service_role') && !runtime.includes('sb_secret_') && !runtime.includes('expected_text'), 'Client runtime must not expose privileged Supabase secrets or server answer keys.');

for (const cssToken of ['.v43-directive','.v43-concept-figure','.v43-figure-flow','.v43-figure-node']) {
  assert(guideCss.includes(cssToken), `Guided visual styling missing ${cssToken}.`);
}

console.log('WORKSHOP V47 PRODUCTION CONTRACT PASS');
console.log('arrays=12 explicit_steps=PASS visual_models=PASS observer_guard=PASS pyodide=0.27.7 supabase_rpc=PASS secrets=PASS');
