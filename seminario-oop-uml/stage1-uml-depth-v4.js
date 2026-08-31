(() => {
  'use strict';

  const cases = [
    {
      id:'student', context:'School', className:'Student',
      responsibility:'Represent one enrolled student and the academic actions that belong to that student.',
      members:[
        ['Student','class','This is the general model, not one particular student.'],
        ['name : String','attribute','Each student object needs to remember its own name.'],
        ['grade : int','attribute','Grade is stored state that may differ between students.'],
        ['study(hours : int) : void','method','Studying is behavior performed by a student object.'],
        ['promote() : void','method','Promotion changes or uses student state and belongs to the Student responsibility.'],
        ['studentA = Student("Maya", 11)','object','This is one concrete instance created from the Student class.'],
        ['schoolBellTime : Time','not-member','The school bell schedule belongs to the school/schedule context, not to one Student object.'],
        ['calculateWeather() : float','not-member','Weather calculation is unrelated to the responsibility of Student.']
      ]
    },
    {
      id:'product', context:'Store / e-commerce', className:'Product',
      responsibility:'Represent one sellable product, its own data and the actions that naturally belong to that product.',
      members:[
        ['Product','class','This names the reusable model for products.'],
        ['name : String','attribute','Each product keeps its own name.'],
        ['price : float','attribute','Price is persistent state of a product.'],
        ['applyDiscount(percent : float) : void','method','Discount behavior acts on product price.'],
        ['showPrice() : String','method','Displaying or formatting the product price is product behavior in this simple model.'],
        ['productA = Product("Notebook", 8.5)','object','This is one concrete Product instance.'],
        ['storeAddress : String','not-member','The store address belongs to Store, not to every Product.'],
        ['sendEmail() : void','not-member','Sending email belongs to a notification/service responsibility, not Product.']
      ]
    },
    {
      id:'sensor', context:'Science / data acquisition', className:'Sensor',
      responsibility:'Represent one measuring device, the data it remembers and the actions used to obtain or correct measurements.',
      members:[
        ['Sensor','class','This is the model shared by concrete sensors.'],
        ['identifier : String','attribute','A sensor keeps its own identifier.'],
        ['temperature : float','attribute','The latest measurement is state held by this sensor in the example.'],
        ['read() : float','method','Reading is behavior the sensor performs.'],
        ['calibrate(offset : float) : void','method','Calibration changes how the sensor interprets or stores measurements.'],
        ['sensorA = Sensor("T-01", 22.4)','object','This is one concrete sensor instance.'],
        ['laboratoryName : String','not-member','The laboratory name belongs to a Laboratory or experiment context.'],
        ['calculateStudentGrade() : float','not-member','Student grading has no relation to Sensor responsibility.']
      ]
    },
    {
      id:'game-character', context:'Video game', className:'GameCharacter',
      responsibility:'Represent one character in the game with its own changing state and character actions.',
      members:[
        ['GameCharacter','class','This is the model from which individual characters are created.'],
        ['health : int','attribute','Health is state that differs and changes per character.'],
        ['position : Vector2','attribute','Position is remembered state of each character.'],
        ['move(direction : Vector2) : void','method','Movement is behavior owned by the character.'],
        ['takeDamage(points : int) : void','method','Taking damage changes character health.'],
        ['hero = GameCharacter(100, startPosition)','object','hero is one concrete instance.'],
        ['serverRegion : String','not-member','Server region is infrastructure/session information, not character state.'],
        ['printInvoice() : void','not-member','Invoice behavior is unrelated to a game character.']
      ]
    },
    {
      id:'bank-account', context:'Banking', className:'BankAccount',
      responsibility:'Represent one bank account, its stored balance data and the operations that change that account.',
      members:[
        ['BankAccount','class','This is the general account model.'],
        ['owner : String','attribute','The account remembers who owns it.'],
        ['balance : float','attribute','Balance is persistent state of the account.'],
        ['deposit(amount : float) : void','method','Deposit changes account state.'],
        ['withdraw(amount : float) : bool','method','Withdrawal is account behavior governed by account rules.'],
        ['accountA = BankAccount("Alex", 120.0)','object','This is one specific account instance.'],
        ['bankLogo : Image','not-member','A logo belongs to bank branding, not to one account.'],
        ['movePlayer() : void','not-member','Player movement has no banking responsibility.']
      ]
    },
    {
      id:'playlist', context:'Music application', className:'Playlist',
      responsibility:'Represent one playlist, the data that defines it and the actions used to manage its songs.',
      members:[
        ['Playlist','class','This is the model for all playlist objects.'],
        ['title : String','attribute','Every playlist keeps its own title.'],
        ['songs : List<Song>','attribute','The collection of songs is state owned by this playlist in the simple model.'],
        ['addSong(song : Song) : void','method','Adding a song changes playlist state.'],
        ['duration() : int','method','Total duration is behavior derived from playlist songs.'],
        ['studyMix = Playlist("Study Mix")','object','studyMix is one concrete Playlist instance.'],
        ['userPassword : String','not-member','Authentication data belongs to User/Auth, not Playlist.'],
        ['measureTemperature() : float','not-member','Temperature measurement is unrelated to a playlist.']
      ]
    }
  ];

  const guide = Object.freeze({
    title:'How to construct a UML class diagram — step by step',
    definition:'UML means Unified Modeling Language. A UML class diagram is a visual model of the static structure of software: which classes exist, what state they keep, what behavior they offer, and later, how classes relate to one another. UML is not executable code; it is a design language used before, during and after coding.',
    classMeaning:'A class is a general model for a kind of thing the program needs to represent. It answers: “What concept has one clear responsibility in this problem?” Good beginner class names are singular nouns such as Student, Product, Sensor, BankAccount or Playlist.',
    attributeMeaning:'An attribute is information that an object must remember as part of its state. Ask: “Could two objects of this class have different values here, and should the value still exist after a method finishes?” If yes, it is a strong attribute candidate. Temporary calculations inside a method are usually local variables, not attributes.',
    methodMeaning:'A method is behavior that belongs to the responsibility of the class. Ask: “What can an object of this class do, calculate, change or report using its own state?” A method is not simply any verb in the problem; the action must logically belong to this class.',
    objectMeaning:'An object (instance) is one concrete example created from a class. Student is a class; studentA is an object. Objects do not normally appear inside the three-compartment class box. In an object diagram you may see notation such as studentA : Student.',
    anatomy:[
      ['TOP COMPARTMENT · CLASS NAME','The identity of the model. Usually a singular noun in PascalCase: Sensor, Product, BankAccount.'],
      ['MIDDLE COMPARTMENT · ATTRIBUTES','The state each object stores. Basic UML form: visibility name : Type. Example: - temperature : float.'],
      ['BOTTOM COMPARTMENT · METHODS / OPERATIONS','The behavior the class exposes. Basic UML form: visibility method(parameter : Type) : ReturnType. Example: + read() : float.']
    ],
    notation:[
      ['+','public','Other objects/classes are expected to call or access this member through the public interface.'],
      ['−','private','Internal detail of the class. Beginner default for stored state when direct external modification should be avoided.'],
      ['#','protected','Available to the class and typically subclasses; introduced more deeply with inheritance.'],
      ['~','package','Package/default visibility in UML; useful later, not required for Stage 01 mastery.']
    ],
    constructionSteps:[
      ['01 · Read the requirement','Describe the problem in one sentence before drawing anything.','Example: “A sensor has an identifier and temperature; it can read and calibrate measurements.”','Result: a clear problem boundary.'],
      ['02 · Find candidate concepts','Underline important nouns or domain concepts. Do not automatically make every noun a class.','sensor · identifier · temperature · measurement','Result: Sensor is the strongest class candidate; the others look like data.'],
      ['03 · Give the class one responsibility','Finish the sentence: “A Sensor is responsible for …” If the sentence contains several unrelated jobs, split the design.','A Sensor is responsible for representing one measuring device and its measurement behavior.','Result: class name Sensor.'],
      ['04 · Find attributes / state','Ask what every Sensor object must remember and what can differ between sensorA and sensorB.','identifier, temperature','Result: - identifier : String and - temperature : float.'],
      ['05 · Find methods / behavior','Find actions that naturally belong to Sensor and use/change its state.','read(), calibrate(offset)','Result: + read() : float and + calibrate(offset : float) : void.'],
      ['06 · Remove impostors','Reject data/actions that belong to another concept or exist only temporarily inside a calculation.','laboratoryName belongs to Laboratory; temporaryAverage may be a local variable.','Result: a cohesive class instead of a “everything” class.'],
      ['07 · Add types and visibility','Choose useful data types, parameters, return types and simple visibility. Do not over-design.','- temperature : float; + calibrate(offset : float) : void','Result: precise UML member signatures.'],
      ['08 · Draw the three compartments','Place class name at the top, attributes in the middle and methods at the bottom. Keep one member per line.','Sensor / attributes / operations','Result: a readable UML class box.'],
      ['09 · Test with concrete objects','Imagine at least two objects and ask whether the same class can represent both with different state.','sensorA : Sensor → 22.4 °C; sensorB : Sensor → 31.1 °C','Result: evidence that class and instance are not being confused.'],
      ['10 · Compare UML with code','Translate the model into a language and verify every meaningful field/method has a matching design decision. Update UML when the code architecture changes.','UML temperature ↔ Python self.temperature ↔ Java private double temperature;','Result: model and implementation stay synchronized.']
    ],
    contrasts:[
      ['Class vs object','Student is the reusable model. studentA is one concrete Student. One class can create many objects.'],
      ['Attribute vs local variable','balance belongs to BankAccount state. fee calculated temporarily inside withdraw() may be a local variable instead.'],
      ['Method vs unrelated function','deposit() belongs to BankAccount. calculateWeather() does not, even though both are functions/actions.'],
      ['Class vs “container of everything”','A class should have one coherent responsibility. Store, Product and Payment should not be collapsed into one giant class just because they collaborate.']
    ],
    relationships:[
      ['Association · solid line','One class knows/uses another. Example: Teacher — Course.'],
      ['Aggregation · hollow diamond','A weak whole–part relation where the part can exist independently.'],
      ['Composition · filled diamond','Strong whole–part ownership; the part lifecycle is controlled by the whole.'],
      ['Generalization · hollow triangle','Inheritance / is-a. Example: Bicycle → Vehicle.'],
      ['Dependency · dashed arrow','A temporary use/dependency rather than stored ownership.']
    ]
  });

  window.IJR_OOP_UML_STAGE1_UML = Object.freeze({version:'oop-uml-v4', guide, cases});

  const topic=(window.IJR_OOP_UML_DATA?.topics||[]).find(item=>item.n===1);
  if(topic){
    topic.lead='Begin with the concept, then build the UML model deliberately: class responsibility → attributes/state → methods/behavior → concrete objects → code. Stage 01 now treats the UML class diagram as a design artifact, not decoration after coding.';
    topic.concepts=[
      guide.classMeaning,
      guide.attributeMeaning,
      guide.methodMeaning,
      guide.objectMeaning,
      'A UML class box has three main compartments: class name, attributes, and methods/operations.',
      'The diagram is a model of design decisions. A member belongs in the class only when it supports that class responsibility.',
      'The same UML model can be translated to Python, Java, JavaScript, C#, C++, Kotlin, Swift or other languages even though syntax and language features differ.'
    ];
    topic.evidence=[
      'Explain class, object, attribute and method with a conceptual example',
      'Correctly classify class / attribute / method / object / non-member items in the UML identification challenge',
      'Construct one three-compartment UML class box with a clear responsibility, attributes and methods',
      'Create at least two objects in code and keep the UML model synchronized with the implementation'
    ];
  }

  if(typeof document==='undefined') return;

  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const kindLabel={class:'Class',attribute:'Attribute',method:'Method',object:'Object / instance','not-member':'Does not belong'};

  function installStyles(){
    if(document.getElementById('stage1UmlV4Styles')) return;
    const style=document.createElement('style');
    style.id='stage1UmlV4Styles';
    style.textContent=`
      .uml-deep-panel{margin-top:28px}.uml-anatomy-layout{display:grid;grid-template-columns:minmax(330px,.8fr) minmax(0,1.2fr);gap:18px;margin-top:20px}
      .uml-anatomy-box{border:2px solid #111;background:#fff}.uml-anatomy-part{position:relative;padding:22px 18px;border-bottom:2px solid #111}.uml-anatomy-part:last-child{border-bottom:0}.uml-anatomy-part b{display:block;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.uml-anatomy-part small{display:block;margin-top:6px;color:#666}.uml-anatomy-tag{position:absolute;right:10px;top:10px;border:1px solid #111;border-radius:999px;padding:3px 7px;font-size:9px;font-weight:850;letter-spacing:.08em;background:#fff}
      .uml-definition-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.uml-definition-card{border:1px solid var(--line);padding:16px;background:#fff}.uml-definition-card strong{display:block;font-size:.82rem;text-transform:uppercase;letter-spacing:.06em}.uml-definition-card p{margin:.55rem 0 0}
      .uml-build-steps{display:grid;gap:10px;margin-top:18px}.uml-build-step{display:grid;grid-template-columns:165px minmax(0,1fr);gap:18px;border-top:1px solid var(--line);padding:16px 0}.uml-build-step:first-child{border-top:0}.uml-build-step>strong{font-size:.8rem;letter-spacing:.04em}.uml-build-step p{margin:0 0 6px}.uml-build-step code{font-size:.8rem}.uml-result{display:inline-block;margin-top:5px;font-size:.76rem;font-weight:800;color:#222}
      .uml-notation-table{width:100%;border-collapse:collapse}.uml-notation-table th,.uml-notation-table td{border-bottom:1px solid var(--line);padding:10px;text-align:left;vertical-align:top}.uml-notation-table th{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em}.uml-symbol{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:1.15rem;font-weight:900}
      .uml-worked-flow{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:16px}.uml-worked-flow article{border:1px solid var(--line);padding:14px}.uml-worked-flow span{display:block;font-size:10px;font-weight:850;letter-spacing:.08em;color:#777}.uml-worked-flow strong{display:block;margin-top:5px}.uml-worked-flow p{margin:.45rem 0 0;font-size:.82rem}
      .uml-classification-panel{margin-top:28px}.uml-case-toolbar{display:flex;gap:12px;align-items:end;justify-content:space-between;flex-wrap:wrap;margin:16px 0}.uml-case-toolbar label{display:grid;gap:6px;font-size:.78rem;font-weight:800;min-width:min(340px,100%)}.uml-case-toolbar select,.uml-classification-row select,.uml-builder input,.uml-builder textarea{border:1px solid #bbb;border-radius:10px;background:#fff;padding:9px 11px;color:#111;outline:none}.uml-case-toolbar select{min-height:44px}
      .uml-case-brief{border:1px solid #111;padding:14px 16px;background:var(--soft)}.uml-case-brief strong{display:block}.uml-case-brief p{margin:.35rem 0 0}
      .uml-classification-grid{display:grid;gap:8px;margin-top:14px}.uml-classification-row{display:grid;grid-template-columns:minmax(0,1fr) 210px;gap:12px;align-items:center;border:1px solid var(--line);padding:12px;background:#fff}.uml-classification-row.correct{border-color:#111;background:#f5f5f5}.uml-classification-row.wrong{border-style:dashed}.uml-classification-row code{font-weight:750}.uml-classification-feedback{grid-column:1/-1;font-size:.76rem;color:#555;display:none}.uml-classification-row.checked .uml-classification-feedback{display:block}
      .uml-score-strip{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px;padding-top:14px;border-top:1px solid var(--line)}.uml-score-badge{font-size:.78rem;font-weight:850;border:1px solid #111;padding:7px 10px}.uml-score-badge.mastered{background:#111;color:#fff}
      .uml-builder{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,.8fr);gap:18px;margin-top:26px;border-top:1px solid var(--line);padding-top:22px}.uml-builder-form{display:grid;gap:12px}.uml-builder-form label{display:grid;gap:6px;font-size:.78rem;font-weight:800}.uml-builder textarea{min-height:88px;resize:vertical}.uml-builder-preview{align-self:start;position:sticky;top:92px}.uml-builder-preview .uml-card{background:#fff}.uml-builder-hint{font-size:.76rem;color:#666;margin-top:8px}
      .uml-relationship-preview{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.uml-relationship-preview article{border:1px solid var(--line);padding:12px}.uml-relationship-preview strong{display:block}.uml-relationship-preview p{margin:.35rem 0 0;font-size:.82rem}
      @media(max-width:900px){.uml-anatomy-layout,.uml-builder{grid-template-columns:1fr}.uml-worked-flow{grid-template-columns:repeat(2,1fr)}.uml-builder-preview{position:static}.uml-definition-grid{grid-template-columns:1fr}}
      @media(max-width:650px){.uml-build-step{grid-template-columns:1fr;gap:5px}.uml-worked-flow,.uml-relationship-preview{grid-template-columns:1fr}.uml-classification-row{grid-template-columns:1fr}.uml-score-strip{align-items:stretch;flex-direction:column}}
    `;
    document.head.appendChild(style);
  }

  function theoryMarkup(){
    return `<section id="umlDeepPanel" class="panel uml-deep-panel">
      <p class="eyebrow">STAGE 01 · UML CLASS DIAGRAM IN DEPTH</p>
      <h2>${esc(guide.title)}</h2>
      <p>${esc(guide.definition)}</p>

      <div class="uml-anatomy-layout">
        <div>
          <p class="eyebrow">ACTUAL UML CLASS BOX STRUCTURE</p>
          <div class="uml-anatomy-box" aria-label="UML class diagram anatomy example">
            <div class="uml-anatomy-part"><span class="uml-anatomy-tag">COMPARTMENT 1</span><b>Sensor</b><small>Class name / identity</small></div>
            <div class="uml-anatomy-part"><span class="uml-anatomy-tag">COMPARTMENT 2</span><b>− identifier : String</b><b>− temperature : float</b><small>Attributes / state</small></div>
            <div class="uml-anatomy-part"><span class="uml-anatomy-tag">COMPARTMENT 3</span><b>+ read() : float</b><b>+ calibrate(offset : float) : void</b><small>Methods / operations / behavior</small></div>
          </div>
          <div class="callout"><strong>Read it top → bottom:</strong> What is it? → What does it remember? → What can it do?</div>
        </div>
        <div>
          <p class="eyebrow">WHAT EACH PART REALLY MEANS</p>
          <div class="uml-definition-grid">
            <article class="uml-definition-card"><strong>Class</strong><p>${esc(guide.classMeaning)}</p></article>
            <article class="uml-definition-card"><strong>Attribute</strong><p>${esc(guide.attributeMeaning)}</p></article>
            <article class="uml-definition-card"><strong>Method</strong><p>${esc(guide.methodMeaning)}</p></article>
            <article class="uml-definition-card"><strong>Object / instance</strong><p>${esc(guide.objectMeaning)}</p></article>
          </div>
        </div>
      </div>

      <div class="content-grid" style="margin-top:24px">
        <article class="panel soft">
          <p class="eyebrow">UML MEMBER NOTATION</p><h3>How to read one line</h3>
          <p><code>− temperature : float</code> means: private attribute named <strong>temperature</strong> whose type is <strong>float</strong>.</p>
          <p><code>+ calibrate(offset : float) : void</code> means: public method named <strong>calibrate</strong>, receiving one float parameter named <strong>offset</strong>, and returning no value.</p>
          <table class="uml-notation-table"><thead><tr><th>Symbol</th><th>Meaning</th><th>Use</th></tr></thead><tbody>${guide.notation.map(([s,n,d])=>`<tr><td class="uml-symbol">${esc(s)}</td><td><strong>${esc(n)}</strong></td><td>${esc(d)}</td></tr>`).join('')}</tbody></table>
        </article>
        <aside class="panel">
          <p class="eyebrow">WORKED EXAMPLE · FROM SENTENCE TO DIAGRAM</p><h3>Sensor</h3>
          <p>Requirement: <strong>“A sensor has an identifier and temperature. It can read temperature and calibrate itself.”</strong></p>
          <div class="uml-worked-flow">
            <article><span>1 · CONCEPT</span><strong>Sensor</strong><p>The main thing being modeled.</p></article>
            <article><span>2 · STATE</span><strong>identifier · temperature</strong><p>Values each sensor remembers.</p></article>
            <article><span>3 · BEHAVIOR</span><strong>read · calibrate</strong><p>Actions that belong to Sensor.</p></article>
            <article><span>4 · OBJECT TEST</span><strong>sensorA · sensorB</strong><p>Two concrete sensors can have different values.</p></article>
          </div>
        </aside>
      </div>

      <div style="margin-top:26px">
        <p class="eyebrow">DEEP CONSTRUCTION PROCEDURE</p><h3>Do these steps in order. Do not begin by drawing random boxes.</h3>
        <div class="uml-build-steps">${guide.constructionSteps.map(([n,q,e,r])=>`<article class="uml-build-step"><strong>${esc(n)}</strong><div><p>${esc(q)}</p><p><strong>Example:</strong> ${esc(e)}</p><span class="uml-result">${esc(r)}</span></div></article>`).join('')}</div>
      </div>

      <div class="content-grid" style="margin-top:26px">
        <article class="panel">
          <p class="eyebrow">CONCEPTUAL DISTINCTIONS</p><h3>These distinctions prevent most beginner errors.</h3>
          <div class="concept-list">${guide.contrasts.map(([a,b])=>`<div class="concept-item"><strong>${esc(a)}</strong><span>${esc(b)}</span></div>`).join('')}</div>
        </article>
        <aside class="panel soft">
          <p class="eyebrow">RELATIONSHIPS · PREVIEW</p><h3>Class diagrams can also connect classes.</h3>
          <p>Stage 01 mastery is the class box itself. These connectors are introduced here only so students recognize the complete UML class-diagram vocabulary they will use later.</p>
          <div class="uml-relationship-preview">${guide.relationships.map(([a,b])=>`<article><strong>${esc(a)}</strong><p>${esc(b)}</p></article>`).join('')}</div>
        </aside>
      </div>

      <div style="margin-top:26px">
        <p class="eyebrow">MORE CONCEPTUAL CASES</p><h3>The same questions work in many domains.</h3>
        <div class="qa-grid">${cases.map(item=>`<article><strong>${esc(item.context)} · ${esc(item.className)}</strong><p>${esc(item.responsibility)}</p><p><small>Try to predict its attributes and methods before opening the workshop.</small></p></article>`).join('')}</div>
      </div>
    </section>`;
  }

  function renderTheory(){
    const params=new URLSearchParams(location.search);
    if((params.get('topic')||'object-model')!=='object-model') return;
    const foundation=document.getElementById('foundationPanel');
    if(!foundation||document.getElementById('umlDeepPanel')) return;
    foundation.insertAdjacentHTML('afterend',theoryMarkup());
  }

  let state={caseId:cases[0].id,score:0,total:cases[0].members.length,checked:false,mastery:false,legacyModel:false};

  function workshopMarkup(){
    return `<section id="umlClassificationPanel" class="panel uml-classification-panel">
      <p class="eyebrow">STAGE 01 · UML IDENTIFICATION LAB</p>
      <h2>Select a class. Decide what each item really is.</h2>
      <p>Do not classify by appearance alone. Use the class responsibility: a <strong>class</strong> is the model, an <strong>attribute</strong> is stored state, a <strong>method</strong> is behavior owned by the class, an <strong>object</strong> is one concrete instance, and a <strong>non-member</strong> does not belong to this class responsibility.</p>
      <div class="uml-case-toolbar"><label>Choose a conceptual case<select id="umlCaseSelect">${cases.map(c=>`<option value="${esc(c.id)}">${esc(c.context)} · ${esc(c.className)}</option>`).join('')}</select></label><span class="uml-score-badge" id="umlScoreBadge">Not checked</span></div>
      <div id="umlCaseBrief" class="uml-case-brief"></div>
      <div id="umlClassificationGrid" class="uml-classification-grid"></div>
      <div class="uml-score-strip"><p id="umlClassificationStatus">Classify every item, then check your reasoning.</p><button id="checkUmlClassification" class="button button-dark" type="button">Check classification</button></div>

      <div class="uml-builder">
        <div class="uml-builder-form">
          <div><p class="eyebrow">YOUR DIAGRAM · BUILD IT, DO NOT COPY IT</p><h3>Create one class box from a concept you understand.</h3><p>Use the theory procedure: define responsibility first, then state, then behavior. One meaningful attribute and one meaningful method are the minimum; two or three of each are better when they are justified.</p></div>
          <label>1 · Class name<input id="umlDraftClass" maxlength="100" placeholder="Example: Bicycle"></label>
          <label>2 · One-sentence responsibility<textarea id="umlDraftResponsibility" maxlength="600" placeholder="A Bicycle is responsible for representing one bicycle and its riding-related state/behavior."></textarea></label>
          <label>3 · Attributes · one per line<textarea id="umlDraftAttributes" maxlength="1800" placeholder="- gear : int&#10;- speed : float"></textarea></label>
          <label>4 · Methods · one per line<textarea id="umlDraftMethods" maxlength="1800" placeholder="+ pedal() : void&#10;+ brake(amount : float) : void"></textarea></label>
          <div class="callout"><strong>Stage 01 model evidence:</strong> reach 100% on one identification case and complete all four diagram-draft fields. The Model checkbox will then be verified automatically.</div>
        </div>
        <aside class="uml-builder-preview">
          <p class="eyebrow">LIVE UML PREVIEW</p>
          <div class="uml-card"><div id="umlDraftPreviewName" class="uml-title">YourClass</div><div id="umlDraftPreviewAttrs" class="uml-section"><em>attributes appear here</em></div><div id="umlDraftPreviewMethods" class="uml-section"><em>methods appear here</em></div></div>
          <p id="umlDraftPreviewResponsibility" class="uml-builder-hint">Write the responsibility before deciding what belongs in the box.</p>
        </aside>
      </div>
    </section>`;
  }

  function currentCase(){return cases.find(c=>c.id===state.caseId)||cases[0];}
  function draftValues(){
    return {
      className:(document.getElementById('umlDraftClass')?.value||'').trim(),
      responsibility:(document.getElementById('umlDraftResponsibility')?.value||'').trim(),
      attributes:(document.getElementById('umlDraftAttributes')?.value||'').trim(),
      methods:(document.getElementById('umlDraftMethods')?.value||'').trim()
    };
  }
  function draftComplete(){const d=draftValues();return Boolean(d.className&&d.responsibility&&d.attributes&&d.methods);}

  function updatePreview(){
    const d=draftValues();
    const name=document.getElementById('umlDraftPreviewName'),attrs=document.getElementById('umlDraftPreviewAttrs'),methods=document.getElementById('umlDraftPreviewMethods'),resp=document.getElementById('umlDraftPreviewResponsibility');
    if(!name) return;
    name.textContent=d.className||'YourClass';
    attrs.innerHTML=d.attributes?d.attributes.split(/\n+/).filter(Boolean).map(x=>`<div>${esc(x)}</div>`).join(''):'<em>attributes appear here</em>';
    methods.innerHTML=d.methods?d.methods.split(/\n+/).filter(Boolean).map(x=>`<div>${esc(x)}</div>`).join(''):'<em>methods appear here</em>';
    resp.textContent=d.responsibility||'Write the responsibility before deciding what belongs in the box.';
    syncModelGate();
  }

  function renderCase(){
    const c=currentCase();
    state.total=c.members.length;state.score=0;state.checked=false;state.mastery=false;
    const brief=document.getElementById('umlCaseBrief'),grid=document.getElementById('umlClassificationGrid'),badge=document.getElementById('umlScoreBadge'),status=document.getElementById('umlClassificationStatus');
    if(!grid) return;
    brief.innerHTML=`<strong>${esc(c.className)} · ${esc(c.context)}</strong><p><strong>Responsibility:</strong> ${esc(c.responsibility)}</p>`;
    grid.innerHTML=c.members.map(([label],i)=>`<div class="uml-classification-row" data-index="${i}"><div><code>${esc(label)}</code></div><select aria-label="Classify ${esc(label)}"><option value="">Choose category…</option><option value="class">Class</option><option value="attribute">Attribute</option><option value="method">Method</option><option value="object">Object / instance</option><option value="not-member">Does not belong to this class</option></select><div class="uml-classification-feedback"></div></div>`).join('');
    badge.textContent='Not checked';badge.classList.remove('mastered');status.textContent='Classify every item, then check your reasoning.';
    syncModelGate();
  }

  function checkClassification(){
    const c=currentCase(),rows=[...document.querySelectorAll('#umlClassificationGrid .uml-classification-row')];
    let score=0,answered=0;
    rows.forEach((row,i)=>{
      const select=row.querySelector('select'),feedback=row.querySelector('.uml-classification-feedback'),expected=c.members[i][1],reason=c.members[i][2],chosen=select.value;
      if(chosen) answered++;
      const correct=chosen===expected;if(correct)score++;
      row.classList.add('checked');row.classList.toggle('correct',correct);row.classList.toggle('wrong',!correct);
      feedback.innerHTML=correct?`✓ <strong>${esc(kindLabel[expected])}</strong> · ${esc(reason)}`:`Expected <strong>${esc(kindLabel[expected])}</strong>. ${esc(reason)}`;
    });
    state.score=score;state.total=c.members.length;state.checked=true;
    const perfect=score===state.total;
    const badge=document.getElementById('umlScoreBadge'),status=document.getElementById('umlClassificationStatus');
    badge.textContent=`${score} / ${state.total}`;badge.classList.toggle('mastered',perfect);
    status.textContent=answered<state.total?'Some items are still unclassified. Review the responsibility and finish every row.':perfect?'Perfect classification. Now complete your own UML draft to verify Model evidence.':'Review each explanation, then change the incorrect categories and check again.';
    syncModelGate();
  }

  function syncModelGate(){
    const model=document.getElementById('evModel');
    const nowMastered=state.checked&&state.score===state.total&&draftComplete();
    state.mastery=nowMastered||state.legacyModel;
    if(model){
      if(state.mastery) model.checked=true;
      else if(!state.legacyModel) model.checked=false;
      model.disabled=!state.mastery;
    }
    if(nowMastered){
      document.dispatchEvent(new CustomEvent('ijr-oop-uml-model-mastered',{detail:{caseId:state.caseId,score:state.score,total:state.total}}));
    }
  }

  function renderWorkshop(){
    const params=new URLSearchParams(location.search);
    if((params.get('topic')||'object-model')!=='object-model') return;
    const notebook=document.querySelector('#workshopPanel .notebook-panel');
    if(!notebook||document.getElementById('umlClassificationPanel')) return;
    notebook.insertAdjacentHTML('beforebegin',workshopMarkup());
    const caseSelect=document.getElementById('umlCaseSelect');
    caseSelect.value=state.caseId;
    caseSelect.addEventListener('change',()=>{state.caseId=caseSelect.value;renderCase();});
    document.getElementById('checkUmlClassification').addEventListener('click',checkClassification);
    ['umlDraftClass','umlDraftResponsibility','umlDraftAttributes','umlDraftMethods'].forEach(id=>document.getElementById(id).addEventListener('input',updatePreview));
    renderCase();updatePreview();
  }

  window.IJR_OOP_UML_STAGE1_PRACTICE={
    evidence(){
      const d=draftValues();
      return {
        uml_practice_version:'stage1-uml-depth-v4',
        uml_case:state.caseId,
        uml_classification_score:state.score,
        uml_classification_total:state.total,
        uml_mastery:state.mastery,
        uml_draft_class:d.className,
        uml_draft_responsibility:d.responsibility,
        uml_draft_attributes:d.attributes,
        uml_draft_methods:d.methods
      };
    },
    hydrate(evidence={}){
      if(!document.getElementById('umlClassificationPanel')) return;
      state.legacyModel=evidence.model===true&&evidence.pedagogy_version!=='oop-uml-v4';
      const wanted=cases.some(c=>c.id===evidence.uml_case)?evidence.uml_case:state.caseId;
      state.caseId=wanted;document.getElementById('umlCaseSelect').value=wanted;renderCase();
      const map={umlDraftClass:'uml_draft_class',umlDraftResponsibility:'uml_draft_responsibility',umlDraftAttributes:'uml_draft_attributes',umlDraftMethods:'uml_draft_methods'};
      Object.entries(map).forEach(([id,key])=>{const el=document.getElementById(id);if(el&&evidence[key])el.value=evidence[key];});
      const score=Number(evidence.uml_classification_score||0),total=Number(evidence.uml_classification_total||currentCase().members.length);
      if(evidence.uml_mastery===true&&score===total&&total>=6){state.score=score;state.total=total;state.checked=true;state.mastery=true;const badge=document.getElementById('umlScoreBadge');badge.textContent=`${score} / ${total} · saved`;badge.classList.add('mastered');document.getElementById('umlClassificationStatus').textContent='A verified UML classification result is already saved for this session.';}
      updatePreview();syncModelGate();
    },
    activate(active=true){
      const panel=document.getElementById('umlClassificationPanel');if(panel)panel.classList.toggle('hidden',!active);
    }
  };

  document.addEventListener('DOMContentLoaded',()=>{
    installStyles();
    renderTheory();
    renderWorkshop();
  });
})();
