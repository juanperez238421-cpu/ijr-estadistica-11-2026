import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set(["https://juanperez238421-cpu.github.io"]);
type Route = { rpc: string; args: string[]; admin?: boolean; teacherTokenArg?: boolean };
const allowedOperations: Record<string, Route> = {
  statistics_dashboard: { rpc: "teacher_learning_activity_dashboard_v11", args: [] },
  statistics_detail: { rpc: "teacher_learning_activity_detail_v11", args: ["p_attempt_id"] },
  statistics_update_registration: { rpc: "teacher_learning_activity_update_registration_v10", args: ["p_attempt_id", "p_group_code", "p_student_emails"] },
  statistics_delete_registration: { rpc: "teacher_learning_activity_delete_v10", args: ["p_attempt_id"] },
  assessment_dashboard: { rpc: "teacher_dashboard_snapshot", args: ["p_assessment_slug"] },
  assessment_detail: { rpc: "teacher_attempt_detail", args: ["p_attempt_id"] },
  assessment_action: { rpc: "teacher_code_action", args: ["p_assessment_slug", "p_action", "p_attempt_id"] },
  assessment_delete: { rpc: "teacher_delete_attempt", args: ["p_assessment_slug", "p_attempt_id", "p_confirmation"] },
  seminar_course_dashboard: { rpc: "seminar_course_teacher_dashboard", args: [] },
  seminar_oop_dashboard: { rpc: "teacher_seminar_oop_dashboard_v1", args: [] },
  seminar_oop_detail: { rpc: "teacher_seminar_oop_detail_v1", args: ["p_attempt_id"] },
  seminar_oop_colab_dashboard: { rpc: "teacher_seminar_oop_colab_dashboard_v1", args: [] },
  seminar_oop_colab_detail: { rpc: "teacher_seminar_oop_colab_detail_v1", args: ["p_attempt_id"] },
  seminar_oop_colab_delete: { rpc: "teacher_seminar_oop_colab_delete_v1", args: ["p_attempt_id"] },
  seminar_studio_dashboard: { rpc: "seminar_studio_teacher_dashboard", args: [], admin: true, teacherTokenArg: false },
  seminar_studio_update: { rpc: "seminar_studio_teacher_update", args: ["p_profile_id","p_sprint_current","p_progress_percent","p_next_goal","p_repo_full_name","p_uml_url","p_project_title","p_status","p_teacher_note"], admin: true, teacherTokenArg: false },
  seminar_studio_release: { rpc: "seminar_studio_teacher_set_release", args: ["p_released_sprint","p_teacher_note"], admin: true, teacherTokenArg: false },
  python_hub_dashboard: { rpc: "python_hub_teacher_master_v2", args: [], teacherTokenArg: false },
  python_hub_issue_recovery: { rpc: "python_hub_teacher_issue_recovery_v1", args: ["p_registration_id"], teacherTokenArg: false },
};

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
}
function json(origin: string | null, status: number, body: unknown) { return new Response(JSON.stringify(body), { status, headers: cors(origin) }); }
async function sha256(value: string) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest)).map((b)=>b.toString(16).padStart(2,"0")).join(""); }
function parseJwtPayload(token: string): Record<string, unknown> { const part=token.split(".")[1]; if(!part)return{}; const normalized=part.replace(/-/g,"+").replace(/_/g,"/"); const padded=normalized.padEnd(Math.ceil(normalized.length/4)*4,"="); try{return JSON.parse(atob(padded));}catch{return{};} }

Deno.serve(async (req: Request) => {
  const origin=req.headers.get("Origin");
  if(req.method==="OPTIONS"){ if(!origin||!allowedOrigins.has(origin))return json(origin,403,{error:"origin_denied"}); return new Response(null,{status:204,headers:cors(origin)}); }
  if(req.method!=="POST")return json(origin,405,{error:"method_not_allowed"});
  if(!origin||!allowedOrigins.has(origin))return json(origin,404,{error:"not_found"});

  const url=Deno.env.get("SUPABASE_URL")??"";
  const anonKey=Deno.env.get("SUPABASE_ANON_KEY")??"";
  const serviceRoleKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
  const authorization=req.headers.get("Authorization")??"";
  const token=authorization.replace(/^Bearer\s+/i,"");
  const requestId=req.headers.get("sb-request-id")??crypto.randomUUID();
  const userAgent=(req.headers.get("User-Agent")??"").slice(0,1000);
  const ipHash=await sha256((req.headers.get("x-forwarded-for")??"").split(",")[0].trim());
  const claims=parseJwtPayload(token);

  const userClient=createClient(url,anonKey,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
  const adminClient=createClient(url,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
  let userId:string|null=null,operation="unknown";
  const audit=async(decision:"allow"|"deny"|"error",reason:string)=>{await adminClient.from("teacher_auth_gateway_audit").insert({auth_user_id:userId,auth_session_id:typeof claims.session_id==="string"?claims.session_id:null,operation,decision,reason:reason.slice(0,1000),ip_hash:ipHash,user_agent:userAgent,request_id:requestId});};

  try{
    const payload=await req.json();
    operation=typeof payload?.operation==="string"?payload.operation:"unknown";
    const route=allowedOperations[operation];
    if(!route){await audit("deny","operation_not_allowed");return json(origin,404,{error:"not_found"});}

    const{data:userData,error:userError}=await userClient.auth.getUser(token);
    if(userError||!userData.user){await audit("deny","invalid_user_session");return json(origin,404,{error:"not_found"});}
    userId=userData.user.id;

    const{data:aal,error:aalError}=await userClient.auth.mfa.getAuthenticatorAssuranceLevel(token);
    if(aalError||aal?.currentLevel!=="aal2"){await audit("deny","aal2_required");return json(origin,403,{error:"mfa_required"});}

    const{data:profile,error:profileError}=await adminClient.from("profiles").select("role,active").eq("auth_user_id",userId).eq("active",true).in("role",["teacher","admin"]).maybeSingle();
    if(profileError||!profile){await audit("deny","teacher_role_required");return json(origin,404,{error:"not_found"});}

    const supplied=payload?.args&&typeof payload.args==="object"?payload.args:{};
    const rpcArgs:Record<string,unknown>={};
    if(route.teacherTokenArg!==false)rpcArgs.p_teacher_token="";
    for(const key of route.args)rpcArgs[key]=supplied[key]??null;

    const rpcClient=route.admin?adminClient:userClient;
    const{data,error}=await rpcClient.rpc(route.rpc,rpcArgs);
    if(error){await audit("error",`${route.rpc}:${error.code??"rpc_error"}`);return json(origin,400,{error:"operation_failed"});}

    await audit("allow",route.rpc);
    return json(origin,200,{data,request_id:requestId});
  }catch(error){
    await audit("error",error instanceof Error?error.message:"unexpected_error");
    return json(origin,400,{error:"invalid_request"});
  }
});
