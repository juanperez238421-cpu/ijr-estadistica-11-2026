(()=>{
'use strict';
const cfg=globalThis.IJR_SPECIALIZED_HUB_CONFIG;
const catalog=globalThis.IJR_SPECIALIZED_TRACKS;
const extraCatalog=globalThis.IJR_SPECIALIZED_V7_CONTENT||{};
const app=document.getElementById('learningApp');
const params=new URLSearchParams(location.search);
const slug=params.get('track')||'';
const stageNo=Number(params.get('stage'));
const track=catalog?.[slug];
const stage=track?.stages?.find(s=>Number(s.n)===stageNo);
const extra=extraCatalog?.[slug]?.[stageNo];
const mode=document.body.dataset.mode==='workshop'?'workshop':'theory';
if(!cfg||!track||!stage||!extra||!app){document.body.innerHTML='<main style="padding:40px;font-family:sans-serif"><h1>Topic unavailable</h1><p>Return to the Specialized Learning Hubs and choose a valid topic.</p></main>';return;}

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const homeHref=`${slug}/`;
const theoryHref=`theory.html?track=${encodeURIComponent(slug)}&stage=${stageNo}`;
const workshopHref=`workshop.html?track=${encodeURIComponent(slug)}&stage=${stageNo}`;
const profileKey=cfg.localPrefix+slug;
const gatewayUrl=`${cfg.supabaseUrl}/functions/v1/${cfg.gatewayFunction}`;
const v6StorageKey=`ijr-seminar-specialized-workshop-v6:${slug}:${stageNo}`;
const storageKey=`ijr-seminar-specialized-workshop-v7:${slug}:${stageNo}`;
const doneKey=`${v6StorageKey}:done`;
let pyodideInstance=null;
let autosaveTimer=null;

const models={
  web:{title:'Web application model',flow:['Semantic interface / user event','Domain rule / validation','Persistence or external-data boundary'],mistakes:['Putting domain rules only inside DOM event handlers.','Rendering user-provided content without deliberate safe output handling.','Implementing only the happy path and ignoring failed asynchronous operations.']},
  'data-science':{title:'Data-analysis pipeline',flow:['Raw dataset + data dictionary','Inspect / clean / validate','Analyze / visualize / report'],mistakes:['Computing statistics before inspecting types, missing values and meaning.','Treating every outlier as an error without investigation.','Hard-coding final values instead of preserving a reproducible pipeline.']},
  cybersecurity:{title:'Defensive security model',flow:['Asset + trust boundary','Validation / access policy','Audit evidence + safe response'],mistakes:['Enforcing authorization only by hiding controls in the interface.','Recording passwords, tokens or other secrets in logs/repositories.','Testing outside an explicitly authorized local or simulated defensive scope.']},
  '3d-programming':{title:'Parametric geometry model',flow:['Parameters + units','Geometry / transforms','Composition / validation / export'],mistakes:['Mixing units or coordinate frames without explicit conversion.','Generating geometry from impossible or unvalidated dimensions.','Coupling geometry rules directly to UI or export details.']},
  robotics:{title:'Automation control model',flow:['Sensor / input','Controller or state machine','Actuator / safe output'],mistakes:['Driving an actuator directly from an unchecked sensor reading.','Defining no explicit fail-safe state or interlock.','Testing only one nominal input instead of sequences and boundaries.']}
};
const model=models[slug];

function profileToken(){try{return JSON.parse(localStorage.getItem(profileKey)||'{}').profileToken||''}catch{return ''}}
async function logEvent(eventType,taskCount=null){
  const editToken=profileToken();if(!editToken)return;
  try{
    await fetch(gatewayUrl,{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.supabasePublishableKey,'Authorization':`Bearer ${cfg.supabasePublishableKey}`},body:JSON.stringify({action:'learning-event',edit_token:editToken,track_slug:slug,stage_no:stageNo,event_type:eventType,payload:{topic_title:stage.title,task_count:taskCount}})});
  }catch(err){console.warn('Learning event not recorded',err)}
}
function top(){
  return `<header class="topbar"><a class="brand" href="${homeHref}"><span class="brand-mark">IJR</span><span><small>Seminar 11 · Specialized Track</small><strong>${esc(track.title)} · ${mode==='theory'?'Theory':'Workshop'}</strong></span></a><div class="top-actions"><a class="button button-light" href="${homeHref}">Learning Hub</a><a class="button button-dark" href="${mode==='theory'?workshopHref:theoryHref}">${mode==='theory'?'Open Workshop':'Review Theory'}</a></div></header>`;
}
function pager(){
  const prev=stageNo>1?stageNo-1:null,next=stageNo<4?stageNo+1:null;
  return `<nav class="topic-pager-v6">${prev?`<a class="button button-light" href="${mode}.html?track=${encodeURIComponent(slug)}&stage=${prev}">← Topic ${prev}</a>`:'<span></span>'}<a class="button button-light" href="${homeHref}">All ${esc(track.title)} topics</a>${next?`<a class="button button-dark" href="${mode}.html?track=${encodeURIComponent(slug)}&stage=${next}">Topic ${next} →</a>`:'<span></span>'}</nav>`;
}
function modelCard(){return `<div class="specialized-model-v6">${model.flow.map((x,i)=>`<article><strong>${String(i+1).padStart(2,'0')} · ${i===0?'Input / foundation':i===1?'Core responsibility':'Evidence / output'}</strong><span>${esc(x)}</span></article>`).join('')}</div>`}
function objectiveList(){return extra.objectives.map(x=>`<li>${esc(x)}</li>`).join('')}
function masteryEvidence(){return [
  `Explain ${stage.title} in your own words and connect it to ${track.project}.`,
  'Trace the worked example before executing or modifying it.',
  `Produce your own implementation for: ${stage.lab}`,
  'Record evidence for a normal, boundary and invalid/failure case.',
  'Modify one requirement and explain what changed in the model and code.',
  'Defend one design decision and one remaining limitation.'
]}
function theory(){
  const concepts=stage.concepts.map((c,i)=>`<div class="concept-item"><strong>${String(i+1).padStart(2,'0')} · Core idea</strong><span>${esc(c)}</span></div>`).join('');
  const deep=extra.deep.map(([title,text],i)=>`<article class="deep-card-v7"><span>${String(i+1).padStart(2,'0')}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></article>`).join('');
  const trace=extra.trace.map((x,i)=>`<li><strong>${String(i+1).padStart(2,'0')}</strong><span>${esc(x)}</span></li>`).join('');
  const checkpoints=extra.checkpoints.map((x,i)=>`<article><strong>CHECK ${String(i+1).padStart(2,'0')}</strong><p>${esc(x)}</p><textarea class="checkpoint-input-v7" rows="3" placeholder="Write your reasoning before opening the workshop…"></textarea></article>`).join('');
  const mistakes=[...model.mistakes,`Skipping explicit reasoning about the topic focus: ${stage.focus}.`];
  app.innerHTML=`${top()}<main class="page-shell theory-v7">
    <div class="crumbs"><a href="${homeHref}">${esc(track.title)} Hub</a><span>→</span><span>${esc(stage.title)}</span><span>→</span><span>Theory</span></div>
    <section class="page-hero"><p class="eyebrow">TOPIC ${String(stageNo).padStart(2,'0')} · THEORY · ${esc(stage.language)}</p><h1>${esc(stage.title)}</h1><p>${esc(stage.focus)}</p><div class="theory-meta-v7"><span>${esc(track.project)}</span><span>${esc(stage.language)}</span><span>Model → Code → Test → Defend</span></div></section>

    <nav class="theory-nav-v7" aria-label="Theory sections"><a href="#objectives">Objectives</a><a href="#mental-model">Mental model</a><a href="#deep-dive">Deep dive</a><a href="#worked-code">Worked code</a><a href="#case">Case</a><a href="#checkpoints">Checkpoints</a></nav>

    <section id="objectives" class="content-grid">
      <article class="panel"><p class="eyebrow">WHY THIS MATTERS</p><h2>Connect the concept to engineering decisions.</h2><p class="lead-copy-v7">${esc(extra.why)}</p><div class="callout"><strong>Topic focus:</strong> ${esc(stage.focus)}</div></article>
      <aside class="panel soft"><p class="eyebrow">LEARNING OBJECTIVES</p><h2>By the end of this topic</h2><ul class="evidence-list objective-list-v7">${objectiveList()}</ul></aside>
    </section>

    <section id="mental-model" class="content-grid">
      <article class="panel"><p class="eyebrow">MENTAL MODEL</p><h2>What the technical idea means</h2><p>${esc(stage.theory)}</p><div class="concept-list">${concepts}</div><div class="callout"><strong>Design question:</strong> How does this concept change the behavior, structure, reliability or evidence of the ${esc(track.project)}?</div></article>
      <aside class="panel soft"><p class="eyebrow">TECHNICAL MODEL</p><h2>${esc(model.title)}</h2><p>Define responsibilities, inputs and boundaries before implementation details.</p>${modelCard()}<div class="callout"><strong>Engineering loop:</strong> understand → model → implement → test → defend.</div></aside>
    </section>

    <section id="deep-dive" class="panel section-v7"><p class="eyebrow">DEEP DIVE</p><h2>Three ideas to understand before coding.</h2><div class="deep-grid-v7">${deep}</div></section>

    <section id="worked-code" class="content-grid">
      <article class="panel"><p class="eyebrow">WORKED IMPLEMENTATION</p><h2>${esc(stage.lab)}</h2><div class="code-card"><pre id="theoryCode">${esc(stage.code)}</pre></div><div class="code-actions-v7"><button id="copyTheoryCode" class="button button-light" type="button">Copy example</button><a class="button button-dark" href="${workshopHref}">Build your own version</a></div></article>
      <aside class="panel"><p class="eyebrow">CODE READING</p><h2>Trace before you run.</h2><ol class="trace-list-v7">${trace}</ol><div class="callout"><strong>Rule:</strong> do not copy the worked example into the workshop unchanged. The workshop requires a new or modified implementation plus test evidence.</div></aside>
    </section>

    <section id="case" class="content-grid">
      <article class="panel soft"><p class="eyebrow">APPLIED CASE</p><h2>Transfer the concept.</h2><p class="case-copy-v7">${esc(extra.case)}</p><div class="callout"><strong>Before coding:</strong> identify input, rule/responsibility, output and one failure condition.</div></article>
      <aside class="panel"><p class="eyebrow">COMMON DESIGN FAILURES</p><h2>What to avoid</h2><ul class="mistake-list">${mistakes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></aside>
    </section>

    <section id="checkpoints" class="panel section-v7"><p class="eyebrow">CONCEPT CHECKPOINT</p><h2>Answer before opening the Workshop.</h2><p>These are reasoning prompts, not graded multiple-choice questions. Use them to expose gaps before implementation.</p><div class="checkpoint-grid-v7">${checkpoints}</div></section>

    <section class="content-grid">
      <article class="panel"><p class="eyebrow">PROJECT CONNECTION</p><h2>${esc(track.project)}</h2><p>This topic becomes project evidence when the student can apply the idea deliberately, test it and explain how the decision changes the system.</p><div class="qa-grid"><article><strong>Topic goal</strong><p>${esc(stage.focus)}</p></article><article><strong>Workshop target</strong><p>${esc(stage.lab)}</p></article></div></article>
      <aside class="panel soft"><p class="eyebrow">MASTERY EVIDENCE</p><h2>Exit criteria</h2><ul class="evidence-list">${masteryEvidence().map(x=>`<li>${esc(x)}</li>`).join('')}</ul></aside>
    </section>

    <section class="panel section-v7"><div class="page-actions"><a class="button button-light" href="${homeHref}">Back to Hub</a><a class="button button-dark" href="${workshopHref}">Continue to functional Workshop</a></div></section>${pager()}
  </main>`;
  document.getElementById('copyTheoryCode')?.addEventListener('click',async e=>{await navigator.clipboard?.writeText(stage.code);e.currentTarget.textContent='Copied';setTimeout(()=>e.currentTarget.textContent='Copy example',1200)});
  logEvent('theory_opened');
}

function starter(){
  const l=String(stage.language||'').toLowerCase();
  if(l.includes('html'))return `<!-- ${stage.title} workshop -->\n<!-- Build your own solution. Add semantic HTML and your JavaScript behavior. -->\n`;
  if(l.includes('javascript'))return `// ${stage.title} workshop\n// Build your own solution here.\n// Add your own inputs/tests below.\n`;
  return `# ${stage.title} workshop\n# Build your own solution here.\n# Add your own inputs/tests below.\n`;
}
function loadDraft(){
  try{
    const current=JSON.parse(localStorage.getItem(storageKey)||'null');if(current)return current;
    const old=JSON.parse(localStorage.getItem(v6StorageKey)||'null');if(old)return {code:old.code||starter(),notes:old.notes||'',prediction:'',model:'',modification:'',explanation:'',tests:{normal:{expected:'',observed:''},boundary:{expected:'',observed:''},failure:{expected:'',observed:''}},fixture:''};
  }catch{}
  return {code:starter(),prediction:'',model:'',modification:'',explanation:'',tests:{normal:{expected:'',observed:''},boundary:{expected:'',observed:''},failure:{expected:'',observed:''}},fixture:''};
}
function collectDraft(){
  return {prediction:value('predictionInput'),model:value('modelInput'),code:value('codeWorkspace'),fixture:value('fixtureWorkspace'),modification:value('modificationInput'),explanation:value('explanationInput'),tests:{normal:{expected:value('normalExpected'),observed:value('normalObserved')},boundary:{expected:value('boundaryExpected'),observed:value('boundaryObserved')},failure:{expected:value('failureExpected'),observed:value('failureObserved')}},lastRunOk:document.getElementById('runStatus')?.dataset.ok==='1',updatedAt:new Date().toISOString()};
}
function saveDraft(){localStorage.setItem(storageKey,JSON.stringify(collectDraft()));updateProgress()}
function value(id){return document.getElementById(id)?.value?.trim()||''}
function accessRequired(){app.innerHTML=`${top()}<section class="access-note"><p class="eyebrow">REGISTRATION REQUIRED</p><h1>Open the specialized Learning Hub first.</h1><p>This workshop records evidence against the active Seminar 11 specialized profile. Return to the track hub, register/start the diagnostic, then open the workshop again.</p><a class="button button-dark" href="${homeHref}">Open ${esc(track.title)} Hub</a></section>`}
function field(id,label,prompt,valueText='',rows=5){return `<label class="response-field-v7"><strong>${esc(label)}</strong><span>${esc(prompt)}</span><textarea id="${id}" rows="${rows}" placeholder="Write specific evidence in your own words…">${esc(valueText)}</textarea></label>`}
function testsHtml(draft){
  const rows=[['normal','Normal case','Use valid/expected input.'],['boundary','Boundary case','Use an edge value or transition boundary.'],['failure','Invalid / failure case','Use invalid, missing, unsafe or failed input.']];
  return `<div class="test-matrix-v7"><div class="test-head-v7"><span>Case</span><span>Expected before run</span><span>Observed / evidence</span></div>${rows.map(([k,title,desc])=>`<div class="test-row-v7"><div><strong>${title}</strong><small>${desc}</small></div><textarea id="${k}Expected" rows="3" placeholder="Predict first…">${esc(draft.tests?.[k]?.expected||'')}</textarea><textarea id="${k}Observed" rows="3" placeholder="Record actual result / trace…">${esc(draft.tests?.[k]?.observed||'')}</textarea></div>`).join('')}</div>`
}
function runtimeKind(){const l=String(stage.language||'').toLowerCase();if(l.includes('html'))return 'html';if(l.includes('javascript'))return 'javascript';if(l.includes('python'))return 'python';return 'trace'}
async function ensurePyodide(){
  if(pyodideInstance)return pyodideInstance;
  const status=document.getElementById('runStatus');status.textContent='Loading Python runtime…';
  if(typeof globalThis.loadPyodide!=='function')throw new Error('Python runtime is unavailable. Reload the page and try again.');
  pyodideInstance=await globalThis.loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'});
  return pyodideInstance;
}
function writeOutput(text,type=''){const out=document.getElementById('runtimeOutput');out.textContent=String(text||'No textual output.');out.className=`runtime-output-v7 ${type}`.trim()}
async function runPython(code){
  const py=await ensurePyodide();const output=[];py.setStdout({batched:s=>output.push(s)});py.setStderr({batched:s=>output.push(`stderr: ${s}`)});
  await py.loadPackagesFromImports(code);const result=await py.runPythonAsync(code);if(result!==undefined&&result!==null)output.push(String(result));writeOutput(output.join('\n')||'Python executed successfully.','ok');
}
function runSandbox(code,kind,fixture=''){
  return new Promise((resolve,reject)=>{
    const frame=document.getElementById('runtimeFrame');const token=`run-${Date.now()}-${Math.random().toString(36).slice(2)}`;const logs=[];let settled=false;
    const cleanup=()=>window.removeEventListener('message',listener);
    const listener=e=>{if(e.source!==frame.contentWindow||e.data?.token!==token)return;if(e.data.type==='log')logs.push(e.data.text);if(e.data.type==='error'){settled=true;cleanup();reject(new Error(e.data.text))}if(e.data.type==='done'){settled=true;cleanup();writeOutput(logs.join('\n')||'Browser code executed successfully.','ok');resolve()}};
    window.addEventListener('message',listener);
    const bridge=`<script>(function(){const t=${JSON.stringify(token)};const send=(type,text)=>parent.postMessage({token:t,type,text:String(text)},'*');const fmt=x=>{try{return typeof x==='object'?JSON.stringify(x):String(x)}catch{return String(x)}};console.log=(...a)=>send('log',a.map(fmt).join(' '));console.error=(...a)=>send('log','error: '+a.map(fmt).join(' '));window.addEventListener('error',e=>send('error',e.message));window.addEventListener('unhandledrejection',e=>send('error',e.reason));setTimeout(()=>send('done','done'),120);})();</script>`;
    const csp=`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'">`;
    frame.srcdoc=kind==='html'?`<!doctype html><html><head>${csp}${bridge}</head><body>${code}</body></html>`:`<!doctype html><html><head>${csp}${bridge}</head><body>${fixture||'<main id="app"></main>'}<script>${code.replace(/<\/script/gi,'<\\/script')}</script></body></html>`;
    setTimeout(()=>{if(!settled){cleanup();writeOutput(logs.join('\n')||'Preview loaded.','ok');resolve()}},1200);
  })
}
async function runCode(){
  const button=document.getElementById('runCode');const status=document.getElementById('runStatus');button.disabled=true;status.textContent='Running…';status.dataset.ok='0';writeOutput('Running…');
  try{
    const code=document.getElementById('codeWorkspace').value;const kind=runtimeKind();if(code.trim().length<8)throw new Error('Write an implementation before running it.');
    if(kind==='python')await runPython(code);else if(kind==='javascript'||kind==='html')await runSandbox(code,kind,document.getElementById('fixtureWorkspace')?.value||'');else{writeOutput('Runtime execution is not available for this language. Record a manual trace instead.');throw new Error('No browser runtime for this language.');}
    status.textContent='Run successful · record the observed evidence below.';status.className='status-banner ok';status.dataset.ok='1';
  }catch(err){writeOutput(err?.message||String(err),'error');status.textContent='Run failed · inspect the output, modify the implementation and run again.';status.className='status-banner error';status.dataset.ok='0';
  }finally{button.disabled=false;saveDraft()}
}
function progressState(){
  const draft=collectDraft();const tests=Object.values(draft.tests||{});const codeMeaningful=(draft.code||'').replace(/^[\s\S]*?Build your own solution[^\n]*\n?/,'').trim().length>=20;
  return {predict:draft.prediction.length>=20,model:draft.model.length>=30,implement:codeMeaningful&&draft.lastRunOk,test:tests.length===3&&tests.every(t=>t.expected.length>=8&&t.observed.length>=8),modify:draft.modification.length>=20,explain:draft.explanation.length>=30};
}
function updateProgress(){
  const s=progressState();const count=Object.values(s).filter(Boolean).length;const pct=Math.round(count/6*100);const bar=document.getElementById('workshopProgressBar');const copy=document.getElementById('workshopProgressCopy');const complete=document.getElementById('completeWorkshop');if(bar)bar.style.width=`${pct}%`;if(copy)copy.textContent=`${count}/6 engineering steps evidenced · ${pct}%`;document.querySelectorAll('[data-step]').forEach(n=>n.classList.toggle('done',!!s[n.dataset.step]));if(complete)complete.disabled=count<6;
}
function workshop(){
  if(!profileToken()){accessRequired();return;}
  const draft=loadDraft();const done=localStorage.getItem(doneKey)==='1';const kind=runtimeKind();const fixture=slug==='web'&&kind==='javascript';
  app.innerHTML=`${top()}<main class="page-shell workshop-v7">
    <div class="crumbs"><a href="${homeHref}">${esc(track.title)} Hub</a><span>→</span><span>${esc(stage.title)}</span><span>→</span><span>Workshop</span></div>
    <section class="page-hero"><p class="eyebrow">TOPIC ${String(stageNo).padStart(2,'0')} · FUNCTIONAL WORKSHOP · ${esc(stage.language)}</p><h1>${esc(stage.title)}</h1><p>${esc(stage.focus)}</p><div id="completionHeader" class="status-banner ${done?'ok':''}">${done?'Workshop evidence previously recorded. You can continue improving it.':'Complete all six evidence steps. Drafts autosave locally.'}</div></section>

    <section class="workshop-progress-v7"><div><strong>Workshop progress</strong><span id="workshopProgressCopy">0/6 engineering steps evidenced</span></div><div class="progress-track"><span id="workshopProgressBar"></span></div></section>

    <section class="panel section-v7"><p class="eyebrow">ENGINEERING WORKFLOW</p><h2>Predict → Model → Implement → Test → Modify → Explain</h2><div class="workshop-steps workshop-steps-v7">
      <div class="workshop-step" data-step="predict"><span>STEP 01</span><strong>Predict</strong><p>State expected behavior before execution.</p></div><div class="workshop-step" data-step="model"><span>STEP 02</span><strong>Model</strong><p>Represent responsibilities, boundaries and data flow.</p></div><div class="workshop-step" data-step="implement"><span>STEP 03</span><strong>Implement</strong><p>Write and successfully run your own solution.</p></div><div class="workshop-step" data-step="test"><span>STEP 04</span><strong>Test</strong><p>Normal + boundary + invalid/failure evidence.</p></div><div class="workshop-step" data-step="modify"><span>STEP 05</span><strong>Modify</strong><p>Change one requirement and propagate it.</p></div><div class="workshop-step" data-step="explain"><span>STEP 06</span><strong>Explain</strong><p>Defend one design choice and limitation.</p></div>
    </div></section>

    <section class="content-grid">
      <article class="panel"><p class="eyebrow">TASK BRIEF</p><h2>${esc(stage.lab)}</h2><p>${esc(extra.case)}</p><div class="qa-grid"><article><strong>Topic focus</strong><p>${esc(stage.focus)}</p></article><article><strong>Runtime</strong><p>${kind==='python'?'Python / Pyodide in browser':kind==='html'?'Sandboxed HTML + JavaScript preview':'Sandboxed JavaScript runner'}</p></article></div></article>
      <aside class="panel soft"><p class="eyebrow">MODEL TARGET</p><h2>${esc(model.title)}</h2>${modelCard()}<div class="callout"><strong>Do not copy Theory verbatim.</strong> The evidence must show your own model, implementation, tests and modification.</div></aside>
    </section>

    <section class="panel section-v7"><p class="eyebrow">STEP 01 · PREDICT</p><h2>State the result before execution.</h2>${field('predictionInput','Prediction',extra.workshop.predict,draft.prediction||'',5)}</section>
    <section class="panel section-v7"><p class="eyebrow">STEP 02 · MODEL</p><h2>Make responsibilities explicit.</h2>${field('modelInput','Technical model',extra.workshop.model,draft.model||'',6)}</section>

    <section class="panel workshop-code-panel-v7 section-v7"><div class="panel-head-v7"><div><p class="eyebrow">STEP 03 · IMPLEMENT + RUN</p><h2>Your executable implementation</h2><p>Write your own code, run it, inspect the output, then revise it.</p></div><span class="session-badge">${esc(stage.language)}</span></div>
      ${fixture?`<label class="response-field-v7 compact"><strong>Optional HTML fixture</strong><span>Add the DOM elements your JavaScript needs. This is executed only inside the sandboxed preview.</span><textarea id="fixtureWorkspace" rows="5" spellcheck="false">${esc(draft.fixture||'')}</textarea></label>`:'<textarea id="fixtureWorkspace" class="hidden"></textarea>'}
      <textarea id="codeWorkspace" class="workspace-editor-v6 workspace-editor-v7" spellcheck="false">${esc(draft.code||starter())}</textarea>
      <div class="runtime-actions-v7"><button id="runCode" class="button button-dark" type="button">▶ Run / Preview</button><button id="resetCode" class="button button-light" type="button">Reset to blank scaffold</button><button id="saveDraft" class="button button-light" type="button">Save draft</button></div>
      <div id="runStatus" class="status-banner" data-ok="${draft.lastRunOk?'1':'0'}">${draft.lastRunOk?'Previous saved run was successful. Run again after changes.':'Run your code to generate execution evidence.'}</div><pre id="runtimeOutput" class="runtime-output-v7">Execution output will appear here.</pre><iframe id="runtimeFrame" class="runtime-frame-v7" title="Sandboxed workshop preview" sandbox="allow-scripts"></iframe>
    </section>

    <section class="panel section-v7"><p class="eyebrow">STEP 04 · TEST</p><h2>Predict and record three distinct cases.</h2><p>Do not write “works.” Record the expected behavior before the run and the observed result or trace afterward.</p>${testsHtml(draft)}</section>
    <section class="panel section-v7"><p class="eyebrow">STEP 05 · MODIFY</p><h2>Change one requirement deliberately.</h2>${field('modificationInput','Modification evidence',extra.workshop.modify,draft.modification||'',5)}</section>
    <section class="panel section-v7"><p class="eyebrow">STEP 06 · EXPLAIN</p><h2>Defend the engineering decision.</h2>${field('explanationInput','Defense',extra.workshop.explain,draft.explanation||'',6)}</section>

    <section class="content-grid">
      <article class="panel"><p class="eyebrow">AUTOMATIC EVIDENCE GATE</p><h2>Completion is derived from evidence.</h2><div class="evidence-gates-v7"><span data-gate="predict">Prediction</span><span data-gate="model">Model</span><span data-gate="implement">Successful run</span><span data-gate="test">3 test cases</span><span data-gate="modify">Modification</span><span data-gate="explain">Defense</span></div><p class="evidence-helper-v6">The completion button remains locked until every engineering step has substantive evidence and the implementation has run successfully.</p></article>
      <aside class="panel soft"><p class="eyebrow">FINAL CHECK</p><h2>Record workshop completion</h2><p>Completion records only the topic event in the Seminar backend; your working draft remains in this browser so you can continue editing it.</p><button id="completeWorkshop" class="button button-dark" type="button" disabled>Record workshop evidence</button><p id="saveStatus" class="inline-status" role="status" aria-live="polite"></p></aside>
    </section>${pager()}
  </main>`;

  ['predictionInput','modelInput','codeWorkspace','fixtureWorkspace','normalExpected','normalObserved','boundaryExpected','boundaryObserved','failureExpected','failureObserved','modificationInput','explanationInput'].forEach(id=>document.getElementById(id)?.addEventListener('input',()=>{clearTimeout(autosaveTimer);autosaveTimer=setTimeout(saveDraft,250)}));
  document.getElementById('runCode')?.addEventListener('click',runCode);
  document.getElementById('saveDraft')?.addEventListener('click',()=>{saveDraft();const s=document.getElementById('saveStatus');s.textContent='Draft saved locally.';s.className='inline-status ok'});
  document.getElementById('resetCode')?.addEventListener('click',()=>{if(confirm('Reset only the code workspace to the blank scaffold? Your written evidence will remain.')){document.getElementById('codeWorkspace').value=starter();const status=document.getElementById('runStatus');status.dataset.ok='0';status.textContent='Code reset. Run again after implementing your solution.';saveDraft()}});
  document.getElementById('completeWorkshop')?.addEventListener('click',completeWorkshop);
  logEvent('workshop_opened');updateProgress();
}
async function completeWorkshop(){
  const status=document.getElementById('saveStatus');const states=progressState();if(Object.values(states).some(v=>!v)){status.textContent='Complete all six evidence gates first.';status.className='inline-status error';return}
  saveDraft();localStorage.setItem(doneKey,'1');status.textContent='Recording completion…';
  await logEvent('workshop_completed',6);status.textContent='Workshop evidence recorded. You may keep improving the draft.';status.className='inline-status ok';const head=document.getElementById('completionHeader');if(head){head.textContent='Workshop evidence recorded.';head.className='status-banner ok'}
}

if(mode==='theory')theory();else workshop();
})();
