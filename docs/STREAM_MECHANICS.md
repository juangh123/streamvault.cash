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
combined with the checks above, the payee can never walk away with more than `amountPerPeriod` in one period.

### Exactly two outputs

`require(tx.outputs.length == 2)` prevents a malicious payee from adding a third output that would drain the
vault's BCH fee buffer (the vault keeps BCH on its token UTXO so it can keep paying miner fees).

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
| non-payer cancel | rejected (signature) |

## Fee & dust

The covenant UTXO carries PUSD **plus** BCH. The builder keeps the change UTXO above the token/BCH dust floor
and the remainder covers the miner fee, so the vault keeps a BCH buffer for future periods. Fee estimation is
size-based (see `src/lib/covenant.ts` / `src/lib/chain.ts`).

## Trademark caveat

`periodBlocks` is a *block* interval, not wall-clock seconds. "Per day / per month" is an approximation
(1 block ~ 10 min). True per-second streaming is a narrative framing only; the on-chain guarantee is
"at most one tranche per period".