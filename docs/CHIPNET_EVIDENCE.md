# SV-CHIPNET-001 — live wallet evidence (2026-11-01)

Status (2026-11-02): core dual-wallet lifecycle passed with confirmed transactions: funding,
rejection, Payroll Claim/Cancel and Agent Claim/service payment. At tip 330590, both claims and
service payment have 16 confirmations; cancellation has 14. This is not Mainnet or phone-wallet verification.
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

## Corrected real claims (2026-11-02)

At tip 330574 the Payroll UI showed `available now`. B approved the Claim in Cashonize Chrome.
Transaction `640cef8f6b03e8eca39e78af749f25c146b52c88cdb6a27a22798f49351d317b`
was accepted by the network (0 confirmations at the first independent query): output 0 pays
10 token units and 1,000 sats to B; output 1 returns 40 units and 48,459 sats to the corrected vault.
Screenshot: `work/chipnet/payroll-claim-success-2026-11-02.jpg`.

The first Agent request successfully claimed 10 units via
`510ab414954f3462f166c2e5ced4b22442ce5a454573035ee8b51c0cda51d747`, leaving
190 units and 48,459 sats in its vault. The subsequent service payment failed during construction,
before broadcast: SERVICE_ADDRESS was BCH-form, without the token-aware flag. Normalize it to
a token-aware address with the identical locking bytecode. A second construction error showed
OP_RETURN was added after automatic BCH change; add request binding before computing change.
The complete service-payment VM regression reproduced that error, then passed after reordering.
API tests now cover both defects (12 passing), and type checking passed. Existing hot-wallet
tokens are used when retrying; no duplicate claim is required.

After both payment construction fixes, a real UI request succeeded:
`5907cc8aedc19f6c2a4a8014516c70dde5f1e35dcc40e7d354b86574209a18f6`.
Independent Electrum lookup found it at 0 confirmations, spending the Agent Claim output and
the existing hot-wallet BCH funding. It pays 1 unit + 1,000 sats to the service, returns 9 units
+ 651 sats and 98,319 plain sats to the Agent, and includes OP_RETURN binding
`SV1:1b68192a-c235-470b-b032-e8f18aab72c3`.
The app returned `Service verified` and reported 0.01 paid / 0.09 spendable / 1.90 still locked.
Screenshot: `work/chipnet/agent-payment-success-2026-11-02.jpg`.
The earlier Agent Claim was independently retrieved too, at 0 confirmations; it spends the
corrected Agent Fund and returns 190 units to its vault. Failed construction attempts did not
create duplicate claims or service payments.

Next: review the local fixes for an explicitly approved push/deployment. Keep the Agent vault active.
Payment fix checks: 12 API tests, typecheck and build passed; client secret scanning passed.
No Mainnet action, GitHub push or deployment took place.

## Payroll cancellation completed (2026-11-02)

At tip 330576, independent lookups found 2 confirmations each for Payroll Claim, Agent Claim
and service payment. A approved `StreamVault: cancel stream` in Cashonize, showing +40 test
token units and +47,485 sats. The UI recorded Cancel and an empty Payroll vault.

Transaction `2dca01999f66b71774e2b290a4230c485a8447d655845c255ba71a2895ea0f9d`
was independently retrieved at 0 confirmations. It spends Payroll Claim vout 1 and has one
output to A receive/0: 40 units of the test category and 47,485 sats (974 sats fee).
A fresh query found no remaining UTXOs at the corrected Payroll vault.
The existing UI used sequence=2 and the network accepted the cancellation with its input
at 2 confirmations; no timelock settings were changed for this test.
Screenshot: `work/chipnet/payroll-cancel-success-2026-11-02.jpg`.

Core acceptance checklist:

- Independent A/B sessions and actual wallet signing: passed with Cashonize web HD.
- Payer funding including ordinary BCH inputs: passed.
- Payee rejection without broadcast: passed.
- Corrected Payroll claim and payer refund: passed at network acceptance.
- Agent tranche and request-bound service payment: passed; both have 2 confirmations.
- Refund block confirmation: passed on the final check below.
- Selene/Paytaca mobile compatibility and exact wallet release versions: not verified.
- Mainnet evidence: none. Legacy malformed test vaults remain unrecovered.

No code changed in this cancellation step. Record is local; no production publication occurred.

## Final confirmation check (2026-11-02)

At tip 330590, direct Electrum transaction lookups reported:

| Transaction | Confirmations | Block height |
| :--- | ---: | ---: |
| Payroll Claim `640cef8f6b03e8eca39e78af749f25c146b52c88cdb6a27a22798f49351d317b` | 16 | 330575 |
| Agent Claim `510ab414954f3462f166c2e5ced4b22442ce5a454573035ee8b51c0cda51d747` | 16 | 330575 |
| Service payment `5907cc8aedc19f6c2a4a8014516c70dde5f1e35dcc40e7d354b86574209a18f6` | 16 | 330575 |
| Payroll Cancel `2dca01999f66b71774e2b290a4230c485a8447d655845c255ba71a2895ea0f9d` | 14 | 330577 |

Both claims and payment share block hash
`00000000630979f0f974d5eac93aefc34ffb3198316a648d42b2e1f0e80c98dd`.
Cancellation block hash is `00000000000006ae0fbcd28889b1c7b80369ce670144a3580abe44a9408e5313`.
Block heights above follow from the observed tip and confirmation counts.
Core Chipnet wallet acceptance is complete. Separate mobile-wallet/Mainnet testing, recovery
of legacy malformed test vaults, and any production publication remain outside this result.
Final `npm run verify:release` passed after all fixes, including API/VM regressions, typecheck,
production build and client secret scan. The separate `.env.chipnet.local` secret scan passed too.
