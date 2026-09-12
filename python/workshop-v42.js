(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const config = window.IJR_PYTHON_HUB_CONFIG;
  const topicMap = window.IJR_PYTHON_HUB_TOPIC_MAP || {};
  const topicList = window.IJR_PYTHON_HUB_TOPICS || [];
  const params = new URLSearchParams(location.search);
  const requestedSlug = params.get('topic') || 'statistics';
  const topic = topicMap[requestedSlug] || topicList.find(item => item.slug === requestedSlug);
  const masterPreview = params.get('masterPreview') === '1';
  const TEACHER_SESSION_KEY = 'ijr-stat11-master-teacher-session-v1';
  const PREVIEW_PROGRESS_KEY = 'ijr-stat11-v42-master-preview-progress';
  const MASTER_VALIDATE_RPC = 'python_hub_master_preview_validate_v1';
  const API_TIMEOUT_MS = 12000;
  const SUBMIT_TIMEOUT_MS = 18000;
  const CDN_RUNTIME = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
  const isLocalHost = /^(?:localhost|127\.0\.0\.1)$/.test(location.hostname);
  const localRuntimeOverride = isLocalHost ? params.get('runtimeBase') : '';
  const PYODIDE_INDEX = localRuntimeOverride ? new URL(localRuntimeOverride, location.origin).href.replace(/\/?$/, '/') : CDN_RUNTIME;

  if (!config || !topic || !Array.isArray(topic.exercises) || topic.exercises.length < 1) {
    document.body.innerHTML = '<main style="padding:40px;font-family:Arial,sans-serif"><h1>Workshop could not be loaded.</h1><p>The topic data or configuration is unavailable.</p></main>';
    return;
  }

  const guides = {
    'stat-01': {concept:'Count and total',steps:['Store the five observations in one Python list.','Use a list function that returns how many observations exist.','Use a list function that adds all observations.','Print the two calculated values on separate lines.'],hints:['The two functions you need are len(...) and sum(...).','Create the list first, then call len(values) and sum(values); do not type the final answers directly.']},
    'stat-02': {concept:'Mean as total ÷ count',steps:['Create the dataset exactly as given.','Calculate the total from the list.','Calculate the number of observations from the list.','Divide total by count and print the calculated mean.'],hints:['Mean = sum(values) / len(values).','Store the mean in a variable before printing it so the calculation remains readable.']},
    'stat-03': {concept:'Range as span',steps:['Create the numeric dataset.','Find the largest observation with Python.','Find the smallest observation with Python.','Subtract minimum from maximum and print the result.'],hints:['Use max(...) and min(...).','The order matters: maximum - minimum.']},
    'stat-04': {concept:'Compare observations with the mean',steps:['Create the dataset and calculate its mean.','Start a counter at zero.','Visit each observation with a for loop.','Increase the counter only when an observation is greater than the mean, then print the final counter.'],hints:['The pattern is counter + loop + if.','Initialize count = 0 before the loop; update it only inside the condition.']},
    'stat-05': {concept:'Reusable statistical summary',steps:['Define a function that receives a list named values.','Inside the function calculate mean and range from the received list.','Return both calculated values as a pair.','Call the function with the requested dataset and print the returned pair.'],hints:['A function begins with def and sends results back with return.','Return mean, data_range rather than printing inside the function.']},
    'stat-06': {concept:'Interpret the statistic',steps:['Read each option as a mathematical definition.','Identify which expression measures the full span of a dataset.','Select one option, then validate it with the course backend.'],hints:['Think about the distance from the smallest observation to the largest.','Range is the difference between the maximum and the minimum.']},
    'stat-07': {concept:'Extremes of a dataset',steps:['Create the list of observations.','Ask Python for the smallest value.','Ask Python for the largest value.','Print minimum first and maximum second.'],hints:['Use min(...) and max(...).','Keep the requested output order: minimum, then maximum.']},
    'stat-08': {concept:'Update a dataset before summarizing',steps:['Create the three-value list.','Append the new observation to the same list.','Calculate the mean using the updated list length and total.','Print the calculated mean.'],hints:['Use values.append(...), then compute the mean.','Do not calculate the mean before appending the new observation.']},
    'stat-09': {concept:'Threshold percentage',steps:['Create the five-value dataset.','Start a counter and loop through every observation.','Count each value that meets the threshold.','Convert the count to a percentage using count / len(values) * 100 and print it.'],hints:['The comparison is “at least”, so use >=.','Percentage = qualifying_count / total_count * 100.']},
    'stat-10': {concept:'Compare variability with range',steps:['Create dataset_a and dataset_b exactly as given.','Calculate maximum minus minimum for dataset_a.','Repeat the same calculation for dataset_b.','Print the two ranges in the requested order.'],hints:['Use the same range formula twice.','Keep the datasets separate so you can compare their spreads.']},
    'stat-11': {concept:'Two summaries from one dataset',steps:['Create the dataset.','Calculate the mean from total and count.','Calculate the range from maximum and minimum.','Print mean first and range second.'],hints:['You need sum, len, min and max.','Calculate both statistics from the same list before printing.']},
    'stat-12': {concept:'Count values below the mean',steps:['Create the dataset and calculate its mean.','Initialize a counter before the loop.','Loop through each observation and compare it with the mean.','Increase the counter only for values strictly below the mean, then print the final count.'],hints:['Use < because the instruction says strictly below.','Do not reset the counter inside the loop.']}
  };

  const state = {
    snapshot:null,
    registration:null,
    stageIndex:0,
    runtime:null,
    runtimePromise:null,
    executionCount:0,
    runs:new Map(),
    hints:new Map(),
    booting:false
  };

  const draftKey = `ijr-stat11-v42-drafts:${topic.slug}`;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }
  function readJson(storage,key,fallback){ try{return JSON.parse(storage.getItem(key)||'') ?? fallback;}catch{return fallback;} }
  function readSession(){ return readJson(localStorage, config.sessionStorageKey, null); }
  function readDrafts(){ return readJson(sessionStorage, draftKey, {}); }
  function saveDraft(itemKey,value){ const drafts=readDrafts(); drafts[itemKey]=value; try{sessionStorage.setItem(draftKey,JSON.stringify(drafts));}catch{} }
  function teacherToken(){ try{return sessionStorage.getItem(TEACHER_SESSION_KEY)||'';}catch{return '';} }
  function previewProgress(){ return readJson(sessionStorage, PREVIEW_PROGRESS_KEY, {}); }
  function writePreviewProgress(value){ try{sessionStorage.setItem(PREVIEW_PROGRESS_KEY,JSON.stringify(value));}catch{} }

  function buildPreviewSnapshot(){
    const progress=previewProgress();
    const topics=topicList.map(current=>{
      const completed=new Set(Array.isArray(progress[current.slug])?progress[current.slug]:[]);
      const exercises=Array.isArray(current.exercises)?current.exercises:[];
      const items=exercises.map(ex=>({key:ex.key,correct:completed.has(ex.key),completed:completed.has(ex.key),tries:completed.has(ex.key)?1:0}));
      const correct=items.filter(item=>item.correct).length;
      return {slug:current.slug,status:correct>=items.length&&items.length?'completed':'available',correct_count:correct,total_count:items.length,percent:items.length?Math.round(correct*100/items.length):0,items};
    });
    return {registration:{id:'master-preview',display_id:'MASTER',mode:'master-preview',group_code:'MASTER',team_size:1,display_label:'Teacher preview',status:'active'},members:[],topics,current_topic:topic.slug,completed_topics:topics.filter(t=>t.status==='completed').length,total_topics:topics.length};
  }

  async function postRpc(name,args,{timeoutMs=API_TIMEOUT_MS,retries=0}={}){
    const url=`${config.supabaseUrl}/rest/v1/rpc/${encodeURIComponent(name)}`;
    let lastError=null;
    for(let attempt=0;attempt<=retries;attempt+=1){
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),timeoutMs);
      try{
        const response=await fetch(url,{method:'POST',headers:{apikey:config.supabasePublishableKey,Authorization:`Bearer ${config.supabasePublishableKey}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(args||{}),signal:controller.signal,cache:'no-store'});
        clearTimeout(timer);
        const raw=await response.text();
        let payload=null; try{payload=raw?JSON.parse(raw):null;}catch{payload=raw||null;}
        if(response.ok) return payload;
        const error=new Error(payload?.message||payload?.details||`Backend request failed (${response.status}).`); error.status=response.status; lastError=error;
        if(attempt>=retries || ![408,409,429,500,502,503,504,520,522,524].includes(response.status)) break;
      }catch(error){
        clearTimeout(timer);
        lastError=error?.name==='AbortError'?new Error('Backend request timed out.'):new Error(error?.message||'Network request failed.');
        if(attempt>=retries) break;
      }
      await sleep(300*(2**attempt));
    }
    throw lastError||new Error('Backend request failed.');
  }

  async function resume(){
    if(masterPreview){
      if(!teacherToken()) throw new Error('Teacher preview session is missing or expired. Open Master View again.');
      return {snapshot:buildPreviewSnapshot()};
    }
    const session=readSession();
    if(!session?.registrationId || !session?.accessToken) throw new Error('No active student session was found. Open the Learning Hub and sign in first.');
    state.registration=session;
    return postRpc(config.rpc.resume,{p_registration_id:session.registrationId,p_access_token:session.accessToken},{retries:2});
  }

  async function submit(item,answer,codeSnapshot){
    if(masterPreview){
      const token=teacherToken();
      if(!token) throw new Error('Teacher preview session expired.');
      const result=await postRpc(MASTER_VALIDATE_RPC,{p_teacher_token:token,p_topic_slug:topic.slug,p_item_key:item.key,p_answer:String(answer??''),p_code_snapshot:codeSnapshot??null},{timeoutMs:SUBMIT_TIMEOUT_MS});
      if(result?.correct){
        const progress=previewProgress();
        const set=new Set(Array.isArray(progress[topic.slug])?progress[topic.slug]:[]); set.add(item.key); progress[topic.slug]=[...set]; writePreviewProgress(progress);
      }
      return {...result,preview:true,snapshot:buildPreviewSnapshot()};
    }
    const session=state.registration||readSession();
    if(!session?.registrationId || !session?.accessToken) throw new Error('Student session is unavailable.');
    return postRpc(config.rpc.submit,{p_registration_id:session.registrationId,p_access_token:session.accessToken,p_topic_slug:topic.slug,p_item_key:item.key,p_answer:String(answer??''),p_code_snapshot:codeSnapshot??null},{timeoutMs:SUBMIT_TIMEOUT_MS});
  }

  function topicProgress(){ return state.snapshot?.topics?.find(row=>row.slug===topic.slug)||null; }
  function serverItem(key){ return topicProgress()?.items?.find(item=>item.key===key)||null; }
  function activeExercise(){ return topic.exercises[state.stageIndex]||topic.exercises[0]; }
  function guideFor(ex){
    return guides[ex.key]||{concept:'Plan before coding',steps:['Identify the data or values provided by the problem.','Identify the Python operation or structure needed.','Write the complete solution in the code cell.','Run it, inspect the output, correct errors, then validate.'],hints:['Use the theory page as a syntax reference; do not guess the final answer.','Break the task into input → transformation → output.']};
  }

  function showStartup(title,message){
    $('workshopApp').classList.add('hidden');
    $('startupPanel').classList.remove('hidden');
    $('startupPanel').innerHTML=`<p class="eyebrow">WORKSHOP STARTUP</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p><div class="startup-actions"><button id="retryBoot" class="validate-button" type="button">Retry</button><a class="primary-link" href="${masterPreview?'./?master=1':'./'}">${masterPreview?'Open Master View':'Open Learning Hub'}</a></div>`;
    $('retryBoot')?.addEventListener('click',boot);
  }

  function renderStageList(){
    const progress=topicProgress();
    $('stageList').innerHTML=topic.exercises.map((ex,index)=>{
      const item=serverItem(ex.key); const complete=Boolean(item?.correct);
      return `<button class="stage-button ${index===state.stageIndex?'active':''} ${complete?'stage-complete':''}" type="button" data-stage="${index}"><span class="stage-number">${String(index+1).padStart(2,'0')}</span><span class="stage-copy"><strong>${escapeHtml(ex.title)}</strong><small>${complete?'Validated':`${Number(item?.tries||0)} attempts`}</small></span><span class="stage-check">✓</span></button>`;
    }).join('');
    $('stageList').querySelectorAll('[data-stage]').forEach(button=>button.addEventListener('click',()=>{state.stageIndex=Number(button.dataset.stage);render();}));
    const count=Number(progress?.correct_count||0); const total=Number(progress?.total_count||topic.exercises.length); const percent=Number(progress?.percent||0);
    $('masteryPercent').textContent=`${percent}%`; $('masteryBar').style.width=`${Math.max(0,Math.min(100,percent))}%`; $('masteryCount').textContent=`${count} / ${total} validated`;
  }

  function render(){
    const progress=topicProgress();
    if(!progress){ showStartup('Topic unavailable',`The backend progress snapshot does not include ${topic.slug}.`); return; }
    if(progress.status==='locked' && !masterPreview){ showStartup('Topic locked','Complete the prerequisite workshop first. The release rule is enforced by the course backend.'); return; }
    $('startupPanel').classList.add('hidden'); $('workshopApp').classList.remove('hidden');
    const reg=state.snapshot.registration||{};
    $('sessionBadge').textContent=masterPreview?'MASTER preview':`${reg.group_code||state.registration?.groupCode||'Student'} · ${Number(progress.percent||0)}%`;
    $('topicNavTitle').textContent=topic.nav||topic.title; $('topicTitle').textContent=topic.title; $('topicIntro').textContent=topic.workshopIntro||topic.lead||'';
    $('topicEyebrow').textContent=`TOPIC ${String(topic.sequence||'').padStart(2,'0')} · GUIDED WORKSHOP`; $('notebookTitle').textContent=`Stat11_${String(topic.sequence||'').padStart(2,'0')}_${topic.slug}.ipynb`;
    const theory=`theory.html?topic=${encodeURIComponent(topic.slug)}${masterPreview?'&masterPreview=1':''}`; $('theoryLink').href=theory;
    $('heroStage').textContent=`${String(state.stageIndex+1).padStart(2,'0')} / ${String(topic.exercises.length).padStart(2,'0')}`;
    renderStageList(); renderProblem();
    document.documentElement.dataset.workshopReady='true';
  }

  function renderProblem(){
    const ex=activeExercise(); const item=serverItem(ex.key)||{tries:0,correct:false}; const guide=guideFor(ex); const run=state.runs.get(ex.key)||null;
    $('problemKicker').textContent=`STAGE ${state.stageIndex+1} OF ${topic.exercises.length}`; $('problemTitle').textContent=ex.title; $('problemPrompt').textContent=ex.prompt;
    const chips=[`Attempts: ${Number(item.tries||0)}`]; if(item.correct) chips.push('✓ Validated'); if(run?.ok) chips.push('Python run completed'); if(run && !run.ok) chips.push('Fix the Python error before validating');
    $('problemStatus').innerHTML=chips.map((text,index)=>`<span class="status-chip ${index===1&&item.correct?'ok':(run&&!run.ok&&index===chips.length-1?'error':'')}">${escapeHtml(text)}</span>`).join('');
    $('guideConcept').textContent=guide.concept; $('guideSteps').innerHTML=guide.steps.map(step=>`<li>${escapeHtml(step)}</li>`).join('');
    const hintLevel=state.hints.get(ex.key)||0; $('hintButton').textContent=hintLevel===0?'Show hint':hintLevel===1?'Show another hint':'Hide hints';
    if(hintLevel===0){$('hintBox').classList.add('hidden');$('hintBox').textContent='';}else{$('hintBox').classList.remove('hidden');$('hintBox').innerHTML=guide.hints.slice(0,Math.min(hintLevel,guide.hints.length)).map(h=>`<div>• ${escapeHtml(h)}</div>`).join('');}
    $('previousButton').disabled=state.stageIndex===0; $('nextButton').disabled=state.stageIndex===topic.exercises.length-1;
    $('executionCount').textContent=run?.execution?`[${run.execution}]`:'[ ]';
    $('outputPanel').classList.toggle('hidden',!run?.display); $('outputPanel').classList.toggle('error',Boolean(run && !run.ok)); $('outputText').textContent=run?.output||'';
    const drafts=readDrafts();
    if(ex.mode==='choice'){
      $('codeEditor').classList.add('hidden'); $('choiceEditor').classList.remove('hidden'); $('cellModeLabel').textContent=' · select one answer';
      $('choiceEditor').innerHTML=(ex.choices||[]).map(choice=>`<label class="choice-option"><input type="radio" name="stageChoice" value="${escapeHtml(choice)}"><span>${escapeHtml(choice)}</span></label>`).join('');
      const selected=run?.choice||''; if(selected){const radio=[...document.querySelectorAll('input[name="stageChoice"]')].find(input=>input.value===selected);if(radio)radio.checked=true;}
      document.querySelectorAll('input[name="stageChoice"]').forEach(input=>input.addEventListener('change',()=>{state.runs.set(ex.key,{...state.runs.get(ex.key),choice:input.value,ok:true,display:false,output:'',execution:0});updateValidationState();}));
      $('runButton').disabled=true; $('resetButton').textContent='Clear choice';
    }else{
      $('choiceEditor').classList.add('hidden'); $('codeEditor').classList.remove('hidden'); $('cellModeLabel').textContent=' · write your complete solution'; $('runButton').disabled=false; $('resetButton').textContent='Reset';
      $('codeEditor').value=Object.prototype.hasOwnProperty.call(drafts,ex.key)?drafts[ex.key]:'';
      $('codeEditor').oninput=()=>{saveDraft(ex.key,$('codeEditor').value);state.runs.delete(ex.key);$('outputPanel').classList.add('hidden');$('executionCount').textContent='[ ]';updateValidationState();};
    }
    updateValidationState();
  }

  function updateValidationState(){
    const ex=activeExercise(); const run=state.runs.get(ex.key); let enabled=false;
    if(ex.mode==='choice') enabled=Boolean(run?.choice); else enabled=Boolean(run?.ok && run.code===String($('codeEditor').value||''));
    $('validateButton').disabled=!enabled; $('saveMessage').textContent=enabled?'Ready to validate with the course backend.':'Run the cell, inspect the output, then validate.';
  }

  function setRuntime(mode,label){ $('connectButton').className=`runtime-button ${mode||''}`.trim(); $('runtimeLabel').textContent=label; }

  async function ensureRuntime(){
    if(state.runtime) return state.runtime;
    if(state.runtimePromise) return state.runtimePromise;
    state.runtimePromise=(async()=>{
      setRuntime('loading','Connecting…');
      try{
        if(typeof window.loadPyodide!=='function'){
          await new Promise((resolve,reject)=>{
            const script=document.createElement('script'); script.src=`${PYODIDE_INDEX}pyodide.js`; script.async=true; script.dataset.v42Pyodide='1';
            const timer=setTimeout(()=>{script.remove();reject(new Error('Python runtime download timed out.'));},25000);
            script.onload=()=>{clearTimeout(timer);resolve();}; script.onerror=()=>{clearTimeout(timer);reject(new Error('Python runtime download failed.'));}; document.head.appendChild(script);
          });
        }
        if(typeof window.loadPyodide!=='function') throw new Error('Pyodide loader is unavailable.');
        state.runtime=await window.loadPyodide({indexURL:PYODIDE_INDEX}); setRuntime('ready','Connected'); return state.runtime;
      }catch(error){ state.runtimePromise=null; setRuntime('error','Connection failed'); throw error; }
    })();
    return state.runtimePromise;
  }

  async function runCode(){
    const ex=activeExercise(); if(ex.mode!=='code') return;
    const code=String($('codeEditor').value||''); if(!code.trim()){showOutput('Write your Python solution before running the cell.',false);return;}
    $('runButton').classList.add('running'); $('runButton').disabled=true; $('validateButton').disabled=true; setRuntime('loading',state.runtime?'Running…':'Connecting…');
    try{
      const py=await ensureRuntime(); const stdout=[]; const stderr=[]; py.setStdout({batched:text=>stdout.push(text)}); py.setStderr({batched:text=>stderr.push(text)});
      let result=null;
      try{result=await py.runPythonAsync(code);if(result!==undefined&&result!==null){const text=String(result);if(text!=='None')stdout.push(text);if(typeof result.destroy==='function')result.destroy();}}catch(error){stderr.push(String(error?.message||error));}
      state.executionCount+=1; const ok=stderr.length===0; const output=(ok?stdout:stderr).join('\n').trim()||(ok?'Cell executed with no printed output.':'Python execution failed.');
      state.runs.set(ex.key,{ok,output,display:true,execution:state.executionCount,code}); showOutput(output,ok); $('executionCount').textContent=`[${state.executionCount}]`; setRuntime('ready','Connected');
    }catch(error){state.executionCount+=1;const output=`Runtime error: ${error.message}`;state.runs.set(ex.key,{ok:false,output,display:true,execution:state.executionCount,code});showOutput(output,false);$('executionCount').textContent=`[${state.executionCount}]`;}
    finally{$('runButton').classList.remove('running');$('runButton').disabled=false;updateValidationState();}
  }

  function showOutput(text,ok){ $('outputPanel').classList.remove('hidden'); $('outputPanel').classList.toggle('error',!ok); $('outputText').textContent=String(text??''); }

  async function validate(){
    const ex=activeExercise(); const run=state.runs.get(ex.key); let answer=''; let codeSnapshot=null;
    if(ex.mode==='choice'){answer=run?.choice||'';if(!answer)return;}else{if(!run?.ok||run.code!==String($('codeEditor').value||''))return;answer=run.output||'';codeSnapshot=run.code;}
    $('validateButton').disabled=true; $('validateButton').textContent='Validating…'; $('saveMessage').textContent='Checking your result with Supabase…';
    try{
      const result=await submit(ex,answer,codeSnapshot); if(result?.snapshot)state.snapshot=result.snapshot;else{const refreshed=await resume();state.snapshot=refreshed.snapshot;}
      if(result?.correct){$('saveMessage').textContent='✓ Correct. Progress saved.';}else{$('saveMessage').textContent=result?.message||'Not correct yet. Inspect the problem and try again.';}
      render();
    }catch(error){$('saveMessage').textContent=`Validation failed: ${error.message}`; updateValidationState();}
    finally{$('validateButton').textContent='Validate';}
  }

  function resetActive(){
    const ex=activeExercise(); state.runs.delete(ex.key); state.hints.delete(ex.key); const drafts=readDrafts(); delete drafts[ex.key]; try{sessionStorage.setItem(draftKey,JSON.stringify(drafts));}catch{} renderProblem();
  }

  function toggleHint(){
    const ex=activeExercise(); const guide=guideFor(ex); const current=state.hints.get(ex.key)||0; const next=current===0?1:(current<guide.hints.length?current+1:0); state.hints.set(ex.key,next); renderProblem();
  }

  async function boot(){
    if(state.booting)return; state.booting=true; $('sessionBadge').textContent='Checking progress…';
    try{
      const data=await resume(); if(!data?.snapshot?.registration||!Array.isArray(data.snapshot.topics))throw new Error('The progress service returned an incomplete snapshot.'); state.snapshot=data.snapshot;
      const progress=topicProgress(); if(!progress)throw new Error(`The snapshot does not include ${topic.slug}.`); const first=topic.exercises.findIndex(ex=>!progress.items?.find(item=>item.key===ex.key)?.correct); state.stageIndex=first>=0?first:0; render();
    }catch(error){showStartup('Cannot open the guided workshop',error.message);$('sessionBadge').textContent='Session required';}
    finally{state.booting=false;}
  }

  $('runButton').addEventListener('click',runCode); $('connectButton').addEventListener('click',()=>ensureRuntime().catch(error=>showOutput(`Runtime error: ${error.message}`,false))); $('validateButton').addEventListener('click',validate); $('resetButton').addEventListener('click',resetActive); $('hintButton').addEventListener('click',toggleHint);
  $('previousButton').addEventListener('click',()=>{if(state.stageIndex>0){state.stageIndex-=1;render();}}); $('nextButton').addEventListener('click',()=>{if(state.stageIndex<topic.exercises.length-1){state.stageIndex+=1;render();}});
  $('addCodeButton').addEventListener('click',()=>{$('codeNotebookCell').scrollIntoView({behavior:'smooth',block:'center'});if(!activeExercise()||activeExercise().mode==='code')$('codeEditor').focus();}); $('addTextButton').addEventListener('click',()=>{$('guidePanel').scrollIntoView({behavior:'smooth',block:'center'});$('guidePanel').focus();}); $('clearOutputButton').addEventListener('click',()=>{$('outputPanel').classList.add('hidden');});
  $('codeEditor').addEventListener('keydown',event=>{if(event.key==='Enter'&&event.shiftKey){event.preventDefault();runCode();}});

  boot();
})();
