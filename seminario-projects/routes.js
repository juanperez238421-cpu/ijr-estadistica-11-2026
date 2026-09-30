(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=new URLSearchParams(location.search).get('project');
const route=window.PROJECT_ROUTES[key];
if(!route){document.getElementById('routeTitle').textContent='Selecciona una ruta desde Mi proyecto.';return;}
document.title='Seminario 11 · '+route.title;
document.getElementById('routeTitle').textContent=route.title;
document.getElementById('routeSummary').textContent=route.summary;
const list=items=>'<ol>'+items.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ol>';
document.getElementById('stageNav').innerHTML=route.stages.map((s,i)=>'<a class="button button-light" href="#stage-'+(i+1)+'">Etapa '+(i+1)+'</a>').join('');
document.getElementById('stages').innerHTML=route.stages.map((s,i)=>`<article class="roadmap-panel" id="stage-${i+1}"><p class="eyebrow">CLASE ${i+1} / 4</p><h2>${esc(s.title)}</h2><div class="info-grid"><section class="info-card"><h3>Theory · Comprender</h3>${list(s.theory)}</section><section class="info-card"><h3>Workshop · Construir</h3>${list(s.build)}${s.code?'<pre><code>'+esc(s.code)+'</code></pre>':''}</section></div><section class="info-card"><h3>Test · Verificar</h3>${list(s.test)}</section><div class="info-grid"><section class="info-card"><h3>Evidence · Entregar</h3><p>${esc(s.evidence)}</p></section><section class="info-card"><h3>Gate · Criterio para avanzar</h3><p>${esc(s.gate)}</p></section></div></article>`).join('');
document.getElementById('resources').innerHTML=route.resources.map(([label,url])=>'<a class="button button-light" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>').join('');
})();
