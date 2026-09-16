(()=>{
'use strict';

const cfg=globalThis.IJR_SPECIALIZED_HUB_CONFIG;
const slug=document.body.dataset.track;
if(!cfg||!slug)return;

const PYODIDE_URL='https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js';
const PYODIDE_INDEX='https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
let pyodideInstance=null;
let enhancing=false;

const practicals={
  web:[
    {
      id:'web-valid-age',position:4,runtime:'javascript',title:'Terminal A · Input validation',
      prompt:'Implement validAge(value). Return true only when value represents an integer age from 5 through 120. Test strings as if they came from input.value.',
      starter:`function validAge(value) {
  // TODO: convert, validate integer, and enforce 5..120
}

console.log(validAge('17'));`,
      tests:`
if (typeof validAge !== 'function') throw new Error('Define validAge(value).');
const cases=[['17',true],['5',true],['120',true],['4',false],['121',false],['5.5',false],['abc',false],['',false]];
for(const [value,expected] of cases){
  const actual=validAge(value);
  if(actual!==expected) throw new Error('validAge('+JSON.stringify(value)+') expected '+expected+' but got '+actual);
}
console.log('All validation tests passed.');`
    },
    {
      id:'web-task-domain',position:11,runtime:'javascript',title:'Terminal B · Domain object',
      prompt:'Implement Task so the constructor trims a non-empty title, starts done=false, rejects an empty title, and complete() changes done to true.',
      starter:`class Task {
  constructor(title) {
    // TODO
  }

  complete() {
    // TODO
  }
}

const task = new Task('  Prepare demo  ');
console.log(task.title, task.done);`,
      tests:`
if (typeof Task !== 'function') throw new Error('Define class Task.');
const t=new Task('  Prepare demo  ');
if(t.title!=='Prepare demo') throw new Error('The title must be trimmed.');
if(t.done!==false) throw new Error('A new task must start with done=false.');
t.complete();
if(t.done!==true) throw new Error('complete() must set done=true.');
let rejected=false;try{new Task('   ')}catch(_){rejected=true}
if(!rejected) throw new Error('An empty title must be rejected.');
console.log('All Task tests passed.');`
    }
  ],
  'data-science':[
    {
      id:'data-iqr-fences',position:6,runtime:'python',title:'Terminal A · Statistical logic',
      prompt:'Implement iqr_fences(q1, q3). Return a tuple (lower, upper) using the 1.5×IQR rule.',
      starter:`def iqr_fences(q1, q3):
    # TODO: calculate IQR and both fences
    pass

print(iqr_fences(12, 20))`,
      tests:`
assert callable(iqr_fences), 'Define iqr_fences(q1, q3).'
assert iqr_fences(12,20)==(0.0,32.0), 'For Q1=12,Q3=20 the fences must be (0,32).'
assert iqr_fences(5,9)==(-1.0,15.0), 'Check the 1.5*IQR calculation.'
print('All IQR tests passed.')`
    },
    {
      id:'data-pandas-filter',position:7,runtime:'python',title:'Terminal B · Pandas filter',
      prompt:'Implement passed_rows(df). Return only rows where score is at least 3.0. Do not mutate the input DataFrame.',
      starter:`import pandas as pd

def passed_rows(df):
    # TODO: return the filtered DataFrame
    pass

sample = pd.DataFrame({'student':['A','B','C'],'score':[2.5,3.0,4.5]})
print(passed_rows(sample))`,
      tests:`
import pandas as pd
sample=pd.DataFrame({'student':['A','B','C'],'score':[2.5,3.0,4.5]})
before=sample.copy(deep=True)
out=passed_rows(sample)
assert isinstance(out,pd.DataFrame), 'Return a DataFrame.'
assert out['student'].tolist()==['B','C'], 'Keep only scores >= 3.0.'
assert sample.equals(before), 'Do not mutate the input DataFrame.'
print('All pandas filter tests passed.')`
    }
  ],
  cybersecurity:[
    {
      id:'cyber-valid-code',position:4,runtime:'python',title:'Terminal A · Allow-list validation',
      prompt:'Implement valid_code(value). It must accept only a string containing exactly six decimal digits. Keep the task defensive and local.',
      starter:`def valid_code(value):
    # TODO: allow exactly six digits and nothing else
    pass

print(valid_code('104829'))`,
      tests:`
assert callable(valid_code), 'Define valid_code(value).'
cases=[('104829',True),('000001',True),('12345',False),('1234567',False),('12A456',False),(123456,False),('',False)]
for value,expected in cases:
    actual=valid_code(value)
    assert actual is expected, f'valid_code({value!r}) expected {expected}, got {actual!r}'
print('All validation tests passed.')`
    },
    {
      id:'cyber-access-policy',position:11,runtime:'python',title:'Terminal B · Access policy reasoning',
      prompt:'Implement allowed(role, action) using the provided permissions. Unknown roles/actions must return False. This is an authorization simulation for a system you control.',
      starter:`permissions = {
    'student': {'read'},
    'teacher': {'read', 'grade'},
    'admin': {'read', 'grade', 'manage'},
}

def allowed(role, action):
    # TODO
    pass

print(allowed('student', 'grade'))`,
      tests:`
assert callable(allowed), 'Define allowed(role, action).'
assert allowed('student','read') is True
assert allowed('student','grade') is False
assert allowed('teacher','grade') is True
assert allowed('admin','manage') is True
assert allowed('unknown','read') is False
assert allowed('teacher','delete') is False
print('All access-policy tests passed.')`
    }
  ],
  '3d-programming':[
    {
      id:'3d-translate',position:4,runtime:'python',title:'Terminal A · 3D transformation',
      prompt:'Implement translate(point, dx=0, dy=0, dz=0). Return a new (x,y,z) tuple without changing the original point.',
      starter:`def translate(point, dx=0, dy=0, dz=0):
    # TODO
    pass

p0=(10,5,0)
print(translate(p0, dx=15, dy=-2, dz=8))`,
      tests:`
p0=(10,5,0)
assert translate(p0,dx=15,dy=-2,dz=8)==(25,3,8)
assert translate((0,0,0),dz=-5)==(0,0,-5)
assert p0==(10,5,0), 'Do not mutate the original tuple.'
print('All translation tests passed.')`
    },
    {
      id:'3d-positive-dimension',position:8,runtime:'python',title:'Terminal B · Geometry validation',
      prompt:'Implement positive_mm(name, value). Convert value to float and reject zero or negative dimensions with ValueError.',
      starter:`def positive_mm(name, value):
    # TODO
    pass

print(positive_mm('width', 25))`,
      tests:`
assert positive_mm('width',25)==25.0
assert positive_mm('height','12.5')==12.5
for bad in [0,-1,'0']:
    failed=False
    try: positive_mm('dimension',bad)
    except ValueError: failed=True
    assert failed, f'{bad!r} must be rejected with ValueError.'
print('All dimension tests passed.')`
    }
  ],
  robotics:[
    {
      id:'robotics-threshold',position:6,runtime:'python',title:'Terminal A · Threshold control',
      prompt:'Implement fan_on(temperature, limit=30). Return a Boolean: True only when temperature is strictly greater than limit.',
      starter:`def fan_on(temperature, limit=30):
    # TODO
    pass

print(fan_on(28))`,
      tests:`
assert fan_on(31) is True
assert fan_on(30) is False
assert fan_on(28) is False
assert fan_on(21,limit=20) is True
print('All threshold tests passed.')`
    },
    {
      id:'robotics-failsafe',position:12,runtime:'python',title:'Terminal B · Fail-safe state logic',
      prompt:'Implement next_state(sensor_ok, distance). Return SAFE_STOP if the sensor is invalid, STOP when distance < 20, otherwise MOVE.',
      starter:`def next_state(sensor_ok, distance):
    # TODO
    pass

print(next_state(True,45))`,
      tests:`
assert next_state(False,100)=='SAFE_STOP'
assert next_state(False,0)=='SAFE_STOP'
assert next_state(True,19)=='STOP'
assert next_state(True,20)=='MOVE'
assert next_state(True,45)=='MOVE'
print('All fail-safe tests passed.')`
    }
  ]
};

const trackPracticals=practicals[slug]||[];
const hubKey=cfg.localPrefix+slug;

function hubState(){try{return JSON.parse(localStorage.getItem(hubKey)||'{}')}catch{return {}}}
function attemptId(){return hubState()?.session?.attemptId||'pending'}
function practicalKey(ch){return `ijr-seminar-diagnostic-practical-v6:${attemptId()}:${slug}:${ch.id}`}
function readPractical(ch){
  try{
    const parsed=JSON.parse(localStorage.getItem(practicalKey(ch))||'null');
    if(parsed)return {...parsed,code:typeof parsed.code==='string'?parsed.code:ch.starter};
  }catch{}
  return {code:ch.starter,runCount:0,passed:false,lastOutput:'',lastRunAt:null};
}
function writePractical(ch,state){localStorage.setItem(practicalKey(ch),JSON.stringify(state))}
function counts(){
  const states=trackPracticals.map(readPractical);
  return {attempted:states.filter(s=>Number(s.runCount)>0).length,passed:states.filter(s=>s.passed===true).length,total:trackPracticals.length};
}
function currentPosition(){const n=Number(hubState()?.index);return Number.isInteger(n)?n+1:null}
function esc(v=''){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}

function normalizeQuestionText(){
  const frame=document.getElementById('diagnosticFrame');if(!frame)return;
  frame.querySelectorAll('.question-code-prompt,.question-stage h3,.option>span:last-child').forEach(el=>{
    const raw=el.textContent||'';
    if(!raw.includes('\\n'))return;
    const normalized=raw.replace(/\\n/g,'\n');
    if(el.matches('.question-stage h3')){
      const pre=document.createElement('pre');
      pre.className='question-code-prompt normalized-code-prompt-v6';
      pre.textContent=normalized;
      el.replaceWith(pre);
    }else{
      el.textContent=normalized;
    }
  });
}

function addProgressCard(){
  const frame=document.getElementById('diagnosticFrame');
  const legend=frame?.querySelector('.legend');
  if(!legend||legend.querySelector('.practical-progress-v6'))return;
  const c=counts();
  const div=document.createElement('div');
  div.className='practical-progress-v6';
  div.innerHTML=`<strong>Practical terminal</strong><span>${c.attempted}/${c.total} attempted · ${c.passed}/${c.total} passed</span><small>Terminal tasks appear on questions ${trackPracticals.map(x=>x.position).join(' and ')}. A run is required; a pass is diagnostic evidence, not a submission requirement.</small>`;
  legend.appendChild(div);
}

function practicalPanel(ch){
  const s=readPractical(ch);
  const panel=document.createElement('section');
  panel.className='diagnostic-practical-v6';
  panel.dataset.challenge=ch.id;
  panel.innerHTML=`<div class="practical-head-v6"><div><p class="eyebrow">PRACTICAL TERMINAL · REQUIRED ATTEMPT</p><h4>${esc(ch.title)}</h4><p>${esc(ch.prompt)}</p></div><span class="runtime-badge-v6">${esc(ch.runtime)}</span></div>
  <div class="terminal-grid-v6"><div><label class="terminal-label-v6" for="practicalCodeV6">Your code</label><textarea id="practicalCodeV6" class="terminal-editor-v6" spellcheck="false">${esc(s.code)}</textarea><div class="terminal-actions-v6"><button id="runPracticalV6" class="button button-dark" type="button">Run tests</button><button id="resetPracticalV6" class="button button-light" type="button">Reset scaffold</button><span id="practicalRunCountV6">Runs: ${Number(s.runCount)||0}</span></div></div><div><span class="terminal-label-v6">Terminal output</span><pre id="practicalOutputV6" class="terminal-output-v6">${esc(s.lastOutput||'Run the code to generate evidence.')}</pre><div id="practicalStatusV6" class="practical-status-v6 ${s.passed?'pass':Number(s.runCount)>0?'fail':''}">${s.passed?'PASS · hidden/public test set satisfied':Number(s.runCount)>0?'Attempt recorded · tests not yet passing':'Not attempted yet'}</div></div></div>`;
  return panel;
}

function mountCurrentPractical(){
  const frame=document.getElementById('diagnosticFrame');
  const stage=frame?.querySelector('.question-stage');
  if(!stage)return;
  const pos=currentPosition();
  const ch=trackPracticals.find(x=>x.position===pos);
  if(!ch)return;
  if(stage.querySelector(`[data-challenge="${ch.id}"]`))return;
  const actions=stage.querySelector('.question-actions');
  const panel=practicalPanel(ch);
  if(actions)stage.insertBefore(panel,actions);else stage.appendChild(panel);
  wirePractical(ch,panel);
}

function wirePractical(ch,panel){
  const editor=panel.querySelector('#practicalCodeV6');
  const output=panel.querySelector('#practicalOutputV6');
  const status=panel.querySelector('#practicalStatusV6');
  const run=panel.querySelector('#runPracticalV6');
  const reset=panel.querySelector('#resetPracticalV6');
  editor?.addEventListener('input',()=>{
    const s=readPractical(ch);s.code=editor.value;s.passed=false;s.lastOutput='Code changed. Run again to refresh execution evidence.';writePractical(ch,s);status.textContent=Number(s.runCount)>0?'Code changed · rerun required':'Not attempted yet';status.className='practical-status-v6 '+(Number(s.runCount)>0?'fail':'');output.textContent=s.lastOutput;refreshGate();
  });
  reset?.addEventListener('click',()=>{
    const s={code:ch.starter,runCount:0,passed:false,lastOutput:'Scaffold restored. Run the code to create evidence.',lastRunAt:null};writePractical(ch,s);editor.value=s.code;output.textContent=s.lastOutput;status.textContent='Not attempted yet';status.className='practical-status-v6';panel.querySelector('#practicalRunCountV6').textContent='Runs: 0';refreshGate();
  });
  run?.addEventListener('click',async()=>{
    if(run.disabled)return;
    run.disabled=true;run.textContent='Running…';status.textContent='Executing in the browser sandbox…';status.className='practical-status-v6';output.textContent='Starting runtime…';
    let result;
    try{result=ch.runtime==='javascript'?await runJavaScript(editor.value,ch.tests):await runPython(editor.value,ch.tests)}catch(err){result={ok:false,output:String(err?.message||err)}}
    const s=readPractical(ch);s.code=editor.value;s.runCount=(Number(s.runCount)||0)+1;s.passed=Boolean(result.ok);s.lastOutput=result.output||'(no output)';s.lastRunAt=new Date().toISOString();writePractical(ch,s);
    output.textContent=s.lastOutput;panel.querySelector('#practicalRunCountV6').textContent=`Runs: ${s.runCount}`;status.textContent=s.passed?'PASS · practical tests satisfied':'Attempt recorded · inspect the terminal and revise';status.className='practical-status-v6 '+(s.passed?'pass':'fail');run.disabled=false;run.textContent='Run tests';
    recordPractical(ch,s).catch(()=>{});refreshGate();
  });
}

function loadScript(src){
  return new Promise((resolve,reject)=>{
    const existing=[...document.scripts].find(s=>s.src===src);
    if(existing){if(globalThis.loadPyodide)return resolve();existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}
    const s=document.createElement('script');s.src=src;s.async=true;s.onload=resolve;s.onerror=()=>reject(new Error('Could not load Python runtime.'));document.head.appendChild(s);
  });
}
async function ensurePyodide(){
  if(pyodideInstance)return pyodideInstance;
  if(!globalThis.loadPyodide)await loadScript(PYODIDE_URL);
  pyodideInstance=await globalThis.loadPyodide({indexURL:PYODIDE_INDEX});
  return pyodideInstance;
}
async function runPython(code,tests){
  const py=await ensurePyodide();
  const out=[];const err=[];
  py.setStdout({batched:s=>out.push(s)});py.setStderr({batched:s=>err.push(s)});
  const combined=`${code}\n\n# --- diagnostic tests ---\n${tests}`;
  try{
    await py.loadPackagesFromImports(combined);
    await py.runPythonAsync(combined);
    return {ok:true,output:[...out,...err].join('\n')||'Execution completed.'};
  }catch(e){return {ok:false,output:[...out,...err,String(e?.message||e)].filter(Boolean).join('\n')}}
}
function runJavaScript(code,tests){
  return new Promise(resolve=>{
    const channel=`ijr-diag-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const iframe=document.createElement('iframe');iframe.sandbox='allow-scripts';iframe.hidden=true;
    iframe.srcdoc=`<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; connect-src 'none'"><script>addEventListener('message',e=>{const d=e.data||{};if(!d.channel)return;const logs=[];const fmt=v=>{try{return typeof v==='string'?v:JSON.stringify(v)}catch{return String(v)}};console.log=(...a)=>logs.push(a.map(fmt).join(' '));try{(0,eval)(String(d.code||'')+'\\n'+String(d.tests||''));parent.postMessage({channel:d.channel,ok:true,output:logs.join('\\n')||'Execution completed.'},'*')}catch(err){parent.postMessage({channel:d.channel,ok:false,output:[...logs,String(err&&err.stack||err)].join('\\n')},'*')}});<\/script>`;
    let done=false;
    const finish=result=>{if(done)return;done=true;removeEventListener('message',onMessage);iframe.remove();resolve(result)};
    const onMessage=e=>{if(e.source!==iframe.contentWindow||e.data?.channel!==channel)return;finish({ok:Boolean(e.data.ok),output:String(e.data.output||'')})};
    addEventListener('message',onMessage);
    iframe.addEventListener('load',()=>iframe.contentWindow?.postMessage({channel,code,tests},'*'),{once:true});
    document.body.appendChild(iframe);
    setTimeout(()=>finish({ok:false,output:'Execution timed out.'}),8000);
  });
}

async function recordPractical(ch,s){
  const h=hubState();const editToken=h?.profileToken;const id=h?.session?.attemptId;
  if(!editToken||!id)return;
  await fetch(`${cfg.supabaseUrl}/functions/v1/${cfg.gatewayFunction}`,{
    method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.supabasePublishableKey,'Authorization':`Bearer ${cfg.supabasePublishableKey}`},
    body:JSON.stringify({action:'diagnostic-practical',edit_token:editToken,attempt_id:id,track_slug:slug,challenge_id:ch.id,runtime:ch.runtime,passed:Boolean(s.passed),run_count:Number(s.runCount)||0})
  });
}

function refreshGate(){
  const frame=document.getElementById('diagnosticFrame');if(!frame)return;
  const c=counts();
  const progress=frame.querySelector('.practical-progress-v6');
  if(progress){progress.querySelector('span').textContent=`${c.attempted}/${c.total} attempted · ${c.passed}/${c.total} passed`;}
  const submit=frame.querySelector('#submitBtn');
  if(submit){
    const h=hubState();const answered=Object.values(h?.answers||{}).filter(Number.isInteger).length;
    submit.disabled=answered<15||c.attempted<c.total;
    submit.title=c.attempted<c.total?`Run both practical terminal tasks before submitting (${c.attempted}/${c.total} attempted).`:'';
    let note=frame.querySelector('.practical-submit-note-v6');
    if(!note){note=document.createElement('p');note.className='practical-submit-note-v6';submit.closest('.question-actions')?.insertAdjacentElement('afterend',note)}
    if(note)note.textContent=c.attempted<c.total?`Diagnostic submission unlocks after both terminal tasks have been run. Passing is not required: ${c.attempted}/${c.total} attempted.`:`Practical requirement complete: ${c.attempted}/${c.total} attempted · ${c.passed}/${c.total} passed.`;
  }
  const pos=currentPosition();const ch=trackPracticals.find(x=>x.position===pos);if(ch){const panel=frame.querySelector(`[data-challenge="${ch.id}"]`);const s=readPractical(ch);if(panel&&!panel.matches(':focus-within')){panel.querySelector('#practicalRunCountV6').textContent=`Runs: ${Number(s.runCount)||0}`;}}
}

function addResultSummary(){
  const frame=document.getElementById('diagnosticFrame');const h=hubState();if(!frame||!h?.report||frame.querySelector('.practical-result-v6'))return;
  const c=counts();const label=c.passed===c.total?'Strong practical evidence':c.passed>0?'Partial practical evidence':'Practical foundation needs support';
  const div=document.createElement('section');div.className='practical-result-v6';
  div.innerHTML=`<p class="eyebrow">PRACTICAL TERMINAL EVIDENCE</p><div><strong>${c.passed}/${c.total} passed</strong><span>${esc(label)}</span></div><p>Both coding tasks were executed before submission. This practical evidence is reported separately from the protected 12-item knowledge score.</p>`;
  frame.appendChild(div);
}

function enhance(){
  if(enhancing)return;enhancing=true;
  try{normalizeQuestionText();addProgressCard();mountCurrentPractical();refreshGate();addResultSummary()}finally{enhancing=false}
}

const observer=new MutationObserver(()=>queueMicrotask(enhance));
function start(){const frame=document.getElementById('diagnosticFrame');if(!frame)return setTimeout(start,100);observer.observe(frame,{childList:true,subtree:true});enhance()}
start();
})();