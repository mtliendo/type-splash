import * as Phaser from "phaser";
import { isTypingAttempt, normalizeTypedKey } from "@/lib/drills";
import type { GhostRun, KeystrokeEvent } from "@/lib/types";
import { RaceAudio } from "../audio";
import { KeyboardHint } from "../entities/KeyboardHint";
import { LetterTile } from "../entities/LetterTile";
import { PoolWorld } from "../entities/Pool";
import { GHOST_STYLE, Swimmer, XAVIER_STYLE } from "../entities/Swimmer";
import type { GameHooks, SerializedDrill } from "../types";

interface GhostRacer {
  swimmer: Swimmer;
  times: number[];
  meter: number;
}

export class RaceScene extends Phaser.Scene {
  private hooks!: GameHooks;
  private drill!: SerializedDrill;
  private pool!: PoolWorld;
  private xavier!: Swimmer;
  private ghosts: GhostRacer[] = [];
  private keyboard!: KeyboardHint;
  private audio = new RaceAudio();
  private letterTile!: LetterTile;
  private timerText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private bannerText!: Phaser.GameObjects.Text;
  private target = "";
  private meter = 0;
  private attempts = 0;
  private correct = 0;
  private startedAt = 0;
  private elapsedMs = 0;
  private racing = false;
  private finished = false;
  private log: KeystrokeEvent[] = [];
  private keyHandler?: (event: KeyboardEvent) => void;

  constructor() {
    super("race");
  }

  init(data: GameHooks) {
    this.hooks = data;
    this.drill = data.drill;
  }

  create() {
    const { width, height } = this.scale;
    this.pool = new PoolWorld(this, width, height);

    const xavierLane = 1;
    const ghostLanes = [0, 2, 3];
    this.xavier = new Swimmer(
      this,
      this.pool.startX - 28,
      this.pool.laneYs[xavierLane]!,
      { ...XAVIER_STYLE, label: "Xavier" },
    ).setTag("YOU", "#14532d");

    this.hooks.ghosts.slice(0, 3).forEach((ghost, i) => {
      const lane = ghostLanes[i] ?? 0;
      const swimmer = new Swimmer(this, this.pool.startX - 28, this.pool.laneYs[lane]!, {
        ...GHOST_STYLE,
        label: `Ghost ${i + 1}`,
      }).setTag(`PB #${i + 1}`, "#312e81");
      this.ghosts.push({
        swimmer,
        times: correctTimes(ghost),
        meter: 0,
      });
    });

    this.keyboard = new KeyboardHint(this, width, height);
    this.letterTile = new LetterTile(this, this.pool.startX + 90, this.pool.laneYs[xavierLane]! - 78);

    this.timerText = this.add
      .text(width - 56, 42, "0:00.00", {
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "18px",
        color: "#7c2d12",
      })
      .setOrigin(1, 0.5);

    this.progressText = this.add
      .text(56, 42, "0 / 25 m", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "18px",
        color: "#7c2d12",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);

    this.bannerText = this.add
      .text(width / 2, 250, "", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "48px",
        color: "#fff7ed",
        fontStyle: "bold",
        stroke: "#9a3412",
        strokeThickness: 6,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(30);

    if (this.input.keyboard) {
      this.input.keyboard.enabled = true;
    }
    this.keyHandler = (event: KeyboardEvent) => this.onKey(event);
    window.addEventListener("keydown", this.keyHandler, { capture: true });
    const muteListener = (event: Event) => {
      const muted = Boolean((event as CustomEvent<{ muted?: boolean }>).detail?.muted);
      this.setMuted(muted);
    };
    window.addEventListener("type-splash-mute", muteListener);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("type-splash-mute", muteListener);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup());

    this.hooks.onReady?.();

    if (this.hooks.debugPhase === "race") {
      this.skipToMidRace();
      return;
    }
    if (this.hooks.debugPhase === "finish") {
      this.skipToFinish();
      return;
    }

    this.runCountdown();
  }

