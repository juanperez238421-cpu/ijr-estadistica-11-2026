const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const must = (condition, message) => {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
};

const masterConfig = read('python/master/config.js');
const masterIndex = read('python/master/index.html');
const masterReview = read('python/master/topic-review.js');
const sessionBridge = read('python/master/session-bridge-v35.js');
const masterContext = read('python/master-context-v34.js');
const theoryHtml = read('python/theory.html');
const workshopHtml = read('python/workshop.html');
const arraysJs = read('python/arrays-theory-v34.js');
const arraysCss = read('python/arrays-theory-v34.css');

const canonical = 'ijr-stat11-master-teacher-session-v1';
const legacy = 'ijr-stat11-python-master-code-session-v1';

must(masterConfig.includes(`teacherSessionKey:'${canonical}'`), 'teacher dashboard writes the canonical master-session key');
must(masterConfig.includes(`legacyTeacherSessionKey:'${legacy}'`), 'legacy V34 key is documented for compatibility');
must(sessionBridge.includes(canonical) && sessionBridge.includes(legacy), 'session bridge knows canonical and V34 legacy keys');
must(sessionBridge.includes('sessionStorage.setItem(CANONICAL, legacy)'), 'session bridge migrates an already-open V34 teacher session');
must(sessionBridge.includes("document.getElementById('logoutButton')") && sessionBridge.includes('remove(CANONICAL)') && sessionBridge.includes('remove(LEGACY)'), 'teacher sign-out clears both master-session keys');

const bridgePos = masterIndex.indexOf('session-bridge-v35.js');
const configPos = masterIndex.indexOf('config.js?v=');
const appPos = masterIndex.indexOf('app.js?v=');
must(bridgePos >= 0 && bridgePos < configPos && configPos < appPos, 'session bridge loads before master config/app state initialization');

must(masterReview.includes('&masterPreview=1'), 'teacher review links explicitly preserve masterPreview=1');
must(masterReview.includes("previewHref('theory'"), 'teacher review builds an explicit theory preview route');
must(masterReview.includes("previewHref('workshop'"), 'teacher review builds an explicit workshop preview route');
must(!/href=\\?"\$\{theoryHref\}\\?"[^>]*target=\\?"_blank\\?"/.test(masterReview), 'theory preview no longer opens in a new tab that loses sessionStorage');
must(!/href=\\?"\$\{workshopHref\}\\?"[^>]*target=\\?"_blank\\?"/.test(masterReview), 'workshop preview no longer opens in a new tab that loses sessionStorage');

must(masterContext.includes(canonical) && masterContext.includes(legacy), 'theory/workshop master context accepts the compatibility bridge');
must(masterContext.includes("params.set('masterPreview', '1')"), 'same-tab master context self-heals a dropped preview query parameter');

function ordered(haystack, first, second) {
  const a = haystack.indexOf(first);
  const b = haystack.indexOf(second);
  return a >= 0 && b >= 0 && a < b;
}
must(ordered(theoryHtml, 'master-context-v34.js', 'workshop-bootstrap-v33.js'), 'theory migrates master context before its bootstrap');
must(ordered(workshopHtml, 'master-context-v34.js', 'workshop-bootstrap-v33.js'), 'workshop migrates master context before its bootstrap');
must(theoryHtml.includes('master-context-v35') && workshopHtml.includes('master-context-v35'), 'theory/workshop cache-bust the V35 master-context fix');

const diagramTypes = [...arraysJs.matchAll(/type:\s*'([^']*v34)'/g)].map(m => m[1]);
must(diagramTypes.length >= 6, `Arrays theory exposes at least six dedicated visual models (found ${diagramTypes.length})`);
must(arraysJs.includes('array-anatomy-v34') && arraysJs.includes('array-index-v34') && arraysJs.includes('array-append-v34') && arraysJs.includes('array-summary-v34') && arraysJs.includes('array-mean-v34') && arraysJs.includes('array-dataset-v34'), 'Arrays visuals cover anatomy, indexing, mutation, summaries, mean and DataFrame bridge');
must(arraysCss.includes('font-size:clamp(3rem,6vw,5.8rem)'), 'Arrays hero uses large classroom-readable typography');
must(arraysCss.includes('.arr34-cell strong{font-size:2rem'), 'array-cell values are enlarged for projection');
must((arraysCss.match(/@keyframes\s+arr34/g) || []).length >= 8, 'Arrays theory contains a substantial animation set');
must(arraysCss.includes('@media(prefers-reduced-motion:reduce)'), 'Arrays animation respects reduced-motion accessibility');

if (process.exitCode) {
  console.error('Master/Arrays V35 QA failed.');
  process.exit(process.exitCode);
}
console.log('Master/Arrays V35 QA passed.');
