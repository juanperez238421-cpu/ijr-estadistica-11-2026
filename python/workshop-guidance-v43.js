(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const topic = params.get('topic') || 'statistics';
  const supported = new Set(['operations', 'types']);
  if (!supported.has(topic)) return;

  const guidance = {
    'op-01': {
      concept: 'Build named variables, then combine them',
      prompt: 'Construct the solution step by step. Create a variable named first_value and assign 17. Create a second variable named second_value and assign 8. Create a third variable named total that adds the two variables. Finally, display total with print(...). Type the Python lines yourself rather than typing the final numerical answer.',
      steps: [
        'Line 1 — create the first variable: name it first_value and assign the value 17.',
        'Line 2 — create the second variable: name it second_value and assign the value 8.',
        'Line 3 — create a result variable named total. Its value must come from first_value + second_value.',
        'Line 4 — display the stored result using print(total).',
        'Press ▶ Run. Read the output. If Python reports an error, compare the variable names letter by letter before validating.'
      ],
      boxes: ['first_value = 17', 'second_value = 8', 'total = first_value + second_value', 'print(total)'],
      caption: 'A variable stores a value under a name. The final variable should depend on the earlier variables, not on a manually typed final answer.'
    },
    'op-02': {
      concept: 'Write the arithmetic expression in Python order',
      prompt: 'Use one Python print instruction. Inside print(...), write the expression 2 + 3 * 4 exactly with Python operators. Do not calculate the final number yourself. Run the cell and let Python apply multiplication before addition.',
      steps: [
        'Start with the output function print(...).',
        'Inside the parentheses, write 2 + 3 * 4.',
        'Do not add extra parentheses for this stage; the goal is to observe Python’s normal operator precedence.',
        'Press ▶ Run and inspect the displayed value before you validate.'
      ],
      boxes: ['2', '+', '3 * 4', 'print( 2 + 3 * 4 )'],
      caption: 'Python evaluates multiplication before addition unless parentheses explicitly change the order.'
    },
    'op-03': {
      concept: 'Store a value, then calculate a power',
      prompt: 'Create a variable named number with the value 9. Create a second variable named square that calculates number ** 2. Then display square with print(...).',
      steps: ['Create number = 9.','Create square = number ** 2.','Display the stored result with print(square).','Run the cell and verify that ** is used for exponentiation.'],
      boxes: ['number = 9', 'square = number ** 2', 'print(square)'],
      caption: 'The ** operator represents exponentiation in Python.'
    },
    'op-04': {
      concept: 'Represent a square root with an exponent',
      prompt: 'Create a variable named number with the value 81. Create a second variable named root that calculates number ** 0.5. Then display root.',
      steps: ['Create number = 81.','Create root = number ** 0.5.','Display root with print(root).','Run and inspect the decimal output.'],
      boxes: ['number = 81', 'root = number ** 0.5', 'print(root)'],
      caption: 'Raising a positive number to 0.5 is a Python way to calculate its square root.'
    },
    'op-05': {
      concept: 'Recognize the Python power operator',
      prompt: 'Select the symbol Python uses to raise a base to an exponent. Use the visual model below: base [operator] exponent.',
      steps: ['Read each operator option.','Look for the operator used in expressions such as x raised to 2.','Select one option and validate it.'],
      boxes: ['base', '**', 'exponent'],
      caption: 'In Python, the power operation uses a two-character operator between the base and exponent.'
    },
    'op-06': {
      concept: 'Use the notebook feedback cycle',
      prompt: 'Choose the sequence that represents productive work in a Python notebook: execute the code, inspect what happened, and correct the code only when needed.',
      steps: ['First, the student writes or edits code.','Next, the student runs the cell.','Then, the output or error is read carefully.','Only after inspection should the code be corrected or validated.'],
      boxes: ['Write', 'Run ▶', 'Inspect output / error', 'Correct or validate'],
      caption: 'A notebook is iterative: code becomes useful when you execute it and use the runtime feedback.'
    },
    'op-07': {
      concept: 'Use remainder to model leftovers',
      prompt: 'Create total_items = 29 and group_size = 6. Then create remainder = total_items % group_size. Display remainder with print(...).',
      steps: ['Create total_items = 29.','Create group_size = 6.','Create remainder = total_items % group_size.','Display print(remainder), then run the cell.'],
      boxes: ['total_items = 29', 'group_size = 6', 'remainder = total_items % group_size', 'print(remainder)'],
      caption: 'The % operator returns what remains after forming complete groups.'
    },
    'op-08': {
      concept: 'Divide a stored total by a stored number of parts',
      prompt: 'Create total = 84 and parts = 7. Create each_part = total / parts, then display each_part.',
      steps: ['Create total = 84.','Create parts = 7.','Create each_part = total / parts.','Display print(each_part) and run.'],
      boxes: ['total = 84', 'parts = 7', 'each_part = total / parts', 'print(each_part)'],
      caption: 'Using named variables makes the calculation readable and reusable.'
    },
    'op-09': {
      concept: 'Use parentheses to control the calculation order',
      prompt: 'Create first_value = 10 and second_value = 4. Create result = (first_value + second_value) * 2. Then display result.',
      steps: ['Create first_value = 10.','Create second_value = 4.','Add the two variables inside parentheses.','Multiply the parenthesized sum by 2 and store it in result.','Display print(result).'],
      boxes: ['first_value = 10', 'second_value = 4', '(first_value + second_value)', 'result = (...) * 2', 'print(result)'],
      caption: 'Parentheses force the addition to happen before multiplication.'
    },
    'op-10': {
      concept: 'Reuse an intermediate result',
      prompt: 'Create first_value = 6 and second_value = 3. Create product = first_value * second_value. Then create final_result = product + 2 and display final_result.',
      steps: ['Create first_value = 6.','Create second_value = 3.','Store their multiplication in product.','Reuse product in final_result = product + 2.','Display print(final_result).'],
      boxes: ['first_value = 6', 'second_value = 3', 'product = first_value * second_value', 'final_result = product + 2', 'print(final_result)'],
      caption: 'Intermediate variables let a later line reuse a result instead of repeating the full calculation.'
    },
    'type-01': {
      concept: 'Inspect the type of an integer value',
      prompt: 'Create a variable named value and assign 42. Create another variable named type_name that stores type(value).__name__. Then display type_name. The visual below shows the path from variable name to stored value to type inspection.',
      steps: ['Create value = 42.','Create type_name = type(value).__name__.','Display print(type_name).','Run the cell and read the type name returned by Python.'],
      boxes: ['value', '42', 'type(value).__name__', 'print(type_name)'],
      caption: 'The variable name value points to 42. Python then inspects the category of that stored value.'
    },
    'type-02': {
      concept: 'Inspect the type of a decimal value',
      prompt: 'Create value = 4.5. Create type_name = type(value).__name__. Display type_name and use the output to identify the Python type of a decimal value.',
      steps: ['Create value = 4.5.','Create type_name = type(value).__name__.','Display print(type_name).','Run and read Python’s type label.'],
      boxes: ['value', '4.5', 'type(value).__name__', 'print(type_name)'],
      caption: 'A decimal point changes how Python classifies the numeric value.'
    },
    'type-03': {
      concept: 'Create and inspect text data',
      prompt: 'Create value = "11A" including quotation marks. Create type_name = type(value).__name__, then display type_name.',
      steps: ['Create value = "11A" with quotation marks.','Create type_name = type(value).__name__.','Display print(type_name).','Run and compare the result with numeric types.'],
      boxes: ['value', '"11A"', 'type(value).__name__', 'print(type_name)'],
      caption: 'Quotation marks tell Python that 11A is text, not a variable name or number.'
    },
    'type-04': {
      concept: 'Create and inspect a Boolean value',
      prompt: 'Create value = True using the capital T and no quotation marks. Create type_name = type(value).__name__, then display type_name.',
      steps: ['Create value = True.','Do not put True inside quotation marks.','Create type_name = type(value).__name__.','Display print(type_name) and run.'],
      boxes: ['value', 'True', 'type(value).__name__', 'print(type_name)'],
      caption: 'True without quotation marks is a logical value; "True" would be text.'
    },
    'type-05': {
      concept: 'Convert text before arithmetic',
      prompt: 'Create value = "12" as text. Convert it with number = int(value). Then calculate number + 3 and display the calculated result.',
      steps: ['Create value = "12".','Convert the text using number = int(value).','Use the numeric variable in number + 3.','Display the calculation with print(number + 3).'],
      boxes: ['"12" (text)', 'int(value)', '12 (number)', 'number + 3'],
      caption: 'Conversion changes how Python interprets the same characters, enabling arithmetic after the text becomes a number.'
    },
    'type-06': {
      concept: 'Inspect the type of a missing-value marker',
      prompt: 'Create value = None with no quotation marks. Create type_name = type(value).__name__. Then display type_name.',
      steps: ['Create value = None.','Create type_name = type(value).__name__.','Display print(type_name).','Run and read the type label Python returns.'],
      boxes: ['value', 'None', 'type(value).__name__', 'print(type_name)'],
      caption: 'None is Python’s special marker for the absence of a regular value.'
    }
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }

  function activeKey() {
    const kicker = document.getElementById('problemKicker')?.textContent || '';
    const match = kicker.match(/STAGE\s+(\d+)/i);
    if (!match) return null;
    const prefix = topic === 'operations' ? 'op' : 'type';
    return `${prefix}-${String(Number(match[1])).padStart(2, '0')}`;
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

    const marker = steps.querySelector('[data-v43-step]');
    if (guidePanel.dataset.v43Signature === key && marker && prompt.textContent === entry.prompt) return;

    prompt.textContent = entry.prompt;
    concept.textContent = entry.concept;
    steps.innerHTML = entry.steps.map((step, index) => `<li data-v43-step="${index + 1}"><strong>Step ${index + 1}.</strong> ${escapeHtml(step)}</li>`).join('');

    let directive = document.getElementById('v43Directive');
    if (!directive) {
      directive = document.createElement('div');
      directive.id = 'v43Directive';
      directive.className = 'v43-directive';
      steps.before(directive);
    }
    directive.innerHTML = '<strong>Do this in your code cell:</strong> follow the construction steps in order. Type every line yourself, run it, inspect the output, and then validate.';

    let figure = document.getElementById('guideFigureV43');
    if (!figure) {
      figure = document.createElement('div');
      figure.id = 'guideFigureV43';
      figure.className = 'v43-concept-figure';
      hintBox.before(figure);
    }
    figure.innerHTML = figureHtml(entry);
    guidePanel.dataset.v43Signature = key;

    const subtitle = document.getElementById('notebookSubtitle');
    if (subtitle) subtitle.textContent = 'Guided notebook · V43 · visual step-by-step';
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
