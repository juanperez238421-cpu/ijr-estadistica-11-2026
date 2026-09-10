const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'http://127.0.0.1:4173';
const SESSION_KEY = 'ijr-stat11-python-hub-active-session-v20';
const QA_GROUP = '11A';
const QA_REGISTRATION = '00000000-0000-4000-8000-000000000038';
const QA_ACCESS_TOKEN = 'browser-e2e-v38-non-production-token';
const GLOBAL_TIMEOUT_MS = 50000;
const phase = message => console.log(`[arrays-e2e] ${message}`);

function arraysSnapshot() {
  const items = Array.from({ length: 12 }, (_, index) => ({ key:`arr-${String(index + 1).padStart(2,'0')}`, correct:false, completed:false, tries:0 }));
  return {
    registration:{ id:QA_REGISTRATION, display_id:'REG-E2EV38', mode:'individual', group_code:QA_GROUP, team_size:1, display_label:'Browser QA student', status:'active' },
    members:[],
    topics:[{ slug:'arrays', sequence:3, title:'Arrays and Python lists', nav:'Arrays / lists', status:'available', correct_count:0, total_count:12, percent:0, items }],
    current_topic:'arrays', completed_topics:0, total_topics:16
  };
}

async function waitForServer() {
  for (let i=0; i<40; i+=1) {
    try { const response=await fetch(`${ORIGIN}/python/workshop.html?topic=arrays`); if(response.ok) return; } catch {}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  throw new Error('Local static server did not start.');
}

async function startupState(page, appId, pageErrors) {
  try {
    return { state:await page.evaluate(({appId,sessionKey})=>{
      const app=document.getElementById(appId), access=document.getElementById('accessPanel');
      return {
        href:location.href, readyState:document.readyState,
        appExists:Boolean(app), appClass:app?.className||null,
        accessExists:Boolean(access), accessClass:access?.className||null,
        accessText:access?.innerText?.slice(0,800)||'', badge:document.getElementById('sessionBadge')?.textContent||'',
        storedSession:localStorage.getItem(sessionKey), supabaseCapture:window.IJR_SUPABASE_CAPTURE_V38||null,
        studentTransport:window.IJR_STUDENT_TRANSPORT_V38||null, bootstrap:window.IJR_WORKSHOP_BOOTSTRAP_V33||null,
        masterContext:window.IJR_MASTER_CONTEXT_V34||null, hasSupabase:Boolean(window.supabase)
      };
    },{appId,sessionKey:SESSION_KEY}), pageErrors:[...pageErrors] };
  } catch(error) { return {state:{evaluationError:error.message},pageErrors:[...pageErrors]}; }
}

async function visibleOutcome(page,appId,pageErrors){
  try{
    await page.waitForFunction(({appId})=>{
      const app=document.getElementById(appId), access=document.getElementById('accessPanel');
      return Boolean(app&&access&&(!app.classList.contains('hidden')||!access.classList.contains('hidden')));
    },{appId},{timeout:10000});
  }catch(error){ throw new Error(`${appId} startup timeout: ${error.message}\n${JSON.stringify(await startupState(page,appId,pageErrors),null,2)}`); }
  if(await page.locator('#accessPanel').evaluate(el=>!el.classList.contains('hidden'))){
    throw new Error(`Access/recovery panel appeared instead of ${appId}.\n${JSON.stringify(await startupState(page,appId,pageErrors),null,2)}`);
  }
}

async function run(){
  phase('spawn-static-server');
  const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1','--directory',ROOT],{stdio:'ignore'});
  let browser;
  try{
    await waitForServer(); phase('server-ready');
    browser=await chromium.launch({headless:true}); phase('browser-launched');
    const context=await browser.newContext(); phase('context-created');
    await context.addInitScript(({key,session})=>{try{localStorage.setItem(key,JSON.stringify(session));}catch{}},{
      key:SESSION_KEY,
      session:{registrationId:QA_REGISTRATION,accessToken:QA_ACCESS_TOKEN,fingerprint:'',groupCode:QA_GROUP,emails:['browser.qa@ijr.edu.co'],mode:'individual',authProtected:true,savedAt:new Date().toISOString()}
    }); phase('session-init-installed');

    let resumeRequests=0,resumeApiKeyHeaders=0;
    const snapshot=arraysSnapshot();
    await context.route('**/rest/v1/rpc/python_hub_resume_v1',async route=>{
      const request=route.request(); resumeRequests+=1;
      if(request.headers().apikey?.startsWith('sb_publishable_')) resumeApiKeyHeaders+=1;
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({snapshot})});
    });
    await context.route('**/pyodide/v0.27.7/**',route=>route.abort('blockedbyclient'));
    phase('routes-installed');

    const page=await context.newPage(); phase('page-created');
    const pageErrors=[];
    page.on('pageerror',error=>pageErrors.push(`pageerror: ${error.message}`));
    page.on('requestfailed',request=>{const url=request.url(); if(url.startsWith(ORIGIN)||/supabase-js/.test(url)) pageErrors.push(`requestfailed: ${url} :: ${request.failure()?.errorText||'unknown'}`);});

    phase('workshop-goto-start');
    await page.goto(`${ORIGIN}/python/workshop.html?topic=arrays`,{waitUntil:'domcontentloaded',timeout:12000});
    phase('workshop-domcontentloaded');
    await visibleOutcome(page,'workshopApp',pageErrors); phase('workshop-visible');

    const transport=await page.evaluate(()=>window.IJR_STUDENT_TRANSPORT_V38||null); phase(`workshop-transport-${transport?.mode||'missing'}`);
    if(!transport?.ready||transport.mode!=='official-supabase-js') throw new Error(`Student workshop transport invalid: ${JSON.stringify(transport)}`);
    const badge=(await page.locator('#sessionBadge').innerText()).trim();
    const title=(await page.locator('#workshopHero h1').innerText()).trim();
    const stageCount=await page.locator('#stageButtons button').count();
    if(!badge.startsWith('11A ·')) throw new Error(`Unexpected workshop badge: ${badge}`);
    if(!/Arrays and Python lists/i.test(title)) throw new Error(`Wrong workshop title: ${title}`);
    if(stageCount!==12) throw new Error(`Expected 12 Arrays stages, got ${stageCount}`);
    for(const id of ['#codeEditor','#runCode','#validateCode']) if(!(await page.locator(id).isVisible())) throw new Error(`${id} is not visible.`);
    phase('workshop-contracts-pass');

    phase('theory-goto-start');
    await page.goto(`${ORIGIN}/python/theory.html?topic=arrays`,{waitUntil:'domcontentloaded',timeout:12000});
    phase('theory-domcontentloaded');
    await visibleOutcome(page,'theoryApp',pageErrors); phase('theory-visible');
    const theoryTitle=(await page.locator('#theoryHero h1').innerText()).trim();
    if(!/Arrays and Python lists/i.test(theoryTitle)) throw new Error(`Wrong theory title: ${theoryTitle}`);
    const figureCount=await page.locator('.array-anatomy-v34, .array-index-v34, .array-append-v34, .array-summary-v34, .array-mean-v34, .array-dataset-v34').count();
    if(figureCount<6) throw new Error(`Expected at least 6 Arrays visual figures, got ${figureCount}`);
    if(resumeRequests<2||resumeApiKeyHeaders<2) throw new Error(`Official SDK resume transport missing: requests=${resumeRequests}, apikey=${resumeApiKeyHeaders}`);
    if(pageErrors.length) throw new Error(`Critical browser errors:\n${pageErrors.join('\n')}`);
    phase('all-contracts-pass');
    console.log(`STUDENT ARRAYS BROWSER E2E V38 PASS transport=${transport.mode} resume=${resumeRequests} apikey=${resumeApiKeyHeaders} stages=${stageCount} figures=${figureCount}`);
  }finally{
    phase('cleanup-start');
    if(browser) await Promise.race([browser.close().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,2000))]);
    if(!server.killed) server.kill('SIGKILL');
    phase('cleanup-done');
  }
}

const timer=setTimeout(()=>{console.error(`Global E2E timeout after ${GLOBAL_TIMEOUT_MS} ms.`);process.exit(1);},GLOBAL_TIMEOUT_MS); timer.unref();
run().then(()=>{clearTimeout(timer);process.exit(0);}).catch(error=>{clearTimeout(timer);console.error(error.stack||error);process.exit(1);});
