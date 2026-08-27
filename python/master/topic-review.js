(() => {
  'use strict';

  const topics = Array.isArray(window.IJR_PYTHON_HUB_TOPICS)
    ? [...window.IJR_PYTHON_HUB_TOPICS].sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0))
    : [];

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const state = { query: '' };

  function exerciseMarkup(exercise) {
    const code = String(exercise.code || '').trim();
    const choices = Array.isArray(exercise.choices) ? exercise.choices : [];
    return `
      <article class="topic-review-exercise">
        <div class="topic-review-exercise-head">
          <span class="topic-review-key">${esc(exercise.key || '')}</span>
          <span class="topic-review-mode">${esc(exercise.mode || 'task')}</span>
        </div>
        <h4>${esc(exercise.title || 'Exercise')}</h4>
        <p>${esc(exercise.prompt || '')}</p>
        ${code ? `<pre><code>${esc(code)}</code></pre>` : ''}
        ${choices.length ? `<div class="topic-review-choices">${choices.map(choice => `<span>${esc(choice)}</span>`).join('')}</div>` : ''}
      </article>`;
  }

  function topicMarkup(topic) {
    const goals = Array.isArray(topic.goals) ? topic.goals : [];
    const sections = Array.isArray(topic.sections) ? topic.sections : [];
    const syntax = Array.isArray(topic.syntax) ? topic.syntax : [];
    const exercises = Array.isArray(topic.exercises) ? topic.exercises : [];
    const diagrams = Array.isArray(topic.diagrams) ? topic.diagrams : [];
    const slug = encodeURIComponent(topic.slug || '');

    return `
      <article class="topic-review-card" data-topic-slug="${esc(topic.slug || '')}">
        <div class="topic-review-card-head">
          <div class="topic-review-sequence">${String(Number(topic.sequence || 0)).padStart(2, '0')}</div>
          <div class="topic-review-title-block">
            <p class="eyebrow">${esc(topic.nav || 'PYTHON TOPIC')}</p>
            <h3>${esc(topic.title || topic.slug || 'Topic')}</h3>
            <p>${esc(topic.lead || '')}</p>
          </div>
          <div class="topic-review-actions">
            <a class="button button-light" href="../theory.html?topic=${slug}" target="_blank" rel="noopener">Open theory</a>
            <a class="button" href="../workshop.html?topic=${slug}" target="_blank" rel="noopener">Open workshop</a>
          </div>
        </div>

        <div class="topic-review-meta">
          <span>${goals.length} goals</span>
          <span>${sections.length} theory sections</span>
          <span>${diagrams.length} diagrams</span>
          <span>${syntax.length} syntax items</span>
          <span>${exercises.length} workshop stages</span>
        </div>

        <details class="topic-review-details">
          <summary>Review complete topic content</summary>
          <div class="topic-review-body">
            <section>
              <h4>Definition</h4>
              <p>${esc(topic.definition || '')}</p>
            </section>

            <section>
              <h4>Learning goals</h4>
              <ol class="topic-review-goals">${goals.map(goal => `<li>${esc(goal)}</li>`).join('')}</ol>
            </section>

            <section>
              <h4>Theory map</h4>
              <div class="topic-review-theory-map">${sections.map(section => `
                <div>
                  <strong>${esc(section.title || '')}</strong>
                  <p>${esc(section.body || '')}</p>
                </div>`).join('')}</div>
            </section>

            <section>
              <div class="topic-review-subhead">
                <div>
                  <h4>Workshop</h4>
                  <p>${esc(topic.workshopIntro || '')}</p>
                </div>
                <strong>${exercises.length} stages</strong>
              </div>
              <div class="topic-review-exercises">${exercises.map(exerciseMarkup).join('')}</div>
            </section>
          </div>
        </details>
      </article>`;
  }

  function filteredTopics() {
    const q = state.query.toLowerCase();
    if (!q) return topics;
    return topics.filter(topic => {
      const haystack = [topic.slug, topic.title, topic.nav, topic.lead, ...(topic.goals || [])].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }

  function render() {
    const list = $('topicReviewList');
    const summary = $('topicReviewSummary');
    if (!list || !summary) return;

    const rows = filteredTopics();
    const totalExercises = topics.reduce((sum, topic) => sum + (Array.isArray(topic.exercises) ? topic.exercises.length : 0), 0);
    summary.innerHTML = `
      <span><strong>${topics.length}</strong> topics in the canonical course source</span>
      <span><strong>${totalExercises}</strong> workshop stages available for teacher review</span>
      <span><strong>${rows.length}</strong> topics shown</span>`;

    list.innerHTML = rows.map(topicMarkup).join('') || '<p class="muted">No topics match this search.</p>';
  }

  function setAll(open) {
    document.querySelectorAll('#topicReviewList details').forEach(details => { details.open = open; });
  }

  function init() {
    if (!topics.length) {
      const status = $('topicReviewStatus');
      if (status) {
        status.textContent = 'The canonical Python topic source could not be loaded.';
        status.className = 'status error';
      }
      return;
    }

    render();
    const search = $('topicReviewSearch');
    if (search) search.addEventListener('input', event => {
      state.query = event.target.value.trim();
      render();
    });
    $('expandAllTopics')?.addEventListener('click', () => setAll(true));
    $('collapseAllTopics')?.addEventListener('click', () => setAll(false));

    const status = $('topicReviewStatus');
    if (status) {
      status.textContent = 'Synchronized with python/course-data-v4.js — the same topic source used by the student hub.';
      status.className = 'status ok';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
