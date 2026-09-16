const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const requireContract = (ok, message) => { if (!ok) throw new Error(message); };

const base = read('python/course-data-v4.js');
const v32 = read('python/curriculum-data-first-v32.js');
const v46 = read('python/curriculum-xlsx-first-v46.js');
const analyst = read('python/data-analyst-extension-v30.js');
const indexHtml = read('python/index.html');
const theoryHtml = read('python/theory.html');
const workshopHtml = read('python/workshop.html');
const workshopXlsx = read('python/workshop-xlsx-topic-v46.js');
const migration = read('supabase/migrations/20260916170000_statistics11_xlsx_after_arrays_v46.sql');
const workbook = fs.readFileSync(path.join(ROOT, 'python/data/stat11_stage4_students.xlsx'));

// Preserve the existing topic structure: reuse sequence slot 4 instead of inserting/removing topics.
requireContract(base.indexOf("slug: 'arrays'") < base.indexOf("slug: 'logic'"), 'Arrays must remain immediately before the reused topic-4 slot.');
requireContract(v46.includes("replaceTopic('logic'"), 'V46 must reuse the existing logic slug instead of creating a structural topic break.');
requireContract(v46.includes("title: 'Excel (.xlsx) files with Pandas'"), 'Topic 4 is not the XLSX/Pandas topic.');
requireContract(v46.includes("nav: 'XLSX → DataFrame'"), 'XLSX topic navigation label missing.');
requireContract(v46.includes('pd.read_excel'), 'Theory/workshop curriculum is missing pd.read_excel.');
requireContract(v46.includes('df.shape') && v46.includes('df.columns') && v46.includes('df.head()'), 'XLSX inspection theory is incomplete.');
requireContract(v46.includes('sort_values') && v46.includes('score_90') && v46.includes('df[df["score"] >= 90]'), 'Basic XLSX manipulation coverage is incomplete.');

// The Grade 11 malla still requires control structures; integrate them into data work rather than blocking the path as a standalone unit.
for (const token of ['if/else', 'if/elif/else', ' and ', ' or ', ' not ']) {
  requireContract(v46.includes(token), `Integrated control-structure coverage missing: ${token}`);
}

// The next visible data topic must still cover the official CSV requirement.
requireContract(v46.includes("replaceTopic('conditions'"), 'CSV topic override missing.');
requireContract(v46.includes("title: 'CSV files and Pandas DataFrames'"), 'CSV/Pandas topic title missing.');
requireContract(v32.includes('pd.read_csv'), 'Curriculum-required CSV reading is no longer present.');
requireContract(v32.includes('value_counts') && v32.includes('nunique'), 'Basic Pandas dataset operations are missing.');

// Later curricular requirements must remain represented in the current pathway.
for (const token of ['pandas-dataframes', 'data-cleaning', 'filter-transform', 'group-aggregate', 'visualization', 'analyst-project']) {
  requireContract(analyst.includes(token), `Data Analyst pathway lost required module: ${token}`);
}
requireContract(/Matplotlib/i.test(analyst), 'Matplotlib coverage is missing from the later pathway.');

// Theory and hub must load V46 after the V32 data-first layer.
for (const [name, html] of [['index', indexHtml], ['theory', theoryHtml], ['workshop', workshopHtml]]) {
  requireContract(html.includes('curriculum-xlsx-first-v46.js'), `${name}.html does not load the V46 curriculum layer.`);
  requireContract(html.indexOf('curriculum-data-first-v32.js') < html.indexOf('curriculum-xlsx-first-v46.js'), `${name}.html loads V46 before V32.`);
}

// Workshop must expose a real XLSX file path before core runtime execution.
requireContract(workshopHtml.includes('workshop-xlsx-topic-v46.js'), 'Production workshop does not load the V46 XLSX workspace.');
requireContract(workshopHtml.indexOf('workshop-xlsx-topic-v46.js') < workshopHtml.indexOf('workshop-v42.js'), 'V46 XLSX bridge must load before the core workshop runtime.');
for (const token of ['stat11_stage4_students.xlsx', 'pd.read_excel', 'runtime.FS.writeFile', 'openpyxl', 'Use class dataset', 'v46UploadInput', 'score']) {
  requireContract(workshopXlsx.includes(token), `V46 XLSX workshop contract missing: ${token}`);
}
requireContract(workbook.subarray(0, 2).toString('ascii') === 'PK', 'Class dataset is not a real XLSX ZIP container.');
requireContract(workbook.length > 5000, 'Class XLSX workbook is unexpectedly small.');

// Exactly 12 problems remain in the reused topic, preserving the current workshop contract.
const logicKeys = [...v46.matchAll(/key:\s*'logic-(\d{2})'/g)].map(match => match[1]);
requireContract(logicKeys.length === 12, `Expected 12 XLSX workshop stages, found ${logicKeys.length}.`);
requireContract(logicKeys.join(',') === '01,02,03,04,05,06,07,08,09,10,11,12', 'XLSX workshop stages are not sequential 01..12.');

// Backend must require real workbook reading for code stages and retain the existing contract beneath the wrapper.
for (const token of [
  "'Excel (.xlsx) files with Pandas'",
  "'CSV files and Pandas DataFrames'",
  'read_excel(',
  'stat11_stage4_students.xlsx',
  'python_hub_code_contract_v28_pre_xlsx_v46',
  "('logic','logic-08',8,'Filter observations with score at least 90','code','2')"
]) {
  requireContract(migration.includes(token), `Supabase V46 migration missing: ${token}`);
}

console.log('STATISTICS 11 XLSX-FIRST CURRICULUM V46 STATIC CONTRACT PASS');
console.log('sequence=Arrays→XLSX→CSV/Pandas control_structures=integrated xlsx=real 12_stages=PASS later_pandas_matplotlib_analysis=PASS backend_read_excel=PASS');
