# Security and threat model

Scope: v1.2 covenant, live wallet layer and Agent API. This is a hackathon build, not a production
custody product.

## Principles

- **No custody in the covenant**: the payer and payee keys control the vault; the server never holds
  payer funds.
- **No browser keys**: WizardConnect keeps payer/payee keys in the user's wallet.
- **Server key isolation**: the Agent hot wallet uses a dedicated `AGENT_WIF` with a small balance and
  a per-period covenant budget.
- **Blast radius**: a leaked payee key can move at most `amountPerPeriod` PUSD from the vault per
  period. It cannot drain the PUSD remainder or redirect the vault change.

## Threat table

| Threat | Scenario | Mitigation |
| :--- | :--- | :--- |
| Runaway spending | Payee loops claims | `amount <= amountPerPeriod` + `this.age >= periodBlocks` |
| Change siphoning | Rogue payee redirects change | `output[1].lockingBytecode == input.lockingBytecode` |
| BCH buffer theft | Payee moves most vault BCH to Output 0 | v1.2 requires `output[1].value >= input.value - 2000` |
| Token drain | Payee tries to empty the PUSD balance | `remaining > 0`; only payer `cancel` empties it |
| Wrong token | Vault input has another category | v1.2 checks the input category and both output categories |
| Multi-input confusion | Payee adds an extra input | v1.2 requires exactly one vault input and active index 0 |
| Multi-UTXO bypass | Third party sends PUSD directly, creating another vault UTXO | `topUp` merges one wallet UTXO; UI warns; multi-UTXO cancel is future work |
| Prompt injection | Agent is asked to overspend | Agent key is server-side and the covenant caps the tranche; the service verifies a fixed 0.01 PUSD price and request id |
| Server key theft | `AGENT_WIF` leaks | Dedicated low-balance key, hot-wallet ceiling, rate limit and `AGENT_ENABLED` switch; rotate immediately after an incident |
| Replay | Same request id submitted twice | Process-local Set plus on-chain OP_RETURN check; production needs durable storage |
| 0-conf double spend | Service returns data before confirmation | Interactive demo labels `confirmed:false`; final evidence waits for confirmation |

## Invariants

1. `sum(output PUSD) == sum(input PUSD)` (VM token conservation).
2. Output 1 re-locks under the identical covenant bytecode.
3. A claim leaves a positive PUSD balance.
4. Only the payer signature can call `cancel`.
5. A claim spends exactly one vault input.
6. The vault change preserves all but at most 2000 sats of input BCH.

## Operational notes

- Use a throwaway key on Chipnet; never commit a WIF.
- Keep `AGENT_ENABLED=false` in local and preview environments unless a dedicated agent key is configured.
- Pre-fund the agent hot wallet with BCH for fees, not just PUSD.
- Re-verify the PUSD category immediately before Mainnet funding.
- Record real txids only after they are confirmed and publicly inspectable.
