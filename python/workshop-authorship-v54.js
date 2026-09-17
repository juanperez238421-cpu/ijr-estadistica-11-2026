(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const topicSlug = params.get('topic') || 'statistics';
  const masterPreview = params.get('masterPreview') === '1';

  const CHALLENGES = Object.freeze({
    'op-01': 'Use 17 and 8 as two stored inputs. Calculate their sum from the stored values, save the result, and display only the computed result. Choose and type the Python syntax yourself.',
    'op-02': 'Write one Python instruction that displays the result of 2 + 3 × 4 using Python’s normal order of operations. Do not calculate and type the final number yourself.',
    'op-03': 'Store 9, calculate its square from the stored value, and display the computed result. Decide how Python represents exponentiation.',
    'op-04': 'Store 81, calculate its square root from the stored value using the exponent idea studied in theory, and display the computed result.',
    'op-07': 'A total contains 29 items and complete groups contain 6 each. Store both quantities, calculate the leftover items with the appropriate Python operator, and display the result.',
    'op-08': 'A total of 84 is divided into 7 equal parts. Store both quantities, calculate one part from the stored values, and display the result.',
    'op-09': 'Use stored values 10 and 4. Add them first, then multiply that sum by 2. Make the intended order explicit and display the result.',
    'op-10': 'Use stored values 6 and 3. Calculate and save their product, then reuse that intermediate result in a second calculation that adds 2. Display only the final result.',

    'type-01': 'Store the integer 42. Ask Python for the short name of the stored value’s data type and display that type name. Write the inspection syntax yourself.',
    'type-02': 'Store the decimal value 4.5. Ask Python for the short name of its data type and display the type name.',
    'type-03': 'Store 11A as text. Inspect the stored value’s data type and display the short type name.',
    'type-04': 'Store the Boolean value True, not text that merely looks like True. Inspect its data type and display the short type name.',
    'type-05': 'Start with the characters 12 stored as text. Convert that value to an integer, add 3 to the converted value, and display the computed result.',
    'type-06': 'Store Python’s missing-value marker. Inspect its data type and display the short type name.',

    'arr-01': 'Use [6, 10, 15, 21] as one list. Obtain the third observation by list position, not by copying the visible number, and display the value retrieved from the list.',
    'arr-02': 'Use [5, 10, 15, 20] as one list. Let Python determine how many observations the list contains and display that count.',
    'arr-03': 'Use [5, 10, 15, 20] as one list. Let Python calculate the total from the complete list and display the calculated total.',
    'arr-04': 'Use [8, 4, 21, 13] as one list. Obtain its minimum and maximum with Python and display them in that order, one per line.',
    'arr-05': 'Begin with [6, 12]. Add 18 to that same list using a list operation, then display the updated list. Do not replace it with a manually completed list.',
    'arr-06': 'Use [10, 15, 5, 20]. Calculate the arithmetic mean from a Python-computed total and a Python-computed number of observations, then display the mean.',
    'arr-07': 'Use [4, 9, 16, 25]. Obtain the second observation by list position, not by copying the visible number, and display the value retrieved from the list.',
    'arr-08': 'Use [3, 7, 11, 15]. Determine the list length, derive the last valid zero-based position from that length, then use the derived position to obtain and display the final observation.',
    'arr-09': 'Begin with [5, 10, 15, 20]. Add 25 to the same list first. After the list changes, let Python measure its new length and display that count.',
    'arr-10': 'Use [12, 7, 19, 10]. Calculate the statistical range from values obtained from the list itself and display the computed range.',
    'arr-11': 'Begin with [2, 4, 6]. Add 8 to the same list, then calculate the total from the updated list and display that total.',
    'arr-12': 'Use [11, 22, 33, 44]. Obtain the first and last observations through list indexing, combine the retrieved values, and display the calculated result.',

    'logic-01': 'Load the provided class Excel workbook through the Files panel. Use Pandas to create a DataFrame named df, inspect its first records, then display a Boolean computed from df that confirms at least one observation was loaded.',
    'logic-02': 'Using df, inspect the column names. Display a Boolean derived from the DataFrame that answers whether the score variable exists. Do not hard-code the final Boolean.',
    'logic-03': 'Using df, build one Boolean check for at least one row and another for the score variable. Combine the two Boolean results with logical AND and display the result.',
    'logic-04': 'Use the score data in df to determine whether at least one observation reaches 90 or more. Combine that data-derived Boolean with OR False, then display the result.',
    'logic-05': 'Sort the DataFrame by score in ascending order and inspect it. Use a decision structure: when rows exist, display Pandas’ check that the score Series is increasing; otherwise display False.',
    'logic-06': 'Create a Boolean variable in df that marks scores of at least 90. Inspect the original and derived variables, then use a three-branch decision to report created, review, or missing according to whether the new variable exists.',
    'logic-07': 'Create a one-column DataFrame named selected containing only score and inspect it. Use a two-branch decision to report selected when its first column is score, and review otherwise.',
    'logic-08': 'Create a DataFrame named filtered containing only observations with score at least 90. Inspect the result and display its number of rows. If the required data are unavailable, use 0 as the fallback output.',
    'logic-09': 'Determine from the DataFrame whether score is missing. Use that Boolean inside a two-branch decision with logical NOT so the program reports score ready when the variable is available and review otherwise.',
    'logic-12': 'Explain why an analyst should inspect sheets, dimensions, column names, data types, and first records immediately after loading an unfamiliar Excel workbook.'
  });

  let queued = false;
  let noticeTimer = null;

  function getActiveExercise() {
    const kicker = document.getElementById('problemKicker')?.textContent || '';
    const match = kicker.match(/STAGE\s+(\d+)/i);
    const index = match ? Math.max(0, Number(match[1]) - 1) : 0;
    return window.IJR_PYTHON_HUB_TOPIC_MAP?.[topicSlug]?.exercises?.[index] || null;
  }

  function getOrCreate(id, tag, className) {
    let node = document.getElementById(id);
    if (!node) {
      node = document.createElement(tag);
      node.id = id;
      if (className) node.className = className;
    }
    return node;
  }

  function hideLegacyCodeHelp() {
    const prompt = document.getElementById('problemPrompt');
    const steps = document.getElementById('guideSteps');
    const hintButton = document.getElementById('hintButton');
    const hintBox = document.getElementById('hintBox');
    if (prompt) prompt.hidden = true;
    if (steps) steps.hidden = true;
    if (hintButton) hintButton.hidden = true;
    if (hintBox) hintBox.style.display = 'none';
    ['v43Directive', 'arrayV47Directive', 'guideFigureV43', 'guideFigureArrayV47'].forEach(id => {
      const node = document.getElementById(id);
      if (node) node.hidden = true;
    });
  }

  function restoreLegacyChoiceHelp() {
    const prompt = document.getElementById('problemPrompt');
    const steps = document.getElementById('guideSteps');
    const hintButton = document.getElementById('hintButton');
    const hintBox = document.getElementById('hintBox');
    if (prompt) prompt.hidden = false;
    if (steps) steps.hidden = false;
    if (hintButton) hintButton.hidden = false;
    if (hintBox) hintBox.style.display = '';
    ['v43Directive', 'arrayV47Directive', 'guideFigureV43', 'guideFigureArrayV47'].forEach(id => {
      const node = document.getElementById(id);
      if (node) node.hidden = false;
    });
  }

  function renderCodeChallenge(exercise) {
    hideLegacyCodeHelp();
    const panel = document.getElementById('guidePanel');
    if (panel?.dataset.authorshipV54 === exercise.key) return;

    const legacyPrompt = document.getElementById('problemPrompt');
    const prompt = getOrCreate('authorshipPromptV54', 'p', 'problem-prompt');
    if (legacyPrompt?.parentNode && prompt.parentNode !== legacyPrompt.parentNode) legacyPrompt.after(prompt);
    prompt.hidden = false;
    prompt.textContent = CHALLENGES[exercise.key] || exercise.prompt || 'Solve the stage from a blank Python cell and derive the requested output from the supplied data.';

    const legacySteps = document.getElementById('guideSteps');
    const steps = getOrCreate('authorshipGuideStepsV54', 'ol', 'guide-steps');
    if (legacySteps?.parentNode && steps.parentNode !== legacySteps.parentNode) legacySteps.after(steps);
    steps.hidden = false;
    steps.innerHTML = [
      'Identify the given data and the exact output the stage asks for.',
      'Choose the Python concept or operation that connects the data to that output. Use Theory only as a syntax reference.',
      'Write the complete solution yourself in the blank code cell, one line at a time. The workshop does not provide executable solution lines.',
      'Run the cell, inspect the output or error, correct your own code, and validate only when you can explain why it works.'
    ].map((text, index) => `<li><strong>Step ${index + 1}.</strong> ${text}</li>`).join('');

    const directive = getOrCreate('authorshipDirectiveV54', 'div', 'v43-directive');
    if (steps.parentNode && directive.parentNode !== steps.parentNode) steps.after(directive);
    directive.hidden = false;
    directive.innerHTML = '<strong>Manual-entry mode:</strong> the challenge tells you what to achieve, not the finished Python code. Build the solution yourself.';

    if (panel) panel.dataset.authorshipV54 = exercise.key;
  }

  function renderChoiceStage() {
    restoreLegacyChoiceHelp();
    ['authorshipPromptV54', 'authorshipGuideStepsV54', 'authorshipDirectiveV54'].forEach(id => {
      const node = document.getElementById(id);
      if (node) node.hidden = true;
    });
    const panel = document.getElementById('guidePanel');
    if (panel) delete panel.dataset.authorshipV54;
  }

  function showPasteNotice() {
    const editor = document.getElementById('codeEditor');
    if (!editor) return;
    const notice = getOrCreate('authorshipPasteNoticeV54', 'div', 'hint-box');
    if (notice.parentNode !== editor.parentNode) editor.after(notice);
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    notice.textContent = 'Paste is disabled in student code cells. Type the solution yourself so validation reflects your own work.';
    notice.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { notice.hidden = true; }, 2600);
  }

  function installManualEntryGuard() {
    if (masterPreview) return;
    const editor = document.getElementById('codeEditor');
    if (!editor || editor.dataset.manualEntryV54 === 'true') return;
    editor.dataset.manualEntryV54 = 'true';

    const blockTransfer = event => {
      event.preventDefault();
      event.stopPropagation();
      showPasteNotice();
    };

    editor.addEventListener('paste', blockTransfer, true);
    editor.addEventListener('drop', blockTransfer, true);
    editor.addEventListener('beforeinput', event => {
      if (event.inputType === 'insertFromPaste' || event.inputType === 'insertFromDrop') blockTransfer(event);
    }, true);
  }

  function apply() {
    installManualEntryGuard();
    const exercise = getActiveExercise();
    if (!exercise) return;
    if (exercise.mode === 'code') renderCodeChallenge(exercise);
    else renderChoiceStage();
  }

  function scheduleApply() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  }

  function start() {
    installManualEntryGuard();
    const app = document.getElementById('workshopApp');
    if (app && typeof MutationObserver === 'function') {
      const observer = new MutationObserver(scheduleApply);
      observer.observe(app, { subtree: true, childList: true, characterData: true });
    }
    document.addEventListener('click', event => {
      if (event.target.closest('[data-stage], #previousButton, #nextButton, #resetButton')) scheduleApply();
    });
    scheduleApply();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
