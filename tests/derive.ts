/**
 * Offline check that src/lib/chain.ts actually instantiates the covenant and derives deterministic
 * addresses for Chipnet and Mainnet. No network connection is made (Electrum only connects on query).
 */
import { hexToBin } from '@bitauth/libauth';
import { deriveVaultAddresses } from '../src/lib/chain';

const payerPk = hexToBin('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798');
const payeePk = hexToBin('02c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5');

let failures = 0;
for (const network of ['chipnet', 'mainnet'] as const) {
  const v = deriveVaultAddresses({ payerPk, payeePk, amountPerPeriod: 2500, periodBlocks: 144 }, network);
  const prefix = network === 'mainnet' ? 'bitcoincash:' : 'bchtest:';
  const okAddr = v.address.startsWith(prefix);
  const okToken = v.tokenAddress.startsWith(prefix);
  const okLock = v.lockingBytecode.length > 0 && v.bytecode.length > 0;
  if (!(okAddr && okToken && okLock)) failures += 1;
  console.log(
    `[${okAddr && okToken && okLock ? 'PASS' : 'FAIL'}] ${network}: ${v.address} | token ${v.tokenAddress} | lock ${v.lockingBytecode.slice(0, 24)}...`,
  );
}

if (failures > 0) {
  console.error(`\n${failures} derivation failure(s).`);
  process.exit(1);
}
console.log('\nAll address derivations passed.');