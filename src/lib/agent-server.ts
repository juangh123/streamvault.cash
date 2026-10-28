import {
  SignatureTemplate,
  TransactionBuilder,
  type SpendableUtxo,
} from 'cashscript';
import {
  binToHex,
  cashAddressToLockingBytecode,
  decodeCashAddress,
  decodeTransaction,
  decodePrivateKeyWif,
  hexToBin,
  publicKeyToP2pkhCashAddress,
  publicKeyToP2pkhLockingBytecode,
} from '@bitauth/libauth';
import type {
  AgentErrorCode,
  AgentRunFailure,
  AgentRunResponse,
  AgentRunSuccess,
  AgentStatus,
  AgentVaultState,
  NetworkType,
  ServiceVerification,
} from '../types';
import { PUSD_CATEGORY } from './constants.js';
import { getAgentRequestStore, type AgentRequestStore } from './agent-store.js';
import {
  MIN_TOKEN_SATOSHIS,
  buildClaimHex,
  filterTokenUtxos,
  getVaultState,
  makeContract,
  makeProvider,
  sumSatoshis,
  sumTokenAmount,
  tokenAddressForPublicKey,
  type StreamParams,
} from './chain.js';

export interface AgentConfig {
  enabled: boolean;
  network: NetworkType;
  category: string;
  amountPerPeriod: number;
  periodBlocks: number;
  servicePrice: number;
  maxBalance: number;
  rateLimitPerMinute: number;
  agentWif: string;
  serviceAddress: string;
}

interface VaultAge {
  confirmed: boolean;
  nextClaimBlock: number;
  blocksRemaining: number;
}

interface PaymentVerification {
  verification: ServiceVerification;
  feeSats: number;
  blockHeight: number;
}

export function readAgentConfig(): AgentConfig {
  const network = (process.env.AGENT_NETWORK ?? 'mainnet') as NetworkType;
  if (network !== 'mainnet' && network !== 'chipnet') {
    throw new Error('AGENT_NETWORK must be mainnet or chipnet.');
  }
  return {
    enabled: process.env.AGENT_ENABLED === 'true',
    network,
    category: process.env.PUSD_CATEGORY ?? PUSD_CATEGORY,
    amountPerPeriod: Number(process.env.AGENT_AMOUNT_PER_PERIOD ?? '10'),
    periodBlocks: Number(process.env.AGENT_PERIOD_BLOCKS ?? '2'),
    servicePrice: Number(process.env.AGENT_SERVICE_PRICE ?? '1'),
    maxBalance: Number(process.env.AGENT_MAX_BALANCE ?? '10'),
    rateLimitPerMinute: Number(process.env.AGENT_RATE_LIMIT ?? '30'),
    agentWif: process.env.AGENT_WIF ?? '',
    serviceAddress: process.env.SERVICE_ADDRESS ?? '',
  };
}

function assertConfig(config: AgentConfig, requireAgent = true): void {
  if (!config.enabled) throw new Error('AGENT_DISABLED');
  if (!config.serviceAddress) throw new Error('SERVICE_ADDRESS is not configured.');
  if (!/^[0-9a-fA-F]{64}$/.test(config.category)) throw new Error('PUSD_CATEGORY must be 32 bytes of hex.');
  if (!Number.isInteger(config.amountPerPeriod) || config.amountPerPeriod <= 0) {
    throw new Error('AGENT_AMOUNT_PER_PERIOD must be a positive integer.');
  }
  if (!Number.isInteger(config.periodBlocks) || config.periodBlocks <= 0) {
    throw new Error('AGENT_PERIOD_BLOCKS must be a positive integer.');
  }
  if (!Number.isInteger(config.servicePrice) || config.servicePrice <= 0) {
    throw new Error('AGENT_SERVICE_PRICE must be a positive integer.');
  }
  if (!Number.isInteger(config.maxBalance) || config.maxBalance < config.servicePrice) {
    throw new Error('AGENT_MAX_BALANCE must be at least the service price.');
  }
  if (requireAgent && !config.agentWif) throw new Error('AGENT_WIF is not configured.');
  assertNetworkConfig(config, requireAgent);
}

