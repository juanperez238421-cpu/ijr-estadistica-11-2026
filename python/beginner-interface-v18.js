(() => {
  'use strict';

  const requested = new URLSearchParams(location.search).get('topic') || 'operations';
  if (requested !== 'operations') return;

  const PYODIDE_INDEX = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
  let runtimePromise = null;

  const demos = [
    {
      key: 'print', name: 'print()', label: 'SHOW A RESULT',
      purpose: 'Use print(...) when you want a value, message or calculated result to appear in the output area.',
      situation: 'You calculated a result and want the student or analyst to see it.',
      code: 'score = 25\nprint(score)', expected: '25'
    },
    {
      key: 'type', name: 'type()', label: 'INSPECT DATA',
      purpose: 'Use type(...) to ask Python what kind of value it is currently storing.',
      situation: 'You are not sure whether a value is an integer, decimal, text or another type.',
      code: 'value = 4.5\nprint(type(value))', expected: "<class 'float'>"
    },
    {
      key: 'len', name: 'len()', label: 'COUNT ITEMS',
      purpose: 'Use len(...) to count how many elements are inside a list, string or another collection.',
      situation: 'You have several observations and need to know how many data values there are.',
      code: 'values = [4, 8, 12]\nprint(len(values))', expected: '3'
    },
    {
      key: 'int', name: 'int()', label: 'CONVERT TO INTEGER',
      purpose: 'Use int(...) to convert a compatible value into a whole-number integer.',
      situation: 'A number arrived as text and you need to use it in arithmetic.',
      code: 'text = "12"\nnumber = int(text)\nprint(number + 3)', expected: '15'
    },
    {
      key: 'float', name: 'float()', label: 'CONVERT TO DECIMAL',
      purpose: 'Use float(...) to convert a compatible value into a decimal number.',
      situation: 'A decimal value arrived as text and must become numeric before calculations.',
      code: 'text = "4.5"\nnumber = float(text)\nprint(number * 2)', expected: '9.0'
    },
    {
      key: 'str', name: 'str()', label: 'CONVERT TO TEXT',
      purpose: 'Use str(...) to convert a value into text so it can be combined with words or labels.',
      situation: 'You want to place a number inside a readable message.',
      code: 'year = 2026\nlabel = "Year: " + str(year)\nprint(label)', expected: 'Year: 2026'
    },
    {
      key: 'bool', name: 'bool()', label: 'TRUE OR FALSE',
      purpose: 'Use bool(...) to convert or interpret a value as True or False using Python truth rules.',
      situation: 'You need a yes/no logical value before working with conditions.',
      code: 'print(bool(1))\nprint(bool(0))', expected: 'True\nFalse'
    },
    {
      key: 'round', name: 'round()', label: 'ROUND A NUMBER',
      purpose: 'Use round(number, digits) to control how many decimal places are shown in a numeric result.',
      situation: 'A calculation produces many decimal places but the report only needs two.',
      code: 'mean = 3.14159\nprint(round(mean, 2))', expected: '3.14'
    },
    {
      key: 'sum', name: 'sum()', label: 'ADD MANY VALUES',
      purpose: 'Use sum(...) to add all numeric values in a list.',
      situation: 'You have a dataset and need its total before calculating a mean or another summary.',
      code: 'values = [4, 8, 12]\nprint(sum(values))', expected: '24'
    },
    {
      key: 'min', name: 'min()', label: 'SMALLEST VALUE',
      purpose: 'Use min(...) to find the smallest value in a collection.',
      situation: 'You need the minimum observation in a dataset.',
      code: 'values = [8, 4, 21, 13]\nprint(min(values))', expected: '4'
    },
    {
      key: 'max', name: 'max()', label: 'LARGEST VALUE',
      purpose: 'Use max(...) to find the largest value in a collection.',
      situation: 'You need the maximum observation in a dataset.',
      code: 'values = [8, 4, 21, 13]\nprint(max(values))', expected: '21'
    },
    {
      key: 'input', name: 'input()', label: 'ASK THE USER',
      purpose: 'Standard Python uses input(...) to pause and ask a user to type information.',
      situation: 'A normal Python program needs a value that is not known until the user enters it.',
      code: 'name = input("What is your name? ")\nprint(name)', expected: '', contextOnly: true
    }
  ];

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function demoHtml(item, index) {
    const lines = item.code.split('\n').map((line, i) => `<span><b>${i + 1}</b>${escapeHtml(line)}</span>`).join('');
    const controls = item.contextOnly
      ? `<button type="button" class="function-run-v18 is-disabled" disabled aria-disabled="true">Context only</button>`
      : `<button type="button" class="function-run-v18" data-run-function="${item.key}"><span>▶</span> Run example</button>`;
    const output = item.contextOnly
      ? `<div class="function-output-v18 is-context"><small>NOTE</small><pre>This course introduces input() as standard Python context. The browser workshop does not require interactive stdin.</pre></div>`
      : `<div class="function-output-v18" id="functionOutput-${item.key}"><small>OUTPUT</small><pre>Press ▶ Run example</pre></div>`;

    return `
      <article class="function-lesson-v18" id="function-${item.key}">
        <div class="function-copy-v18">
          <div class="function-number-v18">${String(index + 1).padStart(2, '0')}</div>
          <div>
            <p class="eyebrow">${escapeHtml(item.label)}</p>
            <h3><code>${escapeHtml(item.name)}</code></h3>
            <p>${escapeHtml(item.purpose)}</p>
            <div class="function-when-v18"><strong>Use it when</strong><span>${escapeHtml(item.situation)}</span></div>
          </div>
        </div>
        <div class="mini-colab-v18" aria-label="Real Python interface example for ${escapeHtml(item.name)}">
          <div class="mini-colab-top-v18">
            <div><span class="colab-dot-v18"></span><strong>Python 3 · browser runtime</strong></div>
            ${controls}
          </div>
          <div class="mini-colab-cell-v18">
            <div class="mini-colab-gutter-v18"><span>▶</span><small>[ ]</small></div>
            <div class="mini-colab-code-v18"><div class="mini-colab-code-head-v18">Code cell</div><pre>${lines}</pre></div>
          </div>
          ${output}
        </div>
      </article>`;
  }

  async function ensureRuntime() {
    if (runtimePromise) return runtimePromise;
    const status = document.getElementById('functionRuntimeStatusV18');
    if (status) status.textContent = 'Loading Python runtime…';
    runtimePromise = (async () => {
      if (typeof window.loadPyodide !== 'function') throw new Error('Python runtime script did not load. Refresh the page and try again.');
      const runtime = await window.loadPyodide({indexURL: PYODIDE_INDEX});
      if (status) status.textContent = 'Python ready · examples execute in your browser';
      return runtime;
    })().catch(error => {
      runtimePromise = null;
      if (status) status.textContent = 'Python runtime unavailable · try a hard refresh';
      throw error;
    });
    return runtimePromise;
  }

  async function runDemo(key, button) {
    const item = demos.find(demo => demo.key === key && !demo.contextOnly);
    const output = document.getElementById(`functionOutput-${key}`);
    if (!item || !output) return;

    const pre = output.querySelector('pre');
    const old = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span>…</span> Running Python';
    output.classList.remove('is-error', 'is-success');
    pre.textContent = 'Starting Python…';

    try {
      const runtime = await ensureRuntime();
      const stdout = [];
      const stderr = [];
      runtime.setStdout({batched: text => stdout.push(String(text))});
      runtime.setStderr({batched: text => stderr.push(String(text))});
      await runtime.runPythonAsync(item.code);
      const text = stderr.length ? stderr.join('\n') : stdout.join('\n');
      pre.textContent = text || '(no visible output)';
      output.classList.toggle('is-error', stderr.length > 0);
      output.classList.toggle('is-success', stderr.length === 0);
      const gutter = document.querySelector(`#function-${key} .mini-colab-gutter-v18 small`);
      if (gutter) gutter.textContent = '[1]';
    } catch (error) {
      pre.textContent = String(error?.message || error);
      output.classList.add('is-error');
    } finally {
      button.disabled = false;
      button.innerHTML = old;
    }
  }

  function install() {
    const oldSection = document.getElementById('beginnerBasicsV17');
    if (!oldSection || oldSection.dataset.v18 === 'true') return false;
    if (!document.getElementById('theoryApp') || document.getElementById('theoryApp').classList.contains('hidden')) return false;

    oldSection.dataset.v18 = 'true';
    oldSection.className = 'beginner-interface-v18';
    oldSection.innerHTML = `
      <div class="section-heading function-heading-v18">
        <p class="eyebrow">BEGINNER PYTHON · REAL INTERFACE</p>
        <h2>See each function where you actually use it</h2>
        <p>Do not learn functions as isolated vocabulary. Each example below is shown inside a Colab-style Python cell with its output area. Press <strong>▶ Run example</strong>: the code is executed by the same browser Python technology used in the workshop.</p>
        <div class="function-runtime-status-v18"><span class="runtime-led-v18"></span><strong id="functionRuntimeStatusV18">Python will load when you run the first example</strong></div>
      </div>
      <div class="function-anatomy-v18">
        <div><small>FUNCTION</small><code>print</code></div>
        <b>(</b>
        <div><small>ARGUMENT</small><code>17 + 8</code></div>
        <b>)</b>
        <span>→</span>
        <div><small>OUTPUT</small><code>25</code></div>
      </div>
      <div class="function-lessons-v18">${demos.map(demoHtml).join('')}</div>
      <div class="function-reading-rule-v18">
        <strong>One rule that will save you time: read nested functions from the inside out.</strong>
        <div><code>print(len(values))</code><span>① Python calculates <code>len(values)</code> → ② that result is passed into <code>print(...)</code> → ③ the output is displayed.</span></div>
      </div>`;

    oldSection.addEventListener('click', event => {
      const button = event.target.closest('[data-run-function]');
      if (!button) return;
      runDemo(button.dataset.runFunction, button);
    });
    return true;
  }

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      install();
    });
  };

  new MutationObserver(schedule).observe(document.documentElement, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
  window.addEventListener('load', schedule, {once:true});
  schedule();
})();