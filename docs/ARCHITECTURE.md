# System Architecture & Technical Specifications
## AgentPay.cash — Bitcoin Cash Covenants & Autonomous Agent Execution Architecture

---

### 1. Architectural Philosophy
AgentPay is built upon the sovereign UTXO paradigm of Bitcoin Cash. Unlike account-based EVM contracts where state is stored in contract storage slots, Bitcoin Cash Smart Contracts operate as **spending conditions (locks)** on individual UTXOs. 

By leveraging native **Introspection Opcodes** (`OP_INSPECTINPUT*`, `OP_INSPECTOUTPUT*`) exposed through CashScript, AgentPay enforces state transitions recursively without needing oracles, off-chain state machines, or centralized coordinator servers.

---

### 2. High-Level System Topology

```
                  ┌───────────────────────────────────────────────┐
                  │                 Human Owner                   │
                  │   - Holds Master Private Key (e.g. Selene)    │
                  │   - Sets maxPerTx & initial deposit           │
                  │   - Retains 100% Emergency Clawback rights    │
                  └───────────────────────┬───────────────────────┘
                                          │ 1. Fund Vault
                                          ▼
                         ┌─────────────────────────────────┐
                         │      AgentVault Covenants       │
                         │      (CashScript Contract)      │
                         │  - Balance: e.g. 100,000 sats   │
                         │  - Hard ceiling: 1,000 sats/tx  │
                         └────────────────┬────────────────┘
                                          │
            ┌─────────────────────────────┴─────────────────────────────┐
            │ 2. spend(agentSig, amount, serviceLockingBytecode, fee)    │ 4. reclaim(ownerSig)
            ▼                                                           ▼
┌───────────────────────────────┐                             ┌───────────────────┐
│        AI Agent Engine        │                             │   Owner Wallet    │
│  - Ephemeral Session Key      │                             │ (100% Recovered)  │
│  - Calls Micro-APIs           │                             └───────────────────┘
└───────────────┬───────────────┘
                │
                ├──────────────────────────────────────┐
                │ Output 0: Direct Payment             │ Output 1: Recursive Change
                ▼                                      ▼
┌───────────────────────────────┐     ┌─────────────────────────────────┐
│     Third-Party Service       │     │     Same AgentVault Bytecode    │
│ (LLM / Oracle / Scraper API)  │     │ (tx.outputs[1].lockingBytecode  │
│ e.g. 800 satoshis             │     │  == tx.inputs[0].lockingBytecode│
└───────────────────────────────┘     └─────────────────────────────────┘
```

---

### 3. Smart Contract Specification (`contracts/AgentVault.cash`)

The core contract is written in **CashScript 0.10+**:

```solidity
pragma cashscript ^0.10.0;

contract AgentVault(
    pubkey ownerPk,         // The human controller's public key
    pubkey agentPk,         // The AI Agent's limited-privilege public key
    int maxPerTx            // Maximum satoshis permitted per single spend
) {
    /**
     * @notice Allows the AI Agent to spend a micro-payment to a service provider.
     * @param agentSig Signature from the AI Agent key
     * @param amount The payment amount in satoshis
     * @param serviceLockingBytecode The recipient's scriptPubKey / lockingBytecode
     * @param minerFee Mining transaction fee (typically 300 - 500 satoshis)
     */
    function spend(
        sig agentSig,
        int amount,
        bytes serviceLockingBytecode,
        int minerFee
    ) {
        // Verification 1: Verify Agent cryptographic signature
        require(checkSig(agentSig, agentPk));

        // Verification 2: Enforce policy ceilings
        require(amount <= maxPerTx);
        require(amount >= 546); // Bitcoin Cash dust threshold

        // Verification 3: Verify Output 0 (Service Provider)
        require(tx.outputs[0].value == amount);
        require(tx.outputs[0].lockingBytecode == serviceLockingBytecode);

        // Verification 4: Recursive Covenants Introspection (Output 1 Change)
        // Calculate the expected change after deducting spent amount and miner fee
        int change = tx.inputs[this.activeInputIndex].value - amount - minerFee;
        if (change >= 546) {
            require(tx.outputs[1].value == change);
            // CRITICAL: Introspection guarantees change returns to the EXACT SAME contract bytecode
            require(tx.outputs[1].lockingBytecode == tx.inputs[this.activeInputIndex].lockingBytecode);
        }
    }

    /**
     * @notice Allows the human owner to unconditionally sweep and recover all funds.
     * @param ownerSig Signature from the human master key
     */
    function reclaim(sig ownerSig) {
        require(checkSig(ownerSig, ownerPk));
    }
}
```

---

### 4. Bitcoin Cash VM Introspection Mechanics
1. **`tx.inputs[this.activeInputIndex].lockingBytecode`**: Reads the scriptPubKey of the input UTXO currently being spent. This is the compiled bytecode of the `AgentVault` covenant.
2. **`tx.outputs[1].lockingBytecode`**: Reads the scriptPubKey of the change output.
3. **Equivalence Constraint**: By asserting `tx.outputs[1].lockingBytecode == tx.inputs[this.activeInputIndex].lockingBytecode`, the VM proves at consensus level that funds remain locked under the exact same spending restrictions. Neither the Agent nor any third party can siphon off the change.

---

### 5. Frontend & Client-Side Stack
- **Framework**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS + Custom Cyber/Fintech Design System
- **Icons**: Lucide React
- **Wallet Connection**: WizardConnect modal & bridge (supporting Selene Mobile QR, Paytaca Web Extension, and Cashonize Web)
- **Simulation Engine**: Client-side BCH transaction builder & introspection validator for instantaneous judge evaluations.