function prefixOf(network: NetworkType): 'bitcoincash' | 'bchtest' {
  return network === 'mainnet' ? 'bitcoincash' : 'bchtest';
}

function assertNetworkConfig(config: AgentConfig, requireAgent: boolean): void {
  let service;
  try {
    service = decodeCashAddress(config.serviceAddress);
  } catch {
    throw new Error('SERVICE_ADDRESS is not a valid CashAddress.');
  }
  if (typeof service === 'string') throw new Error(`SERVICE_ADDRESS is invalid: ${service}`);
  if (service.prefix !== prefixOf(config.network)) {
    throw new Error(
      `SERVICE_ADDRESS network (${service.prefix}) does not match AGENT_NETWORK=${config.network}.`,
    );
  }

  if (!requireAgent) return;
  let decodedWif;
  try {
    decodedWif = decodePrivateKeyWif(config.agentWif);
  } catch {
    throw new Error('AGENT_WIF is not a valid WIF private key.');
  }
  if (typeof decodedWif === 'string') throw new Error(`AGENT_WIF is invalid: ${decodedWif}`);
  const expectedWifType = config.network === 'mainnet' ? 'mainnet' : 'testnet';
  if (decodedWif.type !== expectedWifType) {
    throw new Error(
      `AGENT_WIF network (${decodedWif.type}) does not match AGENT_NETWORK=${config.network}.`,
    );
  }
}

function agentSigner(config: AgentConfig): SignatureTemplate {
  return new SignatureTemplate(config.agentWif);
}

function agentPubkey(config: AgentConfig): Uint8Array {
  return agentSigner(config).publicKey;
}

function agentAddress(config: AgentConfig): string {
  const encoded = publicKeyToP2pkhCashAddress({
    publicKey: agentPubkey(config),
    prefix: prefixOf(config.network),
  }) as unknown;
  return typeof encoded === 'string' ? encoded : (encoded as { address: string }).address;
}

function agentTokenAddress(config: AgentConfig): string {
  return tokenAddressForPublicKey(agentPubkey(config), prefixOf(config.network));
}

/** A malformed client request. Maps to HTTP 400 / INVALID_REQUEST, unlike configuration or network errors. */
export class InvalidRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRequestError';
  }
}

/** HTTP status and body for a failed status request: 503 when disabled, 400 for bad input, 500 otherwise. */
export function statusErrorResponse(e: unknown): { status: number; body: { code: AgentErrorCode; message: string } } {
  const message = e instanceof Error ? e.message : String(e);
  if (message === 'AGENT_DISABLED') return { status: 503, body: { code: 'AGENT_DISABLED', message } };
  if (e instanceof InvalidRequestError) return { status: 400, body: { code: 'INVALID_REQUEST', message } };
  return { status: 500, body: { code: 'SERVER_ERROR', message } };
}

function validatePayerPubkey(value: unknown): string {
  if (typeof value !== 'string' || !/^(02|03)[0-9a-fA-F]{64}$/.test(value)) {
    throw new InvalidRequestError('payerPubkey must be a 33-byte compressed public key in hex.');
  }
  return value;
}

function serviceLockingBytecode(config: AgentConfig): Uint8Array {
  const result = cashAddressToLockingBytecode(config.serviceAddress);
  if (typeof result === 'string') throw new Error(`SERVICE_ADDRESS is invalid: ${result}`);
  return result.bytecode;
}

function contractParams(config: AgentConfig, payerPubkey: string): StreamParams {
  return {
    payerPk: hexToBin(payerPubkey),
    payeePk: agentPubkey(config),
    amountPerPeriod: config.amountPerPeriod,
    periodBlocks: config.periodBlocks,
    category: config.category,
  };
}

async function vaultAge(
  provider: ReturnType<typeof makeProvider>,
  utxo: SpendableUtxo,
  periodBlocks: number,
): Promise<VaultAge> {
  const tip = await provider.getBlockHeight();
  const verbose = (await provider.performRequest('blockchain.transaction.get', utxo.txid, true)) as {
    blockheight?: number;
  };
  const created = Number(verbose.blockheight ?? 0);
  const confirmed = created > 0;
  const nextClaimBlock = (confirmed ? created : tip) + periodBlocks;
  return {
    confirmed,
    nextClaimBlock,
    blocksRemaining: Math.max(0, nextClaimBlock - tip),
  };
}

