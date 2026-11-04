// Selene sends walletready before it sends the receive/change paths. The hook's
// connected state and manager identity stay the same when the paths arrive.
import React from '/node_modules/.vite/deps/react.js';
const { useState } = React;

let payerManager;
class Manager {
  attempts = 0;
  listeners = new Set();
  key = null;
  getPubkey() { return this.key; }
  on(event, callback) { if (event === 'walletready') this.listeners.add(callback); }
  off(event, callback) { if (event === 'walletready') this.listeners.delete(callback); }
  deliverPaths() {
    this.key = Uint8Array.from('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'.match(/../g), x => parseInt(x, 16));
    for (const callback of this.listeners) callback();
  }
}

export function useWizardConnect(options) {
  const [manager] = useState(() => new Manager());
  const [state, setState] = useState('idle');
  if (options.sessionKey?.includes('payer')) payerManager = manager;
  return {
    manager, state, walletName: state === 'connected' ? 'Selene Wallet' : null,
    walletIcon: null, uri: state === 'connected' ? 'mock-pairing' : null,
    qrUri: null, error: null,
    connect: () => { manager.attempts += 1; setState('connected'); return true; },
    disconnect: async () => { manager.key = null; setState('idle'); },
  };
}

export function WizardConnectQRDialog() {
  return React.createElement('div', null,
    React.createElement('output', { 'aria-label': 'Pairing attempts' }, String(payerManager.attempts)),
    React.createElement('button', { onClick: () => payerManager.deliverPaths() }, 'Deliver Selene account paths'));
}
