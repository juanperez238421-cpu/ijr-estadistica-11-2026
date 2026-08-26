(() => {
  'use strict';

  const config = window.IJR_PYTHON_HUB_CONFIG;
  const topicMap = window.IJR_PYTHON_HUB_TOPIC_MAP || {};
  const topicList = window.IJR_PYTHON_HUB_TOPICS || [];
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const requested = new URLSearchParams(location.search).get('topic') || 'operations';
  const topic = topicMap[requested];
  const PYODIDE_INDEX = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';

  if (!config || !window.supabase || !topic) {
    document.body.innerHTML = '<main style="padding:40px;font-family:sans-serif">Workshop could not be loaded.</main>';
    return;
  }

  const client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false }
  });

  const state = {
    snapshot:null,
    registration:null,
    stageIndex:0,
    lastOutput:'',
    lastCode:'',
    lastRunKey:null,
    lastRunOk:false,
    lastValidation:null,
    pyodide:null,
    runtimePromise:null,
    executionCount:0,
    terminalLines:['Python console ready. Press ▶ Run or use the >>> prompt below.']
  };

  const draftKey = `ijr-python-hub-workshop-drafts-v11:${topic.slug}`;

  function getSession(){ try{return JSON.parse(localStorage.getItem(config.sessionStorageKey)||'null');}catch{return null;} }
  function readDrafts(){ try{return JSON.parse(sessionStorage.getItem(draftKey)||'{}');}catch{return {};} }
  function saveDraft(index,value){ const drafts=readDrafts(); drafts[String(index)]=value; sessionStorage.setItem(draftKey,JSON.stringify(drafts)); }
  async function rpc(name,args){ const {data,error}=await client.rpc(name,args); if(error) throw new Error(error.message||'Backend request failed'); return data; }
  function topicProgress(){ return state.snapshot?.topics?.find(item=>item.slug===topic.slug)||null; }
  function serverItem(key){ return topicProgress()?.items?.find(item=>item.key===key)||null; }
  function resetRunState(){ state.lastOutput=''; state.lastCode=''; state.lastRunKey=null; state.lastRunOk=false; }
  function lastScalar(output){ const values=String(output||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean); return values.length?values[values.length-1]:''; }

  async function resume(){
    const saved=getSession();
    if(!saved?.registrationId || !saved?.accessToken) return false;
    try{
      const data=await rpc(config.rpc.resume,{p_registration_id:saved.registrationId,p_access_token:saved.accessToken});
      state.registration=saved;
      state.snapshot=data.snapshot;
      const p=topicProgress();
      if(!p || p.status==='locked') return false;
      const first=topic.exercises.findIndex(ex=>!serverItem(ex.key)?.correct);
      state.stageIndex=first>=0?first:0;
      return true;
    }catch{
      return false;
    }
  }

  function render(){
    const p=topicProgress();
    if(!p || p.status==='locked') return renderLocked();
    const reg=state.snapshot.registration;
    const theoryUrl=`theory.html?topic=${encodeURIComponent(topic.slug)}`;
    $('theoryTopLink').href=theoryUrl;
    $('theoryCrumb').href=theoryUrl;
    $('sessionBadge').textContent=`${reg.group_code} · ${Number(p.percent||0)}%`;
    $('crumbTopic').textContent=`${String(topic.sequence).padStart(2,'0')} · Workshop`;
    $('workshopHero').innerHTML=`<div><p class="eyebrow">TOPIC ${String(topic.sequence).padStart(2,'0')} · WORKSHOP</p><h1>${escapeHtml(topic.title)}</h1><p>${escapeHtml(topic.workshopIntro)}</p><div class="workshop-hero-links"><a class="button button-light" href="${theoryUrl}">Review theory</a></div></div><div class="workshop-percent"><span>Workshop mastery</span><strong>${Number(p.percent||0)}%</strong><div class="progress-track"><span style="width:${Number(p.percent||0)}%"></span></div><small>${Number(p.correct_count||0)} / ${Number(p.total_count||topic.exercises.length)} validated stages</small></div>`;
    $('stageNavTitle').textContent=topic.nav;
    $('stageNavProgress').textContent=`${Number(p.correct_count||0)} / ${Number(p.total_count||topic.exercises.length)} correct`;
    $('stageButtons').innerHTML=topic.exercises.map((ex,i)=>{
      const item=serverItem(ex.key);
      return `<button type="button" data-stage="${i}" class="workshop-nav-button ${i===state.stageIndex?'active':''} ${item?.correct?'correct':''}"><span>${String(i+1).padStart(2,'0')}</span><div><strong>${escapeHtml(ex.title)}</strong><small>${item?.correct?'Completed':`${Number(item?.tries||0)} attempt${Number(item?.tries||0)===1?'':'s'}`}</small></div></button>`;
    }).join('');
    $('stageButtons').querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
      state.stageIndex=Number(btn.dataset.stage);
      resetRunState();
      state.lastValidation=null;
      state.terminalLines=['Python console ready for this stage.'];
      render();
    }));
    renderStage();
    if(p.status==='completed') renderCompletion(); else $('completionPanel').classList.add('hidden');
    $('workshopApp').classList.remove('hidden');
  }

  function renderLocked(){
    $('accessPanel').classList.remove('hidden');
    $('accessPanel').innerHTML='<p class="eyebrow">TOPIC LOCKED</p><h1>This workshop is not released yet.</h1><p>Complete the previous workshop first. The prerequisite rule is enforced by the course backend.</p><a class="button button-dark" href="./">Return to Learning Hub</a>';
  }

  function renderStage(){
    const ex=topic.exercises[state.stageIndex]||topic.exercises[0];
    const item=serverItem(ex.key)||{correct:false,tries:0};
    const feedback=state.lastValidation && state.lastValidation.key===ex.key ? state.lastValidation : null;
    let workspace='';

    if(ex.mode==='code'){
      const drafts=readDrafts();
      const initial=Object.prototype.hasOwnProperty.call(drafts,String(state.stageIndex))?drafts[String(state.stageIndex)]:(ex.code||'');
      const isBlankContract=topic.slug==='operations';
      workspace=`<div class="code-workspace ${isBlankContract?'blank-contract':''}">
        ${isBlankContract?'<div class="blank-contract-note"><strong>Blank-cell challenge</strong><span>No starter solution is provided. Build the instructions from the theory page and the problem statement.</span></div>':''}
        <section class="colab-shell" aria-label="Functional Python notebook">
          <div class="colab-topbar">
            <div class="colab-kernel"><span class="colab-kernel-dot"></span><span>Python 3 · browser runtime</span></div>
            <span id="runtimeStatus" class="colab-runtime-badge" role="status" aria-live="polite">Python runtime</span>
          </div>
          <div class="colab-instruction-strip"><strong>Colab workflow:</strong> write the complete Python solution, press ▶ Run, read the console, correct errors, then validate.</div>
          <div class="colab-cell">
            <div class="colab-gutter">
              <button id="runCellButton" class="colab-play" type="button" aria-label="Run Python cell">▶</button>
              <span id="executionCount" class="colab-exec-count">[ ]</span>
            </div>
            <div class="colab-editor-wrap">
              <div class="colab-editor-toolbar"><div><strong>Code cell</strong><small>${isBlankContract?' · student-authored code':' · editable starter code'}</small></div><div class="colab-editor-actions"><button id="resetCode" class="small-button" type="button">${isBlankContract?'Clear cell':'Reset'}</button><button id="runCode" class="colab-run-toolbar" type="button">▶ Run</button></div></div>
              <textarea id="codeEditor" class="colab-editor" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Python code editor">${escapeHtml(initial)}</textarea>
            </div>
          </div>
          <section class="colab-console" aria-label="Python terminal">
            <div class="colab-console-head"><span>Python console</span><button id="clearTerminal" type="button">Clear</button></div>
            <pre id="terminalOutput" class="colab-console-output" aria-live="polite">${escapeHtml(state.terminalLines.join('\n'))}</pre>
            <form id="terminalForm" class="colab-console-input">
              <span class="colab-console-prompt">&gt;&gt;&gt;</span>
              <input id="terminalCommand" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Try a Python command">
              <button type="submit">Run</button>
            </form>
            <div class="colab-terminal-note">The console uses the same live Python runtime as the notebook cell. Terminal experiments do not validate the stage automatically.</div>
          </section>
          <div class="colab-validation-row"><span>Expected answers remain on the course backend, not in this page.</span><button id="validateCode" class="button button-dark" type="button">Validate output</button></div>
        </section>
      </div>`;
    }else{
      workspace=`<div class="choice-workspace"><div class="choice-list">${ex.choices.map(choice=>`<label class="choice-option"><input type="radio" name="choice" value="${escapeHtml(choice)}"><span>${escapeHtml(choice)}</span></label>`).join('')}</div><div class="validate-row"><span>Select one answer and validate it.</span><button id="validateChoice" class="button button-dark" type="button">Validate answer</button></div></div>`;
    }

    $('stageMount').innerHTML=`<article class="workshop-stage-card"><div class="stage-problem"><div class="stage-kicker">Stage ${state.stageIndex+1} of ${topic.exercises.length}</div><h2>${escapeHtml(ex.title)}</h2><p>${escapeHtml(ex.prompt)}</p><div class="stage-status-row"><span class="stage-status ${item.correct?'ok':''}">${item.correct?'✓ Completed correctly':`Attempts: ${Number(item.tries||0)} · Correct validation required`}</span>${feedback?`<span class="stage-status ${feedback.correct?'ok':'error'}">${feedback.correct?'Correct. Progress saved.':escapeHtml(feedback.message||'Not correct yet. Read the output and try again.')}</span>`:''}</div></div>${workspace}<div class="stage-footer-nav"><button id="previousStage" class="button button-light" type="button" ${state.stageIndex===0?'disabled':''}>Previous</button><button id="nextStage" class="button button-light" type="button" ${state.stageIndex===topic.exercises.length-1?'disabled':''}>Next</button></div></article>`;

    $('previousStage').addEventListener('click',()=>{if(state.stageIndex>0){state.stageIndex--;state.lastValidation=null;resetRunState();state.terminalLines=['Python console ready for this stage.'];render();}});
    $('nextStage').addEventListener('click',()=>{if(state.stageIndex<topic.exercises.length-1){state.stageIndex++;state.lastValidation=null;resetRunState();state.terminalLines=['Python console ready for this stage.'];render();}});
    if(ex.mode==='code') bindCode(ex); else bindChoice(ex);
  }

  function setRuntimeBadge(mode,label){
    const badge=$('runtimeStatus');
    if(!badge) return;
    badge.className=`colab-runtime-badge ${mode||''}`.trim();
    badge.textContent=label||'Python runtime';
  }

  function syncTerminal(){
    const terminal=$('terminalOutput');
    if(!terminal) return;
    terminal.textContent=state.terminalLines.join('\n');
    terminal.scrollTop=terminal.scrollHeight;
  }

  function clearTerminal(message='Python console ready.'){
    state.terminalLines=[message];
    syncTerminal();
  }

  function appendTerminal(text){
    state.terminalLines.push(String(text??''));
    syncTerminal();
  }

  async function ensureRuntime(){
    if(state.pyodide) return state.pyodide;
    if(state.runtimePromise) return state.runtimePromise;
    state.runtimePromise=(async()=>{
      try{
        setRuntimeBadge('loading','Loading Python…');
        if(typeof window.loadPyodide!=='function') throw new Error('Pyodide did not load.');
        const py=await window.loadPyodide({indexURL:PYODIDE_INDEX});
        state.pyodide=py;
        setRuntimeBadge('ready','Python ready');
        clearTerminal('Python 3 runtime ready.');
        return py;
      }catch(err){
        state.runtimePromise=null;
        setRuntimeBadge('error','Python unavailable');
        clearTerminal(`Runtime error: ${err.message}`);
        throw err;
      }
    })();
    return state.runtimePromise;
  }

  async function executePython(source,{recordForValidation=false,exerciseKey=null}={}){
    const code=String(source??'');
    if(!code.trim()) throw new Error('The Python cell is empty. Write your solution before pressing Run.');
    const py=await ensureRuntime();
    const stdout=[];
    const stderr=[];
    py.setStdout({batched:m=>stdout.push(m)});
    py.setStderr({batched:m=>stderr.push(m)});
    let result;
    try{
      result=await py.runPythonAsync(code);
      if(result!==undefined && result!==null){
        const text=String(result);
        if(text!=='None') stdout.push(text);
        if(typeof result.destroy==='function') result.destroy();
      }
    }catch(err){
      stderr.push(String(err?.message||err));
    }

    const output=stdout.join('\n').trim();
    const errors=stderr.join('\n').trim();
    state.executionCount+=1;
    const count=$('executionCount');
    if(count) count.textContent=`[${state.executionCount}]`;
    appendTerminal(`In [${state.executionCount}]:`);
    if(output) appendTerminal(output);
    if(errors) appendTerminal(`ERROR\n${errors}`);

    if(recordForValidation){
      if(errors){
        resetRunState();
      }else{
        state.lastCode=code;
        state.lastOutput=output;
        state.lastRunKey=exerciseKey;
        state.lastRunOk=Boolean(output || lastScalar(output));
      }
    }

    if(errors) throw new Error(errors);
    return output;
  }

  function bindCode(ex){
    const editor=$('codeEditor');
    const toolbarRun=$('runCode');
    const gutterRun=$('runCellButton');
    const runButtons=[toolbarRun,gutterRun].filter(Boolean);

    editor.addEventListener('input',()=>{saveDraft(state.stageIndex,editor.value);resetRunState();});
    editor.addEventListener('keydown',event=>{
      if(event.key==='Tab'){
        event.preventDefault();
        const start=editor.selectionStart,end=editor.selectionEnd;
        editor.value=editor.value.slice(0,start)+'    '+editor.value.slice(end);
        editor.selectionStart=editor.selectionEnd=start+4;
        saveDraft(state.stageIndex,editor.value);
        resetRunState();
      }
    });

    $('resetCode').addEventListener('click',()=>{
      editor.value=topic.slug==='operations'?'':(ex.code||'');
      saveDraft(state.stageIndex,editor.value);
      resetRunState();
      clearTerminal(topic.slug==='operations'?'Cell cleared. Build your solution from the instructions.':'Starter code restored. Run the cell again.');
    });

    const runCurrentCell=async()=>{
      const code=editor.value;
      if(!code.trim()){
        resetRunState();
        appendTerminal('The Python cell is empty. Write your solution before pressing Run.');
        return;
      }
      runButtons.forEach(button=>button.disabled=true);
      setRuntimeBadge('loading','Running…');
      try{
        const output=await executePython(code,{recordForValidation:true,exerciseKey:ex.key});
        if(!output){
          resetRunState();
          appendTerminal('The cell ran, but it did not produce a visible value. Use print(...) or finish with an expression.');
        }
        setRuntimeBadge('ready','Python ready');
      }catch(error){
        resetRunState();
        setRuntimeBadge('error','Python error');
      }finally{
        runButtons.forEach(button=>button.disabled=false);
      }
    };

    toolbarRun.addEventListener('click',runCurrentCell);
    gutterRun.addEventListener('click',runCurrentCell);

    $('clearTerminal').addEventListener('click',()=>clearTerminal());
    $('terminalForm').addEventListener('submit',async event=>{
      event.preventDefault();
      const input=$('terminalCommand');
      const command=input.value.trim();
      if(!command) return;
      appendTerminal(`>>> ${command}`);
      input.value='';
      try{
        await executePython(command,{recordForValidation:false});
        setRuntimeBadge('ready','Python ready');
      }catch{
        setRuntimeBadge('error','Python error');
      }
      input.focus();
    });

    $('validateCode').addEventListener('click',async()=>{
      if(!state.lastRunOk || state.lastRunKey!==ex.key || state.lastCode!==editor.value){
        appendTerminal('Run this exact version of the cell successfully before validating it.');
        return;
      }
      await validate(ex,state.lastOutput,editor.value);
    });

    ensureRuntime().catch(()=>{});
  }

  function bindChoice(ex){
    $('validateChoice').addEventListener('click',async()=>{
      const selected=document.querySelector('input[name="choice"]:checked');
      if(!selected){state.lastValidation={key:ex.key,correct:false};renderStage();return;}
      await validate(ex,selected.value,null);
    });
  }

  async function validate(ex,answer,codeSnapshot){
    const saved=state.registration||getSession();
    if(!saved) return;
    try{
      const data=await rpc(config.rpc.submit,{p_registration_id:saved.registrationId,p_access_token:saved.accessToken,p_topic_slug:topic.slug,p_item_key:ex.key,p_answer:String(answer??''),p_code_snapshot:codeSnapshot});
      state.snapshot=data.snapshot;
      state.lastValidation={key:ex.key,correct:Boolean(data.correct)};
      if(data.correct){
        const next=topic.exercises.findIndex(item=>!serverItem(item.key)?.correct);
        if(next>=0) state.stageIndex=next;
        resetRunState();
        state.terminalLines=['Python console ready for this stage.'];
      }
      render();
    }catch(error){
      state.lastValidation={key:ex.key,correct:false,message:error.message};
      render();
    }
  }

  function renderCompletion(){
    const panel=$('completionPanel');
    const nextTopic=topicList.find(item=>item.sequence===topic.sequence+1);
    panel.classList.remove('hidden');
    panel.innerHTML=`<div><p class="eyebrow">TOPIC COMPLETE</p><h2>${escapeHtml(topic.title)} mastered.</h2><p>All required workshop stages are correct. ${nextTopic?`${escapeHtml(nextTopic.title)} is now unlocked.`:'You completed the complete Python foundations path.'}</p></div><div class="completion-actions"><a class="button button-light" href="theory.html?topic=${encodeURIComponent(topic.slug)}">Review theory</a>${nextTopic?`<a class="button button-dark" href="theory.html?topic=${encodeURIComponent(nextTopic.slug)}">Open next theory</a>`:'<a class="button button-dark" href="./">Return to hub</a>'}</div>`;
  }

  document.addEventListener('DOMContentLoaded',async()=>{
    const ok=await resume();
    if(!ok){
      $('accessPanel').classList.remove('hidden');
      $('accessPanel').innerHTML='<p class="eyebrow">ACCESS REQUIRED</p><h1>Open the Learning Hub first.</h1><p>You need an active registered learning path, and this topic must be unlocked.</p><a class="button button-dark" href="./">Open Learning Hub</a>';
      return;
    }
    render();
  });
})();
