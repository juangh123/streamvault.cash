import React from 'react';
import { X, QrCode, Smartphone, Chrome, Globe, ShieldCheck } from 'lucide-react';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (name: string, address: string) => void;
}

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  isOpen,
  onClose,
  onSelectWallet,
}) => {
  if (!isOpen) return null;

  const mockWallets = [
    {
      name: 'Selene Wallet (Mobile QR)',
      icon: <Smartphone className="w-5 h-5 text-emerald-400" />,
      desc: 'Scan with Selene on iOS/Android via WizardConnect',
      address: 'bitcoincash:qp0xselene948271049283749823749823749823749'
    },
    {
      name: 'Paytaca Extension (Browser)',
      icon: <Chrome className="w-5 h-5 text-blue-400" />,
      desc: 'Direct Web3 extension injection for Bitcoin Cash',
      address: 'bitcoincash:qp0xpaytaca7362918472918472918472918472918'
    },
    {
      name: 'Cashonize (Web Wallet)',
      icon: <Globe className="w-5 h-5 text-purple-400" />,
      desc: 'Browser-based light wallet with CashTokens support',
      address: 'bitcoincash:qp0xcashonize827391827391827391827391827391'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0e1424] border border-gray-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0AC18E]/10 border border-[#0AC18E]/20 text-[#0AC18E]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">WizardConnect Wallet Bridge</h2>
              <p className="text-xs text-gray-400">Official BCH BLAZE 2026 wallet protocol</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wallets List */}
        <div className="p-5 space-y-3">
          {mockWallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => {
                onSelectWallet(wallet.name, wallet.address);
                onClose();
              }}
              className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-gray-800 bg-gray-900/60 hover:border-[#0AC18E]/60 hover:bg-gray-800/80 transition text-left group"
            >
              <div className="p-2 rounded-xl bg-gray-950 border border-gray-800 group-hover:border-[#0AC18E]/30 transition">
                {wallet.icon}
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-white group-hover:text-[#0AC18E] transition">
                  {wallet.name}
                </div>
                <div className="text-[11px] text-gray-400">{wallet.desc}</div>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-semibold">
                Connect
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 bg-gray-950/80 flex items-center justify-between text-[11px] text-gray-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> Non-custodial sign only
          </span>
          <span>BCH Mainnet & Chipnet</span>
        </div>
      </div>
    </div>
  );
};
