# BCH BLAZE 2026: Official 7-Page Presentation Deck
## Project: AgentPay.cash (Widget Factory Presentation Format)

---

### Slide 1: Cover
- **Title**: AgentPay.cash
- **Subtitle**: Non-Custodial AI Agent Allowance Vault & Sub-Cent Micro-Payment Gateway on Bitcoin Cash
- **Event**: BCH BLAZE 2026 Hackathon
- **Team**: Team Autonomous Cash (Solo Developer + AI Collaborative Engineering)
- **Links**: https://agentpay.cash | GitHub: github.com/agentpay/agentpay.cash | Telegram: @AgentPayCash

---

### Slide 2: One-Liner & Project Overview
- **One-Liner**: Empowering autonomous AI Agents with controlled, sub-cent on-chain micro-payments, backed by non-custodial Bitcoin Cash Covenants.
- **Key Stats & Value Props**:
  - ⚡ **$0.001 per tx**: 100x cheaper than EVM L2s, making per-token API billing viable.
  - 🛡️ **Zero Risk of Card Draining**: Hard-coded per-tx allowance enforced by BCH Script.
  - 🔄 **Recursive Covenants**: Introspection guarantees change never leaves the vault.
  - 🚨 **1-Click Clawback**: 100% human sovereign fund reclamation anytime.

---

### Slide 3: The Origin Story & Problem
- **The AI Boom**: AI agents (AutoGPT, Devin, Claude MCP, LangChain) need to autonomously buy external compute, weather data, specialized LLM tokens, and scraper proxies.
- **The Catastrophic Failure Modes**:
  1. *Credit Cards*: Handing API keys/cards to agents leads to runaway billing loops.
  2. *EVM Chains*: Gas fees ($0.20 - $3.00) exceed the actual value of the micro-call ($0.001).
  3. *Unconstrained Crypto Wallets*: One prompt injection can drain the entire wallet.
- **The Epiphany**: Bitcoin Cash has the world's most elegant UTXO Introspection opcodes and microscopic fees. It is the missing financial layer for the AI Agent economy.

---

### Slide 4: Key Benefits & Features
- **For AI Developers**: Plug-and-play autonomous micro-payments SDK. No credit card KYC needed.
- **For API & Tool Providers**: Monetize per-request without subscription friction or payment processor chargebacks.
- **For Human Owners**: Complete peace of mind. Fund a bot with $2.00 of BCH, knowing it can never spend more than $0.003 in a single call.
- **For the BCH Ecosystem**: Massive on-chain transaction volume driven by machine-to-machine micro-transactions.

---

### Slide 5: Bitcoin Cash Technical Innovation (Core Scoring)
- **CashScript 0.10+ Covenants**:
  - Utilizes `OP_INSPECTINPUT*` and `OP_INSPECTOUTPUT*` via CashScript introspection.
  - `require(tx.outputs[1].lockingBytecode == tx.inputs[this.activeInputIndex].lockingBytecode);`
  - Guarantees on-chain algorithmic enforcement without trusted oracles or off-chain sequencers.
- **WizardConnect Integration**: Seamlessly connects mobile wallets (Selene) via QR and desktop extensions (Paytaca).
- **Dual Asset Architecture**: Built for native BCH satoshis, immediately extensible to PUSD CashTokens.

---

### Slide 6: Vision & Roadmap
- **Phase 1 (Hackathon MVP)**: Live web cockpit, CashScript vault contract, 1-Click Sandbox demo, Chipnet/Mainnet readiness.
- **Phase 2 (Developer SDK & MCP Server)**: Release Model Context Protocol (MCP) server for Claude Desktop and AutoGPT plugins (`agentpay-mcp`).
- **Phase 3 (Agent Marketplace)**: Decentralized directory of BCH-monetized micro-APIs (weather, compute, translation, image gen).

---

### Slide 7: Thank You & Live Demo
- **Try Live Demo**: https://agentpay.cash
- **GitHub Repository**: Full source code, test suites, and documentation.
- **Judge 1-Minute Walkthrough**: Instant simulation mode allows comprehensive review in under 60 seconds without installing third-party wallets.
- **Closing Quote**: *"Bitcoin Cash is peer-to-peer electronic cash for humanity — and now, for the autonomous agents working alongside us."*
