# StreamVault.cash

![StreamVault.cash](docs/assets/banner.svg)

> **PUSD allowance for people and AI agents.** A non-custodial streaming vault on Bitcoin Cash, enforced by CashScript covenants and relative timelocks.

[![BCH BLAZE 2026](https://img.shields.io/badge/BCH%20BLAZE-2026-brightgreen.svg)](https://dorahacks.io/hackathon/bchblaze2026)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CashScript](https://img.shields.io/badge/Smart%20Contracts-CashScript%200.14-green)](https://cashscript.org/)
[![Network](https://img.shields.io/badge/Network-BCH%20Mainnet%20%7C%20Chipnet-orange)](https://bitcoincash.org)

> **Live demo:** https://streamvault-cash.vercel.app  ·  built for BCH BLAZE 2026
>
> **Agent demo:** open the app, keep **Agent** selected, and use the Sandbox Fast-Track. No wallet or funds are required.
>
> **CashTokens receiving address (Mainnet):** `bitcoincash:zzlgvjs8fvqdf43nz9yklcd0eh780x2xd5d9dxrnkv`
> **Submission deck:** [7-page Widget Factory deck (PDF)](https://streamvault-cash.vercel.app/StreamVault-BCH-Blaze-2026.pdf)
>
> Formerly **AgentPay.cash**. The original agent-allowance thesis is now the Agent tab; payroll is the second use case.
>
> **Before / after disclosure:** [baseline code](https://github.com/juangh123/streamvault.cash/tree/v0-prehackathon-baseline) · [before demo](https://streamvault-baseline.vercel.app) · [current demo](https://streamvault-cash.vercel.app)

> **Pre-hackathon baseline:** the covenant, sandbox cockpit and documentation were seeded before the
> build period and are frozen at tag `v0-prehackathon-baseline`. The current branch adds the v1.2
> contract hardening, WizardConnect signing path, Agent budget API and Agent-first cockpit. See
> [docs/PRE_HACKATHON_BASELINE.md](docs/PRE_HACKATHON_BASELINE.md) for the disclosure.

## Status

| Works today | Simulated | Pending before submission |
| :--- | :--- | :--- |
| Agent allowance Sandbox Fast-Track | Sandbox ledger and demo addresses | Real Mainnet fund/claim/cancel txids |
| PUSD streaming payroll Sandbox | Agent service response and request id | Real Selene/Paytaca device test |
| v1.2 covenant: 21 real VM tests | 0-conf interactive verification | Final media / DoraHacks form |
| WizardConnect signing code + CashTokens address | Sandbox ledger | Final media link |
| Live top-up (merge one PUSD UTXO) |  | DoraHacks project form |
| Vercel Functions: status/run/verify |  |  |
| Mainnet evidence strip (`src/lib/evidence.ts`, hidden until txids are recorded) |  |  |

The deployed Agent API only runs when `AGENT_ENABLED=true` and the server-side
`AGENT_WIF` / `SERVICE_ADDRESS` are configured. The Sandbox agent demo works without those values.

---

## What it is

StreamVault.cash lets a payer lock **PUSD (ParyonUSD)** - a CashTokens stablecoin pegged to USD - inside a
Bitcoin Cash covenant and release it to a payee as a **money stream**. The payee may withdraw at most
`amountPerPeriod` PUSD per `periodBlocks` blocks; the payer can cancel and reclaim the unstreamed balance
at any time. The same primitive gives an AI agent a bounded budget for per-request service payments.
Everything is enforced by the Bitcoin Cash VM - no custodial server, no chargebacks, no infinite billing loops.

Typical uses:

- **AI agent allowances** - an agent claims a small tranche, pays a service per request, and stops when the
  period budget is exhausted. The service verifies amount, destination, category and an OP_RETURN request id.
- **Freelance / contractor payroll** - a monthly retainer that the contractor draws down per period.
- **SaaS subscriptions** - a prepaid budget that releases a tranche per cycle.
- **Creator / grant streams** - continuous funding that stays cancellable by the sponsor.

---

![StreamVault.cash cockpit](docs/assets/app-claim.png)

## Why Bitcoin Cash

- **Sub-cent settlement**: BCH fees (~1 sat/byte) make per-period micro-settlement economically viable.
- **UTXO covenants**: introspection opcodes let the contract *prove* that change returns to the identical
  spending condition (`output[1].lockingBytecode == input[0].lockingBytecode`).
- **Relative timelocks**: `this.age` (OP_CHECKSEQUENCEVERIFY) natively encodes "at least N blocks since this
  UTXO", which is exactly a rate limit for a stream.
- **CashTokens**: PUSD is a native fungible token, so the covenant can enforce token conservation on-chain.

---

## How the covenant works

`contracts/StreamVault.cash` (CashScript `^0.14.0`, v1.2):

```
contract StreamVault(pubkey payerPk, pubkey payeePk, int amountPerPeriod, int periodBlocks, bytes pusdCategory)
```

- `claim(sig payeeSig, int amount)`
  - `checkSig(payeeSig, payeePk)` - only the payee can pull a tranche.
  - `tx.inputs.length == 1` and `this.activeInputIndex == 0` - one vault UTXO at a time.
  - The input must carry `pusdCategory` - no accidental token-category mismatch.
  - `this.age >= periodBlocks` - relative period must have elapsed.
  - `amount > 0 && amount <= amountPerPeriod` - per-period ceiling.
  - `tx.outputs.length == 2` - the payee tranche plus the vault change; no third output is allowed.
  - Output 0 carries exactly `amount` PUSD to the payee (`tokenCategory == pusdCategory`).
  - Output 1 carries the remaining PUSD back to the **identical covenant bytecode**; the new UTXO restarts the clock.
  - `output[1].value >= input.value - 2000` - the payee cannot drain the vault's BCH fee buffer.
- `cancel(sig payerSig, bytes payerLockingBytecode)`
  - The payer signature sweeps **100%** of the remaining PUSD to a payer-selected address.
- `topUp(sig payerSig)`
  - Merges one payer-owned PUSD UTXO into the vault UTXO.
  - Preserves the PUSD category and at most 2000 sats of BCH reduction.
  - Creates a fresh vault UTXO, so the relative period restarts.

Token conservation is guaranteed by the VM: a claim cannot drain the remaining PUSD balance (the
covenant requires a positive remainder), so only the payer's `cancel` can empty the token balance.
Claims use a 1 sat/byte fee estimate so the 1000-sat tranche output plus fee stays within the
2000-sat BCH reduction bound; fund, top-up and cancel use 2 sat/byte.

See [docs/STREAM_MECHANICS.md](docs/STREAM_MECHANICS.md) for the full mechanics, edge cases and the
"why relative locks" rationale.

---

## Quick start

```bash
npm install
npm run compile   # cashc contracts/StreamVault.cash -> contracts/artifacts/StreamVault.json
npm test          # 21 covenant tests evaluated against the real BCH VM (MockNetworkProvider)
npm run dev       # http://localhost:5173
```

Open `http://localhost:5173` and use the **Agent** tab: *Launch agent budget* -> *Run paid request* ->
*Run until budget exhausted* -> *Cancel & reclaim*. Switch to **Payroll** for the $1,000 streaming demo.
The sandbox mirrors the token, timelock, ceiling and BCH-buffer rules; no wallet or testnet coins are required.

---

## Test suite

- `npm test` - the v1.2 covenant against the **real BCH VM** (`contracts/test-streamvault.mjs`, `MockNetworkProvider`).
- `npm run test:engine` - sandbox engine invariants (`tests/stream.test.ts`).
- `npm run test:agent` - agent budget and budget-exhaustion invariants (`tests/agent.test.ts`).
- `npm run test:api` - server-side Agent API fail-closed guards (`tests/agent-server.test.ts`).
- `npm run test:derive` - offline covenant address derivation for Chipnet/Mainnet (`tests/derive.ts`).
- `npm run test:chain` - the live layer builds VM-accepted fund/top-up/claim/cancel txs and WalletConnect objects (`tests/chain.test.ts`).


The covenant suite loads the compiled artifact, instantiates the covenant
on a `MockNetworkProvider` (real VM validation) and asserts both accepted and rejected paths:

| Test | Scenario | Expectation |
| :--- | :--- | :--- |
| TEST-00 | Artifact / ABI (`claim`, `cancel`, `topUp`) | compiles |
| TEST-01 | Valid claim (800 <= 1000) | VM accepts |
| TEST-02 | Over-limit claim (2500 > 1000) | covenant reverts |
| TEST-03 | Claim before the period elapsed | covenant reverts |
| TEST-04 | Change redirected to an attacker | covenant reverts |
| TEST-05 | Zero-amount claim | covenant reverts |
| TEST-06 | Payer cancel sweeps 100% | VM accepts |
| TEST-07 | Cancel with a non-payer key | covenant reverts |
| TEST-08 | Broadcast updates the covenant UTXO | stream continues |
| TEST-09 | Claim signed by a non-payee key | covenant reverts |
| TEST-10 | Claim with a third output | covenant reverts |
| TEST-11 | Cancel routed to a non-payer address | covenant reverts |
| TEST-12 | Claim with a second input | covenant reverts |
| TEST-13 | Claim with the wrong input category | covenant reverts |
| TEST-14 | Claim draining the vault BCH buffer | covenant reverts |
| TEST-15 | Claim at the 2000-sat BCH boundary | VM accepts |
| TEST-16 | Payer top-up merges PUSD | VM accepts |
| TEST-17 | Top-up with a non-payer signature | covenant reverts |
| TEST-18 | Top-up with a wrong category | rejected |
| TEST-19 | Top-up with the wrong merged amount | rejected |
| TEST-20 | Top-up draining the BCH buffer | covenant reverts |

---

## Project layout

```
StreamVault.cash/
├── contracts/
│   ├── StreamVault.cash            # the covenant
│   ├── test-streamvault.mjs        # real VM test suite
│   └── artifacts/StreamVault.json  # compiled artifact (committed for judge convenience)
├── src/
│   ├── components/                 # React cockpit (Header, StreamControls, ClaimPanel, ...)
│   ├── lib/
│   │   ├── covenant.ts             # artifact + PUSD/network constants + address config
│   │   ├── stream.ts               # payroll sandbox engine
│   │   ├── agent-sim.ts            # agent budget sandbox engine
│   │   ├── agent-server.ts         # Vercel Function logic: status/run/verify
│   │   ├── chain.ts                # live layer: Electrum provider, contract, WC objects
│   │   └── format.ts               # PUSD/BCH formatting
│   ├── wallet/WalletProvider.tsx   # persistent WizardConnect manager + signing
│   └── types/
├── api/                            # Vercel Functions: agent/status, agent/run, service/insight
└── docs/                           # PRD, ARCHITECTURE, SECURITY, STREAM_MECHANICS, SLIDES, ...
```

---

## Live settlement and agent API

`src/wallet/WalletProvider.tsx` keeps separate payer and payee WizardConnect managers alive after the
QR dialogs close. Both roles sign with their own `receive/0` key. Funding, top-up and cancel use the
payer wallet; claims use the payee wallet. `src/lib/chain.ts` builds the WalletConnect objects,
serializes them to hex and broadcasts the signed response through Electrum. The live payroll panel
never shows sandbox data.

The Agent demo has three Vercel Functions:

- `GET /api/agent/status?payerPubkey=...`
- `POST /api/agent/run` with `{ "payerPubkey": "...", "requestId": "..." }`
- `GET /api/service/insight?requestId=...&txid=...`

Server-side variables:

| Variable | Purpose |
| :--- | :--- |
| `AGENT_ENABLED` | Master switch; set to `true` to enable the live agent path |
| `AGENT_WIF` | Agent payee/hot-wallet key; never exposed to the client |
| `SERVICE_ADDRESS` | PUSD token address that receives the 0.01 PUSD service payment |
| `PUSD_CATEGORY` | Verified PUSD category (defaults to `2469acc5...2544`) |
| `AGENT_AMOUNT_PER_PERIOD` | Base units per tranche (demo default `10` = 0.10 PUSD) |
| `AGENT_PERIOD_BLOCKS` | Demo period (default `2`) |
| `AGENT_SERVICE_PRICE` | Base units per service call (default `1` = 0.01 PUSD) |
| `AGENT_MAX_BALANCE` | Hot-wallet PUSD ceiling (default `10`) |
| `AGENT_RATE_LIMIT` | Requests per IP per minute (default `30`) |
| `AGENT_STORE_URL` | Optional Redis REST endpoint for shared rate limits and request ids |
| `AGENT_STORE_TOKEN` | Redis REST bearer token; never expose it to the browser |
| `AGENT_REQUEST_TTL_SECONDS` | Request-id reservation lifetime (default `86400`) |

Run `npm run verify:wallet-config` to validate the local Agent network, WIF, service address and
limits without printing the WIF. The command reads `.env.agent-wallet.local` by default.

Without `AGENT_STORE_URL` and `AGENT_STORE_TOKEN`, the API uses a process-local memory fallback. Configure
both variables before relying on rate limits or request-id de-duplication across multiple instances.

Run `npm run verify:release` before release to execute every non-browser test, typecheck, production
build and client secret scan in one command.

`VITE_AGENT_DEMO_PAYER_PUBKEY` is an optional public build-time payer key for a pre-funded
Live demo vault. It lets the Agent view load real Mainnet status and run paid requests without
connecting a wallet. Never use a WIF or private key in this variable.

The interactive agent demo accepts 0-conf and labels it; evidence in this README should wait for at
least one confirmation. Rate limiting and request-id de-duplication are in-memory hackathon controls,
not a durable production queue.

---

## Compliance (BCH BLAZE 2026)

See [docs/COMPLIANCE.md](docs/COMPLIANCE.md) for the seven mandatory requirements checklist.
See [docs/SUBMISSION.md](docs/SUBMISSION.md) for the DoraHacks form fields and evidence placeholders.
See [docs/PRE_HACKATHON_BASELINE.md](docs/PRE_HACKATHON_BASELINE.md) for the pre-hackathon
disclosure and the competition-period change scope.
See [docs/V2_SPEC.md](docs/V2_SPEC.md) for the contract, wallet and Agent design.

**Still pending before submission:** real Mainnet fund/claim/cancel and agent-service txids,
a real Selene/Paytaca device test, final media, and the DoraHacks project form. The form opens on
2026-11-13 06:00 and closes on 2026-11-22 07:00 (UTC-6); the paste-ready text is in
[docs/DORAHACKS_BUIDL.md](docs/DORAHACKS_BUIDL.md).

## Roadmap

1. **Hackathon MVP** - v1.2 covenant, agent budget demo, payroll cockpit, wallet-signed Mainnet settlement.
2. **SDK + MCP server** - let AI agents request and settle a per-call PUSD budget programmatically.
3. **Marketplace** - a directory of PUSD-denominated services with verified request ids.

## License

MIT (c) 2026 StreamVault.cash contributors
