(() => {
  'use strict';

  const cfg = window.IJR_COLAB_ACTIVITY_CONFIG;
  const $ = id => document.getElementById(id);
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
  });

  const PYODIDE_INDEX = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
  const state = {
    attemptId:null,
    token:null,
    snapshot:null,
    restrictionEvents:0,
    pyodide:null,
    runtimePromise:null,
    pandasReady:false,
    datasetReady:false,
    executionCount:0,
    currentKey:null,
    currentStarter:'',
    lastCellOutput:'',
    lastCellScalar:''
  };

  const LESSONS = {
    A1:{
      tag:'FOUNDATION · VARIABLES',
      title:'Variables and addition',
      concept:'<p>A <strong>variable</strong> gives a name to a value. In Python, <code>=</code> assigns a value and <code>+</code> adds numbers.</p><p>The goal is not to memorize syntax: edit, run, observe, and connect the code with the output.</p>',
      goal:'<p>Understand the flow <strong>value → variable → operation → printed output</strong>.</p>',
      task:'<p>Run the starter cell. Read the number printed in the Python console. Then validate the output to continue.</p>',
      explore:'<p>Before validating, try <code>print(type(a))</code> in the console. What kind of object is <code>a</code>?</p>',
      hint:'<p><code>result = a + b</code> stores the sum. <code>print(result)</code> sends that value to the console.</p>',
      starter:`a = 12\nb = 5\nresult = a + b\nprint(result)`
    },
    A2:{
      tag:'FOUNDATION · OPERATORS',
      title:'Multiplication as an operation',
      concept:'<p>Python uses arithmetic operators to transform data. Multiplication uses <code>*</code>. The result can be stored in a new variable and reused later.</p>',
      goal:'<p>Recognize that an expression such as <code>a * b</code> produces a value that can be assigned, printed, compared, or analyzed.</p>',
      task:'<p>Execute the cell and inspect the product. Change one number temporarily, run again, and observe how the output responds. Reset the cell before validating.</p>',
      explore:'<p>Try <code>a ** 2</code> in the console. The operator <code>**</code> means exponentiation.</p>',
      hint:'<p>The final line should print only the product, so the validator can read the last scalar output.</p>',
      starter:`a = 12\nb = 5\nproduct = a * b\nprint(product)`
    },
    A3:{
      tag:'DATA STRUCTURES · LISTS',
      title:'A list stores many values',
      concept:'<p>A Python <strong>list</strong> is an ordered collection. Brackets <code>[ ]</code> group several values into one object.</p>',
      goal:'<p>Move from isolated numbers to a small dataset stored in memory.</p>',
      task:'<p>Run the cell and determine how many observations are stored in <code>numbers</code>. The function <code>len()</code> reports the number of elements.</p>',
      explore:'<p>Use the console to test <code>numbers[0]</code>, <code>numbers[-1]</code>, and <code>type(numbers)</code>.</p>',
      hint:'<p>Indexing starts at zero. Counting the complete list is easier with <code>len(numbers)</code>.</p>',
      starter:`numbers = [12, 7, 15, 9, 11]\nprint(len(numbers))`
    },
    A4:{
      tag:'DATA OPERATIONS · AGGREGATION',
      title:'Aggregate a list with sum()',
      concept:'<p>Data analysis often reduces many observations to one summary. <code>sum()</code> is a first example of an <strong>aggregation</strong>.</p>',
      goal:'<p>See how a function can receive an entire list and return one numerical summary.</p>',
      task:'<p>Run the cell. The final printed value is the total of all observations.</p>',
      explore:'<p>Try <code>min(numbers)</code> and <code>max(numbers)</code> in the console. These are also aggregations.</p>',
      hint:'<p><code>sum(numbers)</code> adds every element in the list.</p>',
      starter:`numbers = [12, 7, 15, 9, 11]\ntotal = sum(numbers)\nprint(total)`
    },
    A5:{
      tag:'STATISTICS · MEAN',
      title:'Build the arithmetic mean',
      concept:'<p>The arithmetic mean combines two ideas you already used: an aggregation and a count.</p><p>Mathematically, \\(\\bar{x}=\\frac{\\sum x_i}{n}\\). In Python we can express the same structure with <code>sum(numbers) / len(numbers)</code>.</p>',
      goal:'<p>Connect statistical notation with executable Python code.</p>',
      task:'<p>Run the cell and inspect the mean. The printed result is a decimal because division returns a floating-point value.</p>',
      explore:'<p>Try <code>round(mean_value, 1)</code> and compare it with the original value.</p>',
      hint:'<p>The numerator is the total. The denominator is the number of observations.</p>',
      starter:`numbers = [12, 7, 15, 9, 11]\nmean_value = sum(numbers) / len(numbers)\nprint(mean_value)`
    },
    A6:{
      tag:'PANDAS · EXTERNAL DATA',
      title:'Load a real CSV file',
      concept:'<p>Now the data stops living inside the code. A <strong>CSV</strong> file stores rows and columns externally. <code>pandas</code> reads it into a <strong>DataFrame</strong>.</p><p>The browser downloads the class CSV and mounts it inside this Python runtime as <code>data.csv</code>.</p>',
      goal:'<p>Cross the bridge from basic Python to a real tabular dataset.</p>',
      task:'<p>Run the cell. First inspect the first rows, then read the final number printed by <code>df.shape[0]</code>: the number of rows.</p>',
      explore:'<p>Use the console for <code>df.columns</code>, <code>df.shape</code>, or <code>df.head(3)</code>.</p>',
      hint:'<p><code>df.shape</code> returns <code>(rows, columns)</code>. Index <code>[0]</code> selects the row count.</p>',
      starter:`import pandas as pd\n\ndf = pd.read_csv("data.csv")\nprint(df.head())\nprint(df.shape[0])`
    },
    A7:{
      tag:'PANDAS · COLUMN ANALYSIS',
      title:'Calculate a column mean',
      concept:'<p>A DataFrame column behaves like a data series. Selecting <code>df["score"]</code> isolates one variable, and <code>.mean()</code> summarizes it.</p>',
      goal:'<p>Use a column-oriented operation instead of manually writing <code>sum()/len()</code>.</p>',
      task:'<p>Run the cell and inspect the mean of the <code>score</code> column.</p>',
      explore:'<p>Try <code>df["score"].describe()</code> in the console to obtain several descriptive statistics at once.</p>',
      hint:'<p>Square brackets select the column; the method after the dot performs the calculation.</p>',
      starter:`import pandas as pd\n\ndf = pd.read_csv("data.csv")\nscore_mean = df["score"].mean()\nprint(score_mean)`
    },
    A8:{
      tag:'PANDAS · FILTERING',
      title:'Filter rows with a condition',
      concept:'<p>Analysis is not only about summaries. We often need to select the rows that satisfy a condition. In Pandas, <code>df["score"] &gt;= 4</code> creates a Boolean mask.</p>',
      goal:'<p>Build a first data query: <strong>select → filter → count</strong>.</p>',
      task:'<p>Run the cell. The final printed number counts how many rows satisfy <code>score &gt;= 4</code>.</p>',
      explore:'<p>Try <code>passed[["student_id", "score"]]</code> in the console to inspect only two columns from the filtered data.</p>',
      hint:'<p><code>df[df["score"] &gt;= 4]</code> keeps only matching rows. <code>len(passed)</code> counts them.</p>',
      starter:`import pandas as pd\n\ndf = pd.read_csv("data.csv")\npassed = df[df["score"] >= 4]\nprint(len(passed))`
    }
  };

  async function rpc(name,args={}){
    const {data,error}=await sb.rpc(name,args);
    if(error) throw new Error(error.message||'Backend error');
    return data;
  }

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function setSetupStatus(msg,bad=false){const el=$('setupStatus');el.textContent=msg||'';el.style.color=bad?'#c5221f':'';}
  function setValidation(msg,kind=''){const el=$('activityStatus');el.textContent=msg||'';el.className=`validation-status ${kind}`.trim();}
  function save(){if(state.attemptId&&state.token)sessionStorage.setItem(cfg.sessionStorageKey,JSON.stringify({attemptId:state.attemptId,token:state.token}));}
  function clearSaved(){sessionStorage.removeItem(cfg.sessionStorageKey);}
  function fmtGrade(v){return Number(v??1).toFixed(2);}
  function activityActive(){return !!state.snapshot&&!state.snapshot.completed;}
  function fullscreenSupported(){return !!document.documentElement.requestFullscreen;}
  function isFullscreen(){return !!document.fullscreenElement;}
  function normalizeCode(v){return String(v??'').replace(/\\n/g,'\n');}

  function setRuntimeBadge(mode,label){
    const badge=$('runtimeBadge');
    badge.className=`runtime-badge ${mode}`;
    badge.innerHTML='<span class="status-dot"></span>'+esc(label);
    const kernel=$('kernelLabel');
    const kernelInfo=document.querySelector('.kernel-info');
    if(kernel){
      kernel.textContent=mode==='ready'?'Python 3 · connected in browser':label;
      kernelInfo?.classList.toggle('ready',mode==='ready');
    }
  }

  function updateRestrictionLabel(){
    const el=$('restrictionLabel');
    if(!el)return;
    el.textContent=state.restrictionEvents>0?`Exits: ${state.restrictionEvents}`:'Guided mode';
    el.classList.toggle('attention',state.restrictionEvents>0);
  }

  async function logEvent(type,metadata={}){
    if(!state.attemptId||!state.token||!cfg.rpc.event)return null;
    try{
      const data=await rpc(cfg.rpc.event,{p_attempt_id:state.attemptId,p_attempt_token:state.token,p_event_type:type,p_metadata:metadata});
      if(Number.isFinite(Number(data?.restriction_events))){state.restrictionEvents=Number(data.restriction_events);updateRestrictionLabel();}
      return data;
    }catch(err){console.warn('activity event log failed',type,err);return null;}
  }

  function showFullscreenGate(message){
    $('fullscreenMessage').textContent=message||'El laboratorio está pausado hasta que vuelvas a pantalla completa.';
    $('fullscreenGate').classList.remove('hidden');
  }
  function hideFullscreenGate(){$('fullscreenGate').classList.add('hidden');}

  async function enterFullscreen(){
    if(!cfg.requireFullscreen)return true;
    if(!fullscreenSupported()){
      showFullscreenGate('Este navegador no permite el modo de pantalla completa obligatorio. Usa Chrome o Edge en un computador.');
      return false;
    }
    if(isFullscreen()){hideFullscreenGate();return true;}
    try{
      await document.documentElement.requestFullscreen();
      hideFullscreenGate();
      await logEvent('FULLSCREEN_ENTER',{source:'student_action'});
      return true;
    }catch(_){
      showFullscreenGate('Debes aceptar pantalla completa para trabajar en el laboratorio.');
      return false;
    }
  }

  function enforceFullscreen(){
    if(!cfg.requireFullscreen||!activityActive())return true;
    if(isFullscreen()){hideFullscreenGate();return true;}
    showFullscreenGate('Laboratorio pausado. Vuelve a pantalla completa para continuar.');
    return false;
  }

  function terminalText(){return $('terminalOutput').textContent||'';}
  function clearTerminal(message='Python console ready.'){const out=$('terminalOutput');out.textContent=message+'\n';out.scrollTop=out.scrollHeight;}
  function appendTerminal(text){
    const out=$('terminalOutput');
    const prefix=out.textContent&& !out.textContent.endsWith('\n')?'\n':'';
    out.textContent+=prefix+String(text??'')+(String(text??'').endsWith('\n')?'':'\n');
    out.scrollTop=out.scrollHeight;
  }
  function lastScalar(output){
    const lines=String(output||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    return lines.length?lines[lines.length-1]:'';
  }

  async function ensureRuntime(){
    if(state.pyodide)return state.pyodide;
    if(state.runtimePromise)return state.runtimePromise;
    state.runtimePromise=(async()=>{
      try{
        setRuntimeBadge('loading','Loading Python…');
        if(typeof window.loadPyodide!=='function')throw new Error('Pyodide did not load. Check the network connection.');
        const py=await window.loadPyodide({indexURL:PYODIDE_INDEX});
        py.setStdin({stdin:()=>window.prompt('Python input:')??null});
        try{py.FS.mkdirTree('/home/pyodide');}catch(_){ }
        await py.runPythonAsync("import os\nos.chdir('/home/pyodide')");
        try{
          const response=await fetch('data.csv',{cache:'no-store'});
          if(!response.ok)throw new Error(`CSV HTTP ${response.status}`);
          const csv=await response.text();
          py.FS.writeFile('/home/pyodide/data.csv',csv);
          state.datasetReady=true;
        }catch(err){
          state.datasetReady=false;
          console.warn('dataset preload failed',err);
        }
        state.pyodide=py;
        setRuntimeBadge('ready','Python ready');
        clearTerminal('Python 3 runtime ready.\nDataset mounted as data.csv.');
        return py;
      }catch(err){
        state.runtimePromise=null;
        setRuntimeBadge('error','Python unavailable');
        clearTerminal(`Runtime error: ${err.message}`);
        setValidation('Python could not start. Check the connection and reload the page.','bad');
        throw err;
      }
    })();
    return state.runtimePromise;
  }

  async function ensurePandas(){
    const py=await ensureRuntime();
    if(state.pandasReady)return;
    setRuntimeBadge('loading','Loading Pandas…');
    appendTerminal('[system] Loading pandas for the data-analysis stages…');
    await py.loadPackage('pandas');
    state.pandasReady=true;
    setRuntimeBadge('ready','Python + Pandas ready');
    appendTerminal('[system] pandas ready.');
  }

  async function executePython(source,{cell=false,terminal=false}={}){
    if(!enforceFullscreen())return null;
    const py=await ensureRuntime();
    if(/(^|\n)\s*(import pandas|from pandas)/.test(source))await ensurePandas();

    const stdout=[];
    const stderr=[];
    py.setStdout({batched:msg=>stdout.push(msg)});
    py.setStderr({batched:msg=>stderr.push(msg)});

    let result;
    try{
      result=await py.runPythonAsync(source);
      if(result!==undefined&&result!==null){
        const text=String(result);
        if(text!=='None')stdout.push(text);
        if(typeof result.destroy==='function')result.destroy();
      }
    }catch(err){
      stderr.push(String(err?.message||err));
    }

    const output=stdout.join('\n').trim();
    const errors=stderr.join('\n').trim();
    if(cell){
      state.executionCount+=1;
      $('executionCount').textContent=`[${state.executionCount}]`;
      appendTerminal(`\nIn [${state.executionCount}]:`);
      if(output)appendTerminal(output);
      if(errors)appendTerminal(`ERROR\n${errors}`);
      state.lastCellOutput=errors?'':output;
      state.lastCellScalar=errors?'':lastScalar(output);
      $('validateButton').disabled=!state.lastCellScalar;
      setValidation(errors?'Fix the Python error and run the cell again.':(output?'Cell executed. Explore if you want, then validate the printed output.':'Cell ran, but it did not print a value.'),errors?'bad':'');
    }else if(terminal){
      if(output)appendTerminal(output);
      if(errors)appendTerminal(`ERROR\n${errors}`);
    }
    return {output,errors};
  }

  function renderMath(){
    if(typeof window.renderMathInElement!=='function')return;
    try{
      window.renderMathInElement($('guidePane')||document.querySelector('.guide-pane'),{
        delimiters:[{left:'\\(',right:'\\)',display:false},{left:'\\[',right:'\\]',display:true}],
        throwOnError:false
      });
    }catch(err){console.warn('math render skipped',err);}
  }

  function renderStepRail(checkpoints,currentKey){
    $('stepRail').innerHTML=checkpoints.map(cp=>`<span class="step-dot ${cp.correct?'done':cp.key===currentKey?'active':''}" title="Stage ${esc(cp.sequence)}"></span>`).join('');
  }

  function renderLesson(cp){
    const lesson=LESSONS[cp.key]||{
      tag:'PYTHON LAB',title:cp.title,concept:`<p>${esc(cp.prompt)}</p>`,goal:'<p>Run the Python cell and interpret its output.</p>',task:`<p>${esc(cp.prompt)}</p>`,explore:'<p>Use the console to inspect variables created by the cell.</p>',hint:`<p>${esc(cp.hint||'Read the last printed value.')}</p>`,starter:normalizeCode(cp.code)
    };
    state.currentKey=cp.key;
    state.currentStarter=lesson.starter||normalizeCode(cp.code);
    state.lastCellOutput='';state.lastCellScalar='';
    $('lessonTag').textContent=lesson.tag;
    $('lessonTitle').textContent=lesson.title;
    $('lessonConcept').innerHTML=lesson.concept;
    $('lessonGoal').innerHTML=lesson.goal;
    $('lessonTask').innerHTML=lesson.task;
    $('lessonExplore').innerHTML=lesson.explore;
    $('lessonHint').innerHTML=lesson.hint;
    $('codeEditor').value=state.currentStarter;
    $('validateButton').disabled=true;
    $('executionCount').textContent='[ ]';
    setValidation('Run the starter cell. You can edit and experiment before validating.');
    renderMath();
  }

  function render(snapshot){
    state.snapshot=snapshot;
    $('setupPanel').classList.add('hidden');
    const checkpoints=Array.from(snapshot.checkpoints||[]);
    const completed=Number(snapshot.correct_count||0);
    const total=Number(snapshot.checkpoint_count||checkpoints.length||8);
    $('studentLabel').textContent=`${snapshot.group_code} · ${snapshot.student_label}`;
    $('gradeLabel').textContent=`${fmtGrade(snapshot.grade)} / 5.00`;
    $('progressText').textContent=`${completed} / ${total} completed`;
    $('progressBar').style.width=`${Math.min(100,completed/Math.max(1,total)*100)}%`;
    updateRestrictionLabel();

    if(snapshot.completed){
      $('workspacePanel').classList.add('hidden');
      $('finishPanel').classList.remove('hidden');
      $('finishPoints').textContent=`${completed} / ${total}`;
      $('finishGrade').textContent=fmtGrade(snapshot.grade);
      hideFullscreenGate();
      clearSaved();
      if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
      return;
    }

    const current=checkpoints.find(cp=>!cp.correct)||checkpoints[0];
    const currentNumber=Number(current?.sequence||completed+1);
    $('stepLabel').textContent=`Stage ${currentNumber} of ${total}`;
    renderStepRail(checkpoints,current?.key);
    renderLesson(current);
    $('finishPanel').classList.add('hidden');
    $('workspacePanel').classList.remove('hidden');
    enforceFullscreen();
    ensureRuntime().catch(()=>{});
  }

  async function runCurrentCell(){
    if(!enforceFullscreen())return;
    const source=$('codeEditor').value;
    if(!source.trim()){setValidation('The code cell is empty.','bad');return;}
    $('runCodeButton').disabled=true;$('runCellButton').disabled=true;
    try{await executePython(source,{cell:true});}
    finally{$('runCodeButton').disabled=false;$('runCellButton').disabled=false;}
  }

  async function validateCurrent(){
    if(!enforceFullscreen())return;
    if(!state.currentKey||!state.lastCellScalar){setValidation('Run the code cell first. The validator uses its last printed value.','bad');return;}
    const btn=$('validateButton');btn.disabled=true;setValidation('Checking the last printed value…');
    try{
      const data=await rpc(cfg.rpc.submit,{p_attempt_id:state.attemptId,p_attempt_token:state.token,p_checkpoint_key:state.currentKey,p_answer:state.lastCellScalar});
      if(data.correct){
        setValidation('Correct. Stage recorded — loading the next lab step.','ok');
        appendTerminal('✓ Stage validated and recorded.');
        await logEvent('LAB_STAGE_COMPLETED',{checkpoint_key:state.currentKey,execution_count:state.executionCount});
        setTimeout(()=>render(data.snapshot),650);
      }else{
        setValidation('The last printed value does not match yet. Read the guide, inspect the terminal, edit the cell, and run again.','bad');
        appendTerminal('✗ Not validated yet. Keep experimenting; no penalty for retrying.');
        btn.disabled=false;
      }
    }catch(err){
      setValidation(`Could not record this stage: ${err.message}`,'bad');
      btn.disabled=false;
    }
  }

  $('registrationForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const group=$('groupCode').value;
    const name=$('studentName').value.trim();
    if(!group||!name)return;
    if(cfg.requireFullscreen){
      if(!fullscreenSupported()){setSetupStatus('Este navegador no permite pantalla completa obligatoria. Usa Chrome o Edge en computador.',true);return;}
      if(!await enterFullscreen())return;
    }
    $('startButton').disabled=true;setSetupStatus('Creating your Python lab session…');
    try{
      const data=await rpc(cfg.rpc.start,{p_activity_slug:cfg.activitySlug,p_student_name:name,p_group_code:group,p_session_id:crypto.randomUUID(),p_user_agent:navigator.userAgent});
      state.attemptId=data.attempt_id;state.token=data.attempt_token;save();render(data.snapshot);setSetupStatus('');
      await logEvent('ACTIVITY_READY',{identity_mode:data.identity_mode||'self_declared',workspace_version:'python-runtime-v2'});
    }catch(err){
      $('startButton').disabled=false;setSetupStatus(`No fue posible iniciar: ${err.message}`,true);
      if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
    }
  });

  $('runCodeButton').addEventListener('click',runCurrentCell);
  $('runCellButton').addEventListener('click',runCurrentCell);
  $('validateButton').addEventListener('click',validateCurrent);
  $('resetCodeButton').addEventListener('click',()=>{
    if(!enforceFullscreen())return;
    $('codeEditor').value=state.currentStarter;
    state.lastCellOutput='';state.lastCellScalar='';$('validateButton').disabled=true;
    setValidation('Starter code restored. Run the cell when ready.');
  });
  $('clearTerminalButton').addEventListener('click',()=>clearTerminal('Python console cleared.'));

  $('terminalForm').addEventListener('submit',async e=>{
    e.preventDefault();
    if(!enforceFullscreen())return;
    const input=$('terminalCommand');
    const command=input.value.trim();
    if(!command)return;
    input.value='';appendTerminal(`>>> ${command}`);
    try{await executePython(command,{terminal:true});}
    catch(err){appendTerminal(`ERROR\n${err.message}`);}
  });

  $('codeEditor').addEventListener('keydown',e=>{
    if(e.key==='Tab'){
      e.preventDefault();
      const editor=e.currentTarget,start=editor.selectionStart,end=editor.selectionEnd;
      editor.setRangeText('    ',start,end,'end');
    }
    if((e.shiftKey||e.ctrlKey)&&e.key==='Enter'){
      e.preventDefault();runCurrentCell();
    }
  });

  $('enterFullscreenButton').addEventListener('click',enterFullscreen);

  document.addEventListener('fullscreenchange',async()=>{
    if(!activityActive()||!cfg.requireFullscreen)return;
    if(isFullscreen()){
      hideFullscreenGate();
      await logEvent('FULLSCREEN_ENTER',{source:'fullscreenchange'});
    }else{
      showFullscreenGate('Saliste de pantalla completa. El laboratorio quedó pausado hasta que regreses.');
      await logEvent('FULLSCREEN_EXIT',{visibility:document.visibilityState,workspace_version:'python-runtime-v2'});
    }
  });

  document.addEventListener('visibilitychange',async()=>{
    if(!activityActive())return;
    if(document.visibilityState==='hidden'){
      await logEvent('UNAUTHORIZED_LEAVE',{reason:'visibility_hidden',workspace_version:'python-runtime-v2'});
    }else{
      enforceFullscreen();
    }
  });

  window.addEventListener('beforeunload',e=>{
    if(activityActive()){e.preventDefault();e.returnValue='';}
  });

  async function restore(){
    const raw=sessionStorage.getItem(cfg.sessionStorageKey);
    if(!raw)return;
    try{
      const saved=JSON.parse(raw);
      if(!saved.attemptId||!saved.token)return clearSaved();
      state.attemptId=saved.attemptId;state.token=saved.token;
      const data=await rpc(cfg.rpc.resume,{p_attempt_id:state.attemptId,p_attempt_token:state.token});
      render(data.snapshot);
      if(activityActive())showFullscreenGate('Sesión recuperada. Entra a pantalla completa para continuar en el laboratorio.');
    }catch(err){
      clearSaved();setSetupStatus('La sesión anterior ya no está disponible. Puedes iniciar nuevamente.',true);
    }
  }

  restore();
})();
