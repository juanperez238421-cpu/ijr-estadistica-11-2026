const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'http://127.0.0.1:4173';
const SESSION_KEY = 'ijr-stat11-python-hub-active-session-v20';
const QA_GROUP = '11A';
const QA_REGISTRATION = '00000000-0000-4000-8000-000000000038';
const QA_ACCESS_TOKEN = 'browser-e2e-v38-non-production-token';

function arraysSnapshot() {
  const items = Array.from({ length: 12 }, (_, index) => ({
    key: `arr-${String(index + 1).padStart(2, '0')}`,
    correct: false,
    completed: false,
    tries: 0
  }));
  return {
    registration: {
      id: QA_REGISTRATION,
      display_id: 'REG-E2EV38',
      mode: 'individual',
      group_code: QA_GROUP,
      team_size: 1,
      display_label: 'Browser QA student',
      status: 'active'
    },
    members: [],
    topics: [{
      slug: 'arrays',
      sequence: 3,
      title: 'Arrays and Python lists',
      nav: 'Arrays / lists',
      status: 'available',
      correct_count: 0,
      total_count: 12,
      percent: 0,
      items
    }],
    current_topic: 'arrays',
    completed_topics: 0,
    total_topics: 16
  };
}

async function waitForServer() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const response = await fetch(`${ORIGIN}/python/workshop.html?topic=arrays`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Local static server did not start.');
}

async function startupState(page, appId, pageErrors) {
  let state = null;
  try {
    state = await page.evaluate(({ appId, sessionKey }) => {
      const app = document.getElementById(appId);
      const access = document.getElementById('accessPanel');
      return {
        href: location.href,
        readyState: document.readyState,
        appExists: Boolean(app),
        appClass: app?.className || null,
        accessExists: Boolean(access),
        accessClass: access?.className || null,
        accessText: access?.innerText?.slice(0, 800) || '',
        badge: document.getElementById('sessionBadge')?.textContent || '',
        bodyText: document.body?.innerText?.slice(0, 1200) || '',
        storedSession: localStorage.getItem(sessionKey),
        supabaseCapture: window.IJR_SUPABASE_CAPTURE_V38 || null,
        studentTransport: window.IJR_STUDENT_TRANSPORT_V38 || null,
        bootstrap: window.IJR_WORKSHOP_BOOTSTRAP_V33 || null,
        masterContext: window.IJR_MASTER_CONTEXT_V34 || null,
        hasSupabase: Boolean(window.supabase),
        scriptSources: Array.from(document.scripts).map(s => s.src || '[inline]').slice(0, 40)
      };
    }, { appId, sessionKey: SESSION_KEY });
  } catch (error) {
    state = { evaluationError: error.message };
  }
  return { state, pageErrors: [...pageErrors] };
}

async function visibleOutcome(page, appId, pageErrors) {
  try {
    await page.waitForFunction(({ appId }) => {
      const app = document.getElementById(appId);
      const access = document.getElementById('accessPanel');
      return Boolean(app && access && (!app.classList.contains('hidden') || !access.classList.contains('hidden')));
    }, { appId }, { timeout: 15000 });
  } catch (error) {
    const diagnostics = await startupState(page, appId, pageErrors);
    throw new Error(`${appId} startup timeout. ${error.message}\nDIAGNOSTICS=${JSON.stringify(diagnostics, null, 2)}`);
  }

  const accessVisible = await page.locator('#accessPanel').evaluate(el => !el.classList.contains('hidden'));
  if (accessVisible) {
    const diagnostics = await startupState(page, appId, pageErrors);
    throw new Error(`Access/recovery panel appeared instead of ${appId}.\nDIAGNOSTICS=${JSON.stringify(diagnostics, null, 2)}`);
  }
}

