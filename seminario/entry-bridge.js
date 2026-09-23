(()=>{
'use strict';
const MAIN_KEY='ijr-seminar-main-registration-v2';
function clean(v=''){return String(v).trim().replace(/\s+/g,' ')}
function normalizeEmail(v=''){return String(v).trim().toLowerCase()}
function read(){try{return JSON.parse(localStorage.getItem(MAIN_KEY)||'null')}catch{return null}}
function valid(e){return e&&/^[^\s@]+@ijr\.edu\.co$/i.test(normalizeEmail(e.institutionalEmail))&&clean(e.fullName).length>=3&&/^11-[ABC]$/.test(e.groupCode||'')}
const entry=read();
const script=document.currentScript;
const mainHref=script?.dataset?.mainHref||'../seminario/';
const mode=script?.dataset?.mode||'';

if(!valid(entry)){
  if(mode==='oop')return;
  const target=new URL(mainHref,location.href);
  if(mode)target.searchParams.set('next',mode);
  location.replace(target.href);
  return;
}

globalThis.IJR_SEMINAR_MAIN_ENTRY=Object.freeze({
  institutionalEmail:normalizeEmail(entry.institutionalEmail),
  fullName:clean(entry.fullName),
  groupCode:entry.groupCode
});

if(mode==='oop'){
  window.addEventListener('DOMContentLoaded',()=>{
    const email=document.getElementById('institutionalEmail');
    if(email&&!normalizeEmail(email.value))email.value=normalizeEmail(entry.institutionalEmail);
  },{once:true});
}

if(mode==='specialized-track'){
  const slug=document.body.dataset.track;
  if(!slug)return;
  const key=`ijr-seminar-specialized-diagnostic-v5:${slug}`;
  let state={};
  try{state=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{state={}}
  if(!state.identity){
    state.identity={fullName:clean(entry.fullName),groupCode:entry.groupCode,institutionalEmail:normalizeEmail(entry.institutionalEmail)};
    localStorage.setItem(key,JSON.stringify(state));
  }
}
})();
