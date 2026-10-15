import React from 'react';
import { Rocket, CheckCircle2, Play, RefreshCw, FastForward } from 'lucide-react';

interface JudgeFastTrackProps {
  hasStream: boolean;
  isRunning: boolean;
  onLaunchDemo: () => void;
  onRunWorkflow: () => void;
  onFastForward: () => void;
  onReset: () => void;
}

export const JudgeFastTrack: React.FC<JudgeFastTrackProps> = ({
  hasStream,
  isRunning,
  onLaunchDemo,
  onRunWorkflow,
  onFastForward,
  onReset,
}) => {
  return (
    <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border-y border-emerald-500/20 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-[#0AC18E]/15 text-[#0AC18E]">
            <Rocket className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide">Judge Fast-Track</div>
            <p className="text-[11px] text-slate-400">No wallet or funds needed. Simulated covenant runs in one click.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {!hasStream ? (
            <button
              onClick={onLaunchDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0AC18E] hover:bg-emerald-400 text-black transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Launch Demo Stream ($1,000 payroll)</span>
            </button>
          ) : (
            <>
              <button
                onClick={onFastForward}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
                title="Advance the sandbox block clock by one period"
              >
                <FastForward className="w-3.5 h-3.5 text-amber-400" />
                <span>Fast-forward 1 period</span>
              </button>
              <button
                onClick={onRunWorkflow}
                disabled={isRunning}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${isRunning ? 'bg-slate-700 text-slate-400' : 'bg-[#0AC18E] hover:bg-emerald-400 text-black'}`}
              >
                {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isRunning ? 'Streaming...' : 'Run 3-period workflow'}</span>
              </button>
              <button
                onClick={onReset}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
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