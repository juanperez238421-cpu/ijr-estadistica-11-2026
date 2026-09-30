import {OopUmlStore,isInstitutionalEmail} from './store.js?v=20260930-direct-v5';

const cfg=window.IJR_OOP_UML_CONFIG;
const data=window.IJR_OOP_UML_DATA;
const store=new OopUmlStore(cfg);
const $=id=>document.getElementById(id);
const ACCESS_KEY='ijr-seminar-oop-email-v3';
let attempt=null;

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

function render(){
  const ready=!!attempt;
  $('bootPanel')?.classList.toggle('hidden',ready);
  $('hubPanel').classList.toggle('hidden',!ready);
  $('sessionBadge').classList.toggle('hidden',!ready);
  if(!ready)return;

  const lang=currentLanguage();
  const completed=data.topics.filter(isComplete).length;
  const pct=Math.round(completed/data.topics.length*100);
  const backend=attempt.backend==='supabase'?'Supabase synchronized':'Open local session';
  const identityLabel=attempt.group==='11-U'?(attempt.label||'Open access'):`${attempt.group} · ${attempt.label||'Student'}`;

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

async function initialize(){
  const status=$('bootStatus');
  const central=mainIdentity();
  const remembered=savedEmail();
  let restored=null;

  if(status)status.textContent='Opening the OOP + UML Common Core…';
  try{restored=await store.restore();}catch(error){console.warn('OOP restore skipped.',error);}

  const preferredEmail=central?.email||remembered;
  if(preferredEmail){
    if(restored?.email===preferredEmail&&restored?.backend==='supabase'){
      attempt=restored;
      saveEmail(preferredEmail);
    }else{
      if(restored)store.reset();
      try{
        attempt=await store.startWithEmail({email:preferredEmail,language:'python'});
        saveEmail(preferredEmail);
      }catch(error){
        console.warn('Supabase identity sync unavailable; opening locally.',error);
        attempt=store.startOpen({
          language:'python',
          label:central?.fullName||'Open access',
          group:central?.groupCode||'11-U'
        });
      }
    }
  }else if(restored){
    attempt=restored;
  }else{
    attempt=store.startOpen({language:'python'});
  }

  render();
}

initialize().catch(error=>{
  console.error(error);
  attempt=store.startOpen({language:'python'});
  render();
});
