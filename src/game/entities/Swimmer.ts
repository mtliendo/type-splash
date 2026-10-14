import * as Phaser from "phaser";
import type { SwimmerStyle } from "../types";

export const XAVIER_STYLE: SwimmerStyle = {
  ghost: false,
  skin: 0xd4a06a,
  hair: 0x2a1b12,
  cap: 0x141414,
  capStripe: 0x4ade80,
  suitDark: 0x1f2937,
  suitMid: 0x4b5563,
  suitGreen: 0x22c55e,
  label: "Xavier",
};

export const GHOST_STYLE: SwimmerStyle = {
  ghost: true,
  skin: 0xc4925c,
  hair: 0x1a120c,
  cap: 0x0f172a,
  capStripe: 0xa5b4fc,
  suitDark: 0x334155,
  suitMid: 0x64748b,
  suitGreen: 0x86efac,
  label: "Ghost",
};

export class Swimmer extends Phaser.GameObjects.Container {
  readonly style: SwimmerStyle;
  private leftArm: Phaser.GameObjects.Container;
  private rightArm: Phaser.GameObjects.Container;
  private leftLeg: Phaser.GameObjects.Container;
  private rightLeg: Phaser.GameObjects.Container;
  private torso: Phaser.GameObjects.Container;
  private splash: Phaser.GameObjects.Ellipse;
  private splashB: Phaser.GameObjects.Ellipse;
  private swimTweens: Phaser.Tweens.Tween[] = [];
  private facing = 1;
  meter = 0;
  swimming = false;

  constructor(scene: Phaser.Scene, x: number, y: number, style: SwimmerStyle) {
    super(scene, x, y);
    this.style = style;
    this.setDepth(style.ghost ? 4 : 6);
    if (style.ghost) this.setAlpha(0.42);

    this.leftLeg = this.makeLeg(-10, 18, -1);
    this.rightLeg = this.makeLeg(10, 18, 1);
    this.leftArm = this.makeArm(-16, -6, -1);
    this.rightArm = this.makeArm(16, -6, 1);
    this.torso = this.makeBody();
    this.splash = scene.add.ellipse(8, 28, 46, 16, 0xffffff, 0.18);
    this.splashB = scene.add.ellipse(-10, 32, 30, 10, 0xffffff, 0.12);

    this.add([
      this.leftLeg,
      this.rightLeg,
      this.leftArm,
      this.torso,
      this.rightArm,
      this.splash,
      this.splashB,
    ]);

    scene.add.existing(this);
    this.playReady();
  }

  private oval(
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
    alpha = 1,
  ) {
    return this.scene.add.ellipse(x, y, w, h, color, alpha);
  }

  private makeArm(x: number, y: number, side: number) {
    const arm = this.scene.add.container(x, y);
    const upper = this.oval(side * 10, 4, 22, 10, this.style.skin);
    const forearm = this.oval(side * 22, 10, 20, 8, this.style.skin);
    const hand = this.oval(side * 32, 14, 10, 8, this.style.skin);
    arm.add([upper, forearm, hand]);
    return arm;
  }

  private makeLeg(x: number, y: number, side: number) {
    const leg = this.scene.add.container(x, y);
    const thigh = this.oval(side * 4, 10, 14, 22, this.style.skin);
    const calf = this.oval(side * 8, 26, 12, 18, this.style.skin);
    const foot = this.oval(side * 16, 34, 16, 8, this.style.skin);
    leg.add([thigh, calf, foot]);
    return leg;
  }

  private makeBody() {
    const body = this.scene.add.container(0, 0);
    const hips = this.oval(0, 14, 28, 18, this.style.suitDark);
    const torso = this.oval(0, 2, 30, 28, this.style.suitMid);
    const dyeA = this.oval(-6, 0, 12, 16, this.style.suitDark, 0.7);
    const dyeB = this.oval(7, 6, 10, 12, this.style.suitGreen, 0.85);
    const dyeC = this.oval(0, -4, 8, 8, 0x111827, 0.55);
    const neck = this.oval(0, -16, 12, 10, this.style.skin);
    const head = this.oval(0, -30, 28, 28, this.style.skin);
    const earL = this.oval(-14, -28, 7, 8, this.style.skin);
    const earR = this.oval(14, -28, 7, 8, this.style.skin);
    const cap = this.oval(0, -36, 30, 18, this.style.cap);
    const capBrim = this.scene.add.rectangle(0, -28, 32, 5, this.style.cap, 1);
    const stripe = this.scene.add.rectangle(0, -38, 22, 5, this.style.capStripe, 1);
    const hair = this.oval(0, -24, 22, 8, this.style.hair, 0.9);
    const eyeL = this.oval(-6, -30, 6, 7, 0xffffff);
    const eyeR = this.oval(6, -30, 6, 7, 0xffffff);
    const pupilL = this.oval(-5, -29, 3, 3.4, 0x2a1b12);
    const pupilR = this.oval(7, -29, 3, 3.4, 0x2a1b12);
    const blushL = this.oval(-10, -24, 6, 3, 0xe07a5f, 0.35);
    const blushR = this.oval(10, -24, 6, 3, 0xe07a5f, 0.35);
    const smile = this.scene.add.graphics();
    smile.lineStyle(2, 0x7c2d12, 1);
    smile.beginPath();
    smile.arc(0, -22, 5, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160));
    smile.strokePath();

