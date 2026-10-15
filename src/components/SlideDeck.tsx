import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Droplets, Shield, RefreshCcw, Wallet, Coins, TrendingUp, ExternalLink } from 'lucide-react';

interface SlideDeckProps {
  onClose: () => void;
  onLaunchDemo: () => void;
}

const REPO = 'https://github.com/streamvault/streamvault.cash';
const SITE = 'https://streamvault.cash';

export const SlideDeck: React.FC<SlideDeckProps> = ({ onClose, onLaunchDemo }) => {
  const [i, setI] = useState(0);
  const total = 7;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') setI((p) => Math.min(p + 1, total - 1));
      if (e.key === 'ArrowLeft') setI((p) => Math.max(p - 1, 0));
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-[#050811] z-50 flex flex-col text-white">
      <div className="border-b border-slate-800 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-[#0AC18E]" />
          <span className="text-sm font-bold">StreamVault.cash</span>
          <span className="text-xs text-slate-500">7-page deck</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onLaunchDemo} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0AC18E] text-black hover:bg-emerald-400">Launch demo</button>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700">Close (Esc)</button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="max-w-4xl w-full aspect-[16/9] min-h-[440px] bg-[#0c1222] border border-slate-800 rounded-lg p-8 flex flex-col justify-between">
          {i === 0 && (
            <div className="h-full flex flex-col justify-between">
              <div className="flex justify-between text-[11px] font-mono text-[#0AC18E]">
                <span>BCH BLAZE 2026</span>
                <span>MAINNET + MEDIA TRACK</span>
              </div>
              <div>
                <h1 className="text-5xl font-extrabold">StreamVault<span className="text-[#0AC18E]">.cash</span></h1>
                <p className="text-lg text-slate-300 mt-2">Non-custodial PUSD streaming payroll &amp; subscription vault on Bitcoin Cash</p>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                <div>Team Autonomous Cash - solo dev + AI</div>
                <div>{SITE} - @StreamVaultCash</div>
              </div>
            </div>
          )}

          {i === 1 && (
            <div className="space-y-4">
              <div className="text-[11px] font-mono text-[#0AC18E]">ONE-LINER</div>
              <p className="text-2xl font-semibold">Programmable BCH money streams that pay themselves - capped on-chain, cancellable by the payer, settled in a stablecoin.</p>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3"><Shield className="w-4 h-4 text-emerald-400 mb-1" /><div className="font-semibold">Non-custodial</div><div className="text-slate-400">Payer keeps the claw-back</div></div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3"><Coins className="w-4 h-4 text-emerald-400 mb-1" /><div className="font-semibold">PUSD settlement</div><div className="text-slate-400">USD-pegged CashToken</div></div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3"><RefreshCcw className="w-4 h-4 text-emerald-400 mb-1" /><div className="font-semibold">Hard covenants</div><div className="text-slate-400">Recursive change</div></div>
              </div>
              <div className="text-xs text-slate-400 font-mono">{REPO}</div>
            </div>
          )}

          {i === 2 && (
            <div className="space-y-3">
              <div className="text-[11px] font-mono text-[#0AC18E]">THE STORY</div>
              <p className="text-slate-300 text-sm">Contractors, creators and SaaS vendors are paid in lumps that either arrive late or require a custodian. Subscriptions require cards, mandates and chargeback risk. AI agents that buy services per-call have the same problem at machine speed.</p>
              <ul className="text-sm text-slate-300 list-disc pl-5 space-y-1">
                <li>Cards &amp; bank mandates: custodial, reversible, geo-fenced.</li>
                <li>Lump-sum crypto: no schedule, all-or-nothing.</li>
                <li>Streaming on EVM: gas exceeds the payment.</li>
              </ul>
              <p className="text-sm text-emerald-400">BCH's near-zero fees + introspection covenants are the natural rail for programmable money streams.</p>
            </div>
          )}

          {i === 3 && (
            <div className="space-y-3">
              <div className="text-[11px] font-mono text-[#0AC18E]">BENEFITS</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3"><TrendingUp className="w-4 h-4 text-emerald-400 mb-1" /><div className="font-semibold">Payees</div><div className="text-slate-400 text-xs">Withdraw on schedule without an invoice or a custodian.</div></div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3"><Shield className="w-4 h-4 text-emerald-400 mb-1" /><div className="font-semibold">Payers</div><div className="text-slate-400 text-xs">Per-period ceiling; cancel and reclaim anytime.</div></div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3"><Coins className="w-4 h-4 text-emerald-400 mb-1" /><div className="font-semibold">Stable value</div><div className="text-slate-400 text-xs">Denominated in PUSD, not a volatile token.</div></div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3"><Wallet className="w-4 h-4 text-emerald-400 mb-1" /><div className="font-semibold">Any wallet</div><div className="text-slate-400 text-xs">Sign with Selene, Paytaca or Cashonize.</div></div>
              </div>
            </div>
          )}

          {i === 4 && (
            <div className="space-y-3">
              <div className="text-[11px] font-mono text-[#0AC18E]">BCH USAGE</div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-slate-300 space-y-1">
                <div>BCH Mainnet UTXO + PUSD CashToken category</div>
                <div className="text-emerald-400">-&gt; CashScript covenant (amountPerPeriod, periodBlocks)</div>
                <div className="text-amber-300">-&gt; this.age (OP_CHECKSEQUENCEVERIFY) gates each tranche</div>
                <div className="text-purple-300">-&gt; output[1].lockingBytecode == input.lockingBytecode (recursive change)</div>
                <div className="text-blue-300">-&gt; tokenCategory == PUSD (conservation enforced by the VM)</div>
                <div>-&gt; signed via WizardConnect, broadcast to BCH</div>
              </div>
              <p className="text-xs text-slate-400">Everything is enforced by consensus rules, not by a server.</p>
            </div>
          )}

          {i === 5 && (
            <div className="space-y-3">
              <div className="text-[11px] font-mono text-[#0AC18E]">VISION &amp; ROADMAP</div>
              <ol className="text-sm text-slate-300 space-y-2">
                <li><strong className="text-white">Phase 1 (hackathon)</strong> - StreamVault covenant, live demo, Chipnet + Mainnet settlement.</li>
                <li><strong className="text-white">Phase 2</strong> - SDK + MCP server so AI agents stream per-call budgets.</li>
                <li><strong className="text-white">Phase 3</strong> - Marketplace of PUSD-denominated recurring services.</li>
              </ol>
            </div>
          )}

          {i === 6 && (
            <div className="space-y-3 text-center">
              <div className="text-[11px] font-mono text-[#0AC18E]">THANK YOU</div>
              <h2 className="text-3xl font-bold">Try the live demo</h2>
              <a href={SITE} className="text-emerald-400 inline-flex items-center gap-1 text-sm">{SITE} <ExternalLink className="w-3.5 h-3.5" /></a>
              <p className="text-xs text-slate-400">Judge walkthrough: launch the demo stream, fast-forward a period, claim a tranche, then cancel.</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button onClick={() => setI((p) => Math.max(0, p - 1))} disabled={i === 0} className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700"><ChevronLeft className="w-4 h-4" /></button>
            <div className="flex gap-1.5">
              {Array.from({ length: total }).map((_, idx) => (
                <button key={idx} onClick={() => setI(idx)} className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-6 bg-[#0AC18E]' : 'w-1.5 bg-slate-600'}`} />
              ))}
            </div>
            <button onClick={() => setI((p) => Math.min(total - 1, p + 1))} disabled={i === total - 1} className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};