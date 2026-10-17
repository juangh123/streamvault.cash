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
const FEE_RATE = 1n; // keep the 1000-sat tranche output plus fee within the 2000-sat bound
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
const payerTokenAddress = toTokenAddress(payer.publicKey);
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
  const tokenCategory = opts.tokenCategory ?? CATEGORY;
  const builder = new TransactionBuilder({ provider, maximumFeeSatsPerByte: MAX_FEE_RATE });
  if (opts.extraInput) {
    builder.addInput(opts.extraInput, opts.extraInputUnlocker);
  }
  builder.addInput(vaultUtxo, contract.unlock.claim(signer, amount), { sequence });
  builder.addOutput({ to: payeeTokenAddress, amount: DUST, token: { amount, category: tokenCategory } });
  builder.addOutput({
    to: changeTo ?? contract.tokenAddress,
    amount: DUST,
    token: { amount: vaultUtxo.token.amount - amount, category: tokenCategory },
  });
  if (opts.extraOutput) {
    builder.addOutput({ to: attackerTokenAddress, amount: 1000n });
  }
  const extra = opts.extraOutput ? 1000n : 0n;
  builder.outputs[1].amount = opts.changeAmount ?? (vaultUtxo.satoshis - DUST - extra - sizeFee(builder));
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

function buildTopUp({ provider, contract, vaultUtxo, walletUtxo }, opts = {}) {
  const contractSigner = opts.contractSigner ?? payer;
  const walletSigner = opts.walletSigner ?? payer;
  const category = opts.outputCategory ?? CATEGORY;
  const builder = new TransactionBuilder({ provider, maximumFeeSatsPerByte: 10 });
  builder.addInput(vaultUtxo, contract.unlock.topUp(contractSigner));
  builder.addInput(walletUtxo, walletSigner.unlockP2PKH());
  builder.addOutput({
    to: contract.tokenAddress,
    amount: DUST,
    token: {
      amount: opts.mergedAmount ?? (vaultUtxo.token.amount + walletUtxo.token.amount),
      category: CATEGORY,
    },
  });
  builder.outputs[0].amount =
    opts.changeAmount ?? (vaultUtxo.satoshis + walletUtxo.satoshis - sizeFee(builder));
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
  if (fnNames.join(',') === 'cancel,claim,topUp' && artifact.bytecode.length > 0 && contract.lockingBytecode.length > 0) {
    ok('TEST-00', 'Covenant compiles with claim/cancel/topUp ABI', `ABI=[${fnNames.join(', ')}], bytecode=${artifact.bytecode.length / 2} bytes`);
  } else {
    bad('TEST-00', 'Covenant compiles with claim/cancel ABI', `Unexpected artifact: ABI=[${fnNames.join(', ')}]`);
  }
}

