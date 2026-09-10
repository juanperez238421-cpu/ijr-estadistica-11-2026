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
  const arrays = window.IJR_PYTHON_HUB_TOPIC_MAP.arrays;
  const html = read('python/workshop.html');
  const page = read('python/workshop-page.js');
  const hub = read('python/hub-router.js');

  must(topics.length === 16, 'complete 16-topic curriculum loads');
  must(Boolean(arrays), 'Arrays topic is present in the final topic map');
  must(arrays.exercises.length === 12, 'Arrays workshop exposes exactly 12 stages');
  must(new Set(arrays.exercises.map(item => item.key)).size === 12, 'Arrays stage keys are unique');
  must(arrays.exercises.every((item, index) => item.key === `arr-${String(index + 1).padStart(2, '0')}`), 'Arrays keys remain ordered arr-01 through arr-12');
  must(arrays.exercises.every(item => item.mode === 'code' && item.code === ''), 'every Arrays code cell starts blank');
  must(arrays.exercises.every(item => /Start from a blank Python cell\./.test(item.prompt)), 'every Arrays stage has explicit student-authored guidance');
  must(html.indexOf('workshop-bootstrap-v33.js') < html.indexOf('workshop-page.js'), 'stable transport loads before the workshop controller');
  must(html.includes('workshop-page.js?v=20260910-arrays-recovery-v37'), 'V37 cache key is active');
  must(page.includes('IJR_WORKSHOP_RETRY_BOOT') && page.includes("reason:'backend'"), 'startup failure exposes a retry path instead of a false access error');
  must(page.includes('returnTo=${encodeURIComponent(target)}') && hub.includes('requestedReturnTo.match'), 'student sign-in returns to the requested Arrays workshop');
  must(!page.includes('ensureRuntime().catch'), 'Pyodide stays lazy until the student presses Run');

  const config = {
    supabaseUrl:'https://example.supabase.co',
    supabasePublishableKey:'public-test-key',
    sessionStorageKey:'test-session',
    rpc:{resume:'python_hub_resume_v1',submit:'python_hub_submit_v1'}
  };
  const snapshot = await masterPreviewSnapshot(topics, config);
  const arraysProgress = snapshot?.topics?.find(item => item.slug === 'arrays');
  must(snapshot?.registration?.mode === 'master-preview', 'master preview builds an immediate isolated registration snapshot');
  must(arraysProgress?.status === 'available', 'master preview marks Arrays available without waiting on a remote snapshot');
  must(arraysProgress?.items?.length === 12, 'master preview and Arrays UI agree on all 12 stages');

  console.log('Arrays Workshop V37 QA PASS (frontend data, boot, recovery, lazy runtime and master snapshot).');
})().catch(error => {
  console.error(`Arrays Workshop V37 QA FAIL: ${error.message}`);
  process.exit(1);
});
