import React from 'react';
import { Zap, Wallet, Globe, BookOpen, Presentation, ExternalLink } from 'lucide-react';
import { AppMode, NetworkType } from '../types';

interface HeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  network: NetworkType;
  setNetwork: (net: NetworkType) => void;
  onOpenDocs: () => void;
  onOpenSlides: () => void;
  onConnectWallet: () => void;
  walletConnected: boolean;
  walletAddress: string;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  network,
  setNetwork,
  onOpenDocs,
  onOpenSlides,
  onConnectWallet,
  walletConnected,
  walletAddress,
}) => {
  return (
    <header className="border-b border-gray-800 bg-[#0a0f1d]/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand & Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0AC18E] to-[#055B43] flex items-center justify-center shadow-lg shadow-[#0AC18E]/20">
            <Zap className="w-6 h-6 text-black fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white flex items-center">
                AgentPay<span className="text-[#0AC18E]">.cash</span>
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#0AC18E]/10 text-[#0AC18E] border border-[#0AC18E]/30">
                BCH BLAZE 2026
              </span>
            </div>
            <p className="text-xs text-gray-400">Non-Custodial AI Agent Allowance Vault & Micro-Payment Gateway</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          {/* Slides Deck Button */}
          <button
            onClick={onOpenSlides}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-800/60 transition shadow-sm"
          >
            <Presentation className="w-3.5 h-3.5 text-purple-400" />
            <span>7-Page Deck</span>
          </button>

          {/* Docs button */}
          <button
            onClick={onOpenDocs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/80 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#0AC18E]" />
            <span>Docs & PRD</span>
          </button>

          {/* Chipnet Faucet External Link */}
          <a
            href="https://chipnet.chaingraph.cash/faucet"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-800 transition"
            title="Official Chipnet Faucet"
          >
            <span>Faucet</span>
            <ExternalLink className="w-3 h-3 text-gray-500" />
          </a>

          {/* Mode Switcher */}
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setMode('SANDBOX')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                mode === 'SANDBOX'
                  ? 'bg-[#0AC18E] text-black font-semibold shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Sandbox Demo
            </button>
            <button
              onClick={() => setMode('LIVE')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                mode === 'LIVE'
                  ? 'bg-blue-600 text-white font-semibold shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Live Wallet
            </button>
          </div>

          {/* Network Selector */}
          <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-lg px-2 py-1 text-xs text-gray-300">
            <Globe className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value as NetworkType)}
              className="bg-transparent text-xs text-gray-200 outline-none cursor-pointer"
            >
              <option value="sandbox" className="bg-gray-900">Chipnet (Testnet)</option>
              <option value="mainnet" className="bg-gray-900">BCH Mainnet</option>
            </select>
          </div>

          {/* Connect Wallet */}
          <button
            onClick={onConnectWallet}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
              walletConnected
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-600/50'
                : 'bg-gradient-to-r from-[#0AC18E] to-emerald-500 hover:from-emerald-400 hover:to-[#0AC18E] text-black font-bold'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>
              {walletConnected
                ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-4)}`
                : 'Connect Wallet'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
