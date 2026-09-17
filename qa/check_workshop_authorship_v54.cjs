'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'python', 'workshop.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'python', 'workshop-authorship-v54.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  }
}

assert(html.includes('workshop-authorship-v54.js?v=20260917-v54'), 'workshop.html must load the V54 authorship layer.');
const guardIndex = html.indexOf('workshop-authorship-v54.js?v=20260917-v54');
assert(guardIndex > html.indexOf('workshop-v42.js?v=20260917-v50'), 'V54 must load after the workshop runtime.');
assert(guardIndex > html.indexOf('workshop-guidance-v43.js?v=20260911-v45'), 'V54 must load after the legacy guidance layer.');

for (const token of [
  "editor.addEventListener('paste'",
  "editor.addEventListener('drop'",
  "editor.addEventListener('beforeinput'",
  "event.inputType === 'insertFromPaste'",
  "event.inputType === 'insertFromDrop'",
  'if (masterPreview) return;',
  'prompt.hidden = true;',
  'steps.hidden = true;',
  'The workshop does not provide executable solution lines.',
  'Paste is disabled in student code cells.'
]) {
  assert(js.includes(token), `Missing V54 safeguard: ${token}`);
}

for (const key of ["'op-01'", "'op-10'", "'type-01'", "'type-06'", "'arr-01'", "'arr-12'", "'logic-01'", "'logic-09'"]) {
  assert(js.includes(key), `Missing less-explicit challenge prompt for ${key}.`);
}

assert(!js.includes('/rest/v1/'), 'V54 must not call the Supabase REST API.');
assert(!js.includes('python_hub_submit'), 'V54 must not replace the authoritative validator.');
assert(!js.includes('localStorage.setItem'), 'V54 must not mutate stored progress or sessions.');
assert(!js.includes('sessionStorage.setItem'), 'V54 must not mutate drafts or session state.');

if (!process.exitCode) {
  console.log('PASS: workshop authorship V54 reduces answer-like guidance, preserves authoritative validation, and blocks paste/drop only in student code cells.');
}
