# SV-CHIPNET-001 — live wallet evidence (2026-11-01)

Status (2026-11-02): in progress. Wallet rejection passed. A signed claim exposed a category byte-order
defect; corrected vaults are being funded locally. Successful claim, cancellation and paid request remain unverified.
This is Chipnet only: no real PUSD, monetary value or Mainnet verification is claimed.
Owner: Sol (implementation and evidence), user (wallet authority).

## Wallets and configuration

- Payer: Cashonize web HD wallet `SV Chipnet A`, in the in-app browser.
- Payee: separate Cashonize web HD wallet `SV Chipnet B Chrome`, in Chrome.
- An earlier empty B wallet exists in the in-app browser but is not used for the two-session test.
- Switching active wallets within one Cashonize instance disconnects the previous signing session;
  the actual test uses independent browser storage and simultaneous Payer/Payee connections.
- Wallet version/device details: still to record; this does not establish Selene/Paytaca phone compatibility.
- Payer receive/0 token address: `bchtest:zpr7f5qqh8fpyq4m4m4tc0z8mels0tkapslnlprhuu`.
- Payer receive/0 public key (verified from genesis input and its derived address):
  `0268b1d309a5cef52e3f81f5017e47d482323606db618c0334d3357cb6f3788bf9`.
- Payee receive/0 token address: `bchtest:zq5ytpq93ld3t3ppc9fn8ndt042ftuwuwspxr94msu`.
- Test category: `57af2cea09269e6239ac299ba688e27ecdaace1a850ea46b274919b434b1f155`.
- Supply: 10,000 base units, interpreted as 100.00 at 2 decimals; 100 base units reserved,
  9,900 circulated. No hosted metadata was published, so Cashonize shows raw amounts and category.
- Payroll: cap 10 base units, period 2 blocks, deposit 50 base units.
- Legacy Payroll vault (incorrect category byte order): `bchtest:pv2aa0xtzere0cd94adamj8lrhz2tjaqq7ge6adkuxk8mcsft7ph7t5jujjlv`.
- Legacy Agent vault (incorrect category byte order): `bchtest:pdwv39gfjjt4rgxr56hd8a90rlv6resec7fndntwg2tfa0lrl2v72yqyjvc8j`.
- Corrected Payroll vault: `bchtest:pv24krnetcpa6k6qtdam3algjpns9jzxtedes88338yd7fzghk2t269enpx26`.
- Corrected Agent vault: `bchtest:pd8y8vmt5fpvmag7pn4ajkegj7xxsjx9epwahp2c5wfs7d780yut6c0rqe5k8`.
- Independent Chipnet Agent hot wallet: `bchtest:qqvcekhqr5kjx79ncdupp9mvnfcjj3qw05wd4450fh`.
- Chipnet service destination: `bchtest:qr5urxas4tqjuc7nahmtxv34vjz8prxexyl23ect8h`.
- The local test server was restarted with the Chipnet-only configuration and the maturity fix.

## Observed broadcasts

| Purpose | Chipnet txid | Observation |
| :--- | :--- | :--- |
| Faucet, 1,015,000 sats to A | `57af2cea09269e6239ac299ba688e27ecdaace1a850ea46b274919b434b1f155` | Faucet success and wallet balance; Electrum later reported 1 confirmation |
| Token genesis | `8b989e27544727e2f04f6c05cb142de55f2818e59f5b66a255feb5e0c7563889` | Cashonize success; Electrum later reported 1 confirmation |
| Send 300 token base units to A receive/0 | `3518bac9d0149e613d200b30ce5a78668d4182488ed952f3221c19771af873e1` | Wallet success |
| Send 400,000 sats to A receive/0 | `fa62f10cff8aba05c703856ecb2b9f1cd77cafeb274916256f4288a1ca850136` | Wallet success |
| Payroll Fund, wallet signed | `2ed1f5e5a46b5edf3f974b087ff33635b6b5d0b4da241d50d15755bf43fb31af` | App ledger and vault query: 50 token base units / 50,000 sats, initially waiting 2 blocks |
| Agent Fund, wallet signed | `e7d2564eed413368943abc1f1a8076bf5db8e1e0c089485cd505069e78e68709` | App ledger and API: 200 token base units / 50,000 sats |
| Agent hot wallet test BCH | `b215196bec40e712b0fdb09b6fbe0e2d3bf05c8fd1f5db4946ce1cbe6b5d2622` | Wallet success: 100,000 sats |

At tip 330432, a read-only Electrum check reported 0 confirmations on both Fund transactions.
An early **Run paid request** returned `BUDGET_EXHAUSTED` with the next tranche unavailable;
no claim or service payment row was created. This is a negative-period check, not a successful paid request.

## Runtime defects found and fixed locally

