import React from 'react';
import { History, ExternalLink, ArrowUpRight, ArrowDownLeft, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { TxRecord } from '../types';
import { satsToBch, satsToUsd } from '../lib/bchSimulator';

interface TxLedgerProps {
  transactions: TxRecord[];
}

export const TxLedger: React.FC<TxLedgerProps> = ({ transactions }) => {
  return (
    <div className="bg-[#0e1424] border border-gray-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gray-800 text-gray-300">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Live On-Chain Transaction Ledger</h2>
            <p className="text-xs text-gray-400">Verifiable Bitcoin Cash cryptographic ledger entries</p>
          </div>
        </div>
        <span className="text-xs font-mono text-gray-400 bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-800">
          {transactions.length} Transactions
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800/80 pb-2">
              <th className="pb-2 font-medium">Type</th>
              <th className="pb-2 font-medium">Service / Purpose</th>
              <th className="pb-2 font-medium">Amount</th>
              <th className="pb-2 font-medium">Miner Fee</th>
              <th className="pb-2 font-medium">Covenant Check</th>
              <th className="pb-2 font-medium text-right">Explorer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 italic">
                  No transactions yet. Trigger an Agent action above to construct the first on-chain micro-payment.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.txid} className="hover:bg-gray-900/40 transition">
                  {/* Type */}
                  <td className="py-3">
                    {tx.type === 'SPEND' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-800/50">
                        <ArrowUpRight className="w-3 h-3" />
                        Micro-Spend
                      </span>
                    )}
                    {tx.type === 'DEPOSIT' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50">
                        <ArrowDownLeft className="w-3 h-3" />
                        Deposit
                      </span>
                    )}
                    {tx.type === 'RECLAIM' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-800/50">
                        <AlertOctagon className="w-3 h-3" />
                        Clawback
                      </span>
                    )}
                  </td>

                  {/* Service */}
                  <td className="py-3">
                    <div className="font-semibold text-white">{tx.serviceName || 'Native Vault Deposit'}</div>
                    <div className="text-[10px] text-gray-500 font-mono truncate max-w-[200px]">
                      {new Date(tx.timestamp).toLocaleTimeString()} • {tx.txid.slice(0, 16)}...
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-3 font-mono">
                    <span className="font-bold text-white">{tx.amountSats.toLocaleString()} sats</span>
                    <span className="text-[10px] text-emerald-400 block">{satsToUsd(tx.amountSats)}</span>
                  </td>

                  {/* Fee */}
                  <td className="py-3 font-mono text-gray-400">
                    <span>{tx.feeSats} sats</span>
                    <span className="text-[10px] text-gray-500 block">≈ $0.001</span>
                  </td>

                  {/* Covenant Check */}
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  </td>

                  {/* Explorer link */}
                  <td className="py-3 text-right">
                    <a
                      href={tx.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-gray-400 hover:text-[#0AC18E] transition text-[11px]"
                    >
                      <span>Blockchair</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
