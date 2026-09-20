(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  if ((params.get('topic') || 'operations') !== 'logic') return;

  const VERSION = 'v57';
  const DATASET = Object.freeze({
    file: 'pandas_excel_students.xlsx',
    sheets: ['Students', 'README'],
    observations: 24,
    bytes: 6835
  });

  const STEPS = Object.freeze([
    {
      key: 'mental-model',
      number: '01',
      eyebrow: 'BEFORE CODE',
      title: 'Excel is a file. Pandas is a library. A DataFrame is the working table.',
      explanation: 'These are three different objects. The .xlsx workbook lives as bytes on disk. Pandas provides Python tools. pd.read_excel(...) creates a DataFrame in memory from one worksheet.',
      code: [
        '# Three different things',
        'file = "pandas_excel_students.xlsx"',
        'import pandas as pd',
        'df = pd.read_excel(file, sheet_name="Students")'
      ],
      excel: 'Workbook with worksheet tabs',
      pandas: 'DataFrame object in Python memory',
      verify: 'You should be able to explain where the file is, what pd means, and what df contains.',
      visual: 'mental',
      liveKey: 'read-excel'
    },
    {
      key: 'import',
      number: '02',
      eyebrow: 'STEP 1 · LOAD THE TOOL',
      title: 'Read import pandas as pd from left to right.',
      explanation: 'import asks Python to load the Pandas package. pandas is the package name. as pd creates a short alias. Nothing has been read from Excel yet.',
      code: [
        'import pandas as pd',
        'print(pd.__name__)'
      ],
      excel: 'Excel application is a tool you open',
      pandas: 'Pandas is a tool you import into Python',
      verify: 'pd.__name__ should identify pandas. No DataFrame exists until you read or create one.',
      visual: 'import',
      liveKey: 'pandas-import'
    },
    {
      key: 'inspect-workbook',
      number: '03',
      eyebrow: 'STEP 2 · LOOK INSIDE THE WORKBOOK',
      title: 'Discover worksheet names before choosing a sheet.',
      explanation: 'An unfamiliar workbook may contain several tabs. pd.ExcelFile(...) opens workbook metadata so you can inspect sheet_names before assuming where the data is.',
      code: [
        'xls = pd.ExcelFile("pandas_excel_students.xlsx")',
        'print(xls.sheet_names)'
      ],
      excel: 'Click worksheet tabs at the bottom of Excel',
      pandas: 'Inspect xls.sheet_names in code',
      verify: 'For the classroom workbook the expected sheets are Students and README.',
      visual: 'sheets',
      liveKey: 'excel-sheets'
    },
    {
      key: 'read',
      number: '04',
      eyebrow: 'STEP 3 · XLSX → DATAFRAME',
      title: 'Read one worksheet into a DataFrame.',
      explanation: 'pd.read_excel(...) parses the worksheet and builds a two-dimensional labeled object. Rows represent observations. Columns represent variables. The DataFrame exists in memory; the source workbook remains a file.',
      code: [
        'df = pd.read_excel(',
        '    "pandas_excel_students.xlsx",',
        '    sheet_name="Students"',
        ')',
        'print(type(df).__name__)'
      ],
      excel: 'Visible grid of cells in a worksheet',
      pandas: 'Labeled rows and columns inside df',
      verify: 'type(df).__name__ should be DataFrame.',
      visual: 'dataframe',
      liveKey: 'read-excel'
    },
    {
      key: 'inspect',
      number: '05',
      eyebrow: 'STEP 4 · INSPECT BEFORE ANALYSIS',
      title: 'Confirm shape, columns, types and first records.',
      explanation: 'Inspection is part of analysis. shape tells you the table dimensions; columns tells you variable names; dtypes tells you how Pandas interpreted values; head() lets you visually verify records.',
      code: [
        'print(df.shape)',
        'print(df.columns.tolist())',
        'print(df.dtypes)',
        'print(df.head())'
      ],
      excel: 'Scroll the sheet and inspect headers manually',
      pandas: 'Ask the DataFrame to report its structure',
      verify: 'Check that the expected variables exist before filtering, calculating or plotting.',
      visual: 'inspect',
      liveKey: 'inspect-dataframe'
    },
    {
      key: 'series-vs-frame',
      number: '06',
      eyebrow: 'STEP 5 · SELECT VARIABLES',
      title: 'One column is usually a Series; several columns form a DataFrame.',
      explanation: 'df["score"] selects one labeled one-dimensional Series. df[["student_id", "score"]] keeps a two-dimensional DataFrame. The double brackets are not decorative: they pass a list of column names.',
      code: [
        'scores = df["score"]',
        'small = df[["student_id", "score"]]',
        'print(type(scores).__name__)',
        'print(type(small).__name__)'
      ],
      excel: 'Selecting one column or several columns with the mouse',
      pandas: 'Select by column labels with reproducible code',
      verify: 'scores should be a Series; small should be a DataFrame.',
      visual: 'select',
      liveKey: 'select-filter'
    },
    {
      key: 'filter',
      number: '07',
      eyebrow: 'STEP 6 · FILTER WITH A BOOLEAN MASK',
      title: 'A comparison runs once per row and creates True/False values.',
      explanation: 'df["score"] >= 80 does not return one Boolean. It returns one Boolean per observation. df.loc[...] uses that mask to keep only rows where the condition is True.',
      code: [
        'mask = df["score"] >= 80',
        'high = df.loc[',
        '    mask,',
        '    ["student_id", "group", "score"]',
        ']',
        'print(high)'
      ],
      excel: 'Use a filter dropdown and choose a condition',
      pandas: 'Store the condition itself, then apply it to rows',
      verify: 'Every row in high should satisfy score >= 80.',
      visual: 'filter',
      liveKey: 'select-filter'
    },
    {
      key: 'sort-derive',
      number: '08',
      eyebrow: 'STEP 7 · TRANSFORM REPRODUCIBLY',
      title: 'Sort rows and create new variables without dragging formulas.',
      explanation: 'sort_values reorders complete observations. A vectorized assignment such as df["passed"] = df["score"] >= 70 evaluates the rule for the whole column and stores the result as a new variable.',
      code: [
        'ordered = df.sort_values("score", ascending=False)',
        'df["passed"] = df["score"] >= 70',
        'print(ordered[["student_id", "score"]].head())',
        'print(df[["score", "passed"]].head())'
      ],
      excel: 'Sort range + type/copy a formula down the sheet',
      pandas: 'One statement describes the transformation for the dataset',
      verify: 'Rows stay intact when sorted; passed is created for every observation.',
      visual: 'transform',
      liveKey: 'derive-column'
    },
    {
      key: 'quality',
      number: '09',
      eyebrow: 'STEP 8 · CHECK DATA QUALITY',
      title: 'Missing values and duplicates must be measured before cleaning.',
      explanation: 'Real data can be incomplete or duplicated. isna().sum() counts missing cells by variable. duplicated().sum() counts repeated rows. Cleaning should be an explicit decision, not an invisible manual edit.',
      code: [
        'print(df.isna().sum())',
        'print(df.duplicated().sum())',
        '# Example decision:',
        'clean = df.drop_duplicates().copy()'
      ],
      excel: 'Search visually, filter blanks, delete duplicate rows manually',
      pandas: 'Quantify the problem and preserve the cleaning code',
      verify: 'Always inspect counts before choosing fillna, dropna or drop_duplicates.',
      visual: 'quality',
      liveKey: 'clean-data'
    },
    {
      key: 'export',
      number: '10',
      eyebrow: 'STEP 9 · DATAFRAME → XLSX',
      title: 'Export the transformed table as a new workbook.',
      explanation: 'to_excel performs the reverse direction of read_excel. The DataFrame in memory is encoded as a real .xlsx workbook. index=False prevents the Pandas row index from becoming an extra spreadsheet column.',
      code: [
        'df.to_excel(',
        '    "analysis_output.xlsx",',
        '    sheet_name="Students",',
        '    index=False',
        ')'
      ],
      excel: 'Save As creates a workbook from the current spreadsheet state',
      pandas: 'to_excel creates a workbook from the current DataFrame state',
      verify: 'The output file should exist and open in Excel with the expected columns.',
      visual: 'export',
      liveKey: 'export-excel'
    }
  ]);

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));

  const safe = value => escapeHtml(value);

  function excelGrid(headers, rows, options = {}) {
    const cols = headers.length;
    const headerHtml = headers.map((h, i) => `<b style="--col:${i + 1}">${safe(h)}</b>`).join('');
    const rowHtml = rows.flatMap((row, r) => row.map((cell, c) => {
      const cls = options.highlightColumn === c ? ' is-col' : options.highlightRow === r ? ' is-row' : '';
      return `<span class="${cls}" style="--col:${c + 1};--row:${r + 2}">${safe(cell)}</span>`;
    })).join('');
    return `<div class="p57-grid" style="--cols:${cols}">${headerHtml}${rowHtml}</div>`;
  }

  function visualHtml(type) {
    switch (type) {
      case 'mental':
        return `<div class="p57-mental">
          <div class="p57-file"><span>XLSX</span><strong>${DATASET.file}</strong><small>${DATASET.observations} observations · ${(DATASET.bytes/1024).toFixed(1)} KB</small></div>
          <i class="p57-arrow"><b></b><em>pd.read_excel</em></i>
          <div class="p57-pandas-box"><span>pd</span><strong>Pandas</strong><small>library / namespace</small></div>
          <i class="p57-arrow"><b></b><em>creates</em></i>
          <div class="p57-frame-box"><span>df</span><strong>DataFrame</strong><small>working table in memory</small></div>
        </div>`;
      case 'import':
        return `<div class="p57-import-visual">
          <div class="p57-python-memory"><strong>Python session</strong><div class="p57-empty-slot">pd ?</div></div>
          <div class="p57-import-token"><code>import pandas as pd</code><i></i></div>
          <div class="p57-python-memory loaded"><strong>Python session</strong><div class="p57-loaded-slot"><b>pd</b><span>→ pandas package</span></div></div>
          <p>No workbook was read in this step.</p>
        </div>`;
      case 'sheets':
        return `<div class="p57-book-visual">
          <div class="p57-window-bar"><span></span><span></span><span></span><strong>${DATASET.file}</strong></div>
          <div class="p57-sheet-body">${excelGrid(['student_id','group','score'], [['S001','11A','…'],['S002','11B','…'],['S003','11C','…']])}</div>
          <div class="p57-sheet-tabs"><b class="active">Students</b><b>README</b></div>
          <div class="p57-code-result"><code>xls.sheet_names</code><span>→</span><strong>['Students', 'README']</strong></div>
        </div>`;
      case 'dataframe':
        return `<div class="p57-xlsx-to-df">
          <div class="p57-book-mini"><b>XLSX</b><strong>Students sheet</strong><small>grid stored in the workbook</small></div>
          <i class="p57-arrow"><b></b><em>read_excel</em></i>
          <div class="p57-df-mini"><div class="p57-df-title"><b>df</b><span>DataFrame</span></div>${excelGrid(['student_id','group','score'], [['S001','11A','82'],['S002','11B','91'],['S003','11C','76']])}</div>
          <div class="p57-labels"><span class="rows">row = observation</span><span class="cols">column = variable</span></div>
        </div>`;
      case 'inspect':
        return `<div class="p57-inspect">
          <div class="p57-df-mini">${excelGrid(['student_id','group','study_hours','attendance','score'], [['S001','11A','…','…','…'],['S002','11B','…','…','…'],['S003','11C','…','…','…']])}</div>
          <div class="p57-inspect-cards">
            <div><code>df.shape</code><strong>rows × columns</strong></div>
            <div><code>df.columns</code><strong>variable names</strong></div>
            <div><code>df.dtypes</code><strong>interpreted types</strong></div>
            <div><code>df.head()</code><strong>first records</strong></div>
          </div>
        </div>`;
      case 'select':
        return `<div class="p57-select">
          <div class="p57-select-panel"><span>ONE COLUMN</span>${excelGrid(['score'], [['82'],['91'],['76']], {highlightColumn:0})}<strong>Series</strong><code>df["score"]</code></div>
          <div class="p57-vs">VS</div>
          <div class="p57-select-panel"><span>MULTIPLE COLUMNS</span>${excelGrid(['student_id','score'], [['S001','82'],['S002','91'],['S003','76']])}<strong>DataFrame</strong><code>df[["student_id","score"]]</code></div>
        </div>`;
      case 'filter':
        return `<div class="p57-filter">
          <div class="p57-score-column"><span>SCORE</span><b>82</b><b>91</b><b>76</b><b>88</b><b>69</b></div>
          <div class="p57-filter-op"><code>&gt;= 80</code><small>evaluate each row</small></div>
          <div class="p57-mask-column"><span>MASK</span><b>True</b><b>True</b><b>False</b><b>True</b><b>False</b></div>
          <div class="p57-filter-op"><code>df.loc[mask]</code><small>keep True rows</small></div>
          <div class="p57-score-column result"><span>RESULT</span><b>82</b><b>91</b><b>88</b></div>
        </div>`;
      case 'transform':
        return `<div class="p57-transform">
          <div class="p57-compare-pane excel"><span>EXCEL MENTAL MODEL</span><div class="p57-formula-cell">score ≥ 70 ?</div><i>drag / copy formula</i><div class="p57-formula-list"><b>TRUE</b><b>TRUE</b><b>TRUE</b><b>…</b></div></div>
          <div class="p57-vs">VS</div>
          <div class="p57-compare-pane pandas"><span>PANDAS MENTAL MODEL</span><code>df["passed"] = df["score"] &gt;= 70</code><i>one vectorized statement</i><div class="p57-column-created"><b>passed</b><span>True</span><span>True</span><span>True</span><span>…</span></div></div>
        </div>`;
      case 'quality':
        return `<div class="p57-quality">
          <div class="p57-quality-table">${excelGrid(['student_id','hours_sleep','score'], [['S01','7.0','82'],['S02','NaN','91'],['S02','NaN','91'],['S03','6.5','76']])}</div>
          <div class="p57-quality-actions"><div><code>isna().sum()</code><span>measure missing values</span></div><div><code>duplicated().sum()</code><span>measure duplicate rows</span></div><div><code>drop_duplicates()</code><span>explicit cleaning decision</span></div></div>
        </div>`;
      case 'export':
        return `<div class="p57-export">
          <div class="p57-frame-box"><span>df</span><strong>DataFrame</strong><small>transformed in memory</small></div>
          <i class="p57-arrow"><b></b><em>to_excel</em></i>
          <div class="p57-file output"><span>XLSX</span><strong>analysis_output.xlsx</strong><small>new workbook</small></div>
          <div class="p57-index-note"><code>index=False</code><span>do not add the Pandas index as an extra Excel column</span></div>
        </div>`;
      default:
        return '<div class="p57-frame-box"><strong>Pandas</strong></div>';
    }
  }

  function codeHtml(step) {
    return `<pre class="p57-code" aria-label="Python code for ${safe(step.title)}"><code>${step.code.map((line, i) => `<span style="--line-delay:${i * 120}ms"><b>${String(i + 1).padStart(2,'0')}</b><em>${safe(line)}</em></span>`).join('')}</code></pre>`;
  }

  function stageHtml(step) {
    return `<div class="p57-stage-inner" data-stage-key="${safe(step.key)}">
      <div class="p57-stage-head"><div><span>${safe(step.eyebrow)}</span><h3>${safe(step.title)}</h3></div><b>${safe(step.number)} / ${String(STEPS.length).padStart(2,'0')}</b></div>
      <div class="p57-code-visual">${codeHtml(step)}<div class="p57-animation">${visualHtml(step.visual)}</div></div>
      <div class="p57-translation"><div><span>In Excel</span><strong>${safe(step.excel)}</strong></div><i>↔</i><div><span>In Pandas</span><strong>${safe(step.pandas)}</strong></div></div>
      <div class="p57-verify"><span>VERIFY</span><p>${safe(step.verify)}</p></div>
      <div class="p57-stage-actions"><button type="button" data-p57-prev>← Previous</button><button type="button" data-p57-live="${safe(step.liveKey)}">Open matching live code</button><button type="button" data-p57-next>Next →</button></div>
    </div>`;
  }

  function stepCardHtml(step) {
    return `<article class="p57-step-card" data-p57-step="${safe(step.key)}" tabindex="0">
      <div class="p57-step-number">${safe(step.number)}</div>
      <div><p class="eyebrow">${safe(step.eyebrow)}</p><h3>${safe(step.title)}</h3><p>${safe(step.explanation)}</p><div class="p57-mini-code"><code>${safe(step.code.find(line => !line.startsWith('#')) || step.code[0])}</code></div></div>
    </article>`;
  }

  function foundationsHtml() {
    const items = [
      ['Library / package', 'Pandas is reusable Python functionality for tabular data. You import it instead of rebuilding file readers, table containers and data operations from zero.', 'pandas'],
      ['Alias / namespace', 'The alias pd is a short name that points to Pandas inside the current Python session. It is conventional, not magical.', 'import pandas as pd'],
      ['DataFrame', 'A two-dimensional labeled table. Rows are observations; columns are variables; each column has a name and a dtype.', 'df'],
      ['Series', 'A one-dimensional labeled sequence. Selecting one DataFrame column normally returns a Series.', 'df["score"]'],
      ['Index', 'Pandas keeps row labels separately from the spreadsheet columns. The index is useful in Python but is often omitted during Excel export with index=False.', 'df.index'],
      ['dtype', 'The interpreted data type of a column. Numeric, text, Boolean and date-like columns behave differently during analysis.', 'df.dtypes'],
      ['Vectorization', 'An expression can operate on an entire Series at once. This replaces many spreadsheet copy-down formulas and many beginner loops.', 'df["passed"] = df["score"] >= 70'],
      ['Excel engine', 'Pandas handles the DataFrame API while an Excel engine such as openpyxl handles .xlsx encoding/decoding underneath read/write operations.', 'openpyxl'],
      ['In-memory object', 'Filtering or sorting df changes a Python object or creates a new one. It does not silently rewrite the source workbook on disk.', 'ordered = df.sort_values("score")'],
      ['Persistence', 'A transformation becomes a new Excel file only when you explicitly export it with to_excel or ExcelWriter.', 'df.to_excel(...)']
    ];
    return `<section class="p57-foundations">
      <div class="section-heading"><p class="eyebrow">PANDAS VOCABULARY · EXPLICIT DEFINITIONS</p><h2>Build the object model before memorizing methods.</h2><p>Every later command becomes easier when students know what object is being created, selected or transformed.</p></div>
      <div class="p57-foundation-grid">${items.map(([title, body, code], index) => `<article><span>${String(index + 1).padStart(2,'0')}</span><h3>${safe(title)}</h3><p>${safe(body)}</p><code>${safe(code)}</code></article>`).join('')}</div>
    </section>`;
  }

  function comparisonHtml() {
    return `<section class="p57-translation-section">
      <div class="section-heading"><p class="eyebrow">EXCEL ↔ PANDAS TRANSLATION</p><h2>Translate spreadsheet actions into reproducible data operations.</h2><p>The objective is not to replace Excel vocabulary. It is to connect what students already see in a spreadsheet with the object model and syntax used by Pandas.</p></div>
      <div class="p57-translation-table-wrap"><table class="p57-translation-table">
        <thead><tr><th>Excel idea</th><th>Pandas idea</th><th>Python expression</th><th>Why it matters</th></tr></thead>
        <tbody>
          <tr><td>Workbook <code>.xlsx</code></td><td>External file</td><td><code>"pandas_excel_students.xlsx"</code></td><td>Data exists before Python reads it.</td></tr>
          <tr><td>Worksheet tab</td><td>One table to read</td><td><code>sheet_name="Students"</code></td><td>Choose the correct source table explicitly.</td></tr>
          <tr><td>Column</td><td>Variable / Series</td><td><code>df["score"]</code></td><td>Operate on a labeled variable, not a cell address.</td></tr>
          <tr><td>Several columns</td><td>Smaller DataFrame</td><td><code>df[["student_id","score"]]</code></td><td>Keep table structure while selecting variables.</td></tr>
          <tr><td>Filter dropdown</td><td>Boolean mask + <code>.loc</code></td><td><code>df.loc[df["score"] &gt;= 80]</code></td><td>The rule is visible and repeatable.</td></tr>
          <tr><td>Sort range</td><td>Sort observations</td><td><code>df.sort_values("score")</code></td><td>Rows remain coherent as complete records.</td></tr>
          <tr><td>Formula copied down</td><td>Vectorized derived column</td><td><code>df["passed"] = df["score"] &gt;= 70</code></td><td>One expression applies to every observation.</td></tr>
          <tr><td>Save As</td><td>Export DataFrame</td><td><code>df.to_excel(..., index=False)</code></td><td>Create a new auditable output workbook.</td></tr>
        </tbody>
      </table></div>
    </section>`;
  }

  function realFileHtml() {
    return `<section class="p57-real-file">
      <div><p class="eyebrow">REAL CLASSROOM FILE</p><h2>Use the same workbook the executable lesson reads.</h2><p><strong>${safe(DATASET.file)}</strong> is a real file stored in the course repository. The current lesson describes it as ${DATASET.observations} synthetic classroom observations with the <strong>Students</strong> and <strong>README</strong> worksheets.</p></div>
      <div class="p57-real-file-card"><span>XLSX</span><div><strong>${safe(DATASET.file)}</strong><small>${safe(DATASET.sheets.join(' + '))} · ${(DATASET.bytes/1024).toFixed(1)} KB</small><p>Download it, open it in Excel, and compare the workbook directly with the DataFrame produced by <code>pd.read_excel(...)</code>.</p></div><a href="data/${encodeURIComponent(DATASET.file)}" download="${safe(DATASET.file)}">↓ Download real workbook</a></div>
    </section>`;
  }

  function guideHtml() {
    return `<section id="pandasGuidedTheoryV57" class="p57-guide">
      <div class="p57-guide-heading"><div><p class="eyebrow">PANDAS EXPLICIT THEORY · STEP BY STEP</p><h2>See the code and the data model change together.</h2><p>The left column explains one operation at a time. The sticky visual on the right updates as each step becomes active, so code, Excel concept and Pandas result are presented as one sequence.</p></div><div class="p57-guide-controls"><button type="button" data-p57-play>▶ Play sequence</button><button type="button" data-p57-replay>↺ Restart</button></div></div>
      ${foundationsHtml()}
      ${realFileHtml()}
      ${comparisonHtml()}
      <div class="p57-scrolly"><div class="p57-steps">${STEPS.map(stepCardHtml).join('')}</div><aside class="p57-stage" aria-live="polite"></aside></div>
      <div class="p57-final-check"><p class="eyebrow">STUDENT CHECKPOINT</p><h3>Before opening the workshop, you should be able to narrate this complete chain:</h3><div><span>Excel workbook</span><i>→</i><span>choose worksheet</span><i>→</i><span>read with Pandas</span><i>→</i><span>inspect DataFrame</span><i>→</i><span>select/filter/sort/derive</span><i>→</i><span>check quality</span><i>→</i><span>export new XLSX</span></div></div>
    </section>`;
  }

  function activate(key, options = {}) {
    const index = STEPS.findIndex(step => step.key === key);
    if (index < 0) return;
    const step = STEPS[index];
    document.querySelectorAll('[data-p57-step]').forEach(card => card.classList.toggle('is-active', card.dataset.p57Step === key));
    const stage = document.querySelector('#pandasGuidedTheoryV57 .p57-stage');
    if (stage) {
      stage.innerHTML = stageHtml(step);
      stage.dataset.activeStep = key;
    }
    document.documentElement.dataset.pandasV57Step = key;
    if (options.scrollCard) {
      document.querySelector(`[data-p57-step="${CSS.escape(key)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  let playTimer = null;
  function stopPlay() {
    if (playTimer) clearInterval(playTimer);
    playTimer = null;
    const button = document.querySelector('[data-p57-play]');
    if (button) button.textContent = '▶ Play sequence';
  }

  function startPlay() {
    stopPlay();
    let index = Math.max(0, STEPS.findIndex(step => step.key === document.querySelector('.p57-stage')?.dataset.activeStep));
    const button = document.querySelector('[data-p57-play]');
    if (button) button.textContent = '■ Stop sequence';
    playTimer = setInterval(() => {
      index += 1;
      if (index >= STEPS.length) {
        stopPlay();
        return;
      }
      activate(STEPS[index].key, { scrollCard: true });
    }, 5200);
  }

  function openLive(key) {
    const lesson = document.querySelector(`[data-pandas-live-key="${CSS.escape(key)}"]`);
    if (!lesson) return;
    lesson.scrollIntoView({ behavior: 'smooth', block: 'start' });
    lesson.classList.add('p57-live-target');
    setTimeout(() => lesson.classList.remove('p57-live-target'), 1800);
  }

  function bind(section) {
    section.addEventListener('click', event => {
      const card = event.target.closest('[data-p57-step]');
      if (card) {
        stopPlay();
        activate(card.dataset.p57Step);
        return;
      }
      const live = event.target.closest('[data-p57-live]');
      if (live) {
        stopPlay();
        openLive(live.dataset.p57Live);
        return;
      }
      if (event.target.closest('[data-p57-prev]')) {
        stopPlay();
        const current = STEPS.findIndex(step => step.key === section.querySelector('.p57-stage')?.dataset.activeStep);
        activate(STEPS[Math.max(0, current - 1)].key, { scrollCard: true });
        return;
      }
      if (event.target.closest('[data-p57-next]')) {
        stopPlay();
        const current = STEPS.findIndex(step => step.key === section.querySelector('.p57-stage')?.dataset.activeStep);
        activate(STEPS[Math.min(STEPS.length - 1, current + 1)].key, { scrollCard: true });
        return;
      }
      if (event.target.closest('[data-p57-play]')) {
        if (playTimer) stopPlay(); else startPlay();
        return;
      }
      if (event.target.closest('[data-p57-replay]')) {
        stopPlay();
        activate(STEPS[0].key, { scrollCard: true });
      }
    });

    section.addEventListener('keydown', event => {
      const card = event.target.closest?.('[data-p57-step]');
      if (card && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        stopPlay();
        activate(card.dataset.p57Step);
      }
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (playTimer) return;
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.dataset?.p57Step) activate(visible.target.dataset.p57Step);
      }, { threshold: [0.45, 0.65, 0.85], rootMargin: '-12% 0px -28% 0px' });
      section.querySelectorAll('[data-p57-step]').forEach(card => observer.observe(card));
    }
  }

  function attachLiveVisuals(live) {
    if (!live || live.dataset.p57LinkedVisuals === 'true') return;
    const keyMap = new Map([
      ['pandas-import', 'import'],
      ['excel-sheets', 'inspect-workbook'],
      ['read-excel', 'read'],
      ['inspect-dataframe', 'inspect'],
      ['select-filter', 'filter'],
      ['sort-dataframe', 'sort-derive'],
      ['derive-column', 'sort-derive'],
      ['clean-data', 'quality'],
      ['export-excel', 'export']
    ]);

    live.querySelectorAll('[data-pandas-live-key]').forEach(lesson => {
      const stepKey = keyMap.get(lesson.dataset.pandasLiveKey);
      const step = STEPS.find(item => item.key === stepKey);
      if (!step || lesson.querySelector('.p57-live-visual')) return;
      const panel = document.createElement('div');
      panel.className = 'p57-live-visual';
      panel.dataset.p57LinkedStep = step.key;
      panel.innerHTML = `<div class="p57-live-visual-head"><span>CODE ↔ VISUAL MODEL</span><strong>${safe(step.title)}</strong><small>The diagram is linked to this executable example.</small></div><div class="p57-live-visual-stage">${visualHtml(step.visual)}</div>`;
      lesson.appendChild(panel);
    });

    const reveal = lesson => {
      live.querySelectorAll('.live-lesson-v19').forEach(item => item.classList.toggle('p57-live-active', item === lesson));
      lesson?.querySelector('.p57-live-visual')?.classList.add('is-revealed');
    };

    live.addEventListener('click', event => {
      const trigger = event.target.closest('[data-pandas-run], [data-pandas-reset], [data-pandas-editor]');
      const lesson = trigger?.closest?.('[data-pandas-live-key]');
      if (lesson) reveal(lesson);
    }, true);

    live.addEventListener('focusin', event => {
      const lesson = event.target.closest?.('[data-pandas-live-key]');
      if (lesson) reveal(lesson);
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target) reveal(visible.target);
      }, { threshold:[0.45,0.7], rootMargin:'-10% 0px -22% 0px' });
      live.querySelectorAll('.live-lesson-v19').forEach(lesson => observer.observe(lesson));
    }

    live.dataset.p57LinkedVisuals = 'true';
  }

  function upgradeConceptCopy() {
    const concept = document.getElementById('conceptSection');
    if (!concept) return;
    const heading = concept.querySelector('.section-heading');
    if (heading) {
      const eyebrow = heading.querySelector('.eyebrow');
      const h2 = heading.querySelector('h2');
      if (eyebrow) eyebrow.textContent = 'PANDAS FOUNDATIONS · EXPLICIT MODEL';
      if (h2) h2.textContent = 'Pandas gives Python a labeled table model for working reproducibly with real spreadsheet data.';
    }
    concept.classList.add('p57-concept-upgraded');
  }

  function install() {
    if (document.getElementById('pandasGuidedTheoryV57')) return true;
    const app = document.getElementById('theoryApp');
    const live = document.querySelector('.pandas-excel-live-v53');
    const concept = document.getElementById('conceptSection');
    if (!app || app.classList.contains('hidden') || !live || !concept) return false;

    upgradeConceptCopy();
    live.insertAdjacentHTML('beforebegin', guideHtml());
    const section = document.getElementById('pandasGuidedTheoryV57');
    if (!section) return false;
    bind(section);
    activate(STEPS[0].key);
    attachLiveVisuals(live);

    document.documentElement.dataset.pandasGuidedTheory = VERSION;
    document.documentElement.dataset.pandasGuidedTheorySteps = String(STEPS.length);
    return true;
  }

  let scheduled = false;
  const schedule = () => {
    if (scheduled || document.getElementById('pandasGuidedTheoryV57')) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      install();
    });
  };

  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });
  window.addEventListener('load', schedule, { once: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopPlay(); });
  schedule();
})();