  update() {
    this.letterTile.place(
      Phaser.Math.Clamp(this.xavier.x + 72, 260, this.scale.width - 220),
      this.pool.laneYs[1]! - 78,
    );
    if (!this.racing || this.finished) return;
    this.elapsedMs = performance.now() - this.startedAt;
    this.timerText.setText(formatClock(this.elapsedMs));
    this.advanceGhosts(this.elapsedMs);
  }

  private cleanup() {
    if (this.keyHandler) {
      window.removeEventListener("keydown", this.keyHandler, { capture: true });
      this.keyHandler = undefined;
    }
  }

  private async runCountdown() {
    if (this.hooks.debugPhase === "countdown") {
      this.bannerText.setText("On your marks…");
      this.bannerText.setScale(1);
      return;
    }
    const hold = 1100;
    await this.say("On your marks…", hold);
    await this.say("get set…", hold);
    this.audio.unlock();
    this.audio.horn();
    await this.say("BEEP!", 420);
    this.bannerText.setText("");
    this.xavier.dive(this.pool.startX, this.pool.laneYs[1]!, () => {
      this.beginRace();
    });
    this.ghosts.forEach((ghost, i) => {
      const lane = [0, 2, 3][i] ?? 0;
      this.time.delayedCall(80 * i, () => {
        ghost.swimmer.dive(this.pool.startX, this.pool.laneYs[lane]!);
      });
    });
  }

  private say(text: string, ms: number) {
    this.bannerText.setText(text);
    this.bannerText.setScale(0.7);
    this.tweens.add({
      targets: this.bannerText,
      scale: 1,
      duration: 180,
      ease: "Back.out",
    });
    return new Promise<void>((resolve) => this.time.delayedCall(ms, () => resolve()));
  }

  private beginRace() {
    this.racing = true;
    this.startedAt = performance.now();
    this.nextLetter();
  }

  private skipToMidRace() {
    this.meter = 8;
    this.correct = 8;
    this.attempts = 9;
    this.xavier.x = this.pool.xForMeter(this.meter, this.drill.raceMeters);
    this.xavier.y = this.pool.laneYs[1]!;
    this.xavier.playSwim();
    this.ghosts.forEach((ghost, i) => {
      const lane = [0, 2, 3][i] ?? 0;
      ghost.meter = Math.max(3, 7 - i);
      ghost.swimmer.x = this.pool.xForMeter(ghost.meter, this.drill.raceMeters);
      ghost.swimmer.y = this.pool.laneYs[lane]!;
      ghost.swimmer.playSwim();
    });
    this.progressText.setText(`${this.meter} / ${this.drill.raceMeters} m`);
    this.beginRace();
  }

  private skipToFinish() {
    this.meter = this.drill.raceMeters;
    this.correct = this.drill.raceMeters;
    this.attempts = this.drill.raceMeters + 2;
    this.elapsedMs = 18420;
    this.xavier.x = this.pool.xForMeter(this.meter, this.drill.raceMeters);
    this.xavier.y = this.pool.laneYs[1]!;
    this.xavier.playSwim();
    this.ghosts.forEach((ghost, i) => {
      const lane = [0, 2, 3][i] ?? 0;
      ghost.meter = Math.max(18, 22 - i);
      ghost.swimmer.x = this.pool.xForMeter(ghost.meter, this.drill.raceMeters);
      ghost.swimmer.y = this.pool.laneYs[lane]!;
      ghost.swimmer.playSwim();
    });
    this.finishRace();
  }

  private nextLetter() {
    const alphabet = this.drill.alphabet;
    let next = alphabet[Math.floor(Math.random() * alphabet.length)]!;
    if (alphabet.length > 1 && next === this.target) {
      next = alphabet[Math.floor(Math.random() * alphabet.length)]!;
    }
    this.target = next;
    this.letterTile.show(next);
    this.keyboard.highlightLetter(next);
    this.hooks.onLetter?.(next);
  }

  private onKey(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "Escape") return;
    if (!isTypingAttempt(event.key) && event.key !== ";") return;
    if (!this.racing || this.finished) return;

    event.preventDefault();
    const key = normalizeTypedKey(event.key);
    const correct = key === this.target;
    this.attempts += 1;
    this.log.push({
      t: Math.round(performance.now() - this.startedAt),
      key,
      target: this.target,
      correct,
    });

