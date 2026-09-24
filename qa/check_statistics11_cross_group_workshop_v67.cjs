const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const migration=fs.readFileSync(
  path.join(root,'supabase','migrations','20260924172000_statistics11_cross_group_workshop_email_v67.sql'),
  'utf8'
);
const teamGate=fs.readFileSync(
  path.join(root,'python','workshop-team-gate-v50.js'),
  'utf8'
);
const v66=fs.readFileSync(
  path.join(root,'supabase','migrations','20260924152329_statistics11_team_progress_consolidation_v66.sql'),
  'utf8'
);

const ensureBody=(migration.match(
  /create or replace function private\.python_hub_ensure_participant_registration_v52[\s\S]*?\$function\$;/i
)||[''])[0];

const checks={
  'cross-group roster resolver exists':
    migration.includes('python_hub_resolve_roster_any_group_v67'),
  'resolver scans all Statistics 11 groups':
    migration.includes("s.group_code in ('11A','11B','11C')"),
  'resolver has no select-that-group admission error':
    !migration.includes('Select that group.'),
  'participant admission uses group-agnostic resolver':
    ensureBody.includes('python_hub_resolve_roster_any_group_v67(v_email)'),
  'institutional domain remains mandatory':
    ensureBody.includes("split_part(v_email,'@',2) <> 'ijr.edu.co'"),
  'workstation context group remains constrained':
    ensureBody.includes("v_group not in ('11A','11B','11C')"),
  'canonical roster lookup is not constrained to workstation group':
    ensureBody.includes('where s.id=v_registry_id') &&
    !ensureBody.includes('s.group_code = v_group'),
  'session-local shadow registration preserves group invariant':
    ensureBody.includes("digest(v_group||'|'||v_email") &&
    ensureBody.includes('where r.group_code=v_group'),
  'actual roster group returned for auditability':
    ensureBody.includes("'roster_group_code',v_roster_group"),
  'frontend admits any institutional participant email':
    teamGate.includes('/^[^@\\s]+@ijr\\.edu\\.co$/i') &&
    !teamGate.includes('Select that group.'),
  'team size remains 1-3':
    teamGate.includes('if(emails.length<1 || emails.length>3)') &&
    v66.includes('if v_size<1 or v_size>3 then'),
  'V66 reconciliation invariant remains intact':
    v66.includes('Workshop team integrity error: participant group mismatch')
};

const failed=Object.entries(checks)
  .filter(([,ok])=>!ok)
  .map(([name])=>name);

if(failed.length){
  console.error('Statistics 11 cross-group workshop V67 contract failed:',failed.join(', '));
  process.exit(1);
}

console.log(`Statistics 11 cross-group workshop V67 PASS (${Object.keys(checks).length}/${Object.keys(checks).length}).`);
console.log('Any valid @ijr.edu.co teammate can join from 11A/11B/11C while canonical roster identity and durable progress remain preserved.');
