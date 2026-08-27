(() => {
  'use strict';

  const topicMap = window.IJR_PYTHON_HUB_TOPIC_MAP || {};
  const requested = new URLSearchParams(location.search).get('topic') || 'operations';
  const topic = topicMap[requested];
  if (!topic) return;

  function applyBlankCellUX() {
    const heroCopy = document.querySelector('#workshopHero > div > p:not(.eyebrow)');
    if (heroCopy) {
      heroCopy.textContent = `Complete all ${topic.exercises.length} workshop stages. Every coding stage starts from a blank cell: read the task, write the Python solution yourself, run it, inspect the terminal, and only then validate.`;
    }

    const editor = document.getElementById('codeEditor');
    if (!editor) return;

    const workspace = editor.closest('.code-workspace');
    if (workspace) workspace.classList.add('blank-contract');

    const toolbarSmall = editor.closest('.colab-editor-wrap')?.querySelector('.colab-editor-toolbar small');
    if (toolbarSmall) toolbarSmall.textContent = ' · student-authored code';

    const reset = document.getElementById('resetCode');
    if (reset) reset.textContent = 'Clear cell';

    const instruction = editor.closest('.colab-shell')?.querySelector('.colab-instruction-strip');
    if (instruction) instruction.innerHTML = '<strong>Student coding workflow:</strong> write the complete Python solution yourself, press ▶ Run, read the console, correct errors, then validate.';

    if (!editor.dataset.blankPolicyV27) {
      editor.dataset.blankPolicyV27 = '1';
      editor.setAttribute('placeholder', '# Write your Python solution here');
    }
  }

  const mount = document.getElementById('stageMount');
  if (mount) new MutationObserver(applyBlankCellUX).observe(mount, {childList:true, subtree:true});

  const hero = document.getElementById('workshopHero');
  if (hero) new MutationObserver(applyBlankCellUX).observe(hero, {childList:true, subtree:true});

  document.addEventListener('DOMContentLoaded', applyBlankCellUX);
  applyBlankCellUX();
})();
