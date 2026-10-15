# Tiled maps

Author maps in [Tiled](https://www.mapeditor.org/) (free). Keep source maps here as `.tmj` JSON.

## Export settings Phaser can load

1. **Map → Save As** `maps/<name>.tmj` (JSON map format).
2. **Embed tilesets** — File → Export, or in the tileset panel choose *Embed tileset*. Phaser's Tiled parser needs the tileset data inside the map JSON, not a loose `.tsx` reference. Collection-of-images tilesets are not supported; use one tileset image per tileset.
3. Put the tileset PNG through `pnpm atlas` (`assets/sprites-src/` → `public/atlases/`) or copy it under `public/` so Vite can serve it.
4. Load in a Scene:

```js
preload() {
  this.load.tilemapTiledJSON("pool", "/maps/example.tmj");
  this.load.atlas("sprites", "/atlases/sprites.png", "/atlases/sprites.json");
}

create() {
  const map = this.make.tilemap({ key: "pool" });
  const tiles = map.addTilesetImage("TilesetNameInTiled", "sprites");
  map.createLayer("Ground", tiles);
}
```

`this.load.tilemapTiledJSON` is the Phaser 3 API this repo uses (`phaser@3.90`). Do not use Phaser 4-only helpers from `.cursor/skills/tilemaps` (for example `TilemapGPULayer`) until the game upgrades.

The current pool race is drawn with Phaser Graphics (gradients, shimmer tweens, vector swimmers). It is not a tilemap — converting the lanes would not match the existing look. `maps/example.tmj` is an empty orthogonal stub for Tiled / CLI checks. The race does not load it.

## Validate (optional)

If Tiled's AppImage is installed (this VM used [Tiled 1.12.2](https://github.com/mapeditor/tiled/releases/tag/v1.12.2)):

```bash
Tiled.AppImage --appimage-extract-and-run --export-map json maps/example.tmj /tmp/example.check.json
```

A successful export means the JSON parses. `maps/example.tmj` exported as a 3×4 orthogonal map with a `Ground` layer. Vite already serves anything under `public/`; if you want the browser to fetch a map without a copy step, also place a built copy in `public/maps/`.
