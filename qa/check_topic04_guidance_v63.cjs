'use strict';

const fs = require('fs');
const assert = require('assert');

const workshop = fs.readFileSync('python/workshop.html', 'utf8');
const runtime = fs.readFileSync('python/workshop-v42.js', 'utf8');
const xlsx = fs.readFileSync('python/workshop-xlsx-topic-v46.js', 'utf8');
const overlay = fs.readFileSync('python/workshop-topic04-guidance-v63.js', 'utf8');
const css = fs.readFileSync('python/workshop-topic04-guidance-v63.css', 'utf8');

assert(workshop.includes('workshop-topic04-guidance-v63.css?v=20260922-v63'), 'Workshop must load V63 guidance CSS.');
assert(workshop.includes('workshop-topic04-guidance-v63.js?v=20260922-v63'), 'Workshop must load V63 guidance JS.');
assert(workshop.includes('workshop-v42.js?v=20260922-v63'), 'Workshop runtime cache key must expose the V63 guide update.');
assert(workshop.includes('workshop-xlsx-topic-v46.js?v=20260922-v63'), 'Topic 04 XLSX overlay cache key must expose the V63 concept-preservation update.');

for (let stage = 1; stage <= 12; stage += 1) {
  const key = 'logic-' + String(stage).padStart(2, '0');
  assert(runtime.includes("'" + key + "'"), 'Missing explicit runtime guidance for ' + key);
  assert(overlay.includes(stage + ': {'), 'Missing V63 visual scaffold for Stage ' + stage);
}

for (const token of [
  'import math',
  'root = math.sqrt(81)',
  'import statistics',
  'values = [72, 86, 91]',
  'from pathlib import Path',
  'file = Path("pandas_excel_students.xlsx")',
  'from openpyxl import load_workbook',
  'wb = load_workbook("pandas_excel_students.xlsx")',
  'ws = wb["Students"]',
  'from openpyxl import Workbook',
  'output_file = Path("xlsx_library_output.xlsx")',
  'import pandas as pd',
  'df = pd.read_excel("pandas_excel_students.xlsx", sheet_name="Students")',
  'scores = df["score"]',
  'filtered = df.loc[df["score"] >= 90]',
  'df["passed"] = df["score"] >= 70',
  'filtered.to_excel("pandas_analysis_output.xlsx", index=False)'
]) {
  assert(runtime.includes(token), 'Explicit code construction token missing: ' + token);
}

for (const token of [
  'Use these exact names',
  'Follow this flow',
  'Check before Validate',
  'EXPECTED OUTPUT',
  'Common mistake:',
  'v63-flow-node',
  'v63-name-chip'
]) {
  assert(overlay.includes(token) || css.includes(token), 'V63 scaffold contract missing: ' + token);
}

assert(xlsx.includes('if (concept && !concept.textContent.trim())'), 'XLSX overlay must preserve stage-specific concepts from workshop-v42.');
assert(css.includes('.v63-check-grid') && css.includes('@media(max-width:620px)'), 'V63 responsive guide styling missing.');
assert(!runtime.includes('service_role') && !overlay.includes('service_role'), 'Guidance must not expose privileged secrets.');

console.log('TOPIC 04 EXPLICIT GUIDANCE V63 CONTRACT PASS');
console.log('12_stages=PASS exact_names=PASS exact_lines=PASS flowcharts=PASS expected_output=PASS common_mistakes=PASS');