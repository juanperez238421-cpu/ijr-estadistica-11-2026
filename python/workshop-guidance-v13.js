(() => {
  'use strict';

  const topicMap = window.IJR_PYTHON_HUB_TOPIC_MAP || {};
  const requested = new URLSearchParams(location.search).get('topic') || 'operations';
  const topic = topicMap[requested];
  if (!topic) return;

  const topicReference = {
    operations: '= assignment · + − × ÷ arithmetic · ** power · % remainder',
    types: 'int · float · str · bool · NoneType · inspect before converting',
    arrays: 'list · index starts at 0 · length · total · min/max · append',
    logic: 'comparison → True/False · == · != · > · < · and · or · not',
    conditions: 'if → elif → else · evaluate from top to bottom',
    loops: 'for · range/list · iterator · repeated body · accumulator',
    functions: 'function name · parameters · arguments · body · return value',
    statistics: 'dataset · count · total · mean · minimum · maximum · range'
  };

  const operationSteps = {
    'op-01': [
      'Identify the two given values: 17 and 8. Each value must first be stored in its own variable.',
      'Create a third variable whose job is to combine the first two variables with addition.',
      'Make only the third variable’s value visible as the final output. Do not type the final numerical answer directly.',
      'Press ▶ Run and read the black Python terminal. It should show one final numeric result and no ERROR.',
      'If you edit anything after running, press ▶ Run again so the terminal matches the current cell.',
      'Only then press Validate output.'
    ],
    'op-02': [
      'Identify the three numbers and the two operations requested in the sentence.',
      'Build one arithmetic expression. Let Python apply its normal order of operations: multiplication is evaluated before addition.',
      'Make the value of that expression visible. Do not replace the expression with a calculated answer.',
      'Press ▶ Run and inspect the terminal output.',
      'If the terminal shows ERROR or an unexpected value, correct the expression and run it again.',
      'Validate only the version that has just run successfully.'
    ],
    'op-03': [
      'Store the given value 9 in a variable first.',
      'Use Python’s exponentiation operator to calculate the square of that variable.',
      'Display the calculated result, not the original value.',
      'Press ▶ Run and read the black terminal.',
      'Check that there is no ERROR and that the output is one numeric result.',
      'Validate after the current cell has run successfully.'
    ],
    'op-04': [
      'Store the given value 81 in a variable.',
      'Represent square root as a fractional power using exponent 0.5.',
      'Apply that operation to the variable and display the result.',
      'Press ▶ Run and inspect the terminal output.',
      'If Python reports an error, correct only the line related to the operation and run again.',
      'Validate only after the terminal shows a successful result.'
    ],
    'op-05': [
      'Recall that Python does not use the handwritten-math caret for exponentiation.',
      'Compare all four operator symbols before selecting one.',
      'Use the black scratch terminal if you want to test a tiny power expression.',
      'Select the operator that Python actually uses for powers.',
      'Press Validate answer.'
    ],
    'op-06': [
      'Read each proposed workflow from beginning to end.',
      'Look for the sequence that treats execution and output as feedback, not as the final step.',
      'Remember the class cycle: write/edit → run → inspect → correct when needed.',
      'Select the option that matches that cycle.',
      'Press Validate answer.'
    ],
    'op-07': [
      'Store the total number of items and the complete-group size in separate variables.',
      'Use the remainder operation to ask how many items are left after making complete groups.',
      'Display only the remainder produced by that operation.',
      'Press ▶ Run and inspect the black terminal.',
      'If you change the cell, run the updated version again.',
      'Validate only when the current output is successful and visible.'
    ],
    'op-08': [
      'Store the total and the number of equal parts in separate variables.',
      'Create a new variable that represents total divided by number of parts.',
      'Display that new result variable.',
      'Press ▶ Run and read the terminal output.',
      'Check that the output is numeric and that no ERROR is present.',
      'Validate the exact version you just executed.'
    ],
    'op-09': [
      'Store the two given values in variables.',
      'The addition must happen first, before multiplication by 2.',
      'Use parentheses to make that intended order explicit in the expression.',
      'Display the final calculated value.',
      'Press ▶ Run, inspect the terminal, and correct the expression if needed.',
      'Validate only after the current cell runs successfully.'
    ],
    'op-10': [
      'Store 6 and 3 in separate variables.',
      'Create a third variable that stores their product.',
      'Use that third variable in a later expression that adds 2. Do not repeat the original multiplication instead of reusing the stored result.',
      'Display only the final value from the later step.',
      'Press ▶ Run and read the black terminal.',
      'If you make any edit, run again before validating.',
      'Validate the successful current output.'
    ]
  };

  function stageIndex() {
    const active = document.querySelector('.workshop-nav-button.active');
    if (active && active.dataset.stage !== undefined) return Number(active.dataset.stage) || 0;
    const kicker = document.querySelector('.stage-kicker')?.textContent || '';
    const match = kicker.match(/Stage\s+(\d+)/i);
    return match ? Math.max(0, Number(match[1]) - 1) : 0;
  }

  function taskHint(ex) {
    const text = `${ex.title || ''} ${ex.prompt || ''}`.toLowerCase();
    if (text.includes('third value') || text.includes('third item')) return 'Indexing reminder: positions start at 0, so count positions rather than copying the visible value.';
    if (text.includes('number of items') || text.includes('length')) return 'Measure the collection with the list-length operation instead of counting manually.';
    if (text.includes('minimum') && text.includes('maximum')) return 'The task requires two outputs. Keep their requested order and put each result on its own visible line.';
    if (text.includes('append')) return 'Modify the existing list first; then display the resulting collection so the new observation is visible.';
    if (text.includes('mean') || text.includes('average')) return 'A mean uses the complete dataset: total of the observations divided by the number of observations.';
    if (text.includes('range')) return 'For statistical range, compare the extreme values: maximum and minimum.';
    if (text.includes('convert')) return 'Conversion must happen before the numeric operation. First change how Python interprets the value, then calculate.';
    if (text.includes('type')) return 'Inspect the value that is already provided. The purpose is to identify its data category, not to replace it.';
    if (text.includes('return')) return 'Distinguish returning a value to the caller from merely displaying text on screen.';
    if (text.includes('parameter') || text.includes('argument')) return 'Track which names belong to the function definition and which concrete values are supplied when it is called.';
    if (text.includes('loop') || text.includes('range(')) return 'Trace the repeated body one iteration at a time and watch which value changes after each pass.';
    if (text.includes('condition') || text.includes('if ') || text.includes('elif') || text.includes('else')) return 'Evaluate conditions from top to bottom. Once a branch is selected, follow only that branch for the current case.';
    if (text.includes('true') || text.includes('false') || text.includes('comparison')) return 'Evaluate each comparison from the actual values before combining logical results.';
    return 'Translate the objective into one small sequence of actions. Keep the provided data intact unless the task explicitly asks you to change it.';
  }

  function topicAction(slug) {
    return {
      types: 'Identify the value’s data type or the required conversion before you focus on the final output.',
      arrays: 'Identify whether the task is asking for one indexed item, a list modification, or a summary of the whole list.',
      logic: 'Evaluate comparisons first. Then apply the requested logical relationship to the resulting True/False values.',
      conditions: 'Trace the decision in order and determine which branch is actually executed for the given data.',
      loops: 'Identify what repeats, what value changes each iteration, and whether a running total/counter must be updated.',
      functions: 'Separate the function definition from the function call: inputs enter, the body processes them, and a result may be returned.',
      statistics: 'Start with the complete list of observations and identify exactly which statistical summary the task requests.'
    }[slug] || 'Break the task into stored values, one operation at a time, and one visible final result.';
  }

  function buildSteps(ex) {
    if (operationSteps[ex.key]) return operationSteps[ex.key];
    if (ex.mode === 'choice') {
      return [
        'Read the complete stage objective before looking at the answer choices.',
        topicAction(topic.slug),
        'Compare every option with the rule or concept from the theory page. Do not choose only because an option looks familiar.',
        'If useful, test a small example in the black Python scratch terminal. Terminal experiments do not validate the stage automatically.',
        'Select exactly one answer.',
        'Press Validate answer and read the feedback before moving to another stage.'
      ];
    }
    const starter = String(ex.code || '').trim().length > 0;
    return [
      'Read the complete stage objective and identify exactly what must appear as the final output.',
      starter ? 'Read the provided Python cell first. Keep the supplied values and variable names unless the objective explicitly asks you to change them.' : 'Start from the blank cell and create only the statements needed by the objective.',
      topicAction(topic.slug),
      taskHint(ex),
      'Press ▶ Run. The black Python terminal is the evidence of what the current cell actually executed.',
      'Read the terminal carefully. If it shows ERROR or the wrong kind/order of output, correct the relevant part and press ▶ Run again.',
      'After the last edit, run once more. Validate only when the current cell has executed successfully and the visible output matches the objective.'
    ];
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function buildPanel(ex, index) {
    const steps = buildSteps(ex);
    const mode = ex.mode === 'choice' ? 'CONCEPT CHECK' : 'PYTHON TASK';
    const article = document.createElement('aside');
    article.className = 'task-guide-panel';
    article.setAttribute('aria-label', 'Step-by-step task instructions');
    article.innerHTML = `
      <div class="task-guide-top">
        <div><span class="task-guide-kicker">TASK GUIDE</span><strong>Stage ${index + 1} of ${topic.exercises.length}</strong></div>
        <span class="task-guide-mode">${mode}</span>
      </div>
      <section class="task-guide-section task-guide-objective">
        <h3>What you need to do</h3>
        <p>${escapeHtml(ex.prompt || ex.title || '')}</p>
      </section>
      <section class="task-guide-section">
        <h3>Do it step by step</h3>
        <ol class="task-guide-steps">${steps.map((step, i) => `<li><span>${i + 1}</span><p>${escapeHtml(step)}</p></li>`).join('')}</ol>
      </section>
      <section class="task-guide-section task-guide-check">
        <h3>Before you validate</h3>
        <label><input type="checkbox"> I followed the stage objective, not only the expected final number.</label>
        <label><input type="checkbox"> ${ex.mode === 'choice' ? 'I selected one option after checking the concept.' : 'I pressed ▶ Run after my last edit.'}</label>
        <label><input type="checkbox"> ${ex.mode === 'choice' ? 'I used the terminal only as scratch work when needed.' : 'The black terminal shows no ERROR and the required output is visible.'}</label>
      </section>
      <section class="task-guide-section task-guide-memory">
        <h3>Remember</h3>
        <p>${escapeHtml(topicReference[topic.slug] || '')}</p>
        <p class="task-guide-hint">${escapeHtml(taskHint(ex))}</p>
      </section>
      <a class="task-guide-theory" href="theory.html?topic=${encodeURIComponent(topic.slug)}">Review this topic’s theory</a>`;
    return article;
  }

  function enhanceCurrentStage() {
    const card = document.querySelector('#stageMount .workshop-stage-card');
    if (!card || card.dataset.guidanceV13 === '1') return;
    const index = stageIndex();
    const ex = topic.exercises[index] || topic.exercises[0];
    if (!ex) return;

    card.dataset.guidanceV13 = '1';
    const footer = card.querySelector('.stage-footer-nav');
    const layout = document.createElement('div');
    layout.className = 'guided-stage-layout';
    const main = document.createElement('div');
    main.className = 'guided-stage-main';
    const panel = buildPanel(ex, index);

    Array.from(card.children).forEach(child => {
      if (child !== footer) main.appendChild(child);
    });
    layout.append(panel, main);
    if (footer) card.insertBefore(layout, footer); else card.appendChild(layout);
  }

  const mount = document.getElementById('stageMount');
  if (!mount) return;
  new MutationObserver(enhanceCurrentStage).observe(mount, {childList:true, subtree:true});
  document.addEventListener('DOMContentLoaded', enhanceCurrentStage);
  enhanceCurrentStage();
})();
