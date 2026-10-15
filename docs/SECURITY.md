# Security & threat model

## Principles
- **No custody**: funds live in a covenant, never in a server or a browser key store.
- **No browser keys**: payer/payee sign with their own wallets via WizardConnect.
- **Blast radius**: even with a leaked payee key, an attacker can move at most `amountPerPeriod` per period.

## Threat table

| Threat | Scenario | Mitigation |
| :--- | :--- | :--- |
| Runaway spending | Payee loops claims | `amount <= amountPerPeriod` + `this.age >= periodBlocks` (one tranche per period) |
| Change siphoning | Rogue payee redirects change | `output[1].lockingBytecode == input.lockingBytecode` |
| Balance drain | Payee tries to empty the vault | `remaining > 0` invariant; only payer `cancel` empties it |
| BCH buffer theft | Extra output drains the fee buffer | `tx.outputs.length == 2` |
| Token forgery | Minting/stealing PUSD | VM-enforced CashTokens conservation + `tokenCategory == pusdCategory` |
| Key theft (payee) | Payee key leaks | Capped exposure per period; payer can cancel immediately |
| Key theft (payer) | Payer key leaks | Payer key only cancels/reclaims; it cannot grant spending to others |
| Dust rejection | Sub-dust outputs | Builder keeps outputs above the token/BCH dust floor |
| Fee squeeze | Fee too low/high | Size-based fee estimation, capped sats/byte |

## Invariants
1. `sum(output PUSD) == sum(input PUSD)` (VM token conservation).
2. Output 1 always re-locks under the identical covenant bytecode.
3. A claim always leaves a positive vault balance.
4. Only the payer signature can call `cancel`.

## Operational notes
- Use a **throwaway demo key** on Chipnet only; never commit private keys.
- Fund Mainnet vaults with a small amount during the first live settlement.
- `PUSD_CATEGORY` in `src/lib/covenant.ts` must be set to the real ParyonUSD category before Mainnet.