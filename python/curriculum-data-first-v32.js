(() => {
  'use strict';

  const topics = window.IJR_PYTHON_HUB_TOPICS || [];
  const bySlug = Object.fromEntries(topics.map(topic => [topic.slug, topic]));

  const datasetCsv = `estudiante,grupo,edad,nota
Estudiante_01,11A,16,4.2
Estudiante_02,11A,17,3.8
Estudiante_03,11A,16,2.9
Estudiante_04,11A,17,4.5
Estudiante_05,11B,16,3.8
Estudiante_06,11B,17,3.2
Estudiante_07,11B,16,4.0
Estudiante_08,11B,17,3.8
Estudiante_09,11C,16,2.7
Estudiante_10,11C,17,4.6
Estudiante_11,11C,16,3.5
Estudiante_12,11C,17,4.0
`;

  const replaceTopic = (slug, patch) => {
    const topic = bySlug[slug];
    if (!topic) return;
    Object.assign(topic, patch);
  };

  replaceTopic('logic', {
    title:'Conditions: comparisons, logic and if/else',
    nav:'Conditions & if',
    lead:'A statistical rule begins as a comparison and becomes useful when Python can act on the result. Learn comparisons, Boolean logic and if/elif/else together as one decision-making tool.',
    definition:'Comparisons such as nota >= 3.0 produce True or False. The operators and, or and not combine those Boolean rules. An if/elif/else structure then uses the result to choose an action. In statistics, the same logic later becomes the basis for filtering observations in a DataFrame.',
    goals:[
      'Distinguish assignment (=) from comparison (==).',
      'Use >, >=, <, <=, == and != to express rules about data.',
      'Combine conditions with and, or and not.',
      'Use if, elif and else to classify an observation.',
      'Connect a Python decision rule to later DataFrame filtering.'
    ],
    sections:[
      {title:'A comparison asks a data question',body:'An expression such as nota >= 3.0 asks whether an observation satisfies a rule. Python answers with the Boolean value True or False. The comparison itself is already useful evidence: it tells us whether one value belongs to a defined category.'},
      {title:'Logical operators combine rules',body:'and requires every linked condition to be true, or requires at least one, and not reverses a Boolean value. This lets one rule use several variables, such as grade and attendance, without creating a separate programming topic.'},
      {title:'if turns a Boolean into a decision',body:'if checks a Boolean expression and executes its indented block when the expression is True. elif checks another possibility and else handles the remaining case. Indentation is part of Python syntax because it defines which instructions belong to each branch.'},
      {title:'The statistical bridge',body:'Later, Pandas uses the same comparison ideas to select observations. A rule such as nota >= 3.0 first appears as a Boolean decision and later becomes a DataFrame filter. The programming concept therefore serves the statistical question instead of becoming an isolated algorithms lesson.'}
    ],
    syntax:[
      ['Compare','nota >= 3.0'],
      ['Equality','grupo == "11A"'],
      ['Two rules','nota >= 3.0 and asistencia >= 0.80'],
      ['Either rule','nota >= 3.0 or recuperacion'],
      ['Invert','not ausente'],
      ['Decision','if nota >= 3.0:\n    print("Aprueba")\nelse:\n    print("No aprueba")']
    ],
    pitfalls:[
      'Using = when the intention is to compare with ==.',
      'Forgetting that and requires both sides to be True.',
      'Writing if/else without consistent indentation.',
      'Checking broader thresholds before more specific thresholds in an elif chain.',
      'Treating a Boolean result as an answer without interpreting what the rule means for the observation.'
    ],
    diagrams:[
      {type:'comparison-bool',title:'Observation → comparison → Boolean',description:'A comparison converts a statement about one observation into True or False.'},
      {type:'logic-gates',title:'Combine statistical rules',description:'AND, OR and NOT join Boolean statements so one decision can depend on several pieces of data.'},
      {type:'logic-rule',title:'Boolean rule → if/else decision',description:'The same rule that classifies one observation will later become a Pandas filter for many observations.'}
    ],
    workshopIntro:'Comparisons, Boolean operators and if/elif/else are practiced together in one 12-stage workshop. The goal is to express meaningful rules about data, not to study control flow in isolation.',
    exercises:[
      {key:'logic-01',title:'Approval comparison',prompt:'Start from a blank cell. Store nota = 3.8. Print the Boolean result of checking whether nota is at least 3.0.',mode:'code',code:''},
      {key:'logic-02',title:'Group equality',prompt:'Start from a blank cell. Store grupo = "11A". Print the Boolean result of checking whether grupo equals "11A".',mode:'code',code:''},
      {key:'logic-03',title:'Two requirements with and',prompt:'Start from a blank cell. Store nota = 3.8 and asistencia = 0.90. Print whether nota is at least 3.0 AND asistencia is at least 0.80.',mode:'code',code:''},
      {key:'logic-04',title:'Alternative rule with or',prompt:'Start from a blank cell. Store nota = 2.8 and recuperacion = True. Print whether the student has nota at least 3.0 OR recuperacion is True.',mode:'code',code:''},
      {key:'logic-05',title:'Decision with if/else',prompt:'Start from a blank cell. Store nota = 3.6. Use if/else to print "Aprueba" when nota is at least 3.0 and "No aprueba" otherwise.',mode:'code',code:''},
      {key:'logic-06',title:'Three levels with elif',prompt:'Start from a blank cell. Store nota = 4.4. Use if/elif/else to print "Alto" for nota >= 4.0, "Basico" for nota >= 3.0, and "Bajo" otherwise.',mode:'code',code:''},
      {key:'logic-07',title:'Text decision',prompt:'Start from a blank cell. Store grupo = "11B". Use if/else to print "Grupo B" when grupo equals "11B" and "Otro grupo" otherwise.',mode:'code',code:''},
      {key:'logic-08',title:'Combined decision',prompt:'Start from a blank cell. Store nota = 3.7 and asistencia = 0.85. Use one if/else decision to print "Habilitado" only when nota >= 3.0 AND asistencia >= 0.80; otherwise print "Revisar".',mode:'code',code:''},
      {key:'logic-09',title:'Decision with not',prompt:'Start from a blank cell. Store ausente = False. Use if/else and not to print "Presente" when the student is not absent; otherwise print "Ausente".',mode:'code',code:''},
      {key:'logic-10',title:'Equality operator',prompt:'Which operator checks whether two values are equal in Python?',mode:'choice',choices:['=','==','>=','!=']},
      {key:'logic-11',title:'Meaning of indentation',prompt:'Inside an if statement, what does the indented block represent?',mode:'choice',choices:['The instructions controlled by the condition','The variable name only','Every line in the notebook','A comment only']},
      {key:'logic-12',title:'Role of else',prompt:'What is the role of else in an if/elif/else decision?',mode:'choice',choices:['Handles the remaining case','Repeats the block','Imports Pandas','Calculates a mean']}
    ]
  });

  replaceTopic('conditions', {
    title:'Read and inspect a CSV with Pandas',
    nav:'CSV → DataFrame',
    lead:'Move from isolated Python values to a real table. Load estudiantes.csv into a Pandas DataFrame and inspect its rows, columns and structure before calculating anything.',
    definition:'A CSV file stores tabular data as comma-separated values. Pandas reads that file into a DataFrame: a two-dimensional labeled table in which rows represent observations and columns represent variables. Statistical analysis should begin by understanding that structure.',
    goals:[
      'Import Pandas and read a CSV file.',
      'Recognize rows as observations and columns as variables.',
      'Inspect df.shape, df.columns and df.head().',
      'Count observations and identify basic dataset structure.',
      'Explain why inspection must come before statistical calculation.'
    ],
    sections:[
      {title:'From document to dataset',body:'The file estudiantes.csv contains twelve anonymous student observations. pd.read_csv("estudiantes.csv") converts the document into a DataFrame so Python can inspect and analyze the complete table rather than one value at a time.'},
      {title:'Rows are observations',body:'Each row describes one observation. In this dataset, one row corresponds to one anonymous student record. The row keeps related values—group, age and grade—together.'},
      {title:'Columns are variables',body:'Each column represents one variable measured or recorded for every observation. The columns estudiante, grupo, edad and nota have different meanings and data types, so they should not automatically receive the same statistical treatment.'},
      {title:'Inspect before calculating',body:'A reliable analysis first checks shape, column names and sample rows. df.shape answers how large the table is, df.columns identifies available variables, and df.head() lets us inspect the first observations before computing any statistic.'}
    ],
    syntax:[
      ['Import Pandas','import pandas as pd'],
      ['Read document','df = pd.read_csv("estudiantes.csv")'],
      ['First rows','df.head()'],
      ['Dimensions','df.shape'],
      ['Column names','df.columns.tolist()'],
      ['One column','df["nota"]']
    ],
    pitfalls:[
      'Calculating statistics before confirming that the file loaded correctly.',
      'Confusing a row (observation) with a column (variable).',
      'Assuming every column is numeric.',
      'Typing a result manually instead of obtaining it from the DataFrame.',
      'Ignoring column names and therefore analyzing the wrong variable.'
    ],
    diagrams:[
      {type:'stats-pipeline',title:'CSV document → DataFrame → inspection',description:'Load the document first, inspect its structure, and only then choose a statistical method.'},
      {type:'stats-bridge',title:'Rows and columns carry meaning',description:'Rows are observations; columns are variables. Understanding that structure is the foundation for all later Pandas analysis.'}
    ],
    resources:[
      {name:'Pandas',kind:'Official documentation',url:'https://pandas.pydata.org/docs/',logo:'https://pandas.pydata.org/static/img/pandas_mark.svg'}
    ],
    workshopIntro:'Use the real classroom dataset estudiantes.csv. Every coding stage begins from a blank cell: import Pandas, load the file, inspect the requested feature, run the cell, and validate the generated result.',
    exercises:[
      {key:'cond-01',title:'Load the CSV and inspect shape',prompt:'Start from a blank cell. Import Pandas as pd, read "estudiantes.csv" into df, and print df.shape.',mode:'code',code:''},
      {key:'cond-02',title:'Inspect column names',prompt:'Start from a blank cell. Import Pandas, load "estudiantes.csv" into df, and print df.columns.tolist().',mode:'code',code:''},
      {key:'cond-03',title:'Inspect the first observations',prompt:'Start from a blank cell. Import Pandas, load the CSV, use df.head(2), select the estudiante column, convert it to a list, and print that list.',mode:'code',code:''},
      {key:'cond-04',title:'Count observations',prompt:'Start from a blank cell. Import Pandas, load the CSV, and use len(df) to print the number of observations.',mode:'code',code:''},
      {key:'cond-05',title:'Count distinct groups',prompt:'Start from a blank cell. Import Pandas, load the CSV, and print the number of unique values in the grupo column using nunique().',mode:'code',code:''},
      {key:'cond-06',title:'Frequency by group',prompt:'Start from a blank cell. Import Pandas, load the CSV, calculate value_counts() for grupo, sort the index, convert the result to a dictionary, and print it.',mode:'code',code:''},
      {key:'cond-07',title:'Minimum age',prompt:'Start from a blank cell. Import Pandas, load the CSV, and print the minimum value of the edad column.',mode:'code',code:''},
      {key:'cond-08',title:'Maximum age',prompt:'Start from a blank cell. Import Pandas, load the CSV, and print the maximum value of the edad column.',mode:'code',code:''},
      {key:'cond-09',title:'Count valid grades',prompt:'Start from a blank cell. Import Pandas, load the CSV, and use count() on the nota column to print the number of non-missing grade observations.',mode:'code',code:''},
      {key:'cond-10',title:'Meaning of a row',prompt:'In this student DataFrame, what does one row normally represent?',mode:'choice',choices:['One observation','One variable','One Python package','One chart title']},
      {key:'cond-11',title:'Meaning of a column',prompt:'In a DataFrame, what does a column such as nota normally represent?',mode:'choice',choices:['One variable','One complete notebook','One row index only','One browser tab']},
      {key:'cond-12',title:'Inspect before analysis',prompt:'What is the best first step after loading an unfamiliar CSV?',mode:'choice',choices:['Check shape, columns and first rows','Calculate a conclusion immediately','Delete rows first','Draw a graph before loading data']}
    ]
  });

  replaceTopic('loops', {
    title:'Central tendency from a real dataset',
    nav:'Mean · median · mode',
    lead:'Now that the CSV is a DataFrame, describe the nota variable with mean, median and mode, then connect those values to count, minimum, maximum and range.',
    definition:'Measures of central tendency summarize where observations are centered. The mean uses every numeric value, the median identifies the middle of ordered data, and the mode identifies the most frequent value. They should be computed from the dataset and interpreted together rather than treated as isolated commands.',
    goals:[
      'Calculate mean, median and mode from a DataFrame column.',
      'Calculate count, minimum, maximum and range from the same variable.',
      'Compare mean and median instead of reporting one number without context.',
      'Use a condition to analyze a meaningful subset of observations.',
      'Interpret what a central-tendency result says about the dataset.'
    ],
    sections:[
      {title:'One variable, several summaries',body:'df["nota"] selects the grade variable. From that one Series, Pandas can calculate mean(), median(), mode(), count(), min() and max(). Each summary answers a different statistical question about the same observations.'},
      {title:'Mean, median and mode are not interchangeable',body:'The mean balances all observed values, the median is the middle ordered value, and the mode is the most frequent value. Comparing them can reveal asymmetry or the influence of unusually low or high observations.'},
      {title:'Center needs context',body:'A number such as mean = 3.75 is not a conclusion by itself. A useful interpretation identifies the variable, the group of observations and what the value represents. Minimum, maximum and range provide additional context for how widely the observations are spread.'},
      {title:'Conditions return naturally',body:'The comparison idea from the previous topic now answers a statistical question about a subset. df[df["nota"] >= 3.0] keeps only approved observations, after which the same descriptive methods can summarize that subgroup.'}
    ],
    syntax:[
      ['Mean','df["nota"].mean()'],
      ['Median','df["nota"].median()'],
      ['Mode','df["nota"].mode().iloc[0]'],
      ['Count','df["nota"].count()'],
      ['Minimum / maximum','df["nota"].min() · df["nota"].max()'],
      ['Conditional subset','aprobados = df[df["nota"] >= 3.0]']
    ],
    pitfalls:[
      'Reporting a mean without naming the variable it summarizes.',
      'Assuming mean and median must be equal.',
      'Using mode() without recognizing that Pandas can return more than one mode.',
      'Confusing maximum-minus-minimum range with the number of observations.',
      'Filtering a subset and then interpreting it as if it were the complete dataset.'
    ],
    diagrams:[
      {type:'stats-pipeline',title:'DataFrame column → summary → interpretation',description:'Select the variable, calculate a defensible statistic, then explain what the result means in context.'},
      {type:'stats-bridge',title:'Conditions become statistical filters',description:'The same comparison logic used with if now selects subsets of observations for separate analysis.'}
    ],
    resources:[
      {name:'Pandas descriptive statistics',kind:'Official documentation',url:'https://pandas.pydata.org/docs/user_guide/basics.html#descriptive-statistics',logo:'https://pandas.pydata.org/static/img/pandas_mark.svg'}
    ],
    workshopIntro:'Use estudiantes.csv for every calculation. Generate each result from the nota column, compare the summaries, and finish by applying a condition to the approved subset.',
    exercises:[
      {key:'loop-01',title:'Mean grade',prompt:'Start from a blank cell. Import Pandas, load "estudiantes.csv", calculate the mean of nota, round it to 2 decimals, and print it.',mode:'code',code:''},
      {key:'loop-02',title:'Median grade',prompt:'Start from a blank cell. Import Pandas, load the CSV, calculate the median of nota, and print it.',mode:'code',code:''},
      {key:'loop-03',title:'Mode grade',prompt:'Start from a blank cell. Import Pandas, load the CSV, calculate the mode of nota, select the first mode with .iloc[0], and print it.',mode:'code',code:''},
      {key:'loop-04',title:'Number of grades',prompt:'Start from a blank cell. Import Pandas, load the CSV, and print df["nota"].count().',mode:'code',code:''},
      {key:'loop-05',title:'Minimum grade',prompt:'Start from a blank cell. Import Pandas, load the CSV, and print the minimum of nota.',mode:'code',code:''},
      {key:'loop-06',title:'Maximum grade',prompt:'Start from a blank cell. Import Pandas, load the CSV, and print the maximum of nota.',mode:'code',code:''},
      {key:'loop-07',title:'Grade range',prompt:'Start from a blank cell. Import Pandas, load the CSV, calculate maximum nota minus minimum nota, round the range to 2 decimals, and print it.',mode:'code',code:''},
      {key:'loop-08',title:'Compare mean and median',prompt:'Start from a blank cell. Import Pandas, load the CSV, print the mean of nota rounded to 2 decimals on the first line and the median on the second line.',mode:'code',code:''},
      {key:'loop-09',title:'Count approved observations',prompt:'Start from a blank cell. Import Pandas, load the CSV, create aprobados by filtering nota >= 3.0, and print the number of rows in that subset.',mode:'code',code:''},
      {key:'loop-10',title:'Mean among approved observations',prompt:'Start from a blank cell. Import Pandas, load the CSV, create aprobados by filtering nota >= 3.0, calculate the mean nota only for that subset, round it to 2 decimals, and print it.',mode:'code',code:''},
      {key:'loop-11',title:'Robust center',prompt:'Which measure of center is usually less affected by one extreme outlier?',mode:'choice',choices:['Median','Mean','Maximum','Count']},
      {key:'loop-12',title:'Interpret mean below median',prompt:'If the mean is lower than the median, which interpretation is plausible and worth investigating?',mode:'choice',choices:['Lower values may be pulling the mean downward','The mean can never be lower than the median','There are no observations','Pandas changed the data automatically']}
    ]
  });

  const operations = bySlug.operations;
  if (operations?.sections) {
    const bridge = operations.sections.find(section => section.title === 'Why this matters for statistics');
    if (bridge) {
      bridge.body = 'Statistics needs reproducible procedures, but programming remains a tool rather than the destination. This course moves from variables and lists to conditions, then quickly into reading real CSV data, DataFrames and statistical summaries. More advanced programming structures appear later only when they solve a genuine analytical need.';
    }
  }

  // The classroom CSV must also work in the browser Python runtime. Pyodide does
  // not automatically install every imported scientific package, so load imports
  // on demand and mount the same repository dataset into its virtual filesystem.
  const originalLoadPyodide = window.loadPyodide;
  if (typeof originalLoadPyodide === 'function' && !window.__IJR_DATA_FIRST_PYODIDE_PATCHED__) {
    window.__IJR_DATA_FIRST_PYODIDE_PATCHED__ = true;
    window.loadPyodide = async function (...args) {
      const py = await originalLoadPyodide(...args);
      if (py.__ijrDataFirstPatched) return py;

      try {
        py.globals.set('__ijr_dataset_csv', datasetCsv);
        py.runPython(`
from pathlib import Path
Path('estudiantes.csv').write_text(__ijr_dataset_csv, encoding='utf-8')
Path('data').mkdir(exist_ok=True)
Path('data/estudiantes.csv').write_text(__ijr_dataset_csv, encoding='utf-8')
`);
        py.globals.delete('__ijr_dataset_csv');
      } catch (error) {
        console.warn('Could not mount Statistics 11 classroom CSV in Pyodide.', error);
      }

      const originalRunPythonAsync = py.runPythonAsync.bind(py);
      py.runPythonAsync = async function (source, options) {
        if (typeof py.loadPackagesFromImports === 'function') {
          await py.loadPackagesFromImports(String(source ?? ''));
        }
        return originalRunPythonAsync(source, options);
      };
      py.__ijrDataFirstPatched = true;
      return py;
    };
  }
})();
