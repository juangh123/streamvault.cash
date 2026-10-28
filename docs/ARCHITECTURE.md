# System architecture

## Topology

```text
        Payer wallet -- WizardConnect --+
                                        |  fund + cancel (signed)
                                        v
                          +-------------------------------+
                          |  StreamVault covenant (P2SH)   |
                          |  PUSD + BCH buffer             |
                          |  amountPerPeriod, periodBlocks |
                          +---------------+---------------+
                                          | claim (payee-signed)
        Payee wallet -- WizardConnect ----+
                                          |
                          Output 0: payee tranche (PUSD)
                          Output 1: vault change (same bytecode, clock reset)
```

## Contract

`contracts/StreamVault.cash`, CashScript `^0.14.0`, compiled to
`contracts/artifacts/StreamVault.json` by `npm run compile`. v1.2 has three functions: `claim`,
`topUp` and `cancel`. The claim path enforces one vault input, the PUSD input category, a relative period, a
per-period ceiling, recursive change and a 2000-sat BCH buffer bound. See
`docs/STREAM_MECHANICS.md`.

## Client stack

- **Vite + React 18 + TypeScript**, Tailwind CSS, Lucide icons.
- **cashscript 0.14** - contract instantiation, transaction building.
- **@bitauth/libauth** - address encoding, key/address helpers.
- **@wizardconnect/react + @wizardconnect/dapp** - wallet pairing, persistent session and signing.

## Layers

- `src/lib/covenant.ts` - compiled artifact, PUSD/network constants and explorer config.
- `src/lib/stream.ts` - payroll sandbox engine.
- `src/lib/agent-sim.ts` - agent budget sandbox: claim, service payment, exhaustion and cancel.
- `src/lib/agent-server.ts` - server-only Agent status/run/verify logic.
- `src/lib/chain.ts` - live layer: Electrum provider, UTXO/token queries, fee estimation, fund/claim/
  cancel transaction and WalletConnect object building.
- `src/wallet/WalletProvider.tsx` - separate persistent payer and payee WizardConnect managers,
  role-specific receive/0 keys, sign-and-broadcast helper.
- `src/components/*` - Agent-first cockpit and payroll fallback.
- `api/agent/*`, `api/service/insight.ts` - Vercel Functions for the live Agent path.

## Signing flow (live)

1. The app builds a fund, top-up, claim or cancel transaction with `TransactionBuilder` and placeholders.
2. `generateWcTransactionObject()` carries the source outputs and covenant redeem script.
3. `serializeWcTransaction()` converts the object to the hex string expected by WizardConnect wallets.
4. `WalletProvider` selects the payer or payee manager and calls
   `manager.signTransaction({ transaction, inputPaths })`. Both roles use receive/0.
5. The signed hex is broadcast through Electrum. The real txid is written to the ledger with an
   explorer link; the app never broadcasts twice. If broadcast or lookup times out, the app derives
   the txid from the signed bytes and checks the chain before allowing a rebuild.

No private key is persisted in the browser; the WizardConnect session persists the public xpub only.

## Agent API

- `GET /api/agent/status` derives the vault from the payer pubkey and server-side agent key.
- `POST /api/agent/run` claims a tranche when needed, pays the service 0.01 PUSD with an OP_RETURN
  request id, verifies the payment through Electrum and returns the service data.
- `GET /api/service/insight` re-verifies a provided txid before returning data.

The agent hot wallet needs BCH for miner fees in addition to PUSD. The demo pre-funds it with
20,000 sats. `AGENT_WIF` is server-only and must never appear in the client bundle. Rate limiting and
request-id de-duplication use a shared Redis REST store when `AGENT_STORE_URL` and `AGENT_STORE_TOKEN`
are configured; local development falls back to process-local memory.

## Deployment

The static build (`dist/`) is hosted on Vercel. `vercel.json` uses filesystem routing before the SPA
fallback so `/api/*` functions are reachable. The live site is
https://streamvault-cash.vercel.app; `streamvault.cash` is not a working DNS target yet.
