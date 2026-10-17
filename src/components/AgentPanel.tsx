import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ExternalLink,
  FastForward,
  Play,
  RefreshCw,
  ShieldCheck,
  Wallet,
  Zap,
} from 'lucide-react';
import { hexToBin, publicKeyToP2pkhLockingBytecode } from '@bitauth/libauth';
import type {
  AgentRunResponse,
  AgentStatus,
  AppMode,
  LedgerEntry,
  NetworkType,
  WalletState,
} from '../types';
import { useWallet } from '../wallet/WalletProvider';
import {
  AGENT_PERIOD_BLOCKS,
  AGENT_PER_PERIOD_BASE_UNITS,
  AGENT_SERVICE_PRICE_BASE_UNITS,
  cancelAgentBudget,
  createAgentBudget,
  runAgentRequest,
  type AgentSimState,
} from '../lib/agent-sim';
import {
  buildCancelWcObject,
  buildFundWcObject,
  buildTopUpWcObject,
  filterTokenUtxos,
  fundInputPaths,
  getVaultState,
  makeContract,
  makeProvider,
  selectTokenUtxos,
  TOP_UP_INPUT_PATHS,
  tokenAddressForPublicKey,
} from '../lib/chain';
import { PUSD_CATEGORY } from '../lib/constants';
import { pusdToDisplay, shortAddress } from '../lib/format';
import { makeLiveLedgerEntry } from '../lib/ledger';
import { TxLedger } from './TxLedger';

