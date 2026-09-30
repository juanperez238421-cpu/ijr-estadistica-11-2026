'use strict';
let py,output=[];
self.onmessage=async({data})=>{
 const {id,code,support,source}=data;
 try{
  if(!py){self.postMessage({id,status:'loading'});importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');py=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'});py.setStdout({batched:t=>output.push(t)});py.setStderr({batched:t=>output.push(t)});}
  output=[];py.globals.set('SERVER_TAIL',support.serverTail);py.globals.set('PROBE_SOURCE',support.probe);py.globals.set('LAB_SOURCE',source);
  const result=await py.runPythonAsync(code);if(result!==undefined&&result!==null){output.push(String(result));result?.destroy?.();}
  const preview=py.globals.has('lab_output')?py.runPython('__import__("json").dumps(lab_output, ensure_ascii=False)'):null;
  self.postMessage({id,ok:true,output:output.join('\n'),preview});
 }catch(e){self.postMessage({id,ok:false,output:output.join('\n'),error:String(e.message||e)});}
};
