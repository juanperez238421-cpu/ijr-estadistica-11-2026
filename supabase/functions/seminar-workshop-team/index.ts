import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
const origins = new Set(["https://juanperez238421-cpu.github.io", "http://127.0.0.1:4173", "http://localhost:4173"]);
const projects = new Set(["rico", "cyber", "cad", "clients", "gta"]);
const normalize = (v: unknown) => typeof v === "string" ? v.trim().toLowerCase() : "";
const validEmail = (v: string) => v.length <= 254 && /^[^\s@]+@ijr\.edu\.co$/.test(v);
function defaultKey(name: string) { try { return JSON.parse(Deno.env.get(name) || "{}").default || ""; } catch { return ""; } }
async function hash(v: string) { return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v)))).map(b => b.toString(16).padStart(2, "0")).join(""); }
Deno.serve(async req => {
 const origin = req.headers.get("origin") || "";
 const headers = { "Access-Control-Allow-Origin": origins.has(origin) ? origin : "null", "Access-Control-Allow-Headers": "apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Origin" };
 const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
 if (!origins.has(origin)) return reply(403, { error: "origin_denied" });
 if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
 if (req.method !== "POST") return reply(405, { error: "method_not_allowed" });
 const key = req.headers.get("apikey") || "";
 if (!key || ![defaultKey("SUPABASE_PUBLISHABLE_KEYS"), Deno.env.get("SUPABASE_ANON_KEY") || ""].includes(key)) return reply(401, { error: "invalid_client" });
 try {
  const body = await req.json(), action = body?.action;
  const admin = createClient(Deno.env.get("SUPABASE_URL") || "", defaultKey("SUPABASE_SECRET_KEYS") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "", { auth: { persistSession: false, autoRefreshToken: false } });
  const classNo = Number(body.class_no);
  if (!Number.isInteger(classNo) || classNo < 1 || classNo > 4) return reply(400, { error: "invalid_class" });
  let token: string;
  if (action === "start") {
   const emails = Array.isArray(body.emails) ? body.emails.map(normalize) : [];
   if (!projects.has(body.project_key) || emails.length < 1 || emails.length > 3 || emails.some((e: string) => !validEmail(e)) || new Set(emails).size !== emails.length) return reply(400, { error: "institutional_team_emails_required" });
   token = (crypto.randomUUID() + crypto.randomUUID()).replaceAll("-", "");
   const started = await admin.rpc("seminar_workshop_team_start_v1", { p_project_key: body.project_key, p_emails: emails, p_token_hash: await hash(token) });
   if (started.error) throw started.error;
  } else if (action === "progress" || action === "record") {
   token = typeof body.team_token === "string" ? body.team_token : "";
   if (!/^[a-f0-9]{64}$/.test(token)) return reply(403, { error: "team_session_required" });
  } else return reply(400, { error: "invalid_action" });
  const args: Record<string, unknown> = { p_token_hash: await hash(token), p_class_no: classNo };
  if (action === "record") {
   if (body.success !== true || typeof body.cell_id !== "string" || typeof body.code_hash !== "string" || !/^[a-f0-9]{64}$/.test(body.code_hash) || typeof body.request_id !== "string" || !/^[a-f0-9-]{36}$/i.test(body.request_id)) return reply(400, { error: "successful_execution_required" });
   Object.assign(args, { p_cell_id: body.cell_id, p_code_hash: body.code_hash, p_output: typeof body.output === "string" ? body.output.slice(0, 4000) : "", p_request_id: body.request_id });
  }
  const result = await admin.rpc("seminar_workshop_team_progress_v1", args);
  if (result.error) {
   if (result.error.message.includes("team_session_expired")) return reply(403, { error: "team_session_expired" });
   if (result.error.message.includes("invalid_workshop_cell")) return reply(400, { error: "invalid_workshop_cell" });
   throw result.error;
  }
  return reply(200, { ok: true, ...result.data, ...(action === "start" ? { team_token: token } : {}) });
 } catch (e) { console.error("Seminar team operation failed", e); return reply(400, { error: "team_operation_failed" }); }
});
