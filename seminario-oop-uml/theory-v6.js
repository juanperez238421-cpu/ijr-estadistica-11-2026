(() => {
  'use strict';

  const objectiveBySession = {
    1: 'Distinguish class, object, instance, attribute and method before worrying about syntax.',
    2: 'Separate remembered state from behavior and explain why each member belongs to the object.',
    3: 'Construct objects that begin in a coherent, valid state.',
    4: 'Protect state behind a small, intentional public interface.',
    5: 'Recognize collaboration, ownership and whole–part relationships.',
    6: 'Use inheritance only when the child is conceptually a true specialization of the parent.',
    7: 'Depend on a stable behavior contract while allowing multiple implementations.',
    8: 'Distribute responsibilities across a coherent multi-class architecture.',
    9: 'Keep UML and executable code synchronized while refactoring.',
    10: 'Explain one architecture decision and propagate a small live change through UML and code.'
  };

  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => [...root.querySelectorAll(selector)];

  function currentContext() {
    const params = new URLSearchParams(location.search);
    const slug = params.get('topic') || 'object-model';
    const lang = params.get('lang') === 'java' ? 'java' : 'python';
    const topics = window.IJR_OOP_UML_DATA?.topics || [];
    const topic = topics.find(item => item.slug === slug) || topics[0] || { n: 1, slug: 'object-model', title: 'Class · Object · Instance' };
    return { topic, lang };
  }

  function buildHero(topic, lang) {
    const hero = q('.page-hero');
    if (!hero || q('.theory-hero-copy', hero)) return;

    const copy = document.createElement('div');
    copy.className = 'theory-hero-copy';
    while (hero.firstChild) copy.appendChild(hero.firstChild);

    const side = document.createElement('aside');
    side.className = 'theory-hero-side';
    side.setAttribute('aria-label', 'Lesson controls and objective');

    const switchHref = targetLang => `theory.html?topic=${encodeURIComponent(topic.slug)}&lang=${targetLang}`;
    side.innerHTML = `
      <div class="theory-objective">
        <span>Learning objective</span>
        <strong>${objectiveBySession[topic.n] || 'Explain the design decision represented by this UML model.'}</strong>
      </div>
      <nav class="theory-language-switch" aria-label="Implementation language">
        <a href="${switchHref('python')}" ${lang === 'python' ? 'aria-current="page"' : ''}>Python</a>
        <a href="${switchHref('java')}" ${lang === 'java' ? 'aria-current="page"' : ''}>Java</a>
      </nav>
      <div class="theory-flow-strip" aria-label="Recommended lesson flow">
        <span><b>01 · See</b>Identify the model visually.</span>
        <span><b>02 · Explain</b>Name state and behavior.</span>
        <span><b>03 · Build</b>Construct UML deliberately.</span>
        <span><b>04 · Code</b>Translate and test.</span>
      </div>`;

    hero.append(copy, side);
  }

  function markPreviewSubsections() {
    const atlas = document.getElementById('umlVisualAtlasV51');
    if (!atlas) return;
    const rel = q('.uml-v5-relationships', atlas)?.parentElement;
    const beforeAfter = q('.uml-v5-before-after', atlas)?.parentElement;
    [rel, beforeAfter].filter(Boolean).forEach(node => node.classList.add('theory-preview-subsection'));
  }

  function organizeSections(topic) {
    const main = q('main.page-shell');
    if (!main) return [];

    const directGrids = [...main.children].filter(el => el.classList?.contains('content-grid'));
    const quick = directGrids[0];
    const implementation = directGrids[1];
    const reasoning = directGrids[2];
    const notebook = [...main.children].find(el => el.classList?.contains('notebook-panel'));
    const mastery = document.getElementById('evidence')?.closest('section');
    const foundation = document.getElementById('foundationPanel');
    const deep = document.getElementById('umlDeepPanel');
    const visuals = document.getElementById('umlVisualAtlasV51');

    if (topic.n === 1 && foundation && visuals && quick && deep) {
      foundation.after(visuals);
      visuals.after(quick);
      quick.after(deep);
    }

    const descriptors = topic.n === 1
      ? [
          [foundation, 'theory-foundations', 'Foundations'],
          [visuals, 'theory-visuals', 'Visual UML'],
          [quick, 'theory-reference', 'Quick reference'],
          [deep, 'theory-construction', 'Build UML'],
          [implementation, 'theory-code', 'Code bridge'],
          [notebook, 'theory-lab', 'Live notebook'],
          [reasoning, 'theory-reasoning', 'Reasoning'],
          [mastery, 'theory-mastery', 'Mastery']
        ]
      : [
          [quick, 'theory-reference', 'Concepts'],
          [implementation, 'theory-code', 'Code bridge'],
          [notebook, 'theory-lab', 'Live notebook'],
          [reasoning, 'theory-reasoning', 'Reasoning'],
          [mastery, 'theory-mastery', 'Mastery']
        ];

    if (quick) quick.classList.add('theory-compact-grid');
    if (implementation) implementation.classList.add('theory-code-grid');
    if (reasoning) reasoning.classList.add('theory-reasoning-grid');

    return descriptors.filter(([el]) => Boolean(el)).map(([el, id, label]) => {
      el.id = id;
      el.classList.add('theory-section');
      return { el, id, label };
    });
  }

  function buildSectionNav(sections) {
    const nav = document.getElementById('theorySectionNav');
    if (!nav || !sections.length) return;
    nav.innerHTML = `<div class="theory-section-nav-inner">${sections.map(({ id, label }, index) => `<a href="#${id}" ${index === 0 ? 'aria-current="location"' : ''}>${label}</a>`).join('')}</div>`;

    const links = qa('a', nav);
    const byId = new Map(links.map(link => [link.getAttribute('href').slice(1), link]));
    const setCurrent = id => links.forEach(link => link.toggleAttribute('aria-current', link === byId.get(id)));

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setCurrent(visible.target.id);
      }, { rootMargin: '-128px 0px -62% 0px', threshold: [0, .05, .2] });
      sections.forEach(({ el }) => observer.observe(el));
    }

    nav.addEventListener('click', event => {
      const link = event.target.closest('a[href^="#"]');
      if (link) setCurrent(link.getAttribute('href').slice(1));
    });
  }

  function improveSemantics() {
    qa('.uml-v5-gallery-toolbar button').forEach(button => {
      button.setAttribute('aria-label', `Show UML example for ${button.textContent.trim()}`);
    });
    qa('.uml-v5-rel-card svg').forEach(svg => svg.setAttribute('focusable', 'false'));
    const code = document.getElementById('codeExample');
    if (code) code.setAttribute('aria-label', 'Implementation example');
    const notebook = document.getElementById('theoryCodingLab');
    if (notebook) notebook.setAttribute('aria-label', 'Executable theory notebook');
  }

  function init() {
    const { topic, lang } = currentContext();
    document.body.classList.add('theory-page');
    document.body.dataset.topic = topic.slug;
    buildHero(topic, lang);
    markPreviewSubsections();
    const sections = organizeSections(topic);
    buildSectionNav(sections);
    improveSemantics();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 24), { once: true });
  } else {
    setTimeout(init, 24);
  }
})();
