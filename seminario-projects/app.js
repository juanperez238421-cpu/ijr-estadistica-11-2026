(()=>{
'use strict';

const API='https://rlfxnjbqxbozjdzkbwlz.supabase.co/functions/v1/seminar-project-access';
const KEY='sb_publishable_rmVOQ3Orx49KpW_4uMqYew_c2HpcA87';
const MAIN_REGISTRATION_KEY='ijr-seminar-main-registration-v1';
const $=id=>document.getElementById(id);
const trackNames={
  'web':'Web Development',
  'data-science':'Python / Data Analyst',
  'cybersecurity':'Defensive Cybersecurity',
  '3d-programming':'3D + Printing',
  'robotics':'Robotics & Automation'
};
const decisionNames={
  proposed:'Proposed / define today',
  confirmed:'Confirmed',
  revise:'Requires revision',
  rejected:'Not active'
};

function esc(value=''){
  return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function setStatus(message='',type=''){
  const el=$('accessStatus');
  el.textContent=message;
  el.className='status'+(type?' '+type:'');
}
function readMainRegistration(){
  try{return JSON.parse(localStorage.getItem(MAIN_REGISTRATION_KEY)||'null')}catch{return null}
}
function showAccess(){
  $('projectPanel').classList.add('hidden');
  $('accessPanel').classList.remove('hidden');
  $('institutionalEmail').focus();
  window.scrollTo({top:0,behavior:'smooth'});
}
function renderProject(data){
  const student=data.student||{};
  const project=data.project||{};
  const central=readMainRegistration();

  $('studentName').textContent=student.name||'Student';
  $('groupBadge').textContent=student.group_code||'â€”';
  $('trackBadge').textContent=trackNames[project.track_slug]||project.track_slug||'Personal route';
  $('modeBadge').textContent=project.project_mode==='fixed'?'Specific project':'Define today';
  $('modeBadge').dataset.mode=project.project_mode||'guided_definition';
  $('projectTitle').textContent=project.project_title||'Project route';
  $('projectSummary').textContent=project.project_summary||'';
  $('objective').textContent=project.objective||'';
  $('decisionBadge').textContent=decisionNames[project.decision_status]||project.decision_status||'Proposed';
  $('decisionBadge').dataset.state=project.decision_status||'proposed';
  $('definitionTitle').textContent=project.project_mode==='fixed'?'Confirm the exact technical scope':'Define your specific project today';

  let note=project.decision_note||'Use the questions below to define the project with your teacher.';
  if(central?.groupCode && student.group_code && central.groupCode.replace('-','')!==student.group_code.replace('-','')){
    note+=' Note: the group saved on Seminar Home does not match this institutional email. Use â€œChange studentâ€ on Seminar Home if needed.';
  }
  $('decisionNote').textContent=note;

  const questions=Array.isArray(project.definition_questions)?project.definition_questions:[];
  $('definitionQuestions').innerHTML=questions.map(q=>'<li>'+esc(q)+'</li>').join('');

  const stack=Array.isArray(project.stack)?project.stack:[];
  $('stack').innerHTML=stack.map(item=>'<span>'+esc(item)+'</span>').join('');

  if(project.safety_scope){
    $('safetyScope').textContent=project.safety_scope;
    $('safetyPanel').classList.remove('hidden');
  }else{
    $('safetyPanel').classList.add('hidden');
  }

  const routeKey=project.project_slug==='rico-portable-python-visual-show'||/RICO\s+PARAMO/i.test(student.name||'')?'animation':project.track_slug==='3d-programming'?'cad':project.track_slug==='cybersecurity'?'cyber':null;
  const route=window.PROJECT_ROUTES?.[routeKey];
  const studioKey=routeKey==='cad'||routeKey==='cyber'?routeKey:project.project_slug==='gomez-gta-v-mod-showcase'?'gta':project.track_slug==='web'?'clients':null;
  const studio=window.STUDIO_COURSES?.[studioKey];
  const sprints=studio?studio.classes.map((step,i)=>({n:i+1,title:step.title,goal:step.lead,deliverable:step.gate})):route?route.stages.map((step,i)=>({n:i+1,title:step.title,goal:step.build.join(' '),deliverable:step.evidence})):Array.isArray(project.sprints)?project.sprints:[];
  $('roadmapTitle').textContent=route?'4 etapas de construcciÃ³n':`${sprints.length} etapas del proyecto`;
  $('roadmapCopy').textContent=route?'Cada etapa corresponde a una clase con Theory, Workshop, Test, Evidence y criterio de avance. Abre la guÃ­a completa para trabajar.':'Each stage ends with verifiable evidence. The technical track gives you tools; this roadmap applies them to your own project.';
  $('routeActions').innerHTML=routeKey==='animation'?'<a class="button button-dark" href="rico/index.html">Abrir proyecto Rico Â· Colab real</a><a class="button button-light" href="rico/workshop.html?class=1">Construir el mensaje Â· Workshop</a>':route?'<a class="button button-dark" href="route.html?project='+routeKey+'">Abrir Theory + Workshop Â· 4 etapas</a>':'';
  if(studio){
    $('roadmapTitle').textContent='4 clases Â· construir, ejecutar y descargar';
    $('roadmapCopy').textContent=project.project_mode==='guided_definition'?'Taller de partida para definir tu producto con el docente. La asignaciÃ³n y las decisiones pendientes se mantienen.':'Theory, Workshop ejecutable, pruebas y producto descargable en cada ruta.';
    $('routeActions').innerHTML='<a class="button button-dark" href="studio/index.html?project='+studioKey+'">Abrir proyecto Â· Colab real</a><a class="button button-light" href="studio/workshop.html?project='+studioKey+'&class=1">Construir Â· Workshop</a>'+(project.track_slug==='web'?'<a class="button button-light" href="studio/index.html">Elegir registro de clientes o catÃ¡logo GTA V</a>':'');
  }
  if(!route&&!studio&&project.is_defined===false){
    $('roadmapTitle').textContent='Elige un taller para comenzar';
    $('roadmapCopy').textContent='Tu correo institucional permite entrar. Si todavÃ­a no tienes proyecto asignado, puedes trabajar en los talleres y definir tu propuesta con el docente.';
    $('routeActions').innerHTML='<a class="button button-dark" href="studio/index.html">Talleres de CAD, ciberseguridad y HTML</a><a class="button button-light" href="rico/index.html">AnimaciÃ³n Python Â· corazÃ³n y flores</a>';
  }

  $('sprintGrid').innerHTML=sprints.map(step=>{
    return '<article class="sprint-card">'+
      '<div class="sprint-number">S'+esc(step.n)+'</div>'+
      '<div><h4>'+esc(step.title)+'</h4><p>'+esc(step.goal)+'</p>'+
      '<div class="deliverable"><strong>Evidence</strong><span>'+esc(step.deliverable)+'</span></div></div>'+
      '</article>';
  }).join('');

  $('accessPanel').classList.add('hidden');
  $('projectPanel').classList.remove('hidden');
  window.scrollTo({top:0,behavior:'smooth'});
}

$('accessForm')?.addEventListener('submit',async event=>{
  event.preventDefault();
  const email=$('institutionalEmail').value.trim().toLowerCase();
  if(!/^[^\s@]+@ijr\.edu\.co$/.test(email)){
    setStatus('Use your institutional @ijr.edu.co email.','error');
    return;
  }

  const button=$('accessButton');
  button.disabled=true;
  setStatus('Opening your personal projectâ€¦');

  try{
    const response=await fetch(API,{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'apikey':KEY
      },
      body:JSON.stringify({email})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok){
      if(data.error==='project_access_denied'||data.error==='project_not_assigned'){
        throw new Error('No personal project module is assigned to this email. Check the address or ask the teacher.');
      }
      if(data.error==='institutional_email_required'){
        throw new Error('Enter a valid institutional email.');
      }
      throw new Error('The project module could not be opened. Try again.');
    }
    setStatus('');
    renderProject(data);
  }catch(error){
    setStatus(error?.message||'The project module could not be opened.','error');
  }finally{
    button.disabled=false;
  }
});

$('changeEmail')?.addEventListener('click',()=>{
  $('institutionalEmail').value='';
  setStatus('');
  showAccess();
});
})();
