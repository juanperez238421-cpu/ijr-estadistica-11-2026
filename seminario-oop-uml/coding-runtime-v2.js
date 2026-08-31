(() => {
  'use strict';
  const INDEX='https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
  const VERSION='Pyodide 0.27.7';
  const state={runtime:null,runs:0,successfulRuns:0,lastOk:false,lastOutput:'',lastCode:'',mounted:false,cells:new Map()};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const storageKey=(mode,topic)=>`ijr-seminar-oop-uml-v2:${mode}:s${String(topic).padStart(2,'0')}`;

  function setStatus(text,kind='idle'){
    const el=document.getElementById('oopRuntimeStatus');
    if(!el)return;
    el.textContent=text;
    el.className=`runtime-status ${kind}`;
  }
  function terminal(){return document.getElementById('oopTerminalOutput');}
  function write(message,kind='stdout'){
    const out=terminal(); if(!out)return;
    const line=document.createElement('div'); line.className=`terminal-line ${kind}`; line.textContent=String(message);
    out.appendChild(line); out.scrollTop=out.scrollHeight;
    state.lastOutput=(state.lastOutput+'\n'+String(message)).trim().slice(-4000);
  }
  function clearTerminal(){const out=terminal();if(out)out.innerHTML='';state.lastOutput='';}

  async function ensureRuntime(){
    if(state.runtime)return state.runtime;
    if(typeof globalThis.loadPyodide!=='function')throw new Error('Pyodide loader is unavailable. Check the network connection and reload the page.');
    setStatus('Loading Python…','loading');
    const py=await globalThis.loadPyodide({indexURL:INDEX});
    py.setStdout({batched:m=>write(m,'stdout')});
    py.setStderr({batched:m=>write(m,'stderr')});
    state.runtime=py;
    setStatus('Python ready','ready');
    write(`${VERSION} ready · persistent page session`,'system');
    return py;
  }

  async function runCode(code,label='cell'){
    const source=String(code||'');
    if(!source.trim()){write(`[${label}] Nothing to run.`,'system');return {ok:false,empty:true};}
    const py=await ensureRuntime();
    state.runs+=1; state.lastCode=source; state.lastOk=false;
    write(`>>> run ${label}`,'command');
    try{
      const result=await py.runPythonAsync(source);
      if(result!==undefined&&result!==null){
        let rendered;
        try{rendered=typeof result==='object'&&result?.toString?result.toString():String(result);}catch{rendered='[result]';}
        if(rendered!=='None'&&rendered!=='undefined')write(rendered,'result');
        try{result?.destroy?.();}catch{}
      }
      state.successfulRuns+=1; state.lastOk=true;
      write(`✓ ${label} completed without a Python exception`,'success');
      document.dispatchEvent(new CustomEvent('ijr-oop-cell-run',{detail:{label,ok:true,code:source,runs:state.runs,successfulRuns:state.successfulRuns}}));
      return {ok:true};
    }catch(error){
      const message=String(error?.message||error||'Python execution failed');
      write(message,'stderr');
      document.dispatchEvent(new CustomEvent('ijr-oop-cell-run',{detail:{label,ok:false,code:source,runs:state.runs,successfulRuns:state.successfulRuns}}));
      return {ok:false,error:message};
    }
  }

  async function resetRuntime(){
    if(!state.runtime){clearTerminal();return;}
    try{
      await state.runtime.runPythonAsync(`for __ijr_name in list(globals()):\n    if not __ijr_name.startswith('__') and __ijr_name not in ('__ijr_name',):\n        del globals()[__ijr_name]\ndel __ijr_name`);
    }catch{}
    state.runs=0;state.successfulRuns=0;state.lastOk=false;state.lastCode='';clearTerminal();write(`${VERSION} namespace reset`,'system');
    document.dispatchEvent(new CustomEvent('ijr-oop-runtime-reset'));
  }

  function loadDraft(key){try{return JSON.parse(localStorage.getItem(key)||'null')||{};}catch{return {};}}
  function saveDraft(key){
    const payload={}; state.cells.forEach((entry,id)=>payload[id]=entry.textarea.value);
    try{localStorage.setItem(key,JSON.stringify(payload));}catch{}
  }

  function renderCell(item,draft,mode){
    const saved=typeof draft[item.id]==='string'?draft[item.id]:item.code;
    const steps=(item.steps||[]).map((x,i)=>`<li><strong>STEP ${i+1}</strong><span>${esc(x)}</span></li>`).join('');
    return `<article class="colab-cell" data-cell-id="${esc(item.id)}">
      <div class="cell-gutter"><button type="button" class="cell-play" aria-label="Run ${esc(item.title)}">▶</button><span class="exec-count">[ ]</span></div>
      <div class="cell-body">
        <div class="cell-heading"><div><span class="cell-kicker">${mode==='theory'?'GUIDED THEORY CELL':'GUIDED WORKSHOP CELL'}</span><h3>${esc(item.title)}</h3><p>${esc(item.purpose)}</p></div><span class="cell-runtime-badge">Python</span></div>
        <ol class="cell-guide">${steps}</ol>
        <textarea class="code-editor" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Python code editor">${esc(saved)}</textarea>
        <div class="cell-actions"><button type="button" class="button button-dark run-cell">Run cell</button><button type="button" class="button button-light reset-cell">Reset code</button><span class="cell-state">Not run yet</span></div>
      </div>
    </article>`;
  }

  function terminalHtml(lang){
    const note=lang==='java'?'<div class="runtime-language-note"><strong>Java track:</strong> the embedded executable notebook uses Python as the live OOP model. Keep your Java implementation synchronized with the same UML decisions.</div>':'';
    return `${note}<section class="python-terminal-shell">
      <div class="terminal-head"><div><span class="terminal-dot"></span><strong>Python Terminal</strong><small>${VERSION}</small></div><div><span id="oopRuntimeStatus" class="runtime-status idle">Runtime idle</span><button type="button" id="clearTerminal" class="terminal-tool">Clear</button><button type="button" id="resetRuntime" class="terminal-tool">Reset runtime</button></div></div>
      <div id="oopTerminalOutput" class="terminal-output" role="log" aria-live="polite"></div>
      <div class="terminal-repl"><span>&gt;&gt;&gt;</span><input id="oopTerminalInput" type="text" autocomplete="off" spellcheck="false" placeholder="Type a Python expression or one-line statement"><button type="button" id="runTerminalCommand">Run</button></div>
    </section>`;
  }

  function bindCell(root,item,key){
    const article=root.querySelector(`[data-cell-id="${CSS.escape(item.id)}"]`);
    const textarea=article.querySelector('.code-editor'),play=article.querySelector('.cell-play'),run=article.querySelector('.run-cell'),reset=article.querySelector('.reset-cell'),status=article.querySelector('.cell-state'),count=article.querySelector('.exec-count');
    const entry={textarea,item,runs:0,lastOk:false}; state.cells.set(item.id,entry);
    const execute=async()=>{
      play.disabled=run.disabled=true; status.textContent='Running…'; status.className='cell-state running';
      const result=await runCode(textarea.value,item.id); entry.runs+=1;entry.lastOk=result.ok===true;count.textContent=`[${entry.runs}]`;
      status.textContent=result.ok?'Executed successfully':'Python error — inspect terminal';status.className=`cell-state ${result.ok?'ok':'error'}`;
      play.disabled=run.disabled=false; saveDraft(key);
    };
    play.addEventListener('click',execute);run.addEventListener('click',execute);
    reset.addEventListener('click',()=>{textarea.value=item.code;entry.lastOk=false;status.textContent='Code reset';status.className='cell-state';saveDraft(key);textarea.focus();});
    textarea.addEventListener('input',()=>saveDraft(key));
    textarea.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();execute();}});
  }

  function mount({mode='theory',topicNumber=1,lang='python'}={}){
    const target=document.getElementById(mode==='workshop'?'workshopCodingLab':'theoryCodingLab');
    if(!target)return;
    const catalog=window.IJR_OOP_CODING_LABS?.[Number(topicNumber)];
    const items=catalog?.[mode]; if(!items?.length)return;
    state.cells.clear();state.runs=0;state.successfulRuns=0;state.lastOk=false;state.lastOutput='';state.lastCode='';
    const key=storageKey(mode,topicNumber),draft=loadDraft(key);
    target.innerHTML=`<div class="notebook-intro"><div><p class="eyebrow">LIVE COLAB-STYLE NOTEBOOK</p><h2>${mode==='theory'?'Read → edit → run → explain':'Model → code → run → test → modify'}</h2><p>Every cell is editable. Run cells in order so classes and objects remain available in the same Python session. Use <strong>Ctrl/⌘ + Enter</strong> to execute the focused cell.</p></div><div class="notebook-rule"><strong>Runtime rule</strong><span>Python exceptions are learning feedback. Fix the code and run again.</span></div></div>${items.map(item=>renderCell(item,draft,mode)).join('')}${terminalHtml(lang)}`;
    items.forEach(item=>bindCell(target,item,key));
    document.getElementById('clearTerminal')?.addEventListener('click',clearTerminal);
    document.getElementById('resetRuntime')?.addEventListener('click',resetRuntime);
    const input=document.getElementById('oopTerminalInput'),runCommand=()=>{const value=input?.value||'';if(!value.trim())return;runCode(value,'terminal');input.value='';};
    document.getElementById('runTerminalCommand')?.addEventListener('click',runCommand);input?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();runCommand();}});
    state.mounted=true;
  }

  function evidence(){
    const cells={}; let combined=''; let implementOk=false,testOk=false;
    state.cells.forEach((entry,id)=>{cells[id]={code:entry.textarea.value,runs:entry.runs,last_ok:entry.lastOk};combined+=`\n\n# --- ${id} ---\n${entry.textarea.value}`;if(id==='implement'&&entry.lastOk)implementOk=true;if(id==='test'&&entry.lastOk)testOk=true;});
    return {runtime:'pyodide-0.27.7',run_count:state.runs,successful_run_count:state.successfulRuns,run_success:state.lastOk,implement_success:implementOk,test_success:testOk,code_snapshot:combined.trim().slice(0,12000),last_output:state.lastOutput.slice(-4000),cells};
  }

  window.IJR_OOP_NOTEBOOK={mount,evidence,runCode,resetRuntime,clearTerminal};
})();
