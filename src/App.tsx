import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { JudgeFastTrack } from './components/JudgeFastTrack';
import { StreamControls } from './components/StreamControls';
import { ClaimPanel } from './components/ClaimPanel';
import { CovenantVisualizer } from './components/CovenantVisualizer';
import { TxLedger } from './components/TxLedger';
import { AppMode, LedgerEntry, LogEntry, NetworkType, StreamConfig, WalletState } from './types';
import { cancel as cancelStream, claim as claimStream, createStream, topUp as topUpStream } from './lib/stream';
import { CONTRACT_BYTECODE_HEX, DEFAULT_PERIOD_BLOCKS, PUSD_CATEGORY, SANDBOX_START_BLOCK } from './lib/covenant';
import { pusdToDisplay, shortAddress } from './lib/format';

// Heavy / optional surfaces are code-split so the initial bundle stays lean.
const DocsViewer = lazy(() => import('./components/DocsViewer').then((m) => ({ default: m.DocsViewer })));
const SlideDeck = lazy(() => import('./components/SlideDeck').then((m) => ({ default: m.SlideDeck })));
const WalletConnectDialog = lazy(() => import('./components/WalletConnectDialog').then((m) => ({ default: m.WalletConnectDialog })));
const LiveVaultPanel = lazy(() => import('./components/LiveVaultPanel').then((m) => ({ default: m.LiveVaultPanel })));

const DEMO_PAYER = 'bchtest:zq0payer9k4x7m2p8s5v1n3d6t9r4w7y2u5c8b';
const DEMO_PAYEE = 'bchtest:zz0payee4d8f2g6h1j5k9l3m7n2p6q1r5s9t4v';
const DEMO_DEPOSIT = 100000; // $1,000.00
const DEMO_PER_PERIOD = 2500; // $25.00

