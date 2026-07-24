import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

type RouteDefinition = {
  path: string;
  module: string;
};

type VercelLikeRequest = IncomingMessage & {
  body?: unknown;
  query: Record<string, string | string[]>;
};

type VercelLikeResponse = ServerResponse & {
  status(code: number): VercelLikeResponse;
  json(value: unknown): VercelLikeResponse;
  send(value: unknown): VercelLikeResponse;
};

const serverRoot = path.dirname(fileURLToPath(import.meta.url));
const staticRoot = path.resolve(serverRoot, "../dist");
const routes = JSON.parse(
  await readFile(path.join(serverRoot, "routes.json"), "utf8"),
) as RouteDefinition[];
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";
const bodyLimit = Number(process.env.REQUEST_BODY_LIMIT_BYTES ?? 10 * 1024 * 1024);

const mimeTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

function setSecurityHeaders(response: ServerResponse) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-Frame-Options", "SAMEORIGIN");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
}

function enhanceResponse(response: ServerResponse): VercelLikeResponse {
  const enhanced = response as VercelLikeResponse;
  enhanced.status = (code) => {
    enhanced.statusCode = code;
    return enhanced;
  };
  enhanced.json = (value) => {
    if (!enhanced.hasHeader("Content-Type")) {
      enhanced.setHeader("Content-Type", "application/json; charset=utf-8");
    }
    enhanced.end(JSON.stringify(value));
    return enhanced;
  };
  enhanced.send = (value) => {
    if (Buffer.isBuffer(value) || value instanceof Uint8Array) enhanced.end(value);
    else if (typeof value === "string") enhanced.end(value);
    else enhanced.json(value);
    return enhanced;
  };
  return enhanced;
}

function addQueryValue(
  query: Record<string, string | string[]>,
  name: string,
  value: string,
) {
  const current = query[name];
  if (current === undefined) query[name] = value;
  else if (Array.isArray(current)) current.push(value);
  else query[name] = [current, value];
}

function matchRoute(pathname: string) {
  const requestSegments = pathname.split("/").filter(Boolean);
  for (const route of routes) {
    const routeSegments = route.path.split("/").filter(Boolean);
    if (routeSegments.length !== requestSegments.length) continue;

    const params: Record<string, string> = {};
    let matches = true;
    for (let index = 0; index < routeSegments.length; index += 1) {
      const expected = routeSegments[index];
      const actual = requestSegments[index];
      if (expected.startsWith(":")) params[expected.slice(1)] = decodeURIComponent(actual);
      else if (expected !== actual) {
        matches = false;
        break;
      }
    }
    if (matches) return { route, params };
  }
  return null;
}

async function parseBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > bodyLimit) throw new Error("Request body too large");
    chunks.push(buffer);
  }

  if (chunks.length === 0) return undefined;
  const raw = Buffer.concat(chunks);
  const contentType = String(request.headers["content-type"] ?? "").toLowerCase();
  if (contentType.includes("application/json")) return JSON.parse(raw.toString("utf8"));
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(raw.toString("utf8")));
  }
  return raw.toString("utf8");
}

async function handleApi(
  request: IncomingMessage,
  response: VercelLikeResponse,
  url: URL,
): Promise<boolean> {
  const matched = matchRoute(url.pathname);
  if (!matched) return false;

  const adapted = request as VercelLikeRequest;
  adapted.query = { ...matched.params };
  for (const [name, value] of url.searchParams.entries()) {
    addQueryValue(adapted.query, name, value);
  }

  if (
    url.pathname !== "/api/stripe/webhook" &&
    request.method !== "GET" &&
    request.method !== "HEAD"
  ) {
    adapted.body = await parseBody(request);
  }

  const moduleUrl = pathToFileURL(path.resolve(serverRoot, matched.route.module)).href;
  const handlerModule = (await import(moduleUrl)) as {
    default?: (req: VercelLikeRequest, res: VercelLikeResponse) => unknown;
  };
  if (typeof handlerModule.default !== "function") {
    throw new Error(`API module has no default handler: ${matched.route.module}`);
  }

  await handlerModule.default(adapted, response);
  return true;
}

