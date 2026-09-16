-- Seminar 11 specialized diagnostic V5 question bank.
-- Additive to V4: keeps the 15-question / 12-scored / 3-self-profile / 4-stage contract,
-- while adding four explicit code-reading or code-selection items per track.

insert into public.seminar_track_diagnostic_questions(
  id, track_slug, position, bank_version, domain, kind, prompt, options,
  correct_option, scored, created_at, stage_no, concept_code, critical
)
select
  replace(id, '-v4-', '-v5-'), track_slug, position, '2026-09-16-v5', domain, kind, prompt, options,
  correct_option, scored, now(), stage_no, concept_code, critical
from public.seminar_track_diagnostic_questions
where bank_version='2026-09-16-v4'
on conflict (id) do nothing;

-- WEB DEVELOPMENT
update public.seminar_track_diagnostic_questions
set prompt='Read the code:\n\nconst status = document.querySelector(''#status'');\nstatus.textContent = ''Ready'';\n\nWhat visible change should occur?',
    options=jsonb_build_array('The browser tab title becomes Ready','The text inside the element with id status becomes Ready','A new element named status is created','Ready is stored automatically in localStorage'),
    correct_option=1, concept_code='code_dom_textcontent'
where bank_version='2026-09-16-v5' and track_slug='web' and position=3;

update public.seminar_track_diagnostic_questions
set prompt='A form reads age from input.value. Which implementation correctly converts and validates an integer age from 5 to 120 before saving it?',
    options=jsonb_build_array('if (input.value) save(input.value);','const age = Number(input.value); if (Number.isInteger(age) && age >= 5 && age <= 120) save(age);','if (input.value >= ''5'') save(input.value);','save(parseInt(input.value));'),
    correct_option=1, concept_code='code_input_validation'
where bank_version='2026-09-16-v5' and track_slug='web' and position=4;

update public.seminar_track_diagnostic_questions
set prompt='Read the code:\n\nconst response = await fetch(''/api/user'');\nconst data = await response.json();\nrender(data);\n\nWhich production-minded check should be added before parsing and rendering the response?',
    options=jsonb_build_array('if (!response.ok) handleError(response.status);','setTimeout(() => render(data), 0);','fetch(''/api/user'') a second time','JSON.stringify(response) before checking status'),
    correct_option=0, concept_code='code_fetch_error_handling'
where bank_version='2026-09-16-v5' and track_slug='web' and position=7;

update public.seminar_track_diagnostic_questions
set prompt='Read the class:\n\nclass Task {\n  constructor(title) { this.title = title.trim(); this.done = false; }\n  complete() { this.done = true; }\n}\n\nWhere does a rule such as “a task title cannot be empty” belong most naturally?',
    options=jsonb_build_array('Inside the Task domain class or a domain validation service','Only inside the CSS file','Only inside the click handler that changes button color','Inside window.resize'),
    correct_option=0, concept_code='code_oop_domain_responsibility'
where bank_version='2026-09-16-v5' and track_slug='web' and position=11;

-- PYTHON & DATA SCIENCE
update public.seminar_track_diagnostic_questions
set prompt='Read the Python code:\n\nvalues = [4.2, 3.7, 4.6]\nprint(values[1])\n\nWhat is printed?',
    options=jsonb_build_array('4.2','3.7','4.6','[3.7]'), correct_option=1, concept_code='code_python_indexing'
where bank_version='2026-09-16-v5' and track_slug='data-science' and position=2;

update public.seminar_track_diagnostic_questions
set prompt='After running:\n\nimport pandas as pd\ndf = pd.read_csv(''scores.csv'')\n\nWhich command is most useful for checking column names, data types, and non-null counts in one view?',
    options=jsonb_build_array('df.info()','df.plot()','df.sort_values()','df.to_csv()'), correct_option=0, concept_code='code_pandas_info'
where bank_version='2026-09-16-v5' and track_slug='data-science' and position=3;

update public.seminar_track_diagnostic_questions
set prompt='Which line correctly keeps only rows where score is at least 3.0? Assume df is a pandas DataFrame.',
    options=jsonb_build_array('df[''score'' >= 3.0]','df[df[''score''] >= 3.0]','df.filter(score >= 3.0)','df.score(>=3.0)'),
    correct_option=1, concept_code='code_pandas_filter'
where bank_version='2026-09-16-v5' and track_slug='data-science' and position=7;

update public.seminar_track_diagnostic_questions
set prompt='Read the code:\n\nsummary = df.groupby(''group'')[''score''].mean()\n\nWhat does summary represent?',
    options=jsonb_build_array('The mean score computed separately for each group','The number of columns in each group','A sorted list of student names','The overall median with groups removed'),
    correct_option=0, concept_code='code_groupby_mean'
where bank_version='2026-09-16-v5' and track_slug='data-science' and position=8;

-- DEFENSIVE CYBERSECURITY
update public.seminar_track_diagnostic_questions
set prompt='A verification code must contain exactly six digits. Which implementation is the strongest allow-list check?',
    options=jsonb_build_array('value.length === 6','/^\\d{6}$/.test(value)','Number(value) > 0','value.includes(''6'')'),
    correct_option=1, concept_code='code_allowlist_validation'
where bank_version='2026-09-16-v5' and track_slug='cybersecurity' and position=4;

