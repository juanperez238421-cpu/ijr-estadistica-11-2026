from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
js = (root / 'python' / 'theory-live-lab-v19.js').read_text(encoding='utf-8')
css = (root / 'python' / 'theory-live-lab-v19.css').read_text(encoding='utf-8')
html = (root / 'python' / 'theory.html').read_text(encoding='utf-8')

TOPICS = ['operations', 'types', 'arrays', 'logic', 'conditions', 'loops', 'functions', 'statistics']
for topic in TOPICS:
    assert re.search(rf"\b{re.escape(topic)}\s*:\s*\{{", js), f'Missing live theory configuration for {topic}'

required_runtime = [
    'loadPyodide', 'runPythonAsync', 'setStdout', 'setStderr',
    'Code cell · editable', 'Press ▶ Run', 'Python 3 · browser runtime',
    'data-run-live', 'data-reset-live', 'What to notice', 'Use it when'
]
for marker in required_runtime:
    assert marker in js, f'Missing universal live-lab runtime/interface marker: {marker}'

required_curriculum = [
    'print()', 'type()', 'len()', 'int()', 'float()', 'str()', 'bool()', 'round()', 'sum()', 'min()', 'max()',
    'variable = value', 'None', 'append()', 'values[index]',
    '==', '!=', 'and', 'or', 'not',
    'if / else', 'if / elif / else',
    'for item in list', 'range()', 'accumulator', 'while',
    'def', 'parameter', 'return', 'multiple calls',
    'SAMPLE SIZE', 'MEAN', 'RANGE', 'COUNT ABOVE THE MEAN'
]
for marker in required_curriculum:
    assert marker in js, f'Missing live curriculum demonstration: {marker}'

assert 'contextOnly:true' in js, 'input() should remain context-only'
assert 'Interactive stdin is intentionally not required' in js
assert 'expected_text' not in js
assert 'python_hub_workshop_keys' not in js

assert 'theory-live-lab-v19.css' in html
assert 'theory-live-lab-v19.js' in html
assert 'pyodide/v0.27.7/full/pyodide.js' in html
assert 'beginner-interface-v18.js' not in html, 'Old Topic-01-only theory interface must not remain loaded'
assert 'beginner-basics-v17.js' not in html, 'Old Topic-01-only theory block must not remain loaded'

for marker in [
    'grid-template-columns:minmax(300px,.72fr) minmax(560px,1.28fr)',
    '#202124', '#e8eaed', 'min-height:245px', 'font-size:1.12rem',
    '@media(max-width:1180px)', '@media(max-width:760px)', '@media(prefers-reduced-motion:reduce)'
]:
    assert marker in css, f'Missing V19 visual/responsive marker: {marker}'

# Ensure each topic has a meaningful number of live demonstrations.
blocks = re.split(r'\n    (?=[a-z]+: \{)', js)
counts = {}
for topic in TOPICS:
    start = js.find(f'    {topic}: {{')
    if start < 0:
        continue
    later = [js.find(f'    {other}: {{', start + 1) for other in TOPICS if js.find(f'    {other}: {{', start + 1) >= 0]
    end = min(later) if later else js.find("\n  };", start)
    chunk = js[start:end]
    counts[topic] = chunk.count("{key:")
    assert counts[topic] >= 5, f'{topic} needs at least 5 live demonstrations, found {counts[topic]}'

print('ALL TOPICS LIVE THEORY V19 QA PASS')
print('topics=8 editable_cells=PASS pyodide=PASS black_output=PASS responsive=PASS counts=' + str(counts))
