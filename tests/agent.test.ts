import {
  AGENT_PER_PERIOD_BASE_UNITS,
  AGENT_SERVICE_PRICE_BASE_UNITS,
  AGENT_VAULT_BASE_UNITS,
  cancelAgentBudget,
  createAgentBudget,
  runAgentRequest,
} from '../src/lib/agent-sim';
import { MAINNET_EVIDENCE, isValidTxid, validEvidence } from '../src/lib/evidence';

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

const initial = createAgentBudget('chipnet');
check(
  initial.vaultRemaining === AGENT_VAULT_BASE_UNITS &&
    initial.agentBalance === 0 &&
    initial.block === initial.nextClaimBlock,
  'AGENT-00',
  'Agent budget starts funded with the first period available',
  `vault=${initial.vaultRemaining} agent=${initial.agentBalance} block=${initial.block}`,
);

const first = runAgentRequest(initial);
check(
  first.ok &&
    first.state.vaultRemaining === AGENT_VAULT_BASE_UNITS - AGENT_PER_PERIOD_BASE_UNITS &&
    first.state.agentBalance === AGENT_PER_PERIOD_BASE_UNITS - AGENT_SERVICE_PRICE_BASE_UNITS &&
    first.state.spent === AGENT_SERVICE_PRICE_BASE_UNITS &&
    first.entry?.type === 'PAYMENT' &&
    first.claimEntry?.type === 'CLAIM',
  'AGENT-01',
  'First request claims a tranche and pays the service',
  `vault=${first.state.vaultRemaining} agent=${first.state.agentBalance} spent=${first.state.spent}`,
);

let exhausted = first.state;
for (let i = 0; i < 9; i += 1) {
  const result = runAgentRequest(exhausted);
  if (!result.ok) break;
  exhausted = result.state;
}
const blocked = runAgentRequest(exhausted);
check(
  !blocked.ok &&
    blocked.code === 'BUDGET_EXHAUSTED' &&
    blocked.nextClaimBlock === exhausted.nextClaimBlock &&
    exhausted.spent === AGENT_PER_PERIOD_BASE_UNITS &&
    exhausted.agentBalance === 0,
  'AGENT-02',
  'The next request is rejected when the period budget is exhausted',
  `${blocked.code ?? 'accepted'} next=${blocked.nextClaimBlock} spent=${exhausted.spent}`,
);

const cancelled = cancelAgentBudget(exhausted);
check(
  cancelled.ok &&
    cancelled.state.vaultRemaining === 0 &&
    cancelled.state.cancelled &&
    cancelled.state.agentBalance === exhausted.agentBalance &&
    cancelled.entry?.type === 'CANCEL',
  'AGENT-03',
  'Payer cancel reclaims the vault and leaves the agent hot wallet alone',
  `vault=${cancelled.state.vaultRemaining} agent=${cancelled.state.agentBalance}`,
);

const cancelledRun = runAgentRequest(cancelled.state);
check(
  !cancelledRun.ok && cancelledRun.code === 'CANCELLED',
  'AGENT-04',
  'Cancelled vault rejects further agent requests',
  cancelledRun.code ?? 'accepted',
);

const evidenceTxids = MAINNET_EVIDENCE.map((item) => item.txid);
check(
  validEvidence().length === MAINNET_EVIDENCE.length &&
    new Set(evidenceTxids).size === evidenceTxids.length &&
    evidenceTxids.every(isValidTxid),
  'AGENT-05',
  'Recorded Mainnet evidence uses unique lowercase 64-hex txids',
  `${MAINNET_EVIDENCE.length} entr${MAINNET_EVIDENCE.length === 1 ? 'y' : 'ies'}`,
);

console.log('==================================================================');
console.log('  StreamVault.cash - Agent Sandbox Test Suite');
console.log('==================================================================\n');
for (const line of lines) console.log(line + '\n');
console.log('------------------------------------------------------------------');
console.log(`  ${passed} passed, ${failed} failed (of ${passed + failed})`);
console.log('------------------------------------------------------------------');
if (failed > 0) process.exit(1);
