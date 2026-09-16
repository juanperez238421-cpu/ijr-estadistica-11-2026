(()=>{
'use strict';
const MAIN_KEY='ijr-seminar-main-registration-v1';
function clean(v=''){return String(v).trim().replace(/\s+/g,' ')}
function read(){try{return JSON.parse(localStorage.getItem(MAIN_KEY)||'null')}catch{return null}}
function valid(e){return e&&clean(e.fullName).length>=3&&/^11-[ABC]$/.test(e.groupCode||'')}
const entry=read();
const script=document.currentScript;
const mainHref=script?.dataset?.mainHref||'../seminario/';
const mode=script?.dataset?.mode||'';
if(!valid(entry)){
  const target=new URL(mainHref,location.href);
  if(mode)target.searchParams.set('next',mode);
  location.replace(target.href);
  return;
}
globalThis.IJR_SEMINAR_MAIN_ENTRY=Object.freeze({fullName:clean(entry.fullName),groupCode:entry.groupCode});

if(mode==='oop'){
  window.addEventListener('DOMContentLoaded',()=>{
    const group=document.getElementById('groupCode');
    const name=document.getElementById('memberName1');
    if(group&&!group.value)group.value=entry.groupCode;
    if(name&&!clean(name.value))name.value=clean(entry.fullName);
  },{once:true});
}

if(mode==='specialized-track'){
  const slug=document.body.dataset.track;
  if(!slug)return;
  const key=`ijr-seminar-specialized-diagnostic-v5:${slug}`;
  let state={};
  try{state=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{state={}}
  if(!state.identity){
    state.identity={fullName:clean(entry.fullName),groupCode:entry.groupCode};
    localStorage.setItem(key,JSON.stringify(state));
  }
}
})();
