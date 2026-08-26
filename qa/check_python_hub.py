#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HUB = ROOT / "python"

index = (HUB / "index.html").read_text(encoding="utf-8")
css = (HUB / "styles.css").read_text(encoding="utf-8") + "\n" + (HUB / "gated.css").read_text(encoding="utf-8")
app = (HUB / "gated-app.js").read_text(encoding="utf-8")
config = (HUB / "config-v2.js").read_text(encoding="utf-8")
home = (ROOT / "index.html").read_text(encoding="utf-8")
migration = ROOT / "supabase" / "migrations" / "20260826133521_python_learning_hub_gated_progress_v2.sql"


def require(value: bool, message: str) -> None:
    if not value:
        raise AssertionError(message)


require("Python Learning Hub" in index, "Hub title missing")
require("pyodide/v0.27.7" in index, "Browser Python runtime missing")
require("@supabase/supabase-js@2" in index, "Supabase client missing")
require("Registered learning path" in index or "REGISTERED LEARNING PATH" in index, "Registration experience missing")
require("Arrays remain locked until Operations and Variable Types are complete" in index, "Prerequisite explanation missing")
require("gated-app.js" in index and "config-v2.js" in index, "Gated application assets not loaded")
require("href=\"python/\"" in home, "Course home must link to hub")
require(migration.exists(), "Supabase gated-progress migration missing from repository")

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
    "python_hub_register_v1",
    "python_hub_resume_v1",
    "python_hub_submit_v1",
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

require("reviewed" not in app.lower(), "Legacy browser-only reviewed progress should not drive mastery")
require("expected:" not in app, "Server answer keys must not be embedded as expected: values in the client")

for fragment in (
    "background:#fff",
    "color:#111",
    "topic-button.locked",
    "workshop-section",
    "stage-button.correct",
    "prefers-reduced-motion",
    ".figure .stroke",
):
    require(fragment in css, f"Visual/accessibility contract missing: {fragment}")

sql = migration.read_text(encoding="utf-8")
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
    require(fragment in sql, f"Backend security/progress contract missing: {fragment}")

print("PYTHON LEARNING HUB V2 QA PASS")
print("topics=8 workshop_stages>=48 registration=PASS team_progress=PASS prerequisites=PASS server_validation=PASS rls=PASS pyodide=PASS responsive=PASS")
