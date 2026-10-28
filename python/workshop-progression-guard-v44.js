(() => {
  'use strict';

  const VERSION = 'v44';
  const stageList = document.getElementById('stageList');
  const nextButton = document.getElementById('nextButton');
  const saveMessage = document.getElementById('saveMessage');
  // Topic 04 has two independent six-stage classes. Other topics keep V44 sequencing.
  const independentClasses = new URLSearchParams(window.location.search).get('topic') === 'logic';
  const CLASS_SIZE = 6;

  if (!stageList || !nextButton) return;

  const stageButtons = () => [...stageList.querySelectorAll('.stage-button')];
  const isValidated = button => Boolean(button?.classList.contains('stage-complete'));

  function firstIncompleteIndex() {
    const buttons = stageButtons();
    const index = buttons.findIndex(button => !isValidated(button));
    return index === -1 ? Math.max(0, buttons.length - 1) : index;
  }

  function canOpenStage(buttons, targetIndex) {
    if (!independentClasses) return buttons.every(isValidated) || targetIndex <= firstIncompleteIndex();
    // Validation is sequential within each class, never across the 06 → 07 boundary.
    const start = targetIndex < CLASS_SIZE ? 0 : CLASS_SIZE;
    const end = Math.min(start + CLASS_SIZE, buttons.length);
    const first = buttons.findIndex((button, index) => index >= start && index < end && !isValidated(button));
    return first === -1 || targetIndex <= first;
  }

  function activeIndex() {
    const buttons = stageButtons();
    const index = buttons.findIndex(button => button.classList.contains('active'));
    return index < 0 ? 0 : index;
  }

  function showLockMessage() {
    if (saveMessage) {
      saveMessage.textContent = 'Locked: run your solution and validate it. You can advance only after the course backend confirms the consolidated expected output.';
    }
  }

  function syncProgressionLock() {
    const buttons = stageButtons();
    if (!buttons.length) return;

    const active = activeIndex();
    const current = buttons[active];
    const firstIncomplete = firstIncompleteIndex();
    const allComplete = buttons.every(isValidated);

    buttons.forEach((button, index) => {
      const allowed = canOpenStage(buttons, index);
      button.disabled = !allowed;
      button.classList.toggle('progression-locked', !allowed);
      button.setAttribute('aria-disabled', allowed ? 'false' : 'true');
      if (!allowed) {
        button.title = 'Complete and validate the previous stage before advancing.';
      } else if (button.title === 'Complete and validate the previous stage before advancing.') {
        button.removeAttribute('title');
      }
    });

    const atLastStage = active >= buttons.length - 1;
    const currentValidated = isValidated(current);
    const crossClassJump = independentClasses && active === CLASS_SIZE - 1;
    nextButton.disabled = atLastStage || (!currentValidated && !crossClassJump);
    nextButton.classList.toggle('progression-locked', !atLastStage && !currentValidated && !crossClassJump);
    nextButton.setAttribute('aria-disabled', nextButton.disabled ? 'true' : 'false');
    nextButton.title = !atLastStage && !currentValidated && !crossClassJump
      ? 'Validate the exact expected result before advancing.'
      : crossClassJump ? 'Open Class 2 independently of Class 1.' : '';

    document.documentElement.dataset.progressionGuard = VERSION;
    document.documentElement.dataset.firstIncompleteStage = String(firstIncomplete + 1);
    if (independentClasses) document.documentElement.dataset.workshop4IndependentClasses = 'true';
  }

  nextButton.addEventListener('click', event => {
    const buttons = stageButtons();
    const active = activeIndex();
    const current = buttons[active];
    if (!isValidated(current) && !(independentClasses && active === CLASS_SIZE - 1)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showLockMessage();
      syncProgressionLock();
    }
  }, true);

  stageList.addEventListener('click', event => {
    const target = event.target.closest('.stage-button');
    if (!target) return;
    const buttons = stageButtons();
    const targetIndex = buttons.indexOf(target);
    if (!canOpenStage(buttons, targetIndex)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showLockMessage();
      syncProgressionLock();
    }
  }, true);

  const observer = new MutationObserver(() => requestAnimationFrame(syncProgressionLock));
  observer.observe(stageList, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });

  document.addEventListener('DOMContentLoaded', syncProgressionLock, { once:true });
  window.addEventListener('pageshow', syncProgressionLock);
  requestAnimationFrame(syncProgressionLock);
})();
