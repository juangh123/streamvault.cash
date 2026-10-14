# DoraHacks Judge 60-Second Friction-Free Walkthrough
## AgentPay.cash — Evaluation Quickstart

---

Dear BCH BLAZE 2026 Judges,

We know your time is valuable! To make your evaluation seamless and completely friction-free—**without requiring you to install third-party mobile apps or request testnet faucets**—AgentPay.cash includes a built-in **"Judge 1-Click Fast Demo"** sandbox mode alongside real **Live Wallet (WizardConnect)** connectivity.

---

### ⏱️ 60-Second Self-Test Checklist

#### Step 1: Open the Application
Navigate to the live web interface (or run `npm run dev` locally). You will see the **Judge Fast-Track Bar** at the very top of the screen.

#### Step 2: Auto-Provision a Vault (1 Click)
Click the prominent button: **[🚀 Judge 1-Click Fast Demo]**.
- **What happens**: The system generates a deterministic `AgentVault` covenant contract, simulates a 0.001 BCH (~100,000 satoshis) deposit from a human owner, and establishes an active agent session key with a `maxPerTx = 1,000 sats` spending ceiling.

#### Step 3: Trigger an Autonomous AI Agent Payment
In the **AI Agent Action Runner** panel:
- Select any micro-service (e.g. *OpenAI/DeepSeek API Token Call — 800 sats* or *Decentralized Weather Oracle — 300 sats*).
- Click **[Execute Micro-Payment]** or click **[Run Autonomous Stream Workflow]**.
- **Inspect**:
  1. The vault balance instantly updates.
  2. The **Live Introspection Visualizer** highlights:
     - Output 0 (800 sats) -> Directed to Service Provider.
     - Output 1 (98,800 sats) -> Recursively verified and locked into the identical `lockingBytecode`.
  3. A cryptographic transaction record is generated in the **Live Transaction Ledger**.

#### Step 4: Test Covenant Security Boundary (Rejection)
Attempt to force a payment above `maxPerTx` (e.g., 2,500 sats):
- **Inspect**: The simulation engine immediately displays the VM verification failure: `Execution Failed: Amount (2500) exceeds maxPerTx (1000)`.

#### Step 5: Test Sovereign Emergency Sweep (Clawback)
Click the red **[🚨 Emergency Sweep (Clawback)]** button:
- **Inspect**: The human owner signs the `reclaim` function. 100% of the remaining balance is instantly swept to the owner's address. Vault balance becomes 0 sats, rendering the agent completely incapable of further spending.

---

### 🔍 Key Files for Technical Auditing
- Contract Code: `contracts/AgentVault.cash`
- Architectural Spec: `docs/ARCHITECTURE.md`
- Security Threat Model: `docs/SECURITY.md`
- Presentation Slides: `docs/SLIDES.md`
