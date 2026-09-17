const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const requireContract = (ok, message) => { if (!ok) throw new Error(message); };

const theory = read('python/theory.html');
const curriculum = read('python/pandas-excel-practical-v52.js');
const live = read('python/pandas-excel-live-v53.js');
const visual = read('python/pandas-excel-theory-v54.js');
const visualCss = read('python/pandas-excel-theory-v54.css');
const responsiveFix = read('python/pandas-excel-theory-v55-fix.css');
const renderedAudit = read('python/pandas-excel-theory-v56-audit.js');
const bootstrap = read('qa/theory_v54_bootstrap.html');

requireContract(curriculum.includes("const TOPIC = 'logic'"), 'Topic 04 must preserve the backend-compatible logic slug.');
requireContract(curriculum.includes("title: 'Pandas + Excel (.xlsx): load, inspect, manipulate and export'"), 'Topic 04 curriculum title is not Pandas + Excel.');
requireContract(curriculum.includes('import pandas as pd') && curriculum.includes('pd.read_excel') && curriculum.includes('pd.ExcelFile'), 'Theory curriculum lost core Pandas/Excel concepts.');

requireContract(live.includes('TOPIC 04 · LIVE PANDAS + EXCEL'), 'Live Topic 04 header is missing.');
requireContract(live.includes('oldSection.replaceWith(section)'), 'Live Topic 04 does not replace the legacy live-logic section.');
for (const token of ['pandas-import', 'excel-sheets', 'read-excel', 'inspect-dataframe', 'select-filter', 'sort-dataframe', 'derive-column', 'describe-data', 'multi-sheet', 'clean-data', 'create-dataframe', 'export-excel']) {
  requireContract(live.includes(`key: '${token}'`), `Missing live Pandas/Excel example: ${token}`);
}
for (const token of ['pandas_excel_students.xlsx', 'pandas_excel_sales.xlsx', 'pandas_excel_dirty.xlsx', 'runtime.loadPackage', 'openpyxl', 'UPLOADED_XLSX']) {
  requireContract(live.includes(token), `Live runtime contract missing: ${token}`);
}

for (const token of [
  'Upload is step 1. Reading with Pandas is step 2.',
  'Drop your Excel workbook here',
  'DataTransfer',
  'pd.read_excel(UPLOADED_XLSX)',
  'Upload ≠ read: follow the file bytes',
  'Workbook → worksheet → DataFrame',
  'Condition → Boolean mask → filtered rows',
  'The source workbook stays safe',
  'runLayoutAudit',
  'runRuntimeAudit',
  "root.dataset.theoryV54Runtime = 'pass'"
]) {
  requireContract(visual.includes(token), `V54 theory enhancement missing: ${token}`);
}

for (const token of [
  'overflow-wrap: anywhere',
  '.pandas-v54-dropzone',
  '.pandas-v54-file-flow',
  '.pandas-v54-anatomy',
  '.pandas-v54-mask',
  '.pandas-v54-safe-flow',
  '@media (max-width: 1180px)',
  '@media (max-width: 760px)',
  '@media (max-width: 520px)',
  '@media (prefers-reduced-motion: reduce)'
]) {
  requireContract(visualCss.includes(token), `V54 responsive/animation CSS missing: ${token}`);
}

for (const token of [
  '#diagramGrid[data-pandas-v54="v54"]',
  '@media (max-width: 800px)',
  '.pandas-v52-dataset-card',
  'display: block',
  'width: auto'
]) {
  requireContract(responsiveFix.includes(token), `V55 responsive fix missing: ${token}`);
}

for (const token of [
  'textActuallyOverflows',
  'getBoundingClientRect',
  'document.createRange',
  'data-theory-v56',
  'theoryV56Audit',
  "root.dataset.theoryV54Overflow = pass ? 'pass' : 'fail'"
]) {
  requireContract(renderedAudit.includes(token), `V56 rendered overflow QA missing: ${token}`);
}

for (const asset of [
  'pandas-excel-practical-v52.css',
  'pandas-excel-theory-v54.css',
  'pandas-excel-theory-v55-fix.css',
  'pandas-excel-practical-v52.js',
  'theory-page.js',
  'theory-live-lab-v19.js',
  'pandas-excel-live-v53.js',
  'pandas-excel-theory-v54.js',
  'pandas-excel-theory-v56-audit.js'
]) {
  requireContract(theory.includes(asset), `theory.html does not load ${asset}.`);
}
requireContract(theory.indexOf('pandas-excel-practical-v52.css') < theory.indexOf('pandas-excel-theory-v54.css'), 'V54 CSS must load after V52 CSS.');
requireContract(theory.indexOf('pandas-excel-theory-v54.css') < theory.indexOf('pandas-excel-theory-v55-fix.css'), 'V55 CSS fix must load after V54 CSS.');
requireContract(theory.indexOf('pandas-excel-practical-v52.js') < theory.indexOf('theory-page.js'), 'Pandas curriculum must patch Topic 04 before theory-page renders it.');
requireContract(theory.indexOf('theory-live-lab-v19.js') < theory.indexOf('pandas-excel-live-v53.js'), 'V53 must replace the legacy V19 live section after V19 is loaded.');
requireContract(theory.indexOf('pandas-excel-live-v53.js') < theory.indexOf('pandas-excel-theory-v54.js'), 'V54 must harden the final V53 live section.');
requireContract(theory.indexOf('pandas-excel-theory-v54.js') < theory.indexOf('pandas-excel-theory-v56-audit.js'), 'V56 rendered audit must run after V54 installs the final theory layout.');

requireContract(bootstrap.includes("sessionStorage.setItem('ijr-stat11-master-teacher-session-v1'"), 'Browser QA bootstrap does not create a teacher-preview session.');
requireContract(bootstrap.includes("target.searchParams.set('masterPreview', '1')"), 'Browser QA bootstrap does not use isolated master preview.');

for (const file of ['pandas_excel_students.xlsx', 'pandas_excel_sales.xlsx', 'pandas_excel_dirty.xlsx']) {
  const bytes = fs.readFileSync(path.join(ROOT, 'python/data', file));
  requireContract(bytes.subarray(0, 2).toString('ascii') === 'PK', `${file} is not a real XLSX ZIP container.`);
  requireContract(bytes.length > 5000, `${file} is unexpectedly small.`);
}

console.log('STATISTICS 11 THEORY V54/V56 STATIC QA PASS');
console.log('topic04=pandas+xlsx live=12-real-examples upload=drag-drop diagrams=4-semantic layout=rendered-content-audited runtime=qa-auto datasets=real-xlsx');
