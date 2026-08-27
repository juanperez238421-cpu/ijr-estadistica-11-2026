from pathlib import Path

root = Path(__file__).resolve().parents[1]
index = (root / 'python' / 'index.html').read_text(encoding='utf-8')
config = (root / 'python' / 'config-v2.js').read_text(encoding='utf-8')
router = (root / 'python' / 'hub-router.js').read_text(encoding='utf-8')
master_html = (root / 'python' / 'master' / 'index.html').read_text(encoding='utf-8')
master_js = (root / 'python' / 'master' / 'app.js').read_text(encoding='utf-8')
master_config = (root / 'python' / 'master' / 'config.js').read_text(encoding='utf-8')
master_css = (root / 'python' / 'master' / 'styles.css').read_text(encoding='utf-8')
recovery = (root / 'supabase' / 'migrations' / '20260826134900_python_hub_one_time_recovery_v20.sql').read_text(encoding='utf-8')
release = (root / 'supabase' / 'migrations' / '20260827121505_rotate_python_hub_master_code_and_open_first_three_topics.sql').read_text(encoding='utf-8')

# Active student flow: no reusable progress PIN/code UI.
assert 'id="progressCode"' not in index
assert 'resumeCodeNotice' not in index
assert '8-character progress code' not in index
assert 'Switch registration' in index
assert "register: 'python_hub_register_v3'" in config
assert "recover: 'python_hub_recover_v1'" in config
assert 'sessionVaultKey' in config
assert 'progressCodeStorageKey' not in config
assert 'p_progress_code' not in router
assert 'getVault()' in router and 'fingerprint(group,emails)' in router
assert 'recoverRegistration' in router
assert "fragment.get('recover')" in router

# Team progress must remain one exact registration for 1 / 2 / 3 students.
for marker in ['Individual · 1 student', 'Team · 2–3 students', 'Students at this computer', 'every student in that team']:
    assert marker in index, f'Missing team registration marker: {marker}'

# The first three curriculum topics are available immediately after registration.
assert 'Operations, Variable Types and Arrays are available immediately after registration' in index
assert 'The first three topics are open from the moment you register' in index
assert "t.sequence_no in (1,2,3)" in release
assert "when t.sequence_no in (1,2,3)" in release
assert "where prev.sequence_no=t.sequence_no-1" in release
assert 'Arrays becomes available immediately' in release

# Teacher master uses a server-verified code session. The plaintext code must never be in GitHub.
assert 'noindex,nofollow,noarchive,nosnippet' in master_html
assert 'id="teacherCode"' in master_html
assert 'Master code → server-side SHA-256 comparison' in master_html
assert 'teacher_code_login' in master_config
assert 'teacher_code_logout' in master_config
assert 'python_hub_teacher_master_code_v1' in master_config
assert 'p_code:code' in master_js
assert 'sessionStorage' in master_js
assert '9109' not in master_html + master_js + master_config + release
assert 'd8c4d37261d7aaa4bbafe4ccfe334e09fbe181c84de22e9a561dfe02b0958aa0' in release
assert 'update public.teacher_code_sessions' in release and 'active=false' in release

# All course topics are represented in the per-student master table.
for slug in ['operations','types','arrays','logic','conditions','loops','functions','statistics']:
    assert f"'{slug}'" in master_js, f'Missing master topic: {slug}'
for marker in ['Legacy Variable Types', 'Needs identity review', 'Current Hub registrations']:
    assert marker in master_html or marker in master_js, f'Missing progress master UI: {marker}'
assert 'Operations, Variable Types and Arrays are available immediately after registration' in master_html

# One-time student recovery remains short-lived and unrelated to the teacher master code.
assert "interval '10 minutes'" in recovery
assert 'redeemed_at' in recovery and 'revoked_at' in recovery
assert 'python_hub_teacher_issue_recovery_v1' in recovery
assert 'python_hub_recover_v1' in recovery
assert 'access_token_hash' in recovery
assert 'progress_code_hash' not in recovery

# Sensitive backend material must never be sent to the teacher/student frontend.
for content in [master_js, master_html, master_config, router, config]:
    assert 'expected_text' not in content
    assert 'python_hub_workshop_keys' not in content
    assert 'SUPABASE_SERVICE_ROLE_KEY' not in content

# Classroom/readability + responsive safeguards.
assert 'min-width:1320px' in master_css
assert '@media(max-width:760px)' in master_css
assert '@media(prefers-reduced-motion:reduce)' in master_css

print('PYTHON HUB PROGRESS MASTER V21 QA PASS')
print('student_pinless=PASS team_progress=PASS first_three_open=PASS one_time_recovery=PASS teacher_master=SERVER_CODE_SESSION master_code_plaintext=ABSENT topics=8')
