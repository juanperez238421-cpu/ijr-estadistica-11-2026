const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'python/workshop-v42.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'python/workshop-v42.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'python/workshop-v42.css'), 'utf8');

function requireContract(ok, message) { if (!ok) throw new Error(message); }

for (const asset of ['config-v2.js','course-data-v4.js','workshop-catalog-v27.js','data-analyst-extension-v30.js','curriculum-data-first-v32.js','workshop-v42.css','workshop-v42.js']) {
  requireContract(html.includes(asset), `V42 HTML missing ${asset}`);
}
for (const id of ['stageList','problemTitle','guidePanel','hintButton','codeEditor','runButton','executionCount','outputPanel','validateButton','connectButton']) {
  requireContract(html.includes(`id="${id}"`), `V42 notebook contract missing #${id}`);
}
for (let i = 1; i <= 12; i += 1) {
  const key = `stat-${String(i).padStart(2, '0')}`;
  requireContract(js.includes(`'${key}'`), `guided Statistics stage missing: ${key}`);
}
requireContract(js.includes('runPythonAsync'), 'real Pyodide execution missing');
requireContract(js.includes('pyodide/v0.27.7/full/'), 'Pyodide 0.27.7 production runtime pin missing');
requireContract(js.includes('config.rpc.resume') && js.includes('config.rpc.submit'), 'Supabase progress RPC integration missing');
requireContract(js.includes('AbortController'), 'bounded backend request contract missing');
requireContract(js.includes('p_code_snapshot') && js.includes('p_answer'), 'server validation payload missing');
requireContract(!js.includes('expected_text') && !js.includes('service_role') && !js.includes('sb_secret_'), 'client must not embed answer keys or privileged Supabase keys');
requireContract(css.includes('@media(max-width:620px)') && css.includes('prefers-reduced-motion'), 'responsive/accessibility CSS contract missing');
requireContract(html.includes('+ Code') && html.includes('+ Text') && html.includes('Runtime'), 'Colab-style notebook toolbar missing');
console.log('WORKSHOP V42 STATIC CONTRACT PASS');
console.log('guided_statistics=12 pyodide=0.27.7 backend_validation=Supabase responsive=PASS secrets=PASS');