function vaultState(
  contractAddress: string,
  state: Awaited<ReturnType<typeof getVaultState>>,
  nextClaimBlock: number | null,
  config: AgentConfig,
): AgentVaultState {
  return {
    address: contractAddress,
    tokenAmount: Number(state.tokenAmount),
    bchSatoshis: Number(state.bchSatoshis),
    periodBlocks: config.periodBlocks,
    amountPerPeriod: config.amountPerPeriod,
    nextClaimBlock,
  };
}

async function agentState(
  provider: ReturnType<typeof makeProvider>,
  config: AgentConfig,
): Promise<{ address: string; tokenAmount: number; bchSatoshis: number }> {
  const address = agentAddress(config);
  const utxos = await provider.getUtxos(address);
  const tokenUtxos = filterTokenUtxos(utxos, config.category);
  return {
    address,
    tokenAmount: Number(sumTokenAmount(tokenUtxos)),
    bchSatoshis: Number(sumSatoshis(utxos)),
  };
}

export async function getAgentStatus(payerPubkeyRaw: unknown): Promise<AgentStatus> {
  const config = readAgentConfig();
  assertConfig(config);
  const payerPubkey = validatePayerPubkey(payerPubkeyRaw);
  const provider = makeProvider(config.network);
  const params = contractParams(config, payerPubkey);
  const contract = makeContract(params, provider);
  const state = await getVaultState(params, config.network);
  const first = state.tokenUtxos[0];
  let nextClaimBlock: number | null = null;
  if (first) {
    try {
      const age = await vaultAge(provider, first, config.periodBlocks);
      nextClaimBlock = age.nextClaimBlock;
    } catch {
      nextClaimBlock = null;
    }
  }
  return {
    enabled: true,
    network: config.network,
    agentPubkey: binToHex(agentPubkey(config)),
    category: config.category,
    servicePrice: config.servicePrice,
    vault: vaultState(contract.address, state, nextClaimBlock, config),
    agent: await agentState(provider, config),
  };
}

function opReturnPayload(lockingBytecode: Uint8Array): string | null {
  if (lockingBytecode[0] !== 0x6a || lockingBytecode.length < 2) return null;
  let offset = 1;
  let length = lockingBytecode[offset++];
  if (length === 0x4c) {
    length = lockingBytecode[offset++];
  } else if (length === 0x4d) {
    length = lockingBytecode[offset] + lockingBytecode[offset + 1] * 256;
    offset += 2;
  } else if (length === 0x4e) {
    length =
      lockingBytecode[offset] +
      lockingBytecode[offset + 1] * 256 +
      lockingBytecode[offset + 2] * 65536 +
      lockingBytecode[offset + 3] * 16777216;
    offset += 4;
  }
  return new TextDecoder().decode(lockingBytecode.slice(offset, offset + length));
}

