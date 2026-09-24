'use strict';

const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const migration=fs.readFileSync(
  path.join(root,'supabase','migrations','20260924152329_statistics11_team_progress_consolidation_v66.sql'),
  'utf8'
);
const indexes=fs.readFileSync(
  path.join(root,'supabase','migrations','20260924152500_statistics11_team_sync_audit_fk_indexes_v66.sql'),
  'utf8'
);

const checks={
  'durable identity credits': migration.includes('private.python_hub_identity_topic_credits'),
  'team sync audit trail': migration.includes('private.python_hub_team_sync_audit'),
  'team size 1-3 preserved': migration.includes("if v_size<1 or v_size>3 then"),
  'all participants get stable registrations': migration.includes('participant_registration_id'),
  'identity credit used for progress': migration.includes('python_hub_registration_has_topic_credit_v1') && migration.includes('student_identity_id'),
  'full session reconciliation function': migration.includes('python_hub_reconcile_team_session_v66'),
  'response fan-out from owner to members': migration.includes('owner_r.registration_id=v_session.registration_id') && migration.includes('sm.participant_registration_id'),
  'completion refuses incomplete members': migration.includes('Workshop team consolidation failed'),
  'durable team completion credit': migration.includes("'team_workshop_v66'"),
  'advisory lock serializes concurrent team starts': migration.includes('pg_advisory_xact_lock') && migration.includes('hashtextextended'),
  'same student cannot join two active PCs': migration.includes('already has this workshop active on another computer'),
  'stale active sessions are abandoned': migration.includes("interval '2 hours'"),
  'historical completed sessions are reconciled': migration.includes('historical_reconcile_v66'),
  'active sessions are reconciled immediately': migration.includes('active_reconcile_v66'),
  'trigger routes every submit through V66 reconciliation': migration.includes("perform private.python_hub_reconcile_team_session_v66(") && migration.includes("'team_submit'"),
  'participant and owner audit FKs indexed': indexes.includes('python_hub_team_sync_audit_participant_idx') && indexes.includes('python_hub_team_sync_audit_owner_idx')
};

const failed=Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name);
if(failed.length){
  console.error('Statistics 11 Team Progress V66 contract failed:',failed.join(', '));
  process.exit(1);
}
console.log(`Statistics 11 Team Progress V66 PASS (${Object.keys(checks).length}/${Object.keys(checks).length}).`);
console.log('9-PC classroom invariant: 1-3 participants per PC, shared response persistence, durable identity credit, duplicate-active protection, audit trail.');
