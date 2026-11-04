# DoraHacks submission sheet

Use this file as the single source of truth when filling the BCH BLAZE 2026 submission form.
The paste-ready form text is in [DORAHACKS_BUIDL.md](DORAHACKS_BUIDL.md).
Local sprint checks and remaining gates: [2026-11-04 sprint](SPRINT_2026-11-04.md).

## Official timeline (DoraHacks page, UTC-6)

| Milestone | Time |
| :--- | :--- |
| Submission opens | 2026-11-13 06:00 |
| Submission deadline | 2026-11-22 07:00 |
| Judging | 2026-11-23 to 2026-11-27 |
| Winners livestream | 2026-11-28 |

The DoraHacks form cannot be submitted before the window opens.

## Project

| Field | Value |
| :--- | :--- |
| Project name | StreamVault.cash |
| Former name | AgentPay.cash |
| Tagline | Give an AI an allowance, not your bank account. |
| Tracks | Mainnet; Media optional |
| Repository | https://github.com/juangh123/streamvault.cash |
| Live demo | https://streamvault-cash.vercel.app |
| Pre-hackathon baseline | tag `v0-prehackathon-baseline` |
| Pre-hackathon code | https://github.com/juangh123/streamvault.cash/tree/v0-prehackathon-baseline |
| Pre-hackathon demo | https://streamvault-baseline.vercel.app |
| Current demo | https://streamvault-cash.vercel.app |
| Deck | [7-page Widget Factory deck (PDF)](https://streamvault-cash.vercel.app/StreamVault-BCH-Blaze-2026.pdf); source PPTX/PDF in `docs/deck` |
| Video | Sandbox walkthrough, labelled simulated (48 s): https://streamvault-cash.vercel.app/judge/streamvault-sandbox-demo.mp4. A Mainnet run video is still to be recorded; `docs/media/streamvault-explainer.mp4` is the older pre-hackathon draft |
| CashTokens receiving address | `bitcoincash:zzlgvjs8fvqdf43nz9yklcd0eh780x2xd5d9dxrnkv` |

## Required mainnet evidence

| Action | Txid | Explorer | Confirmed |
| :--- | :--- | :--- | :--- |
| Fund | PENDING | PENDING | PENDING |
| Claim | PENDING | PENDING | PENDING |
| Top-up (optional) | PENDING | PENDING | PENDING |
| Cancel | PENDING | PENDING | PENDING |
| Agent service payment | PENDING | PENDING | PENDING |

Do not replace `PENDING` with a testnet, simulator or fabricated txid. Label Chipnet evidence as
Chipnet everywhere.

After each Mainnet txid has at least one confirmation, also add it to `MAINNET_EVIDENCE` in
`src/lib/evidence.ts`. The app then shows a "Verified on BCH Mainnet" strip with 3xpl links under
the header, and `npm run test:agent` rejects malformed or duplicate txids. Keep the public demo vault
funded through judging (2026-11-23 to 2026-11-27); record the `cancel` evidence on a separate vault.

## Agent API configuration

| Variable | Required value |
| :--- | :--- |
| `AGENT_ENABLED` | `true` for the live path |
| `AGENT_WIF` | dedicated low-balance agent key; never expose |
| `SERVICE_ADDRESS` | PUSD token address that receives the 0.01 PUSD call payment |
| `PUSD_CATEGORY` | `2469acc5afa4b10cb5b5c04afb89c3a3ffd61c5da9c01e26d00951cae2a02544` |
| `AGENT_AMOUNT_PER_PERIOD` | `10` (0.10 PUSD) |
| `AGENT_PERIOD_BLOCKS` | `2` |
| `AGENT_SERVICE_PRICE` | `1` (0.01 PUSD) |
| `AGENT_MAX_BALANCE` | `10` |
| `AGENT_RATE_LIMIT` | `30` |
| `VITE_AGENT_DEMO_PAYER_PUBKEY` | optional public payer key for the pre-funded Live demo vault |

The Agent hot wallet needs BCH for fees: at least 20,000 sats, and about 100,000 sats to cover judging
(each paid request costs about 1,900 sats). The step-by-step Mainnet procedure is in [RUNBOOK.md](RUNBOOK.md).

## Judge path

1. Open the live demo.
2. Keep **Agent** selected and **Sandbox** active.
3. Launch agent budget.
4. Run paid request.
5. Run until budget exhausted.
6. Fast-forward one period and run again.
7. Cancel and reclaim.

Payroll fallback: switch to **Payroll** → **Sandbox** and run the $1,000 stream.

## Submission checklist

Local phone update (2026-11-04, code `07b2673`): Selene Payer pairing, return after 60 seconds in
the phone background, and automatic recovery after a browser refresh passed on localhost. No signing
or broadcast occurred. The phone-wallet gate below stays open for signing, device/version details
and production retest; C4 browser-hidden behavior remains unverified. See the phone test record.

- [ ] Real Mainnet txids added to README and `docs/BUILT_DURING_BLAZE.md` - blocked on funding: on
      2026-11-02 no project Mainnet address (payer, agent, service, Selene receive/0) had any history
- [ ] Selene or Paytaca phone-wallet test: connect, background recovery, reject and sign; record device,
      OS and wallet versions in [PHONE_WALLET_TEST_ZH.md](PHONE_WALLET_TEST_ZH.md). The Chipnet lifecycle with Cashonize web wallets
      ([CHIPNET_EVIDENCE.md](CHIPNET_EVIDENCE.md)) does not count as this test
- [x] Official Widget Factory template port rendered as PPTX + PDF
- [x] Template-based deck published as a self-hosted PDF (Google Slides link blocked by Google on 2026-10-28)
- [x] CashTokens receiving address added
- [x] Telegram disclosure posted 2026-10-17; organizer replied with pre-existing-work rules
- [x] DoraHacks registration completed
- [x] At least one preparation-stream roll call
- [ ] DoraHacks project submission completed - form opens 2026-11-13 06:00 (UTC-6); draft ready in
      [DORAHACKS_BUIDL.md](DORAHACKS_BUIDL.md)
- [x] Commit and push the product diff (latest code commit `cad18b3`; origin/master and Vercel production
      in sync, checked 2026-11-02)
- [ ] Old/new repository and pre-hackathon demo links added to the submission - links are live in the
      site banner and prefilled in the BUIDL draft; tick after the form is submitted
