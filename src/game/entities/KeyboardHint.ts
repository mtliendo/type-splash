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
    const rowY = height - 74;
    const keyW = 70;
    const gap = 10;
    const total = KEY_ORDER.length * keyW + (KEY_ORDER.length - 1) * gap;
    const startX = width / 2 - total / 2 + keyW / 2;

    const tray = this.scene.add.rectangle(width / 2, height - 66, width - 36, 124, 0xfff7ed, 0.97);
    tray.setStrokeStyle(4, 0xfb923c);
    tray.setDepth(15);

    KEY_ORDER.forEach((letter, i) => {
      const x = startX + i * (keyW + gap);
      this.keys.set(letter, this.makeKey(x, rowY, letter));
    });

    this.handText = this.scene.add
      .text(width / 2, height - 124, "Home-row hands ready", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "18px",
        color: "#9a3412",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(16);

    this.fingerText = this.scene.add
      .text(width / 2, height - 20, "F and J have the bumps — rest your index fingers there.", {
        fontFamily: "Nunito, sans-serif",
        fontSize: "13px",
        color: "#c2410c",
      })
      .setOrigin(0.5)
      .setDepth(16);
  }

  private makeKey(x: number, y: number, letter: HomeRowLetter) {
    const hint = FINGER_MAP[letter];
    const fill = hint.hand === "left" ? 0xbfdbfe : 0xfed7aa;
    const container = this.scene.add.container(x, y).setDepth(16);
    const shadow = this.scene.add.rectangle(0, 5, 66, 56, 0x9a3412, 0.18);
    const bg = this.scene.add.rectangle(0, 0, 66, 56, fill, 1).setStrokeStyle(4, 0x7c2d12);
    bg.setData("baseColor", fill);
    const label = this.scene.add
      .text(0, -8, letter === ";" ? ";" : letter.toUpperCase(), {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "24px",
        color: "#1c1917",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const finger = this.scene.add
      .text(0, 16, hint.finger, {
        fontFamily: "Nunito, sans-serif",
        fontSize: "11px",
        color: "#9a3412",
      })
      .setOrigin(0.5);
    container.add([shadow, bg, label, finger]);

    if (HOME_ROW_BUMPS.has(letter)) {
      container.add(this.scene.add.rectangle(0, 4, 14, 4, 0x44403c, 0.85));
    }

    return container;
  }

  highlightLetter(letter: string) {
    this.keys.forEach((container) => {
      const bg = container.getAt(1) as Phaser.GameObjects.Rectangle;
      const base = (bg.getData("baseColor") as number) ?? 0xf8fafc;
      bg.setFillStyle(base, 1);
      container.setScale(1);
    });
    this.highlight?.stop();

    if (!isHomeRowLetter(letter)) return;
    const container = this.keys.get(letter);
    if (!container) return;
    const bg = container.getAt(1) as Phaser.GameObjects.Rectangle;
    bg.setFillStyle(0xfacc15, 1);
    const hint = FINGER_MAP[letter];
    this.handText.setText(`${hint.label}  ·  ${hint.hand === "left" ? "Left hand" : "Right hand"}`);
    this.fingerText.setText(
      HOME_ROW_BUMPS.has(letter)
        ? `Feel the bump on ${letter.toUpperCase()} — that is your ${hint.finger} finger home.`
        : `Use your ${hint.label.toLowerCase()} for ${letter === ";" ? ";" : letter.toUpperCase()}.`,
    );
    this.highlight = this.scene.tweens.add({
      targets: container,
      scale: { from: 1, to: 1.16 },
      duration: 260,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }
}
