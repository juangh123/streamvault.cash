import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const directory = resolve('node_modules/.cache');
mkdirSync(directory, { recursive: true });
const outfile = resolve(directory, 'network-config.test.mjs');
await build({ entryPoints: ['tests/network-config.test.ts'], bundle: true, platform: 'node', format: 'esm', outfile });
await import(pathToFileURL(outfile).href);
await import('./chipnet-tools.test.mjs');
