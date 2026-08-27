#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const sandbox = {
  console,
  window: {},
  sessionStorage: {
    getItem(){ return null; },
    setItem(){},
    removeItem(){}
  }
};
sandbox.window.window = sandbox.window;

vm.runInNewContext(read('python/course-data-v4.js'), sandbox, {filename:'course-data-v4.js'});
vm.runInNewContext(read('python/workshop-catalog-v27.js'), sandbox, {filename:'workshop-catalog-v27.js'});

const topics = sandbox.window.IJR_PYTHON_HUB_TOPICS;
if (!Array.isArray(topics) || topics.length !== 8) throw new Error('Expected exactly 8 Python Hub topics.');

const expectedSlugs = ['operations','types','arrays','logic','conditions','loops','functions','statistics'];
for (const slug of expectedSlugs) {
  const topic = topics.find(item => item.slug === slug);
  if (!topic) throw new Error(`Missing topic: ${slug}`);
  if (!Array.isArray(topic.exercises) || topic.exercises.length < 12) {
    throw new Error(`${slug} has ${topic.exercises?.length || 0} stages; minimum is 12.`);
  }
  if (topic.exercises.length !== 12) {
    throw new Error(`${slug} should have exactly 12 stages in V27; found ${topic.exercises.length}.`);
  }
  const keys = topic.exercises.map(ex => ex.key);
  if (new Set(keys).size !== keys.length) throw new Error(`${slug} contains duplicate exercise keys.`);
  for (const ex of topic.exercises) {
    if (ex.mode === 'code') {
      if (String(ex.code || '') !== '') throw new Error(`${ex.key} exposes starter code.`);
      if (!/blank (?:python )?cell/i.test(String(ex.prompt || ''))) throw new Error(`${ex.key} does not explicitly tell the student to start from a blank cell.`);
    }
  }
}

const total = topics.reduce((sum, topic) => sum + topic.exercises.length, 0);
if (total !== 96) throw new Error(`Expected 96 total stages; found ${total}.`);

const catalog = read('python/workshop-catalog-v27.js');
if (/expected_text|expectedAnswer|answerKey/i.test(catalog)) {
  throw new Error('Frontend workshop catalog must not contain backend answer keys.');
}

for (const htmlPath of ['python/index.html','python/theory.html','python/workshop.html']) {
  const html = read(htmlPath);
  const coursePos = html.indexOf('course-data-v4.js');
  const catalogPos = html.indexOf('workshop-catalog-v27.js');
  if (coursePos < 0 || catalogPos < 0 || catalogPos <= coursePos) {
    throw new Error(`${htmlPath} must load workshop-catalog-v27.js after course-data-v4.js.`);
  }
}

const workshopHtml = read('python/workshop.html');
const pagePos = workshopHtml.indexOf('workshop-page.js');
const uxPos = workshopHtml.indexOf('workshop-blank-cell-v27.js');
if (pagePos < 0 || uxPos < 0 || uxPos <= pagePos) {
  throw new Error('workshop-blank-cell-v27.js must load after workshop-page.js.');
}

console.log('PYTHON HUB WORKSHOP CATALOG V27 QA PASS');
console.log('topics=8 stages_per_topic=12 total=96 code_cells=BLANK answer_keys=BACKEND_ONLY');
