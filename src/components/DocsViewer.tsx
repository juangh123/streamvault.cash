import React, { useState } from 'react';
import { X, BookOpen } from 'lucide-react';

interface DocsViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabId = 'overview' | 'mechanics' | 'security' | 'build';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'mechanics', label: 'Stream mechanics' },
  { id: 'security', label: 'Security' },
  { id: 'build', label: 'Build & test' },
];

export const DocsViewer: React.FC<DocsViewerProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<TabId>('overview');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0e1424] border border-slate-700 rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#0AC18E]" />
            <h2 className="text-sm font-bold text-white">StreamVault.cash docs</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3 border-b border-slate-800">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-xs rounded-t transition ${tab === t.id ? 'text-[#0AC18E] border-b-2 border-[#0AC18E]' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto text-xs text-slate-300 space-y-3 leading-relaxed">
          {tab === 'overview' && (
            <>
              <p><strong className="text-white">StreamVault.cash</strong> is a non-custodial streaming payroll &amp; subscription vault on Bitcoin Cash. A payer locks <strong className="text-emerald-400">PUSD</strong> (ParyonUSD, a CashTokens stablecoin) inside a CashScript covenant; the payee draws a capped tranche each period, while the payer keeps an unconditional claw-back.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Per-period ceiling enforced on-chain (no runaway billing loops).</li>
                <li>Relative timelock (<code className="text-amber-300">this.age</code>) gates each tranche.</li>
                <li>Recursive change returns to the identical covenant bytecode.</li>
                <li>Deployed as CashTokens; no custodial server holds funds.</li>
              </ul>
            </>
          )}
          {tab === 'mechanics' && (
            <>
              <p>The vault is a P2SH covenant parameterised by <code>payerPk</code>, <code>payeePk</code>, <code>amountPerPeriod</code>, <code>periodBlocks</code> and the PUSD <code>category</code>.</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li><strong className="text-white">claim(amount)</strong>: requires the payee signature, <code className="text-amber-300">this.age &gt;= periodBlocks</code>, <code>amount &lt;= amountPerPeriod</code>; pays Output 0 and returns the remaining PUSD to Output 1 with the same bytecode. The new UTXO restarts the clock.</li>
                <li><strong className="text-white">cancel</strong>: payer signature sweeps 100% of the remaining PUSD to a payer-selected address.</li>
              </ol>
              <p className="text-slate-400">CashTokens are conserved by the VM, so the payee can never mint or divert the vault balance. A claim can never drain the vault; only cancel can.</p>
            </>
          )}
          {tab === 'security' && (
            <ul className="list-disc pl-5 space-y-1">
              <li>No private keys are stored in the browser; payer and payee sign with their own wallets via WizardConnect.</li>
              <li>Per-transaction ceiling limits blast radius even if the payee key leaks.</li>
              <li>Change redirection is rejected by bytecode introspection.</li>
              <li>Third-output BCH siphoning is impossible (<code>outputs.length == 2</code>).</li>
              <li>Dust and token floors are handled when the transaction is built.</li>
            </ul>
          )}
          {tab === 'build' && (
            <>
              <pre className="bg-slate-950 border border-slate-800 rounded p-3 text-[11px] text-slate-300 overflow-x-auto">{`npm install
npm run compile   # cashc -> contracts/artifacts/StreamVault.json
npm test          # 9 real covenant VM tests (MockNetworkProvider)
npm run dev       # local cockpit`}</pre>
              <p>The contract lives in <code className="text-slate-200">contracts/StreamVault.cash</code>; the test suite evaluates real transactions against the BCH VM.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};