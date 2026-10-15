# Independent security review (adversarial pass)

Scope: `contracts/StreamVault.cash`, the live layer (`src/lib/chain.ts`), and the client. Reviewed by
stepping through every `require` and the transaction-building code, plus the automated suites.

## What is proven

| Property | Evidence |
| :--- | :--- |
| Only the payee can `claim` | `checkSig(payeeSig, payeePk)` - TEST-09 (wrong key rejected) |
| Rate limit: one tranche per period | `this.age >= periodBlocks` - TEST-03 (early claim rejected) |
| Per-period ceiling | `amount <= amountPerPeriod` - TEST-02 |
| Non-zero tranche | `amount > 0` - TEST-05 |
| Exactly two outputs | `tx.outputs.length == 2` - TEST-10 |
| Change returns to the identical covenant | `output[1].lockingBytecode == input.lockingBytecode` - TEST-04 |
| Token conservation (no mint/steal) | VM CashTokens rules + `tokenCategory == pusdCategory` |
| A claim cannot drain the vault | `remaining > 0` - ENGINE-05, CHAIN-02 |
| Only the payer can `cancel` | `checkSig(payerSig, payerPk)` - TEST-07 |
| Cancel pays the payer destination | `output[0].lockingBytecode == payerLockingBytecode` - TEST-11 |
| Real networks reachable | `npm run verify:network` (Chipnet + Mainnet) |

26 automated checks across `npm test` (12), `npm run test:engine` (12), `npm run test:chain` (5 in
addition to the derive/network probes).

## Residual risks and notes

1. **Per-period, not per-total.** The covenant caps each tranche but has no cumulative budget. Payers
   bound total exposure with the deposit size and by cancelling; this is by design for a payroll stream.
2. **Output 0 destination is payer/payee-chosen.** The covenant requires output 0 to carry `amount` PUSD
   but does not pin the address - intended (the payee decides where its tranche lands). A future
   recipient allowlist would tighten this.
3. **`periodBlocks` is block-based.** "Per day/month" is approximate (~10 min/block). No wall-clock
   guarantee.
4. **Fee/sequence semantics.** `this.age` is OP_CHECKSEQUENCEVERIFY; the spending transaction must be
   version-2 with the input `nSequence` set to `>= periodBlocks`. Full nodes enforce the age; the mock
   provider validates the script branch only (documented).
5. **Live signing.** No private key is stored in the browser; payer/payee sign with their own wallets
   (WizardConnect) or a throwaway demo key on Chipnet. Never reuse a demo key with real funds.
6. **`PUSD_CATEGORY` placeholder.** `src/lib/covenant.ts` ships a demo category; set the real ParyonUSD
   category before any Mainnet settlement.
7. **Dependency surface.** `cashscript` 0.14 + `@bitauth/libauth` 3.1 pre-release + `@wizardconnect/*`.
   `npm audit` reports transitive advisories; pin versions and re-audit before launch.

## Recommendations before Mainnet

- Set the real PUSD category and re-run `npm run verify:network`.
- Settle on Chipnet first, then a small Mainnet amount.
- Add an upper bound check on `amountPerPeriod` at stream creation (UI guard already present).