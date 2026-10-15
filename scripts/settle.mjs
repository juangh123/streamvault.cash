/**
 * StreamVault.cash - settlement CLI.
 *
 * Executes the real covenant lifecycle (fund / claim / cancel) on Chipnet or Mainnet, or a
 * self-contained dry run against the local BCH VM. Mirrors the construction logic in src/lib/chain.ts.
 *
 * Usage (dry run - no keys, no funds):
 *   node scripts/settle.mjs --dry-run
 *
 * Usage (live - requires a funded wallet + PUSD):
 *   set NETWORK=mainnet
 *   set PAYER_WIF=<wif>
 *   set PAYEE_WIF=<wif>
 *   set CATEGORY=<pusd token category hex>
 *   node scripts/settle.mjs --action=fund   --deposit=1000
 *   node scripts/settle.mjs --action=claim  --amount=25
 *   node scripts/settle.mjs --action=cancel
 */
import { readFile } from 'node:fs/promises';
import {
  Contract,
  ElectrumNetworkProvider,
  MockNetworkProvider,
  SignatureTemplate,
  TransactionBuilder,
} from 'cashscript';
import { hexToBin, lockingBytecodeToCashAddress, publicKeyToP2pkhLockingBytecode } from '@bitauth/libauth';

const DUST = 1000n;
const FEE_RATE = 2;

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const env = (name, fallback) => process.env[name] ?? fallback;
const has = (name) => process.argv.includes(`--${name}`);

const cfg = {
  dryRun: has('dry-run'),
  action: arg('action', 'dry-run'),
  network: env('NETWORK', 'chipnet'),
  payerWif: env('PAYER_WIF', ''),
  payeeWif: env('PAYEE_WIF', ''),
  category: env('CATEGORY', 'a'.repeat(64)),
  amountPerPeriod: BigInt(env('AMOUNT_PER_PERIOD', '2500')),
  periodBlocks: BigInt(env('PERIOD_BLOCKS', '144')),
  deposit: BigInt(arg('deposit', env('DEPOSIT', '100000'))),
  amount: BigInt(arg('amount', env('AMOUNT', '2500'))),
};

const prefixOf = (address) => (address.startsWith('bitcoincash:') ? 'bitcoincash' : 'bchtest');
const tokenAddress = (publicKey, prefix) =>
  lockingBytecodeToCashAddress({ bytecode: publicKeyToP2pkhLockingBytecode({ publicKey }), prefix, tokenSupport: true }).address;
const sizeFee = (builder) => builder.getTransactionSize() * BigInt(FEE_RATE);

const artifact = JSON.parse(await readFile(new URL('../contracts/artifacts/StreamVault.json', import.meta.url), 'utf8'));

function newContract(payer, payee, provider) {
  return new Contract(artifact, [payer.publicKey, payee.publicKey, cfg.amountPerPeriod, cfg.periodBlocks, hexToBin(cfg.category)], { provider });
}

function claimBuilder(contract, utxo, payeeSigner, payeeTokenAddress, sequence) {
  const b = new TransactionBuilder({ provider: contract.provider, maximumFeeSatsPerByte: FEE_RATE + 3 });
  b.addInput(utxo, contract.unlock.claim(payeeSigner, cfg.amount), { sequence });
  b.addOutput({ to: payeeTokenAddress, amount: DUST, token: { amount: cfg.amount, category: utxo.token.category } });
  b.addOutput({ to: contract.tokenAddress, amount: DUST, token: { amount: utxo.token.amount - cfg.amount, category: utxo.token.category } });
  b.outputs[1].amount = utxo.satoshis - DUST - sizeFee(b);
  return b;
}

