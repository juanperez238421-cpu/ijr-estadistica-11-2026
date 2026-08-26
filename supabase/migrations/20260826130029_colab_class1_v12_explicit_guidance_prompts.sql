-- Statistics 11 · Colab Class 01 V12
-- Clarifies student instructions without changing answers, points, pack allocation,
-- validation functions, or checkpoint order.

with activity as (
  select id from public.learning_activities
  where slug='statistics11-colab-class1-basics-types-arrays-2026'
)
update public.learning_activity_variant_bank v
set prompt = case v.checkpoint_key
  when 'A1' then 'STEP-BY-STEP: 1) Keep the given values of a and b unchanged. 2) Replace only WRITE_HERE with an expression that adds the two variable names. 3) Run the cell. 4) Read the printed result in the Python console. 5) Press Validate output. Current task: ' || regexp_replace(v.prompt, '^STEP-BY-STEP:.*Current task: ', '')
  when 'A2' then 'STEP-BY-STEP: 1) Read the complete expression. 2) Apply multiplication before addition unless parentheses change the order. 3) Select one option. 4) Press Validate answer. Current task: ' || regexp_replace(v.prompt, '^STEP-BY-STEP:.*Current task: ', '')
  when 'A3' then 'STEP-BY-STEP: 1) Keep all five assigned values unchanged. 2) Replace only WRITE_HERE. 3) Put the variable named decimal inside type(...).__name__. 4) Run the cell. 5) Read the printed type name and validate it. Current task: ' || regexp_replace(v.prompt, '^STEP-BY-STEP:.*Current task: ', '')
  when 'A4' then 'STEP-BY-STEP: 1) Look at the quotation marks. 2) Decide whether the displayed value is a number or text. 3) Select the Python type. 4) Press Validate answer. Current task: ' || regexp_replace(v.prompt, '^STEP-BY-STEP:.*Current task: ', '')
  when 'A5' then 'STEP-BY-STEP: 1) Notice that both values are inside quotation marks. 2) Remember that + joins strings instead of adding them numerically. 3) Select the exact resulting text. 4) Press Validate answer. Current task: ' || regexp_replace(v.prompt, '^STEP-BY-STEP:.*Current task: ', '')
  when 'A6' then 'STEP-BY-STEP: 1) Keep the list unchanged. 2) Remember that Python starts indexing at 0. 3) Replace only WRITE_HERE with list_name[index]. 4) Run the cell. 5) Read the printed value and validate it. Current task: ' || regexp_replace(v.prompt, '^STEP-BY-STEP:.*Current task: ', '')
  when 'A7' then 'STEP-BY-STEP: 1) Label the positions mentally as 0, 1, 2, 3. 2) Find the value at the requested index. 3) Select that value. 4) Press Validate answer. Current task: ' || regexp_replace(v.prompt, '^STEP-BY-STEP:.*Current task: ', '')
  when 'A8' then 'STEP-BY-STEP: 1) Keep the list unchanged. 2) Remember: first item = index 0, second item = index 1. 3) Replace only WRITE_HERE with list_name[index]. 4) Run the cell. 5) Read the printed value and validate it. Current task: ' || regexp_replace(v.prompt, '^STEP-BY-STEP:.*Current task: ', '')
  else v.prompt
end,
hint = case v.checkpoint_key
  when 'A1' then 'Syntax template: result = a + b. Do not replace a and b with the final number; use the variable names, then print(result).'
  when 'A2' then 'Order of operations: multiplication (*) is evaluated before addition (+) unless parentheses change the order.'
  when 'A3' then 'Syntax template: print(type(decimal).__name__). The decimal variable contains a number with a decimal point, so Python stores it as float.'
  when 'A4' then 'Quotation marks create text. Example: 10 is int, but "10" is str.'
  when 'A5' then 'Strings concatenate with +. Example: "10" + "5" becomes "105", not 15.'
  when 'A6' then 'Indexing template: first = scores[0]. Square brackets choose a position; index 0 means the first item.'
  when 'A7' then 'Index map: values[0] = first item, values[1] = second, values[2] = third, values[3] = fourth.'
  when 'A8' then 'Indexing template: second = values[1]. Because counting starts at 0, index 1 is the second item.'
  else v.hint
end,
metadata = coalesce(v.metadata,'{}'::jsonb) || jsonb_build_object('guidance_version','v12','explicit_steps',true),
updated_at = clock_timestamp()
from activity a
where v.activity_id=a.id;

with activity as (
  select id from public.learning_activities
  where slug='statistics11-colab-class1-basics-types-arrays-2026'
)
update public.learning_activity_checkpoints c
set prompt = case c.checkpoint_key
  when 'A1' then 'Keep the provided values of a and b. Replace only WRITE_HERE with an expression that adds the two variable names, run the cell, read the printed result, then validate the output.'
  when 'A2' then 'Read the expression, apply Python order of operations, select one answer, then validate it.'
  when 'A3' then 'Keep the assigned values unchanged. Put decimal inside type(...).__name__, run the cell, read the printed type name, then validate it.'
  when 'A4' then 'Look at the quotation marks, identify the Python data type, select one answer, then validate it.'
  when 'A5' then 'Notice that both values are strings. Predict what + produces, select the exact text result, then validate it.'
  when 'A6' then 'Keep the provided list unchanged. Use index 0 to read the first item, run the cell, read the output, then validate it.'
  when 'A7' then 'Map list positions to indexes 0, 1, 2, 3; find index 2, select that value, then validate it.'
  when 'A8' then 'Keep the provided list unchanged. Use index 1 to read the second item, run the cell, read the output, then validate it.'
  else c.prompt
end,
hint = case c.checkpoint_key
  when 'A1' then 'Use the variable names with +, then print the result. Template: result = a + b.'
  when 'A2' then 'Multiplication is evaluated before addition unless parentheses change the order.'
  when 'A3' then 'Template: print(type(decimal).__name__).'
  when 'A4' then 'Quotation marks make a value text (str).'
  when 'A5' then 'With strings, + joins text instead of adding numbers.'
  when 'A6' then 'Template: first = scores[0]. Python list indexing starts at zero.'
  when 'A7' then 'Index 2 is the third item because Python starts at index 0.'
  when 'A8' then 'Template: second = values[1]. The second item is index 1.'
  else c.hint
end
from activity a
where c.activity_id=a.id;
