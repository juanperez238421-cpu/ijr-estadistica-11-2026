do $$
begin
  if exists (
    select 1
    from public.python_hub_workshop_responses
    where topic_slug = 'logic'
  ) then
    raise exception 'XLSX-first curriculum migration aborted: topic logic already contains student workshop responses';
  end if;

  if exists (
    select 1
    from public.python_hub_topic_progress
    where topic_slug = 'logic'
      and status <> 'locked'
  ) then
    raise exception 'XLSX-first curriculum migration aborted: topic logic is no longer fully locked';
  end if;
end;
$$;

update public.python_hub_topics
set title = case slug
      when 'logic' then 'Excel (.xlsx) files with Pandas'
      when 'conditions' then 'CSV files and Pandas DataFrames'
      else title
    end,
    nav_title = case slug
      when 'logic' then 'XLSX → DataFrame'
      when 'conditions' then 'CSV → DataFrame'
      else nav_title
    end,
    updated_at = clock_timestamp()
where slug in ('logic','conditions');

update public.python_hub_workshop_keys as k
set title = v.title,
    mode = v.mode,
    expected_text = v.expected_text
from (values
  ('logic','logic-01',1,'Load the XLSX and confirm observations','code','True'),
  ('logic','logic-02',2,'Confirm the score variable','code','True'),
  ('logic','logic-03',3,'Verify required dataset structure','code','True'),
  ('logic','logic-04',4,'Test a score threshold','code','True'),
  ('logic','logic-05',5,'Sort the workbook by score','code','True'),
  ('logic','logic-06',6,'Create a derived score flag','code','created'),
  ('logic','logic-07',7,'Select one variable','code','selected'),
  ('logic','logic-08',8,'Filter observations with score at least 90','code','2'),
  ('logic','logic-09',9,'Confirm the score column is available','code','score ready'),
  ('logic','logic-10',10,'What read_excel creates','choice','A DataFrame'),
  ('logic','logic-11',11,'Inspect DataFrame dimensions','choice','df.shape'),
  ('logic','logic-12',12,'Inspect before analysis','choice','Verify the file, rows, columns and first records')
) as v(topic_slug,item_key,sequence_no,title,mode,expected_text)
where k.topic_slug = v.topic_slug
  and k.item_key = v.item_key
  and k.sequence_no = v.sequence_no;

alter function private.python_hub_code_contract_v28(text,text,text)
  rename to python_hub_code_contract_v28_pre_xlsx_v46;

create or replace function private.python_hub_code_contract_v28(
  p_topic_slug text,
  p_item_key text,
  p_code text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'private', 'extensions', 'pg_catalog'
as $function$
declare
  v_code text := lower(coalesce(p_code,''));
  v_compact text;
begin
  v_compact := regexp_replace(v_code,'[[:space:]]+','','g');

  if p_topic_slug = 'logic'
     and p_item_key in ('logic-01','logic-02','logic-03','logic-04','logic-05','logic-06','logic-07','logic-08','logic-09') then
    if position('read_excel(' in v_compact) = 0
       or (position('pandas' in v_compact) = 0 and position('pd.' in v_compact) = 0)
       or position('stat11_stage4_students.xlsx' in v_compact) = 0 then
      return jsonb_build_object(
        'ok', false,
        'feedback', 'This stage must read the real class workbook with Pandas using pd.read_excel("stat11_stage4_students.xlsx"). Generate the result from the DataFrame rather than typing a final answer.'
      );
    end if;
  end if;

  return private.python_hub_code_contract_v28_pre_xlsx_v46(
    p_topic_slug,
    p_item_key,
    p_code
  );
end;
$function$;

revoke all on function private.python_hub_code_contract_v28(text,text,text) from public;
revoke all on function private.python_hub_code_contract_v28(text,text,text) from anon;
revoke all on function private.python_hub_code_contract_v28(text,text,text) from authenticated;
