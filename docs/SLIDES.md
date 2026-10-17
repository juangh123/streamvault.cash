# Official 7-page Widget Factory deck (content)

> A generated deck (dark brand theme, 7 pages + PNG previews) lives in `docs/deck/`:
> `docs/deck/StreamVault-BCH-Blaze-2026.pptx`. Regenerate with `node .decknode/build-deck.mjs`.
> Restyle it inside the official Widget Factory Google Slides template before submitting.


Port this content into the official Widget Factory Google Slides template. This is the v2 content;
the committed PPTX is still the pre-hackathon draft and must be regenerated during the build period.

**Slide 1 - Cover**
- StreamVault.cash
- PUSD limit flows for people and AI agents
- BCH BLAZE 2026 - Team Autonomous Cash
- streamvault.cash | github.com/juangh123/streamvault.cash

**Slide 2 - The trust gap**
- Payroll and vendor payments still arrive as lumps, with a custodian in the middle.
- An AI agent with a wallet has the same problem in miniature: it can spend everything it can reach.
- A prompt can be ignored. A cap that lives in a prompt is not a financial control.

**Slide 3 - One covenant, three users**
- Payer locks a PUSD budget and keeps a cancel key.
- Employee or freelancer claims one tranche per period.
- AI Agent claims a small budget, then pays a service per request.
- Same contract primitive: `amountPerPeriod`, `periodBlocks`, `claim`, `topUp`, `cancel`.

**Slide 4 - How the limit is enforced**
- PUSD is a CashTokens fungible asset; the VM enforces conservation.
- `this.age` is the relative period gate.
- `claim` requires one vault input and two outputs; the change returns to the same covenant.
- The vault change preserves all but at most 2000 sats of its BCH buffer.
- The payer can cancel one or many vault UTXOs.

**Slide 5 - Agent budget demo**
- Vault: 2.00 PUSD; per period: 0.10 PUSD; period: 6 blocks; service call: 0.01 PUSD.
- Agent claims its tranche, pays the service, and binds each request with an OP_RETURN request id.
- The service verifies amount, destination, category and request id through Electrum.
- When the period budget is exhausted, the UI says so and shows the existing transaction.

**Slide 6 - Why BCH and the business model**
- Near-zero settlement makes 0.01 PUSD service calls practical.
- Relative timelocks + introspection + native CashTokens are the enforcement layer.
- WizardConnect keeps keys in the user's wallet.
- Revenue: service-provider SDK, agent billing gateway and a hosted budget console. No protocol fee in
  the covenant.

**Slide 7 - Demo and ask**
- Live demo: streamvault.cash
- 60-second judge path: agent run, wallet flow or sandbox fallback.
- "Give an AI an allowance, not your bank account."
