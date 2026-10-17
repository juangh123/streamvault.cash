import {
  Contract,
  ElectrumNetworkProvider,
  SignatureTemplate,
  TransactionBuilder,
  placeholderP2PKHUnlocker,
  placeholderSignature,
  type NetworkProvider,
  type SpendableUtxo,
  type WcTransactionObject,
} from 'cashscript';
import {
  hexToBin,
  lockingBytecodeToCashAddress,
  publicKeyToP2pkhLockingBytecode,
} from '@bitauth/libauth';
import { transactionToHex } from '@wizardconnect/core/hdwalletv1-serialize';
import { STREAMVAULT_ARTIFACT, PUSD_CATEGORY, assertMainnetCategory } from './covenant.js';
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

export type InputPath = [number, 'receive' | 'change', number];

/** BCH kept on each token output (dust floor + buffer). */
export const MIN_TOKEN_SATOSHIS = 1000n;

/** Contract v1.2: a claim may reduce the vault's BCH by at most this amount. */
export const MAX_VAULT_BCH_REDUCTION = 2000n;

/** Demo vault buffer for a 2.00 PUSD agent budget. */
export const DEFAULT_VAULT_BCH = 50000n;

/** Create an Electrum provider for Chipnet or Mainnet (no connection until a query is made). */
export function makeProvider(network: NetworkType): ElectrumNetworkProvider {
  return new ElectrumNetworkProvider(network);
}

