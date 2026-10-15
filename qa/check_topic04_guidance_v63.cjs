'use strict';

const fs = require('fs');
const assert = require('assert');

const workshop = fs.readFileSync('python/workshop.html', 'utf8');
const runtime = fs.readFileSync('python/workshop-v42.js', 'utf8');
const xlsx = fs.readFileSync('python/workshop-xlsx-topic-v46.js', 'utf8');
const overlay = fs.readFileSync('python/workshop-topic04-guidance-v63.js', 'utf8');
const css = fs.readFileSync('python/workshop-topic04-guidance-v63.css', 'utf8');

assert(workshop.includes('workshop-topic04-guidance-v63.css?v=20260922-v63'), 'Workshop must load V63 guidance CSS.');
assert(workshop.includes('workshop-topic04-guidance-v63.js?v=20260922-v63'), 'Workshop must load V63 guidance JS.');
assert(workshop.includes('workshop-v42.js?v=20261015-stage06-preflight-v70'), 'Workshop must load the Stage 06 preflight runtime without losing saved progress.');
assert(workshop.includes('workshop-xlsx-topic-v46.js?v=20260922-v63'), 'Topic 04 XLSX overlay cache key must expose the V63 concept-preservation update.');

for (let stage = 1; stage <= 12; stage += 1) {
  const key = 'logic-' + String(stage).padStart(2, '0');
  assert(runtime.includes("'" + key + "'"), 'Missing explicit runtime guidance for ' + key);
  assert(overlay.includes(stage + ': {'), 'Missing V63 visual scaffold for Stage ' + stage);
}

for (const token of [
  'import math',
  'root = math.sqrt(81)',
  'import statistics',
  'values = [72, 86, 91]',
  'from pathlib import Path',
  'file = Path("pandas_excel_students.xlsx")',
  'from openpyxl import load_workbook',
  'wb = load_workbook("pandas_excel_students.xlsx")',
  'ws = wb["Students"]',
  'from openpyxl import Workbook',
  'output_file = Path("xlsx_library_output.xlsx")',
  'import pandas as pd',
  'df = pd.read_excel("pandas_excel_students.xlsx", sheet_name="Students")',
  'scores = df["score"]',
  'filtered = df.loc[df["score"] >= 90]',
  'df["passed"] = df["score"] >= 70',
  'filtered.to_excel("pandas_analysis_output.xlsx", index=False)'
]) {
  assert(runtime.includes(token), 'Explicit code construction token missing: ' + token);
}

for (const token of [
  'Use these exact names',
  'Follow this flow',
  'Check before Validate',
  'EXPECTED OUTPUT',
  'Common mistake:',
  'v63-flow-node',
  'v63-name-chip'
]) {
  assert(overlay.includes(token) || css.includes(token), 'V63 scaffold contract missing: ' + token);
}

assert(xlsx.includes('if (concept && !concept.textContent.trim())'), 'XLSX overlay must preserve stage-specific concepts from workshop-v42.');
assert(css.includes('.v63-check-grid') && css.includes('@media(max-width:620px)'), 'V63 responsive guide styling missing.');
assert(!runtime.includes('service_role') && !overlay.includes('service_role'), 'Guidance must not expose privileged secrets.');

// Regression: backend code_feedback must remain visible after re-rendering.
// Exercise the pure formatter from the production runtime.
const vm = require('vm');
const feedbackFnSource = runtime.match(/function validationFeedback\(result\)\s*\{[\s\S]*?\n  \}/);
assert(feedbackFnSource, 'Missing backend validation-feedback formatter.');
const validationFeedback = vm.runInNewContext('(' + feedbackFnSource[0] + ')');
assert.strictEqual(validationFeedback({correct:false,code_valid:false,code_feedback:'Save xlsx_library_output.xlsx'}), 'Save xlsx_library_output.xlsx');
assert.match(validationFeedback({correct:false,code_valid:true}), /output did not match/);
assert.match(validationFeedback({correct:true,code_valid:true}), /Progress saved/);
assert.match(validationFeedback({correct:false}), /Not correct yet/);
const restored = runtime.indexOf("render();\n      // render() reinitializes saveMessage;");
const displayed = runtime.indexOf("$('saveMessage').textContent=feedback;", restored);
assert(restored >= 0 && displayed > restored, 'Supabase feedback must be displayed AFTER render().');
assert.match(runtime, /catch\(error\)\{updateValidationState\(\);\$\('saveMessage'\)\.textContent=/, 'Network errors must remain visible after validation state reset.');
console.log('STAGE 06 VALIDATION FEEDBACK REGRESSION PASS');
// Stage 06 preflight must block incorrect file names and A1 values BEFORE RPC.
const preflightSource=runtime.match(/function stage06Preflight\(ex, code\)\s*\{[\s\S]*?\n  \}/);
assert(preflightSource, 'Stage 06 preflight function is missing.');
const stage06Preflight=vm.runInNewContext('('+preflightSource[0]+')');
const stage6={key:'logic-06'};
const correctCode='from openpyxl import Workbook\nfrom pathlib import Path\nwb = Workbook()\nws = wb.active\nws.title = "Summary"\nws["A1"] = "ready"\noutput_file = Path("xlsx_library_output.xlsx")\nwb.save(output_file)\nprint(output_file.exists())';
const screenshotCode=correctCode.replace('"ready"','"Ready"').replace('"xlsx_library_output.xlsx"','"pandas_excel_students"');
const wrongFile=stage06Preflight(stage6,screenshotCode);
assert.match(wrongFile,/xlsx_library_output\.xlsx/,'Wrong filename must be explained before submission.');
assert.match(wrongFile,/NOT been sent or counted/,'Wrong filename must not reach Supabase.');
const wrongCase=stage06Preflight(stage6,correctCode.replace('"ready"','"Ready"'));
assert.match(wrongCase,/lowercase/,'Wrong A1 capitalization must be explained.');
assert.strictEqual(stage06Preflight(stage6,correctCode),null,'Exact Stage 06 solution must remain valid.');
assert.strictEqual(stage06Preflight({key:'logic-07'},screenshotCode),null,'Stage 06 guard must not block other stages.');
assert.match(runtime,/if\(preflight\)\{\$\('saveMessage'\)\.textContent=preflight;return;\}/,'Invalid attempt must be stopped BEFORE backend RPC.');
assert.match(runtime,/run\.code===String\(\$\('codeEditor'\)\.value\|\|''\) && !preflight/,'Validate button should be disabled when preflight fails.');
console.log('STAGE 06 NO-WASTED-ATTEMPTS PREFLIGHT PASS');



console.log('TOPIC 04 EXPLICIT GUIDANCE V63 CONTRACT PASS');
console.log('12_stages=PASS exact_names=PASS exact_lines=PASS flowcharts=PASS expected_output=PASS common_mistakes=PASS');