(() => {
  'use strict';

  // Arrays stages are independent code cells. A student's earlier attempt such
  // as "print = min(values)" must not replace Python builtins for later runs.
  // Keep the Pyodide runtime and filesystem, but isolate Python variables.
  async function run(pyodide, code) {
    const dictFactory = pyodide.globals.get('dict');
    let scope = null;
    try {
      scope = dictFactory();
      return await pyodide.runPythonAsync(String(code ?? ''), { globals: scope });
    } finally {
      if (scope) scope.destroy();
      dictFactory.destroy();
    }
  }

  function guidance(code) {
    if (/(?:^|\n)\s*print\s*=(?!=)/.test(String(code ?? ''))) {
      return 'Use print(...) with parentheses, not print = .... An assignment replaces the print function and does not display a result. For the minimum and maximum exercise, print each calculated value on a separate line.';
    }
    return '';
  }

  window.IJR_ARRAYS_STAGE_ISOLATION_V76 = Object.freeze({ run, guidance });
})();
