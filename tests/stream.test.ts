/**
 * Sandbox engine tests for src/lib/stream.ts.
 *
 * The sandbox mirrors the StreamVault covenant invariants, so these cases assert the same rules the
 * on-chain test suite (contracts/test-streamvault.mjs) enforces against the real VM.
 * Bundled with esbuild and run by Node (see tests/run-engine.mjs).
 */
import { blocksUntilClaim, cancel, claim, createStream, nextClaimBlock, topUp } from '../src/lib/stream';
import type { CreateStreamInput } from '../src/lib/stream';

let passed = 0;
let failed = 0;
const lines: string[] = [];

function check(cond: boolean, id: string, name: string, detail: string) {
  if (cond) {
    passed += 1;
    lines.push(`[PASS] ${id}: ${name}\n       ${detail}`);
  } else {
    failed += 1;
    lines.push(`[FAIL] ${id}: ${name}\n       ${detail}`);
  }
}

const base: CreateStreamInput = {
  label: 'Engine test',
  payerAddress: 'bchtest:zq0payer',
  payeeAddress: 'bchtest:zz0payee',
  amountPerPeriod: 2500,
  periodBlocks: 144,
  deposit: 100000,
  category: 'a'.repeat(64),
  vaultAddress: 'bchtest:ptest',
  contractBytecode: 'deadbeef',
  block: 850000,
};

// ENGINE-00: creation
{
  const s = createStream(base);
  check(
    s.remaining === 100000 && s.claimed === 0 && s.claimsCount === 0 && s.clockBlock === 850000,
    'ENGINE-00',
    'Stream is created fully funded with a fresh clock',
    `remaining=${s.remaining} claimed=${s.claimed} clock=${s.clockBlock}`,
  );
}

// ENGINE-01: claim before the period elapses is rejected
{
  const s = createStream(base);
  const r = claim(s, 100, 850000);
  check(!r.ok && r.stream.remaining === 100000, 'ENGINE-01', 'Claim before period is rejected', r.error ?? 'accepted (bug)');
}

// ENGINE-02: over-limit claim is rejected
{
  const s = createStream(base);
  const r = claim(s, 3000, 850144);
  check(!r.ok, 'ENGINE-02', 'Over-limit claim is rejected (3000 > 2500)', r.error ?? 'accepted (bug)');
}

// ENGINE-03: zero / negative claim is rejected
{
  const s = createStream(base);
  const r = claim(s, 0, 850144);
  check(!r.ok, 'ENGINE-03', 'Zero-amount claim is rejected', r.error ?? 'accepted (bug)');
}

// ENGINE-04: a valid tranche moves funds and resets the clock
{
  const s = createStream(base);
  const r = claim(s, 2500, 850144);
  check(
    r.ok && r.stream.remaining === 97500 && r.stream.claimed === 2500 && r.stream.claimsCount === 1 && r.stream.clockBlock === 850144,
    'ENGINE-04',
    'Valid claim streams the tranche and resets the clock',
    r.ok ? `remaining=${r.stream.remaining} clock=${r.stream.clockBlock}` : (r.error ?? 'rejected (bug)'),
  );
  check(r.ok && r.entry?.type === 'CLAIM' && r.entry?.amount === 2500, 'ENGINE-04b', 'Claim records a ledger entry', r.entry ? `type=${r.entry.type} amount=${r.entry.amount}` : 'no entry');
}

// ENGINE-05: a claim that would empty the vault is rejected (use cancel instead)
{
  const s = createStream({ ...base, deposit: 2500 });
  const r = claim(s, 2500, 850144);
  check(!r.ok, 'ENGINE-05', 'Claim that would drain the vault is rejected', r.error ?? 'accepted (bug)');
}

// ENGINE-06: cancel sweeps 100% of the remaining balance
{
  const s = createStream(base);
  const r = cancel(s, 850200);
  check(
    r.ok && r.stream.remaining === 0 && r.entry?.type === 'CANCEL' && r.entry?.amount === 100000,
    'ENGINE-06',
    'Cancel reclaims the full remaining balance',
    r.ok ? `swept=${r.entry?.amount}` : (r.error ?? 'rejected (bug)'),
  );
}

// ENGINE-07: cancel on an empty stream is rejected
{
  const s = { ...createStream(base), remaining: 0 };
  const r = cancel(s, 850200);
  check(!r.ok, 'ENGINE-07', 'Cancel on an empty stream is rejected', r.error ?? 'accepted (bug)');
}

// ENGINE-08: top-up adds funds and resets the clock (fresh vault UTXO)
{
  const s = createStream(base);
  const afterClaim = claim(s, 2500, 850144).stream;
  const r = topUp(afterClaim, 5000, 850300);
  check(
    r.ok && r.stream.remaining === 102500 && r.stream.deposited === 105000 && r.stream.clockBlock === 850300,
    'ENGINE-08',
    'Top-up adds PUSD and resets the clock',
    r.ok ? `remaining=${r.stream.remaining} clock=${r.stream.clockBlock}` : (r.error ?? 'rejected (bug)'),
  );
}

// ENGINE-09: clock arithmetic
{
  const s = createStream(base);
  check(nextClaimBlock(s) === 850144, 'ENGINE-09', 'nextClaimBlock = clock + period', `next=${nextClaimBlock(s)}`);
  check(blocksUntilClaim(s, 850000) === 144 && blocksUntilClaim(s, 850200) === 0, 'ENGINE-09b', 'blocksUntilClaim counts down and floors at 0', `at0=${blocksUntilClaim(s, 850000)} at200=${blocksUntilClaim(s, 850200)}`);
}

console.log('==================================================================');
console.log('  StreamVault.cash - Sandbox Engine Test Suite');
console.log('==================================================================\n');
for (const l of lines) console.log(l + '\n');
console.log('------------------------------------------------------------------');
console.log(`  ${passed} passed, ${failed} failed (of ${passed + failed})`);
console.log('------------------------------------------------------------------');
if (failed > 0) process.exit(1);