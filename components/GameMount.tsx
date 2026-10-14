"use client";

import { useEffect, useRef } from "react";
import type { GhostRun, KeystrokeEvent } from "@/lib/types";
import type { SerializedDrill } from "@/game/types";

export function GameMount({
  drill,
  ghosts,
  muted,
  debugPhase,
  onFinish,
}: {
  drill: SerializedDrill;
  ghosts: GhostRun[];
  muted: boolean;
  debugPhase?: "countdown" | "race" | "finish" | null;
  onFinish: (payload: {
    totalTimeMs: number;
    accuracy: number;
    lettersPerMinute: number;
    correctCount: number;
    attemptCount: number;
    keystrokeLog: KeystrokeEvent[];
  }) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const finishRef = useRef(onFinish);

  useEffect(() => {
    finishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;
    let destroyed = false;
    let game: { destroy: (removeCanvas: boolean) => void } | null = null;

    void import("@/game/createGame")
      .then(({ createTypeSplashGame }) => {
        if (destroyed || !parentRef.current) return;
        game = createTypeSplashGame({
          parent: parentRef.current,
          drill,
          ghosts,
          debugPhase,
          onFinish: (payload) => finishRef.current(payload),
        });
        window.dispatchEvent(new CustomEvent("type-splash-mute", { detail: { muted } }));
      })
      .catch((error: unknown) => {
        console.error("Type Splash failed to start", error);
        if (parent) {
          parent.textContent = "The pool could not load. Refresh, or check the browser console.";
        }
      });

    return () => {
      destroyed = true;
      game?.destroy(true);
      game = null;
    };
    // muted is applied through the custom event below so toggling it does not remount Phaser.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drill, ghosts, debugPhase]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("type-splash-mute", { detail: { muted } }));
  }, [muted]);

  return <div ref={parentRef} className="game-frame" data-muted={muted ? "1" : "0"} />;
}

export default GameMount;
