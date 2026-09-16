(()=>{
'use strict';

const cfg=globalThis.IJR_SPECIALIZED_HUB_CONFIG;
const slug=document.body.dataset.track;
if(!cfg||!slug)return;

const PYODIDE_URL='https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js';
const PYODIDE_INDEX='https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
let pyodideInstance=null;
let scheduled=false;

const practicals={
  web:[
    {id:'web-valid-age',position:4,runtime:'javascript',title:'Terminal A · Input validation',prompt:'Implement validAge(value). Return true only when value represents an integer age from 5 through 120.',starter:`function validAge(value) {
  // TODO: convert, validate integer, and enforce 5..120
}

console.log(validAge('17'));`,tests:`if (typeof validAge !== 'function') throw new Error('Define validAge(value).');
const cases=[['17',true],['5',true],['120',true],['4',false],['121',false],['5.5',false],['abc',false],['',false]];
for(const [value,expected] of cases){const actual=validAge(value);if(actual!==expected)throw new Error('Expected '+expected+' for '+JSON.stringify(value)+', got '+actual);}
console.log('All validation tests passed.');`},
    {id:'web-task-domain',position:11,runtime:'javascript',title:'Terminal B · Domain object',prompt:'Implement Task so title is trimmed and non-empty, done starts false, and complete() changes done to true.',starter:`class Task {
  constructor(title) {
    // TODO
  }
  complete() {
    // TODO
  }
}

const task = new Task('  Prepare demo  ');
console.log(task.title, task.done);`,tests:`if (typeof Task !== 'function') throw new Error('Define class Task.');
const t=new Task('  Prepare demo  ');
if(t.title!=='Prepare demo')throw new Error('The title must be trimmed.');
if(t.done!==false)throw new Error('A new task must start with done=false.');
t.complete();if(t.done!==true)throw new Error('complete() must set done=true.');
let rejected=false;try{new Task('   ')}catch(_){rejected=true}if(!rejected)throw new Error('Empty title must be rejected.');
console.log('All Task tests passed.');`}
  ],
  'data-science':[
    {id:'data-iqr-fences',position:6,runtime:'python',title:'Terminal A · Statistical logic',prompt:'Implement iqr_fences(q1, q3). Return (lower, upper) using the 1.5×IQR rule.',starter:`def iqr_fences(q1, q3):
    # TODO
    pass

print(iqr_fences(12, 20))`,tests:`assert callable(iqr_fences)
assert iqr_fences(12,20)==(0.0,32.0)
assert iqr_fences(5,9)==(-1.0,15.0)
print('All IQR tests passed.')`},
    {id:'data-pandas-filter',position:7,runtime:'python',title:'Terminal B · Pandas filter',prompt:'Implement passed_rows(df). Return only rows where score is at least 3.0 without mutating the input.',starter:`import pandas as pd

def passed_rows(df):
    # TODO
    pass

sample = pd.DataFrame({'student':['A','B','C'],'score':[2.5,3.0,4.5]})
print(passed_rows(sample))`,tests:`import pandas as pd
sample=pd.DataFrame({'student':['A','B','C'],'score':[2.5,3.0,4.5]})
before=sample.copy(deep=True)
out=passed_rows(sample)
assert isinstance(out,pd.DataFrame)
assert out['student'].tolist()==['B','C']
assert sample.equals(before)
print('All pandas filter tests passed.')`}
  ],
  cybersecurity:[
    {id:'cyber-valid-code',position:4,runtime:'python',title:'Terminal A · Allow-list validation',prompt:'Implement valid_code(value). Accept only a string containing exactly six decimal digits.',starter:`def valid_code(value):
    # TODO
    pass

print(valid_code('104829'))`,tests:`cases=[('104829',True),('000001',True),('12345',False),('1234567',False),('12A456',False),(123456,False),('',False)]
for value,expected in cases:
    assert valid_code(value) is expected, f'{value!r} should be {expected}'
print('All validation tests passed.')`},
    {id:'cyber-access-policy',position:11,runtime:'python',title:'Terminal B · Access policy reasoning',prompt:'Implement allowed(role, action) from the provided permissions. Unknown roles/actions must return False.',starter:`permissions = {
    'student': {'read'},
    'teacher': {'read', 'grade'},
    'admin': {'read', 'grade', 'manage'},
}

def allowed(role, action):
    # TODO
    pass

print(allowed('student', 'grade'))`,tests:`assert allowed('student','read') is True
assert allowed('student','grade') is False
assert allowed('teacher','grade') is True
assert allowed('admin','manage') is True
assert allowed('unknown','read') is False
assert allowed('teacher','delete') is False
print('All access-policy tests passed.')`}
  ],
  '3d-programming':[
    {id:'3d-translate',position:4,runtime:'python',title:'Terminal A · 3D transformation',prompt:'Implement translate(point, dx=0, dy=0, dz=0). Return a new (x,y,z) tuple.',starter:`def translate(point, dx=0, dy=0, dz=0):
    # TODO
    pass

p0=(10,5,0)
print(translate(p0, dx=15, dy=-2, dz=8))`,tests:`p0=(10,5,0)
assert translate(p0,dx=15,dy=-2,dz=8)==(25,3,8)
assert translate((0,0,0),dz=-5)==(0,0,-5)
assert p0==(10,5,0)
print('All translation tests passed.')`},
    {id:'3d-positive-dimension',position:8,runtime:'python',title:'Terminal B · Geometry validation',prompt:'Implement positive_mm(name, value). Convert to float and reject zero/negative dimensions with ValueError.',starter:`def positive_mm(name, value):
    # TODO
    pass

print(positive_mm('width', 25))`,tests:`assert positive_mm('width',25)==25.0
assert positive_mm('height','12.5')==12.5
for bad in [0,-1,'0']:
    failed=False
    try: positive_mm('dimension',bad)
    except ValueError: failed=True
    assert failed
print('All dimension tests passed.')`}
  ],
  robotics:[
    {id:'robotics-threshold',position:6,runtime:'python',title:'Terminal A · Threshold control',prompt:'Implement fan_on(temperature, limit=30). Return True only when temperature is strictly greater than limit.',starter:`def fan_on(temperature, limit=30):
    # TODO
    pass

print(fan_on(28))`,tests:`assert fan_on(31) is True
assert fan_on(30) is False
assert fan_on(28) is False
assert fan_on(21,limit=20) is True
print('All threshold tests passed.')`},
    {id:'robotics-failsafe',position:12,runtime:'python',title:'Terminal B · Fail-safe state logic',prompt:'Implement next_state(sensor_ok, distance): SAFE_STOP if sensor invalid, STOP if distance < 20, otherwise MOVE.',starter:`def next_state(sensor_ok, distance):
    # TODO
    pass

print(next_state(True,45))`,tests:`assert next_state(False,100)=='SAFE_STOP'
assert next_state(False,0)=='SAFE_STOP'
assert next_state(True,19)=='STOP'
assert next_state(True,20)=='MOVE'
assert next_state(True,45)=='MOVE'
print('All fail-safe tests passed.')`}
  ]
};

const trackPracticals=practicals[slug]||[];
const hubKey=cfg.localPrefix+slug;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const setText=(el,value)=>{if(el&&el.textContent!==String(value))el.textContent=String(value)};
function hubState(){try{return JSON.parse(localStorage.getItem(hubKey)||'{}')||{}}catch{return {}}}
function attemptId(){return hubState()?.session?.attemptId||'pending'}
function practicalKey(ch){return `ijr-seminar-diagnostic-practical-v7:${attemptId()}:${slug}:${ch.id}`}
function readPractical(ch){try{const x=JSON.parse(localStorage.getItem(practicalKey(ch))||'null');if(x)return {...x,code:typeof x.code==='string'?x.code:ch.starter}}catch{}return {code:ch.starter,runCount:0,passed:false,lastOutput:'',lastRunAt:null}}
function writePractical(ch,s){localStorage.setItem(practicalKey(ch),JSON.stringify(s))}
function counts(){const s=trackPracticals.map(readPractical);return {attempted:s.filter(x=>Number(x.runCount)>0).length,passed:s.filter(x=>x.passed===true).length,total:s.length}}
function currentPosition(){const i=Number(hubState()?.index);return Number.isInteger(i)?i+1:null}

function normalizeQuestionText(){
  const frame=document.getElementById('diagnosticFrame');if(!frame)return;
  frame.querySelectorAll('.question-code-prompt,.question-stage h3,.option>span:last-child').forEach(el=>{
    const raw=el.textContent||'';if(!raw.includes('\\n'))return;
    const normalized=raw.replace(/\\n/g,'\n');
    if(el.matches('.question-stage h3')){const pre=document.createElement('pre');pre.className='question-code-prompt normalized-code-prompt-v7';pre.textContent=normalized;el.replaceWith(pre)}
    else setText(el,normalized);
  });
}

function addProgressCard(){
  const legend=document.querySelector('#diagnosticFrame .legend');if(!legend||legend.querySelector('.practical-progress-v7'))return;
  const c=counts();const box=document.createElement('div');box.className='practical-progress-v6 practical-progress-v7';
  box.innerHTML=`<strong>Practical terminal</strong><span>${c.attempted}/${c.total} attempted · ${c.passed}/${c.total} passed</span><small>Terminal tasks appear on questions ${trackPracticals.map(x=>x.position).join(' and ')}. Both must be run before submission; passing is diagnostic evidence, not a requirement.</small>`;
  legend.appendChild(box);
}

function panelFor(ch){
  const s=readPractical(ch);const panel=document.createElement('section');panel.className='diagnostic-practical-v6 diagnostic-practical-v7';panel.dataset.challenge=ch.id;
  panel.innerHTML=`<div class="practical-head-v6"><div><p class="eyebrow">PRACTICAL TERMINAL · REQUIRED ATTEMPT</p><h4>${esc(ch.title)}</h4><p>${esc(ch.prompt)}</p></div><span class="runtime-badge-v6">${esc(ch.runtime)}</span></div><div class="terminal-grid-v6"><div><label class="terminal-label-v6">Your code</label><textarea class="terminal-editor-v6" spellcheck="false">${esc(s.code)}</textarea><div class="terminal-actions-v6"><button class="button button-dark run-practical-v7" type="button">Run tests</button><button class="button button-light reset-practical-v7" type="button">Reset scaffold</button><span class="run-count-v7">Runs: ${Number(s.runCount)||0}</span></div></div><div><span class="terminal-label-v6">Terminal output</span><pre class="terminal-output-v6 practical-output-v7">${esc(s.lastOutput||'Run the code to generate evidence.')}</pre><div class="practical-status-v6 practical-status-v7 ${s.passed?'pass':Number(s.runCount)>0?'fail':''}">${s.passed?'PASS · tests satisfied':Number(s.runCount)>0?'Attempt recorded · tests not yet passing':'Not attempted yet'}</div></div></div>`;
  wirePanel(ch,panel);return panel;
}

function mountCurrentPractical(){
  const stage=document.querySelector('#diagnosticFrame .question-stage');if(!stage)return;
  const ch=trackPracticals.find(x=>x.position===currentPosition());if(!ch||stage.querySelector(`[data-challenge="${ch.id}"]`))return;
  const panel=panelFor(ch);const actions=stage.querySelector('.question-actions');if(actions)stage.insertBefore(panel,actions);else stage.appendChild(panel);
}

function wirePanel(ch,panel){
  const editor=panel.querySelector('.terminal-editor-v6');const output=panel.querySelector('.practical-output-v7');const status=panel.querySelector('.practical-status-v7');const count=panel.querySelector('.run-count-v7');const run=panel.querySelector('.run-practical-v7');
  editor.addEventListener('input',()=>{const s=readPractical(ch);s.code=editor.value;s.passed=false;s.lastOutput='Code changed. Run again to refresh execution evidence.';writePractical(ch,s);setText(output,s.lastOutput);setText(status,Number(s.runCount)>0?'Code changed · rerun required':'Not attempted yet');status.className='practical-status-v6 practical-status-v7 '+(Number(s.runCount)>0?'fail':'');refreshGate()});
  panel.querySelector('.reset-practical-v7').addEventListener('click',()=>{const s={code:ch.starter,runCount:0,passed:false,lastOutput:'Scaffold restored. Run the code to create evidence.',lastRunAt:null};writePractical(ch,s);editor.value=s.code;setText(output,s.lastOutput);setText(status,'Not attempted yet');setText(count,'Runs: 0');status.className='practical-status-v6 practical-status-v7';refreshGate()});
  run.addEventListener('click',async()=>{if(run.disabled)return;run.disabled=true;setText(run,'Running…');setText(status,'Executing in the browser sandbox…');setText(output,'Starting runtime…');let result;try{result=ch.runtime==='javascript'?await runJavaScript(editor.value,ch.tests):await runPython(editor.value,ch.tests)}catch(e){result={ok:false,output:String(e?.message||e)}}const s=readPractical(ch);s.code=editor.value;s.runCount=(Number(s.runCount)||0)+1;s.passed=Boolean(result.ok);s.lastOutput=result.output||'(no output)';s.lastRunAt=new Date().toISOString();writePractical(ch,s);setText(output,s.lastOutput);setText(count,`Runs: ${s.runCount}`);setText(status,s.passed?'PASS · practical tests satisfied':'Attempt recorded · inspect the terminal and revise');status.className='practical-status-v6 practical-status-v7 '+(s.passed?'pass':'fail');run.disabled=false;setText(run,'Run tests');recordPractical(ch,s).catch(()=>{});refreshGate()});
}

function loadScript(src){return new Promise((resolve,reject)=>{const existing=[...document.scripts].find(s=>s.src===src);if(existing){if(globalThis.loadPyodide)return resolve();existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return}const s=document.createElement('script');s.src=src;s.async=true;s.onload=resolve;s.onerror=()=>reject(new Error('Could not load Python runtime.'));document.head.appendChild(s)})}
async function ensurePyodide(){if(pyodideInstance)return pyodideInstance;if(!globalThis.loadPyodide)await loadScript(PYODIDE_URL);pyodideInstance=await globalThis.loadPyodide({indexURL:PYODIDE_INDEX});return pyodideInstance}
async function runPython(code,tests){const py=await ensurePyodide();const out=[];const err=[];py.setStdout({batched:s=>out.push(s)});py.setStderr({batched:s=>err.push(s)});const combined=`${code}\n\n# --- diagnostic tests ---\n${tests}`;try{await py.loadPackagesFromImports(combined);await py.runPythonAsync(combined);return {ok:true,output:[...out,...err].join('\n')||'Execution completed.'}}catch(e){return {ok:false,output:[...out,...err,String(e?.message||e)].filter(Boolean).join('\n')}}}
function runJavaScript(code,tests){return new Promise(resolve=>{const channel=`ijr-diag-${Date.now()}-${Math.random().toString(36).slice(2)}`;const iframe=document.createElement('iframe');iframe.sandbox='allow-scripts';iframe.hidden=true;iframe.srcdoc=`<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; connect-src 'none'"><script>addEventListener('message',e=>{const d=e.data||{};if(!d.channel)return;const logs=[];console.log=(...a)=>logs.push(a.map(v=>{try{return typeof v==='string'?v:JSON.stringify(v)}catch{return String(v)}}).join(' '));try{(0,eval)(String(d.code||'')+'\\n'+String(d.tests||''));parent.postMessage({channel:d.channel,ok:true,output:logs.join('\\n')||'Execution completed.'},'*')}catch(err){parent.postMessage({channel:d.channel,ok:false,output:[...logs,String(err&&err.stack||err)].join('\\n')},'*')}});<\/script>`;let done=false;const finish=r=>{if(done)return;done=true;removeEventListener('message',onMessage);iframe.remove();resolve(r)};const onMessage=e=>{if(e.source!==iframe.contentWindow||e.data?.channel!==channel)return;finish({ok:Boolean(e.data.ok),output:String(e.data.output||'')})};addEventListener('message',onMessage);iframe.addEventListener('load',()=>iframe.contentWindow?.postMessage({channel,code,tests},'*'),{once:true});document.body.appendChild(iframe);setTimeout(()=>finish({ok:false,output:'Execution timed out.'}),8000)})}

async function recordPractical(ch,s){const h=hubState();const editToken=h?.profileToken;const id=h?.session?.attemptId;if(!editToken||!id)return;await fetch(`${cfg.supabaseUrl}/functions/v1/${cfg.gatewayFunction}`,{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.supabasePublishableKey,'Authorization':`Bearer ${cfg.supabasePublishableKey}`},body:JSON.stringify({action:'diagnostic-practical',edit_token:editToken,attempt_id:id,track_slug:slug,challenge_id:ch.id,runtime:ch.runtime,passed:Boolean(s.passed),run_count:Number(s.runCount)||0})})}

function refreshGate(){
  const frame=document.getElementById('diagnosticFrame');if(!frame)return;const c=counts();
  const progress=frame.querySelector('.practical-progress-v7 span');setText(progress,`${c.attempted}/${c.total} attempted · ${c.passed}/${c.total} passed`);
  const submit=frame.querySelector('#submitBtn');if(submit){const h=hubState();const answered=Object.values(h?.answers||{}).filter(Number.isInteger).length;const disabled=answered<15||c.attempted<c.total;if(submit.disabled!==disabled)submit.disabled=disabled;const title=c.attempted<c.total?`Run both practical terminal tasks before submitting (${c.attempted}/${c.total} attempted).`:'';if(submit.title!==title)submit.title=title;let note=frame.querySelector('.practical-submit-note-v7');if(!note){note=document.createElement('p');note.className='practical-submit-note-v6 practical-submit-note-v7';submit.closest('.question-actions')?.insertAdjacentElement('afterend',note)}setText(note,c.attempted<c.total?`Diagnostic submission unlocks after both terminal tasks have been run. Passing is not required: ${c.attempted}/${c.total} attempted.`:`Practical requirement complete: ${c.attempted}/${c.total} attempted · ${c.passed}/${c.total} passed.`)}
  const ch=trackPracticals.find(x=>x.position===currentPosition());if(ch){const panel=frame.querySelector(`[data-challenge="${ch.id}"]`);if(panel&&!panel.matches(':focus-within'))setText(panel.querySelector('.run-count-v7'),`Runs: ${Number(readPractical(ch).runCount)||0}`)}
}

function addResultSummary(){const frame=document.getElementById('diagnosticFrame');const h=hubState();if(!frame||!h?.report||frame.querySelector('.practical-result-v7'))return;const c=counts();const label=c.passed===c.total?'Strong practical evidence':c.passed>0?'Partial practical evidence':'Practical foundation needs support';const div=document.createElement('section');div.className='practical-result-v6 practical-result-v7';div.innerHTML=`<p class="eyebrow">PRACTICAL TERMINAL EVIDENCE</p><div><strong>${c.passed}/${c.total} passed</strong><span>${esc(label)}</span></div><p>Both coding tasks were executed before submission. Practical evidence is reported separately from the 12-item knowledge score.</p>`;frame.appendChild(div)}

function enhance(){normalizeQuestionText();addProgressCard();mountCurrentPractical();refreshGate();addResultSummary()}
function scheduleEnhance(){if(scheduled)return;scheduled=true;const run=()=>{scheduled=false;enhance()};if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else setTimeout(run,0)}
const observer=new MutationObserver(scheduleEnhance);
function start(){const frame=document.getElementById('diagnosticFrame');if(!frame)return setTimeout(start,100);observer.observe(frame,{childList:true,subtree:true});scheduleEnhance()}
start();
})();