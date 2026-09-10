(() => {
  'use strict';

  const requested = new URLSearchParams(location.search).get('topic') || 'operations';
  const sourceTopics = window.IJR_PYTHON_HUB_TOPICS || [];

  // Replace only the Arrays theory metadata. Workshop exercises and keys stay
  // exactly as defined by the shared curriculum/catalog so grading remains stable.
  const rebuilt = sourceTopics.map(topic => {
    if (topic.slug !== 'arrays') return topic;
    return Object.freeze({
      ...topic,
      title: 'Arrays and Python lists',
      nav: 'Arrays / lists',
      lead: 'Real statistical work rarely uses one isolated number. A Python list groups many observations under one variable name so the data can be indexed, extended, summarized and later moved into a DataFrame.',
      definition: 'In core Python, the structure used in this lesson is a list. A list is an ordered, mutable, zero-indexed collection written with square brackets. The word array describes the broader idea of an ordered collection, but Python lists are not the same object as NumPy arrays. Here, lists are the bridge from individual values to statistical datasets.',
      goals: [
        'Create and read a Python list using square brackets.',
        'Explain the difference between a value and its zero-based index.',
        'Retrieve an observation by position without copying the visible value.',
        'Extend a list with append(...) and explain that the original list changes.',
        'Use len(), sum(), min() and max() on the complete collection.',
        'Calculate a mean as sum(values) / len(values) and connect lists to later DataFrame analysis.'
      ],
      sections: [
        { title: 'Why one collection is better than many variables', body: 'A sequence such as score1, score2, score3 becomes difficult to maintain as the dataset grows. A list keeps related observations together, preserves their order and lets one instruction operate on the whole collection.' },
        { title: 'Anatomy of a list', body: 'Square brackets define the collection. Commas separate elements. The variable name refers to the complete list, while each element can still be accessed individually by its position.' },
        { title: 'Indexes identify positions', body: 'Python counts positions from zero: index 0 is the first element, index 1 is the second, and so on. An index is an address inside the collection; it is not the data value itself.' },
        { title: 'Lists can grow', body: 'Lists are mutable. values.append(new_value) adds one observation to the end of the existing list. This is different from creating a separate variable because the collection itself is updated.' },
        { title: 'A collection can be summarized', body: 'Functions such as len(), sum(), min() and max() ask questions about the whole list. Combining sum(values) with len(values) produces a first statistical summary: the arithmetic mean.' },
        { title: 'Bridge to data analysis', body: 'A list is still one-dimensional data. Later, Pandas combines several variables into a DataFrame. Understanding ordered observations, indexing and whole-collection operations makes that transition much easier.' }
      ],
      syntax: [
        ['Create a list', 'values = [12, 18, 21, 15]'],
        ['First observation', 'values[0]'],
        ['Third observation', 'values[2]'],
        ['Number of observations', 'len(values)'],
        ['Total', 'sum(values)'],
        ['Minimum / maximum', 'min(values)\nmax(values)'],
        ['Append one observation', 'values.append(24)'],
        ['Mean from the list', 'mean = sum(values) / len(values)']
      ],
      pitfalls: [
        'Starting the first index at 1 instead of 0.',
        'Confusing the index with the value stored at that position.',
        'Using parentheses instead of square brackets when retrieving an item.',
        'Typing a visible answer directly instead of reading it from the list.',
        'Hard-coding the number of observations instead of using len(values).',
        'Using the word array as if a core Python list and a NumPy array were exactly the same object.'
      ],
      diagrams: [
        { type: 'array-anatomy-v34', title: 'One variable stores an ordered collection', description: 'The variable refers to the complete list. Every element has both a value and a position inside the collection.' },
        { type: 'array-index-v34', title: 'Zero-based indexing is a position system', description: 'Follow the index from the code expression to the matching cell. Python index 2 points to the third element.' },
        { type: 'array-append-v34', title: 'append(...) changes the existing list', description: 'A new observation moves into the next available position while the earlier values remain in order.' },
        { type: 'array-summary-v34', title: 'One list supports several whole-data questions', description: 'Length, total, minimum and maximum are different questions asked about the same collection.' },
        { type: 'array-mean-v34', title: 'Mean = total divided by number of observations', description: 'The mean reuses two whole-list operations: calculate the total, calculate the count, then divide.' },
        { type: 'array-dataset-v34', title: 'Lists prepare the mental model for DataFrames', description: 'A list represents one variable. A later table combines several variables while preserving the same idea of observations that can be selected and summarized.' }
      ],
      workshopIntro: 'Use the list itself as the source of truth. Build each solution from a blank cell, retrieve or summarize values with Python, run the code, inspect the output, and then validate.'
    });
  });

  const finalized = Object.freeze(rebuilt);
  window.IJR_PYTHON_HUB_TOPICS = finalized;
  window.IJR_PYTHON_HUB_TOPIC_MAP = Object.freeze(Object.fromEntries(finalized.map(topic => [topic.slug, topic])));

  if (requested !== 'arrays') return;

  document.documentElement.classList.add('arrays-theory-v34-root');

  const figures = [
    () => `
      <div class="arr34-figure arr34-anatomy" aria-label="Python list anatomy">
        <div class="arr34-var">values</div><div class="arr34-arrow">→</div>
        <div class="arr34-bracket">[</div>
        <div class="arr34-cell-row">
          ${[['12','0'],['18','1'],['21','2'],['15','3']].map(([value,index],i)=>`<div class="arr34-cell" style="--i:${i}"><strong>${value}</strong><span>index ${index}</span></div>`).join('')}
        </div>
        <div class="arr34-bracket">]</div>
        <div class="arr34-caption">ONE NAME · FOUR ORDERED OBSERVATIONS</div>
      </div>`,
    () => `
      <div class="arr34-figure arr34-indexing" aria-label="Zero based indexing animation">
        <div class="arr34-code">values[2]</div>
        <div class="arr34-index-line"><span>index</span><strong>2</strong><i></i></div>
        <div class="arr34-cell-row arr34-index-row">
          ${[['6','0'],['10','1'],['15','2'],['21','3']].map(([value,index],i)=>`<div class="arr34-cell ${i===2?'target':''}" style="--i:${i}"><strong>${value}</strong><span>${index}</span></div>`).join('')}
        </div>
        <div class="arr34-result">third element → <strong>15</strong></div>
      </div>`,
    () => `
      <div class="arr34-figure arr34-append" aria-label="Append animation">
        <div class="arr34-state"><span>before</span><div class="arr34-mini-list"><b>6</b><b>12</b></div></div>
        <div class="arr34-floating-value">18</div>
        <div class="arr34-command">values.append(18)</div>
        <div class="arr34-state after"><span>after</span><div class="arr34-mini-list"><b>6</b><b>12</b><b class="new">18</b></div></div>
      </div>`,
    () => `
      <div class="arr34-figure arr34-summary" aria-label="List summary functions">
        <div class="arr34-source">values = [5, 10, 15, 20]</div>
        <div class="arr34-summary-grid">
          <div style="--i:0"><span>len(values)</span><strong>4</strong><small>count</small></div>
          <div style="--i:1"><span>sum(values)</span><strong>50</strong><small>total</small></div>
          <div style="--i:2"><span>min(values)</span><strong>5</strong><small>minimum</small></div>
          <div style="--i:3"><span>max(values)</span><strong>20</strong><small>maximum</small></div>
        </div>
      </div>`,
    () => `
      <div class="arr34-figure arr34-mean" aria-label="Mean from a list">
        <div class="arr34-mean-flow">
          <div><span>sum(values)</span><strong>50</strong></div><i>÷</i>
          <div><span>len(values)</span><strong>4</strong></div><i>=</i>
          <div class="final"><span>mean</span><strong>12.5</strong></div>
        </div>
        <div class="arr34-balance"><span style="--h:40%"></span><span style="--h:70%"></span><span style="--h:100%"></span><span style="--h:55%"></span><b>equal-share summary</b></div>
      </div>`,
    () => `
      <div class="arr34-figure arr34-dataset" aria-label="List to DataFrame bridge">
        <div class="arr34-one-variable"><small>ONE VARIABLE</small><strong>nota</strong><span>[4.2, 3.8, 2.9, 4.5]</span></div>
        <div class="arr34-arrow-long">→</div>
        <div class="arr34-table"><small>MULTIPLE VARIABLES</small><div class="arr34-table-grid"><b>grupo</b><b>edad</b><b>nota</b><span>11A</span><span>16</span><span>4.2</span><span>11A</span><span>17</span><span>3.8</span><span>11B</span><span>16</span><span>2.9</span></div></div>
      </div>`
  ];

  let enhancing = false;
  function enhance() {
    if (enhancing) return;
    const grid = document.getElementById('diagramGrid');
    if (!grid || grid.children.length < figures.length) return;
    enhancing = true;
    document.body.classList.add('arrays-theory-v34');
    [...grid.querySelectorAll('.diagram-stage')].slice(0, figures.length).forEach((stage, index) => {
      if (stage.dataset.arraysV34 === '1') return;
      stage.innerHTML = figures[index]();
      stage.dataset.arraysV34 = '1';
    });
    const heading = document.querySelector('.theory-diagrams-section .section-heading');
    if (heading) {
      const title = heading.querySelector('h2');
      const copy = heading.querySelector('p:not(.eyebrow)');
      if (title) title.textContent = 'See how a list stores, locates, grows and summarizes data.';
      if (copy) copy.textContent = 'Follow each animated figure from left to right. The visuals use different values from the workshop so they explain the idea without becoming an answer key.';
    }
    enhancing = false;
  }

  document.addEventListener('DOMContentLoaded', () => {
    enhance();
    const grid = document.getElementById('diagramGrid');
    if (grid) {
      const observer = new MutationObserver(() => queueMicrotask(enhance));
      observer.observe(grid, { childList: true, subtree: true });
    }
    setTimeout(enhance, 50);
    setTimeout(enhance, 250);
  });
})();
