import assert from 'node:assert/strict';
import { loadPyodide } from 'pyodide';

const pyodide = await loadPyodide();
await pyodide.loadPackage(['numpy', 'pandas', 'matplotlib']);

const python = [
  'import io',
  'import json',
  'import numpy as np',
  'import pandas as pd',
  'import matplotlib',
  'matplotlib.use("Agg", force=True)',
  'import matplotlib.pyplot as plt',
  '',
  'x = np.linspace(0, 6, 120)',
  'df = pd.DataFrame({"x": x, "signal": np.sin(x)})',
  '',
  'ax = df.plot(x="x", y="signal", figsize=(6, 3), legend=False)',
  'ax.set_title("V62 runtime smoke")',
  'ax.set_xlabel("x")',
  'ax.set_ylabel("signal")',
  '',
  'buffer = io.BytesIO()',
  'plt.gcf().savefig(buffer, format="png", dpi=110, bbox_inches="tight")',
  'png = buffer.getvalue()',
  'plt.close("all")',
  '',
  'json.dumps({"bytes": len(png), "signature": png[:8].hex(), "numpy": np.__version__, "pandas": pd.__version__, "matplotlib": matplotlib.__version__})'
].join('\n');

const result = await pyodide.runPythonAsync(python);
let payload;
try {
  payload = JSON.parse(String(result));
} finally {
  if (result && typeof result.destroy === 'function') result.destroy();
}

assert.equal(payload.signature, '89504e470d0a1a0a', 'Matplotlib output must be a real PNG.');
assert.ok(payload.bytes > 5000, 'Rendered PNG is unexpectedly small.');
assert.ok(payload.numpy, 'NumPy did not import.');
assert.ok(payload.pandas, 'Pandas did not import.');
assert.ok(payload.matplotlib, 'Matplotlib did not import.');

console.log('LIBRARY PLAYGROUND V62 PYODIDE RUNTIME PASS');
console.log(JSON.stringify(payload));
