import assert from 'node:assert/strict';
import { loadPyodide } from 'pyodide';

const pyodide = await loadPyodide();

const cases = [
  ['M123-05', 'a=14\nb=6\nproduct=a*b\nprint(product)', '84'],
  ['M123-06', 'value=81\nroot=value ** 0.5\nprint(root)', '9.0'],
  ['M123-11', 'text="25"\nnumber=int(text)\nprint(number+5)', '30'],
  ['M123-12', 'value=7\nconverted=float(value)\nprint(converted)', '7.0'],
  ['M123-17', 'values=[4,8]\nvalues.append(12)\nprint(len(values))', '3'],
  ['M123-18', 'values=[10,15,5,20]\nmean=sum(values)/len(values)\nprint(mean)', '12.5'],
  ['M123-27', 'a=9\nb=4\nresult=a+b\nprint(result)', '13'],
  ['M123-28', 'a=23\nb=5\nresult=a//b\nprint(result)', '4'],
  ['M123-29', 'a=17\nb=5\nresult=a%b\nprint(result)', '2'],
  ['M123-30', 'result=(8+2)*3\nprint(result)', '30'],
  ['M123-39', 'text="18"\nnumber=int(text)\nprint(number+2)', '20'],
  ['M123-40', 'value=5\nconverted=float(value)\nprint(converted)', '5.0'],
  ['M123-41', 'value=16\nconverted=str(value)\nprint(converted)', '16'],
  ['M123-42', 'value=True\nprint(type(value).__name__)', 'bool'],
  ['M123-51', 'values=[3,6]\nvalues.append(9)\nprint(values)', '[3, 6, 9]'],
  ['M123-52', 'values=[5,10,15]\nprint(values[1])', '10'],
  ['M123-53', 'values=[2,4,6,8]\nprint(sum(values))', '20'],
  ['M123-54', 'values=[6,8,10]\nprint(sum(values)/len(values))', '8.0']
];

for (const [id, code, expected] of cases) {
  const stdout = [];
  const stderr = [];
  pyodide.setStdout({batched: message => stdout.push(message)});
  pyodide.setStderr({batched: message => stderr.push(message)});
  let result;
  try {
    result = await pyodide.runPythonAsync(code);
  } finally {
    if (result && typeof result.destroy === 'function') result.destroy();
  }
  assert.equal(stderr.join('\n').trim(), '', id + ' emitted stderr');
  assert.equal(stdout.join('\n').trim(), expected, id + ' terminal output mismatch');
}

console.log('STATISTICS 11 EVALUATION PYODIDE TERMINAL V71 PASS');
console.log(JSON.stringify({tested:cases.length}));
