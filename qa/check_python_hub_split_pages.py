#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HUB = ROOT / 'python'
index = (HUB / 'index.html').read_text(encoding='utf-8')
theory = (HUB / 'theory.html').read_text(encoding='utf-8')
workshop = (HUB / 'workshop.html').read_text(encoding='utf-8')
data = (HUB / 'course-data-v4.js').read_text(encoding='utf-8')
hub_js = (HUB / 'hub-router.js').read_text(encoding='utf-8')
theory_js = (HUB / 'theory-page.js').read_text(encoding='utf-8')
workshop_js = (HUB / 'workshop-page.js').read_text(encoding='utf-8')
css = (HUB / 'split-layout.css').read_text(encoding='utf-8')


def require(ok, message):
    if not ok:
        raise AssertionError(message)


# Two-page architecture.
for required in ('course-data-v4.js', 'hub-router.js', 'split-layout.css'):
    require(required in index, f'hub missing {required}')
require('theory-page.js' in theory and 'course-data-v4.js' in theory, 'dedicated theory page missing')
require('workshop-page.js' in workshop and 'pyodide/v0.27.7' in workshop, 'dedicated workshop page missing')
require('Theory' in hub_js and 'Workshop' in hub_js, 'hub cards must expose Theory and Workshop actions')
require('theory.html?topic=' in hub_js and 'workshop.html?topic=' in hub_js, 'topic routes missing')

# All topics share the split architecture.
slugs = ('operations','types','arrays','logic','conditions','loops','functions','statistics')
for slug in slugs:
    require(f"slug:'{slug}'" in data or f"slug: '{slug}'" in data, f'missing topic data: {slug}')
require(len(re.findall(r"slug\s*:\s*['\"]", data)) == 8, 'expected exactly eight topic definitions')

# Rich Topic 01 theory.
for phrase in (
    'What is Python?', 'What is Google Colab?', 'Language vs environment',
    'Calculator vs notebook', 'Code cells and execution order',
    'Outputs and errors are feedback', 'Why this matters for statistics'
):
    require(phrase in data, f'missing Topic 01 theory: {phrase}')
for official in (
    'https://www.python.org/', 'https://docs.python.org/3/',
    'https://colab.research.google.com/', 'https://research.google.com/colaboratory/faq.html'
):
    require(official in data, f'missing official resource: {official}')
require('python-logo' in data and 'colab_favicon_256px.png' in data, 'Python/Colab logos missing')

# Diagram density and descriptions.
operations_block = data.split("slug: 'operations'", 1)[1].split("slug:'types'", 1)[0]
require(operations_block.count("description:") >= 8, 'Topic 01 must have at least eight described diagrams')
for diagram_type in ('python-colab','calculator-notebook','colab-anatomy','execution-cycle','operator-map','top-down','error-feedback','stats-bridge'):
    require(diagram_type in data and diagram_type in theory_js, f'missing Topic 01 diagram: {diagram_type}')
for slug in slugs[1:]:
    # Every later topic has multiple diagram descriptions in the shared data.
    start = data.find(f"slug:'{slug}'")
    if start < 0:
        start = data.find(f"slug: '{slug}'")
    next_positions = [p for p in (data.find(f"slug:'{s}'", start+1) for s in slugs) if p > start]
    end = min(next_positions) if next_positions else len(data)
    require(data[start:end].count('description:') >= 3, f'{slug} needs at least three described diagrams')

# Workshop contract: 10 Topic 01 stages and blank student-authored code.
for i in range(1, 11):
    require(f"op-{i:02d}" in data, f'missing operations workshop stage {i}')
for match in re.finditer(r"\{key:'op-\d{2}'.*?\}", data):
    block = match.group(0)
    if "mode:'code'" in block:
        require("code:''" in block, 'Topic 01 coding stages must start blank')
require('Blank-cell challenge' in workshop_js, 'blank-cell workshop guidance missing')
require("topic.slug==='operations'?'':(ex.code||'')" in workshop_js, 'clear-cell behavior missing')
require('Validate output' in workshop_js and 'runPythonAsync' in workshop_js, 'workshop execution/validation missing')
require('Expected answers remain on the course backend' in workshop_js, 'server-only answer-key message missing')

# Progress and locking preserved.
for fragment in ('p.status===\'locked\'', 'p.percent', 'correct_count', 'total_count'):
    require(fragment in hub_js or fragment in workshop_js or fragment in theory_js, f'progress contract missing: {fragment}')
require('Workshop mastery' in theory_js and 'Workshop mastery' in workshop_js, 'percent progress display missing')
require('prefers-reduced-motion' in css, 'reduced-motion support missing')
for animation in ('split-scan','split-pulse','split-grow','split-output','split-soft-pop'):
    require(animation in css, f'missing theory animation: {animation}')

# No answer keys embedded in new client data.
require('expected_text' not in data and 'expected:' not in data, 'client must not contain answer keys')

print('PYTHON HUB SPLIT V7 QA PASS')
print('topics=8 split_pages=PASS topic01_diagrams>=8 later_diagrams>=3 operations_stages=10 blank_cells=PASS official_resources=PASS progress=PASS animations=PASS')
