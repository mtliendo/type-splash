var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// lib/auth.ts
import { createRemoteJWKSet, jwtVerify } from "jose";
var STUB_USER = {
  sub: "stub|xavier-local",
  name: "Xavier (local stub)"
};
function isAuthStub() {
  return process.env.AUTH_STUB === "1" || process.env.VITE_AUTH_STUB === "1";
}
function domain() {
  const value = process.env.AUTH0_DOMAIN ?? "";
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
function issuer() {
  return process.env.AUTH0_ISSUER ?? `https://${domain()}/`;
}
function audience() {
  return process.env.AUTH0_AUDIENCE ?? process.env.VITE_AUTH0_AUDIENCE ?? "";
}
var jwks = null;
function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`https://${domain()}/.well-known/jwks.json`));
  }
  return jwks;
}
async function getUserSub(request) {
  if (isAuthStub()) {
    return STUB_USER.sub;
  }
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: issuer(),
    audience: audience()
  });
  return typeof payload.sub === "string" ? payload.sub : null;
}

// lib/drills.ts
var HOME_ROW_LETTERS = ["a", "s", "d", "f", "j", "k", "l", ";"];
function pickFrom(alphabet) {
  return alphabet[Math.floor(Math.random() * alphabet.length)];
}
var HOME_ROW_FREESTYLE = {
  id: "home-row-letters",
  label: "25m Home-Row Freestyle",
  description: "One random home-row letter at a time. Twenty-five correct keys finish the race.",
  raceMeters: 25,
  alphabet: HOME_ROW_LETTERS,
  pickTarget: () => pickFrom(HOME_ROW_LETTERS)
};
var DRILLS = {
  "home-row-letters": HOME_ROW_FREESTYLE
};
var DEFAULT_DRILL = HOME_ROW_FREESTYLE;
function getDrill(id) {
  if (id && id in DRILLS) {
    return DRILLS[id];
  }
  return DEFAULT_DRILL;
}

// lib/runs.ts
import { and, asc, eq } from "drizzle-orm";

// lib/db.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// lib/schema.ts
var schema_exports = {};
__export(schema_exports, {
  runs: () => runs
});
import {
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp
} from "drizzle-orm/pg-core";
var runs = pgTable(
  "runs",
  {
    id: serial("id").primaryKey(),
    userSub: text("user_sub").notNull(),
    drillId: text("drill_id").notNull().default("home-row-letters"),
    totalTimeMs: integer("total_time_ms").notNull(),
    accuracy: real("accuracy").notNull(),
    keystrokeLog: jsonb("keystroke_log").$type().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("runs_user_drill_time_idx").on(table.userSub, table.drillId, table.totalTimeMs)
  ]
);

// lib/db.ts
function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}
var cached = null;
function getDb() {
  if (!cached) {
    cached = drizzle(neon(requireDatabaseUrl()), { schema: schema_exports });
  }
  return cached;
}

// lib/runs.ts
async function getFastestRuns(userSub, drillId, limit = 3) {
  const rows = await getDb().select().from(runs).where(and(eq(runs.userSub, userSub), eq(runs.drillId, drillId))).orderBy(asc(runs.totalTimeMs), asc(runs.createdAt)).limit(limit);
  return rows.map((row) => ({
    id: row.id,
    totalTimeMs: row.totalTimeMs,
    accuracy: row.accuracy,
    keystrokeLog: row.keystrokeLog,
    createdAt: row.createdAt.toISOString()
  }));
}
async function getPersonalBestMs(userSub, drillId) {
  const [best] = await getDb().select({ totalTimeMs: runs.totalTimeMs }).from(runs).where(and(eq(runs.userSub, userSub), eq(runs.drillId, drillId))).orderBy(asc(runs.totalTimeMs)).limit(1);
  return best?.totalTimeMs ?? null;
}
async function saveRun(input) {
  const [row] = await getDb().insert(runs).values({
    userSub: input.userSub,
    drillId: input.drillId,
    totalTimeMs: input.totalTimeMs,
    accuracy: input.accuracy,
    keystrokeLog: input.keystrokeLog
  }).returning({ id: runs.id });
  return row;
}

// server/runs-api.ts
async function GET(request) {
  return handle(request);
}
async function POST(request) {
  return handle(request);
}
async function handle(request) {
  try {
    const sub = await getUserSub(request);
    if (!sub) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (request.method === "GET") {
      const url = new URL(request.url);
      const drillId = getDrill(url.searchParams.get("drill")).id;
      const ghosts2 = await getFastestRuns(sub, drillId, 3);
      const personalBestMs = await getPersonalBestMs(sub, drillId);
      return Response.json({ ghosts: ghosts2, personalBestMs, drillId });
    }
    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }
    const body = await request.json();
    const drill = getDrill(body.drillId);
    const totalTimeMs = Number(body.totalTimeMs);
    const accuracy = Number(body.accuracy);
    const keystrokeLog = Array.isArray(body.keystrokeLog) ? body.keystrokeLog : [];
    if (!Number.isFinite(totalTimeMs) || totalTimeMs <= 0) {
      return Response.json({ error: "Invalid time" }, { status: 400 });
    }
    if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 1) {
      return Response.json({ error: "Invalid accuracy" }, { status: 400 });
    }
    const previousBestMs = await getPersonalBestMs(sub, drill.id);
    const ghosts = await getFastestRuns(sub, drill.id, 3);
    const beatGhostCount = ghosts.filter((ghost) => totalTimeMs < ghost.totalTimeMs).length;
    const personalBest = previousBestMs === null || totalTimeMs < previousBestMs;
    const saved = await saveRun({
      userSub: sub,
      drillId: drill.id,
      totalTimeMs: Math.round(totalTimeMs),
      accuracy,
      keystrokeLog
    });
    return Response.json({
      id: saved?.id,
      personalBest,
      previousBestMs,
      beatGhostCount
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    console.error("[api/runs]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
export {
  GET,
  POST
};