    body.add([
      hips,
      torso,
      dyeA,
      dyeB,
      dyeC,
      neck,
      earL,
      earR,
      head,
      hair,
      cap,
      capBrim,
      stripe,
      eyeL,
      eyeR,
      pupilL,
      pupilR,
      blushL,
      blushR,
      smile,
    ]);
    return body;
  }

  private clearSwimTweens() {
    this.swimTweens.forEach((tween) => tween.stop());
    this.swimTweens = [];
  }

  playReady() {
    this.clearSwimTweens();
    this.swimming = false;
    this.setRotation(-0.15);
    this.leftArm.setRotation(0.6);
    this.rightArm.setRotation(-0.8);
    this.leftLeg.setRotation(0.2);
    this.rightLeg.setRotation(-0.15);
    this.swimTweens.push(
      this.scene.tweens.add({
        targets: this,
        y: this.y - 4,
        duration: 420,
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
      y: intoY,
      rotation: 0.9,
      duration: 380,
      ease: "Cubic.in",
      onComplete: () => {
        this.scene.tweens.add({
          targets: this,
          rotation: 0.35,
          duration: 220,
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
    this.setRotation(0.32);
    this.swimTweens.push(
      this.scene.tweens.add({
        targets: this.leftArm,
        rotation: { from: -2.4, to: 1.1 },
        duration: 360,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      }),
      this.scene.tweens.add({
        targets: this.rightArm,
        rotation: { from: 1.1, to: -2.4 },
        duration: 360,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      }),
      this.scene.tweens.add({
        targets: this.leftLeg,
        rotation: { from: -0.7, to: 0.55 },
        duration: 140,
        yoyo: true,
        repeat: -1,
      }),
      this.scene.tweens.add({
        targets: this.rightLeg,
        rotation: { from: 0.55, to: -0.7 },
        duration: 140,
        yoyo: true,
        repeat: -1,
      }),
      this.scene.tweens.add({
        targets: this.torso,
        y: { from: -2, to: 2 },
        duration: 220,
        yoyo: true,
        repeat: -1,
      }),
      this.scene.tweens.add({
        targets: [this.splash, this.splashB],
        scaleX: { from: 0.7, to: 1.25 },
        alpha: { from: 0.08, to: 0.28 },
        duration: 260,
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
      y: this.y - 6,
      duration: 110,
      yoyo: true,
    });
  }

  celebrate() {
    this.clearSwimTweens();
    this.scene.tweens.add({
      targets: this,
      rotation: { from: 0.2, to: -0.2 },
      duration: 180,
      yoyo: true,
      repeat: 6,
    });
    this.scene.tweens.add({
      targets: this.leftArm,
      rotation: -2.6,
      duration: 200,
      yoyo: true,
      repeat: 5,
    });
    this.scene.tweens.add({
      targets: this.rightArm,
      rotation: 2.6,
      duration: 200,
      yoyo: true,
      repeat: 5,
    });
  }

  bonkBubble() {
    const bubble = this.scene.add.circle(this.x + 18, this.y - 10, 10, 0xdbeafe, 0.9);
    this.scene.add
      .text(this.x + 18, this.y - 10, "bonk", {
        fontFamily: "Fredoka, Nunito, sans-serif",
        fontSize: "12px",
        color: "#1e3a8a",
      })
      .setOrigin(0.5);
    this.scene.tweens.add({
      targets: bubble,
      y: bubble.y - 36,
      alpha: 0,
      scale: 1.6,
      duration: 420,
      onComplete: () => bubble.destroy(),
    });
  }
}