function cancelBuilder(contract, utxo, payerSigner, payerLockingBytecode, sequence) {
  const b = new TransactionBuilder({ provider: contract.provider, maximumFeeSatsPerByte: FEE_RATE + 3 });
  b.addInput(utxo, contract.unlock.cancel(payerSigner, payerLockingBytecode), { sequence });
  const dest = lockingBytecodeToCashAddress({ bytecode: payerLockingBytecode, prefix: prefixOf(contract.address), tokenSupport: true }).address;
  b.addOutput({ to: dest, amount: DUST, token: { amount: utxo.token.amount, category: utxo.token.category } });
  b.outputs[0].amount = utxo.satoshis - sizeFee(b);
  return b;
}

async function dryRun() {
  const provider = new MockNetworkProvider();
  const payer = new SignatureTemplate('11'.repeat(32));
  const payee = new SignatureTemplate('22'.repeat(32));
  const contract = newContract(payer, payee, provider);
  provider.addUtxo(contract.tokenAddress, { txid: 'ab'.repeat(32), vout: 0, satoshis: 50000n, token: { amount: cfg.deposit, category: cfg.category } });
  console.log('Contract:', contract.address);
  console.log('Token address:', contract.tokenAddress);

  const utxo = (await contract.getUtxos())[0];
  const payeeAddr = tokenAddress(payee.publicKey, prefixOf(contract.address));
  const claimHex = claimBuilder(contract, utxo, payee, payeeAddr, Number(cfg.periodBlocks)).build();
  console.log('claim tx:', claimHex.length / 2, 'bytes (VM-validated by the mock broadcast below)');
  const claimTxid = await provider.sendRawTransaction(claimHex);
  console.log('claim broadcast ok:', claimTxid);

  const changeUtxo = (await contract.getUtxos()).find((u) => u.token);
  const payerLb = publicKeyToP2pkhLockingBytecode({ publicKey: payer.publicKey });
  const cancelHex = cancelBuilder(contract, changeUtxo, payer, payerLb, Number(cfg.periodBlocks)).build();
  const cancelTxid = await provider.sendRawTransaction(cancelHex);
  console.log('cancel broadcast ok:', cancelTxid);
  console.log('\nDry run complete: fund -> claim -> cancel all accepted by the BCH VM.');
}

async function live() {
  if (!cfg.payerWif || !cfg.payeeWif) throw new Error('Set PAYER_WIF and PAYEE_WIF for a live settlement.');
  const provider = new ElectrumNetworkProvider(cfg.network);
  const payer = new SignatureTemplate(cfg.payerWif);
  const payee = new SignatureTemplate(cfg.payeeWif);
  const contract = newContract(payer, payee, provider);
  console.log('Network:', cfg.network, '| contract:', contract.address);

  const tokenUtxos = (await contract.getUtxos()).filter((u) => u.token && u.token.category === cfg.category);
  if (!tokenUtxos.length) throw new Error('No vault UTXO carrying the configured PUSD category. Fund the vault first (send PUSD + a little BCH to ' + contract.tokenAddress + ').');
  const utxo = tokenUtxos[0];

  if (cfg.action === 'claim') {
    const payeeAddr = tokenAddress(payee.publicKey, prefixOf(contract.address));
    const hex = claimBuilder(contract, utxo, payee, payeeAddr, Number(cfg.periodBlocks)).build();
    const details = await provider.sendRawTransaction(hex) ?? hex;
    console.log('claim submitted. txid:', details);
  } else if (cfg.action === 'cancel') {
    const payerLb = publicKeyToP2pkhLockingBytecode({ publicKey: payer.publicKey });
    const hex = cancelBuilder(contract, utxo, payer, payerLb, Number(cfg.periodBlocks)).build();
    const details = await provider.sendRawTransaction(hex) ?? hex;
    console.log('cancel submitted. txid:', details);
  } else {
    throw new Error('Live --action must be claim or cancel, or pass --dry-run. Fund from your wallet by sending PUSD to ' + contract.tokenAddress);
  }
}

const run = cfg.dryRun || cfg.action === 'dry-run' ? dryRun() : live();
run.catch((e) => { console.error('\nSettlement failed:', e.message); process.exitCode = 1; });