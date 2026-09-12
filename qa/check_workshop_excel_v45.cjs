const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'python/workshop.html'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'python/workshop-excel-stage-v45.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'python/workshop-excel-stage-v45.css'), 'utf8');
const xlsx = fs.readFileSync(path.join(ROOT, 'python/data/stat11_stage4_students.xlsx'));

function requireContract(ok, message) {
  if (!ok) throw new Error(message);
}

requireContract(html.includes('workshop-excel-stage-v45.css'), 'Production workshop does not load V45 Excel CSS.');
requireContract(html.includes('workshop-excel-stage-v45.js'), 'Production workshop does not load V45 Excel JS.');
requireContract(html.indexOf('workshop-excel-stage-v45.js') < html.indexOf('workshop-v42.js'), 'V45 Excel bridge must load before the core workshop runtime.');
requireContract(html.includes('Guided Colab Workshop V45'), 'Production workshop title was not advanced to V45.');

for (const token of [
  'stat-04',
  'pd.read_excel',
  'Use class dataset',
  'v45UploadInput',
  'runtime.FS.writeFile',
  'loadPackage',
  'pandas',
  'openpyxl',
  'Visual inspect',
  'score',
  '>= 90'
]) {
  requireContract(js.includes(token), `V45 Excel contract missing: ${token}`);
}

requireContract(js.includes("CLASS_FILE = 'stat11_stage4_students.xlsx'"), 'Canonical graded workbook filename missing.');
requireContract(js.includes("accept=\".xlsx"), 'Real browser Excel file input missing.');
requireContract(js.includes("dataTransfer?.files?.[0]"), 'Drag/drop Excel upload path missing.');
requireContract(!js.includes('expected_text') && !js.includes('service_role') && !js.includes('sb_secret_'), 'V45 client must not contain backend answer keys or privileged secrets.');
requireContract(css.includes('.v45-files-pane') && css.includes('.v45-preview-table'), 'V45 Colab Files / visual inspector CSS missing.');
requireContract(css.includes('@media(max-width:620px)'), 'V45 mobile visual layout contract missing.');
requireContract(xlsx.subarray(0, 2).toString('ascii') === 'PK', 'Stage 4 workbook is not a real XLSX ZIP container.');
requireContract(xlsx.length > 5000, 'Stage 4 workbook is unexpectedly small.');

console.log('WORKSHOP EXCEL V45 STATIC CONTRACT PASS');
console.log(`real_xlsx=${xlsx.length}B upload=PASS colab_files=PASS pandas_read_excel=PASS visual_inspector=PASS mobile=PASS secrets=PASS`);
