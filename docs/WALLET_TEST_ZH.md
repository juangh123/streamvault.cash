# 主网与双钱包操作单

任务：SV-WALLET-001；负责人：Sol（代码与指引）、用户（手机连接与交易签名）。
依据：`0b65859`、`src/components/{Header,AgentPanel,LiveVaultPanel,TxLedger}.tsx`、
`src/wallet/WalletProvider.tsx`、`src/lib/{chain,agent-server,evidence}.ts`。
验收：完成 Agent 充值/领取/服务付款、Payroll 充值/拒签/领取/取消，保存真实主网交易与钱包版本。
本操作单不代表这些链上测试已经完成。

## 准备

1. 电脑打开 <https://streamvault-cash.vercel.app/>。
2. 手机钱包 A 用于 Payer，钱包 B 用于 Payee；必须使用不同密钥。
   连接弹窗列出 Selene、Paytaca、Cashonize；以所装版本实际支持 WizardConnect、CashTokens
   和此次交易签名为准，记录应用名与版本，不把弹窗中的名称当作真机兼容验证。
3. A 准备约 3 PUSD 和 250,000 sats BCH（**0.0025 BCH**）。其中 100,000 sats 计划转到
   Agent 热钱包，两个金库各需 50,000 sats 缓冲，余量用于手续费、代币输出与地址归集。
   这是起始准备量，实际不足时以钱包确认页和错误信息为准；不采用固定美元估价。
   B 无需预先充值，领取手续费来自金库。
4. PUSD category 为
   `2469acc5afa4b10cb5b5c04afb89c3a3ffd61c5da9c01e26d00951cae2a02544`，小数位 2。
   名称相同不代表是同一代币。
5. 主网操作都在 **Live → Mainnet** 下进行。Sandbox 不产生链上证据。
   手机钱包扫码连接、转账和签名由用户完成；不提供助记词或私钥。

## A. Agent：充值、领取、服务付款

1. 顶部选择 **Agent → Live → Mainnet**。点 **Payer** 旁的 **Connect**，
   用 A 扫描 `Connect payer wallet` 二维码并批准连接。
2. 点 Payer 旁的短地址，看到 `copied` 后，得到的是支持代币的 **receive/0** 地址。
   确认 PUSD 与普通 BCH 都在这个地址；应用不会扫描钱包其他地址。
   若余额分散在其他地址，在手机钱包中转到复制的地址，再等待可查询到账。
3. 点 **Refresh live status**。检查状态可加载、网络为 Mainnet。
   2026-11-01 只读查询时，服务价格为 0.01 PUSD，每 2 个区块额度为 0.10 PUSD；
   充值量按服务返回的每期额度乘 20，当前为 2.00 PUSD。实际签名前重新核对。
4. 核对 Agent 地址后，由 A 转 **100,000 sats（0.001 BCH）** 到：
   `bitcoincash:qzq6xa805mht8vuq7ea6ac9vg925lalvdscrggd85a`。
   这是服务器持有密钥的热钱包，独立于可取消的金库；金库 Cancel 不会收回这里的 BCH。
   地址应与当前线上 Agent 状态一致；部署更换密钥后不要沿用旧地址。
5. 点 **Fund agent vault**，A 检查 `StreamVault: fund agent budget` 请求：
   当前应存入 2.00 PUSD 与 50,000 sats BCH 到金库，另有找零与手续费。确认后保存 Fund 交易。
   新代码会自动补选同一 receive/0 地址的普通 BCH，不要求 PUSD 币本身携带 50,000 sats。
6. 等充值确认及周期成熟，期间点 **Refresh live status**；按链上区块判断，
   不把约 20–30 分钟当作保证。Agent 的 **Next claim** 可能一直显示目标区块号。
7. 点一次 **Run paid request**。服务器自动领取并支付，无需 B 签名。
   在 **Transaction Ledger** 保存 **Claim** 和 **Agent pay** 两行的 **on-chain** 链接。
   若热钱包原来已有足够 PUSD，本次可能只有 Agent pay；不能把它记为已完成领取测试。
