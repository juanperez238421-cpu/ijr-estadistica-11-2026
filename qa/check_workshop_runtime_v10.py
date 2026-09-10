from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'python' / 'workshop.html').read_text(encoding='utf-8')
page = (ROOT / 'python' / 'workshop-page.js').read_text(encoding='utf-8')
runtime = (ROOT / 'python' / 'workshop-runtime-v10.js').read_text(encoding='utf-8')
bootstrap = (ROOT / 'python' / 'workshop-bootstrap-v33.js').read_text(encoding='utf-8')

checks = {
    'stable bootstrap loaded': 'workshop-bootstrap-v33.js' in html,
    'bootstrap before page controller': html.index('workshop-bootstrap-v33.js') < html.index('workshop-page.js'),
    'Pyodide 0.27.7 CDN': 'pyodide/v0.27.7/full/pyodide.js' in bootstrap,
    'explicit Pyodide index URL': "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/" in page,
    'runtime retry after failure': 'state.runtimePromise=null' in page and 'pyodidePromise = null' in bootstrap,
    'stdout capture': 'py.setStdout' in page,
    'stderr capture': 'py.setStderr' in page,
    'real async execution': 'py.runPythonAsync(code)' in page,
    'empty cell blocked': 'The Python cell is empty' in runtime and 'The Python cell is empty' in page,
    'Run cell button wired': 'id="runCode"' in page and "toolbarRun.addEventListener('click'" in page,
    'Run success contract': 'state.lastRunOk=Boolean(output || lastScalar(output))' in page,
    'validation requires same successful run': "!state.lastRunOk || state.lastRunKey!==ex.key || state.lastCode!==editor.value" in page,
    'runtime is lazy until Run': 'ensureRuntime().catch' not in page,
    'recoverable startup': 'IJR_WORKSHOP_RETRY_BOOT' in page and "reason:'backend'" in page,
    'accessible live output': 'aria-live="polite"' in page,
}

failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('Workshop runtime V10 QA failed: ' + ', '.join(failed))

print(f'Workshop runtime V10 QA passed ({len(checks)}/{len(checks)} checks).')
