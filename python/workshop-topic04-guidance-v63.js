(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  if ((params.get('topic') || 'statistics') !== 'logic') return;

  const VERSION = 'v63';
  const guidance = {
    1: {
      names:[['math','library'],['root','result variable']],
      flow:['import math','math.sqrt(81)','root','print(root)','9.0'],
      expected:'9.0',
      check:'The square root must come from math.sqrt(...), not from a manually typed answer.',
      mistake:'Writing sqrt(81) without importing math or without the math. prefix.'
    },
    2: {
      names:[['statistics','library'],['values','input list'],['mean_value','calculated mean']],
      flow:['import statistics','values','statistics.mean(values)','mean_value','print'],
      expected:'83',
      check:'mean_value must be calculated from the list values.',
      mistake:'Typing the final mean directly instead of calling statistics.mean(values).'
    },
    3: {
      names:[['Path','class imported from pathlib'],['file','Path object']],
      flow:['import Path','filename text','Path(...)','file.suffix','.xlsx'],
      expected:'.xlsx',
      check:'The extension must come from the Path object property file.suffix.',
      mistake:'Using suffix() with parentheses. suffix is a property, not a function.'
    },
    4: {
      names:[['load_workbook','openpyxl reader'],['wb','workbook object'],['sheet_names','worksheet-name list'],['has_students','Boolean check']],
      flow:['load workbook','wb.sheetnames','sheet_names','"Students" in ...','True'],
      expected:'True',
      check:'The code must test membership in the real workbook sheet-name list.',
      mistake:'Comparing wb.sheetnames directly with the string "Students".'
    },
    5: {
      names:[['wb','workbook'],['ws','Students worksheet'],['first_cell','A1 value'],['rows','row count'],['columns','column count'],['check','final Boolean']],
      flow:['wb','ws = wb["Students"]','A1 + dimensions','3 conditions with and','check'],
      expected:'True',
      check:'All three conditions must be true: A1 has content, rows > 1, columns >= 5.',
      mistake:'Using or instead of and, which would allow an incomplete worksheet to pass.'
    },
    6: {
      names:[['wb','new workbook'],['ws','active worksheet'],['output_file','Path to saved XLSX']],
      flow:['Workbook()','rename Summary','write A1','save output_file','exists()','True'],
      expected:'True',
      check:'Save the workbook before asking Path.exists() whether the file exists.',
      mistake:'Checking output_file.exists() before wb.save(output_file).'
    },
    7: {
      names:[['pd','Pandas alias'],['df','DataFrame']],
      flow:['import pandas as pd','pd.read_excel(...)','df','type(df).__name__','DataFrame'],
      expected:'DataFrame',
      check:'df must be created from the Students worksheet with pd.read_excel(...).',
      mistake:'Using read_excel(...) without the pd. prefix or omitting sheet_name="Students".'
    },
    8: {
      names:[['df','DataFrame'],['rows','number of rows'],['columns','number of columns'],['column_names','list of labels'],['preview','first rows'],['check','structure Boolean']],
      flow:['read XLSX','df.shape','columns.tolist() + head()','rows/columns check','True'],
      expected:'True',
      check:'Inspect structure before doing any statistical transformation.',
      mistake:'Confusing df.shape with a function. Use df.shape, not df.shape().'
    },
    9: {
      names:[['df','DataFrame'],['scores','selected Series'],['preview','first values']],
      flow:['df','df["score"]','scores','scores.head()','type → Series'],
      expected:'Series',
      check:'Selecting one DataFrame column should produce a Pandas Series.',
      mistake:'Using double brackets df[["score"]], which returns a DataFrame instead of a Series.'
    },
    10: {
      names:[['df','source DataFrame'],['filtered','filtered DataFrame'],['has_rows','non-empty check'],['all_high','threshold check'],['check','combined Boolean']],
      flow:['df["score"] >= 90','df.loc[...]','filtered','all() + len()','check'],
      expected:'True',
      check:'filtered must contain rows and every remaining score must satisfy >= 90.',
      mistake:'Filtering with > 90 instead of >= 90, or forgetting .all() in the verification.'
    },
    11: {
      names:[['df','source DataFrame'],['passed','new Boolean column'],['ordered','sorted DataFrame'],['has_passed','column check'],['descending','sort-order check']],
      flow:['derive passed','sort_values','ordered','verify column + order','True'],
      expected:'True',
      check:'Sort the full DataFrame so complete student records stay aligned.',
      mistake:'Sorting only df["score"] rather than the full DataFrame.'
    },
    12: {
      names:[['df','source DataFrame'],['filtered','rows with score >= 80'],['output_file','export path']],
      flow:['filter >= 80','filtered','to_excel(index=False)','output_file.exists()','True'],
      expected:'True',
      check:'The same exact filename must be used for export and for the existence check.',
      mistake:'Forgetting index=False or checking a different filename from the one exported.'
    }
  };

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  function stageNumber() {
    const text = document.getElementById('problemKicker')?.textContent || '';
    const match = text.match(/STAGE\s+(\d+)/i);
    return match ? Number(match[1]) : 1;
  }

  function variablesHtml(items) {
    return items.map(([name, role]) =>
      '<span class="v63-name-chip"><code>' + escapeHtml(name) + '</code><small>' + escapeHtml(role) + '</small></span>'
    ).join('');
  }

  function flowHtml(items) {
    return items.map((item, index) =>
      '<span class="v63-flow-node"><code>' + escapeHtml(item) + '</code></span>' +
      (index < items.length - 1 ? '<span class="v63-flow-arrow" aria-hidden="true">→</span>' : '')
    ).join('');
  }

  function ensureScaffold() {
    const panel = document.getElementById('guidePanel');
    const steps = document.getElementById('guideSteps');
    if (!panel || !steps) return null;

    let scaffold = document.getElementById('topic04GuideV63');
    if (!scaffold) {
      scaffold = document.createElement('section');
      scaffold.id = 'topic04GuideV63';
      scaffold.className = 'v63-guide-scaffold';
      scaffold.setAttribute('aria-label', 'Explicit coding plan');
      steps.before(scaffold);
    }
    return scaffold;
  }

  function sync() {
    const stage = stageNumber();
    const entry = guidance[stage];
    if (!entry) return;
    const scaffold = ensureScaffold();
    if (!scaffold) return;

    if (scaffold.dataset.stage === String(stage)) {
      document.documentElement.dataset.topic04Guidance = VERSION;
      return;
    }

    scaffold.innerHTML =
      '<div class="v63-section">' +
        '<div class="v63-section-title"><span>1</span><strong>Use these exact names</strong></div>' +
        '<div class="v63-name-grid">' + variablesHtml(entry.names) + '</div>' +
      '</div>' +
      '<div class="v63-section">' +
        '<div class="v63-section-title"><span>2</span><strong>Follow this flow</strong></div>' +
        '<div class="v63-flow" role="img" aria-label="Step-by-step coding flow">' + flowHtml(entry.flow) + '</div>' +
      '</div>' +
      '<div class="v63-section v63-check">' +
        '<div class="v63-section-title"><span>3</span><strong>Check before Validate</strong></div>' +
        '<div class="v63-check-grid">' +
          '<div><small>EXPECTED OUTPUT</small><code>' + escapeHtml(entry.expected) + '</code></div>' +
          '<div><small>VERIFY</small><p>' + escapeHtml(entry.check) + '</p></div>' +
        '</div>' +
        '<div class="v63-mistake"><strong>Common mistake:</strong> ' + escapeHtml(entry.mistake) + '</div>' +
      '</div>';

    scaffold.dataset.stage = String(stage);
    document.documentElement.dataset.topic04Guidance = VERSION;
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
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
      characterData:true,
      attributes:true,
      attributeFilter:['class']
    });
    document.addEventListener('click', event => {
      if (event.target.closest('[data-stage], #previousButton, #nextButton, #hintButton, #resetButton, #validateButton')) schedule();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();