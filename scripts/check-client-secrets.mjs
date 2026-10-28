import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { parseEnv } from 'node:util';

const envFile = process.argv[2] ?? '.env.agent-wallet.local';
const distDir = 'dist';

if (!existsSync(distDir)) {
  console.error(`[FAIL] ${distDir} does not exist. Run npm run build first.`);
  process.exit(1);
}

let env = {};
if (existsSync(envFile)) {
  env = parseEnv(readFileSync(envFile, 'utf8'));
}

const sensitiveKeys = [
  'AGENT_WIF',
  'AGENT_STORE_TOKEN',
  'PAYER_WIF',
  'PAYEE_WIF',
  'SERVICE_WIF',
];
const serverOnlyMarkers = ['AGENT_WIF', 'AGENT_STORE_TOKEN', 'PAYER_WIF', 'PAYEE_WIF', 'SERVICE_WIF'];
const sensitiveValues = sensitiveKeys
  .map((key) => (env[key] ?? process.env[key] ?? '').trim())
  .filter((value) => value.length >= 8);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const textExtensions = new Set(['.js', '.mjs', '.cjs', '.css', '.html', '.json', '.map', '.txt', '.svg']);
const files = walk(distDir).filter((path) => textExtensions.has(extname(path).toLowerCase()));
const findings = [];

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const marker = serverOnlyMarkers.find((name) => text.includes(name));
  if (marker) findings.push(`${file}: found server-only marker ${marker}`);
  if (sensitiveValues.some((value) => text.includes(value))) {
    findings.push(`${file}: contains a server-only secret value`);
  }
}

if (findings.length > 0) {
  console.error('Client secret scan failed:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`Client secret scan passed across ${files.length} text asset(s).`);
