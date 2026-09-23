'use strict';

const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('python/theory.html', 'utf8');
const js = fs.readFileSync('python/library-playground-v61.js', 'utf8');
const css = fs.readFileSync('python/library-playground-v61.css', 'utf8');

assert(html.includes('library-playground-v61.css?v=20260922-v61'), 'Theory page must load V61 playground CSS.');
assert(html.includes('library-playground-v61.js?v=20260922-v61'), 'Theory page must load V61 playground JS.');
assert(js.includes('pyodide/v0.27.7/full/'), 'Playground must use the pinned Pyodide runtime.');
assert(js.includes('runtime.loadPackage(item.package)'), 'External libraries must be loaded through Pyodide package loading.');
for (const token of ['import math','import statistics','import numpy as np','import pandas as pd']) {
  assert(js.includes(token), 'Missing real library example: ' + token);
}
for (const id of ['libraryPlaygroundV61','lp61Editor','lp61RunButton','lp61LoadButton','lp61Output']) {
  assert(js.includes(id), 'Playground missing ' + id + '.');
}
assert(js.includes('runPythonAsync'), 'Playground must execute real Python, not simulated output.');
assert(css.includes('.lp61-shell') && css.includes('.lp61-cell'), 'Playground styling contract missing.');
assert(!js.includes('service_role') && !js.includes('sb_secret_'), 'Playground must not expose privileged secrets.');

console.log('LIBRARY PLAYGROUND V61 CONTRACT PASS');
console.log('math=PASS statistics=PASS numpy=PASS pandas=PASS real_pyodide=PASS');