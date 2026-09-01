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
auth_migration = (root / 'supabase' / 'migrations' / '20260902101500_python_hub_student_password_auth_v31.sql').read_text(encoding='utf-8')

# V31 student entry: institutional email first, password second.
for marker in [
    'id="identityStepForm"',
    'id="studentEmail"',
    'id="passwordStepForm"',
    'id="studentPassword"',
    'id="studentPasswordConfirm"',
    'Continue to password',
    'First access · Create your password',
    'I already have a password',
    'Sign out · Switch student',
]:
    assert marker in index, f'Missing authenticated student-flow marker: {marker}'

assert index.count('type="password"') >= 2
assert 'Do not use your TI, cédula, identity/document number' in index
assert 'Individual · 1 student' not in index
assert 'Team · 2–3 students' not in index

# Browser configuration must use the authenticated account RPC, not legacy anonymous registration.
assert "studentAccount: 'python_hub_student_account_v1'" in config
assert "register: 'python_hub_register_v3'" not in config
assert "recover: 'python_hub_recover_v1'" in config
assert 'pendingAuthStorageKey' in config
assert 'progressCodeStorageKey' not in config

# Supabase Auth is the mandatory Hub-entry gate.
for marker in [
    'persistSession:true',
    'autoRefreshToken:true',
    'client.auth.getSession()',
    'client.auth.signUp',
    'client.auth.signInWithPassword',
    'client.auth.signOut()',
    'config.rpc.studentAccount',
    'studentPasswordConfirm',
    'validatePassword',
]:
    assert marker in router, f'Missing authenticated router contract: {marker}'
assert 'config.rpc.register' not in router
assert 'python_hub_register_v3' not in router
assert 'p_progress_code' not in router

# Password rules prevent the intended credential from being a numeric personal document number.
assert "password.length<8" in router
assert '/[A-Za-z]/.test(password)' in router
assert '/[0-9]/.test(password)' in router
assert "password!==confirmation" in router

# Backend must require confirmed Auth identity and attach stable student identity progress.
for marker in [
    "v_uid uuid := auth.uid()",
    'email_confirmed_at',
    "split_part(v_email,'@',2)<>'ijr.edu.co'",
    'python_hub_ensure_student_identity_v29',
    'student_identity_id',
    'revoke execute on function public.python_hub_register_v3',
    'grant execute on function public.python_hub_student_account_v1',
]:
    assert marker in auth_migration, f'Missing auth migration protection: {marker}'
assert 'from anon' in auth_migration
assert 'from authenticated' in auth_migration

# The first three curriculum topics remain available after a verified account enters the Hub.
assert "t.sequence_no in (1,2,3)" in release
assert "when t.sequence_no in (1,2,3)" in release
assert "where prev.sequence_no=t.sequence_no-1" in release
assert 'Arrays becomes available immediately' in release

# Teacher master still uses a server-verified code session. Plaintext master code must never be in GitHub.
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

# Recovery remains short-lived for teacher emergency use; it is no longer the normal student cross-device flow.
assert "interval '10 minutes'" in recovery
assert 'redeemed_at' in recovery and 'revoked_at' in recovery
assert 'python_hub_teacher_issue_recovery_v1' in recovery
assert 'python_hub_recover_v1' in recovery
assert 'access_token_hash' in recovery
assert 'progress_code_hash' not in recovery

# Sensitive backend material must never be sent to teacher/student frontend source.
for content in [master_js, master_html, master_config, router, config]:
    assert 'expected_text' not in content
    assert 'python_hub_workshop_keys' not in content
    assert 'SUPABASE_SERVICE_ROLE_KEY' not in content

# Classroom/readability + responsive safeguards remain unchanged.
assert 'min-width:1320px' in master_css
assert '@media(max-width:760px)' in master_css
assert '@media(prefers-reduced-motion:reduce)' in master_css

print('PYTHON HUB AUTH + PROGRESS MASTER V31 QA PASS')
print('student_auth=PASS email_first=PASS double_password=PASS ti_not_credential=PASS legacy_register_browser_access=REVOKED identity_progress=PASS teacher_master=SERVER_CODE_SESSION')
