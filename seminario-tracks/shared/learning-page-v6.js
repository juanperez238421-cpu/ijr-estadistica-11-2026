(()=>{
'use strict';
const cfg=globalThis.IJR_SPECIALIZED_HUB_CONFIG;
const catalog=globalThis.IJR_SPECIALIZED_TRACKS;
const app=document.getElementById('learningApp');
const params=new URLSearchParams(location.search);
const slug=params.get('track')||'';
const stageNo=Number(params.get('stage'));
const track=catalog?.[slug];
const stage=track?.stages?.find(s=>Number(s.n)===stageNo);
const mode=document.body.dataset.mode==='workshop'?'workshop':'theory';
if(!cfg||!track||!stage||!app){document.body.innerHTML='<main style="padding:40px;font-family:sans-serif"><h1>Topic unavailable</h1><p>Return to the Specialized Learning Hubs and choose a valid topic.</p></main>';return;}

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const homeHref=`${slug}/`;
const theoryHref=`theory.html?track=${encodeURIComponent(slug)}&stage=${stageNo}`;
const workshopHref=`workshop.html?track=${encodeURIComponent(slug)}&stage=${stageNo}`;
const profileKey=cfg.localPrefix+slug;
const gatewayUrl=`${cfg.supabaseUrl}/functions/v1/${cfg.gatewayFunction}`;
const storageKey=`ijr-seminar-specialized-workshop-v6:${slug}:${stageNo}`;
const doneKey=`${storageKey}:done`;

const models={
  web:{title:'Web application model',flow:['Semantic interface and user event','Domain rule / validation','Persistence or external-data boundary'],defense:['Which responsibility belongs in the UI and which belongs in the domain model?','What invalid input or failed request must the feature handle?','How will you prove that rendering and persistence are safe and predictable?'],mistakes:['Putting domain rules only inside DOM event handlers.','Rendering user-provided content without deliberate safe output handling.','Implementing only the happy path and ignoring validation or failed asynchronous operations.']},
  'data-science':{title:'Data-analysis pipeline',flow:['Raw dataset and data dictionary','Inspect / clean / validate','Analyze / visualize / report'],defense:['Why is this statistic or chart appropriate for the question?','What data-quality issue could change the conclusion?','Can the complete result be reproduced from the raw file?'],mistakes:['Computing statistics before inspecting types, missing values, and data meaning.','Treating every outlier as an error without investigation.','Hard-coding final values instead of keeping a reproducible pipeline.']},
  cybersecurity:{title:'Defensive security model',flow:['Asset and trust boundary','Validation / access policy','Audit evidence and safe response'],defense:['Where is the trusted authorization decision enforced?','What sensitive information must never appear in logs or public source code?','Which defensive test demonstrates that the mitigation works without attacking an external system?'],mistakes:['Enforcing authorization only by hiding controls in the interface.','Recording passwords, tokens, or other secrets in logs or repositories.','Testing outside an explicitly authorized defensive scope.']},
  '3d-programming':{title:'Parametric geometry model',flow:['Parameters and units','Geometry / transforms','Composition / validation / export'],defense:['Which parameters define the model and which constraints keep them valid?','Which coordinate frame and units are used by every operation?','How can you prove that a change in parameters regenerates a valid result?'],mistakes:['Mixing units or coordinate frames without an explicit conversion.','Generating geometry from impossible or unvalidated dimensions.','Coupling geometry rules directly to UI or export details.']},
  robotics:{title:'Automation control model',flow:['Sensor / input','Controller or state machine','Actuator / safe output'],defense:['What input causes each state transition or actuator command?','What is the defined safe behavior when a sensor is invalid?','Which sequence of normal, boundary, and failure inputs proves the controller works?'],mistakes:['Driving an actuator directly from an unchecked sensor reading.','Designing no explicit fail-safe state or interlock.','Testing only one nominal input instead of sequences and boundary cases.']}
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
function modelCard(){
  return `<div class="specialized-model-v6">${model.flow.map((x,i)=>`<article><strong>${String(i+1).padStart(2,'0')} · ${i===0?'Input / foundation':i===1?'Core responsibility':'Evidence / output'}</strong><span>${esc(x)}</span></article>`).join('')}</div>`;
}
function masteryEvidence(){
  return [
    `Explain the core idea of ${stage.title} without reading the code.`,
    `Trace the worked implementation and predict its important output or state change.`,
    `Build or modify a solution for: ${stage.lab}`,
    'Test one normal case, one boundary case, and one invalid or failure case.',
    `Connect the topic to the ${track.project} project and defend one design decision.`
  ];
}
function theory(){
  const concepts=stage.concepts.map((c,i)=>`<div class="concept-item"><strong>${String(i+1).padStart(2,'0')} · Core idea</strong><span>${esc(c)}</span></div>`).join('');
  const mistakes=[...model.mistakes,`Skipping explicit reasoning about this topic focus: ${stage.focus}.`];
  app.innerHTML=`${top()}<main class="page-shell">
    <div class="crumbs"><a href="${homeHref}">${esc(track.title)} Hub</a><span>→</span><span>${esc(stage.title)}</span><span>→</span><span>Theory</span></div>
    <section class="page-hero"><p class="eyebrow">TOPIC ${String(stageNo).padStart(2,'0')} · THEORY · ${esc(stage.language)}</p><h1>${esc(stage.title)}</h1><p>${esc(stage.focus)}</p></section>

    <section class="content-grid">
      <article class="panel"><p class="eyebrow">MENTAL MODEL</p><h2>What the technical idea means</h2><p>${esc(stage.theory)}</p><div class="concept-list">${concepts}</div><div class="callout"><strong>Design question:</strong> How does this concept change the behavior, structure, reliability, or evidence of the ${esc(track.project)}?</div></article>
      <aside class="panel soft"><p class="eyebrow">TECHNICAL MODEL</p><h2>${esc(model.title)}</h2><p>Read the topic through the same model-first logic used in OOP + UML: define responsibilities and boundaries before implementation details.</p>${modelCard()}<div class="callout"><strong>Engineering loop:</strong> understand → model → implement → test → defend.</div></aside>
    </section>

    <section class="content-grid">
      <article class="panel"><p class="eyebrow">IMPLEMENTATION BRIDGE</p><h2>${esc(stage.lab)}</h2><div class="code-card"><pre>${esc(stage.code)}</pre></div><p>Trace the code line by line before changing it. Identify the input, the important state or transformation, and the observable result.</p></article>
      <aside class="panel"><p class="eyebrow">COMMON DESIGN FAILURES</p><h2>What to avoid</h2><ul class="mistake-list">${mistakes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="callout"><strong>QA rule:</strong> a solution is incomplete if it runs but the student cannot explain the model, test boundary cases, or justify the design.</div></aside>
    </section>

    <section class="content-grid">
      <article class="panel"><p class="eyebrow">PROJECT CONNECTION</p><h2>${esc(track.project)}</h2><p>This topic is not an isolated programming exercise. It becomes evidence for the specialized project when the student can apply the concept deliberately, test the result, and explain how the decision affects the system.</p><div class="qa-grid"><article><strong>Topic goal</strong><p>${esc(stage.focus)}</p></article><article><strong>Workshop target</strong><p>${esc(stage.lab)}</p></article></div></article>
      <aside class="panel soft"><p class="eyebrow">DEFENSE QUESTIONS</p><h2>Be ready to explain</h2><div class="defense-grid-v6">${model.defense.map((q,i)=>`<article><strong>${String(i+1).padStart(2,'0')}</strong><span>${esc(q)}</span></article>`).join('')}</div></aside>
    </section>

    <section class="panel" style="margin-top:28px"><p class="eyebrow">MASTERY EVIDENCE</p><h2>What should exist before leaving this topic</h2><ul class="evidence-list">${masteryEvidence().map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="page-actions"><a class="button button-light" href="${homeHref}">Back to Hub</a><a class="button button-dark" href="${workshopHref}">Continue to Workshop</a></div></section>
    ${pager()}
  </main>`;
  logEvent('theory_opened');
}

function starter(){
  const l=String(stage.language||'').toLowerCase();
  if(l.includes('html'))return `<!-- ${stage.title} workshop -->\n<!-- Build your own solution here. Do not copy the Theory example verbatim. -->\n`;
  if(l.includes('javascript'))return `// ${stage.title} workshop\n// Build your own solution here.\n`;
  return `# ${stage.title} workshop\n# Build your own solution here. Do not copy the Theory example verbatim.\n`;
}
function loadDraft(){try{return JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{return {}}}
function saveDraft(d){localStorage.setItem(storageKey,JSON.stringify(d))}
function accessRequired(){
  app.innerHTML=`${top()}<section class="access-note"><p class="eyebrow">REGISTRATION REQUIRED</p><h1>Open the specialized Learning Hub first.</h1><p>This workshop records evidence against the active Seminar 11 specialized profile. Return to the track hub, register/start the diagnostic, then open the workshop again.</p><a class="button button-dark" href="${homeHref}">Open ${esc(track.title)} Hub</a></section>`;
}
function workshop(){
  if(!profileToken()){accessRequired();return;}
  const draft=loadDraft();const done=localStorage.getItem(doneKey)==='1';
  const checks=draft.checks||{};
  app.innerHTML=`${top()}<main class="page-shell">
    <div class="crumbs"><a href="${homeHref}">${esc(track.title)} Hub</a><span>→</span><span>${esc(stage.title)}</span><span>→</span><span>Workshop</span></div>
    <section class="page-hero"><p class="eyebrow">TOPIC ${String(stageNo).padStart(2,'0')} · WORKSHOP · ${esc(stage.language)}</p><h1>${esc(stage.title)}</h1><p>${esc(stage.focus)}</p><div id="completionHeader" class="status-banner ${done?'ok':''}">${done?'Workshop evidence recorded.':'Workshop evidence not recorded yet.'}</div></section>

    <section class="panel" style="margin-top:28px"><p class="eyebrow">ENGINEERING WORKFLOW</p><h2>Do not jump directly to code.</h2><div class="workshop-steps">
      <div class="workshop-step"><span>STEP 01</span><strong>Predict</strong><p>State what you expect the system, data, geometry, security rule, or controller to do before implementation.</p></div>
      <div class="workshop-step"><span>STEP 02</span><strong>Model</strong><p>Represent the technical structure using the ${esc(model.title)} and identify the responsibility of each element.</p></div>
      <div class="workshop-step"><span>STEP 03</span><strong>Implement</strong><p>${esc(stage.lab)}</p></div>
      <div class="workshop-step"><span>STEP 04</span><strong>Test</strong><p>Use a normal case, boundary case, and invalid/failure case.</p></div>
      <div class="workshop-step"><span>STEP 05</span><strong>Modify</strong><p>Change one requirement, parameter, input, policy, or state transition and propagate the change deliberately.</p></div>
      <div class="workshop-step"><span>STEP 06</span><strong>Explain</strong><p>Defend why the implementation matches the model and what limitation remains.</p></div>
    </div></section>

    <section class="content-grid">
      <article class="panel"><p class="eyebrow">TASK BRIEF</p><h2>${esc(stage.lab)}</h2><p>Produce your own implementation. Use Theory as a reference for the concept, not as a finished answer to copy.</p><div class="qa-grid"><article><strong>Concept</strong><p>${esc(stage.theory)}</p></article><article><strong>Focus</strong><p>${esc(stage.focus)}</p></article><article><strong>Normal case</strong><p>Show expected behavior with valid input.</p></article><article><strong>Failure case</strong><p>Show what happens with invalid, missing, unsafe, or boundary input.</p></article></div></article>
      <aside class="panel soft"><p class="eyebrow">MODEL TARGET</p><h2>${esc(model.title)}</h2>${modelCard()}<p class="callout">This is a modeling target, not a finished answer. Your implementation may differ if responsibilities, boundaries, and tests remain coherent.</p></aside>
    </section>

    <section class="panel workshop-code-panel-v6"><div class="panel-head-v6"><div><p class="eyebrow">LIVE WORKSPACE</p><h2>Your implementation</h2><p>Write the solution you will test and defend. Drafts autosave in this browser.</p></div><span class="session-badge">${esc(stage.language)}</span></div><textarea id="codeWorkspace" class="workspace-editor-v6" spellcheck="false">${esc(draft.code||starter())}</textarea><p class="evidence-helper-v6">The workshop intentionally starts from a blank/partial workspace rather than revealing the complete Theory implementation.</p></section>

    <section class="content-grid">
      <article class="panel"><p class="eyebrow">EVIDENCE WORKSPACE</p><h2>Record what you actually completed.</h2><div class="evidence-workspace"><div class="evidence-checks">
        <label><input id="evModel" type="checkbox" ${checks.model?'checked':''}><span><strong>Model</strong><br>I can explain the technical structure and responsibilities before syntax.</span></label>
        <label><input id="evCode" type="checkbox" ${checks.code?'checked':''}><span><strong>Code</strong><br>I implemented the stage goal myself in the workspace.</span></label>
        <label><input id="evTest" type="checkbox" ${checks.test?'checked':''}><span><strong>Test</strong><br>I checked normal, boundary, and invalid/failure behavior.</span></label>
        <label><input id="evExplain" type="checkbox" ${checks.explain?'checked':''}><span><strong>Explain</strong><br>I can defend one design decision and one limitation.</span></label>
      </div><label><strong>Design / test notes · optional</strong><textarea id="evidenceNotes" class="evidence-notes" maxlength="2400" placeholder="Example: I changed the validation rule because…">${esc(draft.notes||'')}</textarea></label><div class="save-strip"><p><span id="completionStamp" class="completion-stamp ${done?'done':''}">${done?'Completed':'Not recorded'}</span><br><small id="saveStatus">All four evidence checks and a substantive implementation are required.</small></p><button id="saveEvidence" class="button button-dark" type="button">Record workshop evidence</button></div></div></article>
      <aside class="panel"><p class="eyebrow">LIVE DEFENSE QUESTIONS</p><h2>Be ready to answer</h2><ol class="evidence-list">${model.defense.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><div class="callout"><strong>Mastery rule:</strong> execution is necessary but not sufficient. The student must connect the concept, technical model, implementation, tests, and project decision.</div></aside>
    </section>

    <section class="panel" style="margin-top:28px"><p class="eyebrow">TOPIC EXIT</p><h2>Before returning to the Hub</h2><ul class="evidence-list">${masteryEvidence().map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="page-actions"><a class="button button-light" href="${homeHref}">Back to Hub</a><a class="button button-light" href="${theoryHref}">Review Theory</a><a class="button button-dark" href="#saveEvidence">Record evidence</a></div></section>
    <p id="workshopStatus" class="inline-status specialized-status-v6" role="status" aria-live="polite"></p>${pager()}
  </main>`;

  const code=document.getElementById('codeWorkspace'),notes=document.getElementById('evidenceNotes');
  function persist(){saveDraft({code:code.value,notes:notes.value,checks:{model:document.getElementById('evModel').checked,code:document.getElementById('evCode').checked,test:document.getElementById('evTest').checked,explain:document.getElementById('evExplain').checked}})}
  [code,notes,...document.querySelectorAll('.evidence-checks input')].forEach(node=>node.addEventListener('input',persist));
  document.getElementById('saveEvidence').addEventListener('click',async()=>{
    persist();const d=loadDraft();const c=d.checks||{};const status=document.getElementById('workshopStatus');
    if(!(c.model&&c.code&&c.test&&c.explain)){status.textContent='Complete all four evidence checks before recording the workshop.';status.className='inline-status error specialized-status-v6';return;}
    if(String(d.code||'').trim().length<40){status.textContent='Add a substantive implementation to the workspace before recording evidence.';status.className='inline-status error specialized-status-v6';return;}
    localStorage.setItem(doneKey,'1');document.getElementById('completionStamp').textContent='Completed';document.getElementById('completionStamp').classList.add('done');document.getElementById('completionHeader').textContent='Workshop evidence recorded.';document.getElementById('completionHeader').classList.add('ok');status.textContent='Workshop evidence recorded. Return to the Hub to see the topic marked completed.';status.className='inline-status ok specialized-status-v6';await logEvent('workshop_completed',6);
  });
  logEvent('workshop_opened',6);
}

document.title=`Seminar 11 · ${track.title} · ${stage.title} · ${mode==='theory'?'Theory':'Workshop'}`;
mode==='theory'?theory():workshop();
})();
