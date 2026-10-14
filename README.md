# AgentPay.cash ⚡
> Non-Custodial AI Agent Allowance Vault & Sub-Cent Micro-Payment Gateway on Bitcoin Cash (BCH)

[![Hackathon](https://img.shields.io/badge/BCH%20BLAZE-2026-brightgreen.svg)](https://dorahacks.io/hackathon/bchblaze2026)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CashScript](https://img.shields.io/badge/Smart%20Contracts-CashScript%200.10-green)](https://cashscript.org/)
[![Network](https://img.shields.io/badge/Network-BCH%20Mainnet%20%7C%20Chipnet-orange)](https://bitcoincash.org)

---

## 💡 The Problem & The Big Idea

AI Agents (AutoGPT, LangChain, Claude MCP, Devin) are taking over autonomous computational workflows. However, **how do they pay for third-party APIs, data oracles, compute power, and web scraping?**

1. **The Credit Card Dilemma**: Handing an AI Agent corporate credit card details or unmetered SaaS API keys exposes users to catastrophic billing loops or accidental bank draining.
2. **The EVM Gas Impasse**: Ethereum or L2 gas fees ($0.20 - $5.00 per tx) make single-request micro-payments (costing $0.001 each) mathematically impossible.
3. **The Raw Private Key Trap**: Giving an autonomous agent an unconstrained crypto private key means any prompt injection or rogue model action can instantly wipe out 100% of the wallet.

### 🌟 The Solution: AgentPay.cash
**AgentPay.cash** leverages Bitcoin Cash’s native **UTXO Covenants & Introspection Opcodes** via CashScript to build a bulletproof, non-custodial allowance vault:
- 🛡️ **Hard Spending Caps**: The AI Agent can only spend up to a strict ceiling (e.g., `maxPerTx = 1,000 sats` (~$0.003)) per transaction.
- 🔄 **Recursive Covenant Change**: Introspection opcodes inspect outputs in the Bitcoin Cash Virtual Machine. Change must return **strictly** to the exact same contract bytecode (`lockingBytecode`). The agent cannot redirect change to any unauthorized address.
- 🚨 **Emergency Sweep**: The human owner retains complete sovereign control and can claw back 100% of remaining funds with a single click at any millisecond.
- 💸 **Sub-Cent Real Settlement**: BCH transaction fees are ~0.001 USD (~300 satoshis), enabling true pay-per-token and pay-per-call machine-to-machine commerce.

---

## 🏛️ Project Architecture

```
AgentPay.cash/
├── docs/                      # Comprehensive project & submission specifications
│   ├── PRD.md                 # Product Requirements Document
│   ├── ARCHITECTURE.md        # Technical architecture, Covenants & UTXO mechanics
│   ├── SECURITY.md            # Zero-trust security boundaries & threat modeling
│   ├── SLIDES.md              # Official 7-slide Widget Factory presentation deck
│   └── JUDGE_GUIDE.md         # 60-second friction-free walkthrough for DoraHacks judges
├── contracts/                 # CashScript Smart Contracts
│   ├── AgentVault.cash        # Core Covenants Vault contract
│   └── test-vault.ts          # Contract test suite & simulation
├── src/                       # Modern Frontend Cockpit (React + Vite + Tailwind CSS)
│   ├── components/            # UI components (Judge fast-track, Vault panel, Visualizer)
│   ├── lib/                   # CashScript covenants logic & mock BCH network
│   └── types/                 # TypeScript interfaces
└── README.md
```

---

## 🚀 Quick Start for DoraHacks Judges

Visit our interactive Live Demo or run locally:

```bash
# 1. Clone repository
git clone https://github.com/your-username/AgentPay.cash.git
cd AgentPay.cash

# 2. Install dependencies
npm install

# 3. Launch local dev server
npm run dev
```

Open `http://localhost:5173` to experience the **1-Minute Judge Walkthrough**:
1. Click **"Judge 1-Click Fast Demo"** to auto-provision a simulated 0.001 BCH vault.
2. Click **"Trigger AI Agent Action"** to watch the Agent autonomously pay for an LLM token call (800 sats).
3. Observe the **Live Introspection Visualizer** prove that change is recursively routed back to the vault bytecode.
4. Click **"Emergency Sweep"** to execute the human clawback function and drain 100% back to the owner wallet.

---

## 📜 Smart Contract Core Logic (`contracts/AgentVault.cash`)

```solidity
pragma cashscript ^0.10.0;

contract AgentVault(
    pubkey ownerPk,         // Human owner (sole reclaim authority)
    pubkey agentPk,         // AI Agent session key (limited spending)
    int maxPerTx            // Max satoshis allowed per call (e.g. 5000 sats)
) {
    function spend(
        sig agentSig,
        int amount,
        bytes serviceLockingBytecode,
        int minerFee
    ) {
        require(checkSig(agentSig, agentPk));
        require(amount <= maxPerTx);
        require(amount >= 546); // Dust protection

        // Output 0: Direct payment to the verified service provider
        require(tx.outputs[0].value == amount);
        require(tx.outputs[0].lockingBytecode == serviceLockingBytecode);

        // Output 1: Covenant introspection ensures change returns to this vault
        int change = tx.inputs[this.activeInputIndex].value - amount - minerFee;
        if (change >= 546) {
            require(tx.outputs[1].value == change);
            require(tx.outputs[1].lockingBytecode == tx.inputs[this.activeInputIndex].lockingBytecode);
        }
    }

    function reclaim(sig ownerSig) {
        require(checkSig(ownerSig, ownerPk));
    }
}
```

---

## 🏆 BCH BLAZE 2026 Submission Tracks
- **Mainnet Track**: Full-stack non-custodial payment infrastructure, CashScript contract, and interactive web dashboard.
- **Media Track**: 7-slide official presentation deck and 90-second animated AI explainer video.

---

## 📄 License
MIT © 2026 Team AgentPay
