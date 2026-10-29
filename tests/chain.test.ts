/**
 * Integration tests for src/lib/chain.ts.
 *
 * Proves the live-layer helpers (makeContract / buildClaimHex / buildCancelHex / WalletConnect
 * objects) produce transactions the covenant VM actually accepts. Uses MockNetworkProvider, whose
 * sendRawTransaction evaluates the real BCH VM.
 */
import { MockNetworkProvider, SignatureTemplate } from 'cashscript';
import { lockingBytecodeToCashAddress, publicKeyToP2pkhLockingBytecode } from '@bitauth/libauth';
import {
  buildCancelHex,
  buildCancelWcObject,
  buildClaimHex,
  buildClaimWcObject,
  buildFundHex,
  buildFundWcObject,
  buildTopUpHex,
  buildTopUpWcObject,
  broadcastSigned,
  fundInputPaths,
  makeContract,
  selectFundingUtxos,
  serializeWcTransaction,
  TOP_UP_INPUT_PATHS,
  tokenAddressForPublicKey,
  transactionIdFromHex,
} from '../src/lib/chain';

const CATEGORY = 'a'.repeat(64);
const PERIOD_BLOCKS = 10;
const VAULT_TOKENS = 100000n;
const VAULT_BCH = 50000n;

const payer = new SignatureTemplate('11'.repeat(32));
const payee = new SignatureTemplate('22'.repeat(32));
const payerLockingBytecode = publicKeyToP2pkhLockingBytecode({ publicKey: payer.publicKey });

let passed = 0;
let failed = 0;
const lines: string[] = [];
function check(cond: boolean, id: string, name: string, detail: string) {
  if (cond) { passed += 1; lines.push(`[PASS] ${id}: ${name}\n       ${detail}`); }
  else { failed += 1; lines.push(`[FAIL] ${id}: ${name}\n       ${detail}`); }
}

function setup() {
  const provider = new MockNetworkProvider();
  const contract = makeContract(
    { payerPk: payer.publicKey, payeePk: payee.publicKey, amountPerPeriod: 1000, periodBlocks: PERIOD_BLOCKS, category: CATEGORY },
    provider,
  );
  const utxo = provider.addUtxo(contract.tokenAddress, { txid: 'ab'.repeat(32), vout: 0, satoshis: VAULT_BCH, token: { amount: VAULT_TOKENS, category: CATEGORY } });
  const prefix = contract.address.startsWith('bitcoincash:') ? 'bitcoincash' : 'bchtest';
  const payeeTokenAddress = (lockingBytecodeToCashAddress({ bytecode: publicKeyToP2pkhLockingBytecode({ publicKey: payee.publicKey }), prefix, tokenSupport: true }) as { address: string }).address;
  return { provider, contract, utxo, payeeTokenAddress };
}

// CHAIN-00: deriveVault style address is a valid covenant address
{
  const { contract } = setup();
  check(contract.address.length > 20 && contract.tokenAddress.startsWith(contract.address.slice(0, contract.address.indexOf(':'))), 'CHAIN-00', 'makeContract derives a covenant address', `${contract.address}`);
}

// CHAIN-01: buildClaimHex produces a claim the VM accepts (broadcast via mock)
{
  try {
    const { provider, contract, utxo, payeeTokenAddress } = setup();
    const hex = buildClaimHex({ contract, utxo, payeeTokenAddress, amount: 800, sequence: PERIOD_BLOCKS, payeeSigner: payee });
    const txid = await provider.sendRawTransaction(hex);
    check(typeof txid === 'string' && txid.length === 64, 'CHAIN-01', 'buildClaimHex -> VM-accepted claim', `txid=${txid.slice(0, 16)}... hex=${hex.length / 2} bytes`);
  } catch (e) {
    check(false, 'CHAIN-01', 'buildClaimHex -> VM-accepted claim', (e as Error).message.split('\n')[0]);
  }
}

// CHAIN-02: buildClaimHex refuses to drain the vault
{
  try {
    const { contract, utxo, payeeTokenAddress } = setup();
    buildClaimHex({ contract, utxo, payeeTokenAddress, amount: 100000, sequence: PERIOD_BLOCKS, payeeSigner: payee });
    check(false, 'CHAIN-02', 'buildClaimHex refuses a draining claim', 'built a draining claim (bug)');
  } catch (e) {
    check(true, 'CHAIN-02', 'buildClaimHex refuses a draining claim', (e as Error).message.split('\n')[0]);
  }
}

