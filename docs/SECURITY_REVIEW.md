# Security review (v1.2 + agent layer)

Scope: `contracts/StreamVault.cash`, `src/lib/chain.ts`, `src/lib/agent-server.ts`, the wallet
provider and the transaction builders. Reviewed by stepping through every `require`, every builder
path and the automated suites.

## What is proven

| Property | Evidence |
| :--- | :--- |
| Only the payee can `claim` | `checkSig(payeeSig, payeePk)` - TEST-09 |
| One vault input per claim | `tx.inputs.length == 1` and active index 0 - TEST-12 |
| Input category matches PUSD | `tx.inputs[0].tokenCategory == pusdCategory` - TEST-13 |
| Rate limit: one tranche per period | `this.age >= periodBlocks` - TEST-03 |
| Per-period ceiling | `amount <= amountPerPeriod` - TEST-02 |
| Non-zero tranche | `amount > 0` - TEST-05 |
| Exactly two outputs | `tx.outputs.length == 2` - TEST-10 |
| Change returns to the identical covenant | `output[1].lockingBytecode == input.lockingBytecode` - TEST-04 |
| BCH fee buffer is preserved | `output[1].value >= input.value - 2000` - TEST-14, TEST-15 |
| Token conservation (no mint/steal) | VM CashTokens rules + explicit category checks |
| A claim cannot drain the vault | `remaining > 0` - ENGINE-05, CHAIN-02 |
| Only the payer can `cancel` | `checkSig(payerSig, payerPk)` - TEST-07 |
| Cancel pays the payer destination | `output[0].lockingBytecode == payerLockingBytecode` - TEST-11 |
| Payer top-up merges one PUSD UTXO | `topUp` checks signature, category, merged amount and BCH bound - TEST-16..20 |
| Wallet signing path | fund/claim/cancel WC objects + input paths - CHAIN-05, CHAIN-06 |
| Agent budget exhaustion | sandbox agent test AGENT-02 |
| Real networks reachable | `npm run verify:network` (Chipnet + Mainnet) |

55 automated checks: `npm test` (21), `npm run test:engine` (12), `npm run test:agent` (5),
`npm run test:chain` (10), `npm run test:api` (7), plus the derive, network and Playwright probes.

## Residual risks

1. **Per-period, not per-total.** The covenant caps each tranche but has no cumulative budget. Payers
   bound total exposure with the deposit size and by cancelling.
2. **Output 0 destination is payee-chosen.** The covenant requires output 0 to carry `amount` PUSD but
   does not pin the address. A recipient allowlist is future work.
3. **`periodBlocks` is block-based.** "Per day/month" is approximate (~10 min/block). The demo uses
   two blocks for a practical judge walkthrough.
4. **Fee/sequence semantics.** `this.age` is OP_CHECKSEQUENCEVERIFY; the spending transaction must be
   version-2 with `nSequence >= periodBlocks`. Full nodes enforce the age; the mock provider validates
   the script branch only.
5. **Two wallets are required for the production flow.** The UI now connects separate payer and payee
   WizardConnect sessions, both using receive/0. A real two-device acceptance test remains pending.
6. **Multiple vault UTXOs.** A direct PUSD transfer can create another UTXO under the same covenant.
   v1.2 has `topUp` but no multi-UTXO cancel; the UI warns and cancels one UTXO at a time.
7. **Agent server custody.** `AGENT_WIF` is a server-side key controlling the agent payee/hot wallet.
   Use a dedicated low-balance key, never reuse a personal wallet, and keep the hot-wallet PUSD ceiling
   and BCH pre-funding small.
8. **Agent request controls depend on shared storage.** Redis REST provides cross-instance limits and
   request-id reservations when configured. The local fallback is process-local and is not sufficient
   for multi-instance production.
9. **0-conf service verification.** The interactive demo accepts a mempool payment and labels it
   `confirmed:false`; final evidence must wait for confirmation.
10. **Dependency surface.** Production dependencies are clean under `npm audit --omit=dev`; the dev
    toolchain reports high/moderate advisories in Vite/Tailwind. Do not ship dev tooling to users.

## Recommendations before Mainnet

- Run a Chipnet fund/claim/cancel with Selene or Paytaca, then repeat with a small Mainnet amount.
- Pre-fund the agent hot wallet with BCH for fees; the covenant claim output is not a fee faucet.
- Keep the agent vault at 2.00 PUSD and the hot-wallet ceiling at 0.10 PUSD.
- Confirm the PUSD category again immediately before funding.
- Keep `AGENT_ENABLED=false` locally and in any preview without a dedicated agent key.
- Record the real txids and confirmation in `docs/BUILT_DURING_BLAZE.md`; do not fabricate evidence.
