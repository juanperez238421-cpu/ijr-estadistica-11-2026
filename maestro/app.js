(() => {
  'use strict';
  const cfg=window.IJR_MASTER_CONFIG,$=id=>document.getElementById(id);
  const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const SNAPSHOT_KEY=`${cfg.teacherSessionKey}-snapshot-v7`;
  const POLL_VISIBLE_MS=3000,POLL_HIDDEN_MS=12000,MAX_BACKOFF_MS=30000;
  let token=sessionStorage.getItem(cfg.teacherSessionKey)||'',snapshot=null,timer=null,loading=false,failures=0,lastSuccessAt=0;

  async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error)throw new Error(error.message||'Backend error');return data;}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function fmt(v){return v==null?'—':Number(v).toFixed(2)}
  function fmtTime(v){if(!v)return'—';try{return new Date(v).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}catch{return'—'}}
  function statusClass(s){return s==='submitted'?'submitted':s==='active'?'active':''}
  function participantsOf(result){const p=Array.isArray(result?.participants)?result.participants:[];if(p.length)return p;return result?.student_name?[{member_order:1,student_registry_id:result.student_registry_id||null,display_name:result.student_name,is_roster_match:!!result.student_registry_id}]:[]}
  function teamLabel(result){const names=participantsOf(result).map(p=>p.display_name).filter(Boolean);return names.length?names.join(' · '):(result?.student_name||'—')}
  function visibleGrade(result){if(!result)return null;return result.status==='submitted'?result.grade:(result.projected_grade??result.grade)}
  function isAuthError(err){return /invalid|expired|teacher session/i.test(String(err?.message||err))}

  function setLive(mode,text){const el=$('liveStatus');if(!el)return;el.className=`live-status ${mode}`;el.textContent=text}
  function schedule(ms){clearTimeout(timer);if(!token)return;timer=setTimeout(()=>load(),ms)}
  function cacheSnapshot(){try{sessionStorage.setItem(SNAPSHOT_KEY,JSON.stringify(snapshot))}catch{}}
  function restoreCachedSnapshot(){try{const raw=sessionStorage.getItem(SNAPSHOT_KEY);if(!raw)return false;snapshot=JSON.parse(raw);if(!snapshot)return false;render();setLive('stale','Vista guardada');return true}catch{return false}}

  function resultMaps(){
    const activityByStudent=new Map(),examByStudent=new Map(),freeRows=[];
    (snapshot.activity_results||[]).forEach(result=>{
      participantsOf(result).forEach((member,index)=>{
        if(member.student_registry_id){const key=`${member.student_registry_id}|${result.activity_slug}`;if(!activityByStudent.has(key))activityByStudent.set(key,result)}
        else freeRows.push({id:`free:${result.attempt_id}:${index}`,group_code:result.group_code,source_position:'—',display_name:member.display_name||'Nombre libre',__free:true,__activity:result});
      });
    });
    (snapshot.exam_results||[]).forEach(x=>examByStudent.set(x.student_registry_id,x));
    return{activityByStudent,examByStudent,freeRows};
  }

  function responseDetails(ar){
    if(!ar)return'—';
    const responses=Array.isArray(ar.responses)?ar.responses:[];
    const key=ar.latest_checkpoint_key||'—',answer=ar.latest_answer??'—',correct=ar.latest_answer_correct;
    const mark=correct===true?'✓':correct===false?'✗':'·';
    const cls=correct===true?'answer-ok':correct===false?'answer-bad':'';
    if(!responses.length)return `<span class="answer-summary ${cls}">${esc(key)} · ${esc(answer)} ${mark}</span>`;
    const lines=responses.map(r=>{
      const rmark=r.correct===true?'✓':r.correct===false?'✗':'·';
      const rcls=r.correct===true?'answer-ok':r.correct===false?'answer-bad':'';
      const expected=r.expected_answer==null?'':` · esp. ${r.expected_answer}`;
      return `<div class="answer-line ${rcls}"><strong>${esc(r.checkpoint_key)}</strong><code title="${esc(String(r.latest_answer??'—')+expected)}">${esc(r.latest_answer??'—')}${esc(expected)}</code><span>${rmark}</span></div>`;
    }).join('');
    return `<details class="answer-details"><summary class="answer-summary ${cls}">${esc(key)} · ${esc(answer)} ${mark}</summary><div class="answer-history">${lines}</div></details>`;
  }

  function renderTeamBoard(results){
    const group=$('groupFilter').value;
    const current=results.filter(r=>!group||r.group_code===group).slice(0,9);
    $('teamBoard').innerHTML=current.map((r,index)=>{
      const completed=Number(r.completed_count??r.correct_count??0),total=Number(r.checkpoint_count||8),grade=fmt(visibleGrade(r));
      const answer=r.latest_answer==null?'—':`${r.latest_checkpoint_key||''}: ${r.latest_answer}${r.latest_answer_correct===true?' ✓':r.latest_answer_correct===false?' ✗':''}`;
      return `<article class="team-card ${statusClass(r.status)}"><div class="team-card-head"><span class="team-card-title">${esc(r.group_code)} · Station ${index+1}</span><span class="status ${statusClass(r.status)}">${r.status==='submitted'?'Submitted':'Active'}</span></div><div class="team-card-members">${esc(teamLabel(r))}</div><div class="team-card-grid"><div><span>Progress</span><strong>${completed}/${total}</strong></div><div><span>Grade</span><strong>${grade}</strong></div><div><span>Last answer</span><strong title="${esc(answer)}">${esc(answer)}</strong></div></div><div class="small" style="margin-top:7px">Last activity ${fmtTime(r.last_activity_at)}</div></article>`;
    }).join('')||'<div class="small">No hay equipos iniciados para este filtro.</div>';
  }

  function render(){
    if(!snapshot)return;
    const {activityByStudent,examByStudent,freeRows}=resultMaps();
    const group=$('groupFilter').value,search=$('searchInput').value.trim().toLowerCase();
    const activity=(snapshot.activities||[])[0],activitySlug=activity?.slug||'';
    const combined=[...(snapshot.roster||[]),...freeRows]
      .filter(r=>(!group||r.group_code===group)&&(!search||String(r.display_name||'').toLowerCase().includes(search)))
      .sort((x,y)=>String(x.group_code).localeCompare(String(y.group_code))||(Number(x.source_position)||999)-(Number(y.source_position)||999)||String(x.display_name).localeCompare(String(y.display_name)));

    const results=(snapshot.activity_results||[]).filter(x=>!activitySlug||x.activity_slug===activitySlug);
    const startedTeams=results.length,submittedTeams=results.filter(x=>x.status==='submitted').length,activeTeams=results.filter(x=>x.status==='active').length;
    const participantCount=results.reduce((sum,x)=>sum+Math.max(1,Number(x.team_size||participantsOf(x).length||1)),0);
    const grades=results.map(visibleGrade).filter(v=>Number.isFinite(Number(v))),avg=grades.length?grades.reduce((s,v)=>s+Number(v),0)/grades.length:null;
    const restrictionTotal=results.reduce((s,x)=>s+Number(x.restriction_events||0),0),helpTotal=results.reduce((s,x)=>s+Number(x.help_tokens_used||0),0),revealTotal=results.reduce((s,x)=>s+Number(x.revealed_count||0),0),skipTotal=results.reduce((s,x)=>s+Number(x.skipped_count||0),0);

    $('metrics').innerHTML=[
      ['Roster',snapshot.roster?.length||0],['Equipos iniciados',startedTeams],['Integrantes',participantCount],['Activos',activeTeams],['Finalizados',submittedTeams],['Promedio nota/proy.',avg==null?'—':avg.toFixed(2)],['Ayudas usadas',helpTotal],['Soluciones reveladas',revealTotal],['Etapas omitidas',skipTotal],['Eventos salida',restrictionTotal]
    ].map(([k,v])=>`<div class="metric"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('');

    renderTeamBoard(results);

    $('gradeBody').innerHTML=combined.map(r=>{
      const ar=r.__free?r.__activity:(activity?activityByStudent.get(`${r.id}|${activity.slug}`):null),er=r.__free?null:examByStudent.get(r.id),status=ar?.status||'not_started';
      const nameCell=r.__free?`${esc(r.display_name)} <span class="status active">Nombre libre</span>`:esc(r.display_name),team=ar?teamLabel(ar):'—';
      const support=ar?`A ${Number(ar.help_tokens_used||0)}/3 · E ${Number(ar.wrong_attempts||0)} · R ${Number(ar.revealed_count||0)} · O ${Number(ar.skipped_count||0)}`:'—';
      const completed=ar?Number(ar.completed_count??ar.correct_count??0):0,total=ar?Number(ar.checkpoint_count||8):8;
      return `<tr>
        <td>${esc(r.group_code)}</td><td>${esc(r.source_position)}</td><td>${nameCell}</td><td class="team-cell">${esc(team)}</td>
        <td class="grade">${fmt(er?.grade)}</td><td><span class="status ${statusClass(status)}">${status==='not_started'?'Not started':status==='active'?'Active':'Submitted'}</span></td>
        <td>${completed}/${total}</td><td class="grade">${fmt(visibleGrade(ar))}</td><td>${responseDetails(ar)}</td><td>${esc(support)}</td><td>${esc(ar?.restriction_events??0)}</td><td>${fmtTime(ar?.last_activity_at)}</td>
      </tr>`;
    }).join('')||'<tr><td colspan="12">Sin resultados para el filtro.</td></tr>';
    $('updatedAt').textContent=`Actualizado: ${new Date(snapshot.generated_at||Date.now()).toLocaleString('es-CO')}`;
  }

  async function load(force=false){
    if(!token||loading)return;
    if(navigator.onLine===false&&!force){setLive('offline','Sin conexión · mostrando último dato');schedule(5000);return}
    loading=true;
    if(!snapshot)setLive('syncing','Sincronizando…');
    try{
      const next=await rpc(cfg.rpc.dashboard,{p_teacher_token:token});
      snapshot=next;lastSuccessAt=Date.now();failures=0;cacheSnapshot();
      $('loginPanel').classList.add('hidden');$('dashboardPanel').classList.remove('hidden');render();setLive('live','LIVE · 3 s');
      schedule(document.hidden?POLL_HIDDEN_MS:POLL_VISIBLE_MS);
    }catch(err){
      if(isAuthError(err)){
        sessionStorage.removeItem(cfg.teacherSessionKey);sessionStorage.removeItem(SNAPSHOT_KEY);token='';clearTimeout(timer);snapshot=null;
        $('dashboardPanel').classList.add('hidden');$('loginPanel').classList.remove('hidden');$('loginStatus').textContent=`Sesión no disponible: ${err.message}`;
      }else{
        failures+=1;const age=lastSuccessAt?Math.round((Date.now()-lastSuccessAt)/1000):null;
        setLive(navigator.onLine===false?'offline':'stale',age==null?'Reintentando conexión…':`Conexión inestable · dato de hace ${age}s`);
        const delay=Math.min(MAX_BACKOFF_MS,POLL_VISIBLE_MS*Math.pow(2,Math.min(failures-1,4)));schedule(delay);
      }
    }finally{loading=false}
  }

  $('loginForm').addEventListener('submit',async e=>{e.preventDefault();$('loginStatus').textContent='Ingresando…';try{const data=await rpc(cfg.rpc.login,{p_code:$('teacherCode').value,p_user_agent:navigator.userAgent});token=data.teacher_token;sessionStorage.setItem(cfg.teacherSessionKey,token);$('teacherCode').value='';$('loginStatus').textContent='';await load(true)}catch(err){$('loginStatus').textContent=`No fue posible ingresar: ${err.message}`}});
  $('refreshButton').addEventListener('click',()=>load(true));$('groupFilter').addEventListener('change',render);$('searchInput').addEventListener('input',render);
  $('logoutButton').addEventListener('click',async()=>{try{await rpc(cfg.rpc.logout,{p_teacher_token:token})}catch{}token='';snapshot=null;sessionStorage.removeItem(cfg.teacherSessionKey);sessionStorage.removeItem(SNAPSHOT_KEY);clearTimeout(timer);$('dashboardPanel').classList.add('hidden');$('loginPanel').classList.remove('hidden')});
  document.addEventListener('visibilitychange',()=>{if(!token)return;if(document.hidden)schedule(POLL_HIDDEN_MS);else load(true)});
  window.addEventListener('online',()=>{if(token)load(true)});
  window.addEventListener('offline',()=>{if(token)setLive('offline','Sin conexión · mostrando último dato')});

  if(token){restoreCachedSnapshot();$('loginPanel').classList.add('hidden');$('dashboardPanel').classList.remove('hidden');load(true)}
})();