const B32 = 'abcdefghijklmnopqrstuvwxyz234567';
function fakeVaultAddress(): string {
  let out = '';
  for (let i = 0; i < 50; i += 1) out += B32[Math.floor(Math.random() * B32.length)];
  return 'bchtest:p' + out;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('SANDBOX');
  const [network, setNetwork] = useState<NetworkType>('chipnet');
  const [stream, setStream] = useState<StreamConfig | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [block, setBlock] = useState(SANDBOX_START_BLOCK);
  const [isRunning, setIsRunning] = useState(false);
  const [wallet, setWallet] = useState<WalletState>({ connected: false, name: null, icon: null, address: null });
  const [showDocs, setShowDocs] = useState(false);
  const [showDeck, setShowDeck] = useState(false);
  const [showWallet, setShowWallet] = useState(false);

  const addLog = (level: LogEntry['level'], message: string) => {
    const entry: LogEntry = { id: Math.random().toString(36).slice(2, 9), time: new Date().toLocaleTimeString(), level, message };
    setLogs((prev) => [entry, ...prev].slice(0, 40));
  };

  useEffect(() => {
    addLog('info', 'Sandbox ready. StreamVault covenant loaded - claim/cancel ABI, PUSD CashToken channel.');
  }, []);

  const pushEntry = (entry: LedgerEntry) => setLedger((prev) => [entry, ...prev]);

  const handleCreate = (input: {
    label: string;
    payerAddress: string;
    payeeAddress: string;
    amountPerPeriod: number;
    periodBlocks: number;
    deposit: number;
  }) => {
    const next = createStream({
      ...input,
      category: PUSD_CATEGORY,
      vaultAddress: fakeVaultAddress(),
      contractBytecode: CONTRACT_BYTECODE_HEX,
      block,
    });
    setStream(next);
    const fund: LedgerEntry = {
      id: Math.random().toString(36).slice(2, 9),
      txid: Math.random().toString(16).slice(2).padEnd(64, '0').slice(0, 64),
      timestamp: Date.now(),
      type: 'FUND',
      amount: input.deposit,
      feeSats: 280,
      remaining: input.deposit,
      actorAddress: input.payerAddress,
      counterpartyAddress: next.vaultAddress,
      blockHeight: block,
      simulated: true,
      explorerUrl: '',
    };
    pushEntry(fund);
    addLog('success', `Vault funded with $${pusdToDisplay(input.deposit)} PUSD. Stream "${input.label}" live at block #${block}.`);
  };

  const handleLaunchDemo = () => {
    handleCreate({
      label: 'Design retainer - Q4',
      payerAddress: DEMO_PAYER,
      payeeAddress: DEMO_PAYEE,
      amountPerPeriod: DEMO_PER_PERIOD,
      periodBlocks: DEFAULT_PERIOD_BLOCKS,
      deposit: DEMO_DEPOSIT,
    });
  };

  const handleTopUp = (amount: number) => {
    if (!stream) return;
    const outcome = topUpStream(stream, amount, block);
    if (!outcome.ok) { addLog('error', outcome.error ?? 'Top-up failed.'); return; }
    setStream(outcome.stream);
    if (outcome.entry) pushEntry(outcome.entry);
    addLog('success', `Top-up: +$${pusdToDisplay(amount)} PUSD. Vault now $${pusdToDisplay(outcome.stream.remaining)}.`);
  };

  const handleClaim = (amount: number) => {
    if (!stream) return;
    const outcome = claimStream(stream, amount, block);
    if (!outcome.ok) { addLog('error', outcome.error ?? 'Claim rejected.'); return; }
    setStream(outcome.stream);
    if (outcome.entry) pushEntry(outcome.entry);
    addLog('success', `Tranche claimed: $${pusdToDisplay(amount)} PUSD paid to ${shortAddress(stream.payeeAddress)}. Change returned to vault bytecode.`);
  };

  const handleCancel = () => {
    if (!stream) return;
    const outcome = cancelStream(stream, block);
    if (!outcome.ok) { addLog('warn', outcome.error ?? 'Cancel failed.'); return; }
    setStream(outcome.stream);
    if (outcome.entry) pushEntry(outcome.entry);
    addLog('warn', `Stream cancelled. $${pusdToDisplay(outcome.entry?.amount ?? 0)} PUSD reclaimed by the payer; payee key now powerless.`);
  };

  const handleFastForward = () => {
    if (!stream) return;
    setBlock((b) => b + stream.periodBlocks);
  };

  const handleRunWorkflow = async () => {
    if (!stream || isRunning) return;
    setIsRunning(true);
    addLog('info', 'Running 3-period streaming workflow...');
    let current = stream;
    let currentBlock = block;
    for (let step = 0; step < 3; step += 1) {
      await delay(700);
      currentBlock += current.periodBlocks;
      setBlock(currentBlock);
      const outcome = claimStream(current, current.amountPerPeriod, currentBlock);
      if (!outcome.ok) { addLog('error', outcome.error ?? 'Workflow claim rejected.'); break; }
      current = outcome.stream;
      setStream(current);
      if (outcome.entry) pushEntry(outcome.entry);
      addLog('success', `Period ${step + 1}: $${pusdToDisplay(current.amountPerPeriod)} streamed (block #${currentBlock}).`);
    }
    setIsRunning(false);
  };

  const handleReset = () => {
    setStream(null);
    setLedger([]);
    setLogs([]);
    setBlock(SANDBOX_START_BLOCK);
    addLog('info', 'Sandbox reset to baseline state.');
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-gray-100 flex flex-col font-sans selection:bg-[#0AC18E] selection:text-black">
      <Header
        mode={mode}
        setMode={setMode}
        network={network}
        setNetwork={setNetwork}
        onOpenDocs={() => setShowDocs(true)}
        onOpenSlides={() => setShowDeck(true)}
        onConnectWallet={() => setShowWallet(true)}
        onDisconnect={() => { setWallet({ connected: false, name: null, icon: null, address: null }); setMode('SANDBOX'); addLog('info', 'Wallet disconnected.'); }}
        wallet={wallet}
      />

      <JudgeFastTrack
        hasStream={!!stream}
        isRunning={isRunning}
        onLaunchDemo={handleLaunchDemo}
        onRunWorkflow={handleRunWorkflow}
        onFastForward={handleFastForward}
        onReset={handleReset}
      />

      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 flex-1 space-y-6">
        {mode === 'LIVE' && (
          <Suspense fallback={<div className="text-xs text-slate-500 py-4">Loading live tools...</div>}>
            <LiveVaultPanel network={network} />
          </Suspense>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StreamControls
            stream={stream}
            mode={mode}
            connectedAddress={wallet.address}
            onCreate={handleCreate}
            onTopUp={handleTopUp}
            onCancel={handleCancel}
          />
          <ClaimPanel stream={stream} block={block} onClaim={handleClaim} />
        </div>

        <CovenantVisualizer stream={stream} lastEntry={ledger[0]} />

        <TxLedger entries={ledger} network={network} />

        <div className="bg-[#0a0f1d] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-mono">Covenant console</span>
            <span className="font-mono text-slate-600">{logs.length} events</span>
          </div>
          <div className="bg-[#070a12] border border-slate-800 rounded-lg p-3 h-32 overflow-y-auto font-mono text-[11px] space-y-1">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic text-center py-6">Awaiting actions.</div>
            ) : (
              logs.map((l) => (
                <div key={l.id} className="flex items-start gap-2">
                  <span className="text-slate-600 shrink-0">{l.time}</span>
                  <span className={l.level === 'success' ? 'text-emerald-300' : l.level === 'error' ? 'text-rose-300' : l.level === 'warn' ? 'text-amber-300' : 'text-slate-300'}>{l.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-[#0a0f1d] py-5 px-4 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">StreamVault.cash</span>
            <span>-</span>
            <span>Built for BCH BLAZE 2026 (Mainnet &amp; Media Track)</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowDeck(true)} className="hover:text-[#0AC18E] transition">7-page deck</button>
            <button onClick={() => setShowDocs(true)} className="hover:text-[#0AC18E] transition">Documentation</button>
            <a href="https://dorahacks.io/hackathon/bchblaze2026" target="_blank" rel="noreferrer" className="hover:text-[#0AC18E] transition">DoraHacks entry</a>
          </div>
        </div>
      </footer>

      <Suspense fallback={null}>
        {showDocs && <DocsViewer isOpen onClose={() => setShowDocs(false)} />}
        {showDeck && <SlideDeck onClose={() => setShowDeck(false)} onLaunchDemo={() => { setShowDeck(false); handleLaunchDemo(); }} />}
        {showWallet && (
          <WalletConnectDialog
            open
            network={network}
            onClose={() => setShowWallet(false)}
            onConnected={(w) => { setWallet(w); setMode('LIVE'); addLog('success', `Wallet connected: ${w.name ?? 'BCH wallet'}${w.address ? ' (' + shortAddress(w.address) + ')' : ''}.`); }}
          />
        )}
      </Suspense>
    </div>
  );
};