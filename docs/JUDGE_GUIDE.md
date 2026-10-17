# Judge walkthrough (60 seconds)

Open https://streamvault-cash.vercel.app. No wallet, testnet coins or local build is required for the
Agent Sandbox.

## Agent path

1. Keep **Agent** selected and **Sandbox** active.
2. Click **Launch agent budget**. A 2.00 PUSD vault is created with a 0.10 PUSD tranche every 2 blocks.
3. Click **Run paid request**. The agent claims 0.10 PUSD, pays 0.01 PUSD to the service and the
   service log shows the verified result.
4. Click **Run until budget exhausted**. After 10 calls the UI shows **This period's budget is used
   up** and the next claim block. This is the covenant's relative period gate, not a prompt rule.
5. Click **Fast-forward 1 period** and run one more request to show the next tranche.
6. Click **Cancel & reclaim**. The payer sweeps the remaining vault PUSD; the payee/agent key becomes
   powerless over the vault.

The Sandbox ledger is labelled `simulated`. Live mode only shows real wallet/Electrum data.

## Payroll fallback

Switch to **Payroll** → **Sandbox** and click **Launch Demo Stream ($1,000 payroll)**. Fast-forward one
period, claim a $25 tranche, then cancel and reclaim. The visualizer shows the last settlement:
input = tranche + change, output 0 = tranche, output 1 = change.

## Key files

- Covenant: `contracts/StreamVault.cash`
- Real VM tests: `contracts/test-streamvault.mjs` (`npm test`, 16 cases)
- Chain layer: `src/lib/chain.ts`
- Wallet manager: `src/wallet/WalletProvider.tsx`
- Agent API: `src/lib/agent-server.ts`, `api/agent/*`, `api/service/insight.ts`
- Mechanics: `docs/STREAM_MECHANICS.md`

## Live mode

The live payroll demo uses `receive/0` as payer and `change/0` as payee from one connected wallet.
The live Agent demo additionally uses the server-side `AGENT_WIF` as the payee/hot wallet. Mainnet
txids must be confirmed and linked in the README before they are presented as evidence.
