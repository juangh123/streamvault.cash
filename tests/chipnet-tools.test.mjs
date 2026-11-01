import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { decodePrivateKeyWif } from '@bitauth/libauth';

const setup = resolve('scripts/setup-chipnet-agent.mjs');
const directory = mkdtempSync(join(tmpdir(), 'streamvault-chipnet-test-'));
try {
  const invoke = category => spawnSync(process.execPath, [setup, `--category=${category}`], { cwd: directory, encoding: 'utf8' });
  for (const category of ['', 'a'.repeat(64), '2469acc5afa4b10cb5b5c04afb89c3a3ffd61c5da9c01e26d00951cae2a02544']) {
    assert.notEqual(invoke(category).status, 0);
    assert.deepEqual(readdirSync(directory), []);
  }
  const created = invoke('bc'.repeat(32));
  assert.equal(created.status, 0);
  const path = join(directory, '.env.chipnet.local');
  const original = readFileSync(path, 'utf8');
  const config = Object.fromEntries(original.split('\n').filter(line => line.includes('=')).map(line => {
    const at = line.indexOf('='); return [line.slice(0, at), line.slice(at + 1)];
  }));
  assert.equal(config.AGENT_NETWORK, 'chipnet');
  assert.equal(config.PUSD_CATEGORY, 'bc'.repeat(32));
  assert.notEqual(config.AGENT_WIF, config.SERVICE_WIF);
  for (const secret of [config.AGENT_WIF, config.SERVICE_WIF]) {
    assert.equal(decodePrivateKeyWif(secret).type, 'testnet');
    assert.ok(!created.stdout.includes(secret));
  }
  assert.match(JSON.parse(created.stdout).agentAddress, /^bchtest:/);
  assert.notEqual(invoke('cd'.repeat(32)).status, 0);
  assert.equal(readFileSync(path, 'utf8'), original);
} finally {
  // Remove only the one known temporary file and the now-empty directory.
  for (const file of readdirSync(directory)) { assert.equal(file, '.env.chipnet.local'); unlinkSync(join(directory, file)); }
  rmdirSync(directory);
}
const refused = spawnSync(process.execPath, ['scripts/dev-chipnet.mjs'], {
  env: { ...process.env, AGENT_NETWORK: 'mainnet' }, encoding: 'utf8',
});
assert.notEqual(refused.status, 0);
assert.match(refused.stderr, /refuses a non-Chipnet/);
console.log('[PASS] Chipnet tooling: isolated test keys, no secret output, no overwrites, invalid categories and Mainnet server refused.');