    if (correct) {
      this.correct += 1;
      this.meter += 1;
      this.audio.splash();
      this.letterTile.pop();
      this.cameras.main.shake(70, 0.0035);
      this.progressText.setText(`${this.meter} / ${this.drill.raceMeters} m`);
      const dest = this.pool.xForMeter(this.meter, this.drill.raceMeters);
      this.xavier.strokeTo(dest);
      if (this.meter >= this.drill.raceMeters) {
        this.finishRace();
        return;
      }
      this.nextLetter();
    } else {
      this.audio.bonk();
      this.letterTile.wobble();
      this.xavier.bonkBubble();
    }
  }

  private advanceGhosts(elapsed: number) {
    this.ghosts.forEach((ghost) => {
      while (ghost.meter < this.drill.raceMeters && elapsed >= (ghost.times[ghost.meter] ?? Number.POSITIVE_INFINITY)) {
        ghost.meter += 1;
        ghost.swimmer.strokeTo(this.pool.xForMeter(ghost.meter, this.drill.raceMeters));
        if (ghost.meter === 1 || ghost.meter % 4 === 0) {
          this.audio.splash();
        }
      }
    });
  }

  private finishRace() {
    if (this.finished) return;
    this.finished = true;
    this.racing = false;
    this.elapsedMs = this.elapsedMs || performance.now() - this.startedAt;
    this.progressText.setText(`${this.drill.raceMeters} / ${this.drill.raceMeters} m`);
    this.letterTile.hide();
    this.bannerText.setText("Finish!");
    this.xavier.celebrate();
    this.finishWallSplash();
    this.cameras.main.shake(160, 0.006);
    this.audio.cheer();
    this.burstConfetti();

    const minutes = this.elapsedMs / 60000;
    const lettersPerMinute = minutes > 0 ? this.correct / minutes : 0;
    const accuracy = this.attempts > 0 ? this.correct / this.attempts : 1;

    this.hooks.onFinish({
      totalTimeMs: Math.round(this.elapsedMs),
      accuracy,
      lettersPerMinute,
      correctCount: this.correct,
      attemptCount: this.attempts,
      keystrokeLog: this.log,
    });
  }

  private finishWallSplash() {
    const x = this.pool.finishX + 20;
    const y = this.pool.laneYs[1]!;
    for (let i = 0; i < 28; i++) {
      const drop = this.add.ellipse(
        x,
        y,
        Phaser.Math.Between(8, 18),
        Phaser.Math.Between(5, 12),
        Phaser.Utils.Array.GetRandom([0xffffff, 0xe0f2fe, 0x7dd3fc]),
        0.95,
      );
      drop.setDepth(14);
      this.tweens.add({
        targets: drop,
        x: x + Phaser.Math.Between(-80, 30),
        y: y + Phaser.Math.Between(-70, 40),
        alpha: 0,
        duration: 420 + Math.random() * 280,
        onComplete: () => drop.destroy(),
      });
    }
  }

  private burstConfetti() {
    const { width } = this.scale;
    for (let i = 0; i < 56; i++) {
      const bit = this.add.rectangle(
        width / 2 + Phaser.Math.Between(-100, 100),
        170,
        Phaser.Math.Between(8, 14),
        Phaser.Math.Between(10, 18),
        Phaser.Utils.Array.GetRandom([0xfacc15, 0x4ade80, 0x38bdf8, 0xfb7185, 0xf97316, 0xfde68a]),
      );
      bit.setDepth(28);
      this.tweens.add({
        targets: bit,
        x: bit.x + Phaser.Math.Between(-240, 240),
        y: 660,
        angle: Phaser.Math.Between(-280, 280),
        alpha: 0,
        duration: 1100 + Math.random() * 800,
      });
    }
  }

  setMuted(muted: boolean) {
    this.audio.setMuted(muted);
  }
}

function correctTimes(ghost: GhostRun) {
  return ghost.keystrokeLog.filter((event) => event.correct).map((event) => event.t);
}

function formatClock(ms: number) {
  const total = Math.max(0, ms);
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const hundredths = Math.floor((total % 1000) / 10);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}
