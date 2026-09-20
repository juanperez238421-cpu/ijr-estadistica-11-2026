(() => {
  'use strict';

  const TOPIC = 'logic';
  const VERSION = 'v59';
  const source = window.IJR_PYTHON_HUB_TOPICS || [];
  if (!source.length) return;

  const topics = source.map(topic => ({ ...topic }));
  const index = topics.findIndex(topic => topic.slug === TOPIC);
  if (index < 0) return;

  const original = topics[index];
  const byKey = Object.fromEntries((original.exercises || []).map(item => [item.key, item]));

  const codeExercise = (key, title, prompt) => ({
    ...(byKey[key] || {}),
    key,
    title,
    prompt,
    mode: 'code',
    code: ''
  });

  const exercises = [
    codeExercise(
      'logic-01',
      'Class 1 · Use a standard scientific library',
      'Import the standard Python library math. Create root = math.sqrt(81). Print root. The objective is to use a library function instead of implementing square-root logic yourself.'
    ),
    codeExercise(
      'logic-02',
      'Class 1 · Use a statistics library',
      'Import the standard library statistics. Create values = [72, 86, 91]. Calculate mean_value = statistics.mean(values). Print mean_value. This demonstrates that specialized libraries package reusable analytical operations.'
    ),
    codeExercise(
      'logic-03',
      'Class 1 · Recognize an Excel file with pathlib',
      'Import Path from pathlib. Create file = Path("pandas_excel_students.xlsx"). Print file.suffix. This stage connects a general file-management library with the .xlsx format before opening the workbook.'
    ),
    codeExercise(
      'logic-04',
      'Class 1 · Open a real XLSX workbook with openpyxl',
      'Use the classroom workbook pandas_excel_students.xlsx. Import load_workbook from openpyxl, load the workbook, inspect wb.sheetnames, and finally print whether "Students" is one of the worksheet names.'
    ),
    codeExercise(
      'logic-05',
      'Class 1 · Inspect worksheet structure and cells',
      'Load pandas_excel_students.xlsx with openpyxl, select ws = wb["Students"], inspect ws["A1"].value, ws.max_row and ws.max_column, then print whether the first cell is not empty AND the worksheet has more than one row AND at least five columns.'
    ),
    codeExercise(
      'logic-06',
      'Class 1 · Create and save a real XLSX workbook',
      'Import Workbook from openpyxl and Path from pathlib. Create a workbook, rename the active worksheet to "Summary", write "ready" in cell A1, save it as xlsx_library_output.xlsx, and print Path("xlsx_library_output.xlsx").exists().'
    ),
    codeExercise(
      'logic-07',
      'Class 2 · Read XLSX with Pandas',
      'Import pandas as pd. Read the Students worksheet from pandas_excel_students.xlsx into df with pd.read_excel(...). Print type(df).__name__. The final output should identify the table object Pandas created.'
    ),
    codeExercise(
      'logic-08',
      'Class 2 · Inspect DataFrame dimensions',
      'Read the classroom workbook into df. Inspect df.shape, df.columns.tolist() and df.head(). Then print whether df has at least one row AND at least five columns. Do not analyze the data before confirming its structure.'
    ),
    codeExercise(
      'logic-09',
      'Class 2 · Select one variable as a Series',
      'Read the workbook into df. Create scores = df["score"]. Inspect scores.head(). Print type(scores).__name__ to verify the object returned when one DataFrame column is selected.'
    ),
    codeExercise(
      'logic-10',
      'Class 2 · Filter observations with a Boolean condition',
      'Read the workbook into df. Create filtered = df.loc[df["score"] >= 90]. Inspect filtered. Print whether filtered contains at least one row AND every score in filtered is at least 90.'
    ),
    codeExercise(
      'logic-11',
      'Class 2 · Derive a variable and sort complete records',
      'Read the workbook into df. Create df["passed"] = df["score"] >= 70. Create ordered = df.sort_values("score", ascending=False). Print whether "passed" exists in ordered.columns AND ordered["score"].is_monotonic_decreasing is True.'
    ),
    codeExercise(
      'logic-12',
      'Class 2 · Export a transformed DataFrame to XLSX',
      'Read the workbook into df. Create filtered = df.loc[df["score"] >= 80]. Export filtered to pandas_analysis_output.xlsx with index=False. Then import Path from pathlib and print Path("pandas_analysis_output.xlsx").exists().'
    )
  ];

  topics[index] = {
    ...original,
    title: 'Python Libraries → XLSX Files → Pandas',
    nav: 'Libraries · XLSX · Pandas',
    lead: 'Two-class pathway. Class 1 introduces the Python library ecosystem and uses openpyxl to understand and manipulate real .xlsx workbooks. Class 2 focuses specifically on Pandas and the DataFrame workflow used in data analysis.',
    definition: 'A Python library packages reusable functionality for a particular problem domain. In Class 1, students first see that different libraries solve different problems, then use pathlib and openpyxl to work directly with a real Excel workbook. In Class 2, Pandas becomes the main analytical abstraction: Excel worksheet → DataFrame → inspect → select/filter/transform → export.',
    goals: [
      'Recognize that Python has a broad ecosystem of libraries for mathematics, statistics, visualization, data science, machine learning, web/API work, images, automation and files.',
      'Distinguish the Python standard library from third-party packages.',
      'Use math, statistics and pathlib in small practical examples.',
      'Explain workbook, worksheet, cell and .xlsx as file-level concepts.',
      'Use openpyxl to open, inspect, create and save a real .xlsx workbook.',
      'Explain why Pandas provides a higher-level tabular model than cell-by-cell workbook manipulation.',
      'Read an Excel worksheet into a Pandas DataFrame.',
      'Inspect DataFrame structure before analysis.',
      'Select, filter, derive and sort variables reproducibly.',
      'Export a transformed DataFrame back to a real .xlsx file.'
    ],
    sections: [
      { title:'CLASS 1 · Why libraries exist', body:'Python is a language; libraries extend it for specific domains. The standard library includes tools such as math, statistics, datetime, pathlib and json. Third-party packages add larger ecosystems such as NumPy, Pandas, Matplotlib, SciPy, scikit-learn, Requests, Pillow and openpyxl.' },
      { title:'CLASS 1 · From files to Excel workbooks', body:'A .xlsx file is a workbook stored on disk. A workbook can contain worksheets, and worksheets contain cells. pathlib helps describe file paths; openpyxl understands the Excel .xlsx format and can read or write workbook structure directly.' },
      { title:'CLASS 1 · Practical XLSX manipulation', body:'Students use the same real classroom workbook to inspect worksheet names and cells, then create a new workbook and save it. This makes file manipulation concrete before introducing a higher-level analysis library.' },
      { title:'CLASS 2 · Why Pandas', body:'Pandas treats a worksheet as a labeled table instead of forcing the analyst to manage individual cells. The central objects are DataFrame for a 2D table and Series for one labeled variable.' },
      { title:'CLASS 2 · DataFrame workflow', body:'The analytical cycle is read_excel → inspect shape/columns/head → select variables → filter observations → create derived variables → sort → verify.' },
      { title:'CLASS 2 · Reproducible output', body:'The analysis should end with an explicit output. DataFrame.to_excel(..., index=False) creates a real workbook that can be opened in Excel and traces the result back to the code that produced it.' }
    ],
    syntax: [
      ['Class 1 · math', 'import math\nroot = math.sqrt(81)'],
      ['Class 1 · statistics', 'import statistics\nstatistics.mean([72, 86, 91])'],
      ['Class 1 · file paths', 'from pathlib import Path\nPath("data.xlsx").suffix'],
      ['Class 1 · open workbook', 'from openpyxl import load_workbook\nwb = load_workbook("pandas_excel_students.xlsx")'],
      ['Class 1 · inspect sheet', 'ws = wb["Students"]\nprint(ws["A1"].value)'],
      ['Class 1 · create workbook', 'from openpyxl import Workbook\nwb = Workbook()\nwb.save("output.xlsx")'],
      ['Class 2 · import Pandas', 'import pandas as pd'],
      ['Class 2 · read Excel', 'df = pd.read_excel("pandas_excel_students.xlsx", sheet_name="Students")'],
      ['Class 2 · inspect', 'df.shape\ndf.columns.tolist()\ndf.head()\ndf.dtypes'],
      ['Class 2 · select', 'scores = df["score"]'],
      ['Class 2 · filter', 'filtered = df.loc[df["score"] >= 90]'],
      ['Class 2 · derive + sort', 'df["passed"] = df["score"] >= 70\nordered = df.sort_values("score", ascending=False)'],
      ['Class 2 · export', 'df.to_excel("pandas_analysis_output.xlsx", index=False)']
    ],
    pitfalls: [
      'Thinking that Python itself contains every specialized tool. Libraries must be imported before their functions are used.',
      'Confusing a library with a file. openpyxl is code; an .xlsx workbook is data stored on disk.',
      'Confusing workbook, worksheet and cell.',
      'Trying to use openpyxl before the .xlsx file exists in the runtime.',
      'Treating Pandas as “another Excel program” instead of a tabular data-analysis library.',
      'Filtering a DataFrame before checking its exact column names and data types.',
      'Copying spreadsheet values manually into lists instead of reading the real file.',
      'Overwriting the source workbook when a new analysis output should be created.',
      'Forgetting index=False when the Pandas index should not become an Excel column.'
    ],
    workshopIntro: 'Maximum two-class sequence. CLASS 1 = stages 1–6: library ecosystem + real XLSX manipulation with pathlib/openpyxl. CLASS 2 = stages 7–12: dedicated Pandas DataFrame workflow. Keep the Colab cycle: read the task → write code → Run ▶ → inspect output → Validate.',
    exercises
  };

  const frozen = Object.freeze(topics.map(topic => Object.freeze(topic)));
  window.IJR_PYTHON_HUB_TOPICS = frozen;
  window.IJR_PYTHON_HUB_TOPIC_MAP = Object.freeze(Object.fromEntries(frozen.map(topic => [topic.slug, topic])));
  window.IJR_LIBRARIES_XLSX_PANDAS_V59 = Object.freeze({
    version: VERSION,
    topic: TOPIC,
    classes: [
      { id:'class-1', title:'Libraries + XLSX files', stages:[1,2,3,4,5,6], recommendedMinutes:{ theory:20, workshop:30 } },
      { id:'class-2', title:'Pandas for data analysis', stages:[7,8,9,10,11,12], recommendedMinutes:{ theory:20, workshop:30 } }
    ],
    sourceWorkbook:'pandas_excel_students.xlsx'
  });
})();