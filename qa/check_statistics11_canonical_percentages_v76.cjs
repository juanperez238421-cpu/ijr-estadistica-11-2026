'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const app=fs.readFileSync('python/master/app.js','utf8');
const master=fs.readFileSync('python/master/index.html','utf8');
const hub=fs.readFileSync('python/hub-router.js','utf8');
const student=fs.readFileSync('python/student-progress-v29.js','utf8');
const sql=fs.readFileSync('supabase/migrations/20261029172000_statistics11_canonical_roster_progress_v76.sql','utf8');

assert(master.includes('id="studentColumns"'));
assert(master.includes('app.js?v=20261029-canonical-progress-v76'));
assert(master.includes('16 workshops / 192 stages'));
assert(app.includes('student?.effective_progress?.topics'));
assert(app.includes('student?.validated_by_topic?.[slug]'));
assert(!app.includes('const topicOrder=[\'operations\',\'types\',\'arrays\',\'logic\',\'conditions\',\'loops\',\'functions\',\'statistics\'];'));
assert(sql.includes('private.python_hub_member_progress_v29(v.identity_id)'));
assert(sql.includes('COUNT(DISTINCT w.item_key)'));
assert(sql.includes('teacher_code_session_id(p_teacher_token)'));
assert(sql.includes('REVOKE ALL ON FUNCTION private.python_hub_teacher_master_payload_v76()'));
assert(hub.includes("recognized topic credit (not new submissions)"));
assert(student.includes('currently validated workshop stages')===false,'Credits must never be described as new validated submissions');
assert(student.includes('recognized credits'));

const ctx={
  metrics:{innerHTML:''},studentColumns:{innerHTML:''},
  studentBody:{innerHTML:''},studentCount:{textContent:''}
};
const slice=app.slice(app.indexOf('  const topicColumns='),app.indexOf('  const state='));
const head=app.slice(app.indexOf('  function topicCell(student,slug){'),app.indexOf('\n  function renderRegistrations(',app.indexOf('  function topicCell(student,slug){')));
assert(slice.includes('analyst-project'));
const moduleText=`
  ${slice}
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const topicOf=(student,slug)=>Array.isArray(student?.effective_progress?.topics)?student.effective_progress.topics.find(t=>t.slug===slug):null;
  const creditOf=(student,slug)=>Array.isArray(student?.topic_credits)?student.topic_credits.find(c=>c.topic_slug===slug):null;
  const legacyBadge=()=>'<span>Legacy</span>';
  const hubIdentity=()=>'<span>Hub identity</span>';
  const fmtTime=()=>'-';
  const $=id=>ctx[id];
  ${head}
  return {topicColumns,topicOrder,topicCell,globalCell,renderStudents,renderMetrics};
`;
const m=new Function('ctx',moduleText)(ctx);
assert.equal(m.topicColumns.length,16,'All published modules must be displayed');
assert.equal(new Set(m.topicOrder).size,16,'Each module appears once');
const recognized={
  display_name:'LATORRE AREIZA JUAN ANDRES',group_code:'11C',
  effective_progress:{
    correct_count:24,total_count:192,percent:13,
    topics:[{slug:'logic',correct_count:12,total_count:12,percent:100,historical_credit:true,status:'historical_credit'}]
  },
  validated_by_topic:{arrays:12,logic:3},
  topic_credits:[{topic_slug:'logic',source_key:'teacher_recognition_workshop4_2026_10_29'}]
};
const cel=m.topicCell(recognized,'logic');
assert.match(cel,/100%/);
assert.match(cel,/Teacher recognition/);
assert.match(cel,/3\/12 individually validated/);
assert.match(m.globalCell(recognized),/13%/);
assert.match(m.globalCell(recognized),/24\/192 effective/);
assert.match(m.globalCell(recognized),/15 validated/);
const valentina={
 display_name:'PENAGOS VON WERDER VALENTINA YAZMIN',group_code:'11C',
 effective_progress:{correct_count:8,total_count:192,percent:4,topics:[{slug:'arrays',correct_count:8,total_count:12,percent:67,historical_credit:false,status:'in_progress'}]},
 validated_by_topic:{arrays:8},topic_credits:[]
};
assert.match(m.topicCell(valentina,'arrays'),/67%/);
assert.match(m.topicCell(valentina,'arrays'),/8\/12 validated/);
assert.match(m.globalCell(valentina),/4%/);
assert.match(m.globalCell({display_name:'GOMEZ CASTRILLON ANTONIA',group_code:'11A',effective_progress:null}),/Unlinked roster identity/);
m.renderStudents([recognized,valentina]);
assert.equal((ctx.studentColumns.innerHTML.match(/<th/g)||[]).length,21,'Student + legacy + hub + global + 16 topics + time');
assert.equal((ctx.studentBody.innerHTML.match(/<tr>/g)||[]).length,2);
assert(ctx.studentBody.innerHTML.includes('Teacher recognition'));
m.renderMetrics([recognized,valentina],[]);
assert(ctx.metrics.innerHTML.includes('Average effective progress'));
assert(ctx.metrics.innerHTML.includes('Teacher-credit students'));
console.log('STATISTICS 11 CANONICAL PERCENTAGES V76 PASS: 16 topics / 192 stages, teacher credit metadata, 13% recognized, 4% partial, no phantom credit, source-bound master');
