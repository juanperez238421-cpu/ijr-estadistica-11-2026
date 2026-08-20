(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const cfg = window.IJR_COLAB_ACTIVITY_CONFIG || {};

  const style = document.createElement('style');
  style.textContent = '#fullscreenGate{display:none!important}';
  document.head.appendChild(style);

  const STAGES = {
    'Variables and addition': {
      concept:'<p>A <strong>variable</strong> is a name that stores a value. In Python, <code>=</code> assigns a value and <code>+</code> adds numbers.</p><p>Your team should read, complete one small line, run it, and explain what happened. <small>Variable = nombre que guarda un valor.</small></p>',
      goal:'<p>Recognize the flow <strong>value → variable → operation → output</strong> and distinguish assigning a value from printing it.</p>',
      steps:['Identify the value stored in <code>a</code> and in <code>b</code>.','Replace <code>WRITE_HERE</code> with an expression that adds <code>a</code> and <code>b</code>.','Do not type the numeric answer manually; make Python calculate it.','Run the cell, read the output, and validate only when your team can explain which line produced it.'],
      task:'<p>Create <code>result</code> from the sum of <code>a</code> and <code>b</code>, then display it with <code>print()</code>.</p>',
      explore:'<p>Try <code>type(a)</code> and <code>a == 12</code> in the console.</p>',
      hints:['Think about the arithmetic operator Python uses for addition.','Use the <strong>variable names</strong> <code>a</code> and <code>b</code>, not the numbers written again.','The structure you need is <code>result = a + b</code>.'],
      starter:'a = 12\nb = 5\n\n# TODO: build the sum using variables a and b\nresult = WRITE_HERE\n\nprint(result)'
    },
    'Multiplication as an operation': {
      concept:'<p>Arithmetic operators transform data. Python represents multiplication with <code>*</code>. The result of an expression can be stored and reused. <small>Multiplicación en Python: <code>*</code>.</small></p>',
      goal:'<p>Distinguish <strong>input data</strong>, the <strong>operation</strong>, and the <strong>result</strong>.</p>',
      steps:['Identify the input variables <code>a</code> and <code>b</code>.','Complete only <code>WRITE_HERE</code>; this time you need multiplication.','Run the code. If Python reports an error, read the message before editing.','Before validating, try <code>a ** 2</code> in the console and compare the operators.'],
      task:'<p>Create <code>product</code> from the two existing variables and produce one numeric output.</p>',
      explore:'<p>Try <code>a ** 2</code>. The operators <code>*</code> and <code>**</code> do different things.</p>',
      hints:['The mathematical × symbol is not typed the same way in Python.','Use an asterisk <code>*</code> between the two variable names.','The complete line is <code>product = a * b</code>.'],
      starter:'a = 12\nb = 5\n\n# TODO: build the product using a and b\nproduct = WRITE_HERE\n\nprint(product)'
    },
    'A list stores many values': {
      concept:'<p>A Python <strong>list</strong> stores several observations in one object using brackets <code>[ ]</code>. Before summarizing data, we often need to know how many observations we have. <small>Lista = colección de valores.</small></p>',
      goal:'<p>Move from single values to a collection and obtain its size with a function.</p>',
      steps:['Look at <code>numbers</code>; do not count the values manually.','Find the Python function that returns the number of elements.','Complete <code>count = WRITE_HERE</code>.','Run the cell, then explore <code>numbers[0]</code> and <code>numbers[-1]</code>.'],
      task:'<p>Make Python determine how many observations are stored in <code>numbers</code>.</p>',
      explore:'<p>Try <code>type(numbers)</code>, <code>numbers[0]</code>, and <code>numbers[-1]</code>.</p>',
      hints:['You need a function that measures the length of a collection.','The function is <code>len(...)</code>; place the list name inside the parentheses.','The complete line is <code>count = len(numbers)</code>.'],
      starter:'numbers = [12, 7, 15, 9, 11]\n\n# TODO: calculate how many elements numbers contains\ncount = WRITE_HERE\n\nprint(count)'
    },
    'Aggregate a list with sum()': {
      concept:'<p>An <strong>aggregation</strong> turns many observations into one summary value. Adding all values is a first example of aggregation. <small>Agregación = resumir varios datos en un valor.</small></p>',
      goal:'<p>Use a function that receives a complete collection and returns one number.</p>',
      steps:['Think about what the total of the list means.','Do not add each value manually in the code.','Complete <code>total</code> with a function that works on the whole list.','Then try <code>min(numbers)</code> and <code>max(numbers)</code>.'],
      task:'<p>Calculate the total of all observations with a Python function.</p>',
      explore:'<p>Compare <code>sum()</code>, <code>min()</code>, and <code>max()</code>.</p>',
      hints:['Look for a function whose name means “suma”.','The function is <code>sum(...)</code>.','The complete line is <code>total = sum(numbers)</code>.'],
      starter:'numbers = [12, 7, 15, 9, 11]\n\n# TODO: obtain the total of the list with a Python function\ntotal = WRITE_HERE\n\nprint(total)'
    },
    'Build the arithmetic mean': {
      concept:'<p>The arithmetic mean combines two ideas you already used: <strong>add</strong> the observations and <strong>count</strong> them.</p><p>In statistics: \\(\\bar{x}=\\frac{\\sum x_i}{n}\\). Your Python expression should represent the same structure. <small>Media = suma de datos ÷ cantidad de datos.</small></p>',
      goal:'<p>Translate a statistical formula into an executable Python expression.</p>',
      steps:['Identify the numerator and denominator in the formula.','Connect the numerator to a function you already used.','Connect the denominator to the function that counts elements.','Complete <code>mean_value</code>, run it, and explain why the result is a decimal.'],
      task:'<p>Build the mean of <code>numbers</code> using operations on the list.</p>',
      explore:'<p>Try <code>round(mean_value, 1)</code> and compare the two values.</p>',
      hints:['The statistical recipe is “total divided by count”.','Combine <code>sum(numbers)</code> and <code>len(numbers)</code> with the division operator <code>/</code>.','The complete line is <code>mean_value = sum(numbers) / len(numbers)</code>.'],
      starter:'numbers = [12, 7, 15, 9, 11]\n\n# TODO: translate the mean formula into Python\nmean_value = WRITE_HERE\n\nprint(mean_value)'
    },
    'Load a real CSV file': {
      concept:'<p>Now the data are no longer written directly inside the program. A <strong>CSV</strong> stores rows and columns, and <code>pandas</code> converts it into a <strong>DataFrame</strong>.</p><p>The class file is available in this workspace as <code>data.csv</code>. <small>CSV = archivo de datos en filas y columnas.</small></p>',
      goal:'<p>Take the first step from basic Python to real tabular data analysis.</p>',
      steps:['Identify what <code>import pandas</code> and <code>pd.read_csv()</code> do.','Inspect <code>df.head(3)</code> to identify the columns.','You only need the number of rows; investigate <code>df.shape</code>.','Complete <code>row_count</code> and leave only the row count as the final printed output.'],
      task:'<p>Load <code>data.csv</code>, inspect its first rows, and produce the number of records.</p>',
      explore:'<p>Try <code>df.columns</code>, <code>df.shape</code>, and <code>df.dtypes</code>.</p>',
      hints:['<code>df.shape</code> returns two numbers: rows and columns.','The first item of a pair is selected with index <code>[0]</code>.','The complete line is <code>row_count = df.shape[0]</code>.'],
      starter:'import pandas as pd\n\ndf = pd.read_csv("data.csv")\nprint(df.head(3))\n\n# TODO: obtain only the number of rows in the DataFrame\nrow_count = WRITE_HERE\n\nprint(row_count)'
    },
    'Calculate a column mean': {
      concept:'<p>A DataFrame organizes variables by columns. Selecting <code>df["score"]</code> creates a Series on which statistical methods can be applied. <small>Columna = una variable del conjunto de datos.</small></p>',
      goal:'<p>Perform a statistical operation directly on one DataFrame column.</p>',
      steps:['Load the file and identify the <code>score</code> column.','Select that column with brackets.','Find the Pandas method that calculates a mean.','Run it and then try <code>df["score"].describe()</code>.'],
      task:'<p>Use Pandas to calculate the mean of the <code>score</code> column.</p>',
      explore:'<p>With <code>describe()</code>, identify <em>count</em>, <em>mean</em>, <em>min</em>, and <em>max</em>.</p>',
      hints:['First select one DataFrame column.','After <code>df["score"]</code>, call the <code>.mean()</code> method.','The complete line is <code>score_mean = df["score"].mean()</code>.'],
      starter:'import pandas as pd\n\ndf = pd.read_csv("data.csv")\n\n# TODO: calculate the mean of the score column\nscore_mean = WRITE_HERE\n\nprint(score_mean)'
    },
    'Filter rows with a condition': {
      concept:'<p>Data analysis also means <strong>selecting</strong> records. A comparison on a column produces <code>True</code>/<code>False</code> values, and that condition can be used as a filter. <small>Filtrar = seleccionar filas que cumplen una condición.</small></p>',
      goal:'<p>Build a basic query using <strong>select → filter → count</strong>.</p>',
      steps:['Write the condition “score greater than or equal to 4”.','Use that condition inside brackets to create <code>passed</code>.','Count how many rows remain in <code>passed</code>.','Run it, then inspect <code>passed[["student_id", "score"]]</code>.'],
      task:'<p>Filter records with <code>score</code> greater than or equal to 4 and count how many satisfy the condition.</p>',
      explore:'<p>Temporarily change the threshold in the console and observe how the subset changes.</p>',
      hints:['A Pandas filter usually has the form <code>df[condition]</code>.','The condition is <code>df["score"] &gt;= 4</code>; then you can reuse <code>len()</code>.','Use <code>passed = df[df["score"] &gt;= 4]</code> and <code>passed_count = len(passed)</code>.'],
      starter:'import pandas as pd\n\ndf = pd.read_csv("data.csv")\n\n# TODO 1: create a DataFrame with score greater than or equal to 4\npassed = WRITE_HERE\n\n# TODO 2: count how many rows remain after filtering\npassed_count = WRITE_HERE\n\nprint(passed_count)'
    }
  };

  const exact = new Map([
    ['Lean la guía, completen WRITE_HERE y ejecuten. Pueden corregir código sin penalización.','Read the guide, complete WRITE_HERE, and run the cell. You can fix code without a penalty.'],
    ['Python encontró un error. Léanlo, corrijan y vuelvan a ejecutar. Este error de ejecución no resta puntos.','Python found an error. Read it, fix the code, and run again. This execution error does not cost points.'],
    ['La celda produjo una salida. Si el equipo puede explicarla, presionen Validar salida.','The cell produced an output. If your team can explain it, press Validate output.'],
    ['La última salida todavía no es un valor validable. Revisen la guía.','The last output is not yet a value that can be validated. Check the guide.'],
    ['La celda no imprimió una salida. Revisen si falta print(...).','The cell did not print an output. Check whether print(...) is missing.'],
    ['La celda está vacía. Restablézcanla y completen el código.','The cell is empty. Reset it and complete the code.'],
    ['Todavía hay un WRITE_HERE. Reemplacen todos los marcadores antes de ejecutar.','There is still a WRITE_HERE marker. Replace every marker before running the cell.'],
    ['Primero ejecuten una celda que produzca una salida validable.','First run a cell that produces a validatable output.'],
    ['Validando la salida del equipo…','Validating your team output…'],
    ['Solución revelada y registrada. Lean cada línea antes de continuar.','Solution revealed and recorded. Study each line before continuing.'],
    ['Celda restablecida. Lean los pasos y vuelvan a completar WRITE_HERE.','Cell reset. Read the steps and complete WRITE_HERE again.'],
    ['Registrando el equipo y preparando Python…','Registering your team and preparing Python…'],
    ['Python no pudo iniciar. Revisen la conexión y recarguen la página.','Python could not start. Check the connection and reload the page.'],
    ['La sesión anterior ya no está disponible. Pueden registrar nuevamente el equipo.','The previous session is no longer available. You may register the team again.'],
    ['Completen el grupo y el nombre de cada integrante.','Complete the group and the full name of each team member.'],
    ['No repitan el mismo nombre dentro del equipo.','Do not repeat the same name within the team.']
  ]);

  function setHTML(id, html) {
    const el = $(id);
    if (el && el.innerHTML !== html) el.innerHTML = html;
  }

  function setText(id, text) {
    const el = $(id);
    if (el && el.textContent !== text) el.textContent = text;
  }

  function stage() {
    return STAGES[$('lessonTitle')?.textContent?.trim()] || null;
  }

  function applyStage() {
    const data = stage();
    if (!data) return;
    setHTML('lessonConcept', data.concept);
    setHTML('lessonGoal', data.goal);
    setHTML('lessonSteps', data.steps.map((s,i)=>`<li><span>${i+1}</span><div>${s}</div></li>`).join(''));
    setHTML('lessonTask', data.task);
    setHTML('lessonExplore', data.explore);

    const editor = $('codeEditor');
    if (editor && editor.value.includes('WRITE_HERE') && /# TODO:.*(constru|calcul|obteng|traduz|creen|cuenten)/i.test(editor.value)) {
      editor.value = data.starter;
    }

    const panel = $('helpPanel');
    if (panel && !panel.classList.contains('hidden')) {
      const match = panel.textContent.match(/Ayuda\s+(\d+)/);
      if (match) {
        const level = Math.min(Number(match[1]), data.hints.length);
        const html = `<strong>Help ${level}</strong>${data.hints[level-1]}`;
        if (panel.innerHTML !== html) panel.innerHTML = html;
      }
    }
  }

  function translateText() {
    const status = $('activityStatus');
    if (status) {
      const direct = exact.get(status.textContent);
      if (direct) status.textContent = direct;
      else {
        const next = status.textContent
          .replace(/^Correcto\. Esta etapa obtuvo ([0-9.]+) \/ 1\.00 puntos\.$/, 'Correct. This stage earned $1 / 1.00 points.')
          .replace(/^Salida incorrecta registrada\. Error validado #(\d+)\. Pueden corregir, usar una ayuda, ver la solución o continuar sin resolver\.$/, 'Incorrect output recorded. Validated error #$1. You may retry, use a help token, reveal the solution, or continue without solving.')
          .replace(/^Ayuda (\d+) de (\d+) registrada\. Lean la pista y vuelvan al código\.$/, 'Help $1 of $2 recorded. Read the hint and return to the code.')
          .replace(/^No se pudo registrar esta etapa: /, 'This stage could not be recorded: ')
          .replace(/^No se pudo usar la ayuda: /, 'Help could not be used: ')
          .replace(/^No se pudo revelar la solución: /, 'The solution could not be revealed: ')
          .replace(/^No se pudo continuar: /, 'Could not continue: ');
        if (next !== status.textContent) status.textContent = next;
      }
    }

    const setup = $('setupStatus');
    if (setup) {
      const direct = exact.get(setup.textContent);
      if (direct) setup.textContent = direct;
      else {
        const next = setup.textContent.replace(/^No fue posible iniciar: /, 'Could not start the lab: ');
        if (next !== setup.textContent) setup.textContent = next;
      }
    }

    const replacements = [
      ['stepLabel', /^Etapa (\d+) de (\d+)$/, 'Stage $1 of $2'],
      ['progressText', /^(\d+) \/ (\d+) completadas$/, '$1 / $2 completed'],
      ['gradeLabel', /^Proyección /, 'Projected '],
      ['lessonTiming', /^Objetivo:/, 'Target:'],
      ['penaltyStatus', /^Esta etapa puede aportar ([0-9.]+) \/ ([0-9.]+) puntos · errores validados: (\d+) · ayudas usadas aquí: (\d+)\.$/, 'This stage can still earn $1 / $2 points · validated errors: $3 · helps used here: $4.']
    ];
    for (const [id,re,to] of replacements) {
      const el = $(id); if (!el) continue;
      const next = el.textContent.replace(re,to); if (next !== el.textContent) el.textContent = next;
    }

    const hb = $('helpBadge');
    if (hb) {
      const next = hb.textContent.replace(/^(\d+) ayudas?$/, (_,n)=>`${n} help${n==='1'?'':'s'}`);
      if (next !== hb.textContent) hb.textContent = next;
    }
    const hr = $('helpRemainingText');
    if (hr) {
      const next = hr.textContent.replace(/^Quedan (\d+) de (\d+)$/, '$1 of $2 remaining');
      if (next !== hr.textContent) hr.textContent = next;
    }
    const hbtn = $('helpButton');
    if (hbtn?.textContent === 'Usar 1 ayuda') hbtn.textContent = 'Use 1 help';
    if (hbtn?.textContent === 'Sin ayudas disponibles') hbtn.textContent = 'No helps remaining';
    const credit = $('solutionCredit');
    if (credit) {
      const next = credit.textContent.replace(/% de la etapa$/, '% of stage');
      if (next !== credit.textContent) credit.textContent = next;
    }
  }

  const nativeConfirm = window.confirm.bind(window);
  window.confirm = message => nativeConfirm(String(message)
    .replace(/^Usar una ayuda en esta etapa\? Quedan (\d+)\. Cada ayuda reduce 0\.10 de la nota máxima proyectada\.$/, 'Use one help token on this stage? $1 remain. Each help lowers the projected maximum grade by 0.10.')
    .replace('Ver la solución completa cierra esta etapa con 25% de su valor. ¿Desean continuar?','Revealing the complete solution closes this stage for 25% of its value. Continue?')
    .replace('Continuar sin resolver asigna 0% a esta etapa. ¿Desean avanzar?','Continuing without solving gives 0% for this stage. Continue?'));

  function apply() {
    $('fullscreenGate')?.classList.add('hidden');
    applyStage();
    translateText();
  }

  if (cfg.requireFullscreen === false) $('fullscreenGate')?.classList.add('hidden');
  setInterval(apply, 250);
  apply();
})();