1. WizardConnect relay calls JSON.stringify: raw CashScript sourceOutputs containing BigInt failed
   before a wallet signing request could be delivered. Serialize source outputs with libauth's
   WC2-BCH extended JSON, preserving amounts, byte arrays and contract metadata.
2. Real Fulcrum verbose transaction responses have confirmations/blockhash but no blockheight.
   The old maturity logic would repeatedly treat confirmed vaults as unconfirmed. Query the matching
   listunspent record's exact height, including token outputs, for both Payroll and Agent maturity.

Regression evidence: 14 chain tests passed (including relay round-trip and UTXO-age edge cases),
the full release checks and both browser E2E tests passed. No Mainnet evidence entry was added.
Client secret scanning also passed against the newly generated `.env.chipnet.local`, which Git ignores.
The fixes are saved in local commit `b91bc65`; the preparation commit is `25d3939`. Neither was
pushed or deployed during the Chipnet work.

Implementation sources:

- Installed `@wizardconnect/core` 0.2.4 relay-client.js and serialize.js.
- Cashonize `src/utils/zodValidation.ts`: extended BigInt/Uint8Array schemas.
- <https://github.com/mainnet-pat/wc2-bch-bcr>.
- <https://electrum-cash-protocol.readthedocs.io/en/latest/protocol-methods.html#blockchain-scripthash-listunspent>.

## Next actions

Confirm corrected funding and wait for its relative period. Save and verify an accepted Claim;
wait for the new vault UTXO's period, then A cancels. Record Agent Fund/Claim/service payment separately.
Preserve local test keys; never commit `.env.chipnet.local` or populate `MAINNET_EVIDENCE` from this record.

## 2026-11-02: real-wallet rejection and category correction

At tip 330570, the legacy funds had 138 confirmations. B rejected the first Claim request in
Cashonize. The app showed `User rejected the transaction`; a read-only chain query still showed
only the original Payroll Fund and its unspent 50 token units / 50,000 sats.
Screenshot: `work/chipnet/payroll-rejected-2026-11-02.jpg`.

B approved the next request, but the node rejected the signed transaction with
`mandatory-script-verify-flag-failed (Script failed an OP_EQUALVERIFY operation)`.
Rejected txid `3a476b1b376cbd4c12d7803c710d9411776b0fd64245a391000b307d9e94f70d`
was absent from the chain/mempool. It is not a successful Claim.

Root cause: contract construction passed explorer-order category bytes to token introspection,
which expects wire order. Earlier repeated-byte fixtures concealed the reversal. Non-symmetric
category tests failed for Claim/Cancel/TopUp before the fix and all passed after reversing the
constructor argument. The settlement CLI uses the same correction and a 1 sat/byte claim fee
to remain within the covenant's 2,000-sat reduction cap. Its actual-category VM dry-run passes.
The compiled covenant bytecode is unchanged; constructor values and resulting addresses change.
The legacy vaults cannot use the normal Claim/Cancel paths and have not been recovered.
Only free Chipnet assets are affected in this test.

The deployed Mainnet site has NOT received this fix. Do not fund it until corrected code is
reviewed, tested and explicitly authorized for deployment. No Mainnet success is claimed.

| Corrected test preparation | Chipnet txid | Observation |
| :--- | :--- | :--- |
| Send another 300 test-token units to A receive/0 | `d4ed5d6a26e59e67104febfd18c0a957936e4da594a6ae232ad88a9804feadc0` | Cashonize success |
| Send 250,000 test sats to A receive/0 | `737943631dd32bd8646954d87be7d46d3cd89b7054c3fc9f1cb98b3be79c9b67` | Cashonize success |
| Corrected Payroll Fund | `aeab5d6cad4610d092306a9ad2c8a55d8a692d7caef2b32e19f607d830777075` | App ledger and query: 50 units / 50,000 sats; waiting 2 blocks |
| Corrected Agent Fund | `bfa946890f3691b584480254e3692d5e5238344c4ff68bfd35c64b2f74808dd2` | App ledger and API: 200 units / 50,000 sats; next claim block initially 330573 |

Validation: 17 chain tests, full release checks and both browser E2E tests passed after the
category correction. The additional settlement CLI regression passed after its fee correction.
Corrected funding screenshots: `work/chipnet/payroll-corrected-funded-2026-11-02.jpg`
and `work/chipnet/agent-corrected-funded-2026-11-02.jpg`.
At tip 330571, an independent Electrum UTXO query confirmed both new Fund txids at vout 0,
with the expected category and respectively 50/200 token units plus 50,000 sats each.
The relative period is still pending; the displayed next block can move until funding confirms.
Fix saved locally in `8e28688`; no push or production deployment was performed.
Source: <https://cashtokens.org/docs/spec/chip/> (category wire byte order).
