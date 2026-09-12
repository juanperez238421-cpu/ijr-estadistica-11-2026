const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'http://127.0.0.1:4175';
const SESSION_KEY = 'ijr-stat11-python-hub-active-session-v20';
const QA_REGISTRATION = '00000000-0000-4000-8000-000000000045';
const QA_ACCESS_TOKEN = 'v45-excel-browser-token';
const ARTIFACT_DIR = path.join(ROOT, 'qa-artifacts');
const DATASET_PATH = path.join(ROOT, 'python/data/stat11_stage4_students.xlsx');
const RUNTIME_BASE = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
const GLOBAL_TIMEOUT_MS = 210000;

function makeSnapshot() {
  const items = Array.from({ length: 12 }, (_, index) => ({
    key:`stat-${String(index + 1).padStart(2, '0')}`,
    correct:index < 3,
    completed:index < 3,
    tries:index < 3 ? 1 : 0
  }));
  return {
    registration:{
      id:QA_REGISTRATION,
      display_id:'REG-V45',
      mode:'individual',
      group_code:'11A',
      team_size:1,
      display_label:'V45 Excel QA',
      status:'active'
    },
    members:[],
    topics:[{
      slug:'statistics',
      sequence:8,
      title:'Statistics foundations with lists',
      nav:'Statistics with lists',
      status:'available',
      correct_count:3,
      total_count:12,
      percent:25,
      items
    }],
    current_topic:'statistics',
    completed_topics:0,
    total_topics:16
  };
}

function recalc(snapshot) {
  const topic = snapshot.topics[0];
  topic.correct_count = topic.items.filter(item => item.correct).length;
  topic.total_count = topic.items.length;
  topic.percent = Math.round(100 * topic.correct_count / topic.total_count);
}

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const response = await fetch(`${ORIGIN}/python/workshop.html?topic=statistics`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error('Local V45 server did not start.');
}

