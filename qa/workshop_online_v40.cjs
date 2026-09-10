const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'http://127.0.0.1:4173';
const LIVE_ORIGIN = 'https://juanperez238421-cpu.github.io/ijr-estadistica-11-2026';
const SESSION_KEY = 'ijr-stat11-python-hub-active-session-v20';
const QA_REGISTRATION = '00000000-0000-4000-8000-000000000040';
const QA_ACCESS_TOKEN = 'local-browser-v40-token';
const GROUP = '11A';

function phase(message) { console.log(`[workshop-v40] ${message}`); }
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function topicSnapshot(slug, title, sequence, prefix) {
  const items = Array.from({ length: 12 }, (_, index) => ({
    key: `${prefix}-${String(index + 1).padStart(2, '0')}`,
    correct: false,
    completed: false,
    tries: 0
  }));
  return {
    registration: {
      id: QA_REGISTRATION,
      display_id: 'REG-V40-LOCAL',
      mode: 'individual',
      group_code: GROUP,
      team_size: 1,
      display_label: 'Local browser QA',
      status: 'active'
    },
    members: [],
    topics: [{ slug, sequence, title, nav: title, status: 'available', correct_count: 0, total_count: 12, percent: 0, items }],
    current_topic: slug,
    completed_topics: 0,
    total_topics: 16
  };
}

async function waitForServer() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const response = await fetch(`${ORIGIN}/python/workshop.html`);
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error('Local static server did not start.');
}

