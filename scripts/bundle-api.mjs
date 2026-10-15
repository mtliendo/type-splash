import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = dirname(fileURLToPath(new URL(".", import.meta.url)));
const outfile = resolve(root, "api/runs.js");

mkdirSync(dirname(outfile), { recursive: true });

await build({
  entryPoints: [resolve(root, "server/runs-api.ts")],
  outfile,
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  logLevel: "info",
  legalComments: "none",
});

console.log(`bundled ${outfile}`);