// CHAIN-03: buildCancelHex produces a cancel the VM accepts
{
  try {
    const { provider, contract, utxo } = setup();
    const hex = buildCancelHex({ contract, utxo, payerLockingBytecode, sequence: PERIOD_BLOCKS, payerSigner: payer });
    const txid = await provider.sendRawTransaction(hex);
    check(typeof txid === 'string' && txid.length === 64, 'CHAIN-03', 'buildCancelHex -> VM-accepted cancel', `txid=${txid.slice(0, 16)}...`);
  } catch (e) {
    check(false, 'CHAIN-03', 'buildCancelHex -> VM-accepted cancel', (e as Error).message.split('\n')[0]);
  }
}

// CHAIN-04: WalletConnect objects carry the covenant redeem script
{
  try {
    const { contract, utxo, payeeTokenAddress } = setup();
    const claimObj = buildClaimWcObject({ contract, utxo, payeeTokenAddress, amount: 800, sequence: PERIOD_BLOCKS });
    const cancelObj = buildCancelWcObject({ contract, utxo, payerLockingBytecode, sequence: PERIOD_BLOCKS });
    const claimHasContract = Boolean((claimObj.sourceOutputs[0] as { contract?: unknown }).contract);
    const cancelHasContract = Boolean((cancelObj.sourceOutputs[0] as { contract?: unknown }).contract);
    const claimHasTx = Boolean(claimObj.transaction && claimObj.transaction.outputs && claimObj.transaction.outputs.length === 2);
    check(claimHasContract && cancelHasContract && claimHasTx, 'CHAIN-04', 'WalletConnect objects include the covenant redeem script', `claimContract=${claimHasContract} cancelContract=${cancelHasContract} outputs=${claimObj.transaction?.outputs?.length}`);
  } catch (e) {
    check(false, 'CHAIN-04', 'WalletConnect objects include the covenant redeem script', (e as Error).message.split('\n')[0]);
  }
}

// CHAIN-05: fund WC object serializes to wallet-ready hex and carries the token output
{
  try {
    const { provider, contract } = setup();
    const prefix = contract.address.startsWith('bitcoincash:') ? 'bitcoincash' : 'bchtest';
    const payerAddress = (lockingBytecodeToCashAddress({
      bytecode: publicKeyToP2pkhLockingBytecode({ publicKey: payer.publicKey }),
      prefix,
    }) as { address: string }).address;
    const payerTokenAddress = tokenAddressForPublicKey(payer.publicKey, prefix);
    const walletUtxo = provider.addUtxo(payerTokenAddress, {
      txid: '12'.repeat(32),
      vout: 0,
      satoshis: 100000n,
      token: { amount: 5000n, category: CATEGORY },
    });
    const object = buildFundWcObject({
      contract,
      walletAddress: payerAddress,
      walletTokenAddress: payerTokenAddress,
      walletUtxos: [walletUtxo],
      deposit: 2000n,
      category: CATEGORY,
      vaultBch: 50000n,
    });
    const hex = serializeWcTransaction(object);
    const paths = fundInputPaths(1);
    check(
      hex.length > 20 && /^[0-9a-f]+$/.test(hex) && paths[0][1] === 'receive',
      'CHAIN-05',
      'Fund WC object serializes and input paths target receive/0',
      `hex=${hex.slice(0, 16)}... paths=${JSON.stringify(paths)}`,
    );
  } catch (e) {
    check(false, 'CHAIN-05', 'Fund WC object serializes and input paths target receive/0', (e as Error).message.split('\n')[0]);
  }
}

// CHAIN-06: locally signed funding transaction creates the vault token UTXO
{
  try {
    const { provider, contract } = setup();
    const prefix = contract.address.startsWith('bitcoincash:') ? 'bitcoincash' : 'bchtest';
    const payerAddress = (lockingBytecodeToCashAddress({
      bytecode: publicKeyToP2pkhLockingBytecode({ publicKey: payer.publicKey }),
      prefix,
    }) as { address: string }).address;
    const payerTokenAddress = tokenAddressForPublicKey(payer.publicKey, prefix);
    const walletUtxo = provider.addUtxo(payerTokenAddress, {
      txid: '23'.repeat(32),
      vout: 0,
      satoshis: 100000n,
      token: { amount: 5000n, category: CATEGORY },
    });
    const hex = buildFundHex({
      contract,
      walletAddress: payerAddress,
      walletTokenAddress: payerTokenAddress,
      walletUtxos: [walletUtxo],
      deposit: 2000n,
      category: CATEGORY,
      vaultBch: 50000n,
      walletSigner: payer,
    });
    const txid = await provider.sendRawTransaction(hex);
    const vaultUtxos = await contract.getUtxos();
    const funded = vaultUtxos.some((utxo) => utxo.token?.amount === 2000n && utxo.token.category === CATEGORY);
    check(funded && txid.length === 64, 'CHAIN-06', 'Signed fund transaction creates the vault UTXO', `txid=${txid.slice(0, 16)}... vaultUtxos=${vaultUtxos.length}`);
  } catch (e) {
    check(false, 'CHAIN-06', 'Signed fund transaction creates the vault UTXO', (e as Error).message.split('\n')[0]);
  }
}

