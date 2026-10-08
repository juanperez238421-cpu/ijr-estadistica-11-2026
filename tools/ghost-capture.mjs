import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const chrome = process.env.CHROME_PATH || process.env.CHROME_BIN || '/usr/bin/google-chrome';
const base = 'http://127.0.0.1:8000';
const out = path.resolve('captures');
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(path.join(out,'theory','full'),{recursive:true});
fs.mkdirSync(path.join(out,'theory','viewport'),{recursive:true});
fs.mkdirSync(path.join(out,'exam'),{recursive:true});

const topics = [
  'operations','types','arrays','logic','conditions','loops','functions','statistics',
  'descriptive','position-outliers','pandas-dataframes','data-cleaning',
  'filter-transform','group-aggregate','visualization','analyst-project'
];

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--window-size=1660,940']
});
const page = await browser.newPage();\npage.on('console',m=>console.log('BROWSER_CONSOLE',m.type(),m.text()));\npage.on('pageerror',e=>console.log('BROWSER_PAGEERROR',e.message));
await page.setViewport({width:1660,height:940,deviceScaleFactor:1});
await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);

const manifest = {
  generated_at:new Date().toISOString(),
  source_branch:'qa/ghost-capture-20261008',
  source_commit:process.env.GITHUB_SHA || '',
  viewport:{width:1660,height:940},
  theory:[],
  exam:[]
};

async function stabilizeTheory(slug){
  try {
  await page.waitForSelector('#theoryApp:not(.hidden)',{timeout:15000});
} catch (e) {
  const diag=await page.evaluate(()=>({
    url:location.href,
    ghost:document.documentElement.dataset.ghostCapture||'',
    appClass:document.getElementById('theoryApp')?.className||'',
    accessClass:document.getElementById('accessPanel')?.className||'',
    accessText:document.getElementById('accessPanel')?.innerText||'',
    hasConfig:!!window.IJR_PYTHON_HUB_CONFIG,
    topicsLen:(window.IJR_PYTHON_HUB_TOPICS||[]).length,
    mapKeys:Object.keys(window.IJR_PYTHON_HUB_TOPIC_MAP||{}).length,
    hasSupabase:!!window.supabase,
    bodyText:document.body.innerText.slice(0,1200)
  }));
  console.log('THEORY_DIAGNOSTIC',JSON.stringify(diag,null,2));
  throw e;
}
  await new Promise(r=>setTimeout(r, slug==='logic' ? 5000 : 2600));
  await page.addStyleTag({content:`
    html{scroll-behavior:auto!important}
    *{animation-play-state:paused!important;transition:none!important}
    .topbar{position:relative!important}
  `});
}

async function captureTheory(slug,index){
  const url = base + '/theory.html?topic=' + encodeURIComponent(slug);
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await stabilizeTheory(slug);
  const info = await page.evaluate(() => ({
    title:document.title,
    h1:document.querySelector('#theoryHero h1')?.textContent?.trim() || '',
    height:Math.max(document.body.scrollHeight,document.documentElement.scrollHeight),
    ghost:document.documentElement.dataset.ghostCapture || '',
    pandasQa:document.documentElement.dataset.pandasV60Qa || ''
  }));
  const prefix=String(index+1).padStart(2,'0')+'_'+slug;
  await page.screenshot({path:path.join(out,'theory','full',prefix+'_FULL.jpg'),fullPage:true,type:'jpeg',quality:92});
  const step=820;
  let slices=0;
  for(let y=0;y<info.height;y+=step){
    const h=Math.min(940,info.height-y);
    await page.screenshot({
      path:path.join(out,'theory','viewport',prefix+'_'+String(slices+1).padStart(3,'0')+'.jpg'),
      type:'jpeg',quality:92,captureBeyondViewport:true,
      clip:{x:0,y,width:1660,height:h}
    });
    slices++;
  }
  manifest.theory.push({index:index+1,slug,url,title:info.title,h1:info.h1,height_px:info.height,slices,ghost:info.ghost,pandas_qa:info.pandasQa});
}

for(let i=0;i<topics.length;i++) await captureTheory(topics[i],i);

async function capExam(name,query){
  const url=base+'/evaluation-modules-1-3/ghost.html?'+query;
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await new Promise(r=>setTimeout(r,700));
  await page.addStyleTag({content:'*{animation:none!important;transition:none!important}.topbar{position:relative!important}'});
  const meta=await page.evaluate(()=>({
    title:document.title,
    prompt:document.querySelector('#questionPrompt')?.textContent?.trim()||'',
    state:document.documentElement.dataset.ghostCapture||''
  }));
  const file=name+'.jpg';
  await page.screenshot({path:path.join(out,'exam',file),fullPage:true,type:'jpeg',quality:94});
  manifest.exam.push({file,url,prompt:meta.prompt,ghost:meta.state});
}

await capExam('00_STARTUP','state=startup');
for(let i=1;i<=18;i++) await capExam(String(i).padStart(2,'0')+'_QUESTION','state=question&q='+i);
await capExam('19_FINISH','state=finish');

const instructions = `# OPUS 5.5 — Statistics 11 real-source ghost capture package

## Evidence priority
1. **theory/viewport/** — use these 1660×940 captures as the primary visual reference. They reproduce the real repository HTML/CSS/JS in an isolated ghost session.
2. **theory/full/** — use for complete page continuity and section order.
3. **exam/** — uses the exact current exam DOM and CSS with the canonical 18-question Modules 01–03 sequence rendered without backend writes.
4. **manifest.json** — exact route, slug, page height, slice count and QA metadata.

## Critical interpretation rule
These are not hand-redrawn mockups. The ghost branch starts from the production commit and runs the actual theory page source. Only authentication/progress RPCs are replaced with an isolated in-browser snapshot so every topic can render without touching a real student record.

## Do not alter
- typography hierarchy;
- black/white editorial visual language;
- spacing system;
- borders, code-cell geometry and output panels;
- topic order;
- code syntax;
- educational terminology;
- exam question wording.

## Theory reconstruction
For each topic, read the viewport images in numeric order. Preserve every visible section: hero, resources, conceptual foundation, visual theory, live labs/special modules, syntax reference, common mistakes and transition to workshop.

## Exam reconstruction
Preserve the current exam shell, 40-minute/18-point metrics, module labels, question type UI, code-cell styling and one-submission visual language. Do not expose teacher answer keys in a student-facing recreation.

## QA
A reconstruction fails if it:
- invents a section not visible in the captures;
- replaces the live-lab interface with generic cards;
- changes code notation;
- crops a section such that instructional meaning is lost;
- changes the exam question wording;
- uses a visual style different from the captured Statistics 11 page.
`;
fs.writeFileSync(path.join(out,'OPUS_INSTRUCTIONS.md'),instructions);
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));

await browser.close();
console.log(JSON.stringify({theory_pages:manifest.theory.length,exam_captures:manifest.exam.length,total_theory_slices:manifest.theory.reduce((s,x)=>s+x.slices,0)},null,2));