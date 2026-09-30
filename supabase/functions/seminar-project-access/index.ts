import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const allowedOrigins = new Set([
  "https://rlfxnjbqxbozjdzkbwlz.supabase.co",
  "https://juanperez238421-cpu.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

type ProjectRow = Record<string, any>;
type Option = {
  key: string;
  label: string;
  title: string;
  summary: string;
  objective: string;
  stack: string[];
  track_slug?: string;
  kind: "teacher" | "curated" | "custom";
};

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : "null",
    "Access-Control-Allow-Headers": "content-type, apikey, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
}
function json(origin: string | null, status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: cors(origin) });
}
function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}
function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function normalizeStudentCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase().slice(0, 64) : "";
}
async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function getDefaultKey(envName: string) {
  const raw = Deno.env.get(envName) ?? "";
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.default === "string" ? parsed.default : "";
  } catch {
    return "";
  }
}
function proposalOption(project: ProjectRow): Option {
  return {
    key: "teacher-proposal",
    label: "Propuesta inicial",
    title: project.initial_project_title || project.project_title || "",
    summary: project.initial_project_summary || project.project_summary || "",
    objective: project.initial_objective || project.objective || "",
    stack: Array.isArray(project.initial_stack) ? project.initial_stack : (project.stack || []),
    track_slug: String(project.track_slug || ""),
    kind: "teacher",
  };
}
function curatedOptions(track: string): Option[] {
  const map: Record<string, Option[]> = {
    web: [
      {
        key: "web-project-tracker",
        label: "Opción A · Web",
        title: "Project Tracker — Organizador de tareas y evidencias",
        summary: "Aplicación web para crear, editar, priorizar y filtrar tareas de un proyecto, conservar el estado y visualizar el avance.",
        objective: "Construir y publicar una aplicación web con datos estructurados, persistencia local y una interacción completa de crear, editar, filtrar y consultar información.",
        stack: ["HTML", "CSS", "JavaScript", "JSON", "localStorage", "GitHub Pages"],
        kind: "curated",
      },
      {
        key: "web-smart-catalog",
        label: "Opción B · Web",
        title: "Smart Catalog — Catálogo con búsqueda, filtros y favoritos",
        summary: "Catálogo temático elegido por el estudiante con tarjetas, detalle, búsqueda, filtros combinables y favoritos persistentes.",
        objective: "Modelar datos de una temática real y convertirlos en una interfaz web usable, responsiva y publicable con búsqueda, filtros y estado persistente.",
        stack: ["HTML", "CSS", "JavaScript", "JSON", "localStorage", "Git"],
        kind: "curated",
      },
      {
        key: "web-community-tool",
        label: "Opción C · Web",
        title: "Community Utility — Herramienta web para una necesidad concreta",
        summary: "Herramienta web para resolver una necesidad no sensible del colegio o de la comunidad, por ejemplo agenda, inventario simulado, guía de recursos o tablero informativo.",
        objective: "Definir un usuario y un problema concreto, construir un MVP funcional y demostrar con pruebas que la aplicación resuelve el flujo principal.",
        stack: ["HTML", "CSS", "JavaScript", "JSON or API", "localStorage", "Git"],
        kind: "curated",
      },
    ],
    "data-science": [
      {
        key: "data-sports-analysis",
        label: "Opción A · Datos",
        title: "Sports Performance Explorer — Análisis de rendimiento",
        summary: "Análisis reproducible de un dataset público o simulado de rendimiento deportivo para comparar variables, detectar patrones y comunicar hallazgos.",
        objective: "Cargar, limpiar, explorar y visualizar datos deportivos en Python y producir conclusiones respaldadas por estadísticas descriptivas y gráficos.",
        stack: ["Python", "Pandas", "NumPy", "Matplotlib", "Jupyter or Colab"],
        kind: "curated",
      },
      {
        key: "data-mobility-analysis",
        label: "Opción B · Datos",
        title: "Urban Mobility Explorer — Análisis de movilidad",
        summary: "Proyecto de análisis de datos abiertos o simulados sobre movilidad, transporte, tiempos de viaje o comportamiento del tráfico.",
        objective: "Formular una pregunta medible, preparar el dataset y construir un análisis reproducible con indicadores, comparaciones y visualizaciones.",
        stack: ["Python", "Pandas", "Matplotlib", "CSV", "Jupyter or Colab"],
        kind: "curated",
      },
      {
        key: "data-gaming-media",
        label: "Opción C · Datos",
        title: "Gaming & Media Data Lab — Tendencias de videojuegos o entretenimiento",
        summary: "Análisis de un dataset público sobre videojuegos, películas, música u otra temática de entretenimiento para explorar popularidad, categorías y relaciones entre variables.",
        objective: "Transformar una pregunta de interés personal en un análisis de datos documentado, con limpieza, estadísticas descriptivas, gráficos y conclusiones.",
        stack: ["Python", "Pandas", "NumPy", "Matplotlib", "optional scikit-learn"],
        kind: "curated",
      },
      {
        key: "python-animated-message",
        label: "Opción D · Python creativo",
        title: "Animated Message Studio — Flores, corazón y texto con Python",
        summary: "Proyecto de creative coding que genera una animación completa por frames: fondo dinámico, partículas, flores, corazón paramétrico, tipografía animada y exportación MP4/GIF. Puede trabajarse desde Terminal o Google Colab y terminar como entrega en USB.",
        objective: "Construir una animación modular y original en Python, explicar al menos un componente matemático de movimiento, renderizar un video final reproducible y entregar código, pruebas, Colab/Terminal y paquete final.",
        stack: ["Python", "Pillow", "NumPy", "ImageIO/FFmpeg", "Google Colab", "Terminal", "Git", "PyInstaller"],
        kind: "curated",
      },
    ],
    cybersecurity: [
      {
        key: "cyber-http-flood-defense",
        label: "Caso 01 · Ciberseguridad",
        title: "HTTP Flood Defense — Disponibilidad bajo ataque controlado",
        summary: "Aplicación web real dentro del laboratorio Docker que recibe un HTTP flood reproducible contra una ruta costosa. El estudiante mide degradación, diagnostica el cuello de botella y recupera disponibilidad con controles defensivos.",
        objective: "Demostrar con baseline, logs y métricas antes/después que una defensa de disponibilidad reduce el impacto del mismo perfil de carga sin inutilizar el tráfico legítimo.",
        stack: ["Docker", "Nginx", "Node.js", "Terminal", "HTTP", "logs", "Colab/Pandas", "rate limiting"],
        kind: "curated",
      },
      {
        key: "cyber-auth-abuse-defense",
        label: "Caso 02 · Ciberseguridad",
        title: "Credential Abuse Defense — Autenticación bajo intentos automatizados",
        summary: "Login de laboratorio con cuentas ficticias sometido a múltiples intentos inválidos reales. El estudiante inspecciona tráfico y logs y diseña rate limiting, backoff, bloqueo temporal y señales de detección.",
        objective: "Reducir abuso automatizado de autenticación manteniendo operativo el login legítimo y justificando cada control con evidencia HTTP y registros del sistema.",
        stack: ["HTTP", "DevTools", "Node.js", "Nginx", "Terminal", "structured logging", "rate limiting", "backoff"],
        kind: "curated",
      },
      {
        key: "cyber-broken-access-control",
        label: "Caso 03 · Ciberseguridad",
        title: "Broken Access Control / IDOR — Autorización por objeto",
        summary: "API local con registros sintéticos donde la versión inicial identifica al usuario pero no valida propiedad del objeto. El estudiante reproduce el acceso indebido modificando un ID y corrige autorización server-side.",
        objective: "Demostrar la diferencia entre autenticación y autorización, cerrar el acceso cruzado entre usuarios ficticios y dejar pruebas automatizadas que impidan la regresión.",
        stack: ["REST", "curl", "DevTools Network", "Node.js", "authorization", "HTTP 403/404", "testing"],
        kind: "curated",
      },
      {
        key: "cyber-stored-xss-defense",
        label: "Caso 04 · Ciberseguridad",
        title: "Stored HTML / XSS Defense — Datos que terminan como código",
        summary: "Tablero local que inicialmente renderiza comentarios sin separar datos de markup. El estudiante inspecciona DOM, reproduce una inyección almacenada con un marcador inocuo y corrige output encoding y CSP.",
        objective: "Eliminar ejecución de contenido no confiable, demostrar el cambio mediante inspección HTML/DOM antes y después y explicar la función de output encoding y Content Security Policy.",
        stack: ["HTML", "DOM", "DevTools Elements", "JavaScript", "output encoding", "CSP", "testing"],
        kind: "curated",
      },
    ],
    "3d-programming": [
      {
        key: "3d-parametric-stand",
        label: "Opción A · 3D",
        title: "Parametric Stand — Soporte funcional ajustable",
        summary: "Diseño paramétrico de un soporte para celular, tableta u objeto definido por el estudiante, con dimensiones y tolerancias modificables.",
        objective: "Modelar una pieza funcional parametrizada, validar medidas, exportar STL y documentar al menos una iteración de mejora.",
        stack: ["OpenSCAD or FreeCAD", "parametric CAD", "STL", "slicer", "3D printing"],
        kind: "curated",
      },
      {
        key: "3d-functional-organizer",
        label: "Opción B · 3D",
        title: "Functional Organizer — Organizador modular",
        summary: "Organizador funcional para escritorio, herramientas o componentes, diseñado a partir de restricciones reales de tamaño y uso.",
        objective: "Convertir requisitos medibles en geometría paramétrica, comprobar encajes y producir un prototipo imprimible con evidencia de iteración.",
        stack: ["OpenSCAD or FreeCAD", "parametric design", "measurement", "STL", "slicer"],
        kind: "curated",
      },
      {
        key: "3d-custom-adapter",
        label: "Opción C · 3D",
        title: "Custom Adapter — Adaptador o bracket paramétrico",
        summary: "Pieza de unión o adaptación para dos elementos físicos definidos por el estudiante, con énfasis en dimensiones, tolerancias y resistencia geométrica básica.",
        objective: "Diseñar una solución geométrica reproducible para un problema físico concreto y verificar sus dimensiones antes y después del prototipo.",
        stack: ["CAD", "parametric constraints", "STL", "slicer", "3D printing"],
        kind: "curated",
      },
    ],
    robotics: [
      {
        key: "robot-obstacle-rover",
        label: "Opción A · Robótica",
        title: "Obstacle Rover — Robot móvil con evasión",
        summary: "Robot o simulación que detecta obstáculos, decide entre estados y controla actuadores para desplazarse de manera segura.",
        objective: "Implementar el ciclo Sensor → Controller → Actuator con una máquina de estados, pruebas de escenarios y comportamiento seguro ante fallos.",
        stack: ["Arduino or MicroPython", "sensors", "motors", "state machine", "simulation"],
        kind: "curated",
      },
      {
        key: "robot-environment-monitor",
        label: "Opción B · Robótica",
        title: "Environment Monitor — Monitor ambiental con alertas",
        summary: "Sistema que mide una o más variables ambientales, procesa umbrales y activa indicadores o alertas con registro de lecturas.",
        objective: "Integrar sensores, lógica de decisión y salida visible, calibrar lecturas y validar el sistema con casos de prueba reproducibles.",
        stack: ["Arduino or MicroPython", "sensors", "display or LEDs", "logging", "state machine"],
        kind: "curated",
      },
      {
        key: "robot-automatic-control",
        label: "Opción C · Robótica",
        title: "Automatic Control System — Automatización de una tarea",
        summary: "Sistema automatizado para una tarea concreta elegida por el estudiante, con entradas, estados, actuadores y condiciones de seguridad.",
        objective: "Diseñar y prototipar un sistema automático con estados explícitos, manejo de fallos y pruebas que demuestren el comportamiento esperado.",
        stack: ["Arduino or MicroPython", "sensors", "actuators", "state machine", "simulation"],
        kind: "curated",
      },
    ],
  };
  return (map[track] || []).map((option) => ({ ...option, track_slug: track }));
}

