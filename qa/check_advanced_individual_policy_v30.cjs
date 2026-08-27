#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const migration=read('supabase/migrations/20260827163000_python_hub_advanced_individual_v30.sql');
const master=read('python/master/app.js');

for(const token of [
  'private.python_hub_registration_policies',
  'force_individual boolean not null default false',
  'advanced boolean not null default false',
  "'jeronimo.rodriguez@ijr.edu.co'",
  "upper(display_name)='RODRIGUEZ PEÑA JERONIMO'",
  "v_mode='team'",
  'assigned to individual-only registration and cannot join a team registration',
  "topic_slug='arrays'",
  "teacher_confirmed_arrays_2026_08_27",
  'private.python_hub_teacher_master_payload_v2',
  "'registrations'",
  "'topic_credits'",
  "'registration_policy'"
]){
  if(!migration.includes(token)) throw new Error(`V30 migration missing contract: ${token}`);
}

if(!migration.includes("and not (s.group_code='11A' and upper(s.display_name)='RODRIGUEZ PEÑA JERONIMO')")){
  throw new Error('Arrays correction must retain the teacher-confirmed advanced student and remove the migrated Arrays credit from the other legacy-credit rows.');
}
if(!migration.includes('Raw Class 01 attempts/responses are intentionally preserved')){
  throw new Error('V30 must preserve raw historical evidence while correcting topic-credit flags.');
}
if(!migration.includes('revoke all on table private.python_hub_registration_policies from public, anon, authenticated')){
  throw new Error('Registration policy table must remain private.');
}
if(!migration.includes('revoke all on function private.python_hub_teacher_master_payload_v2() from public,anon,authenticated')){
  throw new Error('Teacher payload helper must not be browser-executable.');
}

for(const token of [
  'Registration history',
  'displayRegistrationId',
  'student.registration_policy',
  'INDIVIDUAL ONLY',
  'ADVANCED',
  'student.registrations',
  'student?.topic_credits',
  'Historical/teacher verified',
  'Topic credit (not fake stage validation)'
]){
  if(!master.includes(token)) throw new Error(`Teacher Master V30 UI missing: ${token}`);
}

if(/service[_-]?role/i.test(master)) throw new Error('Teacher frontend must not expose a service-role credential/reference.');

console.log('PYTHON HUB ADVANCED INDIVIDUAL POLICY V30 QA PASS');
console.log('special_student=INDIVIDUAL_ONLY arrays_credit=TEACHER_CONFIRMED master_registration_history=VISIBLE raw_evidence=PRESERVED');
