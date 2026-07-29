# Teacher Guide — Introducing the Google Colab Interface

## Intended use

This package supports a first-contact lesson before students complete the full Grade 11 data-analysis notebook. Pause the interface video frequently so students can reproduce each action in their own notebook.

## Suggested 45–50 minute lesson

### 1. Entry question — 5 minutes

Ask: **How is a notebook different from a calculator?** Collect two or three answers before showing the video.

### 2. Guided interface tour — 12 minutes

Play the interface explainer through the sections on the top bar, commands, and Files panel. Pause after each section and ask students to point to the same element on their screens.

### 3. Text and code cells — 10 minutes

Students add one Text cell containing a statistical question and one Code cell containing `print("Hello, data!")`. They run the code with the play button and then with **Shift + Enter**.

### 4. Runtime and execution order — 8 minutes

Students intentionally run `print(class_mean)` before defining `class_mean`. Discuss the `NameError`, then run cells from top to bottom.

### 5. Upload and load the CSV — 10 minutes

Students upload `grade11_colab_student_success.csv`, import Pandas, load the file, and verify `(72, 13)`.

### 6. Exit ticket — 5 minutes

Students answer the four questions at the end of the walkthrough notebook.

## Observable performance evidence

A student demonstrates basic Colab competence when the student can:

- distinguish Text and Code cells;
- connect or reconnect the runtime;
- run a cell and interpret the execution number;
- locate an uploaded file in the Files panel;
- load the CSV using the exact filename;
- explain why session files may disappear;
- save, rerun, and share the notebook responsibly.

## Common misconceptions

1. **The execution number is the cell number.** It is the order in which cells were executed.
2. **Editing code updates the output automatically.** The cell must be executed again.
3. **Uploading a file saves it permanently.** Session storage is temporary.
4. **A notebook is complete because it has code.** A complete statistical notebook also includes a question, method, interpretation, and conclusion.
