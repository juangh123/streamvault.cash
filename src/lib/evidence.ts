import { explorerUrl } from './constants';

export interface MainnetEvidenceItem {
  /** Short label shown to judges, e.g. "Fund", "Agent claim", "Agent pays 0.01 PUSD", "Cancel". */
  label: string;
  /** 64-character transaction id in explorer (big-endian) order. */
  txid: string;
}

/**
 * Confirmed BCH Mainnet transactions produced by StreamVault.cash during BCH BLAZE 2026.
 *
 * Add an entry only after the transaction has at least one confirmation. Never add Chipnet,
 * Sandbox or placeholder txids: the app shows this list to judges as on-chain evidence, and the
 * banner stays hidden while the list is empty.
 */
export const MAINNET_EVIDENCE: MainnetEvidenceItem[] = [];

const TXID_PATTERN = /^[0-9a-f]{64}$/;

export function isValidTxid(txid: string): boolean {
  return TXID_PATTERN.test(txid);
}

export function validEvidence(items: MainnetEvidenceItem[] = MAINNET_EVIDENCE): MainnetEvidenceItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.label.trim() || !isValidTxid(item.txid) || seen.has(item.txid)) return false;
    seen.add(item.txid);
    return true;
  });
}

export function evidenceUrl(txid: string): string {
  return explorerUrl('mainnet', txid);
}
