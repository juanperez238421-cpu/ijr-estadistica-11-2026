(() => {
  'use strict';

  const arrays = window.IJR_PYTHON_HUB_TOPIC_MAP?.arrays;
  if (!arrays) return;

  const prompts = {
    'arr-01': 'Start from a blank Python cell. Create a variable named values containing [6, 10, 15, 21]. Use zero-based bracket indexing to access the item in the third position, then print the value obtained from the list. The printed result must come from the indexing operation; do not copy the visible third number into a direct print.',
    'arr-02': 'Start from a blank Python cell. Create a variable named values containing [5, 10, 15, 20]. Use Python\'s len() function on the list variable to obtain the number of items, then print that returned count. Do not count the items manually and do not print a guessed count.',
    'arr-03': 'Start from a blank Python cell. Create a variable named values containing [5, 10, 15, 20]. Use Python\'s sum() function on the complete list and print the value returned by that calculation. Do not add the visible numbers manually and do not print a pre-calculated total.',
    'arr-04': 'Start from a blank Python cell. Create a variable named values containing [8, 4, 21, 13]. Use min() and max() on the list variable. Print the minimum first and the maximum second, one output per line. Both outputs must come from the list operations rather than copied values.',
    'arr-05': 'Start from a blank Python cell. Create a variable named values containing [6, 12]. Use append() to add 18 to that same list. After the list changes, print the list variable itself. Do not type the completed list directly as the answer.',
    'arr-06': 'Start from a blank Python cell. Create a variable named values containing [10, 15, 5, 20]. Use sum() to calculate the total and len() to calculate the number of observations. Divide the sum by the length, store the calculated mean in a variable, and print that variable. Do not calculate the final mean outside Python and print it as a literal.',
    'arr-07': 'Start from a blank Python cell. Create a variable named values containing [4, 9, 16, 25]. Use zero-based bracket indexing to access the item in the second position and print the value obtained from the list. Do not copy the visible second number into a direct print.',
    'arr-08': 'Start from a blank Python cell. Create a variable named values containing [3, 7, 11, 15]. Use len() to obtain the list length, derive the last valid zero-based index from that length, then use the calculated index to access and print the last item. Do not hard-code the final item or the final index.',
    'arr-09': 'Start from a blank Python cell. Create a variable named values containing [5, 10, 15, 20]. Append 25 to the same list first. Then use len() on the updated list and print the returned count. The count must be measured after the append operation. Do not type the count directly.',
    'arr-10': 'Start from a blank Python cell. Create a variable named values containing [12, 7, 19, 10]. Use max() and min() on the list and subtract the minimum from the maximum. Print the calculated range. Do not inspect the numbers and type the range directly.',
    'arr-11': 'Start from a blank Python cell. Create a variable named values containing [2, 4, 6]. Append 8 to the same list, then use sum() on the updated list and print the calculated total. Do not type the post-append total directly.',
    'arr-12': 'Start from a blank Python cell. Create a variable named values containing [11, 22, 33, 44]. Access the first and last items through list indexing, add the two accessed values, and print the calculated result. Do not copy the visible endpoint numbers into a separate direct calculation.'
  };

  const guidance = {
    'arr-01': {
      concept: 'Use zero-based indexing to read the third item',
      steps: [
        'Create the list exactly as values = [6, 10, 15, 21].',
        'Remember that Python starts list positions at index 0, so the third item is at index 2.',
        'Create third_value = values[2] so the value comes from the list.',
        'Display the stored value with print(third_value).',
        'Run the cell, inspect the output, and then validate.'
      ],
      boxes: ['values = [6, 10, 15, 21]', 'index 2', 'third_value = values[2]', 'print(third_value)'],
      caption: 'Python lists use zero-based indexing: first → 0, second → 1, third → 2.'
    },
    'arr-02': {
      concept: 'Measure a list with len()',
      steps: [
        'Create values = [5, 10, 15, 20].',
        'Use len(values) to let Python count the items.',
        'Store that returned count in count = len(values).',
        'Display the calculated count with print(count).',
        'Run the cell, inspect the output, and then validate.'
      ],
      boxes: ['values = [5, 10, 15, 20]', 'count = len(values)', 'print(count)'],
      caption: 'len(...) returns the number of items currently stored in a list.'
    },
    'arr-03': {
      concept: 'Calculate the total with sum()',
      steps: [
        'Create values = [5, 10, 15, 20].',
        'Use Python\'s list total function: total = sum(values).',
        'Do not add the numbers manually; total must depend on the list variable.',
        'Display the calculated total with print(total).',
        'Run the cell, inspect the output, and then validate.'
      ],
      boxes: ['values = [5, 10, 15, 20]', 'total = sum(values)', 'print(total)'],
      caption: 'sum(values) calculates the total directly from every item in the list.'
    },
    'arr-04': {
      concept: 'Find the minimum and maximum from the list',
      steps: [
        'Create values = [8, 4, 21, 13].',
        'Create minimum = min(values).',
        'Create maximum = max(values).',
        'Print the minimum first with print(minimum), then print the maximum with print(maximum).',
        'Run the cell and verify that the two outputs appear on separate lines before validating.'
      ],
      boxes: ['values = [8, 4, 21, 13]', 'minimum = min(values)', 'maximum = max(values)', 'print(minimum) → print(maximum)'],
      caption: 'min(...) and max(...) inspect the list instead of requiring you to identify the extremes manually.'
    },
    'arr-05': {
      concept: 'Modify a list with append()',
      steps: [
        'Create values = [6, 12].',
        'Add the new item to that same list with values.append(18).',
        'Do not replace values with a manually completed list.',
        'Display the updated list with print(values).',
        'Run the cell, inspect the changed list, and then validate.'
      ],
      boxes: ['values = [6, 12]', 'values.append(18)', 'print(values)'],
      caption: 'append(...) changes the existing list by adding one item at the end.'
    },
    'arr-06': {
      concept: 'Build a mean from list total and list length',
      steps: [
        'Create values = [10, 15, 5, 20].',
        'Calculate total = sum(values).',
        'Calculate count = len(values).',
        'Create mean = total / count so the mean depends on the calculated total and count.',
        'Display the result with print(mean), run the cell, inspect the output, and validate.'
      ],
      boxes: ['values = [10, 15, 5, 20]', 'total = sum(values)', 'count = len(values)', 'mean = total / count', 'print(mean)'],
      caption: 'The arithmetic mean is the calculated list total divided by the number of observations.'
    },
    'arr-07': {
      concept: 'Use zero-based indexing to read the second item',
      steps: [
        'Create values = [4, 9, 16, 25].',
        'Because indexing starts at 0, the second item is at index 1.',
        'Create second_value = values[1].',
        'Display the accessed value with print(second_value).',
        'Run the cell, inspect the output, and then validate.'
      ],
      boxes: ['values = [4, 9, 16, 25]', 'index 1', 'second_value = values[1]', 'print(second_value)'],
      caption: 'Position 2 in ordinary counting corresponds to index 1 in a Python list.'
    },
    'arr-08': {
      concept: 'Calculate the last valid index from len()',
      steps: [
        'Create values = [3, 7, 11, 15].',
        'Calculate last_index = len(values) - 1.',
        'Use the calculated index to access last_value = values[last_index].',
        'Display the accessed value with print(last_value).',
        'Run the cell, inspect the output, and then validate.'
      ],
      boxes: ['values = [3, 7, 11, 15]', 'last_index = len(values) - 1', 'last_value = values[last_index]', 'print(last_value)'],
      caption: 'For zero-based indexing, the final valid index is always one less than the list length.'
    },
    'arr-09': {
      concept: 'Append first, then measure the updated list',
      steps: [
        'Create values = [5, 10, 15, 20].',
        'Modify the same list with values.append(25).',
        'After the append operation, calculate count = len(values).',
        'Display the updated count with print(count).',
        'Run the cell and confirm that len(...) is evaluated after append(...) before validating.'
      ],
      boxes: ['values = [5, 10, 15, 20]', 'values.append(25)', 'count = len(values)', 'print(count)'],
      caption: 'The list length changes after append(...), so calculate len(values) only after the list has been updated.'
    },
    'arr-10': {
      concept: 'Calculate statistical range from max() and min()',
      steps: [
        'Create values = [12, 7, 19, 10].',
        'Calculate maximum = max(values).',
        'Calculate minimum = min(values).',
        'Create data_range = maximum - minimum.',
        'Display print(data_range), run the cell, inspect the output, and validate.'
      ],
      boxes: ['values = [12, 7, 19, 10]', 'maximum = max(values)', 'minimum = min(values)', 'data_range = maximum - minimum', 'print(data_range)'],
      caption: 'Statistical range is calculated as the maximum value minus the minimum value.'
    },
    'arr-11': {
      concept: 'Update the list before calculating its total',
      steps: [
        'Create values = [2, 4, 6].',
        'Add the new observation with values.append(8).',
        'Calculate total = sum(values) only after the append operation.',
        'Display the calculated total with print(total).',
        'Run the cell, inspect the output, and then validate.'
      ],
      boxes: ['values = [2, 4, 6]', 'values.append(8)', 'total = sum(values)', 'print(total)'],
      caption: 'sum(values) uses the current list, including any item added before the calculation.'
    },
    'arr-12': {
      concept: 'Combine values obtained through list indexing',
      steps: [
        'Create values = [11, 22, 33, 44].',
        'Access the first item with first_value = values[0].',
        'Access the last item with last_value = values[-1].',
        'Create result = first_value + last_value so the calculation uses the accessed list values.',
        'Display print(result), run the cell, inspect the output, and validate.'
      ],
      boxes: ['values = [11, 22, 33, 44]', 'first_value = values[0]', 'last_value = values[-1]', 'result = first_value + last_value', 'print(result)'],
      caption: 'Index 0 accesses the first item; index -1 is Python shorthand for the last item.'
    }
  };

  for (const exercise of arrays.exercises || []) {
    if (prompts[exercise.key]) exercise.prompt = prompts[exercise.key];
  }

  window.IJR_PYTHON_HUB_ARRAY_PROMPTS_V28 = Object.freeze({
    topic: 'arrays',
    stages: Object.keys(prompts).length,
    blankCellAuthorship: true
  });

  window.IJR_PYTHON_HUB_ARRAY_GUIDANCE_V47 = Object.freeze({
    topic: 'arrays',
    stages: Object.keys(guidance).length,
    explicitSteps: true,
    visualModels: true,
    entries: guidance
  });

  if (typeof document === 'undefined' || typeof MutationObserver !== 'function' || typeof requestAnimationFrame !== 'function') return;

  const params = new URLSearchParams(location.search);
  if ((params.get('topic') || '') !== 'arrays') return;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }

  function activeKey() {
    const kicker = document.getElementById('problemKicker')?.textContent || '';
    const match = kicker.match(/STAGE\s+(\d+)/i);
    if (!match) return null;
    return `arr-${String(Number(match[1])).padStart(2, '0')}`;
  }

  function figureHtml(entry) {
    const nodes = (entry.boxes || []).map((box, index) => {
      const arrow = index < entry.boxes.length - 1 ? '<span class="v43-figure-arrow" aria-hidden="true">→</span>' : '';
      return `<span class="v43-figure-node"><code>${escapeHtml(box)}</code></span>${arrow}`;
    }).join('');
    return `<div class="v43-figure-title">Visual model</div><div class="v43-figure-flow">${nodes}</div><p class="v43-figure-caption">${escapeHtml(entry.caption || '')}</p>`;
  }

  function enhance() {
    const key = activeKey();
    const entry = key ? guidance[key] : null;
    if (!entry) return;

    const prompt = document.getElementById('problemPrompt');
    const concept = document.getElementById('guideConcept');
    const steps = document.getElementById('guideSteps');
    const guidePanel = document.getElementById('guidePanel');
    const hintBox = document.getElementById('hintBox');
    if (!prompt || !concept || !steps || !guidePanel || !hintBox) return;

    const marker = steps.querySelector('[data-array-v47-step]');
    if (guidePanel.dataset.arrayV47Signature === key && marker && prompt.textContent === prompts[key]) return;

    if (prompts[key]) prompt.textContent = prompts[key];
    concept.textContent = entry.concept;
    steps.innerHTML = entry.steps.map((step, index) => `<li data-array-v47-step="${index + 1}"><strong>Step ${index + 1}.</strong> ${escapeHtml(step)}</li>`).join('');

    let directive = document.getElementById('arrayV47Directive');
    if (!directive) {
      directive = document.createElement('div');
      directive.id = 'arrayV47Directive';
      directive.className = 'v43-directive';
      steps.before(directive);
    }
    directive.innerHTML = '<strong>Do this in your code cell:</strong> follow the construction steps in order. Type every line yourself, run it, inspect the output, and then validate.';

    let figure = document.getElementById('guideFigureArrayV47');
    if (!figure) {
      figure = document.createElement('div');
      figure.id = 'guideFigureArrayV47';
      figure.className = 'v43-concept-figure';
      hintBox.before(figure);
    }
    figure.innerHTML = figureHtml(entry);
    guidePanel.dataset.arrayV47Signature = key;

    const subtitle = document.getElementById('notebookSubtitle');
    if (subtitle) subtitle.textContent = 'Guided notebook · V47 · arrays step-by-step';
  }

  let queued = false;
  function scheduleEnhance() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      enhance();
    });
  }

  const observer = new MutationObserver(scheduleEnhance);
  const start = () => {
    const app = document.getElementById('workshopApp');
    if (app) observer.observe(app, {subtree:true, childList:true, characterData:true});
    scheduleEnhance();
    document.addEventListener('click', event => {
      if (event.target.closest('[data-stage], #previousButton, #nextButton, #hintButton, #resetButton')) scheduleEnhance();
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
