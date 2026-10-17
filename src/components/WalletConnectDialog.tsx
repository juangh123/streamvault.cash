import React, { useEffect } from 'react';
import { WizardConnectQRDialog } from '@wizardconnect/react';
import { useWallet } from '../wallet/WalletProvider';

interface WalletConnectDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Presentational WizardConnect pairing dialog. The connection manager lives in WalletProvider,
 * so closing this dialog does not destroy the signing session.
 */
export const WalletConnectDialog: React.FC<WalletConnectDialogProps> = ({ open, onClose }) => {
  const { state, uri, qrUri, connect, error } = useWallet();

  useEffect(() => {
    if (open && state === 'idle') connect();
  }, [open, state, connect]);

  if (!open) return null;

  return (
    <WizardConnectQRDialog
      show={open}
      onClose={onClose}
      uri={uri ?? ''}
      qrUri={qrUri ?? ''}
      title="Connect a BCH wallet"
      subtitle={
        error
          ? error
          : state === 'connecting'
            ? 'Waiting for wallet approval...'
            : 'Scan with Selene, Paytaca or Cashonize'
      }
    />
  );
};
