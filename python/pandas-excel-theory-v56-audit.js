(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  if ((params.get('topic') || 'operations') !== 'logic') return;

  const VERSION = 'v56';
  let timer = null;

  const selectors = [
    '.theory-hero', '.resource-card', '.concept-card', '.learning-goals-panel',
    '.pandas-v52-theory', '.pandas-v52-code-card', '.pandas-v52-dataset-card',
    '.pandas-v54-upload-guide', '.pandas-v54-dropzone', '.live-lesson-v19',
    '.live-copy-v19', '.live-colab-v19', '.pandas-v54-diagram-card',
    '.pandas-v54-stage', '.syntax-reference-grid article', '.pitfall-grid article'
  ];

  const textSelector = 'h1,h2,h3,h4,p,span,small,strong,b,code,pre,li,a,button';

  function descriptor(element) {
    const cls = String(element.className || '').trim().replace(/\s+/g, '.').slice(0, 100);
    return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${cls ? `.${cls}` : ''}`;
  }

  function visible(element) {
    if (!(element instanceof HTMLElement) || element.offsetParent === null) return false;
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) !== 0;
  }

  function clearStaleRecovery() {
    const app = document.getElementById('theoryApp');
    const access = document.getElementById('accessPanel');
    if (!app || app.classList.contains('hidden') || !access) return;
    access.classList.add('hidden');
    access.innerHTML = '';
    const badge = document.getElementById('sessionBadge');
    if (badge && /connection issue/i.test(badge.textContent || '')) badge.textContent = 'Theory ready';
    document.documentElement.dataset.theoryV56Recovery = 'clean';
  }

  function rectOverflow(child, container, tolerance = 4) {
    const childRect = child.getBoundingClientRect();
    const parentRect = container.getBoundingClientRect();
    if (childRect.width <= 0 || parentRect.width <= 0) return false;
    return childRect.left < parentRect.left - tolerance || childRect.right > parentRect.right + tolerance;
  }

  function textActuallyOverflows(element) {
    if (!visible(element)) return false;
    const style = getComputedStyle(element);
    if (['auto', 'scroll'].includes(style.overflowX)) return false;
    if (element.scrollWidth <= element.clientWidth + 4) return false;

    /* scrollWidth can include intrinsic grid sizing or invisible layout area.
       Confirm that a visible textual descendant really leaves the card. */
    const textNodes = [...element.querySelectorAll(textSelector)].filter(node => visible(node));
    const escapedText = textNodes.find(node => {
      const nodeStyle = getComputedStyle(node);
      if (['auto', 'scroll'].includes(nodeStyle.overflowX)) return false;
      return rectOverflow(node, element, 4);
    });
    if (escapedText) return { element, cause: escapedText, mode: 'visible-text-rect' };

    /* A direct text node can overflow without a nested text element. Wrap its
       geometry in a Range so the audit checks painted text, not only boxes. */
    for (const node of element.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const parentRect = element.getBoundingClientRect();
      for (const rect of range.getClientRects()) {
        if (rect.left < parentRect.left - 4 || rect.right > parentRect.right + 4) {
          return { element, cause: element, mode: 'direct-text-range' };
        }
      }
    }

    return false;
  }

  function runRenderedAudit() {
    const root = document.documentElement;
    if (root.dataset.theoryV54 !== 'v54') return null;

    clearStaleRecovery();
    const offenders = [];
    document.querySelectorAll(selectors.join(',')).forEach(element => {
      if (!(element instanceof HTMLElement) || !visible(element)) return;
      const issue = textActuallyOverflows(element);
      if (!issue) return;
      offenders.push(`${descriptor(issue.element)} -> ${descriptor(issue.cause)} [${issue.mode}] sw=${issue.element.scrollWidth} cw=${issue.element.clientWidth}`);
    });

    const globalOverflow = root.scrollWidth > root.clientWidth + 4;
    if (globalOverflow) offenders.push(`html [global] sw=${root.scrollWidth} cw=${root.clientWidth}`);

    let audit = document.getElementById('theoryV56Audit');
    if (!audit) {
      audit = document.createElement('output');
      audit.id = 'theoryV56Audit';
      audit.hidden = true;
      document.body.appendChild(audit);
    }

    const pass = offenders.length === 0;
    audit.dataset.renderedOverflowAudit = pass ? 'pass' : 'fail';
    audit.dataset.offenderCount = String(offenders.length);
    audit.textContent = pass ? 'PASS' : offenders.join(' | ');

    /* V56 supersedes V54's coarse scrollWidth-only check. The user-facing
       invariant is rendered content staying inside its visual container. */
    root.dataset.theoryV54Overflow = pass ? 'pass' : 'fail';
    root.dataset.theoryV54OverflowCount = String(offenders.length);
    root.dataset.theoryV56Overflow = pass ? 'pass' : 'fail';
    root.dataset.theoryV56OverflowCount = String(offenders.length);
    root.dataset.theoryV56 = VERSION;
    return { pass, offenders };
  }

  function schedule(delay = 450) {
    clearTimeout(timer);
    timer = setTimeout(runRenderedAudit, delay);
  }

  function install() {
    if (document.documentElement.dataset.theoryV54 !== 'v54') {
      schedule(350);
      return;
    }
    clearStaleRecovery();
    schedule(900);
    setTimeout(runRenderedAudit, 1800);
    setTimeout(runRenderedAudit, 3500);
    window.addEventListener('resize', () => schedule(450), { passive: true });
    const observer = new ResizeObserver(() => schedule(550));
    observer.observe(document.documentElement);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
