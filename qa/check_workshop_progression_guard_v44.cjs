const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'python/workshop.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'python/workshop-progression-guard-v44.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'python/workshop-progression-guard-v44.css'), 'utf8');

function requireContract(condition, message) {
  if (!condition) throw new Error(message);
}

requireContract(/workshop-progression-guard-v44\.js/.test(html), 'Production workshop does not load the V44 progression guard.');
requireContract(/workshop-progression-guard-v44\.css/.test(html), 'Production workshop does not load V44 lock styling.');
requireContract(/stage-complete/.test(js), 'Guard must derive progression from server-backed validated stage state.');
requireContract(/nextButton\.disabled\s*=\s*atLastStage\s*\|\|\s*!currentValidated/.test(js), 'Next must remain disabled until the active stage is validated.');
requireContract(/targetIndex\s*>\s*firstIncomplete/.test(js), 'Future stage navigation is not blocked.');
requireContract(/stopImmediatePropagation/.test(js), 'Guard must intercept unsafe navigation before the base workshop handler.');
requireContract(/course backend confirms the consolidated expected output/.test(js), 'Lock message must explain backend expected-output validation.');
requireContract(/progression-locked/.test(css), 'Locked stages have no visible lock state.');

console.log('WORKSHOP PROGRESSION GUARD V44 CONTRACT PASS');
