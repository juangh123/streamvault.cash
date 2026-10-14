export interface VaultConfig {
  ownerAddress: string;
  agentPubKey: string;
  maxPerTxSats: number;
  balanceSats: number;
  vaultAddress: string;
  contractBytecode: string;
  totalSpentSats: number;
  totalTxs: number;
}

export interface AgentService {
  id: string;
  name: string;
  category: 'LLM Compute' | 'Oracle' | 'Image Gen' | 'Web Proxy';
  costSats: number;
  providerAddress: string;
  providerBytecode: string;
  description: string;
  endpoint: string;
}

export interface TxRecord {
  txid: string;
  timestamp: number;
  type: 'DEPOSIT' | 'SPEND' | 'RECLAIM';
  amountSats: number;
  feeSats: number;
  changeSats: number;
  serviceName?: string;
  senderAddress: string;
  recipientAddress: string;
  status: 'confirmed' | 'simulated';
  covenantVerified: boolean;
  explorerUrl: string;
}

export interface AgentLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  txid?: string;
  sats?: number;
}

export type NetworkType = 'chipnet' | 'mainnet' | 'sandbox';
export type AppMode = 'SANDBOX' | 'LIVE';
