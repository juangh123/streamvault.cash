/**
 * Integration tests for src/lib/chain.ts.
 *
 * Proves the live-layer helpers (makeContract / buildClaimHex / buildCancelHex / WalletConnect
 * objects) produce transactions the covenant VM actually accepts. Uses MockNetworkProvider, whose
 * sendRawTransaction evaluates the real BCH VM.
 */
import { MockNetworkProvider, SignatureTemplate } from 'cashscript';
import { lockingBytecodeToCashAddress, publicKeyToP2pkhLockingBytecode } from '@bitauth/libauth';
import { buildCancelHex, buildCancelWcObject, buildClaimHex, buildClaimWcObject, makeContract } from '../src/lib/chain';

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

console.log('==================================================================');
console.log('  StreamVault.cash - Live Layer (chain.ts) Test Suite');
console.log('==================================================================\n');
for (const l of lines) console.log(l + '\n');
console.log('------------------------------------------------------------------');
console.log(`  ${passed} passed, ${failed} failed (of ${passed + failed})`);
console.log('------------------------------------------------------------------');
if (failed > 0) process.exit(1);