const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const workshop = read('python/workshop.html');
const theory = read('python/theory.html');
const capture = read('python/supabase-official-capture-v38.js');
const restore = read('python/supabase-student-restore-v38.js');
const bootstrap = read('python/workshop-bootstrap-v33.js');
const page = read('python/workshop-page.js');

function requireCheck(condition, message) {
  if (!condition) throw new Error(message);
}

for (const [name, html] of [['workshop', workshop], ['theory', theory]]) {
  requireCheck(html.includes('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'), `${name}: official Supabase browser SDK missing`);
  requireCheck(html.includes('supabase-official-capture-v38.js?v=20260910-student-v38'), `${name}: official client capture missing`);
  requireCheck(html.includes('supabase-student-restore-v38.js?v=20260910-student-v38'), `${name}: student transport restore missing`);
  const captureAt = html.indexOf('supabase-official-capture-v38.js');
  const bootstrapAt = html.indexOf('workshop-bootstrap-v33.js');
  const restoreAt = html.indexOf('supabase-student-restore-v38.js');
  requireCheck(captureAt >= 0 && bootstrapAt > captureAt && restoreAt > bootstrapAt, `${name}: capture/bootstrap/restore execution order is incorrect`);
  requireCheck(html.includes('transport not initialized'), `${name}: startup recovery diagnostics missing`);
}

requireCheck(capture.includes('IJR_SUPABASE_OFFICIAL_V38'), 'capture: official client handle missing');
requireCheck(capture.includes("source: valid ? '@supabase/supabase-js@2' : 'missing'"), 'capture: source diagnostic missing');
requireCheck(restore.includes("params.get('masterPreview') === '1'"), 'restore: master preview isolation missing');
requireCheck(restore.includes("mode: 'official-supabase-js'"), 'restore: official student mode missing');
requireCheck(restore.includes('Promise.race'), 'restore: bounded RPC timeout missing');
requireCheck(restore.includes('RPC_TIMEOUT_MS = 10000'), 'restore: 10 second RPC timeout contract missing');
requireCheck(restore.includes('originalRpc(name, rpcArgs, options)'), 'restore: official SDK RPC delegation missing');
requireCheck(bootstrap.includes('masterPreview'), 'bootstrap: teacher preview adapter contract missing');
requireCheck(page.includes("const requested = new URLSearchParams(location.search).get('topic') || 'operations';"), 'workshop page: topic routing missing');
requireCheck(page.includes("$('workshopApp').classList.remove('hidden');"), 'workshop page: success reveal missing');
requireCheck(page.includes("$('accessPanel').classList.remove('hidden');"), 'workshop page: failure reveal missing');

console.log('STUDENT WORKSHOP TRANSPORT V38 QA PASS');
console.log('official SDK=PASS master preview isolation=PASS bounded RPC=PASS startup diagnostics=PASS');
