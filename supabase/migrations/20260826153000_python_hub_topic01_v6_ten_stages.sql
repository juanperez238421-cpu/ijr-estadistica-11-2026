-- Topic 01 V6: native Python/Colab theory + 10-stage workshop.
-- Preserve op-01..op-06 keys so prior correct work remains valid.

update public.python_hub_topics
set title = 'Colab interface and general operations',
    workshop_item_count = 10,
    updated_at = now()
where slug = 'operations';

insert into public.python_hub_workshop_keys
  (topic_slug, item_key, sequence_no, title, mode, expected_text)
values
  ('operations','op-07',7,'Use the remainder operator','code','5'),
  ('operations','op-08',8,'Divide a total into equal parts','code','12.0'),
  ('operations','op-09',9,'Control order with parentheses','code','28'),
  ('operations','op-10',10,'Use a previous result in a later step','code','20')
on conflict (topic_slug, item_key) do update
set sequence_no = excluded.sequence_no,
    title = excluded.title,
    mode = excluded.mode,
    expected_text = excluded.expected_text;

-- Existing learners who had completed the former 6-stage version now keep
-- those six correct stages, but must complete the four new stages.
update public.python_hub_topic_progress
set total_count = 10,
    percent = least(100, round((correct_count::numeric / 10) * 100)::integer),
    status = case
      when correct_count >= 10 then 'completed'
      when correct_count > 0 then 'in_progress'
      else 'available'
    end,
    completed_at = case when correct_count >= 10 then coalesce(completed_at, now()) else null end,
    updated_at = now()
where topic_slug = 'operations';

-- Re-apply the prerequisite until all ten Topic 01 stages are complete.
update public.python_hub_topic_progress t
set status = 'locked',
    updated_at = now()
where t.topic_slug = 'types'
  and exists (
    select 1
    from public.python_hub_topic_progress o
    where o.registration_id = t.registration_id
      and o.topic_slug = 'operations'
      and o.status <> 'completed'
  );
