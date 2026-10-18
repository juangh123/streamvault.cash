# BCH BLAZE 2026 - compliance checklist

The hackathon has seven mandatory requirements. Failing any one disqualifies the submission.

## Pre-hackathon disclosure

The StreamVault.cash covenant, sandbox cockpit and documentation were seeded on 2026-10-14 and
2026-10-15. They are frozen at tag `v0-prehackathon-baseline` and are not presented as
competition-period work. The current sprint adds v1.2 contract hardening, WizardConnect signing, the
Agent Sandbox/API and a deck ported into the official Widget Factory template. Real Mainnet evidence
remains pending. Roll-call attendance is complete (2026-10-17) and an
organizer replied in Telegram with the pre-existing-work rules (banner plus before/after code and
demo links). The full disclosure is in
[PRE_HACKATHON_BASELINE.md](PRE_HACKATHON_BASELINE.md).

| # | Requirement | Status | Where |
| :-- | :--- | :--- | :--- |
| 1 | Real BCH Mainnet transaction | TODO | fund a v1.2 vault and record real `claim`/`cancel` txids |
| 2 | Live, clickable demo (no local build) | DONE | https://streamvault-cash.vercel.app |
| 3 | WizardConnect wallet integration | IMPLEMENTED, pending device test | `WalletProvider.tsx` + fund/claim/cancel signing |
| 4 | Official 7-page Widget Factory slides | DONE | [Google Slides](https://docs.google.com/presentation/d/1RpdiRw3CkPYTgZ3ooK1w6S0N7-IfBGCqrqsMHMgK08Q/present) + final PPTX/PDF in `docs/deck` |
| 5 | Attend a livestream + roll call | DONE (2026-10-17 22:56 Beijing) | Information Session #1, Vdo.ninja room `bchblaze`, project name posted in room chat |
| 6 | Telegram verification | DONE (organizer replied) | joined `t.me/bchblaze`, posted the disclosure on 2026-10-17 at 20:18, and received the pre-existing-work rules |
| 7 | CashTokens-receiving BCH address | DONE | `bitcoincash:zzlgvjs8fvqdf43nz9yklcd0eh780x2xd5d9dxrnkv` in README + submission sheet |

## Per-requirement notes

1. **Mainnet transaction** - acquire a small amount of BCH + verified PUSD, fund a vault, broadcast one
   `claim`, and run at least one Agent service payment. Record the txids in README. The baseline does
   not contain a project-owned Mainnet PUSD transaction.
2. **Live demo** - deployed and live at https://streamvault-cash.vercel.app (Vercel, master).
   The pre-hackathon demo is public at https://streamvault-baseline.vercel.app, with the baseline
   code tagged `v0-prehackathon-baseline`.
3. **WizardConnect** - the persistent manager now signs fund, top-up, claim and cancel WalletConnect objects
   and broadcasts the signed response through Electrum. A real Selene/Paytaca device test is still
   required before claiming this complete.
4. **Slides** - the 7-page deck follows the official Widget Factory template and is published at
   https://docs.google.com/presentation/d/1RpdiRw3CkPYTgZ3ooK1w6S0N7-IfBGCqrqsMHMgK08Q/present.
   Public unauthenticated PDF export was verified at 7 pages.
5. **Livestream** - completed on 2026-10-17 during the first Information Session. A representative
   joined the Vdo.ninja room `bchblaze` (camera and mic off, project poster used as the placeholder
   tile) and posted `Jason - StreamVault.cash` plus
   `roll call: StreamVault.cash (Jason, Autonomous Cash) - Mainnet + Media` in the room chat when the
   host opened roll call. The live stream is
   https://www.youtube.com/watch?v=9qudgWloY1g; the session is one of four roll-call chances, so this
   requirement is satisfied and needs no further attendance.
6. **Telegram** - the project disclosure was posted on 2026-10-17. An organizer replied with the
   pre-existing-work rules; requirement 6 is complete.
7. **CashTokens address** - the Mainnet P2PKH address
   `bitcoincash:zzlgvjs8fvqdf43nz9yklcd0eh780x2xd5d9dxrnkv` is published in the README and
   submission sheet for EMBER2026 votes and the airdrop.

Prepared disclosure text and roll-call questions are in
[ORGANIZER_DISCLOSURE.md](ORGANIZER_DISCLOSURE.md). Completing the text does not count as
attendance or Telegram verification.

## 2026-10-17 progress

- DoraHacks BCH BLAZE 2026 registration completed; the success dialog was visible on 2026-10-17.
- The BCH BLAZE Telegram chat was joined and the pre-hackathon disclosure was posted at 20:18
  (Asia/Shanghai). An organizer replied with the pre-existing-work rules.
- Information Session #1 roll call completed at 22:56 Beijing time; the project name was posted in the
  Vdo.ninja room chat (`Jason - StreamVault.cash` and
  `roll call: StreamVault.cash (Jason, Autonomous Cash) - Mainnet + Media`). Requirement 5 is closed.

## 2026-10-18 progress

- Published the Mainnet CashTokens receiving address in the README and submission sheet. Requirement 7
  is closed.
- Re-ran the full local verification stack: 21 covenant tests, 12 engine tests, 5 agent tests,
  3 API guard tests, 9 chain tests, typecheck, production build and the Playwright judge path all pass.
- Ported all 7 slides into the official Widget Factory template, exported a public PDF, and added the
  submission banner required by the DoraHacks page.
- Published the native Google Slides deck with link-view access and switched the site banner to the
  Google Slides presentation.

## 2026-10-19 progress

- Completed the presentation design pass: three-column trust comparison, compressed user and BCH
  narratives, clearer cover/CTA, and a native editable VM enforcement diagram.
- Re-exported and republished the final 7-page Google Slides deck after checking the Google Slides
  rendering itself rather than relying only on the local PPTX preview.
- Audited every text box for overflow. Adjusted the slide 2 subtitle, slide 4 title, and slide 7 CTA
  to use explicit line breaks and safe-height text frames after confirming the issue in Google Slides.
- Confirmed the production deployment includes the latest payer fallback. The funded Mainnet evidence
  remains blocked on adding BCH + verified PUSD to the demo wallets.

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
