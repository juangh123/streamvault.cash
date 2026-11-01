/** Local-only Chipnet frontend + the same API handlers used by Vercel. No production env download. */
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { createServer } from 'vite';

if (existsSync('.env.chipnet.local')) process.loadEnvFile('.env.chipnet.local');
process.env.AGENT_NETWORK ??= 'chipnet';
process.env.AGENT_ENABLED ??= 'false';
if (process.env.AGENT_NETWORK !== 'chipnet') throw new Error('Chipnet dev server refuses a non-Chipnet Agent configuration.');
// Do not use an external production request store for local test transactions.
if (process.env.AGENT_STORE_URL || process.env.AGENT_STORE_TOKEN) throw new Error('Chipnet dev server requires the local memory request store.');

const directory = resolve('node_modules/.cache');
mkdirSync(directory, { recursive: true });
const outfile = resolve(directory, 'chipnet-api.mjs');
await build({
  entryPoints: ['scripts/chipnet-api.ts'], bundle: true, platform: 'node', format: 'esm',
  target: 'node20', outfile,
  banner: { js: 'import { createRequire as __cr } from "node:module"; const require = __cr(import.meta.url);' },
});
const api = await import(pathToFileURL(outfile).href);
const handlers = { '/api/agent/status': api.status, '/api/agent/run': api.run, '/api/service/insight': api.insight };
const server = await createServer({
  define: { 'import.meta.env.VITE_CHIPNET_ONLY': JSON.stringify('true') },
  mode: 'chipnet', server: { host: '127.0.0.1', port: 5174, strictPort: true },
  plugins: [{
    name: 'local-chipnet-api',
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://127.0.0.1');
        const handler = handlers[url.pathname];
        if (!handler) return next();
        res.setHeader('Cache-Control', 'no-store');
        res.status = code => { res.statusCode = code; return res; };
        res.json = body => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); };
        try {
          req.query = Object.fromEntries(url.searchParams);
          if (req.method === 'POST') {
            let body = '';
            for await (const chunk of req) {
              body += chunk.toString();
              if (Buffer.byteLength(body) > 4096) { res.status(413).json({ message: 'Request too large.' }); return; }
            }
            req.body = body ? JSON.parse(body) : {};
          }
          await handler(req, res);
        } catch {
          res.status(400).json({ code: 'INVALID_REQUEST', message: 'Invalid local API request.' });
        }
      });
    },
  }],
});
await server.listen();
console.log('Chipnet testing: http://127.0.0.1:5174 — select Payroll / Live / Chipnet.');
console.log(`Agent API: ${process.env.AGENT_ENABLED === 'true' ? 'enabled (Chipnet only)' : 'disabled until .env.chipnet.local is configured'}.`);