// CHAIN-07: top-up WC object serializes with both payer inputs
{
  try {
    const { provider, contract, utxo } = setup();
    const prefix = contract.address.startsWith('bitcoincash:') ? 'bitcoincash' : 'bchtest';
    const payerAddress = (lockingBytecodeToCashAddress({
      bytecode: publicKeyToP2pkhLockingBytecode({ publicKey: payer.publicKey }),
      prefix,
    }) as { address: string }).address;
    const payerTokenAddress = tokenAddressForPublicKey(payer.publicKey, prefix);
    const walletUtxo = provider.addUtxo(payerTokenAddress, {
      txid: '34'.repeat(32),
      vout: 0,
      satoshis: 50000n,
      token: { amount: 5000n, category: CATEGORY },
    });
    const object = buildTopUpWcObject({
      contract,
      vaultUtxo: utxo,
      walletUtxo,
      walletAddress: payerAddress,
    });
    const hex = serializeWcTransaction(object);
    check(
      hex.length > 20 &&
        object.transaction.inputs.length === 2 &&
        object.transaction.outputs.length === 1 &&
        TOP_UP_INPUT_PATHS.length === 2 &&
        TOP_UP_INPUT_PATHS[1][1] === 'receive',
      'CHAIN-07',
      'Top-up WC object has two inputs and one merged output',
      `inputs=${object.transaction.inputs.length} outputs=${object.transaction.outputs.length} paths=${JSON.stringify(TOP_UP_INPUT_PATHS)}`,
    );
  } catch (e) {
    check(false, 'CHAIN-07', 'Top-up WC object has two inputs and one merged output', (e as Error).message.split('\n')[0]);
  }
}

// CHAIN-08: signed top-up merges the wallet PUSD UTXO into the vault
{
  try {
    const { provider, contract, utxo } = setup();
    const prefix = contract.address.startsWith('bitcoincash:') ? 'bitcoincash' : 'bchtest';
    const payerAddress = (lockingBytecodeToCashAddress({
      bytecode: publicKeyToP2pkhLockingBytecode({ publicKey: payer.publicKey }),
      prefix,
    }) as { address: string }).address;
    const payerTokenAddress = tokenAddressForPublicKey(payer.publicKey, prefix);
    const walletUtxo = provider.addUtxo(payerTokenAddress, {
      txid: '45'.repeat(32),
      vout: 0,
      satoshis: 50000n,
      token: { amount: 5000n, category: CATEGORY },
    });
    const hex = buildTopUpHex({
      contract,
      vaultUtxo: utxo,
      walletUtxo,
      walletAddress: payerAddress,
      payerSigner: payer,
    });
    const txid = await provider.sendRawTransaction(hex);
    const merged = (await contract.getUtxos()).some(
      (candidate) => candidate.token?.amount === 105000n,
    );
    check(merged && txid.length === 64, 'CHAIN-08', 'Signed top-up merges the vault UTXO', `txid=${txid.slice(0, 16)}...`);
  } catch (e) {
    check(false, 'CHAIN-08', 'Signed top-up merges the vault UTXO', (e as Error).message.split('\n')[0]);
  }
}

// CHAIN-09: broadcast layer derives the same txid as the provider
{
  try {
    const { provider, contract, utxo, payeeTokenAddress } = setup();
    const hex = buildClaimHex({
      contract,
      utxo,
      payeeTokenAddress,
      amount: 800,
      sequence: PERIOD_BLOCKS,
      payeeSigner: payee,
    });
    const expected = transactionIdFromHex(hex);
    const actual = await broadcastSigned(provider, hex);
    check(
      expected === actual,
      'CHAIN-09',
      'broadcastSigned uses the signed transaction txid',
      `txid=${actual.slice(0, 16)}...`,
    );
  } catch (e) {
    check(false, 'CHAIN-09', 'broadcastSigned uses the signed transaction txid', (e as Error).message.split('\n')[0]);
  }
}

