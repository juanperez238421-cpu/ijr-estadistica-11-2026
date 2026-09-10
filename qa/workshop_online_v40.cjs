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
    try {
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
    } catch {}
  }, { key: SESSION_KEY, registrationId: QA_REGISTRATION, accessToken: QA_ACCESS_TOKEN, group: GROUP });
}

async function routeResume(context, snapshot, stats) {
  await context.route('**/rest/v1/rpc/python_hub_resume_v1', async route => {
    stats.resumeHits += 1;
    stats.resumeUrls.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ snapshot })
    });
  });
}

function wirePageDiagnostics(page, label, sink) {
  page.on('pageerror', error => sink.pageErrors.push(error.message));
  page.on('console', message => sink.console.push(`${message.type()}: ${message.text()}`));
  page.on('requestfailed', request => sink.failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || 'unknown'}`));
  page.on('response', response => {
    if (response.status() >= 400) sink.badResponses.push(`${response.status()} ${response.url()}`);
  });
  page.on('crash', () => sink.pageErrors.push(`${label}: page crashed`));
}

async function startupState(page) {
  return page.evaluate(key => {
    const app = document.getElementById('workshopApp');
    const access = document.getElementById('accessPanel');
    const badge = document.getElementById('sessionBadge');
    const topicMap = window.IJR_PYTHON_HUB_TOPIC_MAP || {};
    return {
      readyState: document.readyState,
      bodyText: (document.body?.innerText || '').slice(0, 1600),
      appClass: app?.className || null,
      accessClass: access?.className || null,
      accessText: (access?.innerText || '').slice(0, 1200),
      badge: badge?.textContent || null,
      session: localStorage.getItem(key),
      hasConfig: Boolean(window.IJR_PYTHON_HUB_CONFIG),
      topicCount: Array.isArray(window.IJR_PYTHON_HUB_TOPICS) ? window.IJR_PYTHON_HUB_TOPICS.length : -1,
      topicKeys: Object.keys(topicMap).slice(0, 30),
      hasArrays: Boolean(topicMap.arrays),
      hasConditions: Boolean(topicMap.conditions),
      hasSupabase: Boolean(window.supabase?.createClient),
      hasRetryBoot: typeof window.IJR_WORKSHOP_RETRY_BOOT === 'function',
      reliability: window.IJR_WORKSHOP_RELIABILITY_V40 || null,
      dataFirstPolicy: window.IJR_PYTHON_HUB_WORKSHOP_POLICY_V32 || null
    };
  }, SESSION_KEY);
}

async function assertWorkshopVisible(page, expectedTitle, diagnostics, stats) {
  try {
    await page.waitForFunction(() => {
      const app = document.getElementById('workshopApp');
      const access = document.getElementById('accessPanel');
      return Boolean(app && access && (!app.classList.contains('hidden') || !access.classList.contains('hidden')));
    }, { timeout: 12000 });
  } catch (error) {
    const state = await startupState(page);
    throw new Error(`${error.message}\nSTARTUP_STATE=${JSON.stringify(state)}\nROUTE_STATS=${JSON.stringify(stats)}\nPAGE_ERRORS=${JSON.stringify(diagnostics.pageErrors)}\nCONSOLE=${JSON.stringify(diagnostics.console)}\nFAILED_REQUESTS=${JSON.stringify(diagnostics.failedRequests)}\nBAD_RESPONSES=${JSON.stringify(diagnostics.badResponses)}`);
  }
  const accessVisible = await page.locator('#accessPanel').isVisible();
  if (accessVisible) throw new Error(`Unexpected access/recovery panel: ${await page.locator('#accessPanel').innerText()}`);
  const title = (await page.locator('#workshopHero h1').innerText()).trim();
  if (!title.includes(expectedTitle)) throw new Error(`Unexpected workshop title: ${title}`);
  const stages = await page.locator('#stageButtons button').count();
  if (stages !== 12) throw new Error(`Expected 12 stages, got ${stages}`);
}

async function createLocalPage(browser, snapshot, label) {
  const context = await browser.newContext();
  phase(`${label}: context-created`);
  const stats = { resumeHits: 0, resumeUrls: [] };
  const diagnostics = { pageErrors: [], console: [], failedRequests: [], badResponses: [] };
  await installSession(context);
  phase(`${label}: session-init-installed`);
  await routeResume(context, snapshot, stats);
  phase(`${label}: resume-route-installed`);
  const page = await context.newPage();
  phase(`${label}: page-created`);
  wirePageDiagnostics(page, snapshot.current_topic, diagnostics);
  return { context, page, stats, diagnostics };
}

async function testLocalArrays(browser) {
  phase('local Arrays startup');
  const { context, page, stats, diagnostics } = await createLocalPage(browser, topicSnapshot('arrays', 'Arrays and Python lists', 3, 'arr'), 'arrays');
  try {
    phase('arrays: goto-start');
    await withTimeout(page.goto(`${ORIGIN}/python/workshop.html?topic=arrays`, { waitUntil: 'domcontentloaded' }), 15000, 'Arrays navigation');
    phase('arrays: domcontentloaded');
    await assertWorkshopVisible(page, 'Arrays', diagnostics, stats);
    phase(`arrays: visible resumeHits=${stats.resumeHits}`);
    if (diagnostics.pageErrors.length) throw new Error(`Arrays browser errors: ${diagnostics.pageErrors.join(' | ')}`);
  } finally {
    await context.close();
  }
  phase('local Arrays startup PASS');
}

async function testLocalPandasRuntime(browser) {
  phase('local Pandas + classroom CSV runtime');
  const { context, page, stats, diagnostics } = await createLocalPage(browser, topicSnapshot('conditions', 'Read and operate datasets with Pandas', 5, 'cond'), 'pandas');
  try {
    phase('pandas: goto-start');
    await withTimeout(page.goto(`${ORIGIN}/python/workshop.html?topic=conditions`, { waitUntil: 'domcontentloaded' }), 15000, 'Pandas navigation');
    phase('pandas: domcontentloaded');
    await assertWorkshopVisible(page, 'Pandas', diagnostics, stats);
    phase(`pandas: visible resumeHits=${stats.resumeHits}`);
    await page.locator('#codeEditor').fill('import pandas as pd\ndf = pd.read_csv("estudiantes.csv")\nprint(df.shape)');
    await page.locator('#runCode').click();
    phase('pandas: run-clicked');
    await withTimeout(page.waitForFunction(() => {
      const text = document.getElementById('terminalOutput')?.textContent || '';
      return text.includes('(12, 4)') || /FileNotFoundError|ModuleNotFoundError|Traceback|ERROR/.test(text);
    }), 60000, 'Pandas execution');
    const terminal = await page.locator('#terminalOutput').innerText();
    if (!terminal.includes('(12, 4)')) throw new Error(`Classroom CSV runtime failed:\n${terminal}`);
    if (diagnostics.pageErrors.length) throw new Error(`Pandas browser errors: ${diagnostics.pageErrors.join(' | ')}`);
  } finally {
    await context.close();
  }
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
  try {
    phase('live-pages: goto-start');
    await withTimeout(page.goto(`${LIVE_ORIGIN}/python/workshop.html?topic=arrays&qa_v40=${Date.now()}`, { waitUntil: 'domcontentloaded' }), 20000, 'Live workshop navigation');
    phase('live-pages: domcontentloaded');
    await withTimeout(page.waitForFunction(() => {
      const app = document.getElementById('workshopApp');
      const access = document.getElementById('accessPanel');
      return Boolean(app && access && (!app.classList.contains('hidden') || !access.classList.contains('hidden')));
    }), 12000, 'Live workshop startup outcome');
    if (badResponses.length) throw new Error(`Live same-origin asset failures:\n${badResponses.join('\n')}`);
    const html = await page.content();
    if (!html.includes('Statistics 11 · Python Workshop')) throw new Error('Live Pages is not serving the workshop document.');
  } finally {
    await context.close();
  }
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
    phase('server-ready');
    browser = await chromium.launch({ headless: true });
    phase('browser-launched');
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
