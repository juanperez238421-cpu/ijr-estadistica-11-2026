(() => {
  'use strict';
  const topic=new URLSearchParams(location.search).get('topic')||'operations';
  if(topic!=='operations') return;

  const ops=[
`<div class="v9-flow3" aria-label="Python language to Colab notebook to Python runtime"><div class="v9-node" style="--d:0s"><b class="v9-mark">Py</b><strong>PYTHON</strong><small>defines instructions</small><code>x = 17 + 8</code></div><div class="v9-arrow"><i></i><span style="--d:1.1s">instructions</span></div><div class="v9-node" style="--d:2.2s"><b class="v9-mark">Co</b><strong>COLAB</strong><small>notebook environment</small><div class="v9-cell"><b>▶</b><code>x = 17 + 8</code></div></div><div class="v9-arrow"><i></i><span style="--d:3.3s">run cell</span></div><div class="v9-node" style="--d:4.4s"><b class="v9-runtime">●</b><strong>PYTHON RUNTIME</strong><small>executes the cell</small><code>execution</code></div></div>`,

`<div class="v9-compare"><div class="v9-calc"><strong>CALCULATOR</strong><div class="v9-display"><small>17 + 8</small><b>25</b></div><div class="v9-keys"><span style="--d:.4s">7</span><span style="--d:1.6s">8</span><span>9</span><span style="--d:1s">+</span><span>4</span><span>5</span><span>6</span><span>−</span><span style="--d:0s">1</span><span>2</span><span>3</span><span style="--d:2.2s">=</span></div><p><b>Direct result.</b> One calculation → one answer.</p></div><div class="v9-vs">VS</div><div class="v9-book"><div class="v9-bookbar"><b>Python notebook</b><span>● runtime ready</span></div><div class="v9-bookcell"><b class="v9-run">▶</b><div><code style="--d:.3s">a = 17</code><code style="--d:.8s">b = 8</code><code style="--d:1.3s">result = a + b</code><code style="--d:1.8s">print(result)</code></div></div><div class="v9-bookout"><small>OUTPUT</small><b>25</b></div><div class="v9-reuse"><b>Reusable process</b><span>values → variables → operation → output → reuse</span></div></div></div>`,

`<div class="v9-colab" aria-label="Anatomy of a Google Colab notebook"><div class="v9-colab-title v9-focus" style="--d:0s"><b>Statistics11_Intro.ipynb</b><em>1 · notebook title</em></div><div class="v9-colab-status v9-focus" style="--d:1s"><span>● Connected · Python runtime</span><em>2 · runtime status</em></div><div class="v9-colab-menu v9-focus" style="--d:2s"><span>File</span><span>Edit</span><span>View</span><span>Insert</span><span>Runtime</span><span>Tools</span><span>Help</span><em>3 · toolbar</em></div><div class="v9-colab-body"><aside><span>+ Code</span><span>+ Text</span><span>Files</span></aside><main><div class="v9-textcell v9-focus" style="--d:3s"><b>Text / Markdown cell</b><span>Explain purpose, interpretation or steps.</span><em>4 · text cell</em></div><div class="v9-codecell v9-focus" style="--d:4s"><b class="v9-colab-run">▶</b><div><code>1  a = 17</code><code>2  b = 8</code><code>3  print(a + b)</code></div><em>5 · code cell</em><i>6 · Run</i></div><div class="v9-output v9-focus" style="--d:6s"><small>OUTPUT AREA</small><b>25</b><em>7 · output</em></div></main></div></div>`,

`<div class="v9-cycle" aria-label="Write, run, read, correct, repeat"><div class="v9-cycle-line"><i></i></div><div class="v9-cycle-step" style="--d:0s"><b>1</b><strong>WRITE / EDIT</strong><small>describe instructions</small></div><div class="v9-cycle-step" style="--d:1.2s"><b>2</b><strong>RUN</strong><small>execute the cell</small></div><div class="v9-cycle-step" style="--d:2.4s"><b>3</b><strong>READ</strong><small>inspect output or error</small></div><div class="v9-cycle-step" style="--d:3.6s"><b>4</b><strong>CORRECT</strong><small>change one thing</small></div><div class="v9-repeat">↺ repeat</div></div>`,

`<div class="v9-opmap" aria-label="Core Python operator map">${[['=','assign','x = 10'],['+','add','a + b'],['−','subtract','a - b'],['*','multiply','a * b'],['/','divide','a / b'],['**','power','x ** 2'],['%','remainder','x % 2']].map((x,i)=>`<div style="--d:${i*.55}s"><strong>${x[0]}</strong><span>${x[1]}</span><code>${x[2]}</code></div>`).join('')}</div>`,

`<div class="v9-topdown" aria-label="Top-to-bottom Python execution"><section><header><b>CODE CELL</b><span>top → bottom</span></header>${[['1','a = 17','a → 17'],['2','b = 8','b → 8'],['3','result = a + b','result → 25'],['4','print(result)','output → 25']].map((x,i)=>`<div class="v9-line" style="--d:${i*1.05}s"><b>${x[0]}</b><code>${x[1]}</code><span>${x[2]}</span></div>`).join('')}</section><aside><b>RUNTIME MEMORY</b><span style="--d:.8s">a = 17</span><span style="--d:1.85s">b = 8</span><span style="--d:2.9s">result = 25</span><div style="--d:3.95s"><small>OUTPUT</small><b>25</b></div></aside></div>`,

`<div class="v9-errors" aria-label="Errors as diagnostic information"><div class="v9-error-types"><div style="--d:0s"><b>SyntaxError</b><span>syntax problem</span></div><div style="--d:1.2s"><b>NameError</b><span>name problem</span></div><div style="--d:2.4s"><b>TypeError</b><span>type problem</span></div></div><div class="v9-diagnose"><div style="--d:.2s"><b>1</b><strong>READ</strong><span>the message</span></div><i></i><div style="--d:1.4s"><b>2</b><strong>IDENTIFY</strong><span>the category</span></div><i></i><div style="--d:2.6s"><b>3</b><strong>CORRECT</strong><span>one controlled thing</span></div><i></i><div style="--d:3.8s"><b>4</b><strong>RUN AGAIN</strong><span>inspect feedback</span></div></div></div>`,

`<div class="v9-bridge" aria-label="From one value to statistics"><i class="v9-bridge-line"></i>${[['17','one value'],['x','variables'],['[ ]','lists'],['T/F','logic'],['↺','loops'],['f(x)','functions'],['Σ','statistics']].map((x,i)=>`<div style="--d:${i*.65}s"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div><div class="v9-bridge-caption"><span>one calculation</span><i></i><span>structured data</span><i></i><span>repeatable analysis</span><i></i><span>statistical summary</span></div>`
  ];

  function apply(){
    const grid=document.getElementById('diagramGrid');
    if(!grid) return;
    const cards=[...grid.querySelectorAll('.diagram-card')];
    if(cards.length<8) return;
    cards.slice(0,8).forEach((card,i)=>{
      const stage=card.querySelector('.diagram-stage');
      if(!stage||stage.dataset.visualV9) return;
      stage.dataset.visualV9='true';
      stage.classList.add('v9-stage');
      stage.innerHTML=ops[i];
    });
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const grid=document.getElementById('diagramGrid');
    if(!grid) return;
    new MutationObserver(apply).observe(grid,{childList:true,subtree:true});
    apply();
  });
})();
