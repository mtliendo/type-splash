"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EndScreen } from "@/components/EndScreen";
import GameMount from "@/components/GameMount";
import type { SerializedDrill } from "@/game/types";
import type { GhostRun, RaceResult } from "@/lib/types";

function demoGhosts(meters: number): GhostRun[] {
  const log = Array.from({ length: meters }, (_, index) => ({
    t: 720 * (index + 1),
    key: "f",
    target: "f",
    correct: true,
  }));
  return [
    {
      id: -1,
      totalTimeMs: 720 * meters,
      accuracy: 1,
      keystrokeLog: log,
      createdAt: new Date().toISOString(),
    },
  ];
}

function isDesktopKeyboard() {
  if (typeof window === "undefined") return true;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 900;
  return !coarse && !narrow;
}

export function PlayClient({
  drill,
  ghosts,
  previousBestMs,
  stub,
  debugPhase = null,
}: {
  drill: SerializedDrill;
  ghosts: GhostRun[];
  previousBestMs: number | null;
  stub: boolean;
  debugPhase?: "countdown" | "race" | "finish" | null;
}) {
  const [desktop, setDesktop] = useState(true);
  const [muted, setMuted] = useState(false);
  const [raceKey, setRaceKey] = useState(0);
  const [result, setResult] = useState<RaceResult | null>(null);
  const [ghostBoard, setGhostBoard] = useState(ghosts);
  const [bestMs, setBestMs] = useState(previousBestMs);

  const raceGhosts = useMemo(() => {
    if (ghostBoard.length > 0) return ghostBoard;
    if (debugPhase === "race" || debugPhase === "finish") return demoGhosts(drill.raceMeters);
    return ghostBoard;
  }, [debugPhase, drill.raceMeters, ghostBoard]);

  useEffect(() => {
    const sync = () => setDesktop(isDesktopKeyboard());
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const finish = useCallback(
    async (payload: Omit<RaceResult, "drillId" | "beatGhostCount" | "personalBest" | "previousBestMs">) => {
      const beatGhostCount = ghostBoard.filter((ghost) => payload.totalTimeMs < ghost.totalTimeMs).length;
      const personalBest = bestMs === null || payload.totalTimeMs < bestMs;
      const next: RaceResult = {
        ...payload,
        drillId: drill.id,
        beatGhostCount,
        personalBest,
        previousBestMs: bestMs,
      };
      setResult(next);

      try {
        const response = await fetch("/api/runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            drillId: drill.id,
            totalTimeMs: payload.totalTimeMs,
            accuracy: payload.accuracy,
            keystrokeLog: payload.keystrokeLog,
          }),
        });
        if (response.ok) {
          const saved = (await response.json()) as {
            personalBest: boolean;
            previousBestMs: number | null;
            beatGhostCount: number;
          };
          setResult({
            ...next,
            personalBest: saved.personalBest,
            previousBestMs: saved.previousBestMs,
            beatGhostCount: saved.beatGhostCount,
          });
          const refreshed = await fetch(`/api/runs?drill=${drill.id}`);
          if (refreshed.ok) {
            const data = (await refreshed.json()) as { ghosts: GhostRun[]; personalBestMs: number | null };
            setGhostBoard(data.ghosts);
            setBestMs(data.personalBestMs);
          }
        }
      } catch {
        // Keep the local result if the save fails; Xavier can still race again.
      }
    },
    [bestMs, drill.id, ghostBoard],
  );

  if (!desktop) {
    return (
      <main className="play-shell">
        <section className="desktop-gate">
          <h1>Grab a laptop</h1>
          <p>
            Type Splash is a two-hand home-row race. It needs a physical keyboard on a
            laptop or desktop — no touch, no phones.
          </p>
          <Link href="/">Back home</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="play-shell">
      <header className="play-bar">
        <Link href="/" className="wordmark">
          Type Splash
        </Link>
        <p className="play-meta">
          {drill.label}
          {stub ? " · local stub" : ""}
          {ghostBoard.length === 0
            ? " · first swim is a time trial"
            : ` · ${ghostBoard.length} ghost${ghostBoard.length === 1 ? "" : "s"} in the other lanes`}
        </p>
        <div className="play-actions">
          <button type="button" className="ghost-btn" onClick={() => setMuted((value) => !value)}>
            {muted ? "Sound off" : "Sound on"}
          </button>
          {stub ? null : (
            <a className="ghost-btn" href="/auth/logout?returnTo=/">
              Sign out
            </a>
          )}
        </div>
      </header>
      <GameMount
        key={raceKey}
        drill={drill}
        ghosts={raceGhosts}
        muted={muted}
        debugPhase={debugPhase}
        onFinish={finish}
      />
      {result ? (
        <EndScreen
          result={result}
          onAgain={() => {
            setResult(null);
            setRaceKey((value) => value + 1);
          }}
        />
      ) : null}
    </main>
  );
}
