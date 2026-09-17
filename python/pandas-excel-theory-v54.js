(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const TOPIC = 'logic';
  if ((params.get('topic') || 'operations') !== TOPIC) return;

  const VERSION = 'v54';
  let installed = false;
  let auditTimer = null;

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  function humanBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function uploadGuideHtml() {
    return `
      <section id="pandasUploadGuideV54" class="pandas-v54-upload-guide" aria-labelledby="pandasUploadTitleV54">
        <div class="pandas-v54-upload-copy">
          <p class="eyebrow">UNDERSTAND THE FILE FLOW</p>
          <h3 id="pandasUploadTitleV54">Upload is step 1. Reading with Pandas is step 2.</h3>
          <p>Choosing an Excel file does not automatically create a DataFrame. The browser first copies the <code>.xlsx</code> bytes into the Python session. Then <code>pd.read_excel(...)</code> reads a worksheet and creates the DataFrame you can inspect and manipulate.</p>
        </div>
        <div class="pandas-v54-upload-track" aria-label="Upload and read workflow">
          <article style="--d:0s"><span>1</span><strong>Choose workbook</strong><small>Your computer → browser</small><code>.xlsx</code></article>
          <i aria-hidden="true"><b></b></i>
          <article style="--d:.5s"><span>2</span><strong>Mount file</strong><small>Browser → Python files</small><code>UPLOADED_XLSX</code></article>
          <i aria-hidden="true"><b></b></i>
          <article style="--d:1s"><span>3</span><strong>Read worksheet</strong><small>Pandas opens one sheet</small><code>pd.read_excel(...)</code></article>
          <i aria-hidden="true"><b></b></i>
          <article style="--d:1.5s"><span>4</span><strong>Work with data</strong><small>Rows + columns in memory</small><code>DataFrame</code></article>
        </div>
        <div id="pandasV54Dropzone" class="pandas-v54-dropzone" tabindex="0" role="button" aria-label="Upload an XLSX workbook">
          <div class="pandas-v54-drop-icon" aria-hidden="true">XLSX</div>
          <div class="pandas-v54-drop-copy">
            <strong>Drop your Excel workbook here</strong>
            <span>or use the button. Only <code>.xlsx</code> files up to 8 MB are accepted in this classroom lab.</span>
            <small id="pandasV54ActiveFile" aria-live="polite">Active example: <b>pandas_excel_students.xlsx</b> · sheet <b>Students</b></small>
          </div>
          <div id="pandasV54UploadControl" class="pandas-v54-upload-control"></div>
        </div>
        <div class="pandas-v54-upload-note">
          <strong>Remember:</strong>
          <span><b>Upload</b> makes the file available to Python. <b>read_excel</b> turns a worksheet into a DataFrame. <b>to_excel</b> creates a new workbook from a DataFrame.</span>
        </div>
      </section>`;
  }

  function diagramHtml() {
    return `
      <article class="diagram-card pandas-v54-diagram-card">
        <div class="diagram-card-head"><span>01</span><div><h3>Upload ≠ read: follow the file bytes</h3><p>The workbook first enters the browser Python filesystem. Pandas reads it only after <code>pd.read_excel(...)</code> runs.</p></div></div>
        <div class="diagram-stage pandas-v54-stage">
          <div class="pandas-v54-file-flow" aria-label="Animated upload and read flow">
            <div class="pandas-v54-node pandas-v54-workbook-node"><b class="pandas-v54-xlsx">XLSX</b><strong>your_file.xlsx</strong><small>on your computer</small></div>
            <div class="pandas-v54-arrow"><i></i><span>UPLOAD</span><b></b></div>
            <div class="pandas-v54-node pandas-v54-runtime-node"><span class="pandas-v54-folder">FILES</span><strong>Python runtime</strong><code>UPLOADED_XLSX</code></div>
            <div class="pandas-v54-arrow"><i></i><span>READ</span><b></b></div>
            <div class="pandas-v54-node pandas-v54-pandas-node"><span class="pandas-v54-pd">pd</span><strong>pd.read_excel(...)</strong><small>select worksheet</small></div>
            <div class="pandas-v54-arrow"><i></i><span>CREATE</span><b></b></div>
            <div class="pandas-v54-mini-frame"><div class="pandas-v54-mini-head">DataFrame <code>df</code></div><div class="pandas-v54-mini-table"><b>student_id</b><b>score</b><span>S001</span><span>82</span><span>S002</span><span>91</span><span>S003</span><span>76</span></div></div>
          </div>
        </div>
      </article>

      <article class="diagram-card pandas-v54-diagram-card">
        <div class="diagram-card-head"><span>02</span><div><h3>Workbook → worksheet → DataFrame</h3><p>An Excel workbook can contain several sheets. Pandas reads the sheet you choose; rows become observations and columns become variables.</p></div></div>
        <div class="diagram-stage pandas-v54-stage">
          <div class="pandas-v54-anatomy">
            <div class="pandas-v54-book">
              <div class="pandas-v54-book-title"><b>XLSX</b><strong>pandas_excel_students.xlsx</strong></div>
              <div class="pandas-v54-tabs"><span class="active">Students</span><span>README</span></div>
              <div class="pandas-v54-sheet-grid"><b>ID</b><b>group</b><b>score</b><span>S001</span><span>11A</span><span>82</span><span>S002</span><span>11B</span><span>91</span><span>S003</span><span>11C</span><span>76</span></div>
            </div>
            <div class="pandas-v54-read-call"><code>df = pd.read_excel(file, sheet_name="Students")</code><i></i></div>
            <div class="pandas-v54-frame-anatomy">
              <div class="pandas-v54-callout pandas-v54-callout-col">COLUMN = VARIABLE ↓</div>
              <div class="pandas-v54-df-grid"><b>student_id</b><b>group</b><b>score</b><span>S001</span><span>11A</span><span>82</span><span>S002</span><span>11B</span><span>91</span><span>S003</span><span>11C</span><span>76</span></div>
              <div class="pandas-v54-callout pandas-v54-callout-row">ROW = OBSERVATION →</div>
            </div>
          </div>
        </div>
      </article>

      <article class="diagram-card pandas-v54-diagram-card">
        <div class="diagram-card-head"><span>03</span><div><h3>Condition → Boolean mask → filtered rows</h3><p>Pandas evaluates the condition once for every row. The True/False mask selects the observations that remain in the result.</p></div></div>
        <div class="diagram-stage pandas-v54-stage">
          <div class="pandas-v54-mask">
            <div class="pandas-v54-mask-source"><small>SCORE</small><b>82</b><b>91</b><b>76</b><b>88</b><b>69</b></div>
            <div class="pandas-v54-mask-op"><code>df["score"] &gt;= 80</code><span>evaluate every row</span></div>
            <div class="pandas-v54-mask-bools"><small>MASK</small><b>True</b><b>True</b><b>False</b><b>True</b><b>False</b></div>
            <div class="pandas-v54-mask-filter"><span>FILTER</span><i></i></div>
            <div class="pandas-v54-mask-result"><small>RESULT</small><b>82</b><b>91</b><b>88</b></div>
          </div>
        </div>
      </article>

      <article class="diagram-card pandas-v54-diagram-card">
        <div class="diagram-card-head"><span>04</span><div><h3>The source workbook stays safe</h3><p>Filtering, sorting and derived columns happen in the DataFrame in memory. Export creates a new workbook unless you deliberately overwrite the original filename.</p></div></div>
        <div class="diagram-stage pandas-v54-stage">
          <div class="pandas-v54-safe-flow">
            <div class="pandas-v54-safe-file"><b>XLSX</b><strong>source.xlsx</strong><span>unchanged on disk</span></div>
            <div class="pandas-v54-safe-arrow"><i></i><span>READ</span></div>
            <div class="pandas-v54-transform"><strong>DataFrame</strong><code>filter</code><code>sort</code><code>derive</code><small>changes happen here</small></div>
            <div class="pandas-v54-safe-arrow"><i></i><span>EXPORT</span></div>
            <div class="pandas-v54-safe-file output"><b>XLSX</b><strong>analysis_output.xlsx</strong><span>new file</span><em>All students</em><em>Score 80 plus</em></div>
          </div>
        </div>
      </article>`;
  }

  function upgradeUploadLab(section) {
    if (!section || document.getElementById('pandasUploadGuideV54')) return;
    const workflow = section.querySelector('.live-workflow-v19');
    if (!workflow) return;

    workflow.insertAdjacentHTML('beforebegin', uploadGuideHtml());
    const guide = document.getElementById('pandasUploadGuideV54');
    const control = document.getElementById('pandasV54UploadControl');
    const button = section.querySelector('#pandasV53UploadButton');
    const input = section.querySelector('#pandasV53UploadInput');
    const oldControls = button?.closest('.live-controls-v19');

    if (button && control) {
      button.textContent = '⇧ Choose .xlsx';
      button.classList.add('pandas-v54-upload-button');
      control.appendChild(button);
    }
    if (input && control) control.appendChild(input);
    if (oldControls && !oldControls.contains(button) && !oldControls.querySelector('button')) oldControls.remove();

    const dropzone = document.getElementById('pandasV54Dropzone');
    const active = document.getElementById('pandasV54ActiveFile');
    if (!dropzone || !input || !button) return;

    const choose = event => {
      if (event?.target?.closest?.('button')) return;
      button.click();
    };
    dropzone.addEventListener('click', choose);
    dropzone.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        button.click();
      }
    });

    for (const type of ['dragenter', 'dragover']) {
      dropzone.addEventListener(type, event => {
        event.preventDefault();
        dropzone.classList.add('is-dragging');
      });
    }
    for (const type of ['dragleave', 'drop']) {
      dropzone.addEventListener(type, event => {
        event.preventDefault();
        dropzone.classList.remove('is-dragging');
      });
    }
    dropzone.addEventListener('drop', event => {
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file || !active) return;
      active.innerHTML = `Selected: <b>${escapeHtml(file.name)}</b> · ${escapeHtml(humanBytes(file.size))}. After mounting, run the <b>pd.read_excel</b> example.`;
      guide?.classList.add('has-local-file');
    }, { capture: true });

    const runtimeStatus = section.querySelector('#liveRuntimeStatusV53');
    if (runtimeStatus && active) {
      const syncStatus = () => {
        const text = runtimeStatus.textContent || '';
        const match = text.match(/^Uploaded\s+(.+?)\s+·/i);
        if (match) active.innerHTML = `Mounted in Python: <b>${escapeHtml(match[1])}</b>. Now <code>pd.read_excel(UPLOADED_XLSX)</code> can create the DataFrame.`;
      };
      new MutationObserver(syncStatus).observe(runtimeStatus, { childList: true, subtree: true, characterData: true });
    }
  }

  function replaceDiagrams() {
    const grid = document.getElementById('diagramGrid');
    if (!grid || grid.dataset.pandasV54 === VERSION) return;
    grid.innerHTML = diagramHtml();
    grid.dataset.pandasV54 = VERSION;
    const heading = grid.closest('.theory-diagrams-section')?.querySelector('.section-heading');
    if (heading) {
      const title = heading.querySelector('h2');
      const copy = heading.querySelector('p:last-child');
      if (title) title.textContent = 'Animated figures for the Excel → Pandas mental model';
      if (copy) copy.textContent = 'Follow the file itself: where the workbook lives, when Pandas reads it, what a DataFrame represents, how filtering works, and when a new Excel file is created.';
    }
  }

  function hardenTextLayout() {
    document.documentElement.dataset.theoryV54 = VERSION;
    document.querySelector('.pandas-v52-theory')?.classList.add('pandas-v54-theory-hardened');
    document.querySelector('.pandas-excel-live-v53')?.classList.add('pandas-v54-live-hardened');
  }

  function runLayoutAudit() {
    const root = document.documentElement;
    const selectors = [
      '.theory-hero', '.resource-card', '.concept-card', '.learning-goals-panel',
      '.pandas-v52-theory', '.pandas-v52-code-card', '.pandas-v52-dataset-card',
      '.pandas-v54-upload-guide', '.pandas-v54-dropzone', '.live-lesson-v19',
      '.live-copy-v19', '.live-colab-v19', '.pandas-v54-diagram-card',
      '.pandas-v54-stage', '.syntax-reference-grid article', '.pitfall-grid article'
    ];
    const offenders = [];

    document.querySelectorAll(selectors.join(',')).forEach(element => {
      if (!(element instanceof HTMLElement) || element.offsetParent === null) return;
      const style = getComputedStyle(element);
      const overflowXAllowed = ['auto', 'scroll'].includes(style.overflowX);
      const horizontalOverflow = element.scrollWidth > element.clientWidth + 3;
      if (horizontalOverflow && !overflowXAllowed) {
        offenders.push(`${element.tagName.toLowerCase()}.${String(element.className).trim().replace(/\s+/g, '.').slice(0, 120)}`);
      }
    });

    let audit = document.getElementById('theoryV54Audit');
    if (!audit) {
      audit = document.createElement('output');
      audit.id = 'theoryV54Audit';
      audit.hidden = true;
      document.body.appendChild(audit);
    }
    const pass = offenders.length === 0;
    audit.dataset.layoutAudit = pass ? 'pass' : 'fail';
    audit.dataset.offenderCount = String(offenders.length);
    audit.textContent = pass ? 'PASS' : offenders.join(' | ');
    root.dataset.theoryV54Overflow = pass ? 'pass' : 'fail';
    root.dataset.theoryV54OverflowCount = String(offenders.length);
    return { pass, offenders };
  }

  function scheduleLayoutAudit() {
    clearTimeout(auditTimer);
    auditTimer = setTimeout(runLayoutAudit, 250);
  }

  async function waitForLessonResult(key, timeoutMs = 90000) {
    const lesson = document.querySelector(`[data-pandas-live-key="${CSS.escape(key)}"]`);
    const run = lesson?.querySelector('[data-pandas-run]');
    const output = lesson?.querySelector('[data-pandas-output]');
    if (!lesson || !run || !output) throw new Error(`QA lesson not found: ${key}`);
    run.click();
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (output.classList.contains('is-success')) return output.querySelector('pre')?.textContent || '';
      if (output.classList.contains('is-error')) throw new Error(output.querySelector('pre')?.textContent || `QA lesson failed: ${key}`);
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    throw new Error(`QA timeout: ${key}`);
  }

  async function runRuntimeAudit() {
    if (params.get('qaAuto') !== '1') return;
    const root = document.documentElement;
    root.dataset.theoryV54Runtime = 'running';
    try {
      await waitForLessonResult('pandas-import');
      const readOutput = await waitForLessonResult('read-excel');
      if (!/DataFrame/i.test(readOutput) || !/Shape:/i.test(readOutput)) throw new Error('read_excel QA output did not confirm a DataFrame shape.');
      const exportOutput = await waitForLessonResult('export-excel');
      if (!/Created:\s*True/i.test(exportOutput) || !/analysis_output\.xlsx/i.test(document.body.innerText)) throw new Error('Export QA did not create the expected XLSX workbook.');
      const download = document.querySelector('[data-pandas-download="analysis_output.xlsx"]');
      if (!download || download.hidden) throw new Error('Export QA did not expose the XLSX download control.');
      root.dataset.theoryV54Runtime = 'pass';
    } catch (error) {
      root.dataset.theoryV54Runtime = 'fail';
      root.dataset.theoryV54RuntimeError = String(error?.message || error).slice(0, 240);
      console.error('[Theory V54 runtime QA]', error);
    }
  }

  function install() {
    if (installed) return true;
    const theoryApp = document.getElementById('theoryApp');
    const live = document.querySelector('.pandas-excel-live-v53');
    const grid = document.getElementById('diagramGrid');
    if (!theoryApp || theoryApp.classList.contains('hidden') || !live || !grid) return false;

    upgradeUploadLab(live);
    replaceDiagrams();
    hardenTextLayout();
    installed = true;
    scheduleLayoutAudit();

    const resizeObserver = new ResizeObserver(scheduleLayoutAudit);
    resizeObserver.observe(document.documentElement);
    window.addEventListener('resize', scheduleLayoutAudit, { passive: true });
    setTimeout(scheduleLayoutAudit, 800);
    setTimeout(runRuntimeAudit, 500);
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
