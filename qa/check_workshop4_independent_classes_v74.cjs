'use strict';

// Regression: Topic 04 Class 2 opens at stage 07 even with Class 1 incomplete.
// The other 15 workshops retain the strict progression guard.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('python/workshop-progression-guard-v44.js', 'utf8');
const html = fs.readFileSync('python/workshop.html', 'utf8');
assert.match(html, /workshop-progression-guard-v44\.js\?v=20261028-topic04-independent-v74/);

function scenario(topic) {
  let mutation = () => {};
  const frames = [], listeners = {};
  function classes(...initial) {
    const names = new Set(initial);
    return {
      contains: name => names.has(name),
      add: name => names.add(name),
      toggle: (name, on) => on ? names.add(name) : names.delete(name)
    };
  }
  const buttons = Array.from({ length: 12 }, (_, i) => ({
    classList: classes('stage-button', ...(i === 0 ? ['active'] : [])),
    disabled: false, title: '',
    setAttribute(name, value) { this[name] = value; },
    removeAttribute(name) { delete this[name]; }
  }));
  const stageList = {
    querySelectorAll: () => buttons,
    addEventListener: (name, listener) => { listeners[name] = listener; }
  };
  const next = {
    disabled: true, title: '', classList: classes(),
    setAttribute(name, value) { this[name] = value; },
    addEventListener: (name, listener) => { listeners['next-' + name] = listener; }
  };
  const document = {
    getElementById: id => ({ stageList, nextButton: next, saveMessage: { textContent: '' } })[id],
    documentElement: { dataset: {} },
    addEventListener() {}
  };
  const window = { location: { search: '?topic=' + topic }, addEventListener() {} };
  class Observer { constructor(callback) { mutation = callback; } observe() {} }
  vm.runInNewContext(source, {
    document, window, URLSearchParams,
    MutationObserver: Observer, requestAnimationFrame: fn => frames.push(fn)
  }, { filename: 'workshop-progression-guard-v44.js' });
  function sync() { mutation(); while (frames.length) frames.shift()(); }
  function validate(i) { buttons[i].classList.add('stage-complete'); sync(); }
  function activate(i) {
    buttons.forEach((b, index) => b.classList.toggle('active', index === i));
    sync();
  }
  function click(i) {
    const event = {
      target: { closest: () => buttons[i] }, prevented: false,
      preventDefault() { this.prevented = true; },
      stopImmediatePropagation() { this.prevented = true; }
    };
    listeners.click(event);
    return !event.prevented;
  }
  sync();
  assert.equal(buttons[0].disabled, false);
  assert.equal(buttons[1].disabled, true);
  if (topic === 'logic') {
    assert.equal(buttons[6].disabled, false, 'Stage 07 opens without Class 1');
    assert.equal(click(6), true, 'Stage 07 sidebar navigation is permitted');
    assert.equal(buttons[7].disabled, true, 'Stage 08 requires Stage 07');
    assert.equal(click(7), false, 'Skipping Stage 07 is prevented');
    validate(6);
    assert.equal(buttons[7].disabled, false, 'Stage 08 unlocks independently');
    assert.equal(buttons[8].disabled, true, 'Stage 09 remains gated');
    activate(6);
    assert.equal(next.disabled, false, 'Next works inside Class 2');
    for (let i = 7; i < 12; i++) validate(i);
    assert.equal(buttons[11].disabled, false, 'Class 2 can finish with Class 1 empty');
    activate(5);
    assert.equal(next.disabled, false, 'Stage 06 can jump to Stage 07');
    const event = {
      prevented: false,
      preventDefault() { this.prevented = true; },
      stopImmediatePropagation() { this.prevented = true; }
    };
    listeners['next-click'](event);
    assert.equal(event.prevented, false);
  } else {
    assert.equal(buttons[6].disabled, true, 'Other topics retain sequential gating');
    assert.equal(click(6), false);
    activate(5);
    assert.equal(next.disabled, true);
    for (let i = 0; i < 6; i++) validate(i);
    assert.equal(buttons[6].disabled, false);
  }
}

for (const topic of ['logic', 'arrays', 'types', 'operations']) scenario(topic);
console.log('STATISTICS 11 WORKSHOP 4 INDEPENDENT CLASSES V74 PASS (4 topics)');
