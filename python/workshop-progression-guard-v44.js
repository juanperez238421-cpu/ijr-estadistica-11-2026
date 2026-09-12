(() => {
  'use strict';

  const VERSION = 'v44';
  const stageList = document.getElementById('stageList');
  const nextButton = document.getElementById('nextButton');
  const saveMessage = document.getElementById('saveMessage');

  if (!stageList || !nextButton) return;

  const stageButtons = () => [...stageList.querySelectorAll('.stage-button')];
  const isValidated = button => Boolean(button?.classList.contains('stage-complete'));

  function firstIncompleteIndex() {
    const buttons = stageButtons();
    const index = buttons.findIndex(button => !isValidated(button));
    return index === -1 ? Math.max(0, buttons.length - 1) : index;
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
      const allowed = allComplete || index <= firstIncomplete;
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
    nextButton.disabled = atLastStage || !currentValidated;
    nextButton.classList.toggle('progression-locked', !atLastStage && !currentValidated);
    nextButton.setAttribute('aria-disabled', nextButton.disabled ? 'true' : 'false');
    nextButton.title = !atLastStage && !currentValidated
      ? 'Validate the exact expected result before advancing.'
      : '';

    document.documentElement.dataset.progressionGuard = VERSION;
    document.documentElement.dataset.firstIncompleteStage = String(firstIncomplete + 1);
  }

  nextButton.addEventListener('click', event => {
    const buttons = stageButtons();
    const active = activeIndex();
    const current = buttons[active];
    if (!isValidated(current)) {
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
    const firstIncomplete = firstIncompleteIndex();
    const allComplete = buttons.every(isValidated);
    if (!allComplete && targetIndex > firstIncomplete) {
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
