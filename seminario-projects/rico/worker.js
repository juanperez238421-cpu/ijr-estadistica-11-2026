'use strict';
let py=null;
let output=[];
self.onmessage=async({data})=>{
  const {id,code}=data;
  try{
    if(!py){
      self.postMessage({id,status:'loading'});
      importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');
      py=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'});
      py.setStdout({batched:t=>output.push(t)});
      py.setStderr({batched:t=>output.push(t)});
    }
    output=[];
    const result=await py.runPythonAsync(code);
    if(result!==undefined && result!==null){output.push(String(result));result?.destroy?.();}
    let preview=null;
    if(py.globals.has('preview_frames')){
      preview=py.runPython('__import__("json").dumps(preview_frames, ensure_ascii=False)');
    }
    const config=py.globals.has('config')?py.runPython('__import__("json").dumps(__import__("dataclasses").asdict(config), ensure_ascii=False)'):null;
    self.postMessage({id,ok:true,output:output.join('\n'),preview,config});
  }catch(e){self.postMessage({id,ok:false,output:output.join('\n'),error:String(e.message||e)});}
};
