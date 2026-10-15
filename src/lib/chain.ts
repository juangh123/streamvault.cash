import {
  Contract,
  ElectrumNetworkProvider,
  SignatureTemplate,
  TransactionBuilder,
  placeholderSignature,
  type NetworkProvider,
  type SpendableUtxo,
  type WcTransactionObject,
} from 'cashscript';
import { hexToBin, lockingBytecodeToCashAddress } from '@bitauth/libauth';
import { STREAMVAULT_ARTIFACT, PUSD_CATEGORY } from './covenant';
import type { NetworkType } from '../types';

export interface StreamParams {
  payerPk: Uint8Array;
  payeePk: Uint8Array;
  amountPerPeriod: number;
  periodBlocks: number;
  /** CashTokens category id of the streamed token (defaults to the configured PUSD category). */
  category?: string;
}

export interface VaultAddresses {
  address: string;
  tokenAddress: string;
  lockingBytecode: string;
  bytecode: string;
}

const MIN_TOKEN_SATOSHIS = 1000n; // BCH kept on each token output (dust floor + buffer)

/** Create an Electrum provider for Chipnet or Mainnet (no connection until a query is made). */
export function makeProvider(network: NetworkType): ElectrumNetworkProvider {
  return new ElectrumNetworkProvider(network);
}

/** Instantiate the covenant against any provider (Electrum in the app, Mock in tests). */
export function makeContract(params: StreamParams, provider: NetworkProvider): Contract {
  return new Contract(
    STREAMVAULT_ARTIFACT,
    [
      params.payerPk,
      params.payeePk,
      BigInt(params.amountPerPeriod),
      BigInt(params.periodBlocks),
      hexToBin(params.category ?? PUSD_CATEGORY),
    ],
    { provider },
  );
}

/** Derive the covenant's deterministic CashAddress for a network. */
export function deriveVaultAddresses(params: StreamParams, network: NetworkType): VaultAddresses {
  const contract = makeContract(params, makeProvider(network));
  return {
    address: contract.address,
    tokenAddress: contract.tokenAddress,
    lockingBytecode: contract.lockingBytecode,
    bytecode: contract.bytecode,
  };
}

/** Fetch the live UTXOs (PUSD + BCH) currently locked by the covenant. */
export async function fetchVaultUtxos(
  params: StreamParams,
  network: NetworkType,
): Promise<{ contract: Contract; utxos: SpendableUtxo[] }> {
  const contract = makeContract(params, makeProvider(network));
  const utxos = await contract.getUtxos();
  return { contract, utxos };
}

function prefixOf(contract: Contract): 'bitcoincash' | 'bchtest' {
  return contract.address.startsWith('bitcoincash:') ? 'bitcoincash' : 'bchtest';
}

/** Size-based fee so the vault keeps a BCH buffer while the miner fee stays realistic. */
function sizeFee(builder: TransactionBuilder, feeRate: number): bigint {
  return builder.getTransactionSize() * BigInt(feeRate);
}

function tokenAddressFor(contract: Contract, lockingBytecode: Uint8Array): string {
  const result = lockingBytecodeToCashAddress({ bytecode: lockingBytecode, prefix: prefixOf(contract), tokenSupport: true }) as unknown;
  const address = typeof result === 'string' ? result : (result as { address?: string }).address;
  if (!address) throw new Error('Failed to derive the destination CashAddress.');
  return address;
}

interface ClaimArgs {
  contract: Contract;
  utxo: SpendableUtxo;
  payeeTokenAddress: string;
  amount: number;
  sequence: number;
  feeRate?: number;
}

function assembleClaim({ contract, utxo, payeeTokenAddress, amount, sequence, feeRate = 2 }: ClaimArgs, unlocker: TransactionBuilder['inputs'][number]['unlocker']): TransactionBuilder {
  if (!utxo.token) throw new Error('Vault UTXO has no PUSD token to stream.');
  if (utxo.token.amount - BigInt(amount) <= 0n) {
    throw new Error('A claim cannot drain the vault - use cancel to reclaim the remainder.');
  }
  const builder = new TransactionBuilder({ provider: contract.provider, maximumFeeSatsPerByte: feeRate + 3 });
  builder.addInput(utxo, unlocker, { sequence });
  builder.addOutput({ to: payeeTokenAddress, amount: MIN_TOKEN_SATOSHIS, token: { amount: BigInt(amount), category: utxo.token.category } });
  builder.addOutput({
    to: contract.tokenAddress,
    amount: MIN_TOKEN_SATOSHIS,
    token: { amount: utxo.token.amount - BigInt(amount), category: utxo.token.category },
  });
  builder.outputs[1].amount = utxo.satoshis - MIN_TOKEN_SATOSHIS - sizeFee(builder, feeRate);
  return builder;
}

/**
 * Build a real, locally-signed `claim` transaction, returning raw hex. Used by the Chipnet
 * walkthrough with a throwaway demo key.
 */
export function buildClaimHex(options: ClaimArgs & { payeeSigner: SignatureTemplate }): string {
  const { payeeSigner, ...rest } = options;
  return assembleClaim(rest, options.contract.unlock.claim(payeeSigner, BigInt(options.amount))).build();
}

/**
 * Build a `claim` WalletConnect transaction object so the payee's wallet can sign and broadcast it.
 * The covenant redeem script is attached to the source output for the wallet.
 */
export function buildClaimWcObject(options: ClaimArgs): WcTransactionObject {
  const builder = assembleClaim(options, options.contract.unlock.claim(placeholderSignature(), BigInt(options.amount)));
  return builder.generateWcTransactionObject({ broadcast: false, userPrompt: 'StreamVault: claim tranche' });
}

interface CancelArgs {
  contract: Contract;
  utxo: SpendableUtxo;
  payerLockingBytecode: Uint8Array;
  sequence: number;
  feeRate?: number;
}

function assembleCancel({ contract, utxo, payerLockingBytecode, sequence, feeRate = 2 }: CancelArgs, unlocker: TransactionBuilder['inputs'][number]['unlocker']): TransactionBuilder {
  if (!utxo.token) throw new Error('Vault UTXO has no PUSD token to reclaim.');
  const builder = new TransactionBuilder({ provider: contract.provider, maximumFeeSatsPerByte: feeRate + 3 });
  builder.addInput(utxo, unlocker, { sequence });
  builder.addOutput({
    to: tokenAddressFor(contract, payerLockingBytecode),
    amount: MIN_TOKEN_SATOSHIS,
    token: { amount: utxo.token.amount, category: utxo.token.category },
  });
  builder.outputs[0].amount = utxo.satoshis - sizeFee(builder, feeRate);
  return builder;
}

/** Build a real, locally-signed `cancel` transaction, returning raw hex. */
export function buildCancelHex(options: CancelArgs & { payerSigner: SignatureTemplate }): string {
  const { payerSigner, ...rest } = options;
  return assembleCancel(rest, options.contract.unlock.cancel(payerSigner, options.payerLockingBytecode)).build();
}

/** Build a `cancel` WalletConnect transaction object for the payer's wallet to sign. */
export function buildCancelWcObject(options: CancelArgs): WcTransactionObject {
  return assembleCancel(options, options.contract.unlock.cancel(placeholderSignature(), options.payerLockingBytecode)).generateWcTransactionObject({
    broadcast: false,
    userPrompt: 'StreamVault: cancel stream',
  });
}