import * as Phaser from "phaser";

export class LetterTile {
  readonly root: Phaser.GameObjects.Container;
  private bubble: Phaser.GameObjects.Ellipse;
  private ring: Phaser.GameObjects.Ellipse;
  private letter: Phaser.GameObjects.Text;
  private motion?: Phaser.Tweens.Tween;

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.root = scene.add.container(x, y).setDepth(24).setAlpha(0);
    this.ring = scene.add.ellipse(0, 6, 128, 118, 0x86efac, 0.22);
    this.bubble = scene.add.ellipse(0, 0, 118, 108, 0xfef08a, 1);
    this.bubble.setStrokeStyle(8, 0xf97316);
    const shine = scene.add.ellipse(-22, -24, 28, 16, 0xfffbeb, 0.7);
    this.letter = scene.add
      .text(0, -2, "", {
        fontFamily: "Fredoka, Nunito, sans-serif",
        fontSize: "84px",
        color: "#7c2d12",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.root.add([this.ring, this.bubble, shine, this.letter]);
    scene.tweens.add({
      targets: this.ring,
      scale: { from: 0.94, to: 1.08 },
      alpha: { from: 0.16, to: 0.32 },
      duration: 520,
      yoyo: true,
      repeat: -1,
    });
  }

  show(value: string) {
    this.letter.setText(value === ";" ? ";" : value.toUpperCase());
    this.root.setAlpha(1);
    this.root.setScale(0.55);
    this.root.setRotation(0);
    this.motion?.stop();
    this.scene.tweens.add({
      targets: this.root,
      scale: 1,
      duration: 220,
      ease: "Back.out",
    });
  }

  pop() {
    this.motion?.stop();
    this.motion = this.scene.tweens.add({
      targets: this.root,
      scale: { from: 1.18, to: 1 },
      duration: 180,
      ease: "Back.out",
    });
    for (let i = 0; i < 8; i++) {
      const pip = this.scene.add.circle(
        this.root.x + Phaser.Math.Between(-20, 20),
        this.root.y + Phaser.Math.Between(-16, 16),
        6,
        Phaser.Utils.Array.GetRandom([0xfde68a, 0x86efac, 0x7dd3fc]),
        1,
      );
      pip.setDepth(25);
      this.scene.tweens.add({
        targets: pip,
        x: pip.x + Phaser.Math.Between(-50, 50),
        y: pip.y + Phaser.Math.Between(-40, 20),
        alpha: 0,
        duration: 280,
        onComplete: () => pip.destroy(),
      });
    }
  }

  wobble() {
    this.motion?.stop();
    this.motion = this.scene.tweens.add({
      targets: this.root,
      rotation: { from: -0.18, to: 0.18 },
      x: this.root.x,
      duration: 70,
      yoyo: true,
      repeat: 4,
      onComplete: () => this.root.setRotation(0),
    });
  }

  hide() {
    this.scene.tweens.add({
      targets: this.root,
      scale: 0.4,
      alpha: 0,
      duration: 160,
    });
  }

  place(x: number, y: number) {
    this.root.x = x;
    this.root.y = y;
  }
}
