import { getUserSub } from "../lib/auth.js";
import { getDrill } from "../lib/drills.js";
import { getFastestRuns, getPersonalBestMs, saveRun } from "../lib/runs.js";
import type { KeystrokeEvent } from "../lib/types.js";

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

async function handle(request: Request) {
  try {
    const sub = await getUserSub(request);
    if (!sub) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (request.method === "GET") {
      const url = new URL(request.url);
      const drillId = getDrill(url.searchParams.get("drill")).id;
      const ghosts = await getFastestRuns(sub, drillId, 3);
      const personalBestMs = await getPersonalBestMs(sub, drillId);
      return Response.json({ ghosts, personalBestMs, drillId });
    }

    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const body = (await request.json()) as {
      drillId?: string;
      totalTimeMs?: number;
      accuracy?: number;
      keystrokeLog?: KeystrokeEvent[];
    };

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
      keystrokeLog,
    });

    return Response.json({
      id: saved?.id,
      personalBest,
      previousBestMs,
      beatGhostCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    console.error("[api/runs]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
