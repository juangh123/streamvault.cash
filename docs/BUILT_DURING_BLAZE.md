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
| Final code commit | `7d363aface18b6188120000a6ab38096e2f5c7c6` (mainnet-first agent cockpit, dual wallets) |
| Final deck commit | `67661775ff5b4255939570baddbc1f5bb732cd18` (business-model slide, deck PDF links) |
| Baseline-to-final diff | `git diff --stat v0-prehackathon-baseline..6766177` (79 files, +6146/-644, 22 commits) |
| Pushed and deployed | origin/master and the Vercel production deployment both on `6766177` (checked 2026-10-28) |

The code commit above is the current build-period candidate. The final evidence commit may add
Mainnet txids and the official deck link after those external steps are complete.

## Contract v1.2

- Claim input/output shape: one vault input, two outputs.
- BCH buffer bound: `output[1].value >= input.value - 2000`.
- Token category check: input and both outputs must match the configured PUSD category.
- `topUp`: merges one payer-owned PUSD UTXO and restarts the relative period.
- Multi-UTXO cancel: not in v1.2; cancel one vault UTXO at a time.
- VM test result: 21 passed, 0 failed (`npm test`).
- Chain test result: 10 passed (`npm run test:chain`).
- Other suites on 2026-10-28 (clean `npm ci`): engine 12, agent 6, API 10, derive 2 - all passed;
  typecheck, production build and the client secret scan passed; the Playwright judge path passed
  locally and against https://streamvault-cash.vercel.app.

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
- Request-id de-duplication and rate limiting: optional Redis REST store; process-local fallback for
  local development, plus the on-chain OP_RETURN check.

## Deliverables

- Live demo: https://streamvault-cash.vercel.app
- Agent sandbox: `/` → Agent → Launch agent budget
- Payroll sandbox: `/` → Payroll → Launch Demo Stream
- Final editable deck: `docs/deck/StreamVault-BCH-Blaze-2026-Submission.pptx`
- Public deck PDF: `docs/deck/StreamVault-BCH-Blaze-2026-Submission.pdf` and `/StreamVault-BCH-Blaze-2026.pdf`
- In-app deck: `src/components/SlideDeck.tsx`
- Media draft: `docs/media/streamvault-explainer.mp4` (sandbox only; do not submit as final)
- CashTokens receiving address: `bitcoincash:zzlgvjs8fvqdf43nz9yklcd0eh780x2xd5d9dxrnkv`
- Official Widget Factory template port: DONE (7 slides, local structure/layout validation passed)
- Public deck link: self-hosted PDF (Google Slides copy blocked by Google on 2026-10-28)
- Telegram organizer response: DONE (pre-existing-work rules confirmed)
- Preparation-stream roll call: DONE (2026-10-17 22:56 Beijing)

## Compliance statement

The current branch implements the v1.2 contract hardening, a persistent WizardConnect signing path,
the Agent budget API and an Agent-first cockpit. Real Mainnet transaction evidence is still pending
and must be completed before submission.
