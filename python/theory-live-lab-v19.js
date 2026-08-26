(() => {
  'use strict';

  const requested = new URLSearchParams(location.search).get('topic') || 'operations';
  const PYODIDE_INDEX = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
  let runtimePromise = null;
  let executionCount = 0;

  const labs = {
    operations: {
      eyebrow: 'TOPIC 01 · LIVE PYTHON BASICS',
      title: 'See every beginner tool inside the interface where you use it',
      intro: 'Read the purpose, inspect the editable code cell, press Run, then read the black Python output. Change the example and run it again if you want to test your own idea.',
      items: [
        {key:'print', name:'print()', label:'SHOW A RESULT', purpose:'Display a value, message or calculated result in the output area.', when:'You want to make a result visible after Python calculates it.', code:'score = 25\nprint(score)', notice:'print(...) shows the value inside its parentheses.'},
        {key:'type', name:'type()', label:'INSPECT DATA', purpose:'Ask Python what kind of value it is currently storing.', when:'You are unsure whether data is an integer, decimal, text, Boolean or another type.', code:'value = 4.5\nprint(type(value))', notice:'The result identifies the Python class of the value.'},
        {key:'len', name:'len()', label:'COUNT ITEMS', purpose:'Count how many items are inside a list, string or another collection.', when:'You need the number of observations before a statistical calculation.', code:'values = [4, 8, 12]\nprint(len(values))', notice:'There are three items, so len(values) produces 3.'},
        {key:'int', name:'int()', label:'CONVERT TO INTEGER', purpose:'Convert compatible data to an integer.', when:'A whole number arrives as text and must become numeric.', code:'text = "12"\nnumber = int(text)\nprint(number + 3)', notice:'After conversion, Python can use the value in arithmetic.'},
        {key:'float', name:'float()', label:'CONVERT TO DECIMAL', purpose:'Convert compatible data to a floating-point number.', when:'A decimal arrives as text and must become numeric.', code:'text = "4.5"\nnumber = float(text)\nprint(number * 2)', notice:'float("4.5") creates the numeric value 4.5.'},
        {key:'str', name:'str()', label:'CONVERT TO TEXT', purpose:'Convert a value to text.', when:'You want to combine a number with a readable message.', code:'year = 2026\nlabel = "Year: " + str(year)\nprint(label)', notice:'str(year) lets the number join a string.'},
        {key:'bool', name:'bool()', label:'TRUE OR FALSE', purpose:'Interpret or convert a value using Python truth rules.', when:'You need a Boolean value before logic or conditions.', code:'print(bool(1))\nprint(bool(0))', notice:'1 becomes True while 0 becomes False.'},
        {key:'round', name:'round()', label:'ROUND A NUMBER', purpose:'Round a numeric result to a chosen number of decimal places.', when:'A report should show fewer decimal digits.', code:'pi_approx = 3.14159\nprint(round(pi_approx, 2))', notice:'The second argument tells Python how many decimal places to keep.'},
        {key:'sum', name:'sum()', label:'ADD MANY VALUES', purpose:'Add all numeric values in a collection.', when:'You need a total before calculating a mean or another summary.', code:'values = [4, 8, 12]\nprint(sum(values))', notice:'sum(values) adds every number in the list.'},
        {key:'min', name:'min()', label:'SMALLEST VALUE', purpose:'Find the smallest value in a collection.', when:'You need the minimum observation in a dataset.', code:'values = [8, 4, 21, 13]\nprint(min(values))', notice:'Python searches the collection and returns the smallest value.'},
        {key:'max', name:'max()', label:'LARGEST VALUE', purpose:'Find the largest value in a collection.', when:'You need the maximum observation in a dataset.', code:'values = [8, 4, 21, 13]\nprint(max(values))', notice:'Python searches the collection and returns the largest value.'},
        {key:'input', name:'input()', label:'ASK THE USER', purpose:'Standard Python can pause and ask a user to type information.', when:'A program needs data that is not known until the user enters it.', code:'name = input("What is your name? ")\nprint(name)', notice:'This course shows input() as context. Interactive stdin is intentionally not required in the browser workshop.', contextOnly:true}
      ]
    },
    types: {
      eyebrow: 'TOPIC 02 · LIVE DATA TYPES',
      title: 'See variables, types and conversions running in Python',
      intro: 'A variable is easier to understand when you can watch Python store a value, inspect its type, convert it and use the converted result.',
      items: [
        {key:'assign', name:'variable = value', label:'STORE A VALUE', purpose:'Create a variable by assigning a value to a name.', when:'You want to reuse a value later instead of typing it again.', code:'age = 16\nprint(age)', notice:'The name age now refers to the integer value 16.'},
        {key:'type-int', name:'type() · int', label:'INTEGER', purpose:'Inspect a whole-number value.', when:'You need to confirm that a value is stored as an integer.', code:'value = 42\nprint(type(value).__name__)', notice:'The short type name is int.'},
        {key:'type-float', name:'type() · float', label:'DECIMAL', purpose:'Inspect a decimal value.', when:'You need to confirm that a value is stored as a float.', code:'value = 4.5\nprint(type(value).__name__)', notice:'The short type name is float.'},
        {key:'type-str', name:'type() · str', label:'TEXT', purpose:'Inspect a text value.', when:'You need to distinguish text from a number that only looks numeric.', code:'value = "11A"\nprint(type(value).__name__)', notice:'Quotation marks create a string, whose short type name is str.'},
        {key:'type-bool', name:'type() · bool', label:'BOOLEAN', purpose:'Inspect a True/False value.', when:'You are working with logic, comparisons or conditions.', code:'value = True\nprint(type(value).__name__)', notice:'True and False are Boolean values, not text.'},
        {key:'none', name:'None', label:'NO VALUE YET', purpose:'Represent the intentional absence of a value.', when:'A result does not exist yet or is intentionally empty.', code:'result = None\nprint(type(result).__name__)', notice:'None has the type NoneType.'},
        {key:'convert-int', name:'int()', label:'TEXT → INTEGER', purpose:'Convert compatible text to a whole number.', when:'Input or imported data contains digits as text.', code:'value = "12"\nnumber = int(value)\nprint(number + 3)', notice:'The converted value can now participate in arithmetic.'},
        {key:'convert-float', name:'float()', label:'TEXT → DECIMAL', purpose:'Convert compatible text to a decimal number.', when:'A measurement arrives as text.', code:'value = "4.25"\nnumber = float(value)\nprint(number * 2)', notice:'The converted value is numeric, so multiplication works.'},
        {key:'convert-str', name:'str()', label:'NUMBER → TEXT', purpose:'Convert a number to text.', when:'You want to combine a numeric value with a sentence or label.', code:'score = 25\nmessage = "Score: " + str(score)\nprint(message)', notice:'Text concatenation works after converting the number with str().' }
      ]
    },
    arrays: {
      eyebrow: 'TOPIC 03 · LIVE LISTS',
      title: 'See Python lists as a real dataset, not just bracket notation',
      intro: 'Run each cell to see how one variable can store many ordered observations and how indexes and built-in functions work on the collection.',
      items: [
        {key:'create-list', name:'[ ... ]', label:'CREATE A LIST', purpose:'Store several related values under one variable name.', when:'You have multiple observations that belong to one dataset.', code:'values = [8, 13, 21]\nprint(values)', notice:'Square brackets create an ordered Python list.'},
        {key:'index', name:'values[index]', label:'READ ONE ITEM', purpose:'Read an item using its position.', when:'You need one specific observation from the list.', code:'values = [6, 10, 15, 21]\nprint(values[2])', notice:'Indexes start at zero, so index 2 is the third item.'},
        {key:'length', name:'len()', label:'COUNT OBSERVATIONS', purpose:'Count how many items the list contains.', when:'You need the sample size or denominator for a mean.', code:'values = [5, 10, 15, 20]\nprint(len(values))', notice:'The list contains four observations.'},
        {key:'total', name:'sum()', label:'TOTAL THE LIST', purpose:'Add every numeric observation.', when:'You need the total before a mean or another summary.', code:'values = [5, 10, 15, 20]\nprint(sum(values))', notice:'sum(...) processes the complete list.'},
        {key:'minmax', name:'min() / max()', label:'EXTREMES', purpose:'Find the smallest and largest observations.', when:'You need the limits of the dataset.', code:'values = [8, 4, 21, 13]\nprint(min(values))\nprint(max(values))', notice:'Both functions inspect the same collection.'},
        {key:'append', name:'append()', label:'ADD AN OBSERVATION', purpose:'Add a new item to the end of an existing list.', when:'A new observation arrives after the list has been created.', code:'values = [6, 12]\nvalues.append(18)\nprint(values)', notice:'append(...) changes the existing list.'},
        {key:'mean-list', name:'sum() / len()', label:'CALCULATE A MEAN', purpose:'Combine total and count to calculate an arithmetic mean.', when:'You have a list of quantitative observations.', code:'values = [10, 15, 5, 20]\nmean = sum(values) / len(values)\nprint(mean)', notice:'The mean is the total divided by the number of observations.'}
      ]
    },
    logic: {
      eyebrow: 'TOPIC 04 · LIVE LOGIC',
      title: 'Run comparisons and watch Python produce True or False',
      intro: 'Logical expressions are executable questions. Run the cells and change the numbers to see when each comparison becomes True or False.',
      items: [
        {key:'equal', name:'==', label:'EQUAL TO', purpose:'Compare whether two values are equal.', when:'A decision depends on two values matching.', code:'score = 10\nprint(score == 10)', notice:'Use == for comparison; a single = is assignment.'},
        {key:'not-equal', name:'!=', label:'NOT EQUAL TO', purpose:'Check whether two values are different.', when:'A decision should be True only when values do not match.', code:'group = "11A"\nprint(group != "11B")', notice:'The result is True because the two strings are different.'},
        {key:'greater', name:'> and <', label:'ORDER COMPARISONS', purpose:'Compare numerical size.', when:'You need to know whether a measurement is above or below a threshold.', code:'temperature = 28\nprint(temperature > 25)\nprint(temperature < 30)', notice:'Each comparison independently produces a Boolean result.'},
        {key:'inclusive', name:'>= and <=', label:'INCLUDE THE LIMIT', purpose:'Compare while including equality at the boundary.', when:'A threshold itself should count as valid.', code:'grade = 3.0\nprint(grade >= 3.0)', notice:'>= is True when the value is greater than or equal to the limit.'},
        {key:'and', name:'and', label:'BOTH CONDITIONS', purpose:'Require two conditions to be True at the same time.', when:'A rule has multiple requirements.', code:'age = 16\nhas_id = True\nprint(age >= 15 and has_id)', notice:'and returns True only when both sides are True.'},
        {key:'or', name:'or', label:'AT LEAST ONE', purpose:'Accept either of two conditions.', when:'More than one condition can satisfy the rule.', code:'day = "Saturday"\nprint(day == "Saturday" or day == "Sunday")', notice:'or is True when at least one side is True.'},
        {key:'not', name:'not', label:'REVERSE A BOOLEAN', purpose:'Invert a True/False value.', when:'You want the opposite of an existing condition.', code:'is_raining = False\nprint(not is_raining)', notice:'not False becomes True.'}
      ]
    },
    conditions: {
      eyebrow: 'TOPIC 05 · LIVE DECISIONS',
      title: 'See if, elif and else choose exactly one path',
      intro: 'Run each decision and then edit the input value. The output shows which branch Python selected.',
      items: [
        {key:'if', name:'if', label:'ONE CONDITION', purpose:'Run a block only when a condition is True.', when:'An action should happen only in one specific case.', code:'score = 85\nif score >= 80:\n    print("High score")', notice:'The indented line belongs to the if block.'},
        {key:'if-else', name:'if / else', label:'TWO POSSIBLE PATHS', purpose:'Choose between a True branch and an alternative.', when:'Exactly one of two actions should run.', code:'temperature = 18\nif temperature >= 20:\n    print("Warm")\nelse:\n    print("Cool")', notice:'Only one branch runs.'},
        {key:'elif', name:'if / elif / else', label:'MULTIPLE PATHS', purpose:'Test several alternatives in order.', when:'A value can belong to one of several categories.', code:'score = 72\nif score >= 90:\n    print("Excellent")\nelif score >= 60:\n    print("Pass")\nelse:\n    print("Review")', notice:'Python stops after the first True branch.'},
        {key:'compound', name:'if + and', label:'COMBINE RULES', purpose:'Use logical operators inside a condition.', when:'A branch requires multiple facts to be true.', code:'score = 80\nattendance = 90\nif score >= 60 and attendance >= 80:\n    print("Approved")\nelse:\n    print("Check requirements")', notice:'The branch runs only if both comparisons are True.'},
        {key:'nested-data', name:'condition from data', label:'DATA-DRIVEN DECISION', purpose:'Build a decision from a value calculated earlier.', when:'The condition depends on a computed statistic or variable.', code:'values = [4, 8, 12]\nmean = sum(values) / len(values)\nif mean >= 8:\n    print("Mean is at least 8")\nelse:\n    print("Mean is below 8")', notice:'Conditions can use results calculated earlier in the cell.'}
      ]
    },
    loops: {
      eyebrow: 'TOPIC 06 · LIVE REPETITION',
      title: 'Watch one block of code repeat across many values',
      intro: 'Loops become clear when you see the terminal print each iteration. Run the examples, then edit the list or range.',
      items: [
        {key:'for-list', name:'for item in list', label:'REPEAT OVER DATA', purpose:'Apply the same process to each item in a collection.', when:'Every observation needs the same operation.', code:'values = [3, 6, 9]\nfor value in values:\n    print(value)', notice:'The loop variable value changes once per iteration.'},
        {key:'transform', name:'for + expression', label:'TRANSFORM EACH ITEM', purpose:'Calculate something new for every observation.', when:'You need the same transformation for all values.', code:'values = [3, 6, 9]\nfor value in values:\n    print(value * 2)', notice:'The multiplication runs three times without copying the line.'},
        {key:'range', name:'range()', label:'REPEAT A FIXED NUMBER OF TIMES', purpose:'Generate a sequence of integers for a loop.', when:'You know how many repetitions are required.', code:'for i in range(4):\n    print(i)', notice:'range(4) produces 0, 1, 2, 3.'},
        {key:'accumulator', name:'accumulator', label:'BUILD A TOTAL', purpose:'Update one variable during every iteration.', when:'You need to combine many observations into one total.', code:'values = [4, 6, 10]\ntotal = 0\nfor value in values:\n    total = total + value\nprint(total)', notice:'Initialize the accumulator before the loop and print it after the loop.'},
        {key:'counter', name:'counter', label:'COUNT MATCHES', purpose:'Increase a counter only when a condition is satisfied.', when:'You need to count observations that meet a rule.', code:'values = [4, 9, 12, 3]\ncount = 0\nfor value in values:\n    if value >= 8:\n        count = count + 1\nprint(count)', notice:'The condition is checked once for each value.'},
        {key:'while', name:'while', label:'REPEAT WHILE TRUE', purpose:'Repeat while a condition remains True.', when:'The number of repetitions depends on a changing condition.', code:'count = 0\nwhile count < 3:\n    print(count)\n    count = count + 1', notice:'The loop must change something that eventually makes its condition False.'}
      ]
    },
    functions: {
      eyebrow: 'TOPIC 07 · LIVE FUNCTIONS',
      title: 'Define a reusable process, call it, and inspect what it returns',
      intro: 'A function is a named block of reusable code. Each cell below shows definition, call and output together.',
      items: [
        {key:'define', name:'def', label:'DEFINE A FUNCTION', purpose:'Give a reusable process a name.', when:'The same logic will be needed more than once.', code:'def greet():\n    print("Hello")\n\ngreet()', notice:'def creates the function; greet() calls it.'},
        {key:'parameter', name:'parameter', label:'RECEIVE INPUT', purpose:'Let a function work with different input values.', when:'The same process should work for many numbers.', code:'def double(number):\n    print(number * 2)\n\ndouble(6)', notice:'number is the parameter; 6 is the argument used in this call.'},
        {key:'return', name:'return', label:'SEND A RESULT BACK', purpose:'Return a value to the code that called the function.', when:'The result must be stored, combined or reused later.', code:'def square(number):\n    return number ** 2\n\nresult = square(5)\nprint(result)', notice:'return sends 25 back, then result stores it.'},
        {key:'two-params', name:'multiple parameters', label:'MORE THAN ONE INPUT', purpose:'Pass several values into one reusable process.', when:'A calculation depends on two or more inputs.', code:'def add(a, b):\n    return a + b\n\nprint(add(7, 5))', notice:'Arguments are matched to parameters by position here.'},
        {key:'reuse', name:'multiple calls', label:'REUSE THE PROCESS', purpose:'Call one function many times with different data.', when:'The procedure stays the same but the input changes.', code:'def square(number):\n    return number ** 2\n\nprint(square(3))\nprint(square(5))', notice:'One definition produces multiple results.'},
        {key:'mean-function', name:'function + list', label:'REUSABLE STATISTIC', purpose:'Package a statistical procedure inside a function.', when:'Several datasets need the same calculation.', code:'def mean(values):\n    return sum(values) / len(values)\n\nprint(mean([10, 15, 5, 20]))', notice:'The function accepts an entire list and returns one summary value.'}
      ]
    },
    statistics: {
      eyebrow: 'TOPIC 08 · LIVE STATISTICS',
      title: 'Turn a Python list into statistical summaries in executable cells',
      intro: 'Run each cell to connect the programming tools from previous topics with descriptive statistics.',
      items: [
        {key:'n', name:'len(values)', label:'SAMPLE SIZE', purpose:'Count the number of observations.', when:'You need n before calculating or reporting a summary.', code:'values = [5, 10, 15, 20]\nprint(len(values))', notice:'The dataset contains four observations.'},
        {key:'sum-stat', name:'sum(values)', label:'TOTAL', purpose:'Calculate the total of all observations.', when:'You need the numerator for a mean or a total quantity.', code:'values = [5, 10, 15, 20]\nprint(sum(values))', notice:'The total is 50.'},
        {key:'mean-stat', name:'sum / len', label:'MEAN', purpose:'Calculate the arithmetic mean.', when:'You need the central average of quantitative data.', code:'values = [5, 10, 15, 20]\nmean = sum(values) / len(values)\nprint(mean)', notice:'Python calculates the total and divides by the count.'},
        {key:'min-stat', name:'min(values)', label:'MINIMUM', purpose:'Find the smallest observation.', when:'You need the lower extreme of the dataset.', code:'values = [8, 4, 21, 13]\nprint(min(values))', notice:'The minimum is 4.'},
        {key:'max-stat', name:'max(values)', label:'MAXIMUM', purpose:'Find the largest observation.', when:'You need the upper extreme of the dataset.', code:'values = [8, 4, 21, 13]\nprint(max(values))', notice:'The maximum is 21.'},
        {key:'range-stat', name:'max - min', label:'RANGE', purpose:'Measure the distance between the maximum and minimum.', when:'You need a simple measure of spread.', code:'values = [8, 4, 21, 13]\ndata_range = max(values) - min(values)\nprint(data_range)', notice:'Range uses two built-in functions and one subtraction.'},
        {key:'above-mean', name:'loop + condition', label:'COUNT ABOVE THE MEAN', purpose:'Combine a mean, loop and condition to inspect a dataset.', when:'You want to count observations that satisfy a statistical rule.', code:'values = [4, 8, 12, 16]\nmean = sum(values) / len(values)\ncount = 0\nfor value in values:\n    if value > mean:\n        count = count + 1\nprint(mean)\nprint(count)', notice:'This combines lists, functions, loops and conditions in one statistical workflow.'},
        {key:'summary-fn', name:'reusable summary()', label:'PACKAGE A SUMMARY', purpose:'Reuse one statistical process on different datasets.', when:'Several datasets need the same descriptive summary.', code:'def summary(values):\n    return min(values), max(values), sum(values) / len(values)\n\nprint(summary([4, 8, 12]))', notice:'A function can return several summary values together.'}
      ]
    }
  };

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function lessonHtml(item, index) {
    const disabled = item.contextOnly ? 'disabled aria-disabled="true"' : '';
    const runLabel = item.contextOnly ? 'Context only' : '▶ Run';
    return `
      <article class="live-lesson-v19" data-live-key="${escapeHtml(item.key)}">
        <div class="live-copy-v19">
          <span class="live-index-v19">${String(index + 1).padStart(2, '0')}</span>
          <p class="eyebrow">${escapeHtml(item.label)}</p>
          <h3><code>${escapeHtml(item.name)}</code></h3>
          <p>${escapeHtml(item.purpose)}</p>
          <div class="live-when-v19"><strong>Use it when</strong><span>${escapeHtml(item.when)}</span></div>
          <div class="live-notice-v19"><strong>What to notice</strong><span>${escapeHtml(item.notice)}</span></div>
        </div>
        <div class="live-colab-v19">
          <div class="live-colab-top-v19">
            <div><span class="live-runtime-dot-v19"></span><strong>Python 3 · browser runtime</strong></div>
            <div class="live-controls-v19">
              <button type="button" class="live-reset-v19" data-reset-live="${escapeHtml(item.key)}">Reset</button>
              <button type="button" class="live-run-v19" data-run-live="${escapeHtml(item.key)}" ${disabled}>${runLabel}</button>
            </div>
          </div>
          <div class="live-cell-v19">
            <div class="live-gutter-v19"><button type="button" data-run-live="${escapeHtml(item.key)}" ${disabled} aria-label="Run ${escapeHtml(item.name)} example">▶</button><small>[ ]</small></div>
            <div class="live-editor-wrap-v19"><div class="live-cell-label-v19">Code cell · editable</div><textarea class="live-editor-v19" spellcheck="false" data-live-editor="${escapeHtml(item.key)}">${escapeHtml(item.code)}</textarea></div>
          </div>
          <div class="live-output-v19 ${item.contextOnly ? 'is-context' : ''}" data-live-output="${escapeHtml(item.key)}"><small>${item.contextOnly ? 'NOTE' : 'OUTPUT'}</small><pre>${item.contextOnly ? escapeHtml(item.notice) : 'Press ▶ Run'}</pre></div>
        </div>
      </article>`;
  }

  async function ensureRuntime() {
    if (runtimePromise) return runtimePromise;
    const status = document.getElementById('liveRuntimeStatusV19');
    if (status) status.textContent = 'Loading Python runtime…';
    runtimePromise = (async () => {
      if (typeof window.loadPyodide !== 'function') throw new Error('Python runtime script did not load. Refresh the page and try again.');
      const runtime = await window.loadPyodide({indexURL: PYODIDE_INDEX});
      if (status) status.textContent = 'Python ready · edit and run any example';
      return runtime;
    })().catch(error => {
      runtimePromise = null;
      if (status) status.textContent = 'Python runtime unavailable · refresh and try again';
      throw error;
    });
    return runtimePromise;
  }

  function currentItem(key) {
    return (labs[requested]?.items || []).find(item => item.key === key);
  }

  async function runLive(key, button) {
    const item = currentItem(key);
    const lesson = document.querySelector(`[data-live-key="${CSS.escape(key)}"]`);
    if (!item || item.contextOnly || !lesson) return;
    const editor = lesson.querySelector('[data-live-editor]');
    const output = lesson.querySelector('[data-live-output]');
    const pre = output?.querySelector('pre');
    if (!editor || !output || !pre) return;

    const buttons = lesson.querySelectorAll('[data-run-live]');
    buttons.forEach(btn => { btn.disabled = true; });
    output.classList.remove('is-error', 'is-success');
    pre.textContent = 'Starting Python…';

    try {
      const runtime = await ensureRuntime();
      const stdout = [];
      const stderr = [];
      runtime.setStdout({batched: text => stdout.push(String(text))});
      runtime.setStderr({batched: text => stderr.push(String(text))});
      const result = await runtime.runPythonAsync(editor.value);
      let text = stderr.length ? stderr.join('\n') : stdout.join('\n');
      if (!text && result !== undefined && result !== null) text = String(result);
      pre.textContent = text || '(no visible output)';
      output.classList.toggle('is-error', stderr.length > 0);
      output.classList.toggle('is-success', stderr.length === 0);
      executionCount += 1;
      const counter = lesson.querySelector('.live-gutter-v19 small');
      if (counter) counter.textContent = `[${executionCount}]`;
    } catch (error) {
      pre.textContent = String(error?.message || error);
      output.classList.add('is-error');
    } finally {
      buttons.forEach(btn => { btn.disabled = false; });
    }
  }

  function resetLive(key) {
    const item = currentItem(key);
    const lesson = document.querySelector(`[data-live-key="${CSS.escape(key)}"]`);
    if (!item || !lesson) return;
    const editor = lesson.querySelector('[data-live-editor]');
    const output = lesson.querySelector('[data-live-output] pre');
    const counter = lesson.querySelector('.live-gutter-v19 small');
    if (editor) editor.value = item.code;
    if (output) output.textContent = item.contextOnly ? item.notice : 'Press ▶ Run';
    if (counter) counter.textContent = '[ ]';
  }

  function install() {
    const config = labs[requested];
    const concept = document.getElementById('conceptSection');
    const theoryApp = document.getElementById('theoryApp');
    if (!config || !concept || !theoryApp || theoryApp.classList.contains('hidden')) return false;
    if (document.getElementById('topicLiveLabV19')) return true;

    document.getElementById('beginnerBasicsV17')?.remove();

    const section = document.createElement('section');
    section.id = 'topicLiveLabV19';
    section.className = 'topic-live-lab-v19';
    section.innerHTML = `
      <div class="section-heading live-heading-v19">
        <p class="eyebrow">${escapeHtml(config.eyebrow)}</p>
        <h2>${escapeHtml(config.title)}</h2>
        <p>${escapeHtml(config.intro)}</p>
        <div class="live-runtime-status-v19"><span></span><strong id="liveRuntimeStatusV19">Python loads when you run the first example</strong></div>
      </div>
      <div class="live-workflow-v19" aria-label="Theory learning workflow">
        <div><b>1</b><span>Read purpose</span></div><i>→</i>
        <div><b>2</b><span>Inspect or edit code</span></div><i>→</i>
        <div><b>3</b><span>Run</span></div><i>→</i>
        <div><b>4</b><span>Read output</span></div><i>→</i>
        <div><b>5</b><span>Change and rerun</span></div>
      </div>
      <div class="live-lessons-v19">${config.items.map(lessonHtml).join('')}</div>
      <div class="live-reading-rule-v19">
        <strong>Notebook rule:</strong>
        <span>Python executes the code you run, not the code you only see on screen. Edit one thing, run again, and use the output or error as feedback.</span>
      </div>`;
    concept.insertAdjacentElement('afterend', section);

    section.addEventListener('click', event => {
      const run = event.target.closest('[data-run-live]');
      if (run) {
        runLive(run.dataset.runLive, run);
        return;
      }
      const reset = event.target.closest('[data-reset-live]');
      if (reset) resetLive(reset.dataset.resetLive);
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