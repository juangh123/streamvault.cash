import React, { useState } from 'react';
import { Link2, Copy, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import { hexToBin } from '@bitauth/libauth';
import { deriveVaultAddresses, fetchVaultUtxos, type VaultAddresses } from '../lib/chain';
import type { NetworkType } from '../types';
import { DEFAULT_PERIOD_BLOCKS, PUSD_CATEGORY } from '../lib/covenant';
import { blocksToHuman } from '../lib/format';

interface LiveVaultPanelProps {
  network: NetworkType;
}

/**
 * LIVE-mode panel that derives the deterministic covenant address for a set of parameters and can
 * query the vault's live UTXOs through an Electrum provider. This is the on-ramp to real settlement:
 * the derived address is what a payer funds, and the UTXOs are what `claim`/`cancel` spend.
 */
export const LiveVaultPanel: React.FC<LiveVaultPanelProps> = ({ network }) => {
  const [payerPk, setPayerPk] = useState('');
  const [payeePk, setPayeePk] = useState('');
  const [perPeriodUsd, setPerPeriodUsd] = useState('25');
  const [periodBlocks, setPeriodBlocks] = useState(String(DEFAULT_PERIOD_BLOCKS));
  const [category, setCategory] = useState(PUSD_CATEGORY);
  const [derived, setDerived] = useState<VaultAddresses | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const params = () => {
    const payerPkBytes = hexToBin(payerPk.trim());
    const payeePkBytes = hexToBin(payeePk.trim());
    if (payerPkBytes.length !== 33 || payeePkBytes.length !== 33) {
      throw new Error('Both public keys must be 33-byte compressed hex.');
    }
    const amountPerPeriod = Math.round(parseFloat(perPeriodUsd) * 100);
    const blocks = Math.max(1, parseInt(periodBlocks, 10) || 1);
    return { payerPk: payerPkBytes, payeePk: payeePkBytes, amountPerPeriod, periodBlocks: blocks, category: category.trim() };
  };

  const derive = () => {
    try {
      setDerived(deriveVaultAddresses(params(), network));
      setError(null);
      setStatus(null);
    } catch (e) {
      setDerived(null);
      setError((e as Error).message);
    }
  };

  const queryUtxos = async () => {
    setBusy(true);
    setStatus('Querying the network...');
    try {
      const { utxos } = await fetchVaultUtxos(params(), network);
      const pusc = utxos.filter((u) => u.token).reduce((sum, u) => sum + Number(u.token!.amount), 0);
      setStatus(`${utxos.length} UTXO(s) at the vault - ${pusc} PUSD base units.`);
      setError(null);
    } catch (e) {
      setStatus(null);
      setError(`Network query failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const copy = () => {
    if (!derived) return;
    navigator.clipboard?.writeText(derived.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const field = 'mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] outline-none focus:border-[#0AC18E]';

  return (
    <div className="bg-[#0e1424] border border-slate-800 rounded-lg p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white">Live - Derive Covenant Address</h2>
        </div>
        <span className="text-[10px] font-mono text-slate-400">{network}</span>
      </div>

      <div className="space-y-3 text-xs">
        <label className="block">
          <span className="text-slate-400">Payer public key (33-byte hex)</span>
          <input value={payerPk} onChange={(e) => setPayerPk(e.target.value)} placeholder="02..." className={field} />
        </label>
        <label className="block">
          <span className="text-slate-400">Payee public key (33-byte hex)</span>
          <input value={payeePk} onChange={(e) => setPayeePk(e.target.value)} placeholder="03..." className={field} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-slate-400">Per period (USD)</span>
            <input value={perPeriodUsd} onChange={(e) => setPerPeriodUsd(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className="text-slate-400">Period (blocks)</span>
            <input value={periodBlocks} onChange={(e) => setPeriodBlocks(e.target.value)} className={field} />
          </label>
        </div>
        <label className="block">
          <span className="text-slate-400">PUSD category</span>
          <input value={category} onChange={(e) => setCategory(e.target.value)} className={field} />
        </label>

        <div className="flex items-center gap-2">
          <button onClick={derive} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition">Derive address</button>
          <button onClick={queryUtxos} disabled={busy || !derived} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
            <span>Fetch vault UTXOs</span>
          </button>
        </div>

        <div className="text-[11px] text-amber-400/90">~{blocksToHuman(Math.max(1, parseInt(periodBlocks, 10) || 1))} per tranche</div>

        {error && (
          <div className="flex items-start gap-2 bg-rose-950/40 border border-rose-800/50 rounded-lg p-2.5 text-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {status && <div className="text-[11px] text-blue-300">{status}</div>}

        {derived && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 space-y-2">
            <div>
              <div className="text-slate-500 text-[10px] mb-0.5">Covenant address</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-400 text-[11px] break-all flex-1">{derived.address}</span>
                <button onClick={copy} className="text-slate-400 hover:text-white shrink-0">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] mb-0.5">Token-aware address</div>
              <div className="font-mono text-slate-300 text-[11px] break-all">{derived.tokenAddress}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] mb-0.5">Locking bytecode</div>
              <div className="font-mono text-slate-400 text-[10px] break-all">{derived.lockingBytecode.slice(0, 72)}...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};