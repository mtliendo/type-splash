import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = dirname(fileURLToPath(new URL(".", import.meta.url)));
const srcDir = resolve(root, "assets/sprites-src");
const outDir = resolve(root, "public/atlases");
const imageExts = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function collectImages(dir, list = []) {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return list;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.name.startsWith(".") || entry.name === "__MACOSX") continue;
    if (entry.isDirectory()) collectImages(full, list);
    else if (imageExts.has(extname(entry.name).toLowerCase())) {
      list.push({
        name: relative(srcDir, full).split("\\").join("/"),
        path: full,
      });
    }
  }
  return list;
}

const images = collectImages(srcDir);
mkdirSync(outDir, { recursive: true });

if (images.length === 0) {
  console.log("pnpm atlas: no PNGs in assets/sprites-src — skip packing.");
  process.exit(0);
}

const projectPath = join(tmpdir(), "type-splash-sprites.ftpp");
const project = {
  savePath: outDir,
  images,
  folders: [],
  packOptions: {
    textureName: "sprites",
    width: 2048,
    height: 2048,
    fixedSize: false,
    powerOfTwo: true,
    padding: 2,
    extrude: 1,
    allowRotation: false,
    detectIdentical: true,
    allowTrim: true,
    trimMode: "trim",
    alphaThreshold: 0,
    removeFileExtension: false,
    prependFolderName: true,
    textureFormat: "png",
    exporter: "Phaser (hash)",
    packer: "MaxRectsBin",
    packerMethod: "BestShortSideFit",
  },
};

writeFileSync(projectPath, `${JSON.stringify(project, null, 2)}\n`);

const cli = resolve(root, "node_modules/free-tex-packer-cli/index.js");
const result = spawnSync(process.execPath, [cli, "--project", projectPath, "--output", outDir], {
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
