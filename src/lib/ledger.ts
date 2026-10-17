import type { LedgerEntry, NetworkType } from '../types';
import { explorerUrl } from './constants';

export interface LiveLedgerInput {
  type: LedgerEntry['type'];
  amount: number;
  remaining: number;
  txid: string;
  network: NetworkType;
  blockHeight?: number;
  source: 'wallet' | 'agent';
  confirmed?: boolean;
  actorAddress?: string;
  counterpartyAddress?: string;
  feeSats?: number;
}

export function makeLiveLedgerEntry({
  type,
  amount,
  remaining,
  txid,
  network,
  blockHeight = 0,
  source,
  confirmed = false,
  actorAddress,
  counterpartyAddress,
  feeSats = 0,
}: LiveLedgerInput): LedgerEntry {
  return {
    id: `${type}-${txid.slice(0, 8)}-${Math.random().toString(36).slice(2, 6)}`,
    txid,
    timestamp: Date.now(),
    type,
    amount,
    feeSats,
    remaining,
    actorAddress: actorAddress ?? (source === 'agent' ? 'agent hot wallet' : 'connected wallet'),
    counterpartyAddress:
      counterpartyAddress ?? (source === 'agent' ? 'service provider' : 'covenant vault'),
    blockHeight,
    simulated: false,
    network,
    confirmed,
    source,
    explorerUrl: explorerUrl(network, txid),
  };
}
