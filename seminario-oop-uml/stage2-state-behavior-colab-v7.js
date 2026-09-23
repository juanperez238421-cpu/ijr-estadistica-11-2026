(() => {
  'use strict';

  const state={
    active:false,
    score:0,
    total:8,
    checked:false,
    traceComplete:false,
    legacyModel:false,
    validated:{implement:false,test:false,modify:false},
    stageIndex:0,
    built:false
  };

  const items=[
    ['BankAccount','class','The blueprint that defines the account concept.'],
    ['owner','state','Persistent information remembered by each account object.'],
    ['balance','state','Persistent value that changes across method calls.'],
    ['deposit(amount)','behavior','An operation owned by the account that changes its state.'],
    ['withdraw(amount)','behavior','An operation that protects an invariant owned by the account.'],
    ['amount','parameter','Input supplied to a method call; it is not automatically persistent state.'],
    ['new_balance','local','A temporary value may support a calculation without becoming object state.'],
    ['account_01','object','One concrete instance created from the BankAccount class.']
  ];

  const labels={
    class:'Class',
    state:'Object state',
    behavior:'Behavior / method',
    parameter:'Method parameter',
    local:'Local / temporary value',
    object:'Object / instance'
  };

  const stageMeta=[
    ['01','Model the object','Classify persistent state and behavior.'],
    ['02','Predict the transition','Reason before running Python.'],
    ['03','Implement BankAccount','Translate the UML model into code.'],
    ['04','Test before → after','Prove an observable state change.'],
    ['05','Protect the invariant','Add and test a controlled withdraw rule.'],
    ['06','Explain & record','Defend the design and save evidence.']
  ];

  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function installPrecode(){
    const notebook=document.querySelector('#workshopPanel .notebook-panel');
    if(!notebook||document.getElementById('state2ModelStage')) return;

    const model=document.createElement('section');
    model.id='state2ModelStage';
    model.className='state2-precode-stage hidden';
    model.innerHTML=
      '<article class="state2-guide-cell">'+
        '<div class="cell-type-badge">Guided problem</div>'+
        '<div class="state2-problem-grid">'+
          '<div><p class="eyebrow">STAGE 1 OF 6</p><h2>What does the object remember, and what can it do?</h2>'+
          '<p class="state2-problem-copy">Before coding, separate the <strong>persistent state</strong> stored by each object from the <strong>behavior</strong> that reads, protects or changes that state. Use the BankAccount UML target as your reference model.</p>'+
          '<div class="state2-rule-line"><code>state</code><span>persists between method calls</span></div>'+
          '<div class="state2-rule-line"><code>behavior</code><span>acts on the object responsibility</span></div></div>'+
          '<aside class="state2-guide-panel"><span class="state2-guide-label">GUIDED REASONING</span><strong>Plan before coding</strong>'+
          '<ol><li>Identify the class blueprint.</li><li>Find values each object must remember.</li><li>Separate method parameters from stored attributes.</li><li>Identify actions that belong to the account responsibility.</li></ol></aside>'+
        '</div>'+
      '</article>'+
      '<article class="state2-model-cell">'+
        '<div class="state2-card-head"><div><span class="state2-mini-label">MODEL CHECK</span><h2>Classify the model</h2></div><span id="state2Score" class="state2-score">Not checked</span></div>'+
        '<p>Classify every item. Model evidence stays locked until all eight decisions are correct.</p>'+
        '<div id="state2Classification" class="state2-classification"></div>'+
        '<div class="state2-validation-row"><span id="state2ClassificationStatus">8 decisions required.</span><button id="checkState2Classification" class="state2-validate" type="button">Validate model</button></div>'+
      '</article>';

    const trace=document.createElement('section');
    trace.id='state2TraceStage';
    trace.className='state2-precode-stage hidden';
    trace.innerHTML=
      '<article class="state2-guide-cell">'+
        '<div class="cell-type-badge">Guided problem</div>'+
        '<div class="state2-problem-grid">'+
          '<div><p class="eyebrow">STAGE 2 OF 6</p><h2>Predict the state transition before Python.</h2>'+
          '<p class="state2-problem-copy">The account starts at <strong>120</strong>. Calling <code>deposit(35)</code> receives 35 as a parameter, then changes the persistent balance. Predict the final state before executing code.</p></div>'+
          '<aside class="state2-guide-panel"><span class="state2-guide-label">CORE RULE</span><strong>before state → behavior(argument) → after state</strong>'+
          '<ol><li>Read the initial persistent state.</li><li>Identify the method input.</li><li>Apply the behavior rule.</li><li>Write the expected persistent state.</li></ol></aside>'+
        '</div>'+
      '</article>'+
      '<article class="state2-model-cell">'+
        '<div class="state2-card-head"><div><span class="state2-mini-label">STATE TRACE</span><h2>Verify your prediction</h2></div><span id="state2TraceBadge" class="state2-score">Not verified</span></div>'+
        '<div class="state2-trace-form">'+
          '<label>Initial balance<input id="state2Initial" type="number" value="120" step="1"></label>'+
          '<label>deposit(amount)<input id="state2Amount" type="number" value="35" step="1"></label>'+
          '<label>Expected balance<input id="state2Expected" type="number" placeholder="Predict the result" step="1"></label>'+
        '</div>'+
        '<div id="state2TransitionPreview" class="state2-transition"><strong>120</strong><span>deposit(35)</span><strong>?</strong></div>'+
        '<div class="state2-validation-row"><span id="state2TraceStatus">Predict first. Do not run Python yet.</span><button id="checkState2Trace" class="state2-validate" type="button">Validate transition</button></div>'+
      '</article>';

    notebook.parentNode.insertBefore(model,notebook);
    notebook.parentNode.insertBefore(trace,notebook);
    renderClassification();
    bindPrecode();
    updateTransition();
  }

  function renderClassification(){
    const root=document.getElementById('state2Classification');
    if(!root) return;
    root.innerHTML=items.map((item,index)=>
      '<div class="state2-row" data-index="'+index+'"><code>'+esc(item[0])+'</code>'+
      '<select aria-label="Classify '+esc(item[0])+'"><option value="">Choose category…</option>'+
      Object.entries(labels).map(entry=>'<option value="'+entry[0]+'">'+esc(entry[1])+'</option>').join('')+
      '</select><div class="state2-feedback"></div></div>'
    ).join('');
  }

  function bindPrecode(){
    document.getElementById('checkState2Classification')?.addEventListener('click',checkClassification);
    ['state2Initial','state2Amount','state2Expected'].forEach(id=>document.getElementById(id)?.addEventListener('input',()=>{
      state.traceComplete=false;updateTransition();syncModelGate();refreshRail();
    }));
    document.getElementById('checkState2Trace')?.addEventListener('click',checkTrace);
  }

  function checkClassification(){
    const rows=[...document.querySelectorAll('#state2Classification .state2-row')];
    let score=0;
    rows.forEach((row,index)=>{
      const select=row.querySelector('select');
      const feedback=row.querySelector('.state2-feedback');
      const expected=items[index][1];
      const correct=select.value===expected;
      if(correct) score+=1;
      row.classList.toggle('correct',correct);
      row.classList.toggle('wrong',!correct);
      feedback.innerHTML=correct?'✓ '+esc(items[index][2]):'Expected <strong>'+esc(labels[expected])+'</strong>. '+esc(items[index][2]);
    });
    state.score=score;state.total=items.length;state.checked=true;
    const badge=document.getElementById('state2Score');
    badge.textContent=score+' / '+items.length;
    badge.classList.toggle('mastered',score===items.length);
    document.getElementById('state2ClassificationStatus').textContent=score===items.length?
      'Model verified. Continue to the transition prediction.':
      'Review the explanations, correct the model, and validate again.';
    syncModelGate();refreshRail();
  }

  function updateTransition(){
    const initial=Number(document.getElementById('state2Initial')?.value);
    const amount=Number(document.getElementById('state2Amount')?.value);
    const expected=document.getElementById('state2Expected')?.value;
    const preview=document.getElementById('state2TransitionPreview');
    if(preview) preview.innerHTML='<strong>'+esc(Number.isFinite(initial)?initial:'?')+'</strong><span>deposit('+esc(Number.isFinite(amount)?amount:'?')+')</span><strong>'+esc(expected||'?')+'</strong>';
    const badge=document.getElementById('state2TraceBadge');
    if(badge&&!state.traceComplete){badge.textContent='Not verified';badge.classList.remove('mastered');}
  }

  function checkTrace(){
    const initial=Number(document.getElementById('state2Initial')?.value);
    const amount=Number(document.getElementById('state2Amount')?.value);
    const expected=Number(document.getElementById('state2Expected')?.value);
    state.traceComplete=Number.isFinite(initial)&&Number.isFinite(amount)&&Number.isFinite(expected)&&amount>0&&Math.abs(expected-(initial+amount))<1e-9;
    const badge=document.getElementById('state2TraceBadge');
    badge.textContent=state.traceComplete?'Verified':'Review';
    badge.classList.toggle('mastered',state.traceComplete);
    document.getElementById('state2TraceStatus').textContent=state.traceComplete?
      'Correct: balance persists and changes from 120 to 155.':
      'Expected balance must equal initial balance + a positive deposit amount.';
    syncModelGate();refreshRail();
  }

  function syncModelGate(){
    const model=document.getElementById('evModel');
    const mastery=state.checked&&state.score===state.total&&state.traceComplete;
    if(model){
      model.checked=mastery||state.legacyModel;
      model.disabled=!(mastery||state.legacyModel);
    }
    if(mastery){
      document.dispatchEvent(new CustomEvent('ijr-oop-state-behavior-model-mastered',{detail:{score:state.score,total:state.total}}));
    }
  }

  function stageCompleted(index){
    if(index===0) return state.checked&&state.score===state.total;
    if(index===1) return state.traceComplete;
    if(index===2) return state.validated.implement===true;
    if(index===3) return state.validated.test===true;
    if(index===4) return state.validated.modify===true;
    if(index===5) return document.getElementById('completionStamp')?.classList.contains('done')||false;
    return false;
  }

  function firstIncomplete(){
    for(let i=0;i<stageMeta.length;i++) if(!stageCompleted(i)) return i;
    return 5;
  }

  function createShell(){
    if(document.getElementById('state2FullColabApp')) return document.getElementById('state2FullColabApp');
    const root=document.createElement('div');
    root.id='state2FullColabApp';
    root.className='state2-full-app';
    root.innerHTML=
      '<header class="state2-titlebar">'+
        '<a class="state2-brand" href="./"><span class="state2-ijr">IJR</span><span><small>Seminar 11 · OOP + UML</small><strong>Guided Workshop</strong></span></a>'+
        '<div class="state2-file"><span class="state2-file-icon">▣</span><div><strong>Seminar11_S02_State_Behavior.ipynb</strong><small>Session 02 · State & Behavior · Python</small></div></div>'+
        '<div class="state2-title-actions"><span id="state2SessionBadge" class="state2-session-badge">Active session</span><a id="state2TheoryLink" class="state2-ghost" href="theory.html?topic=state-behavior&lang=python">Theory</a><a class="state2-ghost" href="./">All topics</a></div>'+
      '</header>'+
      '<div class="state2-menubar">'+
        '<div class="state2-menu-items"><span>File</span><span>Edit</span><span>View</span><span>Insert</span><span>Runtime</span><span>Tools</span><span>Help</span></div>'+
        '<div class="state2-toolbar"><button id="state2AddCode" type="button">+ Code</button><button id="state2AddText" type="button">+ Text</button><button id="state2Connect" class="state2-runtime-button" type="button"><span></span><b>Connect</b></button></div>'+
      '</div>'+
      '<main class="state2-workspace">'+
        '<aside class="state2-sidebar"><div class="state2-sidebar-head"><p class="eyebrow">WORKSHOP</p><h1>State & Behavior</h1><div class="state2-mastery-row"><span>Mastery</span><strong id="state2MasteryPercent">0%</strong></div><div class="state2-mastery-track"><span id="state2MasteryBar"></span></div><small id="state2MasteryCount">0 / 6 validated</small></div><nav id="state2StageList" class="state2-stage-list"></nav></aside>'+
        '<section class="state2-notebook-scroll"><div id="state2StageViewport"></div>'+
          '<section class="state2-footer-nav"><button id="state2Previous" type="button">← Previous</button><span id="state2FooterMessage">Complete the current stage, then continue.</span><button id="state2Next" type="button">Next →</button></section>'+
          '<div id="state2ScratchArea"></div>'+
        '</section>'+
      '</main>';
    document.body.appendChild(root);
    return root;
  }

  function makeCodeStage(article,index){
    if(!article) return null;
    const wrap=document.createElement('section');
    wrap.className='state2-stage-panel hidden';
    wrap.dataset.stage=String(index);
    const meta=stageMeta[index];
    wrap.innerHTML=
      '<section class="state2-notebook-hero"><div><p class="eyebrow">STAGE '+(index+1)+' OF 6</p><h2>'+esc(meta[1])+'</h2><p>'+esc(meta[2])+'</p></div><div class="state2-hero-progress"><span>Current stage</span><strong>0'+(index+1)+' / 06</strong></div></section>';
    article.classList.add('state2-code-cell');
    wrap.appendChild(article);
    return wrap;
  }

  function enhanceNotebook(){
    if(!state.active||state.built) return;
    const model=document.getElementById('state2ModelStage');
    const trace=document.getElementById('state2TraceStage');
    const notebook=document.getElementById('workshopCodingLab');
    const implement=notebook?.querySelector('[data-cell-id="implement"]');
    const test=notebook?.querySelector('[data-cell-id="test"]');
    const modify=notebook?.querySelector('[data-cell-id="modify"]');
    const evidence=document.getElementById('saveEvidence')?.closest('.content-grid');
    const exit=document.getElementById('evidenceList')?.closest('section.panel');
    if(!model||!trace||!implement||!test||!modify||!evidence) return;

    state.built=true;
    document.body.classList.add('state2-full-colab-active');
    document.querySelector('body > .topbar')?.classList.add('state2-hide-legacy');
    document.getElementById('workshopPanel')?.classList.add('state2-hide-legacy');

    const root=createShell();
    const viewport=root.querySelector('#state2StageViewport');

    model.classList.remove('hidden');model.classList.add('state2-stage-panel');model.dataset.stage='0';
    trace.classList.remove('hidden');trace.classList.add('state2-stage-panel');trace.dataset.stage='1';
    viewport.appendChild(model);
    viewport.appendChild(trace);
    viewport.appendChild(makeCodeStage(implement,2));
    viewport.appendChild(makeCodeStage(test,3));
    viewport.appendChild(makeCodeStage(modify,4));

    const final=document.createElement('section');
    final.className='state2-stage-panel hidden';
    final.dataset.stage='5';
    final.innerHTML='<section class="state2-notebook-hero"><div><p class="eyebrow">STAGE 6 OF 6</p><h2>Explain & record evidence</h2><p>Connect the model, the code and the observed state transition. Then record the verified session evidence in Supabase.</p></div><div class="state2-hero-progress"><span>Current stage</span><strong>06 / 06</strong></div></section>';
    evidence.classList.add('state2-evidence-grid');
    final.appendChild(evidence);
    if(exit){exit.classList.add('state2-exit-cell');final.appendChild(exit);}
    viewport.appendChild(final);

    notebook.querySelector('.notebook-intro')?.remove();
    notebook.querySelector('.python-terminal-shell')?.remove();

    root.querySelector('#state2SessionBadge').textContent=document.getElementById('sessionBadge')?.textContent||'Active session';
    root.querySelector('#state2TheoryLink').href='theory.html?topic=state-behavior&lang=python';

    bindShell();
    state.stageIndex=firstIncomplete();
    renderStage();
    refreshRail();
  }

  function bindShell(){
    const list=document.getElementById('state2StageList');
    list.innerHTML=stageMeta.map((meta,index)=>
      '<button class="state2-stage-button" type="button" data-stage="'+index+'"><span class="state2-stage-number">'+meta[0]+'</span><span class="state2-stage-copy"><strong>'+esc(meta[1])+'</strong><small>'+esc(meta[2])+'</small></span><span class="state2-stage-check">✓</span></button>'
    ).join('');
    list.querySelectorAll('[data-stage]').forEach(button=>button.addEventListener('click',()=>{state.stageIndex=Number(button.dataset.stage);renderStage();}));
    document.getElementById('state2Previous')?.addEventListener('click',()=>{if(state.stageIndex>0){state.stageIndex-=1;renderStage();}});
    document.getElementById('state2Next')?.addEventListener('click',()=>{if(state.stageIndex<stageMeta.length-1){state.stageIndex+=1;renderStage();}});
    document.getElementById('state2Connect')?.addEventListener('click',connectRuntime);
    document.getElementById('state2AddText')?.addEventListener('click',addScratchText);
    document.getElementById('state2AddCode')?.addEventListener('click',addScratchCode);
  }

  async function connectRuntime(){
    const button=document.getElementById('state2Connect');
    const label=button?.querySelector('b');
    if(!button||!label) return;
    button.classList.add('loading');label.textContent='Connecting…';
    try{
      const result=await window.IJR_OOP_NOTEBOOK?.runCode?.('1 + 1','runtime-connect');
      if(result?.ok){button.classList.remove('loading');button.classList.add('ready');label.textContent='Connected';}
      else throw new Error('Runtime check failed');
    }catch(error){
      button.classList.remove('loading');button.classList.add('error');label.textContent='Retry';
    }
  }

  function addScratchText(){
    const area=document.getElementById('state2ScratchArea');if(!area)return;
    const card=document.createElement('article');card.className='state2-scratch-text';
    card.innerHTML='<span class="state2-scratch-label">TEXT CELL</span><div contenteditable="true" data-placeholder="Write a note, prediction or explanation here…"></div>';
    area.appendChild(card);card.querySelector('[contenteditable]')?.focus();
    card.scrollIntoView({behavior:'smooth',block:'center'});
  }

  function addScratchCode(){
    const area=document.getElementById('state2ScratchArea');if(!area)return;
    const id='scratch-'+Date.now();
    const card=document.createElement('article');card.className='state2-scratch-code';
    card.innerHTML='<div class="state2-scratch-gutter"><button type="button">▶</button><span>[ ]</span></div><div class="state2-scratch-main"><div class="state2-scratch-toolbar"><strong>Python 3 scratch cell</strong><small>Not graded</small></div><textarea spellcheck="false" placeholder="# Experiment here"></textarea><pre class="hidden"></pre></div>';
    area.appendChild(card);
    const run=card.querySelector('button'),count=card.querySelector('.state2-scratch-gutter span'),editor=card.querySelector('textarea'),out=card.querySelector('pre');
    let n=0;
    run.addEventListener('click',async()=>{
      run.disabled=true;n+=1;count.textContent='['+n+']';
      const result=await window.IJR_OOP_NOTEBOOK?.runCode?.(editor.value,id);
      out.classList.remove('hidden');out.textContent=result?.output||(result?.ok?'Cell completed.':result?.error||'Python error');out.classList.toggle('error',!result?.ok);run.disabled=false;
    });
    editor.focus();card.scrollIntoView({behavior:'smooth',block:'center'});
  }

  function renderStage(){
    document.querySelectorAll('#state2StageViewport .state2-stage-panel').forEach((panel,index)=>panel.classList.toggle('hidden',index!==state.stageIndex));
    document.querySelectorAll('#state2StageList .state2-stage-button').forEach((button,index)=>button.classList.toggle('active',index===state.stageIndex));
    const prev=document.getElementById('state2Previous'),next=document.getElementById('state2Next');
    if(prev) prev.disabled=state.stageIndex===0;
    if(next) next.disabled=state.stageIndex===stageMeta.length-1;
    const meta=stageMeta[state.stageIndex];
    const footer=document.getElementById('state2FooterMessage');
    if(footer) footer.textContent=stageCompleted(state.stageIndex)?'Stage validated. You can continue.':meta[2];
    document.querySelector('.state2-notebook-scroll')?.scrollTo({top:0,behavior:'smooth'});
    refreshRail();
  }

  function refreshRail(){
    const buttons=[...document.querySelectorAll('#state2StageList .state2-stage-button')];
    let done=0;
    buttons.forEach((button,index)=>{
      const complete=stageCompleted(index);
      if(complete)done+=1;
      button.classList.toggle('stage-complete',complete);
      const small=button.querySelector('small');
      if(small)small.textContent=complete?'Validated':stageMeta[index][2];
    });
    const pct=Math.round(done/stageMeta.length*100);
    const percent=document.getElementById('state2MasteryPercent'),bar=document.getElementById('state2MasteryBar'),count=document.getElementById('state2MasteryCount');
    if(percent)percent.textContent=pct+'%';if(bar)bar.style.width=pct+'%';if(count)count.textContent=done+' / '+stageMeta.length+' validated';
    const footer=document.getElementById('state2FooterMessage');
    if(footer&&stageCompleted(state.stageIndex))footer.textContent='Stage validated. You can continue.';
  }

  function validateRuntimeCell(detail={}){
    const label=detail.label;
    const code=String(detail.code||'');
    if(detail.ok!==true) return {ok:false,message:'Fix the Python error first.'};
    if(!['implement','test','modify'].includes(label)) return {ok:true,message:'Runtime completed.'};

    let ok=true,message='Stage validated.';
    const unfinished=/\bpass\b|TODO/i.test(code);
    if(unfinished){ok=false;message='Remove TODO/pass placeholders before this stage can count as evidence.';}
    else if(label==='implement'){
      ok=/class\s+BankAccount\b/.test(code)&&/def\s+deposit\s*\(/.test(code)&&/self\.balance/.test(code)&&/self\.owner/.test(code)&&/amount/.test(code);
      message=ok?'Implementation validated: BankAccount + persistent state + deposit behavior.':'Cell 1 must define BankAccount, owner/balance state and deposit(amount).';
    }else if(label==='test'){
      const prints=(code.match(/\bprint\s*\(/g)||[]).length;
      ok=/BankAccount\s*\(/.test(code)&&/\.deposit\s*\(/.test(code)&&prints>=2;
      message=ok?'Transition validated: object + deposit call + visible before/after output.':'Cell 2 must create BankAccount, call deposit(...) and print the before and after state.';
    }else if(label==='modify'){
      const prints=(code.match(/\bprint\s*\(/g)||[]).length;
      ok=/\.withdraw\s*\(/.test(code)&&prints>=2;
      message=ok?'Invariant test validated: withdraw behavior was executed and inspected.':'Cell 3 must exercise withdraw(...) and print the protected balance.';
    }

    state.validated[label]=ok;
    refreshRail();
    return {ok,message};
  }

  function evidence(){
    return {
      state_behavior_version:'state-behavior-colab-v7',
      state_classification_score:state.score,
      state_classification_total:state.total,
      state_behavior_mastery:state.checked&&state.score===state.total&&state.traceComplete,
      state_trace_initial:String(document.getElementById('state2Initial')?.value||''),
      state_trace_amount:String(document.getElementById('state2Amount')?.value||''),
      state_trace_expected:String(document.getElementById('state2Expected')?.value||''),
      state_trace_complete:state.traceComplete,
      state_runtime_implement_validated:state.validated.implement,
      state_runtime_test_validated:state.validated.test,
      state_runtime_modify_validated:state.validated.modify
    };
  }

  function hydrate(evidence={}){
    if(!state.active) return;
    state.legacyModel=evidence.model===true&&evidence.pedagogy_version!=='oop-uml-v6';
    const score=Number(evidence.state_classification_score||0);
    const total=Number(evidence.state_classification_total||items.length);
    if(evidence.state_behavior_mastery===true&&score===total&&total>=8){
      state.score=score;state.total=total;state.checked=true;state.traceComplete=evidence.state_trace_complete===true;
      const badge=document.getElementById('state2Score');if(badge){badge.textContent=score+' / '+total+' · saved';badge.classList.add('mastered');}
      const trace=document.getElementById('state2TraceBadge');if(trace&&state.traceComplete){trace.textContent='Verified · saved';trace.classList.add('mastered');}
      if(evidence.state_trace_initial) document.getElementById('state2Initial').value=evidence.state_trace_initial;
      if(evidence.state_trace_amount) document.getElementById('state2Amount').value=evidence.state_trace_amount;
      if(evidence.state_trace_expected) document.getElementById('state2Expected').value=evidence.state_trace_expected;
      document.getElementById('state2ClassificationStatus').textContent='Verified model evidence is already saved.';
      document.getElementById('state2TraceStatus').textContent='Verified transition evidence is already saved.';
    }
    state.validated.implement=evidence.state_runtime_implement_validated===true||evidence.implement_success===true;
    state.validated.test=evidence.state_runtime_test_validated===true||evidence.test_success===true;
    state.validated.modify=evidence.state_runtime_modify_validated===true||evidence.modify_success===true;
    updateTransition();syncModelGate();refreshRail();
  }

  function activate(active=true){
    installPrecode();
    state.active=Boolean(active);
    document.getElementById('state2ModelStage')?.classList.toggle('hidden',!state.active);
    document.getElementById('state2TraceStage')?.classList.toggle('hidden',!state.active);
    if(state.active){
      const model=document.getElementById('evModel');
      const code=document.getElementById('evCode');
      const test=document.getElementById('evTest');
      if(model)model.disabled=true;if(code)code.disabled=true;if(test)test.disabled=true;
    }
  }

  window.IJR_OOP_STATE_BEHAVIOR={activate,enhanceNotebook,validateRuntimeCell,evidence,hydrate,refreshRail};
  document.addEventListener('DOMContentLoaded',installPrecode);
})();