import type { GhostRun, KeystrokeEvent } from "@/lib/types";

export interface SerializedDrill {
  id: string;
  label: string;
  raceMeters: number;
  alphabet: string[];
}

export interface GameHooks {
  parent: HTMLElement;
  drill: SerializedDrill;
  ghosts: GhostRun[];
  debugPhase?: "countdown" | "race" | "finish" | null;
  onReady?: () => void;
  onLetter?: (letter: string) => void;
  onFinish: (payload: {
    totalTimeMs: number;
    accuracy: number;
    lettersPerMinute: number;
    correctCount: number;
    attemptCount: number;
    keystrokeLog: KeystrokeEvent[];
  }) => void;
}

export interface SwimmerStyle {
  ghost: boolean;
  skin: number;
  hair: number;
  cap: number;
  capStripe: number;
  goggles: number;
  suitDark: number;
  suitMid: number;
  suitGreen: number;
  glow: number;
  label: string;
}
