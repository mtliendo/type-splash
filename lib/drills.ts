export const HOME_ROW_LETTERS = ["a", "s", "d", "f", "j", "k", "l", ";"] as const;

export type HomeRowLetter = (typeof HOME_ROW_LETTERS)[number];

/** Built-in drill ids. Letter-set and word drills can be added later. */
export type DrillId = "home-row-letters";

export type FingerId =
  | "left-pinky"
  | "left-ring"
  | "left-middle"
  | "left-index"
  | "right-index"
  | "right-middle"
  | "right-ring"
  | "right-pinky";

export type Hand = "left" | "right";

export interface FingerHint {
  id: FingerId;
  hand: Hand;
  finger: string;
  label: string;
}

export const FINGER_MAP: Record<HomeRowLetter, FingerHint> = {
  a: { id: "left-pinky", hand: "left", finger: "pinky", label: "Left pinky" },
  s: { id: "left-ring", hand: "left", finger: "ring", label: "Left ring" },
  d: { id: "left-middle", hand: "left", finger: "middle", label: "Left middle" },
  f: { id: "left-index", hand: "left", finger: "index", label: "Left index" },
  j: { id: "right-index", hand: "right", finger: "index", label: "Right index" },
  k: { id: "right-middle", hand: "right", finger: "middle", label: "Right middle" },
  l: { id: "right-ring", hand: "right", finger: "ring", label: "Right ring" },
  ";": { id: "right-pinky", hand: "right", finger: "pinky", label: "Right pinky" },
};

export const HOME_ROW_BUMPS = new Set<HomeRowLetter>(["f", "j"]);

export interface DrillConfig {
  id: DrillId;
  label: string;
  description: string;
  raceMeters: number;
  alphabet: readonly string[];
  pickTarget: () => string;
}

function pickFrom(alphabet: readonly string[]): string {
  return alphabet[Math.floor(Math.random() * alphabet.length)]!;
}

export const HOME_ROW_FREESTYLE: DrillConfig = {
  id: "home-row-letters",
  label: "25m Home-Row Freestyle",
  description: "One random home-row letter at a time. Twenty-five correct keys finish the race.",
  raceMeters: 25,
  alphabet: HOME_ROW_LETTERS,
  pickTarget: () => pickFrom(HOME_ROW_LETTERS),
};

export const DRILLS: Record<DrillId, DrillConfig> = {
  "home-row-letters": HOME_ROW_FREESTYLE,
};

export const DEFAULT_DRILL = HOME_ROW_FREESTYLE;

export function getDrill(id: string | null | undefined): DrillConfig {
  if (id && id in DRILLS) {
    return DRILLS[id as DrillId];
  }
  return DEFAULT_DRILL;
}

export function isHomeRowLetter(value: string): value is HomeRowLetter {
  return (HOME_ROW_LETTERS as readonly string[]).includes(value);
}

export function normalizeTypedKey(key: string): string {
  if (key === "Semicolon") return ";";
  return key.length === 1 ? key.toLowerCase() : key.toLowerCase();
}

export function isTypingAttempt(key: string): boolean {
  if (key.length !== 1) return false;
  return /[a-z0-9;=',.\/\[\]]/i.test(key);
}
