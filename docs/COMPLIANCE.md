# BCH BLAZE 2026 - compliance checklist

The hackathon has seven mandatory requirements. Failing any one disqualifies the submission.

## Pre-hackathon disclosure

The StreamVault.cash covenant, sandbox cockpit and documentation were seeded on 2026-10-14 and
2026-10-15. They are frozen at tag `v0-prehackathon-baseline` and are not presented as
competition-period work. Contract v2, wallet-signed live transactions, the Agent budget layer and
final media are scheduled for 2026-11-14 through 2026-11-22. The full disclosure is in
[PRE_HACKATHON_BASELINE.md](PRE_HACKATHON_BASELINE.md).

| # | Requirement | Status | Where |
| :-- | :--- | :--- | :--- |
| 1 | Real BCH Mainnet transaction | TODO (Phase 4) | broadcast a real `claim`/`cancel`, record the txid in README |
| 2 | Live, clickable demo (no local build) | DONE | https://streamvault-cash.vercel.app |
| 3 | WizardConnect wallet integration | PARTIAL | pairing exists in `WalletConnectDialog.tsx`; `signTransaction` wiring is TODO in v2 |
| 4 | Official 7-page Widget Factory slides | TODO | `docs/SLIDES.md` -> port to the official template |
| 5 | Attend a livestream + roll call | TODO (10/17) | Information Session, Beijing 22:00 |
| 6 | Telegram verification | TODO | join `t.me/bchblaze` and confirm the project |
| 7 | CashTokens-receiving BCH address | TODO | add a mainnet address to the submission + README |

## Per-requirement notes

1. **Mainnet transaction** - acquire a small amount of BCH + verified PUSD, fund a vault, broadcast one
   `claim`, and run at least one Agent service payment. Record the txids in README. The baseline does
   not contain a project-owned Mainnet PUSD transaction.
2. **Live demo** - deployed and live at https://streamvault-cash.vercel.app (Vercel, master).
3. **WizardConnect** - the pairing dialog is real; transaction signing is not wired into the UI yet.
   The v2 build must call `signTransaction({ transaction, inputPaths })` for all four actions.
4. **Slides** - rebuild the 7 pages in the official Google Slides template (content in `docs/SLIDES.md`).
5. **Livestream** - at least one team member must appear and sign in during roll call.
6. **Telegram** - confirm authenticity in the official group.
7. **CashTokens address** - required to receive EMBER2026 votes and the airdrop.

The real PUSD category and decimals remain unverified. Do not use the `aa...aa` demo category for a
Mainnet submission.

## Media track (optional second submission)

- Media assets: poster docs/media/poster.png, 90s explainer docs/media/streamvault-explainer.mp4, brand banner docs/assets/banner.svg.
- A 90-second explainer video ("paid per period, cancellable by the sponsor"). Storyboard in
  `docs/MEDIA_SCRIPT.md`. Host on YouTube/X and link the DoraHacks media entry.
