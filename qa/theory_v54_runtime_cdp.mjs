const baseUrl = process.argv[2] || 'http://127.0.0.1:4174';
const debugPort = Number(process.argv[3] || 9222);
const timeoutMs = Number(process.argv[4] || 180000);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const deadline = Date.now() + timeoutMs;

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

async function waitForDebugger() {
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      return await fetchJson(`http://127.0.0.1:${debugPort}/json/version`);
    } catch (error) {
      lastError = error;
      await sleep(250);
    }
  }
  throw lastError || new Error('Chrome DevTools endpoint did not become ready.');
}

await waitForDebugger();

const targetUrl = `${baseUrl}/qa/theory_v54_bootstrap.html?qaAuto=1`;
const target = await fetchJson(
  `http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(targetUrl)}`,
  { method: 'PUT' }
);

if (!target.webSocketDebuggerUrl) throw new Error('Chrome target has no webSocketDebuggerUrl.');
if (typeof WebSocket !== 'function') throw new Error(`Node ${process.version} does not expose the WebSocket client required for CDP QA.`);

const ws = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let nextId = 1;

await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Timed out opening Chrome DevTools WebSocket.')), 10000);
  ws.addEventListener('open', () => {
    clearTimeout(timer);
    resolve();
  }, { once: true });
  ws.addEventListener('error', event => {
    clearTimeout(timer);
    reject(new Error(`Chrome DevTools WebSocket error: ${event?.message || 'unknown error'}`));
  }, { once: true });
});

ws.addEventListener('message', event => {
  let message;
  try { message = JSON.parse(String(event.data)); }
  catch { return; }
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject, timer } = pending.get(message.id);
  pending.delete(message.id);
  clearTimeout(timer);
  if (message.error) reject(new Error(`${message.error.message || 'CDP error'}${message.error.data ? `: ${message.error.data}` : ''}`));
  else resolve(message.result || {});
});

function cdp(method, params = {}, commandTimeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP command timeout: ${method}`));
    }, commandTimeoutMs);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  }, 20000);
  if (result.exceptionDetails) {
    const text = result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime.evaluate failed';
    throw new Error(text);
  }
  return result.result?.value;
}

await cdp('Runtime.enable');
await cdp('Page.enable');

let latest = null;
while (Date.now() < deadline) {
  try {
    const raw = await evaluate(`JSON.stringify((() => {
      const root = document.documentElement;
      const text = key => document.querySelector('[data-pandas-live-key="' + key + '"] [data-pandas-output] pre')?.textContent || '';
      return {
        href: location.href,
        readyState: document.readyState,
        theory: root.dataset.theoryV54 || '',
        renderedAudit: root.dataset.theoryV56Overflow || '',
        runtime: root.dataset.theoryV54Runtime || '',
        runtimeError: root.dataset.theoryV54RuntimeError || '',
        recovery: root.dataset.theoryV56Recovery || '',
        legacyLogicVisible: document.body?.innerText?.includes('TOPIC 04 · LIVE LOGIC') || false,
        pandasVisible: document.body?.innerText?.includes('TOPIC 04 · LIVE PANDAS + EXCEL') || false,
        importOutput: text('pandas-import'),
        readOutput: text('read-excel'),
        exportOutput: text('export-excel'),
        downloadVisible: (() => {
          const button = document.querySelector('[data-pandas-download="analysis_output.xlsx"]');
          return !!button && !button.hidden;
        })()
      };
    })())`);
    latest = raw ? JSON.parse(raw) : null;

    if (latest?.runtime === 'fail') {
      throw new Error(`Page runtime QA failed: ${latest.runtimeError || 'unknown failure'}\n${JSON.stringify(latest, null, 2)}`);
    }

    if (latest?.runtime === 'pass') {
      const checks = {
        theoryLayer: latest.theory === 'v54',
        renderedOverflow: latest.renderedAudit === 'pass',
        staleRecoveryCleared: latest.recovery === 'clean',
        noLegacyLogic: latest.legacyLogicVisible === false,
        pandasSectionVisible: latest.pandasVisible === true,
        importRan: /Pandas version:/i.test(latest.importOutput),
        readCreatedDataFrame: /Object type:\s*DataFrame/i.test(latest.readOutput) && /Shape:/i.test(latest.readOutput),
        exportCreatedWorkbook: /Created:\s*True/i.test(latest.exportOutput),
        downloadControlVisible: latest.downloadVisible === true
      };
      const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
      if (failed.length) throw new Error(`Runtime reached pass marker but assertions failed: ${failed.join(', ')}\n${JSON.stringify(latest, null, 2)}`);
      console.log('STATISTICS 11 TOPIC 04 REAL CHROME/PYODIDE/PANDAS/XLSX SMOKE PASS');
      console.log(JSON.stringify({ checks, outputs: {
        import: latest.importOutput.slice(0, 180),
        read: latest.readOutput.slice(0, 300),
        export: latest.exportOutput.slice(0, 300)
      } }, null, 2));
      ws.close();
      process.exit(0);
    }
  } catch (error) {
    if (/Page runtime QA failed|assertions failed/i.test(error.message || '')) {
      ws.close();
      throw error;
    }
    // Navigation can temporarily destroy an execution context; retry on the new page.
  }
  await sleep(500);
}

ws.close();
throw new Error(`Timed out waiting for the real Topic 04 runtime smoke. Latest state:\n${JSON.stringify(latest, null, 2)}`);
