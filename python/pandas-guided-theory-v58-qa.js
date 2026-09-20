(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  if((params.get('topic')||'operations')!=='logic') return;

  const VERSION='v58';
  const MIN={body:15,code:14,nav:13,liveEditor:14};
  let timer=null;

  const px=value=>Number.parseFloat(String(value||'0'))||0;
  const visible=el=>el instanceof HTMLElement&&el.offsetParent!==null&&getComputedStyle(el).visibility!=='hidden';

  function overflow(el){
    if(!visible(el)) return false;
    const style=getComputedStyle(el);
    if(['auto','scroll'].includes(style.overflowX)) return false;
    return el.scrollWidth>el.clientWidth+4;
  }

  function audit(){
    const root=document.documentElement;
    if(root.dataset.pandasGuidedTheory!=='v58') return null;

    const failures=[];
    const guide=document.getElementById('pandasGuidedTheoryV58');
    const stage=document.querySelector('#pandasGuidedTheoryV58 .p58-stage');
    const nav=[...document.querySelectorAll('#pandasGuidedTheoryV58 [data-p58-nav]')];
    const code=document.querySelector('#pandasGuidedTheoryV58 .p58-code-line code');
    const body=document.querySelector('#pandasGuidedTheoryV58 .p58-stage-inner header p:not(.eyebrow)');
    const editor=document.querySelector('.p58-live-upgraded .live-editor-v19');
    const practical=document.querySelector('[data-p58-run-practical]');
    const workbook=document.querySelector('#pandasGuidedTheoryV58 a[href*="pandas_excel_students.xlsx"]');

    if(!guide) failures.push('guided section missing');
    if(nav.length!==10) failures.push(`expected 10 stage buttons, found ${nav.length}`);
    if(!stage) failures.push('active stage missing');
    if(!practical) failures.push('practical run control missing');
    if(!workbook) failures.push('real XLSX download link missing');

    if(body&&px(getComputedStyle(body).fontSize)<MIN.body) failures.push(`stage body text too small: ${getComputedStyle(body).fontSize}`);
    if(code&&px(getComputedStyle(code).fontSize)<MIN.code) failures.push(`code text too small: ${getComputedStyle(code).fontSize}`);
    if(nav[0]&&px(getComputedStyle(nav[0]).fontSize)<MIN.nav) failures.push(`navigation text too small: ${getComputedStyle(nav[0]).fontSize}`);
    if(editor&&px(getComputedStyle(editor).fontSize)<MIN.liveEditor) failures.push(`live editor text too small: ${getComputedStyle(editor).fontSize}`);

    [
      '.p58-hero','.p58-foundations','.p58-real-file','.p58-excel-compare',
      '.p58-guided','.p58-stage','.p58-code-shell','.p58-diagram-shell',
      '.p58-practical','.p58-final','.p58-live-upgraded'
    ].forEach(selector=>{
      document.querySelectorAll(selector).forEach(el=>{
        if(overflow(el)) failures.push(`horizontal overflow: ${selector}`);
      });
    });

    let out=document.getElementById('pandasV58Qa');
    if(!out){
      out=document.createElement('output');
      out.id='pandasV58Qa';
      out.hidden=true;
      document.body.appendChild(out);
    }
    const pass=failures.length===0;
    out.dataset.staticQa=pass?'pass':'fail';
    out.dataset.failureCount=String(failures.length);
    out.textContent=pass?'PASS':failures.join(' | ');
    root.dataset.pandasV58Qa=pass?'pass':'fail';
    root.dataset.pandasV58QaFailures=String(failures.length);
    return {pass,failures};
  }

  async function waitForPractical(timeoutMs=120000){
    if(params.get('qaAuto')!=='1') return;
    const root=document.documentElement;
    root.dataset.pandasV58RuntimeQa='running';
    try{
      const button=document.querySelector('[data-p58-run-practical]');
      if(!button) throw new Error('Practical run button missing.');
      button.click();

      const lesson=document.querySelector('[data-pandas-live-key="export-excel"]');
      const output=lesson?.querySelector('[data-pandas-output]');
      const pre=output?.querySelector('pre');
      const download=lesson?.querySelector('[data-pandas-download="analysis_output.xlsx"]');
      if(!lesson||!output||!pre) throw new Error('Export live lesson unavailable.');

      const start=Date.now();
      while(Date.now()-start<timeoutMs){
        if(output.classList.contains('is-error')) throw new Error(pre.textContent||'Practical runtime returned an error.');
        if(output.classList.contains('is-success')){
          const text=pre.textContent||'';
          if(!/Shape:/i.test(text)) throw new Error('Practical output did not report DataFrame shape.');
          if(!/Created analysis_output\.xlsx/i.test(text)) throw new Error('Practical output did not confirm XLSX export.');
          if(!download||download.hidden) throw new Error('Generated XLSX download control is not visible.');
          root.dataset.pandasV58RuntimeQa='pass';
          return;
        }
        await new Promise(resolve=>setTimeout(resolve,300));
      }
      throw new Error('Practical runtime QA timed out.');
    }catch(error){
      root.dataset.pandasV58RuntimeQa='fail';
      root.dataset.pandasV58RuntimeQaError=String(error?.message||error).slice(0,260);
      console.error('[Pandas V58 runtime QA]',error);
    }
  }

  function schedule(delay=500){
    clearTimeout(timer);
    timer=setTimeout(audit,delay);
  }

  function install(){
    schedule(900);
    setTimeout(audit,1800);
    setTimeout(audit,3500);
    setTimeout(waitForPractical,1200);
    window.addEventListener('resize',()=>schedule(450),{passive:true});
    const observer=new ResizeObserver(()=>schedule(650));
    observer.observe(document.documentElement);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();