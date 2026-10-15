/**
 * StreamVault.cash - real covenant test suite.
 *
 * Unlike the old simulated tests, this suite:
 *   1. Loads the actual compiled artifact produced by `cashc`.
 *   2. Instantiates the covenant against a MockNetworkProvider.
 *   3. Builds real transactions and evaluates them against the Bitcoin Cash VM via
 *      TransactionBuilder.debug() / send() (the mock provider validates with the real VM).
 *
 * Negative cases assert that the VM actually rejects the transaction (the covenant reverts),
 * not a hard-coded boolean.
 */
import { readFile } from 'fs/promises';
import { Contract, MockNetworkProvider, SignatureTemplate, TransactionBuilder } from 'cashscript';
import { hexToBin, lockingBytecodeToCashAddress, publicKeyToP2pkhLockingBytecode } from '@bitauth/libauth';

const NETWORK_PREFIX = 'bchtest'; // MockNetworkProvider uses the bchtest prefix
const DUST = 1000n; // BCH satoshis kept on each token output
const FEE_RATE = 2n; // target sats per byte
const MAX_FEE_RATE = 5; // sanity cap enforced by the builder
const CATEGORY = 'a'.repeat(64); // deterministic 32-byte CashTokens category
const AMOUNT_PER_PERIOD = 1000n;
const PERIOD_BLOCKS = 10;
const VAULT_TOKENS = 100000n;
const VAULT_BCH = 50000n;

const artifact = JSON.parse(await readFile(new URL('./artifacts/StreamVault.json', import.meta.url), 'utf8'));

const payer = new SignatureTemplate('11'.repeat(32));
const payee = new SignatureTemplate('22'.repeat(32));
const attacker = new SignatureTemplate('33'.repeat(32));
const payerLockingBytecode = publicKeyToP2pkhLockingBytecode({ publicKey: payer.publicKey });

const toTokenAddress = (publicKey) =>
  lockingBytecodeToCashAddress({
    bytecode: publicKeyToP2pkhLockingBytecode({ publicKey }),
    prefix: NETWORK_PREFIX,
    tokenSupport: true,
  }).address;

const payeeTokenAddress = toTokenAddress(payee.publicKey);
const attackerTokenAddress = toTokenAddress(attacker.publicKey);

function freshSetup() {
  const provider = new MockNetworkProvider();
  const contract = new Contract(
    artifact,
    [payer.publicKey, payee.publicKey, AMOUNT_PER_PERIOD, BigInt(PERIOD_BLOCKS), hexToBin(CATEGORY)],
    { provider },
  );
  const vaultUtxo = provider.addUtxo(contract.tokenAddress, {
    txid: 'ab'.repeat(32),
    vout: 0,
    satoshis: VAULT_BCH,
    token: { amount: VAULT_TOKENS, category: CATEGORY },
  });
  return { provider, contract, vaultUtxo };
}

/** Size-based fee, so the vault keeps a BCH buffer while the miner fee stays realistic. */
function sizeFee(builder) {
  return builder.getTransactionSize() * FEE_RATE;
}

/** Build a claim transaction; changeTo defaults to the vault (correct behaviour). */
function buildClaim({ provider, contract, vaultUtxo }, amount, sequence, changeTo, opts = {}) {
  const signer = opts.signer ?? payee;
  const builder = new TransactionBuilder({ provider, maximumFeeSatsPerByte: MAX_FEE_RATE });
  builder.addInput(vaultUtxo, contract.unlock.claim(signer, amount), { sequence });
  builder.addOutput({ to: payeeTokenAddress, amount: DUST, token: { amount, category: CATEGORY } });
  builder.addOutput({
    to: changeTo ?? contract.tokenAddress,
    amount: DUST,
    token: { amount: vaultUtxo.token.amount - amount, category: CATEGORY },
  });
  if (opts.extraOutput) {
    builder.addOutput({ to: attackerTokenAddress, amount: 1000n });
  }
  const extra = opts.extraOutput ? 1000n : 0n;
  builder.outputs[1].amount = vaultUtxo.satoshis - DUST - extra - sizeFee(builder);
  return builder;
}

function buildCancel({ provider, contract, vaultUtxo }, signer, lockBytecode, destTokenAddress) {
  const builder = new TransactionBuilder({ provider, maximumFeeSatsPerByte: MAX_FEE_RATE });
  builder.addInput(vaultUtxo, contract.unlock.cancel(signer, lockBytecode), { sequence: PERIOD_BLOCKS });
  builder.addOutput({
    to: destTokenAddress ?? toTokenAddress(payer.publicKey),
    amount: DUST,
    token: { amount: vaultUtxo.token.amount, category: CATEGORY },
  });
  builder.outputs[0].amount = vaultUtxo.satoshis - sizeFee(builder);
  return builder;
}

let passed = 0;
let failed = 0;
const results = [];

