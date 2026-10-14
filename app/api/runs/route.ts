import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDrill } from "@/lib/drills";
import { getFastestRuns, getPersonalBestMs, saveRun } from "@/lib/runs";
import type { KeystrokeEvent } from "@/lib/types";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const drillId = getDrill(url.searchParams.get("drill")).id;
  const ghosts = await getFastestRuns(user.sub, drillId, 3);
  const personalBestMs = await getPersonalBestMs(user.sub, drillId);

  return NextResponse.json({ ghosts, personalBestMs, drillId });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Invalid time" }, { status: 400 });
  }
  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 1) {
    return NextResponse.json({ error: "Invalid accuracy" }, { status: 400 });
  }

  const previousBestMs = await getPersonalBestMs(user.sub, drill.id);
  const ghosts = await getFastestRuns(user.sub, drill.id, 3);
  const beatGhostCount = ghosts.filter((ghost) => totalTimeMs < ghost.totalTimeMs).length;
  const personalBest = previousBestMs === null || totalTimeMs < previousBestMs;

  const saved = await saveRun({
    userSub: user.sub,
    drillId: drill.id,
    totalTimeMs: Math.round(totalTimeMs),
    accuracy,
    keystrokeLog,
  });

  return NextResponse.json({
    id: saved?.id,
    personalBest,
    previousBestMs,
    beatGhostCount,
  });
}
