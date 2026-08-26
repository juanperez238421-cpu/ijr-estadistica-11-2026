from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'python' / 'workshop.html').read_text(encoding='utf-8')
css = (ROOT / 'python' / 'workshop-terminal-v12.css').read_text(encoding='utf-8')
js = (ROOT / 'python' / 'workshop-terminal-v12.js').read_text(encoding='utf-8')
page = (ROOT / 'python' / 'workshop-page.js').read_text(encoding='utf-8')
course = (ROOT / 'python' / 'course-data-v4.js').read_text(encoding='utf-8')
proven = (ROOT / 'actividad-colab-01' / 'app.js').read_text(encoding='utf-8')

checks = {
    'terminal css loaded last': 'workshop-terminal-v12.css?v=20260826-terminal-v12' in html,
    'terminal js loaded after workshop controller': html.index('workshop-page.js') < html.index('workshop-terminal-v12.js'),
    'direct Pyodide asset retained': 'pyodide/v0.27.7/full/pyodide.js' in html,
    'proven dark palette': '#202124' in css and '#e8eaed' in css and '#303134' in css,
    'large terminal output': 'min-height:220px' in css and '1.08rem' in css,
    'executable prompt': '>>>' in js and 'terminal-form-v12' in js,
    'real direct runtime': 'window.loadPyodide({ indexURL: PYODIDE_INDEX })' in js,
    'real async execution': 'py.runPythonAsync(command)' in js,
    'stdout capture': 'py.setStdout' in js,
    'stderr capture': 'py.setStderr' in js,
    'persistent runtime': 'state.pyodide' in js and 'state.promise' in js,
    'choice stages get terminal': "choice.insertAdjacentHTML('beforeend', universalTerminalMarkup())" in js,
    'code stages upgraded': "consoleEl.classList.add('black-python-terminal')" in js,
    'dynamic stages observed': 'new MutationObserver' in js,
    'shared workshop architecture': "const requested = new URLSearchParams(location.search).get('topic')" in page,
    'all eight topics remain': course.count("slug:") >= 8,
    'matches proven loader': 'loadPyodide({indexURL:PYODIDE_INDEX})' in proven,
    'matches proven stdout/stderr': 'setStdout' in proven and 'setStderr' in proven,
}

failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('Workshop terminal V12 QA failed: ' + ', '.join(failed))

print(f'Workshop terminal V12 QA passed ({len(checks)}/{len(checks)} checks).')
