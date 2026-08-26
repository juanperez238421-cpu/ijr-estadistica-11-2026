const assert = require('assert');
const { loadPyodide } = require('pyodide');

async function executeLikeProvenWorkshop(py, source) {
  const stdout = [];
  const stderr = [];
  py.setStdout({ batched: m => stdout.push(m) });
  py.setStderr({ batched: m => stderr.push(m) });
  let result;
  try {
    result = await py.runPythonAsync(source);
    if (result !== undefined && result !== null) {
      const text = String(result);
      if (text !== 'None') stdout.push(text);
      if (typeof result.destroy === 'function') result.destroy();
    }
  } catch (err) {
    stderr.push(String(err?.message || err));
  }
  return { output: stdout.join('\n').trim(), errors: stderr.join('\n').trim() };
}

(async () => {
  const py = await loadPyodide();

  const stage1 = await executeLikeProvenWorkshop(py, 'a = 17\nb = 8\nresult = a + b\nprint(result)');
  assert.strictEqual(stage1.errors, '');
  assert.strictEqual(stage1.output, '25');

  const expression = await executeLikeProvenWorkshop(py, '2 + 3 * 4');
  assert.strictEqual(expression.errors, '');
  assert.strictEqual(expression.output, '14');

  const terminal = await executeLikeProvenWorkshop(py, '29 % 6');
  assert.strictEqual(terminal.output, '5');

  const multi = await executeLikeProvenWorkshop(py, 'print(4)\nprint(21)');
  assert.strictEqual(multi.output, '4\n21');

  const broken = await executeLikeProvenWorkshop(py, 'print(');
  assert.notStrictEqual(broken.errors, '');

  console.log('Workshop Colab V11 real Pyodide smoke passed: stage=25, expression=14, terminal=5, multiline=4/21, syntax error captured.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
