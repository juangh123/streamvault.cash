import React from 'react';
import { Rocket, ShieldCheck, CheckCircle2, Play, RefreshCw, AlertTriangle } from 'lucide-react';

interface JudgeFastTrackProps {
  onAutoProvision: () => void;
  onRunBatchDemo: () => void;
  onResetVault: () => void;
  isStreaming: boolean;
  vaultReady: boolean;
}

export const JudgeFastTrack: React.FC<JudgeFastTrackProps> = ({
  onAutoProvision,
  onRunBatchDemo,
  onResetVault,
  isStreaming,
  vaultReady
}) => {
  return (
    <div className="bg-gradient-to-r from-emerald-950/70 via-gray-900 to-emerald-950/60 border-y border-[#0AC18E]/30 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Judge info banner */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#0AC18E]/20 text-[#0AC18E] shrink-0">
            <Rocket className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                DoraHacks Judge Fast-Track (60s Evaluation)
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-700/50">
                <ShieldCheck className="w-3 h-3" /> Zero Friction
              </span>
            </div>
            <p className="text-xs text-gray-300">
              No wallet setup or testnet coins needed. Test autonomous AI Agent micro-payments & Covenants introspection in 1 click.
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {!vaultReady ? (
            <button
              onClick={onAutoProvision}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0AC18E] hover:bg-emerald-400 text-black shadow-lg shadow-[#0AC18E]/20 transition transform active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>1. Auto-Provision Vault (0.001 BCH)</span>
            </button>
          ) : (
            <>
              <button
                onClick={onRunBatchDemo}
                disabled={isStreaming}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition transform active:scale-95 ${
                  isStreaming
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-[#0AC18E] hover:bg-emerald-400 text-black shadow-lg shadow-[#0AC18E]/20'
                }`}
              >
                {isStreaming ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Agent Workflow Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>2. Run Agent Workflow (3 Micro-Txs)</span>
                  </>
                )}
              </button>

              <button
                onClick={onResetVault}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition"
                title="Reset simulation state"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
