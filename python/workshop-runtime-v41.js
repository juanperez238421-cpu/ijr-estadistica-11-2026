(() => {
  'use strict';

  const preparedRuntimes = new WeakSet();
  const datasetCsv = `estudiante,grupo,edad,nota
Estudiante_01,11A,16,4.2
Estudiante_02,11A,17,3.8
Estudiante_03,11A,16,2.9
Estudiante_04,11A,17,4.5
Estudiante_05,11B,16,3.8
Estudiante_06,11B,17,3.2
Estudiante_07,11B,16,4.0
Estudiante_08,11B,17,3.8
Estudiante_09,11C,16,2.7
Estudiante_10,11C,17,4.6
Estudiante_11,11C,16,3.5
Estudiante_12,11C,17,4.0
`;

  async function prepare(py) {
    if (!py || (typeof py !== 'object' && typeof py !== 'function')) {
      throw new Error('Python runtime is unavailable.');
    }
    if (preparedRuntimes.has(py)) return py;

    py.globals.set('__ijr_classroom_csv_v41', datasetCsv);
    py.runPython(`
from pathlib import Path
Path("estudiantes.csv").write_text(__ijr_classroom_csv_v41, encoding="utf-8")
Path("data").mkdir(exist_ok=True)
Path("data/estudiantes.csv").write_text(__ijr_classroom_csv_v41, encoding="utf-8")
`);
    preparedRuntimes.add(py);
    return py;
  }

  async function loadImports(py, source) {
    if (!py || typeof py.loadPackagesFromImports !== 'function') return;
    await py.loadPackagesFromImports(String(source ?? ''));
  }

  window.IJR_WORKSHOP_RUNTIME_V41 = Object.freeze({
    version: 'v41',
    prepare,
    loadImports,
    classroomDataset: 'estudiantes.csv',
    runtimeInitialization: 'after-pyodide-load',
    packageLoading: 'on-demand-from-imports'
  });
})();