const TRACKS = ["web", "data-science", "cybersecurity", "3d-programming", "robotics"] as const;
function validTrack(value: string) {
  return (TRACKS as readonly string[]).includes(value);
}
function customOption(track = ""): Option {
  return {
    key: "custom",
    label: "Mi propia idea",
    title: "",
    summary: "",
    objective: "",
    stack: [],
    track_slug: track,
    kind: "custom",
  };
}
function buildOptions(project: ProjectRow | null, preferredTrack = ""): Option[] {
  if (project) {
    const track = String(project.track_slug || "");
    return [
      proposalOption(project),
      ...curatedOptions(track),
      customOption(track),
    ];
  }

  const orderedTracks = validTrack(preferredTrack)
    ? [preferredTrack, ...TRACKS.filter((track) => track !== preferredTrack)]
    : [...TRACKS];

  return [
    ...orderedTracks.flatMap((track) => curatedOptions(track)),
    customOption(validTrack(preferredTrack) ? preferredTrack : ""),
  ];
}
function virtualProject(roster: Record<string, any>, preferredTrack = ""): ProjectRow {
  return {
    project_slug: null,
    track_slug: validTrack(preferredTrack) ? preferredTrack : "",
    project_title: "Aún no tienes un proyecto definido",
    project_summary: "Selecciona una de las opciones disponibles o plantea tu propia idea. Después concreta título, producto, objetivo, ruta técnica y herramientas antes de confirmar.",
    objective: "",
    stack: [],
    safety_scope: null,
    content_sections: [],
    sprints: [],
    assignment_status: "unassigned",
    decision_status: "proposed",
    decision_note: "No tienes un proyecto final definido todavía. Elige una base y conviértela en una propuesta concreta y verificable.",
    project_mode: "guided_definition",
    definition_questions: [
      "¿Quién usará o se beneficiará del producto?",
      "¿Qué problema concreto resolverá?",
      "¿Cuál es el producto mínimo funcional que puedes demostrar?",
      "¿Qué evidencia mostrará que el proyecto realmente funciona?"
    ],
    student_choice_key: null,
    student_decision_note: null,
    student_decided_at: null,
    student_revision_count: 0,
    updated_at: null,
    group_code: roster?.group_code || "",
    student_name: roster?.display_name || "",
  };
}
function projectPayload(project: ProjectRow) {
  return {
    is_defined: Boolean(project.project_slug),
    project_slug: project.project_slug,
    track_slug: project.track_slug,
    project_title: project.project_title,
    project_summary: project.project_summary,
    objective: project.objective,
    stack: project.stack,
    safety_scope: project.safety_scope,
    content_sections: project.content_sections,
    sprints: project.sprints,
    assignment_status: project.assignment_status,
    decision_status: project.decision_status,
    decision_note: project.decision_note,
    project_mode: project.project_mode,
    definition_questions: project.definition_questions,
    student_choice_key: project.student_choice_key,
    student_decision_note: project.student_decision_note,
    student_decided_at: project.student_decided_at,
    student_revision_count: project.student_revision_count,
    updated_at: project.updated_at,
  };
}

