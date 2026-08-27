#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const html=read('python/index.html');
const js=read('python/student-progress-v29.js');
const css=read('python/student-progress-v29.css');
const migration=read('supabase/migrations/20260827160452_python_hub_student_identity_progress_v29.sql');

for(const token of [
  'student-progress-v29.css',
  'student-progress-v29.js',
  'id="identityProgressPanel"',
  'Current registration progress',
  'stable User ID',
  'individual progress'
]){
  if(!html.includes(token)) throw new Error(`Student page missing V29 UI contract: ${token}`);
}

for(const token of [
  'Registration ID',
  'User ID',
  'member.user_id',
  'member.progress',
  'currently validated workshop stages',
  'Historical credit',
  'config.rpc.resume',
  'Team registration',
  'Individual registration'
]){
  if(!js.includes(token)) throw new Error(`V29 renderer missing identity/progress behavior: ${token}`);
}

for(const token of [
  '.student-identity-shell',
  '.student-progress-grid',
  '.student-user-code',
  '.student-topic-progress-row',
  '@media(max-width:760px)'
]){
  if(!css.includes(token)) throw new Error(`V29 responsive UI missing: ${token}`);
}

for(const token of [
  'create table if not exists public.python_hub_student_identities',
  'user_code text not null unique',
  'student_identity_id uuid',
  'enable row level security',
  'revoke all on table public.python_hub_student_identities from anon, authenticated',
  'private.python_hub_member_progress_v29',
  'count(distinct r.item_key)',
  'rm.student_identity_id=p_identity_id',
  "'historical_credit'",
  "'display_id'",
  "'user_id',i.user_code",
  "'progress',private.python_hub_member_progress_v29(i.id)"
]){
  if(!migration.includes(token)) throw new Error(`V29 migration missing secure individual-progress contract: ${token}`);
}

if(/service[_-]?role/i.test(js+html)) throw new Error('Student frontend must not contain a service-role credential/reference.');
if(!migration.includes('revoke all on function private.python_hub_member_progress_v29(uuid) from public,anon,authenticated')) throw new Error('Private progress helper must not be executable by browser roles.');
if(!migration.includes("split_part(institutional_email,'@',2)='ijr.edu.co'")) throw new Error('Student identity table must enforce the institutional email domain.');

console.log('PYTHON HUB STUDENT IDENTITY PROGRESS V29 QA PASS');
console.log('registration_id=VISIBLE stable_user_id=PASS individual_progress=AGGREGATED team_members=INDIVIDUAL historical_credit=SEPARATE rls=PASS private_helpers=LOCKED');
