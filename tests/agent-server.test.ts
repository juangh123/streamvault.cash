import { getAgentStatus, getServiceInsight, runAgent } from '../src/lib/agent-server';

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

console.log('==================================================================');
console.log('  StreamVault.cash - Agent API Guard Test Suite');
console.log('==================================================================\n');
for (const line of lines) console.log(line + '\n');
console.log('------------------------------------------------------------------');
console.log(`  ${passed} passed, ${failed} failed (of ${passed + failed})`);
console.log('------------------------------------------------------------------');
if (failed > 0) process.exit(1);
