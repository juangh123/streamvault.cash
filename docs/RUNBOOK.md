# Runbook - remaining BCH BLAZE 2026 requirements

Status of the seven mandatory requirements: see `docs/COMPLIANCE.md`.
This is the step-by-step to close the ones that need your wallet, funds or accounts.

## 1. Mainnet real transaction (hard requirement #1) and wallet device test

Two phone wallets with WizardConnect: **Wallet A** (payer, e.g. Selene 2026.10.01+, which has a
built-in Cauldron swap for PUSD) and **Wallet B** (payee, e.g. Paytaca). They must hold different keys.
Open https://streamvault-cash.vercel.app on a computer and scan the QR codes with the phones.

### Budget

| Item | PUSD | BCH |
| :--- | :--- | :--- |
| Agent vault (stays funded for judges) | 2.00 | 50,000 sats buffer + fee |
| Payroll vault (fund, claim, cancel) | 0.50 | 50,000 sats buffer + fee (returned on cancel) |
| Agent hot wallet `bitcoincash:qzq6xa805mht8vuq7ea6ac9vg925lalvdscrggd85a` | - | 100,000 sats (about 1,900 sats per paid request) |

Put about 3 PUSD and 250,000 sats in Wallet A. Wallet B needs no funds; claim fees come from the vault
buffer. PUSD category `2469acc5afa4b10cb5b5c04afb89c3a3ffd61c5da9c01e26d00951cae2a02544`, decimals `2`.

The app only spends UTXOs on the wallet's **receive/0** address. After connecting, click the short
address next to **Payer** in the header: it copies the token-aware receive/0 address. If funding reports
`Insufficient PUSD` or `Insufficient BCH`, send PUSD and BCH from the wallet to that copied address.
Funding adds plain BCH UTXOs automatically, so the 50,000-sat buffer does not need to sit on a PUSD UTXO.

### Phase A - Agent vault (fund, claim, service payment)

1. From Wallet A send 100,000 sats to the agent hot wallet address above.
2. Header: **Agent**, **Live**, network **Mainnet**. **Payer → Connect**, scan with Wallet A.
3. **Refresh live status**, then **Fund agent vault**. Approve "StreamVault: fund agent budget" in
   Wallet A. Record the txid from the log (Fund).
4. Wait for one confirmation plus 2 blocks (about 20-30 minutes). The covenant blocks the first claim
   until the period has elapsed. **Refresh live status**.
5. **Run paid request**. The log shows the agent claim txid (Claim) and the 0.01 PUSD service payment
   txid (Agent service payment). Optional: **Run until budget exhausted** for the video.
6. Do not cancel this vault; it becomes the public demo vault for judges after
   `VITE_AGENT_DEMO_PAYER_PUBKEY` is set to Wallet A's receive/0 public key and the site is redeployed.

### Phase B - Payroll vault (wallet-signed claim, rejection, cancel)

1. **Payee → Connect**, scan with Wallet B. The app refuses Live mode if both roles are the same key.
2. Header: **Payroll**, **Live**. Per period `0.10`, Period `2`, Initial deposit `0.50`. **Fund vault**,
   approve in Wallet A. Record the txid.
3. Wait until **Next claim** shows "available now". Click **Claim**, then **reject** the request in
   Wallet B: the app must show an error and broadcast nothing. Click **Claim** again and approve: record
   the txid (wallet-signed Claim).
4. **Cancel & reclaim**, approve in Wallet A. Record the txid (Cancel). The remaining PUSD and the BCH
   buffer return to Wallet A.

### Record the evidence

Wait for at least one confirmation on every txid, then add them to `src/lib/evidence.ts`
(`MAINNET_EVIDENCE`), the README, `docs/BUILT_DURING_BLAZE.md`, `docs/SUBMISSION.md` and
`docs/DORAHACKS_BUIDL.md`, run `npm run verify:release`, push, and confirm the "Verified on BCH Mainnet"
strip on the production site. Note which wallet app and version signed each step for the device-test
record.

### CLI fallback

`scripts/settle.mjs` signs `claim` and `cancel` with WIF keys for dry runs and recovery; it does not fund.
`node scripts/settle.mjs --dry-run` runs the whole lifecycle against the local BCH VM with no keys or funds.

## 4. Official 7-page Widget Factory slides (hard requirement #4)

1. The final 7-page content has been ported and visually optimized in the official Widget Factory
   template: `docs/deck/StreamVault-BCH-Blaze-2026-Submission.pptx`.
2. The public PDF is served at
   `https://streamvault-cash.vercel.app/StreamVault-BCH-Blaze-2026.pdf`.
   The earlier Google Slides copy is blocked by Google for signed-out viewers; do not link it.
3. Use the self-hosted PDF link in the banner and the DoraHacks submission. After replacing the deck,
   copy the new PDF to `public/StreamVault-BCH-Blaze-2026.pdf` and redeploy.

## 5. Livestream roll call (#5)

DONE on 2026-10-17 at 22:56 Beijing time during Information Session #1. The project name was posted
in the Vdo.ninja roll call.

## 6. Telegram verification (#6)

DONE. The disclosure was posted in `https://t.me/bchblaze` on 2026-10-17, and an organizer replied
with the pre-existing-work rules.

## 7. CashTokens receiving address (#7)

DONE. The submission and README now list
`bitcoincash:zzlgvjs8fvqdf43nz9yklcd0eh780x2xd5d9dxrnkv` for the EMBER2026 vote airdrop.

## Deploy / CI

- Live demo: `vercel --prod` (already deployed at https://streamvault-cash.vercel.app).
- CI: `.github/workflows/ci.yml` runs compile + covenant/engine/agent/API/derive/chain suites + typecheck + build,
  plus a Playwright judge-path job.
