# Built during BCH BLAZE 2026

This file separates the disclosed pre-hackathon baseline from the current sprint work.

## Baseline

- Tag: `v0-prehackathon-baseline`
- Commit: `491287e600621013f4ad53beca7a8b914588d1ae`
- Disclosure: [PRE_HACKATHON_BASELINE.md](PRE_HACKATHON_BASELINE.md)
- Baseline tag date: 2026-10-15
- Baseline demo: https://streamvault-baseline.vercel.app
- Current demo: https://streamvault-cash.vercel.app

## Current sprint evidence

| Item | Value |
| :--- | :--- |
| Start commit | `4c9c083` (last baseline disclosure commit) |
| Sprint code | v1.2 contract, WalletProvider signing, Agent API, Agent-first cockpit |
| Final code commit | `2ebd6558e2e7d35192bbca08e6c96ef7274ff936` |
| Baseline-to-final diff | `git diff --stat v0-prehackathon-baseline..2ebd655` (68 files, +5064/-603) |

The code commit above is the current build-period candidate. The final evidence commit may add
Mainnet txids and the official deck link after those external steps are complete.

## Contract v1.2

- Claim input/output shape: one vault input, two outputs.
- BCH buffer bound: `output[1].value >= input.value - 2000`.
- Token category check: input and both outputs must match the configured PUSD category.
- `topUp`: merges one payer-owned PUSD UTXO and restarts the relative period.
- Multi-UTXO cancel: not in v1.2; cancel one vault UTXO at a time.
- VM test result: 21 passed, 0 failed (`npm test`).
- Chain test result: 9 passed (`npm run test:chain`).

## Wallet transactions

| Action | Network | Txid | Explorer |
| :--- | :--- | :--- | :--- |
| Fund | Mainnet | PENDING `PAYER` wallet | PENDING |
| Claim | Mainnet | PENDING `PAYEE` wallet | PENDING |
| Cancel | Mainnet | PENDING `PAYER` wallet | PENDING |
| Agent service payment | Mainnet | PENDING `AGENT_WIF` | PENDING |

Do not replace `PENDING` with a fabricated or unpublished txid. The app's interactive agent path
accepts 0-conf; evidence should wait for at least one confirmation.

## Agent demo

- Status endpoint: `GET /api/agent/status?payerPubkey=...`
- Run endpoint: `POST /api/agent/run`
- Service endpoint: `GET /api/service/insight?requestId=...&txid=...`
- Request id format: `SV1:<requestId>` in an OP_RETURN output.
- Verification: amount, destination, PUSD category, request id and confirmation state via Electrum.
- Budget exhausted: the covenant rejects a new tranche until the relative period elapses; the API
  returns `BUDGET_EXHAUSTED` with `nextClaimBlock`.
- Rate limit and hot-wallet controls: `AGENT_RATE_LIMIT`, `AGENT_MAX_BALANCE`, `AGENT_ENABLED`.
- Request-id de-duplication: process-local Set plus on-chain OP_RETURN check. A durable KV is future work.

## Deliverables

- Live demo: https://streamvault-cash.vercel.app
- Agent sandbox: `/` → Agent → Launch agent budget
- Payroll sandbox: `/` → Payroll → Launch Demo Stream
- Official-template deck: `docs/deck/StreamVault-BCH-Blaze-2026-Widget-Factory.pptx`
- Public deck PDF: `docs/deck/StreamVault-BCH-Blaze-2026-Widget-Factory.pdf` and `/StreamVault-BCH-Blaze-2026.pdf`
- In-app deck: `src/components/SlideDeck.tsx`
- Media draft: `docs/media/streamvault-explainer.mp4` (sandbox only; do not submit as final)
- CashTokens receiving address: `bitcoincash:zzlgvjs8fvqdf43nz9yklcd0eh780x2xd5d9dxrnkv`
- Official Widget Factory template port: DONE (7 slides, local structure/layout validation passed)
- Google Slides publish link: PENDING
- Telegram organizer response: DONE (pre-existing-work rules confirmed)
- Preparation-stream roll call: DONE (2026-10-17 22:56 Beijing)

## Compliance statement

The current branch implements the v1.2 contract hardening, a persistent WizardConnect signing path,
the Agent budget API and an Agent-first cockpit. Real Mainnet transaction evidence and the Google
Slides publish link are still pending and must be completed before submission.
