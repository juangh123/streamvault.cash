import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Github, Presentation } from 'lucide-react';
import { REPO_URL } from '../lib/constants';

const CASH_TOKENS_ADDRESS = 'bitcoincash:zzlgvjs8fvqdf43nz9yklcd0eh780x2xd5d9dxrnkv';
const GOOGLE_SLIDES_URL =
  'https://docs.google.com/presentation/d/1BzxVggQbZwCJYZYxea0GdbgamPEyYG7fT6dWfYD66N0/present';

const linkClass =
  'inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors';

export const SubmissionBanner: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(CASH_TOKENS_ADDRESS);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <aside
      aria-label="BCH BLAZE 2026 submission links"
      className="border-b border-emerald-950 bg-[#0a1515] px-4 py-2 text-[11px] lg:px-8"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="rounded border border-emerald-800/80 bg-emerald-950/60 px-1.5 py-0.5 font-semibold text-emerald-300">
            BCH BLAZE 2026
          </span>
          <a
            href={GOOGLE_SLIDES_URL}
            target="_blank"
            rel="noreferrer"
            className={linkClass}
            title="Open the project presentation"
          >
            <Presentation className="h-3.5 w-3.5 text-indigo-300" />
            Slides
            <ExternalLink className="h-3 w-3 text-slate-500" />
          </a>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className={linkClass}>
            <Github className="h-3.5 w-3.5" />
            GitHub
            <ExternalLink className="h-3 w-3 text-slate-500" />
          </a>
          <a
            href={`${REPO_URL}/tree/v0-prehackathon-baseline`}
            target="_blank"
            rel="noreferrer"
            className={linkClass}
          >
            Before / after
            <ExternalLink className="h-3 w-3 text-slate-500" />
          </a>
          <a
            href="https://streamvault-baseline.vercel.app"
            target="_blank"
            rel="noreferrer"
            className={linkClass}
          >
            Before demo
            <ExternalLink className="h-3 w-3 text-slate-500" />
          </a>
        </div>

        <div className="flex min-w-0 items-center gap-1.5 text-slate-500">
          <span className="shrink-0">CashTokens</span>
          <code
            className="min-w-0 truncate rounded bg-black/25 px-1.5 py-0.5 font-mono text-emerald-300"
            title={CASH_TOKENS_ADDRESS}
          >
            {CASH_TOKENS_ADDRESS}
          </code>
          <button
            type="button"
            onClick={copyAddress}
            className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Copy CashTokens address"
            title={copied ? 'Copied' : 'Copy address'}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
