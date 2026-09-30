import {OopUmlStore,isInstitutionalEmail} from './store.js?v=20260930-progress-v6';

const cfg=window.IJR_OOP_UML_CONFIG;
const data=window.IJR_OOP_UML_DATA;
const store=new OopUmlStore(cfg);
const $=id=>document.getElementById(id);
const ACCESS_KEY='ijr-seminar-oop-email-v3';
let attempt=null;
let booting=false;

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function isComplete(topic){return attempt?.sessions?.[topic.sessionKey]?.status==='completed';}
function normalizeEmail(value){return String(value||'').trim().toLowerCase();}
function currentLanguage(){return attempt?.language||'python';}
function saveEmail(email){
  const normalized=normalizeEmail(email);
  if(isInstitutionalEmail(normalized))localStorage.setItem(ACCESS_KEY,JSON.stringify({email:normalized,validatedAt:Date.now()}));
}
function savedEmail(){
  try{
    const x=JSON.parse(localStorage.getItem(ACCESS_KEY)||'null');
    return x&&isInstitutionalEmail(x.email)?normalizeEmail(x.email):'';
  }catch{return '';}
}
function mainIdentity(){
  let entry=globalThis.IJR_SEMINAR_MAIN_ENTRY||null;
  if(!entry){
    try{entry=JSON.parse(localStorage.getItem('ijr-seminar-main-registration-v2')||'null');}catch{entry=null;}
  }
  if(!entry||!isInstitutionalEmail(entry.institutionalEmail))return null;
  return {
    email:normalizeEmail(entry.institutionalEmail),
    fullName:String(entry.fullName||entry.display_name||'').trim(),
    groupCode:String(entry.groupCode||entry.group_code||'11-U').trim()||'11-U'
  };
}
function setBoot(message,error=false){
  const status=$('bootStatus');
  if(status)status.textContent=message;
  $('bootActions')?.classList.toggle('hidden',!error);
}

function render(){
  const ready=!!attempt;
  $('bootPanel')?.classList.toggle('hidden',ready);
  $('hubPanel').classList.toggle('hidden',!ready);
  $('sessionBadge').classList.toggle('hidden',!ready);
  if(!ready)return;

  const lang=currentLanguage();
  const completed=data.topics.filter(isComplete).length;
  const pct=Math.round(completed/data.topics.length*100);
  const backend=attempt.backend==='supabase'?'Supabase synchronized':'Not synchronized';
  const identityLabel=attempt.group==='11-U'?(attempt.label||'Institutional access'):`${attempt.group} · ${attempt.label||'Student'}`;
  const teamSize=Math.max(1,Array.isArray(attempt.names)?attempt.names.length:1);
  const collaboration=teamSize>1?`Team ×${teamSize} · shared progress`:'Individual progress';

  $('sessionBadge').textContent=identityLabel;
  $('identitySummary').textContent=`${identityLabel} · ${collaboration} · ${lang==='python'?'Python':'Java'} · ${backend}`;
  $('languageLabel').textContent=lang==='python'?'Python':'Java';
  $('globalPercent').textContent=`${pct}%`;
  $('globalProgressBar').style.width=`${pct}%`;
  const progressTrack=$('globalProgressBar')?.parentElement;
  if(progressTrack){progressTrack.setAttribute('role','progressbar');progressTrack.setAttribute('aria-label','OOP + UML progress');progressTrack.setAttribute('aria-valuemin','0');progressTrack.setAttribute('aria-valuemax','100');progressTrack.setAttribute('aria-valuenow',String(pct));}
  $('globalProgressCopy').textContent=teamSize>1?`${completed} of ${data.topics.length} sessions evidenced · shared with ${teamSize} team members`:`${completed} of ${data.topics.length} sessions evidenced`;

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

async function initialize(){
  if(booting)return;
  booting=true;
  attempt=null;
  render();
  $('bootActions')?.classList.add('hidden');

  const central=mainIdentity();
  const preferredEmail=central?.email||savedEmail();

  if(!preferredEmail){
    location.replace('../seminario/?next=oop');
    return;
  }

  setBoot('Restoring your original registered progress from Supabase…');
  try{
    /*
     * Always resolve against the backend on entry.
     * v10 deliberately reuses the canonical historical attempt with real
     * OOP/UML evidence, so an empty newer shell cannot replace old progress.
     */
    attempt=await store.startWithEmail({email:preferredEmail,language:'python'});
    saveEmail(preferredEmail);
    setBoot('Progress restored.');
    render();
  }catch(error){
    console.error('Tracked OOP progress could not be restored.',error);
    attempt=null;
    render();
    setBoot('Could not restore tracked Supabase progress. No local/untracked session was created. Retry the connection or return to Seminar home.',true);
  }finally{
    booting=false;
  }
}

$('retryBoot')?.addEventListener('click',initialize);
initialize();
