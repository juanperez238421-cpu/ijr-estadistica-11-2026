(() => {
  'use strict';

  const PYODIDE_INDEX = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
  const state = { pyodide:null, promise:null, count:0 };

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function ensureRuntime(statusEl) {
    if (state.pyodide) return state.pyodide;
    if (state.promise) return state.promise;
    state.promise = (async () => {
      try {
        if (statusEl) statusEl.textContent = 'Loading Python…';
        if (typeof window.loadPyodide !== 'function') throw new Error('Pyodide did not load.');
        const py = await window.loadPyodide({ indexURL: PYODIDE_INDEX });
        state.pyodide = py;
        if (statusEl) statusEl.textContent = 'Python ready';
        return py;
      } catch (error) {
        state.promise = null;
        if (statusEl) statusEl.textContent = 'Python unavailable';
        throw error;
      }
    })();
    return state.promise;
  }

  async function execute(source, outputEl, statusEl) {
    const command = String(source ?? '').trim();
    if (!command) return;
    const py = await ensureRuntime(statusEl);
    const stdout = [];
    const stderr = [];
    py.setStdout({ batched: text => stdout.push(String(text)) });
    py.setStderr({ batched: text => stderr.push(String(text)) });
    let result;
    try {
      result = await py.runPythonAsync(command);
      if (result !== undefined && result !== null) {
        const text = String(result);
        if (text !== 'None') stdout.push(text);
        if (typeof result.destroy === 'function') result.destroy();
      }
    } catch (error) {
      stderr.push(String(error?.message || error));
    }
    state.count += 1;
    const lines = [`In [${state.count}]: ${command}`];
    if (stdout.length) lines.push(stdout.join('\n'));
    if (stderr.length) lines.push(`ERROR\n${stderr.join('\n')}`);
    outputEl.textContent += `${outputEl.textContent && !outputEl.textContent.endsWith('\n') ? '\n' : ''}${lines.join('\n')}\n`;
    outputEl.scrollTop = outputEl.scrollHeight;
    if (statusEl) statusEl.textContent = stderr.length ? 'Python error' : 'Python ready';
  }

  function universalTerminalMarkup() {
    return `<section class="colab-console black-python-terminal universal-terminal-v12" aria-label="Executable Python terminal">
      <div class="colab-console-head">
        <span><span class="terminal-live-dot" aria-hidden="true"></span> Python terminal <small>· executable scratchpad</small></span>
        <div class="terminal-head-actions"><span class="terminal-runtime-status">Python runtime</span><button class="terminal-clear-v12" type="button">Clear</button></div>
      </div>
      <pre class="colab-console-output terminal-output-v12" aria-live="polite">Python console ready. Use the >>> prompt to test Python commands.\n</pre>
      <form class="colab-console-input terminal-form-v12">
        <span class="colab-console-prompt">&gt;&gt;&gt;</span>
        <input class="terminal-command-v12" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type a Python command">
        <button type="submit">Run</button>
      </form>
      <div class="colab-terminal-note">This black terminal is available in every workshop stage. It runs real Python in the browser. Scratch commands do not validate a multiple-choice answer automatically.</div>
    </section>`;
  }

  function bindUniversalTerminal(root) {
    const form = root.querySelector('.terminal-form-v12');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';
    const input = root.querySelector('.terminal-command-v12');
    const output = root.querySelector('.terminal-output-v12');
    const status = root.querySelector('.terminal-runtime-status');
    const clear = root.querySelector('.terminal-clear-v12');
    clear?.addEventListener('click', () => { output.textContent = 'Python console ready.\n'; });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const command = input.value.trim();
      if (!command) return;
      input.value = '';
      try { await execute(command, output, status); }
      catch (error) {
        output.textContent += `Runtime error: ${error?.message || error}\n`;
        if (status) status.textContent = 'Python unavailable';
      }
      input.focus();
    });
  }

  function enhanceExistingTerminal(consoleEl) {
    consoleEl.classList.add('black-python-terminal');
    const head = consoleEl.querySelector('.colab-console-head');
    if (head && !head.querySelector('.terminal-live-dot')) {
      const first = head.querySelector('span');
      if (first) first.innerHTML = `<span class="terminal-live-dot" aria-hidden="true"></span> ${escapeHtml(first.textContent.trim())}`;
    }
  }

  function apply() {
    const mount = document.getElementById('stageMount');
    if (!mount) return;
    const existing = mount.querySelector('.colab-console');
    if (existing) {
      enhanceExistingTerminal(existing);
      return;
    }
    const choice = mount.querySelector('.choice-workspace');
    if (!choice) return;
    choice.insertAdjacentHTML('beforeend', universalTerminalMarkup());
    bindUniversalTerminal(choice);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const mount = document.getElementById('stageMount');
    if (!mount) return;
    apply();
    const observer = new MutationObserver(() => queueMicrotask(apply));
    observer.observe(mount, { childList:true, subtree:true });
  });
})();
