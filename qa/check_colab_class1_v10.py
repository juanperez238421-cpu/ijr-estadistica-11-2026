#!/usr/bin/env python3
"""QA gate for Statistics 11 Colab Class 01 V12.

The graded curriculum remains intentionally narrow: basic operations, core Python
data types, and basic list/array indexing. V11 keeps the server-side 36-pack
randomized bank. V12 improves instructional clarity and adds a non-graded Python
command reference without changing answers, scoring, pack allocation, or RPCs.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / "actividad-colab-01"
MASTER = ROOT / "maestro"
V10_MIGRATION = ROOT / "supabase" / "migrations" / "20260820151529_colab_class1_v10_operations_types_arrays_master_controls.sql"
V11_MIGRATION = ROOT / "supabase" / "migrations" / "20260820154120_colab_class1_v11_random_variant_bank_36packs.sql"
V12_MIGRATION = ROOT / "supabase" / "migrations" / "20260826130029_colab_class1_v12_explicit_guidance_prompts.sql"

index = (LAB / "index.html").read_text(encoding="utf-8")
app = (LAB / "app.js").read_text(encoding="utf-8")
config = (LAB / "config.js").read_text(encoding="utf-8")
resilience = (LAB / "resilience-v7.js").read_text(encoding="utf-8")
sw = (LAB / "sw-v7.js").read_text(encoding="utf-8")
choice_css = (LAB / "class1-v10.css").read_text(encoding="utf-8")
guidance_js = (LAB / "guidance-v12.js").read_text(encoding="utf-8")
guidance_css = (LAB / "guidance-v12.css").read_text(encoding="utf-8")
master_index = (MASTER / "index.html").read_text(encoding="utf-8")
master_app = (MASTER / "app.js").read_text(encoding="utf-8")
master_config = (MASTER / "config.js").read_text(encoding="utf-8")
master_css = (MASTER / "master-v10.css").read_text(encoding="utf-8")
v10_migration = V10_MIGRATION.read_text(encoding="utf-8")
v11_migration = V11_MIGRATION.read_text(encoding="utf-8")
v12_migration = V12_MIGRATION.read_text(encoding="utf-8")


def require(value: bool, message: str) -> None:
    if not value:
        raise AssertionError(message)


# Institutional identity remains visible and server-backed.
require(index.count('type="email"') >= 3, "Institutional email inputs must be baked into student HTML")
require(index.count('@ijr.edu.co') >= 5, "Student page must visibly explain the @ijr.edu.co identity rule")
require('ijr\\.edu\\.co' in index, "HTML email-domain pattern missing")
require("institutionalEmailDomain: 'ijr.edu.co'" in config, "Institutional domain missing from config")
require("p_student_emails:emails" in app, "Student app must send institutional emails directly")
require("student_learning_activity_start_team_email" in resilience, "Network retry adapter must retain email start RPC compatibility")

# V11 randomized bank contract remains unchanged.
require("active-v11" in config, "V11 persistent attempt key must remain stable")
require("variantBankSize: 36" in config, "36-pack bank size missing from student config")
for rpc in (
    "student_learning_activity_start_team_email_v11",
    "student_learning_activity_resume_v11",
    "student_learning_activity_submit_v11",
    "student_learning_activity_use_help_v11",
    "student_learning_activity_reveal_solution_v11",
    "student_learning_activity_skip_stage_v11",
):
    require(rpc in config, f"Student V11 RPC missing: {rpc}")
require("36 equivalent problem packs" in index, "Student page must explain randomized workstation packs")
require("different numbers and answer options" in index, "Student page must explain what changes between packs")
require("cp.code" in app and "cp.choices" in app and "cp?.prompt" in app, "Student UI must render server-assigned variants")
require("variant_pack" in app and "variant_key" in app and "class1-v11" in app, "Variant identity/telemetry missing from student app")
require("PACK ${String(cp.variant_pack" in app, "Assigned pack must be visible during the activity")

# Narrow graded curriculum: same 8-stage architecture, exactly 4 MCQ stages.
require("statistics11-colab-class1-basics-types-arrays-2026" in config, "Wrong Class 01 activity slug")
require("36 GUIDED MIN" in index, "Class pacing label must remain 36 guided minutes")
require("No loops, functions, conditions or Pandas" in index, "Graded scope boundary must remain explicit")
require(app.count("mode:'choice'") == 4, "Class 01 must contain exactly four multiple-choice stage templates")
for fragment in (
    "01 · BASIC OPERATIONS",
    "02 · DATA TYPES",
    "03 · ARRAYS / LISTS",
    "int, float, str, bool and NoneType",
    "scores[0]",
    "values[1]",
    "type(decimal)",
):
    require(fragment in app, f"Class 01 curriculum fragment missing: {fragment}")
for forbidden in (
    "PYTHON BASICS · FOR LOOP",
    "def mean(values)",
    "pd.read_csv",
    "if passed_count",
    "PANDAS · CSV",
):
    require(forbidden not in app, f"Advanced topic accidentally reintroduced into graded app stages: {forbidden}")
require("choicePanel" in index and "choiceOptions" in index, "Multiple-choice UI container missing")
require(".choice-option" in choice_css and ".choice-option.selected" in choice_css, "Multiple-choice visual states missing")

# V12 instructional clarity: workflow must be explicit in both panes and reference must be always accessible.
for fragment in (
    "Edit only the requested part.",
    "Press ▶ Run, then read the console.",
    "edit/select → run if needed → read/check the result → validate",
    "Python commands",
):
    require(fragment in index, f"Explicit student workflow missing from HTML: {fragment}")
for fragment in (
    "Exactly what to do",
    "Replace <b>only</b> <code>WRITE_HERE</code>",
    "Validate output",
    "Python command reference",
    "math.sqrt(x)",
    "a &gt;= b",
    "a == b",
    "condition1 and condition2",
    "condition1 or condition2",
    "not condition",
    "sum(values)",
    "len(values)",
    "sum(values) / len(values)",
    "powers use <code>**</code> not <code>^</code>",
):
    require(fragment in guidance_js, f"V12 command/reference fragment missing: {fragment}")
require(".reference-dialog" in guidance_css and ".student-route-card" in guidance_css, "V12 guidance visual system missing")
require("guidance-v12.css" in index and "guidance-v12.js" in index, "V12 guidance assets are not loaded by the student page")

# V10 teacher mutation foundation stays intact.
for fragment in (
    "teacher_learning_activity_update_registration_v10",
    "teacher_learning_activity_delete_v10",
    "learning_activity_teacher_audit",
    "split_part(v_email,'@',2)<>'ijr.edu.co'",
):
    require(fragment in v10_migration, f"V10 master-control foundation missing: {fragment}")

# V11 bank must be generated server-side and persist one pack per attempt.
for fragment in (
    "learning_activity_variant_bank",
    "learning_activity_attempt_variant_pack",
    "generate_series(1,36)",
    "pg_advisory_xact_lock",
    "least_used_random_4h",
    "interval '4 hours'",
    "student_learning_activity_start_team_email_v11",
    "student_learning_activity_submit_v11",
    "learning_activity_snapshot_v11",
    "teacher_learning_activity_dashboard_v11",
    "teacher_learning_activity_detail_v11",
):
    require(fragment in v11_migration, f"V11 bank contract missing: {fragment}")
for key in range(1, 9):
    require(f"('A{key}'" in v11_migration, f"Variant generator missing A{key}")
require("pack_no smallint not null check (pack_no between 1 and 36)" in v11_migration, "Pack range constraint missing")
require("primary key(activity_id,checkpoint_key,pack_no)" in v11_migration, "Variant uniqueness key missing")
require("attempt_id uuid primary key" in v11_migration, "Attempt must have one persistent pack")
require("order by coalesce(u.uses,0),random()" in v11_migration, "Least-used random allocation missing")
require("expected_text'," not in re.search(r"create or replace function public\.learning_activity_snapshot_v11.*?\$function\$;", v11_migration, re.S).group(0), "Student V11 snapshot must not expose expected answers")

# V12 backend migration may clarify prompts/hints only; it must not touch grading or answers.
for fragment in (
    "STEP-BY-STEP",
    "Replace only WRITE_HERE",
    "Syntax template: result = a + b",
    "guidance_version",
    "explicit_steps",
):
    require(fragment in v12_migration, f"V12 backend guidance migration missing: {fragment}")
for forbidden in (
    "expected_text =",
    "points =",
    "pack_no =",
    "delete from",
    "create or replace function",
):
    require(forbidden not in v12_migration.lower(), f"V12 guidance migration must not change scoring/allocation behavior: {forbidden}")

# Master remains compact, variant-aware, and keeps edit/delete actions.
require("teacher_learning_activity_dashboard_v11" in master_config, "Master must use V11 dashboard")
require("teacher_learning_activity_detail_v11" in master_config, "Master must use V11 detail")
require("teacher_learning_activity_update_registration_v10" in master_config, "Master edit action missing")
require("teacher_learning_activity_delete_v10" in master_config, "Master delete action missing")
require(master_index.count("<th>") == 9, "Master should remain a compact 9-column panel")
require("<th>Actions</th>" in master_index and "registrationDialog" in master_index, "Master actions/detail dialog missing")
require("data-action=\"inspect\"" in master_app and "data-action=\"edit\"" in master_app and "data-action=\"delete\"" in master_app, "Master row actions missing")
require("expected_answer" in master_app, "Master detail must show the variant-specific expected answer")
require("POLL_VISIBLE_MS=3000" in master_app, "Live master refresh must remain 3 seconds")
require(".master-dialog" in master_css and ".row-actions" in master_css, "Master action styles missing")

# V12 cache invalidation prevents classroom PCs from keeping stale guidance assets.
require("ijr-stat11-colab-class1-v12-20260826" in sw, "V12 cache generation missing")
for asset in ("./class1-v10.css", "./guidance-v12.css", "./guidance-v12.js"):
    require(asset in sw, f"V12 offline shell missing asset: {asset}")
require("networkFirst(request)" in sw, "Control files must remain network-first")

print("COLAB CLASS 01 V12 EXPLICIT GUIDANCE QA PASS")
print("email=PASS scope=PASS packs=36 mcq=4 guidance=PASS python_reference=PASS backend_prompts=PASS master=PASS cache=PASS")
