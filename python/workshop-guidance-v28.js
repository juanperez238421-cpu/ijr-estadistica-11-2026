(() => {
  'use strict';

  const topicMap = window.IJR_PYTHON_HUB_TOPIC_MAP || {};
  const requested = new URLSearchParams(location.search).get('topic') || 'operations';
  const topic = topicMap[requested];
  if (!topic) return;

  const arraySteps = {
    'arr-01': [
      'Create the list variable exactly from the data in the problem statement.',
      'Count list positions from zero and identify which index represents the third position.',
      'Use bracket indexing on the list variable to retrieve that position.',
      'Print the value produced by the indexing expression. Do not copy the visible list item directly into print(...).',
      'Press ▶ Run and confirm one value appears with no ERROR.',
      'Validate only the exact code version that just ran successfully.'
    ],
    'arr-02': [
      'Create the list variable using all four given observations.',
      'Apply len() to the list variable so Python measures the number of items.',
      'Print the value returned by len(). Do not count the items yourself and type that count.',
      'Press ▶ Run and inspect the black terminal.',
      'If you edit the cell, run the new version again.',
      'Validate only after the current code produces the requested count.'
    ],
    'arr-03': [
      'Create the list variable from the provided observations.',
      'Apply sum() to the complete list variable.',
      'Print the value returned by sum(). Do not manually add the visible numbers.',
      'Press ▶ Run and read the terminal output.',
      'Correct any syntax or variable-name error, then run again.',
      'Validate the successful current code.'
    ],
    'arr-04': [
      'Create the list variable exactly as given.',
      'Use min() on the list variable to obtain the smallest observation.',
      'Use max() on the same list variable to obtain the largest observation.',
      'Print the minimum first and the maximum second, one output per line.',
      'Do not copy the visible smallest or largest numbers directly into print(...).',
      'Run the cell, check the two-line order, then validate.'
    ],
    'arr-05': [
      'Create the original list variable before making any change.',
      'Use append() on that same list to add the new observation requested by the problem.',
      'Print the list variable after append() has changed it.',
      'Do not type a finished list literal that already contains the new value.',
      'Press ▶ Run and verify that the list changed in the terminal.',
      'Validate the exact executed code.'
    ],
    'arr-06': [
      'Create the complete numeric list from the problem statement.',
      'Use sum() to obtain the total and len() to obtain the number of observations.',
      'Divide the computed total by the computed count and store the mean in a variable.',
      'Print the mean variable. Do not calculate the mean outside Python and print a literal answer.',
      'Press ▶ Run and inspect the terminal.',
      'Validate only after the current code executes successfully.'
    ],
    'arr-07': [
      'Create the list variable from the four given observations.',
      'Remember that the first position has index 0.',
      'Use bracket indexing to retrieve the item in the second position.',
      'Print the retrieved list item rather than copying the visible number into print(...).',
      'Run the cell and inspect the output.',
      'Validate the successful current version.'
    ],
    'arr-08': [
      'Create the list variable exactly as given.',
      'Use len() to calculate the number of items in the list.',
      'From that length, calculate the last valid zero-based index.',
      'Use the calculated index inside bracket indexing to retrieve the final item.',
      'Print the retrieved value. Do not hard-code the last item or its final index.',
      'Run the cell, read the terminal, and then validate.'
    ],
    'arr-09': [
      'Create the original list variable.',
      'Append the new observation to the same list before measuring its size.',
      'Apply len() to the updated list.',
      'Print the returned length instead of typing a known count directly.',
      'Press ▶ Run and verify the result came after the append operation.',
      'Validate the successful current code.'
    ],
    'arr-10': [
      'Create the list variable from all provided observations.',
      'Use max() and min() on the list variable.',
      'Subtract the minimum result from the maximum result.',
      'Print the calculated difference. Do not inspect the list and type the final range directly.',
      'Run the code and read the terminal.',
      'Validate only after the current version runs successfully.'
    ],
    'arr-11': [
      'Create the original list variable.',
      'Append the new observation to that same list first.',
      'Use sum() on the updated list, not on a manually rewritten list.',
      'Print the value returned by sum().',
      'Press ▶ Run and check the terminal.',
      'Validate the exact executed version.'
    ],
    'arr-12': [
      'Create the list variable from the four given observations.',
      'Use indexing to retrieve the first item from the list.',
      'Use indexing again to retrieve the last item from the list.',
      'Add the two retrieved values and print the calculated result.',
      'Do not copy the visible endpoint numbers into a separate direct calculation.',
      'Run the cell, inspect the output, and then validate.'
    ]
  };

  const topicAction = {
    operations: 'Build the requested calculation from variables and operators. The terminal result must be produced by the calculation, not typed as a shortcut.',
    types: 'Create the required value first, then inspect or convert its type as requested. Print the result produced by Python, not a memorized type label or value.',
    arrays: 'Build the list first and perform the requested list operation on that variable. Do not replace list processing with a copied final value.',
    logic: 'Create the given variables, build the requested comparison or logical expression, and print the Boolean produced by that expression.',
    conditions: 'Create the input values, write the requested decision structure, and place each output inside its correct indented branch. Do not bypass the decision with one unconditional print.',
    loops: 'Create the sequence and write the requested loop. If the task uses a counter or accumulator, initialize it before the loop and update it inside the loop.',
    functions: 'Write the function definition, parameters and return behavior requested by the task, then call the function with the given data. Do not replace the call with its known result.',
    statistics: 'Create the dataset and calculate the requested statistic from the data using the required Python operations. Do not type a pre-calculated statistic directly.'
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function stageIndex() {
    const active = document.querySelector('.workshop-nav-button.active');
    if (active && active.dataset.stage !== undefined) return Number(active.dataset.stage) || 0;
    const kicker = document.querySelector('.stage-kicker')?.textContent || '';
    const match = kicker.match(/Stage\s+(\d+)/i);
    return match ? Math.max(0, Number(match[1]) - 1) : 0;
  }

  function genericCodeSteps(ex) {
    return [
      'Start with the blank Python cell. Read the complete problem statement before typing.',
      'Create every variable, value, list or dataset required by the problem. Keep the supplied data unchanged unless the task explicitly tells you to modify it.',
      topicAction[topic.slug] || 'Translate the requested process into Python statements.',
      'Make only the requested result visible. The final output must be generated by your code; do not type the expected result as a literal shortcut.',
      'Press ▶ Run and read the black Python terminal. If there is an ERROR or the wrong kind/order of output, correct the relevant code and run again.',
      'After your last edit, press ▶ Run one more time so validation uses the exact current cell.',
      'Press Validate output only after the current code has run successfully.'
    ];
  }

  function applyGuidance() {
    const panel = document.querySelector('#stageMount .task-guide-panel');
    if (!panel) return;
    const index = stageIndex();
    const ex = topic.exercises[index] || topic.exercises[0];
    if (!ex || ex.mode !== 'code') return;

    const steps = arraySteps[ex.key] || genericCodeSteps(ex);
    const signature = `${ex.key}:${steps.length}`;
    const list = panel.querySelector('.task-guide-steps');
    if (!list) return;
    if (list.dataset.guidanceV28 === signature) return;

    list.dataset.guidanceV28 = signature;
    panel.dataset.guidanceV28 = ex.key;
    panel.classList.add('task-guide-panel-v28');

    const heading = panel.querySelector('.task-guide-section:nth-of-type(2) h3');
    if (heading) heading.textContent = 'Write the code yourself · follow these steps';

    list.innerHTML = steps.map((step, i) => `
      <li class="task-step-v14 task-step-v28">
        <span class="task-step-label-v14">STEP ${i + 1}</span>
        <p>${escapeHtml(step)}</p>
      </li>`).join('');

    const memory = panel.querySelector('.task-guide-memory');
    if (memory && !memory.querySelector('.authorship-note-v28')) {
      const note = document.createElement('p');
      note.className = 'authorship-note-v28';
      note.innerHTML = '<strong>Authorship rule:</strong> the cell must contain the Python process requested by the stage. A direct final-answer print is not a valid solution.';
      memory.prepend(note);
    }

    const stageProblem = document.querySelector('#stageMount .stage-problem');
    const summary = stageProblem?.querySelector('.stage-step-summary-v14');
    if (summary) {
      const strong = summary.querySelector('strong');
      const small = summary.querySelector('small');
      if (strong) strong.textContent = `Write the solution from STEP 1 → STEP ${steps.length}.`;
      if (small) small.textContent = 'No starter solution is provided. Run your own code, inspect the terminal, then validate.';
    }
  }

  const mount = document.getElementById('stageMount');
  if (!mount) return;
  new MutationObserver(() => queueMicrotask(applyGuidance)).observe(mount, {childList:true, subtree:true});
  document.addEventListener('DOMContentLoaded', () => queueMicrotask(applyGuidance));
  queueMicrotask(applyGuidance);
})();