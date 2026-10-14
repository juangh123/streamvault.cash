import React, { useState } from 'react';
import { Shield, AlertOctagon, ArrowDownRight, Sliders, DollarSign, Lock, Copy, Check, Sparkles } from 'lucide-react';
import { VaultConfig } from '../types';
import { satsToBch, satsToUsd } from '../lib/bchSimulator';

interface VaultManagerProps {
  vault: VaultConfig;
  onUpdateMaxLimit: (limitSats: number) => void;
  onFundVault: (depositSats: number) => void;
  onEmergencySweep: () => void;
}

export const VaultManager: React.FC<VaultManagerProps> = ({
  vault,
  onUpdateMaxLimit,
  onFundVault,
  onEmergencySweep,
}) => {
  const [copied, setCopied] = useState(false);
  const [depositAmount, setDepositAmount] = useState('50000'); // 50,000 sats (~0.0005 BCH)
  const [showFundModal, setShowFundModal] = useState(false);
  const [showSweepConfirm, setShowSweepConfirm] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(vault.vaultAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0e1424] border border-gray-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#0AC18E]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#0AC18E]/10 border border-[#0AC18E]/20 text-[#0AC18E]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Non-Custodial Vault Cockpit
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800">
                CashScript Active
              </span>
            </h2>
            <p className="text-xs text-gray-400">Deterministic UTXO Covenants state machine</p>
          </div>
        </div>

        {/* Emergency Sweep Trigger */}
        <button
          onClick={() => setShowSweepConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-950/80 hover:bg-rose-900 text-rose-400 border border-rose-700/60 transition shadow-sm active:scale-95"
          title="Instantly clawback 100% of remaining funds to human owner address"
        >
          <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          <span>Emergency Sweep</span>
        </button>
      </div>

      {/* Balance & Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {/* Balance Card */}
        <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Vault Available Balance</span>
            <Lock className="w-3.5 h-3.5 text-[#0AC18E]" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white flex items-baseline gap-1.5">
              <span>{vault.balanceSats.toLocaleString()}</span>
              <span className="text-xs font-semibold text-[#0AC18E]">sats</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
              <span>{satsToBch(vault.balanceSats)} BCH</span>
              <span>•</span>
              <span className="text-emerald-400">{satsToUsd(vault.balanceSats)}</span>
            </div>
          </div>
        </div>

        {/* Max Per Tx Policy */}
        <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Per-Tx Spending Ceiling</span>
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white flex items-baseline gap-1.5">
              <span>{vault.maxPerTxSats.toLocaleString()}</span>
              <span className="text-xs font-semibold text-blue-400">sats/tx</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              Hard limit: <span className="text-blue-400">{satsToUsd(vault.maxPerTxSats)}</span> max per call
            </div>
          </div>
        </div>

        {/* Total Spent / Transactions */}
        <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Autonomous Activity</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white flex items-baseline gap-1.5">
              <span>{vault.totalSpentSats.toLocaleString()}</span>
              <span className="text-xs font-semibold text-purple-400">sats paid</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              <span>{vault.totalTxs} micro-transactions completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vault Address & Contract Details */}
      <div className="bg-gray-950/70 border border-gray-800/80 rounded-xl p-3 mb-5 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-gray-500 font-mono shrink-0">Covenant Address:</span>
            <span className="text-emerald-300 font-mono truncate">{vault.vaultAddress}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition px-2 py-0.5 bg-gray-800 rounded border border-gray-700"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={() => setShowFundModal(true)}
              className="flex items-center gap-1 text-[11px] font-bold text-black bg-[#0AC18E] hover:bg-emerald-400 transition px-2.5 py-0.5 rounded shadow"
            >
              <ArrowDownRight className="w-3 h-3" />
              <span>Deposit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Policy Slider */}
      <div className="bg-gray-900/60 border border-gray-800/70 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#0AC18E]" />
            Adjust Agent Single-Tx Ceiling (maxPerTx):
          </label>
          <span className="text-xs font-mono font-bold text-[#0AC18E]">
            {vault.maxPerTxSats} sats ({satsToUsd(vault.maxPerTxSats)})
          </span>
        </div>
        <input
          type="range"
          min="546"
          max="5000"
          step="50"
          value={vault.maxPerTxSats}
          onChange={(e) => onUpdateMaxLimit(Number(e.target.value))}
          className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#0AC18E]"
        />
        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
          <span>Min: 546 sats (Dust Floor)</span>
          <span>Recommended: 1,000 sats</span>
          <span>Max: 5,000 sats (~$0.016)</span>
        </div>
      </div>

      {/* Deposit Modal */}
      {showFundModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-[#0AC18E]" />
              Fund Agent Vault
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Simulate or broadcast a deposit from your human owner wallet into the CashScript covenant.
            </p>
            <div className="mb-4">
              <label className="block text-xs text-gray-300 mb-1">Deposit Amount (Satoshis):</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#0AC18E]"
              />
              <div className="text-[11px] text-emerald-400 mt-1">
                ≈ {satsToBch(Number(depositAmount) || 0)} BCH ({satsToUsd(Number(depositAmount) || 0)})
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowFundModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onFundVault(Number(depositAmount) || 0);
                  setShowFundModal(false);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#0AC18E] text-black hover:bg-emerald-400"
              >
                Confirm Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Sweep Confirm Modal */}
      {showSweepConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-rose-800/80 rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-700/60">
                <AlertOctagon className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Trigger Sovereign Emergency Sweep?</h3>
                <p className="text-xs text-gray-400">100% On-Chain Human Clawback</p>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed mb-4 bg-gray-950 p-3 rounded-xl border border-gray-800">
              This initiates the CashScript <code className="text-rose-400">reclaim(ownerSig)</code> function.
              All remaining <span className="text-white font-bold">{vault.balanceSats.toLocaleString()} satoshis</span> will be
              immediately swept back to your human master wallet address:
              <br />
              <span className="text-emerald-400 font-mono text-[10px] break-all">{vault.ownerAddress}</span>.
              <br />
              <span className="text-gray-400 text-[11px] mt-1 block">
                The AI Agent will instantly lose all spending capability.
              </span>
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSweepConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onEmergencySweep();
                  setShowSweepConfirm(false);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30"
              >
                Execute Sweep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