/** Instantiate the covenant against any provider (Electrum in the app, Mock in tests). */
export function makeContract(params: StreamParams, provider: NetworkProvider): Contract {
  const category = params.category ?? PUSD_CATEGORY;
  assertMainnetCategory(provider.network as NetworkType, category);
  if (hexToBin(category).length !== 32) {
    throw new Error('PUSD category must be a 32-byte hex value.');
  }
  return new Contract(
    STREAMVAULT_ARTIFACT,
    [
      params.payerPk,
      params.payeePk,
      BigInt(params.amountPerPeriod),
      BigInt(params.periodBlocks),
      hexToBin(category),
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

/** Fetch all live UTXOs currently locked by the covenant. */
export async function fetchVaultUtxos(
  params: StreamParams,
  network: NetworkType,
): Promise<{ contract: Contract; utxos: SpendableUtxo[] }> {
  const contract = makeContract(params, makeProvider(network));
  const utxos = await contract.getUtxos();
  return { contract, utxos };
}

export function filterTokenUtxos(utxos: SpendableUtxo[], category = PUSD_CATEGORY): SpendableUtxo[] {
  return utxos.filter((utxo) => utxo.token?.category === category);
}

export function sumTokenAmount(utxos: SpendableUtxo[]): bigint {
  return utxos.reduce((total, utxo) => total + (utxo.token?.amount ?? 0n), 0n);
}

export function sumSatoshis(utxos: SpendableUtxo[]): bigint {
  return utxos.reduce((total, utxo) => total + utxo.satoshis, 0n);
}

export function selectTokenUtxos(
  utxos: SpendableUtxo[],
  amount: bigint,
  category = PUSD_CATEGORY,
): { selected: SpendableUtxo[]; total: bigint } {
  const candidates = filterTokenUtxos(utxos, category).slice().sort((a, b) =>
    a.token!.amount === b.token!.amount ? 0 : a.token!.amount > b.token!.amount ? -1 : 1,
  );
  const selected: SpendableUtxo[] = [];
  let total = 0n;
  for (const utxo of candidates) {
    selected.push(utxo);
    total += utxo.token!.amount;
    if (total >= amount) break;
  }
  if (total < amount) {
    throw new Error(`Insufficient PUSD: need ${amount} base units, found ${total}.`);
  }
  return { selected, total };
}

export interface VaultState {
  contract: Contract;
  utxos: SpendableUtxo[];
  tokenUtxos: SpendableUtxo[];
  tokenAmount: bigint;
  bchSatoshis: bigint;
  extraUtxos: SpendableUtxo[];
}

export async function getVaultState(params: StreamParams, network: NetworkType): Promise<VaultState> {
  const { contract, utxos } = await fetchVaultUtxos(params, network);
  const category = params.category ?? PUSD_CATEGORY;
  const tokenUtxos = filterTokenUtxos(utxos, category);
  return {
    contract,
    utxos,
    tokenUtxos,
    tokenAmount: sumTokenAmount(tokenUtxos),
    bchSatoshis: sumSatoshis(tokenUtxos),
    extraUtxos: utxos.filter((utxo) => !utxo.token || utxo.token.category !== category),
  };
}

function prefixOf(contract: Contract): 'bitcoincash' | 'bchtest' {
  return contract.address.startsWith('bitcoincash:') ? 'bitcoincash' : 'bchtest';
}

/** Size-based fee so the vault keeps a BCH buffer while the miner fee stays realistic. */
function sizeFee(builder: TransactionBuilder, feeRate: number): bigint {
  return builder.getTransactionSize() * BigInt(feeRate);
}

function tokenAddressFor(contract: Contract, lockingBytecode: Uint8Array): string {
  const result = lockingBytecodeToCashAddress({
    bytecode: lockingBytecode,
    prefix: prefixOf(contract),
    tokenSupport: true,
  }) as unknown;
  const address = typeof result === 'string' ? result : (result as { address?: string }).address;
  if (!address) throw new Error('Failed to derive the destination CashAddress.');
  return address;
}

export function tokenAddressForPublicKey(publicKey: Uint8Array, prefix: 'bitcoincash' | 'bchtest'): string {
  const result = lockingBytecodeToCashAddress({
    bytecode: publicKeyToP2pkhLockingBytecode({ publicKey }),
    prefix,
    tokenSupport: true,
  }) as unknown;
  const address = typeof result === 'string' ? result : (result as { address?: string }).address;
  if (!address) throw new Error('Failed to derive the token CashAddress.');
  return address;
}

export function vaultAssertChangeBound(inputSatoshis: bigint, changeSatoshis: bigint): void {
  if (changeSatoshis < inputSatoshis - MAX_VAULT_BCH_REDUCTION) {
    throw new Error(
      `Vault BCH change would be ${changeSatoshis} sats; the covenant requires at least ${inputSatoshis - MAX_VAULT_BCH_REDUCTION}. Add BCH to the vault or reduce the fee.`,
    );
  }
}

interface ClaimArgs {
  contract: Contract;
  utxo: SpendableUtxo;
  payeeTokenAddress: string;
  amount: number;
  sequence: number;
  feeRate?: number;
}

function assembleClaim(
  { contract, utxo, payeeTokenAddress, amount, sequence, feeRate = 1 }: ClaimArgs,
  unlocker: TransactionBuilder['inputs'][number]['unlocker'],
): TransactionBuilder {
  if (!utxo.token) throw new Error('Vault UTXO has no PUSD token to stream.');
  if (utxo.token.amount - BigInt(amount) <= 0n) {
    throw new Error('A claim cannot drain the vault - use cancel to reclaim the remainder.');
  }
  const builder = new TransactionBuilder({ provider: contract.provider, maximumFeeSatsPerByte: feeRate + 3 });
  builder.addInput(utxo, unlocker, { sequence });
  builder.addOutput({
    to: payeeTokenAddress,
    amount: MIN_TOKEN_SATOSHIS,
    token: { amount: BigInt(amount), category: utxo.token.category },
  });
  builder.addOutput({
    to: contract.tokenAddress,
    amount: MIN_TOKEN_SATOSHIS,
    token: { amount: utxo.token.amount - BigInt(amount), category: utxo.token.category },
  });
  const change = utxo.satoshis - MIN_TOKEN_SATOSHIS - sizeFee(builder, feeRate);
  vaultAssertChangeBound(utxo.satoshis, change);
  builder.outputs[1].amount = change;
  return builder;
}

/** Build a real, locally-signed `claim` transaction, returning raw hex. */
export function buildClaimHex(options: ClaimArgs & { payeeSigner: SignatureTemplate }): string {
  const { payeeSigner, ...rest } = options;
  return assembleClaim(rest, options.contract.unlock.claim(payeeSigner, BigInt(options.amount))).build();
}

/** Build a `claim` WalletConnect transaction object for the payee's wallet to sign. */
export function buildClaimWcObject(options: ClaimArgs): WcTransactionObject {
  const builder = assembleClaim(
    options,
    options.contract.unlock.claim(placeholderSignature(), BigInt(options.amount)),
  );
  return builder.generateWcTransactionObject({
    broadcast: false,
    userPrompt: 'StreamVault: claim tranche',
  });
}

interface CancelArgs {
  contract: Contract;
  utxo: SpendableUtxo;
  payerLockingBytecode: Uint8Array;
  sequence: number;
  feeRate?: number;
}

function assembleCancel(
  { contract, utxo, payerLockingBytecode, sequence, feeRate = 2 }: CancelArgs,
  unlocker: TransactionBuilder['inputs'][number]['unlocker'],
): TransactionBuilder {
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
  return assembleCancel(
    options,
    options.contract.unlock.cancel(placeholderSignature(), options.payerLockingBytecode),
  ).generateWcTransactionObject({
    broadcast: false,
    userPrompt: 'StreamVault: cancel stream',
  });
}

export interface FundArgs {
  contract: Contract;
  walletAddress: string;
  walletTokenAddress: string;
  walletUtxos: SpendableUtxo[];
  deposit: bigint;
  category: string;
  vaultBch?: bigint;
  feeRate?: number;
}

export interface TopUpArgs {
  contract: Contract;
  vaultUtxo: SpendableUtxo;
  walletUtxo: SpendableUtxo;
  walletAddress: string;
  feeRate?: number;
}

/**
 * Build a plain P2PKH funding transaction into the covenant token address.
 * The caller is responsible for selecting PUSD UTXOs; token and BCH change are added automatically.
 */
function assembleFund(
  {
    contract,
    walletAddress,
    walletTokenAddress,
    walletUtxos,
    deposit,
    category,
    vaultBch = DEFAULT_VAULT_BCH,
    feeRate = 2,
  }: FundArgs,
  unlocker: TransactionBuilder['inputs'][number]['unlocker'],
): TransactionBuilder {
  if (walletUtxos.length === 0) throw new Error('No PUSD UTXOs selected for funding.');
  if (walletUtxos.some((utxo) => utxo.token?.category !== category)) {
    throw new Error('Selected wallet UTXOs do not all carry the configured PUSD category.');
  }
  const builder = new TransactionBuilder({ provider: contract.provider, maximumFeeSatsPerByte: feeRate + 3 });
  builder.addInputs(walletUtxos, unlocker);
  builder.addOutput({
    to: contract.tokenAddress,
    amount: vaultBch,
    token: { amount: deposit, category },
  });
  builder.addTokenChangeOutputIfNeeded({ category, to: walletTokenAddress });
  builder.addBchChangeOutputIfNeeded({ to: walletAddress, feeRate });
  return builder;
}

/** Build a locally-signed funding transaction for tests/dry runs. */
export function buildFundHex(options: FundArgs & { walletSigner: SignatureTemplate }): string {
  const { walletSigner, ...rest } = options;
  return assembleFund(rest, walletSigner.unlockP2PKH()).build();
}

/** Build a funding transaction object for the connected wallet to sign. */
export function buildFundWcObject(options: FundArgs): WcTransactionObject {
  return assembleFund(options, placeholderP2PKHUnlocker(options.walletAddress)).generateWcTransactionObject({
    broadcast: false,
    userPrompt: 'StreamVault: fund PUSD vault',
  });
}

function assembleTopUp(
  { contract, vaultUtxo, walletUtxo, walletAddress, feeRate = 1 }: TopUpArgs,
  vaultUnlocker: TransactionBuilder['inputs'][number]['unlocker'],
  walletUnlocker: TransactionBuilder['inputs'][number]['unlocker'],
): TransactionBuilder {
  if (!vaultUtxo.token) throw new Error('Vault UTXO has no PUSD token to top up.');
  if (!walletUtxo.token) throw new Error('Top-up UTXO has no PUSD token.');
  if (walletUtxo.token.category !== vaultUtxo.token.category) {
    throw new Error('Top-up UTXO category does not match the vault category.');
  }
  const builder = new TransactionBuilder({ provider: contract.provider, maximumFeeSatsPerByte: feeRate + 3 });
  builder.addInput(vaultUtxo, vaultUnlocker);
  builder.addInput(walletUtxo, walletUnlocker);
  builder.addOutput({
    to: contract.tokenAddress,
    amount: MIN_TOKEN_SATOSHIS,
    token: {
      amount: vaultUtxo.token.amount + walletUtxo.token.amount,
      category: vaultUtxo.token.category,
    },
  });
  builder.outputs[0].amount =
    vaultUtxo.satoshis + walletUtxo.satoshis - sizeFee(builder, feeRate);
  vaultAssertChangeBound(
    vaultUtxo.satoshis + walletUtxo.satoshis,
    builder.outputs[0].amount,
  );
  return builder;
}

/** Build a top-up transaction signed locally (tests and CLI). */
export function buildTopUpHex(options: TopUpArgs & { payerSigner: SignatureTemplate }): string {
  const { payerSigner, ...rest } = options;
  return assembleTopUp(
    rest,
    options.contract.unlock.topUp(payerSigner),
    payerSigner.unlockP2PKH(),
  ).build();
}

/** Build a top-up WalletConnect object. Both inputs are signed by the payer's receive/0 key. */
export function buildTopUpWcObject(options: TopUpArgs): WcTransactionObject {
  return assembleTopUp(
    options,
    options.contract.unlock.topUp(placeholderSignature()),
    placeholderP2PKHUnlocker(options.walletAddress),
  ).generateWcTransactionObject({
    broadcast: false,
    userPrompt: 'StreamVault: top up PUSD vault',
  });
}

export const TOP_UP_INPUT_PATHS: InputPath[] = [
  [0, 'receive', 0],
  [1, 'receive', 0],
];

/** Convert the CashScript WalletConnect object into the hex string expected by WizardConnect wallets. */
export function serializeWcTransaction(object: WcTransactionObject): string {
  const tx = object.transaction;
  return transactionToHex(tx.inputs, tx.outputs, tx.version, tx.locktime);
}

export function fundInputPaths(inputCount: number): InputPath[] {
  return Array.from({ length: inputCount }, (_, index) => [index, 'receive', 0] as InputPath);
}

export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function broadcastSigned(provider: NetworkProvider, signedHex: string): Promise<string> {
  return withTimeout(
    provider.sendRawTransaction(signedHex),
    20_000,
    'Electrum broadcast timed out after 20 seconds. The wallet signature is safe; retry the broadcast.',
  );
}
