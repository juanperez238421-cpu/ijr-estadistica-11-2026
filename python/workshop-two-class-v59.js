(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  if ((params.get('topic') || 'statistics') !== 'logic') return;

  const VERSION = 'v59';
  let queued = false;

  function stageNumber() {
    const text = document.getElementById('heroStage')?.textContent || document.getElementById('problemKicker')?.textContent || '';
    const match = text.match(/(\d+)/);
    return match ? Number(match[1]) : 1;
  }

  function classInfo(stage) {
    if (stage <= 6) return { number:1, title:'Libraries + XLSX files', local:stage };
    return { number:2, title:'Pandas for data analysis', local:stage - 6 };
  }

  function ensureRoadmap() {
    const hero = document.querySelector('.notebook-hero');
    if (!hero || document.getElementById('v59TwoClassRoadmap')) return;

    const section = document.createElement('section');
    section.id = 'v59TwoClassRoadmap';
    section.className = 'v59-class-roadmap text-cell';
    section.innerHTML =
      '<div class="v59-roadmap-head">' +
        '<div><p class="eyebrow">TOPIC 04 · MAXIMUM 2 CLASSES</p>' +
        '<h2>Two classes. Same Colab workflow. One real Excel file.</h2>' +
        '<p>Each class combines approximately <strong>20 min theory + 30 min workshop</strong>. The 12 validated exercises stay in one topic, divided into two coherent six-stage blocks.</p></div>' +
        '<span class="v59-route-badge">2 × 50 min</span>' +
      '</div>' +
      '<div class="v59-class-cards">' +
        '<button type="button" data-v59-class="1"><span>CLASS 1</span><strong>Libraries + XLSX files</strong><small>Stages 01–06 · ecosystem, pathlib, openpyxl, real workbook manipulation</small><div><b data-v59-progress="1">0 / 6</b><i><em data-v59-bar="1"></em></i></div></button>' +
        '<button type="button" data-v59-class="2"><span>CLASS 2</span><strong>Pandas for data analysis</strong><small>Stages 07–12 · DataFrame, inspection, filtering, transformation, export</small><div><b data-v59-progress="2">0 / 6</b><i><em data-v59-bar="2"></em></i></div></button>' +
      '</div>' +
      '<div class="v59-colab-rule"><strong>Colab cycle</strong><span>Read the task → write the code yourself → Run ▶ → inspect the real output → correct → Validate.</span></div>';

    hero.insertAdjacentElement('afterend', section);

    section.querySelectorAll('[data-v59-class]').forEach(function(button) {
      button.addEventListener('click', function() {
        const n = Number(button.dataset.v59Class);
        const index = n === 1 ? 0 : 6;
        document.querySelector('#stageList [data-stage="' + index + '"]')?.click();
        document.getElementById('problemCell')?.scrollIntoView({ behavior:'smooth', block:'start' });
      });
    });
  }

  function makeDivider(label, title) {
    const div = document.createElement('div');
    div.className = 'v59-stage-divider';
    div.innerHTML = '<span>' + label + '</span><strong>' + title + '</strong>';
    return div;
  }

  function decorateSidebar() {
    const list = document.getElementById('stageList');
    if (!list) return;
    list.querySelectorAll('.v59-stage-divider').forEach(function(node) { node.remove(); });
    const buttons = Array.from(list.querySelectorAll('[data-stage]'));
    if (!buttons.length) return;
    buttons[0]?.before(makeDivider('CLASS 1 · STAGES 01–06', 'Libraries + XLSX'));
    buttons[6]?.before(makeDivider('CLASS 2 · STAGES 07–12', 'Pandas'));
  }

  function updateProgress() {
    const buttons = Array.from(document.querySelectorAll('#stageList [data-stage]'));
    if (!buttons.length) return;
    [1, 2].forEach(function(classNo) {
      const subset = classNo === 1 ? buttons.slice(0, 6) : buttons.slice(6, 12);
      const complete = subset.filter(function(button) { return button.classList.contains('stage-complete'); }).length;
      const label = document.querySelector('[data-v59-progress="' + classNo + '"]');
      const bar = document.querySelector('[data-v59-bar="' + classNo + '"]');
      if (label) label.textContent = complete + ' / 6 validated';
      if (bar) bar.style.width = (complete / 6 * 100) + '%';
    });
  }

  function updateActiveClass() {
    const stage = stageNumber();
    const info = classInfo(stage);
    const roadmap = document.getElementById('v59TwoClassRoadmap');

    roadmap?.querySelectorAll('[data-v59-class]').forEach(function(button) {
      button.classList.toggle('active', Number(button.dataset.v59Class) === info.number);
    });

    const kicker = document.getElementById('problemKicker');
    if (kicker) kicker.textContent = 'STAGE ' + stage + ' OF 12 · CLASS ' + info.number + ' · LOCAL ' + info.local + ' OF 6';

    const title = document.getElementById('topicNavTitle');
    if (title) title.textContent = info.number === 1 ? 'Class 1 · Libraries + XLSX' : 'Class 2 · Pandas';

    const intro = document.getElementById('topicIntro');
    if (intro) {
      intro.textContent = info.number === 1
        ? 'Class 1: discover why libraries exist, see several real Python domains, then manipulate a real .xlsx workbook with pathlib and openpyxl.'
        : 'Class 2: use Pandas as the dedicated data-analysis library: XLSX → DataFrame → inspect → select/filter/derive/sort → export.';
    }

    const subtitle = document.getElementById('notebookSubtitle');
    if (subtitle) subtitle.textContent = 'Class ' + info.number + ' of 2 · ' + info.title + ' · Colab workshop';

    const app = document.getElementById('workshopApp');
    if (app) {
      app.dataset.v59Class = String(info.number);
      app.dataset.v59Stage = String(stage);
    }
  }

  function ensureClassHint() {
    const guide = document.getElementById('guidePanel');
    if (!guide) return;
    let hint = document.getElementById('v59ClassHint');
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'v59ClassHint';
      hint.className = 'v59-class-hint';
      guide.prepend(hint);
    }

    const stage = stageNumber();
    if (stage <= 3) {
      hint.innerHTML = '<strong>Class 1 · Library exploration</strong><span>No workbook is required yet. These stages show that Python libraries solve different kinds of problems.</span>';
    } else if (stage <= 6) {
      hint.innerHTML = '<strong>Class 1 · Real XLSX manipulation</strong><span>The class workbook and openpyxl are prepared automatically when required. Keep using the normal Run → inspect → Validate cycle.</span>';
    } else {
      hint.innerHTML = '<strong>Class 2 · Pandas</strong><span>Use the same real workbook. Focus now on DataFrame operations instead of cell-by-cell workbook manipulation.</span>';
    }
  }

  function sync() {
    ensureRoadmap();
    decorateSidebar();
    updateProgress();
    updateActiveClass();
    ensureClassHint();
    document.documentElement.dataset.topic04TwoClass = VERSION;
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function() {
      queued = false;
      sync();
    });
  }

  function start() {
    sync();
    const root = document.getElementById('workshopApp') || document.body;
    new MutationObserver(schedule).observe(root, {
      subtree:true,
      childList:true,
      attributes:true,
      characterData:true,
      attributeFilter:['class','style']
    });
    document.addEventListener('click', function(event) {
      if (event.target.closest('[data-stage], #previousButton, #nextButton, #validateButton')) schedule();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();