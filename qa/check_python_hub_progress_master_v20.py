from pathlib import Path

root = Path(__file__).resolve().parents[1]
index = (root / 'python' / 'index.html').read_text(encoding='utf-8')
config = (root / 'python' / 'config-v2.js').read_text(encoding='utf-8')
router = (root / 'python' / 'hub-router.js').read_text(encoding='utf-8')
master_html = (root / 'python' / 'master' / 'index.html').read_text(encoding='utf-8')
master_js = (root / 'python' / 'master' / 'app.js').read_text(encoding='utf-8')
master_css = (root / 'python' / 'master' / 'styles.css').read_text(encoding='utf-8')
gateway = (root / 'supabase' / 'functions' / 'teacher-auth-gateway' / 'index.ts').read_text(encoding='utf-8')
migration = (root / 'supabase' / 'migrations' / '20260826134800_python_hub_master_mfa_and_pinless_v20.sql').read_text(encoding='utf-8')
recovery = (root / 'supabase' / 'migrations' / '20260826134900_python_hub_one_time_recovery_v20.sql').read_text(encoding='utf-8')

# Active student flow: no reusable progress PIN/code UI.
assert 'id="progressCode"' not in index
assert 'resumeCodeNotice' not in index
assert '8-character' not in index
assert 'No progress PIN' in index
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

# Secure teacher page: Supabase Auth + MFA AAL2, no master code.
assert 'noindex,nofollow,noarchive,nosnippet' in master_html
assert 'master PIN' in master_html
assert 'teacherCode' not in master_html
for marker in [
    'signInWithOtp', 'verifyOtp', 'getAuthenticatorAssuranceLevel', 'mfa.listFactors',
    'mfa.enroll', 'mfa.challenge', 'mfa.verify', "gateway('python_hub_dashboard')",
    "gateway('python_hub_issue_recovery'", 'Authorization', 'Bearer',
]:
    assert marker in master_js, f'Missing secure master marker: {marker}'

# All course topics are represented in the per-student master table.
for slug in ['operations','types','arrays','logic','conditions','loops','functions','statistics']:
    assert f"'{slug}'" in master_js, f'Missing master topic: {slug}'
for marker in ['Legacy Variable Types', 'Needs identity review', 'Current Hub registrations', 'Team registrations']:
    assert marker in master_html or marker in master_js, f'Missing progress master UI: {marker}'

# One-time recovery, not reusable PIN.
assert "interval '10 minutes'" in recovery
assert 'redeemed_at' in recovery and 'revoked_at' in recovery
assert 'python_hub_teacher_issue_recovery_v1' in recovery
assert 'python_hub_recover_v1' in recovery
assert 'access_token_hash' in recovery
assert 'progress_code_hash' not in recovery

# Teacher data only through AAL2-protected RPC/gateway.
assert 'private.is_teacher_aal2()' in migration
assert 'python_hub_teacher_master_v2' in migration
assert 'private.python_hub_teacher_allowlist' in migration
assert 'python_hub_provision_teacher_profile' in migration
assert 'python_hub_dashboard' in gateway and 'python_hub_teacher_master_v2' in gateway
assert 'python_hub_issue_recovery' in gateway and 'python_hub_teacher_issue_recovery_v1' in gateway
assert 'currentLevel!=="aal2"' in gateway
assert 'teacher_auth_gateway_audit' in gateway
assert 'serviceRoleKey' in gateway
assert 'SUPABASE_SERVICE_ROLE_KEY' not in master_js + master_html + config

# Sensitive answer keys must never be sent to the teacher/student frontend.
for content in [master_js, master_html, router, config]:
    assert 'expected_text' not in content
    assert 'python_hub_workshop_keys' not in content

# Classroom/readability + responsive safeguards.
assert 'min-width:1320px' in master_css
assert '@media(max-width:760px)' in master_css
assert '@media(prefers-reduced-motion:reduce)' in master_css

print('PYTHON HUB PROGRESS MASTER V20 QA PASS')
print('pinless_registration=PASS team_progress=PASS one_time_recovery=PASS teacher_auth=EMAIL+MFA_AAL2 master=8_TOPICS legacy_types=SEPARATE identity_review=PASS')
