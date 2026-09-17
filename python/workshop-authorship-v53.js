(() => {
  'use strict';

  const topics = window.IJR_PYTHON_HUB_TOPICS || [];
  const params = new URLSearchParams(location.search);
  const topicSlug = params.get('topic') || '';

  // Safety invariant: every coding stage starts empty, including topics added by later catalog files.
  for (const topic of topics) {
    for (const exercise of topic.exercises || []) {
      if (exercise.mode === 'code') exercise.code = '';
    }
  }

  function flashAuthoringMessage(message) {
    const saveMessage = document.getElementById('saveMessage');
    if (!saveMessage) return;
    saveMessage.textContent = message;
    window.clearTimeout(flashAuthoringMessage.timer);
    flashAuthoringMessage.timer = window.setTimeout(() => {
      if (saveMessage.textContent === message) {
        saveMessage.textContent = 'Run the cell, inspect the output, then validate.';
      }
    }, 3200);
  }

  function installEditorGuard() {
    const editor = document.getElementById('codeEditor');
    if (!editor || editor.dataset.authorshipGuard === 'v53') return;

    editor.dataset.authorshipGuard = 'v53';

    const blockTransfer = event => {
      event.preventDefault();
      flashAuthoringMessage('Paste and drag/drop are disabled in the code cell. Type the solution yourself.');
      editor.focus();
    };

    editor.addEventListener('paste', blockTransfer);
    editor.addEventListener('drop', blockTransfer);
    editor.addEventListener('beforeinput', event => {
      if (event.inputType === 'insertFromPaste' || event.inputType === 'insertFromDrop') {
        blockTransfer(event);
      }
    });

    const modeLabel = document.getElementById('cellModeLabel');
    if (modeLabel) modeLabel.textContent = ' · write the complete solution yourself';
  }

  function genericStepsHtml(markerAttribute) {
    const steps = [
      'Identify the information provided and the result the problem asks for.',
      'Choose the Python idea, operator, function or structure that fits the task.',
      'Write the complete solution yourself in the code cell. No executable solution is provided here.',
      'Run the cell, inspect the output or error, revise if needed, and only then validate.'
    ];
    return steps.map((step, index) => `<li ${markerAttribute}="${index + 1}"><strong>Step ${index + 1}.</strong> ${step}</li>`).join('');
  }

  function softenGuidance() {
    const guidePanel = document.getElementById('guidePanel');
    const guideConcept = document.getElementById('guideConcept');
    const guideSteps = document.getElementById('guideSteps');
    if (!guidePanel || !guideConcept || !guideSteps) return;

    if (topicSlug === 'operations' || topicSlug === 'types') {
      if (!guideSteps.querySelector('[data-v43-step][data-authorship-softened="v53"]')) {
        guideConcept.textContent = 'Plan your own solution';
        guideSteps.innerHTML = genericStepsHtml('data-v43-step').replaceAll('<li data-v43-step=', '<li data-authorship-softened="v53" data-v43-step=');
      }
      const figure = document.getElementById('guideFigureV43');
      if (figure) figure.remove();
      const directive = document.getElementById('v43Directive');
      if (directive) {
        directive.innerHTML = '<strong>Authoring rule:</strong> use the problem statement and theory as references, but construct and type the complete Python solution yourself.';
      }
    }

    if (topicSlug === 'arrays') {
      if (!guideSteps.querySelector('[data-array-v47-step][data-authorship-softened="v53"]')) {
        guideConcept.textContent = 'Plan your own list solution';
        guideSteps.innerHTML = genericStepsHtml('data-array-v47-step').replaceAll('<li data-array-v47-step=', '<li data-authorship-softened="v53" data-array-v47-step=');
      }
      const figure = document.getElementById('guideFigureArrayV47');
      if (figure) figure.remove();
      const directive = document.getElementById('arrayV47Directive');
      if (directive) {
        directive.innerHTML = '<strong>Authoring rule:</strong> decide the list operation from the task, then write and test the complete Python solution yourself.';
      }
    }
  }

  function start() {
    installEditorGuard();
    softenGuidance();

    // The notebook swaps stages without a full page reload. Preserve the authorship policy after each render.
    const app = document.getElementById('workshopApp');
    if (app) {
      let queued = false;
      const observer = new MutationObserver(() => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          installEditorGuard();
          softenGuidance();
        });
      });
      observer.observe(app, { subtree: true, childList: true, characterData: true });
    }
  }

  window.IJR_PYTHON_HUB_AUTHORSHIP_POLICY_V53 = Object.freeze({
    blankCodeCells: true,
    pasteIntoCodeEditor: false,
    dropIntoCodeEditor: false,
    copyableSolutionFigures: false,
    conceptualGuidanceOnly: true,
    validationChanged: false,
    backendChanged: false
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
