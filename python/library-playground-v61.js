(() => {
  'use strict';

  const VERSION = 'v61';
  const params = new URLSearchParams(location.search);
  if ((params.get('topic') || 'operations') !== 'logic') return;

  const PYODIDE_INDEX = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
  const examples = {
    math: {
      label: 'math',
      kind: 'Python standard library',
      package: null,
      code: 'import math\n\nradius = 6\narea = math.pi * radius ** 2\nprint(round(area, 2))',
      note: 'math is part of Python. Import it to use constants and functions such as pi, sqrt, sin and cos.'
    },
    statistics: {
      label: 'statistics',
      kind: 'Python standard library',
      package: null,
      code: 'import statistics\n\nscores = [72, 86, 91, 84, 87]\nprint(statistics.mean(scores))\nprint(statistics.median(scores))',
      note: 'statistics is part of Python and provides ready-made descriptive statistics for ordinary Python data.'
    },
    numpy: {
      label: 'NumPy',
      kind: 'External scientific library',
      package: 'numpy',
      code: 'import numpy as np\n\nvalues = np.array([10, 12, 15, 18, 20])\nprint(values.mean())\nprint(values.std().round(2))',
      note: 'NumPy is an external scientific package. The browser downloads the real package before Python imports it.'
    },
    pandas: {
      label: 'Pandas',
      kind: 'External data-analysis library',
      package: 'pandas',
      code: 'import pandas as pd\n\ndata = {"student": ["A", "B", "C"], "score": [72, 86, 91]}\ndf = pd.DataFrame(data)\nprint(df)\nprint("Mean:", round(df["score"].mean(), 2))',
      note: 'Pandas is an external data-analysis package. This creates a real DataFrame and calculates from it in the browser.'
    }
  };

  let pyodide = null;
  let runtimePromise = null;
  let selected = 'math';
  const loadedPackages = new Set();

  const $ = id => document.getElementById(id);
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));

  function panelHtml() {
    const buttons = Object.keys(examples).map((key, index) => {
      const item = examples[key];
      return '<button type="button" class="lp61-library-button' + (index === 0 ? ' active' : '') + '" data-library="' + esc(key) + '">' +
        '<span>' + esc(item.kind) + '</span><strong>' + esc(item.label) + '</strong><small>' +
        (item.package ? 'real package download' : 'included with Python') + '</small></button>';
    }).join('');

    return '<section id="libraryPlaygroundV61" class="lp61-shell" aria-labelledby="lp61Title">' +
      '<div class="section-heading lp61-heading"><p class="eyebrow">LIVE LIBRARY PLAYGROUND · REAL PYTHON</p>' +
      '<h2 id="lp61Title">Import a real library, change the code, and run it.</h2>' +
      '<p>This is not simulated output. The page starts a Python runtime in the browser. NumPy and Pandas are downloaded as real packages when needed.</p></div>' +
      '<div class="lp61-grid"><aside class="lp61-library-list" aria-label="Choose a Python library">' + buttons + '</aside>' +
      '<div class="lp61-workspace">' +
      '<div class="lp61-runtime-row"><div><span class="lp61-status-dot"></span><strong id="lp61RuntimeStatus">Python runtime not started</strong>' +
      '<small id="lp61PackageStatus">Choose a library, then run the code.</small></div><button id="lp61LoadButton" class="button button-light" type="button">Load library</button></div>' +
      '<div class="lp61-explainer"><span id="lp61LibraryKind"></span><strong id="lp61LibraryName"></strong><p id="lp61LibraryNote"></p></div>' +
      '<div class="lp61-cell"><div class="lp61-cell-head"><span>Python code cell</span><small>Shift + Enter to run</small></div>' +
      '<textarea id="lp61Editor" spellcheck="false" aria-label="Editable Python code"></textarea>' +
      '<div class="lp61-cell-actions"><button id="lp61RunButton" class="button button-dark" type="button">Run real Python</button>' +
      '<button id="lp61ResetButton" class="button button-light" type="button">Reset example</button></div></div>' +
      '<div class="lp61-output" aria-live="polite"><div class="lp61-output-head"><span>Python output</span><small id="lp61ExecutionLabel">not run yet</small></div>' +
      '<pre id="lp61Output">Run the cell to see the real Python result.</pre></div>' +
      '<div class="lp61-proof"><strong>What makes this real?</strong><span>Pyodide runs a CPython-compatible WebAssembly runtime locally. Imports and calculations happen in the student browser.</span></div>' +
      '</div></div></section>';
  }

  function setStatus(mode, title, detail) {
    const shell = $('libraryPlaygroundV61');
    if (shell) shell.dataset.runtime = mode;
    if ($('lp61RuntimeStatus')) $('lp61RuntimeStatus').textContent = title;
    if ($('lp61PackageStatus')) $('lp61PackageStatus').textContent = detail;
  }

  async function ensureLoader() {
    if (typeof window.loadPyodide === 'function') return;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = PYODIDE_INDEX + 'pyodide.js';
      script.async = true;
      script.dataset.lp61Pyodide = '1';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Pyodide loader failed to load.'));
      document.head.appendChild(script);
    });
  }

  async function ensureRuntime() {
    if (pyodide) return pyodide;
    if (!runtimePromise) {
      runtimePromise = (async () => {
        setStatus('loading', 'Starting Python…', 'Downloading the browser runtime once for this tab.');
        await ensureLoader();
        if (typeof window.loadPyodide !== 'function') throw new Error('Pyodide is unavailable.');
        pyodide = await window.loadPyodide({ indexURL: PYODIDE_INDEX });
        setStatus('ready', 'Python ready', 'The runtime is active in this browser tab.');
        return pyodide;
      })().catch(error => {
        runtimePromise = null;
        setStatus('error', 'Python could not start', error.message);
        throw error;
      });
    }
    return runtimePromise;
  }

  async function prepareLibrary(key) {
    const item = examples[key];
    const runtime = await ensureRuntime();
    if (item.package && !loadedPackages.has(item.package)) {
      setStatus('loading', 'Loading ' + item.label + '…', 'Downloading the real ' + item.package + ' package.');
      await runtime.loadPackage(item.package);
      loadedPackages.add(item.package);
    }

    const probe = item.package === 'numpy'
      ? 'import numpy as _lp_lib; print(_lp_lib.__version__)'
      : item.package === 'pandas'
        ? 'import pandas as _lp_lib; print(_lp_lib.__version__)'
        : 'import ' + key + ' as _lp_lib; print(getattr(_lp_lib, "__name__", "' + key + '"))';

    const stdout = [];
    runtime.setStdout({ batched: text => stdout.push(text) });
    await runtime.runPythonAsync(probe);
    const version = stdout.join('\n').trim();
    setStatus('ready', item.label + ' loaded',
      item.package ? item.package + ' ' + (version || 'ready') + ' · real package' : item.label + ' · Python standard library');
    return runtime;
  }

  async function runCode() {
    const code = $('lp61Editor').value || '';
    if (!code.trim()) {
      $('lp61Output').textContent = 'Write or reset some Python code before running.';
      return;
    }

    $('lp61RunButton').disabled = true;
    $('lp61RunButton').textContent = 'Running…';
    $('lp61Output').classList.remove('error');
    $('lp61Output').textContent = 'Starting Python and importing the selected library…';

    try {
      const runtime = await prepareLibrary(selected);
      const stdout = [];
      const stderr = [];
      runtime.setStdout({ batched: text => stdout.push(text) });
      runtime.setStderr({ batched: text => stderr.push(text) });

      try {
        const result = await runtime.runPythonAsync(code);
        if (result !== undefined && result !== null) {
          const rendered = String(result);
          if (rendered !== 'None' && !stdout.length) stdout.push(rendered);
          if (typeof result.destroy === 'function') result.destroy();
        }
      } catch (error) {
        stderr.push(String(error && error.message ? error.message : error));
      }

      if (stderr.length) {
        $('lp61Output').classList.add('error');
        $('lp61Output').textContent = stderr.join('\n').trim();
        $('lp61ExecutionLabel').textContent = 'Python error · edit and run again';
      } else {
        $('lp61Output').textContent = stdout.join('\n').trim() || 'Cell executed successfully with no printed output.';
        $('lp61ExecutionLabel').textContent = 'real execution completed';
      }
    } catch (error) {
      $('lp61Output').classList.add('error');
      $('lp61Output').textContent = 'Runtime error: ' + error.message;
      $('lp61ExecutionLabel').textContent = 'runtime error';
    } finally {
      $('lp61RunButton').disabled = false;
      $('lp61RunButton').textContent = 'Run real Python';
    }
  }

  function choose(key) {
    if (!examples[key]) return;
    selected = key;
    const item = examples[key];
    document.querySelectorAll('.lp61-library-button').forEach(button => {
      button.classList.toggle('active', button.dataset.library === key);
    });
    $('lp61LibraryKind').textContent = item.kind;
    $('lp61LibraryName').textContent = item.label;
    $('lp61LibraryNote').textContent = item.note;
    $('lp61Editor').value = item.code;
    $('lp61Output').classList.remove('error');
    $('lp61Output').textContent = 'Run the cell to see the real Python result.';
    $('lp61ExecutionLabel').textContent = 'not run yet';
    const packageReady = item.package && loadedPackages.has(item.package);
    setStatus(pyodide ? 'ready' : 'idle', pyodide ? 'Python ready' : 'Python runtime not started',
      item.package ? (packageReady ? item.package + ' is loaded in this tab.' : 'This package will be downloaded when you load or run it.') :
        'This module is included with Python and imports directly.');
  }

  function install() {
    if ($('libraryPlaygroundV61')) return true;
    const parent = $('librariesPandasTheoryV60');
    const applications = parent && parent.querySelector('.p60-applications');
    if (!parent || !applications) return false;

    applications.insertAdjacentHTML('afterend', panelHtml());

    document.querySelectorAll('.lp61-library-button').forEach(button => {
      button.addEventListener('click', () => choose(button.dataset.library));
    });
    $('lp61LoadButton').addEventListener('click', async () => {
      const button = $('lp61LoadButton');
      button.disabled = true;
      button.textContent = 'Loading…';
      try {
        await prepareLibrary(selected);
      } catch (error) {
        $('lp61Output').classList.add('error');
        $('lp61Output').textContent = 'Library load error: ' + error.message;
      } finally {
        button.disabled = false;
        button.textContent = 'Load library';
      }
    });
    $('lp61RunButton').addEventListener('click', runCode);
    $('lp61ResetButton').addEventListener('click', () => choose(selected));
    $('lp61Editor').addEventListener('keydown', event => {
      if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault();
        runCode();
      }
    });
    choose(selected);
    document.documentElement.dataset.libraryPlayground = VERSION;
    return true;
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (install() || attempts > 80) window.clearInterval(timer);
  }, 100);
})();