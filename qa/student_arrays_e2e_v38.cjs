const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'http://127.0.0.1:4173';
const SESSION_KEY = 'ijr-stat11-python-hub-active-session-v20';
const QA_EMAIL = 'qa.workshop.e2e@ijr.edu.co';
const QA_GROUP = '11A';

function readConfig() {
  const source = fs.readFileSync(path.join(ROOT, 'python', 'config-v2.js'), 'utf8');
  const url = source.match(/supabaseUrl:\s*'([^']+)'/)?.[1];
  const key = source.match(/supabasePublishableKey:\s*'([^']+)'/)?.[1];
  if (!url || !key) throw new Error('Could not read public Supabase configuration.');
  return { url, key };
}

async function qaRegistration() {
  const { url, key } = readConfig();
  const response = await fetch(`${url}/rest/v1/rpc/python_hub_register_v1`, {
    method: 'POST',
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      p_registration_mode: 'individual',
      p_group_code: QA_GROUP,
      p_student_emails: [QA_EMAIL],
      p_session_id: crypto.randomUUID(),
      p_user_agent: 'GitHub Actions · Student Arrays E2E V38'
    })
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`QA registration failed (${response.status}): ${raw}`);
  const data = JSON.parse(raw);
  if (!data.registration_id || !data.access_token) throw new Error('QA registration did not return a student learning session.');
  const arrays = data.snapshot?.topics?.find(item => item.slug === 'arrays');
  if (!arrays || arrays.status === 'locked' || arrays.total_count !== 12) {
    throw new Error(`Arrays backend contract invalid: ${JSON.stringify(arrays)}`);
  }
  return data;
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

async function visibleOutcome(page, appId) {
  await page.waitForFunction(({ appId }) => {
    const app = document.getElementById(appId);
    const access = document.getElementById('accessPanel');
    return Boolean(app && access && (!app.classList.contains('hidden') || !access.classList.contains('hidden')));
  }, { appId }, { timeout: 20000 });

  const accessVisible = await page.locator('#accessPanel').evaluate(el => !el.classList.contains('hidden'));
  if (accessVisible) {
    const message = await page.locator('#accessPanel').innerText();
    const diag = await page.evaluate(() => window.IJR_STUDENT_TRANSPORT_V38 || null);
    throw new Error(`Access/recovery panel appeared instead of ${appId}: ${message}\ntransport=${JSON.stringify(diag)}`);
  }
}

(async () => {
  const registration = await qaRegistration();
  const server = spawn('python3', ['-m', 'http.server', '4173', '--bind', '127.0.0.1', '--directory', ROOT], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    await context.addInitScript(({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
    }, {
      key: SESSION_KEY,
      session: {
        registrationId: registration.registration_id,
        accessToken: registration.access_token,
        fingerprint: '',
        groupCode: QA_GROUP,
        emails: [QA_EMAIL],
        mode: 'individual',
        authProtected: true,
        savedAt: new Date().toISOString()
      }
    });

    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(`pageerror: ${error.message}`));
    page.on('console', msg => {
      if (msg.type() === 'error') pageErrors.push(`console: ${msg.text()}`);
    });

    await page.goto(`${ORIGIN}/python/workshop.html?topic=arrays`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await visibleOutcome(page, 'workshopApp');

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
    await visibleOutcome(page, 'theoryApp');
    const theoryTitle = (await page.locator('#theoryHero h1').innerText()).trim();
    if (!/Arrays and Python lists/i.test(theoryTitle)) throw new Error(`Wrong theory title: ${theoryTitle}`);

    const figureCount = await page.locator('.array-anatomy-v34, .array-index-v34, .array-append-v34, .array-summary-v34, .array-mean-v34, .array-dataset-v34').count();
    if (figureCount < 6) throw new Error(`Expected at least 6 Arrays visual figures, got ${figureCount}`);

    if (pageErrors.length) throw new Error(`Browser console/page errors:\n${pageErrors.join('\n')}`);

    console.log('STUDENT ARRAYS E2E V38 PASS');
    console.log(`backend arrays=available/12 transport=${transport.mode} workshop=visible stages=${stageCount} pyodide=executed theory=visible figures>=6`);
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.kill('SIGTERM');
  }
})().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
