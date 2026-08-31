import fs from 'node:fs';
import vm from 'node:vm';
import {chromium} from 'playwright';

const BASE=process.env.QA_BASE_URL||'http://127.0.0.1:4173/';
const SUPABASE_URL='https://rlfxnjbqxbozjdzkbwlz.supabase.co';
const PUBLISHABLE='sb_publishable_rmVOQ3Orx49KpW_4uMqYew_c2HpcA87';
const BANK='2026-08-31-v2';
const TRACKS=['web','data-science','cybersecurity','3d-programming','robotics'];

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const absolute=(path)=>new URL(path,BASE).href;

function loadTopics(){
  const ctx={};ctx.window=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('seminario-oop-uml/course-data.js','utf8'),ctx);
  return ctx.IJR_OOP_UML_DATA.topics;
}

async function liveQuestionBankSmoke(){
  for(const slug of TRACKS){
    const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/seminar_track_diagnostic_get_questions`,{
      method:'POST',
      headers:{apikey:PUBLISHABLE,'Content-Type':'application/json'},
      body:JSON.stringify({p_track_slug:slug,p_bank_version:BANK})
    });
    assert(response.ok,`${slug}: live question RPC failed with HTTP ${response.status}`);
    const questions=await response.json();
    assert(Array.isArray(questions)&&questions.length===15,`${slug}: live bank must return 15 questions`);
    assert(questions.filter(q=>q.scored===true).length===12,`${slug}: live bank must expose 12 scored items`);
    assert(questions.filter(q=>q.scored===false).length===3,`${slug}: live bank must expose 3 self-profile items`);
    assert(new Set(questions.map(q=>q.prompt)).size===15,`${slug}: duplicate prompts detected`);
    questions.forEach((q,i)=>{
      assert(q.position===i+1,`${slug}: question positions are not sequential`);
      assert(typeof q.prompt==='string'&&q.prompt.trim().length>=5,`${slug} Q${i+1}: prompt is empty`);
      assert(Array.isArray(q.options)&&q.options.length>=(q.scored?4:5),`${slug} Q${i+1}: option set is incomplete`);
      assert(!Object.hasOwn(q,'correct_option'),`${slug} Q${i+1}: answer key leaked to browser payload`);
    });
  }
  console.log('LIVE SUPABASE READ SMOKE: PASS · 5 banks × 15 questions');
}

function installSupabaseMock(page){
  return page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',async route=>{
    const js=`
      globalThis.supabase={createClient(){return {rpc:async function(name,args){
        const track=(args&&args.p_track_slug)||document.body.dataset.track||'web';
        if(name==='seminar_track_diagnostic_start')return {data:{attempt_id:'00000000-0000-4000-8000-000000000001',track_slug:track,bank_version:'${BANK}',full_name:(args&&args.p_full_name)||'QA Student',group_code:(args&&args.p_group_code)||'11-A',started_at:new Date().toISOString(),status:'in_progress'},error:null};
        if(name==='seminar_track_diagnostic_get_questions'){
          const q=Array.from({length:15},(_,i)=>({id:track+'-qa-q'+String(i+1).padStart(2,'0'),position:i+1,domain:i<4?'foundations':i<8?'applied_reasoning':i<12?'workflow_tools':'self_profile',kind:i<12?'mcq':'likert',prompt:(i<12?'Technical diagnostic':'Self profile')+' '+(i+1)+' · '+track,options:i<12?['Option A','Option B','Option C','Option D']:['Nada','Poco','Intermedio','Bastante','Mucho'],scored:i<12}));
          return {data:q,error:null};
        }
        if(name==='seminar_track_diagnostic_submit')return {data:{attempt_id:'00000000-0000-4000-8000-000000000001',track_slug:track,bank_version:'${BANK}',full_name:'QA Student',group_code:'11-A',status:'completed',score:12,max_score:12,knowledge_percent:100,confidence_percent:50,level:'advanced',domain_scores:{foundations:{score:4,max:4,percent:100},applied_reasoning:{score:4,max:4,percent:100},workflow_tools:{score:4,max:4,percent:100}}},error:null};
        if(name==='seminar_track_diagnostic_snapshot')return {data:{status:'in_progress'},error:null};
        return {data:null,error:null};
      }}}};
    `;
    await route.fulfill({status:200,contentType:'application/javascript',body:js});
  });
}

function monitor(page,label){
  const problems=[];
  page.on('pageerror',e=>problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed',request=>{
    const url=request.url();
    if(url.startsWith(BASE))problems.push(`same-origin request failed: ${url} · ${request.failure()?.errorText||''}`);
  });
  return ()=>assert(problems.length===0,`${label}: browser problems\n${problems.join('\n')}`);
}

async function specializedBrowserSmoke(browser){
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await installSupabaseMock(page);
  let check=monitor(page,'Specialized master');
  await page.goto(absolute('seminario-tracks/'),{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.track-card');
  assert(await page.locator('.track-card').count()===5,'Specialized master must show five track cards');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),'Specialized master overflows mobile viewport');
  check();

  for(const slug of TRACKS){
    check=monitor(page,`Specialized ${slug}`);
    await page.goto(absolute(`seminario-tracks/${slug}/`),{waitUntil:'domcontentloaded'});
    await page.waitForSelector('#startForm');
    assert(await page.locator('.roadmap .sprint').count()===8,`${slug}: expected eight sprint cards`);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),`${slug}: overflows mobile viewport`);
    await page.fill('#fullName','QA Browser Student');
    await page.selectOption('#groupCode','11-A');
    await page.click('#startForm button[type="submit"]');
    await page.waitForSelector('.question-stage');
    for(let i=0;i<15;i++){
      await page.locator('input[name="answer"]').first().check();
      if(i<14)await page.click('#nextBtn');
    }
    assert(await page.locator('#submitBtn').isEnabled(),`${slug}: submit must enable at 15/15`);
    await page.click('#submitBtn');
    await page.waitForSelector('.result');
    const resultText=await page.locator('.result').innerText();
    assert(resultText.includes('Advanced')&&resultText.includes('12/12'),`${slug}: result view did not render placement + score`);
    check();
  }
  await page.close();
  console.log('SPECIALIZED BROWSER FLOW: PASS · 5/5 complete mocked diagnostic flows');
}

async function oopTheoryWorkshopSmoke(browser){
  const topics=loadTopics();
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await installSupabaseMock(page);
  let check;

  for(const topic of topics){
    for(const lang of ['python','java']){
      check=monitor(page,`Theory ${topic.slug} ${lang}`);
      await page.goto(absolute(`seminario-oop-uml/theory.html?topic=${encodeURIComponent(topic.slug)}&lang=${lang}`),{waitUntil:'domcontentloaded'});
      await page.waitForSelector('#theoryCodingLab .colab-cell');
      assert(await page.locator('#theoryCodingLab .colab-cell').count()===2,`${topic.slug}/${lang}: expected two theory cells`);
      assert(await page.locator('#oopTerminalInput').count()===1,`${topic.slug}/${lang}: terminal input missing`);
      if(lang==='java'){
        assert((await page.locator('#theoryCodingLab').innerText()).includes('embedded executable notebook uses Python'),`${topic.slug}: Java runtime distinction missing`);
      }
      check();
    }
  }

  // Local recovery mode gives every workshop a safe, no-write session during browser QA.
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    localStorage.setItem('ijr-seminar-oop-uml-local-v1',JSON.stringify({
      id:'qa-local',token:null,backend:'local',language:'python',group:'11-A',names:['QA Browser'],label:'QA Browser',sessions:{},startedAt:new Date().toISOString()
    }));
    sessionStorage.removeItem('ijr-seminar-oop-uml-session-v1');
  });

  for(const topic of topics){
    check=monitor(page,`Workshop ${topic.slug}`);
    await page.goto(absolute(`seminario-oop-uml/workshop.html?topic=${encodeURIComponent(topic.slug)}&lang=python`),{waitUntil:'domcontentloaded'});
    await page.waitForSelector('#workshopPanel:not(.hidden)');
    await page.waitForSelector('#workshopCodingLab .colab-cell');
    assert(await page.locator('#workshopCodingLab .colab-cell').count()===3,`${topic.slug}: expected three workshop cells`);
    assert(await page.locator('#oopTerminalInput').count()===1,`${topic.slug}: workshop terminal input missing`);
    check();
  }

  // Actual browser Python execution + shared interactive terminal.
  check=monitor(page,'OOP Pyodide runtime');
  await page.goto(absolute('seminario-oop-uml/theory.html?topic=object-model&lang=python'),{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#theoryCodingLab .run-cell');
  await page.locator('#theoryCodingLab .run-cell').first().click();
  await page.locator('#theoryCodingLab .cell-state.ok').first().waitFor({timeout:120000});
  const terminalAfterCell=await page.locator('#oopTerminalOutput').innerText();
  assert(terminalAfterCell.includes('completed without a Python exception'),'Pyodide theory cell did not complete successfully');
  await page.fill('#oopTerminalInput','6*7');
  await page.click('#runTerminalCommand');
  await page.waitForFunction(()=>document.getElementById('oopTerminalOutput')?.innerText.includes('42'),null,{timeout:30000});
  check();

  await page.close();
  console.log('OOP THEORY/WORKSHOP BROWSER: PASS · 20 theory views + 10 workshops + real Pyodide cell/terminal');
}

async function standaloneColabShellSmoke(browser){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const check=monitor(page,'Standalone OOP Colab');
  await page.goto(absolute('seminario-oop-colab-01/'),{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#pythonCell');
  for(const selector of ['#pythonCell','#runCode','#codeOutput','#terminalCommand']){
    assert(await page.locator(selector).count()===1,`Standalone OOP Colab missing ${selector}`);
  }
  assert(await page.locator('#terminalCommand').isDisabled(),'Standalone OOP Colab console contract changed: QA expected output-only command line');
  check();
  await page.close();
  console.log('STANDALONE OOP COLAB SHELL: PASS · editor/run/output controls present');
}

await liveQuestionBankSmoke();
const browser=await chromium.launch({headless:true});
try{
  await specializedBrowserSmoke(browser);
  await oopTheoryWorkshopSmoke(browser);
  await standaloneColabShellSmoke(browser);
}finally{
  await browser.close();
}
console.log('SEMINAR FULL FUNCTIONAL BROWSER SMOKE: PASS');
