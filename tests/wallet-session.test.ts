import assert from 'node:assert/strict';
import { secp256k1 } from '@bitauth/libauth';
import { accountFromSession, type SessionLike } from '../src/wallet/session';

const publicKey = secp256k1.derivePublicKeyCompressed(new Uint8Array(32).fill(7)) as Uint8Array;
const manager = { getPubkey: (child: number, index: bigint) => (child === 0 && index === 0n ? publicKey : undefined) };
const base: SessionLike = {
  state: 'idle', manager: null, walletName: null, walletIcon: null, uri: null, qrUri: null, error: null,
};

const connected = accountFromSession({ ...base, state: 'connected', manager, walletName: 'Selene Wallet' }, 'mainnet');
assert.equal(connected.connected, true);
assert.equal(connected.reconnecting, false);
assert.ok(connected.address?.startsWith('bitcoincash:q'));
assert.ok(connected.tokenAddress?.startsWith('bitcoincash:z'));

// Hidden tab or wallet app in the background: keep the paired key usable and say it is reconnecting.
const reconnecting = accountFromSession({ ...base, state: 'reconnecting', manager, walletName: 'Selene Wallet' }, 'mainnet');
assert.equal(reconnecting.connected, true);
assert.equal(reconnecting.reconnecting, true);
assert.equal(reconnecting.pubkey, connected.pubkey);

// Page reload: the stored session restores without a QR code before the wallet answers.
const restoring = accountFromSession({ ...base, state: 'connecting', manager, walletName: 'Selene Wallet' }, 'mainnet');
assert.equal(restoring.connected, false);
assert.equal(restoring.reconnecting, true);

// A fresh QR pairing is neither connected nor reconnecting.
const pairing = accountFromSession({ ...base, state: 'connecting', manager, uri: 'wiz://?p=x&s=y' }, 'mainnet');
assert.equal(pairing.connected, false);
assert.equal(pairing.reconnecting, false);

// A wallet-initiated disconnect is not usable.
const disconnected = accountFromSession({ ...base, state: 'disconnected', manager }, 'chipnet');
assert.equal(disconnected.connected, false);
assert.equal(disconnected.reconnecting, false);

console.log('[PASS] Wallet session: paired wallets stay usable while reconnecting; reloads restore without a new pairing.');
