(() => {
  'use strict';

  const VERSION = 'v45';
  const params = new URLSearchParams(location.search);
  if ((params.get('topic') || 'statistics') !== 'statistics') return;

  const guideSteps = [
    'Open the Files panel and click <strong>Use class dataset</strong>. This mounts a real <code>.xlsx</code> workbook into the same Python runtime used by the code cell.',
    'Import pandas with <code>import pandas as pd</code>, then read the workbook with <code>pd.read_excel("stat11_stage4_students.xlsx")</code>.',
    'Inspect the dataset structure. Use the visual inspector and, in Python, explore <code>df.head()</code>, <code>df.shape</code>, column names, or a simple numeric summary.',
    'Create a filtered DataFrame containing the rows where <code>score &gt;= 90</code>.',
    'For the final validated run, print only the number of rows in that filtered DataFrame. Stage 5 stays locked until the course backend confirms the real consolidated output.'
  ];

  const hintOne = 'Read the mounted workbook into a DataFrame first. The filename is shown in the Files panel and the function you need is <code>pd.read_excel(...)</code>.';
  const hintTwo = 'Create a Boolean filter from the <code>score</code> column using <code>&gt;= 90</code>. Store the filtered DataFrame, then print its length. Do not type the final number manually.';

  let queued = false;
  let hintLevel = 0;
  let lastStage4State = false;

  function isStage4Active() {
    return /^STAGE\s+4\s+OF/i.test(document.getElementById('problemKicker')?.textContent || '');
  }

  function enforceStage4Guide() {
    const active = isStage4Active();
    if (!active) {
      if (lastStage4State) hintLevel = 0;
      lastStage4State = false;
      return;
    }
    lastStage4State = true;

    const concept = document.getElementById('guideConcept');
    const steps = document.getElementById('guideSteps');
    const subtitle = document.getElementById('notebookSubtitle');
    const hintButton = document.getElementById('hintButton');
    const hintBox = document.getElementById('hintBox');

    if (concept && concept.textContent !== 'Excel file → DataFrame → inspect → filter') {
      concept.textContent = 'Excel file → DataFrame → inspect → filter';
    }

    if (steps && !steps.querySelector('[data-v45-post-step="1"]')) {
      steps.innerHTML = guideSteps
        .map((step, index) => `<li data-v45-post-step="${index + 1}"><strong>Step ${index + 1}.</strong> ${step}</li>`)
        .join('');
      steps.dataset.v45Signature = 'stat-04';
    }

    if (subtitle && subtitle.textContent !== 'Guided notebook · V45 · Excel files + visual inspect') {
      subtitle.textContent = 'Guided notebook · V45 · Excel files + visual inspect';
    }

    if (hintButton && hintBox && hintLevel > 0) {
      hintBox.classList.remove('hidden');
      const desired = hintLevel === 1
        ? `<div data-v45-post-hint="1">• ${hintOne}</div>`
        : `<div data-v45-post-hint="1">• ${hintOne}</div><div data-v45-post-hint="2">• ${hintTwo}</div>`;
      if (hintBox.innerHTML !== desired) hintBox.innerHTML = desired;
      hintButton.textContent = hintLevel === 1 ? 'Another hint' : 'Hide hints';
    } else if (hintButton && hintBox && hintLevel === 0) {
      if (!hintBox.classList.contains('hidden')) hintBox.classList.add('hidden');
      if (hintButton.textContent !== 'Show hint') hintButton.textContent = 'Show hint';
      if (hintBox.innerHTML) hintBox.innerHTML = '';
    }

    document.documentElement.dataset.excelGuide = VERSION;
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      enforceStage4Guide();
    });
  }

  document.addEventListener('click', event => {
    const hintButton = event.target.closest('#hintButton');
    if (hintButton && isStage4Active()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      hintLevel = hintLevel === 0 ? 1 : hintLevel === 1 ? 2 : 0;
      enforceStage4Guide();
      return;
    }
    if (event.target.closest('[data-stage], #previousButton, #nextButton, #resetButton')) {
      schedule();
    }
  }, true);

  function start() {
    const app = document.getElementById('workshopApp');
    if (app) {
      const observer = new MutationObserver(schedule);
      observer.observe(app, { subtree:true, childList:true, characterData:true });
    }
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
