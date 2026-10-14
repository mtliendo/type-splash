import { DEFAULT_DRILL } from "@/lib/drills";
import type { GhostRun, RaceResult } from "@/lib/types";
import { isAuthStub, logoutHome, requirePlaySession } from "./auth";
import { showEndScreen } from "./endScreen";
import { createTypeSplashGame } from "./game/createGame";
import { loadBoard, postRun } from "./runsClient";

function isDesktopKeyboard() {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 900;
  return !coarse && !narrow;
}

function debugPhase(): "countdown" | "race" | "finish" | null {
  const value = new URLSearchParams(window.location.search).get("phase");
  if (value === "countdown" || value === "race" || value === "finish") return value;
  return null;
}

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

function serializeDrill() {
  return {
    id: DEFAULT_DRILL.id,
    label: DEFAULT_DRILL.label,
    raceMeters: DEFAULT_DRILL.raceMeters,
    alphabet: [...DEFAULT_DRILL.alphabet],
  };
}

async function boot() {
  const gate = document.getElementById("gate");
  const app = document.getElementById("app");
  const gameHost = document.getElementById("game");
  const endHost = document.getElementById("end");
  const meta = document.getElementById("play-meta");
  const muteBtn = document.getElementById("mute-btn");
  const logoutBtn = document.getElementById("logout-btn");
  if (!gate || !app || !gameHost || !endHost || !meta || !muteBtn || !logoutBtn) return;

  if (!isDesktopKeyboard()) {
    gate.hidden = false;
    return;
  }

  const session = await requirePlaySession();
  app.hidden = false;
  if (session.stub) logoutBtn.hidden = true;

  const phase = debugPhase();
  let ghosts: GhostRun[] = [];
  let bestMs: number | null = null;
  try {
    const board = await loadBoard(DEFAULT_DRILL.id);
    ghosts = board.ghosts;
    bestMs = board.personalBestMs;
  } catch {
    ghosts = [];
  }
  if (ghosts.length === 0 && (phase === "race" || phase === "finish")) {
    ghosts = demoGhosts(DEFAULT_DRILL.raceMeters);
  }

  let muted = false;
  let game: { destroy: (removeCanvas: boolean) => void } | null = null;

  const updateMeta = () => {
    const stubNote = session.stub ? " · local stub" : "";
    const ghostNote =
      ghosts.length === 0
        ? " · first swim is a time trial"
        : ` · ${ghosts.length} ghost${ghosts.length === 1 ? "" : "s"} in the other lanes`;
    meta.textContent = `${DEFAULT_DRILL.label}${stubNote}${ghostNote}`;
  };

  const startRace = () => {
    game?.destroy(true);
    game = null;
    gameHost.replaceChildren();
    game = createTypeSplashGame({
      parent: gameHost,
      drill: serializeDrill(),
      ghosts,
      debugPhase: phase,
      onFinish: async (payload) => {
        const local: RaceResult = {
          ...payload,
          drillId: DEFAULT_DRILL.id,
          beatGhostCount: ghosts.filter((ghost) => payload.totalTimeMs < ghost.totalTimeMs).length,
          personalBest: bestMs === null || payload.totalTimeMs < bestMs,
          previousBestMs: bestMs,
        };
        showEndScreen(endHost, local, () => startRace());
        try {
          const saved = await postRun({
            drillId: DEFAULT_DRILL.id,
            totalTimeMs: payload.totalTimeMs,
            accuracy: payload.accuracy,
            keystrokeLog: payload.keystrokeLog,
          });
          showEndScreen(
            endHost,
            {
              ...local,
              personalBest: saved.personalBest,
              previousBestMs: saved.previousBestMs,
              beatGhostCount: saved.beatGhostCount,
            },
            () => startRace(),
          );
          const refreshed = await loadBoard(DEFAULT_DRILL.id);
          ghosts = refreshed.ghosts;
          bestMs = refreshed.personalBestMs;
          updateMeta();
        } catch {
          // Keep the local result if the save fails; Xavier can still race again.
        }
      },
    });
    window.dispatchEvent(new CustomEvent("type-splash-mute", { detail: { muted } }));
  };

  muteBtn.addEventListener("click", () => {
    muted = !muted;
    muteBtn.textContent = muted ? "Sound off" : "Sound on";
    window.dispatchEvent(new CustomEvent("type-splash-mute", { detail: { muted } }));
  });
  logoutBtn.addEventListener("click", () => {
    void logoutHome();
  });

  updateMeta();
  startRace();
}

void boot();
