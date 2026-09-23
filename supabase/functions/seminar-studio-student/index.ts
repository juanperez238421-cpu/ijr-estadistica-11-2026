import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const COURSE_SLUG = "seminar11-software-engineering-studio-2026";
const DIAGNOSTIC_BANK_CURRENT = "2026-09-16-v5";
const DIAGNOSTIC_BANKS = new Set([
  "2026-09-05-v3",
  "2026-09-16-v4",
  DIAGNOSTIC_BANK_CURRENT,
]);
const allowedOrigins = new Set([
  "https://juanperez238421-cpu.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);
const TRACKS: Record<string, string> = {
  "Web Development": "web",
  "Python & Data Science": "data-science",
  "Defensive Cybersecurity": "cybersecurity",
  "3D Design + Programming": "3d-programming",
  "Robotics & Automation": "robotics",
};
const TRACK_SLUGS = new Set(Object.values(TRACKS));
const TOPICS = new Set(Object.keys(TRACKS));
const GROUPS = new Set(["11-A", "11-B", "11-C"]);
const MODES = new Set(["Individual", "Pareja"]);
const LEARNING_EVENTS = new Set(["theory_opened", "workshop_opened", "workshop_completed"]);

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : "null",
    "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
}
function json(origin: string | null, status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: cors(origin) });
}
function text(v: unknown, max: number) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
function nullableText(v: unknown, max: number) {
  const x = text(v, max);
  return x || null;
}
async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function validToken(token: string) {
  return /^[a-f0-9]{48,128}$/i.test(token);
}
function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function normalizeRosterName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
async function findRosterStudent(admin: any, groupCode: string, fullName: string) {
  const rosterGroup = groupCode.replace(/-/g, "");
  const { data, error } = await admin
    .from("student_registry")
    .select("id,display_name,group_code")
    .eq("active", true)
    .eq("group_code", rosterGroup)
    .limit(100);
  if (error) throw error;
  const key = normalizeRosterName(fullName);
  return (data ?? []).find((row: any) => normalizeRosterName(String(row.display_name ?? "")) === key) ?? null;
}
async function releaseState(admin: ReturnType<typeof createClient>) {
  const { data, error } = await admin
    .from("seminar_studio_settings")
    .select("released_sprint,updated_at")
    .eq("course_slug", COURSE_SLUG)
    .single();
  if (error || !data) return { released_sprint: 1, release_updated_at: null };
  return { released_sprint: Number(data.released_sprint || 1), release_updated_at: data.updated_at };
}
function publicProfile(row: Record<string, unknown>, release: { released_sprint: number; release_updated_at: unknown }) {
  return {
    response_id: row.response_id,
    full_name: row.full_name,
    group_code: row.group_code,
    topics: row.topics,
    first_choice: row.first_choice,
    track_slug: row.track_slug,
    work_mode: row.work_mode,
    partner_name: row.partner_name,
    project_idea: row.project_idea,
    project_title: row.project_title,
    repo_full_name: row.repo_full_name,
    uml_url: row.uml_url,
    sprint_current: row.sprint_current,
    progress_percent: row.progress_percent,
    next_goal: row.next_goal,
    status: row.status,
    updated_at: row.updated_at,
    released_sprint: release.released_sprint,
    release_updated_at: release.release_updated_at,
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") {
    if (!origin || !allowedOrigins.has(origin)) return json(origin, 403, { error: "origin_denied" });
    return new Response(null, { status: 204, headers: cors(origin) });
  }
  if (req.method !== "POST") return json(origin, 405, { error: "method_not_allowed" });
  if (!origin || !allowedOrigins.has(origin)) return json(origin, 404, { error: "not_found" });

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !serviceRoleKey) return json(origin, 503, { error: "backend_unavailable" });
  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const body = await req.json();
    const action = text(body?.action, 40);
    const release = await releaseState(admin);
    if (action === "release-status") return json(origin, 200, { ok: true, ...release });

    const editToken = text(body?.edit_token, 160);
    if (!validToken(editToken)) return json(origin, 400, { error: "invalid_edit_token" });
    const tokenHash = await sha256(editToken);
    const ipHash = await sha256((req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim());
    const userAgent = (req.headers.get("user-agent") ?? "").slice(0, 1000);

    if (action === "register") {
      const fullName = text(body?.full_name, 140);
      const groupCode = text(body?.group_code, 8);
      const topics = Array.isArray(body?.topics)
        ? body.topics.map((x: unknown) => text(x, 80)).filter((x: string) => TOPICS.has(x))
        : [];
      const firstChoice = text(body?.first_choice, 80);
      const workMode = text(body?.work_mode, 16);
      const partnerName = nullableText(body?.partner_name, 140);
      const projectIdea = nullableText(body?.project_idea, 1200);
      if (
        fullName.length < 3 || !GROUPS.has(groupCode) || topics.length < 1 || topics.length > 5 ||
        !TOPICS.has(firstChoice) || !topics.includes(firstChoice) || !MODES.has(workMode)
      ) return json(origin, 400, { error: "invalid_registration" });
      if (
        (workMode === "Pareja" && (!partnerName || partnerName.length < 3)) ||
        (workMode === "Individual" && partnerName)
      ) return json(origin, 400, { error: "invalid_partner" });

      // Roster matching is best-effort only. Any valid entered name may start the diagnostic.
      // If the name matches the institutional roster, keep the optional registry linkage for analytics.
      const primaryRoster = await findRosterStudent(admin, groupCode, fullName);
      let partnerRoster: any = null;
      if (workMode === "Pareja") {
        partnerRoster = await findRosterStudent(admin, groupCode, partnerName ?? "");
        if (
          normalizeRosterName(partnerName ?? "") === normalizeRosterName(fullName) ||
          (primaryRoster && partnerRoster && partnerRoster.id === primaryRoster.id)
        ) return json(origin, 400, { error: "duplicate_partner" });
      }
      const canonicalFullName = primaryRoster ? String(primaryRoster.display_name) : fullName;
      const canonicalPartnerName = partnerRoster ? String(partnerRoster.display_name) : partnerName;
      const identityVerifiedAt = primaryRoster ? new Date().toISOString() : null;
      const trackSlug = TRACKS[firstChoice];
      const { data: existing } = await admin
        .from("seminar_studio_profiles")
        .select("id,response_id,student_registry_id")
        .eq("edit_token_hash", tokenHash)
        .maybeSingle();
      let row;
      if (existing) {
        const result = await admin.from("seminar_studio_profiles").update({
          full_name: canonicalFullName,
          student_registry_id: primaryRoster?.id ?? null,
          partner_student_registry_id: partnerRoster?.id ?? null,
          identity_verified_at: identityVerifiedAt,
          group_code: groupCode,
          topics,
          first_choice: firstChoice,
          track_slug: trackSlug,
          work_mode: workMode,
          partner_name: workMode === "Pareja" ? canonicalPartnerName : null,
          project_idea: projectIdea,
          updated_at: new Date().toISOString(),
          last_student_activity_at: new Date().toISOString(),
        }).eq("id", existing.id).select().single();
        if (result.error) throw result.error;
        row = result.data;
      } else {
        const result = await admin.from("seminar_studio_profiles").insert({
          edit_token_hash: tokenHash,
          full_name: canonicalFullName,
          student_registry_id: primaryRoster?.id ?? null,
          partner_student_registry_id: partnerRoster?.id ?? null,
          identity_verified_at: identityVerifiedAt,
          group_code: groupCode,
          topics,
          first_choice: firstChoice,
          track_slug: trackSlug,
          work_mode: workMode,
          partner_name: workMode === "Pareja" ? canonicalPartnerName : null,
          project_idea: projectIdea,
        }).select().single();
        if (result.error) throw result.error;
        row = result.data;
      }
      await admin.from("seminar_studio_events").insert({
        profile_id: row.id,
        event_type: "register",
        payload: {
          track_slug: trackSlug,
          group_code: groupCode,
          roster_matched: Boolean(primaryRoster),
          partner_roster_matched: workMode === "Pareja" ? Boolean(partnerRoster) : null,
        },
        ip_hash: ipHash,
        user_agent: userAgent,
      });
      return json(origin, 200, { ok: true, profile: publicProfile(row, release) });
    }

    const { data: profile, error: profileError } = await admin
      .from("seminar_studio_profiles")
      .select("*")
      .eq("edit_token_hash", tokenHash)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return json(origin, 404, { error: "profile_not_found" });

    if (action === "load") {
      await admin.from("seminar_studio_events").insert({
        profile_id: profile.id,
        event_type: "load",
        payload: {},
        ip_hash: ipHash,
        user_agent: userAgent,
      });
      return json(origin, 200, { ok: true, profile: publicProfile(profile, release) });
    }

    if (action === "learning-event") {
      const trackSlug = text(body?.track_slug, 40);
      const stageNo = Number(body?.stage_no);
      const eventType = text(body?.event_type, 40);
      if (
        !TRACK_SLUGS.has(trackSlug) ||
        trackSlug !== String(profile.track_slug ?? "") ||
        !Number.isInteger(stageNo) || stageNo < 1 || stageNo > 4 ||
        !LEARNING_EVENTS.has(eventType)
      ) return json(origin, 400, { error: "invalid_learning_event" });

      const payloadInput = body?.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
        ? body.payload
        : {};
      const payload = {
        track_slug: trackSlug,
        stage_no: stageNo,
        topic_title: text(payloadInput?.topic_title, 180),
        task_count: Number.isInteger(Number(payloadInput?.task_count)) ? Number(payloadInput.task_count) : null,
      };
      const { error } = await admin.from("seminar_studio_events").insert({
        profile_id: profile.id,
        event_type: eventType,
        payload,
        ip_hash: ipHash,
        user_agent: userAgent,
      });
      if (error) throw error;
      return json(origin, 200, { ok: true, event_type: eventType, stage_no: stageNo });
    }

    if (action === "update") {
      const patch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        last_student_activity_at: new Date().toISOString(),
      };
      if (body?.repo_full_name !== undefined) {
        const repo = nullableText(body.repo_full_name, 180);
        if (repo && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) return json(origin, 400, { error: "invalid_repo" });
        patch.repo_full_name = repo;
      }
      if (body?.uml_url !== undefined) {
        const uml = nullableText(body.uml_url, 1000);
        if (uml && !/^https:\/\//i.test(uml)) return json(origin, 400, { error: "invalid_uml_url" });
        patch.uml_url = uml;
      }
      if (body?.project_title !== undefined) patch.project_title = nullableText(body.project_title, 180);
      if (body?.next_goal !== undefined) patch.next_goal = nullableText(body.next_goal, 500);
      if (body?.sprint_current !== undefined) {
        const sprint = Number(body.sprint_current);
        if (!Number.isInteger(sprint) || sprint < 1 || sprint > release.released_sprint) {
          return json(origin, 400, { error: "sprint_not_released", released_sprint: release.released_sprint });
        }
        patch.sprint_current = sprint;
      }
      if (body?.progress_percent !== undefined) {
        const progress = Number(body.progress_percent);
        if (!Number.isInteger(progress) || progress < 0 || progress > 100) return json(origin, 400, { error: "invalid_progress" });
        patch.progress_percent = progress;
      }
      const result = await admin.from("seminar_studio_profiles").update(patch).eq("id", profile.id).select().single();
      if (result.error) throw result.error;
      await admin.from("seminar_studio_events").insert({
        profile_id: profile.id,
        event_type: "student_update",
        payload: {
          sprint_current: result.data.sprint_current,
          progress_percent: result.data.progress_percent,
          released_sprint: release.released_sprint,
        },
        ip_hash: ipHash,
        user_agent: userAgent,
      });
      return json(origin, 200, { ok: true, profile: publicProfile(result.data, release) });
    }

    if (action === "diagnostic-status") {
      const trackSlug = text(body?.track_slug, 40);
      if (!TRACK_SLUGS.has(trackSlug)) return json(origin, 400, { error: "invalid_track" });
      const { data, error } = await admin.rpc("seminar_track_diagnostic_status", {
        p_track_slug: trackSlug,
        p_attempt_token: editToken,
      });
      if (error) throw error;
      return json(origin, 200, data);
    }

    if (action === "diagnostic-questions") {
      const trackSlug = text(body?.track_slug, 40);
      const bankVersion = text(body?.bank_version, 32);
      if (!TRACK_SLUGS.has(trackSlug) || !DIAGNOSTIC_BANKS.has(bankVersion)) {
        return json(origin, 400, { error: "invalid_diagnostic_request" });
      }
      const { data, error } = await admin.rpc("seminar_track_diagnostic_get_questions", {
        p_track_slug: trackSlug,
        p_bank_version: bankVersion,
      });
      if (error) throw error;
      return json(origin, 200, data);
    }

    if (action === "diagnostic-start") {
      const trackSlug = text(body?.track_slug, 40);
      const bankVersion = text(body?.bank_version, 32);
      if (!TRACK_SLUGS.has(trackSlug) || !DIAGNOSTIC_BANKS.has(bankVersion)) {
        return json(origin, 400, { error: "invalid_diagnostic_request" });
      }
      const { data, error } = await admin.rpc("seminar_track_diagnostic_start", {
        p_track_slug: trackSlug,
        p_bank_version: bankVersion,
        p_full_name: String(profile.full_name ?? ""),
        p_group_code: String(profile.group_code ?? ""),
        p_attempt_token: editToken,
        p_user_agent: userAgent,
      });
      if (error) throw error;
      if (data?.attempt_id && profile.student_registry_id) {
        const { error: identityError } = await admin
          .from("seminar_track_diagnostic_attempts")
          .update({ student_registry_id: profile.student_registry_id })
          .eq("id", data.attempt_id);
        if (identityError) throw identityError;
      }
      return json(origin, 200, data);
    }

    if (action === "diagnostic-submit") {
      const attemptId = text(body?.attempt_id, 64);
      const answers = body?.answers;
      if (!validUuid(attemptId) || !answers || typeof answers !== "object" || Array.isArray(answers)) {
        return json(origin, 400, { error: "invalid_diagnostic_submission" });
      }
      const { data, error } = await admin.rpc("seminar_track_diagnostic_submit", {
        p_attempt_id: attemptId,
        p_attempt_token: editToken,
        p_answers: answers,
      });
      if (error) throw error;
      return json(origin, 200, data);
    }

    return json(origin, 404, { error: "not_found" });
  } catch (error) {
    console.error(error);
    return json(origin, 400, { error: "invalid_request" });
  }
});