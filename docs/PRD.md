# Product Requirements Document (PRD)
## StreamVault.cash - Non-Custodial PUSD Streaming Payroll & Subscription Vault

### 1. Summary
StreamVault.cash is a non-custodial vault on Bitcoin Cash that turns a lump sum of **PUSD** (ParyonUSD,
a CashTokens stablecoin) into a **rate-limited money stream**. A payer funds a CashScript covenant; a payee
draws a capped tranche per period; the payer keeps an unconditional claw-back.

### 2. Problem
1. **Lump-sum risk** - paying a contractor or vendor up front is all-or-nothing; ongoing work needs a schedule.
2. **Custodial rails** - payroll services and card mandates are custodial, reversible and geo-fenced.
3. **Volatile crypto** - streams denominated in a volatile asset are unusable for real payroll.
4. **EVM gas** - per-period settlement on EVM chains costs more in gas than the tranche itself.

### 3. Solution
An on-chain covenant parameterised by `payerPk`, `payeePk`, `amountPerPeriod`, `periodBlocks` and the PUSD
`category`. The BCH VM enforces the per-period ceiling, the relative timelock, recursive change and token
conservation. The payer keeps a one-signature `cancel`.

### 4. Personas
- **Payer** - a studio, sponsor or employer that wants scheduled, cancellable payouts in a stable unit.
- **Payee** - a freelancer, creator or vendor that wants to withdraw on schedule without invoicing or a custodian.
- **Service provider / agent** - a machine that draws a bounded per-period budget and pays a service
  per request. The Agent Sandbox and server API are implemented; the SDK/MCP packaging is future work.

### 5. Functional requirements
5.1 **Create & fund** - configure per-period amount, period (blocks) and deposit; lock PUSD into the covenant.
5.2 **Claim** - payee withdraws up to `amountPerPeriod` once per period; change returns to the vault.
5.3 **Cancel** - payer sweeps 100% of the remaining PUSD to a payer address.
5.4 **Top up** - payer adds more PUSD and the covenant merges it into the existing vault UTXO.
   v1.2 implements this with one payer-owned PUSD input; the vault's relative clock restarts.
5.5 **Visualizer** - show the PUSD input/outputs, the `this.age` gate and the recursive-change check.
5.6 **Ledger** - every fund/claim/cancel event with a (real, when live) txid.

### 6. Non-functional requirements
- No private keys stored in the browser; signing is delegated to a wallet (WizardConnect).
  The current sprint implements persistent pairing and fund/claim/cancel signing; a device test is pending.
- Sandbox mode runs the whole flow with zero prerequisites (judge fallback).
- First paint < 1.5s; responsive from 375px to desktop.
- `npm test` evaluates the covenant against the real BCH VM.

### 7. Out of scope (v1)
Per-second continuous accrual, multi-payee splits, cross-chain, and the payer recovery of unclaimed dust.
