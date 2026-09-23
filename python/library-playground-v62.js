(() => {
  'use strict';

  const VERSION = 'v62';
  const params = new URLSearchParams(location.search);
  if ((params.get('topic') || 'operations') !== 'logic') return;

  const PYODIDE_INDEX = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
  const examples = {
    math: {
      label: 'math',
      kind: 'Python standard library',
      package: null,
      code: 'import math\n\nradius = 6\narea = math.pi * radius ** 2\nprint(round(area, 2))',
      visualCode: 'import math\nimport matplotlib.pyplot as plt\n\nx = [i * 0.1 for i in range(63)]\ny = [math.sin(value) for value in x]\n\nplt.figure(figsize=(7, 3.6))\nplt.plot(x, y, marker="o", markevery=8)\nplt.axhline(0, linewidth=1)\nplt.title("math.sin(x)")\nplt.xlabel("x (radians)")\nplt.ylabel("sin(x)")\nplt.grid(alpha=0.25)\nplt.show()',
      note: 'math is part of Python. Use the normal example for calculations, or the plot example to turn math functions into a visual pattern.'
    },
    statistics: {
      label: 'statistics',
      kind: 'Python standard library',
      package: null,
      code: 'import statistics\n\nscores = [72, 86, 91, 84, 87]\nprint(statistics.mean(scores))\nprint(statistics.median(scores))',
      visualCode: 'import statistics\nimport matplotlib.pyplot as plt\n\nscores = [72, 86, 91, 84, 87, 95, 78, 88, 90]\nmean_score = statistics.mean(scores)\nmedian_score = statistics.median(scores)\n\nplt.figure(figsize=(7, 3.6))\nplt.hist(scores, bins=[70, 75, 80, 85, 90, 95, 100], edgecolor="black")\nplt.axvline(mean_score, linestyle="--", label=f"mean = {mean_score:.1f}")\nplt.axvline(median_score, linestyle=":", label=f"median = {median_score:.1f}")\nplt.title("Distribution of scores")\nplt.xlabel("score")\nplt.ylabel("frequency")\nplt.legend()\nplt.show()',
      note: 'statistics provides descriptive statistics for ordinary Python data. The visual example connects mean and median to a real score distribution.'
    },
    numpy: {
      label: 'NumPy',
      kind: 'External scientific library',
      package: 'numpy',
      code: 'import numpy as np\n\nvalues = np.array([10, 12, 15, 18, 20])\nprint(values.mean())\nprint(values.std().round(2))',
      visualCode: 'import numpy as np\nimport matplotlib.pyplot as plt\n\nx = np.linspace(0, 12, 240)\ny = np.sin(x) * np.exp(-0.08 * x)\n\nplt.figure(figsize=(7, 3.6))\nplt.plot(x, y)\nplt.fill_between(x, y, 0, alpha=0.15)\nplt.title("NumPy-generated damped signal")\nplt.xlabel("x")\nplt.ylabel("amplitude")\nplt.grid(alpha=0.25)\nplt.show()',
      note: 'NumPy is a real scientific package. Its arrays can generate hundreds of values efficiently, which becomes much easier to understand when the result is plotted.'
    },
    pandas: {
      label: 'Pandas',
      kind: 'External data-analysis library',
      package: 'pandas',
      code: 'import pandas as pd\n\ndata = {"student": ["A", "B", "C"], "score": [72, 86, 91]}\ndf = pd.DataFrame(data)\nprint(df)\nprint("Mean:", round(df["score"].mean(), 2))',
      visualCode: 'import pandas as pd\nimport matplotlib.pyplot as plt\n\ndata = {\n    "student": ["A", "B", "C", "D", "E"],\n    "score": [72, 86, 91, 78, 94]\n}\ndf = pd.DataFrame(data)\n\nax = df.plot(kind="bar", x="student", y="score", legend=False, figsize=(7, 3.6))\nax.axhline(df["score"].mean(), linestyle="--", label="class mean")\nax.set_title("Pandas DataFrame → chart")\nax.set_xlabel("student")\nax.set_ylabel("score")\nax.legend()\nplt.tight_layout()\nplt.show()',
      note: 'Pandas creates real DataFrames. The plot example shows how a table can move directly into a chart without manually copying values.'
    },
    matplotlib: {
      label: 'Matplotlib',
      kind: 'Visualization library',
      package: 'matplotlib',
      code: 'import matplotlib.pyplot as plt\n\nmonths = ["Jan", "Feb", "Mar", "Apr", "May"]\nvisits = [120, 145, 138, 170, 190]\n\nplt.figure(figsize=(7, 3.6))\nplt.plot(months, visits, marker="o")\nplt.title("Monthly visits")\nplt.xlabel("month")\nplt.ylabel("visits")\nplt.grid(alpha=0.25)\nplt.show()',
      visualCode: null,
      note: 'Matplotlib is a dedicated visualization library. This example creates a real Python figure in the browser and renders it below the code output.'
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
      return '<button type="button" class="lp62-library-button' + (index === 0 ? ' active' : '') + '" data-library="' + esc(key) + '">' +
        '<span>' + esc(item.kind) + '</span><strong>' + esc(item.label) + '</strong><small>' +
        (item.package ? 'real package download' : 'included with Python') + '</small></button>';
    }).join('');

    return '<section id="libraryPlaygroundV62" class="lp62-shell" aria-labelledby="lp62Title">' +
      '<div class="section-heading lp62-heading"><p class="eyebrow">LIVE LIBRARY PLAYGROUND · REAL PYTHON + REAL PLOTS</p>' +
      '<h2 id="lp62Title">Import a library, run code, and turn data into a visual result.</h2>' +
      '<p>The original calculation examples remain available. Plot examples add a second layer: Python generates a real Matplotlib figure in the browser and the page renders the resulting PNG.</p></div>' +
      '<div class="lp62-grid"><aside class="lp62-library-list" aria-label="Choose a Python library">' + buttons + '</aside>' +
      '<div class="lp62-workspace">' +
      '<div class="lp62-runtime-row"><div><span class="lp62-status-dot"></span><strong id="lp62RuntimeStatus">Python runtime not started</strong>' +
      '<small id="lp62PackageStatus">Choose a library, then run the code.</small></div><button id="lp62LoadButton" class="button button-light" type="button">Load library</button></div>' +
      '<div class="lp62-explainer"><span id="lp62LibraryKind"></span><strong id="lp62LibraryName"></strong><p id="lp62LibraryNote"></p></div>' +
      '<div class="lp62-cell"><div class="lp62-cell-head"><span>Python code cell</span><small>Shift + Enter to run</small></div>' +
      '<textarea id="lp62Editor" spellcheck="false" aria-label="Editable Python code"></textarea>' +
      '<div class="lp62-cell-actions"><button id="lp62RunButton" class="button button-dark" type="button">Run real Python</button>' +
      '<button id="lp62PlotButton" class="button button-light" type="button">Try plot example</button>' +
      '<button id="lp62ResetButton" class="button button-light" type="button">Reset example</button></div></div>' +
      '<div class="lp62-output" aria-live="polite"><div class="lp62-output-head"><span>Python output</span><small id="lp62ExecutionLabel">not run yet</small></div>' +
      '<pre id="lp62Output">Run the cell to see the real Python result.</pre></div>' +
      '<figure id="lp62FigurePanel" class="lp62-figure" hidden><div class="lp62-figure-head"><div><span>PYTHON FIGURE</span><strong id="lp62FigureTitle">Rendered plot</strong></div><small>Generated by Matplotlib in this browser session</small></div>' +
      '<div class="lp62-figure-stage"><img id="lp62Figure" alt="Plot generated by the Python code in the library playground"></div>' +
      '<figcaption>Change the Python values or plotting commands and run again to regenerate the figure.</figcaption></figure>' +
      '<div class="lp62-proof"><strong>What makes this real?</strong><span>Pyodide runs Python locally. Matplotlib draws the figure, Python saves that figure to PNG bytes, and the page displays those bytes. No chart values are hard-coded in JavaScript.</span></div>' +
      '</div></div></section>';
  }

  function setStatus(mode, title, detail) {
    const shell = $('libraryPlaygroundV62');
    if (shell) shell.dataset.runtime = mode;
    if ($('lp62RuntimeStatus')) $('lp62RuntimeStatus').textContent = title;
    if ($('lp62PackageStatus')) $('lp62PackageStatus').textContent = detail;
  }

  async function ensureLoader() {
    if (typeof window.loadPyodide === 'function') return;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = PYODIDE_INDEX + 'pyodide.js';
      script.async = true;
      script.dataset.lp62Pyodide = '1';
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

  async function loadPackage(runtime, packageName, label) {
    if (!packageName || loadedPackages.has(packageName)) return;
    setStatus('loading', 'Loading ' + label + '…', 'Downloading the real ' + packageName + ' package.');
    await runtime.loadPackage(packageName);
    loadedPackages.add(packageName);
  }

  async function prepareLibrary(key, includePlotting = false) {
    const item = examples[key];
    const runtime = await ensureRuntime();

    if (item.package) await loadPackage(runtime, item.package, item.label);
    if (includePlotting && item.package !== 'matplotlib') {
      await loadPackage(runtime, 'matplotlib', 'Matplotlib');
    }

    const probe = item.package === 'numpy'
      ? 'import numpy as _lp_lib; print(_lp_lib.__version__)'
      : item.package === 'pandas'
        ? 'import pandas as _lp_lib; print(_lp_lib.__version__)'
        : item.package === 'matplotlib'
          ? 'import matplotlib as _lp_lib; print(_lp_lib.__version__)'
          : 'import ' + key + ' as _lp_lib; print(getattr(_lp_lib, "__name__", "' + key + '"))';

    const stdout = [];
    runtime.setStdout({ batched: text => stdout.push(text) });
    await runtime.runPythonAsync(probe);
    const version = stdout.join('\n').trim();
    const packageSummary = item.package
      ? item.package + ' ' + (version || 'ready') + ' · real package'
      : item.label + ' · Python standard library';
    setStatus('ready', item.label + ' loaded', includePlotting && item.package !== 'matplotlib'
      ? packageSummary + ' · Matplotlib ready for plots'
      : packageSummary);
    return runtime;
  }

  function clearFigure() {
    const panel = $('lp62FigurePanel');
    const image = $('lp62Figure');
    if (panel) panel.hidden = true;
    if (image) image.removeAttribute('src');
  }

  async function captureFigure(runtime) {
    const python = [
      'import sys',
      '_lp62_plot_png = ""',
      'if "matplotlib.pyplot" in sys.modules:',
      '    import io',
      '    import base64',
      '    import matplotlib.pyplot as plt',
      '    if plt.get_fignums():',
      '        _lp62_buffer = io.BytesIO()',
      '        plt.gcf().savefig(_lp62_buffer, format="png", dpi=135, bbox_inches="tight")',
      '        _lp62_buffer.seek(0)',
      '        _lp62_plot_png = base64.b64encode(_lp62_buffer.read()).decode("ascii")',
      '        _lp62_buffer.close()',
      '        plt.close("all")',
      '_lp62_plot_png'
    ].join('\n');

    const result = await runtime.runPythonAsync(python);
    try {
      const encoded = String(result || '');
      if (!encoded) return false;
      $('lp62Figure').src = 'data:image/png;base64,' + encoded;
      $('lp62FigureTitle').textContent = examples[selected].label + ' plot';
      $('lp62FigurePanel').hidden = false;
      return true;
    } finally {
      if (result && typeof result.destroy === 'function') result.destroy();
    }
  }

  async function runCode(options = {}) {
    const visual = Boolean(options.visual);
    if (visual && examples[selected].visualCode) {
      $('lp62Editor').value = examples[selected].visualCode;
    }

    const code = $('lp62Editor').value || '';
    if (!code.trim()) {
      $('lp62Output').textContent = 'Write or reset some Python code before running.';
      return;
    }

    $('lp62RunButton').disabled = true;
    $('lp62PlotButton').disabled = true;
    $('lp62RunButton').textContent = 'Running…';
    $('lp62Output').classList.remove('error');
    $('lp62Output').textContent = visual
      ? 'Loading plotting tools and running the visual Python example…'
      : 'Starting Python and importing the selected library…';
    clearFigure();

    try {
      const runtime = await prepareLibrary(selected, visual || selected === 'matplotlib');
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
        $('lp62Output').classList.add('error');
        $('lp62Output').textContent = stderr.join('\n').trim();
        $('lp62ExecutionLabel').textContent = 'Python error · edit and run again';
      } else {
        const hasFigure = await captureFigure(runtime);
        $('lp62Output').textContent = stdout.join('\n').trim() ||
          (hasFigure ? 'Python executed successfully. The generated figure appears below.' : 'Cell executed successfully with no printed output.');
        $('lp62ExecutionLabel').textContent = hasFigure ? 'real execution + plot completed' : 'real execution completed';
      }
    } catch (error) {
      $('lp62Output').classList.add('error');
      $('lp62Output').textContent = 'Runtime error: ' + error.message;
      $('lp62ExecutionLabel').textContent = 'runtime error';
    } finally {
      $('lp62RunButton').disabled = false;
      $('lp62PlotButton').disabled = !examples[selected].visualCode;
      $('lp62RunButton').textContent = 'Run real Python';
    }
  }

  function choose(key) {
    if (!examples[key]) return;
    selected = key;
    const item = examples[key];
    document.querySelectorAll('.lp62-library-button').forEach(button => {
      button.classList.toggle('active', button.dataset.library === key);
    });
    $('lp62LibraryKind').textContent = item.kind;
    $('lp62LibraryName').textContent = item.label;
    $('lp62LibraryNote').textContent = item.note;
    $('lp62Editor').value = item.code;
    $('lp62Output').classList.remove('error');
    $('lp62Output').textContent = 'Run the cell to see the real Python result.';
    $('lp62ExecutionLabel').textContent = 'not run yet';
    $('lp62PlotButton').disabled = !item.visualCode;
    $('lp62PlotButton').textContent = item.visualCode ? 'Try plot example' : 'Plot is the main example';
    clearFigure();

    const packageReady = item.package && loadedPackages.has(item.package);
    setStatus(pyodide ? 'ready' : 'idle', pyodide ? 'Python ready' : 'Python runtime not started',
      item.package ? (packageReady ? item.package + ' is loaded in this tab.' : 'This package will be downloaded when you load or run it.') :
        'This module is included with Python and imports directly.');
  }

  function install() {
    if ($('libraryPlaygroundV62')) return true;
    const parent = $('librariesPandasTheoryV60');
    const applications = parent && parent.querySelector('.p60-applications');
    if (!parent || !applications) return false;

    applications.insertAdjacentHTML('afterend', panelHtml());

    document.querySelectorAll('.lp62-library-button').forEach(button => {
      button.addEventListener('click', () => choose(button.dataset.library));
    });

    $('lp62LoadButton').addEventListener('click', async () => {
      const button = $('lp62LoadButton');
      button.disabled = true;
      button.textContent = 'Loading…';
      try {
        await prepareLibrary(selected, selected === 'matplotlib');
      } catch (error) {
        $('lp62Output').classList.add('error');
        $('lp62Output').textContent = 'Library load error: ' + error.message;
      } finally {
        button.disabled = false;
        button.textContent = 'Load library';
      }
    });

    $('lp62RunButton').addEventListener('click', () => runCode());
    $('lp62PlotButton').addEventListener('click', () => runCode({ visual:true }));
    $('lp62ResetButton').addEventListener('click', () => choose(selected));
    $('lp62Editor').addEventListener('keydown', event => {
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