import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useWizardConnect } from '@wizardconnect/react';
import { binToHex, publicKeyToP2pkhCashAddress } from '@bitauth/libauth';
import type { DappConnectionManager } from '@wizardconnect/dapp';
import type { WcTransactionObject } from 'cashscript';
import type { NetworkType, WalletState } from '../types';
import { broadcastSigned, makeProvider, serializeWcTransaction, type InputPath } from '../lib/chain';

const PREFIX: Record<NetworkType, 'bitcoincash' | 'bchtest'> = {
  mainnet: 'bitcoincash',
  chipnet: 'bchtest',
};

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

function initialWallet(network: NetworkType): WalletState {
  return {
    connected: false,
    name: null,
    icon: null,
    address: null,
    payerAddress: null,
    payeeAddress: null,
    payerPubkey: null,
    payeePubkey: null,
    network,
  };
}

export interface SignedTransactionResult {
  txid: string;
  signedTransaction: string;
}

export interface WalletContextValue {
  state: ReturnType<typeof useWizardConnect>['state'];
  uri: string | null;
  qrUri: string | null;
  error: string | null;
  wallet: WalletState;
  manager: DappConnectionManager | null;
  connect: () => boolean;
  disconnect: () => Promise<void>;
  signAndBroadcast: (
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
  const wc = useWizardConnect({
    dappName: 'StreamVault.cash',
    persistSession: true,
  });
  const [wallet, setWallet] = useState<WalletState>(() => initialWallet(network));
  const signingRef = useRef(false);

  useEffect(() => {
    if (wc.state !== 'connected' || !wc.manager) {
      setWallet(initialWallet(network));
      return;
    }
    const payerPk = wc.manager.getPubkey(0, 0n);
    const payeePk = wc.manager.getPubkey(1, 0n);
    const payerAddress = payerPk ? pubkeyAddress(payerPk, network) : null;
    const payeeAddress = payeePk ? pubkeyAddress(payeePk, network) : null;
    setWallet({
      connected: Boolean(payerPk && payerAddress),
      name: wc.walletName ?? 'BCH Wallet',
      icon: wc.walletIcon,
      address: payerAddress,
      payerAddress,
      payeeAddress,
      payerPubkey: payerPk ? binToHex(payerPk) : null,
      payeePubkey: payeePk ? binToHex(payeePk) : null,
      network,
    });
  }, [wc.state, wc.manager, wc.walletName, wc.walletIcon, network]);

  const connect = useCallback(() => {
    if (wc.state === 'connected') return true;
    return wc.connect();
  }, [wc]);

  const disconnect = useCallback(async () => {
    await wc.disconnect();
    setWallet(initialWallet(network));
  }, [wc, network]);

  const signAndBroadcast = useCallback(
    async (object: WcTransactionObject, inputPaths: InputPath[], userPrompt?: string) => {
      if (!wc.manager || wc.state !== 'connected') {
        throw new Error('Connect a BCH wallet before signing.');
      }
      if (signingRef.current) throw new Error('A wallet signature request is already pending.');
      signingRef.current = true;
      try {
        const txHex = serializeWcTransaction(object);
        const request = {
          transaction: {
            transaction: txHex,
            sourceOutputs: object.sourceOutputs,
            broadcast: false,
            userPrompt: userPrompt ?? 'StreamVault transaction',
          },
          inputPaths,
        } as Parameters<DappConnectionManager['signTransaction']>[0];
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 120_000);
        let response;
        try {
          response = await wc.manager.signTransaction(request, { signal: controller.signal });
        } finally {
          clearTimeout(timer);
        }
        if (response.error || !response.signedTransaction) {
          throw new Error(response.error || 'The wallet did not return a signed transaction.');
        }
        const txid = await broadcastSigned(makeProvider(network), response.signedTransaction);
        return { txid, signedTransaction: response.signedTransaction };
      } finally {
        signingRef.current = false;
      }
    },
    [wc.manager, wc.state, network],
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      state: wc.state,
      uri: wc.uri,
      qrUri: wc.qrUri,
      error: wc.error,
      wallet,
      manager: wc.manager ?? null,
      connect,
      disconnect,
      signAndBroadcast,
    }),
    [wc.state, wc.uri, wc.qrUri, wc.error, wc.manager, wallet, connect, disconnect, signAndBroadcast],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export function useWallet(): WalletContextValue {
  const value = useContext(WalletContext);
  if (!value) throw new Error('useWallet must be used inside WalletProvider.');
  return value;
}
