(()=>{
'use strict';
const KEY='ijr-seminar-main-registration-v2';
const LEGACY_KEY='ijr-seminar-main-registration-v1';
const SUPABASE_URL='https://rlfxnjbqxbozjdzkbwlz.supabase.co';
const SUPABASE_KEY='sb_publishable_rmVOQ3Orx49KpW_4uMqYew_c2HpcA87';
const RPC='seminar_email_identity_v1';
const client=globalThis.supabase?.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const form=document.getElementById('entryForm');
const registration=document.getElementById('registrationSection');
const choices=document.getElementById('choiceSection');
const badge=document.getElementById('identityBadge');
const change=document.getElementById('changeStudent');
const emailInput=document.getElementById('institutionalEmail');
const button=document.getElementById('entryButton');
const status=document.getElementById('entryStatus');
const next=new URLSearchParams(location.search).get('next')||'';

function normalizeEmail(v=''){return String(v).trim().toLowerCase();}
function validEmail(v){return /^[^\s@]+@ijr\.edu\.co$/i.test(normalizeEmail(v));}
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
function valid(entry){return entry&&validEmail(entry.institutionalEmail)&&String(entry.fullName||'').trim().length>=3&&/^(11-[ABC]|11-U)$/.test(entry.groupCode||'')}
function save(entry){localStorage.setItem(KEY,JSON.stringify(entry));localStorage.removeItem(LEGACY_KEY);}
function routeNext(){if(next==='oop'){location.replace('../seminario-oop-uml/?v=20260923-email-v3');return true;}return false;}
function render(){
  const entry=read();
  if(valid(entry)){
    registration.classList.add('hidden');
    choices.classList.remove('hidden');
    badge.textContent=entry.groupCode==='11-U'?entry.institutionalEmail:`${entry.fullName} · ${entry.groupCode}`;
    badge.classList.remove('hidden');
    change.classList.remove('hidden');
  }else{
    registration.classList.remove('hidden');
    choices.classList.add('hidden');
    badge.classList.add('hidden');
    change.classList.add('hidden');
  }
}

async function resolveIdentity(email){
  if(!client)throw new Error('Supabase client unavailable.');
  const {data,error}=await client.rpc(RPC,{p_email:email});
  if(error)throw new Error(error.message||'Could not validate the institutional email.');
  if(!data?.ok)throw new Error('Use only your institutional @ijr.edu.co email.');
  return data;
}

form?.addEventListener('submit',async e=>{
  e.preventDefault();
  const email=normalizeEmail(emailInput.value);
  if(!validEmail(email)){
    status.textContent='Use only your institutional @ijr.edu.co email.';
    status.className='status error';
    emailInput.focus();
    return;
  }
  button.disabled=true;
  status.textContent='Validating institutional email…';
  status.className='status';
  try{
    const identity=await resolveIdentity(email);
    save({
      institutionalEmail:identity.email,
      fullName:identity.display_name,
      groupCode:identity.group_code,
      registeredAt:new Date().toISOString(),
      version:2
    });
    status.textContent='Access granted.';
    status.className='status ok';
    if(!routeNext()){
      render();
      choices.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }catch(error){
    status.textContent=error?.message||'Access could not be validated.';
    status.className='status error';
    emailInput.focus();
  }finally{button.disabled=false;}
});

change?.addEventListener('click',()=>{
  const current=read();
  localStorage.removeItem(KEY);
  if(current?.institutionalEmail)emailInput.value=current.institutionalEmail;
  render();
  registration.scrollIntoView({behavior:'smooth',block:'start'});
});

localStorage.removeItem(LEGACY_KEY);
const existing=read();
if(valid(existing)){
  emailInput.value=existing.institutionalEmail||'';
  if(!routeNext())render();
}else{
  render();
}
})();
