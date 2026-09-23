(() => {
  'use strict';

  const state={
    active:false,
    score:0,
    total:8,
    checked:false,
    traceComplete:false,
    legacyModel:false,
    validated:{implement:false,test:false,modify:false}
  };

  const items=[
    ['BankAccount','class','The blueprint that defines the account concept.'],
    ['owner','state','Persistent information remembered by each account object.'],
    ['balance','state','Persistent value that changes across method calls.'],
    ['deposit(amount)','behavior','An operation owned by the account that changes its state.'],
    ['withdraw(amount)','behavior','An operation that must protect the balance invariant.'],
    ['amount','parameter','Input supplied to a method call; it is not automatically persistent object state.'],
    ['new_balance','local','A temporary/local value can help compute a result without becoming object state.'],
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

  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function installPanel(){
    const notebook=document.querySelector('#workshopPanel .notebook-panel');
    if(!notebook||document.getElementById('stateBehaviorLab')) return;

    const section=document.createElement('section');
    section.id='stateBehaviorLab';
    section.className='panel state-behavior-lab hidden';
    section.innerHTML=
      '<div class="state2-head">'+
        '<div><p class="eyebrow">SESSION 02 · BEFORE CODE</p><h2>State persists. Behavior changes it.</h2>'+
        '<p>Before opening the Python cells, prove that you can separate persistent object state from method inputs, temporary values and behavior. Then predict one concrete state transition.</p></div>'+
        '<div class="state2-rule"><strong>Core rule</strong><span>before state → method(argument) → after state</span><small>A method is meaningful when it reads, protects or changes state owned by the object.</small></div>'+
      '</div>'+
      '<div class="state2-grid">'+
        '<article class="state2-card"><div class="state2-card-head"><div><span class="mini-label">PART A</span><h3>Classify the model</h3></div><span id="state2Score" class="state2-score">Not checked</span></div>'+
        '<p class="state2-copy">Classify every item. The Model evidence stays locked until all eight are correct.</p>'+
        '<div id="state2Classification" class="state2-classification"></div>'+
        '<button id="checkState2Classification" class="button button-dark" type="button">Check classification</button>'+
        '<p id="state2ClassificationStatus" class="state2-status">8 decisions required.</p></article>'+
        '<article class="state2-card"><div class="state2-card-head"><div><span class="mini-label">PART B</span><h3>Predict a real transition</h3></div><span id="state2TraceBadge" class="state2-score">Not verified</span></div>'+
        '<p class="state2-copy">A BankAccount starts with 120. A positive deposit of 35 should change only the balance state.</p>'+
        '<div class="state2-trace-form">'+
          '<label>Initial balance<input id="state2Initial" type="number" value="120" step="1"></label>'+
          '<label>deposit(amount)<input id="state2Amount" type="number" value="35" step="1"></label>'+
          '<label>Expected balance<input id="state2Expected" type="number" placeholder="Predict the result" step="1"></label>'+
        '</div>'+
        '<div id="state2TransitionPreview" class="state2-transition"><strong>120</strong><span>deposit(35)</span><strong>?</strong></div>'+
        '<button id="checkState2Trace" class="button button-dark" type="button">Verify transition</button>'+
        '<p id="state2TraceStatus" class="state2-status">Predict first. Do not run Python yet.</p></article>'+
      '</div>';
    notebook.parentNode.insertBefore(section,notebook);
    bindPanel();
    renderClassification();
    updateTransition();
  }

  function renderClassification(){
    const root=document.getElementById('state2Classification');
    if(!root) return;
    root.innerHTML=items.map((item,index)=>
      '<div class="state2-row" data-index="'+index+'"><code>'+esc(item[0])+'</code>'+
      '<select aria-label="Classify '+esc(item[0])+'"><option value="">Choose…</option>'+
      Object.entries(labels).map(entry=>'<option value="'+entry[0]+'">'+esc(entry[1])+'</option>').join('')+
      '</select><div class="state2-feedback"></div></div>'
    ).join('');
  }

  function bindPanel(){
    document.getElementById('checkState2Classification')?.addEventListener('click',checkClassification);
    ['state2Initial','state2Amount','state2Expected'].forEach(id=>document.getElementById(id)?.addEventListener('input',()=>{state.traceComplete=false;updateTransition();syncModelGate();}));
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
      'Perfect. Now verify the numerical state transition.':
      'Review the explanations, correct the model, and check again.';
    syncModelGate();
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
      'Correct: the method input is 35; the persistent balance changes from 120 to 155.':
      'The expected balance must equal initial balance + a positive deposit amount.';
    syncModelGate();
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

  function enhanceNotebook(){
    if(!state.active) return;
    const lab=document.getElementById('workshopCodingLab');
    const panel=lab?.closest('.notebook-panel');
    if(!lab||!panel||panel.dataset.state2Colab==='1') return;
    panel.dataset.state2Colab='1';
    panel.classList.add('state2-colab-shell');

    const title=document.createElement('div');
    title.className='state2-notebook-titlebar';
    title.innerHTML='<div class="state2-notebook-brand"><span>IJR</span><div><small>Seminar 11 · OOP + UML</small><strong>Seminar11_S02_State_Behavior.ipynb</strong></div></div><div class="state2-runtime-chip"><span></span>Python 3 · browser runtime</div>';

    const menu=document.createElement('div');
    menu.className='state2-menubar';
    menu.innerHTML='<div><span>File</span><span>Edit</span><span>View</span><span>Insert</span><span>Runtime</span><span>Tools</span><span>Help</span></div><strong>Guided Colab workshop · S02</strong>';

    const grid=document.createElement('div');
    grid.className='state2-colab-grid';
    const rail=document.createElement('aside');
    rail.className='state2-stage-rail';
    rail.innerHTML='<p class="eyebrow">WORKSHOP STAGES</p><div id="state2RailList">'+
      railButton('01','Predict state','stateBehaviorLab','model')+
      railButton('02','Model transition','stateBehaviorLab','model')+
      railButton('03','Implement','implement','implement')+
      railButton('04','Test transition','test','test')+
      railButton('05','Protect rule','modify','modify')+
      railButton('06','Explain + record','saveEvidence','evidence')+
      '</div><div class="state2-rail-note"><strong>Mastery</strong><span>Model + executable code + observable transition + rule + explanation.</span></div>';
    const main=document.createElement('div');
    main.className='state2-colab-main';

    panel.insertBefore(title,lab);
    panel.insertBefore(menu,lab);
    panel.insertBefore(grid,lab);
    main.appendChild(lab);
    grid.appendChild(rail);grid.appendChild(main);

    rail.querySelectorAll('[data-scroll]').forEach(button=>button.addEventListener('click',()=>{
      const target=scrollTarget(button.dataset.scroll);
      target?.scrollIntoView({behavior:'smooth',block:'start'});
    }));
    refreshRail();
  }

  function railButton(n,label,target,key){
    return '<button class="state2-rail-button" type="button" data-scroll="'+esc(target)+'" data-stage-key="'+esc(key)+'"><span>'+n+'</span><div><strong>'+esc(label)+'</strong><small>Pending</small></div></button>';
  }

  function scrollTarget(key){
    if(key==='implement'||key==='test'||key==='modify') return document.querySelector('[data-cell-id="'+key+'"]');
    return document.getElementById(key);
  }

  function refreshRail(){
    document.querySelectorAll('.state2-rail-button').forEach(button=>{
      const key=button.dataset.stageKey;
      let done=false;
      if(key==='model') done=state.checked&&state.score===state.total&&state.traceComplete;
      if(key==='implement'||key==='test'||key==='modify') done=state.validated[key]===true;
      if(key==='evidence') done=document.getElementById('completionStamp')?.classList.contains('done')||false;
      button.classList.toggle('done',done);
      const small=button.querySelector('small');if(small)small.textContent=done?'Completed':'Pending';
    });
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
      ok=/class\s+BankAccount\b/.test(code)&&/def\s+deposit\s*\(/.test(code)&&/self\.balance/.test(code)&&/amount/.test(code);
      message=ok?'Implementation structure verified: class + persistent balance + deposit behavior.':'Cell 1 must define BankAccount, persistent balance state and deposit(amount).';
    }else if(label==='test'){
      const prints=(code.match(/\bprint\s*\(/g)||[]).length;
      ok=/BankAccount\s*\(/.test(code)&&/\.deposit\s*\(/.test(code)&&prints>=2;
      message=ok?'State transition test verified: object + deposit call + visible before/after output.':'Cell 2 must create BankAccount, call deposit(...) and print at least the before and after state.';
    }else if(label==='modify'){
      const prints=(code.match(/\bprint\s*\(/g)||[]).length;
      ok=/\.withdraw\s*\(/.test(code)&&prints>=2;
      message=ok?'Business-rule test verified. The final save will also require this cell to run successfully.':'Cell 3 must exercise withdraw(...) and print the protected state before/after the rule.';
    }

    state.validated[label]=ok;
    refreshRail();
    return {ok,message};
  }

  function evidence(){
    return {
      state_behavior_version:'state-behavior-v6',
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
      document.getElementById('state2ClassificationStatus').textContent='Verified State & Behavior model evidence is already saved.';
      document.getElementById('state2TraceStatus').textContent='Verified transition evidence is already saved.';
    }
    state.validated.implement=evidence.state_runtime_implement_validated===true||evidence.implement_success===true;
    state.validated.test=evidence.state_runtime_test_validated===true||evidence.test_success===true;
    state.validated.modify=evidence.state_runtime_modify_validated===true||evidence.modify_success===true;
    updateTransition();syncModelGate();refreshRail();
  }

  function activate(active=true){
    installPanel();
    state.active=Boolean(active);
    document.getElementById('stateBehaviorLab')?.classList.toggle('hidden',!state.active);
    if(state.active){
      const model=document.getElementById('evModel');
      const code=document.getElementById('evCode');
      const test=document.getElementById('evTest');
      if(model) model.disabled=true;
      if(code) code.disabled=true;
      if(test) test.disabled=true;
    }
  }

  window.IJR_OOP_STATE_BEHAVIOR={activate,enhanceNotebook,validateRuntimeCell,evidence,hydrate,refreshRail};

  document.addEventListener('DOMContentLoaded',installPanel);
})();