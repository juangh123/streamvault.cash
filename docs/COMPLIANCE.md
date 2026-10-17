# BCH BLAZE 2026 - compliance checklist

The hackathon has seven mandatory requirements. Failing any one disqualifies the submission.

## Pre-hackathon disclosure

The StreamVault.cash covenant, sandbox cockpit and documentation were seeded on 2026-10-14 and
2026-10-15. They are frozen at tag `v0-prehackathon-baseline` and are not presented as
competition-period work. The current sprint adds v1.2 contract hardening, WizardConnect signing, the
Agent Sandbox/API and an updated deck. Real Mainnet evidence, the official Google Slides port,
roll-call attendance, the CashTokens address and an organizer reply to the Telegram disclosure remain
pending. The full disclosure is in
[PRE_HACKATHON_BASELINE.md](PRE_HACKATHON_BASELINE.md).

| # | Requirement | Status | Where |
| :-- | :--- | :--- | :--- |
| 1 | Real BCH Mainnet transaction | TODO | fund a v1.2 vault and record real `claim`/`cancel` txids |
| 2 | Live, clickable demo (no local build) | DONE | https://streamvault-cash.vercel.app |
| 3 | WizardConnect wallet integration | IMPLEMENTED, pending device test | `WalletProvider.tsx` + fund/claim/cancel signing |
| 4 | Official 7-page Widget Factory slides | PARTIAL | in-app deck updated; Google Slides port still required |
| 5 | Attend a livestream + roll call | TODO (10/17) | Information Session, Beijing 22:00 |
| 6 | Telegram verification | DONE (disclosure posted) | joined `t.me/bchblaze` and posted the project disclosure on 2026-10-17 at 20:18 |
| 7 | CashTokens-receiving BCH address | TODO | add a mainnet address to the submission + README |

## Per-requirement notes

1. **Mainnet transaction** - acquire a small amount of BCH + verified PUSD, fund a vault, broadcast one
   `claim`, and run at least one Agent service payment. Record the txids in README. The baseline does
   not contain a project-owned Mainnet PUSD transaction.
2. **Live demo** - deployed and live at https://streamvault-cash.vercel.app (Vercel, master).
3. **WizardConnect** - the persistent manager now signs fund, top-up, claim and cancel WalletConnect objects
   and broadcasts the signed response through Electrum. A real Selene/Paytaca device test is still
   required before claiming this complete.
4. **Slides** - the in-app and local deck now use the Agent + payroll story. Port the 7 pages into
   the official Google Slides template before submitting.
5. **Livestream** - at least one team member must appear and sign in during roll call.
6. **Telegram** - the project disclosure was posted on 2026-10-17; an organizer reply is still pending.
7. **CashTokens address** - required to receive EMBER2026 votes and the airdrop.

Prepared disclosure text and roll-call questions are in
[ORGANIZER_DISCLOSURE.md](ORGANIZER_DISCLOSURE.md). Completing the text does not count as
attendance or Telegram verification.

## 2026-10-17 progress

- DoraHacks BCH BLAZE 2026 registration completed; the success dialog was visible on 2026-10-17.
- The BCH BLAZE Telegram chat was joined and the pre-hackathon disclosure was posted at 20:18
  (Asia/Shanghai). An organizer reply is still pending.
- The Information Session roll call is still pending. Do not mark requirement 5 complete until a
  team representative actually attends and checks in.

PUSD mainnet metadata was verified on 2026-10-17: category
`2469acc5afa4b10cb5b5c04afb89c3a3ffd61c5da9c01e26d00951cae2a02544`, decimals `2`. The application now
uses this verified category by default and blocks Mainnet if a demo category is configured. See
[PUSD_VERIFICATION.md](PUSD_VERIFICATION.md).

## Media track (optional second submission)

- Final Media target: [MEDIA_SCRIPT_V2.md](MEDIA_SCRIPT_V2.md), a 60-90 second agent-budget short
  with a real Mainnet operation.
- Baseline assets: poster `docs/media/poster.png`, sandbox explainer
  `docs/media/streamvault-explainer.mp4`, brand banner `docs/assets/banner.svg`.
- Host the final video on YouTube/X and link the DoraHacks media entry.
