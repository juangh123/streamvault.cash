# Pre-hackathon baseline

Prepared: 2026-10-17 (Asia/Shanghai)

Frozen tag: `v0-prehackathon-baseline`

Frozen commit: `491287e600621013f4ad53beca7a8b914588d1ae`

## Purpose

This document defines the StreamVault.cash prototype that existed before the BCH BLAZE 2026 build
period. It is published so judges and organizers can distinguish seed work from work completed during
the competition.

The repository history begins on 2026-10-14 with the former AgentPay.cash direction. The
StreamVault.cash covenant, tests, app, documentation and media draft were committed on 2026-10-15.
Those commits are not presented as hackathon-period work.

All product changes described as competition upgrades below are scheduled for 2026-11-14 through
2026-11-22. No new product code will be merged before that window.

## What exists in the baseline

- A CashScript covenant with two functions, `claim` and `cancel`.
- A real BCH VM test suite for the covenant. At the frozen commit it reports 12 passing tests.
- A React cockpit with a sandbox workflow for create, claim, top-up and cancel.
- Chipnet and Mainnet covenant address derivation.
- Electrum-backed vault UTXO and token queries.
- Transaction builders and WizardConnect transaction-object builders for `claim` and `cancel`.
- A WizardConnect pairing dialog using `@wizardconnect/react`.
- A settlement CLI that can sign `claim` and `cancel` with WIF keys on a live network.
- A live Vercel deployment at https://streamvault-cash.vercel.app.
- A draft seven-page deck and a 90-second sandbox explainer video.

## Known limitations at the baseline

### No completed live product flow

The deployed UI is a sandbox demo plus wallet pairing. The pairing dialog is real, but the UI does not
yet call WizardConnect `signTransaction` for `fund`, `topUp`, `claim` or `cancel`. Live transaction
building exists in `src/lib/chain.ts` and the WIF-based CLI, but the browser flow is not end-to-end.

There is no project-owned BCH Mainnet PUSD transaction recorded in the repository at this commit.

### Claims can reduce the vault's BCH buffer

The v1 covenant requires exactly two outputs and forces the token-bearing change output back to the
same covenant bytecode. It does not enforce a minimum BCH value on that change output.

Within the two-output shape, a payee can assign most of the vault's BCH to output 0 and leave only a
dust amount on output 1. The token rules still hold, but the BCH buffer used for future miner fees can
be reduced. This is a real v1 limitation. It is not mitigated by `tx.outputs.length == 2`.

### Claim input and token checks are incomplete

`claim` does not require the transaction to have exactly one input. It also does not explicitly read
and compare the vault input's token category with `pusdCategory`; v1 relies on CashTokens conservation
and the output checks instead.

### Multiple vault UTXOs are not handled

There is no covenant `topUp` function. Sending PUSD directly to the vault address can create an
additional UTXO under the same locking bytecode, which weakens the one-tranche-per-period accounting.
The current `cancel` path also validates only `tx.outputs[this.activeInputIndex]`, so it cannot reclaim
multiple vault UTXOs in one transaction.

### Mainnet token metadata

At the frozen baseline, `PUSD_CATEGORY` in `src/lib/constants.ts` is a demo category (`aa...aa`) and
the real token metadata had not been verified.

On 2026-10-17 the official ParyonUSD site, app bundle and contracts repository were cross-checked.
The mainnet category is
`2469acc5afa4b10cb5b5c04afb89c3a3ffd61c5da9c01e26d00951cae2a02544` and PUSD uses 2 decimals.
See [PUSD_VERIFICATION.md](PUSD_VERIFICATION.md). The application configuration remains unchanged
until the competition build period.

### Agent budget layer is not implemented

There are no Vercel Functions for an agent budget, no PUSD service payment verifier, no OP_RETURN
request binding and no hot-wallet controls. The AI-agent use case is a planned competition upgrade,
not a baseline feature.

### Media is a sandbox draft

The existing explainer video describes the sandbox lifecycle. It does not contain a real Mainnet
transaction, a wallet-signed flow or an agent paying for a service.

## Competition build scope

The following work belongs to the 2026-11-14 through 2026-11-22 build period.

1. Contract v2:
   - Require one vault input and exactly two outputs in `claim`.
   - Require the vault input token category to equal `pusdCategory`.
   - Require the vault change output to preserve input BCH minus at most 2000 sats.
   - Add `topUp(sig payerSig)` so PUSD inputs merge into one vault UTXO.
   - Validate `cancel` against `tx.outputs[this.activeInputIndex]` and support multiple vault UTXOs.
2. Wallet transactions:
   - Wire WizardConnect `signTransaction({ transaction, inputPaths })` into `fund`, `topUp`, `claim`
     and `cancel`.
   - Query wallet UTXOs through Electrum.
   - Show the real txid and explorer link after broadcast.
   - Verify the PUSD category and decimals before enabling Mainnet.
3. Agent budget layer:
   - Add `POST /api/agent/run` and `GET /api/service/insight`.
   - Let the agent claim a limited per-period budget, then pay a service per request with an
     OP_RETURN request id.
   - Verify amount, payee address and request id through Electrum before returning data.
   - Keep only a small `AGENT_WIF` on the server, with an enable switch, balance ceiling and rate
     limit.
4. Judge experience:
   - Provide the agent run, wallet flow and sandbox fallback as separate entry points.
   - Replace the static media draft with a 60 to 90 second story that includes a real Mainnet run.
   - Rebuild the seven-page deck in the official Widget Factory template.

## Baseline verification

The baseline was checked with the repository's current dependencies:

```bash
npm test
```

Result on 2026-10-17:

```text
12 passed, 0 failed (of 12)
```

The other automated suites and the production build will be re-run during the competition window
after the wallet and agent changes are implemented.

## Compliance statement

The code reachable from `v0-prehackathon-baseline` is prior seed work. The project does not claim it
as work completed during BCH BLAZE 2026.

The contract v2, real wallet transactions, Agent budget layer, Mainnet evidence, final deck and final
Media submission will be implemented, reviewed, committed and documented during the competition
build period. `docs/BUILT_DURING_BLAZE.md` will contain the commit range and transaction evidence.

If the organizers determine that seed code may not be used at all, the fallback is to rebuild from an
empty repository during the build period. In that case the same core scope remains: contract, wallet
transactions, live demo and the agent budget path. Non-core polish can be removed to protect those
four deliverables.
