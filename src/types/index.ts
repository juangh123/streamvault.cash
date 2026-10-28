export type AppMode = 'SANDBOX' | 'LIVE';
export type AppView = 'AGENT' | 'PAYROLL';
export type NetworkType = 'chipnet' | 'mainnet';

/** A single PUSD stream (payroll / subscription) locked in the covenant. */
export interface StreamConfig {
  id: string;
  label: string;
  network: NetworkType;
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
  type: 'FUND' | 'CLAIM' | 'CANCEL' | 'PAYMENT';
  /** PUSD base units moved by this event. */
  amount: number;
  feeSats: number;
  remaining: number;
  actorAddress: string;
  counterpartyAddress: string;
  blockHeight: number;
  simulated: boolean;
  network: NetworkType;
  confirmed: boolean;
  source: 'sandbox' | 'wallet' | 'agent';
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
  payerConnected: boolean;
  payeeConnected: boolean;
  name: string | null;
  icon: string | null;
  address: string | null;
  payerAddress: string | null;
  payeeAddress: string | null;
  payerPubkey: string | null;
  payeePubkey: string | null;
  network: NetworkType;
}

export type AgentErrorCode =
  | 'AGENT_DISABLED'
  | 'RATE_LIMITED'
  | 'NO_VAULT'
  | 'MULTIPLE_VAULT_UTXOS'
  | 'PERIOD_NOT_ELAPSED'
  | 'BUDGET_EXHAUSTED'
  | 'INSUFFICIENT_AGENT_BALANCE'
  | 'AGENT_BALANCE_TOO_HIGH'
  | 'PAYMENT_NOT_FOUND'
  | 'WRONG_AMOUNT'
  | 'WRONG_DESTINATION'
  | 'WRONG_CATEGORY'
  | 'REQUEST_ID_MISMATCH'
  | 'DUPLICATE_REQUEST'
  | 'PAYMENT_FAILED'
  | 'INVALID_REQUEST'
  | 'SERVER_ERROR';

export interface AgentVaultState {
  address: string;
  tokenAmount: number;
  bchSatoshis: number;
  periodBlocks: number;
  amountPerPeriod: number;
  nextClaimBlock: number | null;
}

export interface AgentWalletState {
  address: string;
  tokenAmount: number;
  bchSatoshis: number;
}

export interface AgentStatus {
  enabled: boolean;
  network: NetworkType;
  agentPubkey: string;
  category: string;
  servicePrice: number;
  vault: AgentVaultState;
  agent: AgentWalletState;
}

export interface AgentRunSuccess {
  ok: true;
  requestId: string;
  claimTxid: string | null;
  paymentTxid: string;
  confirmed: boolean;
  service: {
    blockHeight: number;
    feeSats: number;
    message: string;
  };
  vault: AgentVaultState;
  agent: AgentWalletState;
}

export interface AgentRunFailure {
  ok: false;
  code: AgentErrorCode;
  message: string;
  lastTxid?: string;
  nextClaimBlock?: number;
}

export type AgentRunResponse = AgentRunSuccess | AgentRunFailure;

export interface ServiceVerification {
  requestId: string;
  txid: string;
  amount: number;
  category: string;
  destination: string;
  confirmed: boolean;
}
