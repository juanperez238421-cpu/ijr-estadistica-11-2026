const FUNCTION_NAME = "seminar-t3-host";
const UPSTREAM_BASE = "https://raw.githubusercontent.com/juanperez238421-cpu/IJR---Seminario/main/t3/";
const REPO_HOME = "https://github.com/juanperez238421-cpu/IJR---Seminario";

const MIME: Record<string, string> = {
  html: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  ico: "image/x-icon",
  webp: "image/webp",
};

function headersFor(path: string): Headers {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return new Headers({
    "Content-Type": MIME[ext] ?? "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": ext === "html" ? "public, max-age=30" : "public, max-age=300",
  });
}

function safeRelativePath(url: URL): { path?: string; redirect?: string; error?: string } {
  const pathname = decodeURIComponent(url.pathname);
  const markers = [`/functions/v1/${FUNCTION_NAME}`, `/${FUNCTION_NAME}`];
  let suffix: string | null = null;

  for (const marker of markers) {
    if (pathname === marker) {
      return { redirect: `${url.origin}${pathname}/${url.search}` };
    }
    if (pathname.startsWith(`${marker}/`)) {
      suffix = pathname.slice(marker.length + 1);
      break;
    }
  }

  // Supabase Edge Runtime may expose the path after the function name only,
  // e.g. "/", "/teacher.html" or "/data/course-index.json".
  if (suffix === null) suffix = pathname.replace(/^\/+/, "");

  let path = suffix || "index.html";
  if (path.endsWith("/")) path += "index.html";

  if (path.includes("..") || path.includes("\\") || path.startsWith("/")) {
    return { error: "Unsafe path" };
  }
  if (!/^[A-Za-z0-9_./-]+$/.test(path)) return { error: "Unsupported path" };
  return { path };
}

function rewriteHtml(html: string): string {
  return html
    .replaceAll('href="../monitor.html"', `href="${REPO_HOME}/blob/main/monitor.html"`)
    .replaceAll('href="../progress.html"', `href="${REPO_HOME}/blob/main/progress.html"`)
    .replaceAll('href="../"', `href="${REPO_HOME}"`);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
      },
    });
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD, OPTIONS" } });
  }

  const url = new URL(req.url);
  const route = safeRelativePath(url);
  if (route.redirect) return Response.redirect(route.redirect, 308);
  if (route.error || !route.path) return new Response(route.error ?? "Bad request", { status: 400 });

  const upstream = await fetch(`${UPSTREAM_BASE}${route.path}`, {
    headers: { "User-Agent": "IJR-Seminar-T3-Static-Host/1.1" },
  });

  if (!upstream.ok) {
    return new Response("Not found", {
      status: upstream.status === 404 ? 404 : 502,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const headers = headersFor(route.path);
  headers.set("X-IJR-Source", "GitHub-main:t3");

  if (req.method === "HEAD") return new Response(null, { status: 200, headers });

  const ext = route.path.split(".").pop()?.toLowerCase();
  if (ext === "html") {
    return new Response(rewriteHtml(await upstream.text()), { status: 200, headers });
  }

  return new Response(upstream.body, { status: 200, headers });
});
