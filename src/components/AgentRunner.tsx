import React, { useState } from 'react';
import { Bot, Terminal, Play, Zap, CheckCircle2, XCircle, ArrowUpRight, Cpu, Cloud, Image, Globe } from 'lucide-react';
import { AgentLogEntry, AgentService, VaultConfig } from '../types';
import { PRESET_SERVICES, satsToBch, satsToUsd } from '../lib/bchSimulator';

interface AgentRunnerProps {
  vault: VaultConfig;
  onExecuteSpend: (service: AgentService, forcedAmount?: number) => void;
  logs: AgentLogEntry[];
  isStreaming: boolean;
  onRunBatchDemo: () => void;
}

export const AgentRunner: React.FC<AgentRunnerProps> = ({
  vault,
  onExecuteSpend,
  logs,
  isStreaming,
  onRunBatchDemo,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(PRESET_SERVICES[0].id);
  const [simulateOverLimit, setSimulateOverLimit] = useState(false);

  const selectedService = PRESET_SERVICES.find(s => s.id === selectedServiceId) || PRESET_SERVICES[0];

  const getCategoryIcon = (category: AgentService['category']) => {
    switch (category) {
      case 'LLM Compute': return <Cpu className="w-4 h-4 text-emerald-400" />;
      case 'Oracle': return <Cloud className="w-4 h-4 text-blue-400" />;
      case 'Image Gen': return <Image className="w-4 h-4 text-purple-400" />;
      case 'Web Proxy': return <Globe className="w-4 h-4 text-amber-400" />;
    }
  };

  const handleSingleSpend = () => {
    const amount = simulateOverLimit ? vault.maxPerTxSats + 1500 : selectedService.costSats;
    onExecuteSpend(selectedService, amount);
  };

  return (
    <div className="bg-[#0e1424] border border-gray-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                AI Agent Autonomous Micro-Checkout
              </h2>
              <p className="text-xs text-gray-400">Autonomous machine-to-machine sub-cent payment triggering</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRunBatchDemo}
              disabled={isStreaming || vault.balanceSats < 2000}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow ${
                isStreaming || vault.balanceSats < 2000
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isStreaming ? 'Agent Active...' : 'Auto-Run Stream'}</span>
            </button>
          </div>
        </div>

        {/* Available Micro-services */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-300 mb-2 block">
            Select External Service for AI Agent to Pay:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRESET_SERVICES.map((service) => {
              const isSelected = service.id === selectedServiceId;
              const isOverLimit = service.costSats > vault.maxPerTxSats;

              return (
                <div
                  key={service.id}
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition relative ${
                    isSelected
                      ? 'bg-purple-950/30 border-purple-500/80 shadow-md shadow-purple-950/50'
                      : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(service.category)}
                      <span className="text-xs font-bold text-white">{service.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#0AC18E]">
                      {service.costSats} sats
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-400 line-clamp-1 mb-2">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500 font-mono truncate max-w-[150px]">
                      {service.endpoint}
                    </span>
                    <span className="text-emerald-400 font-medium">
                      {satsToUsd(service.costSats)}
                    </span>
                  </div>

                  {isOverLimit && (
                    <span className="absolute -top-1.5 right-2 px-1.5 py-0.2 bg-rose-950 text-rose-400 border border-rose-800 text-[9px] rounded font-semibold">
                      Exceeds Ceiling
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Spend Execution Bar */}
        <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={simulateOverLimit}
                onChange={(e) => setSimulateOverLimit(e.target.checked)}
                className="rounded border-gray-700 text-[#0AC18E] focus:ring-0 bg-gray-900"
              />
              <span className="text-gray-400">
                Simulate Over-Limit Attack ({vault.maxPerTxSats + 1500} sats)
              </span>
            </label>
          </div>

          <button
            onClick={handleSingleSpend}
            disabled={isStreaming || vault.balanceSats < 600}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold shadow-lg transition transform active:scale-95 ${
              simulateOverLimit
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                : 'bg-[#0AC18E] hover:bg-emerald-400 text-black shadow-[#0AC18E]/20'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>
              {simulateOverLimit
                ? 'Test Over-Limit Attack'
                : `Trigger Micro-Spend (${selectedService.costSats} sats)`}
            </span>
          </button>
        </div>
      </div>

      {/* Terminal Logs */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
          <span className="flex items-center gap-1.5 font-mono">
            <Terminal className="w-3.5 h-3.5 text-[#0AC18E]" />
            Agent Execution & Covenants Console:
          </span>
          <span className="text-[10px] text-gray-500 font-mono">
            {logs.length} events logged
          </span>
        </div>

        <div className="bg-[#070a12] border border-gray-800 rounded-xl p-3 h-36 overflow-y-auto font-mono text-[11px] space-y-1">
          {logs.length === 0 ? (
            <div className="text-gray-600 italic py-8 text-center">
              Awaiting Agent action. Click "Trigger Micro-Spend" or "Auto-Run Stream" above.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-tight">
                <span className="text-gray-600 text-[10px] shrink-0">{log.timestamp}</span>
                {log.level === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />}
                {log.level === 'error' && <XCircle className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />}
                {log.level === 'info' && <span className="text-blue-400 shrink-0">ℹ</span>}
                {log.level === 'warn' && <span className="text-amber-400 shrink-0">⚠</span>}
                <span className={`break-all ${
                  log.level === 'success' ? 'text-emerald-300' :
                  log.level === 'error' ? 'text-rose-300' :
                  log.level === 'warn' ? 'text-amber-300' : 'text-gray-300'
                }`}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
