import React from 'react';
import { Layers, ShieldCheck, RefreshCcw, Lock, Cpu } from 'lucide-react';
import { LedgerEntry, StreamConfig } from '../types';
import { CONTRACT_BYTECODE_HEX, PUSD_CATEGORY } from '../lib/covenant';
import { pusdToDisplay, shortAddress } from '../lib/format';

interface CovenantVisualizerProps {
  stream: StreamConfig | null;
  lastEntry?: LedgerEntry;
}

export const CovenantVisualizer: React.FC<CovenantVisualizerProps> = ({ stream, lastEntry }) => {
  const remaining = stream ? stream.remaining : 0;
  const isLastClaim = Boolean(lastEntry && lastEntry.type === 'CLAIM');
  const canPreview = Boolean(stream && remaining > 0 && remaining > stream.amountPerPeriod);
  const inputAmount = isLastClaim
    ? (lastEntry!.amount + lastEntry!.remaining)
    : remaining;
  const output0 = isLastClaim ? lastEntry!.amount : canPreview ? stream!.amountPerPeriod : 0;
  const output1 = isLastClaim
    ? lastEntry!.remaining
    : canPreview ? remaining - stream!.amountPerPeriod : remaining;
  const stateLabel = isLastClaim
    ? 'Last settlement'
    : remaining > 0 && !canPreview
      ? 'Use cancel to reclaim'
      : 'Next claim preview';

  return (
    <div className="bg-[#0e1424] border border-slate-800 rounded-lg p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white">Covenant Introspection Visualizer</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {stateLabel}
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
            <ShieldCheck className="w-3 h-3" />
            Consensus enforced
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="font-semibold text-emerald-400">Input - Vault UTXO</span>
            <Lock className="w-3.5 h-3.5 text-[#0AC18E]" />
          </div>
          <div className="text-[10px] text-slate-500">lockingBytecode</div>
          <div className="bg-slate-950 p-1.5 rounded font-mono text-[10px] text-emerald-400 break-all border border-slate-800">
            {CONTRACT_BYTECODE_HEX.slice(0, 40)}...
          </div>
          <div className="text-[11px] text-slate-300 mt-2 flex justify-between">
            <span>PUSD locked</span>
            <span className="font-mono text-white">${pusdToDisplay(inputAmount)}</span>
          </div>
        </div>

        <div className="bg-blue-950/20 border border-blue-800/50 rounded-lg p-3">
          <div className="text-[11px] font-bold text-blue-300 mb-1 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            Covenant requires
          </div>
          <div className="bg-slate-950/80 p-2 rounded font-mono text-[10px] text-slate-300 border border-blue-900/50 space-y-1">
            <div className="text-emerald-400">amount &lt;= amountPerPeriod</div>
            <div className="text-amber-300">this.age &gt;= periodBlocks</div>
            <div className="text-purple-300 font-bold">output[1].lockingBytecode == input.lockingBytecode</div>
            <div className="text-blue-300">tokenCategory == PUSD</div>
          </div>
          <div className="text-[10px] text-slate-500 italic mt-1">category {PUSD_CATEGORY.slice(0, 10)}...</div>
        </div>

        <div className="space-y-2">
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-[11px] mb-0.5">
              <span className="text-indigo-300 font-semibold">Output 0 - Payee tranche</span>
              <span className="font-mono text-emerald-400 font-bold">${pusdToDisplay(output0)}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono truncate">{stream ? shortAddress(stream.payeeAddress) : 'payee address'}</div>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-600/40 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-[11px] mb-0.5">
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <RefreshCcw className="w-3 h-3 text-[#0AC18E]" />
                Output 1 - Vault change
              </span>
              <span className="font-mono text-emerald-400 font-bold">${pusdToDisplay(output1)}</span>
            </div>
            <div className="text-[10px] text-emerald-400/90 font-mono truncate">
              {isLastClaim ? 'bytecode matched input, clock reset' : 'projected next vault change'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
