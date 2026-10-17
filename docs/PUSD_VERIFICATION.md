# PUSD mainnet verification

Verified: 2026-10-17 (Asia/Shanghai)

Status: category and decimals confirmed. The application now uses the verified category by default
and refuses Mainnet if a demo category is configured.

## Confirmed values

| Property | Value |
| :--- | :--- |
| Network | Bitcoin Cash mainnet |
| Token | ParyonUSD (PUSD) |
| CashTokens category | `2469acc5afa4b10cb5b5c04afb89c3a3ffd61c5da9c01e26d00951cae2a02544` |
| Decimals | `2` |
| Smallest unit | 0.01 PUSD |

## Evidence

1. The official ParyonUSD site has a "Token ID" section that publishes the category and tells users to
   verify it against their wallet or DEX:
   https://paryonusd.com/#token-id
2. The official mainnet app bundle uses the same category in its `mainnet-v1` configuration:
   https://paryonusd.com/_app/immutable/chunks/CT98jeWt2.js
   The bundle also formats PUSD by dividing token units by 100 before display.
3. The official contracts repository defines the minimum stake as `100_00` while documenting it as
   `100.00 ParyonUSD`. That is a two-decimal representation:
   https://github.com/ParyonUSD/contracts
   https://github.com/ParyonUSD/contracts/blob/main/contracts/stabilitypool/poolContractFunctions/AddLiquidity.cash
4. The official mainnet API reports supply and staking values with two decimal places:
   https://mainnet-v1.paryonusd.com
5. The official FAQ links to Cauldron using the same category:
   https://app.cauldron.quest/swap/2469acc5afa4b10cb5b5c04afb89c3a3ffd61c5da9c01e26d00951cae2a02544

No public BCMR endpoint was found during this check. Direct explorer lookups were not usable for the
category ID alone (rate limiting or a category/transaction lookup mismatch), so the conclusion above
rests on the three official sources and the live official API.

## Decision

The category and decimals are recorded in `src/lib/constants.ts`. Re-check the official Token ID
before the first Mainnet settlement.

Before the first Mainnet settlement, re-open the official Token ID section and verify the category
again. Tokens with a similar name or icon must not be accepted.
