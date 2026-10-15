-- Fix only Class 2 workshop exercise 09: reuse of earlier Colab df is valid.
-- The expected answer remains 'Series'; remaining rules are unchanged.
CREATE OR REPLACE FUNCTION private.python_hub_code_contract_v28(p_topic_slug text, p_item_key text, p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'extensions', 'pg_catalog'
AS $function$
declare
  v_code text := lower(coalesce(p_code,''));
  v_compact text;
  v_ok boolean := true;
  v_feedback text := null;
  v_series_match text[];
begin
  v_compact := regexp_replace(v_code,'[[:space:]]+','','g');

  if btrim(v_code) = '' then
    return jsonb_build_object(
      'ok', false,
      'feedback', 'The code cell is empty. Write and run the requested Python process before validating.'
    );
  end if;

  if p_topic_slug = 'logic' then
    if p_item_key = 'logic-01' then
      v_ok := position('math' in v_compact) > 0
              and position('sqrt(' in v_compact) > 0;
      v_feedback := 'Class 1 · Import math and use math.sqrt(...) to generate the result.';

    elsif p_item_key = 'logic-02' then
      v_ok := position('statistics' in v_compact) > 0
              and position('mean(' in v_compact) > 0;
      v_feedback := 'Class 1 · Import statistics and calculate the mean from the list with statistics.mean(...).';

    elsif p_item_key = 'logic-03' then
      v_ok := (position('pathlib' in v_compact) > 0 or position('path(' in v_compact) > 0)
              and position('.suffix' in v_compact) > 0
              and position('pandas_excel_students.xlsx' in v_compact) > 0;
      v_feedback := 'Class 1 · Use pathlib.Path with the real workbook filename and inspect its .suffix.';

    elsif p_item_key = 'logic-04' then
      v_ok := position('load_workbook(' in v_compact) > 0
              and position('pandas_excel_students.xlsx' in v_compact) > 0
              and position('sheetnames' in v_compact) > 0
              and position('students' in v_compact) > 0;
      v_feedback := 'Class 1 · Use openpyxl.load_workbook(...) on the real workbook and inspect wb.sheetnames.';

    elsif p_item_key = 'logic-05' then
      v_ok := position('load_workbook(' in v_compact) > 0
              and position('pandas_excel_students.xlsx' in v_compact) > 0
              and position('students' in v_compact) > 0
              and position('max_row' in v_compact) > 0
              and position('max_column' in v_compact) > 0;
      v_feedback := 'Class 1 · Load the real workbook with openpyxl, select Students, and inspect worksheet dimensions/cells.';

    elsif p_item_key = 'logic-06' then
      v_ok := position('workbook(' in v_compact) > 0
              and position('save(' in v_compact) > 0
              and position('xlsx_library_output.xlsx' in v_compact) > 0;
      v_feedback := 'Class 1 · Create a workbook with openpyxl.Workbook() and save xlsx_library_output.xlsx.';

    elsif p_item_key = 'logic-07' then
      v_ok := (position('pandas' in v_compact) > 0 or position('pd.' in v_compact) > 0)
              and position('read_excel(' in v_compact) > 0
              and position('pandas_excel_students.xlsx' in v_compact) > 0
              and position('type(' in v_compact) > 0;
      v_feedback := 'Class 2 · Import Pandas, read the real XLSX into df, and inspect the created object type.';

    elsif p_item_key = 'logic-08' then
      v_ok := (position('pandas' in v_compact) > 0 or position('pd.' in v_compact) > 0)
              and position('read_excel(' in v_compact) > 0
              and position('pandas_excel_students.xlsx' in v_compact) > 0
              and position('.shape' in v_compact) > 0
              and position('.columns' in v_compact) > 0
              and position('.head(' in v_compact) > 0;
      v_feedback := 'Class 2 · Read the real XLSX with Pandas and inspect shape, columns and head() before analysis.';

    elsif p_item_key = 'logic-09' then
      -- df may have been read with Pandas in a preceding Colab cell.
      -- Check a single-column selection and introspection of that Series.
      v_series_match := regexp_match(
        v_code,
        '([a-z_][a-z0-9_]*)[[:space:]]*=[[:space:]]*df[[:space:]]*\[[[:space:]]*["'']score["''][[:space:]]*\]'
      );
      v_ok := (
        v_series_match is not null
        and position('type(' || v_series_match[1] || ').__name__' in v_compact) > 0
      )
      or position('type(df["score"]).__name__' in v_compact) > 0
      or position('type(df[''score'']).__name__' in v_compact) > 0;
      v_feedback := 'Class 2 · Select df["score"] with one bracket pair and inspect the Series type with type(scores).__name__. You may reuse df from the previous Colab cell.';

    elsif p_item_key = 'logic-10' then
      v_ok := (position('pandas' in v_compact) > 0 or position('pd.' in v_compact) > 0)
              and position('read_excel(' in v_compact) > 0
              and position('pandas_excel_students.xlsx' in v_compact) > 0
              and position('.loc[' in v_compact) > 0
              and position('["score"]>=90' in v_compact) > 0;
      v_feedback := 'Class 2 · Use a Boolean score >= 90 condition inside df.loc[...] on the real DataFrame.';

    elsif p_item_key = 'logic-11' then
      v_ok := (position('pandas' in v_compact) > 0 or position('pd.' in v_compact) > 0)
              and position('read_excel(' in v_compact) > 0
              and position('pandas_excel_students.xlsx' in v_compact) > 0
              and position('["passed"]' in v_compact) > 0
              and position('sort_values(' in v_compact) > 0
              and position('ascending=false' in v_compact) > 0;
      v_feedback := 'Class 2 · Create the passed variable and sort complete rows with sort_values(..., ascending=False).';

    elsif p_item_key = 'logic-12' then
      v_ok := (position('pandas' in v_compact) > 0 or position('pd.' in v_compact) > 0)
              and position('read_excel(' in v_compact) > 0
              and position('pandas_excel_students.xlsx' in v_compact) > 0
              and position('to_excel(' in v_compact) > 0
              and position('pandas_analysis_output.xlsx' in v_compact) > 0
              and position('index=false' in v_compact) > 0;
      v_feedback := 'Class 2 · Export the transformed DataFrame with to_excel(..., index=False) to pandas_analysis_output.xlsx.';

    else
      return jsonb_build_object('ok', false, 'feedback', 'Unknown Topic 04 workshop item.');
    end if;

    if not v_ok then
      return jsonb_build_object('ok', false, 'feedback', v_feedback);
    end if;

    return jsonb_build_object(
      'ok', true,
      'feedback', case when left(p_item_key,8) <= 'logic-06'
        then 'Class 1 library/XLSX code structure matches the stage requirements.'
        else 'Class 2 Pandas code structure matches the stage requirements.'
      end
    );
  end if;

  return private.python_hub_code_contract_v28_pre_xlsx_v46(
    p_topic_slug,
    p_item_key,
    p_code
  );
end;
$function$;