const WORKSPACE_CHECKS = ["defined", "built", "tested", "evidence"] as const;
function normalizeChecklist(value: unknown) {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  return Object.fromEntries(WORKSPACE_CHECKS.map((key) => [key, source[key] === true]));
}
function progressPayload(project: ProjectRow | null, rows: Record<string, any>[]) {
  const units = Array.isArray(project?.sprints) ? project!.sprints.length : 0;
  const byUnit = new Map(rows.map((row) => [Number(row.unit_no), row]));
  const normalized = Array.from({ length: units }, (_, index) => {
    const unitNo = index + 1;
    const row = byUnit.get(unitNo);
    return row ? {
      unit_no: unitNo,
      status: row.status,
      theory_viewed: row.theory_viewed === true,
      workshop_started: row.workshop_started === true,
      gate_passed: row.gate_passed === true,
      checklist: normalizeChecklist(row.checklist),
      evidence_note: row.evidence_note ?? "",
      evidence_url: row.evidence_url ?? "",
      repo_ref: row.repo_ref ?? "",
      started_at: row.started_at,
      completed_at: row.completed_at,
      updated_at: row.updated_at,
    } : {
      unit_no: unitNo,
      status: "not_started",
      theory_viewed: false,
      workshop_started: false,
      gate_passed: false,
      checklist: normalizeChecklist({}),
      evidence_note: "",
      evidence_url: "",
      repo_ref: "",
      started_at: null,
      completed_at: null,
      updated_at: null,
    };
  });
  const completed = normalized.filter((row) => row.gate_passed).length;
  const started = normalized.filter((row) => row.status !== "not_started" || row.theory_viewed || row.workshop_started).length;
  const current = units
    ? (normalized.find((row) => !row.gate_passed)?.unit_no ?? units)
    : null;
  return {
    unit_count: units,
    completed_units: completed,
    started_units: started,
    current_unit: current,
    progress_percent: units ? Math.round((completed / units) * 100) : 0,
    units: normalized,
  };
}

