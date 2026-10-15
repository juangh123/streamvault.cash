# Official 7-page Widget Factory deck (content)

> A generated deck (dark brand theme, 7 pages + PNG previews) lives in `docs/deck/`:
> `docs/deck/StreamVault-BCH-Blaze-2026.pptx`. Regenerate with `node .decknode/build-deck.mjs`.
> Restyle it inside the official Widget Factory Google Slides template before submitting.


Port this content into the official Widget Factory Google Slides template.

**Slide 1 - Cover**
- StreamVault.cash
- Non-custodial PUSD streaming payroll & subscription vault on Bitcoin Cash
- BCH BLAZE 2026 - Team Autonomous Cash
- streamvault.cash | @StreamVaultCash

**Slide 2 - One-liner & repo**
- "Programmable BCH money streams that pay themselves - capped on-chain, cancellable by the payer, settled
  in a stablecoin."
- Repo: github.com/streamvault/streamvault.cash
- Non-custodial - PUSD settlement - hard covenants

**Slide 3 - Story / origin**
- Contractors, creators and SaaS vendors are paid in lumps that arrive late or need a custodian.
- Cards and mandates are custodial and reversible; lump-sum crypto has no schedule; EVM gas exceeds the tranche.
- BCH's near-zero fees + introspection covenants are the natural rail for programmable streams.

**Slide 4 - Benefits**
- Payees: withdraw on schedule without invoicing or a custodian.
- Payers: per-period ceiling, cancel and reclaim anytime.
- Stable value: denominated in PUSD, not a volatile token.
- Any wallet: sign with Selene, Paytaca or Cashonize.

**Slide 5 - BCH usage (core scoring)**
- PUSD is a CashTokens fungible token; the covenant enforces token conservation.
- `this.age` (OP_CHECKSEQUENCEVERIFY) gates each tranche - the stream's rate limit.
- `output[1].lockingBytecode == input.lockingBytecode` - recursive change, enforced by introspection.
- Signed via WizardConnect, broadcast to BCH; everything is consensus-enforced.

**Slide 6 - Vision & roadmap**
- Phase 1: covenant + cockpit + Chipnet/Mainnet settlement.
- Phase 2: SDK + MCP server so AI agents stream per-call budgets.
- Phase 3: marketplace of PUSD-denominated recurring services.

**Slide 7 - Thank you & demo**
- Live demo: streamvault.cash
- Judge walkthrough (one click, no wallet)
- "Bitcoin Cash is peer-to-peer cash for people - and now, for their money streams."