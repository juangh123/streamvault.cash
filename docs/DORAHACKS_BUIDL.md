# DoraHacks BUIDL draft (paste-ready)

Prepared 2026-10-28. The BCH BLAZE 2026 submission form opens **2026-11-13 06:00 (UTC-6)** and
closes **2026-11-22 07:00 (UTC-6)**. Judging runs 2026-11-23 to 2026-11-27; winners are announced
on 2026-11-28. Paste the fields below when the form opens, then replace every `PENDING` in the
Mainnet evidence table with confirmed txids (never testnet, simulator or placeholder values).

Submit to the **Mainnet** track. Add a separate **Media** entry only after the final video with a
real Mainnet operation exists (see [MEDIA_SCRIPT_V2.md](MEDIA_SCRIPT_V2.md)).

## Short fields

| Form field | Value |
| :--- | :--- |
| BUIDL name | StreamVault.cash |
| One-line vision / tagline | Give an AI an allowance, not your bank account. |
| Track | Mainnet |
| Website / live demo | https://streamvault-cash.vercel.app |
| GitHub (current repo) | https://github.com/juangh123/streamvault.cash |
| Pre-hackathon code (old repo state) | https://github.com/juangh123/streamvault.cash/tree/v0-prehackathon-baseline |
| Pre-hackathon demo | https://streamvault-baseline.vercel.app |
| Widget Factory deck (PDF) | https://streamvault-cash.vercel.app/StreamVault-BCH-Blaze-2026.pdf |
| CashTokens address (EMBER2026) | `bitcoincash:zzlgvjs8fvqdf43nz9yklcd0eh780x2xd5d9dxrnkv` |
| Demo video | Leave empty until the final Mainnet video exists; do not link the sandbox draft |
| Team | Autonomous Cash (Jason) |
| Tags | Bitcoin Cash, CashTokens, AI agents, Stablecoins, Payments, CashScript |

## Details (Markdown body)

```markdown
# StreamVault.cash

**Give an AI an allowance, not your bank account.**
PUSD budgets for AI agents and people, enforced by a CashScript covenant on Bitcoin Cash.

| | |
| :--- | :--- |
| Live demo | https://streamvault-cash.vercel.app |
| Widget Factory deck | https://streamvault-cash.vercel.app/StreamVault-BCH-Blaze-2026.pdf |
| Current repo | https://github.com/juangh123/streamvault.cash |
| Pre-hackathon code | https://github.com/juangh123/streamvault.cash/tree/v0-prehackathon-baseline |
| Pre-hackathon demo | https://streamvault-baseline.vercel.app |
| CashTokens address | bitcoincash:zzlgvjs8fvqdf43nz9yklcd0eh780x2xd5d9dxrnkv |

## The problem

An AI agent with a wallet can spend everything it can reach. A spending cap written in a prompt is
not a financial control. Payroll and vendor payments have the same shape: money arrives in lumps,
with a custodian in the middle.

## What StreamVault does

A payer locks PUSD (ParyonUSD) in a covenant vault and keeps a cancel key. The payee, a person or an
AI agent, may withdraw at most `amountPerPeriod` PUSD every `periodBlocks` blocks. The Bitcoin Cash VM
enforces the cap and the period; no server holds the funds.

The agent demo uses a 2.00 PUSD vault, a 0.10 PUSD tranche every 2 blocks and a 0.01 PUSD service
call. The agent claims its tranche, pays a service per request with an OP_RETURN request id
(`SV1:<requestId>`), and stops when the period budget is used up. The service verifies amount,
destination, PUSD category and request id through Electrum before it answers.

## How the limit is enforced (v1.2 covenant)

- `claim`: payee signature, one vault input, exactly two outputs, `this.age >= periodBlocks`,
  `0 < amount <= amountPerPeriod`, change returns to the identical covenant bytecode, and the BCH fee
  buffer can drop by at most 2000 sats.
- `topUp`: the payer merges one PUSD UTXO into the vault; the period restarts.
- `cancel`: the payer sweeps the remaining PUSD back to a payer-chosen address.
- 21 covenant tests run against the real BCH VM, plus engine, agent, API, derivation and chain suites.

## Try it in 60 seconds (no wallet needed)

1. Open the live demo. Keep **Agent** selected and **Sandbox** active.
2. **Launch agent budget** → **Run paid request**.
3. **Run until budget exhausted**: the UI shows the next claim block.
4. **Fast-forward 1 period**, run again, then **Cancel & reclaim**.

Payroll fallback: **Payroll** → **Sandbox** → **Launch Demo Stream** ($1,000 stream).

Live mode connects real wallets through **WizardConnect** (separate payer and payee sessions, each
signing with its own `receive/0` key) and broadcasts through Electrum.

## BCH Mainnet evidence

| Action | Txid | Explorer |
| :--- | :--- | :--- |
| Fund vault | PENDING | PENDING |
| Claim tranche | PENDING | PENDING |
| Agent service payment (0.01 PUSD) | PENDING | PENDING |
| Cancel & reclaim | PENDING | PENDING |

## Pre-existing work (disclosure)

The covenant, sandbox cockpit and documentation were seeded on 2026-10-14 and 2026-10-15 and are
frozen at tag `v0-prehackathon-baseline` (commit `491287e`), with the matching demo at
https://streamvault-baseline.vercel.app. Work after the baseline: the v1.2 contract (two-output claim,
category check, BCH-buffer bound, `topUp`), WizardConnect signing for fund/top-up/claim/cancel,
the Agent budget API and Agent-first cockpit, and the Widget Factory deck. The full diff and evidence
are in `docs/BUILT_DURING_BLAZE.md`.

## Why BCH, and who pays

Near-zero fees make 0.01 PUSD service calls practical. Relative timelocks, transaction introspection
and native CashTokens are the enforcement layer, and WizardConnect keeps keys in the user's wallet.
Revenue comes from agent builders (hosted budget console), API and MCP tool providers (SDK and
verifier for $0.01 PUSD calls) and a small hosted-gateway fee per verified call. The covenant itself
charges no protocol fee; self-hosting is free. First market: paid MCP tools and data APIs.

## Requirements

- BCH Mainnet transaction: see the evidence table above
- Live demo: https://streamvault-cash.vercel.app
- WizardConnect integration: `src/wallet/WalletProvider.tsx`
- Widget Factory deck: linked above and in the site banner
- Roll call: Information Session #1, 2026-10-17
- Telegram verification: disclosure posted 2026-10-17, organizer replied
- CashTokens address: listed above and in the site banner
```

## Before pressing Submit

- [ ] Every Mainnet txid above has at least one confirmation and opens on an explorer.
- [ ] The same txids are in `src/lib/evidence.ts`, README, `BUILT_DURING_BLAZE.md` and
      `SUBMISSION.md`, and the production site shows the "Verified on BCH Mainnet" strip.
- [ ] The public demo vault stays funded through 2026-11-27.
- [ ] The site banner still shows the deck, GitHub, pre-hackathon code, pre-hackathon demo and
      CashTokens address links.