interface AgentPanelProps {
  mode: AppMode;
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const LIVE_DEMO_PAYER_PUBKEY = String(import.meta.env.VITE_AGENT_DEMO_PAYER_PUBKEY ?? '').trim();

function liveEntry(
  type: LedgerEntry['type'],
  amount: number,
  remaining: number,
  txid: string,
  network: NetworkType,
  blockHeight: number,
  source: 'wallet' | 'agent',
  confirmed: boolean,
): LedgerEntry {
  return makeLiveLedgerEntry({ type, amount, remaining, txid, network, blockHeight, source, confirmed });
}

export const AgentPanel: React.FC<AgentPanelProps> = ({ mode, network, setNetwork }) => {
  const walletCtx = useWallet();
  const wallet = walletCtx.wallet;
  const payerPubkey = wallet.payerPubkey ?? LIVE_DEMO_PAYER_PUBKEY;
  const usingDemoPayer = !wallet.payerPubkey && Boolean(LIVE_DEMO_PAYER_PUBKEY);
  const [agent, setAgent] = useState<AgentSimState | null>(null);
  const [liveStatus, setLiveStatus] = useState<AgentStatus | null>(null);
  const [liveLedger, setLiveLedger] = useState<LedgerEntry[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const note = useCallback((message: string) => {
    setMessages((prev) => [`${new Date().toLocaleTimeString()}  ${message}`, ...prev].slice(0, 12));
  }, []);

  const refreshLive = useCallback(async () => {
    if (!payerPubkey) return;
    try {
      const res = await fetch(`/api/agent/status?payerPubkey=${encodeURIComponent(payerPubkey)}`);
      const body = (await res.json()) as AgentStatus & { message?: string };
      if (!res.ok) {
        throw new Error(
          body.message === 'AGENT_DISABLED'
            ? 'Live agent demo is disabled on this deployment. Use Sandbox or enable AGENT_ENABLED.'
            : body.message || 'Agent status unavailable.',
        );
      }
      setLiveStatus(body);
      setError(null);
      if (body.network && body.network !== network) setNetwork(body.network);
    } catch (e) {
      setLiveStatus(null);
      setError(
        `${(e as Error).message} The live Agent API is served by the Vercel deployment; use Sandbox for the local-only demo.`,
      );
    }
  }, [payerPubkey, network, setNetwork]);

  useEffect(() => {
    if (mode === 'LIVE') refreshLive();
  }, [mode, refreshLive]);

  const launchSandbox = () => {
    setAgent(createAgentBudget(network));
    setLiveLedger([]);
    setError(null);
    note('Agent budget launched: 2.00 PUSD vault, 0.10 PUSD per 2 blocks, 0.01 PUSD per service call.');
  };

  const fundLive = async () => {
    if (!liveStatus || !wallet.payerPubkey || !wallet.payerAddress) {
      setError('Connect a wallet and load the agent status first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const contract = makeContract(
        {
          payerPk: hexToBin(wallet.payerPubkey),
          payeePk: hexToBin(liveStatus.agentPubkey),
          amountPerPeriod: liveStatus.vault.amountPerPeriod,
          periodBlocks: liveStatus.vault.periodBlocks,
          category: liveStatus.category,
        },
        makeProvider(network),
      );
      const deposit = BigInt(liveStatus.vault.amountPerPeriod) * 20n;
      const prefix = network === 'mainnet' ? 'bitcoincash' : 'bchtest';
      const walletTokenAddress = tokenAddressForPublicKey(hexToBin(wallet.payerPubkey), prefix);
      const walletUtxos = await contract.provider.getUtxos(walletTokenAddress);
      const { selected } = selectTokenUtxos(walletUtxos, deposit, liveStatus.category);
      const object = buildFundWcObject({
        contract,
        walletAddress: wallet.payerAddress,
        walletTokenAddress,
        walletUtxos: selected,
        deposit,
        category: liveStatus.category,
      });
      const result = await walletCtx.signAndBroadcast(
        object,
        fundInputPaths(selected.length),
        'StreamVault: fund agent budget',
      );
      note(`Agent vault funded. ${result.txid}`);
      setLiveLedger((prev) => [
        liveEntry('FUND', Number(deposit), Number(deposit), result.txid, network, 0, 'wallet', false),
        ...prev,
      ]);
      await refreshLive();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const runLiveOnce = useCallback(async (): Promise<AgentRunResponse | null> => {
    if (!payerPubkey) {
      setError('No payer public key is available for the live agent.');
      return null;
    }
    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payerPubkey,
          requestId: crypto.randomUUID(),
        }),
      });
      const body = (await res.json()) as AgentRunResponse;
      if (!body.ok) {
        setError(body.message);
        note(`${body.code}: ${body.message}`);
        await refreshLive();
        return body;
      }
      setError(null);
      const claimAmount = liveStatus?.vault.amountPerPeriod ?? AGENT_PER_PERIOD_BASE_UNITS;
      const servicePrice = liveStatus?.servicePrice ?? AGENT_SERVICE_PRICE_BASE_UNITS;
      const nextEntries: LedgerEntry[] = [];
      if (body.claimTxid) {
        nextEntries.push(
          liveEntry(
            'CLAIM',
            claimAmount,
            body.vault.tokenAmount,
            body.claimTxid,
            network,
            body.service.blockHeight,
            'agent',
            body.confirmed,
          ),
        );
      }
      nextEntries.push(
        liveEntry(
          'PAYMENT',
          servicePrice,
          body.agent.tokenAmount,
          body.paymentTxid,
          network,
          body.service.blockHeight,
          'agent',
          body.confirmed,
        ),
      );
      setLiveLedger((prev) => [...nextEntries, ...prev]);
      setLiveStatus((prev) =>
        prev ? { ...prev, vault: body.vault, agent: body.agent } : prev,
      );
      note(
        `Service verified: ${body.service.message} payment=${body.paymentTxid.slice(0, 14)}...${
          body.confirmed ? '' : ' (0-conf)'
        }`,
      );
      return body;
    } catch (e) {
      const message = (e as Error).message;
      setError(message);
      note(message);
      return null;
    }
  }, [payerPubkey, liveStatus, network, refreshLive, note]);

  const topUpLive = async () => {
    if (!liveStatus || !wallet.payerPubkey || !wallet.payerAddress) {
      setError('Connect a wallet and load the agent status first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const params = {
        payerPk: hexToBin(wallet.payerPubkey),
        payeePk: hexToBin(liveStatus.agentPubkey),
        amountPerPeriod: liveStatus.vault.amountPerPeriod,
        periodBlocks: liveStatus.vault.periodBlocks,
        category: liveStatus.category,
      };
      const contract = makeContract(params, makeProvider(network));
      const vault = await getVaultState(params, network);
      if (vault.tokenUtxos.length !== 1) {
        throw new Error('Expected exactly one PUSD agent vault UTXO before topping up.');
      }
      const prefix = network === 'mainnet' ? 'bitcoincash' : 'bchtest';
      const walletTokenAddress = tokenAddressForPublicKey(hexToBin(wallet.payerPubkey), prefix);
      const walletUtxos = await contract.provider.getUtxos(walletTokenAddress);
      const tokenUtxos = filterTokenUtxos(walletUtxos, liveStatus.category).sort((a, b) =>
        a.token!.amount === b.token!.amount ? 0 : a.token!.amount > b.token!.amount ? 1 : -1,
      );
      const walletUtxo = tokenUtxos[0];
      if (!walletUtxo?.token) throw new Error('No PUSD UTXO is available in the connected wallet.');
      const object = buildTopUpWcObject({
        contract,
        vaultUtxo: vault.tokenUtxos[0],
        walletUtxo,
        walletAddress: wallet.payerAddress,
      });
      const result = await walletCtx.signAndBroadcast(object, TOP_UP_INPUT_PATHS, 'StreamVault: top up agent vault');
      note(`Agent vault topped up with ${walletUtxo.token.amount} base units. ${result.txid}`);
      setLiveLedger((prev) => [
        liveEntry(
          'FUND',
          Number(walletUtxo.token!.amount),
          Number(vault.tokenAmount) + Number(walletUtxo.token!.amount),
          result.txid,
          network,
          0,
          'wallet',
          false,
        ),
        ...prev,
      ]);
      await refreshLive();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const runSandboxOnce = () => {
    if (!agent) return;
    const result = runAgentRequest(agent);
    setAgent(result.state);
    note(result.message);
    if (!result.ok) {
      setError(
        result.code === 'BUDGET_EXHAUSTED'
          ? `This period's budget is used up. Next claim block: ${result.nextClaimBlock}.`
          : result.message,
      );
    } else {
      setError(null);
    }
  };

  const runOnce = async () => {
    if (mode === 'SANDBOX') {
      runSandboxOnce();
      return;
    }
    setBusy(true);
    try {
      await runLiveOnce();
    } finally {
      setBusy(false);
    }
  };

  const runUntilExhausted = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === 'SANDBOX') {
        if (!agent) return;
        let current = agent;
        for (let i = 0; i < 12; i += 1) {
          const result = runAgentRequest(current);
          current = result.state;
          setAgent(current);
          note(result.message);
          if (!result.ok) {
            setError(
              result.code === 'BUDGET_EXHAUSTED'
                ? `This period's budget is used up. Next claim block: ${result.nextClaimBlock}.`
                : result.message,
            );
            break;
          }
          await delay(220);
        }
        return;
      }
      for (let i = 0; i < 12; i += 1) {
        const result = await runLiveOnce();
        if (!result || !result.ok) break;
        await delay(260);
      }
    } finally {
      setBusy(false);
    }
  };

  const cancelLive = async () => {
    if (!liveStatus || !wallet.payerPubkey || !wallet.payerAddress) {
      setError('Connect the payer wallet first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const contract = makeContract(
        {
          payerPk: hexToBin(wallet.payerPubkey),
          payeePk: hexToBin(liveStatus.agentPubkey),
          amountPerPeriod: liveStatus.vault.amountPerPeriod,
          periodBlocks: liveStatus.vault.periodBlocks,
          category: liveStatus.category,
        },
        makeProvider(network),
      );
      const vault = await getVaultState(
        {
          payerPk: hexToBin(wallet.payerPubkey),
          payeePk: hexToBin(liveStatus.agentPubkey),
          amountPerPeriod: liveStatus.vault.amountPerPeriod,
          periodBlocks: liveStatus.vault.periodBlocks,
          category: liveStatus.category,
        },
        network,
      );
      if (vault.tokenUtxos.length === 0) throw new Error('No PUSD vault UTXO found to cancel.');
      if (vault.tokenUtxos.length > 1) {
        throw new Error('Multiple vault UTXOs detected. This build cancels one UTXO at a time; consolidate first.');
      }
      const object = buildCancelWcObject({
        contract,
        utxo: vault.tokenUtxos[0],
        payerLockingBytecode: publicKeyToP2pkhLockingBytecode({ publicKey: hexToBin(wallet.payerPubkey) }),
        sequence: liveStatus.vault.periodBlocks,
      });
      const result = await walletCtx.signAndBroadcast(object, [[0, 'receive', 0]], 'StreamVault: cancel agent budget');
      note(`Payer cancelled the vault. ${result.txid}`);
      setLiveLedger((prev) => [
        liveEntry(
          'CANCEL',
          Number(vault.tokenAmount),
          0,
          result.txid,
          network,
          0,
          'wallet',
          false,
        ),
        ...prev,
      ]);
      await refreshLive();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (mode === 'SANDBOX') {
      if (!agent) return;
      const result = cancelAgentBudget(agent);
      setAgent(result.state);
      note(result.message);
      setError(null);
      return;
    }
    await cancelLive();
  };

  const fastForward = () => {
    if (!agent) return;
    setAgent({ ...agent, block: agent.block + agent.periodBlocks });
    note(`Sandbox clock advanced to block ${agent.block + agent.periodBlocks}.`);
  };

  const ledger = mode === 'SANDBOX' ? agent?.ledger ?? [] : liveLedger;
  const vaultRemaining =
    mode === 'SANDBOX' ? agent?.vaultRemaining ?? 0 : liveStatus?.vault.tokenAmount ?? 0;
  const agentBalance =
    mode === 'SANDBOX' ? agent?.agentBalance ?? 0 : liveStatus?.agent.tokenAmount ?? 0;
  const liveTracked = (liveStatus?.vault.tokenAmount ?? 0) + (liveStatus?.agent.tokenAmount ?? 0);
  const spent =
    mode === 'SANDBOX'
      ? agent?.spent ?? 0
      : liveTracked > 0
        ? Math.max(0, 200 - liveTracked)
        : 0;
  const nextClaim = mode === 'SANDBOX' ? agent?.nextClaimBlock : liveStatus?.vault.nextClaimBlock;
  const isLive = mode === 'LIVE';
  const canRun = isLive
    ? Boolean(liveStatus && liveStatus.vault.tokenAmount > 0)
    : Boolean(agent && !agent.cancelled);

  const stats = useMemo(
    () => [
      ['Vault', vaultRemaining, 'PUSD still locked'],
      ['Agent hot wallet', agentBalance, 'PUSD spendable now'],
      ['Spent', spent, 'PUSD paid to service'],
      ['Service price', mode === 'SANDBOX' ? agent?.servicePrice ?? 1 : liveStatus?.servicePrice ?? 1, 'per request'],
    ],
    [vaultRemaining, agentBalance, spent, mode, agent?.servicePrice, liveStatus?.servicePrice],
  );

  return (
    <div className="bg-[#0e1424] border border-slate-800 rounded-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-300">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Agent allowance</h2>
            <p className="text-xs text-slate-400">
              Give an AI a PUSD budget it cannot exceed per period. Pay a service per request.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="px-2 py-1 rounded border border-slate-700 text-slate-300">{mode}</span>
          <span className="px-2 py-1 rounded border border-emerald-700 text-emerald-300">{network}</span>
          <span className="px-2 py-1 rounded border border-slate-700 text-slate-400">
            {liveStatus?.category?.slice(0, 10) ?? PUSD_CATEGORY.slice(0, 10)}...
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(([label, value, detail]) => (
            <div key={String(label)} className="border border-slate-800 rounded-lg p-3 bg-slate-950/50">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
              <div className="mt-1 text-lg font-bold text-white">${pusdToDisplay(Number(value))}</div>
              <div className="text-[10px] text-slate-500">{detail}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isLive ? (
            <button
              onClick={launchSandbox}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#0AC18E] hover:bg-emerald-400 text-black transition"
            >
              <Zap className="w-3.5 h-3.5" />
              Launch agent budget
            </button>
          ) : (
            <button
              onClick={fundLive}
              disabled={busy || !wallet.connected || !liveStatus || liveStatus.vault.tokenAmount > 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#0AC18E] hover:bg-emerald-400 text-black transition disabled:opacity-50"
            >
              <Wallet className="w-3.5 h-3.5" />
              Fund agent vault
            </button>
          )}
          {isLive && (
            <button
              onClick={topUpLive}
              disabled={busy || !wallet.connected || !liveStatus || liveStatus.vault.tokenAmount <= 0}
              title="Merges the smallest PUSD UTXO in the connected wallet into the agent vault."
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-500/90 hover:bg-indigo-400 text-white transition disabled:opacity-50"
            >
              <Wallet className="w-3.5 h-3.5" />
              Top up agent vault
            </button>
          )}
          {!isLive && (
            <button
              onClick={fastForward}
              disabled={!agent || busy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
            >
              <FastForward className="w-3.5 h-3.5 text-amber-400" />
              Fast-forward 1 period
            </button>
          )}
          <button
            onClick={runOnce}
            disabled={busy || !canRun}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-white transition disabled:opacity-50"
          >
            {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run paid request
          </button>
          <button
            onClick={runUntilExhausted}
            disabled={busy || !canRun}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            Run until budget exhausted
          </button>
          <button
            onClick={cancel}
            disabled={busy || (isLive ? !liveStatus || liveStatus.vault.tokenAmount <= 0 : !agent || agent.vaultRemaining <= 0)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition disabled:opacity-50"
          >
            Cancel &amp; reclaim
          </button>
          {isLive && (
            <button
              onClick={refreshLive}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh live status
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 border border-amber-800/60 bg-amber-950/20 rounded-lg p-3 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">{error}</div>
              {nextClaim ? <div className="mt-1 text-amber-300/80">Next claim block: {nextClaim}</div> : null}
            </div>
          </div>
        )}

        {isLive && !wallet.connected && (
          <div className="flex items-center gap-2 border border-slate-800 rounded-lg p-3 text-xs text-slate-300">
            <Wallet className="w-4 h-4 text-emerald-400" />
            {usingDemoPayer
              ? 'Demo vault payer loaded. Connect a wallet to fund, top up, or cancel.'
              : 'Connect a wallet to read the live agent vault and fund it.'}
          </div>
        )}

        {isLive && liveStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="border border-slate-800 rounded-lg p-3">
              <div className="text-slate-500">Agent address</div>
              <div className="font-mono text-emerald-300 mt-1 break-all">{shortAddress(liveStatus.agent.address)}</div>
            </div>
            <div className="border border-slate-800 rounded-lg p-3">
              <div className="text-slate-500">Vault address</div>
              <div className="font-mono text-slate-300 mt-1 break-all">{shortAddress(liveStatus.vault.address)}</div>
            </div>
            <div className="border border-slate-800 rounded-lg p-3">
              <div className="text-slate-500">Next claim</div>
              <div className="font-mono text-amber-300 mt-1">
                {liveStatus.vault.nextClaimBlock
                  ? `block ${liveStatus.vault.nextClaimBlock}`
                  : liveStatus.vault.tokenAmount > 0
                    ? 'available now'
                    : 'no active vault'}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-slate-800 rounded-lg p-3 bg-slate-950/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Service verification log
              </span>
              <span className="text-[10px] font-mono text-slate-600">{messages.length} events</span>
            </div>
            <div className="h-36 overflow-y-auto font-mono text-[10px] space-y-1 text-slate-400">
              {messages.length === 0 ? (
                <div className="text-slate-600 italic">Run a paid request to see the verification result.</div>
              ) : (
                messages.map((message, index) => (
                  <div key={`${index}-${message}`} className="flex gap-2">
                    <span className="text-slate-600 shrink-0">›</span>
                    <span className="break-all">{message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="border border-slate-800 rounded-lg p-3 bg-slate-950/50">
            <div className="text-xs font-semibold text-slate-300 mb-2">What the agent pays for</div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between gap-3"><span>Service</span><span className="text-slate-200 text-right">BCH network insight</span></div>
              <div className="flex justify-between gap-3"><span>Price</span><span className="text-emerald-300 text-right">$0.01 PUSD</span></div>
              <div className="flex justify-between gap-3"><span>Request binding</span><span className="font-mono text-slate-300 text-right">SV1:&lt;requestId&gt;</span></div>
              <div className="flex justify-between gap-3"><span>Verification</span><span className="text-slate-300 text-right">amount + destination + category + OP_RETURN</span></div>
            </div>
            <div className="mt-3 text-[10px] text-slate-500">
              The covenant guarantees the per-period tranche. The service verifies the per-request price and request id.
            </div>
          </div>
        </div>

        <TxLedger entries={ledger} network={network} />
      </div>
    </div>
  );
};
