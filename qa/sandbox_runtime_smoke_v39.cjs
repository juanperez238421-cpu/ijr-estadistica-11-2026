const assert = require('assert');
const { loadPyodide } = require('pyodide');

(async () => {
  const py = await loadPyodide();
  py.FS.mkdirTree('/home/pyodide/uploads');
  py.FS.writeFile('/home/pyodide/uploads/sample.csv', new TextEncoder().encode('value\n1\n2\n3\n'));

  const source = `
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv('/home/pyodide/uploads/sample.csv')
print(float(df['value'].mean()))
plt.figure()
plt.plot(df['value'])
plt.title('Sandbox smoke')
plt.savefig('/home/pyodide/uploads/smoke.png', dpi=80)
`;

  await py.loadPackagesFromImports(source);
  const stdout = [];
  const stderr = [];
  py.setStdout({ batched: value => stdout.push(String(value)) });
  py.setStderr({ batched: value => stderr.push(String(value)) });
  await py.runPythonAsync(source);

  assert.strictEqual(stderr.join('\n').trim(), '', 'Python stderr should be empty.');
  assert.strictEqual(stdout.join('\n').trim(), '2.0', 'Pandas must read the uploaded CSV and compute the real mean.');
  const stat = py.FS.stat('/home/pyodide/uploads/smoke.png');
  assert(stat.size > 500, 'Matplotlib must create a non-empty PNG figure.');

  console.log(`V39 real runtime smoke passed: Python + Pandas CSV mean=2.0 + Matplotlib PNG ${stat.size} bytes.`);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