export async function verifyServicePayment(
  txid: string,
  requestId: string,
  config: AgentConfig,
): Promise<PaymentVerification> {
  if (!/^[0-9a-fA-F]{64}$/.test(txid)) throw new Error('PAYMENT_NOT_FOUND');
  const provider = makeProvider(config.network);
  let raw: string;
  try {
    raw = await provider.getRawTransaction(txid);
  } catch {
    throw new Error('PAYMENT_NOT_FOUND');
  }
  const tx = decodeTransaction(hexToBin(raw));
  if (typeof tx === 'string') throw new Error(`PAYMENT_NOT_FOUND: ${tx}`);
  const expected = serviceLockingBytecode(config);
  const expectedHex = binToHex(expected);
  const category = config.category.toLowerCase();

  const categoryOutputs = tx.outputs.filter(
    (output) => output.token && binToHex(output.token.category).toLowerCase() === category,
  );
  if (categoryOutputs.length === 0) throw new Error('WRONG_CATEGORY');
  const amountOutputs = categoryOutputs.filter(
    (output) => output.token!.amount === BigInt(config.servicePrice),
  );
  if (amountOutputs.length === 0) throw new Error('WRONG_AMOUNT');
  const serviceOutput = amountOutputs.find(
    (output) => binToHex(output.lockingBytecode) === expectedHex,
  );
  if (!serviceOutput) throw new Error('WRONG_DESTINATION');

  const expectedOpReturn = `SV1:${requestId}`;
  const requestOutput = tx.outputs.find(
    (output) => opReturnPayload(output.lockingBytecode) === expectedOpReturn,
  );
  if (!requestOutput) throw new Error('REQUEST_ID_MISMATCH');

  let blockHeight = 0;
  let confirmed = false;
  try {
    const verbose = (await provider.performRequest('blockchain.transaction.get', txid, true)) as {
      blockheight?: number;
      confirmations?: number;
    };
    blockHeight = Number(verbose.blockheight ?? 0);
    confirmed = blockHeight > 0 || Number(verbose.confirmations ?? 0) > 0;
  } catch {
    // A mempool transaction may not have verbose fields yet.
  }

  let feeSats = 0;
  try {
    let inputSats = 0n;
    for (const input of tx.inputs) {
      const sourceRaw = await provider.getRawTransaction(binToHex(input.outpointTransactionHash));
      const source = decodeTransaction(hexToBin(sourceRaw));
      if (typeof source !== 'string') {
        inputSats += source.outputs[input.outpointIndex].valueSatoshis;
      }
    }
    const outputSats = tx.outputs.reduce((sum, output) => sum + output.valueSatoshis, 0n);
    feeSats = Number(inputSats - outputSats);
  } catch {
    feeSats = 0;
  }

  return {
    verification: {
      requestId,
      txid,
      amount: Number(serviceOutput.token!.amount),
      category: binToHex(serviceOutput.token!.category),
      destination: config.serviceAddress,
      confirmed,
    },
    feeSats,
    blockHeight,
  };
}

function fail(code: AgentErrorCode, message: string, extra: Partial<AgentRunFailure> = {}): AgentRunResponse {
  return { ok: false, code, message, ...extra } as AgentRunResponse;
}

function clientIp(req: any): string {
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req?.socket?.remoteAddress ?? 'unknown';
}

function validateRequestId(value: unknown): string {
  if (value === undefined) return crypto.randomUUID();
  if (typeof value !== 'string' || !/^[A-Za-z0-9-]{8,64}$/.test(value)) {
    throw new InvalidRequestError('requestId must be 8-64 letters, digits or hyphens.');
  }
  return value;
}

