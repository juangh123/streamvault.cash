import React from 'react';
import { Wallet, Globe, BookOpen, Presentation, Droplets, LogOut } from 'lucide-react';
import { AppMode, NetworkType, WalletState } from '../types';
import { shortAddress } from '../lib/format';

interface HeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  network: NetworkType;
  setNetwork: (net: NetworkType) => void;
  onOpenDocs: () => void;
  onOpenSlides: () => void;
  onConnectWallet: () => void;
  onDisconnect: () => void;
  wallet: WalletState;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  network,
  setNetwork,
  onOpenDocs,
  onOpenSlides,
  onConnectWallet,
  onDisconnect,
  wallet,
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#0a0f1d]/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0AC18E] to-[#0a7d5c] flex items-center justify-center">
            <Droplets className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">
                StreamVault<span className="text-[#0AC18E]">.cash</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                PUSD
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">
                BCH BLAZE 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Non-custodial PUSD streaming payroll &amp; subscription vault</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={onOpenSlides}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Presentation className="w-3.5 h-3.5 text-indigo-400" />
            <span>Deck</span>
          </button>
          <button
            onClick={onOpenDocs}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#0AC18E]" />
            <span>Docs</span>
          </button>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setMode('SANDBOX')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${mode === 'SANDBOX' ? 'bg-[#0AC18E] text-black font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Sandbox
            </button>
            <button
              onClick={() => setMode('LIVE')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${mode === 'LIVE' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Live
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value as NetworkType)}
              className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
            >
              <option value="chipnet" className="bg-slate-900">Chipnet</option>
              <option value="mainnet" className="bg-slate-900">Mainnet</option>
            </select>
          </div>

          {wallet.connected ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-600/50">
              <Wallet className="w-3.5 h-3.5" />
              <span>{wallet.name ?? 'Wallet'}</span>
              <span className="text-emerald-500/70 font-mono">{wallet.address ? shortAddress(wallet.address, 6, 4) : ''}</span>
              <button onClick={onDisconnect} title="Disconnect" className="text-emerald-400 hover:text-white">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0AC18E] hover:bg-emerald-400 text-black transition"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};