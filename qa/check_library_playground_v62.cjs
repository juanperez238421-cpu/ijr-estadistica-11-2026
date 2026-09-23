'use strict';

const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('python/theory.html', 'utf8');
const js = fs.readFileSync('python/library-playground-v62.js', 'utf8');
const css = fs.readFileSync('python/library-playground-v62.css', 'utf8');

assert(html.includes('library-playground-v62.css?v=20260922-v62'), 'Theory page must load V62 playground CSS.');
assert(html.includes('library-playground-v62.js?v=20260922-v62'), 'Theory page must load V62 playground JS.');
assert(!html.includes('library-playground-v61.js?v=20260922-v61'), 'Theory page must not execute the old V61 playground beside V62.');

assert(js.includes("const VERSION = 'v62'"), 'V62 version marker missing.');
assert(js.includes('pyodide/v0.27.7/full/'), 'Playground must keep the pinned Pyodide runtime.');
assert(js.includes('runtime.loadPackage(packageName)'), 'External libraries must still load through Pyodide.');
assert(js.includes('runPythonAsync'), 'Playground must execute real Python.');

for (const token of [
  'import math',
  'import statistics',
  'import numpy as np',
  'import pandas as pd',
  'import matplotlib.pyplot as plt'
]) {
  assert(js.includes(token), 'Missing real library example: ' + token);
}

// Preserve the original calculation examples rather than replacing them with visual-only demos.
for (const token of [
  'area = math.pi * radius ** 2',
  'statistics.mean(scores)',
  'values.mean()',
  'df["score"].mean()'
]) {
  assert(js.includes(token), 'Original V61 calculation example regressed: ' + token);
}

for (const id of [
  'libraryPlaygroundV62',
  'lp62Editor',
  'lp62RunButton',
  'lp62PlotButton',
  'lp62Output',
  'lp62FigurePanel',
  'lp62Figure'
]) {
  assert(js.includes(id), 'Playground missing ' + id + '.');
}

for (const token of [
  'matplotlib',
  'savefig',
  'io.BytesIO()',
  'base64.b64encode',
  'data:image/png;base64,',
  'plt.close("all")'
]) {
  assert(js.includes(token), 'Real plot rendering contract missing: ' + token);
}

assert(js.includes('Try plot example'), 'Students need an explicit plot-example action.');
assert(js.includes('Pandas DataFrame → chart'), 'Pandas plot example missing.');
assert(js.includes('NumPy-generated damped signal'), 'NumPy plot example missing.');
assert(js.includes('Distribution of scores'), 'Statistics plot example missing.');
assert(js.includes('math.sin(x)'), 'math plot example missing.');
assert(js.includes('Monthly visits'), 'Matplotlib main example missing.');

assert(css.includes('.lp62-figure-stage img') && css.includes('max-width:100%'), 'Plot output must be responsive.');
assert(css.includes('@media(max-width:520px)'), 'Mobile layout contract missing.');
assert(!js.includes('service_role') && !js.includes('sb_secret_'), 'Playground must not expose privileged secrets.');
assert(!/https?:\/\/[^'"]+\.(png|jpg|jpeg|webp)/i.test(js), 'Plot output must not be a pre-rendered remote image.');

console.log('LIBRARY PLAYGROUND V62 CONTRACT PASS');
console.log('original_examples=PASS matplotlib=REAL plot_capture=PNG math_plot=PASS statistics_plot=PASS numpy_plot=PASS pandas_plot=PASS responsive=PASS');