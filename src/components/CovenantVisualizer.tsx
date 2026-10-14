import React from 'react';
import { Layers, ArrowRight, ShieldCheck, Check, Lock, Cpu, ArrowDownRight, RefreshCcw } from 'lucide-react';
import { VaultConfig, TxRecord } from '../types';

interface CovenantVisualizerProps {
  vault: VaultConfig;
  lastTx?: TxRecord;
}

export const CovenantVisualizer: React.FC<CovenantVisualizerProps> = ({ vault, lastTx }) => {
  return (
    <div className="bg-[#0e1424] border border-gray-800 rounded-2xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-800/40 text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              BCH Covenants Introspection Visualizer
            </h2>
            <p className="text-xs text-gray-400">
              Native opcodes enforcing recursive change return inside Bitcoin Cash VM
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Consensus Enforced</span>
        </span>
      </div>

      {/* Visual Pipeline Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-2 items-center">
        {/* Step 1: Input UTXO */}
        <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span className="font-semibold text-emerald-400">Input 0 (Active UTXO)</span>
            <Lock className="w-3.5 h-3.5 text-[#0AC18E]" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="text-gray-300 font-mono text-[11px] truncate">
              Locking Bytecode (Covenant):
            </div>
            <div className="bg-gray-950 p-1.5 rounded font-mono text-[10px] text-emerald-400 break-all border border-gray-800">
              {vault.contractBytecode.slice(0, 32)}...
            </div>
            <div className="text-[11px] text-gray-400 flex justify-between pt-1">
              <span>Value:</span>
              <span className="text-white font-mono font-bold">
                {lastTx ? (lastTx.amountSats + lastTx.feeSats + lastTx.changeSats).toLocaleString() : vault.balanceSats.toLocaleString()} sats
              </span>
            </div>
          </div>
        </div>

        {/* Step 2: Introspection Verification Center */}
        <div className="bg-blue-950/20 border border-blue-800/50 rounded-xl p-3.5 text-center relative">
          <div className="text-xs font-bold text-blue-300 mb-1 flex items-center justify-center gap-1.5">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>CashScript Introspection Opcodes</span>
          </div>
          <div className="bg-gray-950/80 p-2 rounded-lg font-mono text-[10px] text-gray-300 border border-blue-900/50 my-1 text-left space-y-1">
            <div className="text-emerald-400">✓ require(amount &lt;= maxPerTx);</div>
            <div className="text-blue-300">✓ require(output[0].value == amount);</div>
            <div className="text-purple-300 font-bold">
              ✓ output[1].lockingBytecode == input[0].lockingBytecode;
            </div>
          </div>
          <div className="text-[10px] text-gray-400 italic">
            Zero-oracle on-chain cryptographic proof
          </div>
        </div>

        {/* Step 3: Dual Output Structure */}
        <div className="space-y-2">
          {/* Output 0: Service Provider */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-[11px] mb-0.5">
              <span className="text-purple-300 font-semibold">Output 0: Service Payment</span>
              <span className="font-mono text-emerald-400 font-bold">
                {lastTx && lastTx.type === 'SPEND' ? `${lastTx.amountSats} sats` : 'e.g. 800 sats'}
              </span>
            </div>
            <div className="text-[10px] text-gray-500 font-mono truncate">
              {lastTx && lastTx.recipientAddress ? lastTx.recipientAddress : 'Recipient Service Address'}
            </div>
          </div>

          {/* Output 1: Recursive Change */}
          <div className="bg-emerald-950/30 border border-emerald-600/40 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-[11px] mb-0.5">
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <RefreshCcw className="w-3 h-3 text-[#0AC18E]" />
                Output 1: Recursive Change
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                {lastTx && lastTx.type === 'SPEND' ? `${lastTx.changeSats.toLocaleString()} sats` : `${vault.balanceSats.toLocaleString()} sats`}
              </span>
            </div>
            <div className="text-[10px] text-emerald-400/90 font-mono truncate flex items-center gap-1">
              <Check className="w-3 h-3 text-[#0AC18E] shrink-0" />
              <span>Bytecode matches Input 0 exactly</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
