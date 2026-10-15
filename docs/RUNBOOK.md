# Runbook - remaining BCH BLAZE 2026 requirements

Status of the seven mandatory requirements: see `docs/COMPLIANCE.md`.
This is the step-by-step to close the ones that need your wallet, funds or accounts.

## 1. Mainnet real transaction (hard requirement #1)

The covenant lifecycle is implemented in `src/lib/chain.ts` and exposed as a CLI.

**Rehearse on Chipnet first** (free coins from `https://chipnet.chaingraph.cash/faucet`):

```bash
# derive the covenant address for your two keys
set NETWORK=chipnet
set PAYER_WIF=<chipnet payer wif>
set PAYEE_WIF=<chipnet payee wif>
set CATEGORY=<a demo token category you hold on chipnet>
node scripts/settle.mjs --action=fund --deposit=100000
node scripts/settle.mjs --action=claim --amount=2500
node scripts/settle.mjs --action=cancel
```

**Then settle on Mainnet** with real PUSD:

1. Obtain a small amount of **PUSD + BCH** in the payer wallet (ParyonUSD app: https://paryonusd.com).
2. Fund the vault by sending PUSD (and a little BCH for the fee buffer) to the covenant token address
   printed by `node scripts/settle.mjs` - or send from your wallet UI.
3. Run a real `claim`, capture the txid:

```bash
set NETWORK=mainnet
set PAYER_WIF=<mainnet payer wif>
set PAYEE_WIF=<mainnet payee wif>
set CATEGORY=<real ParyonUSD category>
node scripts/settle.mjs --action=claim --amount=2500
```

4. Record the txid in `README.md` and mark requirement #1 in `docs/COMPLIANCE.md`.

> `--dry-run` executes the whole lifecycle against the local BCH VM with no keys or funds:
> `node scripts/settle.mjs --dry-run`

## 4. Official 7-page Widget Factory slides (hard requirement #4)

1. Import `docs/deck/StreamVault-BCH-Blaze-2026.pptx` into Google Slides
   (or use the PDF `docs/deck/StreamVault-BCH-Blaze-2026.pdf` for reference).
2. Apply the official **Widget Factory** template; keep the 7-page structure in `docs/SLIDES.md`.
3. Publish the slides and put the link in the DoraHacks submission.

## 5. Livestream roll call (#5)

At least one team member must attend and sign in during a live session (Information Session 10/17, or a
Workshop). Beijing time 22:00 on the announced Saturdays.

## 6. Telegram verification (#6)

Join `https://t.me/bchblaze` and confirm the project's authenticity with the organisers.

## 7. CashTokens receiving address (#7)

Add a BCH address that can receive CashTokens to the submission (needed for the EMBER2026 vote airdrop).

## Deploy / CI

- Live demo: `vercel --prod` (already deployed at https://streamvault-cash.vercel.app).
- CI: `.github/workflows/ci.yml` runs compile + four test suites + typecheck + build on every push.