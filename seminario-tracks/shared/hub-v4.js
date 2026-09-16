(()=>{
'use strict';

const cfg=globalThis.IJR_SPECIALIZED_HUB_CONFIG;
const catalog=globalThis.IJR_SPECIALIZED_TRACKS;
const slug=document.body.dataset.track;
const track=catalog?.[slug];
const root=document.getElementById('app');
if(!cfg||!track||!root){
  document.body.innerHTML='<main style="font-family:sans-serif;padding:40px"><h1>Track unavailable</h1><p>The requested learning hub could not be loaded.</p></main>';
  return;
}

const localKey=cfg.localPrefix+slug;
const gatewayUrl=`${cfg.supabaseUrl}/functions/v1/${cfg.gatewayFunction}`;
const trackLinks=[['web','Web'],['data-science','Data Science'],['cybersecurity','Cybersecurity'],['3d-programming','3D'],['robotics','Robotics']];
const domainNames={foundations:'Foundations',applied_reasoning:'Applied reasoning',workflow_tools:'Tools + workflow',self_profile:'Self-profile'};
const levelInfo={
  foundation:{label:'Foundation',copy:'Core concepts are not yet stable. Begin with guided practice and short evidence checks.'},
  developing:{label:'Developing',copy:'Some foundations are present, but the route still needs examples, checkpoints, and targeted practice.'},
  proficient:{label:'Proficient',copy:'The technical base is functional. The student can begin the standard project route and justify key decisions.'},
  advanced:{label:'Advanced',copy:'The technical base is strong enough for greater autonomy, extension tasks, and architecture decisions.'}
};
let state={profileToken:null,identity:null,session:null,questions:[],answers:{},index:0,report:null,busy:false};

function esc(v=''){
  return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function token(){
  const b=new Uint8Array(32);crypto.getRandomValues(b);
  return [...b].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function save(){
  localStorage.setItem(localKey,JSON.stringify({profileToken:state.profileToken,identity:state.identity,session:state.session,answers:state.answers,index:state.index,report:state.report}));
}
function load(){try{return JSON.parse(localStorage.getItem(localKey)||'null')}catch{return null}}
function resetLocal(){localStorage.removeItem(localKey);state={profileToken:null,identity:null,session:null,questions:[],answers:{},index:0,report:null,busy:false};}

async function gateway(action,payload={}){
  const response=await fetch(gatewayUrl,{
    method:'POST',
    headers:{'Content-Type':'application/json','apikey':cfg.supabasePublishableKey,'Authorization':`Bearer ${cfg.supabasePublishableKey}`},
    body:JSON.stringify({action,...payload})
  });
  let data={};
  try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data?.error||`backend_${response.status}`);
  return data;
}

function stackHtml(){return track.stack.map(x=>`<span>${esc(x)}</span>`).join('')}
function switcherHtml(){
  return trackLinks.map(([s,label])=>`<a class="track-switch ${s===slug?'active':''}" href="${s===slug?'#':`../${s}/`}" ${s===slug?'aria-current="page"':''}>${esc(label)}</a>`).join('');
}
function roadmapHtml(){
  return track.sprints.map(s=>`<article class="sprint"><div class="sprint-top"><span class="sprint-index">SPRINT ${String(s.n).padStart(2,'0')}</span><span class="tag">Project path</span></div><h3>${esc(s.title)}</h3><p>${esc(s.goal)}</p><div class="deliverable"><strong>Deliverable</strong>${esc(s.deliverable)}</div></article>`).join('');
}
function learningHtml(){
  return track.stages.map(stage=>`<article class="learning-stage" id="stage-${stage.n}"><div class="stage-head"><div><p class="eyebrow">LEARNING STAGE ${String(stage.n).padStart(2,'0')}</p><h3>${esc(stage.title)}</h3><p>${esc(stage.focus)}</p></div><span class="stage-number">${stage.n}/4</span></div><div class="stage-grid"><section class="theory-pane"><div class="pane-label">THEORY</div><p class="stage-theory">${esc(stage.theory)}</p><ul>${stage.concepts.map(c=>`<li>${esc(c)}</li>`).join('')}</ul></section><section class="code-pane"><div class="code-pane-top"><div><span class="pane-label">CODING LAB</span><strong>${esc(stage.lab)}</strong></div><span class="language-tag">${esc(stage.language)}</span></div><pre><code>${esc(stage.code)}</code></pre><button class="copy-code" type="button" data-copy-stage="${stage.n}">Copy starter code</button></section></div></article>`).join('');
}

function shell(){
  document.title=`Seminar 11 · ${track.title} Learning Hub`;
  root.innerHTML=`<header class="topbar"><a class="brand" href="../"><span class="brand-mark">IJR</span><span><small>Instituto Jorge Robledo · Seminar 11</small><strong>${esc(track.title)} Learning Hub</strong></span></a><div class="top-actions"><a class="button button-light" href="../">All tracks</a><a class="button button-dark" href="../../seminario-oop-uml/">OOP + UML Core</a></div></header>
  <main class="shell"><section class="hero"><div class="hero-copy"><p class="eyebrow">SOFTWARE ENGINEERING STUDIO · SPECIALIZED TRACK</p><h1>${esc(track.title)}</h1><p>La ruta combina <strong>teoría, código y proyecto</strong>. Primero ubica tu nivel real con el diagnóstico; después estudia las cuatro etapas técnicas y lleva cada concepto al proyecto de ocho sprints.</p><div class="stack">${stackHtml()}</div></div><aside class="project-card"><span>PROJECT FRAME</span><strong>${esc(track.project)}</strong><small>design → model → implement → test → document → defend</small></aside></section>
  <nav class="track-switcher" aria-label="Specialized tracks"><span>FIVE STUDIO PATHS</span><div>${switcherHtml()}</div></nav>
  <section class="section"><div class="section-head"><p class="eyebrow">DIAGNOSTIC 01 · INDIVIDUAL · ENGLISH BASE · BANK V4</p><h2>Measure the real technical baseline.</h2><p>The diagnostic is fully in English and uses practical, track-specific scenarios. It contains 12 scored technical items across four mastery stages plus 3 separate self-profile items. It is not a grade.</p><span class="diagnostic-version">${esc(cfg.bankVersion)} · 12 technical · 4 stages · 3 self-profile</span></div><div id="diagnosticFrame" class="diagnostic-frame" aria-live="polite"></div></section>
  <section class="section learning-section" id="learningAnchor"><div class="section-head"><p class="eyebrow">THEORY + CODING · FOUR TECHNICAL STAGES</p><h2>Comprender el concepto. Verlo en código. Modificarlo.</h2><p>Cada etapa separa la explicación conceptual del laboratorio de código, siguiendo el mismo lenguaje visual del Common Core OOP + UML.</p></div><div class="learning-grid">${learningHtml()}</div></section>
  <section class="section" id="roadmapAnchor"><div class="section-head"><p class="eyebrow">8-SPRINT PROJECT ROADMAP</p><h2>${esc(track.project)}</h2><p>La teoría y los laboratorios alimentan el proyecto. El diagnóstico determina el apoyo recomendado, pero todos los estudiantes avanzan por el mismo marco de ingeniería.</p></div><div class="roadmap">${roadmapHtml()}</div></section>
  <footer class="footer"><span>Instituto Jorge Robledo · Seminar 11 · Third Period 2026</span><span>${esc(track.title)} · ${esc(track.project)}</span></footer></main>`;
  wireCodeCopy();renderDiagnostic();
}

function introHtml(){
  const name=state.identity?.fullName||'';const group=state.identity?.groupCode||'';
  return `<div class="diagnostic-intro"><div><p class="eyebrow">ENTRY BASELINE</p><h3>Knowledge + practical reasoning + self-profile.</h3><p>Answer without searching for external solutions. The goal is to measure what you can already recognize, calculate, debug, and justify inside this specific track. Correct answers remain on the protected backend.</p><div class="diagnostic-facts"><div><strong>12</strong><span>Technical items</span></div><div><strong>4</strong><span>Mastery stages</span></div><div><strong>3</strong><span>Self-profile items</span></div></div><div class="diagnostic-language-note"><strong>English baseline.</strong> Questions, scenarios, code-reading tasks, and self-profile items are presented in English to measure both technical understanding and the ability to work with authentic technical vocabulary.</div></div><form id="startForm" class="registration-box"><p class="eyebrow">INDIVIDUAL REGISTRATION</p><label>Full name<input id="fullName" required minlength="3" maxlength="120" autocomplete="name" placeholder="Full name" value="${esc(name)}"></label><label>Group<select id="groupCode" required><option value="">Select…</option><option ${group==='11-A'?'selected':''}>11-A</option><option ${group==='11-B'?'selected':''}>11-B</option><option ${group==='11-C'?'selected':''}>11-C</option></select></label><button class="button button-dark" type="submit">Start diagnostic</button><p id="startStatus" class="status" role="status"></p></form></div>`;
}

function renderDiagnostic(){
  const frame=document.getElementById('diagnosticFrame');if(!frame)return;
  if(state.report){frame.innerHTML=resultHtml(state.report);wireResult();return;}
  if(state.questions.length&&state.session){frame.innerHTML=testHtml();wireTest();return;}
  frame.innerHTML=introHtml();document.getElementById('startForm')?.addEventListener('submit',startAttempt);
}

function friendlyError(message=''){
  const map={origin_denied:'This origin is not authorized.',invalid_edit_token:'The local session token is invalid.',invalid_registration:'Registration data is incomplete or invalid.',invalid_diagnostic_request:'The diagnostic bank configuration is invalid.',profile_not_found:'Student profile not found.',backend_unavailable:'The backend is temporarily unavailable.',invalid_request:'The backend rejected the request.',question_bank_unavailable:'The question bank is unavailable.',complete_all_questions:'Answer all 15 questions before submitting.'};
  return map[message]||message;
}

async function startAttempt(e){
  e.preventDefault();if(state.busy)return;state.busy=true;
  const status=document.getElementById('startStatus');const fullName=document.getElementById('fullName').value.trim();const groupCode=document.getElementById('groupCode').value;const profileToken=state.profileToken||token();
  status.textContent='Creating secure diagnostic attempt…';status.className='status';
  try{
    await gateway('register',{edit_token:profileToken,full_name:fullName,group_code:groupCode,topics:[track.title],first_choice:track.title,work_mode:'Individual',partner_name:null,project_idea:null});
    const attempt=await gateway('diagnostic-start',{edit_token:profileToken,track_slug:slug,bank_version:cfg.bankVersion});
    const questions=await gateway('diagnostic-questions',{edit_token:profileToken,track_slug:slug,bank_version:cfg.bankVersion});
    if(!Array.isArray(questions)||questions.length!==15)throw new Error('question_bank_unavailable');
    state.profileToken=profileToken;state.identity={fullName,groupCode};state.session={attemptId:attempt.attempt_id,fullName:attempt.full_name||fullName,groupCode:attempt.group_code||groupCode,startedAt:attempt.started_at,bankVersion:attempt.bank_version||cfg.bankVersion};state.questions=questions;state.answers={};state.index=0;state.report=null;save();renderDiagnostic();
  }catch(err){status.textContent=`Could not start: ${friendlyError(err.message)}`;status.className='status error';}
  finally{state.busy=false;}
}

function answeredCount(){return state.questions.reduce((n,q)=>n+(Number.isInteger(state.answers[q.id])?1:0),0)}
function testHtml(){
  const q=state.questions[state.index];const answered=answeredCount();const pct=Math.round(100*answered/state.questions.length);
  const nav=state.questions.map((item,i)=>`<button type="button" data-q="${i}" class="${Number.isInteger(state.answers[item.id])?'answered ':''}${i===state.index?'current':''}" aria-label="Question ${i+1}${Number.isInteger(state.answers[item.id])?', answered':''}">${i+1}</button>`).join('');
  const options=q.options.map((opt,i)=>`<label class="option"><input type="radio" name="answer" value="${i}" ${state.answers[q.id]===i?'checked':''}><span class="option-key">${String.fromCharCode(65+i)}</span><span>${esc(opt)}</span></label>`).join('');
  const stageLabel=q.scored&&q.stage_no?`Stage ${q.stage_no}`:(q.scored?'Technical':'Self-profile');
  const promptBlock=String(q.prompt).includes('\n')?`<pre class="question-code-prompt">${esc(q.prompt)}</pre>`:`<h3>${esc(q.prompt)}</h3>`;
  const skill=q.concept_code?`<span class="tag skill-code">${esc(String(q.concept_code).replaceAll('_',' '))}</span>`:'';
  return `<div class="diagnostic-workspace"><aside class="question-nav"><div class="progress-copy"><strong>${answered}/15 answered</strong><span>${pct}%</span></div><div class="progress-track"><span style="width:${pct}%"></span></div><div class="question-numbers">${nav}</div><div class="legend"><span>● Black = answered</span><span>Outline = current question</span><span>Questions 13–15 are self-profile and do not affect the technical score.</span></div></aside><section class="question-stage"><div class="question-meta"><span class="tag">${esc(stageLabel)}</span><span class="tag">${esc(domainNames[q.domain]||q.domain)}</span>${skill}<span class="tag">Question ${q.position}/15</span></div>${promptBlock}<div class="options">${options}</div><div class="question-actions"><button id="prevBtn" class="button button-light" type="button" ${state.index===0?'disabled':''}>← Previous</button><div><button id="nextBtn" class="button button-light" type="button" ${state.index===state.questions.length-1?'disabled':''}>Next →</button><button id="submitBtn" class="button button-dark" type="button" ${answered===15?'':'disabled'}>Submit diagnostic</button></div></div><p id="testStatus" class="status" role="status"></p></section></div>`;
}

function wireTest(){
  document.querySelectorAll('[data-q]').forEach(b=>b.addEventListener('click',()=>{state.index=Number(b.dataset.q);save();renderDiagnostic();}));
  document.querySelectorAll('input[name="answer"]').forEach(r=>r.addEventListener('change',()=>{state.answers[state.questions[state.index].id]=Number(r.value);save();renderDiagnostic();}));
  document.getElementById('prevBtn')?.addEventListener('click',()=>{state.index=Math.max(0,state.index-1);save();renderDiagnostic();});
  document.getElementById('nextBtn')?.addEventListener('click',()=>{state.index=Math.min(state.questions.length-1,state.index+1);save();renderDiagnostic();});
  document.getElementById('submitBtn')?.addEventListener('click',submitAttempt);
}

async function submitAttempt(){
  if(state.busy||answeredCount()!==15)return;state.busy=true;const status=document.getElementById('testStatus');status.textContent='Scoring securely on the backend…';status.className='status';
  try{
    const report=await gateway('diagnostic-submit',{edit_token:state.profileToken,attempt_id:state.session.attemptId,answers:state.answers});
    state.report=report;save();renderDiagnostic();document.getElementById('diagnosticFrame')?.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(err){status.textContent=`Could not submit: ${friendlyError(err.message)}`;status.className='status error';}
  finally{state.busy=false;}
}

function stageResultsHtml(r){
  return [1,2,3,4].map(n=>{
    const s=r.stage_scores?.[String(n)]||{};const mastered=Boolean(s.mastered);const score=Number(s.score||0);const max=Number(s.max||3);const percent=Number(s.percent||0);
    return `<article class="stage-result ${mastered?'mastered':''}"><strong><span>Stage ${n}</span><span>${score}/${max}</span></strong><div class="bar"><span style="width:${percent}%"></span></div><small>${mastered?'Mastered':'Not yet mastered'} · ${percent}%</small></article>`;
  }).join('');
}
function resultHtml(r){
  const info=levelInfo[r.level]||levelInfo.developing;
  const domains=['foundations','applied_reasoning','workflow_tools'].map(k=>{const d=r.domain_scores?.[k]||{score:0,max:0,percent:0};return `<article class="domain-card"><strong><span>${esc(domainNames[k])}</span><span>${esc(d.score)}/${esc(d.max)}</span></strong><div class="bar"><span style="width:${Number(d.percent)||0}%"></span></div><small>${esc(d.percent)}%</small></article>`;}).join('');
  const recommended=Number(r.recommended_stage||1);const highest=Number(r.highest_mastered_stage||0);
  return `<div class="result"><div class="result-hero"><div><p class="eyebrow">DIAGNOSTIC REPORT · ${esc(r.group_code||state.session?.groupCode||'')}</p><h3>${esc(info.label)} · ${esc(r.knowledge_percent)}%</h3><p>${esc(info.copy)}</p><p><strong>Technical score:</strong> ${esc(r.score)}/${esc(r.max_score)} · <strong>Self-profile:</strong> ${esc(r.confidence_percent)}%</p></div><div class="result-score"><strong>${esc(r.score)}/${esc(r.max_score)}</strong><span>technical knowledge score</span><div style="margin-top:12px"><strong style="font-size:1.6rem">${esc(r.confidence_percent)}%</strong><span>self-profile index · not graded</span></div></div></div><div class="stage-results">${stageResultsHtml(r)}</div><div class="result-recommendation"><strong>Recommended technical start: Stage ${recommended}</strong><span>Highest contiguous mastered stage: ${highest}. A stage requires at least 2/3 correct and the critical question correct.</span></div><div class="domain-grid">${domains}</div><div class="result-note"><strong>Interpretation:</strong> the placement uses the 12 scored technical items only. The three self-profile questions are stored separately and do not raise or lower the technical result.</div><div class="question-actions" style="margin-top:18px"><button id="retakeBtn" class="button button-light" type="button">Start a new attempt</button><a class="button button-dark" href="#learningAnchor">Continue to theory + coding</a></div></div>`;
}
function wireResult(){document.getElementById('retakeBtn')?.addEventListener('click',()=>{resetLocal();renderDiagnostic();});}
function wireCodeCopy(){
  document.querySelectorAll('[data-copy-stage]').forEach(button=>button.addEventListener('click',async()=>{
    const stage=track.stages.find(s=>s.n===Number(button.dataset.copyStage));if(!stage)return;
    try{await navigator.clipboard.writeText(stage.code);const old=button.textContent;button.textContent='Copied';setTimeout(()=>button.textContent=old,1200);}catch{button.textContent='Copy failed';}
  }));
}

async function resume(){
  const local=load();if(!local)return;
  if(local.session?.bankVersion&&local.session.bankVersion!==cfg.bankVersion){localStorage.removeItem(localKey);return;}
  state.profileToken=local.profileToken||null;state.identity=local.identity||null;state.session=local.session||null;state.answers=local.answers||{};state.index=Math.max(0,Math.min(Number(local.index)||0,14));state.report=local.report||null;
  if(state.report||!state.session||!state.profileToken)return;
  try{
    const questions=await gateway('diagnostic-questions',{edit_token:state.profileToken,track_slug:slug,bank_version:cfg.bankVersion});
    if(Array.isArray(questions)&&questions.length===15)state.questions=questions;else throw new Error('question_bank_unavailable');
  }catch(err){console.warn('Diagnostic recovery unavailable.',err);resetLocal();}
}

(async()=>{await resume();shell();})();
})();
