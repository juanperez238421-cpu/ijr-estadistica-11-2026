(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>\"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'
  }[char]));

  const normalizedText = value => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function topicSearchText(topic){
    const parts = [
      topic.slug, topic.sequence, topic.title, topic.nav, topic.lead, topic.definition,
      ...(topic.goals || []),
      ...(topic.sections || []).flatMap(section => [section.title, section.body]),
      ...(topic.syntax || []).flat(),
      ...(topic.pitfalls || []),
      ...(topic.diagrams || []).flatMap(diagram => [diagram.title, diagram.description]),
      ...(topic.resources || []).flatMap(resource => [resource.name, resource.kind]),
      topic.workshopIntro,
      ...(topic.exercises || []).flatMap(exercise => [exercise.key, exercise.title, exercise.prompt, ...(exercise.choices || [])])
    ];
    return normalizedText(parts.join(' '));
  }

  function renderList(items, emptyCopy='No items defined.'){
    if (!items?.length) return `<p class="course-empty">${escapeHtml(emptyCopy)}</p>`;
    return `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  }

  function renderSyntax(rows){
    if (!rows?.length) return '<p class="course-empty">No syntax reference defined.</p>';
    return `<div class="course-table-wrap"><table class="course-mini-table"><thead><tr><th>Concept</th><th>Python</th></tr></thead><tbody>${rows.map(row => `<tr><td>${escapeHtml(row[0])}</td><td><code>${escapeHtml(row[1])}</code></td></tr>`).join('')}</tbody></table></div>`;
  }

  function renderSections(sections){
    if (!sections?.length) return '<p class="course-empty">No theory sections defined.</p>';
    return `<div class="theory-section-grid">${sections.map(section => `<article><h5>${escapeHtml(section.title)}</h5><p>${escapeHtml(section.body)}</p></article>`).join('')}</div>`;
  }

  function renderDiagrams(diagrams){
    if (!diagrams?.length) return '<p class="course-empty">No diagram notes defined.</p>';
    return `<div class="diagram-note-grid">${diagrams.map(diagram => `<article><span>${escapeHtml(diagram.type || 'diagram')}</span><strong>${escapeHtml(diagram.title)}</strong><p>${escapeHtml(diagram.description)}</p></article>`).join('')}</div>`;
  }

  function renderResources(resources){
    if (!resources?.length) return '<p class="course-empty">No external resources defined for this topic.</p>';
    return `<div class="resource-chip-grid">${resources.map(resource => `<a href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(resource.name)}</strong><span>${escapeHtml(resource.kind || 'Resource')}</span></a>`).join('')}</div>`;
  }

  function renderExercise(exercise, index){
    const isCode = exercise.mode === 'code';
    const choices = exercise.choices?.length
      ? `<ol class="choice-preview" type="A">${exercise.choices.map(choice => `<li>${escapeHtml(choice)}</li>`).join('')}</ol>`
      : '';
    const starter = isCode && String(exercise.code || '').trim()
      ? `<div class="starter-code"><span>Starter code</span><pre><code>${escapeHtml(exercise.code)}</code></pre></div>`
      : isCode
        ? '<div class="blank-code-policy">Blank code cell · student must write the solution</div>'
        : '';
    return `<article class="workshop-problem">
      <div class="problem-head">
        <div><span class="problem-number">${String(index + 1).padStart(2,'0')}</span><code>${escapeHtml(exercise.key || '')}</code></div>
        <span class="problem-mode ${isCode ? 'code-mode' : 'choice-mode'}">${isCode ? 'CODE' : 'CHOICE'}</span>
      </div>
      <h5>${escapeHtml(exercise.title || `Problem ${index + 1}`)}</h5>
      <p>${escapeHtml(exercise.prompt || '')}</p>
      ${choices}${starter}
    </article>`;
  }

  function renderTopic(topic){
    const exercises = topic.exercises || [];
    const codeCount = exercises.filter(exercise => exercise.mode === 'code').length;
    const choiceCount = exercises.filter(exercise => exercise.mode === 'choice').length;
    return `<details class="course-topic" data-course-topic="${escapeHtml(topic.slug)}" data-course-search="${escapeHtml(topicSearchText(topic))}">
      <summary>
        <div class="topic-summary-main">
          <span class="topic-sequence">${String(topic.sequence).padStart(2,'0')}</span>
          <div><strong>${escapeHtml(topic.title)}</strong><span>${escapeHtml(topic.nav || topic.slug)}</span></div>
        </div>
        <div class="topic-summary-meta"><span>${(topic.sections || []).length} theory sections</span><span>${exercises.length} workshop problems</span></div>
      </summary>
      <div class="course-topic-content">
        <section class="course-content-panel theory-panel" data-course-part="theory">
          <div class="content-panel-heading"><div><span class="eyebrow">THEORY</span><h4>Complete theory inspection</h4></div><span class="content-count">${(topic.goals || []).length} goals · ${(topic.sections || []).length} sections</span></div>
          <p class="course-lead">${escapeHtml(topic.lead || '')}</p>
          <div class="definition-box"><span>Core definition</span><p>${escapeHtml(topic.definition || '')}</p></div>
          <div class="theory-columns">
            <div><h5>Learning goals</h5>${renderList(topic.goals)}</div>
            <div><h5>Common pitfalls</h5>${renderList(topic.pitfalls)}</div>
          </div>
          <h5 class="subsection-title">Theory sections</h5>
          ${renderSections(topic.sections)}
          <h5 class="subsection-title">Syntax reference</h5>
          ${renderSyntax(topic.syntax)}
          <h5 class="subsection-title">Diagram / visual notes</h5>
          ${renderDiagrams(topic.diagrams)}
          <h5 class="subsection-title">Resources</h5>
          ${renderResources(topic.resources)}
        </section>
        <section class="course-content-panel workshop-panel" data-course-part="workshop">
          <div class="content-panel-heading">
            <div><span class="eyebrow">WORKSHOP</span><h4>Complete workshop inspection</h4></div>
            <div class="workshop-heading-actions"><span class="content-count">${exercises.length} total · ${codeCount} code · ${choiceCount} choice</span><button type="button" class="tiny-action" data-copy-workshop="${escapeHtml(topic.slug)}">Copy workshop</button></div>
          </div>
          <div class="workshop-intro"><strong>Workshop instructions</strong><p>${escapeHtml(topic.workshopIntro || '')}</p></div>
          <div class="workshop-problem-grid">${exercises.map(renderExercise).join('')}</div>
        </section>
      </div>
    </details>`;
  }

  function workshopText(topic){
    const lines = [
      `${String(topic.sequence).padStart(2,'0')} · ${topic.title}`,
      '',
      topic.workshopIntro || '',
      ''
    ];
    (topic.exercises || []).forEach((exercise, index) => {
      lines.push(`${index + 1}. ${exercise.title}`);
      lines.push(exercise.prompt || '');
      if (exercise.choices?.length) {
        exercise.choices.forEach((choice, choiceIndex) => lines.push(`   ${String.fromCharCode(65 + choiceIndex)}. ${choice}`));
      } else if (exercise.mode === 'code') {
        lines.push('   [Blank Python code cell]');
      }
      lines.push('');
    });
    return lines.join('\n').trim();
  }

  async function copyWorkshop(slug, topics){
    const topic = topics.find(item => item.slug === slug);
    if (!topic) return;
    const button = document.querySelector(`[data-copy-workshop="${CSS.escape(slug)}"]`);
    try {
      await navigator.clipboard.writeText(workshopText(topic));
      if (button) {
        const original = button.textContent;
        button.textContent = 'Copied';
        setTimeout(() => { button.textContent = original; }, 1200);
      }
    } catch {
      if (button) button.textContent = 'Copy unavailable';
    }
  }

  function applyFilters(){
    const search = normalizedText($('courseSearch')?.value || '');
    const mode = $('courseMode')?.value || 'all';
    let visible = 0;

    document.querySelectorAll('[data-course-topic]').forEach(details => {
      const matches = !search || details.dataset.courseSearch.includes(search);
      details.classList.toggle('course-filtered-out', !matches);
      if (matches) visible += 1;
      details.querySelectorAll('[data-course-part]').forEach(panel => {
        panel.classList.toggle('course-part-hidden', mode !== 'all' && panel.dataset.coursePart !== mode);
      });
    });

    const status = $('courseFilterStatus');
    if (status) status.textContent = `${visible} topic${visible === 1 ? '' : 's'} shown`;
  }

  function init(){
    const topics = [...(window.IJR_PYTHON_HUB_TOPICS || [])].sort((a,b) => Number(a.sequence) - Number(b.sequence));
    const list = $('courseInspectorList');
    if (!list) return;

    if (!topics.length) {
      list.innerHTML = '<div class="course-load-error">Course data could not be loaded. Refresh the page and try again.</div>';
      return;
    }

    const totalProblems = topics.reduce((sum, topic) => sum + (topic.exercises || []).length, 0);
    const codeProblems = topics.reduce((sum, topic) => sum + (topic.exercises || []).filter(exercise => exercise.mode === 'code').length, 0);
    const choiceProblems = totalProblems - codeProblems;
    const theorySections = topics.reduce((sum, topic) => sum + (topic.sections || []).length, 0);

    $('courseInspectorSummary').innerHTML = [
      ['Topics', topics.length],
      ['Theory sections', theorySections],
      ['Workshop problems', totalProblems],
      ['Code / choice', `${codeProblems} / ${choiceProblems}`]
    ].map(([label,value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');

    list.innerHTML = topics.map(renderTopic).join('');
    applyFilters();

    $('courseSearch')?.addEventListener('input', applyFilters);
    $('courseMode')?.addEventListener('change', applyFilters);
    $('courseExpandAll')?.addEventListener('click', () => {
      document.querySelectorAll('[data-course-topic]:not(.course-filtered-out)').forEach(details => { details.open = true; });
    });
    $('courseCollapseAll')?.addEventListener('click', () => {
      document.querySelectorAll('[data-course-topic]').forEach(details => { details.open = false; });
    });
    $('coursePrint')?.addEventListener('click', () => window.print());
    list.addEventListener('click', event => {
      const button = event.target.closest('[data-copy-workshop]');
      if (button) copyWorkshop(button.dataset.copyWorkshop, topics);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
