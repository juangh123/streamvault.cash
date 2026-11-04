# Selene / Paytaca 手机钱包测试记录

目的：用评委实际会用的手机钱包验证 WizardConnect。Chipnet 上用 Cashonize 网页钱包得到的结果
（[CHIPNET_EVIDENCE.md](CHIPNET_EVIDENCE.md)）不能代替本测试。

页面：<https://streamvault-cash.vercel.app>，**Agent 或 Payroll → Live**。测试时浏览器页面保持可见；
页面每次显示的钱包状态（短地址 / `reconnecting` / `Connect`）都按时间记录。

## 设备与版本

| 项目 | Payer 钱包 | Payee 钱包 |
| :--- | :--- | :--- |
| 钱包与版本 | Selene （待填） | Paytaca （待填） |
| 手机型号 / 系统版本 | （待填） | （待填） |
| 网络 | Mainnet / Chipnet | Mainnet / Chipnet |

## 无需资金的用例

| 编号 | 操作 | 预期 | 结果 |
| :--- | :--- | :--- | :--- |
| C1 | Payer → Connect，用 Selene 扫码并批准 | Payer 显示短地址 | 2026-11-04 修复后本地实机已显示地址，无需刷新；正式站点、设备/版本仍待补齐，见下方记录 |
| C2 | Payee → Connect，用 Paytaca 扫码并批准 | Payee 显示短地址；两个角色密钥不同 | 待测 |
| C3 | 钱包切到后台 60 秒，再回到前台 | 期间显示 `reconnecting`，之后恢复短地址，不需重新扫码 | 2026-11-04 本地 Selene 实机返回后保持同一 Payer 地址，无需重新扫码；未观察到中间 `reconnecting` 状态，设备/版本待补 |
| C4 | 浏览器页面隐藏 30 秒（切标签或收起面板），再显示 | 同 C3 | 未验证：内置浏览器隐藏/切标签后仍报告 `visible`，未产生实际后台条件 |
| C5 | 刷新页面 | 显示 `reconnecting`，钱包在前台时恢复；不出现新二维码 | 2026-11-04 本地 Selene 实机先显示 reconnecting，随后自动恢复同一地址，无新二维码；设备/版本待补 |

## 需要可签名交易的用例

这些用例要有资金：Mainnet 需要真实 BCH 和 PUSD；Chipnet 需要钱包支持 Chipnet，测试币免费，
步骤见 [CHIPNET_TEST_ZH.md](CHIPNET_TEST_ZH.md)。

| 编号 | 操作 | 预期 | 结果 |
| :--- | :--- | :--- | :--- |
| C6 | 发起充值或领取，在钱包里**拒绝** | 页面报错；链上无交易 | 待测 |
| C7 | 再次发起并**批准** | 页面显示 txid；链上可查到并确认 | 待测 |
| C8 | 钱包在后台时发起签名请求，再把钱包切回前台 | 钱包收到请求并可签名 | 待测 |

记录规则：每个用例写日期、时间、网络、钱包版本和结果；签名类用例附 txid。失败也要记录原因，
不改写成通过。

## 2026-11-04 实测（进行中）

- 目标：正式站点，Mainnet，Payer；钱包名称/版本、手机型号和系统版本待用户补充。
- 用户报告手机端已连接，但网页仍显示 `Connect`。浏览器曾记录
  `Key exchange timed out`；重新打开连接框仍展示同一二维码。首次配对的即时更新不记为通过，
  超时与后续配对的因果关系尚未确定。
- 刷新网页后，先显示 `reconnecting`，随后自动显示 Payer 地址；无需新二维码。
  因此本次观察支持 C5 的网页端恢复行为；设备信息仍待补齐。
- 后续网页又退回 `Connect`，用户报告“连接失败，重新尝试一下”。C3 不记通过；
  没有确认切后台/回前台的精确时间，不能把这次断开直接归因于后台操作。
- 用户要求重试，已生成与首轮不同的新 Payer 二维码，等待批准。C2、C4、C6–C8 尚未执行。
- 独立 Mainnet Electrum 只读查询：该 Payer 地址当时为 0 UTXO、0 sats，无代币；
  未发起充值、签名或广播。连接恢复不等于签名兼容性已验证。

### Selene 分阶段账户消息与开发模式重复配对

用户确认使用 **Selene Wallet**。本地独立诊断页观察到：

| UTC 时间 | 事件 | receive 公钥 | 路径名称 |
| :--- | :--- | :--- | :--- |
| 2026-11-04 10:16:31.645 | walletready | 无 | 空 |
| 2026-11-04 10:16:33.054 | walletready | 有 | receive, change, defi |

两次事件之间 hook 的 `connected` 状态、钱包名和 manager 引用不变。旧页面因此缓存了首次
无账户的结果；现在 WalletProvider 对每次 `walletready` 刷新账户，并在更换 manager 时注销监听。
合成浏览器回归先复现“第二条消息到达后仍无 Payer 地址”，修改后通过。

完整开发页实测又发现初始化副作用被 React StrictMode 重放，导致单次点击启动两次配对。
回归明确记录到 2 次调用，调整为从 Connect 点击事件启动后变为 1 次；连接框只负责展示。
已用新的本地 origin 开始干净会话复测。

诊断仅显示状态、公钥是否存在及路径名称，不导出 xpub、会话密钥或私钥。

### 修复后本地完整应用复测

- 代码：`07b2673`；页面 `http://localhost:5173`，网络选择 Mainnet、Sandbox 视图。
- 2026-11-04 10:50 UTC 观察：用户报告 Selene 已连接，网页已出现 **Copy payer address**
  和 **Disconnect payer**。关闭二维码后保持相同 Payer 地址；没有刷新或再次配对。
- C1 的本地网页端行为通过；未推送或部署，不能视为正式站点已修复。版本与设备仍待填写。
- C3：用户按要求切钱包后台 60 秒再返回，并回复“已返回前台”。返回后网页仍显示同一
  Payer 地址与 Disconnect 按钮，无需重新扫码。本次观察未捕获中间 `reconnecting` 状态；
  结论仅覆盖后台切换后的连接保留/恢复，不证明后台签名可用。
- C5（约 10:52 UTC）：钱包在前台时刷新网页，先显示 `reconnecting`，随后恢复同一
  Payer 地址；没有新二维码。
- C4 未验证：尝试隐藏内置浏览器和切换标签，但页面的 `document.visibilityState` 始终为
  `visible`。没有持续隐藏 30 秒的有效条件，不以这些操作作为通过证据。
- [本地连接截图](judge/06-selene-local-connected.png)：仅显示钱包连接，Sandbox 数值不是链上余额。
  C2、C6–C8、Paytaca 兼容性、设备/版本信息及正式站点复测仍待完成。
