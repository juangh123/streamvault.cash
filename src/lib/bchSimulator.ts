import { AgentService, TxRecord, VaultConfig } from '../types';

export const BCH_USD_PRICE = 320.0; // Current estimated BCH price for sub-cent math

export function satsToBch(sats: number): string {
  return (sats / 100_000_000).toFixed(8);
}

export function satsToUsd(sats: number): string {
  const usd = (sats / 100_000_000) * BCH_USD_PRICE;
  if (usd < 0.01) {
    return `$${usd.toFixed(4)}`;
  }
  return `$${usd.toFixed(2)}`;
}

export const PRESET_SERVICES: AgentService[] = [
  {
    id: 'deepseek-tokens',
    name: 'DeepSeek / OpenAI Token API',
    category: 'LLM Compute',
    costSats: 800, // ~$0.0025
    providerAddress: 'bitcoincash:qp9g5n5a782x4z6e7d8c3y1v0w2u4t6r8q0s9a8b7c',
    providerBytecode: 'a9148d9435b6f3c1d948261947b6a482b1c4e78194ad87',
    description: 'Pay-per-request API token streaming for autonomous LLM inference',
    endpoint: 'https://api.deepseek.com/v1/chat/completions'
  },
  {
    id: 'weather-oracle',
    name: 'Global Decentralized Weather Oracle',
    category: 'Oracle',
    costSats: 300, // ~$0.0009
    providerAddress: 'bitcoincash:qr8k4m3j2h1g0f9e8d7c6b5a4z3y2x1w0v9u8t7s6r',
    providerBytecode: 'a91448291a7c5b6e8d9f0123456789abcdef0123456787',
    description: 'Real-time verified barometric and temperature feed for logistics agent',
    endpoint: 'https://oracle.bch.cash/weather/v2/current'
  },
  {
    id: 'sdxl-flux-render',
    name: 'FLUX.1 / SDXL High-Res Inference',
    category: 'Image Gen',
    costSats: 1500, // ~$0.0048
    providerAddress: 'bitcoincash:qz7y6x5w4v3u2t1s0r9q8p7o6n5m4l3k2j1i0h9g8f',
    providerBytecode: 'a914c1d2e3f405162738495a6b7c8d9e0f1a2b3c4d5e87',
    description: 'Autonomous thumbnail and visual asset generation for marketing bots',
    endpoint: 'https://compute.flux.ai/generate'
  },
  {
    id: 'scraper-proxy',
    name: 'Resilient Web Scraper & Proxy Network',
    category: 'Web Proxy',
    costSats: 500, // ~$0.0016
    providerAddress: 'bitcoincash:qq5r6t7y8u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v',
    providerBytecode: 'a9149876543210fedcba9876543210fedcba9876543287',
    description: 'Clean residential IP proxy for automated research and data gathering',
    endpoint: 'https://proxy.agentpay.cash/fetch'
  }
];

export function generateInitialVault(): VaultConfig {
  return {
    ownerAddress: 'bitcoincash:qp0xowner8923748923749823749283749823749823',
    agentPubKey: '03c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5',
    maxPerTxSats: 1000, // 1000 sats ceiling
    balanceSats: 100000, // 100,000 sats (~0.001 BCH / $0.32)
    vaultAddress: 'bitcoincash:prv4u1tg4m3h0st6n4c8v2b1a9z7y5x3w1q8p0o9n8',
    contractBytecode: '04e8030000cd52796b75877c517900877c777c51797c527988',
    totalSpentSats: 0,
    totalTxs: 0
  };
}

export function generateRandomTxId(): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export interface SpendExecutionResult {
  success: boolean;
  txRecord?: TxRecord;
  error?: string;
  vmTrace?: {
    agentSigChecked: boolean;
    maxLimitChecked: boolean;
    dustChecked: boolean;
    covenantMatched: boolean;
    inputLockingBytecode: string;
    outputChangeBytecode: string;
    expectedChange: number;
    minerFee: number;
  };
}

export function executeSpendSimulation(
  vault: VaultConfig,
  service: AgentService,
  forcedAmount?: number
): SpendExecutionResult {
  const amount = forcedAmount ?? service.costSats;
  const minerFee = 380; // Standard ~380 satoshis for BCH multisig/covenant tx

  // 1. Check dust limit
  if (amount < 546) {
    return {
      success: false,
      error: `Execution Failed: Amount (${amount} sats) violates Bitcoin Cash dust threshold (minimum 546 satoshis).`
    };
  }

  // 2. Check maxPerTx policy hard ceiling
  if (amount > vault.maxPerTxSats) {
    return {
      success: false,
      error: `VM Rejection: Spend amount (${amount} sats) exceeds owner-configured maxPerTx ceiling (${vault.maxPerTxSats} sats).`
    };
  }

  // 3. Check balance
  const required = amount + minerFee;
  if (vault.balanceSats < required) {
    return {
      success: false,
      error: `Insufficient Funds: Vault balance (${vault.balanceSats} sats) is lower than amount + miner fee (${required} sats).`
    };
  }

  const change = vault.balanceSats - amount - minerFee;
  const txid = generateRandomTxId();

  const txRecord: TxRecord = {
    txid,
    timestamp: Date.now(),
    type: 'SPEND',
    amountSats: amount,
    feeSats: minerFee,
    changeSats: change,
    serviceName: service.name,
    senderAddress: vault.vaultAddress,
    recipientAddress: service.providerAddress,
    status: 'confirmed',
    covenantVerified: true,
    explorerUrl: `https://blockchair.com/bitcoin-cash/transaction/${txid}`
  };

  return {
    success: true,
    txRecord,
    vmTrace: {
      agentSigChecked: true,
      maxLimitChecked: true,
      dustChecked: true,
      covenantMatched: true,
      inputLockingBytecode: vault.contractBytecode,
      outputChangeBytecode: vault.contractBytecode,
      expectedChange: change,
      minerFee
    }
  };
}

export function executeEmergencyReclaim(vault: VaultConfig): { txRecord: TxRecord; reclaimedSats: number } {
  const minerFee = 250;
  const reclaimedSats = Math.max(0, vault.balanceSats - minerFee);
  const txid = generateRandomTxId();

  const txRecord: TxRecord = {
    txid,
    timestamp: Date.now(),
    type: 'RECLAIM',
    amountSats: reclaimedSats,
    feeSats: minerFee,
    changeSats: 0,
    serviceName: 'Sovereign Emergency Sweep (Clawback)',
    senderAddress: vault.vaultAddress,
    recipientAddress: vault.ownerAddress,
    status: 'confirmed',
    covenantVerified: true,
    explorerUrl: `https://blockchair.com/bitcoin-cash/transaction/${txid}`
  };

  return { txRecord, reclaimedSats };
}
