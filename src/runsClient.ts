import { getAccessToken } from "./auth";
import type { GhostRun, KeystrokeEvent } from "@/lib/types";

async function authHeaders() {
  const token = await getAccessToken();
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function loadBoard(drillId: string) {
  const response = await fetch(`/api/runs?drill=${encodeURIComponent(drillId)}`, {
    headers: await authHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Could not load ghosts (${response.status})`);
  }
  return (await response.json()) as {
    ghosts: GhostRun[];
    personalBestMs: number | null;
    drillId: string;
  };
}

export async function postRun(input: {
  drillId: string;
  totalTimeMs: number;
  accuracy: number;
  keystrokeLog: KeystrokeEvent[];
}) {
  const response = await fetch("/api/runs", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Could not save run (${response.status})`);
  }
  return (await response.json()) as {
    id?: number;
    personalBest: boolean;
    previousBestMs: number | null;
    beatGhostCount: number;
  };
}
