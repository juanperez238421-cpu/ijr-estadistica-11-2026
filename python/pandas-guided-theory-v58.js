(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  if ((params.get('topic') || 'operations') !== 'logic') return;

  const VERSION = 'v58';
  const DATASET = Object.freeze({
    file: 'pandas_excel_students.xlsx',
    rows: 24,
    sheets: ['Students', 'README'],
    columns: ['student_id', 'group', 'study_hours', 'attendance', 'score']
  });

  const PRACTICAL_CODE = [
    'import pandas as pd',
    '',
    'df = pd.read_excel("pandas_excel_students.xlsx", sheet_name="Students")',
    '',
    '# 1) Inspect the real workbook',
    'print("Shape:", df.shape)',
    'print("Columns:", df.columns.tolist())',
    'print(df.head())',
    '',
    '# 2) Create a reproducible derived variable',
    'df["performance_index"] = (df["score"] * df["attendance"]).round(2)',
    '',
    '# 3) Keep high-score + high-attendance observations',
    'analysis = df.loc[',
    '    (df["score"] >= 80) & (df["attendance"] >= 0.90),',
    '    ["student_id", "group", "score", "attendance", "performance_index"]',
    '].sort_values("performance_index", ascending=False)',
    '',
    'print("\nFiltered analysis:")',
    'print(analysis)',
    '',
    '# 4) Export a real Excel workbook',
    'analysis.to_excel("analysis_output.xlsx", sheet_name="Analysis", index=False)',
    'print("\nCreated analysis_output.xlsx")'
  ].join('\n');

  const STAGES = Object.freeze([
    {
      key:'objects',
      n:'01',
      eyebrow:'MENTAL MODEL',
      title:'Separate the three objects before writing code.',
      intro:'Students often mix up Excel, Pandas and a DataFrame. They are not the same thing: Excel is the file format/workbook, Pandas is the Python library, and a DataFrame is the table object created in memory.',
      code:[
        'file = "pandas_excel_students.xlsx"',
        'import pandas as pd',
        'df = pd.read_excel(file, sheet_name="Students")'
      ],
      notes:[
        ['file = ...','This variable stores the filename. It does not contain the spreadsheet data itself.'],
        ['import pandas as pd','Python loads the Pandas package and gives it the short alias pd.'],
        ['pd.read_excel(...)','Pandas reads one worksheet and creates the DataFrame named df.']
      ],
      visual:'objects',
      excel:'Workbook + worksheet tabs',
      pandas:'Library + DataFrame in memory',
      checkpoint:'Point to each object and explain where it lives: file on disk, Pandas in the Python session, DataFrame in memory.',
      live:'read-excel'
    },
    {
      key:'import',
      n:'02',
      eyebrow:'STEP 1 · IMPORT',
      title:'Understand every word in import pandas as pd.',
      intro:'The import statement loads reusable code. The alias pd is simply a shorter namespace. Importing Pandas does not open an Excel file and does not create a DataFrame.',
      code:[
        'import pandas as pd',
        'print(pd.__name__)',
        'print(pd.__version__)'
      ],
      notes:[
        ['import','Ask Python to load a package into the current session.'],
        ['pandas as pd','pandas is the package; pd is the conventional alias used to access its tools.'],
        ['pd.__version__','A quick verification that Pandas is actually available in the runtime.']
      ],
      visual:'import',
      excel:'Open an application before using its tools',
      pandas:'Import the library before calling its methods',
      checkpoint:'If pd exists but df does not, Pandas is loaded but no dataset has been read yet.',
      live:'pandas-import'
    },
    {
      key:'sheets',
      n:'03',
      eyebrow:'STEP 2 · EXPLORE THE EXCEL FILE',
      title:'Inspect workbook sheets before assuming where the data is.',
      intro:'A workbook can contain several worksheets. pd.ExcelFile(...) lets the analyst inspect the workbook structure first. This is the code equivalent of looking at the worksheet tabs in Excel.',
      code:[
        'xls = pd.ExcelFile("pandas_excel_students.xlsx")',
        'print(xls.sheet_names)'
      ],
      notes:[
        ['pd.ExcelFile(...)','Open workbook metadata without yet treating a specific sheet as the analysis table.'],
        ['xls.sheet_names','Return the worksheet names so you can choose deliberately.']
      ],
      visual:'sheets',
      excel:'Look at tabs such as Students and README',
      pandas:'Inspect xls.sheet_names',
      checkpoint:'For the classroom file, Students is the data sheet and README documents the file.',
      live:'excel-sheets'
    },
    {
      key:'read',
      n:'04',
      eyebrow:'STEP 3 · READ XLSX → DATAFRAME',
      title:'Choose one worksheet and turn it into a DataFrame.',
      intro:'read_excel parses the .xlsx bytes and builds a two-dimensional labeled table. A row is an observation, a column is a variable, and df is now a Python object that can be inspected and transformed.',
      code:[
        'df = pd.read_excel(',
        '    "pandas_excel_students.xlsx",',
        '    sheet_name="Students"',
        ')',
        'print(type(df).__name__)'
      ],
      notes:[
        ['df =','Store the returned object in a variable named df.'],
        ['filename','Tell Pandas which workbook to read.'],
        ['sheet_name="Students"','Choose the worksheet explicitly rather than relying on the first tab.'],
        ['DataFrame','Verify the object type after loading.']
      ],
      visual:'read',
      excel:'Visible cells inside the Students worksheet',
      pandas:'Rows + labeled variables inside df',
      checkpoint:'The original workbook still exists on disk; df is a separate in-memory representation.',
      live:'read-excel'
    },
    {
      key:'inspect',
      n:'05',
      eyebrow:'STEP 4 · INSPECT BEFORE CALCULATING',
      title:'Never analyze a dataset you have not inspected.',
      intro:'A professional workflow checks dimensions, variable names, data types and sample records before any filtering or statistics. This catches wrong files, wrong sheets and unexpected column types early.',
      code:[
        'print(df.shape)',
        'print(df.columns.tolist())',
        'print(df.dtypes)',
        'print(df.head())'
      ],
      notes:[
        ['df.shape','Number of rows and columns. For this classroom file, verify 24 observations.'],
        ['df.columns.tolist()','Exact variable names you must use later in code.'],
        ['df.dtypes','How Pandas interpreted each variable: numeric, text, Boolean, date-like, etc.'],
        ['df.head()','A visual preview of the first records to confirm the table looks correct.']
      ],
      visual:'inspect',
      excel:'Scroll the sheet and read headers manually',
      pandas:'Ask the DataFrame to report its structure',
      checkpoint:'Do not filter score until you have confirmed that the score column exists and is numeric.',
      live:'inspect-dataframe'
    },
    {
      key:'select',
      n:'06',
      eyebrow:'STEP 5 · SELECT VARIABLES',
      title:'One column becomes a Series; several columns stay a DataFrame.',
      intro:'This distinction matters because Pandas methods operate on different object shapes. Single brackets select one labeled one-dimensional Series; double brackets receive a list of columns and preserve the 2D DataFrame.',
      code:[
        'scores = df["score"]',
        'small = df[["student_id", "score"]]',
        'print(type(scores).__name__)',
        'print(type(small).__name__)'
      ],
      notes:[
        ['df["score"]','Select one variable → Series.'],
        ['df[["student_id", "score"]]','Pass a list of column names → DataFrame.'],
        ['type(...)','Confirm what object each expression created.']
      ],
      visual:'select',
      excel:'Click one column or select several columns',
      pandas:'Select by labels so the operation is reproducible',
      checkpoint:'Series = 1D variable; DataFrame = 2D table.',
      live:'select-filter'
    },
    {
      key:'filter',
      n:'07',
      eyebrow:'STEP 6 · BOOLEAN MASK + FILTER',
      title:'A condition is evaluated for every row, not just once.',
      intro:'The expression df["score"] >= 80 creates one True/False result per observation. That Boolean Series becomes a mask. .loc then keeps the rows whose mask value is True and can select specific variables at the same time.',
      code:[
        'mask = df["score"] >= 80',
        'high = df.loc[',
        '    mask,',
        '    ["student_id", "group", "score"]',
        ']',
        'print(high)'
      ],
      notes:[
        ['mask = ...','Build a Boolean Series with one result per row.'],
        ['df.loc[mask, ...]','Use the mask to keep matching observations.'],
        ['column list','Return only the variables needed for the analysis.'],
        ['print(high)','Inspect the filtered table instead of assuming the filter worked.']
      ],
      visual:'filter',
      excel:'Filter dropdown → Number Filters → Greater Than or Equal To',
      pandas:'Boolean Series → .loc',
      checkpoint:'Every displayed row in high must satisfy score >= 80.',
      live:'select-filter'
    },
    {
      key:'transform',
      n:'08',
      eyebrow:'STEP 7 · TRANSFORM THE DATASET',
      title:'Replace copy-down formulas with vectorized column operations.',
      intro:'Pandas applies expressions to complete Series. You can derive a variable for every observation, sort complete records and build a smaller analysis table with a few explicit statements.',
      code:[
        'df["passed"] = df["score"] >= 70',
        'df["performance_index"] = (df["score"] * df["attendance"]).round(2)',
        'ordered = df.sort_values("performance_index", ascending=False)',
        'print(ordered.head())'
      ],
      notes:[
        ['passed','One comparison creates a Boolean value for every row.'],
        ['performance_index','Combine two complete variables without copying a formula down 24 rows.'],
        ['sort_values(...)','Reorder complete observations while preserving the relationship among columns.'],
        ['head()','Inspect the highest-ranked records after sorting.']
      ],
      visual:'transform',
      excel:'Type a formula, fill down, then sort the whole range',
      pandas:'One vectorized expression + sort_values',
      checkpoint:'The code documents exactly how the new variable was calculated for every observation.',
      live:'derive-column'
    },
    {
      key:'quality',
      n:'09',
      eyebrow:'STEP 8 · DATA QUALITY',
      title:'Measure missing values and duplicates before deciding how to clean.',
      intro:'Cleaning is not “make the table look nicer.” It is a documented analytical decision. First quantify the issue, then choose a treatment such as fillna, dropna or drop_duplicates and preserve that decision in code.',
      code:[
        'print(df.isna().sum())',
        'print(df.duplicated().sum())',
        'clean = df.drop_duplicates().copy()'
      ],
      notes:[
        ['isna().sum()','Count missing cells in each variable.'],
        ['duplicated().sum()','Count repeated rows.'],
        ['drop_duplicates().copy()','Create an explicit cleaned copy instead of silently editing the original DataFrame.']
      ],
      visual:'quality',
      excel:'Filter blanks / Remove Duplicates manually',
      pandas:'Quantify first, then apply an explicit cleaning method',
      checkpoint:'A cleaning choice should be explainable and reproducible.',
      live:'clean-data'
    },
    {
      key:'export',
      n:'10',
      eyebrow:'STEP 9 · EXPORT A REAL XLSX',
      title:'Finish the workflow by creating a new workbook from the DataFrame.',
      intro:'to_excel performs the reverse direction of read_excel. The transformed DataFrame is encoded as a real .xlsx file. index=False prevents the Pandas index from appearing as an unwanted spreadsheet column.',
      code:[
        'df.to_excel(',
        '    "analysis_output.xlsx",',
        '    sheet_name="Students",',
        '    index=False',
        ')'
      ],
      notes:[
        ['df.to_excel(...)','Serialize the current DataFrame into an Excel workbook.'],
        ['analysis_output.xlsx','Use a new output filename so the source workbook is preserved.'],
        ['sheet_name=','Give the exported worksheet a meaningful name.'],
        ['index=False','Do not create an extra Excel column from the Pandas row index.']
      ],
      visual:'export',
      excel:'Save As → new workbook',
      pandas:'DataFrame.to_excel(...) → new workbook',
      checkpoint:'A reproducible workflow ends with both the code and the generated output file.',
      live:'export-excel'
    }
  ]);

  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function grid(headers, rows, className=''){
    return `<div class="p58-grid ${className}" style="--cols:${headers.length}">${headers.map(h=>`<b>${esc(h)}</b>`).join('')}${rows.flat().map(v=>`<span>${esc(v)}</span>`).join('')}</div>`;
  }

  function flowNode(kicker,title,detail,part,extra=''){
    return `<div class="p58-flow-node ${extra}" data-p58-part="${part}"><span>${esc(kicker)}</span><strong>${esc(title)}</strong><small>${esc(detail)}</small></div>`;
  }
  function arrow(label,part){
    return `<div class="p58-flow-arrow" data-p58-part="${part}"><i></i><span>${esc(label)}</span></div>`;
  }

  function visual(type){
    switch(type){
      case 'objects':
        return `<div class="p58-flow">${flowNode('XLSX','Workbook','file on disk',0,'file')}${arrow('filename',0)}${flowNode('PYTHON','Pandas / pd','library in session',1,'library')}${arrow('read_excel',2)}${flowNode('df','DataFrame','table in memory',2,'frame')}</div>`;
      case 'import':
        return `<div class="p58-import-diagram"><div class="p58-session" data-p58-part="0"><span>PYTHON SESSION</span><strong>Before import</strong><code>pd → not defined</code></div><div class="p58-import-command" data-p58-part="1"><code>import pandas as pd</code><i></i></div><div class="p58-session ready" data-p58-part="2"><span>PYTHON SESSION</span><strong>After import</strong><code>pd → pandas</code><small>No Excel file has been read yet.</small></div></div>`;
      case 'sheets':
        return `<div class="p58-workbook" data-p58-part="0"><div class="p58-window"><b></b><b></b><b></b><strong>${esc(DATASET.file)}</strong></div>${grid(['student_id','group','score'],[['S001','11A','82'],['S002','11B','91'],['S003','11C','76']])}<div class="p58-tabs"><span class="active" data-p58-part="1">Students</span><span data-p58-part="1">README</span></div><div class="p58-result" data-p58-part="2"><code>xls.sheet_names</code><strong>['Students', 'README']</strong></div></div>`;
      case 'read':
        return `<div class="p58-read-diagram">${flowNode('XLSX','Students worksheet','stored cells',0,'file')}${arrow('pd.read_excel',1)}<div class="p58-dataframe" data-p58-part="2"><div><span>df</span><strong>DataFrame</strong></div>${grid(['student_id','group','score'],[['S001','11A','82'],['S002','11B','91'],['S003','11C','76']])}<small class="p58-row-label">row = observation</small><small class="p58-col-label">column = variable</small></div></div>`;
      case 'inspect':
        return `<div class="p58-inspect-diagram"><div class="p58-dataframe wide" data-p58-part="0">${grid(DATASET.columns,[['S001','11A','2.5','0.88','82'],['S002','11B','4.0','0.95','91'],['S003','11C','3.0','0.81','76']])}</div><div class="p58-inspect-tools"><div data-p58-part="0"><code>shape</code><strong>rows × columns</strong></div><div data-p58-part="1"><code>columns</code><strong>exact labels</strong></div><div data-p58-part="2"><code>dtypes</code><strong>interpreted types</strong></div><div data-p58-part="3"><code>head()</code><strong>sample records</strong></div></div></div>`;
      case 'select':
        return `<div class="p58-select-diagram"><div data-p58-part="0"><span>ONE VARIABLE</span>${grid(['score'],[['82'],['91'],['76']])}<strong>Series</strong><code>df["score"]</code></div><i>VS</i><div data-p58-part="1"><span>MULTIPLE VARIABLES</span>${grid(['student_id','score'],[['S001','82'],['S002','91'],['S003','76']])}<strong>DataFrame</strong><code>df[["student_id","score"]]</code></div></div>`;
      case 'filter':
        return `<div class="p58-filter-diagram"><div class="p58-vector" data-p58-part="0"><span>SCORE</span><b>82</b><b>91</b><b>76</b><b>88</b><b>69</b></div>${arrow('>= 80',0)}<div class="p58-vector mask" data-p58-part="1"><span>MASK</span><b>True</b><b>True</b><b>False</b><b>True</b><b>False</b></div>${arrow('.loc',2)}<div class="p58-vector result" data-p58-part="3"><span>KEPT</span><b>82</b><b>91</b><b>88</b></div></div>`;
      case 'transform':
        return `<div class="p58-transform-diagram"><div class="p58-excel-side" data-p58-part="0"><span>EXCEL</span><strong>Formula copied down</strong><div><code>=score*attendance</code><i>↓</i><i>↓</i><i>↓</i></div></div><div class="p58-vectorize" data-p58-part="1"><span>PANDAS</span><code>df["performance_index"] =<br>(df["score"] * df["attendance"]).round(2)</code><strong>one vectorized operation</strong></div><div class="p58-sort-stack" data-p58-part="2"><span>SORT</span><b>91 · 0.95</b><b>88 · 0.93</b><b>82 · 0.88</b><small>complete rows move together</small></div></div>`;
      case 'quality':
        return `<div class="p58-quality-diagram"><div data-p58-part="0">${grid(['student_id','hours_sleep','score'],[['S01','7.0','82'],['S02','NaN','91'],['S02','NaN','91'],['S03','6.5','76']])}</div><div class="p58-quality-tools"><div data-p58-part="0"><code>isna().sum()</code><strong>measure missing</strong></div><div data-p58-part="1"><code>duplicated().sum()</code><strong>measure duplicates</strong></div><div data-p58-part="2"><code>drop_duplicates()</code><strong>explicit decision</strong></div></div></div>`;
      case 'export':
        return `<div class="p58-flow export">${flowNode('df','DataFrame','transformed in memory',0,'frame')}${arrow('to_excel',1)}${flowNode('XLSX','analysis_output.xlsx','new workbook',2,'file output')}<div class="p58-index-card" data-p58-part="3"><code>index=False</code><span>prevents an extra spreadsheet column</span></div></div>`;
      default:return '';
    }
  }

  function codeBlock(stage){
    return `<div class="p58-code-shell"><div class="p58-code-top"><span>PYTHON · READ EACH LINE</span><button type="button" data-p58-replay-code>↺ Replay</button></div><div class="p58-code-lines">${stage.code.map((line,i)=>`<button type="button" class="p58-code-line" data-p58-line="${i}" aria-label="Explain line ${i+1}"><b>${String(i+1).padStart(2,'0')}</b><code>${esc(line||' ')}</code></button>`).join('')}</div><div class="p58-code-explain" aria-live="polite"></div></div>`;
  }

  function stageHtml(stage){
    return `<div class="p58-stage-inner" data-p58-stage="${stage.key}">
      <header><div><p class="eyebrow">${esc(stage.eyebrow)}</p><h3>${esc(stage.title)}</h3><p>${esc(stage.intro)}</p></div><strong>${stage.n} / ${String(STAGES.length).padStart(2,'0')}</strong></header>
      <div class="p58-stage-grid">${codeBlock(stage)}<div class="p58-diagram-shell"><div class="p58-diagram-top"><span>ANIMATED MODEL</span><small>follows the active code line</small></div><div class="p58-diagram">${visual(stage.visual)}</div></div></div>
      <div class="p58-compare"><div><span>EXCEL</span><strong>${esc(stage.excel)}</strong></div><i>↔</i><div><span>PANDAS</span><strong>${esc(stage.pandas)}</strong></div></div>
      <div class="p58-checkpoint"><b>CHECKPOINT</b><p>${esc(stage.checkpoint)}</p></div>
      <div class="p58-stage-actions"><button type="button" data-p58-prev>← Previous</button><button type="button" class="primary" data-p58-live="${stage.live}">Open executable example ↓</button><button type="button" data-p58-next>Next →</button></div>
    </div>`;
  }

  function navCard(stage){
    return `<button type="button" class="p58-nav-card" data-p58-nav="${stage.key}"><span>${stage.n}</span><div><small>${esc(stage.eyebrow)}</small><strong>${esc(stage.title)}</strong></div></button>`;
  }

  function foundations(){
    const cards=[
      ['Pandas','Python library for data analysis. It provides DataFrame, Series, file I/O, filtering, grouping and many statistical operations.','import pandas as pd'],
      ['DataFrame','Two-dimensional labeled table: rows are observations and columns are variables.','df'],
      ['Series','One-dimensional labeled variable. A single DataFrame column is usually returned as a Series.','df["score"]'],
      ['Index','Row labels maintained by Pandas. It is separate from your spreadsheet variables.','df.index'],
      ['dtype','Pandas interpretation of the values stored in a Series: number, text, Boolean, datetime, etc.','df.dtypes'],
      ['Vectorization','Apply one expression to a complete Series instead of copying formulas row by row.','df["passed"] = df["score"] >= 70']
    ];
    return `<section class="p58-foundations"><div class="section-heading"><p class="eyebrow">FOUNDATIONS · LARGE-TEXT REFERENCE</p><h2>Understand the objects before memorizing methods.</h2><p>Pandas becomes much easier when every command is attached to an object: package → DataFrame → Series → transformation → exported file.</p></div><div class="p58-foundation-grid">${cards.map((c,i)=>`<article><span>${String(i+1).padStart(2,'0')}</span><h3>${esc(c[0])}</h3><p>${esc(c[1])}</p><code>${esc(c[2])}</code></article>`).join('')}</div></section>`;
  }

  function excelComparison(){
    const rows=[
      ['Open workbook','Choose a source file','"pandas_excel_students.xlsx"','The file exists independently from Python.'],
      ['Worksheet tab','Choose one table','sheet_name="Students"','Do not assume the first sheet is correct.'],
      ['Column','Series / variable','df["score"]','Use labels instead of cell addresses.'],
      ['Several columns','Smaller DataFrame','df[["student_id","score"]]','Preserve a tabular object.'],
      ['Filter dropdown','Boolean mask + .loc','df.loc[df["score"] >= 80]','The filter rule is visible and repeatable.'],
      ['Sort range','Sort observations','df.sort_values("score")','Complete records move together.'],
      ['Copy formula down','Vectorized derived variable','df["passed"] = df["score"] >= 70','One expression applies to every row.'],
      ['Save As','Export DataFrame','df.to_excel(..., index=False)','Create a new auditable output workbook.']
    ];
    return `<section class="p58-excel-compare"><div class="section-heading"><p class="eyebrow">REAL EXCEL ↔ PANDAS BRIDGE</p><h2>Translate familiar spreadsheet actions into reproducible code.</h2><p>This table connects what students already do in Excel with the equivalent Pandas object or operation.</p></div><div class="p58-table-wrap"><table><thead><tr><th>Excel action</th><th>Pandas idea</th><th>Code</th><th>Analytical reason</th></tr></thead><tbody>${rows.map(r=>`<tr>${r.map((v,i)=>`<td>${i===2?`<code>${esc(v)}</code>`:esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
  }

  function practical(){
    return `<section class="p58-practical"><div class="p58-practical-copy"><p class="eyebrow">REAL PRACTICAL APPLICATION</p><h2>From the real workbook to a filtered Excel report.</h2><p>Use the actual classroom workbook already mounted by the live Pandas lab. The task combines inspection, a derived variable, two simultaneous filters, sorting and export.</p><ol><li>Read the <strong>Students</strong> worksheet.</li><li>Verify its structure instead of assuming the columns.</li><li>Create <code>performance_index = score × attendance</code>.</li><li>Keep observations with <code>score ≥ 80</code> and <code>attendance ≥ 0.90</code>.</li><li>Sort by the new variable.</li><li>Export the result as <code>analysis_output.xlsx</code>.</li></ol><div class="p58-practical-actions"><a href="data/${encodeURIComponent(DATASET.file)}" download="${DATASET.file}">↓ Download the real Excel workbook</a><button type="button" data-p58-run-practical>▶ Load + run this application in the live lab</button></div></div><pre><code>${esc(PRACTICAL_CODE)}</code></pre></section>`;
  }

  function html(){
    return `<section id="pandasGuidedTheoryV58" class="p58-guide">
      <div class="p58-hero"><div><p class="eyebrow">PANDAS + EXCEL · GUIDED THEORY V58</p><h2>Read the code at classroom size. Watch the data model change with it.</h2><p>This version prioritizes readability, explicit line-by-line explanation, animated diagrams, and a practical workflow using the real .xlsx dataset.</p></div><div class="p58-hero-metrics"><div><strong>${STAGES.length}</strong><span>guided stages</span></div><div><strong>${DATASET.rows}</strong><span>real rows</span></div><div><strong>1</strong><span>downloadable XLSX</span></div></div></div>
      ${foundations()}
      <section class="p58-real-file"><div class="p58-file-badge">XLSX</div><div><p class="eyebrow">THE FILE USED BY THE LESSON</p><h3>${DATASET.file}</h3><p>${DATASET.rows} classroom observations · sheets: ${DATASET.sheets.join(' + ')} · core variables: ${DATASET.columns.join(', ')}.</p></div><a href="data/${encodeURIComponent(DATASET.file)}" download="${DATASET.file}">Open it in Excel ↓</a></section>
      ${excelComparison()}
      <section class="p58-guided"><div class="section-heading"><p class="eyebrow">STEP-BY-STEP EXPLORATION</p><h2>Code line → explanation → animated diagram → executable example.</h2><p>Choose a stage or use Next. Each line can be clicked. The highlighted diagram element follows the active line automatically.</p></div><div class="p58-guided-layout"><nav class="p58-nav" aria-label="Pandas guided theory stages">${STAGES.map(navCard).join('')}</nav><article class="p58-stage" aria-live="polite"></article></div></section>
      ${practical()}
      <section class="p58-final"><p class="eyebrow">COMPLETE MENTAL MODEL</p><h2>File → sheet → DataFrame → inspect → select → filter → transform → verify → export.</h2><div>${['Excel workbook','Worksheet','pd.read_excel','DataFrame','Inspect','Filter / derive','Quality check','to_excel','New workbook'].map((x,i)=>`<span>${esc(x)}</span>${i<8?'<i>→</i>':''}`).join('')}</div></section>
    </section>`;
  }

  let activeIndex=0;
  let phaseTimer=null;

  function stopPhase(){
    if(phaseTimer) clearInterval(phaseTimer);
    phaseTimer=null;
  }

  function stageByKey(key){return STAGES.find(s=>s.key===key);}

  function applyPhase(stage,lineIndex){
    const root=document.querySelector('#pandasGuidedTheoryV58 .p58-stage');
    if(!root) return;
    const lines=[...root.querySelectorAll('.p58-code-line')];
    lines.forEach((line,i)=>line.classList.toggle('is-active',i===lineIndex));
    const note=root.querySelector('.p58-code-explain');
    const noteIndex=Math.min(lineIndex,stage.notes.length-1);
    if(note&&stage.notes[noteIndex]){
      note.innerHTML=`<span>LINE EXPLANATION</span><strong>${esc(stage.notes[noteIndex][0])}</strong><p>${esc(stage.notes[noteIndex][1])}</p>`;
    }
    const parts=[...root.querySelectorAll('[data-p58-part]')];
    const maxPart=Math.max(0,...parts.map(el=>Number(el.dataset.p58Part)||0));
    const mapped=Math.min(lineIndex,maxPart);
    parts.forEach(el=>el.classList.toggle('is-focus',(Number(el.dataset.p58Part)||0)===mapped));
    root.dataset.phase=String(lineIndex);
  }

  function playPhases(stage){
    stopPhase();
    let line=0;
    applyPhase(stage,line);
    if(stage.code.length<=1) return;
    phaseTimer=setInterval(()=>{
      line=(line+1)%stage.code.length;
      applyPhase(stage,line);
    },2200);
  }

  function activate(index,{scroll=false}={}){
    activeIndex=Math.max(0,Math.min(STAGES.length-1,index));
    const stage=STAGES[activeIndex];
    const root=document.querySelector('#pandasGuidedTheoryV58 .p58-stage');
    if(root) root.innerHTML=stageHtml(stage);
    document.querySelectorAll('[data-p58-nav]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.p58Nav===stage.key));
    playPhases(stage);
    if(scroll) root?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function openLive(key,{run=false,code=null}={}){
    const lesson=document.querySelector(`[data-pandas-live-key="${CSS.escape(key)}"]`);
    if(!lesson) return;
    if(code){
      const editor=lesson.querySelector('[data-pandas-editor]');
      if(editor) editor.value=code;
    }
    lesson.scrollIntoView({behavior:'smooth',block:'start'});
    lesson.classList.add('p58-live-target');
    setTimeout(()=>lesson.classList.remove('p58-live-target'),1900);
    if(run) setTimeout(()=>lesson.querySelector('[data-pandas-run]')?.click(),650);
  }

  function enhanceLive(live){
    live.classList.add('p58-live-upgraded');
    const heading=live.querySelector('.section-heading');
    if(heading){
      const h2=heading.querySelector('h2');
      const p=heading.querySelector('p:not(.eyebrow)');
      if(h2) h2.textContent='Execute the same ideas with real Pandas + real XLSX files';
      if(p) p.textContent='Every example below runs in the browser Python runtime. Read the explanation, inspect the code, run it, then compare the output with the animated theory above.';
    }
    live.querySelectorAll('.live-lesson-v19').forEach((lesson,index)=>{
      if(lesson.querySelector('.p58-live-sequence')) return;
      const copy=lesson.querySelector('.live-copy-v19');
      if(copy){
        const tag=document.createElement('div');
        tag.className='p58-live-sequence';
        tag.innerHTML=`<span>EXECUTABLE STEP ${String(index+1).padStart(2,'0')}</span><strong>Read → Run → Inspect output → Change one thing → Run again</strong>`;
        copy.appendChild(tag);
      }
    });
  }

  function bind(section){
    section.addEventListener('click',e=>{
      const nav=e.target.closest('[data-p58-nav]');
      if(nav){activate(STAGES.findIndex(s=>s.key===nav.dataset.p58Nav),{scroll:true});return;}
      const line=e.target.closest('[data-p58-line]');
      if(line){stopPhase();applyPhase(STAGES[activeIndex],Number(line.dataset.p58Line)||0);return;}
      if(e.target.closest('[data-p58-replay-code]')){playPhases(STAGES[activeIndex]);return;}
      if(e.target.closest('[data-p58-prev]')){activate(activeIndex-1,{scroll:true});return;}
      if(e.target.closest('[data-p58-next]')){activate(activeIndex+1,{scroll:true});return;}
      const live=e.target.closest('[data-p58-live]');
      if(live){openLive(live.dataset.p58Live);return;}
      if(e.target.closest('[data-p58-run-practical]')){openLive('export-excel',{run:true,code:PRACTICAL_CODE});return;}
    });
  }

  function upgradeLegacyDiagrams(){
    const section=document.querySelector('.theory-diagrams-section');
    if(!section) return;
    section.classList.add('p58-legacy-diagrams');
    const h2=section.querySelector('.section-heading h2');
    const p=section.querySelector('.section-heading p:last-child');
    if(h2) h2.textContent='Additional animated mental models';
    if(p) p.textContent='Use these as a second visual pass after the guided sequence. Labels and tables are enlarged for classroom projection.';
  }

  function install(){
    if(document.getElementById('pandasGuidedTheoryV58')) return true;
    const app=document.getElementById('theoryApp');
    const live=document.querySelector('.pandas-excel-live-v53');
    const concept=document.getElementById('conceptSection');
    if(!app||app.classList.contains('hidden')||!live||!concept) return false;

    document.getElementById('pandasGuidedTheoryV57')?.remove();
    app.classList.add('p58-topic');
    live.insertAdjacentHTML('beforebegin',html());
    const section=document.getElementById('pandasGuidedTheoryV58');
    if(!section) return false;

    bind(section);
    enhanceLive(live);
    upgradeLegacyDiagrams();
    activate(0);

    document.documentElement.dataset.pandasGuidedTheory=VERSION;
    document.documentElement.dataset.pandasGuidedStages=String(STAGES.length);
    return true;
  }

  let scheduled=false;
  const schedule=()=>{
    if(scheduled||document.getElementById('pandasGuidedTheoryV58')) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;install();});
  };
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  window.addEventListener('load',schedule,{once:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPhase();else if(document.getElementById('pandasGuidedTheoryV58'))playPhases(STAGES[activeIndex]);});
  schedule();
})();