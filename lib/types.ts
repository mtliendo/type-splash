export interface KeystrokeEvent {
  t: number;
  key: string;
  target: string;
  correct: boolean;
}

export interface GhostRun {
  id: number;
  totalTimeMs: number;
  accuracy: number;
  keystrokeLog: KeystrokeEvent[];
  createdAt: string;
}

export interface RaceResult {
  drillId: string;
  totalTimeMs: number;
  accuracy: number;
  lettersPerMinute: number;
  correctCount: number;
  attemptCount: number;
  keystrokeLog: KeystrokeEvent[];
  beatGhostCount: number;
  personalBest: boolean;
  previousBestMs: number | null;
}
