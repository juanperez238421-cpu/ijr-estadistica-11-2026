import {OopUmlStore} from './store.js';

const cfg=window.IJR_OOP_UML_CONFIG;
const data=window.IJR_OOP_UML_DATA;
const store=new OopUmlStore(cfg);
const $=id=>document.getElementById(id);
let attempt=null;

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function isComplete(topic){return attempt?.sessions?.[topic.sessionKey]?.status==='completed';}
function setStatus(message,type=''){const node=$('registrationStatus');node.textContent=message;node.className=`inline-status ${type}`.trim();}
function currentLanguage(){return attempt?.language||$('language')?.value||'python';}

function updateRegistrationFields(){
  const team=$('registrationMode').value==='team';
  $('teamSizeWrap').classList.toggle('hidden',!team);
  const size=team?Number($('teamSize').value):1;
  $('member2Wrap').classList.toggle('hidden',size<2);
  $('member3Wrap').classList.toggle('hidden',size<3);
  $('memberName2').required=size>=2;
  $('memberName3').required=size>=3;
}

function render(){
  const registered=!!attempt;
  $('registrationPanel').classList.toggle('hidden',registered);
  $('hubPanel').classList.toggle('hidden',!registered);
  $('sessionBadge').classList.toggle('hidden',!registered);
  $('switchButton').classList.toggle('hidden',!registered);
  if(!registered)return;

  const lang=currentLanguage();
  const completed=data.topics.filter(isComplete).length;
  const pct=Math.round(completed/data.topics.length*100);
  const backend=attempt.backend==='supabase'?'Supabase synchronized':'local recovery mode';

  $('sessionBadge').textContent=`${attempt.group} · ${attempt.label}`;
  $('identitySummary').textContent=`${attempt.group} · ${attempt.label} · ${lang==='python'?'Python':'Java'} · ${backend}`;
  $('languageLabel').textContent=lang==='python'?'Python':'Java';
  $('globalPercent').textContent=`${pct}%`;
  $('globalProgressBar').style.width=`${pct}%`;
  $('globalProgressCopy').textContent=`${completed} of ${data.topics.length} sessions evidenced`;

  $('topicGrid').innerHTML=data.topics.map(topic=>{
    const done=isComplete(topic);
    const state=done?'Completed':'Available';
    const evidence=attempt.sessions?.[topic.sessionKey]?.evidence||{};
    const evidenceCount=['model','code','test','explain'].filter(k=>evidence[k]===true).length;
    return `<article class="topic-card">
      <div class="topic-top"><span class="topic-index">SESSION ${String(topic.n).padStart(2,'0')}</span><span class="topic-status ${done?'done':''}">${state}</span></div>
      <div><h3>${esc(topic.title)}</h3><p>${esc(topic.lead)}</p></div>
      <div class="topic-meta"><span>OOP + UML</span><span>${esc(topic.lab)}</span><span>${lang==='python'?'Python':'Java'}</span>${done?`<span>${evidenceCount}/4 evidence checks</span>`:''}</div>
      <div class="topic-actions"><a class="button button-light" href="theory.html?topic=${encodeURIComponent(topic.slug)}&lang=${lang}">Theory</a><a class="button button-dark" href="workshop.html?topic=${encodeURIComponent(topic.slug)}&lang=${lang}">Workshop</a></div>
    </article>`;
  }).join('');
}

async function submitRegistration(event){
  event.preventDefault();
  const mode=$('registrationMode').value;
  const size=mode==='team'?Number($('teamSize').value):1;
  const names=[$('memberName1').value,$('memberName2').value,$('memberName3').value].slice(0,size).map(v=>v.trim()).filter(Boolean);
  setStatus('Creating classroom registration…');
  $('registerButton').disabled=true;
  try{
    attempt=await store.start({language:$('language').value,group:$('groupCode').value,names});
    setStatus('Registration ready.','ok');
    render();
  }catch(error){
    console.error(error);
    setStatus(error.message||'Registration could not be created.','error');
  }finally{$('registerButton').disabled=false;}
}

$('registrationMode').addEventListener('change',updateRegistrationFields);
$('teamSize').addEventListener('change',updateRegistrationFields);
$('registrationForm').addEventListener('submit',submitRegistration);
$('switchButton').addEventListener('click',()=>{
  if(confirm('Switch the active Seminar registration on this computer? Saved Supabase evidence will not be deleted.')){
    store.reset();attempt=null;render();
  }
});

updateRegistrationFields();
store.restore().then(value=>{attempt=value;render();}).catch(error=>{console.warn(error);render();});
