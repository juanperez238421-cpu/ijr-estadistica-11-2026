(() => {
  'use strict';

  const config = window.IJR_PYTHON_HUB_CONFIG;
  if (!config) return;

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

  // V32 was loaded before the V33 lazy Pyodide bootstrap, so its original
  // loadPyodide wrapper could not always attach. V40 deliberately patches only
  // the lazy Python loader here, after V33 has created it. The stable V33
  // bounded native Supabase transport remains the single student RPC transport.
  const originalLoadPyodide = window.loadPyodide;
  if (typeof originalLoadPyodide === 'function' && !window.__IJR_WORKSHOP_RUNTIME_V40_PATCHED__) {
    window.__IJR_WORKSHOP_RUNTIME_V40_PATCHED__ = true;
    window.loadPyodide = async function (...args) {
      const py = await originalLoadPyodide(...args);
      if (py.__ijrWorkshopReliabilityV40) return py;

      try {
        py.globals.set('__ijr_dataset_csv_v40', datasetCsv);
        py.runPython(`
from pathlib import Path
Path("estudiantes.csv").write_text(__ijr_dataset_csv_v40, encoding="utf-8")
Path("data").mkdir(exist_ok=True)
Path("data/estudiantes.csv").write_text(__ijr_dataset_csv_v40, encoding="utf-8")
`);
      } catch (error) {
        console.warn('V40 could not mount the Statistics 11 classroom CSV.', error);
      }

      if (!py.__ijrDataFirstV32Patched && typeof py.runPythonAsync === 'function') {
        const originalRunPythonAsync = py.runPythonAsync.bind(py);
        py.runPythonAsync = async function (source, options) {
          if (typeof py.loadPackagesFromImports === 'function') {
            await py.loadPackagesFromImports(String(source ?? ''));
          }
          return originalRunPythonAsync(source, options);
        };
      }

      py.__ijrWorkshopReliabilityV40 = true;
      return py;
    };
  }

  window.IJR_WORKSHOP_RELIABILITY_V40 = Object.freeze({
    version: 'v40',
    transport: 'stable-v33-bounded-native-fetch',
    classroomCsvMountedAfterRuntimeLoad: true,
    packageImportsLoadedOnDemand: true
  });
})();