function publicRuntimeConfig() {
  return {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? "",
    VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
    VITE_SITE_URL: process.env.VITE_SITE_URL ?? "",
    VITE_GA4_ID: process.env.VITE_GA4_ID ?? "",
    VITE_ONESIGNAL_APP_ID: process.env.VITE_ONESIGNAL_APP_ID ?? "",
    VITE_SENTRY_DSN: process.env.VITE_SENTRY_DSN ?? "",
    VITE_SENTRY_ENVIRONMENT: process.env.VITE_SENTRY_ENVIRONMENT ?? "",
    VITE_SENTRY_RELEASE: process.env.VITE_SENTRY_RELEASE ?? "",
    VITE_SENTRY_TRACES_SAMPLE_RATE: process.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? "",
  };
}

async function sendFile(
  request: IncomingMessage,
  response: ServerResponse,
  absolutePath: string,
  cacheControl: string,
) {
  const file = await readFile(absolutePath);
  response.statusCode = 200;
  response.setHeader(
    "Content-Type",
    mimeTypes[path.extname(absolutePath).toLowerCase()] ?? "application/octet-stream",
  );
  response.setHeader("Content-Length", file.length);
  response.setHeader("Cache-Control", cacheControl);
  if (request.method === "HEAD") response.end();
  else response.end(file);
}

async function handleStatic(
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
): Promise<void> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.statusCode = 405;
    response.setHeader("Allow", "GET, HEAD");
    response.end("Method not allowed");
    return;
  }

  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.statusCode = 400;
    response.end("Bad request");
    return;
  }

  const relativePath = pathname.replace(/^\/+/, "");
  const requestedPath = path.resolve(staticRoot, relativePath || "index.html");
  const withinStaticRoot =
    requestedPath === staticRoot || requestedPath.startsWith(`${staticRoot}${path.sep}`);
  if (!withinStaticRoot) {
    response.statusCode = 400;
    response.end("Bad request");
    return;
  }

  try {
    const info = await stat(requestedPath);
    if (info.isFile()) {
      await sendFile(
        request,
        response,
        requestedPath,
        pathname.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "public, max-age=3600",
      );
      return;
    }
  } catch {
    // SPA fallback below.
  }

  await sendFile(request, response, path.join(staticRoot, "index.html"), "no-cache");
}

const server = createServer(async (request, rawResponse) => {
  const response = enhanceResponse(rawResponse);
  setSecurityHeaders(response);

  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    if (url.pathname === "/healthz") {
      response.status(200).json({ ok: true });
      return;
    }

    const canonicalHost = process.env.CANONICAL_HOST?.trim();
    const forwardedHost = String(request.headers["x-forwarded-host"] ?? request.headers.host ?? "")
      .split(",")[0]
      .trim()
      .split(":")[0];

    if (canonicalHost && forwardedHost && forwardedHost !== canonicalHost) {
      response.statusCode = 308;
      response.setHeader("Location", `https://${canonicalHost}${url.pathname}${url.search}`);
      response.end();
      return;
    }

    if (url.pathname === "/runtime-config.js") {
      response.statusCode = 200;
      response.setHeader("Content-Type", "text/javascript; charset=utf-8");
      response.setHeader("Cache-Control", "no-store");
      response.end(`window.__MOON_CONFIG__=${JSON.stringify(publicRuntimeConfig())};`);
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      const handled = await handleApi(request, response, url);
      if (!handled) response.status(404).json({ error: "API route not found." });
      return;
    }

    await handleStatic(request, response, url);
  } catch (error) {
    console.error("[server]", error);
    if (!response.headersSent) response.status(500).json({ error: "Internal server error." });
    else if (!response.writableEnded) response.end();
  }
});

server.listen(port, host, () => {
  console.log(`: moon listening on http://${host}:${port}`);
});

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down.`);
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
