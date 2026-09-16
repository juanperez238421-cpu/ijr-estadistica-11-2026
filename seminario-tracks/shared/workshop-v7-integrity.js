(()=>{
'use strict';
function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn()}
function syncGates(){
  if(document.body.dataset.mode!=='workshop')return;
  const val=id=>document.getElementById(id)?.value?.trim()||'';
  const runOk=document.getElementById('runStatus')?.dataset.ok==='1';
  const code=(document.getElementById('codeWorkspace')?.value||'').trim();
  const tests=['normal','boundary','failure'].every(k=>val(`${k}Expected`).length>=8&&val(`${k}Observed`).length>=8);
  const states={predict:val('predictionInput').length>=20,model:val('modelInput').length>=30,implement:code.length>=20&&runOk,test:tests,modify:val('modificationInput').length>=20,explain:val('explanationInput').length>=30};
  document.querySelectorAll('[data-gate]').forEach(el=>el.classList.toggle('done',!!states[el.dataset.gate]));
}
ready(()=>{
  if(document.body.dataset.mode!=='workshop')return;
  const invalidate=()=>{const status=document.getElementById('runStatus');if(status?.dataset.ok==='1'){status.dataset.ok='0';status.textContent='Code changed after the last successful run. Run again to restore execution evidence.';status.className='status-banner'}syncGates()};
  document.getElementById('codeWorkspace')?.addEventListener('input',invalidate);
  document.getElementById('fixtureWorkspace')?.addEventListener('input',invalidate);
  ['predictionInput','modelInput','normalExpected','normalObserved','boundaryExpected','boundaryObserved','failureExpected','failureObserved','modificationInput','explanationInput'].forEach(id=>document.getElementById(id)?.addEventListener('input',syncGates));
  const status=document.getElementById('runStatus');if(status)new MutationObserver(syncGates).observe(status,{attributes:true,childList:true,subtree:true});
  syncGates();
});
})();
