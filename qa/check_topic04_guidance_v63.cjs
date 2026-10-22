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
assert(workshop.includes('workshop-v42.js?v=20261022-session-recovery-v73') || workshop.includes('workshop-v42.js?v=20261022-topic04-validate-v72'), 'Workshop must load the latest Stage 06 preflight and session-recovery runtime without losing saved progress.');
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
const stage6={key:'logic-06',mode:'code'};
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



// Topic 04 regression: Run -> Validate must unlock ONLY on a fresh,
// successful Python execution with the exact Stage 06 output.
const validationSource = runtime.match(/function updateValidationState\(\)\s*\{[\s\S]*?\n  \}/);
assert(validationSource, 'Run-to-Validate state handler not found.');
function renderValidationState(exercise, code, run) {
  const fields = {
    codeEditor: { value:code },
    validateButton: { disabled:true },
    saveMessage: { textContent:'' }
  };
  const state = { runs:new Map(run ? [[exercise.key,run]] : []) };
  vm.runInNewContext(validationSource[0]+';updateValidationState()', {
    state, stage06Preflight, activeExercise:()=>exercise, $:key=>fields[key]
  });
  return fields;
}
const successfulRun = {ok:true,code:correctCode,output:'True'};
let ui = renderValidationState(stage6,correctCode,successfulRun);
assert.strictEqual(ui.validateButton.disabled,false,'Successful actual Stage 06 Run MUST enable Validate.');
assert.match(ui.saveMessage.textContent,/Ready to validate/);
ui = renderValidationState(stage6,correctCode,null);
assert.strictEqual(ui.validateButton.disabled,true,'Never allow validation without executing Python.');
ui = renderValidationState(stage6,correctCode,{...successfulRun,output:'False'});
assert.strictEqual(ui.validateButton.disabled,true,'False result must not enable Stage 06 validation.');
assert.match(ui.saveMessage.textContent,/print exactly True/);
ui = renderValidationState(stage6,correctCode,{...successfulRun,ok:false,output:'Traceback'});
assert.strictEqual(ui.validateButton.disabled,true,'Python runtime errors must block submission.');
assert.match(ui.saveMessage.textContent,/execution failed/);
ui = renderValidationState(stage6,correctCode+'\n# code was edited',successfulRun);
assert.strictEqual(ui.validateButton.disabled,true,'Editing code invalidates the prior Run.');
assert.match(ui.saveMessage.textContent,/changed after running/);
ui = renderValidationState(stage6,screenshotCode,{ok:true,code:screenshotCode,output:'True'});
assert.strictEqual(ui.validateButton.disabled,true,'Incorrect workbook metadata must fail preflight.');
assert.match(ui.saveMessage.textContent,/xlsx_library_output/);
console.log('TOPIC 04 RUN TO VALIDATE V72 STATE REGRESSION PASS');

// Only Topic 04 permits legitimate multi-line paste. The original no-paste
// classroom policy remains enforced for all other workshops.
const authorship = fs.readFileSync('python/workshop-authorship-v53.js','utf8');
assert(workshop.includes('workshop-authorship-v53.js?v=20261022-topic04-input-v72'), 'Updated Topic 04 editor must not be served from stale cache.');
function editorPolicy(topicSlug) {
  const listeners = {};
  const editor = {
    dataset:{}, addEventListener:(event,handler)=>{listeners[event]=handler;}, focus:()=>{}
  };
  const modeLabel={textContent:''};
  const saveMessage={textContent:''};
  const elements={codeEditor:editor,cellModeLabel:modeLabel,saveMessage};
  const windowStub={IJR_PYTHON_HUB_TOPICS:[],clearTimeout:()=>{},setTimeout:()=>1};
  vm.runInNewContext(authorship,{
    URLSearchParams, location:{search:'?topic='+topicSlug},
    window:windowStub,
    document:{readyState:'complete',getElementById:id=>elements[id]||null}
  });
  function prevented(eventName,inputType){
    const e={inputType,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};
    listeners[eventName](e);
    return e.defaultPrevented;
  }
  return {prevented,modeLabel};
}
const logicEditor=editorPolicy('logic');
assert.strictEqual(logicEditor.prevented('paste'),false,'Topic 04 paste must not be blocked.');
assert.strictEqual(logicEditor.prevented('beforeinput','insertFromPaste'),false,'Topic 04 browser paste should enter code.');
assert.strictEqual(logicEditor.prevented('drop'),true,'File drops must remain blocked.');
assert.match(logicEditor.modeLabel.textContent,/Run, then Validate/);
const arraysEditor=editorPolicy('arrays');
assert.strictEqual(arraysEditor.prevented('paste'),true,'Other workshops must retain no-paste policy.');
assert.strictEqual(arraysEditor.prevented('beforeinput','insertFromPaste'),true,'Other workshop paste must remain blocked.');
console.log('TOPIC 04 INPUT POLICY V72 REGRESSION PASS');

console.log('TOPIC 04 EXPLICIT GUIDANCE V63 CONTRACT PASS');
console.log('12_stages=PASS exact_names=PASS exact_lines=PASS flowcharts=PASS expected_output=PASS common_mistakes=PASS');