(() => {
  'use strict';

  const cfg=window.IJR_MASTER_CONFIG;
  const $=id=>document.getElementById(id);
  const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const SNAPSHOT_KEY=`${cfg.teacherSessionKey}-minimal-v9`;
  const POLL_VISIBLE_MS=3000,POLL_HIDDEN_MS=12000,MAX_BACKOFF_MS=30000;
  let token=sessionStorage.getItem(cfg.teacherSessionKey)||'',snapshot=null,timer=null,loading=false,failures=0,lastSuccessAt=0;

  async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error)throw new Error(error.message||'Backend error');return data}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function fmtGrade(v){return v==null||!Number.isFinite(Number(v))?'—':Number(v).toFixed(2)}
  function fmtTime(v){if(!v)return'—';try{return new Date(v).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}catch{return'—'}}
  function visibleGrade(s){return s?.status==='submitted'?s.grade:(s?.projected_grade??s?.grade)}
  function participants(s){return Array.isArray(s?.participants)?s.participants:[]}
  function isAuthError(err){return /invalid|expired|teacher session/i.test(String(err?.message||err))}

  function setLive(mode,text){const el=$('liveStatus');if(!el)return;el.className=`live-status ${mode}`;el.textContent=text}
  function schedule(ms){clearTimeout(timer);if(token)timer=setTimeout(()=>load(),ms)}
  function cacheSnapshot(){try{sessionStorage.setItem(SNAPSHOT_KEY,JSON.stringify(snapshot))}catch{}}
  function restoreCachedSnapshot(){try{const raw=sessionStorage.getItem(SNAPSHOT_KEY);if(!raw)return false;snapshot=JSON.parse(raw);if(!snapshot)return false;render();setLive('stale','Saved view');return true}catch{return false}}

  function sessionSearchText(s){
    return [s.group_code,...participants(s).flatMap(p=>[p.display_name,p.institutional_email,p.email_normalized])].filter(Boolean).join(' ').toLowerCase();
  }

  function filteredSessions(){
    const group=$('groupFilter').value;
    const search=$('searchInput').value.trim().toLowerCase();
    const activeOnly=$('activeOnly').checked;
    return Array.from(snapshot?.sessions||[]).filter(s=>
      (!group||s.group_code===group)&&
      (!activeOnly||s.status==='active')&&
      (!search||sessionSearchText(s).includes(search))
    );
  }

  function studentCell(s){
    const list=participants(s);
    if(!list.length)return '<span class="muted">Legacy registration</span>';
    return `<div class="students">${list.map(p=>{
      const name=p.display_name||p.institutional_email||'Student';
      const email=p.institutional_email||p.email_normalized||'';
      const showName=email&&String(name).toLowerCase()!==String(email).toLowerCase();
      return `<div class="student-line">${showName?`<span class="student-name">${esc(name)}</span>`:''}<span class="student-email">${esc(email||name)}</span></div>`;
    }).join('')}</div>`;
  }

  function answerCell(s){
    const key=s.latest_checkpoint_key||'—',answer=s.latest_answer??'—',correct=s.latest_answer_correct;
    const mark=correct===true?'✓':correct===false?'✗':'·';
    const cls=correct===true?'answer-ok':correct===false?'answer-bad':'';
    const rows=Array.isArray(s.responses)?s.responses:[];
    if(!rows.length)return `<span class="${cls}">${esc(key)} · ${esc(answer)} ${mark}</span>`;
    const history=rows.map(r=>{
      const rmark=r.correct===true?'✓':r.correct===false?'✗':'·';
      const rcls=r.correct===true?'answer-ok':r.correct===false?'answer-bad':'';
      return `<div class="answer-row ${rcls}"><strong>${esc(r.checkpoint_key)}</strong><code title="${esc(r.latest_answer??'—')}">${esc(r.latest_answer??'—')}</code><span>${rmark}</span></div>`;
    }).join('');
    return `<details class="answer"><summary class="${cls}">${esc(key)} · ${esc(answer)} ${mark}</summary><div class="answer-history">${history}</div></details>`;
  }

  function render(){
    if(!snapshot)return;
    const rows=filteredSessions();
    const active=rows.filter(s=>s.status==='active').length;
    const completed=rows.filter(s=>s.status==='submitted').length;
    const students=rows.reduce((n,s)=>n+Math.max(1,Number(s.team_size||participants(s).length||1)),0);
    const grades=rows.map(visibleGrade).filter(v=>Number.isFinite(Number(v))).map(Number);
    const average=grades.length?grades.reduce((a,b)=>a+b,0)/grades.length:null;

    $('metrics').innerHTML=[
      ['Registrations',rows.length],
      ['Active',active],
      ['Students',students],
      ['Avg. grade / projection',average==null?'—':average.toFixed(2)]
    ].map(([label,value])=>`<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');

    $('rowCount').textContent=`${rows.length} shown`;
    $('sessionBody').innerHTML=rows.map(s=>{
      const completedCount=Number(s.completed_count||0),total=Number(s.checkpoint_count||8),pct=Math.max(0,Math.min(100,completedCount/Math.max(1,total)*100));
      const support=`H ${Number(s.help_tokens_used||0)} · E ${Number(s.wrong_attempts||0)} · R ${Number(s.revealed_count||0)} · S ${Number(s.skipped_count||0)}`;
      const status=s.status==='submitted'?'submitted':'active';
      return `<tr>
        <td><strong>${esc(s.group_code||'—')}</strong></td>
        <td>${studentCell(s)}</td>
        <td><span class="badge ${status}">${status==='submitted'?'Completed':'Active'}</span></td>
        <td><div class="progress"><span>${completedCount}/${total}</span><span class="bar"><i style="width:${pct}%"></i></span></div></td>
        <td class="grade">${fmtGrade(visibleGrade(s))}</td>
        <td>${answerCell(s)}</td>
        <td class="support"><strong>${esc(support)}</strong><br><span>exit ${Number(s.restriction_events||0)}</span></td>
        <td class="time">${fmtTime(s.last_activity_at)}</td>
      </tr>`;
    }).join('')||'<tr><td colspan="8" class="empty">No registrations match this filter.</td></tr>';

    $('updatedAt').textContent=`Updated ${new Date(snapshot.generated_at||Date.now()).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`;
  }

  async function load(force=false){
    if(!token||loading)return;
    if(navigator.onLine===false&&!force){setLive('offline','Offline · last data');schedule(5000);return}
    loading=true;
    if(!snapshot)setLive('syncing','Syncing…');
    try{
      snapshot=await rpc(cfg.rpc.dashboard,{p_teacher_token:token});
      lastSuccessAt=Date.now();failures=0;cacheSnapshot();
      $('loginPanel').classList.add('hidden');$('dashboardPanel').classList.remove('hidden');
      render();setLive('live','LIVE · 3 s');
      schedule(document.hidden?POLL_HIDDEN_MS:POLL_VISIBLE_MS);
    }catch(err){
      if(isAuthError(err)){
        token='';snapshot=null;clearTimeout(timer);
        sessionStorage.removeItem(cfg.teacherSessionKey);sessionStorage.removeItem(SNAPSHOT_KEY);
        $('dashboardPanel').classList.add('hidden');$('loginPanel').classList.remove('hidden');
        $('loginStatus').textContent=`Session unavailable: ${err.message}`;
      }else{
        failures+=1;
        const age=lastSuccessAt?Math.round((Date.now()-lastSuccessAt)/1000):null;
        setLive(navigator.onLine===false?'offline':'stale',age==null?'Retrying…':`Stale · ${age}s`);
        schedule(Math.min(MAX_BACKOFF_MS,POLL_VISIBLE_MS*Math.pow(2,Math.min(failures-1,4))));
      }
    }finally{loading=false}
  }

  $('loginForm').addEventListener('submit',async e=>{
    e.preventDefault();$('loginStatus').textContent='Signing in…';
    try{
      const data=await rpc(cfg.rpc.login,{p_code:$('teacherCode').value,p_user_agent:navigator.userAgent});
      token=data.teacher_token;sessionStorage.setItem(cfg.teacherSessionKey,token);$('teacherCode').value='';$('loginStatus').textContent='';await load(true);
    }catch(err){$('loginStatus').textContent=`Could not sign in: ${err.message}`}
  });

  ['groupFilter','activeOnly'].forEach(id=>$(id).addEventListener('change',render));
  $('searchInput').addEventListener('input',render);
  $('refreshButton').addEventListener('click',()=>load(true));
  $('logoutButton').addEventListener('click',async()=>{
    try{await rpc(cfg.rpc.logout,{p_teacher_token:token})}catch{}
    token='';snapshot=null;clearTimeout(timer);sessionStorage.removeItem(cfg.teacherSessionKey);sessionStorage.removeItem(SNAPSHOT_KEY);
    $('dashboardPanel').classList.add('hidden');$('loginPanel').classList.remove('hidden');
  });
  document.addEventListener('visibilitychange',()=>{if(!token)return;document.hidden?schedule(POLL_HIDDEN_MS):load(true)});
  window.addEventListener('online',()=>{if(token)load(true)});
  window.addEventListener('offline',()=>{if(token)setLive('offline','Offline · last data')});

  if(token){restoreCachedSnapshot();$('loginPanel').classList.add('hidden');$('dashboardPanel').classList.remove('hidden');load(true)}
})();
