import type { LedgerEntry, StreamConfig } from '../types';
import { randomTxid } from './constants';

export interface CreateStreamInput {
  label: string;
  payerAddress: string;
  payeeAddress: string;
  amountPerPeriod: number;
  periodBlocks: number;
  deposit: number;
  category: string;
  vaultAddress: string;
  contractBytecode: string;
  block: number;
}

export interface ActionOutcome {
  ok: boolean;
  error?: string;
  stream: StreamConfig;
  entry?: LedgerEntry;
}

/**
 * Sandbox stream engine.
 *
 * This mirrors the StreamVault covenant's invariants exactly so the offline (no wallet) judge
 * walkthrough behaves like the on-chain contract:
 *   - amountPerPeriod ceiling
 *   - relative period (`clockBlock` + periodBlocks) enforced via the vault clock
 *   - token conservation: the vault keeps a positive balance (claims cannot drain it)
 *   - payer cancel sweeps 100% of the remaining PUSD
 *
 * Card amounts are PUSD base units (cents).
 */
export function createStream(input: CreateStreamInput): StreamConfig {
  return {
    id: Math.random().toString(36).slice(2, 9),
    label: input.label,
    payerAddress: input.payerAddress,
    payeeAddress: input.payeeAddress,
    amountPerPeriod: input.amountPerPeriod,
    periodBlocks: input.periodBlocks,
    deposited: input.deposit,
    remaining: input.deposit,
    claimed: 0,
    claimsCount: 0,
    clockBlock: input.block,
    vaultAddress: input.vaultAddress,
    contractBytecode: input.contractBytecode,
    category: input.category,
  };
}

export function nextClaimBlock(stream: StreamConfig): number {
  return stream.clockBlock + stream.periodBlocks;
}

export function blocksUntilClaim(stream: StreamConfig, currentBlock: number): number {
  return Math.max(0, nextClaimBlock(stream) - currentBlock);
}

function makeEntry(
  type: LedgerEntry['type'],
  amount: number,
  remaining: number,
  stream: StreamConfig,
  actorAddress: string,
  counterpartyAddress: string,
  blockHeight: number,
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
    blockHeight,
    simulated: true,
    explorerUrl: '',
  };
}

/** Payee claims a tranche. Replays every covenant `require` in the same order. */
export function claim(stream: StreamConfig, amount: number, currentBlock: number): ActionOutcome {
  if (amount <= 0) {
    return { ok: false, error: 'Claim amount must be greater than zero.', stream };
  }
  if (amount > stream.amountPerPeriod) {
    return {
      ok: false,
      error: `VM rejection: amount (${amount}) exceeds amountPerPeriod (${stream.amountPerPeriod}).`,
      stream,
    };
  }
  const elapsed = currentBlock - stream.clockBlock;
  if (elapsed < stream.periodBlocks) {
    const wait = stream.periodBlocks - elapsed;
    return {
      ok: false,
      error: `VM rejection: relative period not elapsed (${elapsed}/${stream.periodBlocks} blocks). Wait ${wait} more block(s).`,
      stream,
    };
  }
  if (amount > stream.remaining) {
    return { ok: false, error: 'Insufficient vault balance for this tranche.', stream };
  }
  if (stream.remaining - amount <= 0) {
    return {
      ok: false,
      error: 'VM rejection: the covenant keeps the stream alive - claims cannot drain the vault (use Cancel to reclaim).',
      stream,
    };
  }

  const updated: StreamConfig = {
    ...stream,
    remaining: stream.remaining - amount,
    claimed: stream.claimed + amount,
    claimsCount: stream.claimsCount + 1,
    clockBlock: currentBlock,
  };
  const entry = makeEntry('CLAIM', amount, updated.remaining, stream, stream.payeeAddress, stream.vaultAddress, currentBlock);
  return { ok: true, stream: updated, entry };
}

/** Payer cancels the stream and reclaims 100% of the remaining PUSD. */
export function cancel(stream: StreamConfig, currentBlock: number): ActionOutcome {
  if (stream.remaining <= 0) {
    return { ok: false, error: 'Stream already empty - nothing to reclaim.', stream };
  }
  const swept = stream.remaining;
  const updated: StreamConfig = { ...stream, remaining: 0, clockBlock: currentBlock };
  const entry = makeEntry('CANCEL', swept, 0, stream, stream.payerAddress, stream.vaultAddress, currentBlock);
  return { ok: true, stream: updated, entry };
}

/** Payer tops up the stream with more PUSD (creates a fresh vault UTXO, resetting the clock). */
export function topUp(stream: StreamConfig, amount: number, currentBlock: number): ActionOutcome {
  if (amount <= 0) return { ok: false, error: 'Top-up amount must be greater than zero.', stream };
  const updated: StreamConfig = {
    ...stream,
    deposited: stream.deposited + amount,
    remaining: stream.remaining + amount,
    clockBlock: currentBlock,
  };
  const entry = makeEntry('FUND', amount, updated.remaining, stream, stream.payerAddress, stream.vaultAddress, currentBlock);
  return { ok: true, stream: updated, entry };
}