import * as Phaser from "phaser";
import {
  FINGER_MAP,
  HOME_ROW_BUMPS,
  HOME_ROW_LETTERS,
  isHomeRowLetter,
  type HomeRowLetter,
} from "@/lib/drills";

const KEY_ORDER = HOME_ROW_LETTERS;

export class KeyboardHint {
  private keys = new Map<string, Phaser.GameObjects.Container>();
  private fingerText: Phaser.GameObjects.Text;
  private handText: Phaser.GameObjects.Text;
  private highlight?: Phaser.Tweens.Tween;

  constructor(private scene: Phaser.Scene, width: number, height: number) {
    const rowY = height - 78;
    const keyW = 64;
    const gap = 10;
    const total = KEY_ORDER.length * keyW + (KEY_ORDER.length - 1) * gap;
    const startX = width / 2 - total / 2 + keyW / 2;

    this.scene.add.rectangle(width / 2, height - 70, width - 48, 112, 0xfff7ed, 0.96).setStrokeStyle(3, 0xfdba74);

    KEY_ORDER.forEach((letter, i) => {
      const x = startX + i * (keyW + gap);
      const box = this.makeKey(x, rowY, letter);
      this.keys.set(letter, box);
    });

    this.handText = this.scene.add
      .text(width / 2, height - 128, "Home-row hands ready", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "18px",
        color: "#9a3412",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.fingerText = this.scene.add
      .text(width / 2, height - 22, "F and J have the bumps — rest your index fingers there.", {
        fontFamily: "Nunito, sans-serif",
        fontSize: "13px",
        color: "#c2410c",
      })
      .setOrigin(0.5);
  }

  private makeKey(x: number, y: number, letter: HomeRowLetter) {
    const hint = FINGER_MAP[letter];
    const fill = hint.hand === "left" ? 0xdbeafe : 0xffedd5;
    const container = this.scene.add.container(x, y);
    const bg = this.scene.add.rectangle(0, 0, 62, 54, fill, 1).setStrokeStyle(3, 0x7c2d12);
    bg.setData("baseColor", fill);
    const label = this.scene.add
      .text(0, -6, letter === ";" ? ";" : letter.toUpperCase(), {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "22px",
        color: "#1c1917",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const finger = this.scene.add
      .text(0, 16, hint.finger, {
        fontFamily: "Nunito, sans-serif",
        fontSize: "10px",
        color: "#9a3412",
      })
      .setOrigin(0.5);
    container.add([bg, label, finger]);

    if (HOME_ROW_BUMPS.has(letter)) {
      const bump = this.scene.add.rectangle(0, 4, 12, 3, 0x44403c, 0.8);
      container.add(bump);
    }

    return container;
  }

  highlightLetter(letter: string) {
    this.keys.forEach((container) => {
      const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
      const base = (bg.getData("baseColor") as number) ?? 0xf8fafc;
      bg.setFillStyle(base, 1);
      container.setScale(1);
    });
    this.highlight?.stop();

    if (!isHomeRowLetter(letter)) return;
    const container = this.keys.get(letter);
    if (!container) return;
    const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
    bg.setFillStyle(0xfde047, 1);
    const hint = FINGER_MAP[letter];
    this.handText.setText(`${hint.label}  ·  ${hint.hand === "left" ? "Left hand" : "Right hand"}`);
    this.fingerText.setText(
      HOME_ROW_BUMPS.has(letter)
        ? `Feel the bump on ${letter.toUpperCase()} — that is your ${hint.finger} finger home.`
        : `Use your ${hint.label.toLowerCase()} for ${letter === ";" ? ";" : letter.toUpperCase()}.`,
    );
    this.highlight = this.scene.tweens.add({
      targets: container,
      scale: { from: 1, to: 1.12 },
      duration: 280,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }
}
