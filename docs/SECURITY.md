# Security Specifications & Threat Modeling
## AgentPay.cash — Zero-Trust Key Isolation & Covenants Defensive Architecture

---

### 1. Security Philosophy
AgentPay is engineered under the assumption that **autonomous AI Agents cannot be trusted with unconstrained financial authority.** Large Language Models are subject to jailbreaking, prompt injections, hallucinatory infinite loops, and memory dumps. Therefore, security guarantees must be enforced by the consensus rules of the blockchain virtual machine, not by application-level guardrails.

---

### 2. Threat Vector Analysis & Mitigations

| Threat Vector | Attack Scenario | AgentPay Mitigation |
| :--- | :--- | :--- |
| **Prompt Injection / Agent Hijack** | Malicious third-party prompt instructs agent to transfer 100% of wallet to attacker. | **Contract Hard Ceiling (`maxPerTx`)**: Even with valid signature, any tx exceeding `maxPerTx` (e.g. 1,000 sats / $0.003) is rejected by miners. |
| **Change Siphoning Attack** | Rogue agent crafts transaction directing change output to an attacker-controlled address. | **Recursive Covenant Introspection**: Contract enforces `tx.outputs[1].lockingBytecode == tx.inputs[0].lockingBytecode`. Any diversion of change causes script execution failure. |
| **Infinite Loop Micro-Draining** | Buggy agent script loops infinitely, making thousands of micro-payments. | **Human Sovereign Clawback (`reclaim`)**: Master key holder can trigger 1-click Emergency Sweep, instantly invalidating all remaining vault UTXOs. |
| **Dust Attack & Node Rejection** | Spends or change outputs smaller than 546 satoshis are broadcast, getting rejected as dust by miners. | **Dust Threshold Assertion**: Contract enforces `amount >= 546` and `change >= 546`. |
| **Miner Fee Squeezing** | Attacker sets fee too low or too high to trap funds or cause mempool drop. | **Deterministic Fee Allocation**: Fee parameter is strictly calculated (~300-500 sats) and audited before signing. |
| **Private Key Exposure** | Local disk or memory inspection extracts agent credentials. | **Zero-Trust Ephemeral Keys**: Agent only holds a temporary session key with limited spending permission. Owner master private key is never stored in browser memory or sent over network. |

---

### 3. Dust Limit & Arithmetic Invariants
- Bitcoin Cash standard relay rules consider any standard P2PKH or P2SH output with `< 546 satoshis` to be non-standard "dust".
- In `AgentVault.cash`:
  ```solidity
  require(amount >= 546);
  int change = tx.inputs[this.activeInputIndex].value - amount - minerFee;
  if (change >= 546) {
      require(tx.outputs[1].value == change);
      require(tx.outputs[1].lockingBytecode == tx.inputs[this.activeInputIndex].lockingBytecode);
  }
  ```
  If `change < 546`, remaining satoshis are absorbed into miner fee or must be swept via owner `reclaim` to avoid stuck dust.

---

### 4. Emergency Response & Incident Protocol
1. **Detection**: User or monitoring script detects abnormal spending frequency.
2. **Action**: Click **Emergency Sweep** button on AgentPay dashboard.
3. **Execution**: A single signed transaction sweeps all UTXOs from the vault address to the owner address.
4. **Result**: Zero funds remain in the vault. Agent transactions fail immediately with `Missing inputs` in mempool.
