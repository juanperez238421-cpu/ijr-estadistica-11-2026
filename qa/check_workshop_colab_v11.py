from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'python' / 'workshop.html').read_text(encoding='utf-8')
page = (ROOT / 'python' / 'workshop-page.js').read_text(encoding='utf-8')
golden = (ROOT / 'actividad-colab-01' / 'app.js').read_text(encoding='utf-8')
css = (ROOT / 'python' / 'workshop-colab-v11.css').read_text(encoding='utf-8')

checks = {
    'direct Pyodide CDN retained': 'pyodide/v0.27.7/full/pyodide.js' in html,
    'obsolete runtime wrapper not loaded': 'workshop-runtime-v10.js' not in html,
    'V11 cache-busted controller': 'workshop-page.js?v=20260826-colab-v11' in html,
    'V11 Colab stylesheet': 'workshop-colab-v11.css?v=20260826-colab-v11' in html,
    'proven index constant': "const PYODIDE_INDEX = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';" in page,
    'proven direct loadPyodide path': 'window.loadPyodide({indexURL:PYODIDE_INDEX})' in page,
    'stdout capture': 'py.setStdout({batched:m=>stdout.push(m)})' in page,
    'stderr capture': 'py.setStderr({batched:m=>stderr.push(m)})' in page,
    'real async Python': 'await py.runPythonAsync(code)' in page,
    'final expression rendering': "if(text!=='None') stdout.push(text)" in page,
    'real Colab gutter play': 'id="runCellButton"' in page and 'class="colab-play"' in page,
    'toolbar Run also wired': 'id="runCode"' in page and "toolbarRun.addEventListener('click',runCurrentCell)" in page,
    'gutter Run wired': "gutterRun.addEventListener('click',runCurrentCell)" in page,
    'functional terminal form': 'id="terminalForm"' in page and "$('terminalForm').addEventListener('submit'" in page,
    'terminal uses same runtime': 'await executePython(command,{recordForValidation:false})' in page,
    'exact-run validation contract': '!state.lastRunOk || state.lastRunKey!==ex.key || state.lastCode!==editor.value' in page,
    'large editor': 'min-height:360px' in css and 'font:1.2rem/1.65' in css,
    'terminal visual': '.colab-console{' in css and '.colab-console-input{' in css,
    'golden runtime source still present': 'async function ensureRuntime()' in golden and 'async function executePython(source)' in golden,
}

failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('Workshop Colab V11 QA failed: ' + ', '.join(failed))
print(f'Workshop Colab V11 QA passed ({len(checks)}/{len(checks)} checks).')
