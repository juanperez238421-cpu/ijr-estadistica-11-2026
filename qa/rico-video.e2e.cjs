const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
fs.mkdirSync('work',{recursive:true});
const browser=await chromium.launch({...(process.env.RICO_TEST_BROWSER?{executablePath:process.env.RICO_TEST_BROWSER}:{}),headless:true});
const page=await browser.newPage({acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto((process.env.RICO_TEST_BASE||'http://127.0.0.1:4173/seminario-projects/rico/')+'workshop.html?class=1');
assert.equal(await page.locator('#nextCell').isEnabled(),false);
await page.locator('#buildAnimation').click();await page.waitForFunction(()=>!document.querySelector('#buildAnimation').disabled,{},{timeout:90000});
assert.match(await page.locator('#frameInfo').innerText(),/96 cuadros/);assert.equal(await page.locator('#downloadVideo').isEnabled(),true);
const promise=page.waitForEvent('download');await page.locator('#downloadVideo').click();const d=await promise;await d.saveAs('work/rico-video-test.webm');const bytes=fs.readFileSync('work/rico-video-test.webm');assert.equal(bytes.subarray(0,4).toString('hex'),'1a45dfa3');assert.ok(bytes.length>5000);
assert.equal(await page.locator('#resultLinks a').count(),1);
await page.screenshot({path:'work/rico-video-ready.png',fullPage:true});
const player=await browser.newPage();await player.setContent('<video controls src="file:///'+process.cwd().replace(/\\/g,'/')+'/work/rico-video-test.webm"></video>');
// A file-origin player can decode the real saved file without contacting the web.
fs.writeFileSync('work/check-video.html','<video controls src="rico-video-test.webm"></video>');await player.goto('file:///'+process.cwd().replace(/\\/g,'/')+'/work/check-video.html');
await player.waitForFunction(()=>document.querySelector('video').readyState>=2);assert.equal(await player.evaluate(()=>document.querySelector('video').videoWidth),720);assert.equal(await player.evaluate(()=>document.querySelector('video').videoHeight),480);
assert.deepEqual(errors,[]);console.log('PASS guided class 1 builds 96 real Python frames; WebM download '+bytes.length+' bytes decodes at 720x480; persistent save link');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
