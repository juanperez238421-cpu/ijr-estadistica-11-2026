import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://juanperez238421-cpu.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

const challenges: Record<string, Set<string>> = {
  web: new Set(["web-valid-age", "web-task-domain"]),
  "data-science": new Set(["data-iqr-fences", "data-pandas-filter"]),
  cybersecurity: new Set(["cyber-valid-code", "cyber-access-policy"]),
  "3d-programming": new Set(["3d-translate", "3d-positive-dimension"]),
  robotics: new Set(["robotics-threshold", "robotics-failsafe"]),
};

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
function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function validToken(value: string) {
  return /^[a-f0-9]{48,128}$/i.test(value);
}
function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
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
    const editToken = text(body?.edit_token, 160);
    const attemptId = text(body?.attempt_id, 64);
    const trackSlug = text(body?.track_slug, 40);
    const challengeId = text(body?.challenge_id, 80);
    const runtime = text(body?.runtime, 20);
    const passed = body?.passed === true;
    const runCount = Number(body?.run_count);

    if (!validToken(editToken) || !validUuid(attemptId)) return json(origin, 400, { error: "invalid_attempt" });
    if (!challenges[trackSlug]?.has(challengeId)) return json(origin, 400, { error: "invalid_challenge" });
    if (!new Set(["python", "javascript"]).has(runtime)) return json(origin, 400, { error: "invalid_runtime" });
    if (!Number.isInteger(runCount) || runCount < 1 || runCount > 1000) return json(origin, 400, { error: "invalid_run_count" });

    const tokenHash = await sha256(editToken);
    const { data: attempt, error: attemptError } = await admin
      .from("seminar_track_diagnostic_attempts")
      .select("id,track_slug,access_token_hash,completed_at")
      .eq("id", attemptId)
      .maybeSingle();
    if (attemptError) throw attemptError;
    if (!attempt || attempt.track_slug !== trackSlug || attempt.access_token_hash !== tokenHash) {
      return json(origin, 404, { error: "attempt_not_found" });
    }
    if (attempt.completed_at) return json(origin, 409, { error: "attempt_already_completed" });

    const { error } = await admin.from("seminar_track_diagnostic_events").insert({
      attempt_id: attemptId,
      event_type: "PRACTICAL_RUN",
      payload: {
        track_slug: trackSlug,
        challenge_id: challengeId,
        runtime,
        passed,
        run_count: runCount,
      },
    });
    if (error) throw error;

    return json(origin, 200, { ok: true, challenge_id: challengeId, passed, run_count: runCount });
  } catch (error) {
    console.error(error);
    return json(origin, 400, { error: "invalid_request" });
  }
});