(async () => {
  const server = spawn('python3', ['-m', 'http.server', '4173', '--bind', '127.0.0.1', '--directory', ROOT], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    await context.addInitScript(({ key, session }) => {
      try { localStorage.setItem(key, JSON.stringify(session)); } catch {}
    }, {
      key: SESSION_KEY,
      session: {
        registrationId: QA_REGISTRATION,
        accessToken: QA_ACCESS_TOKEN,
        fingerprint: '',
        groupCode: QA_GROUP,
        emails: ['browser.qa@ijr.edu.co'],
        mode: 'individual',
        authProtected: true,
        savedAt: new Date().toISOString()
      }
    });

    let resumeRequests = 0;
    let resumeApiKeyHeaders = 0;
    const snapshot = arraysSnapshot();
    await context.route('**/rest/v1/rpc/python_hub_resume_v1', async route => {
      const request = route.request();
      resumeRequests += 1;
      if (request.headers().apikey?.startsWith('sb_publishable_')) resumeApiKeyHeaders += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ snapshot })
      });
    });

    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(`pageerror: ${error.message}`));
    page.on('console', msg => {
      if (msg.type() === 'error') pageErrors.push(`console: ${msg.text()}`);
    });
    page.on('requestfailed', request => pageErrors.push(`requestfailed: ${request.url()} :: ${request.failure()?.errorText || 'unknown'}`));

    await page.goto(`${ORIGIN}/python/workshop.html?topic=arrays`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await visibleOutcome(page, 'workshopApp', pageErrors);

    const transport = await page.evaluate(() => window.IJR_STUDENT_TRANSPORT_V38 || null);
    if (!transport?.ready || transport.mode !== 'official-supabase-js') {
      throw new Error(`Student workshop did not use official Supabase transport: ${JSON.stringify(transport)}`);
    }

    const badge = (await page.locator('#sessionBadge').innerText()).trim();
    if (!badge.startsWith('11A ·')) throw new Error(`Unexpected workshop progress badge: ${badge}`);

    const title = (await page.locator('#workshopHero h1').innerText()).trim();
    if (!/Arrays and Python lists/i.test(title)) throw new Error(`Wrong workshop title: ${title}`);

    const stageCount = await page.locator('#stageButtons button').count();
    if (stageCount !== 12) throw new Error(`Expected 12 Arrays stages, got ${stageCount}`);

    await page.locator('#codeEditor').fill('values = [8, 13, 21]\nprint(values[0])');
    await page.locator('#runCode').click();
    await page.waitForFunction(() => /(^|\n)8(\n|$)/.test(document.getElementById('terminalOutput')?.textContent || ''), null, { timeout: 45000 });

    await page.goto(`${ORIGIN}/python/theory.html?topic=arrays`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await visibleOutcome(page, 'theoryApp', pageErrors);
    const theoryTitle = (await page.locator('#theoryHero h1').innerText()).trim();
    if (!/Arrays and Python lists/i.test(theoryTitle)) throw new Error(`Wrong theory title: ${theoryTitle}`);

    const figureCount = await page.locator('.array-anatomy-v34, .array-index-v34, .array-append-v34, .array-summary-v34, .array-mean-v34, .array-dataset-v34').count();
    if (figureCount < 6) throw new Error(`Expected at least 6 Arrays visual figures, got ${figureCount}`);

    if (resumeRequests < 2 || resumeApiKeyHeaders < 2) {
      throw new Error(`Official SDK resume transport was not observed on both pages: requests=${resumeRequests}, apikey=${resumeApiKeyHeaders}`);
    }
    if (pageErrors.length) throw new Error(`Browser console/page errors:\n${pageErrors.join('\n')}`);

    console.log('STUDENT ARRAYS BROWSER E2E V38 PASS');
    console.log(`transport=${transport.mode} resume_requests=${resumeRequests} publishable_headers=${resumeApiKeyHeaders} workshop=visible stages=${stageCount} pyodide=executed theory=visible figures=${figureCount}`);
    console.log('NOTE: the progress RPC response is deterministic/mocked in-browser; production Supabase state is verified separately by backend QA.');
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.kill('SIGTERM');
  }
})().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
