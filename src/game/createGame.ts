import * as Phaser from "phaser";
import { RaceScene } from "./scenes/RaceScene";
import type { GameHooks } from "./types";

export function createTypeSplashGame(hooks: GameHooks) {
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent: hooks.parent,
    width: 1280,
    height: 720,
    backgroundColor: "#0369a1",
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
    scene: [],
    audio: { noAudio: true },
    banner: false,
  });

  game.scene.add("race", RaceScene, true, hooks);
  return game;
}
