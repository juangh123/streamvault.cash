/**
 * Bundles tests/stream.test.ts with the project's esbuild and runs it on Node.
 * No extra test dependency is required.
 */
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const outDir = resolve('node_modules/.cache');
mkdirSync(outDir, { recursive: true });
const outfile = resolve(outDir, 'stream.test.mjs');

await build({
  entryPoints: ['tests/stream.test.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile,
  logLevel: 'warning',
});

await import(pathToFileURL(outfile).href);