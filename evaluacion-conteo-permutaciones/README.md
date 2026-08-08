# Statistics 11 · Secure Counting & Permutations Assessment

## Links after merge to `main`

- Student: `https://juanperez238421-cpu.github.io/ijr-estadistica-11-2026/evaluacion-conteo-permutaciones/`
- Teacher: `https://juanperez238421-cpu.github.io/ijr-estadistica-11-2026/evaluacion-conteo-permutaciones/teacher/`

The student page deliberately stays **closed** while `config.js` contains placeholder Supabase values. An official assessment must never fall back to browser-only storage.

## Default assessment

- 18 questions.
- 40 minutes.
- Maximum raw score: 15 points.
- Reported grade: 1.0–5.0.
- Passing grade: 3.0.
- Default grade formula: `1 + 4 × correct/18`; therefore 9/18 = 3.0.
- Default question quota: 5 FCP, 5 simple permutations, 4 distinguishable permutations, 4 circular permutations.
- Three confirmed tab-switch strikes automatically invalidate the attempt, with teacher audit/override possible.

All of these values are configuration, not hard-coded policy assumptions.

## Architecture

GitHub Pages is the public frontend. Supabase provides anonymous student authentication, PostgreSQL, Row Level Security, Edge Functions and Realtime for the teacher dashboard. Correct answers are stored only in `questions_private` and are never sent to the student browser during assessment mode.

## Required setup

1. Create a Supabase project.
2. Enable Anonymous Sign-Ins in Supabase Auth for students.
3. Apply `supabase/migrations/20260807_secure_statistics11_assessment.sql`.
4. Deploy Edge Functions: `start-attempt`, `submit-answer`, `log-event`, `finish-attempt`, `teacher-action`.
5. Set Edge Function secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a random `IP_HASH_SALT`.
6. Locally import the private question bank and assignments with `tools/import_secure_statistics11_assessment.py`. Never commit the service-role key.
7. Create the teacher user in Supabase Auth and insert/update its `profiles.role` to `teacher` or `admin`.
8. Put only the Supabase URL and **anon/publishable** key in `evaluacion-conteo-permutaciones/config.js`.
9. Set the assessment row from `draft` to `open` when the class should begin.

## Question-bank capacity

The supplied bank has 1,600 questions (400 per topic). The theoretical total-only limit at 18 globally unique questions is `floor(1600/18) = 88` students. However, the configured balanced quota is **5 FCP + 5 simple + 4 distinguishable + 4 circular**. Because FCP and simple permutations contain only 400 items each, the actual strict capacity under that quota is **80 students** (`400/5`). Therefore a three-group roster near 90 students must use an expanded bank.

For 90 students the configured quota requires at least 450 FCP, 450 simple, 360 distinguishable and 360 circular questions (1,620 total minimum). The supplied local generator was verified to generate **2,000 unique questions** by using `TARGET_PER_TOPIC = 500` (500 × 4 topics). This is the recommended production baseline because it supports 90 students under the 5/5/4/4 quota and leaves reserve capacity. Keep the expanded canonical bank private and import it to Supabase; do not publish answer keys in GitHub Pages.

## IP and device evidence

Do **not** use IP address as the student's identity. A school network can place many students behind one public IP. The Edge Function records a salted SHA-256 IP hash plus user-agent/session information as supporting evidence. Raw IP storage is intentionally off by default.

## Integrity telemetry

The browser can reliably log events such as:

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

For every attempt the teacher should be able to reconstruct:

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
