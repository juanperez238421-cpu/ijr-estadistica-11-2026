(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const course=window.RICO_COURSE;
  const n=Math.max(1,Math.min(4,Math.trunc(Number(new URLSearchParams(location.search).get('class'))||1)));
  const lesson=course[n-1];let active=0,worker=null,request=0,busy=false,ready=false,player=null,preview=null,configSnapshot=null;
  const pending=new Map();const key='ijr-rico-message-colab-v1';
  let saved;
  try{saved=JSON.parse(localStorage.getItem(key)||'{}');}catch{saved={};}
  if(!saved || typeof saved!=='object')saved={};
  saved.cells=saved.cells||{};saved.notes=saved.notes||{};
  const cellKey=(c,item)=>`${c}:${item.id}`;
  const item=()=>lesson.cells[active];
  const entry=(c,it)=>saved.cells[cellKey(c,it)]||{};
  const source=(c,it)=>typeof entry(c,it).code==='string'?entry(c,it).code:it.code;
  function persist(){try{localStorage.setItem(key,JSON.stringify(saved));$('saveStatus').textContent='Borrador guardado en este navegador · descarga tu evidencia para conservarla.';}catch{$('saveStatus').textContent='No se pudo guardar el borrador: descarga tu notebook y evidencia.';}}
  function saveCode(invalidate=false){const it=item(),id=cellKey(n,it),e=entry(n,it);saved.cells[id]={...e,code:$('codeEditor').value,...(invalidate?{ok:false}: {})};persist();}
  function log(text){$('terminalOutput').textContent+=String(text)+'\n';$('terminalOutput').scrollTop=$('terminalOutput').scrollHeight;}
  function badge(text,kind){$('runtimeBadge').textContent=text;$('runtimeBadge').className='runtime-badge '+kind;}
  function renderRail(){
    $('stepRail').innerHTML='';lesson.cells.forEach((it,i)=>{const b=document.createElement('button');b.className='rail-step'+(i===active?' active':'')+(entry(n,it).ok?' done':'');b.textContent=i+1;b.title=it.title;b.setAttribute('aria-current',i===active?'step':'false');b.disabled=busy;b.onclick=()=>select(i);$('stepRail').appendChild(b);});
    const done=lesson.cells.filter(it=>entry(n,it).ok).length;$('progressBar').style.width=(done/lesson.cells.length*100)+'%';
  }
  function select(i){if(busy)return;saveCode();active=Math.max(0,Math.min(lesson.cells.length-1,i));render();}
  function render(){
    const it=item(),e=entry(n,it);$('cellTitle').textContent=it.title;$('codeInstruction').textContent=it.purpose;$('codeEditor').value=source(n,it);$('lessonTitle').textContent=it.title;$('lessonConcept').textContent=it.purpose;
    $('lessonSteps').innerHTML='';it.steps.forEach(t=>{const li=document.createElement('li');li.textContent=t;$('lessonSteps').appendChild(li);});
    $('executionCount').textContent=e.runs?`[${e.runs}]`:'[ ]';$('activityStatus').textContent=e.ok?'Última ejecución correcta · vuelve a ejecutar para restaurar el estado':'Celda pendiente o editada';$('activityStatus').className='validation-status'+(e.ok?' ok':'');
    $('previousCell').disabled=active===0||busy;$('nextCell').disabled=active===lesson.cells.length-1||busy;renderRail();
  }
  function lock(value){busy=value;for(const id of ['runCellButton','runCodeButton','resetCodeButton','downloadNotebook','downloadPython','downloadEvidence','restartRuntime'])$(id).disabled=value;$('codeEditor').readOnly=value;$('terminalCommand').disabled=value;$('terminalForm').querySelector('button').disabled=value;$('previousCell').disabled=value||active===0;$('nextCell').disabled=value||active===lesson.cells.length-1;$('classNav').style.pointerEvents=value?'none':'';renderRail();}
  function resetWorker(reason='Runtime reiniciado. Ejecuta las celdas de nuevo.'){
    worker?.terminate();worker=null;ready=false;for(const [id,p] of pending){clearTimeout(p.timer);p.reject(new Error(reason));}pending.clear();badge('Python por iniciar','offline');
  }
  function run(code){
    if(!worker){worker=new Worker('worker.js?v=1');worker.onmessage=({data})=>{const p=pending.get(data.id);if(!p)return;if(data.status==='loading'){badge('Cargando Python…','loading');return;}clearTimeout(p.timer);pending.delete(data.id);badge('Python listo','ready');p.resolve(data);};worker.onerror=()=>resetWorker('No se pudo cargar Python. Revisa la conexión y vuelve a ejecutar.');}
    const id=++request;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>resetWorker('Tiempo agotado: Python se reinició. Revisa bucles infinitos o vuelve a intentar si la carga fue lenta.'),60000);pending.set(id,{resolve,reject,timer});worker.postMessage({id,code});});
  }
  async function prepare(){
    if(ready)return;
    const dependencies=[];
    if(n>=2){dependencies.push([1,course[0].cells[0]]);if(entry(1,course[0].cells[3]).ok)dependencies.push([1,course[0].cells[1]],[1,course[0].cells[3]]);}
    if(n>=3){dependencies.push([2,course[1].cells[0]]);if(entry(2,course[1].cells[2]).ok)dependencies.push([2,course[1].cells[2]]);}
    if(n>=4 && entry(3,course[2].cells[2]).ok)dependencies.push([3,course[2].cells[2]]);
    for(const [c,it] of dependencies){log(`>>> Dependencia guardada C${c}: ${it.title}`);const r=await run(source(c,it));log(r.output);if(!r.ok)throw new Error(`Corrige la dependencia C${c} en su celda:\n${r.error}`);}
    ready=true;
  }
  function updatePreview(raw){
    if(!raw)return;const next=JSON.parse(raw);player?.pause();player=window.RICO_PLAYER.createPlayer($('animationCanvas'),next,(a,b)=>$('frameInfo').textContent=`${a} / ${b} cuadros · ${next.fps} FPS`);preview=next;
    for(const id of ['playPreview','pausePreview','downloadAnimation'])$(id).disabled=false;player.play();
  }
  async function execute(code,terminal=false){
    if(busy)return;saveCode();lock(true);$('activityStatus').textContent='Ejecutando Python…';$('terminalOutput').classList.remove('error');
    try{
      await prepare();log(`>>> ${terminal?'Terminal':item().title}`);const result=await run(code);log(result.output);if(!result.ok){log(result.error);$('terminalOutput').classList.add('error');}
      if(result.ok){updatePreview(result.preview);if(result.config)configSnapshot=result.config;}
      if(!terminal){const id=cellKey(n,item()),e=entry(n,item());saved.cells[id]={...e,code,runs:(e.runs||0)+1,ok:result.ok,output:result.output,error:result.error||'',executedAt:new Date().toISOString()};persist();$('executionCount').textContent=`[${saved.cells[id].runs}]`;}
      $('activityStatus').textContent=result.ok?'Python ejecutado · revisa las pruebas y la vista previa':'Error Python real · corrige y vuelve a ejecutar';$('activityStatus').className='validation-status '+(result.ok?'ok':'bad');
    }catch(e){log(e.message);$('activityStatus').textContent='No se completó la ejecución · revisa la consola';$('activityStatus').className='validation-status bad';}
    finally{lock(false);}
  }
  function download(name,text,type='text/plain'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function notebook(){saveCode();return {nbformat:4,nbformat_minor:5,metadata:{kernelspec:{display_name:'Python 3',language:'python',name:'python3'},language_info:{name:'python'}},cells:course.flatMap((c,i)=>[{cell_type:'markdown',metadata:{},source:[`# Clase ${i+1}: ${c.title}\n${c.lead}\n`]},...c.cells.map(it=>({cell_type:'code',execution_count:null,metadata:{},outputs:[],source:source(i+1,it).split(/(?<=\n)/)}))])};}
  $('classLabel').textContent=`Clase ${n} / 4 · ${lesson.title}`;$('lessonTag').textContent=`C${n} · WORKSHOP`;$('classGate').textContent=lesson.gate;$('uml').textContent=lesson.uml.join(' → ');
  for(const id of ['theoryLink','theorySide'])$(id).href='theory.html?class='+n;
  course.forEach((c,i)=>{const a=document.createElement('a');a.href='workshop.html?class='+(i+1);a.className='class-link'+(i+1===n?' active':'');a.textContent='Clase '+(i+1);$('classNav').appendChild(a);});
  $('runCodeButton').onclick=$('runCellButton').onclick=()=>execute($('codeEditor').value);
  $('codeEditor').addEventListener('input',()=>{saveCode(true);$('activityStatus').textContent='Código editado · vuelve a ejecutar';renderRail();});
  $('codeEditor').addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();execute($('codeEditor').value);}});
  $('resetCodeButton').onclick=()=>{$('codeEditor').value=item().code;saveCode(true);render();};
  $('previousCell').onclick=()=>select(active-1);$('nextCell').onclick=()=>select(active+1);
  $('clearTerminalButton').onclick=()=>{$('terminalOutput').textContent='';};
  $('terminalForm').onsubmit=e=>{e.preventDefault();const code=$('terminalCommand').value;if(code.trim())execute(code,true);};
  $('playPreview').onclick=()=>player?.play();$('pausePreview').onclick=()=>player?.pause();
  $('downloadAnimation').onclick=()=>{if(preview)download('mensaje-rico.html',window.RICO_PLAYER.standalone(preview),'text/html');};
  $('downloadNotebook').onclick=()=>download('rico-mensaje.ipynb',JSON.stringify(notebook(),null,2),'application/x-ipynb+json');
  $('downloadPython').onclick=()=>{saveCode();let code=source(1,course[0].cells[0])+'\n'+source(2,course[1].cells[0]);if(configSnapshot)code+='\nconfig = Config(**json.loads('+JSON.stringify(configSnapshot)+')).validate()\nscene = Scene(config)\npreview_frames = scene.render()\n';const renderer=window.RICO_PLAYER.standalone({fps:1,frames:[{width:720,height:480,background:'#14142b',shapes:[]}]});const before=renderer.indexOf('const data=');const after=renderer.indexOf(';const player=',before);const prefix=renderer.slice(0,before)+'const data=';const suffix=renderer.slice(after);download('crear_mensaje.py',code+'\nfrom pathlib import Path\nhtml = '+JSON.stringify(prefix)+' + json.dumps(preview_frames, ensure_ascii=False).replace("<", "\\\\u003c") + '+JSON.stringify(suffix)+'\nPath(__file__).resolve().with_name("mensaje-rico.html").write_text(html, encoding="utf-8")\nprint("EXPORT: mensaje-rico.html creado junto al generador")\n');};
  $('downloadEvidence').onclick=()=>{saveCode();download('rico-evidencia.json',JSON.stringify({project:'rico-message-animation',exportedAt:new Date().toISOString(),runtime:'Pyodide 0.27.7',cells:saved.cells,notes:saved.notes,preview:{frames:preview?.frames.length||0,fps:preview?.fps||0},approval:'Pendiente de revisión docente; las notas offline son evidencia manual.'},null,2),'application/json');};
  $('evidenceNotes').value=saved.notes[n]||'';$('evidenceNotes').oninput=()=>{saved.notes[n]=$('evidenceNotes').value;persist();};
  $('restartRuntime').onclick=()=>{resetWorker();player?.pause();preview=null;for(const id of ['playPreview','pausePreview','downloadAnimation'])$(id).disabled=true;log('Runtime reiniciado. Los borradores se conservan.');};
  window.addEventListener('beforeunload',()=>worker?.terminate());render();
})();
