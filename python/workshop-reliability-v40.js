(() => {
  'use strict';

  const config = window.IJR_PYTHON_HUB_CONFIG;
  const params = new URLSearchParams(location.search);
  const masterPreview = params.get('masterPreview') === '1';
  if (!config) return;

  const RESUME_TIMEOUT_MS = 6000;
  const SUBMIT_TIMEOUT_MS = 10000;
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

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function normalizeError(payload, status) {
    const message = payload?.message || payload?.error_description || payload?.error || `Backend request failed with HTTP ${status}.`;
    const error = new Error(String(message));
    error.status = status;
    return error;
  }

  async function postRpc(name, args, timeoutMs) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/${encodeURIComponent(name)}`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        headers: {
          apikey: config.supabasePublishableKey,
          Authorization: `Bearer ${config.supabasePublishableKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(args || {}),
        signal: controller.signal
      });

      const text = await response.text();
      let payload = null;
      if (text) {
        try { payload = JSON.parse(text); }
        catch { payload = text; }
      }
      if (!response.ok) throw normalizeError(payload, response.status);
      return { data: payload, error: null };
    } catch (error) {
      if (error?.name === 'AbortError') {
        return { data: null, error: new Error(`Backend request timed out after ${Math.round(timeoutMs / 1000)} seconds.`) };
      }
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    } finally {
      window.clearTimeout(timer);
    }
  }

  let submitInFlight = null;

  async function studentRpc(name, args = {}) {
    if (name === config.rpc.submit) {
      const signature = JSON.stringify([name, args]);
      if (submitInFlight?.signature === signature) return submitInFlight.promise;
      const promise = postRpc(name, args, SUBMIT_TIMEOUT_MS).finally(() => {
        if (submitInFlight?.promise === promise) submitInFlight = null;
      });
      submitInFlight = { signature, promise };
      return promise;
    }

    if (name === config.rpc.resume) {
      let last = null;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        last = await postRpc(name, args, RESUME_TIMEOUT_MS);
        if (!last.error) return last;
        const status = Number(last.error?.status || 0);
        const retryable = !status || status === 408 || status === 425 || status === 429 || status >= 500;
        if (!retryable || attempt === 1) return last;
        await sleep(250 + Math.floor(Math.random() * 200));
      }
      return last || { data: null, error: new Error('Workshop progress request failed.') };
    }

    return postRpc(name, args, SUBMIT_TIMEOUT_MS);
  }

  if (!masterPreview) {
    window.supabase = Object.freeze({
      createClient() {
        return Object.freeze({ rpc: studentRpc });
      }
    });
  }

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
    transport: masterPreview ? 'master-preview-v33' : 'bounded-native-fetch',
    resumeTimeoutMs: masterPreview ? null : RESUME_TIMEOUT_MS,
    resumeAttempts: masterPreview ? null : 2,
    submitTimeoutMs: masterPreview ? null : SUBMIT_TIMEOUT_MS,
    submitRetries: 0,
    duplicateSubmitCoalescing: true,
    classroomCsvMountedAfterRuntimeLoad: true
  });
})();
