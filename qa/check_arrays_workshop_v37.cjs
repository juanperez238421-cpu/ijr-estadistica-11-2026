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

function storage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
}

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

async function masterPreviewSnapshot(topics, config) {
  const localStorage = storage();
  const sessionStorage = storage({'ijr-stat11-master-teacher-session-v1':'qa-token'});
  const document = {
    addEventListener() {},
    querySelector() { return null; },
    createElement() { return { addEventListener() {}, remove() {}, dataset:{} }; },
    head:{ appendChild() {} },
    body:{ querySelectorAll() { return []; } }
  };
  const location = { search:'?topic=arrays&masterPreview=1', replace() {} };
  const window = { IJR_PYTHON_HUB_CONFIG:config, IJR_PYTHON_HUB_TOPICS:topics };
  const context = vm.createContext({
    window, document, location, localStorage, sessionStorage, URLSearchParams,
    AbortController, fetch:async()=>{ throw new Error('Master resume must not call the network.'); },
    setTimeout:fn=>{ fn(); return 1; }, clearTimeout() {}, console, Math, Date, Error, Object, Array, Set
  });
  vm.runInContext(read('python/workshop-bootstrap-v33.js'), context, { filename:'python/workshop-bootstrap-v33.js' });
  const client = window.supabase.createClient();
  const result = await client.rpc(config.rpc.resume, {p_registration_id:'master-preview',p_access_token:'master-preview'});
  return result.data?.snapshot;
}

(async () => {
  const window = curriculumContext();
  const topics = window.IJR_PYTHON_HUB_TOPICS;
  const html = read('python/workshop.html');
  const page = read('python/workshop-page.js');
  const bootstrap = read('python/workshop-bootstrap-v33.js');
  const hub = read('python/hub-router.js');

  must(topics.length === 16, 'complete 16-topic curriculum loads');
  must(topics.every(topic => Array.isArray(topic.exercises) && topic.exercises.length === 12), 'every published curriculum topic exposes exactly 12 workshop stages');
  must(topics.every(topic => new Set(topic.exercises.map(item => item.key)).size === 12), 'every topic has 12 unique workshop item keys');
  must(topics.every(topic => topic.exercises.every(item => item.mode === 'code' || item.mode === 'choice')), 'every workshop item has a supported mode');

  must(!html.includes('student-supabase-transport-v39.js'), 'V39 external Supabase transport is removed from the workshop startup path');
  must(!html.includes('student-supabase-bridge-v39.js'), 'V39 transport bridge is removed from the workshop startup path');
  must(html.indexOf('workshop-bootstrap-v33.js') >= 0 && html.indexOf('workshop-bootstrap-v33.js') < html.indexOf('workshop-page.js'), 'stable V33 bootstrap loads before the workshop controller');
  must(html.includes('workshop-bootstrap-v33.js?v=20260910-stable-v41'), 'V41 stable bootstrap cache key is active');
  must(html.includes('workshop-page.js?v=20260910-workshop-v41'), 'V41 workshop controller cache key is active');
  must(html.includes('sandbox.html'), 'standalone Python Sandbox remains available without affecting workshop boot');

  must(bootstrap.includes("transport: 'native-fetch'"), 'student workshop uses bounded native-fetch RPC transport');
  must(bootstrap.includes("pyodide: 'lazy-load-on-run'"), 'Pyodide remains lazy until the student runs code');
  must(bootstrap.includes('AbortController') && bootstrap.includes('retries: isResume ? 2 : 0'), 'resume requests are bounded and retryable while submissions are not retried');
  must(page.includes('IJR_WORKSHOP_RETRY_BOOT') && page.includes("reason:'backend'"), 'startup failure exposes a retry path instead of a blank loading shell');
  must(page.includes('returnTo=${encodeURIComponent(target)}') && hub.includes('requestedReturnTo.match'), 'student sign-in returns to the requested workshop');
  must(!page.includes('ensureRuntime().catch'), 'Python initialization is not part of page startup');

  const config = {
    supabaseUrl:'https://example.supabase.co',
    supabasePublishableKey:'public-test-key',
    sessionStorageKey:'test-session',
    rpc:{resume:'python_hub_resume_v1',submit:'python_hub_submit_v1'}
  };
  const snapshot = await masterPreviewSnapshot(topics, config);
  must(snapshot?.registration?.mode === 'master-preview', 'master preview builds an immediate isolated registration snapshot');
  must(snapshot?.topics?.length === 16, 'master preview exposes all 16 workshop topics');
  must(snapshot?.topics?.every(topic => topic.items?.length === 12), 'master preview and student curriculum agree on 12 stages for every topic');

  console.log('Workshop V41 QA PASS (all topics, stable V33 transport, recovery, lazy runtime and master snapshot).');
})().catch(error => {
  console.error(`Workshop V41 QA FAIL: ${error.message}`);
  process.exit(1);
});
