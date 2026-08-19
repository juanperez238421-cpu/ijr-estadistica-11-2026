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
  function resultMaps(){const a=new Map(),e=new Map();(snapshot.activity_results||[]).forEach(x=>a.set(`${x.student_registry_id}|${x.activity_slug}`,x));(snapshot.exam_results||[]).forEach(x=>e.set(x.student_registry_id,x));return{a,e};}
  function render(){
    const {a,e}=resultMaps();const group=$('groupFilter').value,search=$('searchInput').value.trim().toLowerCase();const activity=(snapshot.activities||[])[0];
    const rows=(snapshot.roster||[]).filter(r=>(!group||r.group_code===group)&&(!search||r.display_name.toLowerCase().includes(search)));
    const started=(snapshot.activity_results||[]).length,submitted=(snapshot.activity_results||[]).filter(x=>x.status==='submitted').length,active=(snapshot.activity_results||[]).filter(x=>x.status==='active').length;
    const grades=(snapshot.activity_results||[]).filter(x=>Number.isFinite(Number(x.grade)));const avg=grades.length?grades.reduce((s,x)=>s+Number(x.grade),0)/grades.length:null;
    $('metrics').innerHTML=[['Roster',snapshot.roster?.length||0],['Colab iniciados',started],['Activos',active],['Finalizados',submitted],['Promedio Colab',avg==null?'—':avg.toFixed(2)]].map(([k,v])=>`<div class="metric"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('');
    $('gradeBody').innerHTML=rows.map(r=>{const ar=activity?a.get(`${r.id}|${activity.slug}`):null;const er=e.get(r.id);const status=ar?.status||'not_started';return `<tr><td>${esc(r.group_code)}</td><td>${esc(r.source_position)}</td><td>${esc(r.display_name)}</td><td class="grade">${fmt(er?.grade)}</td><td><span class="status ${statusClass(status)}">${status==='not_started'?'Not started':status==='active'?'Active':'Submitted'}</span></td><td>${ar?`${ar.correct_count}/${ar.checkpoint_count}`:'0/8'}</td><td class="grade">${fmt(ar?.grade)}</td><td>${fmtTime(ar?.last_activity_at)}</td></tr>`}).join('')||'<tr><td colspan="8">Sin resultados para el filtro.</td></tr>';
    $('updatedAt').textContent=`Actualizado: ${new Date(snapshot.generated_at||Date.now()).toLocaleString('es-CO')}`;
  }
  async function load(){if(!token)return;try{snapshot=await rpc(cfg.rpc.dashboard,{p_teacher_token:token});$('loginPanel').classList.add('hidden');$('dashboardPanel').classList.remove('hidden');render();}catch(err){sessionStorage.removeItem(cfg.teacherSessionKey);token='';clearInterval(timer);$('dashboardPanel').classList.add('hidden');$('loginPanel').classList.remove('hidden');$('loginStatus').textContent=`Sesión no disponible: ${err.message}`;}}
  $('loginForm').addEventListener('submit',async e=>{e.preventDefault();$('loginStatus').textContent='Ingresando…';try{const data=await rpc(cfg.rpc.login,{p_code:$('teacherCode').value,p_user_agent:navigator.userAgent});token=data.teacher_token;sessionStorage.setItem(cfg.teacherSessionKey,token);$('teacherCode').value='';$('loginStatus').textContent='';await load();clearInterval(timer);timer=setInterval(load,5000);}catch(err){$('loginStatus').textContent=`No fue posible ingresar: ${err.message}`;}});
  $('refreshButton').addEventListener('click',load);$('groupFilter').addEventListener('change',render);$('searchInput').addEventListener('input',render);
  $('logoutButton').addEventListener('click',async()=>{try{await rpc(cfg.rpc.logout,{p_teacher_token:token})}catch{}token='';sessionStorage.removeItem(cfg.teacherSessionKey);clearInterval(timer);$('dashboardPanel').classList.add('hidden');$('loginPanel').classList.remove('hidden');});
  if(token){load();timer=setInterval(load,5000);}
})();
