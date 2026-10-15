# Judge walkthrough (60 seconds)

No wallet, no testnet coins, no local build required - the sandbox mirrors every covenant rule.

1. **Open the demo** and click **Launch Demo Stream** in the Judge Fast-Track bar. A $1,000.00 PUSD payroll
   stream is created: payer "Design retainer" funds a CashScript covenant with a $25.00 / period policy.
2. **Fast-forward 1 period** (or click **Run 3-period workflow**). The block clock advances; the covenant
   becomes eligible for the next tranche.
3. Click **Claim**. The payee withdraws $25.00; the remaining PUSD returns to the vault under the *identical*
   bytecode - watch the Covenant Visualizer light up Output 1.
4. **Prove the ceiling**: set the claim amount above $25.00 and claim - the covenant rejects it
   (`amount <= amountPerPeriod`).
5. **Cancel & reclaim**: the payer sweeps 100% of the remaining PUSD back. The payee key is now powerless.

Key files:

- Covenant: `contracts/StreamVault.cash`
- Real VM tests: `contracts/test-streamvault.mjs` (`npm test`)
- Live layer: `src/lib/chain.ts`
- Mechanics: `docs/STREAM_MECHANICS.md`