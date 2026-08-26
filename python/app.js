(() => {
  'use strict';

  const topics = [
    {
      id:'01', slug:'operations', nav:'Interface & operations', title:'Colab interface and general operations',
      lead:'Understand what a Python cell does, how to run it, where output appears, and how arithmetic symbols behave before moving to data structures.',
      definition:'Python reads a code cell from top to bottom. A variable can store a value, an operator performs an action, and print(...) sends a result to the output area. In this hub, the Run button behaves like a small notebook cell.',
      syntax:[['Assign a value','x = 10'],['Add / subtract','a + b   a - b'],['Multiply / divide','a * b   a / b'],['Power','x ** 2'],['Square root','x ** 0.5'],['Show a result','print(result)']],
      figure:`<svg class="figure" viewBox="0 0 440 230" role="img" aria-label="Python cell execution flow"><rect class="paper" x="22" y="34" width="164" height="134" rx="14"/><text x="40" y="60">CODE CELL</text><text x="40" y="93">a = 20</text><text x="40" y="116">b = 5</text><text x="40" y="139">print(a + b)</text><path class="stroke trace" d="M194 101 C236 101 247 101 278 101"/><path class="stroke" d="M267 94 L278 101 L267 108"/><circle class="paper" cx="231" cy="101" r="20"/><text x="219" y="105">Run</text><rect class="shade" x="288" y="54" width="130" height="94" rx="14"/><text x="308" y="82">OUTPUT</text><text x="308" y="116" style="font-size:22px;font-weight:800">25</text><path class="soft-stroke" d="M55 190 H389"/><text x="80" y="212">read → run → inspect → correct → run again</text></svg>`,
      example:`a = 20\nb = 5\nresult = a + b\nprint(result)`,
      caption:'The values are stored first. The final line prints the result. Replace only the expression you are asked to change.',
      exercises:[
        {title:'Add two variables', prompt:'Keep a and b. Create result using the variable names, then print it.', code:'a = 17\nb = 8\nresult = a + b\nprint(result)', expected:'25'},
        {title:'Power and square root', prompt:'Print the square of 5 and the square root of 81. Use ** for both.', code:'x = 5\ny = 81\nprint(x ** 2)\nprint(y ** 0.5)', expected:'25\n9.0'}
      ]
    },
    {
      id:'02', slug:'types', nav:'Variable types', title:'Variables and data types',
      lead:'A value is not only its visible content. Python also keeps track of its type, and the type determines what operations make sense.',
      definition:'The most useful starter types are int for whole numbers, float for decimals, str for text, bool for True/False values, and NoneType for a missing value represented by None.',
      syntax:[['Whole number','age = 16'],['Decimal','mean = 4.25'],['Text','group = "11A"'],['Boolean','passed = True'],['Missing value','result = None'],['Inspect type','type(mean)']],
      figure:`<svg class="figure" viewBox="0 0 440 230" role="img" aria-label="Python data type boxes"><path class="stroke trace" d="M24 116 H416"/><g><rect class="paper" x="22" y="54" width="72" height="62" rx="12"/><text x="47" y="78">28</text><text x="43" y="101">int</text></g><g><rect class="paper" x="104" y="54" width="72" height="62" rx="12"/><text x="122" y="78">4.25</text><text x="120" y="101">float</text></g><g><rect class="paper" x="186" y="54" width="72" height="62" rx="12"/><text x="203" y="78">"11A"</text><text x="208" y="101">str</text></g><g><rect class="paper" x="268" y="54" width="72" height="62" rx="12"/><text x="286" y="78">True</text><text x="286" y="101">bool</text></g><g><rect class="paper" x="350" y="54" width="72" height="62" rx="12"/><text x="365" y="78">None</text><text x="361" y="101">NoneType</text></g><text x="126" y="161">same language · different kinds of values</text><path class="soft-stroke" d="M95 181 H345"/></svg>`,
      example:`whole = 28\ndecimal = 4.25\nlabel = "11A"\npassed = True\nmissing = None\n\nprint(type(decimal).__name__)`,
      caption:'Using .__name__ gives a short type name such as float instead of the full class representation.',
      exercises:[
        {title:'Identify a type', prompt:'Run the code and print the short type name of value.', code:'value = 42\nprint(type(value).__name__)', expected:'int'},
        {title:'Numbers versus text', prompt:'Convert the text "12" to an integer, add 3, and print the result.', code:'value = "12"\nnumber = int(value)\nprint(number + 3)', expected:'15'}
      ]
    },
    {
      id:'03', slug:'arrays', nav:'Arrays / lists', title:'Arrays and Python lists',
      lead:'When one variable is not enough, a list groups several ordered values under one name. Position becomes part of the data.',
      definition:'A Python list is written with square brackets. Each element has an index, and indexing starts at 0. That means the first item is values[0], the second is values[1], and so on.',
      syntax:[['Create a list','values = [8, 13, 21]'],['First item','values[0]'],['Second item','values[1]'],['Number of items','len(values)'],['Total','sum(values)'],['Largest value','max(values)']],
      figure:`<svg class="figure" viewBox="0 0 440 230" role="img" aria-label="List indexes"><text x="24" y="48">values =</text><g><rect class="paper" x="90" y="25" width="72" height="62" rx="10"/><text x="119" y="61" style="font-size:18px;font-weight:800">8</text><text x="118" y="109">index 0</text></g><g><rect class="paper" x="172" y="25" width="72" height="62" rx="10"/><text x="195" y="61" style="font-size:18px;font-weight:800">13</text><text x="200" y="109">index 1</text></g><g><rect class="paper" x="254" y="25" width="72" height="62" rx="10"/><text x="277" y="61" style="font-size:18px;font-weight:800">21</text><text x="282" y="109">index 2</text></g><g><rect class="paper" x="336" y="25" width="72" height="62" rx="10"/><text x="358" y="61" style="font-size:18px;font-weight:800">34</text><text x="364" y="109">index 3</text></g><path class="stroke trace" d="M124 132 C124 168 204 176 250 176 C305 176 372 163 372 132"/><text x="163" y="202">one variable → many ordered values</text></svg>`,
      example:`scores = [12, 7, 15, 9, 11]\nfirst = scores[0]\nthird = scores[2]\n\nprint(first)\nprint(third)`,
      caption:'The third value uses index 2 because Python begins counting indexes at zero.',
      exercises:[
        {title:'Read an index', prompt:'Print the third value from the list. Do not copy the number directly; use the list and an index.', code:'values = [6, 10, 15, 21]\nprint(values[2])', expected:'15'},
        {title:'Length and total', prompt:'Print how many values are in the list, then print their total.', code:'values = [5, 10, 15, 20]\nprint(len(values))\nprint(sum(values))', expected:'4\n50'}
      ]
    },
    {
      id:'04', slug:'logic', nav:'Comparisons & logic', title:'Comparisons and logical operators',
      lead:'Comparisons do not return a new number; they answer a question with True or False. Logical operators combine several questions.',
      definition:'Use >, >=, <, <=, == and != to compare values. Use and when both conditions must be True, or when at least one may be True, and not to reverse a Boolean result.',
      syntax:[['Greater than','x > 10'],['Greater or equal','x >= 10'],['Equal','x == 10'],['Different','x != 10'],['Both conditions','a > 0 and b > 0'],['At least one','a > 0 or b > 0']],
      figure:`<svg class="figure" viewBox="0 0 440 230" role="img" aria-label="Comparison and logic diagram"><circle class="paper" cx="92" cy="82" r="40"/><text x="67" y="78">score</text><text x="77" y="98">85</text><path class="stroke trace" d="M134 82 H211"/><text x="148" y="68">&gt;= 70 ?</text><path class="stroke" d="M202 75 L211 82 L202 89"/><rect class="shade" x="226" y="47" width="86" height="70" rx="14"/><text x="250" y="88" style="font-size:18px;font-weight:800">True</text><path class="soft-stroke" d="M269 125 V165"/><rect class="paper" x="184" y="166" width="170" height="42" rx="12"/><text x="205" y="192">True and True → True</text></svg>`,
      example:`score = 85\nattendance = 0.92\n\npassed_score = score >= 70\ncomplete = passed_score and attendance >= 0.80\n\nprint(passed_score)\nprint(complete)`,
      caption:'Notice the difference between = for assignment and == for equality comparison.',
      exercises:[
        {title:'Greater or equal', prompt:'Check whether the score is at least 70 and print the Boolean result.', code:'score = 85\nprint(score >= 70)', expected:'True'},
        {title:'Combine conditions', prompt:'A student can enter if age is at least 16 AND has_id is True. Print the result.', code:'age = 17\nhas_id = True\nprint(age >= 16 and has_id)', expected:'True'}
      ]
    },
    {
      id:'05', slug:'conditions', nav:'Conditions', title:'Conditions with if, elif and else',
      lead:'A condition turns a True/False result into a decision. Python executes only the branch whose condition is satisfied.',
      definition:'An if statement checks the first condition. elif adds another possible condition. else is the fallback. Indentation is part of Python syntax: the code inside a branch must be indented consistently.',
      syntax:[['Start decision','if score >= 70:'],['Second possibility','elif score >= 60:'],['Fallback','else:'],['Indented action','    print("Pass")'],['Equality test','if group == "11A":'],['Not equal','if status != "done":']],
      figure:`<svg class="figure" viewBox="0 0 440 230" role="img" aria-label="If else decision tree"><rect class="paper" x="151" y="22" width="138" height="48" rx="24"/><text x="180" y="52">score &gt;= 70 ?</text><path class="stroke trace" d="M191 70 C160 103 133 118 101 136"/><path class="stroke trace" d="M249 70 C280 103 307 118 339 136"/><text x="126" y="104">True</text><text x="283" y="104">False</text><rect class="shade" x="39" y="138" width="124" height="58" rx="13"/><text x="78" y="173">PASS</text><rect class="paper" x="277" y="138" width="124" height="58" rx="13"/><text x="318" y="173">REVIEW</text></svg>`,
      example:`score = 76\n\nif score >= 70:\n    print("pass")\nelse:\n    print("review")`,
      caption:'The colon starts the branch. The indented line belongs to that branch.',
      exercises:[
        {title:'Temperature branch', prompt:'Print "hot" when temperature is 30 or higher; otherwise print "mild".', code:'temperature = 31\n\nif temperature >= 30:\n    print("hot")\nelse:\n    print("mild")', expected:'hot'},
        {title:'Three outcomes', prompt:'Use if / elif / else so a score of 68 prints "close".', code:'score = 68\n\nif score >= 70:\n    print("pass")\nelif score >= 60:\n    print("close")\nelse:\n    print("review")', expected:'close'}
      ]
    },
    {
      id:'06', slug:'loops', nav:'Loops', title:'Loops: repeat without copying code',
      lead:'A loop repeats a block of code. With lists, for is the most direct way to visit each value one by one.',
      definition:'A for loop takes each item from a sequence and temporarily stores it in a loop variable. The indented block runs once per item. This is the bridge from a list of data to repeated analysis.',
      syntax:[['Visit values','for value in values:'],['Indented action','    print(value)'],['Create a counter','count = 0'],['Update value','count = count + 1'],['Numeric range','for i in range(5):'],['Index + value','enumerate(values)']],
      figure:`<svg class="figure" viewBox="0 0 440 230" role="img" aria-label="For loop cycle"><rect class="paper" x="35" y="72" width="104" height="64" rx="12"/><text x="56" y="98">[4, 7, 9]</text><text x="63" y="120">values</text><path class="stroke trace" d="M147 104 H211"/><rect class="shade" x="221" y="64" width="98" height="80" rx="40"/><text x="249" y="100">for</text><text x="242" y="120">value</text><path class="stroke trace" d="M318 104 C383 104 384 186 291 186 H146 C84 186 83 148 83 144"/><path class="stroke" d="M76 153 L83 144 L90 153"/><text x="190" y="207">repeat until the list is finished</text></svg>`,
      example:`values = [4, 7, 9]\n\nfor value in values:\n    print(value)`,
      caption:'The loop variable value changes automatically: first 4, then 7, then 9.',
      exercises:[
        {title:'Visit every value', prompt:'Run the loop and confirm that each item prints on a new line.', code:'values = [3, 6, 9]\n\nfor value in values:\n    print(value)', expected:'3\n6\n9'},
        {title:'Build a total', prompt:'Use the loop to accumulate all values into total, then print total.', code:'values = [2, 4, 6, 8]\ntotal = 0\n\nfor value in values:\n    total = total + value\n\nprint(total)', expected:'20'}
      ]
    },
    {
      id:'07', slug:'functions', nav:'Functions', title:'Functions: name a reusable process',
      lead:'A function packages a small procedure so it can be reused with different inputs instead of rewriting the same steps.',
      definition:'Define a function with def. Parameters receive input values. return sends a result back to the line that called the function. Good functions do one clear job and use meaningful names.',
      syntax:[['Define','def square(x):'],['Return result','    return x ** 2'],['Call function','square(5)'],['Two parameters','def add(a, b):'],['Store returned value','result = square(5)'],['Print result','print(result)']],
      figure:`<svg class="figure" viewBox="0 0 440 230" role="img" aria-label="Function input process output"><rect class="paper" x="30" y="83" width="86" height="58" rx="29"/><text x="59" y="118">5</text><path class="stroke trace" d="M122 112 H171"/><rect class="shade" x="180" y="55" width="126" height="114" rx="18"/><text x="203" y="91">square(x)</text><text x="211" y="118">x ** 2</text><text x="209" y="145">return</text><path class="stroke trace" d="M313 112 H358"/><rect class="paper" x="365" y="83" width="58" height="58" rx="29"/><text x="382" y="118">25</text><text x="166" y="202">input → named process → output</text></svg>`,
      example:`def square(x):\n    return x ** 2\n\nresult = square(5)\nprint(result)`,
      caption:'return is different from print: return gives a value back to the caller; print only displays it.',
      exercises:[
        {title:'Create square()', prompt:'Define square(x), return x ** 2, then print square(7).', code:'def square(x):\n    return x ** 2\n\nprint(square(7))', expected:'49'},
        {title:'Create mean()', prompt:'Write a function that receives a list and returns sum(values) / len(values).', code:'def mean(values):\n    return sum(values) / len(values)\n\nprint(mean([10, 20, 30]))', expected:'20.0'}
      ]
    },
    {
      id:'08', slug:'statistics', nav:'Statistics with Python', title:'Statistics with lists',
      lead:'Once values are stored in a list, Python can reproduce the same descriptive-statistics steps used by hand and make them repeatable.',
      definition:'Start with transparent operations: number of observations, sum, mean, minimum, maximum and range. These are simple enough to verify manually and prepare the class for NumPy and Pandas later.',
      syntax:[['Count','n = len(values)'],['Mean','sum(values) / len(values)'],['Minimum','min(values)'],['Maximum','max(values)'],['Range','max(values) - min(values)'],['Rounded mean','round(mean, 2)']],
      figure:`<svg class="figure" viewBox="0 0 440 230" role="img" aria-label="Statistics pipeline"><rect class="paper" x="25" y="62" width="110" height="106" rx="14"/><text x="44" y="89">DATA</text><text x="44" y="116">[8, 10, 12,</text><text x="44" y="137">14, 16]</text><path class="stroke trace" d="M143 115 H207"/><rect class="shade" x="218" y="48" width="98" height="134" rx="16"/><text x="240" y="83">len</text><text x="240" y="108">sum</text><text x="240" y="133">min/max</text><text x="240" y="158">mean</text><path class="stroke trace" d="M324 115 H367"/><rect class="paper" x="375" y="76" width="52" height="78" rx="12"/><text x="389" y="105">n=5</text><text x="385" y="130">μ=12</text><text x="389" y="149">R=8</text></svg>`,
      example:`values = [8, 10, 12, 14, 16]\nmean = sum(values) / len(values)\ndata_range = max(values) - min(values)\n\nprint(mean)\nprint(data_range)`,
      caption:'Keep intermediate results in named variables. That makes statistical code easier to audit and explain.',
      exercises:[
        {title:'Mean and range', prompt:'Calculate the mean and range of the list using Python functions, then print both.', code:'values = [4, 8, 12, 16]\nmean = sum(values) / len(values)\ndata_range = max(values) - min(values)\n\nprint(mean)\nprint(data_range)', expected:'10.0\n12'},
        {title:'Count above the mean', prompt:'Calculate the mean, then count how many values are greater than it using a loop and condition.', code:'values = [5, 7, 9, 11, 13]\nmean = sum(values) / len(values)\ncount = 0\n\nfor value in values:\n    if value > mean:\n        count = count + 1\n\nprint(count)', expected:'2'}
      ]
    }
  ];

  const $ = id => document.getElementById(id);
  const nav = $('topicNav');
  const mount = $('lessonMount');
  const progressText = $('progressText');
  const progressBar = $('progressBar');
  const continueButton = $('continueButton');
  const storageKey = 'ijr-stat11-python-hub-reviewed-v1';

  let currentIndex = 0;
  let exerciseIndex = 0;
  let pyodide = null;
  let runtimePromise = null;
  let reviewed = loadReviewed();

  function loadReviewed(){
    try{
      const raw = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return new Set(Array.isArray(raw) ? raw : []);
    }catch(_){ return new Set(); }
  }

  function saveReviewed(){
    try{ localStorage.setItem(storageKey, JSON.stringify([...reviewed])); }catch(_){ /* local storage may be disabled */ }
  }

  function esc(value){
    return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  }

  function renderNav(){
    nav.innerHTML = topics.map((topic,index) => `
      <button class="topic-button ${index===currentIndex?'active':''} ${reviewed.has(topic.slug)?'reviewed':''}" type="button" data-topic="${index}" aria-current="${index===currentIndex?'page':'false'}">
        <span class="topic-number">${topic.id}</span>
        <span class="topic-name">${topic.nav}</span>
        <span class="topic-check" aria-hidden="true"></span>
      </button>`).join('');
    nav.querySelectorAll('[data-topic]').forEach(button => {
      button.addEventListener('click', () => selectTopic(Number(button.dataset.topic), true));
    });
    updateProgress();
  }

  function updateProgress(){
    const count = reviewed.size;
    progressText.textContent = `${count} / ${topics.length}`;
    progressBar.style.width = `${(count/topics.length)*100}%`;
    const firstUnreviewed = topics.findIndex(t => !reviewed.has(t.slug));
    const next = firstUnreviewed === -1 ? 0 : firstUnreviewed;
    continueButton.textContent = firstUnreviewed === -1 ? 'Review from Topic 01' : `Continue with Topic ${topics[next].id}`;
    continueButton.dataset.topic = String(next);
  }

  function selectTopic(index, updateHash=false){
    if (!Number.isInteger(index) || index < 0 || index >= topics.length) index = 0;
    currentIndex = index;
    exerciseIndex = 0;
    if (updateHash) history.replaceState(null,'',`#topic-${topics[index].id}`);
    renderNav();
    renderLesson();
    if (updateHash) mount.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function renderLesson(){
    const topic = topics[currentIndex];
    const syntax = topic.syntax.map(([label,code]) => `<div class="syntax-row"><span>${esc(label)}</span><code>${esc(code)}</code></div>`).join('');
    mount.classList.remove('swap-in');
    void mount.offsetWidth;
    mount.innerHTML = `
      <header class="lesson-header">
        <div>
          <div class="lesson-index">Topic ${topic.id} · ${esc(topic.nav)}</div>
          <h2 class="lesson-title">${esc(topic.title)}</h2>
          <p class="lesson-lead">${esc(topic.lead)}</p>
        </div>
        <button id="reviewButton" class="button ${reviewed.has(topic.slug)?'review-button done':'button-dark review-button'}" type="button">${reviewed.has(topic.slug)?'✓ Reviewed':'Mark as reviewed'}</button>
      </header>

      <div class="lesson-grid">
        <article class="panel">
          <p class="eyebrow">CORE IDEA</p>
          <p class="definition">${esc(topic.definition)}</p>
          <div class="syntax-list">${syntax}</div>
        </article>
        <figure class="panel soft figure-panel">
          <figcaption class="figure-label">VISUAL MODEL</figcaption>
          ${topic.figure}
        </figure>
      </div>

      <article class="panel example-block">
        <p class="eyebrow">WORKED EXAMPLE</p>
        <h3>Read the code from top to bottom.</h3>
        <div class="code-card"><pre>${esc(topic.example)}</pre></div>
        <p class="code-caption">${esc(topic.caption)}</p>
      </article>

      <section class="practice-section" aria-labelledby="practiceTitle">
        <div class="practice-head">
          <div><p class="eyebrow">PRACTICE</p><h3 id="practiceTitle">Run it yourself</h3><p>This practice is local and ungraded. Change the code, run it, read the output, and compare.</p></div>
          <span id="runtimeBadge" class="runtime-badge">Python loads when needed</span>
        </div>
        <div id="exerciseTabs" class="exercise-tabs"></div>
        <div id="exerciseMount"></div>
      </section>

      <div class="topic-footer">
        <span>Topic ${topic.id} of ${topics.length}</span>
        <button id="nextTopic" class="next-button" type="button">${currentIndex < topics.length-1 ? `Next: ${topics[currentIndex+1].nav} →` : 'Back to Topic 01 →'}</button>
      </div>`;
    mount.classList.add('swap-in');

    $('reviewButton').addEventListener('click', toggleReviewed);
    $('nextTopic').addEventListener('click', () => selectTopic(currentIndex < topics.length-1 ? currentIndex+1 : 0, true));
    renderExerciseTabs();
    renderExercise();
  }

  function toggleReviewed(){
    const slug = topics[currentIndex].slug;
    if (reviewed.has(slug)) reviewed.delete(slug); else reviewed.add(slug);
    saveReviewed();
    renderNav();
    const button = $('reviewButton');
    if (reviewed.has(slug)){
      button.className = 'button review-button done';
      button.textContent = '✓ Reviewed';
    }else{
      button.className = 'button button-dark review-button';
      button.textContent = 'Mark as reviewed';
    }
  }

  function renderExerciseTabs(){
    const exercises = topics[currentIndex].exercises;
    const tabs = $('exerciseTabs');
    tabs.innerHTML = exercises.map((exercise,index) => `<button class="exercise-tab ${index===exerciseIndex?'active':''}" type="button" data-exercise="${index}">Exercise ${index+1}</button>`).join('');
    tabs.querySelectorAll('[data-exercise]').forEach(button => button.addEventListener('click', () => {
      exerciseIndex = Number(button.dataset.exercise);
      renderExerciseTabs();
      renderExercise();
    }));
  }

  function renderExercise(){
    const exercise = topics[currentIndex].exercises[exerciseIndex];
    $('exerciseMount').innerHTML = `
      <div class="exercise-body">
        <div class="exercise-instructions">
          <div class="exercise-kicker">Exercise ${exerciseIndex+1}</div>
          <h4>${esc(exercise.title)}</h4>
          <p>${esc(exercise.prompt)}</p>
          <div class="expected">Expected output: <code>${esc(exercise.expected).replace(/\n/g,' · ')}</code></div>
        </div>
        <div class="editor-wrap">
          <div class="editor-toolbar"><span>Python cell</span><div class="editor-actions"><button id="resetCode" class="small-button" type="button">Reset</button><button id="runCode" class="small-button primary" type="button">▶ Run</button></div></div>
          <textarea id="codeEditor" class="code-editor" spellcheck="false" aria-label="Python practice code">${esc(exercise.code)}</textarea>
          <div class="output-wrap">
            <div class="output-label"><span>Output</span><span id="exerciseFeedback" class="exercise-feedback"></span></div>
            <pre id="codeOutput" class="output">Run the cell to see the result.</pre>
          </div>
        </div>
      </div>`;
    $('resetCode').addEventListener('click', () => {
      $('codeEditor').value = exercise.code;
      $('codeOutput').textContent = 'Run the cell to see the result.';
      const feedback = $('exerciseFeedback');
      feedback.textContent=''; feedback.className='exercise-feedback';
    });
    $('runCode').addEventListener('click', () => runExercise(exercise));
    $('codeEditor').addEventListener('keydown', handleEditorTab);
  }

  function handleEditorTab(event){
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.value = textarea.value.slice(0,start) + '    ' + textarea.value.slice(end);
    textarea.selectionStart = textarea.selectionEnd = start + 4;
  }

  async function ensurePyodide(){
    if (pyodide) return pyodide;
    if (runtimePromise) return runtimePromise;
    const badge = $('runtimeBadge');
    if (badge) badge.textContent = 'Loading Python…';
    runtimePromise = (async () => {
      if (typeof window.loadPyodide !== 'function') throw new Error('Python runtime could not be loaded. Check the internet connection and try again.');
      const runtime = await window.loadPyodide();
      pyodide = runtime;
      return runtime;
    })();
    try{
      const runtime = await runtimePromise;
      const currentBadge = $('runtimeBadge');
      if (currentBadge){ currentBadge.textContent='Python ready'; currentBadge.classList.add('ready'); }
      return runtime;
    }catch(error){
      runtimePromise = null;
      const currentBadge = $('runtimeBadge');
      if (currentBadge) currentBadge.textContent='Runtime unavailable';
      throw error;
    }
  }

  function normalizeOutput(value){
    return String(value ?? '').replace(/\r/g,'').trim().replace(/[ \t]+$/gm,'');
  }

  async function runExercise(exercise){
    const runButton = $('runCode');
    const output = $('codeOutput');
    const feedback = $('exerciseFeedback');
    if (!runButton || !output || !feedback) return;
    runButton.disabled = true;
    runButton.textContent = 'Running…';
    output.textContent = '';
    feedback.textContent = '';
    feedback.className = 'exercise-feedback';
    try{
      const runtime = await ensurePyodide();
      let stdout = '';
      let stderr = '';
      runtime.setStdout({batched: text => { stdout += `${text}\n`; }});
      runtime.setStderr({batched: text => { stderr += `${text}\n`; }});
      await runtime.runPythonAsync($('codeEditor').value);
      const rendered = normalizeOutput(stdout || stderr || '(no printed output)');
      output.textContent = rendered;
      if (normalizeOutput(stdout) === normalizeOutput(exercise.expected)){
        feedback.textContent = '✓ Output matches';
        feedback.className = 'exercise-feedback ok';
      }else{
        feedback.textContent = stderr ? 'Python reported an error' : 'Compare with expected output';
        feedback.className = 'exercise-feedback bad';
      }
    }catch(error){
      output.textContent = String(error?.message || error || 'Unable to run Python.');
      feedback.textContent = 'Fix and run again';
      feedback.className = 'exercise-feedback bad';
    }finally{
      runButton.disabled = false;
      runButton.textContent = '▶ Run';
    }
  }

  function topicFromHash(){
    const match = location.hash.match(/^#topic-(\d{2})$/);
    if (!match) return 0;
    const index = topics.findIndex(topic => topic.id === match[1]);
    return index === -1 ? 0 : index;
  }

  continueButton.addEventListener('click', () => selectTopic(Number(continueButton.dataset.topic || 0), true));
  window.addEventListener('hashchange', () => {
    if (/^#topic-\d{2}$/.test(location.hash)) selectTopic(topicFromHash(), false);
  });

  currentIndex = topicFromHash();
  renderNav();
  renderLesson();
})();
