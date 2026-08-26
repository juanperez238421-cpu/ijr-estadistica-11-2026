window.IJR_COLAB_ACTIVITY_CONFIG = Object.freeze({
  activitySlug: 'statistics11-colab-class1-basics-types-arrays-2026',
  supabaseUrl: 'https://rlfxnjbqxbozjdzkbwlz.supabase.co',
  supabaseAnonKey: 'sb_publishable_rmVOQ3Orx49KpW_4uMqYew_c2HpcA87',
  sessionStorageKey: 'ijr-stat11-colab-class1-active-v11',
  requireFullscreen: false,
  targetMinutes: 40,
  helpTokenLimit: 3,
  institutionalEmailDomain: 'ijr.edu.co',
  variantBankSize: 36,
  rpc: {
    startTeam: 'student_learning_activity_start_team_email_v11',
    resume: 'student_learning_activity_resume_v11',
    submit: 'student_learning_activity_submit_v11',
    help: 'student_learning_activity_use_help_v11',
    reveal: 'student_learning_activity_reveal_solution_v11',
    skip: 'student_learning_activity_skip_stage_v11',
    event: 'student_learning_activity_event'
  }
});

// Classroom bridge for the arrays lesson.
// It deliberately starts from the only prerequisite students need here:
// assigning one value to one variable. The sequence creates the storage
// problem first, then introduces a Python list/array as the solution.
document.addEventListener('DOMContentLoaded', () => {
  const roadmap = document.querySelector('.class1-roadmap');
  if (!roadmap || document.getElementById('arrayNeedBridge')) return;

  const style = document.createElement('style');
  style.textContent = `
    .array-need-bridge{margin:22px 0;padding:22px;border:2px solid #111;border-radius:18px;background:#fff}
    .array-need-bridge h3{margin:0 0 6px;font-size:1.35rem;letter-spacing:-.02em}
    .array-need-bridge .bridge-lead{margin:0 0 16px;max-width:78ch;line-height:1.55;color:#343434}
    .array-need-bridge .bridge-rule{margin:0 0 16px;padding:10px 12px;border-left:4px solid #111;background:#f4f4f4;font-weight:700}
    .array-need-bridge .bridge-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .array-need-bridge .bridge-card{border:1px solid #d6d6d6;border-radius:14px;padding:15px;background:#fafafa}
    .array-need-bridge .bridge-card strong{display:block;margin-bottom:7px;font-size:.83rem;letter-spacing:.05em}
    .array-need-bridge .bridge-card p{margin:7px 0;line-height:1.45}
    .array-need-bridge pre{margin:9px 0;padding:12px;border-radius:10px;background:#101010;color:#f7f7f7;overflow:auto;font-size:.94rem;line-height:1.45}
    .array-need-bridge details{margin-top:10px}
    .array-need-bridge summary{cursor:pointer;font-weight:800}
    .array-need-bridge .bridge-solution{margin-top:8px;padding:9px 10px;border-radius:9px;background:#ededed;line-height:1.45}
    .array-need-bridge .bridge-final{grid-column:1/-1;border:2px solid #111;background:#fff}
    .array-need-bridge .bridge-arrow{font-weight:900;text-align:center;font-size:1.05rem;margin:13px 0 3px}
    @media (max-width:760px){.array-need-bridge .bridge-grid{grid-template-columns:1fr}.array-need-bridge .bridge-final{grid-column:auto}}
  `;
  document.head.appendChild(style);

  const bridge = document.createElement('section');
  bridge.id = 'arrayNeedBridge';
  bridge.className = 'array-need-bridge';
  bridge.setAttribute('aria-label', 'Why arrays are needed');
  bridge.innerHTML = `
    <h3>Why do arrays exist? <small>· ¿Por qué necesitamos arreglos?</small></h3>
    <p class="bridge-lead">Start with what you already know: <strong>one variable can store one value</strong>. Solve these mini-challenges in order. The goal is to discover the problem before seeing the new structure.</p>
    <p class="bridge-rule">Rule: answer each question with your team before opening “Check your reasoning”. Do not jump directly to the final card.</p>

    <div class="bridge-grid">
      <article class="bridge-card">
        <strong>CHALLENGE 1 · ONE VALUE</strong>
        <p>A student obtained a Statistics score of <strong>4.2</strong>. Store it using the Python knowledge you already have.</p>
        <pre>score = WRITE_HERE</pre>
        <p><strong>Question:</strong> How many variables are needed to store this one score?</p>
        <details><summary>Check your reasoning</summary><div class="bridge-solution"><code>score = 4.2</code><br>One value can be stored in one variable.</div></details>
      </article>

      <article class="bridge-card">
        <strong>CHALLENGE 2 · FIVE VALUES</strong>
        <p>Now five students obtained these scores: <strong>4.2, 3.8, 4.5, 2.9, 4.0</strong>. Use only ordinary variables.</p>
        <pre>score_1 = 4.2
score_2 = WRITE_HERE
score_3 = WRITE_HERE
score_4 = WRITE_HERE
score_5 = WRITE_HERE</pre>
        <p><strong>Question:</strong> How many variable names did you need?</p>
        <details><summary>Check your reasoning</summary><div class="bridge-solution">You need <strong>5 different variables</strong>. This still works, but the code is already becoming repetitive.</div></details>
      </article>

      <article class="bridge-card">
        <strong>CHALLENGE 3 · SCALE THE PROBLEM</strong>
        <p>Your class has <strong>30 students</strong>. Imagine storing one score for every student using the same strategy as Challenge 2.</p>
        <p><strong>Questions:</strong> How many variables would you need? Would calculating an average later be pleasant if you had to write all 30 variable names?</p>
        <details><summary>Check your reasoning</summary><div class="bridge-solution">You would need <strong>30 variables</strong>. The problem is not that Python cannot do it; the problem is that the program becomes repetitive, difficult to maintain, and difficult to analyze.</div></details>
      </article>

      <article class="bridge-card">
        <strong>CHALLENGE 4 · DEFINE THE NEED</strong>
        <p>Complete the sentence before continuing:</p>
        <p><strong>“I need ______ variable that can store ______ values in an ordered way.”</strong></p>
        <details><summary>Check your reasoning</summary><div class="bridge-solution">We need <strong>one variable</strong> that can store <strong>multiple values</strong>. That need motivates an array-like structure.</div></details>
      </article>

      <div class="bridge-arrow">↓ NEW IDEA: ONE NAME, MANY VALUES ↓</div>

      <article class="bridge-card bridge-final">
        <strong>CHALLENGE 5 · THE PYTHON SOLUTION</strong>
        <p>Python uses a <strong>list</strong> as a simple array-like structure. Compare this with the five separate variables above:</p>
        <pre>scores = [4.2, 3.8, 4.5, 2.9, 4.0]</pre>
        <p><strong>Before opening the answer:</strong> How many variables are there now? How many values are stored inside it?</p>
        <details><summary>Check your reasoning</summary><div class="bridge-solution"><strong>1 variable → 5 ordered values.</strong><br>The variable is <code>scores</code>. The values are stored together inside square brackets. The next stages show how Python reads them using indexes: <code>scores[0]</code>, <code>scores[1]</code>, <code>scores[2]</code>…</div></details>
      </article>
    </div>
  `;

  roadmap.parentNode.insertBefore(bridge, roadmap);
});
