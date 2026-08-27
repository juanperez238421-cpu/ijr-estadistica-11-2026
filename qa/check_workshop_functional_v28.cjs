#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const sandbox = { console, window: {}, sessionStorage: { getItem(){return null;}, setItem(){}, removeItem(){} } };
sandbox.window.window = sandbox.window;
vm.runInNewContext(read('python/course-data-v4.js'), sandbox, {filename:'course-data-v4.js'});
vm.runInNewContext(read('python/workshop-catalog-v27.js'), sandbox, {filename:'workshop-catalog-v27.js'});
vm.runInNewContext(read('python/workshop-array-prompts-v28.js'), sandbox, {filename:'workshop-array-prompts-v28.js'});

const topics = sandbox.window.IJR_PYTHON_HUB_TOPICS;
const expectedSlugs = ['operations','types','arrays','logic','conditions','loops','functions','statistics'];
if (!Array.isArray(topics) || topics.length !== 8) throw new Error('V28 expects exactly 8 topics.');

let total = 0;
let codeStages = 0;
for (const slug of expectedSlugs) {
  const topic = topics.find(t => t.slug === slug);
  if (!topic) throw new Error(`Missing topic ${slug}`);
  if (topic.exercises.length !== 12) throw new Error(`${slug} must have exactly 12 workshop stages; found ${topic.exercises.length}.`);
  total += topic.exercises.length;
  const keys = topic.exercises.map(ex => ex.key);
  if (new Set(keys).size !== 12) throw new Error(`${slug} has duplicate stage keys.`);

  for (const ex of topic.exercises) {
    if (ex.mode !== 'code') continue;
    codeStages += 1;
    if (String(ex.code || '') !== '') throw new Error(`${ex.key} exposes starter/solution code.`);
    if (!/blank (?:python )?cell/i.test(String(ex.prompt || ''))) throw new Error(`${ex.key} must explicitly tell the student to begin from a blank cell.`);
    if (String(ex.prompt || '').length < 80) throw new Error(`${ex.key} prompt is too short to support student-authored code.`);
    if (/correct answer|expected answer|the answer is|solution code/i.test(ex.prompt)) throw new Error(`${ex.key} leaks answer/solution language.`);
  }
}
if (total !== 96) throw new Error(`Expected 96 total stages; found ${total}.`);
if (codeStages < 80) throw new Error(`Expected a code-heavy workshop; found only ${codeStages} code stages.`);

const arrays = topics.find(t => t.slug === 'arrays');
if (!arrays || arrays.exercises.length !== 12 || arrays.exercises.some(ex => ex.mode !== 'code')) {
  throw new Error('Arrays must contain 12 student-authored coding stages.');
}

const arrayRequirements = {
  'arr-01':['zero-based','index'],
  'arr-02':['len()'],
  'arr-03':['sum()'],
  'arr-04':['min()','max()'],
  'arr-05':['append()'],
  'arr-06':['sum()','len()','mean'],
  'arr-07':['zero-based','index'],
  'arr-08':['len()','last valid','index'],
  'arr-09':['append','len()'],
  'arr-10':['max()','min()'],
  'arr-11':['append','sum()'],
  'arr-12':['first','last','index']
};
for (const ex of arrays.exercises) {
  const prompt = String(ex.prompt || '').toLowerCase();
  for (const token of arrayRequirements[ex.key] || []) {
    if (!prompt.includes(token.toLowerCase())) throw new Error(`${ex.key} is missing explicit array instruction: ${token}`);
  }
  if (!/do not|must come from|rather than/i.test(ex.prompt)) throw new Error(`${ex.key} must explicitly prevent a direct-answer shortcut.`);
}

const guidance = read('python/workshop-guidance-v28.js');
for (let i=1;i<=12;i++) {
  const key = `arr-${String(i).padStart(2,'0')}`;
  if (!guidance.includes(`'${key}'`)) throw new Error(`V28 guidance missing explicit steps for ${key}.`);
}
for (const phrase of ['Do not type the expected result as a literal shortcut','A direct final-answer print is not a valid solution','No starter solution is provided']) {
  if (!guidance.includes(phrase)) throw new Error(`V28 guidance missing authorship safeguard: ${phrase}`);
}

const workshopHtml = read('python/workshop.html');
const catalogPos = workshopHtml.indexOf('workshop-catalog-v27.js');
const arrayPos = workshopHtml.indexOf('workshop-array-prompts-v28.js');
const pagePos = workshopHtml.indexOf('workshop-page.js');
const v14Pos = workshopHtml.indexOf('workshop-guidance-v14.js');
const v28Pos = workshopHtml.indexOf('workshop-guidance-v28.js');
if (!(catalogPos >= 0 && arrayPos > catalogPos && pagePos > arrayPos)) throw new Error('Array V28 prompt overrides must load after V27 catalog and before workshop-page.js.');
if (!(v14Pos >= 0 && v28Pos > v14Pos)) throw new Error('V28 guidance must load after legacy V14 guidance so stale starter-code instructions cannot win.');

const migration = read('supabase/migrations/20260827154109_python_hub_code_authorship_contract_v28.sql');
for (const token of ['python_hub_code_contract_v28','v_code_valid','v_correct:=(v_answer=v_expected) and v_code_valid','revoke all on function private.python_hub_code_contract_v28']) {
  if (!migration.includes(token)) throw new Error(`Server authorship migration missing contract token: ${token}`);
}
for (const token of ['arr-01','arr-02','arr-03','arr-04','arr-05','arr-06','arr-07','arr-08','arr-09','arr-10','arr-11','arr-12']) {
  if (!migration.includes(token)) throw new Error(`Server authorship contract missing ${token}.`);
}
if (/insert\s+into\s+public\.python_hub_workshop_keys/i.test(migration)) throw new Error('V28 authorship migration must not add answer-key rows to the public repository.');

console.log('PYTHON HUB FUNCTIONAL AUTHORSHIP V28 QA PASS');
console.log(`topics=8 stages=96 code_stages=${codeStages} arrays=12 blank_cells=PASS array_guidance=PASS server_code_contract=PASS direct_answer_shortcuts=REJECTED`);
