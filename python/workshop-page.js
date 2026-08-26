(() => {
  'use strict';
  const config=window.IJR_PYTHON_HUB_CONFIG;
  const topicMap=window.IJR_PYTHON_HUB_TOPIC_MAP || {};
  const topicList=window.IJR_PYTHON_HUB_TOPICS || [];
  const $=id=>document.getElementById(id);
  const escapeHtml=value=>String(value??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const requested=new URLSearchParams(location.search).get('topic') || 'operations';
  const topic=topicMap[requested];
  if(!config || !window.supabase || !topic){ document.body.innerHTML='<main style="padding:40px;font-family:sans-serif">Workshop could not be loaded.</main>'; return; }

  const client=window.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const state={snapshot:null,registration:null,stageIndex:0,lastOutput:'',lastCode:'',lastRunKey:null,lastRunOk:false,lastValidation:null,runtimeWarmStarted:false};
  const draftKey=`ijr-python-hub-workshop-drafts-v10:${topic.slug}`;

  function getSession(){ try{return JSON.parse(localStorage.getItem(config.sessionStorageKey)||'null');}catch{return null;} }
  function readDrafts(){ try{return JSON.parse(sessionStorage.getItem(draftKey)||'{}');}catch{return {};} }
  function saveDraft(index,value){ const drafts=readDrafts(); drafts[String(index)]=value; sessionStorage.setItem(draftKey,JSON.stringify(drafts)); }
  async function rpc(name,args){ const {data,error}=await client.rpc(name,args); if(error) throw new Error(error.message||'Backend request failed'); return data; }
  function topicProgress(){ return state.snapshot?.topics?.find(item=>item.slug===topic.slug)||null; }
  function serverItem(key){ return topicProgress()?.items?.find(item=>item.key===key)||null; }
  function resetRunState(){ state.lastOutput='';state.lastCode='';state.lastRunKey=null;state.lastRunOk=false; }

  async function resume(){
    const saved=getSession(); if(!saved?.registrationId||!saved?.accessToken) return false;
    try{
      const data=await rpc(config.rpc.resume,{p_registration_id:saved.registrationId,p_access_token:saved.accessToken});
      state.registration=saved; state.snapshot=data.snapshot;
      const p=topicProgress(); if(!p||p.status==='locked') return false;
      const first=topic.exercises.findIndex(ex=>!serverItem(ex.key)?.correct);
      state.stageIndex=first>=0?first:0;
      return true;
    }catch{return false;}
  }

  function render(){
    const p=topicProgress();
    if(!p||p.status==='locked') return renderLocked();
    const reg=state.snapshot.registration;
    const theoryUrl=`theory.html?topic=${encodeURIComponent(topic.slug)}`;
    $('theoryTopLink').href=theoryUrl; $('theoryCrumb').href=theoryUrl;
    $('sessionBadge').textContent=`${reg.group_code} · ${Number(p.percent||0)}%`;
    $('crumbTopic').textContent=`${String(topic.sequence).padStart(2,'0')} · Workshop`;
    $('workshopHero').innerHTML=`<div><p class="eyebrow">TOPIC ${String(topic.sequence).padStart(2,'0')} · WORKSHOP</p><h1>${escapeHtml(topic.title)}</h1><p>${escapeHtml(topic.workshopIntro)}</p><div class="workshop-hero-links"><a class="button button-light" href="${theoryUrl}">Review theory</a></div></div><div class="workshop-percent"><span>Workshop mastery</span><strong>${Number(p.percent||0)}%</strong><div class="progress-track"><span style="width:${Number(p.percent||0)}%"></span></div><small>${Number(p.correct_count||0)} / ${Number(p.total_count||topic.exercises.length)} validated stages</small></div>`;
    $('stageNavTitle').textContent=topic.nav;
    $('stageNavProgress').textContent=`${Number(p.correct_count||0)} / ${Number(p.total_count||topic.exercises.length)} correct`;
    $('stageButtons').innerHTML=topic.exercises.map((ex,i)=>{const item=serverItem(ex.key);return `<button type="button" data-stage="${i}" class="workshop-nav-button ${i===state.stageIndex?'active':''} ${item?.correct?'correct':''}"><span>${String(i+1).padStart(2,'0')}</span><div><strong>${escapeHtml(ex.title)}</strong><small>${item?.correct?'Completed':`${Number(item?.tries||0)} attempt${Number(item?.tries||0)===1?'':'s'}`}</small></div></button>`;}).join('');
    $('stageButtons').querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{state.stageIndex=Number(btn.dataset.stage);resetRunState();state.lastValidation=null;render();}));
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
        <div class="editor-toolbar"><div><strong>Python cell</strong><small>${isBlankContract?'student-authored code':'editable starter code'}</small></div><div class="editor-actions"><button id="resetCode" class="small-button" type="button">${isBlankContract?'Clear cell':'Reset'}</button><button id="runCode" class="small-button primary" type="button" aria-label="Run Python cell">▶ Run cell</button></div></div>
        <textarea id="codeEditor" class="code-editor workshop-editor" spellcheck="false" aria-label="Python code editor">${escapeHtml(initial)}</textarea>
        <div class="output-wrap"><div class="output-label"><span>Output</span><span id="runtimeStatus" class="runtime-badge" role="status" aria-live="polite">Runtime not started</span></div><pre id="codeOutput" class="output" aria-live="polite">Press ▶ Run cell to execute the current Python code.</pre></div>
        <div class="validate-row"><span>Expected answers remain on the course backend, not in this page.</span><button id="validateCode" class="button button-dark" type="button">Validate output</button></div>
      </div>`;
    }else{
      workspace=`<div class="choice-workspace"><div class="choice-list">${ex.choices.map(choice=>`<label class="choice-option"><input type="radio" name="choice" value="${escapeHtml(choice)}"><span>${escapeHtml(choice)}</span></label>`).join('')}</div><div class="validate-row"><span>Select one answer and validate it.</span><button id="validateChoice" class="button button-dark" type="button">Validate answer</button></div></div>`;
    }
    $('stageMount').innerHTML=`<article class="workshop-stage-card"><div class="stage-problem"><div class="stage-kicker">Stage ${state.stageIndex+1} of ${topic.exercises.length}</div><h2>${escapeHtml(ex.title)}</h2><p>${escapeHtml(ex.prompt)}</p><div class="stage-status-row"><span class="stage-status ${item.correct?'ok':''}">${item.correct?'✓ Completed correctly':`Attempts: ${Number(item.tries||0)} · Correct validation required`}</span>${feedback?`<span class="stage-status ${feedback.correct?'ok':'error'}">${feedback.correct?'Correct. Progress saved.':escapeHtml(feedback.message||'Not correct yet. Read the output and try again.')}</span>`:''}</div></div>${workspace}<div class="stage-footer-nav"><button id="previousStage" class="button button-light" type="button" ${state.stageIndex===0?'disabled':''}>Previous</button><button id="nextStage" class="button button-light" type="button" ${state.stageIndex===topic.exercises.length-1?'disabled':''}>Next</button></div></article>`;
    $('previousStage').addEventListener('click',()=>{if(state.stageIndex>0){state.stageIndex--;state.lastValidation=null;resetRunState();render();}});
    $('nextStage').addEventListener('click',()=>{if(state.stageIndex<topic.exercises.length-1){state.stageIndex++;state.lastValidation=null;resetRunState();render();}});
    if(ex.mode==='code') bindCode(ex); else bindChoice(ex);
  }

  function setRuntimeBadge(status){
    const badge=$('runtimeStatus');
    if(!badge) return;
    const detail=typeof status==='string'?status:status?.detail;
    const phase=typeof status==='string'?'idle':status?.phase;
    badge.textContent=detail||'Python runtime';
    badge.className=`runtime-badge ${phase==='ready'?'ready':phase==='running'||phase==='initializing'||phase==='downloading'||phase==='checking'?'loading':''}`.trim();
  }

  function warmRuntime(){
    if(state.runtimeWarmStarted || !window.IJR_PYODIDE_RUNTIME) return;
    state.runtimeWarmStarted=true;
    window.IJR_PYODIDE_RUNTIME.prepare(status=>setRuntimeBadge(status)).catch(()=>{
      state.runtimeWarmStarted=false;
    });
  }

  function bindCode(ex){
    const editor=$('codeEditor');
    const runButton=$('runCode');
    const output=$('codeOutput');
    editor.addEventListener('input',()=>{saveDraft(state.stageIndex,editor.value);resetRunState();});
    editor.addEventListener('keydown',event=>{if(event.key==='Tab'){event.preventDefault();const start=editor.selectionStart,end=editor.selectionEnd;editor.value=editor.value.slice(0,start)+'    '+editor.value.slice(end);editor.selectionStart=editor.selectionEnd=start+4;saveDraft(state.stageIndex,editor.value);resetRunState();}});
    $('resetCode').addEventListener('click',()=>{editor.value=topic.slug==='operations'?'':(ex.code||'');saveDraft(state.stageIndex,editor.value);resetRunState();output.textContent=topic.slug==='operations'?'Cell cleared. Build your solution from the instructions.':'Starter code restored. Run the cell again.';});

    runButton.addEventListener('click',async()=>{
      const code=editor.value;
      if(!code.trim()){
        resetRunState();
        output.textContent='The Python cell is empty. Write your solution before pressing Run.';
        setRuntimeBadge({phase:'idle',detail:'Waiting for code'});
        return;
      }
      if(!window.IJR_PYODIDE_RUNTIME){
        resetRunState();
        output.textContent='Python runtime module is unavailable. Reload the workshop and try again.';
        setRuntimeBadge({phase:'error',detail:'Runtime module missing'});
        return;
      }

      runButton.disabled=true;
      const originalLabel=runButton.textContent;
      runButton.textContent='Running…';
      output.textContent='Executing Python…';
      try{
        const result=await window.IJR_PYODIDE_RUNTIME.run(code,{onStatus:status=>setRuntimeBadge(status)});
        state.lastCode=code;
        state.lastOutput=result.output;
        state.lastRunKey=ex.key;
        state.lastRunOk=true;
        output.textContent=result.output||'(cell executed successfully with no visible output)';
        setRuntimeBadge({phase:'ready',detail:'Python ready'});
      }catch(error){
        resetRunState();
        output.textContent=error?.message||String(error);
        setRuntimeBadge({phase:'error',detail:'Python error'});
      }finally{
        runButton.disabled=false;
        runButton.textContent=originalLabel;
      }
    });

    $('validateCode').addEventListener('click',async()=>{
      if(!state.lastRunOk || state.lastRunKey!==ex.key || state.lastCode!==editor.value){
        output.textContent='Run this exact version of the cell successfully before validating it.';
        return;
      }
      await validate(ex,state.lastOutput,editor.value);
    });

    const runtimeStatus=window.IJR_PYODIDE_RUNTIME?.getStatus?.();
    if(runtimeStatus?.ready) setRuntimeBadge({phase:'ready',detail:'Python ready'});
    else warmRuntime();
  }

  function bindChoice(ex){
    $('validateChoice').addEventListener('click',async()=>{const selected=document.querySelector('input[name="choice"]:checked');if(!selected){state.lastValidation={key:ex.key,correct:false};renderStage();return;}await validate(ex,selected.value,null);});
  }

  async function validate(ex,answer,codeSnapshot){
    const saved=state.registration||getSession(); if(!saved) return;
    try{
      const data=await rpc(config.rpc.submit,{p_registration_id:saved.registrationId,p_access_token:saved.accessToken,p_topic_slug:topic.slug,p_item_key:ex.key,p_answer:String(answer??''),p_code_snapshot:codeSnapshot});
      state.snapshot=data.snapshot; state.lastValidation={key:ex.key,correct:Boolean(data.correct)};
      if(data.correct){
        const next=topic.exercises.findIndex(item=>!serverItem(item.key)?.correct);
        if(next>=0) state.stageIndex=next;
        resetRunState();
      }
      render();
    }catch(error){state.lastValidation={key:ex.key,correct:false,message:error.message};render();}
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
