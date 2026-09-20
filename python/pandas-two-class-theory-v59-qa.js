(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  if ((params.get('topic') || 'operations') !== 'logic') return;

  const VERSION = 'v59';
  let timer = null;
  const px = value => Number.parseFloat(String(value || '0')) || 0;
  const visible = el => el instanceof HTMLElement && el.offsetParent !== null;

  function run() {
    const root = document.documentElement;
    if (root.dataset.pandasTwoClassTheory !== VERSION) return null;

    const failures = [];
    const guide = document.getElementById('pandasTwoClassTheoryV59');
    const classButtons = guide ? guide.querySelectorAll('[data-p59-class]') : [];
    const navButtons = guide ? guide.querySelectorAll('[data-p59-nav]') : [];
    const code = guide?.querySelector('.p58-code-line code');
    const body = guide?.querySelector('.p58-stage-inner>header p:not(.eyebrow)');
    const workbook = guide?.querySelector('a[href*="pandas_excel_students.xlsx"]');

    if (!guide) failures.push('two-class guide missing');
    if (classButtons.length !== 2) failures.push('expected 2 class buttons, found ' + classButtons.length);
    if (navButtons.length !== 12) failures.push('expected 12 theory stages, found ' + navButtons.length);
    if (!workbook) failures.push('real XLSX download link missing');
    if (code && px(getComputedStyle(code).fontSize) < 14) failures.push('code font too small: ' + getComputedStyle(code).fontSize);
    if (body && px(getComputedStyle(body).fontSize) < 15) failures.push('body text too small: ' + getComputedStyle(body).fontSize);

    [
      document.getElementById('conceptSection'),
      document.querySelector('.theory-diagrams-section'),
      document.getElementById('syntaxSection'),
      document.getElementById('pitfallSection'),
      document.getElementById('pandasExcelTheoryV52')
    ].filter(Boolean).forEach(el => {
      if (visible(el)) failures.push('superseded theory remains visible: ' + (el.id || el.className));
    });

    ['.p58-hero','.p59-class-route','.p59-library-landscape','.p59-practical-bridge','.p58-guided','.p58-stage'].forEach(selector => {
      guide?.querySelectorAll(selector).forEach(el => {
        const style = getComputedStyle(el);
        if (!['auto','scroll'].includes(style.overflowX) && el.scrollWidth > el.clientWidth + 4) failures.push('horizontal overflow: ' + selector);
      });
    });

    let out = document.getElementById('pandasV59Qa');
    if (!out) {
      out = document.createElement('output');
      out.id = 'pandasV59Qa';
      out.hidden = true;
      document.body.appendChild(out);
    }
    const pass = failures.length === 0;
    out.dataset.qa = pass ? 'pass' : 'fail';
    out.dataset.failureCount = String(failures.length);
    out.textContent = pass ? 'PASS' : failures.join(' | ');
    root.dataset.pandasV59Qa = pass ? 'pass' : 'fail';
    root.dataset.pandasV59QaFailures = String(failures.length);
    return { pass, failures };
  }

  function schedule(delay = 700) {
    clearTimeout(timer);
    timer = setTimeout(run, delay);
  }

  function install() {
    schedule(900);
    setTimeout(run, 1800);
    setTimeout(run, 3500);
    window.addEventListener('resize', () => schedule(450), { passive:true });
    new ResizeObserver(() => schedule(550)).observe(document.documentElement);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();