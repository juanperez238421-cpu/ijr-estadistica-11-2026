(()=>{
'use strict';
const plans={
clients:{title:'Página web · directorio de clientes ficticios',product:'Una aplicación con formulario, búsqueda, validación y datos de demostración. Define tu propio usuario y necesidad antes de adoptar el ejemplo.',steps:[
['Define usuario y problema; escribe tres historias «Como…, quiero…, para…». Dibuja formulario y listado.','Abre la primera celda y localiza HTML, CSS y JavaScript. Cambia título, etiquetas y diseño para tu usuario.','Prueba a 360 px y con teclado; registra qué campos son obligatorios.','Entrega boceto, alcance de tres funciones y primera captura.'],
['Implementa alta y listado con registros ficticios; identifica dónde se valida y dónde se guarda.','Añade por tu cuenta un campo relevante y su validación; explica cada cambio.','Prueba entrada válida, vacía, duplicada y texto con caracteres especiales; registra esperado/obtenido.','Entrega fuentes y tabla de cuatro pruebas con resultados reales.'],
['Implementa búsqueda y la persistencia que ofrece el taller; distingue datos locales y datos compartidos.','Añade un filtro propio sin romper el alta. Si conectas datos compartidos, utiliza únicamente el acceso del taller.','Recarga y prueba dos búsquedas sin resultados y con resultados; documenta dónde persisten los datos.','Entrega versión funcional y README para abrirla; usa solo contactos ficticios.'],
['Repite las pruebas desde una sesión limpia y revisa diseño móvil y navegación por teclado.','Introduce un fallo de validación, observa el resultado y corrígelo en un commit separado.','Demuestra alta, consulta, filtro y un error manejado; identifica límites de la persistencia.','Entrega fuentes, README, evidencia y defensa de un cambio en vivo.']]},
gta:{title:'Página web · catálogo de proyectos GTA V',product:'Un catálogo web de demostración con fichas, búsqueda y filtros; las fichas describen mods, sin afirmar que el taller instala o ejecuta GTA V.',steps:[
['Define público y cinco fichas ficticias: nombre, categoría, descripción y fuente. Dibuja la navegación.','Identifica HTML, CSS y JavaScript en el taller y personaliza el encabezado y una ficha.','Comprueba que las fichas se leen a 360 px y sus enlaces tienen propósito claro.','Entrega boceto, esquema de ficha y primera página.'],
['Construye las fichas desde datos y conserva un identificador único por ficha.','Añade un campo propio y represéntalo en la interfaz sin duplicar la plantilla.','Prueba texto vacío, caracteres especiales y ficha incompleta; documenta el tratamiento.','Entrega código y pruebas de tres fichas diferentes.'],
['Construye búsqueda y filtros por categoría siguiendo las celdas.','Añade una categoría y un filtro propio; incluye un mensaje cuando no hay resultados.','Prueba búsqueda parcial, sin coincidencias y combinación de filtros.','Entrega catálogo funcional y tabla esperado/obtenido.'],
['Comprueba enlaces, teclado, móvil y reconstrucción desde las fuentes.','Corrige un fallo y explica el diff; documenta autoría y fuentes de los recursos.','Demuestra una nueva ficha y un cambio de filtro en vivo.','Entrega HTML, datos, README, pruebas y límites del producto.']]},
cyber:{title:'Ciberseguridad · defensa de un servicio local',product:'Un laboratorio en 127.0.0.1 con una política de defensa, pruebas antes/después y un informe reproducible. El notebook usa peticiones sintéticas; la clase 3 comprueba HTTP local.',steps:[
['Define activo, amenaza y alcance local. Escribe qué debe permitirse y qué debe bloquearse.','Ejecuta Request y baseline; predice los ocho resultados antes de mirar la consola.','Registra la línea base con entrada, configuración y resultado.','Entrega diagrama Request → Policy → respuesta y tabla de línea base.'],
['Identifica las responsabilidades de Policy: tamaño, autorización ficticia y tasa.','Modifica limit y window; predice el nuevo resultado y añade una prueba propia.','Prueba bloqueo, recuperación y cliente independiente usando una Policy nueva por escenario.','Entrega configuración, tabla antes/después y explicación del límite.'],
['Exporta laboratorio_web.py y prueba_local.py; revisa los archivos antes de abrir dos terminales.','Ejecuta python laboratorio_web.py y, en otra terminal, python prueba_local.py; trabaja solo en localhost.','Registra permitido, denegado, tamaño y tasa. La identidad del fixture es didáctica: no demuestra autenticación real.','Entrega archivos y salida HTTP real; si no ejecutaste el servidor, marca esa prueba pendiente.'],
['Ejecuta unittest y añade un caso límite propio con esperado y obtenido.','Introduce un fallo de política, conserva la salida y corrígelo; vuelve a ejecutar toda la suite.','Repite desde un estado limpio y demuestra que el tráfico legítimo se conserva.','Entrega README, código, logs sin secretos y límites de la defensa.']]},
rico:{title:'Animación Python · ruta del proyecto Rico',product:'Un mensaje animado original con corazón, flores y texto, generado por Python y exportado como HTML autónomo. Esta ruta también sirve de punto de partida a otros estudiantes.',steps:[
['Define destinatario, mensaje y storyboard de tres momentos. No incluyas datos personales en la evidencia.','Edita Config y ejecuta configuración, primera animación y pruebas en ese orden.','Cambia duración y FPS; comprueba número de cuadros y movimiento.','Entrega storyboard, configuración y primera animación personalizada.'],
['Relaciona Scene, Heart, Flower y Message con su responsabilidad.','Modifica amplitud del corazón y composición de flores; explica cómo depende de t.','Compara frame(1) a 30 y 60 FPS y añade una comprobación propia de tu cambio.','Entrega UML, código modificado y evidencia del movimiento.'],
['Regenera la escena final antes de descargar HTML y generador Python.','Abre el HTML desde otra carpeta sin conexión; si hay USB disponible, repite allí.','Registra equipo, navegador, esperado y obtenido. Un JSON válido no demuestra la prueba offline.','Entrega HTML, Python y registro real de portabilidad; marca las pruebas no realizadas.'],
['Ejecuta la suite y explica qué detecta cada assert.','Reproduce flower_count=-1, corrige y vuelve a ejecutar; añade un caso propio.','Cambia mensaje y fondo en vivo y regenera la animación.','Entrega storyboard, UML, fuentes, HTML, pruebas y defensa individual.']]}
};
const q=new URLSearchParams(location.search);
const rico=location.pathname.includes('/rico/');
const key=rico?'rico':q.get('project');
const root=rico?'../':location.pathname.includes('/studio/')?'../':'';
const main=document.querySelector('main'); if(!main)return;
const style=document.createElement('style');
style.textContent='.guided-project{background:#fff;color:#182235;border:1px solid #dce2eb;border-radius:16px;padding:24px;margin:24px auto;max-width:1120px;box-sizing:border-box;font:16px/1.6 system-ui}.guided-project h2{font-size:26px;margin:0 0 12px}.guided-project a,.guided-project button{display:inline-block;border:1px solid #cbd5e1;border-radius:8px;padding:9px 14px;margin:4px;color:#182235;background:#f8fafc;font:inherit}.guided-project label{display:block;margin:12px 0}.guided-project textarea{display:block;width:100%;box-sizing:border-box;min-height:140px;padding:12px;font:inherit}.guided-project summary{cursor:pointer;font-weight:700}.guided-project input{margin-right:10px}.guided-project small{display:block}';
document.head.append(style);
const panel=document.createElement('section');panel.className='guided-project';panel.setAttribute('aria-label','Proyecto guiado');
const el=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e};
if(!plans[key]){
 panel.append(el('h2','Elige un proyecto guiado'),el('p','Puedes explorar una ruta antes de definir tu proyecto con el docente. Elegir aquí no cambia tu asignación personal.'));
 for(const [k,p]of Object.entries(plans)){const a=el('a',p.title);a.href=k==='rico'?root+'rico/index.html':root+'studio/index.html?project='+k;panel.append(a);}
 main.append(panel);return;
}
const plan=plans[key];const raw=Number(q.get('class'));const n=Number.isFinite(raw)?Math.max(1,Math.min(4,Math.trunc(raw)||1)):1;
panel.append(el('h2',plan.title),el('p',plan.product));
if(!location.pathname.endsWith('/index.html')&&!location.pathname.endsWith('/')){
 panel.append(el('h3','Clase '+n+' · tu trabajo individual'));
 const storageKey='ijr-guided-v1:'+key+':'+n;
 let state={checks:[],notes:''};try{const s=JSON.parse(localStorage.getItem(storageKey)||'null');if(s&&Array.isArray(s.checks)&&typeof s.notes==='string')state=s}catch{}
 const status=el('small','Autoevaluación local: las marcas no certifican ejecución ni aprobación. En equipos compartidos, descarga y borra tu borrador antes de salir.');status.setAttribute('role','status');
 const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(state));status.textContent='Borrador guardado en este navegador. Autoevaluación pendiente de revisión docente.'}catch{status.textContent='No se pudo guardar aquí. Descarga tu bitácora para conservarla.'}};
 plan.steps[n-1].forEach((text,i)=>{const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=state.checks[i]===true;check.addEventListener('change',()=>{state.checks[i]=check.checked;save()});label.append(check,document.createTextNode(text));panel.append(label)});
 const help=document.createElement('details');help.append(el('summary','Si te bloqueas'),el('p','Vuelve a Theory, localiza la celda indicada, ejecuta las dependencias en orden y lee la primera línea del error. Cambia una cosa a la vez. Si pides ayuda, muestra la entrada, el error completo y lo que ya intentaste.'));panel.append(help);
 const label=el('label','Bitácora: decisión propia · cambio en código · prueba esperada/obtenida · evidencia · pendiente');
 const notes=document.createElement('textarea');notes.value=state.notes;notes.placeholder='Qué decidí y por qué:\nArchivo/celda modificada:\nEntrada de prueba:\nEsperado / obtenido:\nReferencia de evidencia:\nQué sigue pendiente:';notes.addEventListener('input',()=>{state.notes=notes.value;save()});label.append(notes);panel.append(label);
 const download=el('button','Descargar bitácora .md');download.type='button';download.addEventListener('click',()=>{const body='# '+plan.title+'\n\nClase '+n+'\n\nAutoevaluación del estudiante; no equivale a aprobación docente.\n\n'+plan.steps[n-1].map((t,i)=>'- ['+(state.checks[i]?'x':' ')+'] '+t).join('\n')+'\n\n## Evidencia y pendientes\n'+state.notes;const url=URL.createObjectURL(new Blob([body],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='bitacora-'+key+'-clase-'+n+'.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});panel.append(download);
 const clear=el('button','Borrar esta bitácora local');clear.type='button';clear.addEventListener('click',()=>{state={checks:[],notes:''};notes.value='';panel.querySelectorAll('input').forEach(i=>i.checked=false);try{localStorage.removeItem(storageKey)}catch{}status.textContent='Bitácora local borrada.'});panel.append(clear,status);
}
else{
 plan.steps.forEach((steps,i)=>{const d=document.createElement('details');d.append(el('summary','Clase '+(i+1)+' · construir, modificar, probar y entregar'));const list=document.createElement('ol');steps.forEach(t=>list.append(el('li',t)));d.append(list);const a=el('a','Comenzar clase '+(i+1));a.href='workshop.html?'+(rico?'':'project='+key+'&')+'class='+(i+1);d.append(a);panel.append(d)});
}
main.append(panel);
})();