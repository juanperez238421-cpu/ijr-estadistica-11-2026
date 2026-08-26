from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
js = (ROOT / 'python' / 'beginner-basics-v17.js').read_text(encoding='utf-8')
css = (ROOT / 'python' / 'beginner-basics-v17.css').read_text(encoding='utf-8')
theory = (ROOT / 'python' / 'theory.html').read_text(encoding='utf-8')
workshop = (ROOT / 'python' / 'workshop.html').read_text(encoding='utf-8')

required_functions = [
    'print(value)', 'type(value)', 'len(value)', 'int(value)', 'float(value)',
    'str(value)', 'bool(value)', 'round(number, digits)', 'sum(values)', 'min(values) / max(values)'
]
for fn in required_functions:
    assert fn in js, f'Missing beginner function: {fn}'

for marker in [
    'Functions you should recognize on day one',
    'function name', 'function call', 'argument / expression',
    'Read code from the inside out.',
    'A function is not the same as an operator.',
    'input(...)',
    'BEGINNER TOOLBOX',
    'You will not use every function in every stage.',
    'function(argument)'
]:
    assert marker in js, f'Missing beginner concept marker: {marker}'

assert "requested !== 'operations'" in js, 'V17 must affect Topic 01 only.'
assert 'MutationObserver' in js and 'requestAnimationFrame' in js, 'Async render protection missing.'
assert 'beginnerBasicsV17' in js and 'workshopBasicsV17' in js, 'Theory/workshop insertion points missing.'

for html, name in [(theory, 'theory'), (workshop, 'workshop')]:
    assert 'beginner-basics-v17.css?v=20260826-beginner-v17' in html, f'{name} does not load V17 CSS.'
    assert 'beginner-basics-v17.js?v=20260826-beginner-v17' in html, f'{name} does not load V17 JS.'

for marker in [
    '.beginner-function-grid-v17', '.function-anatomy-v17', '.workshop-basics-v17',
    'grid-template-columns:repeat(4', '@media(max-width:1180px)', '@media(max-width:760px)',
    '@media(prefers-reduced-motion:reduce)'
]:
    assert marker in css, f'Missing V17 visual/responsive marker: {marker}'

# Preserve the proven executable workshop contract.
assert 'workshop-terminal-v12.css' in workshop
assert 'workshop-page.js?v=20260826-colab-v11' in workshop
assert 'pyodide/v0.27.7/full/pyodide.js' in workshop
assert 'workshop-guidance-v16.css' in workshop

print('TOPIC 01 BEGINNER BASICS V17 QA PASS')
print('functions=10 theory=PASS workshop_reference=PASS function_anatomy=PASS responsive=PASS runtime_preserved=PASS')
