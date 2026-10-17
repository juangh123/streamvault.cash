import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Undo2, ExternalLink, Bot } from 'lucide-react';
import { LedgerEntry, NetworkType } from '../types';
import { pusdToDisplay, shortAddress, timeAgo } from '../lib/format';

interface TxLedgerProps {
  entries: LedgerEntry[];
  network: NetworkType;
}

const typeMeta: Record<LedgerEntry['type'], { icon: React.ReactNode; tone: string; label: string }> = {
  FUND: { icon: <ArrowDownLeft className="w-3.5 h-3.5" />, tone: 'text-emerald-400', label: 'Fund' },
  CLAIM: { icon: <ArrowUpRight className="w-3.5 h-3.5" />, tone: 'text-indigo-400', label: 'Claim' },
  CANCEL: { icon: <Undo2 className="w-3.5 h-3.5" />, tone: 'text-rose-400', label: 'Cancel' },
  PAYMENT: { icon: <Bot className="w-3.5 h-3.5" />, tone: 'text-emerald-400', label: 'Agent pay' },
};

export const TxLedger: React.FC<TxLedgerProps> = ({ entries }) => {
  return (
    <div className="bg-[#0e1424] border border-slate-800 rounded-lg p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <h2 className="text-sm font-bold text-white">Transaction Ledger</h2>
        <span className="text-[10px] text-slate-500 font-mono">{entries.length} event(s)</span>
      </div>

      {entries.length === 0 ? (
        <div className="text-xs text-slate-600 italic py-6 text-center">No settlement events yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase text-slate-500 text-left">
                <th className="py-1.5 pr-3 font-medium">Type</th>
                <th className="py-1.5 pr-3 font-medium">Amount</th>
                <th className="py-1.5 pr-3 font-medium">Actor</th>
                <th className="py-1.5 pr-3 font-medium">Txid</th>
                <th className="py-1.5 pr-3 font-medium">Status</th>
                <th className="py-1.5 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {entries.map((e) => {
                const meta = typeMeta[e.type];
                return (
                  <tr key={e.id} className="border-t border-slate-800/70">
                    <td className={`py-2 pr-3 whitespace-nowrap ${meta.tone}`}>
                      <span className="inline-flex items-center gap-1.5">{meta.icon}{meta.label}</span>
                    </td>
                    <td className="py-2 pr-3 text-slate-200">${pusdToDisplay(e.amount)}</td>
                    <td className="py-2 pr-3 text-slate-400">{shortAddress(e.actorAddress, 6, 4)}</td>
                    <td className="py-2 pr-3 text-slate-400">{e.txid.slice(0, 14)}...</td>
                    <td className="py-2 pr-3">
                      {e.simulated ? (
                        <span className="text-amber-400/90">simulated</span>
                      ) : (
                        <a href={e.explorerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300">
                          on-chain <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                    <td className="py-2 text-slate-500">{timeAgo(e.timestamp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
