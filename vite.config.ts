import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";

const root = dirname(fileURLToPath(import.meta.url));

function rewritePlay(req: { url?: string }) {
  const raw = req.url ?? "";
  const [path, query] = raw.split("?");
  if (path === "/play") {
    req.url = query ? `/play.html?${query}` : "/play.html";
  }
}

function localApi(): Plugin {
  return {
    name: "type-splash-local-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        rewritePlay(req);
        const path = req.url?.split("?")[0];
        if (path !== "/api/runs") {
          next();
          return;
        }
        void dispatchRuns(server, req, res).catch((error: unknown) => {
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "API failed" }));
        });
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewritePlay(req);
        next();
      });
    },
  };
}

async function dispatchRuns(
  server: ViteDevServer,
  req: import("http").IncomingMessage,
  res: import("http").ServerResponse,
) {
  const mod = (await server.ssrLoadModule("/api/runs.ts")) as {
    GET: (request: Request) => Promise<Response>;
    POST: (request: Request) => Promise<Response>;
  };
  const url = new URL(req.url ?? "/api/runs", "http://127.0.0.1");
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const method = req.method ?? "GET";
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(","));
  }
  const request = new Request(url, {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : Buffer.concat(chunks),
  });
  const handler = method === "POST" ? mod.POST : mod.GET;
  const response = await handler(request);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.end(Buffer.from(await response.arrayBuffer()));
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, "");
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  return {
    plugins: [tailwindcss(), localApi()],
    resolve: {
      alias: {
        "@": root,
        phaser: resolve(root, "node_modules/phaser/dist/phaser.esm.min.js"),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(root, "index.html"),
          play: resolve(root, "play.html"),
        },
      },
    },
    server: {
      port: 5173,
      host: true,
    },
    preview: {
      port: 5173,
      host: true,
    },
  };
});
