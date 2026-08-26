from pathlib import Path

root = Path(__file__).resolve().parents[1]
html = (root / 'python' / 'workshop.html').read_text(encoding='utf-8')
css = (root / 'python' / 'workshop-layout-v15.css').read_text(encoding='utf-8')
js = (root / 'python' / 'workshop-layout-v15.js').read_text(encoding='utf-8')

required_html = [
    'workshop-stage-nav workshop-stage-rail',
    'workshop-layout-v15.css?v=20260826-layout-v15',
    'workshop-layout-v15.js?v=20260826-layout-v15',
    'id="stageButtons"',
    'id="stageNavTitle"',
    'id="stageNavProgress"',
]
for marker in required_html:
    assert marker in html, f'Missing V15 workshop HTML marker: {marker}'

required_css = [
    'grid-template-columns:minmax(190px,240px) minmax(0,1fr)',
    'flex:0 0 44px',
    '.workshop-nav-button>div{display:none',
    'grid-template-columns:minmax(330px,390px) minmax(0,1fr)',
    'max-height:none!important',
    'overflow:visible!important',
    '@media(max-width:1180px)',
    '@media(max-width:760px)',
    '@media(prefers-reduced-motion:reduce)',
]
for marker in required_css:
    assert marker in css, f'Missing compact layout contract: {marker}'

required_js = [
    "button.setAttribute('aria-label', label)",
    'button.title = label',
    "scrollIntoView({behavior: reduce ? 'auto' : 'smooth'",
    'MutationObserver',
]
for marker in required_js:
    assert marker in js, f'Missing stage rail accessibility behavior: {marker}'

# Preserve the pedagogical and runtime layers that V15 is deliberately not replacing.
for marker in ['workshop-guidance-v14.css', 'workshop-guidance-v14.js', 'workshop-terminal-v12.css', 'workshop-terminal-v12.js']:
    assert marker in html, f'V15 must preserve existing workshop system: {marker}'

print('WORKSHOP LAYOUT V15 QA PASS')
print('compact_stage_rail=PASS two_column_workspace=PASS no_independent_stage_scroll=PASS responsive=PASS accessibility=PASS')
