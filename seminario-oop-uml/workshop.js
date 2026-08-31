import {OopUmlStore} from './store.js';

const cfg=window.IJR_OOP_UML_CONFIG;
const data=window.IJR_OOP_UML_DATA;
const store=new OopUmlStore(cfg);
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const slug=params.get('topic')||'object-model';
let topic=(data?.topics||[]).find(x=>x.slug===slug)||data.topics[0];
let attempt=null;

const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const briefs={
  1:['Create two objects from one class and prove that they share behavior while keeping independent state.','Which values distinguish one instance from another?','Instantiate at least two objects and call one behavior.','Change one object state and verify the other instance is unaffected.','Add one new attribute to the UML class and implementation.'],
  2:['Model an object whose method changes its internal state in a controlled, observable way.','What should the object remember between method calls?','Implement one state-changing method.','Show state before and after the method call.','Add one business rule that constrains the state change.'],
  3:['Define a constructor that creates only coherent objects and makes required state explicit.','What data is mandatory at birth?','Implement initialization and one validation rule.','Create valid objects and attempt one invalid case.','Add a new required constructor parameter and update UML.'],
  4:['Protect internal state behind a deliberate public interface.','Which field should callers not change directly?','Implement controlled read/change behavior.','Test a valid and invalid update.','Strengthen one invariant without changing the public goal.'],
  5:['Build three collaborating classes and justify whether each relationship is association, aggregation or composition.','Who knows whom, and who owns whom?','Implement at least one has-a relationship.','Create the object graph and verify collaboration.','Change lifecycle ownership and update the UML relationship.'],
  6:['Create a parent and child only where the child truly represents a specialized form of the parent.','Can every child be used where the parent is expected?','Implement inheritance and one override.','Call the same method on parent/child instances.','Add a second child and decide whether the hierarchy still makes sense.'],
  7:['Use one common contract with at least two concrete implementations.','What behavior should callers depend on?','Implement a shared interface/abstract contract and two variants.','Process both variants through the common contract.','Add a third implementation without changing caller logic.'],
  8:['Design a 3–6 class architecture before adding feature code.','Can each class responsibility be stated in one sentence?','Implement a thin skeleton matching the class diagram.','Instantiate the collaboration path for one use case.','Move one misplaced responsibility to a better class and sync UML.'],
  9:['Refactor a small design while preserving intended behavior and keeping UML synchronized.','What structural problem are you fixing?','Perform one focused refactor.','Run the same before/after behavior check.','Make a second structural improvement and update the diagram immediately.'],
  10:['Prepare a final synchronized class diagram and demonstrate that you can explain and modify the architecture live.','Which decisions are essential to the architecture?','Run one representative use case.','Show that the final diagram matches the classes and relationships.','Accept one live requirement change and propagate it through model and code.']
};

const defense={
  1:['What is the difference between this class and these objects?','Which state belongs to each instance?','Where is the class responsibility visible in UML and code?'],
  2:['Why is this value state instead of a local variable?','Why should this behavior belong to this class?','What state transition did your test prove?'],
  3:['Why does the object require these constructor values?','How do you prevent invalid initial state?','How is initialization represented in UML?'],
  4:['What invariant are you protecting?','Why is this member private/protected/public?','Could a caller bypass your rule?'],
  5:['Why is this relationship not inheritance?','Who owns the part lifecycle?','What changes if the relationship becomes composition?'],
  6:['What makes this a real is-a relationship?','Which behavior is inherited and which is overridden?','Could composition be clearer here?'],
  7:['What contract is stable across implementations?','How does polymorphism reduce caller coupling?','What new implementation could be added without changing callers?'],
  8:['What is each class responsible for?','Which dependency is most important and why?','Where would a new feature belong?'],
  9:['What behavior remained unchanged?','What structural problem improved?','How did you prove UML and code stayed synchronized?'],
  10:['Which architecture decision would you defend first?','Which relationship is most likely to change?','Can you make a small live change without breaking the model?']
};

function selectedLanguage(){
  if(attempt?.language==='java'||attempt?.language==='python')return attempt.language;
  return params.get('lang')==='java'?'java':'python';
}

