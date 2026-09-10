'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const html = read('python/index.html');
const hub = read('python/hub-router-v36.js');
const theory = read('python/theory-page.js');
const workshop = read('python/workshop-page.js');
const config = read('python/config-v2.js');

const checks = {
  'student page loads V36 router': html.includes('hub-router-v36.js?v=20260910-qa-v36'),
  'synthetic QA email is exact and isolated': hub.includes("const QA_EMAIL='qa.student11@ijr.edu.co';") && hub.includes("const QA_GROUP='11A';"),
  'password stored only as SHA-256 contract': hub.includes("const QA_PASSWORD_SHA256=") && hub.includes("crypto.subtle.digest('SHA-256'") && !hub.includes('LfYom7*bhSr%@by@e&'),
  'QA uses existing student registration backend': hub.includes("const QA_REGISTER_RPC='python_hub_register_v1';") && hub.includes('openQaStudentAccount'),
  'QA session is clearly marked': hub.includes('qaTest:true') && hub.includes('authProtected:false'),
  'QA login bypass is exact identity only': hub.includes('if(isQaIdentity(identity)){') && hub.includes("if(isQaEmail(identity.email) && identity.groupCode!==QA_GROUP)"),
  'QA session resumes before Supabase Auth lookup': hub.indexOf('const storedQa=getStoredSession();') < hub.indexOf('await client.auth.getSession();'),
  'real students keep Supabase Auth signup': hub.includes('client.auth.signUp({') && hub.includes("data:{course:'statistics-11-python-hub'}"),
  'real students keep password sign-in': hub.includes('client.auth.signInWithPassword({email:identity.email,password})'),
  'same production session storage contract': theory.includes('localStorage.getItem(config.sessionStorageKey)') && workshop.includes('localStorage.getItem(config.sessionStorageKey)'),
  'institutional-domain rule remains': config.includes("institutionalEmailDomain: 'ijr.edu.co'"),
  'QA visual labeling is explicit': hub.includes('QA student ·') && hub.includes('isolated test progress')
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length) {
  console.error('QA Student V36 contract failed:', failed.join(', '));
  process.exit(1);
}

console.log(`QA Student V36 contract PASS (${Object.keys(checks).length}/${Object.keys(checks).length}).`);
console.log('Exact QA identity -> password SHA check -> production python_hub_register_v1 -> normal Hub session -> normal theory/workshop routes.');