type CodeFileSpec = { key: string; language: string; label: string };
type CodeProfile = {
  enabled: boolean;
  required_for_gate: boolean;
  runtime_kind: "web" | "python-browser" | "python-syntax" | "source";
  allowed_languages: string[];
  starter_files: CodeFileSpec[];
};

function projectCodeProfile(project: ProjectRow | null): CodeProfile {
  const track = String(project?.track_slug || "");
  const stack = (Array.isArray(project?.stack) ? project!.stack : []).join(" ").toLowerCase();
  const title = String(project?.project_title || "").toLowerCase();

  if (track === "web") {
    return {
      enabled: true,
      required_for_gate: true,
      runtime_kind: "web",
      allowed_languages: ["html", "css", "javascript", "json", "markdown"],
      starter_files: [
        { key: "index.html", language: "html", label: "HTML" },
        { key: "styles.css", language: "css", label: "CSS" },
        { key: "app.js", language: "javascript", label: "JavaScript" },
      ],
    };
  }

  if (track === "data-science") {
    const syntaxOnly = /pygame|manim|pyinstaller/.test(stack + " " + title);
    return {
      enabled: true,
      required_for_gate: true,
      runtime_kind: syntaxOnly ? "python-syntax" : "python-browser",
      allowed_languages: ["python", "json", "markdown", "text"],
      starter_files: [
        { key: "main.py", language: "python", label: "main.py" },
        { key: "tests.py", language: "python", label: "tests.py" },
      ],
    };
  }

  if (track === "cybersecurity") {
    const webBased = /html|javascript|node\.js|dom|csp/.test(stack) && !/python|fastapi|flask/.test(stack);
    return {
      enabled: true,
      required_for_gate: true,
      runtime_kind: webBased ? "web" : (/fastapi|flask|docker|nginx/.test(stack) ? "python-syntax" : "python-browser"),
      allowed_languages: webBased
        ? ["html", "css", "javascript", "json", "markdown"]
        : ["python", "json", "markdown", "text"],
      starter_files: webBased
        ? [
            { key: "index.html", language: "html", label: "HTML" },
            { key: "styles.css", language: "css", label: "CSS" },
            { key: "app.js", language: "javascript", label: "JavaScript" },
          ]
        : [
            { key: "main.py", language: "python", label: "main.py" },
            { key: "tests.py", language: "python", label: "tests.py" },
          ],
    };
  }

  if (track === "robotics") {
    return {
      enabled: true,
      required_for_gate: true,
      runtime_kind: "python-browser",
      allowed_languages: ["python", "json", "markdown", "text"],
      starter_files: [
        { key: "main.py", language: "python", label: "main.py" },
        { key: "tests.py", language: "python", label: "tests.py" },
      ],
    };
  }

  if (track === "3d-programming") {
    const pythonDriven = /python/.test(stack);
    return {
      enabled: true,
      required_for_gate: pythonDriven,
      runtime_kind: pythonDriven ? "python-browser" : "source",
      allowed_languages: pythonDriven
        ? ["python", "json", "markdown", "text"]
        : ["openscad", "python", "json", "markdown", "text"],
      starter_files: pythonDriven
        ? [{ key: "main.py", language: "python", label: "main.py" }]
        : [
            { key: "model.scad", language: "openscad", label: "model.scad" },
            { key: "README.md", language: "markdown", label: "README" },
          ],
    };
  }

  return {
    enabled: false,
    required_for_gate: false,
    runtime_kind: "source",
    allowed_languages: ["text"],
    starter_files: [],
  };
}

function validCodeFileKey(value: string) {
  return value.length >= 1
    && value.length <= 120
    && /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value)
    && !value.includes("..")
    && !value.startsWith("/");
}

