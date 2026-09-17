'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const must = (condition, message) => {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
};

function curriculumContext() {
  const window = {};
  const document = {
    addEventListener() {},
    querySelectorAll() { return []; },
    getElementById() { return null; }
  };
  const context = vm.createContext({ window, document, console, Object, Array, Set });
  for (const file of [
    'python/course-data-v4.js',
    'python/workshop-catalog-v27.js',
    'python/data-analyst-extension-v30.js',
    'python/workshop-array-prompts-v28.js',
    'python/curriculum-data-first-v32.js'
  ]) vm.runInContext(read(file), context, { filename:file });
  return context.window;
}

(() => {
  const window = curriculumContext();
  const topics = window.IJR_PYTHON_HUB_TOPICS;
  const html = read('python/workshop.html');
  const runtime = read('python/workshop-v42.js');

  must(topics.length === 16, 'complete 16-topic curriculum loads');
  must(topics.every(topic => Array.isArray(topic.exercises) && topic.exercises.length === 12), 'every published curriculum topic exposes exactly 12 workshop stages');
  must(topics.every(topic => new Set(topic.exercises.map(item => item.key)).size === 12), 'every topic has 12 unique workshop item keys');
  must(topics.every(topic => topic.exercises.every(item => item.mode === 'code' || item.mode === 'choice')), 'every workshop item has a supported mode');

  const arrays = topics.find(topic => topic.slug === 'arrays');
  must(Boolean(arrays), 'Arrays topic exists in the published curriculum');
  must(arrays.exercises.length === 12, 'Arrays workshop exposes all 12 required stages');

  const arrayGuidance = window.IJR_PYTHON_HUB_ARRAY_GUIDANCE_V47;
  must(arrayGuidance?.topic === 'arrays', 'Arrays V47 guidance is registered for the Arrays topic');
  must(arrayGuidance?.stages === 12, 'Arrays V47 provides explicit guidance for all 12 stages');
  must(arrayGuidance?.explicitSteps === true && arrayGuidance?.visualModels === true, 'Arrays V47 enables explicit steps and visual models');

  const guidanceKeys = Object.keys(arrayGuidance.entries || {});
  must(guidanceKeys.length === 12, 'Arrays guidance contains exactly 12 unique stage entries');
  for (let i = 1; i <= 12; i += 1) {
    const key = `arr-${String(i).padStart(2, '0')}`;
    const entry = arrayGuidance.entries[key];
    must(Boolean(entry), `${key} has a dedicated guidance entry`);
    must(typeof entry.concept === 'string' && entry.concept.length > 8, `${key} has a clear guided-reasoning concept`);
    must(Array.isArray(entry.steps) && entry.steps.length >= 4, `${key} has at least four explicit construction steps`);
    must(Array.isArray(entry.boxes) && entry.boxes.length >= 3, `${key} has a multi-step visual model`);
    must(typeof entry.caption === 'string' && entry.caption.length > 8, `${key} explains the Python/list concept`);
  }

  must(arrayGuidance.entries['arr-01'].steps.some(step => step.includes('index 2')), 'Stage 1 explicitly teaches third-item zero-based index 2');
  must(arrayGuidance.entries['arr-06'].boxes.includes('mean = total / count'), 'Stage 6 explicitly constructs the mean from calculated total and count');
  must(arrayGuidance.entries['arr-08'].boxes.includes('last_index = len(values) - 1'), 'Stage 8 explicitly derives the final valid index from list length');
  must(arrayGuidance.entries['arr-12'].boxes.includes('last_value = values[-1]'), 'Stage 12 explicitly demonstrates Python last-item indexing');
  must(html.includes('workshop-array-prompts-v28.js?v=20260917-arrays-v47'), 'production workshop uses the V47 Arrays cache key');

  must(html.includes('workshop-v42.js') && html.includes('workshop-guidance-v43.js'), 'production workshop loads the current runtime and guided-reasoning layer');
  must(runtime.includes('async function postRpc') && runtime.includes('AbortController'), 'workshop uses bounded backend RPC requests');
  must(runtime.includes('config.rpc.resume') && runtime.includes('config.rpc.submit'), 'workshop preserves Supabase resume and submit integration');
  must(runtime.includes('runPythonAsync') && runtime.includes('pyodide/v0.27.7/full/'), 'workshop preserves real Pyodide Python execution');
  must(runtime.includes('p_code_snapshot') && runtime.includes('p_answer'), 'server validation still receives answer and student code evidence');
  must(!runtime.includes('expected_text') && !runtime.includes('service_role') && !runtime.includes('sb_secret_'), 'client does not embed answer keys or privileged Supabase secrets');

  console.log('Arrays Workshop V47 QA PASS (12 explicit guided stages, visual models, Pyodide runtime and Supabase validation contract).');
})();
