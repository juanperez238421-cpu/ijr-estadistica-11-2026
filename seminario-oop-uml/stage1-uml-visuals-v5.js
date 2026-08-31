(() => {
  'use strict';

  const examples=[
    {id:'student',domain:'School',name:'Student',responsibility:'Represent one enrolled student and the academic state and actions that belong to that student.',attrs:['- name : String','- grade : int','- average : float'],methods:['+ study(hours : int) : void','+ promote() : void','+ summary() : String'],objects:[['maya : Student','name = "Maya" · grade = 11 · average = 4.6'],['leo : Student','name = "Leo" · grade = 10 · average = 3.9']],requirement:'A student has a name, grade and average. The student can study, be promoted and summarize academic information.',why:'The class is the reusable model. Maya and Leo are separate objects: same structure, different state.'},
    {id:'bank-account',domain:'Banking',name:'BankAccount',responsibility:'Represent one bank account, the state it stores and the operations that govern its balance.',attrs:['- owner : String','- balance : float','- active : bool'],methods:['+ deposit(amount : float) : void','+ withdraw(amount : float) : bool','+ statement() : String'],objects:[['accountA : BankAccount','owner = "Alex" · balance = 120.00'],['accountB : BankAccount','owner = "Sam" · balance = 880.50']],requirement:'A bank account stores its owner, balance and active state. It can receive deposits, process withdrawals and produce a statement.',why:'Balance is state because each account remembers its own value. deposit() and withdraw() are methods because they belong to the account responsibility.'},
    {id:'game-character',domain:'Video game',name:'GameCharacter',responsibility:'Represent one game character, its changing state and character-owned actions.',attrs:['- health : int','- position : Vector2','- level : int'],methods:['+ move(direction : Vector2) : void','+ takeDamage(points : int) : void','+ heal(points : int) : void'],objects:[['hero : GameCharacter','health = 100 · level = 7'],['boss : GameCharacter','health = 450 · level = 12']],requirement:'A game character has health, position and level. It can move, take damage and heal.',why:'The class describes every character. hero and boss are instances with different state but the same behavior contract.'},
    {id:'sensor',domain:'Science',name:'Sensor',responsibility:'Represent one measuring device and the state and behavior required to obtain reliable measurements.',attrs:['- identifier : String','- value : float','- unit : String'],methods:['+ read() : float','+ calibrate(offset : float) : void','+ isValid() : bool'],objects:[['sensorA : Sensor','identifier = "T-01" · value = 22.4'],['sensorB : Sensor','identifier = "T-02" · value = 31.1']],requirement:'A sensor stores an identifier, the latest value and its unit. It can read, calibrate and validate measurements.',why:'identifier and value persist between method calls, so they are attributes. read() and calibrate() are actions owned by Sensor.'},
    {id:'playlist',domain:'Music app',name:'Playlist',responsibility:'Represent one playlist, its song collection and the operations used to manage that collection.',attrs:['- title : String','- songs : List<Song>','- public : bool'],methods:['+ addSong(song : Song) : void','+ removeSong(song : Song) : bool','+ duration() : int'],objects:[['studyMix : Playlist','title = "Study Mix" · songs = 18'],['gymMix : Playlist','title = "Gym" · songs = 32']],requirement:'A playlist has a title, songs and visibility. It can add or remove songs and calculate total duration.',why:'The song collection is state of this playlist. addSong() changes that state; duration() derives information from it.'},
    {id:'product',domain:'Store',name:'Product',responsibility:'Represent one sellable product, its commercial state and product-owned operations.',attrs:['- name : String','- price : float','- stock : int'],methods:['+ applyDiscount(percent : float) : void','+ restock(quantity : int) : void','+ inStock() : bool'],objects:[['notebook : Product','price = 8.50 · stock = 42'],['marker : Product','price = 2.20 · stock = 9']],requirement:'A product stores name, price and stock. It can receive a discount, be restocked and report availability.',why:'Store address is not shown because it belongs to Store, not to each Product. Cohesion means keeping only Product responsibility here.'},
    {id:'vehicle',domain:'Transport',name:'Vehicle',responsibility:'Represent a vehicle with state and behavior common to multiple concrete vehicle objects.',attrs:['- speed : float','- fuelLevel : float','- running : bool'],methods:['+ start() : void','+ accelerate(delta : float) : void','+ stop() : void'],objects:[['carA : Vehicle','speed = 0 · fuelLevel = 0.72'],['vanB : Vehicle','speed = 52 · fuelLevel = 0.41']],requirement:'A vehicle stores speed, fuel level and running state. It can start, accelerate and stop.',why:'This visual prepares students for later generalization: Bicycle or Car may eventually specialize Vehicle, but Stage 01 first focuses on the class box itself.'},
    {id:'thermostat',domain:'Smart home',name:'Thermostat',responsibility:'Represent one thermostat and protect the temperature state it controls.',attrs:['- temperature : float','- target : float','- mode : String'],methods:['+ setTarget(value : float) : bool','+ cool() : void','+ heat() : void'],objects:[['roomA : Thermostat','temperature = 23.5 · target = 22'],['roomB : Thermostat','temperature = 19.0 · target = 21']],requirement:'A thermostat remembers current temperature, target temperature and mode. It can change target, cool or heat.',why:'The target is usually private state. A method such as setTarget() can protect valid limits instead of allowing uncontrolled external modification.'}
  ];

  const challengeIds=['student','sensor','bank-account','game-character','playlist','product'];
  const visualState={caseId:'student',score:0,total:5,mastery:false,checked:false,answers:{},examplesSeen:new Set(),legacy:false};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const byId=id=>examples.find(x=>x.id===id)||examples[0];

  function classCard(item){
    return `<div class="uml-v5-class-card" aria-label="UML class ${esc(item.name)}"><div class="uml-v5-class-name">${esc(item.name)}</div><div class="uml-v5-class-section"><div class="uml-v5-section-label">Attributes · state</div>${item.attrs.map(x=>`<div>${esc(x)}</div>`).join('')}</div><div class="uml-v5-class-section"><div class="uml-v5-section-label">Methods / operations · behavior</div>${item.methods.map(x=>`<div>${esc(x)}</div>`).join('')}</div></div>`;
  }

  function anatomySvg(){
    return `<svg class="uml-v5-svg" viewBox="0 0 940 500" role="img" aria-label="Anatomy of a UML class diagram">
      <defs><marker id="umlV5Arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#111"/></marker></defs>
      <rect x="300" y="55" width="350" height="360" fill="#fff" stroke="#111" stroke-width="4"/>
      <line x1="300" y1="145" x2="650" y2="145" stroke="#111" stroke-width="4"/><line x1="300" y1="280" x2="650" y2="280" stroke="#111" stroke-width="4"/>
      <text x="475" y="110" text-anchor="middle" font-size="31" font-family="system-ui" font-weight="800">Sensor</text>
      <text x="330" y="190" font-size="21" font-family="monospace">- identifier : String</text><text x="330" y="228" font-size="21" font-family="monospace">- value : float</text><text x="330" y="264" font-size="21" font-family="monospace">- unit : String</text>
      <text x="330" y="326" font-size="20" font-family="monospace">+ read() : float</text><text x="330" y="364" font-size="20" font-family="monospace">+ calibrate(offset : float) : void</text><text x="330" y="402" font-size="20" font-family="monospace">+ isValid() : bool</text>
      <text x="40" y="105" font-size="20" font-family="system-ui" font-weight="800">CLASS NAME</text><text x="40" y="130" font-size="15" font-family="system-ui">What concept is modeled?</text><line x1="205" y1="111" x2="292" y2="111" stroke="#111" stroke-width="2" marker-end="url(#umlV5Arrow)"/>
      <text x="30" y="215" font-size="20" font-family="system-ui" font-weight="800">ATTRIBUTES</text><text x="30" y="240" font-size="15" font-family="system-ui">What must each object remember?</text><line x1="220" y1="220" x2="292" y2="220" stroke="#111" stroke-width="2" marker-end="url(#umlV5Arrow)"/>
      <text x="705" y="332" font-size="20" font-family="system-ui" font-weight="800">METHODS</text><text x="705" y="357" font-size="15" font-family="system-ui">What can the object do?</text><line x1="695" y1="340" x2="658" y2="340" stroke="#111" stroke-width="2" marker-end="url(#umlV5Arrow)"/>
      <text x="310" y="460" font-size="15" font-family="system-ui">Read top → middle → bottom: identity → state → behavior</text>
    </svg>`;
  }

  function relationshipSvg(kind){
    const common=`<defs><marker id="a-${kind}" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#111"/></marker></defs>`;
    if(kind==='association')return `<svg viewBox="0 0 560 210" role="img" aria-label="Association example">${common}<rect x="40" y="50" width="160" height="85" fill="#fff" stroke="#111" stroke-width="3"/><rect x="360" y="50" width="160" height="85" fill="#fff" stroke="#111" stroke-width="3"/><text x="120" y="100" text-anchor="middle" font-family="system-ui" font-size="22" font-weight="800">Student</text><text x="440" y="100" text-anchor="middle" font-family="system-ui" font-size="22" font-weight="800">Course</text><line x1="200" y1="92" x2="360" y2="92" stroke="#111" stroke-width="3"/><text x="280" y="78" text-anchor="middle" font-family="system-ui" font-size="15">enrolls in</text><text x="280" y="172" text-anchor="middle" font-family="system-ui" font-size="15">Association · objects know/collaborate</text></svg>`;
    if(kind==='composition')return `<svg viewBox="0 0 560 210" role="img" aria-label="Composition example"><rect x="40" y="50" width="160" height="85" fill="#fff" stroke="#111" stroke-width="3"/><rect x="360" y="50" width="160" height="85" fill="#fff" stroke="#111" stroke-width="3"/><text x="120" y="100" text-anchor="middle" font-family="system-ui" font-size="22" font-weight="800">Order</text><text x="440" y="100" text-anchor="middle" font-family="system-ui" font-size="22" font-weight="800">LineItem</text><polygon points="200,92 220,78 240,92 220,106" fill="#111"/><line x1="240" y1="92" x2="360" y2="92" stroke="#111" stroke-width="3"/><text x="280" y="74" text-anchor="middle" font-family="system-ui" font-size="15">owns</text><text x="280" y="172" text-anchor="middle" font-family="system-ui" font-size="15">Composition · strong whole–part lifecycle</text></svg>`;
    if(kind==='generalization')return `<svg viewBox="0 0 560 210" role="img" aria-label="Generalization example"><rect x="40" y="50" width="160" height="85" fill="#fff" stroke="#111" stroke-width="3"/><rect x="360" y="50" width="160" height="85" fill="#fff" stroke="#111" stroke-width="3"/><text x="120" y="100" text-anchor="middle" font-family="system-ui" font-size="22" font-weight="800">Bicycle</text><text x="440" y="100" text-anchor="middle" font-family="system-ui" font-size="22" font-weight="800">Vehicle</text><line x1="200" y1="92" x2="335" y2="92" stroke="#111" stroke-width="3"/><polygon points="360,92 335,75 335,109" fill="#fff" stroke="#111" stroke-width="3"/><text x="280" y="72" text-anchor="middle" font-family="system-ui" font-size="15">is a</text><text x="280" y="172" text-anchor="middle" font-family="system-ui" font-size="15">Generalization · inheritance / is-a</text></svg>`;
    return `<svg viewBox="0 0 560 210" role="img" aria-label="Dependency example">${common}<rect x="40" y="50" width="180" height="85" fill="#fff" stroke="#111" stroke-width="3"/><rect x="360" y="50" width="160" height="85" fill="#fff" stroke="#111" stroke-width="3"/><text x="130" y="100" text-anchor="middle" font-family="system-ui" font-size="20" font-weight="800">ReportService</text><text x="440" y="100" text-anchor="middle" font-family="system-ui" font-size="22" font-weight="800">Printer</text><line x1="220" y1="92" x2="352" y2="92" stroke="#111" stroke-width="3" stroke-dasharray="10 7" marker-end="url(#a-${kind})"/><text x="285" y="72" text-anchor="middle" font-family="system-ui" font-size="15">uses temporarily</text><text x="280" y="172" text-anchor="middle" font-family="system-ui" font-size="15">Dependency · temporary use rather than ownership</text></svg>`;
  }

  function theoryMarkup(){
    return `<section id="umlVisualAtlasV5" class="panel uml-v5-atlas">
      <p class="eyebrow">STAGE 01 · VISUAL UML ATLAS V5</p><h2>See the model before writing the code.</h2>
      <p class="atlas-intro">UML becomes easier when students can point to each visual region and explain its job. The figures below make the distinction explicit: <strong>class = model</strong>, <strong>attributes = remembered state</strong>, <strong>methods = owned behavior</strong>, and <strong>objects = concrete instances outside the class box</strong>.</p>
      <div class="uml-v5-hero-grid"><figure class="uml-v5-figure">${anatomySvg()}<figcaption class="uml-v5-figure-caption">Figure 01 · Anatomy of a standard three-compartment UML class box.</figcaption></figure><div class="uml-v5-legend"><article><strong>Identity</strong><p>The top compartment names the reusable concept. Use a singular class name such as <code>Sensor</code>, not one object's name such as <code>sensorA</code>.</p></article><article><strong>State</strong><p>The middle compartment stores attributes that can differ from object to object: identifier, value, unit.</p></article><article><strong>Behavior</strong><p>The bottom compartment lists operations the object can perform: read, calibrate, validate.</p></article><article><strong>Objects stay separate</strong><p><code>sensorA : Sensor</code> and <code>sensorB : Sensor</code> are instances created from the class model; they are not extra compartments inside the class.</p></article></div></div>
      <div style="margin-top:26px"><p class="eyebrow">VISUAL CLASS EXAMPLE GALLERY</p><h3>Change domain. Keep the same modeling questions.</h3><div id="umlV5GalleryToolbar" class="uml-v5-gallery-toolbar"></div><div id="umlV5Gallery" class="uml-v5-example-grid"></div></div>
      <div style="margin-top:28px"><p class="eyebrow">REQUIREMENT → CLASS DIAGRAM</p><h3>Transform a sentence into a visual model.</h3><div id="umlV5ConceptFlow" class="uml-v5-concept-flow"></div></div>
      <div style="margin-top:28px"><p class="eyebrow">RELATIONSHIP PREVIEW · LOOK FIRST, MASTER LATER</p><h3>Class diagrams become networks of responsibilities.</h3><p>Stage 01 mastery focuses on one class box, but these figures preview the visual vocabulary used when several classes collaborate.</p><div class="uml-v5-relationships"><article class="uml-v5-rel-card">${relationshipSvg('association')}<strong>Association</strong><p>Student and Course can exist independently but collaborate.</p></article><article class="uml-v5-rel-card">${relationshipSvg('composition')}<strong>Composition</strong><p>Order owns its LineItem parts in this simplified model.</p></article><article class="uml-v5-rel-card">${relationshipSvg('generalization')}<strong>Generalization</strong><p>Bicycle is a specialized Vehicle. The hollow triangle points toward the parent.</p></article><article class="uml-v5-rel-card">${relationshipSvg('dependency')}<strong>Dependency</strong><p>ReportService temporarily uses Printer without necessarily owning it as stored state.</p></article></div></div>
      <div style="margin-top:28px"><p class="eyebrow">COHESION · BAD VS BETTER</p><h3>A class should not become a box for everything in the system.</h3><div class="uml-v5-before-after"><div><div class="uml-v5-mini-class"><div>StudentEverything</div><div>- name : String<br>- grade : int<br>- schoolAddress : String<br>- cafeteriaMenu : List<br>- weather : float</div><div>+ study()<br>+ calculateWeather()<br>+ sendInvoice()<br>+ openDoor()</div></div><p class="uml-v5-figure-caption">Too many unrelated responsibilities.</p></div><div class="arrow">→</div><div><div class="uml-v5-mini-class uml-v5-good"><div>Student</div><div>- name : String<br>- grade : int<br>- average : float</div><div>+ study(hours : int)<br>+ promote()<br>+ summary()</div></div><p class="uml-v5-figure-caption">Focused state and behavior that belong to Student.</p></div></div></div>
    </section>`;
  }

  function galleryRender(id){
    const item=byId(id); visualState.examplesSeen.add(item.id);
    const toolbar=document.getElementById('umlV5GalleryToolbar'),host=document.getElementById('umlV5Gallery'),flow=document.getElementById('umlV5ConceptFlow');
    if(!toolbar||!host||!flow)return;
    [...toolbar.querySelectorAll('button')].forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.example===item.id)));
    host.innerHTML=`<div>${classCard(item)}<div class="uml-v5-object-pair">${item.objects.map(([name,state])=>`<article class="uml-v5-object"><strong>${esc(name)}</strong><small>${esc(state)}</small></article>`).join('')}</div></div><div><p class="eyebrow">${esc(item.domain)} · RESPONSIBILITY</p><h3>${esc(item.name)} is responsible for…</h3><p>${esc(item.responsibility)}</p><div class="uml-v5-example-note"><strong>Why this diagram works</strong><p>${esc(item.why)}</p></div><div class="callout"><strong>Requirement:</strong> ${esc(item.requirement)}</div><p><strong>Teacher prompt:</strong> Point to one attribute and explain why two objects can have different values. Then point to one method and explain why it belongs to this class.</p></div>`;
    flow.innerHTML=`<article><span>01 · Requirement</span><strong>Read the sentence</strong><p>${esc(item.requirement)}</p></article><article><span>02 · Concept</span><strong>${esc(item.name)}</strong><p>Choose the reusable noun with one coherent responsibility.</p></article><article><span>03 · State + behavior</span><strong>${esc(item.attrs[0].replace(/^[-+#~]\s*/,''))}</strong><p>State goes to the middle. Actions such as <code>${esc(item.methods[0].replace(/^[-+#~]\s*/,''))}</code> go to the bottom.</p></article><article><span>04 · Instances</span><strong>${esc(item.objects[0][0])}</strong><p>Create concrete objects after the class model is clear.</p></article>`;
  }

  function mountTheory(){
    if(document.getElementById('umlVisualAtlasV5'))return;
    const params=new URLSearchParams(location.search); if((params.get('topic')||'object-model')!=='object-model')return;
    const anchor=document.getElementById('umlDeepPanel')||document.getElementById('foundationPanel'); if(!anchor)return;
    anchor.insertAdjacentHTML('afterend',theoryMarkup());
    const toolbar=document.getElementById('umlV5GalleryToolbar');
    toolbar.innerHTML=examples.map((x,i)=>`<button type="button" data-example="${esc(x.id)}" aria-pressed="${i===0?'true':'false'}">${esc(x.domain)} · ${esc(x.name)}</button>`).join('');
    toolbar.addEventListener('click',e=>{const btn=e.target.closest('button[data-example]');if(btn)galleryRender(btn.dataset.example);});
    galleryRender(examples[0].id);
  }

  function challengeMarkup(){
    return `<section id="umlVisualChallengeV5" class="panel uml-v5-workshop">
      <p class="eyebrow">STAGE 01 · VISUAL DIAGRAM READING SPRINT</p><h2>Read the figure, not only the text.</h2>
      <p>Select a class diagram. Then identify five visual elements: the class name, one attribute, one method, one object instance and one item that does not belong to the class responsibility. This is deliberately diagram-first practice.</p>
      <div class="uml-v5-gallery-toolbar" id="umlV5ChallengeToolbar">${challengeIds.map((id,i)=>{const x=byId(id);return `<button type="button" data-example="${esc(id)}" aria-pressed="${i===0?'true':'false'}">${esc(x.name)}</button>`}).join('')}</div>
      <div class="uml-v5-challenge-grid"><div class="uml-v5-challenge-figure" id="umlV5ChallengeFigure"></div><div><div id="umlV5Questions" class="uml-v5-questions"></div><div class="uml-v5-score"><span id="umlV5VisualStatus">Classify all five highlighted visual elements.</span><span id="umlV5VisualScore" class="uml-v5-score-badge">0 / 5</span></div><div style="margin-top:12px"><button id="checkUmlV5Visual" class="button button-dark" type="button">Check visual reading</button></div></div></div>
    </section>`;
  }

  function challengeItems(item){
    return [
      {key:'class',value:item.name,answer:'class',prompt:'The large title at the top of the box'},
      {key:'attribute',value:item.attrs[1]||item.attrs[0],answer:'attribute',prompt:'A row inside the middle compartment'},
      {key:'method',value:item.methods[0],answer:'method',prompt:'A row inside the bottom compartment'},
      {key:'object',value:item.objects[0][0],answer:'object',prompt:'A concrete instance shown outside the class box'},
      {key:'not-member',value:item.id==='student'?'schoolBellTime : Time':item.id==='sensor'?'laboratoryName : String':item.id==='bank-account'?'bankLogo : Image':item.id==='game-character'?'serverRegion : String':item.id==='playlist'?'userPassword : String':'storeAddress : String',answer:'not-member',prompt:'A plausible-looking item that belongs elsewhere'}
    ];
  }

  function challengeRender(id){
    const item=byId(id); visualState.caseId=item.id; visualState.checked=false; visualState.score=0; visualState.total=5; visualState.mastery=false; visualState.answers={}; visualState.examplesSeen.add(item.id);
    const toolbar=document.getElementById('umlV5ChallengeToolbar'); if(toolbar)[...toolbar.querySelectorAll('button')].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.example===item.id)));
    const figure=document.getElementById('umlV5ChallengeFigure'),questions=document.getElementById('umlV5Questions'); if(!figure||!questions)return;
    figure.innerHTML=`<p class="eyebrow">FIGURE · ${esc(item.domain)}</p>${classCard(item)}<div class="uml-v5-object-pair">${item.objects.map(([name,state])=>`<article class="uml-v5-object"><strong>${esc(name)}</strong><small>${esc(state)}</small></article>`).join('')}</div><div class="callout"><strong>One outsider:</strong> ${esc(challengeItems(item)[4].value)}</div><p class="uml-v5-figure-caption">Use position and meaning together. A row is not an attribute merely because it contains a colon; ask whether the object must remember it.</p>`;
    const options=[['','Choose…'],['class','Class'],['attribute','Attribute'],['method','Method'],['object','Object / instance'],['not-member','Does not belong']];
    questions.innerHTML=challengeItems(item).map((q,i)=>`<article class="uml-v5-question" data-key="${esc(q.key)}"><strong>${String(i+1).padStart(2,'0')} · ${esc(q.prompt)}</strong><code>${esc(q.value)}</code><select aria-label="Classify ${esc(q.value)}">${options.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select><p class="feedback" hidden></p></article>`).join('');
    document.getElementById('umlV5VisualScore').textContent='0 / 5';document.getElementById('umlV5VisualScore').classList.remove('ok');document.getElementById('umlV5VisualStatus').textContent='Classify all five highlighted visual elements.';
    syncModelGate();
  }

  function checkVisual(){
    const item=byId(visualState.caseId),answers=challengeItems(item);let score=0;
    document.querySelectorAll('#umlV5Questions .uml-v5-question').forEach((card,i)=>{const select=card.querySelector('select'),feedback=card.querySelector('.feedback'),q=answers[i],ok=select.value===q.answer;visualState.answers[q.key]=select.value;if(ok)score++;feedback.hidden=false;feedback.textContent=ok?'Correct.':`Review: this is ${q.answer==='not-member'?'outside the class responsibility':q.answer}.`;});
    visualState.score=score;visualState.total=answers.length;visualState.checked=true;visualState.mastery=score===answers.length;
    const badge=document.getElementById('umlV5VisualScore');badge.textContent=`${score} / ${answers.length}`;badge.classList.toggle('ok',visualState.mastery);
    document.getElementById('umlV5VisualStatus').textContent=visualState.mastery?'Perfect visual reading. Combine this with the identification lab and your own UML draft.':'Re-read the diagram: position helps, but responsibility decides what belongs.';
    syncModelGate();
    if(visualState.mastery)document.dispatchEvent(new CustomEvent('ijr-oop-uml-visual-mastered',{detail:{score,total:answers.length,caseId:item.id}}));
  }

  function mountWorkshop(){
    if(document.getElementById('umlVisualChallengeV5'))return;
    const params=new URLSearchParams(location.search);if((params.get('topic')||'object-model')!=='object-model')return;
    const anchor=document.getElementById('umlClassificationPanel')||document.querySelector('#workshopPanel section.panel');if(!anchor)return;
    anchor.insertAdjacentHTML('afterend',challengeMarkup());
    document.getElementById('umlV5ChallengeToolbar').addEventListener('click',e=>{const btn=e.target.closest('button[data-example]');if(btn)challengeRender(btn.dataset.example);});
    document.getElementById('checkUmlV5Visual').addEventListener('click',checkVisual);
    challengeRender(visualState.caseId);
  }

  const basePractice=window.IJR_OOP_UML_STAGE1_PRACTICE;
  function baseEvidence(){try{return basePractice?.evidence?.()||{};}catch{return {};}}
  function syncModelGate(){
    const model=document.getElementById('evModel');if(!model)return;
    const base=baseEvidence();
    if(visualState.legacy)return;
    if(base.uml_mastery===true&&visualState.mastery===true)model.checked=true;
    else if(base.uml_mastery===true&&visualState.mastery!==true)model.checked=false;
  }

  if(basePractice){
    window.IJR_OOP_UML_STAGE1_PRACTICE={
      evidence(){
        return {...baseEvidence(),uml_visual_version:'stage1-uml-visual-v5',uml_visual_case:visualState.caseId,uml_visual_score:visualState.score,uml_visual_total:visualState.total,uml_visual_mastery:visualState.mastery,uml_visual_examples_seen:[...visualState.examplesSeen].join(',')};
      },
      hydrate(evidence={}){
        basePractice.hydrate?.(evidence);
        visualState.caseId=challengeIds.includes(evidence.uml_visual_case)?evidence.uml_visual_case:visualState.caseId;
        visualState.score=Number(evidence.uml_visual_score||0);visualState.total=Number(evidence.uml_visual_total||5);visualState.mastery=evidence.uml_visual_mastery===true;visualState.checked=visualState.score>0;visualState.legacy=evidence.model===true&&!evidence.uml_visual_version;
        String(evidence.uml_visual_examples_seen||'').split(',').filter(Boolean).forEach(x=>visualState.examplesSeen.add(x));
        if(document.getElementById('umlV5ChallengeFigure'))challengeRender(visualState.caseId);
        syncModelGate();
      },
      activate(active){basePractice.activate?.(active);const panel=document.getElementById('umlVisualChallengeV5');if(panel)panel.classList.toggle('hidden',!active);syncModelGate();}
    };
  }

  window.IJR_OOP_UML_VISUAL_V5=Object.freeze({version:'oop-uml-visual-v5',examples});
  document.addEventListener('ijr-oop-uml-model-mastered',()=>setTimeout(syncModelGate,0));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{mountTheory();mountWorkshop();},0));
})();