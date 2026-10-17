# StreamVault v2 specification

Status: design draft for the BCH BLAZE 2026 build period.

Target window: 2026-11-14 through 2026-11-22 (Asia/Shanghai).

This document is a specification, not an implementation. No v2 contract or wallet code is merged
before the build window.

## Product scope

StreamVault v2 keeps the existing product thesis: a payer locks PUSD in a covenant, a payee draws a
capped tranche per relative period, and the payer can reclaim the remaining PUSD. The build adds three
things:

1. A safer one-vault-UTXO lifecycle with `claim`, `topUp` and multi-UTXO `cancel`.
2. Browser wallet signing through WizardConnect for `fund`, `topUp`, `claim` and `cancel`.
3. A small AI-agent budget demo that claims a PUSD tranche and pays a per-request service.

## Contract v2

Constructor parameters remain:

```text
payerPk, payeePk, amountPerPeriod, periodBlocks, pusdCategory
```

Use the verified mainnet category and 2-decimal scale from
[PUSD_VERIFICATION.md](PUSD_VERIFICATION.md) when the configuration is changed during the build.

### claim

Required shape:

```text
input 0: the active vault UTXO only
output 0: payee tranche, amount PUSD
output 1: vault change, same covenant bytecode, remaining PUSD
```

Requirements:

- `checkSig(payeeSig, payeePk)`.
- `tx.inputs.length == 1` and `this.activeInputIndex == 0`.
- `this.age >= periodBlocks`.
- `0 < amount <= amountPerPeriod`.
- `tx.outputs.length == 2`.
- `tx.inputs[0].tokenCategory == pusdCategory`.
- `tx.inputs[0].tokenAmount > amount`.
- `tx.outputs[0].tokenCategory == pusdCategory`.
- `tx.outputs[0].tokenAmount == amount`.
- `tx.outputs[1].lockingBytecode == tx.inputs[0].lockingBytecode`.
- `tx.outputs[1].tokenCategory == pusdCategory`.
- `tx.outputs[1].tokenAmount == tx.inputs[0].tokenAmount - amount`.
- `tx.outputs[1].value >= tx.inputs[0].value - 2000`.

The BCH rule is the fix for the v1 buffer gap. With a 1000-sat token output floor, the maximum miner
fee paid from the vault is 1000 sats, which is enough for the expected claim size at 2 sat/byte. The
implementation must test the real transaction size before fixing the fee policy.

The payee still chooses the destination of output 0. A future allowlist is out of scope.

### topUp

Candidate v2 shape:

```text
input 0: existing vault UTXO
input 1: one wallet PUSD input
output 0: merged vault UTXO
```

Requirements:

- `checkSig(payerSig, payerPk)`.
- `tx.inputs.length == 2` and `this.activeInputIndex == 0`.
- `tx.inputs[1].tokenCategory == pusdCategory`.
- `tx.outputs.length == 1`.
- `tx.outputs[0].lockingBytecode == tx.inputs[0].lockingBytecode`.
- `tx.outputs[0].tokenCategory == pusdCategory`.
- `tx.outputs[0].tokenAmount == tx.inputs[0].tokenAmount + tx.inputs[1].tokenAmount`.
- `tx.outputs[0].value >= tx.inputs[0].value + tx.inputs[1].value - 2000`.

This deliberately supports one added PUSD input at a time. It avoids unrolled multi-input logic and
keeps the covenant audit small. Multiple top-ups can be performed sequentially if a payer needs to add
several UTXOs.

Open implementation question: confirm that the CashScript 0.14 compiler accepts the required input
indexing and value expressions without unsupported loops. If it does not, keep the one-funding-input
shape and move any batching to the caller.

### cancel

Requirements:

- `checkSig(payerSig, payerPk)`.
- `tx.outputs.length == tx.inputs.length`.
- For every vault input, `tx.outputs[this.activeInputIndex]` must:
  - use `payerLockingBytecode`;
  - carry `pusdCategory`;
  - carry the full active input's PUSD amount.
- The payer may pay the miner fee from the reclaimed BCH, so no BCH minimum is required on cancel.

This allows one transaction to reclaim several vault UTXOs. The payer must construct the outputs in
the same order as the vault inputs.

### Residual risk: direct PUSD transfers

The covenant cannot see another UTXO at the same address. A third party can still send PUSD directly
to the vault and create another UTXO. The UI must not offer that flow; it should detect extra vault
UTXOs and prompt the payer to `topUp`/consolidate or `cancel`. The v2 claim rule prevents a single
transaction from spending two vault UTXOs, but it does not prevent the payee from claiming them in
separate periods. This risk is accepted for the hackathon and must be stated in the security notes.

