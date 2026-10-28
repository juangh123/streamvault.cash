import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import {
  binToHex,
  cashAddressToLockingBytecode,
  decodeCashAddress,
  decodePrivateKeyWif,
  publicKeyToP2pkhLockingBytecode,
  secp256k1,
} from '@bitauth/libauth';

const envFile = process.argv[2] ?? '.env';
let fileEnv;
try {
  fileEnv = parseEnv(readFileSync(envFile, 'utf8'));
} catch {
  console.error(`[FAIL] Cannot read ${envFile}. Pass a wallet env file as the first argument.`);
  process.exit(1);
}

const env = { ...process.env, ...fileEnv };
const failures = [];
const warnings = [];
const passes = [];

const pass = (name, detail) => passes.push(`[PASS] ${name}${detail ? `: ${detail}` : ''}`);
const fail = (name, detail) => failures.push(`[FAIL] ${name}${detail ? `: ${detail}` : ''}`);
const warn = (name, detail) => warnings.push(`[WARN] ${name}${detail ? `: ${detail}` : ''}`);

const network = (env.AGENT_NETWORK ?? 'chipnet').trim();
const expectedPrefix = network === 'mainnet' ? 'bitcoincash' : network === 'chipnet' ? 'bchtest' : null;
if (!expectedPrefix) fail('AGENT_NETWORK', 'must be chipnet or mainnet');
else pass('AGENT_NETWORK', network);

const enabled = (env.AGENT_ENABLED ?? 'false').trim().toLowerCase();
if (enabled !== 'true' && enabled !== 'false') fail('AGENT_ENABLED', 'must be true or false');
else pass('AGENT_ENABLED', enabled);

const serviceAddress = (env.SERVICE_ADDRESS ?? '').trim();
let serviceLockingHex = '';
if (!serviceAddress) {
  fail('SERVICE_ADDRESS', 'is required for the Agent API');
} else {
  const decoded = decodeCashAddress(serviceAddress);
  if (typeof decoded === 'string') {
    fail('SERVICE_ADDRESS', decoded);
  } else if (expectedPrefix && decoded.prefix !== expectedPrefix) {
    fail('SERVICE_ADDRESS', `prefix ${decoded.prefix} does not match ${network}`);
  } else {
    pass('SERVICE_ADDRESS', `valid ${decoded.prefix} CashAddress`);
    if (decoded.type !== 'p2pkhWithTokens' && decoded.type !== 'p2shWithTokens') {
      warn('SERVICE_ADDRESS', 'does not use token-aware address encoding');
    }
    const locking = cashAddressToLockingBytecode(serviceAddress);
    if (typeof locking !== 'string') serviceLockingHex = binToHex(locking.bytecode);
  }
}

const agentWif = (env.AGENT_WIF ?? '').trim();
let agentLockingHex = '';
if (!agentWif) {
  const message = 'AGENT_WIF is empty';
  if (enabled === 'true') fail(message);
  else warn(message);
} else {
  const decoded = decodePrivateKeyWif(agentWif);
  if (typeof decoded === 'string') {
    fail('AGENT_WIF', decoded);
  } else {
    const expectedWifType = network === 'mainnet' ? 'mainnet' : 'testnet';
    if (decoded.type !== expectedWifType) {
      fail('AGENT_WIF', `network ${decoded.type} does not match ${network}`);
    } else {
      const publicKey = secp256k1.derivePublicKeyCompressed(decoded.privateKey);
      const expectedAddress = (env.AGENT_ADDRESS ?? '').trim();
      if (expectedAddress) {
        const expectedDecoded = decodeCashAddress(expectedAddress);
        const expected = cashAddressToLockingBytecode(expectedAddress);
        const actual = publicKeyToP2pkhLockingBytecode({ publicKey });
        if (typeof expectedDecoded === 'string') {
          fail('AGENT_ADDRESS', expectedDecoded);
        } else if (expectedDecoded.type !== 'p2pkhWithTokens' && expectedDecoded.type !== 'p2shWithTokens') {
          warn('AGENT_ADDRESS', 'does not use token-aware address encoding');
        }
        if (typeof expected === 'string') {
          fail('AGENT_ADDRESS', expected);
        } else if (binToHex(expected.bytecode) !== binToHex(actual)) {
          fail('AGENT_ADDRESS', 'does not match the locking bytecode derived from AGENT_WIF');
        } else {
          agentLockingHex = binToHex(actual);
          pass('AGENT_WIF', `valid ${decoded.type} key; derived agent locking bytecode matches`);
        }
      } else {
        agentLockingHex = binToHex(publicKeyToP2pkhLockingBytecode({ publicKey }));
        pass('AGENT_WIF', `valid ${decoded.type} key`);
      }
    }
  }
}

