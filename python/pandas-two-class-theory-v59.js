(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  if ((params.get('topic') || 'operations') !== 'logic') return;

  const VERSION = 'v59';
  let activeIndex = 0;
  let phaseTimer = null;

  const CLASSES = [
    { number:1, title:'Libraries + XLSX files', subtitle:'Python ecosystem → files → openpyxl', stages:[0,1,2,3,4,5], theory:20, workshop:30 },
    { number:2, title:'Pandas for data analysis', subtitle:'DataFrame → inspect → transform → export', stages:[6,7,8,9,10,11], theory:20, workshop:30 }
  ];

  const STAGES = [
    {
      classNo:1, n:'01', key:'ecosystem', eyebrow:'CLASS 1 · WHY LIBRARIES?',
      title:'Python is a language; libraries open different problem domains.',
      intro:'The first objective is not to memorize packages. It is to see that the same Python language can be extended for mathematics, statistics, visualization, data analysis, machine learning, web APIs, images and files.',
      code:['import math','import statistics','from pathlib import Path'],
      notes:[
        ['import math','Load mathematical functions from the Python standard library.'],
        ['import statistics','Load descriptive-statistics functions from the standard library.'],
        ['from pathlib import Path','Import one file/path abstraction instead of the whole module namespace.']
      ],
      visual:'ecosystem',
      checkpoint:'A library is reusable functionality for a problem domain. Importing a library does not load your data automatically.'
    },
    {
      classNo:1, n:'02', key:'imports', eyebrow:'CLASS 1 · STANDARD VS THIRD-PARTY',
      title:'Not every library comes from the same place.',
      intro:'The standard library ships with Python. Third-party packages are installed separately. This distinction explains why math and pathlib are immediately available while Pandas, NumPy, openpyxl or scikit-learn may need an environment to install or preload them.',
      code:['import math','import statistics','import pandas as pd','from openpyxl import load_workbook'],
      notes:[
        ['Standard library','math and statistics are distributed with Python.'],
        ['Standard library','pathlib, json and datetime are also built in.'],
        ['Third-party package','pandas must be installed in the environment before import.'],
        ['Third-party package','openpyxl specializes in reading and writing .xlsx workbooks.']
      ],
      visual:'imports',
      checkpoint:'Ask: “Does this tool ship with Python, or must the environment install it?”'
    },
    {
      classNo:1, n:'03', key:'files', eyebrow:'CLASS 1 · FILES BEFORE TABLES',
      title:'A path points to a file; the extension tells us the file format.',
      intro:'Before Pandas, students should understand that an Excel workbook is still a file on disk. pathlib gives a clean way to inspect file names, suffixes and locations.',
      code:['from pathlib import Path','file = Path("pandas_excel_students.xlsx")','print(file.name)','print(file.suffix)'],
      notes:[
        ['Path(...)','Represent a file path as an object.'],
        ['file.name','Return the final file name.'],
        ['file.suffix','Return the extension, here .xlsx.'],
        ['Important','Knowing a file is .xlsx does not yet mean Python understands workbook cells. A format-aware library is still needed.']
      ],
      visual:'file',
      checkpoint:'Pathlib understands paths. It does not interpret worksheet cells.'
    },
    {
      classNo:1, n:'04', key:'openpyxl', eyebrow:'CLASS 1 · OPENPYXL',
      title:'Use a format-specific library to open the workbook structure.',
      intro:'openpyxl works directly with Excel workbook concepts: workbook, worksheet and cell. This is intentionally shown before Pandas so students can compare low-level workbook manipulation with higher-level tabular analysis.',
      code:['from openpyxl import load_workbook','wb = load_workbook("pandas_excel_students.xlsx")','print(wb.sheetnames)','ws = wb["Students"]'],
      notes:[
        ['load_workbook(...)','Parse the .xlsx file into an openpyxl Workbook object.'],
        ['wb.sheetnames','Inspect worksheet names before selecting one.'],
        ['wb["Students"]','Select a worksheet by its tab name.'],
        ['Workbook vs worksheet','The workbook is the file-level container; the worksheet is one tab inside it.']
      ],
      visual:'workbook',
      checkpoint:'Workbook → worksheet → cell is the Excel object model.'
    },
    {
      classNo:1, n:'05', key:'cells', eyebrow:'CLASS 1 · CELL-LEVEL MANIPULATION',
      title:'openpyxl lets you inspect and modify individual cells.',
      intro:'This is useful for formatting, templates and workbook automation. It also reveals why a data-analysis library is helpful: statistical work usually wants complete variables and observations rather than manual cell coordinates.',
      code:['ws = wb["Students"]','print(ws["A1"].value)','print(ws.max_row, ws.max_column)','ws["G1"] = "reviewed"'],
      notes:[
        ['ws["A1"].value','Read one cell by Excel coordinate.'],
        ['max_row / max_column','Inspect worksheet dimensions.'],
        ['ws["G1"] = ...','Write directly to a cell.'],
        ['Analytical limitation','Cell-by-cell access is precise, but not the best abstraction for filtering thousands of observations.']
      ],
      visual:'cells',
      checkpoint:'openpyxl is excellent for workbook automation; Pandas will be better for table analysis.'
    },
    {
      classNo:1, n:'06', key:'save', eyebrow:'CLASS 1 · CREATE + SAVE XLSX',
      title:'A library can create a genuine Excel workbook from Python.',
      intro:'The first class finishes by creating and saving an .xlsx file. Students have now seen both directions: open an existing workbook and create a new one.',
      code:['from openpyxl import Workbook','wb_out = Workbook()','ws = wb_out.active','ws.title = "Summary"','ws["A1"] = "ready"','wb_out.save("xlsx_library_output.xlsx")'],
      notes:[
        ['Workbook()','Create a new workbook object in memory.'],
        ['active','Access its first worksheet.'],
        ['title / A1','Modify workbook structure and content.'],
        ['save(...)','Serialize the workbook into real .xlsx bytes on disk.']
      ],
      visual:'save',
      checkpoint:'Class 1 complete: library → file → workbook → worksheet → cells → saved XLSX.'
    },
    {
      classNo:2, n:'07', key:'pandas', eyebrow:'CLASS 2 · WHY PANDAS?',
      title:'Pandas changes the abstraction from cells to labeled tables.',
      intro:'Now the focus narrows to one library. Pandas is designed for tabular analysis. Instead of manipulating A1, B2 and C3, the analyst works with observations, variables, Series and DataFrames.',
      code:['import pandas as pd','df = pd.read_excel("pandas_excel_students.xlsx", sheet_name="Students")','print(type(df).__name__)'],
      notes:[
        ['import pandas as pd','Load Pandas with its conventional alias.'],
        ['pd.read_excel(...)','Read a worksheet as a table.'],
        ['df','Store the resulting DataFrame.'],
        ['DataFrame','A labeled 2D table: rows are observations, columns are variables.']
      ],
      visual:'pandas',
      checkpoint:'openpyxl gives workbook/cell objects; Pandas gives analytical table objects.'
    },
    {
      classNo:2, n:'08', key:'dataframe', eyebrow:'CLASS 2 · DATAFRAME ANATOMY',
      title:'Rows are observations. Columns are variables. Labels replace cell coordinates.',
      intro:'The DataFrame is the core object for the rest of the course. One selected column is usually a Series; several selected columns remain a DataFrame.',
      code:['print(df.shape)','print(df.columns.tolist())','scores = df["score"]','print(type(scores).__name__)'],
      notes:[
        ['df.shape','Return rows × columns.'],
        ['df.columns','Return the variable labels.'],
        ['df["score"]','Select one variable.'],
        ['Series','The one-dimensional object returned by selecting one column.']
      ],
      visual:'dataframe',
      checkpoint:'A variable name such as score replaces repeated Excel cell addresses.'
    },
    {
      classNo:2, n:'09', key:'inspect', eyebrow:'CLASS 2 · INSPECT FIRST',
      title:'Professional analysis starts by checking structure before calculating.',
      intro:'An unfamiliar file can have wrong columns, unexpected types, missing values or a different sheet. Inspection is not optional; it is part of the analytical workflow.',
      code:['print(df.head())','print(df.dtypes)','print(df.isna().sum())','print(df.describe())'],
      notes:[
        ['head()','Preview the first observations.'],
        ['dtypes','Check how Pandas interpreted every variable.'],
        ['isna().sum()','Measure missing values by column.'],
        ['describe()','Generate descriptive summaries for suitable variables.']
      ],
      visual:'inspect',
      checkpoint:'Do not filter or calculate until the loaded table has been verified.'
    },
    {
      classNo:2, n:'10', key:'filter', eyebrow:'CLASS 2 · SELECT + FILTER',
      title:'Boolean conditions operate on complete variables.',
      intro:'Pandas evaluates a comparison once per observation, creating a True/False mask. .loc uses that mask to keep matching rows and can select specific variables at the same time.',
      code:['mask = df["score"] >= 90','filtered = df.loc[mask, ["student_id", "group", "score"]]','print(filtered)'],
      notes:[
        ['score >= 90','Create one Boolean result for every observation.'],
        ['mask','Store that Boolean Series.'],
        ['df.loc[mask, ...]','Keep only True rows and requested variables.'],
        ['filtered','A new analytical table produced reproducibly from the source DataFrame.']
      ],
      visual:'filter',
      checkpoint:'Pandas filtering is a visible rule, not a manual spreadsheet selection.'
    },
    {
      classNo:2, n:'11', key:'transform', eyebrow:'CLASS 2 · DERIVE + SORT',
      title:'Vectorized expressions replace copy-down formulas.',
      intro:'A derived variable can be calculated for every row with one statement, then the complete records can be sorted without breaking the relationships among columns.',
      code:['df["passed"] = df["score"] >= 70','ordered = df.sort_values("score", ascending=False)','print(ordered.head())'],
      notes:[
        ['df["passed"] = ...','Create one Boolean value per observation with a vectorized expression.'],
        ['sort_values(...)','Reorder complete observations by one variable.'],
        ['ascending=False','Place the largest values first.'],
        ['ordered','Keep the transformation explicit and inspectable.']
      ],
      visual:'transform',
      checkpoint:'One line describes a rule for the whole variable—no dragging formulas.'
    },
    {
      classNo:2, n:'12', key:'export', eyebrow:'CLASS 2 · EXPORT',
      title:'Finish with a real output workbook produced by the analysis code.',
      intro:'A reproducible workflow should not end only with a screen preview. to_excel writes the transformed DataFrame back to a genuine workbook that can be opened outside Python.',
      code:['filtered = df.loc[df["score"] >= 80]','filtered.to_excel("pandas_analysis_output.xlsx", index=False)'],
      notes:[
        ['filtered = ...','Create the final result table from an explicit rule.'],
        ['to_excel(...)','Serialize that DataFrame to an .xlsx workbook.'],
        ['index=False','Do not add the Pandas row index as an unwanted spreadsheet column.'],
        ['Output file','The workbook is evidence of the transformation performed by the code.']
      ],
      visual:'export',
      checkpoint:'Class 2 complete: XLSX → DataFrame → inspect → filter/transform → XLSX.'
    }
  ];

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, function(c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function libraryGallery() {
    const libs = [
      ['Math','math','square roots, trigonometry','math.sqrt(81)','standard'],
      ['Statistics','statistics','mean, median, spread','statistics.mean(values)','standard'],
      ['Files','pathlib','paths, names, extensions','Path("data.xlsx").suffix','standard'],
      ['Excel','openpyxl','workbooks, sheets, cells','load_workbook("data.xlsx")','third-party'],
      ['Arrays','NumPy','fast numerical arrays','np.array([1,2,3])','third-party'],
      ['Data','Pandas','tables and analysis','pd.read_excel("data.xlsx")','third-party'],
      ['Charts','Matplotlib','plots and figures','plt.plot(x, y)','third-party'],
      ['Machine learning','scikit-learn','models and prediction','model.fit(X, y)','third-party'],
      ['Web / APIs','Requests','HTTP data access','requests.get(url)','third-party'],
      ['Images','Pillow','image processing','Image.open("photo.png")','third-party']
    ];
    return '<section class="p59-library-landscape"><div class="section-heading"><p class="eyebrow">CLASS 1 · PYTHON LIBRARY LANDSCAPE</p><h2>One language can connect to many real problem domains.</h2><p>This is an orientation map, not ten new units. Students see the possibilities first, then Class 1 narrows to XLSX files and Class 2 narrows to Pandas.</p></div><div class="p59-library-grid">' +
      libs.map(function(row) {
        return '<article><span>' + esc(row[0]) + '</span><h3>' + esc(row[1]) + '</h3><p>' + esc(row[2]) + '</p><code>' + esc(row[3]) + '</code><small>' + esc(row[4]) + '</small></article>';
      }).join('') + '</div></section>';
  }

  function classRoute() {
    return '<section class="p59-class-route"><div><p class="eyebrow">TOPIC 04 · 2-CLASS LIMIT</p><h2>Exactly two classes: theory and workshop in the same session.</h2></div><div class="p59-class-route-grid">' +
      CLASSES.map(function(item) {
        return '<button type="button" data-p59-class="' + item.number + '"><span>CLASS ' + item.number + '</span><strong>' + esc(item.title) + '</strong><small>' + esc(item.subtitle) + '</small><div><b>≈ ' + item.theory + ' min theory</b><i>+</i><b>≈ ' + item.workshop + ' min workshop</b></div></button>';
      }).join('') + '</div><p class="p59-route-rule"><strong>Teaching rule:</strong> Class 1 ends after Workshop stages 1–6. Class 2 begins with Pandas and ends after stages 7–12. No third theory session is required.</p></section>';
  }

  function visual(type) {
    if (type === 'ecosystem') {
      return '<div class="p59-ecosystem"><div class="p59-python-core">PYTHON</div><div>math</div><div>statistics</div><div>pathlib</div><div>openpyxl</div><div>NumPy</div><div>Pandas</div><div>Matplotlib</div><div>scikit-learn</div></div>';
    }
    if (type === 'imports') {
      return '<div class="p59-two-lanes"><section><span>STANDARD LIBRARY</span><strong>ships with Python</strong><code>math</code><code>statistics</code><code>pathlib</code></section><i>VS</i><section><span>THIRD-PARTY</span><strong>installed in the environment</strong><code>openpyxl</code><code>pandas</code><code>numpy</code></section></div>';
    }
    if (type === 'file') {
      return '<div class="p58-flow"><div class="p58-flow-node file is-focus"><span>PATH</span><strong>pandas_excel_students.xlsx</strong><small>file on disk</small></div><div class="p58-flow-arrow"><i></i><span>.suffix</span></div><div class="p58-flow-node"><span>FORMAT</span><strong>.xlsx</strong><small>Excel workbook format</small></div></div>';
    }
    if (type === 'workbook') {
      return '<div class="p59-workbook-model"><div class="p59-book"><span>WORKBOOK</span><strong>pandas_excel_students.xlsx</strong><div><b>Students</b><b>README</b></div></div><i>→</i><div class="p59-sheet"><span>WORKSHEET</span><strong>Students</strong><div class="p59-cells"><b>A1</b><b>B1</b><b>C1</b><b>A2</b><b>B2</b><b>C2</b></div></div></div>';
    }
    if (type === 'cells') {
      return '<div class="p59-cell-vs-table"><section><span>OPENPYXL VIEW</span><strong>cell coordinates</strong><code>A1 → student_id</code><code>E2 → score value</code><code>G1 → reviewed</code></section><i>→</i><section><span>WHY PANDAS NEXT?</span><strong>analysis wants variables</strong><code>df["score"]</code><code>df.loc[condition]</code></section></div>';
    }
    if (type === 'save') {
      return '<div class="p58-flow export"><div class="p58-flow-node frame"><span>wb_out</span><strong>Workbook object</strong><small>in Python memory</small></div><div class="p58-flow-arrow"><i></i><span>save</span></div><div class="p58-flow-node file output"><span>XLSX</span><strong>xlsx_library_output.xlsx</strong><small>real file on disk</small></div></div>';
    }
    if (type === 'pandas') {
      return '<div class="p59-openpyxl-pandas"><section><span>OPENPYXL</span><strong>Workbook → Sheet → Cell</strong><code>ws["E2"].value</code></section><i>→</i><section><span>PANDAS</span><strong>DataFrame → Series → rows</strong><code>df["score"]</code></section></div>';
    }
    if (type === 'dataframe') {
      return '<div class="p58-dataframe wide"><div><span>df</span><strong>DataFrame</strong></div><div class="p58-grid" style="--cols:5"><b>student_id</b><b>group</b><b>study_hours</b><b>attendance</b><b>score</b><span>S001</span><span>11A</span><span>2.5</span><span>0.88</span><span>82</span><span>S002</span><span>11B</span><span>4.0</span><span>0.95</span><span>91</span></div><small class="p58-row-label">row = observation</small><small class="p58-col-label">column = variable</small></div>';
    }
    if (type === 'inspect') {
      return '<div class="p58-inspect-tools"><div><code>head()</code><strong>preview rows</strong></div><div><code>dtypes</code><strong>verify types</strong></div><div><code>isna().sum()</code><strong>missing values</strong></div><div><code>describe()</code><strong>statistical summary</strong></div></div>';
    }
    if (type === 'filter') {
      return '<div class="p58-filter-diagram"><div class="p58-vector"><span>SCORE</span><b>82</b><b>91</b><b>76</b><b>95</b></div><div class="p58-flow-arrow"><i></i><span>>= 90</span></div><div class="p58-vector mask"><span>MASK</span><b>False</b><b>True</b><b>False</b><b>True</b></div><div class="p58-flow-arrow"><i></i><span>.loc</span></div><div class="p58-vector result"><span>KEPT</span><b>91</b><b>95</b></div></div>';
    }
    if (type === 'transform') {
      return '<div class="p58-transform-diagram"><div class="p58-excel-side"><span>SPREADSHEET</span><strong>copy formula down</strong><code>=score>=70</code></div><div class="p58-vectorize"><span>PANDAS</span><code>df["passed"] = df["score"] >= 70</code><strong>one rule for the complete Series</strong></div><div class="p58-sort-stack"><span>SORT</span><b>95</b><b>91</b><b>82</b><small>complete rows move together</small></div></div>';
    }
    return '<div class="p58-flow export"><div class="p58-flow-node frame"><span>df</span><strong>filtered DataFrame</strong><small>analysis result</small></div><div class="p58-flow-arrow"><i></i><span>to_excel</span></div><div class="p58-flow-node file output"><span>XLSX</span><strong>pandas_analysis_output.xlsx</strong><small>shareable output</small></div></div>';
  }

  function codeBlock(stage) {
    return '<div class="p58-code-shell"><div class="p58-code-top"><span>PYTHON · CLICK A LINE</span><button type="button" data-p59-replay>↺ Replay</button></div><div class="p58-code-lines">' +
      stage.code.map(function(line, i) {
        return '<button type="button" class="p58-code-line" data-p59-line="' + i + '"><b>' + String(i + 1).padStart(2,'0') + '</b><code>' + esc(line) + '</code></button>';
      }).join('') + '</div><div class="p58-code-explain" aria-live="polite"></div></div>';
  }

  function stageHtml(stage) {
    return '<div class="p58-stage-inner" data-p59-stage="' + stage.key + '">' +
      '<header><div><p class="eyebrow">' + esc(stage.eyebrow) + '</p><h3>' + esc(stage.title) + '</h3><p>' + esc(stage.intro) + '</p></div><strong>' + stage.n + ' / 12</strong></header>' +
      '<div class="p58-stage-grid">' + codeBlock(stage) + '<div class="p58-diagram-shell"><div class="p58-diagram-top"><span>ANIMATED / VISUAL MODEL</span><small>concept linked to the code</small></div><div class="p58-diagram">' + visual(stage.visual) + '</div></div></div>' +
      '<div class="p58-checkpoint"><b>CHECKPOINT</b><p>' + esc(stage.checkpoint) + '</p></div>' +
      '<div class="p58-stage-actions"><button type="button" data-p59-prev>← Previous</button><a class="p59-workshop-link" href="workshop.html?topic=logic">Open Colab workshop</a><button type="button" data-p59-next>Next →</button></div>' +
    '</div>';
  }

  function navHtml() {
    return CLASSES.map(function(cls) {
      return '<div class="p59-nav-group"><div class="p59-nav-class"><span>CLASS ' + cls.number + '</span><strong>' + esc(cls.title) + '</strong><small>' + cls.theory + ' min theory · ' + cls.workshop + ' min workshop</small></div>' +
        cls.stages.map(function(index) {
          const stage = STAGES[index];
          return '<button type="button" class="p58-nav-card" data-p59-nav="' + index + '"><span>' + stage.n + '</span><div><small>' + esc(stage.eyebrow) + '</small><strong>' + esc(stage.title) + '</strong></div></button>';
        }).join('') + '</div>';
    }).join('');
  }

  function practicalBridge() {
    return '<section class="p59-practical-bridge"><div><p class="eyebrow">ONE FILE · TWO PERSPECTIVES</p><h2>Use the same workbook in both classes.</h2><p>Class 1 sees the workbook as workbook → worksheet → cells with openpyxl. Class 2 sees the same Students sheet as a DataFrame with Pandas. This comparison is the conceptual bridge between file manipulation and data analysis.</p><div class="p59-bridge-actions"><a href="data/pandas_excel_students.xlsx" download="pandas_excel_students.xlsx">↓ Download real XLSX</a><a href="workshop.html?topic=logic">Open Colab workshop →</a></div></div><div class="p59-bridge-code"><section><span>CLASS 1</span><strong>openpyxl</strong><code>wb = load_workbook("pandas_excel_students.xlsx")</code><code>ws = wb["Students"]</code><code>print(ws["A1"].value)</code></section><i>same XLSX</i><section><span>CLASS 2</span><strong>Pandas</strong><code>df = pd.read_excel("pandas_excel_students.xlsx")</code><code>print(df.columns)</code><code>print(df["score"].mean())</code></section></div></section>';
  }

  function guideHtml() {
    return '<section id="pandasTwoClassTheoryV59" class="p58-guide p59-guide">' +
      '<div class="p58-hero"><div><p class="eyebrow">TOPIC 04 · LIBRARIES → XLSX → PANDAS</p><h2>See the Python ecosystem first. Then focus the second class on Pandas.</h2><p>The content is intentionally constrained to two classes. Class 1 introduces library thinking and real Excel-file manipulation. Class 2 develops the Pandas workflow needed for statistical data analysis.</p></div><div class="p58-hero-metrics"><div><strong>2</strong><span>classes maximum</span></div><div><strong>6 + 6</strong><span>workshop stages</span></div><div><strong>1</strong><span>shared XLSX</span></div></div></div>' +
      classRoute() + libraryGallery() + practicalBridge() +
      '<section class="p58-guided"><div class="section-heading"><p class="eyebrow">UNIFIED CODE FORMAT</p><h2>Theory uses the same visual/code rhythm in both classes.</h2><p>Every stage shows a short explanation, readable Python code, a linked diagram and one checkpoint. The workshop keeps the Colab interaction: write → run → inspect → validate.</p></div><div class="p58-guided-layout"><nav class="p58-nav">' + navHtml() + '</nav><article class="p58-stage" aria-live="polite"></article></div></section>' +
    '</section>';
  }

  function stopPhase() {
    if (phaseTimer) clearInterval(phaseTimer);
    phaseTimer = null;
  }

  function applyLine(stage, lineIndex) {
    const root = document.querySelector('#pandasTwoClassTheoryV59 .p58-stage');
    if (!root) return;
    const lines = Array.from(root.querySelectorAll('.p58-code-line'));
    lines.forEach(function(line, i) { line.classList.toggle('is-active', i === lineIndex); });
    const note = root.querySelector('.p58-code-explain');
    const item = stage.notes[Math.min(lineIndex, stage.notes.length - 1)];
    if (note && item) {
      note.innerHTML = '<span>LINE EXPLANATION</span><strong>' + esc(item[0]) + '</strong><p>' + esc(item[1]) + '</p>';
    }
  }

  function play(stage) {
    stopPhase();
    let line = 0;
    applyLine(stage, line);
    phaseTimer = setInterval(function() {
      line = (line + 1) % stage.code.length;
      applyLine(stage, line);
    }, 2600);
  }

  function activate(index, scroll) {
    activeIndex = Math.max(0, Math.min(STAGES.length - 1, index));
    const stage = STAGES[activeIndex];
    const root = document.querySelector('#pandasTwoClassTheoryV59 .p58-stage');
    if (root) root.innerHTML = stageHtml(stage);
    document.querySelectorAll('#pandasTwoClassTheoryV59 [data-p59-nav]').forEach(function(button) {
      button.classList.toggle('is-active', Number(button.dataset.p59Nav) === activeIndex);
    });
    document.querySelectorAll('#pandasTwoClassTheoryV59 [data-p59-class]').forEach(function(button) {
      button.classList.toggle('active', Number(button.dataset.p59Class) === stage.classNo);
    });
    play(stage);
    if (scroll && root) root.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  function bind(section) {
    section.addEventListener('click', function(event) {
      const nav = event.target.closest('[data-p59-nav]');
      if (nav) { activate(Number(nav.dataset.p59Nav), true); return; }
      const cls = event.target.closest('[data-p59-class]');
      if (cls) { activate(Number(cls.dataset.p59Class) === 1 ? 0 : 6, true); return; }
      const line = event.target.closest('[data-p59-line]');
      if (line) { stopPhase(); applyLine(STAGES[activeIndex], Number(line.dataset.p59Line)); return; }
      if (event.target.closest('[data-p59-replay]')) { play(STAGES[activeIndex]); return; }
      if (event.target.closest('[data-p59-prev]')) { activate(activeIndex - 1, true); return; }
      if (event.target.closest('[data-p59-next]')) { activate(activeIndex + 1, true); }
    });
  }

  function install() {
    if (document.getElementById('pandasTwoClassTheoryV59')) return true;
    const app = document.getElementById('theoryApp');
    const concept = document.getElementById('conceptSection');
    const live = document.querySelector('.pandas-excel-live-v53');
    if (!app || app.classList.contains('hidden') || !concept || !live) return false;

    document.getElementById('pandasGuidedTheoryV58')?.remove();
    document.getElementById('pandasGuidedTheoryV57')?.remove();

    [
      concept,
      document.querySelector('.theory-diagrams-section'),
      document.getElementById('syntaxSection'),
      document.getElementById('pitfallSection'),
      document.getElementById('pandasExcelTheoryV52'),
      live
    ].filter(Boolean).forEach(function(node) {
      node.classList.add('p59-condensed-legacy');
    });

    live.insertAdjacentHTML('beforebegin', guideHtml());
    const section = document.getElementById('pandasTwoClassTheoryV59');
    if (!section) return false;
    bind(section);
    activate(0, false);

    document.documentElement.dataset.pandasTwoClassTheory = VERSION;
    return true;
  }

  let scheduled = false;
  function schedule() {
    if (scheduled || document.getElementById('pandasTwoClassTheoryV59')) return;
    scheduled = true;
    requestAnimationFrame(function() {
      scheduled = false;
      install();
    });
  }

  new MutationObserver(schedule).observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  window.addEventListener('load', schedule, { once:true });
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) stopPhase();
    else if (document.getElementById('pandasTwoClassTheoryV59')) play(STAGES[activeIndex]);
  });
  schedule();
})();