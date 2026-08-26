(() => {
  'use strict';

  const DRAFT_KEY = 'ijr-stat11-topic01-student-drafts-v1';
  const STAGES = {
    1: {
      title: 'Build two variables and add them',
      prompt: 'Start from a completely blank Python cell. Create one variable with the value 17 and a second variable with the value 8. Create a third variable that stores the sum of the first two values. Finally, display only the final result. Do not calculate the answer mentally and type only the number: the cell must show the complete process.'
    },
    2: {
      title: 'Write one arithmetic expression',
      prompt: 'Start from a blank cell. Write one Python instruction that evaluates 2 plus 3 multiplied by 4 and displays the result. Let Python apply its normal order of operations. Do not type the final numerical answer directly.'
    },
    3: {
      title: 'Represent a power in Python',
      prompt: 'Start from a blank cell. Store the value 9 in a variable. Then write an expression that calculates the square of that variable using Python exponentiation and display the result. The purpose is to practice the operator, not to type 81 directly.'
    },
    4: {
      title: 'Represent a square root in Python',
      prompt: 'Start from a blank cell. Store the value 81 in a variable. Calculate its square root using a fractional exponent and display the result. Build the expression yourself from the theory above; no starter code is provided.'
    },
    5: {
      title: 'Recognize Python exponentiation',
      prompt: 'Choose the symbol Python uses for exponentiation. Think about the difference between mathematical notation and programming notation.'
    },
    6: {
      title: 'Choose the correct notebook workflow',
      prompt: 'Choose the workflow that best represents how a student should work in Colab: write or edit the cell, run it, inspect the output or error, correct the cell if necessary, and only then validate the activity.'
    }
  };

  const $ = (selector, root = document) => root.querySelector(selector);

  function readDrafts() {
    try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}'); }
    catch { return {}; }
  }

  function writeDraft(stage, value) {
    const drafts = readDrafts();
    drafts[String(stage)] = value;
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  }

  function currentStage() {
    const kicker = $('#stageMount .stage-kicker');
    if (!kicker) return null;
    const match = kicker.textContent.match(/Stage\s+(\d+)/i);
    return match ? Number(match[1]) : null;
  }

  function topic01IsVisible() {
    const index = $('#lessonMount .lesson-index');
    return Boolean(index && /Topic\s+01/i.test(index.textContent));
  }

  function theoryMarkup() {
    return `
      <section class="op-foundation" data-topic01-enrichment>
        <div class="op-foundation-hero">
          <div class="op-course-mark" aria-label="Python notebook learning mark">
            <svg viewBox="0 0 120 120" role="img" aria-label="Minimal Python notebook icon">
              <rect x="14" y="14" width="92" height="92" rx="22" class="mark-frame"></rect>
              <path d="M34 39h32c10 0 15 5 15 15v7H53c-10 0-16 5-16 15v8" class="mark-path"></path>
              <path d="M86 81H54c-10 0-15-5-15-15v-7h28c10 0 16-5 16-15v-8" class="mark-path second"></path>
              <circle cx="52" cy="35" r="3.5" class="mark-dot"></circle>
              <circle cx="68" cy="85" r="3.5" class="mark-dot"></circle>
            </svg>
            <div><strong>PYTHON</strong><span>NOTEBOOK LAB · TOPIC 01</span></div>
          </div>
          <div class="op-foundation-copy">
            <p class="eyebrow">FOUNDATION BEFORE WORKSHOP</p>
            <h3>What are Python and Google Colab?</h3>
            <p><strong>Python</strong> is a programming language: a formal way to write instructions that a computer can interpret and execute. <strong>Google Colab</strong> is a browser-based notebook environment where those Python instructions can be written inside cells, executed, inspected, corrected and documented.</p>
            <p>Colab is not the programming language. Python is the language; Colab is one of the interfaces in which you can work with it.</p>
          </div>
        </div>

        <div class="op-concept-grid">
          <article class="op-concept-card">
            <div class="op-card-label">01 · LANGUAGE</div>
            <h4>Python = instructions</h4>
            <p>A Python program can store data, transform it, make decisions, repeat processes and reuse procedures. Even a simple arithmetic expression is part of a larger idea: describing a reproducible process.</p>
            <div class="op-motion op-python-flow" aria-hidden="true">
              <span>instruction</span><i></i><span>Python</span><i></i><span>result</span>
            </div>
          </article>

          <article class="op-concept-card">
            <div class="op-card-label">02 · ENVIRONMENT</div>
            <h4>Colab = notebook interface</h4>
            <p>A notebook is organized into cells. A code cell contains instructions. The Run control sends the cell to the Python runtime. The output area shows a result or an error message.</p>
            <div class="op-notebook-demo" aria-hidden="true">
              <div class="op-browser-bar"><b></b><b></b><b></b><span>COLAB NOTEBOOK</span></div>
              <div class="op-cell-demo"><span class="op-run-dot">▶</span><div class="op-code-lines"><i></i><i></i><i></i></div></div>
              <div class="op-output-demo"><span>OUTPUT</span><b></b></div>
            </div>
          </article>

          <article class="op-concept-card">
            <div class="op-card-label">03 · EXECUTION</div>
            <h4>A cell is a sequence</h4>
            <p>Python reads instructions in order. A later instruction can use a value created earlier in the same cell. Running the complete cell again reproduces the process from top to bottom.</p>
            <div class="op-sequence" aria-hidden="true"><span>1</span><i></i><span>2</span><i></i><span>3</span><i></i><span>OUTPUT</span></div>
          </article>
        </div>

        <article class="op-compare-panel">
          <div class="op-section-copy">
            <p class="eyebrow">CALCULATOR VS PYTHON / COLAB</p>
            <h3>Both can calculate. Only one is designed to describe a process.</h3>
            <p>A calculator is excellent for obtaining a direct numerical result. A Python notebook is designed to preserve the instructions, names, intermediate steps and outputs so the same process can be repeated, changed and scaled to many values.</p>
          </div>
          <div class="op-compare-grid">
            <div class="op-compare-card calculator">
              <span class="op-compare-title">CALCULATOR</span>
              <div class="calc-display">14</div>
              <div class="calc-keys" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
              <ul>
                <li>Best for a direct calculation.</li>
                <li>Usually focuses on the final value.</li>
                <li>The procedure is often not preserved as a reusable program.</li>
              </ul>
            </div>
            <div class="op-vs">VS</div>
            <div class="op-compare-card notebook">
              <span class="op-compare-title">PYTHON NOTEBOOK</span>
              <div class="notebook-process" aria-hidden="true"><span>DATA</span><i></i><span>INSTRUCTIONS</span><i></i><span>OUTPUT</span></div>
              <ul>
                <li>Stores named values and a sequence of instructions.</li>
                <li>Can repeat the same procedure with different data.</li>
                <li>Can grow from one calculation to statistics, graphs and automation.</li>
              </ul>
            </div>
          </div>
        </article>

        <div class="op-theory-split">
          <article class="op-theory-panel">
            <p class="eyebrow">ANATOMY OF A COLAB CELL</p>
            <h3>Read the interface before writing code.</h3>
            <div class="op-anatomy" aria-label="Animated notebook cell anatomy">
              <div class="anatomy-run"><span>1</span><b>Run</b><small>Executes the complete cell.</small></div>
              <div class="anatomy-cell"><span>2</span><b>Code cell</b><small>This is where you write Python instructions.</small><i></i><i></i><i></i></div>
              <div class="anatomy-output"><span>3</span><b>Output</b><small>Shows a value, text or an error.</small></div>
            </div>
          </article>

          <article class="op-theory-panel">
            <p class="eyebrow">THE FEEDBACK LOOP</p>
            <h3>An error is information.</h3>
            <p>Programming is iterative. You do not need the first attempt to be perfect. A useful workflow is to write a small step, run it, read what happened, correct one thing, and run again.</p>
            <div class="op-loop-diagram" aria-hidden="true">
              <span>WRITE</span><i></i><span>RUN</span><i></i><span>READ</span><i></i><span>CORRECT</span><i></i>
            </div>
          </article>
        </div>

        <article class="op-why-panel">
          <div>
            <p class="eyebrow">WHY THIS MATTERS FOR STATISTICS</p>
            <h3>Today: one expression. Later: an entire dataset.</h3>
          </div>
          <div class="op-scale-animation" aria-hidden="true">
            <span class="one-value">1 value</span><i></i><span class="many-values">100 values</span><i></i><span class="dataset">dataset</span><i></i><span class="analysis">analysis</span>
          </div>
          <p>The important habit is not memorizing a result. It is learning to express a procedure clearly enough that Python can repeat it. That is the bridge from a calculator-style task to statistical computing.</p>
        </article>

        <div class="op-workshop-rule">
          <strong>Workshop rule · no starter code</strong>
          <span>For Topic 01, every coding stage begins with a blank cell. Read the instruction, design the Python steps yourself, run the cell, inspect the output, then validate it.</span>
        </div>
      </section>`;
  }

  function injectTheory() {
    if (!topic01IsVisible()) return;
    const mount = $('#lessonMount');
    if (!mount || $('[data-topic01-enrichment]', mount)) return;
    const header = $('.lesson-header', mount);
    if (!header) return;
    header.insertAdjacentHTML('afterend', theoryMarkup());
    const title = $('.lesson-title', mount);
    const lead = $('.lesson-lead', mount);
    if (title) title.textContent = 'Python, Colab interface and general operations';
    if (lead) lead.textContent = 'Before calculating, understand the tool: Python is the language, Colab is the notebook interface, and a code cell describes a repeatable process rather than only displaying a final number.';
  }

  function enforceBlankWorkshop() {
    if (!topic01IsVisible()) return;
    const stage = currentStage();
    if (!stage || !STAGES[stage]) return;

    const body = $('#stageMount .stage-body');
    if (!body) return;
    body.classList.add('topic01-stage');

    const title = $('#stageMount .stage-instructions h4');
    const prompt = $('#stageMount .stage-instructions p');
    if (title) title.textContent = STAGES[stage].title;
    if (prompt) prompt.textContent = STAGES[stage].prompt;

    if (stage <= 4) {
      const editor = $('#codeEditor');
      if (!editor) return;
      const drafts = readDrafts();
      const draft = drafts[String(stage)] ?? '';
      if (editor.dataset.topic01Prepared !== 'true') {
        editor.value = draft;
        editor.placeholder = 'Write your complete Python solution here. This cell intentionally starts blank.';
        editor.dataset.topic01Prepared = 'true';
        editor.addEventListener('input', () => writeDraft(stage, editor.value));

        const toolbarTitle = $('#stageMount .editor-toolbar strong');
        if (toolbarTitle) toolbarTitle.textContent = 'Student Python cell · starts blank';
        editor.insertAdjacentHTML('beforebegin', '<div class="op-blank-note"><strong>Blank-cell challenge</strong><span>No solution or starter code is provided. Build the instructions yourself from the theory above.</span></div>');

        const reset = $('#resetCode');
        if (reset) {
          reset.textContent = 'Clear cell';
          reset.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            editor.value = '';
            writeDraft(stage, '');
            const output = $('#codeOutput');
            if (output) output.textContent = 'Cell cleared. Write your solution, then run it.';
          }, true);
        }
      }
    }
  }

  function enhance() {
    injectTheory();
    enforceBlankWorkshop();
  }

  const observer = new MutationObserver(() => requestAnimationFrame(enhance));
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', enhance);
  window.addEventListener('popstate', enhance);
  setTimeout(enhance, 0);
})();
