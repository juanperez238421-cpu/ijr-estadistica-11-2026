-- Colab Lab 01 V8
-- Expand the student-facing sequence into a genuine 35–40 minute Python basics lab.
-- IMPORTANT: checkpoint keys, points, expected answers and grading rules stay unchanged.
-- This migration only aligns activity/checkpoint metadata with the new guided frontend.

update public.learning_activities
set title = 'Python Basics to Data · Lab 01'
where slug = 'statistics11-colab-basics-01-2026';

update public.learning_activity_checkpoints c
set title = v.title,
    prompt = v.prompt,
    code = v.code,
    hint = v.hint
from public.learning_activities a,
(values
  ('A1', 'Variables, print() and type()',
   'Store two values, inspect a Python type, add the variables and print the result.',
   E'# 1) Store two values\na = WRITE_HERE\nb = WRITE_HERE\n\n# 2) Inspect a basic Python type\nprint("type of a:", type(a))\n\n# 3) Build the sum with variables\nresult = WRITE_HERE\n\nprint(result)',
   'Use a = 12, b = 5, then result = a + b.'),
  ('A2', 'Arithmetic operators: +, -, *, / and **',
   'Build addition, subtraction, multiplication, division and power expressions from the same two variables.',
   E'a = 12\nb = 5\n\nsum_value = WRITE_HERE\ndifference = WRITE_HERE\nproduct = WRITE_HERE\nquotient = WRITE_HERE\npower = WRITE_HERE\n\nprint(product)',
   'Use a+b, a-b, a*b, a/b and a**2.'),
  ('A3', 'Strings, lists, indexing and len()',
   'Create a string, select the first and last list values, and calculate the list length.',
   E'label = WRITE_HERE\nnumbers = [12, 7, 15, 9, 11]\nfirst = WRITE_HERE\nlast = WRITE_HERE\ncount = WRITE_HERE\nprint(count)',
   'Use "scores", numbers[0], numbers[-1] and len(numbers).'),
  ('A4', 'Repeat with for and build an accumulator',
   'Use a for loop and an accumulator to calculate the total of the list.',
   E'numbers = [12, 7, 15, 9, 11]\ntotal = 0\nfor value in numbers:\n    total = WRITE_HERE\nprint(total)',
   'Inside the loop, update total with total + value.'),
  ('A5', 'Create a reusable function for the mean',
   'Define mean(values) using sum(), len(), division and return, then call the function.',
   E'def mean(values):\n    total = WRITE_HERE\n    count = WRITE_HERE\n    return WRITE_HERE\n\nnumbers = [12, 7, 15, 9, 11]\nmean_value = mean(numbers)\nprint(round(mean_value, 1))',
   'Use sum(values), len(values), then return total / count.'),
  ('A6', 'Import Pandas and read a CSV file',
   'Load data.csv into a DataFrame, inspect its first rows, columns and dtypes, then obtain the row count.',
   E'import pandas as pd\ndf = WRITE_HERE\npreview = WRITE_HERE\nprint(preview)\nprint(df.columns.tolist())\nprint(df.dtypes)\nrow_count = WRITE_HERE\nprint(row_count)',
   'Use pd.read_csv("data.csv"), df.head(3), and df.shape[0].'),
  ('A7', 'Select a column and summarize it',
   'Select the score Series, calculate its mean, and inspect describe().',
   E'import pandas as pd\ndf = pd.read_csv("data.csv")\nscores = WRITE_HERE\nscore_mean = WRITE_HERE\nsummary = WRITE_HERE\nprint(summary)\nprint(score_mean)',
   'Use df["score"], scores.mean(), and scores.describe().'),
  ('A8', 'Boolean filters and a basic if / else decision',
   'Create a score >= 4 Boolean condition, filter the DataFrame, count matching rows, and use a basic if/else decision.',
   E'import pandas as pd\ndf = pd.read_csv("data.csv")\ncondition = WRITE_HERE\npassed = WRITE_HERE\npassed_count = WRITE_HERE\nif passed_count >= 8:\n    message = WRITE_HERE\nelse:\n    message = "Review needed"\nprint(message)\nprint(passed_count)',
   'Use df["score"] >= 4, df[condition], len(passed), and "Most students passed".')
) as v(checkpoint_key,title,prompt,code,hint)
where a.id = c.activity_id
  and a.slug = 'statistics11-colab-basics-01-2026'
  and c.checkpoint_key = v.checkpoint_key;

notify pgrst, 'reload schema';
