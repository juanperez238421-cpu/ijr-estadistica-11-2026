(() => {
  'use strict';

  const VERSION = '0.27.7';
  const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${VERSION}/full/`;
  const SCRIPT_URL = `${INDEX_URL}pyodide.js`;
  const runtimeState = {
    runtime: null,
    promise: null,
    phase: 'idle',
    detail: 'Python runtime not started.'
  };

  function setPhase(phase, detail, onStatus) {
    runtimeState.phase = phase;
    runtimeState.detail = detail;
    if (typeof onStatus === 'function') onStatus({ phase, detail });
  }

  function waitForScript(script) {
    return new Promise((resolve, reject) => {
      if (typeof window.loadPyodide === 'function') {
        resolve();
        return;
      }
      const done = () => typeof window.loadPyodide === 'function'
        ? resolve()
        : reject(new Error('Pyodide script loaded, but loadPyodide() is unavailable.'));
      script.addEventListener('load', done, { once: true });
      script.addEventListener('error', () => reject(new Error('Could not download the Python runtime. Check the network and try Run again.')), { once: true });
    });
  }

  async function ensureLoader(onStatus) {
    if (typeof window.loadPyodide === 'function') return;

    setPhase('downloading', 'Downloading Python runtime…', onStatus);
    let script = document.querySelector('script[data-ijr-pyodide-runtime="v10"]');
    if (!script) {
      script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.dataset.ijrPyodideRuntime = 'v10';
      document.head.appendChild(script);
    }
    await waitForScript(script);
  }

  async function prepare(onStatus) {
    if (runtimeState.runtime) {
      setPhase('ready', 'Python ready', onStatus);
      return runtimeState.runtime;
    }
    if (runtimeState.promise) return runtimeState.promise;

    runtimeState.promise = (async () => {
      try {
        await ensureLoader(onStatus);
        setPhase('initializing', 'Starting Python runtime…', onStatus);
        const runtime = await window.loadPyodide({ indexURL: INDEX_URL });

        setPhase('checking', 'Checking Python runtime…', onStatus);
        const probe = runtime.runPython('20 + 22');
        if (Number(probe) !== 42) throw new Error('Python runtime self-check returned an unexpected result.');

        runtimeState.runtime = runtime;
        setPhase('ready', 'Python ready', onStatus);
        return runtime;
      } catch (error) {
        runtimeState.runtime = null;
        runtimeState.promise = null;
        setPhase('error', error?.message || 'Python runtime failed to start.', onStatus);
        throw error;
      }
    })();

    return runtimeState.promise;
  }

  function resultToText(result) {
    if (result === undefined || result === null) return '';
    try {
      if (typeof result === 'string') return result;
      if (typeof result.toString === 'function') return result.toString();
      return String(result);
    } finally {
      if (result && typeof result.destroy === 'function') result.destroy();
    }
  }

  async function run(code, options = {}) {
    const source = String(code ?? '');
    if (!source.trim()) throw new Error('The Python cell is empty. Write your solution before pressing Run.');

    const onStatus = options.onStatus;
    const runtime = await prepare(onStatus);
    const stdout = [];
    const stderr = [];

    runtime.setStdout({ batched: text => stdout.push(String(text)) });
    runtime.setStderr({ batched: text => stderr.push(String(text)) });
    setPhase('running', 'Running cell…', onStatus);

    try {
      const result = await runtime.runPythonAsync(source);
      const expressionOutput = resultToText(result);
      if (stderr.length) throw new Error(stderr.join('\n'));

      const chunks = [];
      const printed = stdout.join('\n').replace(/\s+$/, '');
      if (printed) chunks.push(printed);
      if (expressionOutput) chunks.push(expressionOutput);

      setPhase('ready', 'Python ready', onStatus);
      return {
        output: chunks.join('\n').replace(/\s+$/, ''),
        printedOutput: printed,
        expressionOutput
      };
    } catch (error) {
      const message = stderr.length ? stderr.join('\n') : (error?.message || String(error));
      setPhase('error', 'Python error', onStatus);
      throw new Error(message);
    }
  }

  function getStatus() {
    return {
      version: VERSION,
      indexURL: INDEX_URL,
      phase: runtimeState.phase,
      detail: runtimeState.detail,
      ready: Boolean(runtimeState.runtime)
    };
  }

  window.IJR_PYODIDE_RUNTIME = Object.freeze({
    version: VERSION,
    indexURL: INDEX_URL,
    prepare,
    run,
    getStatus
  });
})();