async function run() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive:true });
  if (!fs.existsSync(DATASET_PATH)) throw new Error('Real Stage 4 .xlsx dataset is missing.');

  const header = fs.readFileSync(DATASET_PATH).subarray(0, 2).toString('ascii');
  if (header !== 'PK') throw new Error('Stage 4 dataset is not a real XLSX/ZIP workbook.');

  const server = spawn('python3', ['-m', 'http.server', '4175', '--bind', '127.0.0.1', '--directory', ROOT], { stdio:'ignore' });
  let browser;

  try {
    await waitForServer();
    browser = await chromium.launch({ headless:true });
    const context = await browser.newContext({ viewport:{ width:1440, height:1050 } });
    await context.addInitScript(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), {
      key:SESSION_KEY,
      session:{
        registrationId:QA_REGISTRATION,
        accessToken:QA_ACCESS_TOKEN,
        groupCode:'11A',
        emails:['qa.v45@ijr.edu.co'],
        mode:'individual',
        authProtected:true,
        savedAt:new Date().toISOString()
      }
    });

    const snapshot = makeSnapshot();
    const submits = [];
    let resumeRequests = 0;

    await context.route('**/rest/v1/rpc/python_hub_resume_v1', async route => {
      resumeRequests += 1;
      await route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ snapshot }) });
    });

    await context.route('**/rest/v1/rpc/python_hub_submit_v1', async route => {
      const payload = route.request().postDataJSON();
      submits.push(payload);
      const item = snapshot.topics[0].items.find(row => row.key === payload.p_item_key);
      if (!item) throw new Error(`Unexpected item key: ${payload.p_item_key}`);

      item.tries += 1;
      const code = String(payload.p_code_snapshot || '');
      const correct =
        payload.p_item_key === 'stat-04' &&
        String(payload.p_answer || '').trim() === '2' &&
        /read_excel\s*\(/.test(code) &&
        /\[\s*["']score["']\s*\]/.test(code) &&
        />=\s*90/.test(code) &&
        /len\s*\(/.test(code);

      if (correct) {
        item.correct = true;
        item.completed = true;
      }
      recalc(snapshot);

      await route.fulfill({
        status:200,
        contentType:'application/json',
        body:JSON.stringify({
          correct,
          message:correct ? 'Correct. Progress saved.' : 'Not correct yet.',
          snapshot
        })
      });
    });

    const page = await context.newPage();
    const criticalErrors = [];
    page.on('pageerror', error => criticalErrors.push(`pageerror: ${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error' && !/favicon/i.test(message.text())) criticalErrors.push(`console: ${message.text()}`);
    });

    const url = `${ORIGIN}/python/workshop.html?topic=statistics&runtimeBase=${encodeURIComponent(RUNTIME_BASE)}`;
    await page.goto(url, { waitUntil:'domcontentloaded', timeout:20000 });
    await page.waitForFunction(() => document.documentElement.dataset.workshopReady === 'true', null, { timeout:20000 });
    await page.waitForFunction(() => /^STAGE\s+4\s+OF/i.test(document.getElementById('problemKicker')?.textContent || ''), null, { timeout:10000 });
    await page.waitForFunction(() => document.documentElement.dataset.excelStage === 'v45', null, { timeout:10000 });

    if (!(await page.locator('#excelStageWorkspaceV45').isVisible())) throw new Error('Stage 4 Excel workspace is not visible.');
    if (!/Excel dataset/i.test(await page.locator('#problemTitle').innerText())) throw new Error('Stage 4 title was not replaced with the Excel lesson.');
    if (!/pd\.read_excel/i.test(await page.locator('#problemPrompt').innerText())) throw new Error('Stage 4 prompt does not teach pd.read_excel.');
    if (await page.locator('[data-stage="4"]').isDisabled() === false) throw new Error('Stage 5 must remain locked before Stage 4 validation.');

    const desktopLayout = await page.evaluate(() => {
      const workspace = document.getElementById('excelStageWorkspaceV45')?.getBoundingClientRect();
      const files = document.querySelector('.v45-files-pane')?.getBoundingClientRect();
      const inspector = document.querySelector('.v45-inspector-pane')?.getBoundingClientRect();
      return {
        workspaceWidth:workspace?.width || 0,
        filesWidth:files?.width || 0,
        inspectorWidth:inspector?.width || 0,
        overlaps:Boolean(files && inspector && files.right > inspector.left + 1)
      };
    });
    if (desktopLayout.workspaceWidth < 700 || desktopLayout.filesWidth < 240 || desktopLayout.inspectorWidth < 400 || desktopLayout.overlaps) {
      throw new Error(`Desktop visual layout failed: ${JSON.stringify(desktopLayout)}`);
    }

    const workbookBytes = fs.readFileSync(DATASET_PATH);
    await page.locator('#v45UploadInput').setInputFiles({
      name:'uploaded_stage4_copy.xlsx',
      mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer:workbookBytes
    });
    await page.waitForFunction(() => /uploaded_stage4_copy\.xlsx/.test(document.getElementById('v45FileTree')?.textContent || ''), null, { timeout:120000 });
    await page.waitForFunction(() => document.querySelector('#v45PreviewTable tbody tr'), null, { timeout:120000 });

    await page.locator('#v45ClassDatasetButton').click();
    await page.waitForFunction(() => document.documentElement.dataset.excelStageReady === 'v45', null, { timeout:120000 });
    await page.waitForFunction(() => /stat11_stage4_students\.xlsx/.test(document.getElementById('v45FileStatus')?.textContent || ''), null, { timeout:20000 });

    const inspect = await page.evaluate(() => {
      const metrics = [...document.querySelectorAll('.v45-metric strong')].map(node => node.textContent.trim());
      const rows = [...document.querySelectorAll('#v45PreviewTable tbody tr')];
      const cells = rows.map(row => [...row.children].map(cell => cell.textContent.trim()));
      return {
        metrics,
        rowCount:rows.length,
        firstRow:cells[0] || [],
        scrollWidth:document.documentElement.scrollWidth,
        width:innerWidth
      };
    });
    if (inspect.metrics[0] !== '18' || inspect.metrics[1] !== '6') throw new Error(`Visual inspector shape is wrong: ${JSON.stringify(inspect.metrics)}`);
    if (inspect.rowCount !== 5 || inspect.firstRow[0] !== 'ST001') throw new Error(`Visual inspector preview is wrong: ${JSON.stringify(inspect)}`);
    if (inspect.scrollWidth > inspect.width + 4) throw new Error(`Desktop page overflow detected: ${JSON.stringify(inspect)}`);

    await page.screenshot({ path:path.join(ARTIFACT_DIR, 'workshop-v45-stage4-desktop.png'), fullPage:true });

    const code = [
      'import pandas as pd',
      'df = pd.read_excel("stat11_stage4_students.xlsx")',
      'high_scores = df[df["score"] >= 90]',
      'print(len(high_scores))'
    ].join('\n');

    await page.locator('#codeEditor').fill(code);
    await page.locator('#runButton').click();
    await page.waitForFunction(() => /^2$/m.test((document.getElementById('outputText')?.textContent || '').trim()), null, { timeout:30000 });
    if (await page.locator('#validateButton').isDisabled()) throw new Error('Stage 4 Validate did not enable after real pandas/read_excel execution.');

    await page.locator('#validateButton').click();
    await page.waitForFunction(() => document.querySelector('[data-stage="3"]')?.classList.contains('stage-complete'), null, { timeout:15000 });
    await page.waitForFunction(() => !document.getElementById('nextButton')?.disabled, null, { timeout:5000 });
    if (submits.length !== 1 || submits[0].p_item_key !== 'stat-04' || String(submits[0].p_answer).trim() !== '2') {
      throw new Error(`Stage 4 backend payload is incorrect: ${JSON.stringify(submits)}`);
    }

    await page.setViewportSize({ width:390, height:844 });
    await page.waitForTimeout(300);
    const mobile = await page.evaluate(() => {
      const files = document.querySelector('.v45-files-pane')?.getBoundingClientRect();
      const inspector = document.querySelector('.v45-inspector-pane')?.getBoundingClientRect();
      return {
        width:innerWidth,
        scrollWidth:document.documentElement.scrollWidth,
        stacked:Boolean(files && inspector && inspector.top >= files.bottom - 2),
        uploadVisible:Boolean(document.getElementById('v45UploadButton')?.getBoundingClientRect().width),
        tableVisible:Boolean(document.getElementById('v45PreviewTable')?.getBoundingClientRect().width)
      };
    });
    if (!mobile.stacked || !mobile.uploadVisible || !mobile.tableVisible || mobile.scrollWidth > mobile.width + 4) {
      throw new Error(`Mobile visual layout failed: ${JSON.stringify(mobile)}`);
    }

    await page.screenshot({ path:path.join(ARTIFACT_DIR, 'workshop-v45-stage4-mobile.png'), fullPage:true });

    if (resumeRequests < 1) throw new Error('Resume RPC was not called.');
    if (criticalErrors.length) throw new Error(`Critical browser errors:\n${criticalErrors.join('\n')}`);

    console.log('WORKSHOP EXCEL V45 E2E PASS stage=4 real_xlsx=PASS upload=PASS pandas_read_excel=PASS visual_inspector=PASS backend_gate=PASS desktop=PASS mobile=PASS');
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (!server.killed) server.kill('SIGKILL');
  }
}

const timer = setTimeout(() => {
  console.error(`V45 E2E global timeout after ${GLOBAL_TIMEOUT_MS} ms`);
  process.exit(1);
}, GLOBAL_TIMEOUT_MS);
timer.unref();

run().then(() => {
  clearTimeout(timer);
  process.exit(0);
}).catch(error => {
  clearTimeout(timer);
  console.error(error.stack || error);
  process.exit(1);
});
