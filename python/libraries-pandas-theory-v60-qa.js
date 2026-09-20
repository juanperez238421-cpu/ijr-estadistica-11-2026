(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  if ((params.get('topic') || 'operations') !== 'logic') return;

  const VERSION='v60';
  let timer=null;
  const px=v=>Number.parseFloat(String(v||'0'))||0;

  function run(){
    if(document.documentElement.dataset.librariesPandasTheory!==VERSION) return null;

    const failures=[];
    const root=document.getElementById('librariesPandasTheoryV60');
    const apps=root?.querySelectorAll('.p60-app-card')||[];
    const modules=root?.querySelectorAll('.p60-module')||[];
    const classCards=root?.querySelectorAll('.p60-route-grid article')||[];
    const workbook=root?.querySelector('a[href*="pandas_excel_students.xlsx"]');
    const code=root?.querySelector('.p60-code code');

    if(!root) failures.push('V60 root missing');
    if(classCards.length!==2) failures.push('expected 2 class cards, found '+classCards.length);
    if(apps.length!==8) failures.push('expected 8 real library examples, found '+apps.length);
    if(modules.length!==6) failures.push('expected 6 compact theory modules, found '+modules.length);
    if(!workbook) failures.push('real workbook link missing');
    if(code && px(getComputedStyle(code).fontSize)<13.5) failures.push('code text too small: '+getComputedStyle(code).fontSize);

    ['#conceptSection','.theory-diagrams-section','#syntaxSection','#pitfallSection','#pandasTwoClassTheoryV59','#pandasGuidedTheoryV58'].forEach(selector=>{
      document.querySelectorAll(selector).forEach(el=>{
        if(el.offsetParent!==null) failures.push('superseded theory visible: '+selector);
      });
    });

    root?.querySelectorAll('.p60-section,.p60-app-card,.p60-module,.p60-real').forEach(el=>{
      const style=getComputedStyle(el);
      if(!['auto','scroll'].includes(style.overflowX) && el.scrollWidth>el.clientWidth+4) failures.push('horizontal overflow: '+el.className);
    });

    let out=document.getElementById('pandasV60Qa');
    if(!out){
      out=document.createElement('output');
      out.id='pandasV60Qa';
      out.hidden=true;
      document.body.appendChild(out);
    }
    const pass=failures.length===0;
    out.dataset.qa=pass?'pass':'fail';
    out.dataset.failureCount=String(failures.length);
    out.textContent=pass?'PASS':failures.join(' | ');
    document.documentElement.dataset.pandasV60Qa=pass?'pass':'fail';
    document.documentElement.dataset.pandasV60QaFailures=String(failures.length);
    return {pass,failures};
  }

  function schedule(delay=650){
    clearTimeout(timer);
    timer=setTimeout(run,delay);
  }

  function install(){
    schedule(900);
    setTimeout(run,1800);
    setTimeout(run,3500);
    window.addEventListener('resize',()=>schedule(450),{passive:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();