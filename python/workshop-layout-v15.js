(() => {
  'use strict';

  const stageButtons = document.getElementById('stageButtons');
  if (!stageButtons) return;

  let lastActive = '';
  function enhanceStageRail() {
    const buttons = Array.from(stageButtons.querySelectorAll('.workshop-nav-button'));
    buttons.forEach((button, index) => {
      const number = button.querySelector(':scope > span')?.textContent?.trim() || String(index + 1).padStart(2, '0');
      const title = button.querySelector('strong')?.textContent?.trim() || `Stage ${index + 1}`;
      const status = button.querySelector('small')?.textContent?.trim() || '';
      const label = `${number}. ${title}${status ? ` — ${status}` : ''}`;
      button.title = label;
      button.setAttribute('aria-label', label);
    });

    const active = stageButtons.querySelector('.workshop-nav-button.active');
    if (!active) return;
    const key = active.dataset.stage || active.textContent;
    if (key === lastActive) return;
    lastActive = key;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    requestAnimationFrame(() => active.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'nearest', inline: 'nearest'}));
  }

  new MutationObserver(enhanceStageRail).observe(stageButtons, {childList:true, subtree:true});
  window.addEventListener('resize', enhanceStageRail, {passive:true});
  enhanceStageRail();
})();
