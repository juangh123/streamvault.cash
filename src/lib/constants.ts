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
 * Verified against the official ParyonUSD site and app on 2026-10-17.
 * See docs/PUSD_VERIFICATION.md before changing this value.
 */
export const PUSD_CATEGORY = '2469acc5afa4b10cb5b5c04afb89c3a3ffd61c5da9c01e26d00951cae2a02544';

/** Never use this category for a Mainnet settlement. Kept for defensive checks and old fixtures. */
export const DEMO_PUSD_CATEGORY = 'a'.repeat(64);

export const SITE_URL = 'https://streamvault-cash.vercel.app';
export const REPO_URL = 'https://github.com/juangh123/streamvault.cash';

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

export function isDemoCategory(category: string): boolean {
  return category.trim().toLowerCase() === DEMO_PUSD_CATEGORY;
}

export function assertMainnetCategory(network: NetworkType, category: string): void {
  if (network === 'mainnet' && isDemoCategory(category)) {
    throw new Error('Refusing Mainnet: the demo PUSD category is not valid for real funds.');
  }
}

export function randomTxid(): string {
  const chars = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 64; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