## Wallet transactions

Use the verified WizardConnect contract from
[WALLET_SIGNING_VERIFICATION.md](WALLET_SIGNING_VERIFICATION.md).

### Common flow

1. Derive the payer and payee public keys from the wallet xpub at `receive` or `change` index 0.
2. Build the transaction with CashScript using a placeholder signature for covenant inputs.
3. Convert the CashScript `WcTransactionObject.transaction` to a hex string before sending it.
4. Send `manager.signTransaction({ transaction, inputPaths }, { signal })`.
5. Broadcast `response.signedTransaction` through Electrum.
6. Record the returned txid and explorer URL.

Do not request wallet signing and then broadcast a second time when `broadcast: true` is used. The
default for this project is `broadcast: false`.

### fund

`fund` is a plain P2PKH spend to the covenant token address. It is not a covenant function. Build the
wallet inputs with `placeholderP2PKHUnlocker`, include wallet input paths, and send `broadcast: false`.

### topUp, claim and cancel

- Include every contract input in `inputPaths`, using the path of the key embedded in the covenant.
- The payee uses the payee receive path for `claim`.
- The payer uses the payer receive path for `topUp` and `cancel`.
- Contract inputs must include the 65-byte zero signature placeholder and 33-byte zero pubkey
  placeholder generated by CashScript.
- `sourceOutputs` must retain `contract.abiFunction`, `contract.redeemScript` and `contract.artifact`.
- The wallet must be able to replace the placeholders and derive the same public key used in the
  covenant constructor.

## Agent budget layer

### Endpoints

- `POST /api/agent/run`
- `GET /api/service/insight?requestId=...`

### Demo parameters

- Vault: 2.00 PUSD.
- Per period: 0.10 PUSD.
- Period: 6 blocks.
- Service call: 0.01 PUSD.
- Request binding: OP_RETURN `SV1:<requestId>`.

### Server controls

- `AGENT_ENABLED` master switch.
- `AGENT_WIF` only on the server; never returned to the client.
- Hot-wallet PUSD balance ceiling.
- Per-IP and per-request rate limit.
- Request id uniqueness check.
- Service verification through Electrum: amount, destination, category and OP_RETURN request id.
- No LLM API key and no model call.

### Failure cases

- master switch disabled;
- hot wallet above ceiling;
- rate limited;
- current period not elapsed;
- budget exhausted;
- payment not found;
- wrong amount, destination or category;
- OP_RETURN request id mismatch;
- duplicate request id;
- broadcast failure.

The judge experience must show a clear "this period's budget is used up" state and the existing
Mainnet transaction instead of a fake success.

## Test matrix

### Contract

- Existing 12 VM tests remain green.
- Reject `claim` with more than one input.
- Reject `claim` that reduces the vault BCH by more than 2000 sats.
- Reject wrong input token category.
- Reject wrong output token category.
- `topUp` merges two PUSD UTXOs and the merged vault can claim in the next period.
- Reject `topUp` with a non-payer signature.
- Reject `topUp` with a wrong category or wrong merged token amount.
- `cancel` with two vault UTXOs reclaims both.
- Reject a claim that tries to use an unmerged direct-transfer UTXO without the vault path.

### Chain and wallet

- Chipnet `fund`, `claim`, `topUp`, `cancel`.
- Wallet pairing and signing in Selene or Paytaca.
- Mainnet `fund`, `claim` and one Agent service payment.
- Real txids in README.

### Agent API

- Happy path.
- `AGENT_ENABLED=false`.
- Missing payment.
- Underpayment.
- Wrong service address.
- Wrong category.
- OP_RETURN mismatch.
- Duplicate request id.
- Rate limit.
- Hot-wallet ceiling.
- Budget exhausted.

### Frontend

- `npm run build` with zero errors.
- 375px to 430px mobile layout without horizontal overflow.
- Judge reaches a Mainnet txid within 60 seconds.
- Sandbox completes without a wallet.
- No private key or `AGENT_WIF` in the client bundle.

## Acceptance criteria

The v2 submission is acceptable only when:

1. The contract v2 tests reject the v1 buffer, multi-input and category gaps.
2. Wallet-signed `fund`, `claim` and `topUp` work on Chipnet.
3. At least one real Mainnet PUSD transaction is public and linked.
4. The Agent demo pays a service and the service verifies the request on-chain.
5. The judge can use the agent path, the wallet path or the sandbox in under 60 seconds.
6. `docs/BUILT_DURING_BLAZE.md` records the build-period commit range and transaction evidence.
