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
      "Step 1: Import math. Step 2: Calculate root with math.sqrt(81). Step 3: Print root. Run the cell, check that Python displays 9.0, then select Validate. Do not type the final answer yourself."
    ),
    codeExercise(
      'logic-02',
      'Class 1 · Use a statistics library',
      "Step 1: Import statistics. Step 2: Create values = [72, 86, 91]. Step 3: Use statistics.mean(values) to calculate mean_value. Step 4: Print mean_value. Run, inspect the calculated result, then Validate."
    ),
    codeExercise(
      'logic-03',
      'Class 1 · Recognize an Excel file with pathlib',
      "Step 1: Import Path from pathlib. Step 2: Create file for pandas_excel_students.xlsx using Path(...). Step 3: Print file.suffix. Run and check that the extension is .xlsx before validating; do not print the extension as fixed text."
    ),
    codeExercise(
      'logic-04',
      'Class 1 · Open a real XLSX workbook with openpyxl',
      "Step 1: Import load_workbook from openpyxl. Step 2: Open pandas_excel_students.xlsx as wb. Step 3: Save wb.sheetnames in sheet_names. Step 4: Check whether \"Students\" is in sheet_names and store this in has_students. Step 5: Print has_students, run, and Validate after checking True."
    ),
    codeExercise(
      'logic-05',
      'Class 1 · Inspect worksheet structure and cells',
      "Step 1: Open pandas_excel_students.xlsx with openpyxl. Step 2: Select ws = wb[\"Students\"]. Step 3: Read the value of A1, the number of rows, and the number of columns. Step 4: Print one check using and: A1 is not empty, rows > 1, and columns >= 5. Run and check True before validating."
    ),
    codeExercise(
      'logic-06',
      'Class 1 · Create and save a real XLSX workbook',
      "Step 1: Import Workbook from openpyxl and Path from pathlib. Step 2: Create wb = Workbook() and select its active sheet as ws. Step 3: Name the sheet \"Summary\" and write \"ready\" in A1. Step 4: Save the workbook as xlsx_library_output.xlsx. Step 5: Print whether the file exists using Path(...).exists(). Run, check True, then Validate."
    ),
    codeExercise(
      'logic-07',
      'Class 2 · Read XLSX with Pandas',
      "Step 1: Import pandas as pd. Step 2: Read the \"Students\" sheet from pandas_excel_students.xlsx into df using pd.read_excel(...). Step 3: Print type(df).__name__. Run, confirm DataFrame, then Validate."
    ),
    codeExercise(
      'logic-08',
      'Class 2 · Inspect DataFrame dimensions',
      "Step 1: Import pandas and read the \"Students\" sheet into df. Step 2: Use df.shape to get rows and columns. Step 3: Inspect the column names with df.columns.tolist() and the first rows with df.head(). Step 4: Print whether rows >= 1 and columns >= 5. Run, confirm True, then Validate."
    ),
    codeExercise(
      'logic-09',
      'Class 2 · Select one variable as a Series',
      "Step 1: Reuse df from Class 2 Step 7 or 8 if it is already loaded in your Colab notebook. If you restarted Colab, first read the \"Students\" sheet from pandas_excel_students.xlsx into df. Step 2: Select scores = df[\"score\"] (one pair of brackets, so it is a Series). Step 3: Inspect scores.head(). Step 4: Run print(type(scores).__name__) and confirm the displayed output is Series. Enter Series in the answer field and Validate. You do not need to repeat read_excel in this code cell when df already exists."
    ),
        codeExercise(
      'logic-10',
      'Class 2 · Filter observations with a Boolean condition',
      "Step 1: Read the \"Students\" sheet into df. Step 2: Create filtered = df.loc[df[\"score\"] >= 90]. Step 3: Check that filtered has at least one row and that all its scores are >= 90. Step 4: Print the combined check with and. Run, confirm True, then Validate."
    ),
    codeExercise(
      'logic-11',
      'Class 2 · Derive a variable and sort complete records',
      "Step 1: Read the \"Students\" sheet into df. Step 2: Create df[\"passed\"] by checking whether each score is >= 70. Step 3: Sort the entire DataFrame by score, highest first, into ordered. Step 4: Print whether ordered has the passed column and its scores decrease in order. Run, check True, then Validate."
    ),
    codeExercise(
      'logic-12',
      'Class 2 · Export a transformed DataFrame to XLSX',
      "Step 1: Read the \"Students\" sheet into df. Step 2: Keep rows with score >= 80 in filtered. Step 3: Export filtered to pandas_analysis_output.xlsx using to_excel(..., index=False). Step 4: Use Path from pathlib to check that this exact file exists. Print the check, run, confirm True, then Validate."
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