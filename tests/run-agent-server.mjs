/** Bundle the server-side Agent guard tests with esbuild and run them on Node. */
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const outDir = resolve('node_modules/.cache');
mkdirSync(outDir, { recursive: true });
const outfile = resolve(outDir, 'agent-server.test.mjs');

await build({
  entryPoints: ['tests/agent-server.test.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile,
  logLevel: 'warning',
  banner: {
    js: 'import { createRequire as __cr } from "node:module"; const require = __cr(import.meta.url);',
  },
});

await import(pathToFileURL(outfile).href);
