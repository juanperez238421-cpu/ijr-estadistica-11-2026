const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadPyodide } = require('pyodide');

global.window = global;
global.document = {
  querySelector: () => null,
  createElement: () => ({ addEventListener() {}, dataset: {} }),
  head: { appendChild() {} }
};

// Use the installed Pyodide package for a deterministic runtime smoke test.
// The browser module still passes its production CDN indexURL; this adapter
// intentionally ignores that URL while testing the wrapper's execution logic.
global.loadPyodide = () => loadPyodide();

const runtimeSource = fs.readFileSync(
  path.join(__dirname, '..', 'python', 'workshop-runtime-v10.js'),
  'utf8'
);
// eslint-disable-next-line no-eval
eval(runtimeSource);

(async () => {
  const statusEvents = [];
  await global.IJR_PYODIDE_RUNTIME.prepare(status => statusEvents.push(status.phase));
  assert.strictEqual(global.IJR_PYODIDE_RUNTIME.getStatus().ready, true, 'runtime should become ready');
  assert(statusEvents.includes('checking'), 'runtime self-check should run');
  assert(statusEvents.includes('ready'), 'runtime should report ready');

  const printed = await global.IJR_PYODIDE_RUNTIME.run(
    'a = 17\nb = 8\nresult = a + b\nprint(result)'
  );
  assert.strictEqual(printed.output, '25', 'printed output should be captured');

  const expression = await global.IJR_PYODIDE_RUNTIME.run('2 + 3 * 4');
  assert.strictEqual(expression.output, '14', 'last expression should render like a notebook cell');

  const mixed = await global.IJR_PYODIDE_RUNTIME.run('print("first")\n6 * 7');
  assert.strictEqual(mixed.output, 'first\n42', 'stdout and final expression should both render');

  let emptyRejected = false;
  try {
    await global.IJR_PYODIDE_RUNTIME.run('   ');
  } catch (error) {
    emptyRejected = /empty/i.test(error.message);
  }
  assert.strictEqual(emptyRejected, true, 'empty cells should be rejected with a useful message');

  console.log('Workshop runtime V10 real Pyodide smoke passed: print=25, expression=14, mixed=first\\n42.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
