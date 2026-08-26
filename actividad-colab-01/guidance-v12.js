(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const byStage = tag => {
    const t = String(tag || '');
    if (t.includes('BASIC OPERATIONS')) return {
      title: 'Syntax useful in this stage',
      text: 'Use variable names inside expressions. The assignment symbol stores a value; arithmetic operators calculate with it.',
      examples: ['x = 10', 'a + b', 'a - b', 'a * b', 'a / b', 'a ** 2']
    };
    if (t.includes('DATA TYPES')) return {
      title: 'Syntax useful in this stage',
      text: 'Quotation marks create text. type(...) tells you what kind of value Python is storing.',
      examples: ['type(x)', 'type(x).__name__', '"10"', 'True', 'False', 'None']
    };
    if (t.includes('ARRAYS / LISTS')) return {
      title: 'Syntax useful in this stage',
      text: 'A list stores many ordered values in one variable. Indexing starts at 0.',
      examples: ['values = [4, 7, 9]', 'values[0]', 'values[1]', 'len(values)', 'sum(values)']
    };
    return {
      title: 'Python reminder',
      text: 'Read the exact task, preserve the provided data, change only what the task asks for, then run and validate.',
      examples: ['print(x)', 'type(x)']
    };
  };

  function showDialog(dialog, focusId) {
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    if (focusId) requestAnimationFrame(() => $(focusId)?.scrollIntoView({block:'start'}));
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  function buildDialog() {
    if ($('pythonReferenceDialog')) return $('pythonReferenceDialog');
    const dialog = document.createElement('dialog');
    dialog.id = 'pythonReferenceDialog';
    dialog.className = 'reference-dialog';
    dialog.innerHTML = `
      <div class="reference-shell">
        <header class="reference-head">
          <div>
            <div class="reference-kicker">PYTHON QUICK REFERENCE · GUÍA RÁPIDA</div>
            <h2>Commands you can use in this class</h2>
            <p>Keep this open whenever you forget a symbol or command. Not every command below is graded today.</p>
          </div>
          <button class="reference-close" type="button" aria-label="Close reference">×</button>
        </header>
        <div class="reference-body">
          <section id="howToWorkSection" class="reference-workflow">
            <strong>How to complete an exercise · Cómo resolver cada ejercicio</strong>
            <ol>
              <li><b>Read the Stage objective first.</b> Identify exactly what Python must calculate or return.</li>
              <li><b>Do not erase the provided data.</b> In code stages, normally replace only <code>WRITE_HERE</code>.</li>
              <li><b>Press ▶ Run.</b> Python executes the complete cell from top to bottom.</li>
              <li><b>Read the last line in the Python console.</b> If you see <code>ERROR</code>, correct the code and run again; syntax/runtime errors do not cost points.</li>
              <li><b>Only after checking the result, press Validate output / Validate answer.</b> An incorrect validated answer can affect the score.</li>
            </ol>
          </section>

          <div id="commandReferenceSection" class="reference-grid">
            <section class="reference-card">
              <h3>1 · Store, print and inspect</h3>
              <table class="reference-table">
                <tr><th>Store a value</th><td><code>x = 10</code></td></tr>
                <tr><th>Show a value</th><td><code>print(x)</code></td></tr>
                <tr><th>Data type</th><td><code>type(x)</code></td></tr>
                <tr><th>Type name only</th><td><code>type(x).__name__</code></td></tr>
              </table>
              <p><code>=</code> assigns/stores a value. It does not mean “is equal to?” inside a comparison.</p>
            </section>

            <section class="reference-card">
              <h3>2 · Arithmetic operations</h3>
              <table class="reference-table">
                <tr><th>Addition</th><td><code>a + b</code></td></tr>
                <tr><th>Subtraction</th><td><code>a - b</code></td></tr>
                <tr><th>Multiplication</th><td><code>a * b</code></td></tr>
                <tr><th>Division</th><td><code>a / b</code></td></tr>
                <tr><th>Integer division</th><td><code>a // b</code></td></tr>
                <tr><th>Remainder</th><td><code>a % b</code></td></tr>
                <tr><th>Power</th><td><code>a ** 2</code></td></tr>
              </table>
            </section>

            <section class="reference-card">
              <h3>3 · Powers and roots</h3>
              <table class="reference-table">
                <tr><th>Square</th><td><code>x ** 2</code></td></tr>
                <tr><th>Cube</th><td><code>x ** 3</code></td></tr>
                <tr><th>Square root</th><td><code>x ** 0.5</code></td></tr>
                <tr><th>Square root with math</th><td><code>import math</code><br><code>math.sqrt(x)</code></td></tr>
              </table>
              <p><strong>Important:</strong> in Python, <code>^</code> is not the power operator. Use <code>**</code>.</p>
            </section>

            <section class="reference-card">
              <h3>4 · Comparisons</h3>
              <table class="reference-table">
                <tr><th>Greater than</th><td><code>a &gt; b</code></td></tr>
                <tr><th>Greater or equal</th><td><code>a &gt;= b</code></td></tr>
                <tr><th>Less than</th><td><code>a &lt; b</code></td></tr>
                <tr><th>Less or equal</th><td><code>a &lt;= b</code></td></tr>
                <tr><th>Equal to</th><td><code>a == b</code></td></tr>
                <tr><th>Different from</th><td><code>a != b</code></td></tr>
              </table>
              <p>Comparisons return a Boolean value: <code>True</code> or <code>False</code>.</p>
            </section>

            <section class="reference-card">
              <h3>5 · Logical commands</h3>
              <table class="reference-table">
                <tr><th>Both true</th><td><code>condition1 and condition2</code></td></tr>
                <tr><th>At least one true</th><td><code>condition1 or condition2</code></td></tr>
                <tr><th>Invert truth value</th><td><code>not condition</code></td></tr>
              </table>
              <div class="command-chip-row">
                <span class="command-chip">age &gt;= 18</span>
                <span class="command-chip">score &gt;= 3.0 and passed == True</span>
              </div>
            </section>

            <section class="reference-card">
              <h3>6 · Lists / arrays for statistics</h3>
              <table class="reference-table">
                <tr><th>Create a list</th><td><code>values = [4, 7, 9]</code></td></tr>
                <tr><th>First item</th><td><code>values[0]</code></td></tr>
                <tr><th>Second item</th><td><code>values[1]</code></td></tr>
                <tr><th>How many values</th><td><code>len(values)</code></td></tr>
                <tr><th>Sum all values</th><td><code>sum(values)</code></td></tr>
                <tr><th>Minimum / maximum</th><td><code>min(values)</code> · <code>max(values)</code></td></tr>
                <tr><th>Simple mean</th><td><code>sum(values) / len(values)</code></td></tr>
              </table>
            </section>
          </div>

          <div class="reference-warning">
            <strong>Four common mistakes:</strong> <code>=</code> stores a value but <code>==</code> compares values; powers use <code>**</code> not <code>^</code>; Python decimals use a point such as <code>3.5</code>; list positions start at index <code>0</code>.
          </div>
          <p class="reference-note">You may test these commands in the Python console at the bottom of the notebook. Use the reference to understand syntax; follow the Stage objective to know which command is required in the current exercise.</p>
        </div>
      </div>`;
    document.body.appendChild(dialog);
    dialog.querySelector('.reference-close')?.addEventListener('click', () => closeDialog(dialog));
    dialog.addEventListener('click', event => {
      if (event.target === dialog) closeDialog(dialog);
    });
    return dialog;
  }

  function addHeaderButtons(dialog) {
    const status = document.querySelector('.app-status');
    if (!status || $('howToButton')) return;
    const how = document.createElement('button');
    how.id = 'howToButton';
    how.className = 'reference-button';
    how.type = 'button';
    how.textContent = 'How to work here';
    how.addEventListener('click', () => showDialog(dialog, 'howToWorkSection'));
    const ref = document.createElement('button');
    ref.id = 'pythonReferenceButton';
    ref.className = 'reference-button';
    ref.type = 'button';
    ref.textContent = 'Python commands';
    ref.addEventListener('click', () => showDialog(dialog, 'commandReferenceSection'));
    status.insertBefore(how, status.firstChild);
    status.insertBefore(ref, status.firstChild);
  }

  function buildGuideCards(dialog) {
    const scroll = document.querySelector('.guide-scroll');
    const intro = $('lessonConcept');
    if (!scroll || !intro || $('studentRouteCard')) return;

    const route = document.createElement('section');
    route.id = 'studentRouteCard';
    route.className = 'student-route-card';
    route.innerHTML = `
      <h3>Exactly what to do · Haz esto en orden</h3>
      <p class="student-route-lead">Follow these steps every time. The blue Stage objective below tells you what result this specific exercise expects.</p>
      <ol id="studentRouteList" class="student-route-list"></ol>
      <div class="student-route-actions">
        <button id="openHowToFromGuide" type="button">Full instructions</button>
        <button id="openReferenceFromGuide" type="button">Python command reference</button>
      </div>`;

    const syntax = document.createElement('section');
    syntax.id = 'stageSyntaxCard';
    syntax.className = 'stage-syntax-card';
    syntax.innerHTML = '<div id="stageSyntaxTitle" class="stage-syntax-title">Python reminder</div><p id="stageSyntaxText"></p><div id="stageSyntaxExamples" class="syntax-examples"></div>';

    intro.insertAdjacentElement('afterend', syntax);
    intro.insertAdjacentElement('afterend', route);
    $('openHowToFromGuide')?.addEventListener('click', () => showDialog(dialog, 'howToWorkSection'));
    $('openReferenceFromGuide')?.addEventListener('click', () => showDialog(dialog, 'commandReferenceSection'));
  }

  function addNotebookReminder(dialog) {
    const cell = $('codeCell');
    if (!cell || $('explicitNotebookNote')) return;
    const note = document.createElement('div');
    note.id = 'explicitNotebookNote';
    note.className = 'explicit-notebook-note';
    note.innerHTML = '<strong>Code rule:</strong> keep the provided values and variable names. Normally, edit only <code>WRITE_HERE</code>. Then press <b>▶ Run</b>, read the console, and only then press <b>Validate output</b>. <button id="notebookReferenceButton" type="button">Open Python commands</button>';
    note.querySelector('button').className = 'reference-button';
    cell.insertAdjacentElement('beforebegin', note);
    $('notebookReferenceButton')?.addEventListener('click', () => showDialog(dialog, 'commandReferenceSection'));
  }

  function updateGuide() {
    const routeList = $('studentRouteList');
    const choice = !$('choicePanel')?.classList.contains('hidden');
    if (routeList) {
      const steps = choice ? [
        'Read the complete <b>Stage objective</b> and the assigned question.',
        'Reason through the concept before clicking an option. Use the command reference if you forgot a symbol.',
        'Click <b>one answer option</b>. Your selection will be highlighted.',
        'Re-read the question and your selected option.',
        'Press <b>Validate answer</b> only when your team agrees.'
      ] : [
        'Read the complete <b>Stage objective</b> and identify the requested output.',
        'In the code cell, keep the given values. Replace <b>only</b> <code>WRITE_HERE</code> unless the task explicitly says otherwise.',
        'Press <b>▶ Run</b>. Python executes every line in the cell.',
        'Read the <b>last output line</b> in the Python console. If you see <code>ERROR</code>, fix the code and run again.',
        'When the output makes sense, press <b>Validate output</b>. Do not validate an error message or an unverified guess.'
      ];
      routeList.innerHTML = steps.map((step, i) => `<li><span>${i + 1}</span><div>${step}</div></li>`).join('');
    }

    const syntax = byStage($('lessonTag')?.textContent);
    if ($('stageSyntaxTitle')) $('stageSyntaxTitle').textContent = syntax.title;
    if ($('stageSyntaxText')) $('stageSyntaxText').textContent = syntax.text;
    if ($('stageSyntaxExamples')) $('stageSyntaxExamples').innerHTML = syntax.examples.map(x => `<code>${x.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code>`).join('');

    const notebookNote = $('explicitNotebookNote');
    if (notebookNote) notebookNote.classList.toggle('hidden', choice);
  }

  function boot() {
    const dialog = buildDialog();
    addHeaderButtons(dialog);
    buildGuideCards(dialog);
    addNotebookReminder(dialog);
    updateGuide();

    const observer = new MutationObserver(updateGuide);
    if ($('lessonTag')) observer.observe($('lessonTag'), {childList:true,subtree:true,characterData:true});
    if ($('choicePanel')) observer.observe($('choicePanel'), {attributes:true,attributeFilter:['class']});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