export async function runAgent(
  payerPubkeyRaw: unknown,
  requestIdRaw: unknown,
  ip: string,
): Promise<AgentRunResponse> {
  const config = readAgentConfig();
  try {
    assertConfig(config);
  } catch (e) {
    const message = (e as Error).message;
    return fail(message === 'AGENT_DISABLED' ? 'AGENT_DISABLED' : 'SERVER_ERROR', message);
  }
  let payerPubkey: string;
  let requestId: string;
  try {
    payerPubkey = validatePayerPubkey(payerPubkeyRaw);
    requestId = validateRequestId(requestIdRaw);
  } catch (e) {
    return fail('INVALID_REQUEST', (e as Error).message);
  }

  let store: AgentRequestStore;
  try {
    store = getAgentRequestStore();
    if (!(await store.checkRateLimit(ip, config.rateLimitPerMinute))) {
      return fail('RATE_LIMITED', 'Too many agent requests. Wait a minute and retry.');
    }
    if (!(await store.claimRequestId(requestId))) {
      return fail('DUPLICATE_REQUEST', 'This request id has already been used.');
    }
  } catch (e) {
    return fail('SERVER_ERROR', (e as Error).message);
  }

  const provider = makeProvider(config.network);
  const params = contractParams(config, payerPubkey);
  const contract = makeContract(params, provider);
  const signer = agentSigner(config);
  const agentPk = signer.publicKey;
  const agentAddr = agentAddress(config);
  const agentTokenAddr = agentTokenAddress(config);
  const agentLocking = publicKeyToP2pkhLockingBytecode({ publicKey: agentPk });
  let claimTxid: string | null = null;
  let serviceTxid: string | null = null;

  try {
    const state = await getVaultState(params, config.network);
    if (state.tokenUtxos.length === 0) {
      return fail('NO_VAULT', `No funded PUSD vault for ${contract.address}.`);
    }
    if (state.tokenUtxos.length > 1) {
      return fail('MULTIPLE_VAULT_UTXOS', 'Multiple PUSD vault UTXOs detected. Cancel or consolidate before running the agent.');
    }
    if (state.tokenAmount <= BigInt(config.amountPerPeriod)) {
      return fail('BUDGET_EXHAUSTED', 'The vault cannot release another full tranche. Cancel to reclaim the remainder.');
    }

    let agentUtxos = await provider.getUtxos(agentAddr);
    let agentTokenUtxos = filterTokenUtxos(agentUtxos, config.category);
    let agentTokenAmount = sumTokenAmount(agentTokenUtxos);
    if (agentTokenAmount > BigInt(config.maxBalance)) {
      return fail('AGENT_BALANCE_TOO_HIGH', `Agent hot wallet holds ${agentTokenAmount} base units; ceiling is ${config.maxBalance}.`);
    }

    if (agentTokenAmount < BigInt(config.servicePrice)) {
      let age: VaultAge;
      try {
        age = await vaultAge(provider, state.tokenUtxos[0], config.periodBlocks);
      } catch {
        return fail(
          'PERIOD_NOT_ELAPSED',
          'The vault UTXO is not confirmed yet. Wait for one confirmation before running the agent.',
        );
      }
      if (age.blocksRemaining > 0) {
        return fail(
          'BUDGET_EXHAUSTED',
          "This period's budget is used up. The next tranche is not available yet.",
          { nextClaimBlock: age.nextClaimBlock },
        );
      }
      const claimHex = buildClaimHex({
        contract,
        utxo: state.tokenUtxos[0],
        payeeTokenAddress: agentTokenAddr,
        amount: config.amountPerPeriod,
        sequence: config.periodBlocks,
        payeeSigner: signer,
      });
      claimTxid = await provider.sendRawTransaction(claimHex);
      agentTokenUtxos = [
        {
          txid: claimTxid,
          vout: 0,
          satoshis: MIN_TOKEN_SATOSHIS,
          token: { amount: BigInt(config.amountPerPeriod), category: config.category },
          lockingBytecode: binToHex(agentLocking),
        },
      ];
      agentTokenAmount = BigInt(config.amountPerPeriod);
      agentUtxos = await provider.getUtxos(agentAddr);
    }

    const selectedTokens = agentTokenUtxos.slice();
    const selectedBch: SpendableUtxo[] = [];
    const bchCandidates = agentUtxos
      .filter((utxo) => !utxo.token)
      .sort((a, b) => (a.satoshis === b.satoshis ? 0 : a.satoshis > b.satoshis ? -1 : 1));
    let available = selectedTokens.reduce((sum, utxo) => sum + utxo.satoshis, 0n);
    for (const utxo of bchCandidates) {
      if (available >= 3000n) break;
      selectedBch.push(utxo);
      available += utxo.satoshis;
    }
    if (available < 2600n) {
      return fail(
        'INSUFFICIENT_AGENT_BALANCE',
        'The agent hot wallet needs BCH for the service output and miner fees. Pre-fund it with at least 20,000 sats.',
        { lastTxid: claimTxid ?? undefined },
      );
    }

    const builder = new TransactionBuilder({ provider, maximumFeeSatsPerByte: 5 });
    builder.addInputs(selectedTokens, signer.unlockP2PKH());
    builder.addInputs(selectedBch, signer.unlockP2PKH());
    builder.addOutput({
      to: config.serviceAddress,
      amount: MIN_TOKEN_SATOSHIS,
      token: { amount: BigInt(config.servicePrice), category: config.category },
    });
    if (agentTokenAmount > BigInt(config.servicePrice)) {
      builder.addTokenChangeOutputIfNeeded({ category: config.category, to: agentTokenAddr });
    }
    builder.addBchChangeOutputIfNeeded({ to: agentAddr, feeRate: 2 });
    builder.addOpReturnOutput([`SV1:${requestId}`]);
    const paymentHex = builder.build();
    serviceTxid = await provider.sendRawTransaction(paymentHex);

    const verified = await verifyServicePayment(serviceTxid, requestId, config);
    const afterVault = await getVaultState(params, config.network);
    const afterAgent = await provider.getUtxos(agentAddr);
    const afterToken = filterTokenUtxos(afterAgent, config.category);
    const afterFirst = afterVault.tokenUtxos[0];
    let nextClaimBlock: number | null = null;
    if (afterFirst) {
      try {
        nextClaimBlock = (await vaultAge(provider, afterFirst, config.periodBlocks)).nextClaimBlock;
      } catch {
        nextClaimBlock = null;
      }
    }
    return {
      ok: true,
      requestId,
      claimTxid,
      paymentTxid: serviceTxid,
      confirmed: verified.verification.confirmed,
      service: {
        blockHeight: verified.blockHeight,
        feeSats: verified.feeSats,
        message: 'Payment verified on-chain. The service returned a BCH network insight.',
      },
      vault: vaultState(contract.address, afterVault, nextClaimBlock, config),
      agent: {
        address: agentAddr,
        tokenAmount: Number(sumTokenAmount(afterToken)),
        bchSatoshis: Number(sumSatoshis(afterAgent)),
      },
    };
  } catch (e) {
    const message = (e as Error).message;
    const code: AgentErrorCode = /Fee|fee|BCH|insufficient/i.test(message)
      ? 'INSUFFICIENT_AGENT_BALANCE'
      : /category/i.test(message)
        ? 'WRONG_CATEGORY'
        : 'PAYMENT_FAILED';
    return fail(code, message, {
      lastTxid: serviceTxid ?? claimTxid ?? undefined,
    });
  }
}

