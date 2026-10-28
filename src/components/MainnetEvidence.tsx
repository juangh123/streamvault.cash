import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { MAINNET_EVIDENCE, evidenceUrl, validEvidence } from '../lib/evidence';

/** Strip of confirmed Mainnet txids. Renders nothing until real evidence is recorded. */
export const MainnetEvidence: React.FC = () => {
  const items = validEvidence(MAINNET_EVIDENCE);
  if (items.length === 0) return null;

  return (
    <section aria-label="Verified BCH Mainnet transactions" className="border-b border-emerald-950 bg-[#08120f]">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 md:flex-row md:items-center lg:px-8">
        <div className="flex shrink-0 items-center gap-2 text-xs font-semibold text-emerald-300">
          <ShieldCheck className="h-4 w-4" />
          Verified on BCH Mainnet
        </div>
        <ul className="flex flex-wrap gap-2 text-[11px]">
          {items.map((item) => (
            <li key={item.txid}>
              <a
                href={evidenceUrl(item.txid)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded border border-emerald-900 bg-emerald-950/40 px-2 py-1 text-slate-200 transition-colors hover:border-emerald-600 hover:text-white"
              >
                <span className="font-semibold">{item.label}</span>
                <span className="font-mono text-emerald-400">
                  {item.txid.slice(0, 8)}...{item.txid.slice(-6)}
                </span>
                <ExternalLink className="h-3 w-3 text-slate-500" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
