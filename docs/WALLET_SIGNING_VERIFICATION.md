# WizardConnect signing verification

Verified: 2026-10-17 (Asia/Shanghai)

Scope: the installed `@wizardconnect/*` packages and a public BCH wallet implementation.

This is a code-level verification. The app now implements the persistent manager and
`signTransaction` path; a real Selene/Paytaca device test on Chipnet and Mainnet is still required
before claiming the wallet flow complete.

## Installed versions

- `@wizardconnect/core` 0.2.4
- `@wizardconnect/dapp` 0.2.2
- `@wizardconnect/react` 0.2.3
- `cashscript` 0.14.0
- `@bch-wc2/interfaces` 0.0.8

## Confirmed API

After the React hook reports `state === "connected"`, `manager` is a
`DappConnectionManager`.

```ts
const response = await manager.signTransaction(
  {
    transaction: {
      transaction: txHex,
      sourceOutputs,
      broadcast: false,
      userPrompt: "StreamVault: claim tranche",
    },
    inputPaths: [[0, "receive", 0]],
  },
  { signal },
);
```

The response type is:

```ts
{
  signedTransaction: string; // fully signed transaction hex
  error?: string;
}
```

The convenience method fills `action`, `time` and `sequence`. Pass an `AbortSignal` to cancel a
pending request; the manager sends `sign_cancel` to the wallet.

## inputPaths

The tuple is:

```text
[inputIndex, pathName, addressIndex]
```

Known path names:

| Name | Recommended BIP44 path |
| :--- | :--- |
| `receive` | `m/44'/145'/0'/0` |
| `change` | `m/44'/145'/0'/1` |
| `defi` | `m/44'/145'/0'/7` |

The path identifies the wallet key used to sign that input. For a CashScript covenant input, the
wallet still needs the entry when it must replace the placeholder signature. The covenant constructor
must use the public key derived from the same path and index.

## Contract input behavior

The public Paytaca wallet implementation confirms the intended flow:

- decode `transaction.transaction` as a hex string;
- hydrate `sourceOutputs[].contract` with `abiFunction`, `redeemScript` and `artifact`;
- derive keys directly from `inputPaths`;
- for a P2SH or P2SH32 contract input, verify the redeem script hash against the locking bytecode;
- replace the CashScript 65-byte zero signature placeholder and 33-byte zero pubkey placeholder;
- sign with `SIGHASH_ALL | SIGHASH_FORKID | SIGHASH_UTXOS`;
- return the fully signed transaction hex.

Sources:

- `https://gitlab.com/riftenlabs/lib/wizardconnect/-/blob/main/docs/protocol.md`
- `https://gitlab.com/riftenlabs/lib/wizardconnect/-/blob/main/docs/dapp.md`
- `https://github.com/paytaca/paytaca-app/blob/master/src/wallet/bch-sign.js`
- `https://github.com/paytaca/paytaca-app/blob/master/src/wallet/wizardconnect/service.js`

## CashScript object conversion

`TransactionBuilder.generateWcTransactionObject()` returns:

```ts
{
  transaction: TransactionCommon; // decoded object
  sourceOutputs: WcSourceOutput[];
  broadcast?: boolean;
  userPrompt?: string;
}
```

The verified wallet implementation expects `transaction.transaction` to be hex. Before sending, use
`transactionToHex` from `@wizardconnect/core/hdwalletv1-serialize`, or an equivalent libauth encoder:

```ts
import { transactionToHex } from "@wizardconnect/core/hdwalletv1-serialize";

const tx = wcObject.transaction;
const txHex = transactionToHex(tx.inputs, tx.outputs, tx.version, tx.locktime);
```

Do not send the decoded object directly to a wallet unless that wallet advertises support for the
object form.

## Broadcast behavior

WizardConnect transports a signing request; it does not itself broadcast. The optional
`broadcast` flag is a wallet-side instruction. For StreamVault:

- set `broadcast: false`;
- receive `response.signedTransaction`;
- broadcast that hex through the Electrum provider;
- use the provider's returned txid and explorer link.

This avoids double-broadcast and gives the app a single source of truth for the txid.

## Implications for StreamVault v2

1. Payer and payee keys must be derived from known wallet paths before the covenant is created.
2. Payer and payee should use separate WizardConnect sessions; both sign with receive/0.
3. The contract input index must appear in `inputPaths` for `topUp`, `claim` and `cancel`.
4. The source output must carry the full CashScript contract object.
5. The transaction must be serialized to hex before the sign request.
6. The app must show a wallet rejection or abort as a user-facing failure, not as a broadcast.
7. A Chipnet test with Selene or Paytaca is still required before Mainnet.
