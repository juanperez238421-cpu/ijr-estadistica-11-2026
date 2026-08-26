#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HUB = ROOT / 'python'
index = (HUB / 'index.html').read_text(encoding='utf-8')
js = (HUB / 'gated-app.js').read_text(encoding='utf-8')
css = (HUB / 'operations-enrichment.css').read_text(encoding='utf-8')

def require(ok, msg):
    if not ok:
        raise AssertionError(msg)

require('operations-enrichment.css' in index, 'Topic 01 visual CSS not loaded')
require('operations-enrichment.js' not in index, 'Legacy Topic 01 DOM injector must not be loaded')
require('gated-app.js?v=20260826-topic01-v6' in index, 'Topic 01 V6 app is not cache-busted')

for term in (
    'What are Python and Google Colab?',
    '<strong>Python</strong> is a programming language',
    '<strong>Google Colab</strong> is a browser-based notebook environment',
    'CALCULATOR VS PYTHON / COLAB',
    'ANATOMY OF A COLAB CELL',
    'THE PROGRAMMING FEEDBACK LOOP',
    'WHY THIS MATTERS FOR STATISTICS',
    'Workshop rule · 10 required stages',
):
    require(term in js, f'Missing native Topic 01 theory block: {term}')

for n in range(1, 11):
    require(f"key:'op-{n:02d}'" in js, f'Missing Topic 01 workshop stage op-{n:02d}')

for n in (1, 2, 3, 4, 7, 8, 9, 10):
    key = f"key:'op-{n:02d}'"
    start = js.index(key)
    window = js[start:start + 1400]
    require("mode:'code',code:''" in window, f'op-{n:02d} must start with a blank student code cell')

require('all ten required stages' in js.lower(), 'Topic 01 intro must explicitly require 10 stages')
require("topic.slug === 'operations'" in js, 'Native Topic 01 rendering condition missing')
require("resetLabel = blankStart ? 'Clear cell' : 'Reset'" in js, 'Blank-cell Clear control missing')
require("editor.value=topic.slug==='operations'?'':ex.code" in js, 'Operations reset must clear instead of restore code')
require('No starter solution is provided' in js, 'Blank-cell explanation missing')
require('Minimal Python notebook icon' in js, 'Topic logo missing')

for animation in ('op-draw','op-scan','op-code-grow','op-output','op-display','op-process'):
    require(animation in css, f'Missing animation: {animation}')
require('prefers-reduced-motion' in css, 'Reduced motion support missing')

print('TOPIC 01 V6 QA PASS: native theory + animations + 10-stage blank-cell workshop')
