(() => {
  'use strict';

  const cfg = window.IJR_COLAB_ACTIVITY_CONFIG;
  const $ = id => document.getElementById(id);
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
  });

  const PYODIDE_INDEX = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
  const PLACEHOLDER = 'WRITE_HERE';

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
      concept:'<p>Una <strong>variable</strong> es un nombre que apunta a un valor. En Python, el signo <code>=</code> asigna y el operador <code>+</code> combina dos números mediante una suma.</p><p>En esta primera etapa no buscamos memorizar. El equipo debe leer el código, completar una parte pequeña, ejecutarlo y explicar qué ocurrió.</p>',
      goal:'<p>Reconocer el flujo <strong>valor → variable → operación → salida</strong> y distinguir entre asignar un valor y mostrarlo en pantalla.</p>',
      steps:[
        'Lean las dos primeras líneas e identifiquen qué valor queda guardado en <code>a</code> y cuál en <code>b</code>.',
        'Busquen <code>WRITE_HERE</code>. Allí deben escribir una expresión que combine <code>a</code> y <code>b</code> mediante suma.',
        'No calculen mentalmente el resultado para escribirlo. La idea es que <strong>Python haga la operación</strong>.',
        'Ejecuten la celda. Después de ver una salida numérica, discutan qué línea la produjo y validen la etapa.'
      ],
      task:'<p>Construir una variable llamada <code>result</code> que almacene la suma de <code>a</code> y <code>b</code>, y hacer que Python muestre ese valor.</p>',
      explore:'<p>En la consola prueben <code>type(a)</code>. Luego prueben <code>a == 12</code>. Observen que la consola también puede responder preguntas sobre las variables creadas.</p>',
      hint:'<p>La expresión que falta debe usar los nombres de las variables y el operador de suma. No escriban el resultado numérico directamente.</p>',
      starter:`a = 12\nb = 5\n\n# TODO: construyan la suma usando las variables a y b\nresult = WRITE_HERE\n\nprint(result)`
    },
    A2:{
      tag:'FOUNDATION · OPERATORS',
      title:'Multiplication as an operation',
      concept:'<p>Los operadores aritméticos transforman datos. En Python, la multiplicación se representa con <code>*</code>. Una expresión produce un valor y ese valor puede guardarse en una nueva variable.</p>',
      goal:'<p>Diferenciar los <strong>datos de entrada</strong> de la <strong>operación</strong> y del <strong>valor resultante</strong>.</p>',
      steps:[
        'Identifiquen nuevamente las variables de entrada <code>a</code> y <code>b</code>.',
        'Completen únicamente la parte marcada con <code>WRITE_HERE</code>. Esta vez necesitan una multiplicación.',
        'Ejecuten y lean la salida. Si aparece un error, no borren todo: lean el mensaje y localicen la línea señalada.',
        'Antes de validar, usen la consola para probar una operación distinta, por ejemplo elevar <code>a</code> al cuadrado.'
      ],
      task:'<p>Crear <code>product</code> a partir de las dos variables existentes y producir una única salida numérica al final de la celda.</p>',
      explore:'<p>Prueben <code>a ** 2</code> en la consola. Comparen <code>*</code> con <code>**</code>: realizan operaciones diferentes.</p>',
      hint:'<p>Para multiplicar dos variables, la expresión debe contener ambos nombres separados por <code>*</code>.</p>',
      starter:`a = 12\nb = 5\n\n# TODO: construyan el producto usando a y b\nproduct = WRITE_HERE\n\nprint(product)`
    },
    A3:{
      tag:'DATA STRUCTURES · LISTS',
      title:'A list stores many values',
      concept:'<p>Hasta ahora trabajamos con números aislados. Una <strong>list</strong> permite guardar varias observaciones dentro de un solo objeto usando corchetes <code>[ ]</code>.</p><p>En análisis de datos es frecuente preguntar cuántas observaciones tenemos antes de calcular cualquier estadístico.</p>',
      goal:'<p>Pasar de variables escalares a una pequeña colección de datos y usar una función para conocer su tamaño.</p>',
      steps:[
        'Observen la lista <code>numbers</code>. No cuenten a mano todavía.',
        'Python tiene una función que devuelve la cantidad de elementos de una colección. Identifiquen cuál es usando la explicación o la pista.',
        'Completen <code>count = WRITE_HERE</code> con una expresión que calcule el tamaño de <code>numbers</code>.',
        'Ejecuten y después comprueben en la consola <code>numbers[0]</code> y <code>numbers[-1]</code>.'
      ],
      task:'<p>Hacer que Python determine cuántas observaciones contiene <code>numbers</code> sin escribir manualmente esa cantidad.</p>',
      explore:'<p>Prueben <code>type(numbers)</code>, <code>numbers[0]</code> y <code>numbers[-1]</code>. Los índices permiten acceder a posiciones específicas.</p>',
      hint:'<p>La función <code>len(...)</code> cuenta elementos. Dentro de los paréntesis debe ir el nombre de la lista.</p>',
      starter:`numbers = [12, 7, 15, 9, 11]\n\n# TODO: calculen cuántos elementos tiene numbers\ncount = WRITE_HERE\n\nprint(count)`
    },
    A4:{
      tag:'DATA OPERATIONS · AGGREGATION',
      title:'Aggregate a list with sum()',
      concept:'<p>Una <strong>agregación</strong> transforma muchas observaciones en un solo resumen. Sumar todos los valores de una lista es una de las agregaciones más simples.</p>',
      goal:'<p>Usar una función que recibe una colección completa y devuelve un único valor numérico.</p>',
      steps:[
        'Lean nuevamente la lista y piensen qué significa obtener su total.',
        'No sumen los números uno por uno en el código. Busquen una función de Python que opere sobre toda la lista.',
        'Completen la variable <code>total</code> y ejecuten.',
        'Exploren después <code>min(numbers)</code> y <code>max(numbers)</code> en la consola para comparar tres agregaciones.'
      ],
      task:'<p>Calcular el total de todas las observaciones de <code>numbers</code> mediante una función de Python.</p>',
      explore:'<p>Prueben <code>min(numbers)</code> y <code>max(numbers)</code>. ¿Qué resumen produce cada función?</p>',
      hint:'<p>La función que agrega mediante suma se llama <code>sum(...)</code>.</p>',
      starter:`numbers = [12, 7, 15, 9, 11]\n\n# TODO: obtengan el total de la lista con una función de Python\ntotal = WRITE_HERE\n\nprint(total)`
    },
    A5:{
      tag:'STATISTICS · MEAN',
      title:'Build the arithmetic mean',
      concept:'<p>La media aritmética reúne dos ideas que ya usaron: <strong>sumar</strong> las observaciones y <strong>contarlas</strong>.</p><p>En notación estadística: \\(\\bar{x}=\\frac{\\sum x_i}{n}\\). El código debe representar exactamente esa estructura, pero sin escribir de antemano el valor final.</p>',
      goal:'<p>Traducir una fórmula estadística a una expresión ejecutable de Python.</p>',
      steps:[
        'Identifiquen en la fórmula qué representa el numerador y qué representa el denominador.',
        'Relacionen el numerador con una función ya usada en la etapa anterior.',
        'Relacionen el denominador con la función utilizada para contar elementos.',
        'Completen <code>mean_value</code>, ejecuten y verifiquen por qué Python devuelve un número decimal.'
      ],
      task:'<p>Construir la media de <code>numbers</code> a partir de operaciones sobre la lista. No escriban una media calculada manualmente.</p>',
      explore:'<p>Después de obtener la media, prueben <code>round(mean_value, 1)</code> y comparen el valor redondeado con el original.</p>',
      hint:'<p>La estructura es “total dividido por cantidad”. Pueden usar directamente las funciones correspondientes dentro de una sola expresión.</p>',
      starter:`numbers = [12, 7, 15, 9, 11]\n\n# TODO: traduzcan la fórmula de la media a Python\nmean_value = WRITE_HERE\n\nprint(mean_value)`
    },
    A6:{
      tag:'PANDAS · EXTERNAL DATA',
      title:'Load a real CSV file',
      concept:'<p>Ahora los datos dejan de estar escritos dentro del programa. Un archivo <strong>CSV</strong> guarda información organizada en filas y columnas. <code>pandas</code> lo convierte en un <strong>DataFrame</strong>, una estructura preparada para análisis.</p><p>El archivo de la clase ya está montado dentro de este entorno con el nombre <code>data.csv</code>.</p>',
      goal:'<p>Dar el primer paso desde Python básico hacia análisis de datos tabular real.</p>',
      steps:[
        'Ejecuten mentalmente las dos primeras líneas: importar Pandas y leer el archivo no significa todavía analizarlo.',
        'Usen <code>df.head(3)</code> para mirar una pequeña muestra y reconocer las columnas.',
        'Después necesitan obtener <strong>solo la cantidad de filas</strong>. Investiguen la propiedad <code>shape</code> usando la guía o la consola.',
        'Completen <code>row_count</code>, ejecuten y asegúrense de que la última línea impresa sea únicamente ese conteo.'
      ],
      task:'<p>Cargar <code>data.csv</code> como DataFrame, inspeccionar sus primeras filas y producir al final el número de registros del archivo.</p>',
      explore:'<p>En la consola prueben <code>df.columns</code>, <code>df.shape</code> y <code>df.dtypes</code>. No validen hasta poder explicar qué devuelve cada uno.</p>',
      hint:'<p><code>df.shape</code> devuelve una pareja con filas y columnas. El índice <code>[0]</code> selecciona la primera parte: las filas.</p>',
      starter:`import pandas as pd\n\ndf = pd.read_csv("data.csv")\nprint(df.head(3))\n\n# TODO: obtengan únicamente la cantidad de filas del DataFrame\nrow_count = WRITE_HERE\n\nprint(row_count)`
    },
    A7:{
      tag:'PANDAS · COLUMN ANALYSIS',
      title:'Calculate a column mean',
      concept:'<p>Un DataFrame contiene variables organizadas por columnas. Seleccionar <code>df["score"]</code> produce una serie de datos; sobre esa serie podemos aplicar métodos estadísticos.</p>',
      goal:'<p>Realizar una operación estadística directamente sobre una columna de un DataFrame.</p>',
      steps:[
        'Carguen el archivo y observen que la columna que interesa se llama <code>score</code>.',
        'Seleccionen esa columna con corchetes.',
        'Busquen el método de Pandas que calcula la media y completen <code>score_mean</code>.',
        'Ejecuten. Después usen la consola para pedir <code>df["score"].describe()</code> y observen qué otros resúmenes aparecen.'
      ],
      task:'<p>Calcular con Pandas la media de la variable <code>score</code> sin usar una respuesta escrita previamente.</p>',
      explore:'<p>Prueben <code>df["score"].describe()</code>. Identifiquen <em>count</em>, <em>mean</em>, <em>min</em> y <em>max</em>.</p>',
      hint:'<p>Primero seleccionen la columna <code>score</code>; después llamen el método <code>.mean()</code>.</p>',
      starter:`import pandas as pd\n\ndf = pd.read_csv("data.csv")\n\n# TODO: calculen la media de la columna score\nscore_mean = WRITE_HERE\n\nprint(score_mean)`
    },
    A8:{
      tag:'PANDAS · FILTERING',
      title:'Filter rows with a condition',
      concept:'<p>Analizar datos también implica <strong>seleccionar</strong> registros. En Pandas una comparación sobre una columna produce valores <code>True</code>/<code>False</code>; esa condición puede utilizarse como filtro.</p>',
      goal:'<p>Construir una consulta básica con la secuencia <strong>seleccionar → filtrar → contar</strong>.</p>',
      steps:[
        'Carguen el DataFrame y formulen la condición “score mayor o igual que 4”.',
        'Usen esa condición dentro de corchetes para crear un nuevo DataFrame llamado <code>passed</code>.',
        'Después calculen cuántas filas quedaron en <code>passed</code>.',
        'Ejecuten y, antes de validar, escriban <code>passed[["student_id", "score"]]</code> en la consola para inspeccionar el subconjunto.'
      ],
      task:'<p>Filtrar los registros cuyo <code>score</code> sea mayor o igual a 4 y contar cuántos registros cumplen la condición.</p>',
      explore:'<p>Prueben <code>passed[["student_id", "score"]]</code>. Cambien temporalmente el umbral en la consola y observen cómo cambia el subconjunto.</p>',
      hint:'<p>Un filtro típico tiene la forma <code>df[condición]</code>. Para contar las filas resultantes pueden reutilizar una función de etapas anteriores.</p>',
      starter:`import pandas as pd\n\ndf = pd.read_csv("data.csv")\n\n# TODO 1: creen un DataFrame con score mayor o igual que 4\npassed = WRITE_HERE\n\n# TODO 2: cuenten cuántas filas quedaron después del filtro\npassed_count = WRITE_HERE\n\nprint(passed_count)`
    }
  };

  async function rpc(name,args={}){
    const {data,error}=await sb.rpc(name,args);
    if(error)throw new Error(error.message||'Backend error');
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
      if(Number.isFinite(Number(data?.restriction_events))){
        state.restrictionEvents=Number(data.restriction_events);
        updateRestrictionLabel();
      }
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

  function clearTerminal(message='Python console ready.'){
    const out=$('terminalOutput');
    out.textContent=message+'\n';
    out.scrollTop=out.scrollHeight;
  }

  function appendTerminal(text){
    const out=$('terminalOutput');
    const value=String(text??'');
    const prefix=out.textContent&&!out.textContent.endsWith('\n')?'\n':'';
    out.textContent+=prefix+value+(value.endsWith('\n')?'':'\n');
    out.scrollTop=out.scrollHeight;
  }

  function lastScalar(output){
    const lines=String(output||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    if(!lines.length)return'';
    for(let i=lines.length-1;i>=0;i--){
      if(/^[-+]?\d+(?:[.,]\d+)?(?:[eE][-+]?\d+)?$/.test(lines[i]))return lines[i];
    }
    return'';
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
        clearTerminal('Python 3 runtime ready.\nWorkspace ready for your team.');
        return py;
      }catch(err){
        state.runtimePromise=null;
        setRuntimeBadge('error','Python unavailable');
        clearTerminal(`Runtime error: ${err.message}`);
        setValidation('Python no pudo iniciar. Revisen la conexión y recarguen la página.','bad');
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
      if(errors){
        setValidation('Python encontró un error. Lean el mensaje, localicen la línea y vuelvan a ejecutar.','bad');
      }else if(state.lastCellScalar){
        setValidation('La celda produjo una salida numérica. Explórenla y, cuando puedan explicarla, validen la etapa.');
      }else if(output){
        setValidation('La celda se ejecutó, pero la última salida todavía no es un valor numérico validable. Revisen las instrucciones.','bad');
      }else{
        setValidation('La celda se ejecutó, pero no imprimió una salida. Revisen si falta un print(...).','bad');
      }
    }else if(terminal){
      if(output)appendTerminal(output);
      if(errors)appendTerminal(`ERROR\n${errors}`);
    }
    return {output,errors};
  }

  function renderMath(){
    if(typeof window.renderMathInElement!=='function')return;
    try{
      window.renderMathInElement($('guidePane'),{
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
      tag:'PYTHON LAB',
      title:cp.title,
      concept:`<p>${esc(cp.prompt)}</p>`,
      goal:'<p>Ejecutar Python e interpretar su salida.</p>',
      steps:['Lean la consigna.','Completen la parte faltante del código.','Ejecuten y observen la consola.','Valide únicamente cuando el equipo pueda explicar la salida.'],
      task:`<p>${esc(cp.prompt)}</p>`,
      explore:'<p>Usen la consola para inspeccionar variables creadas por la celda.</p>',
      hint:`<p>${esc(cp.hint||'Revisen la última salida impresa.')}</p>`,
      starter:normalizeCode(cp.code)
    };

    state.currentKey=cp.key;
    state.currentStarter=lesson.starter||normalizeCode(cp.code);
    state.lastCellOutput='';
    state.lastCellScalar='';
    state.executionCount=0;

    $('lessonTag').textContent=lesson.tag;
    $('lessonTitle').textContent=lesson.title;
    $('lessonConcept').innerHTML=lesson.concept;
    $('lessonGoal').innerHTML=lesson.goal;
    $('lessonSteps').innerHTML=(lesson.steps||[]).map((step,index)=>`<li><span>${index+1}</span><div>${step}</div></li>`).join('');
    $('lessonTask').innerHTML=lesson.task;
    $('lessonExplore').innerHTML=lesson.explore;
    $('lessonHint').innerHTML=lesson.hint;
    $('codeEditor').value=state.currentStarter;
    $('validateButton').disabled=true;
    $('executionCount').textContent='[ ]';
    setValidation('Lean primero la guía. Completen WRITE_HERE y ejecuten la celda cuando el equipo esté listo.');
    renderMath();
  }

  function render(snapshot){
    state.snapshot=snapshot;
    $('setupPanel').classList.add('hidden');
    const checkpoints=Array.from(snapshot.checkpoints||[]);
    const completed=Number(snapshot.correct_count||0);
    const total=Number(snapshot.checkpoint_count||checkpoints.length||8);
    const teamSize=Number(snapshot.team_size||snapshot.participants?.length||1);

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
      $('finishTeamSize').textContent=String(teamSize);
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
    if(!source.trim()){
      setValidation('La celda está vacía. Restablézcanla y completen el código.','bad');
      return;
    }
    if(source.includes(PLACEHOLDER)){
      setValidation('Todavía hay un WRITE_HERE sin completar. Lean el paso a paso y reemplacen cada marcador antes de ejecutar.','bad');
      return;
    }
    $('runCodeButton').disabled=true;
    $('runCellButton').disabled=true;
    try{await executePython(source,{cell:true});}
    finally{$('runCodeButton').disabled=false;$('runCellButton').disabled=false;}
  }

  async function validateCurrent(){
    if(!enforceFullscreen())return;
    if(!state.currentKey||!state.lastCellScalar){
      setValidation('Primero ejecuten la celda correctamente. La validación usa la última salida numérica impresa.','bad');
      return;
    }
    const btn=$('validateButton');
    btn.disabled=true;
    setValidation('Validando la salida del equipo…');
    try{
      const data=await rpc(cfg.rpc.submit,{
        p_attempt_id:state.attemptId,
        p_attempt_token:state.token,
        p_checkpoint_key:state.currentKey,
        p_answer:state.lastCellScalar
      });
      if(data.correct){
        setValidation('Correcto. La etapa quedó registrada; preparen la siguiente.','ok');
        appendTerminal('✓ Stage validated and recorded.');
        await logEvent('LAB_STAGE_COMPLETED',{
          checkpoint_key:state.currentKey,
          execution_count:state.executionCount,
          workspace_version:'team-guided-v3'
        });
        setTimeout(()=>render(data.snapshot),700);
      }else{
        setValidation('La salida todavía no corresponde al objetivo. No hay penalización: vuelvan a la guía, revisen el código y ejecuten otra vez.','bad');
        appendTerminal('✗ Not validated yet. Review, edit and run again.');
        btn.disabled=false;
      }
    }catch(err){
      setValidation(`No se pudo registrar esta etapa: ${err.message}`,'bad');
      btn.disabled=false;
    }
  }

  function updateTeamSizeUI(){
    const size=Number($('teamSize').value||3);
    const wrap=$('student3Wrap');
    const input=$('studentName3');
    const show=size===3;
    wrap.classList.toggle('hidden-member',!show);
    input.required=show;
    if(!show)input.value='';
  }

  function readTeamNames(){
    const size=Number($('teamSize').value||3);
    const names=[$('studentName1').value.trim(),$('studentName2').value.trim()];
    if(size===3)names.push($('studentName3').value.trim());
    return names;
  }

  $('teamSize').addEventListener('change',updateTeamSizeUI);
  updateTeamSizeUI();

  $('registrationForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const group=$('groupCode').value;
    const names=readTeamNames();
    if(!group||names.some(name=>name.length<2)){
      setSetupStatus('Completen el grupo y el nombre de cada integrante del equipo.',true);
      return;
    }
    const normalized=names.map(x=>x.toLocaleLowerCase('es').replace(/\s+/g,' ').trim());
    if(new Set(normalized).size!==normalized.length){
      setSetupStatus('No repitan el mismo nombre dentro del equipo.',true);
      return;
    }

    if(cfg.requireFullscreen){
      if(!fullscreenSupported()){
        setSetupStatus('Este navegador no permite pantalla completa obligatoria. Usen Chrome o Edge en computador.',true);
        return;
      }
      if(!await enterFullscreen())return;
    }

    $('startButton').disabled=true;
    setSetupStatus('Registrando el equipo y preparando Python…');
    try{
      const data=await rpc(cfg.rpc.startTeam,{
        p_activity_slug:cfg.activitySlug,
        p_student_names:names,
        p_group_code:group,
        p_session_id:crypto.randomUUID(),
        p_user_agent:navigator.userAgent
      });
      state.attemptId=data.attempt_id;
      state.token=data.attempt_token;
      save();
      render(data.snapshot);
      setSetupStatus('');
      await logEvent('ACTIVITY_READY',{
        identity_mode:'team',
        team_size:names.length,
        workspace_version:'team-guided-v3'
      });
    }catch(err){
      $('startButton').disabled=false;
      setSetupStatus(`No fue posible iniciar: ${err.message}`,true);
      if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
    }
  });

  $('runCodeButton').addEventListener('click',runCurrentCell);
  $('runCellButton').addEventListener('click',runCurrentCell);
  $('validateButton').addEventListener('click',validateCurrent);

  $('resetCodeButton').addEventListener('click',()=>{
    if(!enforceFullscreen())return;
    $('codeEditor').value=state.currentStarter;
    state.lastCellOutput='';
    state.lastCellScalar='';
    state.executionCount=0;
    $('executionCount').textContent='[ ]';
    $('validateButton').disabled=true;
    setValidation('Celda restablecida. Lean nuevamente los pasos antes de completar WRITE_HERE.');
  });

  $('clearTerminalButton').addEventListener('click',()=>clearTerminal('Python console cleared.'));

  $('terminalForm').addEventListener('submit',async e=>{
    e.preventDefault();
    if(!enforceFullscreen())return;
    const input=$('terminalCommand');
    const command=input.value.trim();
    if(!command)return;
    input.value='';
    appendTerminal(`>>> ${command}`);
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
      e.preventDefault();
      runCurrentCell();
    }
  });

  $('enterFullscreenButton').addEventListener('click',enterFullscreen);

  document.addEventListener('fullscreenchange',async()=>{
    if(!activityActive()||!cfg.requireFullscreen)return;
    if(isFullscreen()){
      hideFullscreenGate();
      await logEvent('FULLSCREEN_ENTER',{source:'fullscreenchange',workspace_version:'team-guided-v3'});
    }else{
      showFullscreenGate('Salieron de pantalla completa. El laboratorio quedó pausado hasta que regresen.');
      await logEvent('FULLSCREEN_EXIT',{visibility:document.visibilityState,workspace_version:'team-guided-v3'});
    }
  });

  document.addEventListener('visibilitychange',async()=>{
    if(!activityActive())return;
    if(document.visibilityState==='hidden'){
      await logEvent('UNAUTHORIZED_LEAVE',{reason:'visibility_hidden',workspace_version:'team-guided-v3'});
    }else{
      enforceFullscreen();
    }
  });

  window.addEventListener('beforeunload',e=>{
    if(activityActive()){
      e.preventDefault();
      e.returnValue='';
    }
  });

  async function restore(){
    const raw=sessionStorage.getItem(cfg.sessionStorageKey);
    if(!raw)return;
    try{
      const saved=JSON.parse(raw);
      if(!saved.attemptId||!saved.token)return clearSaved();
      state.attemptId=saved.attemptId;
      state.token=saved.token;
      const data=await rpc(cfg.rpc.resume,{p_attempt_id:state.attemptId,p_attempt_token:state.token});
      render(data.snapshot);
      if(activityActive())showFullscreenGate('Sesión del equipo recuperada. Vuelvan a pantalla completa para continuar.');
    }catch(err){
      clearSaved();
      setSetupStatus('La sesión anterior ya no está disponible. Pueden registrar nuevamente el equipo.',true);
    }
  }

  restore();
})();
