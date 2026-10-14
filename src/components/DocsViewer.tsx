import React, { useState } from 'react';
import { X, BookOpen, Shield, Code, Presentation, CheckSquare, Layers } from 'lucide-react';

interface DocsViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsViewer: React.FC<DocsViewerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'prd' | 'arch' | 'security' | 'slides'>('guide');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0e1424] border border-gray-700 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#0AC18E]/10 border border-[#0AC18E]/20 text-[#0AC18E]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AgentPay.cash Documentation Hub</h2>
              <p className="text-xs text-gray-400">Official project documentation & hackathon submission specs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 py-2.5 border-b border-gray-800 bg-gray-950 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'guide' ? 'bg-[#0AC18E] text-black font-bold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Judge Guide (60s)</span>
          </button>
          <button
            onClick={() => setActiveTab('prd')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'prd' ? 'bg-[#0AC18E] text-black font-bold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>PRD.md</span>
          </button>
          <button
            onClick={() => setActiveTab('arch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'arch' ? 'bg-[#0AC18E] text-black font-bold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture.md</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'security' ? 'bg-[#0AC18E] text-black font-bold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security.md</span>
          </button>
          <button
            onClick={() => setActiveTab('slides')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'slides' ? 'bg-[#0AC18E] text-black font-bold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>7-Page Slides</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-gray-300 space-y-4 font-mono leading-relaxed bg-[#0a0f1d]">
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white font-sans">⏱️ 60-Second Self-Test Checklist</h3>
              <p className="text-gray-400 font-sans">
                AgentPay.cash includes a built-in "Judge 1-Click Fast Demo" sandbox mode alongside real Live Wallet connectivity.
              </p>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
                <div className="text-[#0AC18E] font-bold">Step 1: Auto-Provision Vault (1 Click)</div>
                <div className="text-gray-400 text-xs">Click [Judge 1-Click Fast Demo] to instantiate an on-chain CashScript covenant with 0.001 BCH and 1,000 sats/tx limit.</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
                <div className="text-[#0AC18E] font-bold">Step 2: Trigger Autonomous AI Payment</div>
                <div className="text-gray-400 text-xs">Click [Trigger Micro-Spend] or [Auto-Run Stream] to watch the agent pay 800 sats for an API token call.</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
                <div className="text-blue-400 font-bold">Step 3: Verify Introspection Proof</div>
                <div className="text-gray-400 text-xs">Examine the Covenants visualizer proving change strictly returns to the identical contract bytecode.</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
                <div className="text-rose-400 font-bold">Step 4: Test Sovereign Emergency Sweep</div>
                <div className="text-gray-400 text-xs">Click [Emergency Sweep] to execute the owner reclaim function and recover 100% of remaining funds.</div>
              </div>
            </div>
          )}

          {activeTab === 'prd' && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white font-sans">Product Requirements Document (PRD)</h3>
              <p className="text-xs text-gray-400">
                Mission: To build the standard micro-payment and non-custodial allowance protocol for AI Agents on Bitcoin Cash.
              </p>
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 text-xs text-gray-300 whitespace-pre-wrap">
{`- Problem 1: Unlimited API/cloud spend from rogue agents
- Problem 2: EVM gas fees ($0.20 - $3.00) eliminate sub-cent micro-payments
- Problem 3: Private key leakage or prompt injection drains entire crypto wallets
- Solution: CashScript Covenants with hard ceiling (maxPerTx) and recursive change enforcement`}
              </div>
            </div>
          )}

          {activeTab === 'arch' && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white font-sans">System Architecture & CashScript Opcodes</h3>
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 text-xs text-gray-300">
                <pre className="text-emerald-400 overflow-x-auto">
{`contract AgentVault(pubkey ownerPk, pubkey agentPk, int maxPerTx) {
    function spend(sig agentSig, int amount, bytes serviceLockingBytecode, int minerFee) {
        require(checkSig(agentSig, agentPk));
        require(amount <= maxPerTx);
        require(amount >= 546);
        require(tx.outputs[0].value == amount);
        require(tx.outputs[0].lockingBytecode == serviceLockingBytecode);

        int change = tx.inputs[this.activeInputIndex].value - amount - minerFee;
        if (change >= 546) {
            require(tx.outputs[1].value == change);
            require(tx.outputs[1].lockingBytecode == tx.inputs[this.activeInputIndex].lockingBytecode);
        }
    }
    function reclaim(sig ownerSig) {
        require(checkSig(ownerSig, ownerPk));
    }
}`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white font-sans">Security & Threat Modeling</h3>
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 text-xs space-y-2">
                <div><span className="text-rose-400 font-bold">Prompt Injection:</span> Hard ceiling (maxPerTx) bounds single-tx loss to sub-cents.</div>
                <div><span className="text-rose-400 font-bold">Change Diversion:</span> Introspection requires output[1].lockingBytecode == input.lockingBytecode.</div>
                <div><span className="text-rose-400 font-bold">Infinite Loop:</span> Human owner retains 100% 1-click clawback (reclaim).</div>
                <div><span className="text-rose-400 font-bold">Dust Exploits:</span> Invariant enforces amount &gt;= 546 sats and change &gt;= 546 sats.</div>
              </div>
            </div>
          )}

          {activeTab === 'slides' && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white font-sans">7-Page Widget Factory Presentation</h3>
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 text-xs space-y-2">
                <div><span className="text-[#0AC18E] font-bold">Slide 1:</span> Cover — AgentPay.cash | Non-Custodial AI Agent Allowance Vault</div>
                <div><span className="text-[#0AC18E] font-bold">Slide 2:</span> One-Liner & Project Overview — Sub-cent machine payments on BCH</div>
                <div><span className="text-[#0AC18E] font-bold">Slide 3:</span> The Origin Story & Problem — Why AI Agents need micro-allowance</div>
                <div><span className="text-[#0AC18E] font-bold">Slide 4:</span> Key Benefits — Hard spending caps, zero-risk of card draining</div>
                <div><span className="text-[#0AC18E] font-bold">Slide 5:</span> BCH Technical Innovation — CashScript introspection opcodes</div>
                <div><span className="text-[#0AC18E] font-bold">Slide 6:</span> Vision & Roadmap — MCP plugin for Claude & AutoGPT</div>
                <div><span className="text-[#0AC18E] font-bold">Slide 7:</span> Thank You & Live Demo — https://agentpay.cash</div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-800 bg-gray-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#0AC18E] text-black hover:bg-emerald-400 transition"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
