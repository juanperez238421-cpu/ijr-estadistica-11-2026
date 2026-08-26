#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HUB = ROOT / 'python'
index = (HUB / 'index.html').read_text(encoding='utf-8')
js = (HUB / 'operations-enrichment.js').read_text(encoding='utf-8')
css = (HUB / 'operations-enrichment.css').read_text(encoding='utf-8')

def require(ok, msg):
    if not ok:
        raise AssertionError(msg)

require('operations-enrichment.js' in index, 'Topic 01 JS not loaded')
require('operations-enrichment.css' in index, 'Topic 01 CSS not loaded')
for term in ('What are Python and Google Colab?', '<strong>Python</strong> is a programming language', 'CALCULATOR VS PYTHON / COLAB', 'ANATOMY OF A COLAB CELL', 'WHY THIS MATTERS FOR STATISTICS'):
    require(term in js, f'Missing theory block: {term}')
for stage in range(1, 7):
    require(f'{stage}:' in js, f'Missing explicit stage instructions: {stage}')
require("editor.value = draft" in js and "drafts[String(stage)] ?? ''" in js, 'Blank-cell workflow missing')
require("editor.value = ''" in js, 'Clear-cell behavior missing')
require('stopImmediatePropagation' in js, 'Reset must not restore starter solution')
require('sessionStorage' in js, 'Student-authored draft preservation missing')
require('No solution or starter code is provided' in js, 'Blank-cell explanation missing')
for animation in ('op-draw','op-scan','op-code-grow','op-output','op-display','op-process'):
    require(animation in css, f'Missing animation: {animation}')
require('prefers-reduced-motion' in css, 'Reduced motion support missing')
require('Minimal Python notebook icon' in js, 'Topic logo missing')
print('TOPIC 01 QA PASS: expanded theory + animations + blank-cell student coding')
