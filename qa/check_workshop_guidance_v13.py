from pathlib import Path

root = Path(__file__).resolve().parents[1]
html = (root / 'python' / 'workshop.html').read_text(encoding='utf-8')
js = (root / 'python' / 'workshop-guidance-v13.js').read_text(encoding='utf-8')
css = (root / 'python' / 'workshop-guidance-v13.css').read_text(encoding='utf-8')
terminal_css = (root / 'python' / 'workshop-terminal-v12.css').read_text(encoding='utf-8')

required_html = [
    'workshop-terminal-v12.css',
    'workshop-guidance-v13.css',
    'workshop-terminal-v12.js',
    'workshop-guidance-v13.js',
    'pyodide/v0.27.7/full/pyodide.js',
]
for marker in required_html:
    assert marker in html, f'missing workshop asset: {marker}'
assert html.index('workshop-terminal-v12.js') < html.index('workshop-guidance-v13.js'), 'guidance must load after terminal enhancer'

for slug in ['operations', 'types', 'arrays', 'logic', 'conditions', 'loops', 'functions', 'statistics']:
    assert f'{slug}:' in js, f'missing guidance reference for {slug}'

for key in [f'op-{i:02d}' for i in range(1, 11)]:
    assert f"'{key}'" in js, f'missing explicit Topic 01 steps for {key}'

for marker in [
    'TASK GUIDE',
    'What you need to do',
    'Do it step by step',
    'Before you validate',
    'Review this topic’s theory',
    'MutationObserver',
    'guided-stage-layout',
    'task-guide-panel',
    'task-guide-steps',
    'Press ▶ Run',
    'black Python terminal',
]:
    assert marker in js, f'missing guidance contract marker: {marker}'

# The guidance layer is instructional only. It must not implement scoring or expose backend answers.
for forbidden in ['python_hub_submit_v1', 'expected_text', 'answerKeys', 'Correct answer:', 'supabase.createClient']:
    assert forbidden not in js, f'guidance layer should not contain backend/answer logic: {forbidden}'

for marker in [
    'position:sticky',
    'grid-template-columns:minmax(320px,370px) minmax(0,1fr)',
    '@media(max-width:980px)',
    '@media(max-width:620px)',
    'font-size:1.08rem',
    'task-guide-check',
]:
    assert marker in css, f'missing guidance layout/style contract: {marker}'

# Preserve the proven black terminal visual contract while adding the guide.
for marker in ['#202124', '#e8eaed']:
    assert marker in terminal_css, f'proven black terminal palette changed: {marker}'

print('Workshop guidance V13 QA passed: explicit lateral step-by-step panel, all topics, Topic 01 deep guidance, responsive layout, black terminal preserved.')
