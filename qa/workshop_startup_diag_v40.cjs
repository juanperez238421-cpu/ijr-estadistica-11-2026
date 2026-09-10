const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'http://127.0.0.1:4174';
const SESSION_KEY = 'ijr-stat11-python-hub-active-session-v20';
const REG = '00000000-0000-4000-8000-000000000040';
const TOKEN = 'local-browser-v40-token';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function chromePath() {
  for (const p of ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']) {
    try { execFileSync('test', ['-x', p]); return p; } catch {}
  }
  throw new Error('No system Chromium/Chrome binary found.');
}
function snapshot() {
  return {
    registration:{id:REG,display_id:'REG-V40',mode:'individual',group_code:'11A',team_size:1,display_label:'QA',status:'active'},
    members:[],
    topics:[{slug:'arrays',sequence:3,title:'Arrays and Python lists',nav:'Arrays / lists',status:'available',correct_count:0,total_count:12,percent:0,items:Array.from({length:12},(_,i)=>({key:`arr-${String(i+1).padStart(2,'0')}`,sequence:i+1,title:`Stage ${i+1}`,mode:'code',correct:false,tries:0}))}],
    current_topic:'arrays',completed_topics:0,total_topics:16
  };
}

(async()=>{
  const server=spawn('python3',['-m','http.server','4174','--bind','127.0.0.1','--directory',ROOT],{stdio:'ignore'});
  let browser;
  try {
    for(let i=0;i<30;i++){try{const r=await fetch(`${ORIGIN}/python/workshop.html`);if(r.ok)break;}catch{} await sleep(100);}
    browser=await chromium.launch({headless:true,executablePath:chromePath(),args:['--no-sandbox']});
    const context=await browser.newContext();
    await context.addInitScript(({key,reg,token})=>{
      try { localStorage.setItem(key,JSON.stringify({registrationId:reg,accessToken:token,groupCode:'11A',mode:'individual',savedAt:new Date().toISOString()})); } catch {}
    },{key:SESSION_KEY,reg:REG,token:TOKEN});
    let hits=0;
    await context.route('**/rest/v1/rpc/python_hub_resume_v1',async route=>{hits++;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({snapshot:snapshot()})});});
    const page=await context.newPage();
    const consoleLog=[]; const pageErrors=[]; const failed=[];
    page.on('console',m=>consoleLog.push(`${m.type()}: ${m.text()}`));
    page.on('pageerror',e=>pageErrors.push(e.message));
    page.on('requestfailed',r=>failed.push(`${r.url()} :: ${r.failure()?.errorText}`));
    await page.goto(`${ORIGIN}/python/workshop.html?topic=arrays`,{waitUntil:'domcontentloaded',timeout:15000});
    await sleep(3000);
    const state=await page.evaluate(key=>({
      ready:document.readyState,
      url:location.href,
      appClass:document.getElementById('workshopApp')?.className,
      accessClass:document.getElementById('accessPanel')?.className,
      accessText:document.getElementById('accessPanel')?.innerText,
      badge:document.getElementById('sessionBadge')?.textContent,
      session:localStorage.getItem(key),
      config:Boolean(window.IJR_PYTHON_HUB_CONFIG),
      topics:Array.isArray(window.IJR_PYTHON_HUB_TOPICS)?window.IJR_PYTHON_HUB_TOPICS.length:null,
      arrayExercises:window.IJR_PYTHON_HUB_TOPIC_MAP?.arrays?.exercises?.length ?? null,
      supabase:Boolean(window.supabase?.createClient),
      reliability:window.IJR_WORKSHOP_RELIABILITY_V40 || null,
      retryBoot:typeof window.IJR_WORKSHOP_RETRY_BOOT,
      hero:document.getElementById('workshopHero')?.innerText,
      stageCount:document.querySelectorAll('#stageButtons button').length
    }),SESSION_KEY);
    console.log('RESUME_HITS='+hits);
    console.log('STATE='+JSON.stringify(state));
    console.log('PAGE_ERRORS='+JSON.stringify(pageErrors));
    console.log('CONSOLE='+JSON.stringify(consoleLog));
    console.log('FAILED='+JSON.stringify(failed));
    if(!state.appClass || state.appClass.includes('hidden')) process.exitCode=1;
    if(hits<1) process.exitCode=1;
    if(state.stageCount!==12) process.exitCode=1;
    await context.close();
  } finally {
    if(browser) await browser.close().catch(()=>{});
    server.kill('SIGKILL');
  }
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
