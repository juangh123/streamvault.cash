# DoraHacks submission sheet

Use this file as the single source of truth when filling the BCH BLAZE 2026 submission form.

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
| Deck | [template-based PDF](https://streamvault-cash.vercel.app/StreamVault-BCH-Blaze-2026.pdf); PPTX in `docs/deck/StreamVault-BCH-Blaze-2026-Widget-Factory.pptx`; Google Slides publish PENDING |
| Video | `docs/media/streamvault-explainer.mp4` is a sandbox draft; do not submit it as final |
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

The Agent hot wallet needs BCH for fees. Pre-fund it with about 20,000 sats.

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

- [ ] Real Mainnet txids added to README and `docs/BUILT_DURING_BLAZE.md`
- [ ] Real wallet device test on Selene or Paytaca
- [x] Official Widget Factory template port rendered as PPTX + PDF
- [ ] Template-based deck uploaded and published in Google Slides
- [x] CashTokens receiving address added
- [x] Telegram disclosure posted 2026-10-17; organizer replied with pre-existing-work rules
- [x] DoraHacks registration completed
- [x] At least one preparation-stream roll call
- [ ] DoraHacks project submission completed
- [ ] Commit and push the build-period product diff
- [ ] Old/new repository and pre-hackathon demo links added to the submission
