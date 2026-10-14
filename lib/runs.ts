import { and, asc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { runs } from "./schema";
import type { GhostRun, KeystrokeEvent } from "./types";

export async function getFastestRuns(
  userSub: string,
  drillId: string,
  limit = 3,
): Promise<GhostRun[]> {
  const rows = await getDb()
    .select()
    .from(runs)
    .where(and(eq(runs.userSub, userSub), eq(runs.drillId, drillId)))
    .orderBy(asc(runs.totalTimeMs), asc(runs.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    totalTimeMs: row.totalTimeMs,
    accuracy: row.accuracy,
    keystrokeLog: row.keystrokeLog,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getPersonalBestMs(userSub: string, drillId: string) {
  const [best] = await getDb()
    .select({ totalTimeMs: runs.totalTimeMs })
    .from(runs)
    .where(and(eq(runs.userSub, userSub), eq(runs.drillId, drillId)))
    .orderBy(asc(runs.totalTimeMs))
    .limit(1);

  return best?.totalTimeMs ?? null;
}

export async function saveRun(input: {
  userSub: string;
  drillId: string;
  totalTimeMs: number;
  accuracy: number;
  keystrokeLog: KeystrokeEvent[];
}) {
  const [row] = await getDb()
    .insert(runs)
    .values({
      userSub: input.userSub,
      drillId: input.drillId,
      totalTimeMs: input.totalTimeMs,
      accuracy: input.accuracy,
      keystrokeLog: input.keystrokeLog,
    })
    .returning({ id: runs.id });

  return row;
}
