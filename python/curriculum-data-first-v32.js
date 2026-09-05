(() => {
  'use strict';

  const sourceTopics = window.IJR_PYTHON_HUB_TOPICS || [];
  const topics = sourceTopics.map(topic => ({ ...topic }));
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
    const index = topics.findIndex(topic => topic.slug === slug);
    if (index < 0) return;
    topics[index] = { ...topics[index], ...patch };
    bySlug[slug] = topics[index];
  };

  replaceTopic('logic', {
    title: 'Conditions: comparisons, logic and if/else',
    nav: 'Conditions & if',
    lead: 'A statistical rule begins as a comparison and becomes useful when Python can act on the result. Comparisons, Boolean logic and if/elif/else belong to one decision-making topic.',
    definition: 'Comparisons such as nota >= 3.0 produce True or False. The operators and, or and not combine Boolean rules. An if/elif/else structure then uses those results to choose an action. In data analysis, the same comparison logic later becomes a DataFrame filter.',
    goals: [
      'Distinguish assignment (=) from comparison (==).',
      'Use >, >=, <, <=, == and != to express rules about data.',
      'Combine conditions with and, or and not.',
      'Use if, elif and else to classify an observation.',
      'Connect a Python decision rule to later DataFrame filtering.'
    ],
    sections: [
      { title: 'A comparison asks a data question', body: 'An expression such as nota >= 3.0 asks whether an observation satisfies a rule. Python answers with True or False.' },
      { title: 'Logical operators combine rules', body: 'and requires all linked conditions to be true, or requires at least one, and not reverses a Boolean result. Several data requirements can therefore become one rule.' },
      { title: 'if turns a Boolean into a decision', body: 'if checks a Boolean expression and executes its indented block when the expression is True. elif checks another possibility and else handles the remaining case. Indentation defines the branch.' },
      { title: 'The statistical bridge', body: 'The same comparison that classifies one observation can later select many observations in Pandas. Conditions are therefore taught as a statistical tool rather than as a separate algorithms unit.' }
    ],
    syntax: [
      ['Compare', 'nota >= 3.0'],
      ['Equality', 'grupo == "11A"'],
      ['Two rules', 'nota >= 3.0 and asistencia >= 0.80'],
      ['Either rule', 'nota >= 3.0 or recuperacion'],
      ['Invert', 'not ausente'],
      ['Decision', 'if nota >= 3.0:\n    print("Aprueba")\nelse:\n    print("No aprueba")']
    ],
    pitfalls: [
      'Using = when the intention is to compare with ==.',
      'Forgetting that and requires both sides to be True.',
      'Writing if/else without consistent indentation.',
      'Checking a broader threshold before a more specific threshold in an elif chain.',
      'Reporting a Boolean without explaining what the rule means for the observation.'
    ],
    diagrams: [
      { type: 'comparison-bool', title: 'Observation → comparison → Boolean', description: 'A comparison converts a statement about one observation into True or False.' },
      { type: 'logic-gates', title: 'Combine statistical rules', description: 'AND, OR and NOT join Boolean statements so one decision can depend on several pieces of data.' },
      { type: 'logic-rule', title: 'Boolean rule → if/else decision', description: 'The same rule that classifies one observation will later become a Pandas filter for many observations.' }
    ],
    workshopIntro: 'Comparisons, Boolean operators and if/elif/else are practiced together in one 12-stage workshop. Express meaningful rules about data instead of treating control flow as a separate course.',
    exercises: [
      { key: 'logic-01', title: 'Approval comparison', prompt: 'Start from a blank cell. Store nota = 3.8. Print the Boolean result of checking whether nota is at least 3.0.', mode: 'code', code: '' },
      { key: 'logic-02', title: 'Group equality', prompt: 'Start from a blank cell. Store grupo = "11A". Print the Boolean result of checking whether grupo equals "11A".', mode: 'code', code: '' },
      { key: 'logic-03', title: 'Two requirements with and', prompt: 'Start from a blank cell. Store nota = 3.8 and asistencia = 0.90. Print whether nota is at least 3.0 AND asistencia is at least 0.80.', mode: 'code', code: '' },
      { key: 'logic-04', title: 'Alternative rule with or', prompt: 'Start from a blank cell. Store nota = 2.8 and recuperacion = True. Print whether nota is at least 3.0 OR recuperacion is True.', mode: 'code', code: '' },
      { key: 'logic-05', title: 'Decision with if/else', prompt: 'Start from a blank cell. Store nota = 3.6. Use if/else to print "Aprueba" when nota is at least 3.0 and "No aprueba" otherwise.', mode: 'code', code: '' },
      { key: 'logic-06', title: 'Three levels with elif', prompt: 'Start from a blank cell. Store nota = 4.4. Use if/elif/else to print "Alto" for nota >= 4.0, "Basico" for nota >= 3.0, and "Bajo" otherwise.', mode: 'code', code: '' },
      { key: 'logic-07', title: 'Text decision', prompt: 'Start from a blank cell. Store grupo = "11B". Use if/else to print "Grupo B" when grupo equals "11B" and "Otro grupo" otherwise.', mode: 'code', code: '' },
      { key: 'logic-08', title: 'Combined decision', prompt: 'Start from a blank cell. Store nota = 3.7 and asistencia = 0.85. Use one if/else decision to print "Habilitado" only when nota >= 3.0 AND asistencia >= 0.80; otherwise print "Revisar".', mode: 'code', code: '' },
      { key: 'logic-09', title: 'Decision with not', prompt: 'Start from a blank cell. Store ausente = False. Use if/else and not to print "Presente" when the student is not absent; otherwise print "Ausente".', mode: 'code', code: '' },
      { key: 'logic-10', title: 'Equality operator', prompt: 'Which operator checks whether two values are equal in Python?', mode: 'choice', choices: ['=', '==', '>=', '!='] },
      { key: 'logic-11', title: 'Meaning of indentation', prompt: 'Inside an if statement, what does the indented block represent?', mode: 'choice', choices: ['The instructions controlled by the condition', 'The variable name only', 'Every line in the notebook', 'A comment only'] },
      { key: 'logic-12', title: 'Role of else', prompt: 'What is the role of else in an if/elif/else decision?', mode: 'choice', choices: ['Handles the remaining case', 'Repeats the block', 'Imports Pandas', 'Calculates a mean'] }
    ]
  });

  replaceTopic('conditions', {
    title: 'Read and operate datasets with Pandas',
    nav: 'Read & operate data',
    lead: 'Move from isolated Python values to a real table. Load estudiantes.csv into a Pandas DataFrame, inspect its structure, select variables and perform first dataset operations before formal statistical analysis.',
    definition: 'A CSV file stores tabular data as comma-separated values. Pandas reads that file into a DataFrame, where rows are observations and columns are variables. Reading a dataset is only the beginning: an analyst must inspect, select, count and summarize its contents reproducibly.',
    goals: [
      'Import Pandas and read a CSV file.',
      'Recognize rows as observations and columns as variables.',
      'Inspect df.shape, df.columns and df.head().',
      'Operate on columns with count, nunique, value_counts, min and max.',
      'Explain why inspection comes before statistical interpretation.'
    ],
    sections: [
      { title: 'From document to dataset', body: 'pd.read_csv("estudiantes.csv") converts the classroom CSV into a DataFrame so Python can work with the complete table rather than isolated values.' },
      { title: 'Rows are observations', body: 'Each row is one anonymous student observation. The values for group, age and grade remain together as one record.' },
      { title: 'Columns are variables', body: 'Each column is a variable. estudiante, grupo, edad and nota have different meanings and types, so the operation chosen must match the variable.' },
      { title: 'Inspect before calculating', body: 'df.shape, df.columns and df.head() verify that the expected data actually loaded. This prevents calculating a correct formula on the wrong structure.' },
      { title: 'Operate on the dataset', body: 'After inspection, select columns and ask concrete questions: how many rows exist, how many groups appear, how frequent each group is, and what the minimum or maximum observed age is.' }
    ],
    syntax: [
      ['Import Pandas', 'import pandas as pd'],
      ['Read document', 'df = pd.read_csv("estudiantes.csv")'],
      ['First rows', 'df.head()'],
      ['Dimensions', 'df.shape'],
      ['Column names', 'df.columns.tolist()'],
      ['Select a variable', 'df["nota"]'],
      ['Count categories', 'df["grupo"].value_counts()']
    ],
    pitfalls: [
      'Calculating statistics before confirming that the file loaded correctly.',
      'Confusing a row (observation) with a column (variable).',
      'Assuming every column is numeric.',
      'Typing a result manually instead of obtaining it from the DataFrame.',
      'Ignoring column names and therefore operating on the wrong variable.'
    ],
    diagrams: [
      { type: 'stats-pipeline', title: 'CSV → DataFrame → inspect → operate', description: 'Load the file, verify its structure, select variables, and only then calculate or transform.' },
      { type: 'stats-bridge', title: 'Rows and columns carry meaning', description: 'Rows are observations and columns are variables; dataset operations must preserve that meaning.' }
    ],
    resources: [
      { name: 'Pandas', kind: 'Official documentation', url: 'https://pandas.pydata.org/docs/', logo: 'https://pandas.pydata.org/static/img/pandas_mark.svg' }
    ],
    workshopIntro: 'Use the real classroom dataset estudiantes.csv. Every coding stage begins from a blank cell: import Pandas, load the file, inspect or operate on the requested feature, run the cell, and validate the generated result.',
    exercises: [
      { key: 'cond-01', title: 'Load the CSV and inspect shape', prompt: 'Start from a blank cell. Import Pandas as pd, read "estudiantes.csv" into df, and print df.shape.', mode: 'code', code: '' },
      { key: 'cond-02', title: 'Inspect column names', prompt: 'Start from a blank cell. Import Pandas, load "estudiantes.csv" into df, and print df.columns.tolist().', mode: 'code', code: '' },
      { key: 'cond-03', title: 'Inspect the first observations', prompt: 'Start from a blank cell. Import Pandas, load the CSV, use df.head(2), select the estudiante column, convert it to a list, and print that list.', mode: 'code', code: '' },
      { key: 'cond-04', title: 'Count observations', prompt: 'Start from a blank cell. Import Pandas, load the CSV, and use len(df) to print the number of observations.', mode: 'code', code: '' },
      { key: 'cond-05', title: 'Count distinct groups', prompt: 'Start from a blank cell. Import Pandas, load the CSV, and print the number of unique values in the grupo column using nunique().', mode: 'code', code: '' },
      { key: 'cond-06', title: 'Frequency by group', prompt: 'Start from a blank cell. Import Pandas, load the CSV, calculate value_counts() for grupo, sort the index, convert the result to a dictionary, and print it.', mode: 'code', code: '' },
      { key: 'cond-07', title: 'Minimum age', prompt: 'Start from a blank cell. Import Pandas, load the CSV, and print the minimum value of the edad column.', mode: 'code', code: '' },
      { key: 'cond-08', title: 'Maximum age', prompt: 'Start from a blank cell. Import Pandas, load the CSV, and print the maximum value of the edad column.', mode: 'code', code: '' },
      { key: 'cond-09', title: 'Count valid grades', prompt: 'Start from a blank cell. Import Pandas, load the CSV, and use count() on the nota column to print the number of non-missing grade observations.', mode: 'code', code: '' },
      { key: 'cond-10', title: 'Meaning of a row', prompt: 'In this student DataFrame, what does one row normally represent?', mode: 'choice', choices: ['One observation', 'One variable', 'One Python package', 'One chart title'] },
      { key: 'cond-11', title: 'Meaning of a column', prompt: 'In a DataFrame, what does a column such as nota normally represent?', mode: 'choice', choices: ['One variable', 'One complete notebook', 'One row index only', 'One browser tab'] },
      { key: 'cond-12', title: 'Inspect before analysis', prompt: 'What is the best first step after loading an unfamiliar CSV?', mode: 'choice', choices: ['Check shape, columns and first rows', 'Calculate a conclusion immediately', 'Delete rows first', 'Draw a graph before loading data'] }
    ]
  });

  replaceTopic('loops', {
    title: 'Central tendency from a real dataset',
    nav: 'Mean · median · mode',
    lead: 'After reading the CSV, describe the nota variable with mean, median and mode, then connect those values to count, minimum, maximum, range and a meaningful filtered subset.',
    definition: 'Measures of central tendency summarize where observations are centered. The mean uses every numeric value, the median identifies the middle of ordered data, and the mode identifies the most frequent value. Pandas calculates them directly from a DataFrame column.',
    goals: [
      'Calculate mean, median and mode from a DataFrame column.',
      'Calculate count, minimum, maximum and range from the same variable.',
      'Compare mean and median instead of reporting one number without context.',
      'Use a condition to analyze a meaningful subset of observations.',
      'Interpret what a central-tendency result says about the dataset.'
    ],
    sections: [
      { title: 'One variable, several summaries', body: 'df["nota"] selects the grade variable. From that Series, Pandas can calculate mean(), median(), mode(), count(), min() and max().' },
      { title: 'Mean, median and mode are not interchangeable', body: 'The mean balances all observed values, the median is the middle ordered value, and the mode is the most frequent value. Comparing them helps reveal distribution shape and the influence of low or high observations.' },
      { title: 'Center needs context', body: 'A mean is not a conclusion by itself. A useful interpretation identifies the variable, the observations being summarized, and supporting information such as minimum, maximum and range.' },
      { title: 'Conditions return as filters', body: 'df[df["nota"] >= 3.0] keeps approved observations. The comparison logic from the merged Conditions topic now operates on many rows at once.' }
    ],
    syntax: [
      ['Mean', 'df["nota"].mean()'],
      ['Median', 'df["nota"].median()'],
      ['Mode', 'df["nota"].mode().iloc[0]'],
      ['Count', 'df["nota"].count()'],
      ['Minimum / maximum', 'df["nota"].min() · df["nota"].max()'],
      ['Conditional subset', 'aprobados = df[df["nota"] >= 3.0]']
    ],
    pitfalls: [
      'Reporting a mean without naming the variable it summarizes.',
      'Assuming mean and median must be equal.',
      'Using mode() without recognizing that Pandas can return more than one mode.',
      'Confusing maximum-minus-minimum range with the number of observations.',
      'Filtering a subset and then interpreting it as if it were the complete dataset.'
    ],
    diagrams: [
      { type: 'stats-pipeline', title: 'DataFrame column → summary → interpretation', description: 'Select the variable, calculate a defensible statistic, then explain what the result means in context.' },
      { type: 'stats-bridge', title: 'Conditions become statistical filters', description: 'The same comparison logic used with if now selects subsets of observations for separate analysis.' }
    ],
    resources: [
      { name: 'Pandas descriptive statistics', kind: 'Official documentation', url: 'https://pandas.pydata.org/docs/user_guide/basics.html#descriptive-statistics', logo: 'https://pandas.pydata.org/static/img/pandas_mark.svg' }
    ],
    workshopIntro: 'Use estudiantes.csv for every calculation. Generate each result from the nota column, compare the summaries, and finish by applying a condition to the approved subset.',
    exercises: [
      { key: 'loop-01', title: 'Mean grade', prompt: 'Start from a blank cell. Import Pandas, load "estudiantes.csv", calculate the mean of nota, round it to 2 decimals, and print it.', mode: 'code', code: '' },
      { key: 'loop-02', title: 'Median grade', prompt: 'Start from a blank cell. Import Pandas, load the CSV, calculate the median of nota, and print it.', mode: 'code', code: '' },
      { key: 'loop-03', title: 'Mode grade', prompt: 'Start from a blank cell. Import Pandas, load the CSV, calculate the mode of nota, select the first mode with .iloc[0], and print it.', mode: 'code', code: '' },
      { key: 'loop-04', title: 'Number of grades', prompt: 'Start from a blank cell. Import Pandas, load the CSV, and print df["nota"].count().', mode: 'code', code: '' },
      { key: 'loop-05', title: 'Minimum grade', prompt: 'Start from a blank cell. Import Pandas, load the CSV, and print the minimum of nota.', mode: 'code', code: '' },
      { key: 'loop-06', title: 'Maximum grade', prompt: 'Start from a blank cell. Import Pandas, load the CSV, and print the maximum of nota.', mode: 'code', code: '' },
      { key: 'loop-07', title: 'Grade range', prompt: 'Start from a blank cell. Import Pandas, load the CSV, calculate maximum nota minus minimum nota, round the range to 2 decimals, and print it.', mode: 'code', code: '' },
      { key: 'loop-08', title: 'Compare mean and median', prompt: 'Start from a blank cell. Import Pandas, load the CSV, print the mean of nota rounded to 2 decimals on the first line and the median on the second line.', mode: 'code', code: '' },
      { key: 'loop-09', title: 'Count approved observations', prompt: 'Start from a blank cell. Import Pandas, load the CSV, create aprobados by filtering nota >= 3.0, and print the number of rows in that subset.', mode: 'code', code: '' },
      { key: 'loop-10', title: 'Mean among approved observations', prompt: 'Start from a blank cell. Import Pandas, load the CSV, create aprobados by filtering nota >= 3.0, calculate the mean nota only for that subset, round it to 2 decimals, and print it.', mode: 'code', code: '' },
      { key: 'loop-11', title: 'Robust center', prompt: 'Which measure of center is usually less affected by one extreme outlier?', mode: 'choice', choices: ['Median', 'Mean', 'Maximum', 'Count'] },
      { key: 'loop-12', title: 'Interpret mean below median', prompt: 'If the mean is lower than the median, which interpretation is plausible and worth investigating?', mode: 'choice', choices: ['Lower values may be pulling the mean downward', 'The mean can never be lower than the median', 'There are no observations', 'Pandas changed the data automatically'] }
    ]
  });

  const operationsIndex = topics.findIndex(topic => topic.slug === 'operations');
  if (operationsIndex >= 0) {
    const operations = topics[operationsIndex];
    topics[operationsIndex] = {
      ...operations,
      sections: (operations.sections || []).map(section =>
        section.title === 'Why this matters for statistics'
          ? {
              ...section,
              body: 'Statistics needs reproducible procedures, but programming remains a tool rather than the destination. This course moves from variables and lists to one combined Conditions topic, then quickly into reading and operating real CSV datasets, DataFrames and statistical summaries. More advanced programming structures appear later only when they solve a genuine analytical need.'
            }
          : section
      )
    };
  }

  const finalized = Object.freeze(topics.map(topic => Object.freeze(topic)));
  window.IJR_PYTHON_HUB_TOPICS = finalized;
  window.IJR_PYTHON_HUB_TOPIC_MAP = Object.freeze(Object.fromEntries(finalized.map(topic => [topic.slug, topic])));
  window.IJR_PYTHON_HUB_WORKSHOP_POLICY_V32 = Object.freeze({
    minimumProblemsPerTopic: 12,
    blankCodeCells: true,
    totalTopics: finalized.length,
    totalProblems: finalized.reduce((sum, topic) => sum + (topic.exercises?.length || 0), 0)
  });

  const originalLoadPyodide = window.loadPyodide;
  if (typeof originalLoadPyodide === 'function' && !window.__IJR_DATA_FIRST_V32_PYODIDE_PATCHED__) {
    window.__IJR_DATA_FIRST_V32_PYODIDE_PATCHED__ = true;
    window.loadPyodide = async function (...args) {
      const py = await originalLoadPyodide(...args);
      if (py.__ijrDataFirstV32Patched) return py;

      try {
        py.globals.set('__ijr_dataset_csv', datasetCsv);
        py.runPython(`
from pathlib import Path
Path("estudiantes.csv").write_text(__ijr_dataset_csv, encoding="utf-8")
Path("data").mkdir(exist_ok=True)
Path("data/estudiantes.csv").write_text(__ijr_dataset_csv, encoding="utf-8")
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
      py.__ijrDataFirstV32Patched = true;
      return py;
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    const rules = [...document.querySelectorAll('.sequence-rule')];
    const progression = rules.find(el => el.textContent.includes('Progression rule'));
    if (!progression) return;
    const span = progression.querySelector('span');
    const small = progression.querySelector('small');
    if (span) span.textContent = '01–03 Python foundations → 04 Conditions (comparisons + logic + if/else) → 05 Read & operate datasets → 06 Central tendency → continue into the Data Analyst path';
    if (small) small.textContent = 'Comparisons and if/elif/else are one workshop. Dataset work starts immediately after that combined topic; loops are not an isolated prerequisite.';
  });
})();
