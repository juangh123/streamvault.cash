# BCH BLAZE 2026 - compliance checklist

The hackathon has seven mandatory requirements. Failing any one disqualifies the submission.

| # | Requirement | Status | Where |
| :-- | :--- | :--- | :--- |
| 1 | Real BCH Mainnet transaction | TODO (Phase 4) | broadcast a real `claim`/`cancel`, record the txid in README |
| 2 | Live, clickable demo (no local build) | DONE | https://streamvault-cash.vercel.app |
| 3 | WizardConnect wallet integration | DONE (code) | `src/components/WalletConnectDialog.tsx` uses `@wizardconnect/react` |
| 4 | Official 7-page Widget Factory slides | TODO | `docs/SLIDES.md` -> port to the official template |
| 5 | Attend a livestream + roll call | TODO (10/17) | Information Session, Beijing 22:00 |
| 6 | Telegram verification | TODO | join `t.me/bchblaze` and confirm the project |
| 7 | CashTokens-receiving BCH address | TODO | add a mainnet address to the submission + README |

## Per-requirement notes

1. **Mainnet transaction** - acquire a small amount of BCH + PUSD, fund a vault, and broadcast one `claim`.
   If PUSD is hard to obtain, run the full flow on Chipnet and broadcast a real BCH Mainnet transaction to
   satisfy the literal requirement.
2. **Live demo** - deployed and live at https://streamvault-cash.vercel.app (Vercel, master).
3. **WizardConnect** - the pairing dialog is real; the hook manages relay + session persistence.
4. **Slides** - rebuild the 7 pages in the official Google Slides template (content in `docs/SLIDES.md`).
5. **Livestream** - at least one team member must appear and sign in during roll call.
6. **Telegram** - confirm authenticity in the official group.
7. **CashTokens address** - required to receive EMBER2026 votes and the airdrop.

## Media track (optional second submission)

- Media assets: poster docs/media/poster.png, brand banner docs/assets/banner.svg.
- A 90-second explainer video ("paid per period, cancellable by the sponsor"). Storyboard in
  `docs/MEDIA_SCRIPT.md`. Host on YouTube/X and link the DoraHacks media entry.