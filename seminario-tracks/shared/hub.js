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
let state={
  profileToken:null,
  identity:null,
  session:null,
  questions:[],
  answers:{},
  index:0,
  report:null,
  busy:false
};

const domainNames={
  foundations:'Fundamentos',
  applied_reasoning:'Razonamiento aplicado',
  workflow_tools:'Herramientas + workflow',
  self_profile:'Autopercepción'
};

const levelInfo={
  foundation:{label:'Foundation',copy:'Necesitas un puente guiado de fundamentos antes de aumentar la complejidad del proyecto.'},
  developing:{label:'Developing',copy:'Tienes una base parcial y puedes avanzar con ejemplos, checkpoints y práctica guiada.'},
  proficient:{label:'Proficient',copy:'Tienes una base funcional para comenzar el proyecto y justificar decisiones técnicas.'},
  advanced:{label:'Advanced',copy:'Muestras una base sólida para trabajar con mayor autonomía y extensiones de diseño.'}
};

const trackLinks=[
  ['web','Web'],
  ['data-science','Data Science'],
  ['cybersecurity','Cybersecurity'],
  ['3d-programming','3D'],
  ['robotics','Robotics']
];

function esc(v=''){
  return String(v??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function token(){
  const b=new Uint8Array(32);
  crypto.getRandomValues(b);
  return [...b].map(x=>x.toString(16).padStart(2,'0')).join('');
}

function save(){
  localStorage.setItem(localKey,JSON.stringify({
    profileToken:state.profileToken,
    identity:state.identity,
    session:state.session,
    answers:state.answers,
    index:state.index,
    report:state.report
  }));
}

function load(){
  try{return JSON.parse(localStorage.getItem(localKey)||'null')}catch{return null}
}

async function gateway(action,payload={}){
  const response=await fetch(gatewayUrl,{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'apikey':cfg.supabasePublishableKey,
      'Authorization':`Bearer ${cfg.supabasePublishableKey}`
    },
    body:JSON.stringify({action,...payload})
  });
  let data={};
  try{data=await response.json()}catch{}
  if(!response.ok){
    const message=data?.error||`backend_${response.status}`;
    throw new Error(message);
  }
  return data;
}

function stackHtml(){
  return track.stack.map(x=>`<span>${esc(x)}</span>`).join('');
}

function switcherHtml(){
  return trackLinks.map(([s,label])=>{
    const href=s===slug?'#':`../${s}/`;
    return `<a class="track-switch ${s===slug?'active':''}" href="${href}" ${s===slug?'aria-current="page"':''}>${esc(label)}</a>`;
  }).join('');
}

function roadmapHtml(){
  return track.sprints.map(s=>`
    <article class="sprint">
      <div class="sprint-top">
        <span class="sprint-index">SPRINT ${String(s.n).padStart(2,'0')}</span>
        <span class="tag">Project path</span>
      </div>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.goal)}</p>
      <div class="deliverable"><strong>Deliverable</strong>${esc(s.deliverable)}</div>
    </article>`).join('');
}

function learningHtml(){
  return track.stages.map(stage=>`
    <article class="learning-stage" id="stage-${stage.n}">
      <div class="stage-head">
        <div>
          <p class="eyebrow">LEARNING STAGE ${String(stage.n).padStart(2,'0')}</p>
          <h3>${esc(stage.title)}</h3>
          <p>${esc(stage.focus)}</p>
        </div>
        <span class="stage-number">${stage.n}/4</span>
      </div>
      <div class="stage-grid">
        <section class="theory-pane">
          <div class="pane-label">THEORY</div>
          <p class="stage-theory">${esc(stage.theory)}</p>
          <ul>${stage.concepts.map(c=>`<li>${esc(c)}</li>`).join('')}</ul>
        </section>
        <section class="code-pane">
          <div class="code-pane-top">
            <div>
              <span class="pane-label">CODING LAB</span>
              <strong>${esc(stage.lab)}</strong>
            </div>
            <span class="language-tag">${esc(stage.language)}</span>
          </div>
          <pre><code>${esc(stage.code)}</code></pre>
          <button class="copy-code" type="button" data-copy-stage="${stage.n}">Copy starter code</button>
        </section>
      </div>
    </article>`).join('');
}

function shell(){
  document.title=`Seminar 11 · ${track.title} Learning Hub`;
  root.innerHTML=`
    <header class="topbar">
      <a class="brand" href="../">
        <span class="brand-mark">IJR</span>
        <span><small>Instituto Jorge Robledo · Seminar 11</small><strong>${esc(track.title)} Learning Hub</strong></span>
      </a>
      <div class="top-actions">
        <a class="button button-light" href="../">All tracks</a>
        <a class="button button-dark" href="../../seminario-oop-uml/">OOP + UML Core</a>
      </div>
    </header>

    <main class="shell">
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">SOFTWARE ENGINEERING STUDIO · SPECIALIZED TRACK</p>
          <h1>${esc(track.title)}</h1>
          <p>La ruta combina <strong>teoría, código y proyecto</strong>. Primero ubica tu nivel real con el diagnóstico; después estudia las cuatro etapas técnicas y lleva cada concepto al proyecto de ocho sprints.</p>
          <div class="stack">${stackHtml()}</div>
        </div>
        <aside class="project-card">
          <span>PROJECT FRAME</span>
          <strong>${esc(track.project)}</strong>
          <small>design → model → implement → test → document → defend</small>
        </aside>
      </section>

      <nav class="track-switcher" aria-label="Specialized tracks">
        <span>FIVE STUDIO PATHS</span>
        <div>${switcherHtml()}</div>
      </nav>

      <section class="section">
        <div class="section-head">
          <p class="eyebrow">DIAGNOSTIC 01 · INDIVIDUAL · BANK V3</p>
          <h2>Diagnosticar antes de enseñar.</h2>
          <p>15 ítems: 12 preguntas técnicas organizadas en cuatro etapas + 3 ítems de autopercepción. El resultado recomienda desde qué etapa comenzar; no bloquea la ruta y no es una nota.</p>
        </div>
        <div id="diagnosticFrame" class="diagnostic-frame" aria-live="polite"></div>
      </section>

      <section class="section learning-section">
        <div class="section-head">
          <p class="eyebrow">THEORY + CODING · FOUR TECHNICAL STAGES</p>
          <h2>Comprender el concepto. Verlo en código. Modificarlo.</h2>
          <p>Cada etapa separa la explicación conceptual del laboratorio de código, siguiendo el mismo lenguaje visual del Common Core OOP + UML.</p>
        </div>
        <div class="learning-grid">${learningHtml()}</div>
      </section>

      <section class="section" id="roadmapAnchor">
        <div class="section-head">
          <p class="eyebrow">8-SPRINT PROJECT ROADMAP</p>
          <h2>${esc(track.project)}</h2>
          <p>La teoría y los laboratorios alimentan el proyecto. El diagnóstico determina el apoyo recomendado, pero todos los estudiantes avanzan por el mismo marco de ingeniería.</p>
        </div>
        <div class="roadmap">${roadmapHtml()}</div>
      </section>

      <footer class="footer">
        <span>Instituto Jorge Robledo · Seminar 11 · Third Period 2026</span>
        <span>${esc(track.title)} · ${esc(track.project)}</span>
      </footer>
    </main>`;
  wireCodeCopy();
  renderDiagnostic();
}

function introHtml(){
  const name=state.identity?.fullName||'';
  const group=state.identity?.groupCode||'';
  return `
    <div class="diagnostic-intro">
      <div>
        <p class="eyebrow">ENTRY BASELINE</p>
        <h3>Conocimiento + razonamiento + autopercepción.</h3>
        <p>Responde sin buscar soluciones externas. El objetivo es ubicar tu punto de partida real. La calificación se realiza en el backend protegido y las respuestas correctas no se envían al navegador.</p>
        <div class="diagnostic-facts">
          <div><strong>12</strong><span>Technical items</span></div>
          <div><strong>4</strong><span>Mastery stages</span></div>
          <div><strong>3</strong><span>Self-profile items</span></div>
        </div>
        <div class="diagnostic-security">
          <strong>Secure start restored</strong>
          <span>El navegador ya no llama directamente a las funciones SQL protegidas. El flujo usa el gateway de estudiante de Seminar 11.</span>
        </div>
      </div>
      <form id="startForm" class="registration-box">
        <p class="eyebrow">INDIVIDUAL REGISTRATION</p>
        <label>Nombre completo
          <input id="fullName" required minlength="3" maxlength="120" autocomplete="name" placeholder="Nombre y apellidos" value="${esc(name)}">
        </label>
        <label>Grupo
          <select id="groupCode" required>
            <option value="">Selecciona…</option>
            <option ${group==='11-A'?'selected':''}>11-A</option>
            <option ${group==='11-B'?'selected':''}>11-B</option>
            <option ${group==='11-C'?'selected':''}>11-C</option>
          </select>
        </label>
        <button class="button button-dark" type="submit">Start diagnostic</button>
        <p id="startStatus" class="status" role="status"></p>
      </form>
    </div>`;
}

function renderDiagnostic(){
  const frame=document.getElementById('diagnosticFrame');
  if(!frame)return;
  if(state.report){
    frame.innerHTML=resultHtml(state.report);
    wireResult();
    return;
  }
  if(state.questions.length&&state.session){
    frame.innerHTML=testHtml();
    wireTest();
    return;
  }
  frame.innerHTML=introHtml();
  document.getElementById('startForm')?.addEventListener('submit',startAttempt);
}

async function startAttempt(e){
  e.preventDefault();
  if(state.busy)return;
  state.busy=true;
  const status=document.getElementById('startStatus');
  const fullName=document.getElementById('fullName').value.trim();
  const groupCode=document.getElementById('groupCode').value;
  const profileToken=state.profileToken||token();
  status.textContent='Creando perfil y diagnóstico seguro…';
  status.className='status';
  try{
    await gateway('register',{
      edit_token:profileToken,
      full_name:fullName,
      group_code:groupCode,
      topics:[track.title],
      first_choice:track.title,
      work_mode:'Individual',
      partner_name:null,
      project_idea:null
    });
    const attempt=await gateway('diagnostic-start',{
      edit_token:profileToken,
      track_slug:slug,
      bank_version:cfg.bankVersion
    });
    const questions=await gateway('diagnostic-questions',{
      edit_token:profileToken,
      track_slug:slug,
      bank_version:cfg.bankVersion
    });
    if(!Array.isArray(questions)||questions.length!==15)throw new Error('question_bank_unavailable');
    state.profileToken=profileToken;
    state.identity={fullName,groupCode};
    state.session={
      attemptId:attempt.attempt_id,
      fullName:attempt.full_name||fullName,
      groupCode:attempt.group_code||groupCode,
      startedAt:attempt.started_at,
      bankVersion:attempt.bank_version||cfg.bankVersion
    };
    state.questions=questions;
    state.answers={};
    state.index=0;
    state.report=null;
    save();
    renderDiagnostic();
  }catch(err){
    status.textContent=`No se pudo iniciar: ${friendlyError(err.message)}`;
    status.className='status error';
  }finally{
    state.busy=false;
  }
}

function friendlyError(message=''){
  const map={
    origin_denied:'origen no autorizado',
    invalid_edit_token:'token de sesión inválido',
    invalid_registration:'datos de registro inválidos',
    invalid_diagnostic_request:'configuración de diagnóstico inválida',
    profile_not_found:'perfil no encontrado',
    backend_unavailable:'backend no disponible',
    invalid_request:'solicitud rechazada por el backend',
    question_bank_unavailable:'banco de preguntas no disponible'
  };
  return map[message]||message;
}

function answeredCount(){
  return state.questions.reduce((n,q)=>n+(Number.isInteger(state.answers[q.id])?1:0),0);
}

function testHtml(){
  const q=state.questions[state.index];
  const answered=answeredCount();
  const pct=Math.round(100*answered/state.questions.length);
  const nav=state.questions.map((item,i)=>`
    <button type="button" data-q="${i}" class="${Number.isInteger(state.answers[item.id])?'answered ':''}${i===state.index?'current':''}" aria-label="Pregunta ${i+1}${Number.isInteger(state.answers[item.id])?', respondida':''}">${i+1}</button>`).join('');
  const options=q.options.map((opt,i)=>`
    <label class="option">
      <input type="radio" name="answer" value="${i}" ${state.answers[q.id]===i?'checked':''}>
      <span class="option-key">${String.fromCharCode(65+i)}</span>
      <span>${esc(opt)}</span>
    </label>`).join('');
  const stageLabel=q.scored&&q.stage_no?`Stage ${q.stage_no}`:(q.scored?'Technical':'Self-profile');
  return `
    <div class="diagnostic-workspace">
      <aside class="question-nav">
        <div class="progress-copy"><strong>${answered}/15 answered</strong><span>${pct}%</span></div>
        <div class="progress-track"><span style="width:${pct}%"></span></div>
        <div class="question-numbers">${nav}</div>
        <div class="legend">
          <span>● Black = answered</span>
          <span>Outline = current question</span>
          <span>Questions 13–15 are self-profile and are not scored.</span>
        </div>
      </aside>
      <section class="question-stage">
        <div class="question-meta">
          <span class="tag">${esc(stageLabel)}</span>
          <span class="tag">${esc(domainNames[q.domain]||q.domain)}</span>
          <span class="tag">Question ${q.position}/15</span>
        </div>
        <h3>${esc(q.prompt)}</h3>
        <div class="options">${options}</div>
        <div class="question-actions">
          <button id="prevBtn" class="button button-light" type="button" ${state.index===0?'disabled':''}>← Previous</button>
          <div>
            <button id="nextBtn" class="button button-light" type="button" ${state.index===state.questions.length-1?'disabled':''}>Next →</button>
            <button id="submitBtn" class="button button-dark" type="button" ${answered===15?'':'disabled'}>Submit diagnostic</button>
          </div>
        </div>
        <p id="testStatus" class="status" role="status"></p>
      </section>
    </div>`;
}

function wireTest(){
  document.querySelectorAll('[data-q]').forEach(b=>b.addEventListener('click',()=>{
    state.index=Number(b.dataset.q);
    save();
    renderDiagnostic();
  }));
  document.querySelectorAll('input[name="answer"]').forEach(r=>r.addEventListener('change',()=>{
    state.answers[state.questions[state.index].id]=Number(r.value);
    save();
    renderDiagnostic();
  }));
  document.getElementById('prevBtn')?.addEventListener('click',()=>{
    state.index=Math.max(0,state.index-1);
    save();
    renderDiagnostic();
  });
  document.getElementById('nextBtn')?.addEventListener('click',()=>{
    state.index=Math.min(state.questions.length-1,state.index+1);
    save();
    renderDiagnostic();
  });
  document.getElementById('submitBtn')?.addEventListener('click',submitAttempt);
}

async function submitAttempt(){
  if(state.busy||answeredCount()!==15)return;
  state.busy=true;
  const status=document.getElementById('testStatus');
  status.textContent='Calificando en el backend…';
  status.className='status';
  try{
    const report=await gateway('diagnostic-submit',{
      edit_token:state.profileToken,
      attempt_id:state.session.attemptId,
      answers:state.answers
    });
    state.report=report;
    save();
    renderDiagnostic();
    document.getElementById('diagnosticFrame')?.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(err){
    status.textContent=`No se pudo enviar: ${friendlyError(err.message)}`;
    status.className='status error';
  }finally{
    state.busy=false;
  }
}

function stageScoreHtml(r){
  const scores=r.stage_scores||{};
  return track.stages.map(stage=>{
    const d=scores[String(stage.n)]||{score:0,max:3,percent:0,critical_pass:false,mastered:false};
    const recommended=Number(r.recommended_stage)===stage.n;
    return `
      <article class="mastery-card ${d.mastered?'mastered':''} ${recommended?'recommended':''}">
        <div class="mastery-top">
          <span>STAGE ${stage.n}</span>
          <strong>${esc(d.score)}/${esc(d.max)}</strong>
        </div>
        <h4>${esc(stage.title)}</h4>
        <div class="bar"><span style="width:${Number(d.percent)||0}%"></span></div>
        <small>${esc(d.percent||0)}% · critical gate ${d.critical_pass?'passed':'not passed'}</small>
        ${recommended?'<span class="recommended-label">Recommended start</span>':''}
      </article>`;
  }).join('');
}

function resultHtml(r){
  const info=levelInfo[r.level]||levelInfo.developing;
  const domains=['foundations','applied_reasoning','workflow_tools'].map(k=>{
    const d=r.domain_scores?.[k]||{score:0,max:4,percent:0};
    return `
      <article class="domain-card">
        <strong><span>${esc(domainNames[k])}</span><span>${esc(d.score)}/${esc(d.max)}</span></strong>
        <div class="bar"><span style="width:${Number(d.percent)||0}%"></span></div>
        <small>${esc(d.percent)}%</small>
      </article>`;
  }).join('');
  const recommendedStage=track.stages[Math.max(0,(Number(r.recommended_stage)||1)-1)]||track.stages[0];
  return `
    <div class="result">
      <div class="result-hero">
        <div>
          <p class="eyebrow">DIAGNOSTIC REPORT · ${esc(r.group_code||state.session?.groupCode||'')}</p>
          <h3>${esc(info.label)} · ${esc(r.knowledge_percent)}%</h3>
          <p>${esc(info.copy)}</p>
          <p><strong>Recommended technical start:</strong> Stage ${esc(r.recommended_stage||1)} · ${esc(recommendedStage.title)}</p>
        </div>
        <div class="result-score">
          <strong>${esc(r.score)}/${esc(r.max_score)}</strong>
          <span>technical knowledge score</span>
          <div class="secondary-score">
            <strong>${esc(r.confidence_percent)}%</strong>
            <span>self-profile index · not graded</span>
          </div>
        </div>
      </div>

      <div class="mastery-heading">
        <span>FOUR-STAGE MASTERY</span>
        <small>Una etapa se considera dominada solo si cumple el umbral y los ítems críticos.</small>
      </div>
      <div class="mastery-grid">${stageScoreHtml(r)}</div>

      <div class="domain-grid">${domains}</div>

      <div class="result-note">
        <strong>Interpretación:</strong> el resultado no bloquea tu ruta. Úsalo para decidir dónde necesitas más teoría, más ejemplos o mayor profundidad. Después del diagnóstico, continúa con las etapas Theory + Coding y con el roadmap de proyecto.
      </div>

      <div class="question-actions result-actions">
        <button id="retakeBtn" class="button button-light" type="button">Retake diagnostic</button>
        <a class="button button-dark" href="#stage-${esc(r.recommended_stage||1)}">Open recommended stage</a>
      </div>
    </div>`;
}

function wireResult(){
  document.getElementById('retakeBtn')?.addEventListener('click',()=>{
    const keepToken=state.profileToken;
    const keepIdentity=state.identity;
    state={
      profileToken:keepToken,
      identity:keepIdentity,
      session:null,
      questions:[],
      answers:{},
      index:0,
      report:null,
      busy:false
    };
    save();
    renderDiagnostic();
  });
}

function wireCodeCopy(){
  document.querySelectorAll('[data-copy-stage]').forEach(button=>{
    button.addEventListener('click',async()=>{
      const n=Number(button.dataset.copyStage);
      const stage=track.stages.find(s=>s.n===n);
      if(!stage)return;
      const original=button.textContent;
      try{
        await navigator.clipboard.writeText(stage.code);
        button.textContent='Copied';
      }catch{
        const area=document.createElement('textarea');
        area.value=stage.code;
        area.style.position='fixed';
        area.style.opacity='0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
        button.textContent='Copied';
      }
      setTimeout(()=>button.textContent=original,1200);
    });
  });
}

async function resume(){
  const local=load();
  if(!local)return;
  state.profileToken=local.profileToken||null;
  state.identity=local.identity||null;
  state.session=local.session||null;
  state.answers=local.answers||{};
  state.index=Math.max(0,Math.min(Number(local.index)||0,14));
  state.report=local.report||null;
  if(state.report||!state.session?.attemptId||!state.profileToken)return;
  try{
    const questions=await gateway('diagnostic-questions',{
      edit_token:state.profileToken,
      track_slug:slug,
      bank_version:cfg.bankVersion
    });
    if(Array.isArray(questions)&&questions.length===15){
      state.questions=questions;
    }else{
      throw new Error('question_bank_unavailable');
    }
  }catch(err){
    console.warn('Diagnostic recovery unavailable. Registration restored.',err);
    state.session=null;
    state.questions=[];
    state.answers={};
    state.index=0;
    state.report=null;
    save();
  }
}

(async()=>{
  await resume();
  shell();
})();
})();
