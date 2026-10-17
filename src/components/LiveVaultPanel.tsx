import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  ExternalLink,
  Landmark,
  RefreshCw,
  Undo2,
  Wallet,
} from 'lucide-react';
import { hexToBin, publicKeyToP2pkhLockingBytecode } from '@bitauth/libauth';
import type { LedgerEntry, NetworkType } from '../types';
import { useWallet } from '../wallet/WalletProvider';
import {
  buildCancelWcObject,
  buildClaimWcObject,
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
  withTimeout,
  type VaultState,
} from '../lib/chain';
import { PUSD_CATEGORY } from '../lib/constants';
import { blocksToHuman, pusdToDisplay, shortAddress } from '../lib/format';
import { makeLiveLedgerEntry } from '../lib/ledger';
import { TxLedger } from './TxLedger';

interface LiveVaultPanelProps {
  network: NetworkType;
}

interface NextClaim {
  block: number;
  blocksRemaining: number;
  confirmed: boolean;
}

export const LiveVaultPanel: React.FC<LiveVaultPanelProps> = ({ network }) => {
  const walletCtx = useWallet();
  const wallet = walletCtx.wallet;
  const [perPeriodUsd, setPerPeriodUsd] = useState('0.10');
  const [periodBlocks, setPeriodBlocks] = useState('2');
  const [depositUsd, setDepositUsd] = useState('2.00');
  const [claimUsd, setClaimUsd] = useState('0.10');
  const [vault, setVault] = useState<VaultState | null>(null);
  const [nextClaim, setNextClaim] = useState<NextClaim | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const params = useMemo(() => {
    const amountPerPeriod = Math.round(parseFloat(perPeriodUsd) * 100);
    const blocks = Math.max(1, parseInt(periodBlocks, 10) || 1);
    const deposit = Math.round(parseFloat(depositUsd) * 100);
    return { amountPerPeriod, periodBlocks: blocks, deposit };
  }, [perPeriodUsd, periodBlocks, depositUsd]);

  const contractParams = useMemo(() => {
    if (!wallet.payerPubkey || !wallet.payeePubkey) return null;
    return {
      payerPk: hexToBin(wallet.payerPubkey),
      payeePk: hexToBin(wallet.payeePubkey),
      amountPerPeriod: params.amountPerPeriod,
      periodBlocks: params.periodBlocks,
      category: PUSD_CATEGORY,
    };
  }, [wallet.payerPubkey, wallet.payeePubkey, params]);

  const contract = useMemo(() => {
    if (!contractParams) return null;
    try {
      return makeContract(contractParams, makeProvider(network));
    } catch {
      return null;
    }
  }, [contractParams, network]);

  const refreshVault = useCallback(async () => {
    if (!contractParams) {
      setVault(null);
      setNextClaim(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const state = await withTimeout(
        getVaultState(contractParams, network),
        15_000,
        'Electrum vault query timed out. Check the network and retry.',
      );
      setVault(state);
      setStatus(
        `${state.tokenUtxos.length} PUSD UTXO(s), ${pusdToDisplay(Number(state.tokenAmount))} PUSD, ${state.bchSatoshis} sats.`,
      );
      const utxo = state.tokenUtxos[0];
      if (!utxo) {
        setNextClaim(null);
        return;
      }
      try {
        const provider = makeProvider(network);
        const tip = await provider.getBlockHeight();
        const tx = (await provider.performRequest('blockchain.transaction.get', utxo.txid, true)) as {
          blockheight?: number;
        };
        const created = Number(tx.blockheight ?? 0);
        const confirmed = created > 0;
        const next = (confirmed ? created : tip) + params.periodBlocks;
        setNextClaim({ block: next, blocksRemaining: Math.max(0, next - tip), confirmed });
      } catch {
        setNextClaim(null);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [contractParams, network, params.periodBlocks]);

  useEffect(() => {
    if (contractParams) refreshVault();
  }, [contractParams, refreshVault]);

  const prefix = network === 'mainnet' ? 'bitcoincash' : 'bchtest';

  const requireWallet = () => {
    if (!wallet.connected || !wallet.payerPubkey || !wallet.payeePubkey) {
      throw new Error('Connect a wallet that exposes receive/0 and change/0 keys.');
    }
  };

  const fund = async () => {
    setBusy(true);
    setError(null);
    try {
      requireWallet();
      if (!contract || !contractParams || !wallet.payerAddress || !wallet.payerPubkey) {
        throw new Error('The vault contract is not ready.');
      }
      if (!(params.deposit > 0) || params.deposit <= params.amountPerPeriod) {
        throw new Error('Deposit must be greater than the per-period amount.');
      }
      const walletTokenAddress = tokenAddressForPublicKey(hexToBin(wallet.payerPubkey), prefix);
      const walletUtxos = await contract.provider.getUtxos(walletTokenAddress);
      const { selected } = selectTokenUtxos(walletUtxos, BigInt(params.deposit), PUSD_CATEGORY);
      const object = buildFundWcObject({
        contract,
        walletAddress: wallet.payerAddress,
        walletTokenAddress,
        walletUtxos: selected,
        deposit: BigInt(params.deposit),
        category: PUSD_CATEGORY,
      });
      const result = await walletCtx.signAndBroadcast(
        object,
        fundInputPaths(selected.length),
        'StreamVault: fund payroll vault',
      );
      setLedger((prev) => [
        makeLiveLedgerEntry({
          type: 'FUND',
          amount: params.deposit,
          remaining: params.deposit,
          txid: result.txid,
          network,
          source: 'wallet',
        }),
        ...prev,
      ]);
      setStatus(`Funding submitted: ${result.txid}`);
      await refreshVault();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const claim = async () => {
    setBusy(true);
    setError(null);
    try {
      requireWallet();
      if (!contract || !contractParams || !wallet.payeePubkey) throw new Error('The vault contract is not ready.');
      if (!vault || vault.tokenUtxos.length !== 1) {
        throw new Error('Expected exactly one PUSD vault UTXO. Consolidate or cancel extra UTXOs first.');
      }
      const amount = Math.round(parseFloat(claimUsd) * 100);
      if (!(amount > 0)) throw new Error('Claim amount must be greater than zero.');
      if (amount > params.amountPerPeriod) {
        throw new Error(`Claim amount exceeds the per-period cap (${params.amountPerPeriod} base units).`);
      }
      const object = buildClaimWcObject({
        contract,
        utxo: vault.tokenUtxos[0],
        payeeTokenAddress: tokenAddressForPublicKey(hexToBin(wallet.payeePubkey), prefix),
        amount,
        sequence: params.periodBlocks,
      });
      const result = await walletCtx.signAndBroadcast(object, [[0, 'change', 0]], 'StreamVault: claim tranche');
      setLedger((prev) => [
        makeLiveLedgerEntry({
          type: 'CLAIM',
          amount,
          remaining: Number(vault.tokenAmount) - amount,
          txid: result.txid,
          network,
          source: 'wallet',
        }),
        ...prev,
      ]);
      setStatus(`Claim submitted: ${result.txid}`);
      await refreshVault();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    setError(null);
    try {
      requireWallet();
      if (!contract || !contractParams || !wallet.payerPubkey) throw new Error('The vault contract is not ready.');
      if (!vault || vault.tokenUtxos.length !== 1) {
        throw new Error('Expected exactly one PUSD vault UTXO. This build cancels one UTXO at a time.');
      }
      const object = buildCancelWcObject({
        contract,
        utxo: vault.tokenUtxos[0],
        payerLockingBytecode: publicKeyToP2pkhLockingBytecode({ publicKey: hexToBin(wallet.payerPubkey) }),
        sequence: params.periodBlocks,
      });
      const result = await walletCtx.signAndBroadcast(object, [[0, 'receive', 0]], 'StreamVault: cancel stream');
      setLedger((prev) => [
        makeLiveLedgerEntry({
          type: 'CANCEL',
          amount: Number(vault.tokenAmount),
          remaining: 0,
          txid: result.txid,
          network,
          source: 'wallet',
        }),
        ...prev,
      ]);
      setStatus(`Cancel submitted: ${result.txid}`);
      await refreshVault();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const topUp = async () => {
    setBusy(true);
    setError(null);
    try {
      requireWallet();
      if (!contract || !wallet.payerPubkey || !wallet.payerAddress) throw new Error('The vault contract is not ready.');
      if (!vault || vault.tokenUtxos.length !== 1) {
        throw new Error('Expected exactly one PUSD vault UTXO before topping up.');
      }
      const walletTokenAddress = tokenAddressForPublicKey(hexToBin(wallet.payerPubkey), prefix);
      const walletUtxos = await contract.provider.getUtxos(walletTokenAddress);
      const tokenUtxos = filterTokenUtxos(walletUtxos, PUSD_CATEGORY).sort((a, b) =>
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
      const result = await walletCtx.signAndBroadcast(object, TOP_UP_INPUT_PATHS, 'StreamVault: top up vault');
      setLedger((prev) => [
        makeLiveLedgerEntry({
          type: 'FUND',
          amount: Number(walletUtxo.token!.amount),
          remaining: Number(vault.tokenAmount) + Number(walletUtxo.token!.amount),
          txid: result.txid,
          network,
          source: 'wallet',
        }),
        ...prev,
      ]);
      setStatus(`Top-up submitted: ${result.txid}`);
      await refreshVault();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const field = 'mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] outline-none focus:border-[#0AC18E]';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#0e1424] border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Live payroll vault</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{network}</span>
          </div>

          {!wallet.connected ? (
            <div className="flex items-start gap-2 border border-slate-800 rounded-lg p-3 text-xs text-slate-300">
              <Wallet className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              Connect a wallet from the header. The demo uses receive/0 as payer and change/0 as payee.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <label className="block">
                  <span className="text-slate-400">Per period (PUSD)</span>
                  <input value={perPeriodUsd} onChange={(e) => setPerPeriodUsd(e.target.value)} className={field} />
                </label>
                <label className="block">
                  <span className="text-slate-400">Period (blocks)</span>
                  <input value={periodBlocks} onChange={(e) => setPeriodBlocks(e.target.value)} className={field} />
                </label>
              </div>
              <label className="block mt-3 text-xs">
                <span className="text-slate-400">Initial deposit (PUSD)</span>
                <input value={depositUsd} onChange={(e) => setDepositUsd(e.target.value)} className={field} />
              </label>
              <div className="text-[11px] text-amber-400/90 mt-2">
                ~{blocksToHuman(params.periodBlocks)} per tranche. The covenant locks the vault for the first period.
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <button
                  onClick={fund}
                  disabled={busy || !contract || (vault?.tokenAmount ?? 0n) > 0n}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0AC18E] hover:bg-emerald-400 text-black transition disabled:opacity-50"
                >
                  Fund vault
                </button>
                <button
                  onClick={refreshVault}
                  disabled={busy || !contract}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={topUp}
                  disabled={busy || !vault || vault.tokenUtxos.length !== 1}
                  title="Merges the smallest PUSD UTXO in the connected wallet into the vault. The whole UTXO is merged."
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/90 hover:bg-indigo-400 text-white transition disabled:opacity-50"
                >
                  Top up (merge 1 UTXO)
                </button>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Top-up merges one wallet PUSD UTXO into the vault; its BCH also moves into the vault and the relative period restarts.
              </div>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-rose-950/40 border border-rose-800/50 rounded-lg p-2.5 text-rose-300 text-xs mt-3">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {status && <div className="text-[11px] text-blue-300 mt-3 break-all">{status}</div>}

          {contract && (
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Vault</span>
                <span className="font-mono text-emerald-400 break-all text-right">{contract.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PUSD locked</span>
                <span className="font-mono text-white">${pusdToDisplay(Number(vault?.tokenAmount ?? 0n))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">BCH buffer</span>
                <span className="font-mono text-slate-300">{Number(vault?.bchSatoshis ?? 0n)} sats</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vault UTXOs</span>
                <span className="font-mono text-slate-300">{vault?.tokenUtxos.length ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Next claim</span>
                <span className="font-mono text-amber-300">
                  {nextClaim
                    ? nextClaim.blocksRemaining > 0
                      ? `${nextClaim.blocksRemaining} block(s) - ~${blocksToHuman(nextClaim.blocksRemaining)}`
                      : 'available now'
                    : 'fund the vault first'}
                </span>
              </div>
              {vault && vault.extraUtxos.length > 0 && (
                <div className="text-[11px] text-amber-400/90">
                  {vault.extraUtxos.length} extra UTXO(s) at the vault address. Only PUSD-category UTXOs are counted.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-[#0e1424] border border-slate-800 rounded-lg p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
              <ArrowUpRight className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Payee claim</h2>
            </div>
            <div className="text-xs text-slate-500 mb-2">
              Payee key: {wallet.payeeAddress ? shortAddress(wallet.payeeAddress) : 'change/0 not available'}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 flex-1">
                <span className="text-xs text-slate-500 mr-1">$</span>
                <input
                  value={claimUsd}
                  onChange={(e) => setClaimUsd(e.target.value)}
                  inputMode="decimal"
                  className="w-full bg-transparent text-xs text-white outline-none"
                />
              </div>
              <button
                onClick={claim}
                disabled={busy || !vault || vault.tokenUtxos.length !== 1 || Boolean(nextClaim && nextClaim.blocksRemaining > 0)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-white transition disabled:opacity-50"
              >
                Claim
              </button>
            </div>
            <div className="text-[10px] text-slate-500 mt-2">
              Signed with change/0. The vault change returns to the same covenant and restarts the clock.
            </div>
          </div>

          <div className="bg-[#0e1424] border border-slate-800 rounded-lg p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
              <Undo2 className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-bold text-white">Payer cancel</h2>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Sweep the remaining PUSD back to the payer wallet. The payee key becomes powerless over this vault.
            </p>
            <button
              onClick={cancel}
              disabled={busy || !vault || vault.tokenUtxos.length !== 1}
              className="w-full py-2 rounded-lg text-xs font-bold bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition disabled:opacity-50"
            >
              Cancel &amp; reclaim
            </button>
          </div>
        </div>
      </div>

      <TxLedger entries={ledger} network={network} />

      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
        <ExternalLink className="w-3 h-3" />
        Explorer links appear in the ledger after a confirmed broadcast. This build cancels one vault UTXO at a time.
      </div>
    </div>
  );
};