function hydrateEvidence(){
  const record=attempt?.sessions?.[topic.sessionKey];
  const evidence=record?.evidence||{};
  $('evModel').checked=evidence.model===true;
  $('evCode').checked=evidence.code===true;
  $('evTest').checked=evidence.test===true;
  $('evExplain').checked=evidence.explain===true;
  $('evidenceNotes').value=evidence.notes||'';
  const done=record?.status==='completed';
  $('completionStamp').textContent=done?'Completed':'Not recorded';
  $('completionStamp').classList.toggle('done',done);
  $('completionHeader').textContent=done?'This session has verified evidence saved in Supabase. You may update the notes/evidence record if needed.':'Session evidence not recorded yet.';
  $('completionHeader').classList.toggle('ok',done);
}

function renderTopic(){
  const lang=selectedLanguage();
  document.title=`Seminar 11 · ${topic.title} · Workshop`;
  $('sessionLabel').textContent=`SESSION ${String(topic.n).padStart(2,'0')} · WORKSHOP · ${lang.toUpperCase()}`;
  $('title').textContent=topic.title;
  $('lead').textContent=topic.lead;
  $('crumbTopic').textContent=topic.title;
  $('labReference').textContent=topic.lab;
  $('umlName').textContent=topic.uml.name;
  $('umlAttrs').innerHTML=topic.uml.attrs.length?topic.uml.attrs.map(x=>`<div>${esc(x)}</div>`).join(''):'<div><em>No attributes required at this abstraction.</em></div>';
  $('umlOps').innerHTML=topic.uml.ops.map(x=>`<div>${esc(x)}</div>`).join('');
  const brief=briefs[topic.n];
  $('taskTitle').textContent=`Session ${String(topic.n).padStart(2,'0')} design challenge`;
  $('taskBrief').textContent=brief[0];
  $('predictTask').textContent=brief[1];
  $('implementTask').textContent=brief[2];
  $('testTask').textContent=brief[3];
  $('modifyTask').textContent=brief[4];
  $('taskCriteria').innerHTML=topic.evidence.map((x,i)=>`<article><strong>Evidence ${String(i+1).padStart(2,'0')}</strong><p>${esc(x)}</p></article>`).join('');
  $('evidenceList').innerHTML=topic.evidence.map(x=>`<li>${esc(x)}</li>`).join('');
  $('defenseQuestions').innerHTML=(defense[topic.n]||[]).map(x=>`<li>${esc(x)}</li>`).join('');
  const theory=`theory.html?topic=${encodeURIComponent(topic.slug)}&lang=${lang}`;
  $('theoryTop').href=theory;
  $('theoryBottom').href=theory;
  $('sessionBadge').textContent=`${attempt.group} · ${attempt.label}`;
  $('sessionBadge').classList.remove('hidden');
  hydrateEvidence();
}

async function saveEvidence(){
  const evidence={
    model:$('evModel').checked,
    code:$('evCode').checked,
    test:$('evTest').checked,
    explain:$('evExplain').checked,
    notes:$('evidenceNotes').value.trim()
  };
  $('saveEvidence').disabled=true;
  $('saveStatus').textContent='Validating and saving evidence…';
  try{
    attempt=await store.recordSession(topic.sessionKey,evidence);
    hydrateEvidence();
    $('saveStatus').textContent=attempt.backend==='supabase'?'Verified session evidence saved to Supabase.':'Session evidence saved in local recovery mode.';
  }catch(error){
    console.error(error);
    $('saveStatus').textContent=error.message||'Evidence could not be saved.';
  }finally{
    $('saveEvidence').disabled=false;
  }
}

$('saveEvidence').addEventListener('click',saveEvidence);
store.restore().then(value=>{
  attempt=value;
  if(!attempt){$('accessPanel').classList.remove('hidden');return;}
  $('workshopPanel').classList.remove('hidden');
  renderTopic();
}).catch(error=>{
  console.error(error);
  $('accessPanel').classList.remove('hidden');
});
