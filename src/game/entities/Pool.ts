import * as Phaser from "phaser";

const LANE_COLORS = [0x38bdf8, 0x0ea5e9, 0x0284c7, 0x0369a1];

export class PoolWorld {
  readonly laneYs: number[] = [];
  readonly startX: number;
  readonly finishX: number;
  readonly raceWidth: number;
  readonly waterTop: number;
  readonly waterBottom: number;

  constructor(private scene: Phaser.Scene, width: number, height: number) {
    this.waterTop = 118;
    this.waterBottom = height - 168;
    this.startX = 118;
    this.finishX = width - 128;
    this.raceWidth = this.finishX - this.startX;

    this.drawDeck(width, height);
    this.drawWater(width);
    this.drawLanes(width);
    this.drawBlocks();
    this.drawFinish(width);
    this.spawnDecor(width);
  }

  private drawDeck(width: number, height: number) {
    const g = this.scene.add.graphics();
    g.fillGradientStyle(0xffedd5, 0xfdba74, 0xf97316, 0xfb923c, 1);
    g.fillRect(0, 0, width, height);
    g.fillStyle(0xf8fafc, 1);
    g.fillRoundedRect(24, 72, width - 48, height - 210, 28);
    g.fillStyle(0xea580c, 1);
    g.fillRoundedRect(36, 86, width - 72, 24, 10);
    g.fillRoundedRect(36, height - 186, width - 72, 18, 8);

    this.scene.add
      .text(width / 2, 42, "TYPE SPLASH  ·  25m FREESTYLE", {
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
    g.fillGradientStyle(0x7dd3fc, 0x38bdf8, 0x0284c7, 0x0369a1, 1);
    g.fillRoundedRect(48, this.waterTop, width - 96, waterH, 18);

    for (let i = 0; i < 18; i++) {
      const shimmer = this.scene.add.ellipse(
        80 + Math.random() * (width - 160),
        this.waterTop + 20 + Math.random() * (waterH - 40),
        40 + Math.random() * 70,
        8 + Math.random() * 8,
        0xffffff,
        0.08 + Math.random() * 0.08,
      );
      this.scene.tweens.add({
        targets: shimmer,
        x: shimmer.x + 24,
        alpha: { from: 0.05, to: 0.18 },
        duration: 1800 + Math.random() * 1600,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 800,
      });
    }

    for (let i = 0; i < 16; i++) {
      const bubble = this.scene.add.circle(
        90 + Math.random() * (width - 180),
        this.waterBottom - 10,
        3 + Math.random() * 5,
        0xe0f2fe,
        0.45,
      );
      this.scene.tweens.add({
        targets: bubble,
        y: this.waterTop + 16,
        x: bubble.x + Phaser.Math.Between(-20, 20),
        alpha: 0,
        duration: 2800 + Math.random() * 2200,
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
      const tint = this.scene.add.rectangle(width / 2, y, width - 120, laneH - 8, LANE_COLORS[i], 0.12);
      tint.setStrokeStyle(0);

      if (i < laneCount) {
        const ropeY = this.waterTop + laneH * (i + 1);
        if (i < laneCount - 1) {
          this.drawRope(60, width - 60, ropeY);
        }
      }
    }

    this.drawRope(60, width - 60, this.waterTop + 8);
    this.drawRope(60, width - 60, this.waterBottom - 8);
  }

  private drawRope(x1: number, x2: number, y: number) {
    const colors = [0xef4444, 0xffffff, 0x3b82f6];
    let i = 0;
    for (let x = x1; x <= x2; x += 14) {
      const bead = this.scene.add.circle(x, y, 5, colors[i % colors.length], 1);
      bead.setStrokeStyle(1, 0x0f172a, 0.15);
      i += 1;
    }
  }

  private drawBlocks() {
    this.laneYs.forEach((y, i) => {
      const block = this.scene.add.rectangle(64, y, 44, 36, 0x1e293b, 1);
      block.setStrokeStyle(3, 0x4ade80, 1);
      this.scene.add
        .text(64, y, String(i + 1), {
          fontFamily: "Fredoka, sans-serif",
          fontSize: "16px",
          color: "#f8fafc",
        })
        .setOrigin(0.5);
    });
  }

  private drawFinish(width: number) {
    const x = width - 78;
    this.laneYs.forEach((y) => {
      const flag = this.scene.add.triangle(x, y - 18, 0, 12, 22, 0, 22, 12, 0x4ade80);
      const pole = this.scene.add.rectangle(x - 2, y, 4, 36, 0x111827);
      void flag;
      void pole;
    });
    this.scene.add
      .text(x, this.waterTop - 16, "FINISH", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "14px",
        color: "#14532d",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
  }

  private spawnDecor(width: number) {
    this.scene.add
      .text(width / 2, this.waterBottom + 10, "home row  ·  a s d f j k l ;  ·  two hands", {
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
