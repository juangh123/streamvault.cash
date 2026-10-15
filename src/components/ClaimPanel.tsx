import React, { useEffect, useState } from 'react';
import { HandCoins, Lock, Hourglass } from 'lucide-react';
import { StreamConfig } from '../types';
import { blocksToHuman, pusdToDisplay, shortAddress } from '../lib/format';
import { blocksUntilClaim } from '../lib/stream';

interface ClaimPanelProps {
  stream: StreamConfig | null;
  block: number;
  onClaim: (amount: number) => void;
}

export const ClaimPanel: React.FC<ClaimPanelProps> = ({ stream, block, onClaim }) => {
  const [amountUsd, setAmountUsd] = useState('');

  useEffect(() => {
    if (stream) setAmountUsd(pusdToDisplay(stream.amountPerPeriod));
  }, [stream?.id, stream?.amountPerPeriod]);

  if (!stream) {
    return (
      <div className="bg-[#0e1424] border border-slate-800 rounded-lg p-5 flex flex-col items-center justify-center text-center min-h-[240px]">
        <Lock className="w-6 h-6 text-slate-600 mb-2" />
        <p className="text-xs text-slate-500">No active stream. Create one to enable payee claims.</p>
      </div>
    );
  }

  const wait = blocksUntilClaim(stream, block);
  const eligible = wait === 0 && stream.remaining > 0;
  const progress = stream.deposited > 0 ? Math.min(100, (stream.claimed / stream.deposited) * 100) : 0;

  return (
    <div className="bg-[#0e1424] border border-slate-800 rounded-lg p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <HandCoins className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white">Payee - Claim Tranche</h2>
        </div>
        <span className="text-[10px] font-mono text-slate-400">block #{block}</span>
      </div>

      <div className="mb-4">
        <div className="flex items-end justify-between mb-1">
          <span className="text-xs text-slate-400">Streamed</span>
          <span className="text-xs font-mono text-slate-300">
            ${pusdToDisplay(stream.claimed)} / ${pusdToDisplay(stream.deposited)}
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#0AC18E] to-emerald-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 mt-1">
          <span>{stream.claimsCount} tranche(s) claimed</span>
          <span className="text-emerald-400">Vault: ${pusdToDisplay(stream.remaining)} PUSD</span>
        </div>
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 mb-3 text-xs space-y-1.5">
        <div className="flex justify-between">
          <span className="text-slate-500">Payee</span>
          <span className="font-mono text-slate-300">{shortAddress(stream.payeeAddress)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Per-period cap</span>
          <span className="text-emerald-400">${pusdToDisplay(stream.amountPerPeriod)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Next claim</span>
          {eligible ? (
            <span className="text-emerald-400 font-semibold">available now</span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400">
              <Hourglass className="w-3 h-3" />
              {wait} block(s) - ~{blocksToHuman(wait)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 flex-1">
          <span className="text-xs text-slate-500 mr-1">$</span>
          <input
            value={amountUsd}
            onChange={(e) => setAmountUsd(e.target.value)}
            inputMode="decimal"
            className="w-full bg-transparent text-xs text-white outline-none"
          />
        </div>
        <button
          onClick={() => {
            const amount = Math.round(parseFloat(amountUsd) * 100);
            if (amount > 0) onClaim(amount);
          }}
          disabled={!eligible}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${eligible ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
        >
          Claim
        </button>
      </div>
    </div>
  );
};