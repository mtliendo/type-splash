import * as Phaser from "phaser";

const LANE_COLORS = [0x38bdf8, 0x0ea5e9, 0x0284c7, 0x0369a1];
const ROPE = [0xef4444, 0xffffff, 0x2563eb];

export class PoolWorld {
  readonly laneYs: number[] = [];
  readonly startX: number;
  readonly finishX: number;
  readonly raceWidth: number;
  readonly waterTop: number;
  readonly waterBottom: number;
  readonly xavierLane = 1;

  constructor(private scene: Phaser.Scene, width: number, height: number) {
    this.waterTop = 126;
    this.waterBottom = height - 168;
    this.startX = 132;
    this.finishX = width - 136;
    this.raceWidth = this.finishX - this.startX;

    this.drawDeck(width, height);
    this.drawWater(width);
    this.drawLanes(width);
    this.drawBlocks();
    this.drawFinish(width);
    this.drawCrowd(width);
    this.spawnDecor(width);
  }

  private drawDeck(width: number, height: number) {
    const g = this.scene.add.graphics();
    g.fillGradientStyle(0x38bdf8, 0x0ea5e9, 0xfdba74, 0xf97316, 1);
    g.fillRect(0, 0, width, height);

    const tile = 18;
    for (let x = 20; x < width - 20; x += tile) {
      for (let y = 64; y < 118; y += tile) {
        g.fillStyle(((x + y) / tile) % 2 === 0 ? 0xf8fafc : 0xe2e8f0, 1);
        g.fillRect(x, y, tile - 1, tile - 1);
      }
      for (let y = height - 186; y < height - 150; y += tile) {
        g.fillStyle(((x + y) / tile) % 2 === 0 ? 0xf8fafc : 0xe2e8f0, 1);
        g.fillRect(x, y, tile - 1, tile - 1);
      }
    }
    g.fillStyle(0x0ea5e9, 1);
    g.fillRoundedRect(28, 118, width - 56, 8, 4);
    g.fillRoundedRect(28, height - 176, width - 56, 8, 4);

    this.scene.add
      .text(width / 2, 40, "TYPE SPLASH  ·  25m FREESTYLE", {
        fontFamily: "Fredoka, Nunito, Comic Sans MS, sans-serif",
        fontSize: "22px",
        color: "#7c2d12",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
  }

  private drawWater(width: number) {
    const waterH = this.waterBottom - this.waterTop;
    const g = this.scene.add.graphics();
    g.fillGradientStyle(0x38bdf8, 0x0ea5e9, 0x0369a1, 0x0c4a6e, 1);
    g.fillRoundedRect(28, this.waterTop, width - 56, waterH, 18);

    for (let i = 0; i < 22; i++) {
      const shimmer = this.scene.add.ellipse(
        70 + Math.random() * (width - 140),
        this.waterTop + 16 + Math.random() * (waterH - 32),
        50 + Math.random() * 80,
        7 + Math.random() * 10,
        0xffffff,
        0.07 + Math.random() * 0.1,
      );
      this.scene.tweens.add({
        targets: shimmer,
        x: shimmer.x + 36,
        scaleX: { from: 0.8, to: 1.3 },
        alpha: { from: 0.05, to: 0.2 },
        duration: 1600 + Math.random() * 1800,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 900,
      });
    }

    for (let i = 0; i < 6; i++) {
      const wave = this.scene.add.ellipse(
        180 + i * 160,
        this.waterTop + 18,
        140,
        10,
        0xe0f2fe,
        0.12,
      );
      this.scene.tweens.add({
        targets: wave,
        x: wave.x + 24,
        y: wave.y + 6,
        duration: 1400 + i * 80,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }

    for (let i = 0; i < 18; i++) {
      const bubble = this.scene.add.circle(
        90 + Math.random() * (width - 180),
        this.waterBottom - 8,
        3 + Math.random() * 5,
        0xe0f2fe,
        0.45,
      );
      this.scene.tweens.add({
        targets: bubble,
        y: this.waterTop + 16,
        x: bubble.x + Phaser.Math.Between(-24, 24),
        alpha: 0,
        duration: 2600 + Math.random() * 2200,
        repeat: -1,
        delay: Math.random() * 2000,
      });
    }
  }

  private drawLanes(width: number) {
    const laneCount = 4;
    const waterH = this.waterBottom - this.waterTop;
    const laneH = waterH / laneCount;

    for (let i = 0; i < laneCount; i++) {
      const y = this.waterTop + laneH * i + laneH / 2;
      this.laneYs.push(y);
      this.scene.add.rectangle(width / 2, y, width - 130, laneH - 10, LANE_COLORS[i], 0.1);
      if (i < laneCount - 1) {
        this.drawRope(54, width - 54, this.waterTop + laneH * (i + 1));
      }
    }
    this.drawRope(54, width - 54, this.waterTop + 10);
    this.drawRope(54, width - 54, this.waterBottom - 10);
  }

  private drawRope(x1: number, x2: number, y: number) {
    const line = this.scene.add.rectangle((x1 + x2) / 2, y, x2 - x1, 3, 0x0f172a, 0.35);
    void line;
    let i = 0;
    for (let x = x1; x <= x2; x += 18) {
      const float = this.scene.add.ellipse(x, y, 16, 10, ROPE[i % ROPE.length], 1);
      float.setStrokeStyle(1, 0x0f172a, 0.2);
      this.scene.tweens.add({
        targets: float,
        y: y + (i % 2 === 0 ? -3 : 3),
        duration: 900 + (i % 5) * 70,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
      i += 1;
    }
  }

  private drawBlocks() {
    this.laneYs.forEach((y, i) => {
      const block = this.scene.add.container(62, y);
      const face = this.scene.add.rectangle(0, 0, 50, 34, 0x1e293b, 1).setStrokeStyle(3, 0x4ade80);
      const top = this.scene.add.rectangle(6, -16, 46, 10, 0x334155, 1);
      const num = this.scene.add
        .text(0, 0, String(i + 1), {
          fontFamily: "Fredoka, sans-serif",
          fontSize: "16px",
          color: "#f8fafc",
        })
        .setOrigin(0.5);
      block.add([top, face, num]);
    });
  }

  private drawFinish(width: number) {
    const x = width - 78;
    this.laneYs.forEach((y) => {
      const pad = this.scene.add.rectangle(x, y, 28, 42, 0xfacc15, 1).setStrokeStyle(3, 0xca8a04);
      const stripe = this.scene.add.rectangle(x, y, 28, 8, 0x111827, 0.35);
      void pad;
      void stripe;
    });
    this.scene.add
      .text(x, this.waterTop - 14, "TOUCH", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "13px",
        color: "#14532d",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
  }

  private drawCrowd(width: number) {
    const colors = [0x1e293b, 0x334155, 0x0f172a, 0x14532d, 0x7c2d12];
    for (let i = 0; i < 16; i++) {
      const x = 90 + i * 72;
      const y = 78;
      const body = this.scene.add.ellipse(x, y + 6, 16, 14, colors[i % colors.length], 0.85);
      const head = this.scene.add.circle(x, y - 4, 6, colors[i % colors.length], 0.9);
      const flag = this.scene.add.triangle(x + 10, y - 10, 0, 8, 16, 0, 16, 8, i % 2 ? 0x4ade80 : 0xf97316);
      this.scene.tweens.add({
        targets: [body, head],
        y: "-=3",
        duration: 320 + (i % 4) * 40,
        yoyo: true,
        repeat: -1,
        delay: i * 40,
      });
      this.scene.tweens.add({
        targets: flag,
        angle: { from: -18, to: 16 },
        duration: 380,
        yoyo: true,
        repeat: -1,
        delay: i * 30,
      });
    }
  }

  private spawnDecor(width: number) {
    this.scene.add
      .text(width / 2, this.waterBottom + 12, "home row  ·  a s d f j k l ;  ·  two hands", {
        fontFamily: "Nunito, sans-serif",
        fontSize: "13px",
        color: "#9a3412",
      })
      .setOrigin(0.5);
  }

  xForMeter(meter: number, raceMeters: number) {
    const t = Phaser.Math.Clamp(meter / raceMeters, 0, 1);
    return this.startX + t * this.raceWidth;
  }
}
