'use strict';

const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'http://127.0.0.1:4173';
const GLOBAL_TIMEOUT_MS = 100000;
const phase = text => console.log(`[arrays-v47-e2e] ${text}`);

async function waitForServer() {
  for (let i = 0; i < 50; i += 1) {
    try {
      const response = await fetch(`${ORIGIN}/python/workshop.html?topic=arrays&masterPreview=1`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error('Local V47 workshop server did not start.');
}

async function run() {
  phase('spawn production static page');
  const server = spawn('python3', ['-m','http.server','4173','--bind','127.0.0.1','--directory',ROOT], { stdio:'ignore' });
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ headless:true });
    const context = await browser.newContext({ viewport:{ width:1440, height:1000 } });
    await context.addInitScript(() => {
      sessionStorage.setItem('ijr-stat11-master-teacher-session-v1', 'arrays-v47-e2e-token');
      sessionStorage.removeItem('ijr-stat11-v42-master-preview-progress');
    });

    await context.route('**/rest/v1/rpc/python_hub_master_preview_validate_v1', async route => {
      const payload = route.request().postDataJSON();
      const correct = payload.p_item_key === 'arr-01'
        && String(payload.p_answer).trim() === '15'
        && /values\s*=\s*\[6\s*,\s*10\s*,\s*15\s*,\s*21\s*\]/.test(payload.p_code_snapshot || '')
        && /values\s*\[\s*2\s*\]/.test(payload.p_code_snapshot || '');
      await route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ correct, message:correct?'Correct. Preview validation passed.':'Not correct yet.' }) });
    });

    const page = await context.newPage();
    const criticalErrors = [];
    page.on('pageerror', error => criticalErrors.push(`pageerror: ${error.message}`));
    page.on('requestfailed', request => {
      const url = request.url();
      if (url.startsWith(ORIGIN) || /pyodide/.test(url)) criticalErrors.push(`requestfailed: ${url} :: ${request.failure()?.errorText || 'unknown'}`);
    });

    const url = `${ORIGIN}/python/workshop.html?topic=arrays&masterPreview=1&runtimeBase=/node_modules/pyodide/`;
    phase('open Arrays production workshop');
    await page.goto(url, { waitUntil:'domcontentloaded', timeout:15000 });
    await page.waitForFunction(() => document.documentElement.dataset.workshopReady === 'true', null, { timeout:15000 });

    phase('verify 12-stage Arrays curriculum');
    if (await page.locator('#stageList .stage-button').count() !== 12) throw new Error('Expected exactly 12 Arrays stages.');
    if (!/Arrays/i.test((await page.locator('#topicTitle').innerText()).trim())) throw new Error('Arrays topic title did not render.');
    if ((await page.locator('#notebookSubtitle').innerText()).trim() !== 'Guided notebook · V47 · arrays step-by-step') throw new Error('Arrays V47 subtitle did not render.');

    phase('verify Stage 1 authorship guidance is clear but does not expose executable solution lines');
    await page.waitForSelector('#arrayV47Directive', { state:'visible', timeout:10000 });
    const steps = page.locator('#guideSteps [data-array-v47-step]');
    if (await steps.count() !== 4) throw new Error(`Stage 1 expected four conceptual steps, got ${await steps.count()}.`);
    const guideText = await page.locator('#guidePanel').innerText();
    for (const phrase of ['Plan your own list solution','Write the complete solution yourself','Run the cell']) {
      if (!guideText.includes(phrase)) throw new Error(`Stage 1 conceptual guidance missing: ${phrase}`);
    }
    for (const leaked of ['third_value = values[2]','print(third_value)','values = [6, 10, 15, 21]']) {
      if (guideText.includes(leaked)) throw new Error(`Stage 1 guidance leaked executable solution text: ${leaked}`);
    }
    if (await page.locator('#guideFigureArrayV47').count() !== 0) throw new Error('Copyable Arrays solution figure should not be rendered under authorship policy V53.');

    phase('verify paste is blocked only in the code editor');
    const pasteBlocked = await page.locator('#codeEditor').evaluate(editor => {
      const event = new Event('paste', { bubbles:true, cancelable:true });
      return editor.dispatchEvent(event) === false;
    });
    if (!pasteBlocked) throw new Error('Code editor paste event was not blocked by authorship policy V53.');

    phase('verify mutation observer remains stable instead of re-render looping');
    const before = await page.locator('#guideSteps').innerHTML();
    await page.waitForTimeout(700);
    const after = await page.locator('#guideSteps').innerHTML();
    if (before !== after) throw new Error('Arrays guidance changed while idle; idempotency guard is not stable.');

    phase('run real Python and validate the first Arrays exercise');
    const code = 'values = [6, 10, 15, 21]\nthird_value = values[2]\nprint(third_value)';
    await page.locator('#codeEditor').fill(code);
    await page.locator('#runButton').click();
    await page.waitForFunction(() => document.getElementById('runtimeLabel')?.textContent === 'Connected', null, { timeout:45000 });
    await page.waitForFunction(() => (document.getElementById('outputText')?.textContent || '').trim() === '15', null, { timeout:10000 });
    if (await page.locator('#validateButton').isDisabled()) throw new Error('Validate did not enable after successful Arrays Python execution.');
    await page.locator('#validateButton').click();
    await page.waitForFunction(() => document.querySelector('[data-stage="0"]')?.classList.contains('stage-complete'), null, { timeout:10000 });

    phase('verify sequential progression unlocks Stage 2 while conceptual guidance remains');
    const stage2 = page.locator('[data-stage="1"]');
    if (await stage2.isDisabled()) throw new Error('Stage 2 remained locked after Stage 1 validation.');
    await stage2.click();
    await page.waitForFunction(() => /STAGE\s+2/i.test(document.getElementById('problemKicker')?.textContent || ''), null, { timeout:5000 });
    await page.waitForFunction(() => (document.getElementById('problemPrompt')?.textContent || '').includes('len()'), null, { timeout:5000 });
    await page.waitForFunction(() => !!document.querySelector('#guideSteps [data-array-v47-step][data-authorship-softened="v53"]'), null, { timeout:5000 });
    const stage2Guide = await page.locator('#guidePanel').innerText();
    if (!stage2Guide.includes('Write the complete solution yourself')) throw new Error('Stage 2 conceptual authorship guidance did not remain active.');
    if (stage2Guide.includes('count = len(values)')) throw new Error('Stage 2 guidance exposed the executable len() assignment.');

    phase('mobile smoke for conceptual guidance');
    await page.setViewportSize({ width:390, height:844 });
    await page.waitForTimeout(250);
    const mobile = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      guideVisible: !!document.querySelector('#guidePanel')?.getBoundingClientRect().width,
      steps: document.querySelectorAll('#guideSteps [data-array-v47-step]').length
    }));
    if (!mobile.guideVisible || mobile.steps !== 4) throw new Error(`Mobile Arrays guidance missing: ${JSON.stringify(mobile)}`);
    if (mobile.scrollWidth > mobile.width + 4) throw new Error(`Unexpected mobile page overflow: ${JSON.stringify(mobile)}`);

    if (criticalErrors.length) throw new Error(`Critical browser errors:\n${criticalErrors.join('\n')}`);
    console.log('ARRAYS WORKSHOP V47 E2E PASS stages=12 conceptual_guidance=PASS no_solution_leak=PASS paste_guard=PASS real_python=PASS validation=PASS progression=PASS mobile=PASS');
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (!server.killed) server.kill('SIGKILL');
  }
}

const timer = setTimeout(() => {
  console.error(`Arrays V47 E2E global timeout after ${GLOBAL_TIMEOUT_MS} ms`);
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