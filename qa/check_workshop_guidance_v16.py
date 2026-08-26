from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'python' / 'workshop.html').read_text(encoding='utf-8')
css = (ROOT / 'python' / 'workshop-guidance-v16.css').read_text(encoding='utf-8')
v14 = (ROOT / 'python' / 'workshop-guidance-v14.js').read_text(encoding='utf-8')
terminal = (ROOT / 'python' / 'workshop-terminal-v12.css').read_text(encoding='utf-8')

assert 'workshop-guidance-v16.css?v=20260826-guidance-v16' in html, 'V16 stylesheet must be loaded by workshop.html'
assert html.index('workshop-layout-v15.css') < html.index('workshop-guidance-v16.css'), 'V16 must override V15/V14 visual rules'

# Regression: V13 used 32px circular spans and clipped the literal STEP labels.
for required in [
    'li.task-step-v14>span.task-step-label-v14',
    'width:auto!important',
    'height:auto!important',
    'min-width:78px!important',
    'border-radius:4px!important',
    'white-space:nowrap!important',
    "background:#111!important",
    'color:#fff!important',
]:
    assert required in css, f'Missing STEP badge regression fix: {required}'

# Classroom-scale guide and typography.
assert 'grid-template-columns:minmax(420px,480px) minmax(0,1fr)!important' in css
assert 'font-size:1.08rem!important' in css
assert 'min-height:68px!important' in css
assert 'border-left:4px solid #111!important' in css
assert '.task-guide-objective{display:none!important}' in css, 'Duplicate long prompt should be removed from the lateral guide'

# Compact rail remains readable and gains enough width for topic title.
assert 'grid-template-columns:minmax(260px,320px) minmax(0,1fr)!important' in css
assert 'width:46px!important' in css
assert 'height:46px!important' in css

# Responsive and accessibility contracts.
assert '@media(max-width:1180px)' in css
assert '@media(max-width:760px)' in css
assert '@media(prefers-reduced-motion:reduce)' in css

# Explicit hand-authored instructions remain present and terminal contrast remains untouched.
for marker in ["'op-01'", "'type-01'", "'arr-01'", "'logic-01'", "'cond-01'", "'loop-01'", "'fn-01'", "'stat-01'"]:
    assert marker in v14, f'Missing explicit guide: {marker}'
assert '#202124' in terminal and '#e8eaed' in terminal, 'Black executable terminal palette must be preserved'

print('WORKSHOP GUIDANCE V16 QA PASS')
print('step-badge-clipping=FIXED contrast=PASS classroom-size=PASS duplicate-prompt=REMOVED responsive=PASS terminal=PASS')
