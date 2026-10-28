import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import { useWizardConnect } from '@wizardconnect/react';
import type { WizardConnectState } from '@wizardconnect/react';
import { binToHex, publicKeyToP2pkhCashAddress } from '@bitauth/libauth';
import type { WcTransactionObject } from 'cashscript';
import type { NetworkType, WalletState } from '../types';
import { broadcastSigned, makeProvider, serializeWcTransaction, type InputPath } from '../lib/chain';

const PREFIX: Record<NetworkType, 'bitcoincash' | 'bchtest'> = {
  mainnet: 'bitcoincash',
  chipnet: 'bchtest',
};

export type WalletRole = 'payer' | 'payee';

export interface WalletAccount {
  state: WizardConnectState;
  connected: boolean;
  name: string | null;
  icon: string | null;
  address: string | null;
  pubkey: string | null;
  uri: string | null;
  qrUri: string | null;
  error: string | null;
}

function pubkeyAddress(publicKey: Uint8Array, network: NetworkType): string | null {
  try {
    const encoded = publicKeyToP2pkhCashAddress({ publicKey, prefix: PREFIX[network] }) as unknown;
    return typeof encoded === 'string'
      ? encoded
      : ((encoded as { address?: string }).address ?? null);
  } catch {
    return null;
  }
}

function accountFromSession(
  session: ReturnType<typeof useWizardConnect>,
  network: NetworkType,
): WalletAccount {
  const pubkey =
    session.state === 'connected' && session.manager ? session.manager.getPubkey(0, 0n) : null;
  const address = pubkey ? pubkeyAddress(pubkey, network) : null;
  return {
    state: session.state,
    connected: Boolean(pubkey && address),
    name: session.walletName,
    icon: session.walletIcon,
    address,
    pubkey: pubkey ? binToHex(pubkey) : null,
    uri: session.uri,
    qrUri: session.qrUri,
    error: session.error,
  };
}

export interface SignedTransactionResult {
  txid: string;
  signedTransaction: string;
}

export interface WalletContextValue {
  accounts: Record<WalletRole, WalletAccount>;
  wallet: WalletState;
  connect: (role?: WalletRole) => boolean;
  disconnect: (role?: WalletRole) => Promise<void>;
  signAndBroadcast: (
    role: WalletRole,
    object: WcTransactionObject,
    inputPaths: InputPath[],
    userPrompt?: string,
  ) => Promise<SignedTransactionResult>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export const WalletProvider: React.FC<{ network: NetworkType; children: React.ReactNode }> = ({
  network,
  children,
}) => {
  const payerSession = useWizardConnect({
    dappName: 'StreamVault.cash payer',
    persistSession: true,
    sessionKey: `wizardconnect-payer-${network}`,
  });
  const payeeSession = useWizardConnect({
    dappName: 'StreamVault.cash payee',
    persistSession: true,
    sessionKey: `wizardconnect-payee-${network}`,
  });
  const signingRef = useRef<Record<WalletRole, boolean>>({ payer: false, payee: false });

  const payer = useMemo(
    () => accountFromSession(payerSession, network),
    [
      payerSession.state,
      payerSession.manager,
      payerSession.walletName,
      payerSession.walletIcon,
      payerSession.uri,
      payerSession.qrUri,
      payerSession.error,
      network,
    ],
  );
  const payee = useMemo(
    () => accountFromSession(payeeSession, network),
    [
      payeeSession.state,
      payeeSession.manager,
      payeeSession.walletName,
      payeeSession.walletIcon,
      payeeSession.uri,
      payeeSession.qrUri,
      payeeSession.error,
      network,
    ],
  );
  const accounts = useMemo<Record<WalletRole, WalletAccount>>(
    () => ({ payer, payee }),
    [payer, payee],
  );
  const wallet = useMemo<WalletState>(
    () => ({
      connected: payer.connected || payee.connected,
      payerConnected: payer.connected,
      payeeConnected: payee.connected,
      name: payer.name ?? payee.name,
      icon: payer.icon ?? payee.icon,
      address: payer.address ?? payee.address,
      payerAddress: payer.address,
      payeeAddress: payee.address,
      payerPubkey: payer.pubkey,
      payeePubkey: payee.pubkey,
      network,
    }),
    [payer, payee, network],
  );

  const connect = useCallback(
    (role: WalletRole = 'payer') => {
      const session = role === 'payer' ? payerSession : payeeSession;
      if (session.state === 'connected') return true;
      return session.connect();
    },
    [payerSession.state, payerSession.connect, payeeSession.state, payeeSession.connect],
  );

  const disconnect = useCallback(
    async (role: WalletRole = 'payer') => {
      await (role === 'payer' ? payerSession.disconnect() : payeeSession.disconnect());
    },
    [payerSession.disconnect, payeeSession.disconnect],
  );

  const signAndBroadcast = useCallback(
    async (
      role: WalletRole,
      object: WcTransactionObject,
      inputPaths: InputPath[],
      userPrompt?: string,
    ) => {
      const session = role === 'payer' ? payerSession : payeeSession;
      const account = role === 'payer' ? payer : payee;
      const manager = session.manager;
      if (!manager || session.state !== 'connected' || !account.connected) {
        throw new Error(`Connect the ${role} wallet before signing.`);
      }
      if (signingRef.current[role]) {
        throw new Error(`A ${role} wallet signature request is already pending.`);
      }
      signingRef.current[role] = true;
      try {
        const txHex = serializeWcTransaction(object);
        const request = {
          transaction: {
            transaction: txHex,
            sourceOutputs: object.sourceOutputs,
            broadcast: false,
            userPrompt: userPrompt ?? `StreamVault ${role} transaction`,
          },
          inputPaths,
        } as Parameters<typeof manager.signTransaction>[0];
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 120_000);
        let response;
        try {
          response = await manager.signTransaction(request, { signal: controller.signal });
        } finally {
          clearTimeout(timer);
        }
        if (response.error || !response.signedTransaction) {
          throw new Error(response.error || `The ${role} wallet did not return a signed transaction.`);
        }
        const txid = await broadcastSigned(makeProvider(network), response.signedTransaction);
        return { txid, signedTransaction: response.signedTransaction };
      } finally {
        signingRef.current[role] = false;
      }
    },
    [
      network,
      payer,
      payee,
      payerSession.manager,
      payerSession.state,
      payeeSession.manager,
      payeeSession.state,
    ],
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      accounts,
      wallet,
      connect,
      disconnect,
      signAndBroadcast,
    }),
    [accounts, wallet, connect, disconnect, signAndBroadcast],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export function useWallet(): WalletContextValue {
  const value = useContext(WalletContext);
  if (!value) throw new Error('useWallet must be used inside WalletProvider.');
  return value;
}
