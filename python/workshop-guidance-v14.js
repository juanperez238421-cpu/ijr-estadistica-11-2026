(() => {
  'use strict';

  const topicMap = window.IJR_PYTHON_HUB_TOPIC_MAP || {};
  const requested = new URLSearchParams(location.search).get('topic') || 'operations';
  const topic = topicMap[requested];
  if (!topic) return;

  const explicitSteps = {
    'op-01': [
      'Create the first variable and assign the value 17 to it.',
      'Create the second variable and assign the value 8 to it.',
      'Create a third variable. Make this variable equal to the first variable plus the second variable.',
      'Display only the third variable so Python shows the calculated result.',
      'Press ▶ Run.',
      'Read the black Python terminal. Confirm that one numeric result appears and that there is no ERROR.',
      'If you change the cell, run it again. Then press Validate output.'
    ],
    'op-02': [
      'Start with the blank Python cell.',
      'Build one arithmetic expression using the numbers 2, 3 and 4.',
      'Use addition between 2 and the rest of the expression, and multiplication between 3 and 4.',
      'Do not calculate the final number yourself and type only that number. Python must perform the operation.',
      'Make the expression visible as an output, then press ▶ Run.',
      'Check the terminal and verify that Python applied multiplication before addition.',
      'If the output is correct and there is no ERROR, press Validate output.'
    ],
    'op-03': [
      'Create a variable and assign the value 9 to it.',
      'Create a second expression that uses the variable, not the number copied again.',
      'Use Python exponentiation with exponent 2 to calculate the square.',
      'Display the result of the exponentiation.',
      'Press ▶ Run and read the black terminal.',
      'Correct any syntax error and run the current version again before validating.',
      'Press Validate output after the successful run.'
    ],
    'op-04': [
      'Create a variable and assign the value 81 to it.',
      'Use that variable in a new expression.',
      'Represent square root as a fractional power with exponent 0.5.',
      'Display the result of that square-root expression.',
      'Press ▶ Run.',
      'Check that the terminal shows one numeric result and no ERROR.',
      'Press Validate output only after the current cell has run successfully.'
    ],
    'op-05': [
      'Read the four operator symbols shown in the answer choices.',
      'Recall the operator Python uses for exponentiation from the theory page.',
      'If you are unsure, use the black scratch terminal to test a very small power expression with a candidate operator.',
      'Select only the symbol that Python accepts for exponentiation.',
      'Press Validate answer and read the feedback.'
    ],
    'op-06': [
      'Read every proposed notebook workflow from beginning to end.',
      'Identify the option that begins by running the code before validating it.',
      'Check that the same option includes reading the output and correcting the code when needed.',
      'Select the workflow that matches the class cycle: run → inspect → correct when necessary.',
      'Press Validate answer.'
    ],
    'op-07': [
      'Create one variable for the total number of items and assign 29 to it.',
      'Create a second variable for the size of each complete group and assign 6 to it.',
      'Use the remainder operator between those two variables.',
      'Store or display only the remainder produced by that operation.',
      'Press ▶ Run and inspect the black terminal.',
      'If you edit the cell, run it again so the terminal matches the current code.',
      'Press Validate output after the successful run.'
    ],
    'op-08': [
      'Create one variable for the total and assign 84 to it.',
      'Create a second variable for the number of equal parts and assign 7 to it.',
      'Create a third variable that divides the total by the number of parts.',
      'Display that third variable.',
      'Press ▶ Run and read the terminal.',
      'Confirm that Python produced one numeric result and no ERROR.',
      'Press Validate output.'
    ],
    'op-09': [
      'Create one variable and assign 10 to it.',
      'Create a second variable and assign 4 to it.',
      'Build an expression in which the two variables are added first.',
      'Place that addition inside parentheses.',
      'Multiply the parenthesized sum by 2 and display the final result.',
      'Press ▶ Run and inspect the black terminal.',
      'After any correction, run again and then press Validate output.'
    ],
    'op-10': [
      'Create the first variable and assign 6 to it.',
      'Create the second variable and assign 3 to it.',
      'Create a third variable that stores the product of the first two variables.',
      'Create a later expression that reuses the third variable and adds 2 to it.',
      'Display only the result of that later expression.',
      'Press ▶ Run and verify the terminal output.',
      'If the current run is successful, press Validate output.'
    ],

    'type-01': [
      'Read the provided variable and confirm that its stored value is 42.',
      'Use Python type inspection on that variable.',
      'Request the short type name rather than the full Python class representation.',
      'Display that short type name.',
      'Press ▶ Run and read the black terminal.',
      'Confirm that the output is a type name, then press Validate output.'
    ],
    'type-02': [
      'Read the provided variable and notice that its value contains a decimal point.',
      'Inspect the variable with Python type inspection.',
      'Request the short type name.',
      'Display the result.',
      'Press ▶ Run and check the terminal.',
      'Validate after the type name appears without ERROR.'
    ],
    'type-03': [
      'Read the provided variable and notice that the value is text inside quotation marks.',
      'Inspect the variable with Python type inspection.',
      'Request the short type name.',
      'Display that type name.',
      'Press ▶ Run and inspect the black terminal.',
      'Validate the successful output.'
    ],
    'type-04': [
      'Read the provided variable and identify that the stored value is a Boolean value.',
      'Inspect the variable with Python type inspection.',
      'Request the short type name.',
      'Display the result.',
      'Press ▶ Run and read the terminal.',
      'Validate after Python reports the expected category without ERROR.'
    ],
    'type-05': [
      'Start with the provided text value "12".',
      'Convert that text value to an integer before doing arithmetic.',
      'Store the converted numeric value in a variable.',
      'Add 3 to the converted number.',
      'Display only the arithmetic result.',
      'Press ▶ Run, inspect the terminal, and then validate.'
    ],
    'type-06': [
      'Read the provided variable whose value is None.',
      'Inspect that variable with Python type inspection.',
      'Request the short type name.',
      'Display the type name.',
      'Press ▶ Run and inspect the terminal.',
      'Validate after the output appears without ERROR.'
    ],

    'arr-01': [
      'Read the complete list and keep the values in the order shown.',
      'Remember that Python list indexes begin at 0.',
      'Determine which index corresponds to the third position in the list.',
      'Access the third value through its index instead of copying the visible number.',
      'Display that indexed value.',
      'Press ▶ Run, read the terminal, and validate the successful output.'
    ],
    'arr-02': [
      'Read the provided list.',
      'Use the Python operation that returns the number of items in a list.',
      'Apply that operation to the complete list variable.',
      'Display the resulting count.',
      'Press ▶ Run and inspect the terminal.',
      'Validate after the count appears without ERROR.'
    ],
    'arr-03': [
      'Read the complete list of values.',
      'Use the Python operation that adds all items in a numeric list.',
      'Apply it to the list variable rather than adding every number manually.',
      'Display the total.',
      'Press ▶ Run and inspect the black terminal.',
      'Validate the successful result.'
    ],
    'arr-04': [
      'Read the complete list.',
      'Find the minimum using Python’s list-summary operation.',
      'Find the maximum using Python’s list-summary operation.',
      'Display the minimum first.',
      'Display the maximum on the next line.',
      'Press ▶ Run, verify the two-line order, and then validate.'
    ],
    'arr-05': [
      'Read the original list before changing it.',
      'Append the new value 18 to the existing list.',
      'Do not create a separate unrelated list for the new value.',
      'Display the complete list after the append operation.',
      'Press ▶ Run and confirm the new item appears at the end.',
      'Validate the successful output.'
    ],
    'arr-06': [
      'Read the complete numeric list.',
      'Calculate the total with the list-sum operation.',
      'Calculate the number of observations with the list-length operation.',
      'Divide the total by the number of observations.',
      'Store or display the resulting mean.',
      'Press ▶ Run, inspect the terminal, and validate.'
    ],

    'logic-01': [
      'Read the provided score value.',
      'Build or inspect the comparison that asks whether the score is at least 70.',
      'Use a greater-than-or-equal comparison, not assignment.',
      'Display the Boolean result.',
      'Press ▶ Run and confirm the terminal shows True or False.',
      'Validate the successful Boolean output.'
    ],
    'logic-02': [
      'Read the provided group text.',
      'Compare that value with the text "11A".',
      'Use the equality-comparison operator rather than the assignment operator.',
      'Display the Boolean result.',
      'Press ▶ Run and read the terminal.',
      'Validate after the Boolean output appears.'
    ],
    'logic-03': [
      'Read the provided status text.',
      'Compare it with the text "done".',
      'Use the operator that asks whether two values are different.',
      'Display the Boolean result.',
      'Press ▶ Run and inspect the terminal.',
      'Validate the successful output.'
    ],
    'logic-04': [
      'Read both provided values: score and attendance.',
      'Create the first comparison for score being at least 70.',
      'Create the second comparison for attendance being at least 0.80.',
      'Combine both comparisons with the logical operator that requires both conditions to be true.',
      'Display the combined Boolean result.',
      'Press ▶ Run, inspect the terminal, and validate.'
    ],
    'logic-05': [
      'Read the value stored in x.',
      'Create one comparison asking whether x is negative.',
      'Create a second comparison asking whether x is greater than 100.',
      'Combine the two comparisons with the logical operator that accepts either condition.',
      'Display the final Boolean result.',
      'Press ▶ Run and validate the successful output.'
    ],
    'logic-06': [
      'Read all four operator choices.',
      'Separate the idea of assigning a value from the idea of checking whether two values are equal.',
      'Recall the equality-comparison operator from the theory page.',
      'Select only the operator that performs the comparison.',
      'Press Validate answer.'
    ],

    'cond-01': [
      'Read the provided score value.',
      'Evaluate the condition that checks whether the score reaches the passing threshold.',
      'Keep the action that belongs to the true branch indented under the if statement.',
      'Keep the alternative action indented under the else branch.',
      'Press ▶ Run and verify that only one branch prints.',
      'Read the terminal output and then validate.'
    ],
    'cond-02': [
      'Read the provided score value.',
      'Check the first condition for the highest outcome.',
      'If the first condition is false, check the elif condition for the middle outcome.',
      'Use the else branch only for the remaining case.',
      'Keep each branch action correctly indented.',
      'Press ▶ Run, verify the selected branch, and validate.'
    ],
    'cond-03': [
      'Read the text stored in the room variable.',
      'Compare the room value with the text "physics".',
      'Use that comparison as the if condition.',
      'Keep the requested output inside the true branch and the alternative output inside else.',
      'Press ▶ Run and inspect which branch executes.',
      'Validate the successful output.'
    ],
    'cond-04': [
      'Read the provided age and has_id values.',
      'Create or inspect the first condition: age must be at least 16.',
      'Use the Boolean has_id value as the second condition.',
      'Combine the two requirements so both must be satisfied.',
      'Keep the enter/wait actions inside the correct indented branches.',
      'Press ▶ Run, inspect the terminal, and validate.'
    ],
    'cond-05': [
      'Read the question about indentation inside an if block.',
      'Recall that indentation identifies the statements controlled by a condition.',
      'Compare the four choices and identify which kind of line belongs inside the branch.',
      'Select one answer.',
      'Press Validate answer.'
    ],
    'cond-06': [
      'Read the question about the remaining case after if and elif.',
      'Recall the three-part decision structure from the theory page.',
      'Identify the keyword used when none of the previous conditions matched.',
      'Select one answer.',
      'Press Validate answer.'
    ],

    'loop-01': [
      'Read the provided list.',
      'Start a for loop that visits one value from the list at a time.',
      'Use one loop variable to represent the current item.',
      'Indent the print action so it runs once for every item.',
      'Press ▶ Run and confirm each list value appears on its own line.',
      'Validate the successful output.'
    ],
    'loop-02': [
      'Read the provided numeric list.',
      'Create the running total before the loop and initialize it to 0.',
      'Loop through every value in the list.',
      'Inside the loop, add the current value to the running total.',
      'After the loop finishes, display the total.',
      'Press ▶ Run, inspect the terminal, and validate.'
    ],
    'loop-03': [
      'Read the provided list.',
      'Create a counter before the loop and initialize it to 0.',
      'Loop through every value in the list.',
      'Inside the loop, check whether the current value is greater than 10.',
      'Increase the counter only when that condition is true.',
      'After the loop, display the counter, run the cell, and validate.'
    ],
    'loop-04': [
      'Use a for loop with range(4).',
      'Use one loop variable for the current value produced by range.',
      'Indent the print action inside the loop.',
      'Press ▶ Run.',
      'Confirm that the terminal shows one value per line in the sequence produced by range(4).',
      'Validate the successful output.'
    ],
    'loop-05': [
      'Read all four statements about when a for loop is useful.',
      'Recall that a for loop is designed to repeat the same process across items in a sequence.',
      'Eliminate choices that describe one-time actions or arbitrary restrictions.',
      'Select the statement that matches repeated processing.',
      'Press Validate answer.'
    ],
    'loop-06': [
      'Read the question about where a running total should begin.',
      'Recall that an accumulator should start once before repeated updates happen.',
      'Check each placement option against that rule.',
      'Select the placement that avoids resetting the total during every iteration.',
      'Press Validate answer.'
    ],

    'fn-01': [
      'Define one function whose job is to add two inputs.',
      'Give the function two parameters.',
      'Inside the indented function body, return the sum of those parameters.',
      'Call the function with 4 and 6.',
      'Display the value returned by that call.',
      'Press ▶ Run, inspect the terminal, and validate.'
    ],
    'fn-02': [
      'Define a function that receives one list parameter.',
      'Inside the function, calculate the list total.',
      'Calculate the number of items in the list.',
      'Return total divided by count.',
      'Call the function with the provided list and display the returned value.',
      'Press ▶ Run and validate the successful output.'
    ],
    'fn-03': [
      'Define one square function with one input parameter.',
      'Inside the function, return the input raised to the second power.',
      'Call the same function once with 3.',
      'Call the same function again with 5.',
      'Display both returned values, one per line.',
      'Press ▶ Run, inspect the terminal, and validate.'
    ],
    'fn-04': [
      'Define one function with two parameters.',
      'Inside the function, compare the two parameters using the maximum operation.',
      'Return that larger value.',
      'Call the function with 7 and 12.',
      'Display the returned result.',
      'Press ▶ Run and validate the successful output.'
    ],
    'fn-05': [
      'Read all four descriptions of return.',
      'Recall the difference between displaying something and sending a value back from a function.',
      'Identify the description that explains what the caller receives from the function.',
      'Select one answer.',
      'Press Validate answer.'
    ],
    'fn-06': [
      'Read the four keyword choices.',
      'Recall the Python syntax used to begin a function definition.',
      'Do not confuse the keyword that starts the definition with the keyword used to send a result back.',
      'Select one answer.',
      'Press Validate answer.'
    ],

    'stat-01': [
      'Read the complete dataset list.',
      'Calculate the number of observations using the list-length operation.',
      'Display that count on the first output line.',
      'Calculate the total of the observations using the list-sum operation.',
      'Display that total on the second output line.',
      'Press ▶ Run, verify the two-line order, and validate.'
    ],
    'stat-02': [
      'Read the complete dataset list.',
      'Calculate the total of all observations.',
      'Calculate the number of observations.',
      'Divide the total by the number of observations to obtain the mean.',
      'Display the mean.',
      'Press ▶ Run, inspect the terminal, and validate.'
    ],
    'stat-03': [
      'Read the complete dataset list.',
      'Find the maximum observation.',
      'Find the minimum observation.',
      'Subtract the minimum from the maximum.',
      'Display the resulting statistical range.',
      'Press ▶ Run and validate the successful output.'
    ],
    'stat-04': [
      'Read the complete dataset list.',
      'Calculate the mean of the dataset first.',
      'Create a counter before the loop and initialize it to 0.',
      'Loop through each observation.',
      'For each observation, check whether it is greater than the mean.',
      'Increase the counter only when that condition is true.',
      'After the loop, display the counter, press ▶ Run, and validate.'
    ],
    'stat-05': [
      'Define a summary function that receives one list of observations.',
      'Inside the function, calculate the mean.',
      'Inside the same function, calculate the range as maximum minus minimum.',
      'Return both summary values from the function.',
      'Call the function with the provided dataset.',
      'Display the returned pair, press ▶ Run, and validate.'
    ],
    'stat-06': [
      'Read the four proposed meanings of statistical range.',
      'Remember that this question is about descriptive statistics, not Python range().',
      'Identify the definition that compares the largest and smallest observations.',
      'Select one answer.',
      'Press Validate answer.'
    ]
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

  function getCurrentExercise() {
    const index = stageIndex();
    return { index, ex: topic.exercises[index] || topic.exercises[0] };
  }

  function renderExplicitSteps() {
    const panel = document.querySelector('#stageMount .task-guide-panel');
    if (!panel) return;
    const { index, ex } = getCurrentExercise();
    if (!ex) return;
    const steps = explicitSteps[ex.key];
    if (!steps || !steps.length) return;
    if (panel.dataset.guidanceV14 === ex.key) return;

    panel.dataset.guidanceV14 = ex.key;
    panel.classList.add('task-guide-panel-v14');
    const heading = panel.querySelector('.task-guide-section:nth-of-type(2) h3');
    if (heading) heading.textContent = 'Follow these steps in order';

    const list = panel.querySelector('.task-guide-steps');
    if (list) {
      list.innerHTML = steps.map((step, i) => `
        <li class="task-step-v14">
          <span class="task-step-label-v14">STEP ${i + 1}</span>
          <p>${escapeHtml(step)}</p>
        </li>`).join('');
    }

    const objective = panel.querySelector('.task-guide-objective p');
    if (objective) {
      objective.innerHTML = `<strong>${escapeHtml(ex.title)}</strong><br><span>${escapeHtml(ex.prompt)}</span>`;
    }

    const stageProblem = document.querySelector('#stageMount .stage-problem');
    if (stageProblem) {
      const existing = stageProblem.querySelector('.stage-step-summary-v14');
      if (existing) existing.remove();
      const prompt = stageProblem.querySelector(':scope > p');
      if (prompt) prompt.classList.add('stage-prompt-secondary-v14');
      const summary = document.createElement('div');
      summary.className = 'stage-step-summary-v14';
      summary.innerHTML = `<span>Start here</span><strong>Follow STEP 1 → STEP ${steps.length} in the Task Guide.</strong><small>Complete the steps in order, run the current code, read the black terminal, then validate.</small>`;
      const status = stageProblem.querySelector('.stage-status-row');
      if (status) stageProblem.insertBefore(summary, status); else stageProblem.appendChild(summary);
    }
  }

  const mount = document.getElementById('stageMount');
  if (!mount) return;
  new MutationObserver(renderExplicitSteps).observe(mount, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', renderExplicitSteps);
  renderExplicitSteps();
})();
