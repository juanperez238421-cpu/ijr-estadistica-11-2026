(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const TOPIC = 'logic';
  if ((params.get('topic') || 'operations') !== TOPIC) return;

  const VERSION = 'v53';
  const PYODIDE_INDEX = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
  const DATASETS = [
    { file: 'pandas_excel_students.xlsx', sheet: 'Students', label: 'Student performance' },
    { file: 'pandas_excel_sales.xlsx', sheet: 'Sales', label: 'Multi-sheet sales' },
    { file: 'pandas_excel_dirty.xlsx', sheet: 'Survey', label: 'Data cleaning' }
  ];
  const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
  let runtimePromise = null;
  let packagesPromise = null;
  let datasetsPromise = null;
  let executionCount = 0;
  let installed = false;

  const items = [
    {
      key: 'pandas-import',
      name: 'import pandas as pd',
      label: 'LIBRARY + IMPORT + ALIAS',
      purpose: 'Load the Pandas library and give it the conventional short name pd.',
      when: 'You want Python tools designed for tables, Excel files and data analysis.',
      code: 'import pandas as pd\n\nprint("Pandas version:", pd.__version__)\nprint("pd refers to:", pd.__name__)',
      notice: 'import loads reusable library code. as pd creates a short alias; it does not load an Excel file.'
    },
    {
      key: 'excel-sheets',
      name: 'pd.ExcelFile(...).sheet_names',
      label: 'INSPECT THE WORKBOOK',
      purpose: 'Discover the worksheet names inside a real Excel workbook before choosing one.',
      when: 'You receive an unfamiliar .xlsx file and should not assume which worksheet contains the data.',
      code: 'import pandas as pd\n\nxls = pd.ExcelFile("pandas_excel_students.xlsx")\nprint("Worksheets:", xls.sheet_names)',
      notice: 'A workbook is the .xlsx file; worksheets are the tabs stored inside that file.'
    },
    {
      key: 'read-excel',
      name: 'pd.read_excel(...)',
      label: 'READ A REAL .XLSX',
      purpose: 'Read the active workbook from the browser Python filesystem into a Pandas DataFrame.',
      when: 'The workbook has already been uploaded or mounted and you are ready to work with its table in Python.',
      code: 'import pandas as pd\n\nprint("Active workbook:", UPLOADED_XLSX)\ndf = pd.read_excel(UPLOADED_XLSX)\nprint("Object type:", type(df).__name__)\nprint("Shape:", df.shape)\nprint(df.head())',
      notice: 'Upload/mount places bytes in the runtime. read_excel then converts a worksheet into a DataFrame in memory.'
    },
    {
      key: 'inspect-dataframe',
      name: 'head · shape · columns · dtypes',
      label: 'INSPECT BEFORE ANALYSIS',
      purpose: 'Verify records, dimensions, variable names and data types before calculating anything.',
      when: 'You have just loaded a dataset and need to confirm its structure.',
      code: 'import pandas as pd\n\ndf = pd.read_excel("pandas_excel_students.xlsx", sheet_name="Students")\nprint("First rows:")\nprint(df.head())\nprint("\\nShape:", df.shape)\nprint("\\nColumns:", df.columns.tolist())\nprint("\\nData types:")\nprint(df.dtypes)',
      notice: 'Inspection is a data-quality step, not decoration. It prevents analysis with the wrong sheet, column or type.'
    },
    {
      key: 'select-filter',
      name: 'df[...] and df.loc[...]',
      label: 'SELECT + FILTER',
      purpose: 'Select variables and keep only observations that satisfy a condition.',
      when: 'You need a smaller analytical table from a larger dataset.',
      code: 'import pandas as pd\n\ndf = pd.read_excel("pandas_excel_students.xlsx", sheet_name="Students")\nselected = df[["student_id", "score"]]\nhigh_scores = df.loc[df["score"] >= 80, ["student_id", "group", "score"]]\n\nprint("Selected columns:")\nprint(selected.head())\nprint("\\nScore >= 80:")\nprint(high_scores)',
      notice: 'The Boolean expression is evaluated once per row; .loc uses that mask to return matching observations and chosen variables.'
    },
    {
      key: 'sort-dataframe',
      name: 'sort_values(...)',
      label: 'SORT OBSERVATIONS',
      purpose: 'Reorder rows by a variable while preserving the relationship between all columns.',
      when: 'You want to inspect highest/lowest values without manually rearranging spreadsheet cells.',
      code: 'import pandas as pd\n\ndf = pd.read_excel("pandas_excel_students.xlsx", sheet_name="Students")\nordered = df.sort_values("score", ascending=False)\nprint(ordered[["student_id", "score"]].head(8))',
      notice: 'sort_values changes row order in the result; it does not break each row into unrelated values.'
    },
    {
      key: 'derive-column',
      name: 'df["new_column"] = ...',
      label: 'CREATE DERIVED VARIABLES',
      purpose: 'Create new variables from existing dataset columns using vectorized Pandas expressions.',
      when: 'A new analytical variable should be computed reproducibly for every observation.',
      code: 'import pandas as pd\n\ndf = pd.read_excel("pandas_excel_students.xlsx", sheet_name="Students")\ndf["high_attendance"] = df["attendance"] >= 0.90\ndf["score_gap_from_mean"] = (df["score"] - df["score"].mean()).round(2)\n\nprint(df[["student_id", "attendance", "high_attendance", "score", "score_gap_from_mean"]].head(10))',
      notice: 'Pandas applies the expression to the complete column. You do not need to type one formula per row.'
    },
    {
      key: 'describe-data',
      name: 'describe()',
      label: 'DESCRIPTIVE STATISTICS',
      purpose: 'Generate count, mean, standard deviation, quartiles and extremes for numerical variables.',
      when: 'You want a first statistical summary after verifying the dataset structure.',
      code: 'import pandas as pd\n\ndf = pd.read_excel("pandas_excel_students.xlsx", sheet_name="Students")\nsummary = df[["study_hours", "attendance", "score"]].describe().round(2)\nprint(summary)',
      notice: 'describe() summarizes numerical columns from the DataFrame; it is not a replacement for checking missing values and context.'
    },
    {
      key: 'multi-sheet',
      name: 'read_excel + merge + groupby',
      label: 'MULTI-SHEET WORKBOOK',
      purpose: 'Read two worksheets from the same Excel file, connect them by a shared key and summarize the combined data.',
      when: 'A workbook stores related tables on different tabs.',
      code: 'import pandas as pd\n\nfile = "pandas_excel_sales.xlsx"\nprint("Worksheets:", pd.ExcelFile(file).sheet_names)\n\nsales = pd.read_excel(file, sheet_name="Sales")\nproducts = pd.read_excel(file, sheet_name="Products")\nreport = sales.merge(products, on="product_id")\n\nprint("\\nMerged preview:")\nprint(report[["sale_id", "product_name", "category", "quantity", "revenue"]].head())\nprint("\\nRevenue by category:")\nprint(report.groupby("category")["revenue"].sum().round(2))',
      notice: 'Pandas can combine related worksheets with merge() and then aggregate the resulting table with groupby().' 
    },
    {
      key: 'clean-data',
      name: 'isna · duplicated · fillna',
      label: 'CHECK DATA QUALITY',
      purpose: 'Detect missing values and duplicates, then make an explicit cleaning transformation.',
      when: 'Real-world datasets contain incomplete or repeated observations.',
      code: 'import pandas as pd\n\ndirty = pd.read_excel("pandas_excel_dirty.xlsx", sheet_name="Survey")\nprint("Missing values by column:")\nprint(dirty.isna().sum())\nprint("\\nDuplicated rows:", dirty.duplicated().sum())\n\nclean = dirty.drop_duplicates().copy()\nclean["hours_sleep"] = clean["hours_sleep"].fillna(clean["hours_sleep"].median())\nprint("\\nAfter explicit cleaning:")\nprint(clean.head())',
      notice: 'Cleaning is a documented decision. Inspect the problem first; then choose fill, drop or another justified treatment.'
    },
    {
      key: 'create-dataframe',
      name: 'pd.DataFrame(...)',
      label: 'CREATE A TABLE IN PYTHON',
      purpose: 'Build a labeled table from Python data so it can be analyzed or exported with the same Pandas workflow.',
      when: 'Your data originates in Python instead of an existing spreadsheet.',
      code: 'import pandas as pd\n\npractice = pd.DataFrame({\n    "student": ["A", "B", "C"],\n    "score": [82, 91, 76],\n    "attendance": [0.88, 0.95, 0.81]\n})\nprint(practice)\nprint("\\nShape:", practice.shape)',
      notice: 'A DataFrame exists in Python memory. It becomes an Excel file only after you explicitly export it.'
    },
    {
      key: 'export-excel',
      name: 'to_excel + ExcelWriter',
      label: 'EXPORT A REAL WORKBOOK',
      purpose: 'Write transformed DataFrames to a genuine .xlsx workbook with more than one worksheet.',
      when: 'The analysis should end with a reproducible file that can be opened in Excel.',
      code: 'import os\nimport pandas as pd\n\ndf = pd.read_excel("pandas_excel_students.xlsx", sheet_name="Students")\nhigh = df.loc[df["score"] >= 80, ["student_id", "group", "score"]]\n\nwith pd.ExcelWriter("analysis_output.xlsx", engine="openpyxl") as writer:\n    df.to_excel(writer, sheet_name="All students", index=False)\n    high.to_excel(writer, sheet_name="Score 80 plus", index=False)\n\nprint("Created:", os.path.exists("analysis_output.xlsx"))\nprint("Bytes:", os.path.getsize("analysis_output.xlsx"))\nprint("Sheets:", pd.ExcelFile("analysis_output.xlsx").sheet_names)',
      notice: 'The output is a real XLSX file. index=False avoids writing the DataFrame index as an unwanted spreadsheet column.',
      download: 'analysis_output.xlsx'
    }
  ];

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));

  function safeFileName(name) {
    const cleaned = String(name || 'uploaded.xlsx').replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');
    return cleaned || 'uploaded.xlsx';
  }

  function lessonHtml(item, index) {
    return `
      <article class="live-lesson-v19" data-pandas-live-key="${escapeHtml(item.key)}">
        <div class="live-copy-v19">
          <span class="live-index-v19">${String(index + 1).padStart(2, '0')}</span>
          <p class="eyebrow">${escapeHtml(item.label)}</p>
          <h3><code>${escapeHtml(item.name)}</code></h3>
          <p>${escapeHtml(item.purpose)}</p>
          <div class="live-when-v19"><strong>Use it when</strong><span>${escapeHtml(item.when)}</span></div>
          <div class="live-notice-v19"><strong>What to notice</strong><span>${escapeHtml(item.notice)}</span></div>
        </div>
        <div class="live-colab-v19">
          <div class="live-colab-top-v19">
            <div><span class="live-runtime-dot-v19"></span><strong>Python 3 · Pandas · real XLSX runtime</strong></div>
            <div class="live-controls-v19">
              <button type="button" class="live-reset-v19" data-pandas-reset="${escapeHtml(item.key)}">Reset</button>
              ${item.download ? `<button type="button" class="live-reset-v19" data-pandas-download="${escapeHtml(item.download)}" hidden>↓ Download XLSX</button>` : ''}
              <button type="button" class="live-run-v19" data-pandas-run="${escapeHtml(item.key)}">▶ Run</button>
            </div>
          </div>
          <div class="live-cell-v19">
            <div class="live-gutter-v19"><button type="button" data-pandas-run="${escapeHtml(item.key)}" aria-label="Run ${escapeHtml(item.name)} example">▶</button><small>[ ]</small></div>
            <div class="live-editor-wrap-v19"><div class="live-cell-label-v19">Code cell · editable</div><textarea class="live-editor-v19" spellcheck="false" data-pandas-editor="${escapeHtml(item.key)}">${escapeHtml(item.code)}</textarea></div>
          </div>
          <div class="live-output-v19" data-pandas-output="${escapeHtml(item.key)}"><small>OUTPUT</small><pre>Press ▶ Run</pre></div>
        </div>
      </article>`;
  }

  function setStatus(message) {
    const status = document.getElementById('liveRuntimeStatusV53');
    if (status) status.textContent = message;
  }

  async function resolveLoader() {
    if (typeof window.IJR_loadPyodide === 'function') return window.IJR_loadPyodide();
    if (typeof window.loadPyodide === 'function') return window.loadPyodide;
    throw new Error('Python runtime loader is unavailable. Refresh the page and try again.');
  }

  async function ensureRuntime() {
    if (runtimePromise) return runtimePromise;
    setStatus('Loading Python runtime…');
    runtimePromise = (async () => {
      const loader = await resolveLoader();
      const runtime = await loader({ indexURL: PYODIDE_INDEX });
      window.IJR_PANDAS_EXCEL_RUNTIME_V53 = runtime;
      return runtime;
    })().catch(error => {
      runtimePromise = null;
      setStatus('Python runtime unavailable · refresh and try again');
      throw error;
    });
    return runtimePromise;
  }

  async function ensurePackages(runtime) {
    if (packagesPromise) return packagesPromise;
    setStatus('Loading Pandas + Excel support…');
    packagesPromise = (async () => {
      try {
        await runtime.loadPackage(['pandas', 'openpyxl']);
      } catch {
        await runtime.loadPackage('pandas');
        await runtime.loadPackage('micropip');
        await runtime.runPythonAsync("import micropip\nawait micropip.install('openpyxl==3.1.5')");
      }
    })().catch(error => {
      packagesPromise = null;
      setStatus('Pandas/Excel packages could not load');
      throw error;
    });
    return packagesPromise;
  }

  async function writeDataset(runtime, dataset) {
    const response = await fetch(`data/${encodeURIComponent(dataset.file)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Could not load ${dataset.file} (${response.status}).`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    runtime.FS.writeFile(`/home/pyodide/${dataset.file}`, bytes);
    return bytes.byteLength;
  }

  async function ensureDatasets(runtime) {
    if (datasetsPromise) return datasetsPromise;
    setStatus('Mounting real .xlsx datasets…');
    datasetsPromise = (async () => {
      const mounted = [];
      for (const dataset of DATASETS) {
        const bytes = await writeDataset(runtime, dataset);
        mounted.push({ ...dataset, bytes });
      }
      await runtime.runPythonAsync(`UPLOADED_XLSX = ${JSON.stringify(DATASETS[0].file)}`);
      window.IJR_PANDAS_EXCEL_FILES_V53 = mounted;
      setStatus('Python + Pandas + openpyxl ready · 3 real XLSX datasets mounted');
      return mounted;
    })().catch(error => {
      datasetsPromise = null;
      setStatus('Could not mount the class Excel datasets');
      throw error;
    });
    return datasetsPromise;
  }

  async function ensureLabRuntime() {
    const runtime = await ensureRuntime();
    await ensurePackages(runtime);
    await ensureDatasets(runtime);
    return runtime;
  }

  function findItem(key) {
    return items.find(item => item.key === key);
  }

  async function runItem(key) {
    const item = findItem(key);
    const lesson = document.querySelector(`[data-pandas-live-key="${CSS.escape(key)}"]`);
    if (!item || !lesson) return;
    const editor = lesson.querySelector('[data-pandas-editor]');
    const output = lesson.querySelector('[data-pandas-output]');
    const pre = output?.querySelector('pre');
    const buttons = lesson.querySelectorAll('[data-pandas-run]');
    if (!editor || !output || !pre) return;

    buttons.forEach(button => { button.disabled = true; });
    output.classList.remove('is-error', 'is-success');
    pre.textContent = 'Preparing Python + Pandas + Excel files…';

    try {
      const runtime = await ensureLabRuntime();
      const stdout = [];
      const stderr = [];
      runtime.setStdout({ batched: text => stdout.push(String(text)) });
      runtime.setStderr({ batched: text => stderr.push(String(text)) });
      const result = await runtime.runPythonAsync(editor.value);
      let text = stderr.length ? stderr.join('\n') : stdout.join('\n');
      if (!text && result !== undefined && result !== null) text = String(result);
      pre.textContent = text || '(no visible output)';
      output.classList.toggle('is-error', stderr.length > 0);
      output.classList.toggle('is-success', stderr.length === 0);
      executionCount += 1;
      const counter = lesson.querySelector('.live-gutter-v19 small');
      if (counter) counter.textContent = `[${executionCount}]`;
      if (item.download && stderr.length === 0) {
        const exists = runtime.FS.analyzePath(`/home/pyodide/${item.download}`).exists;
        const downloadButton = lesson.querySelector('[data-pandas-download]');
        if (downloadButton) downloadButton.hidden = !exists;
      }
    } catch (error) {
      pre.textContent = String(error?.message || error);
      output.classList.add('is-error');
    } finally {
      buttons.forEach(button => { button.disabled = false; });
    }
  }

  function resetItem(key) {
    const item = findItem(key);
    const lesson = document.querySelector(`[data-pandas-live-key="${CSS.escape(key)}"]`);
    if (!item || !lesson) return;
    const editor = lesson.querySelector('[data-pandas-editor]');
    const pre = lesson.querySelector('[data-pandas-output] pre');
    const counter = lesson.querySelector('.live-gutter-v19 small');
    const download = lesson.querySelector('[data-pandas-download]');
    if (editor) editor.value = item.code;
    if (pre) pre.textContent = 'Press ▶ Run';
    if (counter) counter.textContent = '[ ]';
    if (download) download.hidden = true;
  }

  async function downloadRuntimeFile(fileName) {
    const runtime = await ensureLabRuntime();
    const path = `/home/pyodide/${safeFileName(fileName)}`;
    if (!runtime.FS.analyzePath(path).exists) throw new Error(`${fileName} has not been created yet. Run the export example first.`);
    const bytes = runtime.FS.readFile(path);
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = safeFileName(fileName);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function uploadWorkbook(file) {
    if (!file) return;
    if (!/\.xlsx$/i.test(file.name)) throw new Error('Choose an .xlsx Excel workbook.');
    if (file.size > MAX_UPLOAD_BYTES) throw new Error('The workbook is larger than the 8 MB classroom limit.');
    const runtime = await ensureLabRuntime();
    const fileName = safeFileName(file.name);
    runtime.FS.writeFile(`/home/pyodide/${fileName}`, new Uint8Array(await file.arrayBuffer()));
    await runtime.runPythonAsync(`UPLOADED_XLSX = ${JSON.stringify(fileName)}`);
    setStatus(`Uploaded ${fileName} · the pd.read_excel example now uses this workbook`);
  }

  function buildReplacement(oldSection) {
    const section = document.createElement('section');
    section.id = 'topicLiveLabV19';
    section.className = 'topic-live-lab-v19 pandas-excel-live-v53';
    section.dataset.liveCurriculum = VERSION;
    section.innerHTML = `
      <div class="section-heading live-heading-v19">
        <p class="eyebrow">TOPIC 04 · LIVE PANDAS + EXCEL</p>
        <h2>Run a real .xlsx workflow with Pandas</h2>
        <p>Use executable Python to move from the library concept to real workbook inspection, DataFrame manipulation, cleaning and export. The first run loads Pandas, openpyxl and three genuine Excel datasets into the browser runtime.</p>
        <div class="live-runtime-status-v19"><span></span><strong id="liveRuntimeStatusV53">Python + Pandas load when you run the first example</strong></div>
        <div class="live-controls-v19" style="margin-top:12px;justify-content:flex-start;flex-wrap:wrap">
          <button id="pandasV53UploadButton" type="button" class="live-reset-v19">⇧ Upload your .xlsx</button>
          <input id="pandasV53UploadInput" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>
          <span style="font-size:.85rem;opacity:.75">Default active workbook: <code>pandas_excel_students.xlsx</code></span>
        </div>
      </div>
      <div class="live-workflow-v19" aria-label="Pandas Excel learning workflow">
        <div><b>1</b><span>Import library</span></div><i>→</i>
        <div><b>2</b><span>Inspect workbook</span></div><i>→</i>
        <div><b>3</b><span>Read DataFrame</span></div><i>→</i>
        <div><b>4</b><span>Manipulate data</span></div><i>→</i>
        <div><b>5</b><span>Export XLSX</span></div>
      </div>
      <div class="live-lessons-v19">${items.map(lessonHtml).join('')}</div>
      <div class="live-reading-rule-v19">
        <strong>Dataset rule:</strong>
        <span>The examples read real .xlsx bytes. Do not type spreadsheet rows into Python by hand: mount/upload the file, inspect it with Pandas, transform the DataFrame, then export the result.</span>
      </div>`;

    oldSection.replaceWith(section);

    section.addEventListener('click', event => {
      const run = event.target.closest('[data-pandas-run]');
      if (run) {
        runItem(run.dataset.pandasRun);
        return;
      }
      const reset = event.target.closest('[data-pandas-reset]');
      if (reset) {
        resetItem(reset.dataset.pandasReset);
        return;
      }
      const download = event.target.closest('[data-pandas-download]');
      if (download) {
        downloadRuntimeFile(download.dataset.pandasDownload).catch(error => setStatus(error.message));
      }
    });

    const uploadButton = section.querySelector('#pandasV53UploadButton');
    const uploadInput = section.querySelector('#pandasV53UploadInput');
    uploadButton?.addEventListener('click', () => uploadInput?.click());
    uploadInput?.addEventListener('change', async () => {
      uploadButton.disabled = true;
      try {
        await uploadWorkbook(uploadInput.files?.[0]);
      } catch (error) {
        setStatus(error.message);
      } finally {
        uploadButton.disabled = false;
        uploadInput.value = '';
      }
    });

    document.documentElement.dataset.pandasExcelLive = VERSION;
    installed = true;
  }

  function install() {
    if (installed) return true;
    const oldSection = document.getElementById('topicLiveLabV19');
    const theoryApp = document.getElementById('theoryApp');
    if (!oldSection || !theoryApp || theoryApp.classList.contains('hidden')) return false;
    buildReplacement(oldSection);
    return true;
  }

  let scheduled = false;
  const schedule = () => {
    if (scheduled || installed) return;
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
  schedule();
})();
