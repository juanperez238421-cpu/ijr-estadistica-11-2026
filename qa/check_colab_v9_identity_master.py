#!/usr/bin/env python3
"""QA gate for Colab Lab 01 V9 institutional identity + minimal master panel."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / "actividad-colab-01"
MASTER = ROOT / "maestro"
MIGRATION = ROOT / "supabase" / "migrations" / "20260820144500_colab_v9_institutional_email_minimal_master.sql"
REPEAT_MIGRATION = ROOT / "supabase" / "migrations" / "20260820150000_colab_v9_repeat_registration_session_index.sql"

config = (LAB / "config.js").read_text(encoding="utf-8")
resilience = (LAB / "resilience-v7.js").read_text(encoding="utf-8")
master_config = (MASTER / "config.js").read_text(encoding="utf-8")
master_index = (MASTER / "index.html").read_text(encoding="utf-8")
master_app = (MASTER / "app.js").read_text(encoding="utf-8")
master_css = (MASTER / "styles.css").read_text(encoding="utf-8")
migration = MIGRATION.read_text(encoding="utf-8")
repeat_migration = REPEAT_MIGRATION.read_text(encoding="utf-8")


def require(value: bool, message: str) -> None:
    if not value:
        raise AssertionError(message)


# Student identity contract.
require("institutionalEmailDomain: 'ijr.edu.co'" in config, "Institutional domain missing from config")
require("student_learning_activity_start_team_email" in config, "Email registration RPC not configured")
require("active-v9" in config, "V9 must use a fresh browser session key")
require("input.type = 'email'" in resilience, "Registration inputs must become email fields")
require("@ijr\\.edu\\.co" in resilience, "Browser-side institutional domain pattern missing")
require("p_student_emails=startParams.p_student_names" in resilience, "RPC adapter must send institutional emails")
require("student_learning_activity_start_team_email" in resilience, "New start RPC must keep safe network retry")

# Backend contract: domain enforced server-side, retries idempotent, new registrations repeatable.
for fragment in (
    "add column if not exists institutional_email text",
    "add column if not exists email_normalized text",
    "split_part(v_email,'@',2) <> 'ijr.edu.co'",
    "session_id=p_session_id",
    "repeat_registration_allowed',true",
    "teacher_learning_activity_dashboard_v9",
    "'institutional_email',m.institutional_email",
):
    require(fragment in migration, f"Migration missing required V9 contract: {fragment}")
require("already registered in another team" not in migration, "V9 must allow later/repeat registrations")
require("drop index if exists public.learning_activity_guest_identity_uq" in repeat_migration, "Old one-registration guest index must be removed")
require("learning_activity_guest_identity_session_uq" in repeat_migration, "Session-scoped unique index is missing")
require("student_name_normalized, session_id" in repeat_migration, "Repeat registration must be unique by session, not by student/team identity alone")

# Minimal master UI contract.
require("teacher_learning_activity_dashboard_v9" in master_config, "Master panel must use compact V9 dashboard RPC")
require("Registrations" in master_index and "Active only" in master_index, "Minimal controls are missing")
require("Permutaciones" not in master_index, "Old dense exam column must be removed from Colab live panel")
require("teamBoard" not in master_index, "Old team-card board must be removed")
require(master_index.count("<th>") == 8, "Minimal panel should have exactly 8 table columns")
require("snapshot?.sessions" in master_app, "Master app must render session-first data")
require("institutional_email" in master_app, "Master panel must show institutional emails")
require("POLL_VISIBLE_MS=3000" in master_app, "Live refresh must remain 3 seconds")
require("min-width:980px" in master_css, "Compact table width contract missing")
require("min-width:1460px" not in master_css, "Old oversized table layout must be gone")

# Guard against accidental reintroduction of a huge roster-centric panel.
require(len(master_index) < 5500, "Master HTML is becoming too dense again")
require(len(master_css) < 9000, "Master CSS is becoming too complex again")

print("COLAB V9 IDENTITY + MINIMAL MASTER QA PASS")
print("institutional_email=PASS repeat_registration=PASS idempotent_retry=PASS minimal_master=PASS live_3s=PASS")
