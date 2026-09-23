import {OopUmlStore} from './store.js';

const cfg=window.IJR_OOP_UML_CONFIG;
const data=window.IJR_OOP_UML_DATA;
const store=new OopUmlStore(cfg);
const $=id=>document.getElementById(id);
const ACCESS_KEY='ijr-seminar-oop-email-v3';
let attempt=null;

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));}
function isComplete(topic){return attempt?.sessions?.[topic.sessionKey]?.status==='completed';}
function setStatus(message,type=''){const node=$('registrationStatus');if(!node)return;node.textContent=message;node.className=`inline-status ${type}`.trim();}
function normalizeEmail(value){return String(value||'').trim().toLowerCase();}
function institutionalEmail(value){return /^[^\s@]+@ijr\.edu\.co$/i.test(normalizeEmail(value));}
function currentLanguage(){return attempt?.language||'python';}
function saveEmail(email){localStorage.setItem(ACCESS_KEY,JSON.stringify({email:normalizeEmail(email),validatedAt:Date.now()}));}
function savedEmail(){try{const x=JSON.parse(localStorage.getItem(ACCESS_KEY)||'null');return x&&institutionalEmail(x.email)?normalizeEmail(x.email):'';}catch{return '';}}
function friendlyError(error){
  const raw=String(error?.message||'');
  if(raw.includes('institutional_email_required'))return 'Use only your institutional @ijr.edu.co email.';
  if(raw.includes('invalid_student_group'))return 'The institutional email exists, but its Grade 11 group could not be resolved.';
  return raw||'The institutional session could not be opened.';
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

  const identityLabel=attempt.group==='11-U'?attempt.label:`${attempt.group} · ${attempt.label}`;
  $('sessionBadge').textContent=identityLabel;
  $('identitySummary').textContent=`${identityLabel} · ${lang==='python'?'Python':'Java'} · ${backend}`;
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
  const email=normalizeEmail($('institutionalEmail')?.value);
  if(!institutionalEmail(email)){
    setStatus('Use only your institutional @ijr.edu.co email.','error');
    $('institutionalEmail')?.focus();
    return;
  }
  $('registerButton').disabled=true;
  setStatus('Validating institutional email…');
  try{
    attempt=await store.startWithEmail({email,language:'python'});
    saveEmail(email);
    setStatus('Access granted.','ok');
    render();
  }catch(error){
    console.error(error);
    attempt=null;
    setStatus(friendlyError(error),'error');
    render();
    $('institutionalEmail')?.focus();
  }finally{$('registerButton').disabled=false;}
}

$('registrationForm').addEventListener('submit',submitRegistration);
$('switchButton').addEventListener('click',()=>{
  if(confirm('Switch institutional email on this computer? Saved Supabase evidence will not be deleted.')){
    store.reset();
    localStorage.removeItem(ACCESS_KEY);
    attempt=null;
    render();
    $('institutionalEmail').value='';
    $('institutionalEmail').focus();
  }
});

const remembered=savedEmail();
if(remembered)$('institutionalEmail').value=remembered;
store.restore().then(value=>{
  if(value?.email&&institutionalEmail(value.email)){attempt=value;saveEmail(value.email);}
  else{if(value)store.reset();attempt=null;}
  render();
}).catch(error=>{console.warn(error);attempt=null;render();});
