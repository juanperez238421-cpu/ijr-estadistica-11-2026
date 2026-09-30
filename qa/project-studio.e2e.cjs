const {installTeamFixture,startTeam}=require('./seminar-team-fixture.cjs');
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
fs.mkdirSync('work',{recursive:true});
const browser=await chromium.launch({...(process.env.STUDIO_TEST_BROWSER?{executablePath:process.env.STUDIO_TEST_BROWSER}:{}),headless:true});const context=await browser.newContext({acceptDownloads:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await installTeamFixture(page);const base=process.env.STUDIO_TEST_BASE||'http://127.0.0.1:4173/seminario-projects/studio/';
for(const project of ['cyber','cad','clients','gta']){
 for(let c=1;c<=4;c++){
  await page.goto(base+'workshop.html?project='+project+'&class='+c);await startTeam(page);const count=await page.locator('#stepRail button').count();
  for(let i=0;i<count;i++){await page.locator('#stepRail button').nth(i).click();await page.locator('#runCodeButton').click();await page.waitForFunction(()=>!document.querySelector('#runCodeButton').disabled,{},{timeout:90000});assert.match(await page.locator('#activityStatus').innerText(),/Código ejecutado/,project+' C'+c+' cell'+i+' '+await page.locator('#terminalOutput').innerText());}
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),project+' mobile');await page.setViewportSize({width:1440,height:1000});console.log('PASS '+project+' C'+c+' all cells real execution');
 }
 if(project==='cyber'||project==='cad'){
  const name=project==='cyber'?'laboratorio_web.py':'soporte.stl';const button=page.locator('[data-artifact="'+name+'"]');assert.equal(await button.count(),1);const d=page.waitForEvent('download');await button.click();await(await d).saveAs('work/'+name);console.log('PASS '+name+' real artifact');
  if(project==='cyber'){const q=page.waitForEvent('download');await page.locator('[data-artifact="prueba_local.py"]').click();await(await q).saveAs('work/prueba_local.py');}
  if(project==='cad'){const stl=fs.readFileSync('work/soporte.stl','utf8');const vertices=[...stl.matchAll(/vertex ([^\n]+)/g)].map(m=>m[1].trim().split(/\s+/).map(Number));assert.equal(vertices.length,60);assert.equal(Math.max(...vertices.map(v=>v[1])),95,'Saved CAD modification survives class transitions and STL export');}
 }else{
  const frame=page.frameLocator('#webPreview');const fields=project==='clients'?{name:'Demo local',email:'demo@example.test',phone:'000'}:{name:'Mod demo QA',category:'graphics',build:'1.0',requirements:'Ficticio'};
  for(const [name,value]of Object.entries(fields)){const input=frame.locator('[name="'+name+'"]');if(name==='category')await input.selectOption(value);else await input.fill(value);}await frame.locator('#recordForm button').click();await frame.getByText('Guardado en la base local').waitFor();assert.equal(await frame.locator('#rows tr').count(),1);
  await page.reload();await startTeam(page);await page.locator('#runCodeButton').click();await page.waitForFunction(()=>!document.querySelector('#runCodeButton').disabled,{},{timeout:90000});assert.equal(await page.frameLocator('#webPreview').locator('#rows tr').count(),1);
  const d=page.waitForEvent('download');await page.locator('#downloadAnimation').click();await(await d).saveAs('work/'+project+'-app.html');
  const offline=await context.newPage();await offline.route('https://**/*',r=>r.abort());await offline.route('http://**/*',r=>r.abort());await offline.goto('file:///'+process.cwd().replace(/\\/g,'/')+'/work/'+project+'-app.html');await offline.locator('#recordForm').waitFor();
  for(const [name,value]of Object.entries(fields)){const input=offline.locator('[name="'+name+'"]');if(name==='category')await input.selectOption(value);else await input.fill(value);}await offline.locator('#recordForm button').click();await offline.getByText('Guardado en la base local').waitFor();await offline.reload();await offline.locator('#rows tr').waitFor();assert.equal(await offline.locator('#rows tr').count(),1);await offline.close();console.log('PASS '+project+' real form, persisted database and offline standalone export');
 }
 await page.screenshot({path:'work/'+project+'-studio.png',fullPage:true});
}
for(const [project,track,slug]of [['cad','3d-programming','cad-pending'],['cyber','cybersecurity','cyber-pending'],['clients','web','web-pending'],['gta','web','gomez-gta-v-mod-showcase']]){
 await page.evaluate(()=>localStorage.clear());await page.unroute('**/seminar-project-access');await page.route('**/seminar-project-access',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,student:{name:'QA Student',group_code:'11B'},project:{project_slug:slug,track_slug:track,project_title:'QA Project',project_mode:'guided_definition',sprints:[]}})}));await page.goto(new URL('../',base).href);await page.locator('#institutionalEmail').fill('test@ijr.edu.co');await page.locator('#accessButton').click();await page.locator('#routeActions a').first().waitFor();assert.equal(await page.locator('#routeActions a').first().getAttribute('href'),'studio/index.html?project='+project);await page.locator('#routeActions a').first().click();await page.locator('.class-card').first().waitFor();assert.equal(await page.locator('.class-card').count(),4);
 for(let c=1;c<=4;c++){await page.goto(base+'theory.html?project='+project+'&class='+c);assert.equal(await page.locator('#workshopTop').getAttribute('href'),'workshop.html?project='+project+'&class='+c);}
 console.log('PASS '+project+' assignment access and four Theory links');
}
assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
