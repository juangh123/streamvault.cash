# Product Requirements Document (PRD)
## AgentPay.cash — Non-Custodial AI Agent Allowance Vault & Micro-Payment Gateway

---

### 1. Executive Summary & Vision
AgentPay.cash is a decentralized, non-custodial financial vault and micro-payment protocol designed specifically for autonomous AI Agents operating on Bitcoin Cash (BCH). By combining BCH's near-zero transaction fees (~0.001 USD) with native UTXO Introspection Covenants via CashScript, AgentPay solves the fundamental dilemma of the AI Agent economy: **how to grant autonomous software spending authority without handing over unconstrained private keys or infinite credit lines.**

---

### 2. Problem Statement
1. **Unconstrained API & Cloud Costs**: Autonomous agents (e.g. LangChain agents, AutoGPT, Claude MCP tools, web crawlers) frequently loop or call external APIs thousands of times. Traditional corporate credit cards or prepaid API keys have failed catastrophically due to unbounded consumption.
2. **EVM Gas Inefficiency**: In Ethereum and L2 ecosystems, paying $0.001 for a single LLM token inference or weather query requires $0.20 to $3.00 in gas fees, rendering sub-cent micro-payments economically infeasible.
3. **Private Key Vulnerability**: Handing a raw blockchain private key to an AI agent leaves users vulnerable to prompt injections, model hallucinations, and reverse-engineering of agent memory.
4. **Lack of Native Protocol Controls**: Existing crypto bot solutions rely on centralized custodial servers to enforce quotas, creating single points of failure and custodial legal risk.

---

### 3. Solution Overview
AgentPay introduces an on-chain **Covenant Vault** instantiated with:
- `ownerPk`: The human owner's public key (100% sovereign reclamation authority).
- `agentPk`: The AI Agent's ephemeral session key.
- `maxPerTx`: A hard-coded ceiling in satoshis restricting the maximum expenditure of any single transaction.

The Bitcoin Cash VM verifies via introspection opcodes that:
1. The transaction is signed by `agentPk`.
2. The payment amount does not exceed `maxPerTx`.
3. The change output is **cryptographically compelled** to return to the exact same contract bytecode.
4. The human owner retains an unconditional `reclaim` function to withdraw all funds instantly.

---

### 4. Target User Personas
- **AI Agent Developers**: Building multi-agent systems, AutoGPT pipelines, or MCP servers requiring autonomous billing.
- **Data & API Service Providers**: Oracles, LLM providers, and scraper networks accepting per-call sub-cent satoshi payments.
- **Crypto-Native Power Users**: Humans deploying automated research bots without risking more than $1-$5 in working capital.
- **Hackathon Judges (BCH BLAZE 2026)**: Technical reviewers evaluating Bitcoin Cash real-world utility and Covenants innovation.

---

### 5. Functional Requirements
#### 5.1 Vault Creation & Funding
- Users connect a BCH wallet (Selene, Paytaca, Cashonize via WizardConnect) or use Sandbox Mode.
- User configures `maxPerTx` (e.g., 1,000 sats / $0.003) and initial deposit (e.g., 0.001 BCH).
- Vault contract is generated deterministically; human owner deposits funds.

#### 5.2 Autonomous Agent Spending (`spend`)
- Agent is triggered to consume a third-party paid service (e.g. LLM inference, Weather Oracle, Image Generation, Web Proxy).
- Agent constructs an unconfirmed transaction spending from the vault UTXO.
- Contract validates `amount <= maxPerTx` and `output[1].lockingBytecode == input.lockingBytecode`.
- Payment completes on-chain within 1-2 seconds with 0-conf safety or next-block inclusion.

#### 5.3 Sovereign Clawback (`reclaim`)
- At any point, the human owner can broadcast a signed `reclaim` transaction.
- 100% of remaining UTXOs in the vault are returned to the owner's primary address.
- Agent key is instantaneously rendered powerless without needing on-chain blacklisting.

#### 5.4 Live Introspection Visualizer
- Visual node diagram showing Input UTXO -> Covenants Inspection -> Output 0 (Service) & Output 1 (Recursive Change).
- Real-time satoshi breakdown and dust limit verification (>546 sats).

---

### 6. Non-Functional Requirements
- **Performance**: Dashboard loads in under 1 second; instant simulation runs in <200ms.
- **Security**: Zero persistent storage of private keys in browser local storage or server databases.
- **Usability**: 1-Minute Judge Fast-Track button allowing frictionless review without external wallet dependencies.
- **Responsiveness**: Mobile-first responsive layout (375px to 4K displays).
