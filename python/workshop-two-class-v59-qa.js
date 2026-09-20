(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  if ((params.get('topic') || 'statistics') !== 'logic') return;

  const VERSION = 'v59';
  let timer = null;
  const px = value => Number.parseFloat(String(value || '0')) || 0;

  function run() {
    const failures = [];
    const topic = window.IJR_PYTHON_HUB_TOPIC_MAP?.logic;
    const meta = window.IJR_LIBRARIES_XLSX_PANDAS_V59;
    const stages = topic?.exercises || [];
    const roadmap = document.getElementById('v59TwoClassRoadmap');
    const stageButtons = document.querySelectorAll('#stageList [data-stage]');
    const editor = document.getElementById('codeEditor');
    const prompt = document.getElementById('problemPrompt');
    const sourceNote = document.querySelector('.v45-class-dataset-note');

    if (!meta || meta.version !== VERSION) failures.push('V59 curriculum metadata missing');
    if (!topic) failures.push('Topic 04 metadata missing');
    if (stages.length !== 12) failures.push('Expected 12 workshop stages, found ' + stages.length);
    if (stages.slice(0,6).some(x => !String(x.title || '').startsWith('Class 1'))) failures.push('Class 1 titles are not grouped 1–6');
    if (stages.slice(6,12).some(x => !String(x.title || '').startsWith('Class 2'))) failures.push('Class 2 titles are not grouped 7–12');
    if (stages.some(x => x.mode !== 'code')) failures.push('All Topic 04 stages must remain code/Colab exercises');
    if (!roadmap) failures.push('Two-class workshop roadmap missing');
    if (roadmap && roadmap.querySelectorAll('[data-v59-class]').length !== 2) failures.push('Expected 2 class cards');
    if (stageButtons.length && stageButtons.length !== 12) failures.push('Expected 12 rendered stage buttons, found ' + stageButtons.length);
    if (sourceNote && !/pandas_excel_students\.xlsx/i.test(sourceNote.textContent || '')) failures.push('Shared class workbook is not pandas_excel_students.xlsx');
    if (editor && px(getComputedStyle(editor).fontSize) < 14) failures.push('Code editor text too small: ' + getComputedStyle(editor).fontSize);
    if (prompt && px(getComputedStyle(prompt).fontSize) < 14) failures.push('Problem text too small: ' + getComputedStyle(prompt).fontSize);

    let out = document.getElementById('workshopV59Qa');
    if (!out) {
      out = document.createElement('output');
      out.id = 'workshopV59Qa';
      out.hidden = true;
      document.body.appendChild(out);
    }
    const pass = failures.length === 0;
    out.dataset.qa = pass ? 'pass' : 'fail';
    out.dataset.failureCount = String(failures.length);
    out.textContent = pass ? 'PASS' : failures.join(' | ');
    document.documentElement.dataset.workshopV59Qa = pass ? 'pass' : 'fail';
    document.documentElement.dataset.workshopV59QaFailures = String(failures.length);
    return { pass, failures };
  }

  function schedule(delay = 650) {
    clearTimeout(timer);
    timer = setTimeout(run, delay);
  }

  function install() {
    schedule(900);
    setTimeout(run, 1800);
    setTimeout(run, 3500);
    window.addEventListener('resize', () => schedule(450), { passive:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();