import React, { useState } from 'react';
import { Landmark, Plus, AlertOctagon, Copy, Check } from 'lucide-react';
import { AppMode, StreamConfig } from '../types';
import { blocksToHuman, pusdToDisplay, shortAddress } from '../lib/format';

interface StreamControlsProps {
  stream: StreamConfig | null;
  mode: AppMode;
  connectedAddress: string | null;
  onCreate: (input: {
    label: string;
    payerAddress: string;
    payeeAddress: string;
    amountPerPeriod: number;
    periodBlocks: number;
    deposit: number;
  }) => void;
  onTopUp: (amount: number) => void;
  onCancel: () => void;
}

export const StreamControls: React.FC<StreamControlsProps> = ({
  stream,
  mode,
  connectedAddress,
  onCreate,
  onTopUp,
  onCancel,
}) => {
  const [label, setLabel] = useState('Design retainer - Q4');
  const [payerAddress, setPayerAddress] = useState('bchtest:zq0payer9k4x7m2p8s5v1n3d6t9r4w7y2u5c8b');
  const [payeeAddress, setPayeeAddress] = useState('bchtest:zz0payee4d8f2g6h1j5k9l3m7n2p6q1r5s9t4v');
  const [perPeriodUsd, setPerPeriodUsd] = useState('25');
  const [periodBlocks, setPeriodBlocks] = useState('144');
  const [depositUsd, setDepositUsd] = useState('1000');
  const [topUpUsd, setTopUpUsd] = useState('250');
  const [copied, setCopied] = useState(false);

  const copyVault = () => {
    if (!stream) return;
    navigator.clipboard?.writeText(stream.vaultAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const submit = () => {
    const amountPerPeriod = Math.round(parseFloat(perPeriodUsd) * 100);
    const deposit = Math.round(parseFloat(depositUsd) * 100);
    const blocks = Math.max(1, parseInt(periodBlocks, 10) || 1);
    if (!(amountPerPeriod > 0) || !(deposit > 0)) return;
    onCreate({
      label: label.trim() || 'Untitled stream',
      payerAddress: mode === 'LIVE' && connectedAddress ? connectedAddress : payerAddress.trim(),
      payeeAddress: payeeAddress.trim(),
      amountPerPeriod,
      periodBlocks: blocks,
      deposit,
    });
  };

  if (stream) {
    return (
      <div className="bg-[#0e1424] border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#0AC18E]" />
            <h2 className="text-sm font-bold text-white">Payer - Stream Policy</h2>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-semibold">
            {mode === 'SANDBOX' ? 'Sandbox policy' : 'Live policy'}
          </span>
        </div>

        <p className="text-xs text-slate-300 mb-3">{stream.label}</p>

        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 mb-3 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Payer</span>
            <span className="font-mono text-slate-300">{shortAddress(stream.payerAddress)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Payee</span>
            <span className="font-mono text-slate-300">{shortAddress(stream.payeeAddress)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Per period</span>
            <span className="text-emerald-400 font-semibold">${pusdToDisplay(stream.amountPerPeriod)} / {blocksToHuman(stream.periodBlocks)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Vault</span>
            <button onClick={copyVault} className="flex items-center gap-1 font-mono text-slate-300 hover:text-white">
              {shortAddress(stream.vaultAddress)}
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={topUpUsd}
            onChange={(e) => setTopUpUsd(e.target.value)}
            inputMode="decimal"
            className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#0AC18E]"
          />
          {mode === 'SANDBOX' && (
            <button
              onClick={() => {
                const amount = Math.round(parseFloat(topUpUsd) * 100);
                if (amount > 0) onTopUp(amount);
              }}
              title="Sandbox top-up: merges PUSD and resets the relative clock, matching the topUp covenant."
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Top up PUSD (sandbox)</span>
            </button>
          )}
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition ml-auto"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Cancel &amp; reclaim</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0e1424] border border-slate-800 rounded-lg p-5">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
        <Landmark className="w-4 h-4 text-[#0AC18E]" />
        <h2 className="text-sm font-bold text-white">Payer - Create Stream</h2>
      </div>

      <div className="space-y-3 text-xs">
        <label className="block">
          <span className="text-slate-400">Label</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-[#0AC18E]" />
        </label>
        <label className="block">
          <span className="text-slate-400">Payer address {mode === 'LIVE' && connectedAddress ? '(connected wallet)' : ''}</span>
          <input
            value={mode === 'LIVE' && connectedAddress ? connectedAddress : payerAddress}
            onChange={(e) => setPayerAddress(e.target.value)}
            disabled={mode === 'LIVE' && !!connectedAddress}
            className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono outline-none focus:border-[#0AC18E] disabled:opacity-60"
          />
        </label>
        <label className="block">
          <span className="text-slate-400">Payee address</span>
          <input value={payeeAddress} onChange={(e) => setPayeeAddress(e.target.value)} className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono outline-none focus:border-[#0AC18E]" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-slate-400">Per period (USD)</span>
            <input value={perPeriodUsd} onChange={(e) => setPerPeriodUsd(e.target.value)} inputMode="decimal" className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-[#0AC18E]" />
          </label>
          <label className="block">
            <span className="text-slate-400">Period (blocks)</span>
            <input value={periodBlocks} onChange={(e) => setPeriodBlocks(e.target.value)} inputMode="numeric" className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-[#0AC18E]" />
          </label>
        </div>
        <div className="text-[11px] text-amber-400/90">~{blocksToHuman(Math.max(1, parseInt(periodBlocks, 10) || 1))} per claim</div>
        <label className="block">
          <span className="text-slate-400">Initial deposit (USD)</span>
          <input value={depositUsd} onChange={(e) => setDepositUsd(e.target.value)} inputMode="decimal" className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-[#0AC18E]" />
        </label>
        <button onClick={submit} className="w-full mt-1 py-2 rounded-lg text-xs font-bold bg-[#0AC18E] hover:bg-emerald-400 text-black transition">
          Fund vault &amp; start stream
        </button>
      </div>
    </div>
  );
};
