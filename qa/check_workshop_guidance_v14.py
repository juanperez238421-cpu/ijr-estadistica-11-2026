from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
js = (ROOT / 'python' / 'workshop-guidance-v14.js').read_text(encoding='utf-8')
css = (ROOT / 'python' / 'workshop-guidance-v14.css').read_text(encoding='utf-8')
html = (ROOT / 'python' / 'workshop.html').read_text(encoding='utf-8')
terminal_css = (ROOT / 'python' / 'workshop-terminal-v12.css').read_text(encoding='utf-8')

expected = {
    'operations': [f'op-{i:02d}' for i in range(1, 11)],
    'types': [f'type-{i:02d}' for i in range(1, 7)],
    'arrays': [f'arr-{i:02d}' for i in range(1, 7)],
    'logic': [f'logic-{i:02d}' for i in range(1, 7)],
    'conditions': [f'cond-{i:02d}' for i in range(1, 7)],
    'loops': [f'loop-{i:02d}' for i in range(1, 7)],
    'functions': [f'fn-{i:02d}' for i in range(1, 7)],
    'statistics': [f'stat-{i:02d}' for i in range(1, 7)],
}
all_keys = [key for keys in expected.values() for key in keys]
missing = [key for key in all_keys if f"'{key}': [" not in js]
assert not missing, f'Missing explicit guides: {missing}'
assert len(all_keys) == 52, len(all_keys)

for marker in [
    'STEP ${i + 1}',
    'Follow these steps in order',
    'Follow STEP 1 → STEP ${steps.length}',
    'Press ▶ Run',
    'black Python terminal',
    'Validate output',
    'Validate answer',
    'task-guide-panel-v14',
    'stage-step-summary-v14',
]:
    assert marker in js, f'Missing V14 marker: {marker}'

assert 'workshop-guidance-v14.css?v=20260826-guidance-v14' in html
assert 'workshop-guidance-v14.js?v=20260826-guidance-v14' in html
assert html.index('workshop-guidance-v13.js') < html.index('workshop-guidance-v14.js')

for marker in [
    '.task-step-label-v14',
    'grid-template-columns:92px',
    'background:#111',
    'color:#fff',
    'font-size:1.08rem',
    'position:sticky',
    '@media(max-width:760px)',
]:
    assert marker in css, f'Missing classroom step style: {marker}'

# Preserve the proven executable black terminal contract.
for marker in ['#202124', '#e8eaed', '.black-python-terminal']:
    assert marker in terminal_css, f'Black terminal regression: {marker}'

# The guidance may expose requested input values and operators, but it must not
# contain backend answer-key identifiers or expected-answer plumbing.
for forbidden in ['expected_text', 'AnswerKeys', 'python_hub_workshop_keys', 'expectedAnswer']:
    assert forbidden not in js, f'Answer-key leakage risk: {forbidden}'

# Every explicit guide must contain at least five human-readable steps.
for key in all_keys:
    block = re.search(rf"'{re.escape(key)}': \[(.*?)\n    \]", js, re.S)
    assert block, key
    step_count = len(re.findall(r"^      '", block.group(1), re.M))
    assert step_count >= 5, f'{key} has only {step_count} steps'

print('WORKSHOP GUIDANCE V14 QA PASS')
print('topics=8 stages=52 explicit_step_labels=PASS black_terminal=PASS backend_answers_hidden=PASS responsive=PASS')
