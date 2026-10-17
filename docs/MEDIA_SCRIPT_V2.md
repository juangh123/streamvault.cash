# Media track v2 - 75-second short

Status: production plan for the BCH BLAZE 2026 build period.

**Title:** "An Allowance an AI Cannot Overspend"

**Format:** 1080p, 16:9, English voiceover with burned-in English captions. The final cut must be
60-90 seconds and include at least one real BCH Mainnet operation.

## Story

An AI agent can call an API, but it should not be trusted with an unlimited wallet. StreamVault gives
it a PUSD budget that is capped per period, visible on-chain and revocable by the payer.

## Shot list

| Time | Visual | Narration |
| :--- | :--- | :--- |
| 0:00-0:08 | Terminal/agent UI asks for a paid API call. A card-style wallet flashes with no limit. | "An AI with a wallet can spend everything it can reach." |
| 0:08-0:18 | Split screen: a freelancer waiting for an invoice, then an agent making an API request. | "The same problem shows up in payroll and in agent budgets: a lump sum is either too much trust or too little control." |
| 0:18-0:30 | Real StreamVault cockpit: create a 2.00 PUSD vault, 0.10 per 6 blocks, then show the derived covenant address. | "StreamVault locks PUSD in a Bitcoin Cash covenant. The agent gets a PUSD allowance, not the whole wallet." |
| 0:30-0:42 | Wallet signs the agent claim. Show the real claim txid opening in an explorer. | "The agent claims its tranche. The chain enforces the period and the cap." |
| 0:42-0:54 | Agent pays 0.01 PUSD to the service address. Highlight the OP_RETURN request id. | "Each service call is a tiny PUSD payment with a request id, so the service can verify what it was paid for." |
| 0:54-1:04 | Service panel verifies the payment through Electrum and returns block height, fee and vault status. | "The service checks the amount, destination and request id before it returns anything." |
| 1:04-1:12 | Second call in the same period. Show "This period's budget is used up" and the countdown. | "Ask again before the next period, and the answer is no. The limit is not a prompt; it is a transaction rule." |
| 1:12-1:20 | Payer clicks Cancel. The remaining PUSD returns. Show the cancel txid. | "And the payer can revoke the allowance at any time." |
| 1:20-1:27 | Title card: StreamVault.cash, QR, BCH BLAZE 2026. | "StreamVault.cash. Give an AI an allowance, not your bank account." |

## Production notes

- Record the real Mainnet claim, agent payment and cancel where possible. If a Mainnet step fails,
  show the Chipnet transaction and label it clearly; do not imply a Mainnet confirmation.
- Put the real txid and explorer URL on screen for at least three seconds.
- Never show `AGENT_WIF`, a seed phrase or a full private key.
- Use the actual StreamVault UI and the actual service response, not a mocked success screen.
- Keep the first 8 seconds fast and visual; the agent and the budget must be visible before 0:10.
- Burn English captions. Add a silent-safe version for social platforms.
- Keep the final cut between 60 and 90 seconds. The 75-second target is a ceiling, not a minimum.

## Required evidence

- A Mainnet `claim` txid.
- A Mainnet agent service payment txid.
- A Mainnet `cancel` txid, or a clearly labelled Chipnet fallback.
- A visible "budget exhausted" state.
- A final frame with the project URL and BCH BLAZE 2026.

## Existing draft

The v1 sandbox explainer remains in `docs/media/streamvault-explainer.mp4` as a baseline artifact.
It must not be used as the final Media submission because it has no real Mainnet operation and no
agent payment.
