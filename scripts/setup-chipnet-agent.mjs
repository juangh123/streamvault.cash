/** Generate fresh server-only test keys after a real Chipnet token category is available. */
import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { encodePrivateKeyWif, secp256k1, publicKeyToP2pkhCashAddress } from '@bitauth/libauth';

const category = (process.argv.find(value => value.startsWith('--category='))?.slice(11) ?? '').trim().toLowerCase();
if (!/^[0-9a-f]{64}$/.test(category) || category === 'a'.repeat(64) ||
    category === '2469acc5afa4b10cb5b5c04afb89c3a3ffd61c5da9c01e26d00951cae2a02544') {
  throw new Error('Supply an issued Chipnet test token category with --category=<64 hex>. Mainnet PUSD and placeholders are refused.');
}
const path = '.env.chipnet.local';
if (existsSync(path)) throw new Error('Existing Chipnet configuration preserved. Review it rather than overwriting test keys.');
function key() {
  const privateKey = randomBytes(32);
  const publicKey = secp256k1.derivePublicKeyCompressed(privateKey);
  if (typeof publicKey === 'string') throw new Error('Could not generate test key. Retry.');
  return { wif: encodePrivateKeyWif(privateKey, 'testnet'), address: publicKeyToP2pkhCashAddress({ publicKey, prefix: 'bchtest' }).address };
}
const agent = key();
const service = key();
writeFileSync(path, [
  '# Chipnet only. Never commit, publish, or fund these keys on Mainnet.',
  'AGENT_NETWORK=chipnet', 'AGENT_ENABLED=true', `PUSD_CATEGORY=${category}`,
  `AGENT_WIF=${agent.wif}`, `SERVICE_ADDRESS=${service.address}`, `SERVICE_WIF=${service.wif}`,
  'AGENT_AMOUNT_PER_PERIOD=10', 'AGENT_PERIOD_BLOCKS=2', 'AGENT_SERVICE_PRICE=1',
  'AGENT_MAX_BALANCE=10', 'AGENT_RATE_LIMIT=30',
  'AGENT_STORE_URL=', 'AGENT_STORE_TOKEN=', '',
].join('\n'), { flag: 'wx', mode: 0o600 });
console.log(JSON.stringify({ network: 'chipnet', category, agentAddress: agent.address,
  serviceAddress: service.address, configFile: path, next: 'Fund the agent with Chipnet test BCH only, then restart npm run dev:chipnet.' }, null, 2));
