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
const key=`ijr-seminar-specialized-workshop-v5:${slug}:${stageNo}`;
const doneKey=`${key}:done`;
const profileKey=cfg.localPrefix+slug;
const gatewayUrl=`${cfg.supabaseUrl}/functions/v1/${cfg.gatewayFunction}`;
const homeHref=`${slug}/`;
const theoryHref=`theory.html?track=${encodeURIComponent(slug)}&stage=${stageNo}`;
const workshopHref=`workshop.html?track=${encodeURIComponent(slug)}&stage=${stageNo}`;
function profileToken(){try{return JSON.parse(localStorage.getItem(profileKey)||'{}').profileToken||''}catch{return ''}}
async function logEvent(eventType,taskCount=null){
  const editToken=profileToken(); if(!editToken)return;
  try{await fetch(gatewayUrl,{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.supabasePublishableKey,'Authorization':`Bearer ${cfg.supabasePublishableKey}`},body:JSON.stringify({action:'learning-event',edit_token:editToken,track_slug:slug,stage_no:stageNo,event_type:eventType,payload:{topic_title:stage.title,task_count:taskCount}})});}catch(err){console.warn('Learning event not recorded',err)}
}
function top(){return `<header class="topbar"><a class="brand" href="${homeHref}"><span class="brand-mark">IJR</span><span><small>Instituto Jorge Robledo · Seminar 11</small><strong>${esc(track.title)} · ${mode==='theory'?'Theory':'Workshop'}</strong></span></a><div class="top-actions"><a class="button button-light" href="${homeHref}">Track hub</a><a class="button button-dark" href="${mode==='theory'?workshopHref:theoryHref}">${mode==='theory'?'Open Workshop':'Review Theory'}</a></div></header>`}
function pager(){const p=stageNo>1?stageNo-1:null,n=stageNo<4?stageNo+1:null;return `<nav class="learning-pager">${p?`<a class="button button-light" href="${mode}.html?track=${encodeURIComponent(slug)}&stage=${p}">← Topic ${p}</a>`:'<span></span>'}<a class="button button-light" href="${homeHref}">All ${esc(track.title)} topics</a>${n?`<a class="button button-dark" href="${mode}.html?track=${encodeURIComponent(slug)}&stage=${n}">Topic ${n} →</a>`:'<span></span>'}</nav>`}
function theory(){
  const concepts=(stage.concepts||[]).map(c=>`<li>${esc(c)}</li>`).join('');
  app.innerHTML=`${top()}<main class="learning-shell"><section class="learning-hero"><div><p class="eyebrow">${esc(track.title)} · TOPIC ${String(stageNo).padStart(2,'0')} · THEORY</p><h1>${esc(stage.title)}</h1><p>${esc(stage.focus)}</p><div class="learning-actions"><a class="button button-dark" href="${workshopHref}">Continue to Workshop →</a></div></div><aside class="learning-status-card"><span>ENGINEERING LOOP</span><strong>understand → trace → modify → test → explain</strong><small>The worked code is a model to study, not a solution to copy into the workshop.</small></aside></section><section class="theory-layout-v5"><article class="learning-panel"><p class="eyebrow">01 · CORE IDEA</p><h2>What this topic means</h2><p class="lead-copy">${esc(stage.theory)}</p></article><article class="learning-panel"><p class="eyebrow">02 · CONCEPT CHECKLIST</p><h2>What you must be able to explain</h2><ul class="concept-list-v5">${concepts}</ul></article><article class="learning-panel code-learning-panel"><p class="eyebrow">03 · WORKED CODE</p><h2>${esc(stage.lab)}</h2><p>Read the code line by line. Predict its behavior before running or modifying it.</p><pre><code>${esc(stage.code)}</code></pre></article><article class="learning-panel"><p class="eyebrow">04 · ENGINEERING INTERPRETATION</p><h2>Connect the concept to the project</h2><p><strong>Focus:</strong> ${esc(stage.focus)}</p><p>In the ${esc(track.project)} project, this topic should produce evidence that you can apply the concept deliberately, test the result, and explain why your implementation is correct.</p><div class="theory-bridge"><strong>Ready?</strong><span>The workshop starts from blank or partial work and does not reveal a completed answer.</span><a class="button button-dark" href="${workshopHref}">Open Workshop</a></div></article></section>${pager()}</main>`;
  logEvent('theory_opened');
}
function tasks(){const c=(stage.concepts||[]);return [
  {k:'Explain',p:`Explain in your own words: ${c[0]||stage.focus}. Give one concrete example from ${track.title}.`,s:''},
  {k:'Code trace',p:'Before running anything, predict the important output or state change of the worked code from Theory. Identify the exact line or condition responsible.',s:''},
  {k:'Specific practice',p:`Write a solution for this stage goal: ${stage.lab}`,s:''},
  {k:'Modify',p:'Change the stage solution for one boundary, invalid, or alternate case. Explain what changed and why.',s:''},
  {k:'Test',p:'Design at least three verification cases: one normal case, one boundary case, and one invalid/failure case. Record the expected result for each.',s:'Normal:\nBoundary:\nInvalid/failure:'},
  {k:'Defend',p:`Write a short technical defense connecting your implementation to this focus: ${stage.focus}. State one design decision and one limitation.`,s:'Design decision:\nReason:\nLimitation:'}
]}
function loadDraft(){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}}
function saveDraft(d){try{localStorage.setItem(key,JSON.stringify(d))}catch{}}
function workshop(){const list=tasks(),draft=loadDraft(),done=localStorage.getItem(doneKey)==='1';app.innerHTML=`${top()}<main class="learning-shell"><section class="learning-hero workshop-hero"><div><p class="eyebrow">${esc(track.title)} · TOPIC ${String(stageNo).padStart(2,'0')} · WORKSHOP</p><h1>${esc(stage.title)} Workshop</h1><p>Write, trace, modify, test, and explain. Your responses autosave in this browser. Use Theory as reference, but produce your own work.</p><div class="learning-actions"><a class="button button-light" href="${theoryHref}">← Review Theory</a></div></div><aside class="learning-status-card"><span>WORKSHOP EVIDENCE</span><strong>${list.length} practical tasks</strong><small>Completion requires a substantive response in every task.</small></aside></section><section class="workshop-stack-v5">${list.map((t,i)=>`<article class="workshop-task-v5"><div class="task-head-v5"><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(t.k)}</strong></div><h2>${esc(t.p)}</h2>${t.s?`<pre class="starter-v5"><code>${esc(t.s)}</code></pre>`:''}<label>Your work<textarea data-task="${i}" spellcheck="false" placeholder="Write your reasoning, code, tests, or evidence here…">${esc(draft[i]||'')}</textarea></label></article>`).join('')}</section><section class="workshop-submit-v5"><div><strong id="saveState">${done?'Workshop marked complete':'Draft autosaves locally'}</strong><span>Complete all six tasks before marking the workshop complete.</span></div><button id="completeWorkshop" class="button button-dark" type="button">${done?'Completed ✓':'Mark workshop complete'}</button></section><p id="workshopStatus" class="status" role="status"></p>${pager()}</main>`;
 document.querySelectorAll('[data-task]').forEach(a=>a.addEventListener('input',()=>{const d=loadDraft();d[a.dataset.task]=a.value;saveDraft(d);document.getElementById('saveState').textContent='Draft saved';}));
 document.getElementById('completeWorkshop')?.addEventListener('click',async()=>{const d=loadDraft();const ok=list.every((_,i)=>String(d[i]||'').trim().length>=20);const st=document.getElementById('workshopStatus');if(!ok){st.textContent='Complete every task with a substantive response before marking the workshop complete.';st.className='status error';return;}localStorage.setItem(doneKey,'1');document.getElementById('completeWorkshop').textContent='Completed ✓';document.getElementById('saveState').textContent='Workshop marked complete';st.textContent='Workshop completion recorded on this browser.';st.className='status ok';await logEvent('workshop_completed',list.length);});
 logEvent('workshop_opened',list.length);
}
document.title=`Seminar 11 · ${track.title} · ${stage.title} · ${mode==='theory'?'Theory':'Workshop'}`;
mode==='theory'?theory():workshop();
})();
