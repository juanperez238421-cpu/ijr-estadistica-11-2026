from pathlib import Path

root = Path(__file__).resolve().parents[1]
html = (root / 'python' / 'theory.html').read_text(encoding='utf-8')
js = (root / 'python' / 'theory-visual-v9.js').read_text(encoding='utf-8')
css = (root / 'python' / 'operations-visual-v9.css').read_text(encoding='utf-8')
refine = (root / 'python' / 'operations-visual-v9-refine.css').read_text(encoding='utf-8')
data = (root / 'python' / 'course-data-v4.js').read_text(encoding='utf-8')


def require(condition, message):
    if not condition:
        raise AssertionError(message)


# Scope and cache-busted loading.
require('operations-visual-v9.css?v=20260826-v9' in html, 'V9 Operations CSS is not loaded')
require('operations-visual-v9-refine.css?v=20260826-v9b' in html, 'V9 refinement CSS is not loaded')
require('theory-visual-v9.js?v=20260826-v9' in html, 'V9 Operations JS is not loaded')
require("topic!=='operations'" in js, 'V9 enhancement must be scoped to Topic 01 only')
require("cards.length<8" in js and "slice(0,8)" in js, 'All eight Topic 01 figures must be enhanced')

# Preserve the eight original mental models and descriptions in course data.
for diagram_type in [
    'python-colab', 'calculator-notebook', 'colab-anatomy', 'execution-cycle',
    'operator-map', 'top-down', 'error-feedback', 'stats-bridge'
]:
    require(f"type:'{diagram_type}'" in data, f'Missing original diagram contract: {diagram_type}')

for sentence in [
    'Python defines the instructions; Colab provides the notebook interface and sends the cell to a Python runtime.',
    'A calculator returns a direct answer. A notebook preserves values, instructions, intermediate results, explanations and outputs as a reusable process.',
    'Programming is iterative. Write or edit the cell, run it, read the output or error, correct one thing, and run again.',
    'Syntax, name and type errors identify different categories of problems.',
    'The same notebook model scales from one number to variables, lists of observations, repeated procedures and statistical summaries.'
]:
    require(sentence in data, f'Original Topic 01 description changed or missing: {sentence}')

# Figure-by-figure semantic QA against those descriptions.
for token in ['PYTHON', 'COLAB', 'PYTHON RUNTIME', 'run cell', 'defines instructions', 'notebook environment']:
    require(token in js, f'Figure 01 missing language/environment/runtime element: {token}')
for token in ['CALCULATOR', 'Python notebook', '17 + 8', 'result = a + b', 'TEXT / NOTE', 'Explain the reasoning', 'OUTPUT', 'Reusable process']:
    require(token in js, f'Figure 02 missing calculator/notebook element: {token}')
for token in ['notebook title', 'runtime status', 'toolbar', 'text cell', 'code cell', '6 · Run', '7 · output']:
    require(token in js, f'Figure 03 missing Colab anatomy element: {token}')
for token in ['WRITE / EDIT', 'RUN', 'READ', 'CORRECT', 'inspect output or error', '↺ repeat']:
    require(token in js, f'Figure 04 missing feedback-cycle step: {token}')
for token in ["['=','assign'", "['+','add'", "['−','subtract'", "['*','multiply'", "['/','divide'", "['**','power'", "['%','remainder'"]:
    require(token in js, f'Figure 05 missing operator: {token}')
for token in ['a = 17', 'b = 8', 'result = a + b', 'print(result)', 'RUNTIME MEMORY', 'output → 25']:
    require(token in js, f'Figure 06 missing top-down execution element: {token}')
for token in ['SyntaxError', 'NameError', 'TypeError', 'READ', 'IDENTIFY', 'CORRECT', 'RUN AGAIN']:
    require(token in js, f'Figure 07 missing diagnostic element: {token}')
for token in ['one value', 'variables', 'lists', 'many observations', 'compare / decide', 'repeat procedure', 'reuse procedure', 'statistics', 'summaries']:
    require(token in js, f'Figure 08 missing statistics bridge element: {token}')

# Motion, sequencing, scale and accessibility QA.
for animation in [
    'v9-node-focus', 'v9-packet', 'v9-keypress', 'v9-line-reveal', 'v9-anatomy-focus',
    'v9-cycle-travel', 'v9-op-scan', 'v9-code-focus', 'v9-error-scan', 'v9-bridge-fill'
]:
    require(f'@keyframes {animation}' in css, f'Missing animation: {animation}')
require('@keyframes v9-note-reveal' in refine, 'Notebook explanation reveal animation missing')
require('animation-duration:8s' in refine, 'Error categories and diagnostic sequence are not synchronized')
require('min-height:460px' in css, 'Operations figure stage must remain classroom-scale')
require('@media(prefers-reduced-motion:reduce)' in css and '@media(prefers-reduced-motion:reduce)' in refine, 'Reduced-motion accessibility contract missing')
require('@media(max-width:760px)' in css, 'Mobile figure fallback missing')
require('background:#fff' in css and '--v9-ink:#111' in css, 'Minimal black/white visual language changed')

print('Topic 01 Operations V9 visual QA passed: 8/8 figures aligned with descriptions, sequencing, scale and accessibility.')
