import type { NetworkType } from '../types';

/**
 * Pure, dependency-free constants and helpers.
 * Kept separate from `covenant.ts` (which imports the compiled JSON artifact) so that the sandbox
 * engine and formatting helpers stay importable in a plain Node/ts-strip test environment.
 */

/** PUSD is a USD-pegged stablecoin; we display it with 2 decimals (cents). */
export const PUSD_DECIMALS = 2;

/** Used only for BCH<->USD display; not part of any settlement logic. */
export const BCH_USD_PRICE = 320;

/**
 * ParyonUSD (PUSD) CashTokens category id.
 * Set this to the live ParyonUSD category id before a Mainnet settlement. The default is a
 * clearly-labelled demo category used by the sandbox and the Chipnet walkthrough.
 */
export const PUSD_CATEGORY = 'a'.repeat(64);

/** Default relative period: 144 BCH blocks (~1 day). */
export const DEFAULT_PERIOD_BLOCKS = 144;

/** Synthetic block height the sandbox clock starts from. */
export const SANDBOX_START_BLOCK = 850000;

const EXPLORER_BASE: Record<NetworkType, string> = {
  mainnet: 'https://3xpl.com/bitcoin-cash/transaction/',
  chipnet: 'https://chipnet.chaingraph.cash/explorer/tx/',
};

export function explorerUrl(network: NetworkType, txid: string): string {
  return EXPLORER_BASE[network] + txid;
}

export function randomTxid(): string {
  const chars = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 64; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}