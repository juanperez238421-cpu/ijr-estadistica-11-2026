(() => {
  'use strict';

  const VERSION = 'v52';
  const TOPIC = 'logic';
  const DATASETS = [
    {
      file: 'pandas_excel_students.xlsx',
      title: 'Student performance',
      description: '24 synthetic observations · filter, sort, derive columns and export.',
      sheets: 'Students + README'
    },
    {
      file: 'pandas_excel_sales.xlsx',
      title: 'Multi-sheet sales',
      description: 'Sales + Products sheets · inspect sheet names, merge tables and aggregate.',
      sheets: 'Sales + Products + README'
    },
    {
      file: 'pandas_excel_dirty.xlsx',
      title: 'Data cleaning',
      description: 'Missing values + duplicate record · isna(), duplicated(), fillna() and clean export.',
      sheets: 'Survey + README'
    }
  ];

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));

  function patchTopic() {
    const source = window.IJR_PYTHON_HUB_TOPICS || [];
    if (!source.length) return;
    const topics = source.map(topic => ({ ...topic }));
    const index = topics.findIndex(topic => topic.slug === TOPIC);
    if (index < 0) return;
    const original = topics[index];
    const byKey = Object.fromEntries((original.exercises || []).map(item => [item.key, item]));

    topics[index] = {
      ...original,
      title: 'Pandas + Excel (.xlsx): load, inspect, manipulate and export',
      nav: 'Pandas + XLSX',
      lead: 'Learn what a Python library is, why data analysts use Pandas, how an Excel workbook becomes a DataFrame, and how to upload, inspect, transform, create and export real .xlsx files.',
      definition: 'A library is reusable code written so we do not have to build every tool from zero. Pandas is the Python data-analysis library used here. After import pandas as pd, the name pd gives access to tools such as read_excel(), DataFrame(), ExcelFile() and ExcelWriter(). An Excel workbook is a file on disk; a Pandas DataFrame is a tabular object in Python memory. The core workflow is: file → read with Pandas → DataFrame → inspect → manipulate → verify → export.',
      goals: [
        'Explain library, package, module, import and alias in practical Python terms.',
        'Explain why import pandas as pd makes Pandas tools available through the pd namespace.',
        'Distinguish an Excel workbook, worksheet, Pandas DataFrame and Pandas Series.',
        'Upload a real .xlsx file into the classroom runtime and read it with pd.read_excel(...).',
        'Use pd.ExcelFile(...) to discover sheet names before selecting a worksheet.',
        'Inspect df.shape, df.columns, df.dtypes, df.head(), missing values and descriptive summaries before analysis.',
        'Select columns and rows with [] and .loc, filter with Boolean conditions, sort with sort_values(), and create derived variables.',
        'Create a new DataFrame from Python data and write a real .xlsx file with DataFrame.to_excel(...).',
        'Write multiple DataFrames to separate worksheets with pd.ExcelWriter(...).',
        'Export a transformed DataFrame so the analysis can be reproduced outside the browser.'
      ],
      sections: [
        { title: '1 · What is a library?', body: 'A Python library is a collection of reusable functionality. Instead of programming spreadsheet parsing, table structures, filtering and Excel writing yourself, you import a library that already implements those operations. In this topic Pandas is the analysis library and openpyxl is the Excel .xlsx engine used underneath many Pandas read/write operations.' },
        { title: '2 · import pandas as pd', body: 'import loads a library into the running Python session. pandas is the package name. as pd creates the conventional short alias pd. After that, pd.read_excel, pd.DataFrame and pd.ExcelWriter mean “use this tool from Pandas”. The alias is not a second library; it is simply a shorter name.' },
        { title: '3 · Workbook → worksheet → DataFrame', body: 'The .xlsx workbook is the physical file. A worksheet is one tab inside the workbook. pd.ExcelFile(...) can list the workbook sheet names. pd.read_excel(...) reads one worksheet and produces a DataFrame. A DataFrame has labeled rows and columns; selecting one column normally produces a Series.' },
        { title: '4 · Uploading is different from reading', body: 'Upload places file bytes inside the current browser/Python session. Reading happens afterwards. In the workshop, use Upload .xlsx or a provided class dataset first; then run pd.read_excel("filename.xlsx"). If the file is not present in the runtime, Pandas cannot read it.' },
        { title: '5 · Inspect before you calculate', body: 'A real analyst does not assume the workbook structure. First inspect sheet names, shape, column names, data types, first rows, missing values and basic summaries. This confirms that the correct file and variables were loaded before any statistical operation.' },
        { title: '6 · Manipulation means reproducible transformations', body: 'Selection, filtering, sorting and derived columns transform the in-memory DataFrame through code. Example: df.loc[df["score"] >= 80, ["student_id","score"]] selects rows and variables; df.sort_values("score", ascending=False) reorders observations; df["passed"] = df["score"] >= 70 creates a new variable.' },
        { title: '7 · Create a real Excel file from Python', body: 'Pandas can create a DataFrame directly from Python lists or dictionaries. DataFrame.to_excel(...) writes that table to a genuine .xlsx workbook. This direction is the reverse of read_excel: Python DataFrame → Excel workbook.' },
        { title: '8 · Multiple worksheets', body: 'pd.ExcelWriter(...) lets one workbook contain several DataFrames on different sheet names. This is useful when one analysis needs raw data, a filtered table and a summary in one deliverable.' },
        { title: '9 · Data quality is part of analysis', body: 'Real files contain missing values and sometimes duplicates. df.isna().sum() reveals missing values, df.duplicated().sum() identifies duplicate rows, and methods such as fillna(), dropna() and drop_duplicates() support explicit cleaning decisions.' },
        { title: '10 · Save the result, not just the screen output', body: 'A reproducible workflow ends by exporting the transformed DataFrame. df.to_excel("analysis_output.xlsx", index=False) creates a file that can be downloaded and opened in Excel while preserving the transformations performed in Python.' }
      ],
      syntax: [
        ['Import the library', 'import pandas as pd'],
        ['Inspect workbook sheets', 'xls = pd.ExcelFile("workbook.xlsx")\nxls.sheet_names'],
        ['Read a worksheet', 'df = pd.read_excel("workbook.xlsx", sheet_name="Students")'],
        ['Preview records', 'df.head()'],
        ['Rows × columns', 'df.shape'],
        ['Column names', 'df.columns.tolist()'],
        ['Data types', 'df.dtypes'],
        ['Missing values', 'df.isna().sum()'],
        ['Numeric summary', 'df.describe()'],
        ['Select one Series', 'scores = df["score"]'],
        ['Select several columns', 'small = df[["student_id", "score"]]'],
        ['Filter rows', 'high = df.loc[df["score"] >= 80]'],
        ['Filter + select', 'high = df.loc[df["score"] >= 80, ["student_id", "score"]]'],
        ['Sort rows', 'ordered = df.sort_values("score", ascending=False)'],
        ['Create derived column', 'df["passed"] = df["score"] >= 70'],
        ['Create DataFrame', 'practice = pd.DataFrame({"name":["A","B"], "score":[82,91]})'],
        ['Write Excel', 'practice.to_excel("practice.xlsx", index=False)'],
        ['Write multiple sheets', 'with pd.ExcelWriter("report.xlsx") as writer:\n    df.to_excel(writer, sheet_name="Data", index=False)\n    high.to_excel(writer, sheet_name="High scores", index=False)']
      ],
      pitfalls: [
        'Calling pd.read_excel(...) before the workbook has been uploaded or mounted in the runtime.',
        'Confusing import pandas as pd with loading an Excel file. Import loads the library; read_excel loads the data.',
        'Confusing the .xlsx file on disk with the DataFrame object stored in memory.',
        'Assuming the first worksheet is correct without checking pd.ExcelFile(...).sheet_names.',
        'Typing spreadsheet values manually into a Python list instead of reading the real workbook.',
        'Using pd.read_csv(...) on an .xlsx file.',
        'Filtering before verifying exact column names and data types.',
        'Overwriting the original DataFrame unintentionally when a transformed copy was intended.',
        'Ignoring missing values or duplicates before calculating statistics.',
        'Saving the DataFrame index as an unwanted Excel column because index=False was omitted.',
        'Using an output filename that overwrites the original workbook when preservation is required.',
        'Treating a displayed table as proof that the exported .xlsx file actually exists.'
      ],
      resources: [
        ...(original.resources || []),
        { name: 'Pandas getting started', kind: 'Official documentation', url: 'https://pandas.pydata.org/docs/getting_started/index.html', logo: 'https://pandas.pydata.org/static/img/pandas_mark.svg' },
        { name: 'Pandas DataFrame.to_excel', kind: 'Official documentation', url: 'https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.to_excel.html', logo: 'https://pandas.pydata.org/static/img/pandas_mark.svg' },
        { name: 'Pandas ExcelFile', kind: 'Official documentation', url: 'https://pandas.pydata.org/docs/reference/api/pandas.ExcelFile.html', logo: 'https://pandas.pydata.org/static/img/pandas_mark.svg' }
      ],
      workshopIntro: 'Start with the practical Pandas + Excel lab below. Use the real Files panel: load the class workbook or upload an .xlsx, inspect it, then solve the 12 graded stages from blank Python cells. Three additional real workbooks are provided for selection/filtering, multi-sheet analysis and data cleaning. The final outputs for graded stages remain server-validated.',
      exercises: [
        { ...(byKey['logic-01'] || {}), prompt: 'Practical file workflow: load the class workbook with the Files panel, import pandas as pd, read "stat11_stage4_students.xlsx" into df with pd.read_excel(...), inspect df.head(), then print whether df contains at least one observation.' },
        { ...(byKey['logic-02'] || {}), prompt: 'After reading the workbook, inspect df.columns.tolist(). Then print the Boolean result of checking that "score" exists in df.columns. Express the final check explicitly with == True.' },
        { ...(byKey['logic-03'] || {}), prompt: 'Read the real workbook and inspect df.shape. Create one Boolean for at least one row and another for the presence of the "score" variable. Combine both with and, then print the result.' },
        { ...(byKey['logic-04'] || {}), prompt: 'Read the workbook and inspect the score Series with df["score"]. Use a vectorized comparison to check whether at least one observation has score >= 90. Combine that Boolean with or False and print the result.' },
        { ...(byKey['logic-05'] || {}), prompt: 'Read the workbook, create sorted_df = df.sort_values("score"), preview sorted_df.head(), then use if/else to print sorted_df["score"].is_monotonic_increasing when rows exist; otherwise print False.' },
        { ...(byKey['logic-06'] || {}), prompt: 'Read the workbook and create the derived variable df["score_90"] = df["score"] >= 90. Inspect df[["score","score_90"]].head(). Then use if/elif/else to print "created" when the new column exists, "review" for an alternative case, and "missing" otherwise.' },
        { ...(byKey['logic-07'] || {}), prompt: 'Read the workbook and select selected = df[["score"]]. Inspect selected.head(). Use if/else and == to verify that selected.columns[0] is "score"; print "selected" when true and "review" otherwise.' },
        { ...(byKey['logic-08'] || {}), prompt: 'Read the workbook and use Boolean filtering: filtered = df[df["score"] >= 90]. Inspect the filtered rows, then print len(filtered). If the dataset is unavailable or the column is missing, print 0.' },
        { ...(byKey['logic-09'] || {}), prompt: 'Read the workbook, inspect its columns, store missing_score = "score" not in df.columns, and use if/else with not to print "score ready" when the variable is available; otherwise print "review".' },
        byKey['logic-10'] || {},
        byKey['logic-11'] || {},
        { ...(byKey['logic-12'] || {}), prompt: 'Why should an analyst inspect sheet names, rows, columns, data types and first records immediately after loading an unfamiliar Excel workbook?' }
      ]
    };

    const finalized = Object.freeze(topics.map(topic => Object.freeze(topic)));
    window.IJR_PYTHON_HUB_TOPICS = finalized;
    window.IJR_PYTHON_HUB_TOPIC_MAP = Object.freeze(Object.fromEntries(finalized.map(topic => [topic.slug, topic])));
    window.IJR_PANDAS_EXCEL_V52 = Object.freeze({ version: VERSION, topic: TOPIC, datasets: DATASETS.map(item => ({ ...item })) });
  }

  function codeBlock(title, code, explanation) {
    return `<article class="pandas-v52-code-card"><div class="pandas-v52-card-head"><span>PYTHON</span><strong>${escapeHtml(title)}</strong></div><pre><code>${escapeHtml(code)}</code></pre><p>${escapeHtml(explanation)}</p></article>`;
  }

  function datasetCards() {
    return DATASETS.map(item => `<a class="pandas-v52-dataset-card" href="data/${encodeURIComponent(item.file)}" download="${escapeHtml(item.file)}"><span class="pandas-v52-file-icon">XLSX</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.sheets)}</small><p>${escapeHtml(item.description)}</p><code>${escapeHtml(item.file)}</code></div><b>↓</b></a>`).join('');
  }

  function theoryPanel() {
    if (new URLSearchParams(location.search).get('topic') !== TOPIC) return null;
    if (document.getElementById('pandasExcelTheoryV52')) return null;
    const concept = document.getElementById('conceptSection');
    if (!concept || !concept.children.length) return null;
    const section = document.createElement('section');
    section.id = 'pandasExcelTheoryV52';
    section.className = 'pandas-v52-theory';
    section.innerHTML = `<div class="section-heading"><p class="eyebrow">REAL PANDAS + EXCEL LAB</p><h2>From library concept to a real .xlsx file.</h2><p>This is the complete workflow students should understand before the graded workshop: import the library, place a workbook in the runtime, read a worksheet, inspect the DataFrame, manipulate it and write a new Excel file.</p></div>
      <div class="pandas-v52-library-grid"><article><span>01</span><h3>Library</h3><p>Reusable code that provides ready-made tools.</p><code>pandas</code></article><article><span>02</span><h3>Import + alias</h3><p>Load Pandas and give it the conventional short name <code>pd</code>.</p><code>import pandas as pd</code></article><article><span>03</span><h3>DataFrame</h3><p>A labeled table in Python memory: observations in rows, variables in columns.</p><code>df</code></article><article><span>04</span><h3>Excel engine</h3><p><code>openpyxl</code> handles the .xlsx format underneath many Pandas read/write operations.</p><code>.xlsx</code></article></div>
      <div class="pandas-v52-flow" aria-label="Excel with Pandas workflow"><span>UPLOAD / CREATE .XLSX</span><i>→</i><span>pd.read_excel</span><i>→</i><span>DATAFRAME</span><i>→</i><span>INSPECT</span><i>→</i><span>FILTER / SORT / DERIVE</span><i>→</i><span>to_excel</span></div>
      <div class="pandas-v52-code-grid">
        ${codeBlock('A · Discover and read a workbook', `import pandas as pd\n\nxls = pd.ExcelFile("pandas_excel_students.xlsx")\nprint(xls.sheet_names)\n\ndf = pd.read_excel(\n    "pandas_excel_students.xlsx",\n    sheet_name="Students"\n)\n\nprint(df.shape)\nprint(df.columns.tolist())\nprint(df.head())`, 'ExcelFile discovers the workbook structure; read_excel converts one worksheet into a DataFrame.')}
        ${codeBlock('B · Manipulate the DataFrame', `df["performance_index"] = df["score"] * df["attendance"]\n\nhigh = df.loc[\n    (df["attendance"] >= 0.80) & (df["score"] >= 80),\n    ["student_id", "group", "score", "performance_index"]\n]\n\nhigh = high.sort_values("score", ascending=False)\nprint(high.head())`, 'The original spreadsheet does not need manual editing: the transformation is expressed as reproducible Python code.')}
        ${codeBlock('C · Create a real Excel workbook', `practice = pd.DataFrame({\n    "student_id": ["A01", "A02", "A03"],\n    "hours": [2.5, 4.0, 5.5],\n    "score": [72, 86, 93]\n})\n\npractice["passed"] = practice["score"] >= 70\n\npractice.to_excel(\n    "practice_created.xlsx",\n    sheet_name="Students",\n    index=False\n)`, 'Pandas creates a DataFrame in memory and to_excel writes genuine .xlsx bytes that Excel can open.')}
        ${codeBlock('D · Write multiple worksheets', `summary = df.groupby("group", as_index=False)["score"].mean()\n\nwith pd.ExcelWriter("analysis_report.xlsx") as writer:\n    df.to_excel(writer, sheet_name="Data", index=False)\n    high.to_excel(writer, sheet_name="High scores", index=False)\n    summary.to_excel(writer, sheet_name="Summary", index=False)`, 'ExcelWriter creates one workbook containing several worksheets, each produced from a DataFrame.')}
      </div>
      <div class="pandas-v52-datasets"><div class="pandas-v52-subhead"><div><p class="eyebrow">REAL PRACTICE FILES</p><h3>Download actual .xlsx workbooks.</h3></div><p>All three are synthetic classroom datasets. Use them in the workshop Files panel.</p></div><div class="pandas-v52-dataset-grid">${datasetCards()}</div></div>`;
    concept.after(section);
    document.documentElement.dataset.pandasExcelTheory = VERSION;
    return section;
  }

  function waitForRuntime() {
    if (window.IJR_XLSX_RUNTIME_V46) return Promise.resolve(window.IJR_XLSX_RUNTIME_V46);
    document.getElementById('connectButton')?.click();
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const timer = setInterval(() => {
        if (window.IJR_XLSX_RUNTIME_V46) { clearInterval(timer); resolve(window.IJR_XLSX_RUNTIME_V46); }
        else if (Date.now() - started > 60000) { clearInterval(timer); reject(new Error('Python runtime did not become ready.')); }
      }, 120);
    });
  }

  async function createWorkbookWithPandas() {
    const status = document.getElementById('pandasV52CreateStatus');
    const button = document.getElementById('pandasV52CreateButton');
    const download = document.getElementById('pandasV52GeneratedDownload');
    if (button) button.disabled = true;
    if (status) status.textContent = 'Starting Python and loading Pandas + Excel support…';
    try {
      const runtime = await waitForRuntime();
      try { await runtime.loadPackage(['pandas', 'openpyxl']); }
      catch { await runtime.loadPackage('pandas'); await runtime.loadPackage('micropip'); await runtime.runPythonAsync("import micropip\nawait micropip.install('openpyxl==3.1.5')"); }
      await runtime.runPythonAsync(`import pandas as pd\n\ncreated = pd.DataFrame({\n    "student_id": ["P01","P02","P03","P04","P05","P06","P07","P08"],\n    "study_hours": [1.5,2.0,2.5,3.0,3.5,4.0,4.5,5.0],\n    "score": [61,68,72,77,81,86,90,95]\n})\ncreated["passed"] = created["score"] >= 70\nsummary = created.agg({"study_hours":"mean","score":"mean"}).to_frame("mean").reset_index()\n\nwith pd.ExcelWriter("pandas_created_demo.xlsx") as writer:\n    created.to_excel(writer, sheet_name="Students", index=False)\n    summary.to_excel(writer, sheet_name="Summary", index=False)\n`);
      const bytes = runtime.FS.readFile('/home/pyodide/pandas_created_demo.xlsx');
      const blob = new Blob([bytes], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      if (download) { if (download.dataset.objectUrl) URL.revokeObjectURL(download.dataset.objectUrl); download.dataset.objectUrl = url; download.href = url; download.download = 'pandas_created_demo.xlsx'; download.classList.remove('hidden'); }
      const input = document.getElementById('v46UploadInput');
      if (input && typeof DataTransfer !== 'undefined') { const dt = new DataTransfer(); dt.items.add(new File([blob], 'pandas_created_demo.xlsx', { type:blob.type })); input.files = dt.files; input.dispatchEvent(new Event('change', { bubbles:true })); }
      if (status) status.textContent = 'Created with Pandas: pandas_created_demo.xlsx · 2 worksheets · mounted for inspection and ready to download.';
    } catch (error) { if (status) status.textContent = `Could not create workbook: ${error.message}`; }
    finally { if (button) button.disabled = false; }
  }

  function workshopPanel() {
    if (new URLSearchParams(location.search).get('topic') !== TOPIC) return null;
    if (document.getElementById('pandasExcelWorkshopV52')) return null;
    const workspace = document.getElementById('xlsxTopicWorkspaceV46');
    const codeCell = document.getElementById('codeNotebookCell');
    if (!workspace && !codeCell) return null;
    const section = document.createElement('section');
    section.id = 'pandasExcelWorkshopV52';
    section.className = 'pandas-v52-workshop text-cell';
    section.innerHTML = `<div class="pandas-v52-workshop-head"><div><p class="eyebrow">PRACTICAL PRE-LAB · REQUIRED CONCEPT</p><h2>Pandas is the library. Excel is the file. The DataFrame is the working table.</h2></div><span class="pandas-v52-version">PANDAS · XLSX · ${VERSION.toUpperCase()}</span></div><p class="pandas-v52-lead">Before validating Stage 1, perform one real file cycle: obtain an .xlsx workbook, place it in the runtime, read it with Pandas, inspect the DataFrame, manipulate rows/columns and create a new workbook.</p>
      <div class="pandas-v52-action-grid"><button id="pandasV52UseClass" type="button"><strong>1 · Load class workbook</strong><span>Uses the real workbook already prepared for the 12 graded stages.</span></button><button id="pandasV52Upload" type="button"><strong>2 · Upload your .xlsx</strong><span>Choose an Excel file from the computer and mount it in the Python session.</span></button><button id="pandasV52CreateButton" type="button"><strong>3 · Create XLSX with Pandas</strong><span>Python will build a 2-sheet workbook from a DataFrame and mount the result.</span></button><a id="pandasV52GeneratedDownload" class="hidden" href="#"><strong>4 · Download generated workbook</strong><span>Open the real .xlsx file in Excel and verify the sheets.</span></a></div><p id="pandasV52CreateStatus" class="pandas-v52-status">The generated workbook button runs real Python in the browser; it is not a mock download.</p>
      <div class="pandas-v52-workshop-grid"><article><span>LIBRARY</span><pre><code>import pandas as pd</code></pre><p><code>pd</code> is the conventional alias that exposes Pandas functions.</p></article><article><span>READ</span><pre><code>df = pd.read_excel("stat11_stage4_students.xlsx")</code></pre><p>The .xlsx bytes become a DataFrame in memory.</p></article><article><span>INSPECT</span><pre><code>print(df.shape)\nprint(df.columns.tolist())\nprint(df.head())\nprint(df.dtypes)</code></pre><p>Never manipulate a workbook you have not inspected.</p></article><article><span>MANIPULATE</span><pre><code>df["score_90"] = df["score"] >= 90\nfiltered = df.loc[df["score"] >= 90]\nsorted_df = df.sort_values("score")</code></pre><p>Vectorized Pandas operations act on complete columns and rows.</p></article><article><span>EXPORT</span><pre><code>filtered.to_excel(\n    "filtered_students.xlsx",\n    index=False\n)</code></pre><p>The transformed DataFrame becomes a real Excel workbook.</p></article></div>
      <div class="pandas-v52-datasets pandas-v52-workshop-datasets"><div class="pandas-v52-subhead"><div><p class="eyebrow">OPTIONAL DATASET LABS</p><h3>Three real files for additional practice.</h3></div><p>Download one, then use Upload .xlsx above.</p></div><div class="pandas-v52-dataset-grid">${datasetCards()}</div></div>`;
    (workspace || codeCell).before(section);
    section.querySelector('#pandasV52UseClass')?.addEventListener('click', () => document.getElementById('v46ClassDatasetButton')?.click());
    section.querySelector('#pandasV52Upload')?.addEventListener('click', () => document.getElementById('v46UploadButton')?.click());
    section.querySelector('#pandasV52CreateButton')?.addEventListener('click', createWorkbookWithPandas);
    document.documentElement.dataset.pandasExcelWorkshop = VERSION;
    return section;
  }

  function installWhenReady() {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const pathname = location.pathname;
      let installed = false;
      if (/theory\.html$/i.test(pathname)) installed = Boolean(theoryPanel());
      if (/workshop\.html$/i.test(pathname)) installed = Boolean(workshopPanel());
      if (installed || attempts > 160) clearInterval(timer);
    }, 125);
  }

  patchTopic();
  document.addEventListener('DOMContentLoaded', installWhenReady);
})();