(() => {
  'use strict';
  const config=window.IJR_PYTHON_HUB_CONFIG;
  const topics=window.IJR_PYTHON_HUB_TOPIC_MAP || {};
  const $=id=>document.getElementById(id);
  const escapeHtml=value=>String(value??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const requested=new URLSearchParams(location.search).get('topic') || 'operations';
  const topic=topics[requested];
  if(!config || !window.supabase || !topic){ document.body.innerHTML='<main style="padding:40px;font-family:sans-serif">Theory page could not be loaded.</main>'; return; }
  const client=window.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});

  function getSession(){ try{return JSON.parse(localStorage.getItem(config.sessionStorageKey)||'null');}catch{return null;} }
  async function resume(){
    const saved=getSession(); if(!saved?.registrationId||!saved?.accessToken) return null;
    const {data,error}=await client.rpc(config.rpc.resume,{p_registration_id:saved.registrationId,p_access_token:saved.accessToken});
    if(error) return null; return data.snapshot;
  }
  function progressFor(snapshot,slug){ return snapshot?.topics?.find(item=>item.slug===slug)||null; }

  function diagramVisual(type){
    const flow=(items,cls='diagram-flow')=>`<div class="${cls}">${items.map((item,i)=>`${i?'<i></i>':''}<span>${item}</span>`).join('')}</div>`;
    const cells=(items)=>`<div class="diagram-cells">${items.map((item,i)=>`<div><strong>${item}</strong><small>${i}</small></div>`).join('')}</div>`;
    const tree=(q,a,b)=>`<div class="diagram-tree"><strong>${q}</strong><div class="tree-branches"><span>${a}</span><span>${b}</span></div></div>`;
    switch(type){
      case 'python-colab': return `<div class="brand-flow"><div class="brand-node"><img src="https://www.python.org/static/community_logos/python-logo-only.png" alt="Python logo"><strong>PYTHON</strong><small>language</small></div><i></i><div class="brand-node colab-node"><img src="https://colab.research.google.com/img/colab_favicon_256px.png" alt="Google Colab logo"><strong>COLAB</strong><small>notebook environment</small></div><i></i><div class="brand-node"><span class="runtime-dot">●</span><strong>RUNTIME</strong><small>executes instructions</small></div></div>`;
      case 'calculator-notebook': return `<div class="compare-visual"><div class="calc-mini"><div class="calc-screen">25</div><div class="calc-pad">7 8 9<br>4 5 6<br>1 2 3</div><strong>ONE ANSWER</strong></div><div class="versus">VS</div><div class="notebook-mini"><div class="mini-cell"><b>▶</b><span>values → process</span></div><div class="mini-output">output + reusable steps</div><strong>REPEATABLE PROCESS</strong></div></div>`;
      case 'colab-anatomy': return `<div class="colab-wireframe"><div class="wire-title">Notebook title <span>Runtime ●</span></div><div class="wire-toolbar">File · Edit · Runtime · Help</div><div class="wire-text">TEXT CELL · explanation / notes</div><div class="wire-code"><b>▶</b><div><span>CODE CELL</span><i></i><i></i><i></i></div></div><div class="wire-output">OUTPUT / ERROR FEEDBACK</div></div>`;
      case 'execution-cycle': return `<div class="cycle-visual"><span>WRITE</span><i></i><span>RUN</span><i></i><span>READ</span><i></i><span>CORRECT</span><b>↺</b></div>`;
      case 'operator-map': return `<div class="operator-map">${[['=','assign'],['+','add'],['-','subtract'],['*','multiply'],['/','divide'],['**','power'],['%','remainder']].map(([op,label])=>`<div><strong>${op}</strong><span>${label}</span></div>`).join('')}</div>`;
      case 'top-down': return `<div class="topdown-visual"><div><span>1</span><b>create a</b></div><div><span>2</span><b>create b</b></div><div><span>3</span><b>use a + b</b></div><div><span>4</span><b>display result</b></div><i></i></div>`;
      case 'error-feedback': return `<div class="error-visual"><div class="error-code">CODE</div><i></i><div class="error-box"><strong>SyntaxError</strong><span>read the message</span></div><i></i><div class="error-fix">CONTROLLED FIX</div></div>`;
      case 'stats-bridge': return flow(['one value','variables','lists','logic','loops','functions','statistics'],'bridge-flow');
      case 'variable-memory': return `<div class="memory-visual"><div><strong>score</strong><span>name</span></div><i></i><div class="memory-box"><strong>85</strong><span>stored value</span></div></div>`;
      case 'type-cards': return `<div class="type-grid"><div><b>42</b><span>int</span></div><div><b>4.5</b><span>float</span></div><div><b>"11A"</b><span>str</span></div><div><b>True</b><span>bool</span></div><div><b>None</b><span>NoneType</span></div></div>`;
      case 'conversion-flow': return flow(['"12" · str','int(...)','12 · int','+ 3','15']);
      case 'array-index': return cells(['8','13','21','34']);
      case 'array-growth': return `<div class="array-growth">${cells(['6','12'])}<span>append(18)</span>${cells(['6','12','18'])}</div>`;
      case 'array-summary': return `<div class="summary-fan"><div class="source-list">[5, 10, 15, 20]</div><div class="fan-lines"><span>len</span><span>sum</span><span>min</span><span>max</span><span>mean</span></div></div>`;
      case 'comparison-bool': return flow(['score = 85','score ≥ 70 ?','True']);
      case 'logic-gates': return `<div class="logic-grid"><div><strong>AND</strong><span>T + T → T</span></div><div><strong>OR</strong><span>T + F → T</span></div><div><strong>NOT</strong><span>T → F</span></div></div>`;
      case 'logic-rule': return flow(['score ≥ 70','AND','attendance ≥ .80','→ eligible']);
      case 'decision-tree': return tree('score ≥ 70 ?','True → PASS','False → REVIEW');
      case 'branch-order': return flow(['if','elif','else']);
      case 'indentation': return `<div class="indent-visual"><code>if condition:</code><code class="indent-line">action 1</code><code class="indent-line">action 2</code><code>next statement</code></div>`;
      case 'loop-cycle': return `<div class="loop-visual"><div class="loop-list">[3, 6, 9]</div><i></i><div class="loop-body">value → action</div><b>↺ next item</b></div>`;
      case 'accumulator': return flow(['total = 0','+ 2','+ 4','+ 6','+ 8','20']);
      case 'counter': return flow(['value','condition ?','count + 1','next value']);
      case 'function-machine': return `<div class="function-machine"><span>INPUT</span><i></i><div><strong>FUNCTION</strong><small>named process</small></div><i></i><span>OUTPUT</span></div>`;
      case 'define-call': return flow(['def average(...)','stored process','average(values)','execution']);
      case 'return-print': return `<div class="return-visual"><div><strong>print</strong><span>show it now</span></div><div><strong>return</strong><span>send it back for reuse</span></div></div>`;
      case 'stats-pipeline': return `<div class="summary-fan"><div class="source-list">DATASET</div><div class="fan-lines"><span>count</span><span>total</span><span>mean</span><span>min/max</span><span>range</span></div></div>`;
      case 'mean-balance': return `<div class="mean-visual"><span>8</span><span>12</span><span>10</span><span>14</span><span>6</span><i></i><strong>equal share = 10</strong></div>`;
      case 'range-span': return `<div class="range-visual"><span>min 6</span><i></i><b>range = 8</b><i></i><span>max 14</span></div>`;
      case 'above-mean': return flow(['calculate mean','visit value','value > mean ?','count','repeat']);
      default: return flow(['concept','process','result']);
    }
  }

  function renderResources(){
    if(!topic.resources?.length) return;
    $('resourceSection').classList.remove('hidden');
    $('resourceSection').innerHTML=`<div class="section-heading"><p class="eyebrow">OFFICIAL RESOURCES</p><h2>Use the real tools and documentation.</h2><p>These links point to the official Python and Google Colab resources. The logos are used only to identify the corresponding technology.</p></div><div class="resource-grid">${topic.resources.map(resource=>`<a class="resource-card" href="${resource.url}" target="_blank" rel="noopener noreferrer"><img src="${resource.logo}" alt="${escapeHtml(resource.name)} logo"><div><strong>${escapeHtml(resource.name)}</strong><span>${escapeHtml(resource.kind)}</span><small>${escapeHtml(resource.url.replace(/^https?:\/\//,''))}</small></div><b>↗</b></a>`).join('')}</div>`;
  }

  function render(snapshot){
    const p=progressFor(snapshot,topic.slug);
    if(!p || p.status==='locked'){
      $('accessPanel').classList.remove('hidden');
      $('accessPanel').innerHTML='<p class="eyebrow">TOPIC LOCKED</p><h1>This theory is not released yet.</h1><p>Complete the previous topic workshop first. The learning path controls both theory and workshop access.</p><a class="button button-dark" href="./">Return to learning hub</a>';
      return;
    }
    const reg=snapshot.registration;
    $('sessionBadge').textContent=`${reg.group_code} · ${p.percent}% workshop progress`;
    $('crumbTopic').textContent=`${String(topic.sequence).padStart(2,'0')} · ${topic.title} · Theory`;
    const workshopUrl=`workshop.html?topic=${encodeURIComponent(topic.slug)}`;
    $('workshopTopLink').href=workshopUrl; $('workshopBottomLink').href=workshopUrl;
    $('theoryHero').innerHTML=`<div class="theory-hero-copy"><p class="eyebrow">TOPIC ${String(topic.sequence).padStart(2,'0')} · THEORY</p><h1>${escapeHtml(topic.title)}</h1><p>${escapeHtml(topic.lead)}</p><div class="theory-hero-actions"><a class="button button-dark" href="${workshopUrl}">Open workshop</a><a class="button button-light" href="./">All topics</a></div></div><div class="theory-progress-card"><span>Workshop mastery</span><strong>${Number(p.percent||0)}%</strong><div class="progress-track"><span style="width:${Number(p.percent||0)}%"></span></div><small>${Number(p.correct_count||0)} / ${Number(p.total_count||topic.exercises.length)} validated stages</small></div>`;
    renderResources();
    $('conceptSection').innerHTML=`<div class="section-heading"><p class="eyebrow">CONCEPTUAL FOUNDATION</p><h2>${escapeHtml(topic.definition)}</h2></div><div class="concept-card-grid">${topic.sections.map((section,i)=>`<article class="concept-card"><span>${String(i+1).padStart(2,'0')}</span><h3>${escapeHtml(section.title)}</h3><p>${escapeHtml(section.body)}</p></article>`).join('')}</div><article class="learning-goals-panel"><div><p class="eyebrow">LEARNING GOALS</p><h2>What you should understand before opening the workshop</h2></div><ul>${topic.goals.map(goal=>`<li>${escapeHtml(goal)}</li>`).join('')}</ul></article>`;
    $('diagramGrid').innerHTML=topic.diagrams.map((diagram,i)=>`<article class="diagram-card"><div class="diagram-card-head"><span>${String(i+1).padStart(2,'0')}</span><div><h3>${escapeHtml(diagram.title)}</h3><p>${escapeHtml(diagram.description)}</p></div></div><div class="diagram-stage">${diagramVisual(diagram.type)}</div></article>`).join('');
    $('syntaxSection').innerHTML=`<div class="section-heading"><p class="eyebrow">SYNTAX REFERENCE</p><h2>Read the notation as a vocabulary, not as an answer key.</h2></div><div class="syntax-reference-grid">${topic.syntax.map(([label,code])=>`<article><span>${escapeHtml(label)}</span><code>${escapeHtml(code)}</code></article>`).join('')}</div>`;
    $('pitfallSection').innerHTML=`<div class="section-heading"><p class="eyebrow">COMMON MISTAKES</p><h2>Use mistakes as diagnostic clues.</h2></div><div class="pitfall-grid">${topic.pitfalls.map((item,i)=>`<article><strong>${String(i+1).padStart(2,'0')}</strong><p>${escapeHtml(item)}</p></article>`).join('')}</div>`;
    $('theoryApp').classList.remove('hidden');
  }

  document.addEventListener('DOMContentLoaded',async()=>{
    const snapshot=await resume();
    if(!snapshot){ $('accessPanel').classList.remove('hidden'); $('accessPanel').innerHTML='<p class="eyebrow">REGISTRATION REQUIRED</p><h1>Open the Learning Hub first.</h1><p>Your theory access follows the registered learning path and prerequisite rules.</p><a class="button button-dark" href="./">Open Learning Hub</a>'; return; }
    render(snapshot);
  });
})();
