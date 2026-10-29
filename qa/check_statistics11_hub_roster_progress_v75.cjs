'use strict';
// Learning Hub: one roster student, potentially several institutional emails
// and registrations, must show one source-backed progress percentage.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const hub=fs.readFileSync('python/hub-router.js','utf8');
const individual=fs.readFileSync('python/student-progress-v29.js','utf8');
const html=fs.readFileSync('python/index.html','utf8');
assert.match(html,/hub-router\.js\?v=20261029-roster-progress-v75/);
assert.match(html,/student-progress-v29\.js\?v=20261029-roster-progress-v75/);
assert.match(html,/id="refreshProgressButton"/);
assert.match(hub,/const individual=individualProgress\(\)/);
assert.match(hub,/lastProgressRefreshAt=Date\.now\(\)/);
assert.match(hub,/window\.addEventListener\('pageshow'/);
assert.match(hub,/window\.addEventListener\('focus'/);
assert.match(hub,/visibilitychange/);
assert.match(hub,/getStoredSession\(\)\?\.registrationId!==saved\.registrationId/);
assert.match(individual,/ijr:stat11-hub-snapshot/);
assert.match(individual,/getSession\(\)\?\.registrationId!==saved\.registrationId/);
const start=hub.indexOf('  function individualProgress()');
const stop=hub.indexOf('  function localEvaluationIdentity()',start);
assert(start>0&&stop>start);
const helpers=hub.slice(start,stop);
function model(snapshot){
  const state={snapshot};
  return new Function('state',helpers+'; return {individualProgress,progressFor};')(state);
}
const topics=[
 {slug:'arrays',status:'available',percent:0,correct_count:0,total_count:12},
 {slug:'logic',status:'available',percent:0,correct_count:0,total_count:12},
 {slug:'descriptive',status:'locked',percent:0,correct_count:0,total_count:12}
];
const member={
 progress:{
  correct_count:30,total_count:192,percent:16,
  topics:[
   {slug:'arrays',correct_count:6,total_count:12,percent:50,status:'in_progress',historical_credit:false},
   {slug:'logic',correct_count:0,total_count:12,percent:0,status:'not_started',historical_credit:false},
   {slug:'descriptive',correct_count:0,total_count:12,percent:0,status:'not_started',historical_credit:false}
  ]
 }
};
const sara=model({topics,members:[member]});
assert.equal(sara.individualProgress().percent,16);
assert.equal(sara.progressFor('arrays').percent,50,'Sara Arrays old email must be included');
assert.equal(sara.progressFor('arrays').correct_count,6);
assert.equal(sara.progressFor('arrays').status,'in_progress');
assert.equal(sara.progressFor('logic').percent,0);
assert.equal(sara.progressFor('descriptive').status,'locked','Canonical progress must not unlock unreleased topics');
const credited=model({topics,members:[{progress:{topics:[{slug:'arrays',correct_count:12,total_count:12,percent:100,historical_credit:true}]}}]});
assert.equal(credited.progressFor('arrays').status,'completed');
assert.equal(credited.progressFor('arrays').historical_credit,true);
const team=model({topics,members:[member,member]});
assert.equal(team.individualProgress(),null);
assert.equal(team.progressFor('arrays').percent,0,'Team fallback retains registration scope');
console.log('Statistics 11 Hub roster progress V75 PASS: 16% overall, 50% Sara Arrays, no false unlock, team fallback, refresh wired');