function addPayerWalletUtxo(setup, overrides = {}) {
  return setup.provider.addUtxo(payerTokenAddress, {
    txid: overrides.txid ?? 'bc'.repeat(32),
    vout: 0,
    satoshis: overrides.satoshis ?? 50000n,
    token: {
      amount: overrides.amount ?? 5000n,
      category: overrides.category ?? CATEGORY,
    },
  });
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

// --- TEST-12: claim must spend exactly one input ---------------------------
expectReject('TEST-12', 'Claim with a second wallet input rejected', () => {
  const setup = freshSetup();
  const walletUtxo = setup.provider.addUtxo(payeeTokenAddress, {
    txid: 'cd'.repeat(32),
    vout: 0,
    satoshis: 1500n,
  });
  buildClaim(setup, 800n, PERIOD_BLOCKS, undefined, {
    extraInput: walletUtxo,
    extraInputUnlocker: payee.unlockP2PKH(),
  }).debug();
});

// --- TEST-13: claim must use the configured PUSD category on the input ------
expectReject('TEST-13', 'Claim with a wrong input token category rejected', () => {
  const provider = new MockNetworkProvider();
  const wrongCategory = 'b'.repeat(64);
  const contract = new Contract(
    artifact,
    [payer.publicKey, payee.publicKey, AMOUNT_PER_PERIOD, BigInt(PERIOD_BLOCKS), hexToBin(CATEGORY)],
    { provider },
  );
  const vaultUtxo = provider.addUtxo(contract.tokenAddress, {
    txid: 'ef'.repeat(32),
    vout: 0,
    satoshis: VAULT_BCH,
    token: { amount: VAULT_TOKENS, category: wrongCategory },
  });
  buildClaim({ provider, contract, vaultUtxo }, 800n, PERIOD_BLOCKS, undefined, {
    tokenCategory: wrongCategory,
  }).debug();
});

// --- TEST-14: the vault change must preserve its BCH buffer ----------------
expectReject('TEST-14', 'Claim draining the vault BCH buffer rejected', () => {
  const setup = freshSetup();
  buildClaim(setup, 800n, PERIOD_BLOCKS, undefined, {
    changeAmount: setup.vaultUtxo.satoshis - 3000n,
  }).debug();
});

// --- TEST-15: a claim at the 2000-sat buffer boundary is accepted ----------
expectAccept('TEST-15', 'Claim preserving the 2000-sat BCH buffer accepted', () => {
  const setup = freshSetup();
  const builder = buildClaim(setup, 800n, PERIOD_BLOCKS, undefined, {
    changeAmount: setup.vaultUtxo.satoshis - 2000n,
  });
  builder.debug();
  return 'VM accepted a claim whose vault change is exactly input minus 2000 sats.';
});

// --- TEST-16..20: top-up path ------------------------------------------------
{
  const setup = freshSetup();
  try {
    const walletUtxo = addPayerWalletUtxo(setup);
    const builder = buildTopUp({ ...setup, walletUtxo });
    const txid = await builder.send();
    const merged = (await setup.contract.getUtxos()).find(
      (utxo) => utxo.token?.amount === VAULT_TOKENS + walletUtxo.token.amount,
    );
    if (txid && merged) {
      ok('TEST-16', 'Payer top-up merges PUSD into one vault UTXO', `merged=${merged.token.amount}`);
    } else {
      bad('TEST-16', 'Payer top-up merges PUSD into one vault UTXO', 'merged UTXO not found');
    }
  } catch (error) {
    bad('TEST-16', 'Payer top-up merges PUSD into one vault UTXO', `${error.name}: ${String(error.message).split('\n')[0]}`);
  }
}

expectReject('TEST-17', 'Top-up with a non-payer signature rejected', () => {
  const setup = freshSetup();
  const walletUtxo = addPayerWalletUtxo(setup, { txid: 'bd'.repeat(32) });
  buildTopUp({ ...setup, walletUtxo }, { contractSigner: attacker, walletSigner: payer }).debug();
});

expectReject('TEST-18', 'Top-up with a wrong input category rejected', () => {
  const setup = freshSetup();
  const walletUtxo = addPayerWalletUtxo(setup, { txid: 'be'.repeat(32), category: 'b'.repeat(64) });
  buildTopUp({ ...setup, walletUtxo }, { outputCategory: 'b'.repeat(64) }).debug();
});

expectReject('TEST-19', 'Top-up with the wrong merged amount rejected', () => {
  const setup = freshSetup();
  const walletUtxo = addPayerWalletUtxo(setup, { txid: 'bf'.repeat(32) });
  buildTopUp({ ...setup, walletUtxo }, {
    mergedAmount: VAULT_TOKENS + walletUtxo.token.amount - 1n,
  }).debug();
});

expectReject('TEST-20', 'Top-up draining the vault BCH buffer rejected', () => {
  const setup = freshSetup();
  const walletUtxo = addPayerWalletUtxo(setup, { txid: 'c0'.repeat(32) });
  buildTopUp({ ...setup, walletUtxo }, {
    changeAmount: setup.vaultUtxo.satoshis + walletUtxo.satoshis - 3000n,
  }).debug();
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
