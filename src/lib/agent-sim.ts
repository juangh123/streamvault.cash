import type { LedgerEntry, NetworkType } from '../types';
import { randomTxid } from './constants';

export const AGENT_VAULT_BASE_UNITS = 200; // 2.00 PUSD
export const AGENT_PER_PERIOD_BASE_UNITS = 10; // 0.10 PUSD
export const AGENT_SERVICE_PRICE_BASE_UNITS = 1; // 0.01 PUSD
export const AGENT_PERIOD_BLOCKS = 2;
export const AGENT_START_BLOCK = 850000;

export interface AgentSimState {
  vaultRemaining: number;
  agentBalance: number;
  spent: number;
  claimsCount: number;
  callsCount: number;
  amountPerPeriod: number;
  servicePrice: number;
  periodBlocks: number;
  block: number;
  nextClaimBlock: number;
  ledger: LedgerEntry[];
  lastClaimTxid: string | null;
  lastPaymentTxid: string | null;
  cancelled: boolean;
}

export interface AgentSimResult {
  ok: boolean;
  code?: 'BUDGET_EXHAUSTED' | 'INSUFFICIENT_AGENT_BALANCE' | 'CANCELLED';
  message: string;
  nextClaimBlock?: number;
  state: AgentSimState;
  entry?: LedgerEntry;
  claimEntry?: LedgerEntry;
}

function entry(
  type: LedgerEntry['type'],
  amount: number,
  remaining: number,
  block: number,
  actorAddress: string,
  counterpartyAddress: string,
  network: NetworkType,
): LedgerEntry {
  return {
    id: Math.random().toString(36).slice(2, 9),
    txid: randomTxid(),
    timestamp: Date.now(),
    type,
    amount,
    feeSats: type === 'CLAIM' ? 320 : 280,
    remaining,
    actorAddress,
    counterpartyAddress,
    blockHeight: block,
    simulated: true,
    network,
    confirmed: false,
    source: 'sandbox',
    explorerUrl: '',
  };
}

export function createAgentBudget(network: NetworkType = 'chipnet'): AgentSimState {
  const block = AGENT_START_BLOCK + AGENT_PERIOD_BLOCKS;
  const fund = entry(
    'FUND',
    AGENT_VAULT_BASE_UNITS,
    AGENT_VAULT_BASE_UNITS,
    AGENT_START_BLOCK,
    'demo-payer',
    'demo-agent-vault',
    network,
  );
  return {
    vaultRemaining: AGENT_VAULT_BASE_UNITS,
    agentBalance: 0,
    spent: 0,
    claimsCount: 0,
    callsCount: 0,
    amountPerPeriod: AGENT_PER_PERIOD_BASE_UNITS,
    servicePrice: AGENT_SERVICE_PRICE_BASE_UNITS,
    periodBlocks: AGENT_PERIOD_BLOCKS,
    block,
    nextClaimBlock: block,
    ledger: [fund],
    lastClaimTxid: null,
    lastPaymentTxid: null,
    cancelled: false,
  };
}

export function runAgentRequest(state: AgentSimState): AgentSimResult {
  if (state.cancelled) {
    return { ok: false, code: 'CANCELLED', message: 'The payer cancelled this vault.', state };
  }
  let next: AgentSimState = { ...state, ledger: [...state.ledger] };
  let claimEntry: LedgerEntry | undefined;

  if (next.agentBalance < next.servicePrice) {
    if (next.block < next.nextClaimBlock) {
      return {
        ok: false,
        code: 'BUDGET_EXHAUSTED',
        message: "This period's budget is used up. The next tranche is not available yet.",
        nextClaimBlock: next.nextClaimBlock,
        state: next,
      };
    }
    if (next.vaultRemaining <= next.amountPerPeriod) {
      return {
        ok: false,
        code: 'INSUFFICIENT_AGENT_BALANCE',
        message: 'The vault cannot release another full tranche. Cancel to reclaim the remainder.',
        state: next,
      };
    }
    next.vaultRemaining -= next.amountPerPeriod;
    next.agentBalance += next.amountPerPeriod;
    next.claimsCount += 1;
    next.nextClaimBlock = next.block + next.periodBlocks;
    claimEntry = entry(
      'CLAIM',
      next.amountPerPeriod,
      next.vaultRemaining,
      next.block,
      'demo-agent',
      'demo-agent-vault',
      state.ledger[0]?.network ?? 'chipnet',
    );
    next.ledger = [claimEntry, ...next.ledger];
    next.lastClaimTxid = claimEntry.txid;
  }

  next.agentBalance -= next.servicePrice;
  next.spent += next.servicePrice;
  next.callsCount += 1;
  const payment = entry(
    'PAYMENT',
    next.servicePrice,
    next.agentBalance,
    next.block,
    'demo-agent',
    'demo-service',
    state.ledger[0]?.network ?? 'chipnet',
  );
  next.ledger = [payment, ...next.ledger];
  next.lastPaymentTxid = payment.txid;

  return {
    ok: true,
    message: 'Service verified. Insight returned.',
    state: next,
    entry: payment,
    claimEntry,
  };
}

export function cancelAgentBudget(state: AgentSimState): AgentSimResult {
  const remaining = state.vaultRemaining;
  const cancel = entry(
    'CANCEL',
    remaining,
    0,
    state.block,
    'demo-payer',
    'demo-agent-vault',
    state.ledger[0]?.network ?? 'chipnet',
  );
  return {
    ok: true,
    message: `Payer reclaimed ${(remaining / 100).toFixed(2)} PUSD from the vault.`,
    state: {
      ...state,
      vaultRemaining: 0,
      cancelled: true,
      ledger: [cancel, ...state.ledger],
    },
    entry: cancel,
  };
}
