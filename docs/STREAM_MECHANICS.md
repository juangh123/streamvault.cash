# Stream mechanics

## The relative-clock stream

A stream is a UTXO locked by `StreamVault`. Every claim spends that UTXO and recreates it, so the covenant
controls both the payout and the state transition.

```
vault UTXO (remaining PUSD)  --claim(amount)-->  Output 0: payee (amount PUSD)
                                                 Output 1: vault (remaining - amount PUSD, same bytecode)
```

### Why a relative lock is the right primitive

BCH has no "current block height" opcode, but it has **OP_CHECKSEQUENCEVERIFY** exposed in CashScript as
`this.age`. `this.age` reflects the *spending input's* relative-lock value (BIP68, block-based). A transaction
spending the covenant can only set that value if the UTXO is genuinely old enough - the node enforces the age.

The consequence is elegant: because each claim produces a fresh vault UTXO, **the clock resets automatically**.
The covenant does not need to store "last claim height" anywhere; the UTXO's own age is the timer.

```
require(this.age >= periodBlocks);
```

- A payee that claims at height `H` creates a vault UTXO at `H`.
- The next valid claim must be at height `>= H + periodBlocks`.
- `periodBlocks = 144` is roughly one BCH day (~10 min per block).

### Rate cap and conservation

- `require(amount > 0)`, `require(amount <= amountPerPeriod)` - the per-period ceiling.
- `require(tx.inputs[activeInputIndex].tokenAmount - amount > 0)` - a claim cannot empty the vault.
- `require(tx.outputs[0].tokenCategory == pusdCategory && tx.outputs[0].tokenAmount == amount)` - the payee
  receives exactly `amount` PUSD.
- `require(tx.outputs[1].lockingBytecode == tx.inputs[activeInputIndex].lockingBytecode)` - the change is
  locked under the **same** covenant bytecode; it cannot be redirected.
- `require(tx.outputs[1].tokenCategory == pusdCategory && tx.outputs[1].tokenAmount == remaining)` - the
  rest of the PUSD stays in the vault.

Fungible CashTokens cannot be minted or burned by the covenant, so the outputs must balance against the input;
combined with the checks above, the payee can never walk away with more than `amountPerPeriod` PUSD in
one period. This statement is about PUSD only; the BCH buffer gap is described below.

### Exactly two outputs and the BCH buffer

`require(tx.outputs.length == 2)` prevents a malicious payee from adding a third output. It does
not by itself preserve the vault's BCH fee buffer. v1.2 therefore adds a lower bound on the vault
change: `tx.outputs[1].value >= tx.inputs[0].value - 2000`. The payee can choose the payee
destination, but cannot drain the vault's fee buffer.

The claim also requires exactly one vault input, `this.activeInputIndex == 0`, and the vault input
category to equal the configured PUSD category.

### Top-up and multiple UTXOs

v1.2 adds `topUp(sig payerSig)`. It spends the existing vault UTXO plus one payer-owned PUSD input and
creates a single merged vault UTXO. The PUSD category must match, the merged token amount must be
exact, and the output preserves all but at most 2000 sats of the combined BCH. The fresh UTXO restarts
the relative period. Direct PUSD transfers can still create extra UTXOs; the UI warns and a future
version can add multi-UTXO cancel.

### Cancel

`cancel(sig payerSig, bytes payerLockingBytecode)` requires the payer signature and forces **all** remaining
PUSD to the payer-selected locking bytecode. It is the only path that empties the vault, and only the payer
can trigger it.

## Edge cases

| Case | Behaviour |
| :--- | :--- |
| `amount == 0` | rejected (`amount > 0`) |
| `amount > amountPerPeriod` | rejected (ceiling) |
| claim before period | rejected (`this.age`) |
| claim that would empty the vault | rejected - use `cancel` |
| change to any other address | rejected (bytecode mismatch) |
| third output | rejected (`outputs.length == 2`) |
| most BCH moved to the payee within two outputs | rejected by v1.2 when vault change < input - 2000 sats |
| direct PUSD transfer creates another vault UTXO | claim requires one vault input; UI warns; `topUp` merges one wallet UTXO |
| non-payer cancel | rejected (signature) |

## Fee & dust

The covenant UTXO carries PUSD **plus** BCH. The builder keeps the change UTXO above the token/BCH dust floor
and the remainder covers the miner fee. v1.2 enforces the 2000-sat reduction bound. Claims use a
1 sat/byte size-based fee so the 1000-sat payee output plus fee stays within the bound; fund, top-up
and cancel use 2 sat/byte. Fee estimation is in `src/lib/chain.ts`.

## Trademark caveat

`periodBlocks` is a *block* interval, not wall-clock seconds. "Per day / per month" is an approximation
(1 block ~ 10 min). True per-second streaming is a narrative framing only; the on-chain guarantee is
"at most one tranche per period".
