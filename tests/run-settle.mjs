import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const result = spawnSync(process.execPath, ['scripts/settle.mjs', '--dry-run'], {
  env: { ...process.env, CATEGORY: '57af2cea09269e6239ac299ba688e27ecdaace1a850ea46b274919b434b1f155' },
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stdout + result.stderr);
assert.match(result.stdout, /claim broadcast ok:/);
assert.match(result.stdout, /cancel broadcast ok:/);
console.log('[PASS] Settlement CLI dry-run: real non-symmetric category, VM-accepted claim and cancel.');
