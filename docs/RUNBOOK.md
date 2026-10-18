# Runbook - remaining BCH BLAZE 2026 requirements

Status of the seven mandatory requirements: see `docs/COMPLIANCE.md`.
This is the step-by-step to close the ones that need your wallet, funds or accounts.

## 1. Mainnet real transaction (hard requirement #1)

The browser wallet flow is implemented in `src/wallet/WalletProvider.tsx` and
`src/components/LiveVaultPanel.tsx`. The settlement CLI remains useful for local dry runs and
claim/cancel fallbacks; it does not implement a live `fund` action.

**Rehearse on Chipnet first** (free coins from `https://chipnet.chaingraph.cash/faucet`):

```bash
# derive the covenant address for your two keys
set NETWORK=chipnet
set PAYER_WIF=<chipnet payer wif>
set PAYEE_WIF=<chipnet payee wif>
set CATEGORY=<a token category you hold on chipnet>
node scripts/settle.mjs --action=claim --amount=2500
node scripts/settle.mjs --action=cancel
```

**Then settle on Mainnet** with real PUSD:

1. Obtain a small amount of **PUSD + BCH** in the payer wallet (ParyonUSD app: https://paryonusd.com).
   Verified metadata: category
   `2469acc5afa4b10cb5b5c04afb89c3a3ffd61c5da9c01e26d00951cae2a02544`, decimals `2`
   (`docs/PUSD_VERIFICATION.md`). Re-check the official Token ID before sending funds.
2. Fund the vault from the app's **Payroll → Live** panel, or send PUSD (and at least 50,000 sats BCH
   for the fee buffer) to the covenant token address. The app derives the address from the connected
   wallet's receive/0 and change/0 keys.
3. Run a real `claim`, capture the txid:

```bash
set NETWORK=mainnet
set PAYER_WIF=<mainnet payer wif>
set PAYEE_WIF=<mainnet payee wif>
set CATEGORY=<real ParyonUSD category>
node scripts/settle.mjs --action=claim --amount=2500
```

4. Record the txid in `README.md` and mark requirement #1 in `docs/COMPLIANCE.md`.

5. For the Agent demo, set `AGENT_ENABLED=true`, `AGENT_WIF` (dedicated low-balance key),
   `SERVICE_ADDRESS` (PUSD token address), and keep `AGENT_MAX_BALANCE=10`. Pre-fund the agent hot
   wallet with 20,000 sats BCH and fund the agent vault with 2.00 PUSD + 50,000 sats BCH.
   Use `GET /api/agent/status?payerPubkey=...` before the first run.

> `--dry-run` executes the whole lifecycle against the local BCH VM with no keys or funds:
> `node scripts/settle.mjs --dry-run`

## 4. Official 7-page Widget Factory slides (hard requirement #4)

1. The final 7-page content has been ported and visually optimized in the official Widget Factory
   template: `docs/deck/StreamVault-BCH-Blaze-2026-Submission.pptx`.
2. The native deck is published at
   https://docs.google.com/presentation/d/1RpdiRw3CkPYTgZ3ooK1w6S0N7-IfBGCqrqsMHMgK08Q/present.
   The public PDF is also served at
   `https://streamvault-cash.vercel.app/StreamVault-BCH-Blaze-2026.pdf`.
3. Use the Google Slides link in the DoraHacks submission. Requirement #4 is complete.

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
