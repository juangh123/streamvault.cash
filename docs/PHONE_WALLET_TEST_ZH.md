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
| C1 | Payer → Connect，用 Selene 扫码并批准 | Payer 显示短地址 | 2026-10-31 已配对成功（未签名）；2026-11-02 旧会话未能恢复，需重测 |
| C2 | Payee → Connect，用 Paytaca 扫码并批准 | Payee 显示短地址；两个角色密钥不同 | 待测 |
| C3 | 钱包切到后台 60 秒，再回到前台 | 期间显示 `reconnecting`，之后恢复短地址，不需重新扫码 | 待测 |
| C4 | 浏览器页面隐藏 30 秒（切标签或收起面板），再显示 | 同 C3 | 待测 |
| C5 | 刷新页面 | 显示 `reconnecting`，钱包在前台时恢复；不出现新二维码 | 待测 |

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
