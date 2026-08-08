begin;

-- Statistics 11 student assessment language contract:
-- every active question shown to students must have an English prompt.
-- The private bank already stores prompt_en; this migration makes it the
-- authoritative student-facing projection instead of prompt_es.

do $$
declare
  v_missing integer;
begin
  select count(*) into v_missing
  from public.questions_private
  where active=true
    and nullif(trim(coalesce(prompt_en,'')),'') is null;

  if v_missing > 0 then
    raise exception 'English assessment rollout blocked: % active questions have no prompt_en',v_missing;
  end if;
end;
$$;

-- Add explicit English figure metadata for the structured diagrams used by
-- the production bank. Existing mathematical parameters are preserved.
update public.questions_private
set diagram = jsonb_set(
  coalesce(diagram,'{}'::jsonb),
  '{stage_labels_en}',
  '["Stage A","Stage B","Stage C"]'::jsonb,
  true
)
where active=true
  and diagram->>'type'='stage_tree';

update public.questions_private
set diagram = coalesce(diagram,'{}'::jsonb)
  || jsonb_build_object(
       'items_label_en','items',
       'positions_label_en','ordered positions'
     )
where active=true
  and diagram->>'type'='ordered_slots';

update public.questions_private
set diagram = coalesce(diagram,'{}'::jsonb)
  || jsonb_build_object('caption_en','Repeated elements')
where active=true
  and diagram->>'type'='repeated_tokens';

update public.questions_private
set diagram = coalesce(diagram,'{}'::jsonb)
  || jsonb_build_object('caption_en','Circular seating')
where active=true
  and diagram->>'type'='circular_seats';

create or replace function public.assessment_public_question(
  p_assessment_id uuid,
  p_student_internal_key text,
  p_question_order integer
)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  v_assignment public.assignments%rowtype;
  v_question public.questions_private%rowtype;
  v_order jsonb;
  v_options jsonb;
begin
  select * into v_assignment
  from public.assignments
  where assessment_id=p_assessment_id
    and student_id=p_student_internal_key
    and question_order=p_question_order;

  if not found then
    raise exception 'Assigned question not found';
  end if;

  select * into v_question
  from public.questions_private
  where id=v_assignment.question_id and active=true;

  if not found then
    raise exception 'Question not found';
  end if;

  if nullif(trim(coalesce(v_question.prompt_en,'')),'') is null then
    raise exception 'English prompt missing for question %',v_question.id;
  end if;

  v_order := v_assignment.option_order;
  if v_order is null or jsonb_array_length(v_order) <> 4 then
    select jsonb_agg(idx order by md5(
      v_assignment.question_id || '|' ||
      p_student_internal_key || '|' ||
      idx::text
    ))
    into v_order
    from generate_series(0,3) idx;

    update public.assignments
    set option_order=v_order
    where id=v_assignment.id;
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'key', chr(64 + ordinality::integer),
      'label', v_question.options ->> (elem::integer)
    )
    order by ordinality
  )
  into v_options
  from jsonb_array_elements_text(v_order)
       with ordinality as x(elem,ordinality);

  return jsonb_build_object(
    'id',v_question.id,
    'order',v_assignment.question_order,
    'topic_label',v_question.topic_code,
    'prompt',v_question.prompt_en,
    'language','en',
    'diagram',coalesce(v_question.diagram,'{}'::jsonb),
    'options',coalesce(v_options,'[]'::jsonb)
  );
end;
$$;

revoke all on function public.assessment_public_question(uuid,text,integer)
from public,anon,authenticated;

-- Safe QA endpoint used only to prove that the active bank is fully English.
create or replace function public.statistics11_english_content_health()
returns jsonb
language sql
security definer
set search_path=public
as $$
  select jsonb_build_object(
    'ready', count(*) filter(where nullif(trim(coalesce(prompt_en,'')),'') is null)=0,
    'active_questions', count(*),
    'missing_english_prompts', count(*) filter(where nullif(trim(coalesce(prompt_en,'')),'') is null),
    'stage_tree_count', count(*) filter(where diagram->>'type'='stage_tree'),
    'ordered_slots_count', count(*) filter(where diagram->>'type'='ordered_slots'),
    'repeated_tokens_count', count(*) filter(where diagram->>'type'='repeated_tokens'),
    'circular_seats_count', count(*) filter(where diagram->>'type'='circular_seats')
  )
  from public.questions_private
  where active=true;
$$;

revoke all on function public.statistics11_english_content_health() from public;
grant execute on function public.statistics11_english_content_health() to anon,authenticated;

notify pgrst,'reload schema';
commit;
