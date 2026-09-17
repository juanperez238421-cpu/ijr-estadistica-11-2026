const fs = require('fs');
const assert = require('assert');

const read = (path) => fs.readFileSync(path, 'utf8');
const official = read('python/workshop.html');
const legacy = read('python/workshop-v42.html');
const gate = read('python/workshop-team-gate-v50.js');
const startup = read('python/workshop-startup-v50.js');
const engine = read('python/workshop-v42.js');
const migration = read('supabase/migrations/20260917162107_statistics11_workshop_team_v50_token_start.sql');

function ordered(source, parts, label) {
  let cursor = -1;
  for (const part of parts) {
    const next = source.indexOf(part, cursor + 1);
    assert(next > cursor, `${label}: missing/out-of-order ${part}`);
    cursor = next;
  }
}

for (const [label, html] of [['official', official], ['legacy', legacy]]) {
  assert(html.includes('Guided Colab Workshop V50'), `${label}: V50 title missing`);
  ordered(html, [
    'workshop-startup-v50.js',
    'workshop-team-gate-v50.js',
    'workshop-v42.js'
  ], `${label} startup sequence`);
}

assert(gate.includes("python_hub_start_workshop_team_v3"), 'gate: V3 start RPC missing');
assert(gate.includes("session?.emails?.[0]"), 'gate: owner email must come from verified Hub session');
assert(!gate.includes('auth.getSession'), 'gate: fragile second Supabase Auth session check returned');
assert(!gate.includes('client.auth'), 'gate: workshop must not depend on a second auth client');
assert(gate.includes('value="1"') && gate.includes('value="2"') && gate.includes('value="3"'), 'gate: 1/2/3 team size options missing');
assert(!/name="stat11TeamSize"[^>]*checked/.test(gate), 'gate: team size must be explicitly selected');
assert(gate.includes('@ijr\\.edu\\.co') || gate.includes('@ijr.edu.co'), 'gate: institutional email validation missing');
assert(gate.includes('p_access_token:session.accessToken'), 'gate: Learning Hub token not passed to backend');

assert(startup.includes("ijr:stat11-workshop-team-started"), 'startup: team-ready event missing');
assert(startup.includes('python_hub_resume_v1'), 'startup: resume sequencing guard missing');
assert(startup.includes("headers.delete('Authorization')"), 'startup: opaque publishable Authorization sanitizer missing');
assert(startup.includes('await teamReadyPromise'), 'startup: workshop boot is not gated on team registration');

assert(engine.includes('config.rpc.resume'), 'engine: resume RPC missing');
assert(engine.includes('config.rpc.submit'), 'engine: submit RPC missing');

assert(migration.includes('create or replace function public.python_hub_start_workshop_team_v3'), 'migration: V3 function missing');
assert(migration.includes('private.python_hub_registration_v1(p_registration_id,p_access_token)'), 'migration: learning-token validation missing');
assert(migration.includes('private.python_hub_ensure_participant_registration_v49'), 'migration: participant registration linkage missing');
assert(migration.includes('participant_registration_id'), 'migration: per-student progress linkage missing');
assert(migration.includes('revoke all on function public.python_hub_start_workshop_team_v3'), 'migration: PUBLIC execute revoke missing');

console.log('STATISTICS 11 WORKSHOP V50 STARTUP CONTRACT PASS');
console.log('team_gate=1/2/3 institutional_email=PASS token_start=PASS startup_order=PASS progress_link=PASS');
