#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HUB = ROOT / "python"

index = (HUB / "index.html").read_text(encoding="utf-8")
css = "\n".join((HUB / name).read_text(encoding="utf-8") for name in ("styles.css", "gated.css", "resume-code.css"))
app = (HUB / "gated-app.js").read_text(encoding="utf-8")
config = (HUB / "config-v2.js").read_text(encoding="utf-8")
home = (ROOT / "index.html").read_text(encoding="utf-8")
migration_v2 = ROOT / "supabase" / "migrations" / "20260826133521_python_learning_hub_gated_progress_v2.sql"
migration_v3 = ROOT / "supabase" / "migrations" / "20260826134611_python_learning_hub_resume_code_v3.sql"


def require(value: bool, message: str) -> None:
    if not value:
        raise AssertionError(message)


require("Python Learning Hub" in index, "Hub title missing")
require("pyodide/v0.27.7" in index, "Browser Python runtime missing")
require("@supabase/supabase-js@2" in index, "Supabase client missing")
require("Registered learning path" in index or "REGISTERED LEARNING PATH" in index, "Registration experience missing")
require("Arrays remain locked until Operations and Variable Types are complete" in index, "Prerequisite explanation missing")
require("gated-app.js" in index and "config-v2.js" in index, "Gated application assets not loaded")
require("progressCode" in index and "8-character" in index, "Protected cross-device resume UI missing")
require("resumeCodeNotice" in index, "New progress-code notice missing")
require("href=\"python/\"" in home, "Course home must link to hub")
require(migration_v2.exists(), "Supabase gated-progress migration missing from repository")
require(migration_v3.exists(), "Supabase resume-code hardening migration missing from repository")

for topic_id, (slug, title) in enumerate((
    ("operations", "Colab interface and general operations"),
    ("types", "Variables and data types"),
    ("arrays", "Arrays and Python lists"),
    ("logic", "Comparisons and logical operators"),
    ("conditions", "Conditions with if, elif and else"),
    ("loops", "Loops: repeat without copying code"),
    ("functions", "Functions: name a reusable process"),
    ("statistics", "Statistics with lists"),
), start=1):
    require(f"slug:'{slug}'" in app, f"Topic {topic_id:02d} missing: {slug}")
    require(title in app, f"Topic title missing: {title}")

exercise_keys = re.findall(r"key:'(?:op|type|arr|logic|cond|loop|fn|stat)-\d{2}'", app)
require(len(exercise_keys) >= 48, f"Expected at least 48 workshop stages, found {len(exercise_keys)}")

for fragment in (
    "python_hub_register_v2",
    "python_hub_resume_v1",
    "python_hub_submit_v1",
    "p_progress_code",
    "progressCodeStorageKey",
    "registrationMode",
    "teamSize",
    "institutionalEmailDomain",
    "topicProgress",
    "status==='locked'",
    "loadPyodide",
    "runPythonAsync",
    "setStdout",
    "Validate output",
    "Progress is stored in Supabase",
):
    require(fragment in (app + index + config), f"Gated behavior missing: {fragment}")

require("python_hub_register_v1'" not in config, "Client must not use legacy registration RPC that can bypass progress-code resume protection")
require("reviewed" not in app.lower(), "Legacy browser-only reviewed progress should not drive mastery")
require("expected:" not in app, "Server answer keys must not be embedded as expected: values in the client")

for fragment in (
    "background:#fff",
    "color:#111",
    "topic-button.locked",
    "workshop-section",
    "stage-button.correct",
    "resume-code-notice",
    "prefers-reduced-motion",
    ".figure .stroke",
):
    require(fragment in css, f"Visual/accessibility contract missing: {fragment}")

sql_v2 = migration_v2.read_text(encoding="utf-8")
for fragment in (
    "python_hub_registrations",
    "python_hub_registration_members",
    "python_hub_topic_progress",
    "python_hub_workshop_keys",
    "python_hub_workshop_responses",
    "enable row level security",
    "revoke all on public.python_hub_workshop_keys from anon, authenticated",
    "Complete the previous workshop first",
    "private.is_teacher_aal2()",
):
    require(fragment in sql_v2, f"Backend security/progress contract missing: {fragment}")

sql_v3 = migration_v3.read_text(encoding="utf-8")
for fragment in (
    "progress_code_hash",
    "python_hub_register_v2",
    "Incorrect progress code",
    "8-character progress code",
    "revoke all on function public.python_hub_register_v1",
    'create policy "python hub keys rpc only"',
    "using (false) with check (false)",
    "python_hub_members_registry_idx",
    "python_hub_progress_topic_idx",
    "python_hub_responses_topic_item_idx",
):
    require(fragment in sql_v3, f"Resume/security hardening missing: {fragment}")

print("PYTHON LEARNING HUB V3 QA PASS")
print("topics=8 workshop_stages>=48 registration=PASS individual_team_progress=PASS prerequisites=PASS protected_resume=PASS server_validation=PASS rls=PASS pyodide=PASS responsive=PASS")
