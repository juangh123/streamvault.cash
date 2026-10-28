import React, { useEffect } from 'react';
import { WizardConnectQRDialog } from '@wizardconnect/react';
import { useWallet, type WalletRole } from '../wallet/WalletProvider';

interface WalletConnectDialogProps {
  open: boolean;
  role: WalletRole;
  onClose: () => void;
}

/**
 * Presentational WizardConnect pairing dialog. The connection manager lives in WalletProvider,
 * so closing this dialog does not destroy the signing session.
 */
export const WalletConnectDialog: React.FC<WalletConnectDialogProps> = ({ open, role, onClose }) => {
  const { accounts, connect } = useWallet();
  const account = accounts[role];

  useEffect(() => {
    if (open && (account.state === 'idle' || account.state === 'disconnected')) connect(role);
  }, [open, account.state, connect, role]);

  if (!open) return null;

  return (
    <WizardConnectQRDialog
      show={open}
      onClose={onClose}
      uri={account.uri ?? ''}
      qrUri={account.qrUri ?? ''}
      title={`Connect ${role} wallet`}
      subtitle={
        account.error
          ? account.error
          : account.state === 'connecting'
            ? 'Waiting for wallet approval...'
            : `Scan with Selene, Paytaca or Cashonize for ${role}`
      }
    />
  );
};
