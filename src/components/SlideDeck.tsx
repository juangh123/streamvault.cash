import React, { useEffect, useState } from 'react';
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Coins,
  Droplets,
  ExternalLink,
  Landmark,
  RefreshCcw,
  Shield,
  Wallet,
} from 'lucide-react';
import { REPO_URL, SITE_URL } from '../lib/constants';

interface SlideDeckProps {
  onClose: () => void;
  onLaunchDemo: () => void;
}

export const SlideDeck: React.FC<SlideDeckProps> = ({ onClose, onLaunchDemo }) => {
  const [index, setIndex] = useState(0);
  const total = 7;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === ' ') setIndex((value) => Math.min(value + 1, total - 1));
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(value - 1, 0));
      if (event.key === 'Escape') onClose();
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
          <a
            href="/StreamVault-BCH-Blaze-2026.pdf"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 inline-flex items-center gap-1"
          >
            Official deck (PDF) <ExternalLink className="w-3 h-3" />
          </a>
          <button onClick={onLaunchDemo} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0AC18E] text-black hover:bg-emerald-400">
            Open agent demo
          </button>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700">
            Close (Esc)
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="max-w-4xl w-full aspect-[16/9] min-h-[440px] bg-[#0c1222] border border-slate-800 rounded-lg p-8 flex flex-col justify-between">
          {index === 0 && (
            <div className="h-full flex flex-col justify-between">
              <div className="flex justify-between text-[11px] font-mono text-[#0AC18E]">
                <span>BCH BLAZE 2026</span>
                <span>MAINNET + MEDIA TRACK</span>
              </div>
              <div>
                <h1 className="text-5xl font-extrabold leading-tight">
                  Give an AI an allowance,
                  <br />
                  not your bank account.
                </h1>
                <p className="text-lg text-slate-300 mt-4 max-w-2xl">
                  Non-custodial PUSD budgets for autonomous software, with the same covenant serving payroll streams.
                </p>
              </div>
              <div className="text-xs text-slate-400 font-mono space-y-1">
                <div>Team Autonomous Cash - StreamVault.cash (formerly AgentPay.cash)</div>
                <div>{SITE_URL} - @StreamVaultCash</div>
              </div>
            </div>
          )}

          {index === 1 && (
            <div className="space-y-5">
              <div className="text-[11px] font-mono text-[#0AC18E]">THE TRUST GAP</div>
              <p className="text-2xl font-semibold leading-snug">
                An AI agent with a wallet can spend everything it can reach. A prompt can be ignored. A spending cap
                that lives in a prompt is not a financial control.
              </p>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="border border-slate-800 rounded-lg p-3">
                  <Bot className="w-4 h-4 text-indigo-400 mb-2" />
                  <div className="font-semibold">Runaway agents</div>
                  <div className="text-slate-400 mt-1">A loop or prompt injection can drain an API key or wallet.</div>
                </div>
                <div className="border border-slate-800 rounded-lg p-3">
                  <Landmark className="w-4 h-4 text-emerald-400 mb-2" />
                  <div className="font-semibold">Lump-sum payroll</div>
                  <div className="text-slate-400 mt-1">Payees wait, payers over-commit, custodians sit in the middle.</div>
                </div>
                <div className="border border-slate-800 rounded-lg p-3">
                  <Coins className="w-4 h-4 text-amber-300 mb-2" />
                  <div className="font-semibold">Sub-cent rails</div>
                  <div className="text-slate-400 mt-1">EVM gas makes 0.01 USD service calls uneconomical.</div>
                </div>
              </div>
            </div>
          )}

          {index === 2 && (
            <div className="space-y-4">
              <div className="text-[11px] font-mono text-[#0AC18E]">ONE COVENANT, THREE USERS</div>
              <div className="grid grid-cols-3 gap-4">
                <div className="border border-slate-800 rounded-lg p-4">
                  <Shield className="w-5 h-5 text-emerald-400 mb-2" />
                  <div className="font-semibold">Payer</div>
                  <p className="text-xs text-slate-400 mt-2">Locks a PUSD budget, keeps a cancel key and reclaims the remainder.</p>
                </div>
                <div className="border border-slate-800 rounded-lg p-4">
                  <Wallet className="w-5 h-5 text-indigo-400 mb-2" />
                  <div className="font-semibold">Worker</div>
                  <p className="text-xs text-slate-400 mt-2">Claims one tranche per period. No invoice, no custodian, no chargeback.</p>
                </div>
                <div className="border border-slate-800 rounded-lg p-4">
                  <Bot className="w-5 h-5 text-amber-300 mb-2" />
                  <div className="font-semibold">AI Agent</div>
                  <p className="text-xs text-slate-400 mt-2">Claims a small budget, pays a service per request and stops when the period is exhausted.</p>
                </div>
              </div>
              <p className="text-sm text-slate-300">
                Same primitive: <span className="font-mono text-emerald-300">amountPerPeriod</span>,{' '}
                <span className="font-mono text-emerald-300">periodBlocks</span>,{' '}
                <span className="font-mono text-emerald-300">claim</span>,{' '}
                <span className="font-mono text-emerald-300">cancel</span>.
              </p>
            </div>
          )}

          {index === 3 && (
            <div className="space-y-4">
              <div className="text-[11px] font-mono text-[#0AC18E]">HOW THE LIMIT IS ENFORCED</div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-2">
                <div>PUSD is a CashToken; the VM enforces conservation.</div>
                <div className="text-amber-300">this.age &gt;= periodBlocks - one tranche per period</div>
                <div className="text-purple-300">output[1].lockingBytecode == input.lockingBytecode - recursive change</div>
                <div className="text-emerald-300">output[1].value &gt;= input.value - 2000 - BCH buffer bound</div>
                <div className="text-blue-300">one vault input, two outputs, exact PUSD category</div>
                <div className="text-indigo-300">topUp merges one payer PUSD UTXO and restarts the clock</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div className="border border-slate-800 rounded-lg p-3">The agent can spend its tranche, but cannot mint PUSD or redirect the vault change.</div>
                <div className="border border-slate-800 rounded-lg p-3">The payer can cancel the vault at any time. The payee key becomes powerless.</div>
              </div>
            </div>
          )}

          {index === 4 && (
            <div className="space-y-4">
              <div className="text-[11px] font-mono text-[#0AC18E]">AGENT BUDGET DEMO</div>
              <div className="grid grid-cols-4 gap-3 text-center">
                {[
                  ['2.00 PUSD', 'vault'],
                  ['0.10 PUSD', 'per 2 blocks'],
                  ['0.01 PUSD', 'per service call'],
                  ['SV1:requestId', 'OP_RETURN binding'],
                ].map(([value, label]) => (
                  <div key={label} className="border border-slate-800 rounded-lg p-3">
                    <div className="font-mono text-lg font-bold text-emerald-300">{value}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{label}</div>
                  </div>
                ))}
              </div>
              <div className="text-sm text-slate-300 space-y-2">
                <p>1. The agent claims its tranche from the vault.</p>
                <p>2. The agent pays the service 0.01 PUSD with a request id.</p>
                <p>3. The service verifies amount, destination, category and OP_RETURN before returning data.</p>
                <p>4. When the tranche is spent, the next request shows "This period's budget is used up".</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <RefreshCcw className="w-4 h-4" />
                The limit is not a prompt. It is a transaction rule.
              </div>
            </div>
          )}

          {index === 5 && (
            <div className="space-y-4">
              <div className="text-[11px] font-mono text-[#0AC18E]">WHY BCH + BUSINESS MODEL</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="border border-slate-800 rounded-lg p-4">
                  <div className="font-semibold text-emerald-300 mb-2">Why Bitcoin Cash</div>
                  <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4">
                    <li>Sub-cent settlement makes 0.01 PUSD service calls practical.</li>
                    <li>Relative timelocks encode the period without an off-chain clock.</li>
                    <li>CashTokens give the covenant a stable unit to conserve.</li>
                    <li>WizardConnect keeps keys in the payer's wallet.</li>
                  </ul>
                </div>
                <div className="border border-slate-800 rounded-lg p-4">
                  <div className="font-semibold text-indigo-300 mb-2">Who pays</div>
                  <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4">
                    <li>Agent builders: hosted budget console for agent fleets (subscription).</li>
                    <li>API and MCP tool providers: SDK and verifier to sell 0.01 PUSD calls.</li>
                    <li>Hosted gateway: small fee per verified call; self-hosting stays free.</li>
                    <li>First market: paid MCP tools and data APIs; payroll streams follow.</li>
                  </ul>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                No protocol fee in the covenant. The business is the control plane, not a custodian.
              </p>
            </div>
          )}

          {index === 6 && (
            <div className="space-y-4 text-center">
              <div className="text-[11px] font-mono text-[#0AC18E]">DEMO &amp; ASK</div>
              <h2 className="text-4xl font-bold">Give an AI an allowance.</h2>
              <p className="text-sm text-slate-300 max-w-2xl mx-auto">
                Sandbox works without a wallet. The mainnet path uses a real PUSD vault, a real service payment and a real
                cancel transaction.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                <a href={SITE_URL} className="text-emerald-400 inline-flex items-center gap-1">
                  {SITE_URL} <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a href={REPO_URL} className="text-slate-300 inline-flex items-center gap-1">
                  GitHub repo <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a href="/StreamVault-BCH-Blaze-2026.pdf" target="_blank" rel="noreferrer" className="text-slate-300 inline-flex items-center gap-1">
                  Deck PDF <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="border border-slate-800 rounded-lg p-4 text-xs text-slate-400 max-w-2xl mx-auto">
                60-second judge path: Launch agent budget → Run paid request → Run until budget exhausted → Cancel and reclaim.
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setIndex((value) => Math.max(0, value - 1))}
              disabled={index === 0}
              className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1.5">
              {Array.from({ length: total }).map((_, value) => (
                <button
                  key={value}
                  onClick={() => setIndex(value)}
                  className={`h-1.5 rounded-full transition-all ${value === index ? 'w-6 bg-[#0AC18E]' : 'w-1.5 bg-slate-600'}`}
                />
              ))}
            </div>
            <button
              onClick={() => setIndex((value) => Math.min(total - 1, value + 1))}
              disabled={index === total - 1}
              className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
