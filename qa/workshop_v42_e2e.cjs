const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'http://127.0.0.1:4173';
const SESSION_KEY = 'ijr-stat11-python-hub-active-session-v20';
const QA_REGISTRATION = '00000000-0000-4000-8000-000000000042';
const QA_ACCESS_TOKEN = 'v42-browser-smoke-token';
const GLOBAL_TIMEOUT_MS = 110000;
const phase = text => console.log(`[v42-e2e] ${text}`);

function makeSnapshot() {
  const items = Array.from({ length: 12 }, (_, index) => ({ key:`stat-${String(index + 1).padStart(2,'0')}`, correct:false, completed:false, tries:0 }));
  return {
    registration:{ id:QA_REGISTRATION, display_id:'REG-V42', mode:'individual', group_code:'11A', team_size:1, display_label:'V42 browser QA', status:'active' },
    members:[],
    topics:[{ slug:'statistics', sequence:8, title:'Statistics foundations with lists', nav:'Statistics with lists', status:'available', correct_count:0, total_count:12, percent:0, items }],
    current_topic:'statistics', completed_topics:0, total_topics:16
  };
}

function recalc(snapshot) {
  const topic = snapshot.topics[0];
  topic.correct_count = topic.items.filter(item => item.correct).length;
  topic.total_count = topic.items.length;
  topic.percent = Math.round(100 * topic.correct_count / topic.total_count);
  topic.status = topic.correct_count === topic.total_count ? 'completed' : 'available';
}

