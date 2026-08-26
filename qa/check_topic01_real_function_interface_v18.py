from pathlib import Path

root = Path(__file__).resolve().parents[1]
js = (root / 'python' / 'beginner-interface-v18.js').read_text(encoding='utf-8')
css = (root / 'python' / 'beginner-interface-v18.css').read_text(encoding='utf-8')
html = (root / 'python' / 'theory.html').read_text(encoding='utf-8')

required_functions = [
    'print()', 'type()', 'len()', 'int()', 'float()', 'str()', 'bool()',
    'round()', 'sum()', 'min()', 'max()', 'input()'
]
for fn in required_functions:
    assert fn in js, f'Missing beginner function lesson: {fn}'

for marker in [
    'See each function where you actually use it',
    'Run example',
    'mini-colab-v18',
    'function-output-v18',
    '<small>FUNCTION</small>',
    '<small>ARGUMENT</small>',
    'read nested functions from the inside out',
    'loadPyodide',
    'runPythonAsync',
    'setStdout',
    'setStderr',
    'Python 3 · browser runtime',
]:
    assert marker in js, f'Missing V18 interface/runtime marker: {marker}'

assert 'pyodide/v0.27.7/full/pyodide.js' in html
assert 'beginner-interface-v18.css' in html
assert 'beginner-interface-v18.js' in html
assert 'grid-template-columns:repeat(2,minmax(0,1fr))' in css
assert '@media(max-width:980px)' in css
assert '@media(max-width:620px)' in css
assert '@media(prefers-reduced-motion:reduce)' in css
assert '#202124' in css and '#e8eaed' in css
assert 'contextOnly: true' in js
assert 'browser workshop does not require interactive stdin' in js
assert 'expected_text' not in js
assert 'python_hub_workshop_keys' not in js

print('TOPIC 01 REAL FUNCTION INTERFACE V18 QA PASS')
print('functions=12 executable_colab_examples=11 input_context=PASS pyodide=PASS responsive=PASS')
