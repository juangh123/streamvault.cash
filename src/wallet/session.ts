import type { WizardConnectState } from '@wizardconnect/react';
import {
  binToHex,
  lockingBytecodeToCashAddress,
  publicKeyToP2pkhCashAddress,
  publicKeyToP2pkhLockingBytecode,
} from '@bitauth/libauth';
import type { NetworkType } from '../types';

/** The subset of the useWizardConnect() result that account derivation reads. */
export interface SessionLike {
  state: WizardConnectState;
  manager: { getPubkey(childIndex: number, index: bigint): Uint8Array | undefined } | null;
  walletName: string | null;
  walletIcon: string | null;
  uri: string | null;
  qrUri: string | null;
  error: string | null;
}

export const PREFIX: Record<NetworkType, 'bitcoincash' | 'bchtest'> = {
  mainnet: 'bitcoincash',
  chipnet: 'bchtest',
};

export interface WalletAccount {
  state: WizardConnectState;
  connected: boolean;
  /** A paired wallet is temporarily offline (tab hidden, phone app in background, relay reconnect). */
  reconnecting: boolean;
  name: string | null;
  icon: string | null;
  address: string | null;
  tokenAddress: string | null;
  pubkey: string | null;
  uri: string | null;
  qrUri: string | null;
  error: string | null;
}

export function pubkeyAddress(publicKey: Uint8Array, network: NetworkType): string | null {
  try {
    const encoded = publicKeyToP2pkhCashAddress({ publicKey, prefix: PREFIX[network] }) as unknown;
    return typeof encoded === 'string'
      ? encoded
      : ((encoded as { address?: string }).address ?? null);
  } catch {
    return null;
  }
}

export function pubkeyTokenAddress(publicKey: Uint8Array, network: NetworkType): string | null {
  try {
    const encoded = lockingBytecodeToCashAddress({
      bytecode: publicKeyToP2pkhLockingBytecode({ publicKey }),
      prefix: PREFIX[network],
      tokenSupport: true,
    }) as unknown;
    return typeof encoded === 'string'
      ? encoded
      : ((encoded as { address?: string }).address ?? null);
  } catch {
    return null;
  }
}

export function accountFromSession(
  session: SessionLike,
  network: NetworkType,
): WalletAccount {
  // A paired session keeps its xpubs while the relay reconnects (hidden tab, wallet app in the
  // background). Keep it usable: sign requests are queued and re-sent on the next wallet_ready.
  const paired = session.state === 'connected' || session.state === 'reconnecting';
  const pubkey = paired && session.manager ? session.manager.getPubkey(0, 0n) ?? null : null;
  const address = pubkey ? pubkeyAddress(pubkey, network) : null;
  // After a page reload the hook restores the stored session without a QR code (uri stays null).
  const restoring = session.state === 'connecting' && Boolean(session.walletName) && !session.uri;
  return {
    state: session.state,
    connected: Boolean(pubkey && address),
    reconnecting: session.state === 'reconnecting' || restoring,
    name: session.walletName,
    icon: session.walletIcon,
    address,
    tokenAddress: pubkey ? pubkeyTokenAddress(pubkey, network) : null,
    pubkey: pubkey ? binToHex(pubkey) : null,
    uri: session.uri,
    qrUri: session.qrUri,
    error: session.error,
  };
}
