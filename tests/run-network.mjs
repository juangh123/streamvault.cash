/** Bundle tests/network.ts with esbuild (ESM + require shim) and run it on Node. */
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const outDir = resolve('node_modules/.cache');
mkdirSync(outDir, { recursive: true });
const outfile = resolve(outDir, 'network.mjs');
const result = await build({
  entryPoints: ['tests/network.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile,
  logLevel: 'warning',
  banner: { js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);" },
});
if (result.errors.length) { console.error(result.errors); process.exit(1); }
await import(pathToFileURL(outfile).href);