8. 保留 Agent 金库供后续演示。首次测试无需点 **Run until budget exhausted**，
   它会连续产生付费请求。若要公开演示，另行把 A 的 receive/0 公钥配置为
   `VITE_AGENT_DEMO_PAYER_PUBKEY`，完成验证与部署；不使用私钥。

## B. Payroll：双钱包签名、拒绝与取消

1. 点顶部 **Payee → Connect**，用 B 扫码连接，然后选 **Payroll → Live → Mainnet**。
   两个角色都连接且密钥不同后，才会显示充值表单。
2. 填 **Per period (PUSD)** `0.10`、**Period (blocks)** `2`、
   **Initial deposit (PUSD)** `0.50`。充值后保持角色、网络与这两个策略参数不变，
   它们决定金库地址；改值会查到另一金库。
3. 点 **Fund vault**，A 核对 `StreamVault: fund payroll vault` 并签名。
   保存 Fund 的 on-chain 链接。充值应包含 0.50 PUSD 与 50,000 sats 缓冲。
4. 点 **Refresh**，等 **Next claim** 为 `available now`，并确认充值确实已确认。
   Payee claim 的金额保持 `0.10`。
5. 点 **Claim**，B 对 `StreamVault: claim tranche` 点拒绝。
   保存错误截图、时间和钱包版本；应无成功 Claim 记录、无新广播、原金库 UTXO 未花费。
   再点 **Refresh** 核对。页面报错本身不足以证明没有广播。
6. 再点 **Claim**，B 确认。保存 Claim 的 on-chain 链接；B 应收到 0.10 PUSD，
   金库剩余 0.40 PUSD。
7. **再次等待**新金库 UTXO 确认和周期成熟，再点 **Refresh**。
   当前客户端连取消交易也设置 `sequence = periodBlocks`，因此 Claim 后不能立即取消。
   合约 cancel 本身没有这一周期要求，这是当前交易构造的行为。
8. 点 **Cancel & reclaim**，A 核对 `StreamVault: cancel stream` 并确认。
   剩余 0.40 PUSD 与扣除领取消耗、取消手续费后的 BCH 退回 A。
   保存 Cancel 的 on-chain 链接，刷新核对金库 PUSD 为 0。

## 出错与记录

- `Insufficient PUSD` / `Insufficient BCH`：检查 A 的 receive/0 地址，不能只看钱包总余额。
- 超时或提示交易广播状态不明：先用报错中的完整 txid 查询浏览器及金库 UTXO，
  确认未成功后再决定重试，避免重复充值或服务付款。
- 交易表的 txid 文本被截短；点击 **on-chain** 后保存完整浏览器链接或 64 位 txid。
  Agent 与 Payroll 的交易记录在组件内存中，切换界面或刷新前先保存。
- 此轮不包含 **Top up (merge 1 UTXO)** / **Top up agent vault**；
  本次 BCH 自动补选修复覆盖 Fund，不能据此宣称 Top up 已通过真实钱包测试。
- 所有证据至少等 1 个链上确认。`on-chain` 只表示有交易链接，不代表已确认。

| 记录项 | 完整 txid / 链接 / 结果 |
| :--- | :--- |
| A 应用、版本、手机系统 | 待填写 |
| B 应用、版本、手机系统 | 待填写 |
| 热钱包 BCH 转账 | 待填写 |
| Agent Fund | 待填写 |
| Agent Claim | 待填写 |
| Agent pay（0.01 PUSD） | 待填写 |
| Payroll Fund | 待填写 |
| B 拒签时间、错误、未广播核对 | 待填写 |
| Payroll Claim | 待填写 |
| Payroll Cancel | 待填写 |

后续由 Sol 核对主网确认后，补 `src/lib/evidence.ts`、README、提交文档及钱包设备测试记录。
当前 `MAINNET_EVIDENCE` 为空；只有真实证据核实并发布后，才可宣称主网验证完成。
