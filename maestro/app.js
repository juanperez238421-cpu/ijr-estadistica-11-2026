(() => {
  'use strict';
  const cfg=window.IJR_MASTER_CONFIG,$=id=>document.getElementById(id);
  const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  let token=sessionStorage.getItem(cfg.teacherSessionKey)||'',snapshot=null,timer=null;

  async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error)throw new Error(error.message||'Backend error');return data;}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function fmt(v){return v==null?'—':Number(v).toFixed(2)}
  function fmtTime(v){if(!v)return'—';try{return new Date(v).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}catch{return'—'}}
  function statusClass(s){return s==='submitted'?'submitted':s==='active'?'active':''}
  function participantsOf(result){
    const p=Array.isArray(result?.participants)?result.participants:[];
    if(p.length)return p;
    return result?.student_name?[{member_order:1,student_registry_id:result.student_registry_id||null,display_name:result.student_name,is_roster_match:!!result.student_registry_id}]:[];
  }
  function teamLabel(result){
    const names=participantsOf(result).map(p=>p.display_name).filter(Boolean);
    return names.length?names.join(' · '):(result?.student_name||'—');
  }

  function resultMaps(){
    const activityByStudent=new Map(),examByStudent=new Map(),freeRows=[];
    // Backend results arrive newest first. Keep the first result for a roster student so
    // a historical individual attempt cannot overwrite the current team assignment.
    (snapshot.activity_results||[]).forEach(result=>{
      const participants=participantsOf(result);
      participants.forEach((member,index)=>{
        if(member.student_registry_id){
          const key=`${member.student_registry_id}|${result.activity_slug}`;
          if(!activityByStudent.has(key))activityByStudent.set(key,result);
        }else{
          freeRows.push({
            id:`free:${result.attempt_id}:${index}`,
            group_code:result.group_code,
            source_position:'—',
            display_name:member.display_name||'Nombre libre',
            __free:true,
            __activity:result
          });
        }
      });
    });
    (snapshot.exam_results||[]).forEach(x=>examByStudent.set(x.student_registry_id,x));
    return{activityByStudent,examByStudent,freeRows};
  }

  function render(){
    const {activityByStudent,examByStudent,freeRows}=resultMaps();
    const group=$('groupFilter').value;
    const search=$('searchInput').value.trim().toLowerCase();
    const activity=(snapshot.activities||[])[0];
    const activitySlug=activity?.slug||'';

    const combined=[...(snapshot.roster||[]),...freeRows]
      .filter(r=>(!group||r.group_code===group)&&(!search||String(r.display_name||'').toLowerCase().includes(search)))
      .sort((x,y)=>String(x.group_code).localeCompare(String(y.group_code))||(Number(x.source_position)||999)-(Number(y.source_position)||999)||String(x.display_name).localeCompare(String(y.display_name)));

    const results=(snapshot.activity_results||[]).filter(x=>!activitySlug||x.activity_slug===activitySlug);
    const startedTeams=results.length;
    const submittedTeams=results.filter(x=>x.status==='submitted').length;
    const activeTeams=results.filter(x=>x.status==='active').length;
    const participantCount=results.reduce((sum,x)=>sum+Math.max(1,Number(x.team_size||participantsOf(x).length||1)),0);
    const freeNames=results.reduce((sum,x)=>sum+participantsOf(x).filter(p=>!p.student_registry_id).length,0);
    const grades=results.filter(x=>Number.isFinite(Number(x.grade)));
    const avg=grades.length?grades.reduce((s,x)=>s+Number(x.grade),0)/grades.length:null;
    const restrictionTotal=results.reduce((s,x)=>s+Number(x.restriction_events||0),0);

    $('metrics').innerHTML=[
      ['Roster',snapshot.roster?.length||0],
      ['Equipos iniciados',startedTeams],
      ['Integrantes registrados',participantCount],
      ['Activos',activeTeams],
      ['Finalizados',submittedTeams],
      ['Promedio por equipo',avg==null?'—':avg.toFixed(2)],
      ['Nombres libres',freeNames],
      ['Eventos salida',restrictionTotal]
    ].map(([k,v])=>`<div class="metric"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('');

    $('gradeBody').innerHTML=combined.map(r=>{
      const ar=r.__free?r.__activity:(activity?activityByStudent.get(`${r.id}|${activity.slug}`):null);
      const er=r.__free?null:examByStudent.get(r.id);
      const status=ar?.status||'not_started';
      const nameCell=r.__free?`${esc(r.display_name)} <span class="status active">Nombre libre</span>`:esc(r.display_name);
      const team=ar?teamLabel(ar):'—';
      return `<tr>
        <td>${esc(r.group_code)}</td>
        <td>${esc(r.source_position)}</td>
        <td>${nameCell}</td>
        <td class="team-cell">${esc(team)}</td>
        <td class="grade">${fmt(er?.grade)}</td>
        <td><span class="status ${statusClass(status)}">${status==='not_started'?'Not started':status==='active'?'Active':'Submitted'}</span></td>
        <td>${ar?`${ar.correct_count}/${ar.checkpoint_count}`:'0/8'}</td>
        <td class="grade">${fmt(ar?.grade)}</td>
        <td>${esc(ar?.restriction_events??0)}</td>
        <td>${fmtTime(ar?.last_activity_at)}</td>
      </tr>`;
    }).join('')||'<tr><td colspan="10">Sin resultados para el filtro.</td></tr>';

    $('updatedAt').textContent=`Actualizado: ${new Date(snapshot.generated_at||Date.now()).toLocaleString('es-CO')}`;
  }

  async function load(){
    if(!token)return;
    try{
      snapshot=await rpc(cfg.rpc.dashboard,{p_teacher_token:token});
      $('loginPanel').classList.add('hidden');
      $('dashboardPanel').classList.remove('hidden');
      render();
    }catch(err){
      sessionStorage.removeItem(cfg.teacherSessionKey);token='';clearInterval(timer);
      $('dashboardPanel').classList.add('hidden');$('loginPanel').classList.remove('hidden');
      $('loginStatus').textContent=`Sesión no disponible: ${err.message}`;
    }
  }

  $('loginForm').addEventListener('submit',async e=>{
    e.preventDefault();$('loginStatus').textContent='Ingresando…';
    try{
      const data=await rpc(cfg.rpc.login,{p_code:$('teacherCode').value,p_user_agent:navigator.userAgent});
      token=data.teacher_token;sessionStorage.setItem(cfg.teacherSessionKey,token);$('teacherCode').value='';$('loginStatus').textContent='';
      await load();clearInterval(timer);timer=setInterval(load,5000);
    }catch(err){$('loginStatus').textContent=`No fue posible ingresar: ${err.message}`;}
  });

  $('refreshButton').addEventListener('click',load);
  $('groupFilter').addEventListener('change',render);
  $('searchInput').addEventListener('input',render);
  $('logoutButton').addEventListener('click',async()=>{
    try{await rpc(cfg.rpc.logout,{p_teacher_token:token})}catch{}
    token='';sessionStorage.removeItem(cfg.teacherSessionKey);clearInterval(timer);
    $('dashboardPanel').classList.add('hidden');$('loginPanel').classList.remove('hidden');
  });
  if(token){load();timer=setInterval(load,5000);}
})();
