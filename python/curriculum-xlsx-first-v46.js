(() => {
  'use strict';

  const sourceTopics = window.IJR_PYTHON_HUB_TOPICS || [];
  if (!sourceTopics.length) return;

  const topics = sourceTopics.map(topic => ({ ...topic }));
  const indexOf = slug => topics.findIndex(topic => topic.slug === slug);

  const replaceTopic = (slug, patch) => {
    const index = indexOf(slug);
    if (index < 0) return;
    topics[index] = { ...topics[index], ...patch };
  };

  replaceTopic('logic', {
    title: 'Excel (.xlsx) files with Pandas',
    nav: 'XLSX → DataFrame',
    lead: 'Immediately after Python lists, move from values stored inside code to a real spreadsheet file. Load an .xlsx workbook with Pandas, inspect its structure, select variables, sort rows, create a derived variable and filter observations.',
    definition: 'An .xlsx workbook is an external data file. Pandas reads a worksheet with pd.read_excel(...) and represents the table as a DataFrame: rows are observations and columns are variables. The correct analytical workflow is file → DataFrame → inspect → operate → verify, not manual transcription of spreadsheet values into Python lists.',
    goals: [
      'Distinguish a workbook, a worksheet and a Pandas DataFrame.',
      'Load a real .xlsx workbook with pd.read_excel(...).',
      'Inspect rows, columns, df.shape, df.columns and df.head().',
      'Select a column and sort observations without editing the source workbook manually.',
      'Create a simple derived column and filter rows with a Boolean condition.',
      'Use small control structures only as tools inside data work, rather than as a separate algorithms unit.',
      'Prepare the transition from Excel files to the curriculum-required CSV and Pandas workflow.'
    ],
    sections: [
      { title: 'From a Python list to an external file', body: 'A list keeps observations inside the notebook. A workbook keeps data in an external file that can be replaced, shared and re-read. Reading the file makes the analysis reproducible: the code describes what to do with the data instead of copying spreadsheet values by hand.' },
      { title: 'Workbook, worksheet and DataFrame', body: 'A workbook is the .xlsx file. A worksheet is one tab inside that workbook. pd.read_excel(...) reads a worksheet and returns a DataFrame. In a DataFrame, each row is an observation and each column is a variable.' },
      { title: 'Inspect before manipulating', body: 'After loading a file, verify what actually arrived. df.shape gives row and column counts, df.columns lists variable names, and df.head() previews the first records. These checks protect the analysis from wrong files, wrong sheets and wrong column assumptions.' },
      { title: 'Select, sort and derive', body: 'A column can be selected with df["score"]. Rows can be ordered with sort_values(...). A new column can be created from an expression, for example df["score_90"] = df["score"] >= 90. These operations change the working DataFrame, not the original workbook on disk.' },
      { title: 'Filter observations with a data condition', body: 'Boolean filtering applies one rule to every row. df[df["score"] >= 90] keeps only observations meeting the threshold. This is where comparison logic becomes useful statistically: it operates on a complete variable instead of becoming a standalone programming lesson.' },
      { title: 'Why CSV still comes next', body: 'The institutional Grade 11 curriculum explicitly requires CSV handling, Pandas methods, visualization with Matplotlib and basic data analysis. XLSX is used here as an accessible first real-file bridge; the next topic returns to CSV so the official curriculum requirement remains explicit and assessable.' }
    ],
    syntax: [
      ['Import Pandas', 'import pandas as pd'],
      ['Read Excel workbook', 'df = pd.read_excel("stat11_stage4_students.xlsx")'],
      ['Inspect dimensions', 'df.shape'],
      ['Inspect columns', 'df.columns.tolist()'],
      ['Preview records', 'df.head()'],
      ['Select a variable', 'df["score"]'],
      ['Sort rows', 'df.sort_values("score")'],
      ['Create a derived variable', 'df["score_90"] = df["score"] >= 90'],
      ['Filter observations', 'df[df["score"] >= 90]']
    ],
    pitfalls: [
      'Trying to read an .xlsx workbook with pd.read_csv(...).',
      'Typing spreadsheet values manually into a Python list instead of reading the file.',
      'Calculating before checking df.shape, column names and the first rows.',
      'Confusing a workbook file with the DataFrame created in memory.',
      'Editing the original spreadsheet when the task should be reproducible in code.',
      'Filtering the wrong column because the dataset structure was not inspected first.'
    ],
    diagrams: [
      { type: 'stats-pipeline', title: 'XLSX → DataFrame → inspect → operate', description: 'A reproducible data workflow begins by reading the workbook, verifying its structure, then selecting, sorting, deriving or filtering data.' },
      { type: 'stats-bridge', title: 'Rows are observations · columns are variables', description: 'The table structure gives statistical meaning to spreadsheet data and prepares the same dataset model later used with CSV files.' },
      { type: 'comparison-bool', title: 'Column comparison → Boolean mask', description: 'A condition such as score >= 90 is evaluated for every row and becomes a mask that can select observations.' }
    ],
    resources: [
      { name: 'Pandas read_excel', kind: 'Official documentation', url: 'https://pandas.pydata.org/docs/reference/api/pandas.read_excel.html', logo: 'https://pandas.pydata.org/static/img/pandas_mark.svg' },
      { name: 'Pandas DataFrame', kind: 'Official documentation', url: 'https://pandas.pydata.org/docs/reference/frame.html', logo: 'https://pandas.pydata.org/static/img/pandas_mark.svg' }
    ],
    workshopIntro: 'Use the real class workbook stat11_stage4_students.xlsx in the Colab-style Files panel. Every coding stage starts from a blank cell. Read the workbook with Pandas, perform the requested operation and generate the result from the DataFrame; do not type a pre-calculated answer.',
    exercises: [
      { key: 'logic-01', title: 'Load the XLSX and confirm observations', prompt: 'Use the class workbook from the Files panel. Start from a blank cell, import Pandas as pd, read "stat11_stage4_students.xlsx" into df with pd.read_excel(...), and print whether the DataFrame contains at least one row.', mode: 'code', code: '' },
      { key: 'logic-02', title: 'Confirm the score variable', prompt: 'Load the class workbook with pd.read_excel(...). Print the Boolean result of checking that the column name "score" exists in df.columns. Express the final check explicitly with == True.', mode: 'code', code: '' },
      { key: 'logic-03', title: 'Verify required dataset structure', prompt: 'Load the workbook. Create one Boolean for whether df has at least one row and another for whether "score" is a column. Combine both with and, then print the combined result.', mode: 'code', code: '' },
      { key: 'logic-04', title: 'Test a score threshold', prompt: 'Load the workbook. Use the score column to check whether at least one observation has score >= 90. Combine the resulting Boolean with or False and print the result.', mode: 'code', code: '' },
      { key: 'logic-05', title: 'Sort the workbook by score', prompt: 'Load the workbook and create sorted_df = df.sort_values("score"). Use if/else with a check that the sorted DataFrame has at least one row. When it does, print sorted_df["score"].is_monotonic_increasing; otherwise print False.', mode: 'code', code: '' },
      { key: 'logic-06', title: 'Create a derived score flag', prompt: 'Load the workbook and create df["score_90"] = df["score"] >= 90. Use if/elif/else to print "created" when "score_90" exists in df.columns, "review" for an alternative case, and "missing" otherwise.', mode: 'code', code: '' },
      { key: 'logic-07', title: 'Select one variable', prompt: 'Load the workbook and create selected = df[["score"]]. Use if/else and == to verify that selected.columns[0] equals "score". Print "selected" when it does and "review" otherwise.', mode: 'code', code: '' },
      { key: 'logic-08', title: 'Filter observations with score at least 90', prompt: 'Load the workbook. If df has at least one row and contains the score column, create filtered = df[df["score"] >= 90] and print len(filtered); otherwise print 0. The result must come from the real workbook.', mode: 'code', code: '' },
      { key: 'logic-09', title: 'Confirm the score column is available', prompt: 'Load the workbook. Store missing_score = "score" not in df.columns. Use if/else and not to print "score ready" when the score column is available, otherwise print "review".', mode: 'code', code: '' },
      { key: 'logic-10', title: 'What read_excel creates', prompt: 'In this course workflow, what object does pd.read_excel(...) return for the spreadsheet table?', mode: 'choice', choices: ['A DataFrame', 'A Matplotlib figure', 'A Python loop', 'A browser tab'] },
      { key: 'logic-11', title: 'Inspect DataFrame dimensions', prompt: 'Which expression is the direct inspection for the number of rows and columns in a DataFrame?', mode: 'choice', choices: ['df.shape', 'df.plot()', 'df.save()', 'df.loop()'] },
      { key: 'logic-12', title: 'Inspect before analysis', prompt: 'Why should an analyst inspect an unfamiliar workbook immediately after loading it?', mode: 'choice', choices: ['Verify the file, rows, columns and first records', 'Replace every value manually', 'Draw a graph before reading the data', 'Avoid using Pandas'] }
    ]
  });

  replaceTopic('conditions', {
    title: 'CSV files and Pandas DataFrames',
    nav: 'CSV → DataFrame',
    lead: 'Continue the real-file workflow with the format named explicitly in the Grade 11 curriculum. Read estudiantes.csv with Pandas, inspect its structure, select variables and perform first reproducible dataset operations.',
    definition: 'A CSV file stores tabular data as plain text. Pandas reads it with pd.read_csv(...) into the same DataFrame model used for Excel: rows are observations and columns are variables. Working with both XLSX and CSV makes the file format change while the statistical data model remains consistent.'
  });

  const finalized = Object.freeze(topics.map(topic => Object.freeze(topic)));
  window.IJR_PYTHON_HUB_TOPICS = finalized;
  window.IJR_PYTHON_HUB_TOPIC_MAP = Object.freeze(Object.fromEntries(finalized.map(topic => [topic.slug, topic])));
  window.IJR_PYTHON_HUB_CURRICULUM_V46 = Object.freeze({
    version: 'v46',
    sequence: finalized.map(topic => topic.slug),
    firstFileTopicAfterArrays: 'logic',
    xlsxFile: 'stat11_stage4_students.xlsx',
    curriculumBridge: ['xlsx', 'csv', 'pandas', 'matplotlib', 'basic-data-analysis']
  });
})();