# Official 7-page Widget Factory deck (content)

> The in-app deck and the local PPTX now use the Agent + payroll story. The official-template version
> is `docs/deck/StreamVault-BCH-Blaze-2026-Submission.pptx`, with a rendered public PDF at
> `/StreamVault-BCH-Blaze-2026.pdf` (https://streamvault-cash.vercel.app/StreamVault-BCH-Blaze-2026.pdf). The earlier
> Google Slides copy is blocked by Google for signed-out viewers and is no longer linked.

Final PDF page order (2026-10-28): 1 cover, 2 promise ("Prompts set intent. The transaction enforces
the limit."), 3 trust gap, 4 one covenant / three users, 5 VM checks, 6 why BCH + who pays, 7 demo and
links. The content blocks below are the source copy; the PDF is the version judges see.

**Slide 1 - Cover**
- StreamVault.cash
- Give an AI an allowance, not your bank account.
- PUSD budgets for autonomous software and people.
- BCH BLAZE 2026 · Team Autonomous Cash · https://streamvault-cash.vercel.app

**Slide 2 - The trust gap**
- An AI agent with a wallet can spend everything it can reach.
- A prompt can be ignored. A cap in a prompt is not a financial control.
- Payroll and vendor payments still arrive as lumps, with a custodian in the middle.
- EVM gas makes 0.01 USD service calls uneconomical.

**Slide 3 - One covenant, three users**
- Payer locks a PUSD budget and keeps a cancel key.
- Worker claims one tranche per period.
- AI Agent claims a small budget and pays a service per request.
- Same contract primitive: `amountPerPeriod`, `periodBlocks`, `claim`, `cancel`.
- Left column stats: 3 spend paths (`claim`, `topUp`, `cancel`) and 21 VM tests against the real BCH VM.

**Slide 4 - How the limit is enforced**
- PUSD is a CashTokens fungible asset; the VM enforces conservation.
- `this.age` is the relative period gate.
- `claim` requires one vault input and two outputs; change returns to the same covenant.
- The vault change preserves all but at most 2000 sats of its BCH buffer.
- `topUp` merges one payer-owned PUSD UTXO and restarts the relative period.
- The payer can cancel the vault and reclaim the remaining PUSD.

**Slide 5 - Agent budget demo**
- Vault: 2.00 PUSD; per period: 0.10 PUSD; period: 2 blocks; service call: 0.01 PUSD.
- Agent claims its tranche, pays the service and binds each request with OP_RETURN `SV1:<requestId>`.
- Service verifies amount, destination, PUSD category and request id through Electrum.
- When the tranche is spent, the UI says "This period's budget is used up" and shows the next claim block.

**Slide 6 - Why BCH and the business model**
- Near-zero settlement makes 0.01 PUSD service calls practical.
- Relative timelocks + introspection + native CashTokens are the enforcement layer.
- WizardConnect keeps keys in the user's wallet.
- Who pays: agent builders (hosted budget console for agent fleets, subscription); API and MCP tool
  providers (SDK and verifier to sell $0.01 PUSD calls); hosted gateway (small fee per verified call,
  self-hosting is free).
- First market: paid MCP tools and data APIs.
- No protocol fee in the covenant.

**Slide 7 - Demo and ask**
- Live demo: https://streamvault-cash.vercel.app
- Deck PDF: https://streamvault-cash.vercel.app/StreamVault-BCH-Blaze-2026.pdf
- 60-second judge path: Agent → Launch budget → Run paid request → Run until exhausted → Cancel.
- "Give an AI an allowance, not your bank account."

## Submission rule

Do not show a mainnet txid in the deck until it is confirmed and linked. Mark Chipnet or Sandbox
transactions clearly. The current local media draft is sandbox-only and must not be submitted as the
final Media entry.
