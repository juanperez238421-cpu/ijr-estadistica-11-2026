import { chromium } from 'playwright';

const base = process.env.SEMINAR_BASE_URL || 'https://juanperez238421-cpu.github.io/ijr-estadistica-11-2026';
const stamp = Date.now();
const tracks = [
  ['web', 'Web Development'],
  ['data-science', 'Python & Data Science'],
  ['cybersecurity', 'Defensive Cybersecurity'],
  ['3d-programming', '3D Design + Programming'],
  ['robotics', 'Robotics & Automation'],
];

const browser = await chromium.launch({headless:true});
let failed = false;

for (const [slug, label] of tracks) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  const qaName = `QA E2E ${slug} ${stamp}`;
  try {
    await page.goto(`${base}/seminario/`, {waitUntil:'domcontentloaded', timeout:30000});
    await page.locator('#fullName').fill(qaName);
    await page.locator('#groupCode').selectOption('11-A');
    await page.locator('#entryForm button[type="submit"]').click();
    await page.locator('#choiceSection').waitFor({state:'visible', timeout:10000});

    await page.goto(`${base}/seminario-tracks/${slug}/`, {waitUntil:'domcontentloaded', timeout:30000});
    await page.locator('#startForm').waitFor({state:'visible', timeout:15000});

    const prefilledName = await page.locator('#fullName').inputValue();
    const prefilledGroup = await page.locator('#groupCode').inputValue();
    if (prefilledName !== qaName || prefilledGroup !== '11-A') {
      throw new Error(`central registration bridge mismatch: name=${JSON.stringify(prefilledName)} group=${JSON.stringify(prefilledGroup)}`);
    }

    await page.locator('#startForm button[type="submit"]').click();
    await page.waitForFunction(() => {
      const q = document.querySelector('.question-stage');
      const status = document.querySelector('#startStatus');
      return Boolean(q) || Boolean(status && /Could not start:/i.test(status.textContent || ''));
    }, null, {timeout:20000});

    const startError = await page.locator('#startStatus').count()
      ? (await page.locator('#startStatus').textContent())?.trim() || ''
      : '';
    if (/Could not start:/i.test(startError)) throw new Error(startError);

    await page.locator('.question-stage').waitFor({state:'visible', timeout:5000});
    const buttons = await page.locator('.question-numbers button').count();
    if (buttons !== 15) throw new Error(`expected 15 question navigation buttons, found ${buttons}`);

    console.log(`PASS ${slug}: ${label} — diagnostic started with 15 questions`);
    if (errors.length) console.log(`WARN ${slug}: ${errors.join(' | ')}`);
  } catch (err) {
    failed = true;
    console.error(`FAIL ${slug}: ${label} — ${err.message}`);
    if (errors.length) console.error(`BROWSER ${slug}: ${errors.join(' | ')}`);
  } finally {
    await context.close();
  }
}

await browser.close();
if (failed) process.exit(1);