async function withTimeout(promise, ms, label) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms} ms`)), ms);
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function installSession(context) {
  await context.addInitScript(({ key, registrationId, accessToken, group }) => {
    localStorage.setItem(key, JSON.stringify({
      registrationId,
      accessToken,
      fingerprint: '',
      groupCode: group,
      emails: ['local.qa@ijr.edu.co'],
      mode: 'individual',
      authProtected: true,
      savedAt: new Date().toISOString()
    }));
  }, { key: SESSION_KEY, registrationId: QA_REGISTRATION, accessToken: QA_ACCESS_TOKEN, group: GROUP });
}

async function routeResume(context, snapshot) {
  await context.route('**/rest/v1/rpc/python_hub_resume_v1', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ snapshot })
    });
  });
}

async function assertWorkshopVisible(page, expectedTitle) {
  await withTimeout(page.waitForSelector('#workshopApp:not(.hidden)', { state: 'visible' }), 12000, 'Workshop render');
  const accessVisible = await page.locator('#accessPanel').isVisible();
  if (accessVisible) throw new Error(`Unexpected access/recovery panel: ${await page.locator('#accessPanel').innerText()}`);
  const title = (await page.locator('#workshopHero h1').innerText()).trim();
  if (!title.includes(expectedTitle)) throw new Error(`Unexpected workshop title: ${title}`);
  const stages = await page.locator('#stageButtons button').count();
  if (stages !== 12) throw new Error(`Expected 12 stages, got ${stages}`);
}

async function testLocalArrays(browser) {
  phase('local Arrays startup');
  const context = await browser.newContext();
  await installSession(context);
  await routeResume(context, topicSnapshot('arrays', 'Arrays and Python lists', 3, 'arr'));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await withTimeout(page.goto(`${ORIGIN}/python/workshop.html?topic=arrays`, { waitUntil: 'domcontentloaded' }), 15000, 'Arrays navigation');
  await assertWorkshopVisible(page, 'Arrays');
  if (errors.length) throw new Error(`Arrays browser errors: ${errors.join(' | ')}`);
  await context.close();
  phase('local Arrays startup PASS');
}

async function testLocalPandasRuntime(browser) {
  phase('local Pandas + classroom CSV runtime');
  const context = await browser.newContext();
  await installSession(context);
  await routeResume(context, topicSnapshot('conditions', 'Read and operate datasets with Pandas', 5, 'cond'));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await withTimeout(page.goto(`${ORIGIN}/python/workshop.html?topic=conditions`, { waitUntil: 'domcontentloaded' }), 15000, 'Pandas navigation');
  await assertWorkshopVisible(page, 'Pandas');
  await page.locator('#codeEditor').fill('import pandas as pd\ndf = pd.read_csv("estudiantes.csv")\nprint(df.shape)');
  await page.locator('#runCode').click();
  await withTimeout(page.waitForFunction(() => {
    const text = document.getElementById('terminalOutput')?.textContent || '';
    return text.includes('(12, 4)') || /FileNotFoundError|ModuleNotFoundError|Traceback|ERROR/.test(text);
  }), 45000, 'Pandas execution');
  const terminal = await page.locator('#terminalOutput').innerText();
  if (!terminal.includes('(12, 4)')) throw new Error(`Classroom CSV runtime failed:\n${terminal}`);
  if (errors.length) throw new Error(`Pandas browser errors: ${errors.join(' | ')}`);
  await context.close();
  phase('local Pandas + classroom CSV runtime PASS');
}

async function testLivePages(browser) {
  phase('live GitHub Pages shell + assets');
  const context = await browser.newContext();
  const page = await context.newPage();
  const badResponses = [];
  page.on('response', response => {
    const url = response.url();
    if (url.startsWith(`${LIVE_ORIGIN}/python/`) && response.status() >= 400) badResponses.push(`${response.status()} ${url}`);
  });
  await withTimeout(page.goto(`${LIVE_ORIGIN}/python/workshop.html?topic=arrays&qa_v40=${Date.now()}`, { waitUntil: 'domcontentloaded' }), 20000, 'Live workshop navigation');
  await withTimeout(page.waitForFunction(() => {
    const app = document.getElementById('workshopApp');
    const access = document.getElementById('accessPanel');
    return Boolean(app && access && (!app.classList.contains('hidden') || !access.classList.contains('hidden')));
  }), 12000, 'Live workshop startup outcome');
  if (badResponses.length) throw new Error(`Live same-origin asset failures:\n${badResponses.join('\n')}`);
  const html = await page.content();
  if (!html.includes('Statistics 11 · Python Workshop')) throw new Error('Live Pages is not serving the workshop document.');
  await context.close();
  phase('live GitHub Pages shell + assets PASS');
}

async function testLiveSupabaseReachability() {
  phase('live Supabase resume endpoint');
  const source = fs.readFileSync(path.join(ROOT, 'python/config-v2.js'), 'utf8');
  const url = source.match(/supabaseUrl:\s*'([^']+)'/)?.[1];
  const key = source.match(/supabasePublishableKey:\s*'([^']+)'/)?.[1];
  if (!url || !key) throw new Error('Could not read public Supabase configuration.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const started = Date.now();
  try {
    const response = await fetch(`${url}/rest/v1/rpc/python_hub_resume_v1`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_registration_id: QA_REGISTRATION, p_access_token: 'invalid-v40-probe' }),
      signal: controller.signal
    });
    const elapsed = Date.now() - started;
    const body = await response.text();
    if (response.status >= 500) throw new Error(`Supabase returned ${response.status}: ${body.slice(0, 300)}`);
    if (elapsed > 8000) throw new Error(`Supabase response exceeded bound: ${elapsed} ms`);
    console.log(`[workshop-v40] Supabase invalid-token probe returned HTTP ${response.status} in ${elapsed} ms (expected fast rejection).`);
  } finally {
    clearTimeout(timer);
  }
  phase('live Supabase resume endpoint PASS');
}

async function main() {
  const server = spawn('python3', ['-m', 'http.server', '4173', '--bind', '127.0.0.1', '--directory', ROOT], { stdio: 'ignore' });
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ headless: true });
    await testLocalArrays(browser);
    await testLocalPandasRuntime(browser);
    await testLivePages(browser);
    await testLiveSupabaseReachability();
    console.log('WORKSHOP ONLINE V40 QA PASS');
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (!server.killed) server.kill('SIGKILL');
  }
}

main().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
