// Isolated transport fixture for existing notebook/browser tests. Python and
// JavaScript execution remain real; production team persistence is tested separately.
const crypto=require('node:crypto');
async function installTeamFixture(page){
 const sessions=new Map(),progress=new Map();
 await page.route('**/seminar-workshop-team',async route=>{
  const b=route.request().postDataJSON();let session=sessions.get(b.team_token),token=b.team_token;
  if(b.action==='start'){if(!b.emails?.length||new Set(b.emails).size!==b.emails.length||b.emails.some(e=>!/^[^\s@]+@ijr\.edu\.co$/.test(e))){await route.fulfill({status:400,json:{error:'institutional_team_emails_required'}});return;}token=crypto.randomBytes(32).toString('hex');session={team_id:crypto.randomUUID(),project_key:b.project_key,member_emails:b.emails,team_size:b.emails.length};sessions.set(token,session);}
  if(!session){await route.fulfill({status:403,json:{error:'team_session_required'}});return;}
  if(b.action==='record'){for(const e of session.member_emails){const key=e+':'+session.project_key;if(!progress.has(key))progress.set(key,new Map());progress.get(key).set(b.class_no+':'+b.cell_id,{class_no:b.class_no,cell_id:b.cell_id});}}
  const cells=[...(progress.get(session.member_emails[0]+':'+session.project_key)||new Map()).values()].filter(c=>session.member_emails.every(e=>progress.get(e+':'+session.project_key)?.has(c.class_no+':'+c.cell_id)));
  await route.fulfill({json:{ok:true,...session,cells,team_token:token}});
 });
}
async function startTeam(page,emails=['qa.notebook@ijr.edu.co']){
 await page.locator('#stat11TeamGate').waitFor();await page.getByText(emails.length+' student'+(emails.length===1?'':'s'),{exact:true}).click();
 for(let i=0;i<emails.length;i++)await page.locator('#stat11TeamEmail'+(i+1)).fill(emails[i]);await page.locator('#stat11TeamStart').click();await page.locator('#stat11TeamGate').waitFor({state:'detached'});
}
module.exports={installTeamFixture,startTeam};
