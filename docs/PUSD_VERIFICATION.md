# PUSD mainnet verification

Verified: 2026-10-17 (Asia/Shanghai)

Status: category and decimals confirmed for planning. The application configuration is intentionally
unchanged until the BCH BLAZE 2026 build period.

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

Do not edit `src/lib/constants.ts` before the competition build period. The category and decimals are
now recorded for the v2 implementation and Mainnet rehearsal, but the application must continue to use
its clearly labelled demo category until the configuration change is made, reviewed and committed
during the build period.

Before the first Mainnet settlement, re-open the official Token ID section and verify the category
again. Tokens with a similar name or icon must not be accepted.
