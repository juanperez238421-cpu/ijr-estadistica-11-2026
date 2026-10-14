(()=>{
'use strict';
const ENDPOINT='https://rlfxnjbqxbozjdzkbwlz.supabase.co';
const PUBLISHABLE='sb_publishable_rmVOQ3Orx49KpW_4uMqYew_c2HpcA87';
const $=id=>document.getElementById(id);
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sb=globalThis.supabase?.createClient(ENDPOINT,PUBLISHABLE,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
let token='',report=null,busy=false;
const list=x=>Array.isArray(x)?x:[];
const dates=x=>x?new Date(x).toLocaleString('es-CO',{timeZone:'America/Bogota',dateStyle:'medium',timeStyle:'short'}):'Sin fecha';
function pill(text,cls='muted'){return '<span class="pill '+cls+'">'+escapeHtml(text)+'</span>';}
function sessionLabel(row,key){
 const rec=list(row.oop_sessions).filter(x=>x.session===key);
 if(!rec.length)return pill('Sin entrega');
 return pill('Guardada · '+rec.length,'done');
}
function noteworthy(row){
 return row.s01_records+row.s02_records+row.draft_count+row.guided_cell_count+
 list(row.diagnostics).length+list(row.studio_profiles).length>0;
}
function needsReview(row){
 return list(row.emails).length!==1 || row.attempt_count>1 ||
 Number(row.historical_sessions_missing_or_changed)>0 ||
 list(row.oop_sessions).some(x=>x.status==='completed' &&
   x.session==='s01' && x.run_success!==true);
}
function projectStatus(row){
 const p=list(row.projects);
 if(!p.length)return pill('No asignado');
 if(p.some(x=>x.confirmed_at||x.decision_status==='confirmed'))return pill('Confirmado','done');
 return pill('Solo asignado','pending');
}
function filtered(){
 if(!report)return [];
 const g=$('groupFilter').value,s=$('search').value.trim().toLowerCase(),st=$('statusFilter').value;
 return list(report.students).filter(r=>
   (!g||r.group_code===g) &&
   (!s||(r.display_name+' '+list(r.emails).join(' ')).toLowerCase().includes(s)) &&
   (!st || (st==='evidence'&&noteworthy(r)) || (st==='drafts'&&r.draft_count>0) || (st==='attention'&&needsReview(r)))
 );
}
function card(name,value){return '<div class="metric"><strong>'+value+'</strong><span>'+escapeHtml(name)+'</span></div>';}
function render(){
 if(!report)return;
 const all=list(report.students),rows=filtered(),n=all.length;
 $('metrics').innerHTML=[
 card('Matrícula contrastada',n+'/61'),
 card('Con evidencia S01',all.filter(x=>x.s01_records>0).length),
 card('Con evidencia S02',all.filter(x=>x.s02_records>0).length),
 card('Con borradores guardados',all.filter(x=>x.draft_count>0).length),
 card('Proyectos asignados',all.filter(x=>x.project_count>0).length),
 card('Avances de proyectos guiados',all.reduce((a,b)=>a+(Number(b.guided_cell_count)||0),0)),
 card('Identidades por revisar',all.filter(x=>list(x.emails).length!==1).length),
 card('Cambios desde respaldo',Number(report.students_changed_since_baseline)||0)
 ].join('');
 $('baseline').textContent='Respaldo: '+(report.baseline_snapshot_id||'sin crear')+' · '+dates(report.baseline_captured_at);
 $('lastUpdate').textContent='Última lectura: '+dates(report.generated_at);
 $('rowCount').textContent=rows.length+' estudiante(s) de '+n;
 $('studentRows').innerHTML=rows.map(r=>'<tr>'+
 '<td>'+escapeHtml(r.group_code)+'</td>'+
 '<td>'+escapeHtml(r.display_name)+'</td>'+
 '<td>'+ (list(r.emails).length?list(r.emails).map(escapeHtml).join('<br>'):pill('Sin correo','review'))+'</td>'+
 '<td>'+sessionLabel(r,'s01')+'</td>'+
 '<td>'+sessionLabel(r,'s02')+'</td>'+
 '<td>'+ (r.draft_count?pill(r.draft_count+' guardado(s)','pending'):pill('—'))+'</td>'+
 '<td>'+projectStatus(r)+'</td>'+
 '<td>'+ (r.guided_cell_count?'Guiado: '+r.guided_cell_count+' · ':'')+
 (list(r.diagnostics).length?'Diagnóstico: '+list(r.diagnostics).length+' · ':'')+
 (r.attempt_count?'Accesos OOP: '+r.attempt_count:'—')+'</td>'+
 '<td>'+ (needsReview(r)?pill('Revisar','review'):'')+
 '<button type="button" class="smallBtn" data-student-id="'+escapeHtml(r.student_registry_id)+'">Detalle</button></td>'+
 '</tr>').join('');
 const unmatched=list(report.unmatched_team_members);
 $('unmatchedPanel').classList.toggle('hidden',!unmatched.length);
 $('unmatched').innerHTML=unmatched.map(x=>'<p>'+escapeHtml(x.name)+' · equipo '+escapeHtml(x.team_label)+' · '+escapeHtml(x.group_entered)+' · sin vínculo confirmado a matrícula</p>').join('');
}
function section(title,data){
 return '<section class="detailBlock"><h3>'+escapeHtml(title)+'</h3><pre>'+escapeHtml(JSON.stringify(data,null,2))+'</pre></section>';
}
function inspect(id){
 const r=list(report?.students).find(x=>x.student_registry_id===id);if(!r)return;
 $('detailName').textContent=r.group_code+' · '+r.display_name;
 $('detailEmail').textContent='Correo(s): '+(list(r.emails).join(' · ')||'No identificado');
 $('detailContent').innerHTML=[
 section('S01 y S02 · constancia guardada (no nota aprobada)',r.oop_sessions),
 section('Borradores sincronizados · no equivalen a entrega',r.drafts),
 section('Inscripciones y fechas de actividad',r.course_attempts),
 section('Proyectos asignados y evidencias funcionales',r.projects),
 section('Proyecto guiado · celdas registradas',r.guided_project_cells),
 section('Diagnósticos',r.diagnostics),
 section('Perfiles de estudio',r.studio_profiles),
 section('Otros laboratorios históricos',r.legacy_oop_labs),
 section('Calidad del respaldo',{historical_missing_or_changed:r.historical_sessions_missing_or_changed,project_page_accesses:r.project_page_accesses})
 ].join('');
 $('details').showModal();
}
function csvCell(v){
 const s=String(v??'').replace(/"/g,'""');
 return '"'+s+'"';
}
function exportCsv(){
 const header=['Grupo','Estudiante','Correos','Registros S01','Registros S02','Borradores Supabase','Inscripciones','Proyectos asignados','Proyectos confirmados','Celdas proyecto guiado','Histórico modificado/faltante','Revisar identidad'];
 const items=filtered().map(x=>[x.group_code,x.display_name,list(x.emails).join('; '),x.s01_records,x.s02_records,x.draft_count,x.attempt_count,x.project_count,x.project_confirmed_count,x.guided_cell_count,x.historical_sessions_missing_or_changed,list(x.emails).length!==1?'SI':'NO']);
 const csv='\ufeff'+[header,...items].map(r=>r.map(csvCell).join(';')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob);const a=document.createElement('a');
 a.href=url;a.download='Seminario_11_auditoria_61_estudiantes_2026.csv';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),250);
}
async function request(name,args){if(!sb)throw new Error('No está disponible la conexión Supabase.');const {data,error}=await sb.rpc(name,args);if(error)throw new Error(error.message||'Error de base de datos');return data;}
async function load(){
 if(busy||!token)return;
 busy=true;$('refresh').disabled=true;
 try{const d=await request('teacher_seminar_progress_audit_v1',{p_teacher_token:token});
 if(!d||d.roster_count!==61||!Array.isArray(d.students)||d.students.length!==61)throw new Error('Inconsistencia de la matrícula: no se mostrarán resultados incompletos.');
 report=d;render();$('dashboard').classList.remove('hidden');
 }catch(e){$('lastUpdate').textContent='Error al actualizar: '+e.message;}finally{busy=false;$('refresh').disabled=false;}
}
$('loginForm').addEventListener('submit',async ev=>{
 ev.preventDefault();const button=$('loginForm').querySelector('button');button.disabled=true;$('loginError').textContent='';
 try{const a=await request('teacher_code_login',{p_code:$('teacherCode').value,p_user_agent:navigator.userAgent});
 token=a.teacher_token;$('teacherCode').value='';$('loginPanel').classList.add('hidden');$('dashboard').classList.remove('hidden');await load();
 }catch(e){$('loginError').textContent='No se pudo acceder: '+e.message;}finally{button.disabled=false;}
});
$('logout').addEventListener('click',async()=>{const t=token;token='';report=null;
 $('dashboard').classList.add('hidden');$('loginPanel').classList.remove('hidden');
 try{if(t)await request('teacher_code_logout',{p_teacher_token:t});}catch(e){console.warn('Logout expired',e);}
});
$('refresh').addEventListener('click',load);
$('export').addEventListener('click',exportCsv);
for(const k of ['groupFilter','search','statusFilter'])$(k).addEventListener(k==='search'?'input':'change',render);
$('studentRows').addEventListener('click',ev=>{const b=ev.target.closest('button[data-student-id]');if(b)inspect(b.dataset.studentId);});
$('closeDetail').addEventListener('click',()=>$('details').close());
})();