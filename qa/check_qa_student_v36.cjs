'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const html = read('python/index.html');
const hub = read('python/hub-router.js');
const facade = read('python/supabase-rpc-facade-v65.js');
const workshop = read('python/workshop-v42.js');
const startup = read('python/workshop-startup-v50.js');
const config = read('python/config-v2.js');

const checks = {
  'student page loads current classroom router': html.includes('hub-router.js?v=20260924-classroom-v65'),
  'local RPC facade loads before optional access modules': html.includes('supabase-rpc-facade-v65.js?v=20260924-classroom-v65'),
  'official Supabase SDK is non-blocking and pinned': html.includes('async src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.1"'),
  'institutional domain remains enforced': config.includes("institutionalEmailDomain: 'ijr.edu.co'"),
  'supervised lab login RPC is current': hub.includes("const LAB_LOGIN_RPC = config.rpc?.labLogin || 'python_hub_lab_login_v51'"),
  'student groups remain allowlisted': hub.includes("['11A','11B','11C'].includes(identity.groupCode)"),
  'institutional email is validated before login': hub.includes('validInstitutionalEmail(identity.email)'),
  'current entry calls the lab login RPC': hub.includes('const data=await rpc(LAB_LOGIN_RPC,{'),
  'Hub transport does not require CDN SDK': hub.includes('async function restRpc(name, args = {}, attempt = 0)') && !hub.includes('window.supabase.createClient('),
  'Hub transport has a bounded timeout': hub.includes('const RPC_TIMEOUT_MS = 6500'),
  'Hub retries transient gateway failures once': hub.includes('const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504])') && hub.includes("return restRpc(name, args, 1)"),
  'temporary resume errors preserve local session': hub.includes("if(!error?.transient) clearHubSession()"),
  'local facade has independent resilient REST path': facade.includes("statistics11-rpc-facade-v65") && facade.includes('RETRYABLE_STATUS') && facade.includes('window.supabase = facade'),
  'workshop reads the same saved student session': workshop.includes('localStorage, config.sessionStorageKey'),
  'workshop uses direct Supabase REST RPC': workshop.includes('/rest/v1/rpc/') && workshop.includes('AbortController'),
  'workshop startup protects resume ordering': startup.includes('python_hub_resume_v1') && startup.includes('!teamReady'),
  'workshop return path is allowlisted': hub.includes("requestedReturnTo.match(/^workshop\\.html\\?topic=([a-z0-9-]+)$/)"),
  'locked topics cannot auto-redirect': hub.includes("progress.status!=='locked'")
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length) {
  console.error('Statistics 11 Student Lab Access V65 contract failed:', failed.join(', '));
  process.exit(1);
}

console.log(`Statistics 11 Student Lab Access V65 PASS (${Object.keys(checks).length}/${Object.keys(checks).length}).`);
console.log('Institutional email -> resilient HTTPS RPC -> shared progress session -> workshop team gate.');
