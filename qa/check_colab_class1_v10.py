#!/usr/bin/env python3
"""QA gate for Statistics 11 Colab Class 01 V10.

Class 01 is intentionally narrow: basic operations, core Python data types,
and basic list/array indexing. It must not reintroduce loops, functions,
conditions, Pandas, or advanced data analysis stages.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / "actividad-colab-01"
MASTER = ROOT / "maestro"
MIGRATION = ROOT / "supabase" / "migrations" / "20260820151529_colab_class1_v10_operations_types_arrays_master_controls.sql"

index = (LAB / "index.html").read_text(encoding="utf-8")
app = (LAB / "app.js").read_text(encoding="utf-8")
config = (LAB / "config.js").read_text(encoding="utf-8")
resilience = (LAB / "resilience-v7.js").read_text(encoding="utf-8")
sw = (LAB / "sw-v7.js").read_text(encoding="utf-8")
choice_css = (LAB / "class1-v10.css").read_text(encoding="utf-8")
master_index = (MASTER / "index.html").read_text(encoding="utf-8")
master_app = (MASTER / "app.js").read_text(encoding="utf-8")
master_config = (MASTER / "config.js").read_text(encoding="utf-8")
master_css = (MASTER / "master-v10.css").read_text(encoding="utf-8")
migration = MIGRATION.read_text(encoding="utf-8")


def require(value: bool, message: str) -> None:
    if not value:
        raise AssertionError(message)


# Student identity: institutional email must be visible in static HTML, not only
# injected later by JavaScript.
require(index.count('type="email"') >= 3, "Institutional email inputs must be baked into student HTML")
require(index.count('@ijr.edu.co') >= 5, "Student page must visibly explain the @ijr.edu.co identity rule")
require('pattern="[A-Za-z0-9.' in index and 'ijr\\.edu\\.co' in index, "HTML email-domain pattern missing")
require("institutionalEmailDomain: 'ijr.edu.co'" in config, "Institutional domain missing from config")
require("student_learning_activity_start_team_email" in config, "Email registration RPC missing")
require("p_student_emails:emails" in app, "Student app must send institutional emails directly")
require("active-v10" in config, "Class 01 V10 must use a fresh session key")
require("student_learning_activity_start_team_email" in resilience, "Network retry adapter must retain email start RPC")

# Narrow first-class curriculum contract.
require("statistics11-colab-class1-basics-types-arrays-2026" in config, "Wrong Class 01 activity slug")
require("36 GUIDED MIN" in index, "Class pacing label must remain 36 guided minutes")
require("No loops, functions, conditions or Pandas" in index, "Scope boundary must be explicit on student page")
require(app.count("mode:'choice'") == 4, "Class 01 must contain exactly four multiple-choice stages")
for fragment in (
    "01 · BASIC OPERATIONS",
    "02 · DATA TYPES",
    "03 · ARRAYS / LISTS",
    "int, float, str, bool and NoneType",
    "scores[0]",
    "names[1]",
    "choices:['7','11','14','16']",
    "choices:['int','float','str','bool']",
):
    require(fragment in app, f"Class 01 curriculum fragment missing: {fragment}")
for forbidden in (
    "PYTHON BASICS · FOR LOOP",
    "def mean(values)",
    "pd.read_csv",
    "if passed_count",
    "PANDAS · CSV",
):
    require(forbidden not in app, f"Advanced topic accidentally reintroduced: {forbidden}")
require("choicePanel" in index and "choiceOptions" in index, "Multiple-choice UI container missing")
require(".choice-option" in choice_css and ".choice-option.selected" in choice_css, "Multiple-choice visual states missing")

# Backend curriculum + master-control contract.
for fragment in (
    "statistics11-colab-class1-basics-types-arrays-2026",
    "teacher_learning_activity_dashboard_v10",
    "teacher_learning_activity_detail_v10",
    "teacher_learning_activity_update_registration_v10",
    "teacher_learning_activity_delete_v10",
    "learning_activity_teacher_audit",
    "split_part(v_email,'@',2)<>'ijr.edu.co'",
    "delete from public.learning_activity_attempts where id=p_attempt_id",
):
    require(fragment in migration, f"V10 migration contract missing: {fragment}")
require(migration.count("('A") >= 8, "Migration must define eight Class 01 checkpoints")
require("Repeat with for" not in migration and "Pandas" not in migration, "Advanced V8 checkpoint leaked into V10 migration")

# Master stays compact but gains explicit teacher controls.
for fragment in (
    "teacher_learning_activity_dashboard_v10",
    "teacher_learning_activity_detail_v10",
    "teacher_learning_activity_update_registration_v10",
    "teacher_learning_activity_delete_v10",
):
    require(fragment in master_config, f"Master config missing {fragment}")
require(master_index.count("<th>") == 9, "Master should have 9 compact columns including Actions")
require("<th>Actions</th>" in master_index, "Actions column missing")
require("registrationDialog" in master_index, "Registration detail/edit dialog missing")
require("Save registration" in master_index and "Delete registration" in master_index, "Master edit/delete controls missing")
require("data-action=\"inspect\"" in master_app and "data-action=\"edit\"" in master_app and "data-action=\"delete\"" in master_app, "Master row actions missing")
require("POLL_VISIBLE_MS=3000" in master_app, "Live master refresh must remain 3 seconds")
require("detailResponses" in master_app and "expected_answer" in master_app, "Detailed stage inspection missing")
require("@ijr\\.edu\\.co" in master_app, "Master edit validation must enforce institutional email")
require(".master-dialog" in master_css and ".row-actions" in master_css, "Master V10 action styles missing")

# Cache invalidation prevents old V9 registration/curriculum shell from surviving.
require("ijr-stat11-colab-class1-v10-20260820" in sw, "V10 cache generation missing")
require("./class1-v10.css" in sw, "Multiple-choice CSS must be part of offline shell")
require("networkFirst(request)" in sw, "Control files must remain network-first")

print("COLAB CLASS 01 V10 QA PASS")
print("email_static=PASS operations=PASS types=PASS arrays=PASS mcq=4 no_loops=PASS master_inspect_edit_delete=PASS cache_refresh=PASS")
