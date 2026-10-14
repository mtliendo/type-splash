import * as Phaser from "phaser";
import { RaceScene } from "./scenes/RaceScene";
import type { GameHooks } from "./types";

export function createTypeSplashGame(hooks: GameHooks) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: hooks.parent,
    width: 1280,
    height: 720,
    backgroundColor: "#ffedd5",
    antialias: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      keyboard: true,
      mouse: false,
      touch: false,
    },
    scene: [RaceScene],
    audio: { noAudio: true },
    banner: false,
  });

  game.scene.start("race", hooks);
  return game;
}
