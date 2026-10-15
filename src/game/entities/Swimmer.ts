import * as Phaser from "phaser";
import type { SwimmerStyle } from "../types";

export const XAVIER_STYLE: SwimmerStyle = {
  ghost: false,
  skin: 0xd4a06a,
  hair: 0x2a1b12,
  cap: 0x141414,
  capStripe: 0x4ade80,
  goggles: 0x22c55e,
  suitDark: 0x1f2937,
  suitMid: 0x4b5563,
  suitGreen: 0x22c55e,
  glow: 0x86efac,
  label: "Xavier",
};

export const GHOST_STYLE: SwimmerStyle = {
  ghost: true,
  skin: 0xc4b5fd,
  hair: 0x312e81,
  cap: 0x1e1b4b,
  capStripe: 0xa5b4fc,
  goggles: 0x818cf8,
  suitDark: 0x4338ca,
  suitMid: 0x6366f1,
  suitGreen: 0xa5b4fc,
  glow: 0xc4b5fd,
  label: "Ghost",
};

export class Swimmer extends Phaser.GameObjects.Container {
  readonly style: SwimmerStyle;
  private nearArm: Phaser.GameObjects.Container;
  private farArm: Phaser.GameObjects.Container;
  private nearLeg: Phaser.GameObjects.Container;
  private farLeg: Phaser.GameObjects.Container;
  private torso: Phaser.GameObjects.Container;
  private head: Phaser.GameObjects.Container;
  private waterLine: Phaser.GameObjects.Ellipse;
  private waterShine: Phaser.GameObjects.Ellipse;
  private trail: Phaser.GameObjects.Ellipse[] = [];
  private swimTweens: Phaser.Tweens.Tween[] = [];
  private tag?: Phaser.GameObjects.Container;
  meter = 0;
  swimming = false;

