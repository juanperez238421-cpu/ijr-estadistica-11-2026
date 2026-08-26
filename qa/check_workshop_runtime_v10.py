from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'python' / 'workshop.html').read_text(encoding='utf-8')
page = (ROOT / 'python' / 'workshop-page.js').read_text(encoding='utf-8')
runtime = (ROOT / 'python' / 'workshop-runtime-v10.js').read_text(encoding='utf-8')

checks = {
    'runtime module loaded': 'workshop-runtime-v10.js?v=20260826-runtime-v10' in html,
    'runtime before page controller': html.index('workshop-runtime-v10.js') < html.index('workshop-page.js'),
    'Pyodide 0.27.7 CDN': 'pyodide/v0.27.7/full/pyodide.js' in html,
    'explicit Pyodide index URL': "https://cdn.jsdelivr.net/pyodide/v${VERSION}/full/" in runtime,
    'explicit indexURL passed to loader': 'window.loadPyodide({ indexURL: INDEX_URL })' in runtime,
    'runtime self check': "runtime.runPython('20 + 22')" in runtime,
    'runtime retry after failure': 'runtimeState.promise = null' in runtime,
    'stdout capture': 'runtime.setStdout' in runtime,
    'stderr capture': 'runtime.setStderr' in runtime,
    'real async execution': 'runtime.runPythonAsync(source)' in runtime,
    'last expression rendering': 'expressionOutput' in runtime and "chunks.push(expressionOutput)" in runtime,
    'empty cell blocked': 'The Python cell is empty' in runtime and 'The Python cell is empty' in page,
    'Run cell button wired': 'id="runCode"' in page and "runButton.addEventListener('click'" in page,
    'Run success contract': 'state.lastRunOk=true' in page,
    'validation requires same successful run': "!state.lastRunOk || state.lastRunKey!==ex.key || state.lastCode!==editor.value" in page,
    'runtime warming': 'warmRuntime()' in page,
    'accessible live output': 'aria-live="polite"' in page,
}

failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('Workshop runtime V10 QA failed: ' + ', '.join(failed))

print(f'Workshop runtime V10 QA passed ({len(checks)}/{len(checks)} checks).')
