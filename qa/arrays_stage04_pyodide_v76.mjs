import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { loadPyodide } from 'pyodide';

const helperSource=fs.readFileSync('python/arrays-stage-isolation-v76.js','utf8');
const html=fs.readFileSync('python/workshop.html','utf8');
const controller=fs.readFileSync('python/workshop-v42.js','utf8');
const sandbox={window:{}};
vm.runInNewContext(helperSource,sandbox);
const helper=sandbox.window.IJR_ARRAYS_STAGE_ISOLATION_V76;

assert(helper && typeof helper.run==='function' && typeof helper.guidance==='function');
assert(html.includes('arrays-stage-isolation-v76.js?v=20261029-arr04-v76'));
assert(html.indexOf('arrays-stage-isolation-v76.js')<html.indexOf('workshop-v42.js'));
assert(controller.includes('arraysRunner.run(py,code)'),'production controller must invoke isolated runner');
assert.match(helper.guidance('values=[8,4,21,13]\nprint = min(values)'),/print\(\.\.\.\)/);
assert.equal(helper.guidance('values=[8,4,21,13]\nprint(min(values))'),'');

const pyodide=await loadPyodide();
async function execute(code){
  const stdout=[],stderr=[];
  pyodide.setStdout({batched:s=>stdout.push(s)});
  pyodide.setStderr({batched:s=>stderr.push(s)});
  let result;
  try{result=await helper.run(pyodide,code);}
  finally{if(result&&typeof result.destroy==='function')result.destroy();}
  return {stdout:stdout.join('\n').trim(),stderr:stderr.join('\n').trim()};
}

// Reproduce the confirmed incident: a failed student attempt assigned to print
// (rather than calling it), which poisoned the old shared __main__ scope.
await pyodide.runPythonAsync('print = 4\nmin = 77\nmax = 99\nsum = 13\nlen = 8');

const correct='values = [8, 4, 21, 13]\nminimum = min(values)\nmaximum = max(values)\nprint(minimum)\nprint(maximum)';
let actual=await execute(correct);
assert.equal(actual.stderr,'','Stage 4 must not inherit previous shadowed builtins');
assert.equal(actual.stdout,'4\n21','Stage 4 must display minimum then maximum');

const wrong='values = [8,4,21,13]\nprint = min(values)\nprint = max(values)';
actual=await execute(wrong);
assert.equal(actual.stdout,'','Incorrect print assignment must not fabricate output');
actual=await execute(correct);
assert.equal(actual.stdout,'4\n21','Correcting an earlier failed stage must recover immediately');

actual=await execute('values = [6,12]\nvalues.append(18)\nprint(values)');
assert.equal(actual.stdout,'[6, 12, 18]','Stage 5 must work after broken Stage 4 attempt');

actual=await execute('values = [10,15,5,20]\nmean = sum(values) / len(values)\nprint(mean)');
assert.equal(actual.stdout,'12.5','Stage 6 must retain clean builtins');

// Namespace really resets (not just a lucky print fallback).
actual=await execute('print("values" in globals())');
assert.equal(actual.stdout,'False','Each stage run starts without previous student variables');

console.log('ARRAYS STAGE 04 V76 REAL PYODIDE PASS: shadowed print/min/max/sum/len cleared, correct output 4\\n21, correction retry and stages 05/06 work');
