# Statistics 11 · Secure Counting & Permutations Assessment

## Production routes

- Student: `https://juanperez238421-cpu.github.io/ijr-estadistica-11-2026/evaluacion-conteo-permutaciones/`
- Teacher: `https://juanperez238421-cpu.github.io/ijr-estadistica-11-2026/evaluacion-conteo-permutaciones/teacher/`

The student page deliberately stays **closed** while `config.js` contains placeholder Supabase values. An official assessment must never fall back to browser-only storage.

## Production assessment

- 18 questions.
- 40 minutes.
- Maximum raw score: 15 points.
- Reported grade: 1.0–5.0.
- Passing grade: 3.0.
- Default grade formula: `1 + 4 × correct/18`; therefore 9/18 = 3.0.
- Question quota: 5 FCP, 5 simple permutations, 4 distinguishable permutations, 4 circular permutations.
- Three confirmed tab-switch strikes automatically invalidate the attempt, with teacher audit/override possible.

## Production question bank v2

The production baseline is **2,000 validated questions**:

- 500 Fundamental Counting Principle (`FCP`).
- 500 Simple Permutations (`P_SIMPLE`).
- 500 Distinguishable Permutations (`P_DIST`).
- 500 Circular Permutations (`P_CIRC`).

Validation completed locally against the canonical bank:

- 2,000 unique IDs.
- 2,000 unique Spanish prompts.
- 2,000 unique English prompts.
- 2,000 unique fingerprints.
- 100% mathematical answer recomputation passed.
- 4 unique multiple-choice options per question.
- 0 assignment collisions in the 90-student / 18-question production simulation.
- 1,620 unique assigned question IDs for 90 students.
- Question-bank SHA-256: `8c5f08d519f5213ca070aa04a5ac92e76c3b151e60c830d30f60ee63abb9e2e7`.

With the 5/5/4/4 quota, 500 questions per topic give a strict capacity of **100 students** without globally reusing a question. A 90-student roster consumes 450 FCP, 450 simple, 360 distinguishable and 360 circular questions, leaving reserve capacity.

The canonical 2,000-question bank contains answer keys and solutions, so it **must not be committed to this public repository**. Keep it private and import it into Supabase with `tools/import_secure_statistics11_assessment.py`. Publishing the canonical answer bank in GitHub Pages would expose the exam.

## Architecture

GitHub Pages is the public frontend. Supabase provides anonymous student authentication, PostgreSQL, Row Level Security, Edge Functions and Realtime for the teacher dashboard. Correct answers are stored only in `questions_private` and are never sent to the student browser during assessment mode.

## Required setup before opening the assessment

1. Create/connect a Supabase project.
2. Enable Anonymous Sign-Ins in Supabase Auth for students.
3. Apply `supabase/migrations/20260807_secure_statistics11_assessment.sql`.
4. Deploy Edge Functions: `start-attempt`, `submit-answer`, `log-event`, `finish-attempt`, `teacher-action`.
5. Set Edge Function secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a random `IP_HASH_SALT`.
6. Import the private **2,000-question** canonical bank and roster with `tools/import_secure_statistics11_assessment.py`.
7. Create the teacher user in Supabase Auth and set `profiles.role` to `teacher` or `admin`.
8. Put only the Supabase URL and **anon/publishable** key in `evaluacion-conteo-permutaciones/config.js`.
9. Run the student and teacher smoke tests.
10. Set the assessment row from `draft` to `open` when the class should begin.

## IP and device evidence

Do **not** use IP address as the student's identity. A school network can place many students behind one public IP. The Edge Function records a salted SHA-256 IP hash plus user-agent/session information as supporting evidence. Raw IP storage is intentionally off by default.

## Integrity telemetry

The browser logs observable events such as:

- `visibilitychange` / tab hidden and visible;
- window blur/focus;
- fullscreen enter/exit;
- copy/cut/paste attempts;
- context menu;
- Print command;
- online/offline;
- page hide/unload;
- duplicate tabs in the same browser;
- server heartbeat and duplicate server sessions.

A standard web page **cannot reliably detect or block every operating-system screenshot**, a photograph taken with another device, a second physical monitor, or Alt+Tab at the OS level. The assessment therefore uses a personalized rotating watermark and logs `PrintScreen` only when the browser receives that key event. For stronger lockdown use Safe Exam Browser or an institution-managed kiosk environment.

## Traceability goal

For every attempt the teacher can reconstruct:

- student registration and group;
- server start/end times;
- exact question IDs and displayed option order;
- answer submitted for each question;
- server-computed correctness;
- response time;
- score /15 and grade /5;
- tab-switch strikes;
- fullscreen exits;
- copy/paste and observable screenshot-key attempts;
- connectivity events;
- duplicate-session evidence;
- teacher review actions.

## Privacy

Only collect data necessary to administer the assessment. The student is shown a supervision notice before beginning. Camera, microphone, geolocation and invasive device fingerprinting are not required by this implementation.