update public.seminar_track_diagnostic_questions
set prompt='Read the defensive service sketch:\n\nfunction openTeacherReport(user) {\n  // authorization check goes here\n  return report;\n}\n\nWhich check is essential before returning the protected report?',
    options=jsonb_build_array('Verify on the trusted server/service boundary that user has the required role/permission','Check whether the button is hidden with CSS','Check whether the browser window is wide enough','Check whether the README mentions teachers'),
    correct_option=0, concept_code='code_server_authorization'
where bank_version='2026-09-16-v5' and track_slug='cybersecurity' and position=6;

update public.seminar_track_diagnostic_questions
set prompt='Read the code:\n\npermissions = {\n  "student": {"read"},\n  "teacher": {"read", "grade"}\n}\n\ndef allowed(role, action):\n    return action in permissions.get(role, set())\n\nWhat does allowed("student", "grade") return?',
    options=jsonb_build_array('True','False','grade','None because sets cannot contain strings'),
    correct_option=1, concept_code='code_policy_reasoning'
where bank_version='2026-09-16-v5' and track_slug='cybersecurity' and position=11;

update public.seminar_track_diagnostic_questions
set prompt='Which class design most clearly separates defensive responsibilities in code?',
    options=jsonb_build_array('Validator checks input; AccessPolicy decides permissions; AuditLog records security events','One UI button decides permissions, stores passwords, and writes logs','Every class stores the administrator password','A single global dictionary is modified by every function'),
    correct_option=0, concept_code='code_security_architecture'
where bank_version='2026-09-16-v5' and track_slug='cybersecurity' and position=12;

-- 3D DESIGN + PROGRAMMING
update public.seminar_track_diagnostic_questions
set prompt='Read the Python tuple:\n\np = (12, -4, 7)\nx, y, z = p\nprint(z)\n\nWhat is printed?',
    options=jsonb_build_array('12','-4','7','23'), correct_option=2, concept_code='code_coordinates_3d'
where bank_version='2026-09-16-v5' and track_slug='3d-programming' and position=1;

update public.seminar_track_diagnostic_questions
set prompt='Read the function:\n\ndef translate(point, dx=0, dy=0, dz=0):\n    x, y, z = point\n    return (x + dx, y + dy, z + dz)\n\nWhat is translate((10,5,0), dx=15, dy=-2, dz=8)?',
    options=jsonb_build_array('(25,3,8)','(15,-2,8)','(25,7,8)','(10,5,23)'), correct_option=0, concept_code='code_translation'
where bank_version='2026-09-16-v5' and track_slug='3d-programming' and position=4;

update public.seminar_track_diagnostic_questions
set prompt='A parametric generator contains:\n\ndef validate(thickness):\n    if thickness <= 0:\n        raise ValueError("thickness must be positive")\n\nWhat should happen for thickness = -5?',
    options=jsonb_build_array('The invalid dimension is rejected with a validation error','The part should still be generated with negative thickness','The value should silently become 100','The number should be converted to text and accepted'),
    correct_option=0, concept_code='code_dimension_validation'
where bank_version='2026-09-16-v5' and track_slug='3d-programming' and position=8;

update public.seminar_track_diagnostic_questions
set prompt='Which object-oriented structure best supports code for a parametric generator?',
    options=jsonb_build_array('Shape/Solid stores geometry parameters; Transform handles spatial operations; Assembly composes parts','One global list stores every coordinate and every function edits it','The export function decides all geometry dimensions','A UI color class performs rotations and scaling'),
    correct_option=0, concept_code='code_geometry_architecture'
where bank_version='2026-09-16-v5' and track_slug='3d-programming' and position=12;

-- ROBOTICS & AUTOMATION
update public.seminar_track_diagnostic_questions
set prompt='Read the control loop sketch:\n\nreading = sensor.read()\ncommand = controller.decide(reading)\nactuator.write(command)\n\nWhich sequence does the code implement?',
    options=jsonb_build_array('Sensor/input → control decision → actuator/output','Actuator → random value → sensor','Output → spreadsheet → input','Battery → file → color'),
    correct_option=0, concept_code='code_control_loop'
where bank_version='2026-09-16-v5' and track_slug='robotics' and position=3;

update public.seminar_track_diagnostic_questions
set prompt='Read the code:\n\nif temperature > 30:\n    fan_on = True\nelse:\n    fan_on = False\n\nWhat is fan_on when temperature is 28?',
    options=jsonb_build_array('True','False','28','Undefined'), correct_option=1, concept_code='code_threshold_logic'
where bank_version='2026-09-16-v5' and track_slug='robotics' and position=6;

update public.seminar_track_diagnostic_questions
set prompt='Which class boundary is most coherent for this codebase: sensor.read(), controller.decide(), actuator.write()?',
    options=jsonb_build_array('Sensor owns measurements, Controller owns decision rules, Actuator owns output commands','Sensor directly edits every UI and motor variable','Actuator decides whether sensor values are valid','All hardware and rules are global variables'),
    correct_option=0, concept_code='code_robotics_architecture'
where bank_version='2026-09-16-v5' and track_slug='robotics' and position=10;

update public.seminar_track_diagnostic_questions
set prompt='Read the safety gate:\n\nif safety_ok:\n    motor.enable()\nelse:\n    motor.disable()\n\nWhy is this rule important?',
    options=jsonb_build_array('It prevents actuator activation when the safety condition is not satisfied','It increases motor speed automatically','It changes the file name when safety is false','It removes the need for integration testing'),
    correct_option=0, concept_code='code_safety_interlock'
where bank_version='2026-09-16-v5' and track_slug='robotics' and position=12;
