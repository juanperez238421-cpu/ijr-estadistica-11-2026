do $$
begin
  if exists (
    select 1
    from public.python_hub_workshop_responses
    where topic_slug in ('logic','conditions','loops')
  ) then
    raise exception 'Data-first curriculum migration aborted: affected topics already contain student workshop responses';
  end if;
end;
$$;

update public.python_hub_topics
set title = case slug
      when 'logic' then 'Conditions: comparisons, logic and if/else'
      when 'conditions' then 'Read and inspect a CSV with Pandas'
      when 'loops' then 'Central tendency from a real dataset'
      else title
    end,
    nav_title = case slug
      when 'logic' then 'Conditions & if'
      when 'conditions' then 'CSV → DataFrame'
      when 'loops' then 'Mean · median · mode'
      else nav_title
    end,
    updated_at = clock_timestamp()
where slug in ('logic','conditions','loops');

update public.python_hub_workshop_keys as k
set title = v.title,
    mode = v.mode,
    expected_text = v.expected_text
from (values
  ('logic','logic-01',1,'Approval comparison','code','True'),
  ('logic','logic-02',2,'Group equality','code','True'),
  ('logic','logic-03',3,'Two requirements with and','code','True'),
  ('logic','logic-04',4,'Alternative rule with or','code','True'),
  ('logic','logic-05',5,'Decision with if/else','code','Aprueba'),
  ('logic','logic-06',6,'Three levels with elif','code','Alto'),
  ('logic','logic-07',7,'Text decision','code','Grupo B'),
  ('logic','logic-08',8,'Combined decision','code','Habilitado'),
  ('logic','logic-09',9,'Decision with not','code','Presente'),
  ('logic','logic-10',10,'Equality operator','choice','=='),
  ('logic','logic-11',11,'Meaning of indentation','choice','The instructions controlled by the condition'),
  ('logic','logic-12',12,'Role of else','choice','Handles the remaining case'),

  ('conditions','cond-01',1,'Load the CSV and inspect shape','code','(12, 4)'),
  ('conditions','cond-02',2,'Inspect column names','code','[''estudiante'', ''grupo'', ''edad'', ''nota'']'),
  ('conditions','cond-03',3,'Inspect the first observations','code','[''Estudiante_01'', ''Estudiante_02'']'),
  ('conditions','cond-04',4,'Count observations','code','12'),
  ('conditions','cond-05',5,'Count distinct groups','code','3'),
  ('conditions','cond-06',6,'Frequency by group','code','{''11A'': 4, ''11B'': 4, ''11C'': 4}'),
  ('conditions','cond-07',7,'Minimum age','code','16'),
  ('conditions','cond-08',8,'Maximum age','code','17'),
  ('conditions','cond-09',9,'Count valid grades','code','12'),
  ('conditions','cond-10',10,'Meaning of a row','choice','One observation'),
  ('conditions','cond-11',11,'Meaning of a column','choice','One variable'),
  ('conditions','cond-12',12,'Inspect before analysis','choice','Check shape, columns and first rows'),

  ('loops','loop-01',1,'Mean grade','code','3.75'),
  ('loops','loop-02',2,'Median grade','code','3.8'),
  ('loops','loop-03',3,'Mode grade','code','3.8'),
  ('loops','loop-04',4,'Number of grades','code','12'),
  ('loops','loop-05',5,'Minimum grade','code','2.7'),
  ('loops','loop-06',6,'Maximum grade','code','4.6'),
  ('loops','loop-07',7,'Grade range','code','1.9'),
  ('loops','loop-08',8,'Compare mean and median','code',E'3.75\n3.8'),
  ('loops','loop-09',9,'Count approved observations','code','10'),
  ('loops','loop-10',10,'Mean among approved observations','code','3.94'),
  ('loops','loop-11',11,'Robust center','choice','Median'),
  ('loops','loop-12',12,'Interpret mean below median','choice','Lower values may be pulling the mean downward')
) as v(topic_slug,item_key,sequence_no,title,mode,expected_text)
where k.topic_slug = v.topic_slug
  and k.item_key = v.item_key
  and k.sequence_no = v.sequence_no;

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
  v_ok boolean := true;
  v_feedback text := 'Write the requested analytical process in Python. Do not submit only a printed final answer.';
