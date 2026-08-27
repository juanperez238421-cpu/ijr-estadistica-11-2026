-- V27 · Expand every Statistics 11 Python workshop to 12 stages.
-- Frontend code cells remain student-authored and blank; expected outputs stay server-side.

insert into public.python_hub_workshop_keys(topic_slug,item_key,sequence_no,title,mode,expected_text)
values
  ('operations','op-11',11,'Reuse subtraction and division','code','34.0'),
  ('operations','op-12',12,'Build a multi-step total','code','53.0'),
  ('types','type-07',7,'Convert text and inspect type','code','int'),
  ('types','type-08',8,'Convert integer to float','code','7.0'),
  ('types','type-09',9,'Convert number to string','code','str'),
  ('types','type-10',10,'A comparison creates a Boolean','code','bool'),
  ('types','type-11',11,'Use string conversion','code','16'),
  ('types','type-12',12,'Reassignment can change type','code','float'),
  ('arrays','arr-07',7,'Read the second item','code','9'),
  ('arrays','arr-08',8,'Read the last item using length','code','15'),
  ('arrays','arr-09',9,'Append and measure length','code','5'),
  ('arrays','arr-10',10,'Range from a list','code','12'),
  ('arrays','arr-11',11,'Append before summing','code','20'),
  ('arrays','arr-12',12,'Combine first and last items','code','55'),
  ('logic','logic-07',7,'Compare a group label','code','True'),
  ('logic','logic-08',8,'Invert a Boolean with not','code','True'),
  ('logic','logic-09',9,'Either condition with or','code','False'),
  ('logic','logic-10',10,'Two limits with and','code','True'),
  ('logic','logic-11',11,'Check two values are different','code','True'),
  ('logic','logic-12',12,'Combine comparison and not','code','True'),
  ('conditions','cond-07',7,'Classify sign','code','negative'),
  ('conditions','cond-08',8,'Even or odd decision','code','even'),
  ('conditions','cond-09',9,'Three score bands','code','approved'),
  ('conditions','cond-10',10,'Select the larger variable','code','a'),
  ('conditions','cond-11',11,'Temperature category','code','hot'),
  ('conditions','cond-12',12,'Eligibility decision','code','eligible'),
  ('loops','loop-07',7,'Double every value','code',E'4\n8\n12'),
  ('loops','loop-08',8,'Count even observations','code','3'),
  ('loops','loop-09',9,'Sum values above a threshold','code','47'),
  ('loops','loop-10',10,'Range with a nonzero start','code',E'1\n2\n3\n4'),
  ('loops','loop-11',11,'Product accumulator','code','24'),
  ('loops','loop-12',12,'Sum of squares','code','30'),
  ('functions','fn-07',7,'Return a difference','code','13'),
  ('functions','fn-08',8,'Return an even check','code','True'),
  ('functions','fn-09',9,'Return a list total','code','18'),
  ('functions','fn-10',10,'Return statistical range','code','15'),
  ('functions','fn-11',11,'Function with a threshold','code','2'),
  ('functions','fn-12',12,'Return first and last','code','(8, 14)'),
  ('statistics','stat-07',7,'Minimum and maximum','code',E'5\n20'),
  ('statistics','stat-08',8,'Mean after a new observation','code','7.0'),
  ('statistics','stat-09',9,'Percentage meeting a threshold','code','60.0'),
  ('statistics','stat-10',10,'Compare two ranges','code',E'8\n2'),
  ('statistics','stat-11',11,'Mean and range together','code',E'5.0\n6'),
  ('statistics','stat-12',12,'Count observations below the mean','code','2')
on conflict (topic_slug,item_key) do update
set sequence_no = excluded.sequence_no,
    title = excluded.title,
    mode = excluded.mode,
    expected_text = excluded.expected_text;

do $$
declare
  v_registration record;
begin
  for v_registration in
    select id
    from public.python_hub_registrations
    where status <> 'disabled'
  loop
    perform private.python_hub_refresh_v1(v_registration.id);
  end loop;
end $$;

do $$
declare
  v_bad integer;
begin
  select count(*) into v_bad
  from (
    select t.slug
    from public.python_hub_topics t
    where t.published = true
    group by t.slug
    having (select count(*) from public.python_hub_workshop_keys k where k.topic_slug=t.slug) < 12
  ) q;

  if v_bad <> 0 then
    raise exception 'V27 workshop catalog validation failed: % published topics have fewer than 12 stages', v_bad;
  end if;
end $$;
