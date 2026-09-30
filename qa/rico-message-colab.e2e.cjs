const {installTeamFixture,startTeam}=require('./seminar-team-fixture.cjs');
const {chromium}=require('playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
const base=process.env.RICO_TEST_BASE||'http://127.0.0.1:4173/seminario-projects/rico/';
(async()=>{
fs.mkdirSync('work',{recursive:true});
const browser=await chromium.launch({...(process.env.RICO_TEST_BROWSER?{executablePath:process.env.RICO_TEST_BROWSER}:{}),headless:true});
const context=await browser.newContext({acceptDownloads:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await installTeamFixture(page);
async function run(){await page.locator('#runCodeButton').click();await page.waitForFunction(()=>!document.getElementById('runCodeButton').disabled,{},{timeout:90000});}
for(let c=1;c<=4;c++){
 await page.goto(base+'workshop.html?class='+c);await startTeam(page);
 const count=await page.locator('#stepRail button').count();assert.ok(count>=3);
 for(let i=0;i<count;i++){
  await page.locator('#stepRail button').nth(i).click();
  await run();
  const status=await page.locator('#activityStatus').innerText();
  if(c===4&&i===1){assert.match(status,/Error Python real/);const before=await page.locator('#codeEditor').inputValue();await page.locator('#codeEditor').fill(before.replace('flower_count=-1','flower_count=4'));await run();assert.match(await page.locator('#activityStatus').innerText(),/Python ejecutado/);}
  else assert.match(status,/Python ejecutado/,await page.locator('#terminalOutput').innerText());
 }
 assert.match(await page.locator('#frameInfo').innerText(),/cuadros/);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`mobile overflow C${c}`);
 await page.setViewportSize({width:1440,height:1000});console.log('PASS class '+c+': real Python cells, tests, preview, mobile');
}
// Genuine error path in console and recovery.
await page.locator('#terminalCommand').fill('1 / 0');await page.locator('#terminalForm button').click();await page.waitForFunction(()=>!document.getElementById('runCodeButton').disabled);assert.match(await page.locator('#terminalOutput').innerText(),/ZeroDivisionError/);
await page.locator('#terminalCommand').fill('print("RECOVERED")');await page.locator('#terminalForm button').click();await page.waitForFunction(()=>!document.getElementById('runCodeButton').disabled);assert.match(await page.locator('#terminalOutput').innerText(),/RECOVERED/);
const downloadPromise=page.waitForEvent('download');await page.locator('#downloadAnimation').click();const download=await downloadPromise;await download.saveAs('work/mensaje-rico-test.html');
const portable=await context.newPage();await portable.route('http://**/*',r=>r.abort());await portable.route('https://**/*',r=>r.abort());await portable.goto('file:///'+process.cwd().replace(/\\/g,'/')+'/work/mensaje-rico-test.html');assert.equal(await portable.locator('canvas').count(),1);await portable.locator('#play').click();assert.ok(await portable.evaluate(()=>document.querySelector('canvas').width===720));console.log('PASS standalone offline HTML: no network requests');
await page.screenshot({path:'work/rico-colab-preview.png',fullPage:true});
const pythonPromise=page.waitForEvent('download');await page.locator('#downloadPython').click();await (await pythonPromise).saveAs('work/crear_mensaje_test.py');
const notebookPromise=page.waitForEvent('download');await page.locator('#downloadNotebook').click();const nb=await notebookPromise;await nb.saveAs('work/rico-test.ipynb');assert.equal(JSON.parse(fs.readFileSync('work/rico-test.ipynb')).nbformat,4);
await page.goto(base+'workshop.html?class=4');await startTeam(page);await page.locator('#stepRail button').nth(1).click();assert.match(await page.locator('#codeEditor').inputValue(),/flower_count=4/);console.log('PASS downloads and edited draft restoration');
await page.goto(base+'index.html');assert.equal(await page.locator('.class-card').count(),4);
for(let c=1;c<=4;c++){await page.goto(base+'theory.html?class='+c);assert.equal(await page.locator('#workshopTop').getAttribute('href'),'workshop.html?class='+c);}
await page.route('**/functions/v1/seminar-project-access',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({student:{name:'RICO PARAMO ALEJANDRO',group_code:'11B'},project:{project_slug:'rico-portable-python-visual-show',track_slug:'data-science',project_mode:'fixed',sprints:[]}})}));await page.goto(new URL('../index.html',base).href);await page.locator('#institutionalEmail').fill('test@ijr.edu.co');await page.locator('#accessButton').click();await page.locator('#routeActions a').first().waitFor();assert.equal(await page.locator('#routeActions a').first().getAttribute('href'),'rico/index.html');await page.locator('#routeActions a').first().click();await page.locator('.class-card').first().waitFor();assert.equal(await page.locator('.class-card').count(),4);console.log('PASS Rico assignment opens the specific Colab hub');
assert.deepEqual(errors,[]);console.log('PASS hub and four Theory links; no browser JS errors');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