begin
  v_compact := regexp_replace(v_code,'[[:space:]]+','','g');

  if btrim(v_code)='' then
    return jsonb_build_object('ok',false,'feedback','The code cell is empty. Write and run the requested Python analysis before validating.');
  end if;

  if p_topic_slug='logic' then
    if p_item_key='logic-01' then
      v_ok := position('>=' in v_compact)>0;
    elsif p_item_key='logic-02' then
      v_ok := position('==' in v_compact)>0;
    elsif p_item_key='logic-03' then
      v_ok := position('>=' in v_compact)>0 and position('and' in v_compact)>0;
    elsif p_item_key='logic-04' then
      v_ok := position('>=' in v_compact)>0 and position('or' in v_compact)>0;
    elsif p_item_key='logic-05' then
      v_ok := position('if' in v_compact)>0 and position('else' in v_compact)>0 and position('>=' in v_compact)>0;
    elsif p_item_key='logic-06' then
      v_ok := position('if' in v_compact)>0 and position('elif' in v_compact)>0 and position('else' in v_compact)>0;
    elsif p_item_key='logic-07' then
      v_ok := position('if' in v_compact)>0 and position('else' in v_compact)>0 and position('==' in v_compact)>0;
    elsif p_item_key='logic-08' then
      v_ok := position('if' in v_compact)>0 and position('else' in v_compact)>0 and position('and' in v_compact)>0 and position('>=' in v_compact)>0;
    elsif p_item_key='logic-09' then
      v_ok := position('if' in v_compact)>0 and position('else' in v_compact)>0 and position('not' in v_compact)>0;
    end if;

    if not v_ok then
      return jsonb_build_object('ok',false,'feedback','Build the requested comparison or if/elif/else rule in Python. The validation checks the decision structure, not only the printed result.');
    end if;
    return jsonb_build_object('ok',true,'feedback','Condition and decision structure matches the stage requirements.');

  elsif p_topic_slug='conditions' then
    v_ok := (position('pandas' in v_compact)>0 or position('pd.' in v_compact)>0)
            and position('read_csv(' in v_compact)>0;

    if p_item_key='cond-01' then
      v_ok := v_ok and position('.shape' in v_compact)>0;
    elsif p_item_key='cond-02' then
      v_ok := v_ok and position('.columns' in v_compact)>0 and position('.tolist(' in v_compact)>0;
    elsif p_item_key='cond-03' then
      v_ok := v_ok and position('.head(' in v_compact)>0 and position('estudiante' in v_compact)>0 and position('.tolist(' in v_compact)>0;
    elsif p_item_key='cond-04' then
      v_ok := v_ok and position('len(' in v_compact)>0;
    elsif p_item_key='cond-05' then
      v_ok := v_ok and position('grupo' in v_compact)>0 and position('.nunique(' in v_compact)>0;
    elsif p_item_key='cond-06' then
      v_ok := v_ok and position('grupo' in v_compact)>0 and position('.value_counts(' in v_compact)>0 and position('.sort_index(' in v_compact)>0 and position('.to_dict(' in v_compact)>0;
    elsif p_item_key='cond-07' then
      v_ok := v_ok and position('edad' in v_compact)>0 and position('.min(' in v_compact)>0;
    elsif p_item_key='cond-08' then
      v_ok := v_ok and position('edad' in v_compact)>0 and position('.max(' in v_compact)>0;
    elsif p_item_key='cond-09' then
      v_ok := v_ok and position('nota' in v_compact)>0 and position('.count(' in v_compact)>0;
    end if;

    if not v_ok then
      return jsonb_build_object('ok',false,'feedback','Import Pandas, load estudiantes.csv with read_csv(), and inspect the requested DataFrame property or method.');
    end if;
    return jsonb_build_object('ok',true,'feedback','CSV and DataFrame inspection structure matches the stage requirements.');

  elsif p_topic_slug='loops' then
    v_ok := (position('pandas' in v_compact)>0 or position('pd.' in v_compact)>0)
            and position('read_csv(' in v_compact)>0
            and position('nota' in v_compact)>0;

    if p_item_key='loop-01' then
      v_ok := v_ok and position('.mean(' in v_compact)>0 and position('round(' in v_compact)>0;
    elsif p_item_key='loop-02' then
      v_ok := v_ok and position('.median(' in v_compact)>0;
    elsif p_item_key='loop-03' then
      v_ok := v_ok and position('.mode(' in v_compact)>0 and position('.iloc[0]' in v_compact)>0;
    elsif p_item_key='loop-04' then
      v_ok := v_ok and position('.count(' in v_compact)>0;
    elsif p_item_key='loop-05' then
      v_ok := v_ok and position('.min(' in v_compact)>0;
    elsif p_item_key='loop-06' then
      v_ok := v_ok and position('.max(' in v_compact)>0;
    elsif p_item_key='loop-07' then
      v_ok := v_ok and position('.max(' in v_compact)>0 and position('.min(' in v_compact)>0 and position('-' in v_compact)>0 and position('round(' in v_compact)>0;
    elsif p_item_key='loop-08' then
      v_ok := v_ok and position('.mean(' in v_compact)>0 and position('.median(' in v_compact)>0;
    elsif p_item_key='loop-09' then
      v_ok := v_ok and position('>=' in v_compact)>0 and position('3' in v_compact)>0 and (position('len(' in v_compact)>0 or position('.shape' in v_compact)>0);
    elsif p_item_key='loop-10' then
      v_ok := v_ok and position('>=' in v_compact)>0 and position('3' in v_compact)>0 and position('.mean(' in v_compact)>0 and position('round(' in v_compact)>0;
    end if;

    if not v_ok then
      return jsonb_build_object('ok',false,'feedback','Load estudiantes.csv with Pandas and calculate the requested statistic from the nota column. Generate the value from the DataFrame instead of printing a pre-calculated answer.');
    end if;
    return jsonb_build_object('ok',true,'feedback','DataFrame statistical analysis structure matches the stage requirements.');
  end if;

  if p_topic_slug not in ('descriptive','position-outliers','pandas-dataframes','data-cleaning','filter-transform','group-aggregate','visualization','analyst-project') then
    return private.python_hub_code_contract_v28_legacy(p_topic_slug,p_item_key,p_code);
  end if;

  if p_topic_slug='descriptive' then
    v_ok := position('statistics' in v_compact)>0;
    if p_item_key='desc-01' then v_ok:=v_ok and position('median(' in v_compact)>0;
    elsif p_item_key='desc-02' then v_ok:=v_ok and position('mode(' in v_compact)>0;
    elsif p_item_key='desc-03' then v_ok:=v_ok and position('variance(' in v_compact)>0;
    elsif p_item_key='desc-04' then v_ok:=v_ok and position('pstdev(' in v_compact)>0 and position('round(' in v_compact)>0;
    elsif p_item_key='desc-05' then v_ok:=v_ok and position('mean(' in v_compact)>0 and position('median(' in v_compact)>0;
    elsif p_item_key='desc-06' then v_ok:=v_ok and position('mean(' in v_compact)>0 and position('median(' in v_compact)>0 and position('mode(' in v_compact)>0;
    end if;
  elsif p_topic_slug='position-outliers' then
    v_ok := (position('numpy' in v_compact)>0 or position('np.' in v_compact)>0) and position('percentile(' in v_compact)>0;
    if p_item_key in ('pos-03','pos-04','pos-05') then v_ok:=v_ok and position('-' in v_compact)>0; end if;
    if p_item_key='pos-04' then v_ok:=v_ok and position('1.5' in v_compact)>0; end if;
    if p_item_key='pos-05' then v_ok:=v_ok and position('1.5' in v_compact)>0 and (position('for' in v_compact)>0 or position('[' in v_compact)>0); end if;
  elsif p_topic_slug='pandas-dataframes' then
    v_ok := position('pandas' in v_compact)>0 or position('pd.' in v_compact)>0;
    if p_item_key in ('pd-01','pd-02','pd-03','pd-05','pd-06') then v_ok:=v_ok and position('dataframe(' in v_compact)>0; end if;
    if p_item_key='pd-04' then v_ok:=v_ok and position('read_csv(' in v_compact)>0 and position('stringio' in v_compact)>0; end if;
    if p_item_key='pd-03' then v_ok:=v_ok and position('head(' in v_compact)>0; end if;
    if p_item_key='pd-06' then v_ok:=v_ok and position('describe(' in v_compact)>0; end if;
  elsif p_topic_slug='data-cleaning' then
    v_ok := position('pandas' in v_compact)>0 or position('pd.' in v_compact)>0;
    if p_item_key='clean-01' then v_ok:=v_ok and position('isna(' in v_compact)>0;
    elsif p_item_key='clean-02' then v_ok:=v_ok and position('fillna(' in v_compact)>0 and position('mean(' in v_compact)>0;
    elsif p_item_key='clean-03' then v_ok:=v_ok and position('duplicated(' in v_compact)>0;
    elsif p_item_key='clean-04' then v_ok:=v_ok and position('drop_duplicates(' in v_compact)>0;
    elsif p_item_key='clean-05' then v_ok:=v_ok and position('to_numeric(' in v_compact)>0 and position('coerce' in v_compact)>0;
    elsif p_item_key='clean-06' then v_ok:=v_ok and position('.str.strip(' in v_compact)>0;
    end if;
  elsif p_topic_slug='filter-transform' then
    v_ok := position('pandas' in v_compact)>0 or position('pd.' in v_compact)>0;
    if p_item_key='filt-01' then v_ok:=v_ok and position('>=' in v_compact)>0;
    elsif p_item_key='filt-02' then v_ok:=v_ok and position('sort_values(' in v_compact)>0;
    elsif p_item_key='filt-03' then v_ok:=v_ok and position('/100' in v_compact)>0;
    elsif p_item_key='filt-04' then v_ok:=v_ok and position('&' in v_compact)>0 and position('>=' in v_compact)>0;
    elsif p_item_key='filt-05' then v_ok:=v_ok and position('.query(' in v_compact)>0;
    elsif p_item_key='filt-06' then v_ok:=v_ok and position('nlargest(' in v_compact)>0;
    end if;
  elsif p_topic_slug='group-aggregate' then
    v_ok := position('pandas' in v_compact)>0 or position('pd.' in v_compact)>0;
    if p_item_key='grp-01' then v_ok:=v_ok and position('value_counts(' in v_compact)>0;
    elsif p_item_key in ('grp-02','grp-03') then v_ok:=v_ok and position('groupby(' in v_compact)>0;
    elsif p_item_key='grp-04' then v_ok:=v_ok and position('agg(' in v_compact)>0;
    elsif p_item_key='grp-05' then v_ok:=v_ok and position('crosstab(' in v_compact)>0;
    elsif p_item_key='grp-06' then v_ok:=v_ok and position('pivot_table(' in v_compact)>0;
    end if;
  elsif p_topic_slug='visualization' then
    v_ok := position('matplotlib' in v_compact)>0 or position('plt.' in v_compact)>0;
    if p_item_key='viz-01' then v_ok:=v_ok and position('plot(' in v_compact)>0 and position('bar' in v_compact)>0;
    elsif p_item_key='viz-02' then v_ok:=v_ok and position('hist(' in v_compact)>0;
    elsif p_item_key='viz-03' then v_ok:=v_ok and position('boxplot(' in v_compact)>0;
    elsif p_item_key='viz-04' then v_ok:=v_ok and position('scatter(' in v_compact)>0;
    elsif p_item_key='viz-05' then v_ok:=v_ok and position('title' in v_compact)>0;
    elsif p_item_key='viz-06' then v_ok:=v_ok and position('xlabel' in v_compact)>0 and position('ylabel' in v_compact)>0;
    end if;
  elsif p_topic_slug='analyst-project' then
    v_ok := position('pandas' in v_compact)>0 or position('pd.' in v_compact)>0;
    if p_item_key in ('cap-01','cap-02','cap-03','cap-04','cap-05','cap-06') then v_ok:=v_ok and position('read_csv(' in v_compact)>0; end if;
    if p_item_key='cap-02' then v_ok:=v_ok and position('isna(' in v_compact)>0;
    elsif p_item_key='cap-03' then v_ok:=v_ok and position('mean(' in v_compact)>0;
    elsif p_item_key='cap-04' then v_ok:=v_ok and position('groupby(' in v_compact)>0;
    elsif p_item_key='cap-05' then v_ok:=v_ok and position('corr(' in v_compact)>0;
    elsif p_item_key='cap-06' then v_ok:=v_ok and position('scatter(' in v_compact)>0 and (position('matplotlib' in v_compact)>0 or position('plt.' in v_compact)>0);
    end if;
  end if;

  if not v_ok then return jsonb_build_object('ok',false,'feedback',v_feedback); end if;
  return jsonb_build_object('ok',true,'feedback','Code structure matches the analytical stage requirements.');
end;
$function$;

comment on function private.python_hub_code_contract_v28(text,text,text) is
  'Statistics 11 workshop code-authorship contract. V32 integrates comparisons+if, then moves CSV/DataFrame inspection and central tendency ahead of loops.';