function ok(id, name, detail) {
  passed += 1;
  results.push(`[PASS] ${id}: ${name}\n       ${detail}`);
}
function bad(id, name, detail) {
  failed += 1;
  results.push(`[FAIL] ${id}: ${name}\n       ${detail}`);
}
function isHarnessError(error) {
  return /FeePerByte|FeeTooHigh|TooLow/.test(String(error.name));
}
function expectReject(id, name, fn) {
  try {
    fn();
    bad(id, name, 'Expected the VM to reject the transaction, but it succeeded.');
  } catch (error) {
    if (isHarnessError(error)) {
      bad(id, name, `Rejected by the fee harness, not the covenant: ${error.name}: ${String(error.message).split('\n')[0]}`);
    } else {
      ok(id, name, `Rejected by the covenant VM: ${error.name}: ${String(error.message).split('\n')[0]}`);
    }
  }
}
function expectAccept(id, name, fn) {
  try {
    const detail = fn();
    ok(id, name, detail ?? 'VM accepted the transaction.');
  } catch (error) {
    bad(id, name, `Expected success, got ${error.name}: ${String(error.message).split('\n')[0]}`);
  }
}

// TEST-00: artifact / compilation
{
  const fnNames = artifact.abi.map((f) => f.name).sort();
  const { contract } = freshSetup();
  if (fnNames.join(',') === 'cancel,claim' && artifact.bytecode.length > 0 && contract.lockingBytecode.length > 0) {
    ok('TEST-00', 'Covenant compiles with claim/cancel ABI', `ABI=[${fnNames.join(', ')}], bytecode=${artifact.bytecode.length / 2} bytes`);
  } else {
    bad('TEST-00', 'Covenant compiles with claim/cancel ABI', `Unexpected artifact: ABI=[${fnNames.join(', ')}]`);
  }
}

expectAccept('TEST-01', 'Valid claim within limit (800 <= 1000)', () => {
  const builder = buildClaim(freshSetup(), 800n, PERIOD_BLOCKS);
  const hex = builder.build();
  builder.debug();
  return `Built ${hex.length / 2}-byte tx; covenant + signatures verified by the VM.`;
});

expectReject('TEST-02', 'Over-limit claim rejected (2500 > 1000)', () => {
  buildClaim(freshSetup(), 2500n, PERIOD_BLOCKS).debug();
});

expectReject('TEST-03', 'Claim before period elapsed rejected (age 0 < 10)', () => {
  buildClaim(freshSetup(), 800n, 0).debug();
});

expectReject('TEST-04', 'Change redirection to attacker rejected', () => {
  buildClaim(freshSetup(), 800n, PERIOD_BLOCKS, attackerTokenAddress).debug();
});

expectReject('TEST-05', 'Zero-amount claim rejected', () => {
  buildClaim(freshSetup(), 0n, PERIOD_BLOCKS).debug();
});

expectAccept('TEST-06', 'Payer cancel sweeps all remaining PUSD', () => {
  const setup = freshSetup();
  buildCancel(setup, payer, payerLockingBytecode).debug();
  return `Swept ${setup.vaultUtxo.token.amount} PUSD back to the payer.`;
});

expectReject('TEST-07', 'Cancel with non-payer key rejected', () => {
  buildCancel(freshSetup(), attacker, payerLockingBytecode).debug();
});

{
  const setup = freshSetup();
  try {
    const detail = await buildClaim(setup, 800n, PERIOD_BLOCKS).send();
    const remaining = await setup.contract.getUtxos();
    const stillThere = remaining.some((u) => u.token && u.token.amount === VAULT_TOKENS - 800n);
    if (detail && detail.txid && stillThere) {
      ok('TEST-08', 'Broadcast updates covenant UTXO (stream continues)', `txid=${detail.txid.slice(0, 16)}..., vault change carries ${VAULT_TOKENS - 800n} PUSD`);
    } else {
      bad('TEST-08', 'Broadcast updates covenant UTXO (stream continues)', `remaining utxos: ${remaining.length}`);
    }
  } catch (error) {
    bad('TEST-08', 'Broadcast updates covenant UTXO (stream continues)', `${error.name}: ${String(error.message).split('\n')[0]}`);
  }
}

// --- TEST-09: wrong payee signature (VM rejects) ---------------------------
expectReject('TEST-09', 'Claim signed by a non-payee key rejected', () => {
  buildClaim(freshSetup(), 800n, PERIOD_BLOCKS, undefined, { signer: attacker }).debug();
});

// --- TEST-10: a third output is rejected (outputs.length == 2) -------------
expectReject('TEST-10', 'Claim with a third output rejected', () => {
  buildClaim(freshSetup(), 800n, PERIOD_BLOCKS, undefined, { extraOutput: true }).debug();
});

// --- TEST-11: cancel routed to a non-payer address (VM rejects) ------------
expectReject('TEST-11', 'Cancel routed to a non-payer address rejected', () => {
  buildCancel(freshSetup(), payer, payerLockingBytecode, attackerTokenAddress).debug();
});

console.log('==================================================================');
console.log('  StreamVault.cash - Covenant VM Test Suite');
console.log(`  category=${CATEGORY.slice(0, 12)}...  perPeriod=${AMOUNT_PER_PERIOD}  periodBlocks=${PERIOD_BLOCKS}`);
console.log('==================================================================\n');
for (const line of results) console.log(line + '\n');
console.log('------------------------------------------------------------------');
console.log(`  ${passed} passed, ${failed} failed (of ${passed + failed})`);
console.log('------------------------------------------------------------------');
process.exit(failed === 0 ? 0 : 1);