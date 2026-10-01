const assert = require('node:assert/strict');
const fs = require('node:fs');

const app = fs.readFileSync('python/evaluation-modules-1-3/app.js','utf8');

function mustInclude(fragment,label){
  assert.ok(app.includes(fragment), label + ' contract missing');
}

mustInclude("['copy','cut','paste'].forEach", 'clipboard event blocker');
mustInclude("e.preventDefault();", 'preventDefault');
mustInclude("key==='c'||key==='x'||key==='v'", 'Ctrl/Cmd C-X-V blocker');
mustInclude("COPY_SHORTCUT_ATTEMPT", 'copy shortcut audit');
mustInclude("CUT_SHORTCUT_ATTEMPT", 'cut shortcut audit');
mustInclude("PASTE_SHORTCUT_ATTEMPT", 'paste shortcut audit');
mustInclude("SCREENSHOT_KEY_ATTEMPT", 'PrintScreen audit');
mustInclude("SCREENSHOT_SHORTCUT_ATTEMPT", 'macOS screenshot shortcut audit');
mustInclude("FULLSCREEN_EXIT", 'fullscreen exit audit');
mustInclude("VISIBILITY_HIDDEN_CONFIRMED", 'confirmed tab/window exit audit');
mustInclude("SECOND_TAB_DETECTED", 'duplicate tab audit');
mustInclude("CONTEXT_MENU", 'context-menu blocker');
mustInclude("PRINT_SHORTCUT", 'print shortcut blocker');

const shortcutBlock = app.slice(
  app.indexOf("document.addEventListener('keydown'"),
  app.indexOf("window.addEventListener('pagehide'")
);
assert.ok(shortcutBlock.includes("modified=e.ctrlKey||e.metaKey"), 'Ctrl/Cmd modifier normalization missing');
assert.ok(shortcutBlock.includes("e.preventDefault()"), 'restricted shortcuts are not actively blocked');
assert.ok(shortcutBlock.includes("return;"), 'restricted shortcut handler should terminate after blocking');

console.log('STATISTICS 11 EVALUATION INTEGRITY CLIENT V71 PASS');
