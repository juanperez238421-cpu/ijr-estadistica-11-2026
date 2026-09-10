'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const html = read('python/index.html');
const hub = read('python/hub-router.js');
const theory = read('python/theory-page.js');
const workshop = read('python/workshop-page.js');
const config = read('python/config-v2.js');

const checks = {
  'student page loads the real router': html.includes('hub-router.js?v=20260910-workshop-return-v37'),
  'synthetic QA bypass is absent': !hub.includes('QA_EMAIL') && !hub.includes('openQaStudentAccount') && !html.includes('hub-router-v36.js'),
  'real students use Supabase Auth signup': hub.includes('client.auth.signUp({') && hub.includes("data:{course:'statistics-11-python-hub'}"),
  'real students use password sign-in': hub.includes('client.auth.signInWithPassword({email:identity.email,password})'),
  'verified auth provisions the student account': hub.includes('config.rpc.studentAccount') && hub.includes('openStudentAccount(identity)'),
  'password quality remains enforced': hub.includes('password.length<8') && hub.includes('/[0-9]/.test(password)'),
  'institutional domain remains enforced': config.includes("institutionalEmailDomain: 'ijr.edu.co'"),
  'student session contract is shared': theory.includes('localStorage.getItem(config.sessionStorageKey)') && workshop.includes('localStorage.getItem(config.sessionStorageKey)'),
  'workshop return path is allowlisted': hub.includes("requestedReturnTo.match(/^workshop\\.html\\?topic=([a-z0-9-]+)$/)"),
  'locked topics cannot auto-redirect': hub.includes("progress.status!=='locked'"),
  'legacy unauthenticated session is rejected': hub.includes('Deliberately do not resume a legacy email-only Hub token here')
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length) {
  console.error('Real Student Auth V37 contract failed:', failed.join(', '));
  process.exit(1);
}

console.log(`Real Student Auth V37 contract PASS (${Object.keys(checks).length}/${Object.keys(checks).length}).`);
console.log('Institutional auth -> student account -> safe requested-workshop return -> shared progress session.');
