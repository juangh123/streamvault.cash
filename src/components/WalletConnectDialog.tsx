import React, { useEffect, useRef } from 'react';
import { useWizardConnect, WizardConnectQRDialog } from '@wizardconnect/react';
import { publicKeyToP2pkhCashAddress } from '@bitauth/libauth';
import type { NetworkType, WalletState } from '../types';

const PREFIX: Record<NetworkType, 'bitcoincash' | 'bchtest'> = { mainnet: 'bitcoincash', chipnet: 'bchtest' };

interface WalletConnectDialogProps {
  open: boolean;
  network: NetworkType;
  onClose: () => void;
  onConnected: (wallet: WalletState) => void;
}

/**
 * Real WizardConnect (BCH WalletConnect) pairing dialog. Uses the official
 * @wizardconnect/react hook + QR dialog and derives the wallet's receive (child 0) P2PKH address.
 */
export const WalletConnectDialog: React.FC<WalletConnectDialogProps> = ({ open, network, onClose, onConnected }) => {
  const wc = useWizardConnect({ dappName: 'StreamVault.cash' });
  const notified = useRef(false);

  useEffect(() => {
    if (!open) {
      notified.current = false;
      return;
    }
    if (wc.state === 'idle') wc.connect();
  }, [open, wc.state]);

  useEffect(() => {
    if (wc.state !== 'connected' || !wc.manager || notified.current) return;
    let address: string | null = null;
    try {
      const pubkey = wc.manager.getPubkey(0, 0n);
      if (pubkey) {
        const encoded = publicKeyToP2pkhCashAddress({ publicKey: pubkey, prefix: PREFIX[network] }) as unknown;
        address = typeof encoded === 'string' ? encoded : ((encoded as { address?: string }).address ?? null);
      }
    } catch {
      address = null;
    }
    notified.current = true;
    onConnected({ connected: true, name: wc.walletName ?? 'BCH Wallet', icon: wc.walletIcon, address });
    onClose();
  }, [wc.state, wc.manager, wc.walletName, wc.walletIcon, network, onConnected, onClose]);

  if (!open) return null;

  return (
    <WizardConnectQRDialog
      show={open}
      onClose={onClose}
      uri={wc.uri ?? ''}
      qrUri={wc.qrUri ?? ''}
      title="Connect a BCH wallet"
      subtitle={wc.state === 'connecting' ? 'Waiting for wallet approval...' : 'Scan with Selene, Paytaca or Cashonize'}
    />
  );
};