// Realistic wallet: PUSD UTXOs carry dust-level BCH, so the vault buffer must come from plain BCH UTXOs.
function realisticWallet(bchSatoshis: bigint) {
  const provider = new MockNetworkProvider();
  const contract = makeContract(
    { payerPk: payer.publicKey, payeePk: payee.publicKey, amountPerPeriod: 10, periodBlocks: 2, category: CATEGORY },
    provider,
  );
  const prefix = contract.address.startsWith('bitcoincash:') ? 'bitcoincash' : 'bchtest';
  const payerAddress = (lockingBytecodeToCashAddress({
    bytecode: publicKeyToP2pkhLockingBytecode({ publicKey: payer.publicKey }),
    prefix,
  }) as { address: string }).address;
  const payerTokenAddress = tokenAddressForPublicKey(payer.publicKey, prefix);
  provider.addUtxo(payerTokenAddress, { txid: '51'.repeat(32), vout: 0, satoshis: 800n, token: { amount: 150n, category: CATEGORY } });
  provider.addUtxo(payerTokenAddress, { txid: '52'.repeat(32), vout: 0, satoshis: 800n, token: { amount: 120n, category: CATEGORY } });
  provider.addUtxo(payerTokenAddress, { txid: '53'.repeat(32), vout: 0, satoshis: 1000n, token: { amount: 999n, category: 'b'.repeat(64) } });
  if (bchSatoshis > 0n) provider.addUtxo(payerAddress, { txid: '54'.repeat(32), vout: 0, satoshis: bchSatoshis });
  return { provider, contract, payerAddress, payerTokenAddress };
}

// CHAIN-10: funding a 2.00 PUSD agent vault from dust-level PUSD UTXOs pulls in plain BCH for the buffer
{
  try {
    const { provider, contract, payerAddress, payerTokenAddress } = realisticWallet(120000n);
    const walletUtxos = await provider.getUtxos(payerTokenAddress);
    const { selected } = selectFundingUtxos(walletUtxos, 200n, CATEGORY);
    const foreign = selected.some((utxo) => utxo.token && utxo.token.category !== CATEGORY);
    const plain = selected.filter((utxo) => !utxo.token).length;
    const hex = buildFundHex({
      contract,
      walletAddress: payerAddress,
      walletTokenAddress: payerTokenAddress,
      walletUtxos: selected,
      deposit: 200n,
      category: CATEGORY,
      walletSigner: payer,
    });
    const txid = await provider.sendRawTransaction(hex);
    const vault = (await contract.getUtxos()).find((utxo) => utxo.token?.category === CATEGORY);
    const wc = buildFundWcObject({
      contract,
      walletAddress: payerAddress,
      walletTokenAddress: payerTokenAddress,
      walletUtxos: selected,
      deposit: 200n,
      category: CATEGORY,
    });
    check(
      !foreign && plain === 1 && vault?.token?.amount === 200n && vault.satoshis === 50000n &&
        txid.length === 64 && wc.transaction.inputs.length === selected.length &&
        fundInputPaths(selected.length).length === selected.length,
      'CHAIN-10',
      'Fund selection adds plain BCH so dust-level PUSD UTXOs can fund the 50,000-sat vault buffer',
      `inputs=${selected.length} (plain BCH ${plain}), vault=${vault?.token?.amount} PUSD / ${vault?.satoshis} sats`,
    );
  } catch (e) {
    check(false, 'CHAIN-10', 'Fund selection adds plain BCH so dust-level PUSD UTXOs can fund the 50,000-sat vault buffer', (e as Error).message.split('\n')[0]);
  }
}

// CHAIN-11: a wallet without enough plain BCH gets a clear error before any signing request
{
  try {
    const { provider, payerTokenAddress } = realisticWallet(10000n);
    const walletUtxos = await provider.getUtxos(payerTokenAddress);
    let message = '';
    try {
      selectFundingUtxos(walletUtxos, 200n, CATEGORY);
    } catch (e) {
      message = (e as Error).message;
    }
    check(
      message.startsWith('Insufficient BCH'),
      'CHAIN-11',
      'Fund selection rejects a wallet without enough BCH for the vault buffer',
      message.slice(0, 90),
    );
  } catch (e) {
    check(false, 'CHAIN-11', 'Fund selection rejects a wallet without enough BCH for the vault buffer', (e as Error).message.split('\n')[0]);
  }
}

console.log('==================================================================');
console.log('  StreamVault.cash - Live Layer (chain.ts) Test Suite');
console.log('==================================================================\n');
for (const l of lines) console.log(l + '\n');
console.log('------------------------------------------------------------------');
console.log(`  ${passed} passed, ${failed} failed (of ${passed + failed})`);
console.log('------------------------------------------------------------------');
if (failed > 0) process.exit(1);
