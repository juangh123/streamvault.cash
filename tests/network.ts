/**
 * Live network check: confirms the app's Electrum providers reach real BCH networks and that the
 * covenant address derives for each network. Read-only - no keys, no funds, no broadcast.
 */
import { ElectrumNetworkProvider } from 'cashscript';
import { hexToBin } from '@bitauth/libauth';
import { deriveVaultAddresses } from '../src/lib/chain';

const payerPk = hexToBin('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798');
const payeePk = hexToBin('02c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5');

let failures = 0;
for (const network of ['chipnet', 'mainnet'] as const) {
  try {
    const provider = new ElectrumNetworkProvider(network);
    const height = await provider.getBlockHeight();
    const vault = deriveVaultAddresses({ payerPk, payeePk, amountPerPeriod: 2500, periodBlocks: 144 }, network);
    const ok = Number(height) > 0 && vault.address.length > 20;
    if (!ok) failures += 1;
    console.log(`[${ok ? 'PASS' : 'FAIL'}] ${network}: height=${height} vault=${vault.address}`);
  } catch (e) {
    failures += 1;
    console.log(`[FAIL] ${network}: ${(e as Error).message}`);
  }
}

if (failures > 0) { console.error(`\n${failures} network check(s) failed.`); process.exit(1); }
console.log('\nAll networks reachable and covenants derived.');