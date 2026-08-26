(() => {
  'use strict';

  const config = window.IJR_PYTHON_HUB_CONFIG;
  if (!config || !window.supabase) {
    document.body.innerHTML = '<main style="padding:40px;font-family:sans-serif">Learning Hub configuration could not be loaded.</main>';
    return;
  }

  const client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  const topics = [
    {
      slug:'operations', sequence:1, title:'Colab interface and general operations', nav:'Interface & operations', figure:'cell-flow',
      lead:'Learn the notebook workflow first: read a cell, edit only what is requested, run it, inspect the output, and correct the code before validating.',
      definition:'A Python notebook is a sequence of code cells. Variables store values, operators transform them, and print(...) makes a result visible. Execution is top-to-bottom inside the cell, so the order of instructions matters.',
      goals:['Identify the code cell, Run control and output area.','Use assignment with = and arithmetic operators + - * /.','Use ** for powers and square roots.','Read errors as feedback instead of guessing.'],
      syntax:[['Store a value','x = 10'],['Show a value','print(x)'],['Arithmetic','a + b   a - b   a * b   a / b'],['Power','x ** 2'],['Square root','x ** 0.5'],['Remainder','x % 2']],
      example:'a = 20\nb = 5\nresult = (a + b) / 5\nprint(result)',
      caption:'The cell stores values, computes an expression, then prints one output. Run the complete cell after each correction.',
      pitfalls:['Using ^ instead of ** for exponentiation.','Changing several lines at once and losing track of the error.','Reading a syntax error as a wrong mathematical result.'],
      intro:'Complete every stage. The next topic stays locked until all six required stages are correct.',
      exercises:[
        {key:'op-01',title:'Assignment + addition',prompt:'Create result from a and b, then print it.',mode:'code',code:'a = 17\nb = 8\n# create result using a and b\nresult = a + b\nprint(result)'},
        {key:'op-02',title:'Order of operations',prompt:'Print the result of 2 + 3 * 4 without adding unnecessary parentheses.',mode:'code',code:'print(2 + 3 * 4)'},
        {key:'op-03',title:'Power',prompt:'Print 9 squared using **.',mode:'code',code:'x = 9\nprint(x ** 2)'},
        {key:'op-04',title:'Square root',prompt:'Print the square root of 81 using ** 0.5.',mode:'code',code:'x = 81\nprint(x ** 0.5)'},
        {key:'op-05',title:'Operator meaning',prompt:'Which symbol is exponentiation in Python?',mode:'choice',choices:['^','**','//','%%']},
        {key:'op-06',title:'Notebook workflow',prompt:'Which sequence is the best workflow after editing a code cell?',mode:'choice',choices:['Validate first → run later','Run → inspect output → correct if needed','Copy the answer → run','Refresh the browser after every line']}
      ]
    },
    {
      slug:'types', sequence:2, title:'Variables and data types', nav:'Variable types', figure:'type-cards',
      lead:'A variable has a name, a stored value and a data type. The type determines which operations make sense.',
      definition:'Python starter types include int for whole numbers, float for decimals, str for text, bool for True/False values, and NoneType for the missing-value marker None. Use type(value).__name__ to inspect a type.',
      goals:['Differentiate a value from a variable name.','Recognize int, float, str, bool and NoneType.','Convert compatible text with int() or float().','Explain why the same characters can behave differently as text or numbers.'],
      syntax:[['Integer','age = 16'],['Float','mean = 4.25'],['String','group = "11A"'],['Boolean','passed = True'],['Missing value','result = None'],['Inspect type','type(mean).__name__']],
      example:'value = "12"\nnumber = int(value)\nprint(type(value).__name__)\nprint(number + 3)',
      caption:'"12" is text until int(...) converts it. After conversion Python can add 3 numerically.',
      pitfalls:['Writing text without quotes.','Confusing True with the string "True".','Trying to add a string directly to a number.'],
      intro:'Show that you can identify, inspect and convert the five starter data types.',
      exercises:[
        {key:'type-01',title:'Integer type',prompt:'Print the short type name of value.',mode:'code',code:'value = 42\nprint(type(value).__name__)'},
        {key:'type-02',title:'Float type',prompt:'Print the short type name of value.',mode:'code',code:'value = 4.5\nprint(type(value).__name__)'},
        {key:'type-03',title:'String type',prompt:'Print the short type name of value.',mode:'code',code:'value = "11A"\nprint(type(value).__name__)'},
        {key:'type-04',title:'Boolean type',prompt:'Print the short type name of value.',mode:'code',code:'value = True\nprint(type(value).__name__)'},
        {key:'type-05',title:'Convert text to number',prompt:'Convert "12" to an integer, add 3, and print the result.',mode:'code',code:'value = "12"\nnumber = int(value)\nprint(number + 3)'},
        {key:'type-06',title:'Missing value',prompt:'Print the short type name of None.',mode:'code',code:'value = None\nprint(type(value).__name__)'}
      ]
    },
    {
      slug:'arrays', sequence:3, title:'Arrays and Python lists', nav:'Arrays / lists', figure:'array-index',
      lead:'A list solves the problem of storing many ordered values under one variable name.',
      definition:'Python lists use square brackets. Each element has an index that starts at 0. Lists can be read, extended and summarized with len(), sum(), min() and max().',
      goals:['Create a list with square brackets.','Read values by zero-based index.','Use len(), sum(), min() and max().','Append a value and calculate a simple mean.'],
      syntax:[['Create','values = [8, 13, 21]'],['First item','values[0]'],['Third item','values[2]'],['Length','len(values)'],['Total','sum(values)'],['Add item','values.append(34)']],
      example:'scores = [12, 7, 15, 9, 11]\nprint(scores[2])\nprint(len(scores))\nprint(sum(scores) / len(scores))',
      caption:'The third value uses index 2 because Python starts indexing at zero.',
      pitfalls:['Assuming the first index is 1.','Using parentheses instead of square brackets for indexing.','Dividing by a hard-coded count instead of len(values).'],
      intro:'Arrays are released only after Operations and Variable Types are complete. Finish the complete list workshop to continue.',
      exercises:[
        {key:'arr-01',title:'Zero-based index',prompt:'Print the third value using an index, not by copying the number.',mode:'code',code:'values = [6, 10, 15, 21]\nprint(values[2])'},
        {key:'arr-02',title:'Length',prompt:'Print the number of items.',mode:'code',code:'values = [5, 10, 15, 20]\nprint(len(values))'},
        {key:'arr-03',title:'Total',prompt:'Print the total of the list.',mode:'code',code:'values = [5, 10, 15, 20]\nprint(sum(values))'},
        {key:'arr-04',title:'Minimum and maximum',prompt:'Print the minimum and maximum, one per line.',mode:'code',code:'values = [8, 4, 21, 13]\nprint(min(values))\nprint(max(values))'},
        {key:'arr-05',title:'Append',prompt:'Append 18, then print the complete list.',mode:'code',code:'values = [6, 12]\nvalues.append(18)\nprint(values)'},
        {key:'arr-06',title:'Mean from a list',prompt:'Calculate and print the mean using sum and len.',mode:'code',code:'values = [10, 15, 5, 20]\nmean = sum(values) / len(values)\nprint(mean)'}
      ]
    },
    {
      slug:'logic', sequence:4, title:'Comparisons and logical operators', nav:'Comparisons & logic', figure:'logic-gate',
      lead:'Comparisons ask questions and return Boolean values. Logical operators combine those questions.',
      definition:'Use >, >=, <, <=, == and != to compare values. Use and when both conditions must be True, or when either condition may be True, and not to reverse a Boolean value.',
      goals:['Distinguish = from ==.','Predict True/False comparison results.','Combine conditions with and/or.','Use not to invert a Boolean expression.'],
      syntax:[['Greater than','x > 10'],['At least','x >= 10'],['Equal','x == 10'],['Different','x != 10'],['Both','a > 0 and b > 0'],['Either','a > 0 or b > 0']],
      example:'score = 85\nattendance = 0.92\neligible = score >= 70 and attendance >= 0.80\nprint(eligible)',
      caption:'The complete expression evaluates to one Boolean result.',
      pitfalls:['Using = when a comparison needs ==.','Forgetting that and requires both sides to be True.','Comparing incompatible types without conversion.'],
      intro:'Complete the Boolean workshop before decisions with if/else are released.',
      exercises:[
        {key:'logic-01',title:'Greater or equal',prompt:'Check whether score is at least 70.',mode:'code',code:'score = 85\nprint(score >= 70)'},
        {key:'logic-02',title:'Equality',prompt:'Check whether group equals "11A".',mode:'code',code:'group = "11A"\nprint(group == "11A")'},
        {key:'logic-03',title:'Different',prompt:'Check whether status is different from "done".',mode:'code',code:'status = "pending"\nprint(status != "done")'},
        {key:'logic-04',title:'AND',prompt:'A student is eligible if score >= 70 and attendance >= 0.80.',mode:'code',code:'score = 76\nattendance = 0.85\nprint(score >= 70 and attendance >= 0.80)'},
        {key:'logic-05',title:'OR',prompt:'Print whether x is negative OR greater than 100.',mode:'code',code:'x = 120\nprint(x < 0 or x > 100)'},
        {key:'logic-06',title:'Assignment vs comparison',prompt:'Which operator checks equality?',mode:'choice',choices:['=','==','=>','!=']}
      ]
    },
    {
      slug:'conditions', sequence:5, title:'Conditions with if, elif and else', nav:'Conditions', figure:'decision-tree',
      lead:'A condition converts a Boolean result into a decision about which block of code should run.',
      definition:'if checks the first condition, elif checks an additional possibility, and else handles the remaining case. The colon and indentation are part of Python syntax.',
      goals:['Write a valid if/else block.','Use elif for a third outcome.','Maintain consistent indentation.','Combine comparisons and conditions in practical rules.'],
      syntax:[['Start','if score >= 70:'],['Second branch','elif score >= 60:'],['Fallback','else:'],['Indented action','    print("pass")'],['Equality','if group == "11A":'],['Combined rule','if age >= 16 and has_id:']],
      example:'score = 68\nif score >= 70:\n    print("pass")\nelif score >= 60:\n    print("close")\nelse:\n    print("review")',
      caption:'Only one branch runs. Indentation shows which instructions belong to each branch.',
      pitfalls:['Missing the colon after if/elif/else.','Mixing indentation levels.','Writing several independent if statements when only one outcome should occur.'],
      intro:'Solve the decision workshop in sequence. Loops remain locked until this topic is complete.',
      exercises:[
        {key:'cond-01',title:'Two branches',prompt:'Make the code print pass for score 76.',mode:'code',code:'score = 76\nif score >= 70:\n    print("pass")\nelse:\n    print("review")'},
        {key:'cond-02',title:'Three outcomes',prompt:'Make a score of 68 print close.',mode:'code',code:'score = 68\nif score >= 70:\n    print("pass")\nelif score >= 60:\n    print("close")\nelse:\n    print("review")'},
        {key:'cond-03',title:'Text condition',prompt:'Print lab when room equals "physics".',mode:'code',code:'room = "physics"\nif room == "physics":\n    print("lab")\nelse:\n    print("classroom")'},
        {key:'cond-04',title:'Combined condition',prompt:'Print enter only if age >= 16 and has_id is True.',mode:'code',code:'age = 17\nhas_id = True\nif age >= 16 and has_id:\n    print("enter")\nelse:\n    print("wait")'},
        {key:'cond-05',title:'Indentation',prompt:'Which line must be indented inside an if block?',mode:'choice',choices:['The variable created before if','The action executed when the condition is True','The word if only','Every line in the file']},
        {key:'cond-06',title:'Fallback',prompt:'Which keyword handles the remaining case after if/elif?',mode:'choice',choices:['then','otherwise','else','case']}
      ]
    },
    {
      slug:'loops', sequence:6, title:'Loops: repeat without copying code', nav:'Loops', figure:'loop-cycle',
      lead:'A loop repeats an instruction for each item in a sequence instead of duplicating code.',
      definition:'A for loop takes one item at a time from a list and assigns it to a loop variable. The indented block runs once per item. Accumulators and counters let loops summarize data.',
      goals:['Iterate through every value in a list.','Use an accumulator for totals.','Use a counter based on a condition.','Recognize when a loop replaces repetitive code.'],
      syntax:[['Visit values','for value in values:'],['Indented action','    print(value)'],['Accumulator','total = total + value'],['Counter','count = count + 1'],['Range','for i in range(5):'],['Index + value','for i, value in enumerate(values):']],
      example:'values = [2, 4, 6, 8]\ntotal = 0\nfor value in values:\n    total = total + value\nprint(total)',
      caption:'The loop visits four values, but the accumulation logic is written only once.',
      pitfalls:['Forgetting to indent the loop body.','Resetting the accumulator inside the loop.','Using the wrong loop variable name.'],
      intro:'Finish repetition, accumulation and counting stages to unlock Functions.',
      exercises:[
        {key:'loop-01',title:'Visit values',prompt:'Print each item on a new line.',mode:'code',code:'values = [3, 6, 9]\nfor value in values:\n    print(value)'},
        {key:'loop-02',title:'Accumulator',prompt:'Add all values with a loop and print total.',mode:'code',code:'values = [2, 4, 6, 8]\ntotal = 0\nfor value in values:\n    total = total + value\nprint(total)'},
        {key:'loop-03',title:'Counter',prompt:'Count values greater than 10.',mode:'code',code:'values = [4, 12, 18, 7, 15]\ncount = 0\nfor value in values:\n    if value > 10:\n        count = count + 1\nprint(count)'},
        {key:'loop-04',title:'Range',prompt:'Print 0 through 3 using range(4).',mode:'code',code:'for i in range(4):\n    print(i)'},
        {key:'loop-05',title:'Loop purpose',prompt:'When is a for loop useful?',mode:'choice',choices:['When a variable should never change','When the same process must be applied to each item','Only when printing text','Only for exactly ten values']},
        {key:'loop-06',title:'Accumulator placement',prompt:'Where should total = 0 normally be placed?',mode:'choice',choices:['Inside the loop before adding each value','After the final print only','Before the loop','Inside an if statement only']}
      ]
    },
    {
      slug:'functions', sequence:7, title:'Functions: name a reusable process', nav:'Functions', figure:'function-box',
      lead:'A function gives a reusable process a name and separates inputs from outputs.',
      definition:'Use def to define a function, parameters to receive input, and return to send a value back. Calling the function runs the stored process.',
      goals:['Define a function with def.','Pass one or more parameters.','Return a result instead of only printing it.','Reuse one function with different inputs.'],
      syntax:[['Define','def mean(a, b):'],['Return','    return (a + b) / 2'],['Call','mean(4, 6)'],['Store result','result = mean(4, 6)'],['Two parameters','def add(a, b):'],['List parameter','def average(values):']],
      example:'def average(values):\n    return sum(values) / len(values)\n\nscores = [4, 5, 3]\nprint(average(scores))',
      caption:'The list is input. The returned mean can be printed, stored or reused later.',
      pitfalls:['Forgetting parentheses in the definition or call.','Using print when another calculation needs the returned value.','Placing return outside the function indentation.'],
      intro:'Complete the reusable-process workshop to unlock the final Statistics module.',
      exercises:[
        {key:'fn-01',title:'Simple function',prompt:'Define add and print add(4, 6).',mode:'code',code:'def add(a, b):\n    return a + b\n\nprint(add(4, 6))'},
        {key:'fn-02',title:'Return a mean',prompt:'Define average for a list and print the mean.',mode:'code',code:'def average(values):\n    return sum(values) / len(values)\n\nprint(average([4, 6, 8]))'},
        {key:'fn-03',title:'Reuse',prompt:'Call the same square function for 3 and 5.',mode:'code',code:'def square(x):\n    return x ** 2\n\nprint(square(3))\nprint(square(5))'},
        {key:'fn-04',title:'Two parameters',prompt:'Return the larger of a and b using max().',mode:'code',code:'def larger(a, b):\n    return max(a, b)\n\nprint(larger(7, 12))'},
        {key:'fn-05',title:'Return meaning',prompt:'What does return do?',mode:'choice',choices:['Prints every variable automatically','Sends a result back to the caller','Stops Python permanently','Creates a loop']},
        {key:'fn-06',title:'Function definition',prompt:'Which keyword starts a Python function definition?',mode:'choice',choices:['func','function','def','return']}
      ]
    },
    {
      slug:'statistics', sequence:8, title:'Statistics with lists', nav:'Statistics with lists', figure:'stats-summary',
      lead:'Combine lists, loops, conditions and functions to produce small statistical summaries.',
      definition:'For a list of numeric observations, the first useful summaries are count, total, mean, minimum, maximum and range. These can be built with core Python before introducing NumPy or Pandas.',
      goals:['Calculate count, total and mean from a list.','Calculate minimum, maximum and range.','Count observations that satisfy a rule.','Package a summary inside a function.'],
      syntax:[['Count','len(values)'],['Total','sum(values)'],['Mean','sum(values) / len(values)'],['Minimum','min(values)'],['Maximum','max(values)'],['Range','max(values) - min(values)']],
      example:'values = [8, 12, 10, 14, 6]\nmean = sum(values) / len(values)\ndata_range = max(values) - min(values)\nprint(mean)\nprint(data_range)',
      caption:'Core Python is enough for these first descriptive statistics. Libraries come later.',
      pitfalls:['Confusing statistical range with Python range().','Forgetting to divide the total by the number of observations.','Mixing text values into a numeric list.'],
      intro:'This final workshop integrates the complete foundation path.',
      exercises:[
        {key:'stat-01',title:'Count and total',prompt:'Print count and total, one per line.',mode:'code',code:'values = [8, 12, 10, 14, 6]\nprint(len(values))\nprint(sum(values))'},
        {key:'stat-02',title:'Mean',prompt:'Calculate the mean.',mode:'code',code:'values = [8, 12, 10, 14, 6]\nprint(sum(values) / len(values))'},
        {key:'stat-03',title:'Range',prompt:'Print max - min.',mode:'code',code:'values = [8, 12, 10, 14, 6]\nprint(max(values) - min(values))'},
        {key:'stat-04',title:'Above the mean',prompt:'Count how many values are greater than the mean.',mode:'code',code:'values = [8, 12, 10, 14, 6]\nmean = sum(values) / len(values)\ncount = 0\nfor value in values:\n    if value > mean:\n        count = count + 1\nprint(count)'},
        {key:'stat-05',title:'Summary function',prompt:'Return mean and range from a function, then print them.',mode:'code',code:'def summary(values):\n    mean = sum(values) / len(values)\n    data_range = max(values) - min(values)\n    return mean, data_range\n\nprint(summary([2, 4, 6, 8]))'},
        {key:'stat-06',title:'Range meaning',prompt:'In descriptive statistics, range means:',mode:'choice',choices:['number of values','maximum + minimum','maximum - minimum','Python range()']}
      ]
    }
  ];

  const references = [
    {sequence:1,items:[['Store','x = 10'],['Print','print(x)'],['Arithmetic','+  -  *  /'],['Power','x ** 2'],['Square root','x ** 0.5'],['Remainder','x % 2']]},
    {sequence:2,items:[['Inspect type','type(x).__name__'],['Integer','int(value)'],['Decimal','float(value)'],['Text','str(value)'],['Boolean','True / False'],['Missing','None']]},
    {sequence:3,items:[['List','values = [4, 7, 9]'],['Index','values[0]'],['Length','len(values)'],['Total','sum(values)'],['Minimum','min(values)'],['Append','values.append(10)']]},
    {sequence:4,items:[['Compare','>  >=  <  <='],['Equal','=='],['Different','!='],['Both','and'],['Either','or'],['Reverse','not']]},
    {sequence:5,items:[['Decision','if condition:'],['Second branch','elif condition:'],['Fallback','else:'],['Indent','    print(...)']]},
    {sequence:6,items:[['Loop','for value in values:'],['Range loop','for i in range(5):'],['Counter','count += 1'],['Accumulator','total += value']]},
    {sequence:7,items:[['Define','def name(...):'],['Return','return result'],['Call','name(value)'],['List parameter','def average(values):']]},
    {sequence:8,items:[['Mean','sum(values) / len(values)'],['Range','max(values) - min(values)'],['Count','len(values)'],['Min / max','min(values) / max(values)']]}
  ];

  const bySlug = Object.fromEntries(topics.map(t => [t.slug, t]));
  const state = { snapshot:null, registration:null, activeSlug:null, stageIndex:0, lastOutput:'', lastCode:'', lastValidation:null, pyodide:null, pyodidePromise:null };
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function getStoredSession(){
    try { return JSON.parse(localStorage.getItem(config.sessionStorageKey) || 'null'); } catch { return null; }
  }
  function storeSession(registrationId, accessToken){ localStorage.setItem(config.sessionStorageKey, JSON.stringify({registrationId, accessToken})); }
  function clearSession(){ localStorage.removeItem(config.sessionStorageKey); state.snapshot=null; state.registration=null; }
  function topicProgress(slug){ return state.snapshot?.topics?.find(t => t.slug === slug) || null; }
  function serverItem(slug,key){ return topicProgress(slug)?.items?.find(i => i.key === key) || null; }
  function maxReleasedSequence(){
    const released = (state.snapshot?.topics || []).filter(t => t.status !== 'locked').map(t => t.sequence);
    return released.length ? Math.max(...released) : 1;
  }

  async function rpc(name,args){
    const {data,error} = await client.rpc(name,args);
    if (error) throw new Error(error.message || 'Backend request failed');
    return data;
  }

  function updateRegistrationFields(){
    const mode = $('registrationMode').value;
    const team = mode === 'team';
    $('teamSizeWrap').classList.toggle('hidden', !team);
    const size = team ? Number($('teamSize').value) : 1;
    $('member2Wrap').classList.toggle('hidden', size < 2);
    $('member3Wrap').classList.toggle('hidden', size < 3);
    $('memberEmail2').required = size >= 2;
    $('memberEmail3').required = size >= 3;
  }

  function collectEmails(){
    const mode = $('registrationMode').value;
    const size = mode === 'team' ? Number($('teamSize').value) : 1;
    const emails = [];
    for(let i=1;i<=size;i++) emails.push($(`memberEmail${i}`).value.trim().toLowerCase());
    return emails;
  }

  function validInstitutionalEmails(emails){
    if(new Set(emails).size !== emails.length) return 'Do not repeat the same institutional email.';
    for(const email of emails){
      if(!email.endsWith(`@${config.institutionalEmailDomain}`) || email.split('@').length !== 2) return `Use institutional emails ending in @${config.institutionalEmailDomain}.`;
    }
    return '';
  }

  async function register(event){
    event.preventDefault();
    const status = $('registrationStatus');
    const emails = collectEmails();
    const localError = validInstitutionalEmails(emails);
    if(localError){ status.textContent=localError; status.className='inline-status error'; return; }
    $('registerButton').disabled=true; status.textContent='Registering and loading progress…'; status.className='inline-status';
    try{
      const data = await rpc(config.rpc.register, {
        p_registration_mode:$('registrationMode').value,
        p_group_code:$('groupCode').value,
        p_student_emails:emails,
        p_session_id:crypto.randomUUID(),
        p_user_agent:navigator.userAgent
      });
      storeSession(data.registration_id,data.access_token);
      state.registration={registrationId:data.registration_id,accessToken:data.access_token};
      applySnapshot(data.snapshot);
      status.textContent='Registration ready.'; status.className='inline-status ok';
      showHub();
    }catch(error){
      status.textContent=error.message; status.className='inline-status error';
    }finally{$('registerButton').disabled=false;}
  }

  async function resumeStored(){
    const saved = getStoredSession();
    if(!saved?.registrationId || !saved?.accessToken) return false;
    try{
      const data = await rpc(config.rpc.resume,{p_registration_id:saved.registrationId,p_access_token:saved.accessToken});
      state.registration=saved; applySnapshot(data.snapshot); return true;
    }catch{ clearSession(); return false; }
  }

  function applySnapshot(snapshot){
    state.snapshot=snapshot;
    const requested = new URLSearchParams(location.search).get('topic');
    if(requested && topicProgress(requested)?.status !== 'locked') state.activeSlug=requested;
    if(!state.activeSlug || topicProgress(state.activeSlug)?.status === 'locked') state.activeSlug=snapshot.current_topic || 'operations';
    const topic = bySlug[state.activeSlug];
    const firstIncomplete = topic?.exercises.findIndex(ex => !serverItem(topic.slug,ex.key)?.correct) ?? 0;
    state.stageIndex = firstIncomplete >= 0 ? firstIncomplete : Math.max(0,topic?.exercises.length-1 || 0);
  }

  function showHub(){
    $('registrationPanel').classList.add('hidden'); $('hubPanel').classList.remove('hidden');
    $('changeRegistrationButton').classList.remove('hidden'); $('sessionBadge').classList.remove('hidden');
    renderAll();
  }
  function showRegistration(){
    $('registrationPanel').classList.remove('hidden'); $('hubPanel').classList.add('hidden');
    $('changeRegistrationButton').classList.add('hidden'); $('sessionBadge').classList.add('hidden');
  }

  function renderAll(){
    const reg = state.snapshot.registration;
    $('sessionBadge').textContent=`${reg.group_code} · ${reg.mode === 'team' ? 'Team' : 'Individual'} · ${state.snapshot.completed_topics}/${state.snapshot.total_topics}`;
    $('identitySummary').textContent=`${reg.group_code} · ${reg.display_label}`;
    $('progressText').textContent=`${state.snapshot.completed_topics} / ${state.snapshot.total_topics}`;
    $('progressBar').style.width=`${Math.round(100*state.snapshot.completed_topics/state.snapshot.total_topics)}%`;
    renderNav(); renderPath(); renderLesson(); renderReference();
  }

  function renderNav(){
    $('topicNav').innerHTML=topics.map(topic=>{
      const p=topicProgress(topic.slug); const status=p?.status || 'locked'; const disabled=status==='locked'?'disabled':'';
      const active=state.activeSlug===topic.slug?'active':'';
      return `<button class="topic-button ${escapeHtml(status)} ${active}" data-topic="${topic.slug}" type="button" ${disabled} aria-current="${active?'page':'false'}"><span class="topic-number">${String(topic.sequence).padStart(2,'0')}</span><span><span class="topic-name">${escapeHtml(topic.nav)}</span><span class="topic-status-line">${status==='completed'?'Complete':status==='in_progress'?`${p.percent}% · in progress`:status==='available'?'Available':'Locked'}</span></span><span class="topic-check" aria-hidden="true"></span></button>`;
    }).join('');
    $('topicNav').querySelectorAll('button:not([disabled])').forEach(btn=>btn.addEventListener('click',()=>selectTopic(btn.dataset.topic)));
  }

  function renderPath(){
    const parts=[];
    topics.forEach((topic,index)=>{
      const p=topicProgress(topic.slug); const cls=[p?.status||'locked',state.activeSlug===topic.slug?'current':''].filter(Boolean).join(' ');
      parts.push(`<span class="path-node ${cls}">${String(topic.sequence).padStart(2,'0')} ${escapeHtml(topic.nav)}</span>`);
      if(index<topics.length-1) parts.push('<i></i>');
    });
    $('pathStrip').innerHTML=parts.join('');
  }

  function selectTopic(slug){
    const p=topicProgress(slug); if(!p || p.status==='locked') return;
    state.activeSlug=slug; const topic=bySlug[slug];
    const firstIncomplete=topic.exercises.findIndex(ex=>!serverItem(slug,ex.key)?.correct);
    state.stageIndex=firstIncomplete>=0?firstIncomplete:0; state.lastValidation=null; state.lastOutput='';
    const url=new URL(location.href); url.searchParams.set('topic',slug); history.replaceState({},'',url);
    renderAll(); window.scrollTo({top:Math.max(0,$('lessonMount').offsetTop-80),behavior:'smooth'});
  }

  function renderFigure(kind){
    if(kind==='cell-flow') return '<div class="simple-flow"><span>CODE CELL</span><i></i><span>RUN</span><i></i><span>OUTPUT</span><i></i><span>CORRECT</span></div>';
    if(kind==='type-cards') return '<div class="visual-card-grid"><div><strong>42</strong><span>int</span></div><div><strong>4.5</strong><span>float</span></div><div><strong>"11A"</strong><span>str</span></div><div><strong>True</strong><span>bool</span></div><div><strong>None</strong><span>NoneType</span></div></div>';
    if(kind==='array-index') return '<div class="array-visual"><div class="array-cell"><strong>8</strong><small>index 0</small></div><div class="array-cell"><strong>13</strong><small>index 1</small></div><div class="array-cell"><strong>21</strong><small>index 2</small></div><div class="array-cell"><strong>34</strong><small>index 3</small></div></div>';
    if(kind==='logic-gate') return '<div class="simple-flow"><span>score = 85</span><i></i><span>score ≥ 70 ?</span><i></i><span>True</span></div>';
    if(kind==='decision-tree') return '<div class="decision-visual"><div class="branch">True → PASS</div><span class="question">score ≥ 70 ?</span><div class="branch">False → REVIEW</div></div>';
    if(kind==='loop-cycle') return '<div class="simple-flow"><span>[3, 6, 9]</span><i></i><span>for value</span><i></i><span>repeat action</span></div>';
    if(kind==='function-box') return '<div class="function-visual"><div>INPUT<br><strong>values</strong></div><span>→</span><div>FUNCTION<br><strong>average(...)</strong></div><span>→</span><div>OUTPUT<br><strong>mean</strong></div></div>';
    return '<div class="stats-visual"><div><span>count</span><strong>len(values)</strong></div><div><span>mean</span><strong>sum / len</strong></div><div><span>range</span><strong>max - min</strong></div></div>';
  }

  function renderLesson(){
    const topic=bySlug[state.activeSlug]; const progress=topicProgress(topic.slug);
    if(!topic || !progress || progress.status==='locked'){
      $('lessonMount').innerHTML='<article class="lesson-access locked"><div class="lock-symbol">×</div><h2>Topic locked</h2><p>Complete the previous workshop before this lesson is released.</p></article>'; return;
    }
    const syntax=topic.syntax.map(([label,code])=>`<div class="syntax-row"><span>${escapeHtml(label)}</span><code>${escapeHtml(code)}</code></div>`).join('');
    const goals=topic.goals.map(g=>`<li>${escapeHtml(g)}</li>`).join('');
    const pitfalls=topic.pitfalls.map(g=>`<li>${escapeHtml(g)}</li>`).join('');
    $('lessonMount').classList.remove('swap-in'); void $('lessonMount').offsetWidth; $('lessonMount').classList.add('swap-in');
    $('lessonMount').innerHTML=`
      <header class="lesson-header"><div><div class="lesson-index">Topic ${String(topic.sequence).padStart(2,'0')} · ${escapeHtml(progress.status.replace('_',' '))}</div><h2 class="lesson-title">${escapeHtml(topic.title)}</h2><p class="lesson-lead">${escapeHtml(topic.lead)}</p></div><div><strong>${progress.percent}%</strong><div class="topic-status-line">${progress.correct_count}/${progress.total_count} workshop stages</div></div></header>
      <div class="lesson-grid">
        <article class="panel"><h3>Core idea</h3><p class="definition">${escapeHtml(topic.definition)}</p><h3 style="margin-top:22px">Learning goals</h3><ul class="learning-goals">${goals}</ul><div class="syntax-list">${syntax}</div></article>
        <article class="panel soft figure-panel"><div class="figure-label">Visual model</div>${renderFigure(topic.figure)}<div class="example-block"><h3>Worked example</h3><div class="code-card"><pre>${escapeHtml(topic.example)}</pre></div><p class="code-caption">${escapeHtml(topic.caption)}</p></div></article>
      </div>
      <article class="panel soft" style="margin-top:22px"><h3>Common mistakes to avoid</h3><ul class="pitfall-list">${pitfalls}</ul></article>
      ${renderWorkshop(topic,progress)}
      ${progress.status==='completed'?renderCompleteBanner(topic):''}
    `;
    bindWorkshop(topic);
  }

  function renderWorkshop(topic,progress){
    const buttons=topic.exercises.map((ex,i)=>{const item=serverItem(topic.slug,ex.key);return `<button class="stage-button ${i===state.stageIndex?'active':''} ${item?.correct?'correct':''}" type="button" data-stage="${i}">${String(i+1).padStart(2,'0')} ${escapeHtml(ex.title)}</button>`;}).join('');
    return `<section class="workshop-section"><div class="workshop-head"><div><p class="eyebrow">COMPLETE WORKSHOP</p><h3>${escapeHtml(topic.title)} · Workshop</h3><p>${escapeHtml(topic.intro)}</p></div><div class="workshop-progress"><strong>${progress.correct_count} / ${progress.total_count}</strong><span>required stages correct</span></div></div><div class="stage-strip">${buttons}</div><div id="stageMount"></div></section>`;
  }

  function renderCompleteBanner(topic){
    const next=topics.find(t=>t.sequence===topic.sequence+1);
    return `<div class="topic-complete-banner"><div><strong>Topic complete · Tema completado</strong><span>${next?`${escapeHtml(next.title)} is now unlocked.`:'The complete Python foundation path is finished.'}</span></div>${next?`<button class="button button-dark" type="button" data-next-topic="${next.slug}">Open next topic</button>`:''}</div>`;
  }

  function bindWorkshop(topic){
    $('lessonMount').querySelectorAll('.stage-button').forEach(btn=>btn.addEventListener('click',()=>{state.stageIndex=Number(btn.dataset.stage);state.lastValidation=null;renderLesson();}));
    const next=$('lessonMount').querySelector('[data-next-topic]'); if(next) next.addEventListener('click',()=>selectTopic(next.dataset.nextTopic));
    renderStage(topic);
  }

  function renderStage(topic){
    const ex=topic.exercises[state.stageIndex] || topic.exercises[0]; const item=serverItem(topic.slug,ex.key) || {correct:false,tries:0};
    const feedback=state.lastValidation && state.lastValidation.topic===topic.slug && state.lastValidation.key===ex.key ? state.lastValidation : null;
    let work='';
    if(ex.mode==='code'){
      work=`<div class="workspace-column"><div class="editor-toolbar"><strong>Python cell</strong><div class="editor-actions"><button id="resetCode" class="small-button" type="button">Reset</button><button id="runCode" class="small-button primary" type="button">▶ Run</button></div></div><textarea id="codeEditor" class="code-editor" spellcheck="false">${escapeHtml(ex.code)}</textarea><div class="output-wrap"><div class="output-label"><span>Output</span><span id="runtimeStatus" class="runtime-badge">Python runtime</span></div><pre id="codeOutput" class="output">${escapeHtml(state.lastCode===ex.code?state.lastOutput:'Run the cell to inspect its output.')}</pre></div><div class="validate-row"><span>Validation happens on the course backend; expected answers are not stored in this page.</span><button id="validateCode" class="button button-dark" type="button">Validate output</button></div></div>`;
    } else {
      const choices=ex.choices.map((choice,i)=>`<label class="choice-option"><input type="radio" name="choice" value="${escapeHtml(choice)}"><span>${escapeHtml(choice)}</span></label>`).join('');
      work=`<div class="workspace-column"><div class="choice-list">${choices}</div><div class="validate-row"><span>Select one answer, then validate it with the backend.</span><button id="validateChoice" class="button button-dark" type="button">Validate answer</button></div></div>`;
    }
    $('stageMount').innerHTML=`<div class="stage-body"><div class="stage-instructions"><div class="stage-kicker">Stage ${state.stageIndex+1} of ${topic.exercises.length}</div><h4>${escapeHtml(ex.title)}</h4><p>${escapeHtml(ex.prompt)}</p><div class="stage-status ${item.correct?'ok':''}">${item.correct?'✓ Completed correctly':`Attempts: ${item.tries||0} · This stage must be correct to count.`}</div>${feedback?`<div class="stage-status ${feedback.correct?'ok':''}">${feedback.correct?'Correct. Progress saved.':'Not correct yet. Inspect the code/output and try again.'}</div>`:''}</div>${work}</div>`;
    if(ex.mode==='code') bindCodeStage(topic,ex); else bindChoiceStage(topic,ex);
  }

  async function ensurePyodide(){
    if(state.pyodide) return state.pyodide;
    if(!state.pyodidePromise){
      state.pyodidePromise=(async()=>{
        if(typeof window.loadPyodide!=='function') throw new Error('Python runtime could not be loaded.');
        const runtime=await window.loadPyodide(); state.pyodide=runtime; return runtime;
      })();
    }
    return state.pyodidePromise;
  }

  async function runPython(code){
    const runtime=await ensurePyodide(); const stdout=[]; const stderr=[];
    runtime.setStdout({batched:text=>stdout.push(text)}); runtime.setStderr({batched:text=>stderr.push(text)});
    await runtime.runPythonAsync(code);
    if(stderr.length) throw new Error(stderr.join('\n'));
    return stdout.join('\n').replace(/\s+$/,'');
  }

  function bindCodeStage(topic,ex){
    const editor=$('codeEditor');
    editor.addEventListener('keydown',event=>{if(event.key==='Tab'){event.preventDefault();const start=editor.selectionStart,end=editor.selectionEnd;editor.value=editor.value.slice(0,start)+'    '+editor.value.slice(end);editor.selectionStart=editor.selectionEnd=start+4;}});
    $('resetCode').addEventListener('click',()=>{editor.value=ex.code;state.lastOutput='';state.lastCode='';$('codeOutput').textContent='Code reset. Run the cell again.';});
    $('runCode').addEventListener('click',async()=>{
      const badge=$('runtimeStatus'); badge.textContent='Loading / running…';badge.classList.add('loading');$('runCode').disabled=true;
      try{const code=editor.value;const output=await runPython(code);state.lastOutput=output;state.lastCode=code;$('codeOutput').textContent=output || '(no printed output)';badge.textContent='Python ready';badge.className='runtime-badge ready';}
      catch(error){state.lastOutput='';state.lastCode='';$('codeOutput').textContent=error.message;badge.textContent='Python error';badge.className='runtime-badge';}
      finally{$('runCode').disabled=false;}
    });
    $('validateCode').addEventListener('click',async()=>{
      if(state.lastCode!==editor.value){$('codeOutput').textContent='Run the current code before validating it.';return;}
      await validateStage(topic,ex,state.lastOutput,editor.value);
    });
  }

  function bindChoiceStage(topic,ex){
    $('validateChoice').addEventListener('click',async()=>{
      const selected=document.querySelector('input[name="choice"]:checked');
      if(!selected){state.lastValidation={topic:topic.slug,key:ex.key,correct:false};renderStage(topic);return;}
      await validateStage(topic,ex,selected.value,null);
    });
  }

  async function validateStage(topic,ex,answer,codeSnapshot){
    const saved=state.registration || getStoredSession(); if(!saved) return showRegistration();
    const buttons=[...document.querySelectorAll('#stageMount button')];buttons.forEach(b=>b.disabled=true);
    try{
      const data=await rpc(config.rpc.submit,{p_registration_id:saved.registrationId,p_access_token:saved.accessToken,p_topic_slug:topic.slug,p_item_key:ex.key,p_answer:String(answer ?? ''),p_code_snapshot:codeSnapshot});
      state.lastValidation={topic:topic.slug,key:ex.key,correct:Boolean(data.correct)}; applySnapshot(data.snapshot);
      if(data.correct){
        const currentTopic=bySlug[topic.slug]; const next=currentTopic.exercises.findIndex(item=>!serverItem(topic.slug,item.key)?.correct);
        state.activeSlug=topic.slug; state.stageIndex=next>=0?next:Math.min(state.stageIndex,currentTopic.exercises.length-1);
      }
      renderAll();
    }catch(error){
      state.lastValidation={topic:topic.slug,key:ex.key,correct:false,message:error.message};renderLesson();
    }finally{buttons.forEach(b=>b.disabled=false);}
  }

  function renderReference(){
    const max=maxReleasedSequence(); const items=references.filter(group=>group.sequence<=max).flatMap(group=>group.items);
    $('referenceGrid').innerHTML=items.map(([label,code])=>`<article><span>${escapeHtml(label)}</span><code>${escapeHtml(code)}</code></article>`).join('');
  }

  async function init(){
    $('registrationMode').addEventListener('change',updateRegistrationFields); $('teamSize').addEventListener('change',updateRegistrationFields); updateRegistrationFields();
    $('registrationForm').addEventListener('submit',register);
    $('changeRegistrationButton').addEventListener('click',()=>{clearSession();showRegistration();});
    $('continueButton').addEventListener('click',()=>selectTopic(state.snapshot?.current_topic || state.activeSlug || 'operations'));
    const resumed=await resumeStored(); if(resumed) showHub(); else showRegistration();
  }

  document.addEventListener('DOMContentLoaded',init);
})();
