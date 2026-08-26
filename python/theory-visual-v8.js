(() => {
  'use strict';

  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));

  function calculatorNotebookMarkup(){
    const keys=['7','8','9','÷','4','5','6','+','1','2','3','='];
    return `
      <div class="compare-visual-v8" aria-label="Calculator compared with a Python notebook">
        <div class="calc-device-v8">
          <div class="calc-brand-v8">CALCULATOR</div>
          <div class="calc-display-v8"><small>17 + 8</small><strong>25</strong></div>
          <div class="calc-keys-v8" aria-hidden="true">${keys.map(key=>`<span class="calc-key-v8">${key}</span>`).join('')}</div>
          <div class="calc-note-v8"><strong>Direct result.</strong> The device answers the current calculation, but it does not naturally preserve a reusable analysis workflow.</div>
        </div>
        <div class="compare-vs-v8">VS</div>
        <div class="notebook-device-v8">
          <div class="notebook-top-v8"><strong>Python notebook</strong><span class="notebook-connected-v8">runtime ready</span></div>
          <div class="notebook-cell-v8">
            <span class="notebook-run-v8" aria-hidden="true">▶</span>
            <div class="notebook-code-v8">
              <span>a = 17</span>
              <span>b = 8</span>
              <span>result = a + b</span>
              <span>print(result)</span>
            </div>
          </div>
          <div class="notebook-output-v8"><span>Output</span><strong>25</strong></div>
          <div class="notebook-process-v8"><strong>Reusable process:</strong> values → variables → operation → output → later reuse with new data.</div>
        </div>
      </div>`;
  }

  function colabMarkup(){
    return `
      <div class="colab-shell-v8" aria-label="Diagram of the main parts of a Google Colab notebook">
        <div class="colab-titlebar-v8"><strong>Statistics11_Intro.ipynb</strong><span class="colab-runtime-v8">Connected · Python runtime</span></div>
        <div class="colab-menu-v8"><span>File</span><span>Edit</span><span>View</span><span>Insert</span><span>Runtime</span><span>Tools</span><span>Help</span></div>
        <div class="colab-body-v8">
          <aside class="colab-side-v8" aria-label="Notebook insertion controls"><span>+ Code</span><span>+ Text</span><span>Files</span></aside>
          <div class="colab-canvas-v8">
            <div class="colab-text-v8"><strong>Text / Markdown cell</strong><br>Use text to explain the purpose, interpretation or steps of the analysis.</div>
            <div class="colab-codecell-v8">
              <button class="colab-run-v8" type="button" tabindex="-1" aria-label="Run code cell">▶</button>
              <div class="colab-code-lines-v8">
                <span><b>1</b><code>a = 17</code></span>
                <span><b>2</b><code>b = 8</code></span>
                <span><b>3</b><code>print(a + b)</code></span>
              </div>
            </div>
            <div class="colab-output-v8"><small>OUTPUT AREA</small><strong>25</strong></div>
            <div class="colab-legend-v8"><span>Notebook title</span><span>Runtime status</span><span>Code cell</span><span>Run control</span><span>Output</span><span>Text cell</span></div>
          </div>
        </div>
      </div>`;
  }

  function resilientTechnologyFlow(root){
    const flow=$('.brand-flow',root);
    if(!flow || flow.dataset.visualV8) return;
    flow.dataset.visualV8='true';
    flow.innerHTML=`
      <div class="brand-node"><span class="tech-mark-v8" aria-hidden="true">Py</span><strong>PYTHON</strong><small>programming language</small></div>
      <i></i>
      <div class="brand-node colab-node"><span class="tech-mark-v8" aria-hidden="true">Co</span><strong>COLAB</strong><small>notebook environment</small></div>
      <i></i>
      <div class="brand-node"><span class="runtime-dot">●</span><strong>RUNTIME</strong><small>executes Python</small></div>`;
  }

  function repairResourceLogos(){
    $$('.resource-card').forEach(card=>{
      if(card.dataset.logoV8) return;
      const img=$('img',card); if(!img) return;
      card.dataset.logoV8='true';
      const name=(img.alt||'').toLowerCase().includes('colab')?'CO':'PY';
      const wrap=document.createElement('span');
      wrap.className='resource-logo-wrap-v8';
      img.parentNode.insertBefore(wrap,img);
      wrap.appendChild(img);
      const fallback=document.createElement('span');
      fallback.className='resource-logo-fallback-v8';
      fallback.textContent=name;
      fallback.setAttribute('aria-hidden','true');
      wrap.appendChild(fallback);
      const fail=()=>wrap.classList.add('logo-failed');
      img.addEventListener('error',fail,{once:true});
      if(img.complete && img.naturalWidth===0) fail();
    });
  }

  function enhanceDiagrams(){
    const grid=document.getElementById('diagramGrid');
    if(!grid) return;
    const compare=$('.compare-visual',grid);
    if(compare && !compare.dataset.visualV8){ compare.dataset.visualV8='true'; compare.outerHTML=calculatorNotebookMarkup(); }
    const colab=$('.colab-wireframe',grid);
    if(colab && !colab.dataset.visualV8){ colab.dataset.visualV8='true'; colab.innerHTML=colabMarkup(); }
    resilientTechnologyFlow(grid);
    repairResourceLogos();
  }

  function install(){
    const grid=document.getElementById('diagramGrid');
    const resource=document.getElementById('resourceSection');
    if(!grid) return;
    const observer=new MutationObserver(()=>enhanceDiagrams());
    observer.observe(grid,{childList:true,subtree:true});
    if(resource) observer.observe(resource,{childList:true,subtree:true});
    enhanceDiagrams();
  }

  document.addEventListener('DOMContentLoaded',install);
})();