function codeWorkspacePayload(profile: CodeProfile, files: Record<string, any>[], runtime: Record<string, any> | null) {
  return {
    enabled: profile.enabled,
    required_for_gate: profile.required_for_gate,
    runtime_kind: profile.runtime_kind,
    allowed_languages: profile.allowed_languages,
    starter_files: profile.starter_files,
    files: files.map((row) => ({
      file_key: row.file_key,
      language: row.language,
      content: row.content,
      revision: row.revision,
      last_unit_no: row.last_unit_no,
      last_run_ok: row.last_run_ok === true,
      last_run_at: row.last_run_at,
      last_run_output: row.last_run_output ?? "",
      content_sha256: row.content_sha256,
      updated_at: row.updated_at,
    })),
    runtime: runtime ? {
      runtime_kind: runtime.runtime_kind,
      run_count: runtime.run_count,
      successful_run_count: runtime.successful_run_count,
      last_run_ok: runtime.last_run_ok === true,
      last_run_output: runtime.last_run_output ?? "",
      last_run_error: runtime.last_run_error ?? "",
      last_run_at: runtime.last_run_at,
      bundle_sha256: runtime.bundle_sha256,
      last_unit_no: runtime.last_unit_no,
      updated_at: runtime.updated_at,
    } : {
      runtime_kind: profile.runtime_kind,
      run_count: 0,
      successful_run_count: 0,
      last_run_ok: false,
      last_run_output: "",
      last_run_error: "",
      last_run_at: null,
      bundle_sha256: null,
      last_unit_no: null,
      updated_at: null,
    },
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

  const suppliedApiKey = req.headers.get("apikey") ?? "";
  const publishable = getDefaultKey("SUPABASE_PUBLISHABLE_KEYS");
  const legacyAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!suppliedApiKey || (suppliedApiKey !== publishable && suppliedApiKey !== legacyAnon)) {
    return json(origin, 401, { error: "invalid_client" });
  }

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const secret = getDefaultKey("SUPABASE_SECRET_KEYS") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !secret) return json(origin, 503, { error: "backend_unavailable" });

  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const userAgent = (req.headers.get("user-agent") ?? "").slice(0, 1000);

  try {
    const body = await req.json();
    const action = cleanText(body?.action, 32) || "load";
    const email = normalizeEmail(body?.email);
    if (!/^[^\s@]+@ijr\.edu\.co$/.test(email) || email.length > 254) {
      return json(origin, 400, { error: "institutional_email_required" });
    }

    const emailHash = await sha256(email);
    const ipHash = await sha256(ip);

    const identityResult = await admin
      .from("python_hub_student_identities")
      .select("student_registry_id,display_name,institutional_email,user_code")
      .eq("institutional_email", email)
      .limit(1)
      .maybeSingle();

    if (identityResult.error) throw identityResult.error;
    const identity = identityResult.data;

    if (!identity?.student_registry_id) {
      // Institutional-email lab access does not claim a roster identity.
      if (action !== "load") return json(origin, 403, { error: "write_authorization_required" });
      await admin.from("seminar_project_access_events").insert({
        student_registry_id: null, success: true, email_hash: emailHash,
        ip_hash: ipHash, user_agent: userAgent,
      });
      return json(origin, 200, {
        ok: true,
        identity_status: "institutional_email_lab",
        student: { name: email, group_code: "11-U", institutional_email: email },
        project: projectPayload(virtualProject({ display_name: email, group_code: "11-U" })),
        progress: progressPayload(null, []),
        code_workspace: codeWorkspacePayload(projectCodeProfile(null), [], null),
        options: buildOptions(null),
      });
    }

    const projectSelect = "group_code,student_name,project_slug,track_slug,project_title,project_summary,objective,stack,initial_project_title,initial_project_summary,initial_objective,initial_stack,safety_scope,content_sections,sprints,assignment_status,decision_status,decision_note,project_mode,definition_questions,student_choice_key,student_decision_note,student_decided_at,student_revision_count,updated_at";
    const [projectResult, rosterResult, studioResult] = await Promise.all([
      admin.from("seminar_student_projects").select(projectSelect).eq("student_registry_id", identity.student_registry_id).maybeSingle(),
      admin.from("student_registry").select("display_name,group_code,active").eq("id", identity.student_registry_id).maybeSingle(),
      admin.from("seminar_studio_profiles")
        .select("track_slug")
        .eq("student_registry_id", identity.student_registry_id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (projectResult.error) throw projectResult.error;
    if (rosterResult.error) throw rosterResult.error;
    if (studioResult.error) throw studioResult.error;
    let project = projectResult.data as ProjectRow | null;
    const roster = rosterResult.data;
    const preferredTrack = validTrack(String(studioResult.data?.track_slug || ""))
      ? String(studioResult.data?.track_slug)
      : "";

    if (!roster?.active || !["11A", "11B", "11C"].includes(String(roster.group_code || ""))) {
      await admin.from("seminar_project_access_events").insert({
        student_registry_id: identity.student_registry_id,
        success: false,
        email_hash: emailHash,
        ip_hash: ipHash,
        user_agent: userAgent,
      });
      return json(origin, 404, { error: "project_access_denied" });
    }

    const loadProgress = async (projectRow: ProjectRow | null) => {
      if (!projectRow?.project_slug) return progressPayload(projectRow, []);
      const result = await admin
        .from("seminar_project_unit_progress")
        .select("unit_no,status,theory_viewed,workshop_started,gate_passed,checklist,evidence_note,evidence_url,repo_ref,started_at,completed_at,updated_at")
        .eq("student_registry_id", identity.student_registry_id)
        .eq("project_slug", projectRow.project_slug)
        .order("unit_no", { ascending: true });
      if (result.error) throw result.error;
      return progressPayload(projectRow, result.data || []);
    };

    const loadCodeWorkspace = async (projectRow: ProjectRow | null) => {
      const profile = projectCodeProfile(projectRow);
      if (!projectRow?.project_slug || !profile.enabled) return codeWorkspacePayload(profile, [], null);
      const [filesResult, runtimeResult] = await Promise.all([
        admin
          .from("seminar_project_code_files")
          .select("file_key,language,content,revision,last_unit_no,last_run_ok,last_run_at,last_run_output,content_sha256,updated_at")
          .eq("student_registry_id", identity.student_registry_id)
          .eq("project_slug", projectRow.project_slug)
          .order("file_key", { ascending: true }),
        admin
          .from("seminar_project_code_runtime")
          .select("runtime_kind,run_count,successful_run_count,last_run_ok,last_run_output,last_run_error,last_run_at,bundle_sha256,last_unit_no,updated_at")
          .eq("student_registry_id", identity.student_registry_id)
          .eq("project_slug", projectRow.project_slug)
          .maybeSingle(),
      ]);
      if (filesResult.error) throw filesResult.error;
      if (runtimeResult.error) throw runtimeResult.error;
      return codeWorkspacePayload(profile, filesResult.data || [], runtimeResult.data || null);
    };

    if (action === "save_code_file") {
      if (!project?.project_slug) return json(origin, 409, { error: "project_not_defined" });
      if (project.project_mode === "guided_definition" && project.decision_status !== "confirmed") {
        return json(origin, 409, { error: "project_not_confirmed" });
      }
      const profile = projectCodeProfile(project);
      if (!profile.enabled) return json(origin, 409, { error: "project_code_not_available" });
      const unitCount = Array.isArray(project.sprints) ? project.sprints.length : 0;
      const unitNo = Number(body?.unit_no);
      if (!Number.isInteger(unitNo) || unitNo < 1 || unitNo > unitCount) {
        return json(origin, 400, { error: "invalid_project_unit" });
      }
      const fileKey = typeof body?.file_key === "string" ? body.file_key.trim() : "";
      const language = cleanText(body?.language, 32);
      const content = typeof body?.content === "string" ? body.content : "";
      if (!validCodeFileKey(fileKey)) return json(origin, 400, { error: "invalid_code_file_key" });
      if (!profile.allowed_languages.includes(language)) return json(origin, 400, { error: "invalid_code_language" });
      if (content.length > 120000) return json(origin, 413, { error: "code_file_too_large" });

      const existingFile = await admin
        .from("seminar_project_code_files")
        .select("revision")
        .eq("student_registry_id", identity.student_registry_id)
        .eq("project_slug", project.project_slug)
        .eq("file_key", fileKey)
        .maybeSingle();
      if (existingFile.error) throw existingFile.error;

      if (!existingFile.data) {
        const countResult = await admin
          .from("seminar_project_code_files")
          .select("file_key", { count: "exact", head: true })
          .eq("student_registry_id", identity.student_registry_id)
          .eq("project_slug", project.project_slug);
        if (countResult.error) throw countResult.error;
        if (Number(countResult.count || 0) >= 10) return json(origin, 409, { error: "code_file_limit_reached" });
      }

      const now = new Date().toISOString();
      const contentHash = await sha256(content);
      const savedFile = await admin
        .from("seminar_project_code_files")
        .upsert({
          student_registry_id: identity.student_registry_id,
          project_slug: project.project_slug,
          file_key: fileKey,
          language,
          content,
          revision: Number(existingFile.data?.revision || 0) + 1,
          last_unit_no: unitNo,
          last_run_ok: false,
          last_run_at: null,
          last_run_output: null,
          content_sha256: contentHash,
          updated_at: now,
        }, { onConflict: "student_registry_id,project_slug,file_key" })
        .select("file_key")
        .single();
      if (savedFile.error) throw savedFile.error;

      const invalidateRuntime = await admin
        .from("seminar_project_code_runtime")
        .update({ last_run_ok: false, updated_at: now })
        .eq("student_registry_id", identity.student_registry_id)
        .eq("project_slug", project.project_slug);
      if (invalidateRuntime.error) throw invalidateRuntime.error;

      return json(origin, 200, {
        ok: true,
        saved: true,
        code_workspace: await loadCodeWorkspace(project),
      });
    }

    if (action === "record_code_run") {
      if (!project?.project_slug) return json(origin, 409, { error: "project_not_defined" });
      if (project.project_mode === "guided_definition" && project.decision_status !== "confirmed") {
        return json(origin, 409, { error: "project_not_confirmed" });
      }
      const profile = projectCodeProfile(project);
      if (!profile.enabled) {
        return json(origin, 409, { error: "project_runtime_not_available" });
      }
      const unitCount = Array.isArray(project.sprints) ? project.sprints.length : 0;
      const unitNo = Number(body?.unit_no);
      if (!Number.isInteger(unitNo) || unitNo < 1 || unitNo > unitCount) {
        return json(origin, 400, { error: "invalid_project_unit" });
      }
      const reportedRuntime = cleanText(body?.runtime_kind, 32);
      if (reportedRuntime !== profile.runtime_kind) return json(origin, 400, { error: "runtime_mismatch" });
      const runOk = body?.run_ok === true;
      const runOutput = typeof body?.output === "string" ? body.output.slice(0, 10000) : "";
      const runError = typeof body?.error === "string" ? body.error.slice(0, 10000) : "";

      const filesResult = await admin
        .from("seminar_project_code_files")
        .select("file_key,language,content,content_sha256")
        .eq("student_registry_id", identity.student_registry_id)
        .eq("project_slug", project.project_slug)
        .order("file_key", { ascending: true });
      if (filesResult.error) throw filesResult.error;
      const files = filesResult.data || [];
      if (!files.length || !files.some((row: any) => String(row.content || "").trim().length >= 10)) {
        return json(origin, 409, { error: "project_code_required" });
      }
      const executable = files.filter((row: any) => ["python","html","css","javascript","openscad"].includes(String(row.language || "")));
      if (executable.some((row: any) => /TODO_BUILD|WRITE_HERE/.test(String(row.content || "")))) {
        return json(origin, 409, { error: "project_code_incomplete" });
      }
      const bundleHash = await sha256(files.map((row: any) => row.file_key + "\n" + row.content).join("\n---FILE---\n"));
      const currentRuntime = await admin
        .from("seminar_project_code_runtime")
        .select("run_count,successful_run_count")
        .eq("student_registry_id", identity.student_registry_id)
        .eq("project_slug", project.project_slug)
        .maybeSingle();
      if (currentRuntime.error) throw currentRuntime.error;

      const now = new Date().toISOString();
      const runtimeSave = await admin
        .from("seminar_project_code_runtime")
        .upsert({
          student_registry_id: identity.student_registry_id,
          project_slug: project.project_slug,
          runtime_kind: profile.runtime_kind,
          run_count: Number(currentRuntime.data?.run_count || 0) + 1,
          successful_run_count: Number(currentRuntime.data?.successful_run_count || 0) + (runOk ? 1 : 0),
          last_run_ok: runOk,
          last_run_output: runOutput || null,
          last_run_error: runError || null,
          last_run_at: now,
          bundle_sha256: bundleHash,
          last_unit_no: unitNo,
          updated_at: now,
        }, { onConflict: "student_registry_id,project_slug" })
        .select("project_slug")
        .single();
      if (runtimeSave.error) throw runtimeSave.error;

      const fileRunUpdate = await admin
        .from("seminar_project_code_files")
        .update({
          last_run_ok: runOk,
          last_run_at: now,
          last_run_output: (runOk ? runOutput : runError).slice(0, 10000) || null,
        })
        .eq("student_registry_id", identity.student_registry_id)
        .eq("project_slug", project.project_slug);
      if (fileRunUpdate.error) throw fileRunUpdate.error;

      return json(origin, 200, {
        ok: true,
        recorded: true,
        code_workspace: await loadCodeWorkspace(project),
      });
    }

    if (action === "save_progress") {
      if (!project?.project_slug) return json(origin, 409, { error: "project_not_defined" });
      if (project.project_mode === "guided_definition" && project.decision_status !== "confirmed") {
        return json(origin, 409, { error: "project_not_confirmed" });
      }
      const unitCount = Array.isArray(project.sprints) ? project.sprints.length : 0;
      const unitNo = Number(body?.unit_no);
      if (!Number.isInteger(unitNo) || unitNo < 1 || unitNo > unitCount) {
        return json(origin, 400, { error: "invalid_project_unit" });
      }

      const existingProgress = await loadProgress(project);
      const currentUnit = existingProgress.units.find((row: any) => row.unit_no === unitNo);
      const theoryViewed = body?.theory_viewed === true || currentUnit?.theory_viewed === true;
      const workshopStarted = body?.workshop_started === true || currentUnit?.workshop_started === true;
      const checklist = normalizeChecklist(body?.checklist ?? currentUnit?.checklist);
      const evidenceNote = cleanText(body?.evidence_note ?? currentUnit?.evidence_note, 2000);
      const evidenceUrl = cleanText(body?.evidence_url ?? currentUnit?.evidence_url, 1000);
      const repoRef = cleanText(body?.repo_ref ?? currentUnit?.repo_ref, 300);
      const gateRequested = body?.gate_passed === true;
      const allChecks = WORKSPACE_CHECKS.every((key) => checklist[key] === true);
      const hasEvidence = Boolean(evidenceNote || evidenceUrl || repoRef);

      if (gateRequested && unitNo > 1) {
        const previous = existingProgress.units.find((row: any) => row.unit_no === unitNo - 1);
        if (!previous?.gate_passed) return json(origin, 409, { error: "previous_project_unit_incomplete" });
      }
      if (gateRequested && (!theoryViewed || !workshopStarted || !allChecks || !hasEvidence)) {
        return json(origin, 409, { error: "project_gate_requirements_missing" });
      }

      const codeWorkspace = await loadCodeWorkspace(project);
      if (gateRequested && codeWorkspace.required_for_gate) {
        const runtime = codeWorkspace.runtime;
        const hasSavedCode = codeWorkspace.files.some((file: any) => String(file.content || "").trim().length >= 10);
        if (!hasSavedCode || !runtime?.last_run_ok) {
          return json(origin, 409, { error: "project_code_run_required" });
        }
      }

      const now = new Date().toISOString();
      const activity = theoryViewed || workshopStarted || Object.values(checklist).some(Boolean) || hasEvidence;
      const gatePassed = gateRequested || currentUnit?.gate_passed === true;
      const status = gatePassed ? "completed" : activity ? "in_progress" : "not_started";
      const payload = {
        student_registry_id: identity.student_registry_id,
        project_slug: project.project_slug,
        unit_no: unitNo,
        status,
        theory_viewed: theoryViewed,
        workshop_started: workshopStarted,
        gate_passed: gatePassed,
        checklist,
        evidence_note: evidenceNote || null,
        evidence_url: evidenceUrl || null,
        repo_ref: repoRef || null,
        started_at: currentUnit?.started_at || (activity ? now : null),
        completed_at: gatePassed ? (currentUnit?.completed_at || now) : null,
        updated_at: now,
      };

      const savedProgress = await admin
        .from("seminar_project_unit_progress")
        .upsert(payload, { onConflict: "student_registry_id,project_slug,unit_no" })
        .select("unit_no")
        .single();
      if (savedProgress.error) throw savedProgress.error;

      if (gateRequested && codeWorkspace.enabled && codeWorkspace.files.length) {
        const snapshotSave = await admin
          .from("seminar_project_code_snapshots")
          .upsert({
            student_registry_id: identity.student_registry_id,
            project_slug: project.project_slug,
            unit_no: unitNo,
            files: codeWorkspace.files.map((file: any) => ({
              file_key: file.file_key,
              language: file.language,
              content: file.content,
              revision: file.revision,
              content_sha256: file.content_sha256,
            })),
            runtime: codeWorkspace.runtime || {},
            updated_at: now,
          }, { onConflict: "student_registry_id,project_slug,unit_no" });
        if (snapshotSave.error) throw snapshotSave.error;
      }

      const refreshedProgress = await loadProgress(project);
      const profileResult = await admin
        .from("seminar_studio_profiles")
        .select("id")
        .eq("student_registry_id", identity.student_registry_id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (profileResult.error) throw profileResult.error;
      if (profileResult.data?.id) {
        const studioUpdate = await admin
          .from("seminar_studio_profiles")
          .update({
            sprint_current: Math.max(1, Number(refreshedProgress.current_unit || 1)),
            progress_percent: refreshedProgress.progress_percent,
            last_student_activity_at: now,
            updated_at: now,
          })
          .eq("id", profileResult.data.id);
        if (studioUpdate.error) throw studioUpdate.error;
      }

      return json(origin, 200, {
        ok: true,
        saved: true,
        student: { name: roster.display_name, group_code: roster.group_code, institutional_email: identity.institutional_email },
        project: projectPayload(project),
        progress: refreshedProgress,
        code_workspace: await loadCodeWorkspace(project),
      });
    }

    if (action === "save_decision") {
      let authorized = false;
      const editToken = cleanText(body?.edit_token, 160);
      if (/^[a-f0-9]{48,128}$/i.test(editToken)) {
        const tokenHash = await sha256(editToken);
        const tokenMatch = await admin
          .from("seminar_studio_profiles")
          .select("id")
          .eq("edit_token_hash", tokenHash)
          .eq("student_registry_id", identity.student_registry_id)
          .limit(1)
          .maybeSingle();
        if (tokenMatch.error) throw tokenMatch.error;
        authorized = Boolean(tokenMatch.data);
      }

      if (!authorized) {
        const suppliedCode = normalizeStudentCode(body?.student_code);
        const storedCode = normalizeStudentCode(identity.user_code);
        authorized = Boolean(suppliedCode && storedCode && suppliedCode === storedCode);
      }

      if (!authorized) {
        return json(origin, 403, { error: "write_authorization_required" });
      }

      const choiceKey = cleanText(body?.choice_key, 80);
      const requestedTrack = cleanText(body?.track_slug, 40);
      const options = buildOptions(project, preferredTrack);
      const selectedOption = options.find((option) => option.key === choiceKey);
      if (!selectedOption) {
        return json(origin, 400, { error: "invalid_choice" });
      }
      if (!validTrack(requestedTrack)) {
        return json(origin, 400, { error: "track_required" });
      }
      if (project && requestedTrack !== String(project.track_slug || "")) {
        return json(origin, 409, { error: "track_change_not_allowed" });
      }
      if (selectedOption.kind !== "custom" && selectedOption.track_slug !== requestedTrack) {
        return json(origin, 400, { error: "invalid_track_choice" });
      }

      const title = cleanText(body?.project_title, 180);
      const summary = cleanText(body?.project_summary, 1600);
      const objective = cleanText(body?.objective, 1200);
      const studentNote = cleanText(body?.student_note, 1200);
      const stack = Array.isArray(body?.stack)
        ? body.stack.map((x: unknown) => cleanText(x, 80)).filter(Boolean).slice(0, 12)
        : [];

      if (title.length < 3 || summary.length < 10 || objective.length < 10) {
        return json(origin, 400, { error: "project_fields_required" });
      }

      const saved = await admin.rpc("seminar_student_project_save_decision_v2", {
        p_student_registry_id: identity.student_registry_id,
        p_track_slug: requestedTrack,
        p_choice_key: choiceKey,
        p_project_title: title,
        p_project_summary: summary,
        p_objective: objective,
        p_stack: stack,
        p_student_note: studentNote || null,
        p_ip_hash: ipHash,
        p_user_agent: userAgent,
      });
      if (saved.error) throw saved.error;

      const refreshed = await admin
        .from("seminar_student_projects")
        .select(projectSelect)
        .eq("student_registry_id", identity.student_registry_id)
        .single();
      if (refreshed.error) throw refreshed.error;
      project = refreshed.data as ProjectRow;

      return json(origin, 200, {
        ok: true,
        saved: true,
        student: { name: roster.display_name, group_code: roster.group_code, institutional_email: identity.institutional_email },
        project: projectPayload(project),
        progress: await loadProgress(project),
        code_workspace: await loadCodeWorkspace(project),
        options: buildOptions(project, preferredTrack),
      });
    }

    if (action !== "load") return json(origin, 404, { error: "not_found" });

    await admin.from("seminar_project_access_events").insert({
      student_registry_id: identity.student_registry_id,
      success: true,
      email_hash: emailHash,
      ip_hash: ipHash,
      user_agent: userAgent,
    });

    return json(origin, 200, {
      ok: true,
      student: { name: roster.display_name, group_code: roster.group_code, institutional_email: identity.institutional_email },
      project: projectPayload(project ?? virtualProject(roster, preferredTrack)),
      progress: await loadProgress(project),
      code_workspace: await loadCodeWorkspace(project),
      options: buildOptions(project, preferredTrack),
    });
  } catch (error) {
    console.error(error);
    return json(origin, 400, { error: "invalid_request" });
  }
});
