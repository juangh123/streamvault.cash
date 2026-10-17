# Security & threat model

Scope: v1 pre-hackathon prototype. Known gaps below are disclosed rather than treated as fixed.
The competition build scope is in [PRE_HACKATHON_BASELINE.md](PRE_HACKATHON_BASELINE.md).

## Principles
- **No custody**: funds live in a covenant, never in a server or a browser key store.
- **No browser keys**: the design delegates payer/payee signing to their own wallets. The baseline
  has WizardConnect pairing but not transaction signing wired into the UI.
- **Blast radius**: with a leaked payee key, an attacker can move at most `amountPerPeriod` PUSD from
  each vault UTXO per period. In v1 the same key can also reduce that UTXO's BCH buffer.

## Threat table

| Threat | Scenario | Mitigation |
| :--- | :--- | :--- |
| Runaway spending | Payee loops claims | `amount <= amountPerPeriod` + `this.age >= periodBlocks` (one tranche per period) |
| Change siphoning | Rogue payee redirects change | `output[1].lockingBytecode == input.lockingBytecode` |
| Token drain | Payee tries to empty the PUSD balance | `remaining > 0` invariant; only payer `cancel` empties it |
| BCH buffer theft | Payee assigns most vault BCH to Output 0 and leaves token change at dust | **Not mitigated in v1.** `tx.outputs.length == 2` limits the shape, not Output 1's value. v2 requires the vault change to preserve input BCH minus at most 2000 sats |
| Multi-UTXO bypass | Payer or third party sends PUSD directly, creating another vault UTXO | **Not mitigated in v1.** v2 adds `topUp` and a single-vault-input claim rule |
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

The following are not v1 invariants and must not be claimed as such:

- The vault's BCH buffer is preserved from a payee claim.
- A transaction contains exactly one vault input.
- Multiple vault UTXOs can be cancelled in one transaction.
- The configured `PUSD_CATEGORY` is the real Mainnet ParyonUSD category.

## Operational notes
- Use a **throwaway demo key** on Chipnet only; never commit private keys.
- Fund Mainnet vaults with a small amount during the first live settlement.
- `PUSD_CATEGORY` in `src/lib/constants.ts` must be set to the real ParyonUSD category before Mainnet.
- Verify PUSD category and decimals from BCMR or a reviewed Mainnet transaction before changing config.
