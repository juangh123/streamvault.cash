import assert from 'node:assert/strict';
import { PUSD_CATEGORY, liveTokenCategory, assertAgentNetwork } from '../src/lib/constants';

const chipnetCategory = 'bc'.repeat(32);
assert.equal(liveTokenCategory('mainnet', chipnetCategory), PUSD_CATEGORY);
assert.equal(liveTokenCategory('chipnet', chipnetCategory.toUpperCase()), chipnetCategory);
for (const category of ['', 'xyz', PUSD_CATEGORY, 'a'.repeat(64)]) {
  assert.throws(() => liveTokenCategory('chipnet', category), /Chipnet/);
}
assert.doesNotThrow(() => assertAgentNetwork('chipnet', 'chipnet'));
assert.throws(() => assertAgentNetwork('chipnet', 'mainnet'), /network mismatch/);
assert.throws(() => assertAgentNetwork('mainnet', undefined), /network mismatch/);
console.log('[PASS] Network configuration: Mainnet category pinned; Chipnet requires a real test category; Agent mismatch rejected.');
