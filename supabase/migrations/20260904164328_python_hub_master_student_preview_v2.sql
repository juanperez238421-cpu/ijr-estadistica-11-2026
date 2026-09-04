create or replace function public.python_hub_master_preview_snapshot_v1(p_teacher_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','private','pg_catalog'
as $$
declare
  v_sid uuid;
  v_snapshot jsonb;
begin
  v_sid := public.teacher_code_session_id(p_teacher_token);
  if v_sid is null then
    raise exception 'Sesión docente inválida o expirada';
  end if;

  select jsonb_build_object(
    'registration', jsonb_build_object(
      'group_code','MASTER',
      'display_label','Teacher preview · all topics unlocked'
    ),
    'completed_topics', 0,
    'total_topics', count(*),
    'topics', coalesce(jsonb_agg(
      jsonb_build_object(
        'slug', t.slug,
        'status', 'available',
        'percent', 0,
        'correct_count', 0,
        'total_count', coalesce((select count(*) from public.python_hub_workshop_keys k where k.topic_slug=t.slug),0),
        'items', coalesce((
          select jsonb_agg(jsonb_build_object(
            'key', k.item_key,
            'correct', false,
            'tries', 0,
            'completed', false
          ) order by k.sequence_no)
          from public.python_hub_workshop_keys k
          where k.topic_slug=t.slug
        ),'[]'::jsonb)
      ) order by t.sequence_no
    ),'[]'::jsonb)
  ) into v_snapshot
  from public.python_hub_topics t
  where t.published=true;

  insert into public.teacher_code_audit(teacher_session_id,action_type,metadata)
  values(v_sid,'PYTHON_HUB_MASTER_STUDENT_PREVIEW',jsonb_build_object('surface','python-hub','mode','full-access-v2'));

  return jsonb_build_object('snapshot',v_snapshot);
end;
$$;

revoke all on function public.python_hub_master_preview_snapshot_v1(text) from public;
grant execute on function public.python_hub_master_preview_snapshot_v1(text) to anon, authenticated;

create or replace function public.python_hub_master_preview_validate_v1(
  p_teacher_token text,
  p_topic_slug text,
  p_item_key text,
  p_answer text,
  p_code_snapshot text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','private','extensions','pg_catalog'
as $$
declare
  v_sid uuid;
  v_key public.python_hub_workshop_keys%rowtype;
  v_answer text;
  v_expected text;
  v_code_check jsonb := jsonb_build_object('ok',true,'feedback',null);
  v_code_valid boolean := true;
  v_code_feedback text := null;
  v_correct boolean := false;
begin
  v_sid := public.teacher_code_session_id(p_teacher_token);
  if v_sid is null then
    raise exception 'Sesión docente inválida o expirada';
  end if;

  select k.* into v_key
  from public.python_hub_workshop_keys k
  join public.python_hub_topics t on t.slug=k.topic_slug and t.published=true
  where k.topic_slug=p_topic_slug and k.item_key=p_item_key;

  if v_key.item_key is null then
    raise exception 'Unknown workshop item';
  end if;

  v_answer:=replace(replace(trim(coalesce(p_answer,'')),E'\r\n',E'\n'),E'\r',E'\n');
  v_expected:=replace(replace(trim(v_key.expected_text),E'\r\n',E'\n'),E'\r',E'\n');

  if v_key.mode='code' then
    v_code_check:=private.python_hub_code_contract_v28(p_topic_slug,p_item_key,p_code_snapshot);
    v_code_valid:=coalesce((v_code_check->>'ok')::boolean,false);
    v_code_feedback:=v_code_check->>'feedback';
  end if;

  v_correct:=(v_answer=v_expected) and v_code_valid;

  return jsonb_build_object(
    'correct',v_correct,
    'code_valid',v_code_valid,
    'code_feedback',v_code_feedback,
    'preview',true
  );
end;
$$;

revoke all on function public.python_hub_master_preview_validate_v1(text,text,text,text,text) from public;
grant execute on function public.python_hub_master_preview_validate_v1(text,text,text,text,text) to anon, authenticated;
