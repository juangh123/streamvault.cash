import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { JudgeFastTrack } from './components/JudgeFastTrack';
import { VaultManager } from './components/VaultManager';
import { AgentRunner } from './components/AgentRunner';
import { CovenantVisualizer } from './components/CovenantVisualizer';
import { TxLedger } from './components/TxLedger';
import { DocsViewer } from './components/DocsViewer';
import { WalletConnectModal } from './components/WalletConnectModal';
import { AgentLogEntry, AgentService, AppMode, NetworkType, TxRecord, VaultConfig } from './types';
import {
  generateInitialVault,
  executeSpendSimulation,
  executeEmergencyReclaim,
  PRESET_SERVICES,
  satsToBch,
  satsToUsd,
} from './lib/bchSimulator';


export const App: React.FC = () => {
  const [vault, setVault] = useState<VaultConfig>(generateInitialVault());
  const [transactions, setTransactions] = useState<TxRecord[]>([]);
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [vaultReady, setVaultReady] = useState(true);

  // App controls
  const [mode, setMode] = useState<AppMode>('SANDBOX');
  const [network, setNetwork] = useState<NetworkType>('sandbox');
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('bitcoincash:qp0xowner8923748923749823749283749823749823');

  // Initial welcome log
  useEffect(() => {
    addLog(
      'info',
      'System initialized. BCH Covenants VM ready. CashScript 0.10+ covenants active with recursion check.'
    );
    addLog(
      'success',
      `Vault loaded: 100,000 sats available. maxPerTx = 1,000 sats (~$0.003). Non-custodial rules active.`
    );
  }, []);

  const addLog = (level: AgentLogEntry['level'], message: string, txid?: string, sats?: number) => {
    const entry: AgentLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      txid,
      sats,
    };
    setLogs((prev) => [entry, ...prev.slice(0, 49)]); // keep recent 50 logs
  };

  // Adjust max per tx
  const handleUpdateMaxLimit = (limitSats: number) => {
    setVault((prev) => ({ ...prev, maxPerTxSats: limitSats }));
    addLog('info', `Owner updated spending policy: maxPerTx adjusted to ${limitSats} sats (${satsToUsd(limitSats)}).`);
  };

  // Fund vault
  const handleFundVault = (depositSats: number) => {
    if (depositSats <= 0) return;
    setVault((prev) => ({
      ...prev,
      balanceSats: prev.balanceSats + depositSats,
    }));
    const newTx: TxRecord = {
      txid: Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 18),
      timestamp: Date.now(),
      type: 'DEPOSIT',
      amountSats: depositSats,
      feeSats: 250,
      changeSats: 0,
      serviceName: 'Owner Vault Deposit',
      senderAddress: vault.ownerAddress,
      recipientAddress: vault.vaultAddress,
      status: 'confirmed',
      covenantVerified: true,
      explorerUrl: `https://blockchair.com/bitcoin-cash/transaction/demo`,
    };
    setTransactions((prev) => [newTx, ...prev]);
    addLog('success', `Vault funded with +${depositSats.toLocaleString()} sats from owner address.`);
  };

  // Execute single spend
  const handleExecuteSpend = (service: AgentService, forcedAmount?: number) => {
    addLog(
      'info',
      `[AI Agent Triggered] Requesting ${service.name} (${service.endpoint}). Amount: ${forcedAmount ?? service.costSats} sats...`
    );

    const result = executeSpendSimulation(vault, service, forcedAmount);

    if (!result.success) {
      addLog('error', result.error || 'Spend execution rejected by VM.');
      return;
    }

    if (result.txRecord && result.vmTrace) {
      const tx = result.txRecord;
      setTransactions((prev) => [tx, ...prev]);
      setVault((prev) => ({
        ...prev,
        balanceSats: prev.balanceSats - tx.amountSats - tx.feeSats,
        totalSpentSats: prev.totalSpentSats + tx.amountSats,
        totalTxs: prev.totalTxs + 1,
      }));

      addLog(
        'success',
        `[Tx Confirmed] Paid ${tx.amountSats} sats to ${service.name}. Change (${tx.changeSats.toLocaleString()} sats) locked back into identical vault bytecode!`,
        tx.txid,
        tx.amountSats
      );
    }
  };

  // Emergency sweep
  const handleEmergencySweep = () => {
    if (vault.balanceSats <= 0) {
      addLog('warn', 'Emergency Sweep aborted: Vault balance is already 0.');
      return;
    }

    addLog('warn', `🚨 [Emergency Sweep Triggered] Invoking reclaim(ownerSig) on-chain...`);

    const { txRecord, reclaimedSats } = executeEmergencyReclaim(vault);
    setTransactions((prev) => [txRecord, ...prev]);
    setVault((prev) => ({
      ...prev,
      balanceSats: 0,
    }));

    addLog(
      'success',
      `Sovereign Clawback Complete: 100% of remaining funds (${reclaimedSats.toLocaleString()} sats) swept to owner wallet. Agent spending authority neutralized.`,
      txRecord.txid
    );
  };

  // Auto-Provision for Judges
  const handleAutoProvision = () => {
    const freshVault = generateInitialVault();
    setVault(freshVault);
    setVaultReady(true);
    addLog('success', '1-Click Auto-Provision complete: Vault instantiated with 100,000 sats (~0.001 BCH).');
  };

  // Reset
  const handleResetVault = () => {
    setVault(generateInitialVault());
    setTransactions([]);
    setLogs([]);
    addLog('info', 'Simulation reset to baseline state.');
  };

  // Automated Batch Stream Demo (3 steps)
  const handleRunBatchDemo = async () => {
    if (isStreaming) return;
    setIsStreaming(true);
    addLog('info', 'Starting Autonomous Multi-Step AI Agent Workflow...');

    const sequence = [
      PRESET_SERVICES[0], // DeepSeek API (800 sats)
      PRESET_SERVICES[1], // Weather Oracle (300 sats)
      PRESET_SERVICES[3], // Web Scraper Proxy (500 sats)
    ];

    for (let i = 0; i < sequence.length; i++) {
      const s = sequence[i];
      await new Promise((resolve) => setTimeout(resolve, 800));
      handleExecuteSpend(s);
    }

    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsStreaming(false);
    addLog('success', 'Autonomous Agent Workflow finished. All 3 micro-transactions settled with recursive change verification.');
  };

  // Wallet selection
  const handleSelectWallet = (name: string, address: string) => {
    setWalletConnected(true);
    setWalletAddress(address);
    setMode('LIVE');
    addLog('success', `Connected via WizardConnect: ${name} (${address.slice(0, 12)}...)`);
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-gray-100 flex flex-col font-sans selection:bg-[#0AC18E] selection:text-black">
      {/* Top Navigation */}
      <Header
        mode={mode}
        setMode={setMode}
        network={network}
        setNetwork={setNetwork}
        onOpenDocs={() => setIsDocsOpen(true)}
        onConnectWallet={() => setIsWalletModalOpen(true)}
        walletConnected={walletConnected}
        walletAddress={walletAddress}
      />

      {/* Judge Fast-Track Bar */}
      <JudgeFastTrack
        onAutoProvision={handleAutoProvision}
        onRunBatchDemo={handleRunBatchDemo}
        onResetVault={handleResetVault}
        isStreaming={isStreaming}
        vaultReady={vaultReady}
      />

      {/* Main Cockpit Content */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 flex-1 space-y-6">
        {/* Top Grid: Vault Manager + Agent Runner */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VaultManager
            vault={vault}
            onUpdateMaxLimit={handleUpdateMaxLimit}
            onFundVault={handleFundVault}
            onEmergencySweep={handleEmergencySweep}
          />
          <AgentRunner
            vault={vault}
            onExecuteSpend={handleExecuteSpend}
            logs={logs}
            isStreaming={isStreaming}
            onRunBatchDemo={handleRunBatchDemo}
          />
        </div>

        {/* Middle: Live Covenants Introspection Visualizer */}
        <CovenantVisualizer vault={vault} lastTx={transactions[0]} />

        {/* Bottom: Verifiable Transaction Ledger */}
        <TxLedger transactions={transactions} />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#0a0f1d] py-6 px-4 text-xs text-gray-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">AgentPay.cash</span>
            <span>•</span>
            <span>Built for BCH BLAZE 2026 (Mainnet & Media Track)</span>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <button onClick={() => setIsDocsOpen(true)} className="hover:text-[#0AC18E] transition">
              Documentation
            </button>
            <a
              href="https://github.com/agentpay/agentpay.cash"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#0AC18E] transition"
            >
              GitHub Source
            </a>
            <a
              href="https://dorahacks.io/hackathon/bchblaze2026"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#0AC18E] transition"
            >
              DoraHacks Entry
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DocsViewer isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
      <WalletConnectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSelectWallet={handleSelectWallet}
      />
    </div>
  );
};