for (const [name, value] of [
  ['AGENT_AMOUNT_PER_PERIOD', env.AGENT_AMOUNT_PER_PERIOD ?? '10'],
  ['AGENT_PERIOD_BLOCKS', env.AGENT_PERIOD_BLOCKS ?? '2'],
  ['AGENT_SERVICE_PRICE', env.AGENT_SERVICE_PRICE ?? '1'],
  ['AGENT_MAX_BALANCE', env.AGENT_MAX_BALANCE ?? '10'],
  ['AGENT_RATE_LIMIT', env.AGENT_RATE_LIMIT ?? '30'],
]) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) fail(name, 'must be a positive integer');
  else pass(name, String(parsed));
}

const category = (env.PUSD_CATEGORY ?? '2469acc5afa4b10cb5b5c04afb89c3a3ffd61c5da9c01e26d00951cae2a02544').trim();
if (!/^[0-9a-fA-F]{64}$/.test(category)) fail('PUSD_CATEGORY', 'must be 32 bytes of hex');
else pass('PUSD_CATEGORY', 'valid 32-byte category');

if (Number(env.AGENT_MAX_BALANCE ?? 10) < Number(env.AGENT_SERVICE_PRICE ?? 1)) {
  fail('AGENT_MAX_BALANCE', 'must be at least AGENT_SERVICE_PRICE');
}
if (Number(env.AGENT_SERVICE_PRICE ?? 1) > Number(env.AGENT_AMOUNT_PER_PERIOD ?? 10)) {
  fail('AGENT_SERVICE_PRICE', 'must not exceed AGENT_AMOUNT_PER_PERIOD');
}
if (serviceLockingHex && agentLockingHex && serviceLockingHex === agentLockingHex) {
  warn('SERVICE_ADDRESS', 'uses the same locking bytecode as the Agent hot wallet');
}

const storeUrl = (env.AGENT_STORE_URL ?? '').trim();
const storeToken = (env.AGENT_STORE_TOKEN ?? '').trim();
const requestTtl = Number(env.AGENT_REQUEST_TTL_SECONDS ?? '86400');
if (Boolean(storeUrl) !== Boolean(storeToken)) {
  fail('AGENT_STORE', 'AGENT_STORE_URL and AGENT_STORE_TOKEN must be configured together');
} else if (storeUrl) {
  pass('AGENT_STORE', 'Redis REST request store configured');
} else {
  warn('AGENT_STORE', 'using process-local memory; configure Redis REST before multi-instance production');
}
if (!Number.isInteger(requestTtl) || requestTtl <= 0) {
  fail('AGENT_REQUEST_TTL_SECONDS', 'must be a positive integer');
} else {
  pass('AGENT_REQUEST_TTL_SECONDS', String(requestTtl));
}

if (network === 'mainnet' && enabled === 'true') {
  warn('MAINNET_HOT_WALLET', 'enabled; confirm low balance, monitoring, and the KMS migration plan');
}

console.log('StreamVault wallet configuration check');
for (const line of [...passes, ...warnings, ...failures]) console.log(line);
console.log('');
if (failures.length > 0) {
  console.error(`${failures.length} configuration check(s) failed.`);
  process.exit(1);
}
console.log(`All required checks passed for ${network}.`);