async function waitForServer() {
  for (let i = 0; i < 50; i += 1) {
    try { const response = await fetch(`${ORIGIN}/python/workshop-v42.html?topic=statistics`); if (response.ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error('Local V42 server did not start.');
}

async function run() {
  phase('spawn static server');
  const server = spawn('python3', ['-m','http.server','4173','--bind','127.0.0.1','--directory',ROOT], { stdio:'ignore' });
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ headless:true });
    const context = await browser.newContext({ viewport:{ width:1440, height:1000 } });
    await context.addInitScript(({key, session}) => localStorage.setItem(key, JSON.stringify(session)), {
      key:SESSION_KEY,
      session:{ registrationId:QA_REGISTRATION, accessToken:QA_ACCESS_TOKEN, fingerprint:'', groupCode:'11A', emails:['qa.v42@ijr.edu.co'], mode:'individual', authProtected:true, savedAt:new Date().toISOString() }
    });

    const snapshot = makeSnapshot();
    const submits = [];
    let resumeRequests = 0;
    await context.route('**/rest/v1/rpc/python_hub_resume_v1', async route => {
      resumeRequests += 1;
      const headers = route.request().headers();
      if (!headers.apikey?.startsWith('sb_publishable_')) throw new Error('Resume RPC missing publishable apikey header.');
      await route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ snapshot }) });
    });
    await context.route('**/rest/v1/rpc/python_hub_submit_v1', async route => {
      const request = route.request();
      const payload = request.postDataJSON();
      submits.push(payload);
      const item = snapshot.topics[0].items.find(row => row.key === payload.p_item_key);
      if (!item) throw new Error(`Unexpected V42 item key: ${payload.p_item_key}`);
      item.tries += 1;
      const correct = (payload.p_item_key === 'stat-01' && String(payload.p_answer).trim() === '5\n50' && /len\s*\(/.test(payload.p_code_snapshot || '') && /sum\s*\(/.test(payload.p_code_snapshot || ''))
        || (payload.p_item_key === 'stat-06' && payload.p_answer === 'maximum - minimum');
      if (correct) { item.correct = true; item.completed = true; }
      recalc(snapshot);
      await route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ correct, message:correct?'Correct. Progress saved.':'Not correct yet.', snapshot }) });
    });

    const page = await context.newPage();
    const criticalErrors = [];
    page.on('pageerror', error => criticalErrors.push(`pageerror: ${error.message}`));
    page.on('requestfailed', request => {
      const url = request.url();
      if (url.startsWith(ORIGIN) || /supabase\.co|pyodide/.test(url)) criticalErrors.push(`requestfailed: ${url} :: ${request.failure()?.errorText || 'unknown'}`);
    });

    const url = `${ORIGIN}/python/workshop-v42.html?topic=statistics&runtimeBase=/node_modules/pyodide/`;
    phase('open real guided notebook');
    await page.goto(url, { waitUntil:'domcontentloaded', timeout:15000 });
    await page.waitForFunction(() => document.documentElement.dataset.workshopReady === 'true', null, { timeout:15000 });

    phase('verify notebook shell and 12 guided stages');
    if (await page.locator('#stageList .stage-button').count() !== 12) throw new Error('Expected exactly 12 guided Statistics stages.');
    for (const selector of ['#connectButton','#runButton','#executionCount','#codeEditor','#guidePanel','#hintButton','#outputPanel','#validateButton']) {
      if (!(await page.locator(selector).count())) throw new Error(`Missing notebook control ${selector}`);
    }
    const title = (await page.locator('#topicTitle').innerText()).trim();
    if (!/Statistics/i.test(title)) throw new Error(`Wrong V42 topic title: ${title}`);
    if (!/11A/.test(await page.locator('#sessionBadge').innerText())) throw new Error('Student session badge did not render.');

    phase('exercise guided hints');
    await page.locator('#hintButton').click();
    if (!(await page.locator('#hintBox').isVisible())) throw new Error('First guided hint did not open.');
    const hint1 = await page.locator('#hintBox').innerText();
    await page.locator('#hintButton').click();
    const hint2 = await page.locator('#hintBox').innerText();
    if (hint2.length <= hint1.length) throw new Error('Progressive second hint was not added.');

    phase('run real Python in browser');
    const code = 'values = [8, 12, 10, 14, 6]\nprint(len(values))\nprint(sum(values))';
    await page.locator('#codeEditor').fill(code);
    await page.locator('#runButton').click();
    await page.waitForFunction(() => document.getElementById('runtimeLabel')?.textContent === 'Connected', null, { timeout:45000 });
    await page.waitForFunction(() => /5\s*\n50/.test(document.getElementById('outputText')?.textContent || ''), null, { timeout:10000 });
    if ((await page.locator('#executionCount').innerText()).trim() !== '[1]') throw new Error('Execution counter did not increment to [1].');
    if (await page.locator('#validateButton').isDisabled()) throw new Error('Validate should enable after successful real Python execution.');

    phase('validate stage 1 through mocked production RPC contract');
    await page.locator('#validateButton').click();
    await page.waitForFunction(() => document.querySelector('[data-stage="0"]')?.classList.contains('stage-complete'), null, { timeout:10000 });
    if (submits.length !== 1 || submits[0].p_item_key !== 'stat-01') throw new Error('Stage 1 submit payload was not sent correctly.');
    if (submits[0].p_code_snapshot !== code) throw new Error('Code snapshot was not preserved in submit payload.');

    phase('negative Python error path blocks stale validation');
    await page.locator('[data-stage="1"]').click();
    await page.locator('#codeEditor').fill('print(missing_name)');
    await page.locator('#runButton').click();
    await page.waitForFunction(() => /NameError|missing_name/.test(document.getElementById('outputText')?.textContent || ''), null, { timeout:10000 });
    if (!(await page.locator('#outputPanel').evaluate(el => el.classList.contains('error')))) throw new Error('Python error output is not visibly marked as error.');
    if (!(await page.locator('#validateButton').isDisabled())) throw new Error('Validation must remain disabled after a Python execution error.');

    phase('choice problem path and backend validation');
    await page.locator('[data-stage="5"]').click();
    if (!(await page.locator('#codeEditor').evaluate(el => el.classList.contains('hidden')))) throw new Error('Code editor should hide for a choice stage.');
    await page.getByLabel('maximum - minimum').check();
    if (await page.locator('#validateButton').isDisabled()) throw new Error('Choice selection did not enable validation.');
    await page.locator('#validateButton').click();
    await page.waitForFunction(() => document.querySelector('[data-stage="5"]')?.classList.contains('stage-complete'), null, { timeout:10000 });
    if (submits.length !== 2 || submits[1].p_item_key !== 'stat-06' || submits[1].p_answer !== 'maximum - minimum') throw new Error('Choice submit payload is incorrect.');

    phase('reload and verify Supabase progress resume');
    await page.reload({ waitUntil:'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.dataset.workshopReady === 'true', null, { timeout:15000 });
    if (await page.locator('#stageList .stage-complete').count() !== 2) throw new Error('Validated progress did not restore after reload.');
    if (resumeRequests < 2) throw new Error('Reload did not execute the resume RPC again.');

    phase('mobile responsive smoke');
    await page.setViewportSize({ width:390, height:844 });
    await page.waitForTimeout(250);
    const mobile = await page.evaluate(() => ({ width:innerWidth, scrollWidth:document.documentElement.scrollWidth, runVisible:!!document.querySelector('#runButton')?.getBoundingClientRect().width, stages:document.querySelectorAll('#stageList .stage-button').length }));
    if (!mobile.runVisible || mobile.stages !== 12) throw new Error(`Mobile controls missing: ${JSON.stringify(mobile)}`);
    if (mobile.scrollWidth > mobile.width + 4) throw new Error(`Unexpected page-level horizontal overflow on mobile: ${JSON.stringify(mobile)}`);

    if (criticalErrors.length) throw new Error(`Critical browser errors:\n${criticalErrors.join('\n')}`);
    phase('all point-to-point smoke checks passed');
    console.log(`WORKSHOP V42 E2E PASS stages=12 real_python=PASS submit_rpc=${submits.length} resume_rpc=${resumeRequests} reload=PASS mobile=PASS errors=0`);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (!server.killed) server.kill('SIGKILL');
  }
}

const timer = setTimeout(() => { console.error(`V42 E2E global timeout after ${GLOBAL_TIMEOUT_MS} ms`); process.exit(1); }, GLOBAL_TIMEOUT_MS); timer.unref();
run().then(() => { clearTimeout(timer); process.exit(0); }).catch(error => { clearTimeout(timer); console.error(error.stack || error); process.exit(1); });
