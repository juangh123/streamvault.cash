import { getAgentStatus, getServiceInsight, runAgent, statusErrorResponse } from '../src/lib/agent-server';
import { encodePrivateKeyWif, secp256k1, publicKeyToP2pkhCashAddress } from '@bitauth/libauth';
import { MemoryAgentRequestStore } from '../src/lib/agent-store';

const PAYER = '02' + '11'.repeat(32);
let passed = 0;
let failed = 0;
const lines: string[] = [];

function check(condition: boolean, id: string, name: string, detail: string) {
  if (condition) {
    passed += 1;
    lines.push(`[PASS] ${id}: ${name}\n       ${detail}`);
  } else {
    failed += 1;
    lines.push(`[FAIL] ${id}: ${name}\n       ${detail}`);
  }
}

process.env.AGENT_ENABLED = 'false';

const run = await runAgent(PAYER, 'test-request-001', '127.0.0.1');
check(
  !run.ok && run.code === 'AGENT_DISABLED',
  'API-00',
  'Run endpoint fails closed when AGENT_ENABLED is false',
  run.ok ? 'returned success' : `${run.code}: ${run.message}`,
);

let statusCode = '';
try {
  await getAgentStatus(PAYER);
} catch (e) {
  statusCode = (e as Error).message;
}
check(statusCode === 'AGENT_DISABLED', 'API-01', 'Status endpoint fails closed when disabled', statusCode || 'did not throw');

const insight = await getServiceInsight('test-request-001', '0'.repeat(64));
check(
  !insight.ok && insight.code === 'AGENT_DISABLED',
  'API-02',
  'Service verifier fails closed when disabled',
  insight.ok ? 'returned success' : `${insight.code}: ${insight.message}`,
);

const testPrivateKey = new Uint8Array(32).fill(1);
const testPublicKey = secp256k1.derivePublicKeyCompressed(testPrivateKey);
const testAddress = publicKeyToP2pkhCashAddress({
  publicKey: testPublicKey,
  prefix: 'bchtest',
}).address;
const mainnetTestAddress = publicKeyToP2pkhCashAddress({
  publicKey: testPublicKey,
  prefix: 'bitcoincash',
}).address;
const testnetWif = encodePrivateKeyWif(testPrivateKey, 'testnet');
const mainnetWif = encodePrivateKeyWif(testPrivateKey, 'mainnet');

async function expectStatusError(id: string, name: string, expected: string) {
  let message = '';
  try {
    await getAgentStatus(PAYER);
  } catch (e) {
    message = (e as Error).message;
  }
  check(message.includes(expected), id, name, message || 'did not throw');
}

process.env.AGENT_ENABLED = 'true';
process.env.AGENT_NETWORK = 'mainnet';
process.env.AGENT_WIF = testnetWif;
process.env.SERVICE_ADDRESS = mainnetTestAddress;
await expectStatusError(
  'API-03',
  'Rejects a testnet WIF when AGENT_NETWORK is mainnet',
  'AGENT_WIF network',
);

process.env.AGENT_WIF = mainnetWif;
process.env.SERVICE_ADDRESS = testAddress;
await expectStatusError(
  'API-04',
  'Rejects a testnet SERVICE_ADDRESS when AGENT_NETWORK is mainnet',
  'SERVICE_ADDRESS network',
);

process.env.AGENT_WIF = mainnetWif;
process.env.SERVICE_ADDRESS = mainnetTestAddress;
let badPubkeyResponse = { status: 0, body: { code: '', message: '' } };
try {
  await getAgentStatus('not-a-pubkey');
} catch (e) {
  badPubkeyResponse = statusErrorResponse(e);
}
check(
  badPubkeyResponse.status === 400 && badPubkeyResponse.body.code === 'INVALID_REQUEST',
  'API-07',
  'Status endpoint maps a malformed payerPubkey to 400 INVALID_REQUEST',
  `${badPubkeyResponse.status} ${badPubkeyResponse.body.code}: ${badPubkeyResponse.body.message}`,
);

const disabledResponse = statusErrorResponse(new Error('AGENT_DISABLED'));
const configResponse = statusErrorResponse(new Error('AGENT_WIF is not configured.'));
check(
  disabledResponse.status === 503 &&
    disabledResponse.body.code === 'AGENT_DISABLED' &&
    configResponse.status === 500 &&
    configResponse.body.code === 'SERVER_ERROR',
  'API-08',
  'Status errors keep 503 for disabled and 500 for server-side configuration faults',
  `disabled=${disabledResponse.status} config=${configResponse.status}`,
);

const badInsight = await getServiceInsight('x', '0'.repeat(64));
check(
  !badInsight.ok && badInsight.code === 'INVALID_REQUEST',
  'API-09',
  'Service verifier maps a malformed requestId to INVALID_REQUEST',
  badInsight.ok ? 'returned success' : `${badInsight.code}: ${badInsight.message}`,
);

const requestStore = new MemoryAgentRequestStore();
const firstRate = await requestStore.checkRateLimit('127.0.0.1', 2);
const secondRate = await requestStore.checkRateLimit('127.0.0.1', 2);
const thirdRate = await requestStore.checkRateLimit('127.0.0.1', 2);
check(
  firstRate && secondRate && !thirdRate,
  'API-05',
  'Memory Agent store enforces the per-minute limit',
  `requests=${Number(firstRate)}${Number(secondRate)}${Number(thirdRate)}`,
);

const firstClaim = await requestStore.claimRequestId('test-request-0001');
const duplicateClaim = await requestStore.claimRequestId('test-request-0001');
check(
  firstClaim && !duplicateClaim,
  'API-06',
  'Memory Agent store rejects a duplicate request id',
  `first=${firstClaim} duplicate=${duplicateClaim}`,
);

console.log('==================================================================');
console.log('  StreamVault.cash - Agent API Guard Test Suite');
console.log('==================================================================\n');
for (const line of lines) console.log(line + '\n');
console.log('------------------------------------------------------------------');
console.log(`  ${passed} passed, ${failed} failed (of ${passed + failed})`);
console.log('------------------------------------------------------------------');
if (failed > 0) process.exit(1);
