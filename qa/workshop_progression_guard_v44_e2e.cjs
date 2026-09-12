const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'http://127.0.0.1:4174';
const SESSION_KEY = 'ijr-stat11-python-hub-active-session-v20';
const QA_REGISTRATION = '00000000-0000-4000-8000-000000000044';
const QA_ACCESS_TOKEN = 'v44-progression-browser-token';

function makeSnapshot() {
  const items = Array.from({ length: 12 }, (_, index) => ({
    key:`stat-${String(index + 1).padStart(2,'0')}`,
    correct:false,
    completed:false,
    tries:0
  }));
  return {
    registration:{ id:QA_REGISTRATION, display_id:'REG-V44', mode:'individual', group_code:'11A', team_size:1, display_label:'V44 progression QA', status:'active' },
    members:[],
    topics:[{ slug:'statistics', sequence:8, title:'Statistics foundations with lists', nav:'Statistics with lists', status:'available', correct_count:0, total_count:12, percent:0, items }],
    current_topic:'statistics', completed_topics:0, total_topics:16
  };
}

function recalc(snapshot) {
  const topic = snapshot.topics[0];
  topic.correct_count = topic.items.filter(item => item.correct).length;
  topic.percent = Math.round(100 * topic.correct_count / topic.items.length);
}

async function waitForServer() {
  for (let i = 0; i < 50; i += 1) {
    try {
      const response = await fetch(`${ORIGIN}/python/workshop.html?topic=statistics`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error('Local V44 production workshop server did not start.');
}

async function run() {
  const server = spawn('python3', ['-m','http.server','4174','--bind','127.0.0.1','--directory',ROOT], { stdio:'ignore' });
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ headless:true });
    const context = await browser.newContext({ viewport:{ width:1440, height:1000 } });
    await context.addInitScript(({key, session}) => localStorage.setItem(key, JSON.stringify(session)), {
      key:SESSION_KEY,
      session:{ registrationId:QA_REGISTRATION, accessToken:QA_ACCESS_TOKEN, groupCode:'11A', emails:['qa.v44@ijr.edu.co'], mode:'individual', authProtected:true, savedAt:new Date().toISOString() }
    });

    const snapshot = makeSnapshot();
    const submits = [];
    await context.route('**/rest/v1/rpc/python_hub_resume_v1', route => route.fulfill({
      status:200,
      contentType:'application/json',
      body:JSON.stringify({ snapshot })
    }));
    await context.route('**/rest/v1/rpc/python_hub_submit_v1', async route => {
      const payload = route.request().postDataJSON();
      submits.push(payload);
      const item = snapshot.topics[0].items.find(row => row.key === payload.p_item_key);
      item.tries += 1;
      const exactOutput = String(payload.p_answer || '').trim() === '5\n50';
      const consolidatedCode = /len\s*\(/.test(payload.p_code_snapshot || '') && /sum\s*\(/.test(payload.p_code_snapshot || '');
      const correct = payload.p_item_key === 'stat-01' && exactOutput && consolidatedCode;
      if (correct) {
        item.correct = true;
        item.completed = true;
      }
      recalc(snapshot);
      await route.fulfill({
        status:200,
        contentType:'application/json',
        body:JSON.stringify({ correct, message:correct?'Correct. Progress saved.':'Not correct yet. Expected output not confirmed.', snapshot })
      });
    });

    const page = await context.newPage();
    const url = `${ORIGIN}/python/workshop.html?topic=statistics&runtimeBase=/node_modules/pyodide/`;
    await page.goto(url, { waitUntil:'domcontentloaded', timeout:15000 });
    await page.waitForFunction(() => document.documentElement.dataset.workshopReady === 'true', null, { timeout:15000 });
    await page.waitForFunction(() => document.documentElement.dataset.progressionGuard === 'v44', null, { timeout:5000 });

    if (!(await page.locator('#nextButton').isDisabled())) throw new Error('Next must be locked before backend validation.');
    if (!(await page.locator('[data-stage="1"]').isDisabled())) throw new Error('Stage 2 must be locked while Stage 1 is incomplete.');

    await page.locator('#codeEditor').fill('print(999)');
    await page.locator('#runButton').click();
    await page.waitForFunction(() => /999/.test(document.getElementById('outputText')?.textContent || ''), null, { timeout:45000 });
    if (await page.locator('#validateButton').isDisabled()) throw new Error('A valid Python run should be eligible for backend validation.');
    await page.locator('#validateButton').click();
    await page.waitForFunction(() => document.querySelector('[data-stage="0"]') && !document.querySelector('[data-stage="0"]').classList.contains('stage-complete'), null, { timeout:10000 });
    if (submits.length !== 1 || String(submits[0].p_answer).trim() !== '999') throw new Error('Wrong-output validation request was not exercised.');
    if (!(await page.locator('#nextButton').isDisabled())) throw new Error('Wrong consolidated output incorrectly unlocked Next.');
    if (!(await page.locator('[data-stage="1"]').isDisabled())) throw new Error('Wrong consolidated output incorrectly unlocked Stage 2.');

    const correctCode = 'values = [8, 12, 10, 14, 6]\nprint(len(values))\nprint(sum(values))';
    await page.locator('#codeEditor').fill(correctCode);
    await page.locator('#runButton').click();
    await page.waitForFunction(() => /5\s*\n50/.test(document.getElementById('outputText')?.textContent || ''), null, { timeout:10000 });
    await page.locator('#validateButton').click();
    await page.waitForFunction(() => document.querySelector('[data-stage="0"]')?.classList.contains('stage-complete'), null, { timeout:10000 });
    await page.waitForFunction(() => !document.getElementById('nextButton')?.disabled, null, { timeout:5000 });
    if (submits.length !== 2) throw new Error('Expected two validation requests: wrong then correct.');
    if (await page.locator('[data-stage="1"]').isDisabled()) throw new Error('Stage 2 did not unlock after exact backend-confirmed output.');

    await page.locator('#nextButton').click();
    await page.waitForFunction(() => /STAGE\s+2\s+OF/i.test(document.getElementById('problemKicker')?.textContent || ''), null, { timeout:5000 });
    if (!(await page.locator('#nextButton').isDisabled())) throw new Error('Stage 2 Next must relock until Stage 2 itself is validated.');

    console.log('WORKSHOP PROGRESSION V44 E2E PASS wrong_output=LOCKED exact_backend_output=UNLOCKED stage2=RELOCKED');
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (!server.killed) server.kill('SIGKILL');
  }
}

run().then(() => process.exit(0)).catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
