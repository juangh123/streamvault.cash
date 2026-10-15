# System architecture

## Topology

```
        Payer wallet ── WizardConnect ──┐
                                        │  fund + cancel (signed)
                                        ▼
                          ┌───────────────────────────────┐
                          │  StreamVault covenant (P2SH)   │
                          │  PUSD + BCH buffer            │
                          │  amountPerPeriod, periodBlocks│
                          └───────────────┬───────────────┘
                                          │ claim (payee-signed)
        Payee wallet ── WizardConnect ────┘
                                          │
                          Output 0: payee tranche (PUSD)
                          Output 1: vault change (same bytecode, clock reset)
```

## Contract
`contracts/StreamVault.cash`, CashScript `^0.14.0`, compiled to `contracts/artifacts/StreamVault.json`
by `npm run compile`. Two functions: `claim` and `cancel`. See `docs/STREAM_MECHANICS.md`.

## Client stack
- **Vite + React 18 + TypeScript**, Tailwind CSS, Lucide icons.
- **cashscript 0.14** - contract instantiation, transaction building.
- **@bitauth/libauth** - address encoding, key/address helpers.
- **@wizardconnect/react + @wizardconnect/dapp** - wallet pairing (relay protocol, QR) and signing.

## Layers
- `src/lib/covenant.ts` - compiled artifact, PUSD/network constants, explorer config.
- `src/lib/stream.ts` - sandbox engine that replays the covenant invariants offline.
- `src/lib/chain.ts` - live layer: `ElectrumNetworkProvider` (Chipnet/Mainnet), `Contract`, UTXO/token
  queries, size-based fee estimation, real `claim`/`cancel` transaction building.
- `src/components/*` - cockpit UI.

## Signing flow (live)
1. The dapp builds a covenant spend with `TransactionBuilder` (payee or payer `sig`).
2. Permissioned signing is delegated to the wallet over WizardConnect (`DappConnectionManager.signTransaction`)
   or, for the Chipnet walkthrough with a throwaway demo key, signed locally.
3. The signed transaction is broadcast through the Electrum provider; the txid is recorded in the ledger.

No private key is ever persisted in the browser; session state only keeps the public xpub.

## Deployment
Static build (`dist/`) hosted on Vercel (`vercel.json`) or Cloudflare Pages (`public/_redirects`).