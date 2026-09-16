(()=>{
'use strict';
const KEY='ijr-seminar-main-registration-v1';
const form=document.getElementById('entryForm');
const registration=document.getElementById('registrationSection');
const choices=document.getElementById('choiceSection');
const badge=document.getElementById('identityBadge');
const change=document.getElementById('changeStudent');
const nameInput=document.getElementById('fullName');
const groupInput=document.getElementById('groupCode');
const status=document.getElementById('entryStatus');

function clean(v=''){return String(v).trim().replace(/\s+/g,' ')}
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
function valid(entry){return entry&&clean(entry.fullName).length>=3&&/^11-[ABC]$/.test(entry.groupCode||'')}
function save(entry){localStorage.setItem(KEY,JSON.stringify(entry))}
function render(){
  const entry=read();
  if(valid(entry)){
    registration.classList.add('hidden');
    choices.classList.remove('hidden');
    badge.textContent=`${entry.fullName} · ${entry.groupCode}`;
    badge.classList.remove('hidden');
    change.classList.remove('hidden');
  }else{
    registration.classList.remove('hidden');
    choices.classList.add('hidden');
    badge.classList.add('hidden');
    change.classList.add('hidden');
  }
}

form?.addEventListener('submit',e=>{
  e.preventDefault();
  const fullName=clean(nameInput.value);
  const groupCode=groupInput.value;
  if(fullName.length<3||!/^11-[ABC]$/.test(groupCode)){
    status.textContent='Enter the full name and select group 11-A, 11-B or 11-C.';
    status.className='status error';
    return;
  }
  save({fullName,groupCode,registeredAt:new Date().toISOString(),version:1});
  status.textContent='';
  render();
  choices.scrollIntoView({behavior:'smooth',block:'start'});
});

change?.addEventListener('click',()=>{
  const current=read();
  localStorage.removeItem(KEY);
  if(current){nameInput.value=current.fullName||'';groupInput.value=current.groupCode||''}
  render();
  registration.scrollIntoView({behavior:'smooth',block:'start'});
});

const existing=read();
if(valid(existing)){nameInput.value=existing.fullName;groupInput.value=existing.groupCode}
render();
})();
