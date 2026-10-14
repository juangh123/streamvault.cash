import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, Shield, Sparkles, Code, Cpu, ExternalLink, Play, CheckCircle2, Lock, ArrowRight, LayoutGrid } from 'lucide-react';

interface SlideDeckProps {
  onClose: () => void;
  onLaunchDemo: () => void;
}

export const SlideDeck: React.FC<SlideDeckProps> = ({ onClose, onLaunchDemo }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const totalSlides = 7;

  const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#050811] z-50 flex flex-col text-white selection:bg-[#0AC18E] selection:text-black">
      {/* Slide Navigation Topbar */}
      <div className="border-b border-gray-800/80 px-6 py-3.5 flex items-center justify-between bg-[#0a0f1d]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0AC18E] to-[#055B43] flex items-center justify-center shadow-lg shadow-[#0AC18E]/20">
            <Zap className="w-4 h-4 text-black fill-black" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight">AgentPay.cash</span>
            <span className="text-xs text-gray-400 ml-2">Official 7-Page Presentation Deck</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide ? 'w-8 bg-[#0AC18E]' : 'w-2 bg-gray-700 hover:bg-gray-500'
                }`}
                title={`Jump to slide ${idx + 1}`}
              />
            ))}
          </div>
          <span className="text-xs font-mono text-gray-400 ml-2">
            Slide {currentSlide + 1} of {totalSlides}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLaunchDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0AC18E] text-black hover:bg-emerald-400 transition"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Launch Live App</span>
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition"
          >
            Exit Deck (Esc)
          </button>
        </div>
      </div>

      {/* Slide Canvas */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto relative">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0AC18E]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl w-full aspect-[16/9] min-h-[500px] bg-[#0c1222] border border-gray-800 rounded-3xl p-8 lg:p-12 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          {/* SLIDE 1: COVER */}
          {currentSlide === 0 && (
            <div className="h-full flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs font-mono text-[#0AC18E]">
                <span>BCH BLAZE 2026 HACKATHON</span>
                <span>MAINNET + MEDIA TRACK</span>
              </div>
              <div className="space-y-4 my-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0AC18E]/10 border border-[#0AC18E]/30 text-[#0AC18E] text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Autonomous Machine Commerce on Bitcoin Cash
                </div>
                <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-white">
                  AgentPay<span className="text-[#0AC18E]">.cash</span>
                </h1>
                <p className="text-lg lg:text-xl text-gray-300 max-w-2xl font-light leading-relaxed">
                  Non-Custodial AI Agent Allowance Vault & Sub-Cent Micro-Payment Gateway
                </p>
                <div className="flex items-center gap-3 pt-2 text-xs font-mono text-gray-400">
                  <span className="text-white font-semibold">Team Autonomous Cash</span>
                  <span>•</span>
                  <span>Solopreneur + AI Engineering</span>
                  <span>•</span>
                  <span className="text-emerald-400">CashScript 0.10+ Covenants</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t border-gray-800/80">
                <span>URL: https://agentpay.cash</span>
                <span>Press Space or Right Arrow →</span>
              </div>
            </div>
          )}

          {/* SLIDE 2: ONE-LINER & REPO */}
          {currentSlide === 1 && (
            <div className="h-full flex flex-col justify-between">
              <div className="text-xs font-mono text-[#0AC18E]">SLIDE 02 // ONE-LINER & OVERVIEW</div>
              <div className="space-y-6 my-auto">
                <h2 className="text-3xl lg:text-4xl font-extrabold text-white">
                  The Sovereign Monetary Layer for Autonomous AI Agents
                </h2>
                <div className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800">
                  <p className="text-lg text-emerald-300 font-medium leading-relaxed italic">
                    "AgentPay empowers AI Agents to independently pay for APIs, oracles, and compute
                    at sub-cent rates, while Bitcoin Cash Covenants guarantee human owners 100% fund safety."
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-gray-950 border border-gray-800">
                    <div className="text-2xl font-bold text-[#0AC18E]">$0.001</div>
                    <div className="text-xs text-gray-400 mt-1">Average Tx Fee (True Micro-Payments)</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-950 border border-gray-800">
                    <div className="text-2xl font-bold text-blue-400">100% Non-Custodial</div>
                    <div className="text-xs text-gray-400 mt-1">Sovereign Owner Emergency Sweep</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-950 border border-gray-800">
                    <div className="text-2xl font-bold text-purple-400">CashScript 0.10</div>
                    <div className="text-xs text-gray-400 mt-1">Native VM Introspection Opcodes</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t border-gray-800/80">
                <span>GitHub: github.com/agentpay/agentpay.cash</span>
                <span>Open Source MIT License</span>
              </div>
            </div>
          )}

          {/* SLIDE 3: THE PROBLEM & ORIGIN */}
          {currentSlide === 2 && (
            <div className="h-full flex flex-col justify-between">
              <div className="text-xs font-mono text-[#0AC18E]">SLIDE 03 // THE PROBLEM & ORIGIN STORY</div>
              <div className="space-y-6 my-auto">
                <h2 className="text-3xl font-extrabold text-white">
                  Why Autonomous Agents Break Traditional Payments
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-xl bg-rose-950/20 border border-rose-800/40">
                    <div className="text-rose-400 font-bold mb-2">1. Credit Card Disaster</div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Handing unmetered corporate credit cards to autonomous LLMs leads to accidental looping, prompt injection, and catastrophic bank drains.
                    </p>
                  </div>
                  <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-800/40">
                    <div className="text-amber-400 font-bold mb-2">2. EVM Gas Impasse</div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Ethereum and L2s cost $0.20 to $5.00 in gas per transaction. Paying for a single $0.001 API token request is economically impossible.
                    </p>
                  </div>
                  <div className="p-5 rounded-xl bg-purple-950/20 border border-purple-800/40">
                    <div className="text-purple-400 font-bold mb-2">3. Naked Private Keys</div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Giving an AI bot an unconstrained private key means a single hallucination or reverse-engineered memory leak can empty the entire wallet.
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-600/40 text-emerald-300 text-xs">
                  ⚡ <strong>The Solution:</strong> Bitcoin Cash UTXO Covenants lock funds into an unbreachable allowance vault where the agent can only spend up to a hard ceiling per call.
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t border-gray-800/80">
                <span>Root Cause: Lack of Programmable Micro-Allowance</span>
                <span>Bitcoin Cash solves this natively</span>
              </div>
            </div>
          )}

          {/* SLIDE 4: KEY BENEFITS */}
          {currentSlide === 3 && (
            <div className="h-full flex flex-col justify-between">
              <div className="text-xs font-mono text-[#0AC18E]">SLIDE 04 // KEY BENEFITS & VALUE PROPOSITIONS</div>
              <div className="space-y-6 my-auto">
                <h2 className="text-3xl font-extrabold text-white">
                  Designed for Humans, Built for Machines
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl bg-gray-950 border border-gray-800">
                    <div className="flex items-center gap-2 text-[#0AC18E] font-bold text-sm mb-1.5">
                      <Shield className="w-4 h-4" />
                      <span>Hard-Capped Allowance Vault</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Owners configure a strict ceiling (e.g. 1,000 sats / $0.003). Even with valid signatures, any transaction exceeding the ceiling is rejected by miners.
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-gray-950 border border-gray-800">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-1.5">
                      <Lock className="w-4 h-4" />
                      <span>Recursive Covenants Introspection</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Bitcoin Cash VM checks that Output 1 (change) strictly matches the contract's identical locking bytecode. Zero possibility of change diversion.
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-gray-950 border border-gray-800">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-1.5">
                      <Zap className="w-4 h-4" />
                      <span>1-Click Sovereign Clawback</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      The human master key retains unconditional Emergency Sweep authority to reclaim 100% of remaining funds instantly, neutralizing the agent.
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-gray-950 border border-gray-800">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-sm mb-1.5">
                      <Cpu className="w-4 h-4" />
                      <span>Plug-and-Play AI Agent SDK</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Easily wraps into LangChain, AutoGPT, and Claude MCP servers to allow autonomous tool calling with instantaneous 0-conf payment proofs.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t border-gray-800/80">
                <span>Value: Absolute Security + True Sub-Cent Micro-Commerce</span>
                <span>Zero Custodial Middlemen</span>
              </div>
            </div>
          )}

          {/* SLIDE 5: BCH TECHNICAL INNOVATION */}
          {currentSlide === 4 && (
            <div className="h-full flex flex-col justify-between">
              <div className="text-xs font-mono text-[#0AC18E]">SLIDE 05 // BITCOIN CASH TECHNICAL INNOVATION</div>
              <div className="space-y-4 my-auto">
                <h2 className="text-3xl font-extrabold text-white">
                  CashScript Introspection Covenants Mechanics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 font-mono text-[11px] text-gray-300 space-y-1">
                    <div className="text-gray-500">// contracts/AgentVault.cash</div>
                    <div className="text-[#0AC18E]">contract AgentVault(pubkey ownerPk, pubkey agentPk, int maxPerTx) &#123;</div>
                    <div className="text-blue-300 pl-4">function spend(sig agentSig, int amount, bytes serviceLockingBytecode, int fee) &#123;</div>
                    <div className="text-emerald-400 pl-8">require(checkSig(agentSig, agentPk));</div>
                    <div className="text-emerald-400 pl-8">require(amount &lt;= maxPerTx);</div>
                    <div className="text-emerald-400 pl-8">require(tx.outputs[0].value == amount);</div>
                    <div className="text-purple-400 pl-8 font-bold">// Recursive Covenant check:</div>
                    <div className="text-purple-300 pl-8">require(tx.outputs[1].lockingBytecode == tx.inputs[this.activeInputIndex].lockingBytecode);</div>
                    <div className="text-blue-300 pl-4">&#125;</div>
                    <div className="text-rose-400 pl-4">function reclaim(sig ownerSig) &#123; require(checkSig(ownerSig, ownerPk)); &#125;</div>
                    <div className="text-[#0AC18E]">&#125;</div>
                  </div>

                  <div className="space-y-2.5 text-xs text-gray-300">
                    <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
                      <span className="font-bold text-[#0AC18E]">1. OP_INSPECTINPUT*</span>
                      <p className="text-[11px] text-gray-400 mt-0.5">Reads the contract's own locking bytecode directly on the spending input.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
                      <span className="font-bold text-blue-400">2. OP_INSPECTOUTPUT*</span>
                      <p className="text-[11px] text-gray-400 mt-0.5">Inspects change value & scriptPubKey without off-chain oracles or sequencers.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
                      <span className="font-bold text-purple-400">3. WizardConnect Integration</span>
                      <p className="text-[11px] text-gray-400 mt-0.5">Seamless bridge to Selene (Mobile QR), Paytaca (Extension), and Cashonize.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t border-gray-800/80">
                <span>Scoring Criteria: Advanced Covenants Introspection</span>
                <span>Chipnet & Mainnet Ready</span>
              </div>
            </div>
          )}

          {/* SLIDE 6: VISION & ROADMAP */}
          {currentSlide === 5 && (
            <div className="h-full flex flex-col justify-between">
              <div className="text-xs font-mono text-[#0AC18E]">SLIDE 06 // VISION & FUTURE ROADMAP</div>
              <div className="space-y-6 my-auto">
                <h2 className="text-3xl font-extrabold text-white">
                  Roadmap: From Hackathon MVP to Global Agent Economy
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-5 rounded-xl bg-gray-950 border border-[#0AC18E]/40">
                    <div className="text-xs font-bold text-[#0AC18E] mb-2">PHASE 1: CURRENT</div>
                    <div className="font-bold text-white mb-2">Hackathon MVP</div>
                    <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside">
                      <li>CashScript Covenant Vault</li>
                      <li>1-Click Judge Fast-Track</li>
                      <li>Interactive Web Cockpit</li>
                      <li>Introspection Visualizer</li>
                    </ul>
                  </div>

                  <div className="p-5 rounded-xl bg-gray-950 border border-gray-800">
                    <div className="text-xs font-bold text-blue-400 mb-2">PHASE 2: Q1 2027</div>
                    <div className="font-bold text-white mb-2">Developer SDK & MCP</div>
                    <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside">
                      <li>Claude Desktop MCP Server</li>
                      <li>Python & TS Agent SDK</li>
                      <li>CashTokens (PUSD) Vaults</li>
                      <li>Automated Faucet Integration</li>
                    </ul>
                  </div>

                  <div className="p-5 rounded-xl bg-gray-950 border border-gray-800">
                    <div className="text-xs font-bold text-purple-400 mb-2">PHASE 3: Q2 2027</div>
                    <div className="font-bold text-white mb-2">Decentralized Market</div>
                    <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside">
                      <li>Open Micro-API Registry</li>
                      <li>Pay-per-token proxy gateway</li>
                      <li>Autonomous Swarm Budgets</li>
                      <li>Cross-agent settlement</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t border-gray-800/80">
                <span>Mission: Making Bitcoin Cash the Currency of the Agentic Future</span>
                <span>Enterprise & Solopreneur friendly</span>
              </div>
            </div>
          )}

          {/* SLIDE 7: THANK YOU & LIVE DEMO */}
          {currentSlide === 6 && (
            <div className="h-full flex flex-col justify-between">
              <div className="text-xs font-mono text-[#0AC18E]">SLIDE 07 // THANK YOU & LIVE AUDIT</div>
              <div className="space-y-6 my-auto text-center max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0AC18E] to-[#055B43] flex items-center justify-center mx-auto shadow-xl shadow-[#0AC18E]/30">
                  <Zap className="w-9 h-9 text-black fill-black" />
                </div>
                <h2 className="text-4xl font-extrabold text-white">
                  Thank You, DoraHacks Judges!
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Experience AgentPay.cash right now in your browser. Auto-provision a vault and watch Bitcoin Cash Covenants protect machine payments in under 60 seconds.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={onLaunchDemo}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-[#0AC18E] text-black hover:bg-emerald-400 transition shadow-lg shadow-[#0AC18E]/20"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Open Live Interactive Cockpit</span>
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t border-gray-800/80">
                <span>Live Demo: https://agentpay.cash</span>
                <span>GitHub: github.com/agentpay/agentpay.cash</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide Navigation Bottom Bar */}
      <div className="border-t border-gray-800/80 px-6 py-3 flex items-center justify-between bg-[#0a0f1d]">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
            currentSlide === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-200 bg-gray-800 hover:bg-gray-700'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Slide</span>
        </button>

        <div className="text-xs text-gray-400 font-mono">
          Use ← / → Arrow Keys to Navigate
        </div>

        <button
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
          className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
            currentSlide === totalSlides - 1 ? 'text-gray-600 cursor-not-allowed' : 'text-black bg-[#0AC18E] hover:bg-emerald-400'
          }`}
        >
          <span>Next Slide</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
