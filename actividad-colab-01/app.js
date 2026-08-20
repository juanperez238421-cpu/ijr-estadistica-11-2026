(() => {
  'use strict';

  const cfg=window.IJR_COLAB_ACTIVITY_CONFIG;
  const $=id=>document.getElementById(id);
  const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const PYODIDE_INDEX='https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
  const PLACEHOLDER='WRITE_HERE';
  const TOTAL_MINUTES=Number(cfg.targetMinutes||40);

  const state={
    attemptId:null,token:null,snapshot:null,currentCp:null,pendingNextSnapshot:null,
    restrictionEvents:0,pyodide:null,runtimePromise:null,executionCount:0,
    currentKey:null,currentStarter:'',lastCellScalar:'',pendingChoice:'',
    startedAt:null,timerHandle:null
  };

  const LESSONS={
    A1:{
      minutes:5,mode:'code',tag:'01 · BASIC OPERATIONS',title:'Variables and basic arithmetic',
      concept:'<p>Python can store numbers in variables and combine them with arithmetic operators. The symbol <code>=</code> assigns a value; <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, and <code>**</code> perform basic operations.</p>',
      goal:'<p>Store two integers, add them with their variable names, and print the result.</p>',
      steps:['Set <code>a = 12</code> and <code>b = 5</code>.','Complete <code>result</code> using <code>a + b</code>.','Run the full cell.','Read the final output and validate only when your team can explain why it is 17.'],
      task:'<p>Complete a basic addition using variables instead of typing the answer directly.</p>',
      explore:'<p>In the console try <code>a - b</code>, <code>a * b</code>, and <code>a / b</code>.</p>',
      hints:['Store the two given integers first.','Use the variable names with the addition operator.','Complete <code>result = a + b</code>.'],
      requirements:[
        {label:'store 12 in a',pattern:/\ba\s*=\s*12\b/},
        {label:'store 5 in b',pattern:/\bb\s*=\s*5\b/},
        {label:'add a + b',pattern:/result\s*=\s*a\s*\+\s*b/},
        {label:'print result',pattern:/print\s*\(\s*result\s*\)/}
      ],
      starter:`a = WRITE_HERE
b = WRITE_HERE

result = WRITE_HERE
print(result)`,
      solution:`a = 12
b = 5

result = a + b
print(result)`
    },

    A2:{
      minutes:4,mode:'choice',tag:'01 · BASIC OPERATIONS',title:'Multiple choice · order of operations',
      concept:'<p>Python follows the usual arithmetic precedence. Multiplication is evaluated before addition unless parentheses change the order.</p>',
      goal:'<p>Predict a Python arithmetic result without running code.</p>',
      steps:['Read the expression <code>3 + 4 * 2</code>.','Evaluate the multiplication first.','Then add 3.','Select one answer and validate it.'],
      task:'<p>What is the value of <code>3 + 4 * 2</code>?</p>',
      explore:'<p>After answering, compare it with <code>(3 + 4) * 2</code>.</p>',
      hints:['Multiplication comes before addition.','Calculate <code>4 * 2</code> first.','The result is <code>11</code>.'],
      choices:['7','11','14','16'],
      solution:'Correct option: 11'
    },

    A3:{
      minutes:5,mode:'code',tag:'02 · DATA TYPES',title:'int, float, str, bool and NoneType',
      concept:'<p>Python values have programming data types. In this class we use <strong>int</strong> for whole numbers, <strong>float</strong> for decimals, <strong>str</strong> for text, <strong>bool</strong> for <code>True</code>/<code>False</code>, and <strong>NoneType</strong> for <code>None</code>.</p>',
      goal:'<p>Create one example of each core type and inspect the decimal value with <code>type()</code>.</p>',
      steps:['Read the five assignments.','Keep quotation marks around the string.','Notice that <code>True</code> and <code>None</code> are Python keywords.','Complete the final line with <code>decimal</code> inside <code>type()</code>.','Run and validate the printed type name.'],
      task:'<p>Use <code>type()</code> to identify the data type of <code>4.25</code>.</p>',
      explore:'<p>Try <code>type(whole)</code>, <code>type(label)</code>, <code>type(passed)</code>, and <code>type(missing)</code>.</p>',
      hints:['The decimal variable is called <code>decimal</code>.','Use <code>type(decimal)</code>.','To print only the type name, use <code>type(decimal).__name__</code>.'],
      requirements:[
        {label:'create an integer',pattern:/whole\s*=\s*28/},
        {label:'create a float',pattern:/decimal\s*=\s*4\.25/},
        {label:'create a string',pattern:/label\s*=\s*["']11A["']/},
        {label:'create a boolean',pattern:/passed\s*=\s*True/},
        {label:'create None',pattern:/missing\s*=\s*None/},
        {label:'inspect decimal with type()',pattern:/type\s*\(\s*decimal\s*\)/}
      ],
      starter:`whole = 28
decimal = 4.25
label = "11A"
passed = True
missing = None

print(type(WRITE_HERE).__name__)`,
      solution:`whole = 28
decimal = 4.25
label = "11A"
passed = True
missing = None

print(type(decimal).__name__)`
    },

    A4:{
      minutes:4,mode:'choice',tag:'02 · DATA TYPES',title:'Multiple choice · identify a string',
      concept:'<p>Quotation marks matter. <code>10</code> is a number, while <code>"10"</code> is text even though the characters look numeric.</p>',
      goal:'<p>Distinguish a numeric value from a text value.</p>',
      steps:['Look at the quotation marks around <code>"10"</code>.','Remember that Python calls text <code>str</code>.','Select the data type.','Validate your answer.'],
      task:'<p>What is the Python data type of <code>"10"</code>?</p>',
      explore:'<p>Compare <code>type(10)</code> with <code>type("10")</code>.</p>',
      hints:['Quotation marks create text.','Python text uses the type name <code>str</code>.','The correct option is <code>str</code>.'],
      choices:['int','float','str','bool'],
      solution:'Correct option: str'
    },

    A5:{
      minutes:4,mode:'choice',tag:'02 · DATA TYPES',title:'Multiple choice · same symbols, different data',
      concept:'<p>The same operator can behave differently depending on the data type. With integers, <code>+</code> adds numbers. With strings, <code>+</code> joins text.</p>',
      goal:'<p>Predict how <code>+</code> behaves with two strings.</p>',
      steps:['Read <code>a = "10"</code> and <code>b = "5"</code>.','Both values are strings because they use quotation marks.','For strings, <code>+</code> concatenates.','Select the resulting text.'],
      task:'<p>If <code>a = "10"</code> and <code>b = "5"</code>, what does <code>a + b</code> produce?</p>',
      explore:'<p>Compare this with <code>10 + 5</code>.</p>',
      hints:['Do not add the values as numbers.','Join the two pieces of text.','The result is <code>"105"</code>.'],
      choices:['15','105','10 5','Error'],
      solution:'Correct option: 105'
    },

    A6:{
      minutes:5,mode:'code',tag:'03 · ARRAYS / LISTS',title:'Create a list and read index 0',
      concept:'<p>For this first class, we use a Python <strong>list</strong> as a basic array: an ordered collection of values. Python indexing begins at <strong>0</strong>.</p>',
      goal:'<p>Create a list and use <code>[0]</code> to read its first element.</p>',
      steps:['Read the list <code>[12, 7, 15, 9, 11]</code>.','The first position is index <code>0</code>.','Complete <code>first</code> with <code>scores[0]</code>.','Run and validate the printed value.'],
      task:'<p>Read the first element of <code>scores</code> using index 0.</p>',
      explore:'<p>Try <code>scores[1]</code> and <code>scores[2]</code> in the console.</p>',
      hints:['Use square brackets after the list name.','The first index is zero.','Complete <code>first = scores[0]</code>.'],
      requirements:[
        {label:'create the scores list',pattern:/scores\s*=\s*\[\s*12\s*,\s*7\s*,\s*15\s*,\s*9\s*,\s*11\s*\]/},
        {label:'use index 0',pattern:/first\s*=\s*scores\s*\[\s*0\s*\]/},
        {label:'print first',pattern:/print\s*\(\s*first\s*\)/}
      ],
      starter:`scores = [12, 7, 15, 9, 11]

first = WRITE_HERE
print(first)`,
      solution:`scores = [12, 7, 15, 9, 11]

first = scores[0]
print(first)`
    },

    A7:{
      minutes:4,mode:'choice',tag:'03 · ARRAYS / LISTS',title:'Multiple choice · read an index',
      concept:'<p>Because indexing starts at zero, index <code>2</code> identifies the third element of a list.</p>',
      goal:'<p>Map a list index to the correct stored value.</p>',
      steps:['Write the indexes mentally: 0, 1, 2, 3.','Match each index to <code>[8, 13, 21, 34]</code>.','Locate index <code>2</code>.','Select and validate the value.'],
      task:'<p>For <code>values = [8, 13, 21, 34]</code>, what is <code>values[2]</code>?</p>',
      explore:'<p>Predict <code>values[0]</code>, <code>values[1]</code>, and <code>values[3]</code>.</p>',
      hints:['Index 0 points to 8.','Index 1 points to 13, so index 2 is the next value.','The correct option is <code>21</code>.'],
      choices:['8','13','21','34'],
      solution:'Correct option: 21'
    },

    A8:{
      minutes:5,mode:'code',tag:'03 · ARRAYS / LISTS',title:'Use index 1 to read the second item',
      concept:'<p>Array/list indexes describe positions, not human counting labels. The second item is index <code>1</code> because the first item is index <code>0</code>.</p>',
      goal:'<p>Use index 1 to access the second string in an ordered list.</p>',
      steps:['Read the list of three names.','Map the positions: Ana → 0, Luis → 1, Sara → 2.','Complete <code>second</code> with the correct indexed expression.','Run and validate the printed text.'],
      task:'<p>Print the second item in the list using its index.</p>',
      explore:'<p>Try <code>names[0]</code> and <code>names[2]</code>.</p>',
      hints:['The second item uses index 1.','Use the list name followed by square brackets.','Complete <code>second = names[1]</code>.'],
      requirements:[
        {label:'create the names list',pattern:/names\s*=\s*\[\s*["']Ana["']\s*,\s*["']Luis["']\s*,\s*["']Sara["']\s*\]/},
        {label:'use index 1',pattern:/second\s*=\s*names\s*\[\s*1\s*\]/},
        {label:'print second',pattern:/print\s*\(\s*second\s*\)/}
      ],
      starter:`names = ["Ana", "Luis", "Sara"]

second = WRITE_HERE
print(second)`,
      solution:`names = ["Ana", "Luis", "Sara"]

second = names[1]
print(second)`
    }
  };

  const GUIDED_MINUTES=Object.values(LESSONS).reduce((s,l)=>s+Number(l.minutes||0),0);
  if(GUIDED_MINUTES<35||GUIDED_MINUTES>40)console.warn(`Class pacing QA: ${GUIDED_MINUTES} guided minutes outside 35–40.`);

  async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error)throw new Error(error.message||'Backend error');return data}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function fmtGrade(v){return Number(v??1).toFixed(2)}
  function save(){if(state.attemptId&&state.token)sessionStorage.setItem(cfg.sessionStorageKey,JSON.stringify({attemptId:state.attemptId,token:state.token}))}
  function clearSaved(){sessionStorage.removeItem(cfg.sessionStorageKey)}
  function activityActive(){return !!state.snapshot&&!state.snapshot.completed}
  function setSetupStatus(msg,bad=false){const e=$('setupStatus');e.textContent=msg||'';e.style.color=bad?'#b3261e':''}
  function setValidation(msg,kind=''){const e=$('activityStatus');e.textContent=msg||'';e.className=`validation-status ${kind}`.trim()}

  function setRuntimeBadge(mode,label){
    const badge=$('runtimeBadge');badge.className=`runtime-badge ${mode}`;badge.innerHTML='<span class="status-dot"></span>'+esc(label);
    const kernel=$('kernelLabel');if(kernel)kernel.textContent=mode==='ready'?'Python 3 · browser runtime':label;
  }
  async function logEvent(type,metadata={}){
    if(!state.attemptId||!state.token||!cfg.rpc.event)return;
    try{await rpc(cfg.rpc.event,{p_attempt_id:state.attemptId,p_attempt_token:state.token,p_event_type:type,p_metadata:metadata})}catch{}
  }

  function clearTerminal(message='Python console ready.'){const o=$('terminalOutput');o.textContent=message+'\n'}
  function appendTerminal(text){const o=$('terminalOutput');o.textContent+=(o.textContent&&!o.textContent.endsWith('\n')?'\n':'')+String(text??'')+'\n';o.scrollTop=o.scrollHeight}
  function lastScalar(output){const a=String(output||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);return a.length?a[a.length-1]:''}

  async function ensureRuntime(){
    if(state.pyodide)return state.pyodide;
    if(state.runtimePromise)return state.runtimePromise;
    state.runtimePromise=(async()=>{
      try{
        setRuntimeBadge('loading','Loading Python…');
        if(typeof window.loadPyodide!=='function')throw new Error('Pyodide did not load.');
        const py=await window.loadPyodide({indexURL:PYODIDE_INDEX});
        state.pyodide=py;setRuntimeBadge('ready','Python ready');clearTerminal('Python 3 runtime ready.');return py;
      }catch(err){
        state.runtimePromise=null;setRuntimeBadge('error','Python unavailable');clearTerminal(`Runtime error: ${err.message}`);throw err;
      }
    })();
    return state.runtimePromise;
  }

  async function executePython(source){
    const py=await ensureRuntime(),stdout=[],stderr=[];
    py.setStdout({batched:m=>stdout.push(m)});py.setStderr({batched:m=>stderr.push(m)});
    try{
      let r=await py.runPythonAsync(source);
      if(r!==undefined&&r!==null){const t=String(r);if(t!=='None')stdout.push(t);if(typeof r.destroy==='function')r.destroy()}
    }catch(err){stderr.push(String(err?.message||err))}
    const output=stdout.join('\n').trim(),errors=stderr.join('\n').trim();
    state.executionCount+=1;$('executionCount').textContent=`[${state.executionCount}]`;appendTerminal(`In [${state.executionCount}]:`);
    if(output)appendTerminal(output);if(errors)appendTerminal(`ERROR\n${errors}`);
    state.lastCellScalar=errors?'':lastScalar(output);
    $('validateButton').disabled=!state.lastCellScalar;
    if(errors)setValidation('Python found an error. Fix it and run again. Syntax/runtime errors do not lower the grade.','bad');
    else if(state.lastCellScalar)setValidation('Output ready. Validate when your team can explain it.');
    else setValidation('The cell did not produce a final value to validate.','bad');
  }

  function currentCheckpoint(s=state.snapshot){return Array.from(s?.checkpoints||[]).find(cp=>!cp.completed)||null}
  function formatElapsed(ms){const t=Math.max(0,Math.floor(ms/1000)),m=Math.floor(t/60),s=t%60;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
  function elapsedMs(){return state.startedAt?Math.max(0,Date.now()-state.startedAt.getTime()):0}
  function updateTimer(){const e=$('timeLabel');if(e)e.textContent=`${formatElapsed(elapsedMs())} / ${String(TOTAL_MINUTES).padStart(2,'0')}:00`}
  function startTimer(v){if(v){const d=new Date(v);if(!Number.isNaN(d.getTime()))state.startedAt=d}if(!state.startedAt)state.startedAt=new Date();clearInterval(state.timerHandle);updateTimer();state.timerHandle=setInterval(updateTimer,1000)}

  function updateMetrics(s){
    state.snapshot=s;const cps=Array.from(s?.checkpoints||[]),done=Number(s?.completed_count??cps.filter(c=>c.completed).length),total=Number(s?.checkpoint_count||cps.length||8);
    $('progressText').textContent=`${done} / ${total} completed`;$('progressBar').style.width=`${Math.min(100,done/Math.max(1,total)*100)}%`;
    $('gradeLabel').textContent=`Projected ${fmtGrade(s?.projected_grade??s?.grade)} / 5.00`;
    const remaining=Number(s?.help_tokens_remaining??3),used=Number(s?.help_tokens_used||0);
    $('helpBadge').textContent=`${remaining} help${remaining===1?'':'s'}`;$('helpRemainingText').textContent=`${remaining} of 3 remaining`;
    $('helpButton').disabled=remaining<=0||!state.currentCp||!!state.currentCp.completed;
    $('finishHelps').textContent=`${used} / 3`;
  }

  function renderRail(cps,key){$('stepRail').innerHTML=cps.map(cp=>`<span class="step-dot ${cp.completed?'done':cp.key===key?'active':''}"></span>`).join('')}

  function renderLesson(cp){
    const l=LESSONS[cp.key];state.currentCp=cp;state.currentKey=cp.key;state.currentStarter=l.starter||'';state.lastCellScalar='';state.pendingChoice='';state.executionCount=0;state.pendingNextSnapshot=null;
    $('lessonTag').textContent=l.tag;$('lessonTiming').textContent=`Target: ${l.minutes} min`;$('lessonTitle').textContent=l.title;
    $('lessonConcept').innerHTML=l.concept;$('lessonGoal').innerHTML=l.goal;$('lessonTask').innerHTML=l.task;$('lessonExplore').innerHTML=l.explore;
    $('lessonSteps').innerHTML=l.steps.map((x,i)=>`<li><span>${i+1}</span><div>${x}</div></li>`).join('');
    $('helpPanel').classList.add('hidden');$('solutionPanel').classList.add('hidden');$('revealButton').disabled=false;$('validateButton').disabled=true;

    const choice=l.mode==='choice';
    $('choicePanel').classList.toggle('hidden',!choice);
    $('codeInstruction1').classList.toggle('hidden',choice);$('codeCell').classList.toggle('hidden',choice);
    $('codeInstruction2').classList.toggle('hidden',choice);$('terminalCard').classList.toggle('hidden',choice);
    $('toolbarActions').classList.toggle('hidden',choice);
    $('kernelLabel').textContent=choice?'Concept check · multiple choice':'Python 3 · browser runtime';

    if(choice){
      $('choiceQuestion').innerHTML=l.task;
      $('choiceOptions').innerHTML=l.choices.map((option,i)=>`<button type="button" class="choice-option" data-value="${esc(option)}"><span>${String.fromCharCode(65+i)}</span><strong>${esc(option)}</strong></button>`).join('');
      $('choiceOptions').querySelectorAll('.choice-option').forEach(btn=>btn.addEventListener('click',()=>{
        $('choiceOptions').querySelectorAll('.choice-option').forEach(x=>x.classList.remove('selected'));btn.classList.add('selected');state.pendingChoice=btn.dataset.value;$('validateButton').disabled=false;setValidation(`Selected: ${state.pendingChoice}. Press Validate answer when ready.`);
      }));
      $('validateButton').textContent='Validate answer';
      setValidation('Read the question, select one option, then validate.');
    }else{
      $('codeEditor').value=l.starter;$('executionCount').textContent='[ ]';$('validateButton').textContent='Validate output';
      setValidation('Complete every WRITE_HERE, run the cell, then validate the final output.');ensureRuntime().catch(()=>{});
    }
  }

  function render(s){
    updateMetrics(s);$('setupPanel').classList.add('hidden');const cps=Array.from(s.checkpoints||[]),done=Number(s.completed_count??cps.filter(c=>c.completed).length),total=Number(s.checkpoint_count||cps.length||8);
    $('studentLabel').textContent=`${s.group_code} · ${s.student_label}`;startTimer(s.started_at);
    if(s.completed){
      clearInterval(state.timerHandle);$('workspacePanel').classList.add('hidden');$('finishPanel').classList.remove('hidden');$('finishPoints').textContent=`${done} / ${total}`;$('finishGrade').textContent=fmtGrade(s.grade);$('finishTime').textContent=formatElapsed(elapsedMs());clearSaved();return;
    }
    const cp=currentCheckpoint(s)||cps[0];$('stepLabel').textContent=`Stage ${Number(cp.sequence||done+1)} of ${total}`;renderRail(cps,cp.key);renderLesson(cp);
    $('finishPanel').classList.add('hidden');$('workspacePanel').classList.remove('hidden');
  }

  async function runCurrentCell(){
    const l=LESSONS[state.currentKey];if(!l||l.mode==='choice')return;
    const source=$('codeEditor').value;if(!source.trim()){setValidation('The cell is empty.','bad');return}
    if(source.includes(PLACEHOLDER)){setValidation('Replace every WRITE_HERE before running.','bad');return}
    const missing=(l.requirements||[]).find(r=>!r.pattern.test(source));if(missing){setValidation(`Required command missing: ${missing.label}.`,'bad');return}
    $('runCodeButton').disabled=true;$('runCellButton').disabled=true;try{await executePython(source)}finally{$('runCodeButton').disabled=false;$('runCellButton').disabled=false}
  }

  async function validateCurrent(){
    const l=LESSONS[state.currentKey];const answer=l?.mode==='choice'?state.pendingChoice:state.lastCellScalar;
    if(!answer){setValidation(l?.mode==='choice'?'Select an option first.':'Run the cell first.','bad');return}
    $('validateButton').disabled=true;setValidation('Validating…');
    try{
      const data=await rpc(cfg.rpc.submit,{p_attempt_id:state.attemptId,p_attempt_token:state.token,p_checkpoint_key:state.currentKey,p_answer:String(answer)});
      if(data.correct){
        setValidation(`Correct · ${Number(data.awarded_points||0).toFixed(2)} points.`,'ok');await logEvent('LAB_STAGE_COMPLETED',{checkpoint_key:state.currentKey,mode:l.mode,workspace_version:'class1-v10'});setTimeout(()=>render(data.snapshot),650);
      }else{
        state.snapshot=data.snapshot;state.currentCp=(data.snapshot.checkpoints||[]).find(cp=>cp.key===state.currentKey)||state.currentCp;updateMetrics(data.snapshot);
        setValidation(`Incorrect answer recorded. Attempt #${data.wrong_attempts}. Try again or use help.`,'bad');$('validateButton').disabled=false;
      }
    }catch(err){setValidation(`Could not record this stage: ${err.message}`,'bad');$('validateButton').disabled=false}
  }

  async function useHelp(){
    if(!state.currentKey)return;const remaining=Number(state.snapshot?.help_tokens_remaining??3);if(remaining<=0)return;
    if(!window.confirm(`Use one help token? ${remaining} remain.`))return;
    try{
      const data=await rpc(cfg.rpc.help,{p_attempt_id:state.attemptId,p_attempt_token:state.token,p_checkpoint_key:state.currentKey});
      state.snapshot=data.snapshot;state.currentCp=(data.snapshot.checkpoints||[]).find(cp=>cp.key===state.currentKey)||state.currentCp;updateMetrics(data.snapshot);
      const l=LESSONS[state.currentKey],level=Math.min(Number(data.help_level||1),l.hints.length);$('helpPanel').innerHTML=`<strong>Help ${level}</strong>${l.hints[level-1]}`;$('helpPanel').classList.remove('hidden');
    }catch(err){setValidation(`Help unavailable: ${err.message}`,'bad')}
  }

  async function revealSolution(){
    if(!state.currentKey)return;if(!window.confirm('Reveal the correct solution/answer for 25% stage credit?'))return;
    try{
      const key=state.currentKey,l=LESSONS[key],data=await rpc(cfg.rpc.reveal,{p_attempt_id:state.attemptId,p_attempt_token:state.token,p_checkpoint_key:key});
      state.pendingNextSnapshot=data.snapshot;updateMetrics(data.snapshot);$('solutionCode').textContent=l.solution;$('solutionOutput').textContent=data.expected_answer;$('solutionPanel').classList.remove('hidden');
      $('validateButton').disabled=true;$('revealButton').disabled=true;setValidation('Correct solution revealed. Study it before continuing.','ok');
    }catch(err){setValidation(`Could not reveal solution: ${err.message}`,'bad')}
  }

  async function skipStage(){
    if(!window.confirm('Continue without solving? This stage receives 0% credit.'))return;
    try{const data=await rpc(cfg.rpc.skip,{p_attempt_id:state.attemptId,p_attempt_token:state.token,p_checkpoint_key:state.currentKey});render(data.snapshot)}catch(err){setValidation(`Could not continue: ${err.message}`,'bad')}
  }

  function updateTeamSizeUI(){const show=Number($('teamSize').value||3)===3;$('student3Wrap').classList.toggle('hidden-member',!show);$('studentName3').required=show;if(!show)$('studentName3').value=''}
  function readEmails(){const size=Number($('teamSize').value||3),a=[$('studentName1').value.trim(),$('studentName2').value.trim()];if(size===3)a.push($('studentName3').value.trim());return a}
  function emailOk(v){return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@ijr\.edu\.co$/i.test(v)}

  $('teamSize').addEventListener('change',updateTeamSizeUI);updateTeamSizeUI();
  $('registrationForm').addEventListener('submit',async e=>{
    e.preventDefault();const group=$('groupCode').value,emails=readEmails();
    if(!group||emails.some(x=>!emailOk(x))){setSetupStatus('Use a valid @ijr.edu.co institutional email for every student.',true);return}
    const normalized=emails.map(x=>x.toLowerCase());if(new Set(normalized).size!==normalized.length){setSetupStatus('Do not repeat the same institutional email inside one team.',true);return}
    $('startButton').disabled=true;setSetupStatus('Registering team…');
    try{
      const data=await rpc(cfg.rpc.startTeam,{p_activity_slug:cfg.activitySlug,p_student_emails:emails,p_group_code:group,p_session_id:crypto.randomUUID(),p_user_agent:navigator.userAgent});
      state.attemptId=data.attempt_id;state.token=data.attempt_token;save();render(data.snapshot);setSetupStatus('');await logEvent('ACTIVITY_READY',{identity_mode:'team_email',team_size:emails.length,workspace_version:'class1-v10',guided_minutes:GUIDED_MINUTES});
    }catch(err){$('startButton').disabled=false;setSetupStatus(`Could not start: ${err.message}`,true)}
  });

  $('runCodeButton').addEventListener('click',runCurrentCell);$('runCellButton').addEventListener('click',runCurrentCell);$('validateButton').addEventListener('click',validateCurrent);
  $('helpButton').addEventListener('click',useHelp);$('revealButton').addEventListener('click',revealSolution);$('skipButton').addEventListener('click',skipStage);
  $('continueAfterRevealButton').addEventListener('click',()=>{if(state.pendingNextSnapshot)render(state.pendingNextSnapshot)});
  $('resetCodeButton').addEventListener('click',()=>{const l=LESSONS[state.currentKey];if(!l||l.mode==='choice')return;$('codeEditor').value=state.currentStarter;state.lastCellScalar='';state.executionCount=0;$('executionCount').textContent='[ ]';$('validateButton').disabled=true});
  $('clearTerminalButton').addEventListener('click',()=>clearTerminal('Python console cleared.'));
  $('terminalForm').addEventListener('submit',async e=>{e.preventDefault();const cmd=$('terminalCommand').value.trim();if(!cmd)return;$('terminalCommand').value='';appendTerminal(`>>> ${cmd}`);try{const py=await ensureRuntime();let r=await py.runPythonAsync(cmd);if(r!==undefined&&r!==null){appendTerminal(String(r));if(typeof r.destroy==='function')r.destroy()}}catch(err){appendTerminal(`ERROR\n${err.message}`)}});
  $('codeEditor').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const ed=e.currentTarget,s=ed.selectionStart,t=ed.selectionEnd;ed.setRangeText('    ',s,t,'end')}if((e.shiftKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();runCurrentCell()}});
  window.addEventListener('beforeunload',e=>{if(activityActive()){e.preventDefault();e.returnValue=''}});

  async function restore(){
    const raw=sessionStorage.getItem(cfg.sessionStorageKey);if(!raw)return;
    try{const saved=JSON.parse(raw);if(!saved.attemptId||!saved.token)return clearSaved();state.attemptId=saved.attemptId;state.token=saved.token;const data=await rpc(cfg.rpc.resume,{p_attempt_id:state.attemptId,p_attempt_token:state.token});render(data.snapshot)}
    catch{clearSaved();setSetupStatus('Previous session unavailable. Register again if needed.',true)}
  }
  restore();
})();