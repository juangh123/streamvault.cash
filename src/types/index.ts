export type AppMode = 'SANDBOX' | 'LIVE';
export type NetworkType = 'chipnet' | 'mainnet';

/** A single PUSD stream (payroll / subscription) locked in the covenant. */
export interface StreamConfig {
  id: string;
  label: string;
  payerAddress: string;
  payeeAddress: string;
  /** Max PUSD base units (cents) claimable per period. */
  amountPerPeriod: number;
  /** Relative period in blocks (BIP68 block-based). */
  periodBlocks: number;
  /** Total PUSD base units funded into the vault. */
  deposited: number;
  /** PUSD base units still locked in the covenant. */
  remaining: number;
  /** PUSD base units already streamed to the payee. */
  claimed: number;
  claimsCount: number;
  /** Block height when the current vault UTXO was created (clock origin). */
  clockBlock: number;
  vaultAddress: string;
  contractBytecode: string;
  category: string;
}

export interface LedgerEntry {
  id: string;
  txid: string;
  timestamp: number;
  type: 'FUND' | 'CLAIM' | 'CANCEL';
  /** PUSD base units moved by this event. */
  amount: number;
  feeSats: number;
  remaining: number;
  actorAddress: string;
  counterpartyAddress: string;
  blockHeight: number;
  simulated: boolean;
  explorerUrl: string;
}

export interface LogEntry {
  id: string;
  time: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export interface WalletState {
  connected: boolean;
  name: string | null;
  icon: string | null;
  address: string | null;
}