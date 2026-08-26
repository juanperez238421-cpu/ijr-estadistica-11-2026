#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HUB = ROOT / 'python'
index = (HUB / 'index.html').read_text(encoding='utf-8')
theory = (HUB / 'theory.html').read_text(encoding='utf-8')
workshop = (HUB / 'workshop.html').read_text(encoding='utf-8')
css = (HUB / 'classroom-visual-v8.css').read_text(encoding='utf-8')
js = (HUB / 'theory-visual-v8.js').read_text(encoding='utf-8')


def require(ok, message):
    if not ok:
        raise AssertionError(message)


# New visual layer must be loaded on all student surfaces.
for page_name, page in [('hub', index), ('theory', theory), ('workshop', workshop)]:
    require('classroom-visual-v8.css' in page, f'{page_name} does not load V8 classroom CSS')
require('theory-visual-v8.js' in theory, 'theory page does not load V8 visual repair script')

# Calculator figure is a real composed diagram rather than the previous text pad.
for marker in ('calc-device-v8', 'calc-display-v8', 'calc-keys-v8', 'notebook-device-v8', 'notebook-run-v8', 'notebook-output-v8'):
    require(marker in js and marker in css, f'calculator/notebook repair missing: {marker}')
require("['7','8','9','÷','4','5','6','+','1','2','3','=']" in js, 'calculator keys are incomplete')

# Colab figure exposes the major interface regions and a visible execution sequence.
for marker in ('colab-shell-v8', 'colab-titlebar-v8', 'colab-runtime-v8', 'colab-menu-v8', 'colab-side-v8', 'colab-codecell-v8', 'colab-run-v8', 'colab-output-v8', 'colab-legend-v8'):
    require(marker in js and marker in css, f'Colab anatomy repair missing: {marker}')
for label in ('+ Code', '+ Text', 'Runtime', 'OUTPUT AREA', 'Connected · Python runtime'):
    require(label in js, f'Colab interface label missing: {label}')

# External brand images have a failure-safe path.
require('resource-logo-fallback-v8' in js and 'logo-failed' in js, 'resource logo fallback behavior missing')
require("img.addEventListener('error'" in js, 'broken image handler missing')
require('tech-mark-v8' in js and 'tech-mark-v8' in css, 'technology diagram fallback marks missing')

# Classroom readability: substantially larger than V7 defaults.
for required in (
    '--classroom-text:18px',
    '.diagram-stage{min-height:390px',
    '.diagram-card h3{font-size:1.62rem',
    '.diagram-card p{font-size:1.06rem',
    '.concept-card p{font-size:1.08rem',
    '.workshop-editor{min-height:460px',
    'font-size:1.18rem',
    '.hub-topic-card{padding:32px;min-height:370px'
):
    require(required in css, f'large classroom sizing contract missing: {required}')

# Animation and accessibility.
for animation in ('v8-key-sequence', 'v8-display-pulse', 'v8-run-press', 'v8-code-reveal', 'v8-output-reveal'):
    require(f'@keyframes {animation}' in css, f'missing animation: {animation}')
require('prefers-reduced-motion:reduce' in css, 'V8 reduced-motion guard missing')
require('MutationObserver' in js, 'visual enhancement must tolerate asynchronous theory rendering')

print('PYTHON HUB VISUAL V8 QA PASS')
print('calculator=PASS colab=PASS logo_fallback=PASS large_text=PASS large_objects=PASS animations=PASS reduced_motion=PASS')