  constructor(scene: Phaser.Scene, x: number, y: number, style: SwimmerStyle) {
    super(scene, x, y);
    this.style = style;
    this.setDepth(style.ghost ? 5 : 7);
    if (style.ghost) this.setAlpha(0.58);

    if (style.ghost) {
      const glow = scene.add.ellipse(0, 6, 118, 42, style.glow, 0.28);
      this.add(glow);
      scene.tweens.add({
        targets: glow,
        scaleX: { from: 0.92, to: 1.12 },
        scaleY: { from: 0.85, to: 1.18 },
        alpha: { from: 0.16, to: 0.38 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }

    this.farLeg = this.makeLeg(-38, 8, 1);
    this.nearLeg = this.makeLeg(-36, 2, -1);
    this.farArm = this.makeArm(10, 7, 1);
    this.torso = this.makeTorso();
    this.head = this.makeHead();
    this.nearArm = this.makeArm(12, -7, -1);

    this.waterLine = scene.add.ellipse(2, 13, 96, 22, 0x7dd3fc, style.ghost ? 0.22 : 0.38);
    this.waterShine = scene.add.ellipse(8, 10, 54, 8, 0xe0f2fe, style.ghost ? 0.16 : 0.28);
    this.trail = [-52, -66, -80].map((tx, i) =>
      scene.add.ellipse(tx, 12 + i * 2, 22 - i * 4, 9 - i, 0xffffff, 0.22 - i * 0.05),
    );

    this.add([
      ...this.trail,
      this.farLeg,
      this.farArm,
      this.torso,
      this.nearLeg,
      this.head,
      this.nearArm,
      this.waterLine,
      this.waterShine,
    ]);

    scene.add.existing(this);
    this.playReady();
  }

  setTag(label: string, color = "#14532d") {
    this.tag?.destroy();
    const tag = this.scene.add.container(8, -34);
    const pill = this.scene.add.rectangle(0, 0, 54, 18, 0xfff7ed, 0.94).setStrokeStyle(2, 0xfdba74);
    const text = this.scene.add
      .text(0, 0, label, {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "11px",
        color,
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    tag.add([pill, text]);
    this.add(tag);
    this.tag = tag;
    return this;
  }

  private oval(x: number, y: number, w: number, h: number, color: number, alpha = 1) {
    return this.scene.add.ellipse(x, y, w, h, color, alpha);
  }

  private makeArm(x: number, y: number, side: number) {
    const arm = this.scene.add.container(x, y);
    const upper = this.oval(14, side * 2, 26, 12, this.style.skin);
    const forearm = this.oval(30, side * 5, 22, 10, this.style.skin);
    const hand = this.oval(42, side * 7, 12, 10, this.style.skin);
    arm.add([upper, forearm, hand]);
    return arm;
  }

  private makeLeg(x: number, y: number, side: number) {
    const leg = this.scene.add.container(x, y);
    const thigh = this.oval(-8, side * 3, 22, 12, this.style.skin);
    const calf = this.oval(-24, side * 5, 20, 10, this.style.skin);
    const foot = this.oval(-36, side * 7, 16, 8, this.style.skin);
    leg.add([thigh, calf, foot]);
    return leg;
  }

  private makeTorso() {
    const body = this.scene.add.container(0, 0);
    const hips = this.oval(-16, 3, 28, 20, this.style.suitDark);
    const belly = this.oval(-2, 1, 34, 24, this.style.suitMid);
    const chest = this.oval(12, -1, 30, 22, this.style.suitMid);
    const dyeA = this.oval(0, -2, 14, 14, this.style.suitDark, 0.65);
    const dyeB = this.oval(10, 4, 12, 10, this.style.suitGreen, 0.9);
    const dyeC = this.oval(-8, 6, 10, 8, 0x111827, 0.35);
    body.add([hips, belly, chest, dyeA, dyeB, dyeC]);
    return body;
  }

  private makeHead() {
    const head = this.scene.add.container(34, -6);
    const neck = this.oval(-12, 4, 12, 10, this.style.skin);
    const skull = this.oval(0, 0, 30, 28, this.style.skin);
    const cheek = this.oval(6, 6, 8, 5, 0xe07a5f, 0.35);
    const cap = this.oval(-2, -6, 32, 20, this.style.cap);
    const stripe = this.scene.add.rectangle(-2, -8, 24, 5, this.style.capStripe, 1);
    const hair = this.oval(-6, 4, 16, 8, this.style.hair, 0.75);
    const goggleBand = this.scene.add.rectangle(0, -1, 28, 5, 0x111827, 0.85);
    const lens = this.oval(7, 0, 14, 10, this.style.goggles, 0.92);
    const lensShine = this.oval(9, -2, 5, 3, 0xecfccb, 0.7);
    const eye = this.oval(7, 0, 7, 7, 0xffffff);
    const pupil = this.oval(8, 0, 3.2, 3.6, 0x2a1b12);
    const smile = this.scene.add.graphics();
    smile.lineStyle(2, 0x7c2d12, 1);
    smile.beginPath();
    smile.arc(8, 7, 4, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(150));
    smile.strokePath();
    head.add([neck, skull, cheek, cap, stripe, hair, goggleBand, lens, lensShine, eye, pupil, smile]);
    return head;
  }

  private clearSwimTweens() {
    this.swimTweens.forEach((tween) => tween.stop());
    this.swimTweens = [];
  }

  playReady() {
    this.clearSwimTweens();
    this.swimming = false;
    this.setRotation(-0.72);
    this.setScale(1.05, 0.92);
    this.nearArm.setRotation(-2.2);
    this.farArm.setRotation(0.5);
    this.nearLeg.setRotation(0.35);
    this.farLeg.setRotation(-0.2);
    this.head.setRotation(-0.15);
    this.swimTweens.push(
      this.scene.tweens.add({
        targets: this,
        y: this.y - 3,
        duration: 380,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      }),
    );
  }

  dive(intoX: number, intoY: number, onDone?: () => void) {
    this.clearSwimTweens();
    this.scene.tweens.add({
      targets: this,
      x: intoX,
      y: intoY - 8,
      rotation: 0.35,
      scaleX: 1.15,
      scaleY: 0.8,
      duration: 280,
      ease: "Cubic.in",
      onComplete: () => {
        this.burstSplash(18);
        this.scene.tweens.add({
          targets: this,
          y: intoY,
          rotation: 0.04,
          scaleX: 1,
          scaleY: 1,
          duration: 220,
          ease: "Back.out",
          onComplete: () => {
            this.playSwim();
            onDone?.();
          },
        });
      },
    });
  }

  playSwim() {
    this.clearSwimTweens();
    this.swimming = true;
    this.setRotation(0.04);
    this.setScale(1, 1);
    this.nearArm.setRotation(0);
    this.farArm.setRotation(Math.PI);
    this.swimTweens.push(
      this.scene.tweens.add({
        targets: this.nearArm,
        rotation: this.nearArm.rotation + Math.PI * 2,
        duration: 520,
        repeat: -1,
        ease: "Linear",
      }),
      this.scene.tweens.add({
        targets: this.farArm,
        rotation: this.farArm.rotation + Math.PI * 2,
        duration: 520,
        repeat: -1,
        ease: "Linear",
      }),
      this.scene.tweens.add({
        targets: this.nearLeg,
        rotation: { from: -0.55, to: 0.45 },
        duration: 90,
        yoyo: true,
        repeat: -1,
      }),
      this.scene.tweens.add({
        targets: this.farLeg,
        rotation: { from: 0.45, to: -0.55 },
        duration: 90,
        yoyo: true,
        repeat: -1,
      }),
      this.scene.tweens.add({
        targets: this.torso,
        scaleX: { from: 1.06, to: 0.94 },
        scaleY: { from: 0.9, to: 1.08 },
        duration: 260,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      }),
      this.scene.tweens.add({
        targets: this.head,
        rotation: { from: 0.08, to: -0.55 },
        duration: 1040,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      }),
      this.scene.tweens.add({
        targets: this,
        rotation: { from: -0.02, to: 0.1 },
        duration: 260,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      }),
      this.scene.tweens.add({
        targets: [this.waterLine, this.waterShine, ...this.trail],
        scaleX: { from: 0.85, to: 1.2 },
        alpha: { from: 0.12, to: 0.4 },
        duration: 220,
        yoyo: true,
        repeat: -1,
      }),
    );
  }

  strokeTo(x: number, onDone?: () => void) {
    this.scene.tweens.add({
      targets: this,
      x,
      duration: 220,
      ease: "Sine.out",
      onComplete: onDone,
    });
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.12,
      scaleY: 0.88,
      duration: 90,
      yoyo: true,
    });
    this.burstSplash(10);
  }

  celebrate() {
    this.clearSwimTweens();
    this.playSwim();
    this.scene.tweens.add({
      targets: this,
      y: this.y - 10,
      duration: 160,
      yoyo: true,
      repeat: 5,
    });
    this.burstSplash(22);
  }

  bonkBubble() {
    const bubble = this.scene.add.circle(this.x + 26, this.y - 18, 14, 0xe0f2fe, 0.95);
    bubble.setStrokeStyle(3, 0x38bdf8);
    const word = this.scene.add
      .text(this.x + 26, this.y - 18, "bonk", {
        fontFamily: "Fredoka, Nunito, sans-serif",
        fontSize: "13px",
        color: "#1e3a8a",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.scene.tweens.add({
      targets: [bubble, word],
      y: "-=40",
      alpha: 0,
      scale: 1.5,
      duration: 420,
      onComplete: () => {
        bubble.destroy();
        word.destroy();
      },
    });
  }

  burstSplash(count = 12) {
    for (let i = 0; i < count; i++) {
      const drop = this.scene.add.ellipse(
        this.x + Phaser.Math.Between(-16, 36),
        this.y + Phaser.Math.Between(-4, 16),
        Phaser.Math.Between(6, 14),
        Phaser.Math.Between(4, 9),
        Phaser.Utils.Array.GetRandom([0xffffff, 0xe0f2fe, 0xbae6fd]),
        0.9,
      );
      drop.setDepth(12);
      this.scene.tweens.add({
        targets: drop,
        x: drop.x + Phaser.Math.Between(-30, 50),
        y: drop.y + Phaser.Math.Between(-36, 18),
        alpha: 0,
        scale: 0.2,
        duration: 280 + Math.random() * 220,
        onComplete: () => drop.destroy(),
      });
    }
  }
}
