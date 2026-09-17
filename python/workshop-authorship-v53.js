(() => {
  'use strict';

  const topics = window.IJR_PYTHON_HUB_TOPICS || [];

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

  function removeCopyableGuidance() {
    // V43 rendered complete executable lines for the first topics. Do not expose those lines.
    const figure = document.getElementById('guideFigureV43');
    if (figure) figure.remove();

    const directive = document.getElementById('v43Directive');
    if (directive) {
      directive.innerHTML = '<strong>Authoring rule:</strong> use the problem statement and theory as references, but construct and type the complete Python solution yourself.';
    }
  }

  function start() {
    installEditorGuard();
    removeCopyableGuidance();

    // The notebook swaps stages without a full page reload, so re-apply only the UI guard.
    const app = document.getElementById('workshopApp');
    if (app) {
      const observer = new MutationObserver(() => {
        installEditorGuard();
        removeCopyableGuidance();
      });
      observer.observe(app, { subtree: true, childList: true });
    }
  }

  window.IJR_PYTHON_HUB_AUTHORSHIP_POLICY_V53 = Object.freeze({
    blankCodeCells: true,
    pasteIntoCodeEditor: false,
    dropIntoCodeEditor: false,
    copyableSolutionFigures: false,
    validationChanged: false,
    backendChanged: false
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
