(() => {
  'use strict';

  const requested = new URLSearchParams(location.search).get('topic') || 'operations';
  if (requested !== 'operations') return;

  const basics = [
    {name:'print(value)', group:'CORE NOW', meaning:'Show a value or result in the output area.', example:'print(25)'},
    {name:'type(value)', group:'CORE NOW', meaning:'Ask Python what kind of value it is working with.', example:'type(4.5)'},
    {name:'len(value)', group:'CORE NOW', meaning:'Count how many items are in a list, string or other collection.', example:'len([4, 8, 12])'},
    {name:'int(value)', group:'CONVERT', meaning:'Convert a compatible value to an integer.', example:'int("12")'},
    {name:'float(value)', group:'CONVERT', meaning:'Convert a compatible value to a decimal number.', example:'float("4.5")'},
    {name:'str(value)', group:'CONVERT', meaning:'Convert a value to text.', example:'str(2026)'},
    {name:'bool(value)', group:'CONVERT', meaning:'Convert a value to True or False using Python truth rules.', example:'bool(1)'},
    {name:'round(number, digits)', group:'USEFUL NEXT', meaning:'Round a numeric result to a chosen number of decimal places.', example:'round(3.14159, 2)'},
    {name:'sum(values)', group:'USEFUL NEXT', meaning:'Add all numeric values in a collection.', example:'sum([4, 8, 12])'},
    {name:'min(values) / max(values)', group:'USEFUL NEXT', meaning:'Find the smallest or largest value in a collection.', example:'max([4, 8, 12])'}
  ];

  const escapeHtml = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  function cardsHtml() {
    return basics.map(item => `
      <article class="beginner-function-card-v17">
        <span>${escapeHtml(item.group)}</span>
        <code>${escapeHtml(item.name)}</code>
        <p>${escapeHtml(item.meaning)}</p>
        <small>${escapeHtml(item.example)}</small>
      </article>`).join('');
  }

  function installTheory() {
    const concept = document.getElementById('conceptSection');
    if (!concept || document.getElementById('beginnerBasicsV17')) return false;
    if (!document.getElementById('theoryApp') || document.getElementById('theoryApp').classList.contains('hidden')) return false;

    const section = document.createElement('section');
    section.id = 'beginnerBasicsV17';
    section.className = 'beginner-basics-v17';
    section.innerHTML = `
      <div class="section-heading beginner-heading-v17">
        <p class="eyebrow">BEGINNER PYTHON TOOLBOX</p>
        <h2>Functions you should recognize on day one</h2>
        <p>A <strong>function</strong> is a named action that Python already knows how to perform. You call a function by writing its name followed by parentheses. Information placed inside the parentheses is called an <strong>argument</strong>. Some functions display something, some inspect a value, some convert it, and some calculate a new result.</p>
      </div>
      <div class="function-anatomy-v17" aria-label="Function-call anatomy">
        <div class="function-call-v17"><b>print</b><span>(</span><strong>17 + 8</strong><span>)</span></div>
        <div class="function-arrow-v17">→</div>
        <div class="function-result-v17"><small>OUTPUT</small><strong>25</strong></div>
        <div class="function-legend-v17">
          <div><b>print</b><span>function name</span></div>
          <div><b>( )</b><span>function call</span></div>
          <div><b>17 + 8</b><span>argument / expression</span></div>
          <div><b>25</b><span>result shown by print()</span></div>
        </div>
      </div>
      <div class="beginner-function-grid-v17">${cardsHtml()}</div>
      <div class="beginner-rule-v17">
        <div><strong>Read code from the inside out.</strong><p>In <code>print(len(values))</code>, Python first evaluates <code>len(values)</code>. Then <code>print(...)</code> displays that result.</p></div>
        <div><strong>A function is not the same as an operator.</strong><p><code>print(...)</code> and <code>type(...)</code> use parentheses. Operators such as <code>+</code>, <code>*</code>, <code>**</code> and <code>%</code> sit between or beside values.</p></div>
        <div><strong>You do not need to memorize everything immediately.</strong><p>Start by recognizing what each tool is for. The workshop tells you which action is needed, and later topics will reuse these same functions with variables, lists and statistics.</p></div>
      </div>
      <aside class="beginner-later-v17"><strong>Standard Python also includes <code>input(...)</code></strong><span>for asking a user to type information. It is an important beginner function, but the current browser workshop does not require interactive keyboard input, so it is introduced here as context rather than as a required tool.</span></aside>`;

    concept.insertAdjacentElement('afterend', section);
    return true;
  }

  function installWorkshop() {
    const layout = document.querySelector('.workshop-layout-full');
    const rail = document.querySelector('.workshop-stage-rail');
    if (!layout || !rail || document.getElementById('workshopBasicsV17')) return false;
    if (!document.getElementById('workshopApp') || document.getElementById('workshopApp').classList.contains('hidden')) return false;

    const panel = document.createElement('section');
    panel.id = 'workshopBasicsV17';
    panel.className = 'workshop-basics-v17';
    panel.innerHTML = `
      <div class="workshop-basics-copy-v17">
        <p class="eyebrow">BEGINNER TOOLBOX</p>
        <strong>Before you code: recognize these essential Python functions.</strong>
        <span>You will not use every function in every stage. Read the task, choose the tool that matches the action, then run the cell and inspect the black terminal.</span>
      </div>
      <div class="workshop-basics-chips-v17" aria-label="Essential Python functions">
        <span><code>print()</code><small>show</small></span>
        <span><code>type()</code><small>inspect type</small></span>
        <span><code>len()</code><small>count</small></span>
        <span><code>int()</code><small>to integer</small></span>
        <span><code>float()</code><small>to decimal</small></span>
        <span><code>str()</code><small>to text</small></span>
        <span><code>bool()</code><small>to True/False</small></span>
        <span><code>round()</code><small>round number</small></span>
      </div>
      <div class="workshop-function-model-v17"><code>function(argument)</code><span>→</span><b>result / action</b></div>`;
    rail.insertAdjacentElement('afterend', panel);
    return true;
  }

  function install() {
    installTheory();
    installWorkshop();
  }

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      install();
    });
  };

  new MutationObserver(schedule).observe(document.documentElement, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
  window.addEventListener('load', schedule, {once:true});
  schedule();
})();