export async function getServiceInsight(
  requestId: unknown,
  txid: unknown,
): Promise<
  | { ok: true; requestId: string; paymentTxid: string; service: { blockHeight: number; feeSats: number; message: string }; verification: ServiceVerification }
  | { ok: false; code: AgentErrorCode; message: string }
> {
  const config = readAgentConfig();
  try {
    assertConfig(config, false);
    if (typeof requestId !== 'string') throw new InvalidRequestError('requestId is required.');
    const rid = validateRequestId(requestId);
    if (typeof txid !== 'string' || !/^[0-9a-fA-F]{64}$/.test(txid)) {
      throw new Error('PAYMENT_NOT_FOUND');
    }
    const verified = await verifyServicePayment(txid, rid, config);
    return {
      ok: true,
      requestId: rid,
      paymentTxid: txid,
      service: {
        blockHeight: verified.blockHeight,
        feeSats: verified.feeSats,
        message: 'Payment verified on-chain. The service returned a BCH network insight.',
      },
      verification: verified.verification,
    };
  } catch (e) {
    const message = (e as Error).message;
    const code: AgentErrorCode =
      message === 'AGENT_DISABLED'
        ? 'AGENT_DISABLED'
        : e instanceof InvalidRequestError
        ? 'INVALID_REQUEST'
        : message === 'PAYMENT_NOT_FOUND' || message.startsWith('PAYMENT_NOT_FOUND')
        ? 'PAYMENT_NOT_FOUND'
        : message === 'WRONG_AMOUNT'
          ? 'WRONG_AMOUNT'
          : message === 'WRONG_DESTINATION'
            ? 'WRONG_DESTINATION'
            : message === 'WRONG_CATEGORY'
              ? 'WRONG_CATEGORY'
              : message === 'REQUEST_ID_MISMATCH'
                ? 'REQUEST_ID_MISMATCH'
                : 'SERVER_ERROR';
    return { ok: false, code, message };
  }
}

export function requestIp(req: any): string {
  return clientIp(req);
}
