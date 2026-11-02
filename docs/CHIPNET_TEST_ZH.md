# SV-CHIPNET-001：真钱包 Chipnet 测试

负责人：Sol（环境、代码、验证）、用户（创建钱包、备份与签名）。
状态（2026-11-02）：两个 Cashonize HD 钱包已连接并签名充值，拒签检查通过；
实际领取发现代币编号字节序错误，已在本地修复并重新充值。Payroll 领取、Agent 领取和
服务付款已有 2 个确认；Payroll 取消退款也已被网络接受，0.40 测试代币与
47,485 测试 sats 退回 A，金库已清空。退款首次查询为 0 确认，仍待入块。
完整交易证据见 [CHIPNET_EVIDENCE.md](CHIPNET_EVIDENCE.md)。正式主网站点尚未部署此修复，先不要充值主网金库。
目标：不用购买 BCH，以无实际价值的 Chipnet BCH 和测试代币，验证钱包连接、签名、拒签、
金库充值、领取、取消及 Agent 服务付款。Chipnet 交易不能写入 `MAINNET_EVIDENCE`。

## 1. 本地测试站

在项目目录执行 `npm run dev:chipnet`，打开 <http://127.0.0.1:5174>。
该入口默认 **Payroll / Live / Chipnet**，网络选择器只提供 Chipnet。
API 复用 Vercel handlers，但只接受 Chipnet 配置、使用本地内存请求存储，监听本机回环地址。
此服务不读取或下载 Vercel 的生产环境配置；Agent 未配置时返回 `AGENT_DISABLED`。
不要用正式站的 Mainnet Agent 后端开展这轮测试。

## 2. 创建两个 HD 开发钱包

选择 Cashonize：官方仓库说明支持 WizardConnect 与 HD 钱包；源码也提供 Chipnet 开发钱包。
访问 <https://cashonize.com/>，由用户完成创建及备份。
初次引导创建的是默认网络钱包，无需给它充值；随后在 Settings 的 Developer settings 中
选择添加 development wallet，网络选 **chipnet**，类型选 **HD**。
分别命名 `SV Chipnet A`、`SV Chipnet B`，独立创建，不要导入已有资产的钱包助记词。
如果安装版本没有这些选项，先核对版本，不能用 Testnet4 代替 Chipnet。

当前源码允许 Chipnet dApp 连接；WizardConnect 要求 HD 钱包。
两个钱包可以用电脑浏览器的独立配置文件或不同设备隔离。切换钱包后需确认签名请求的角色：
A 签 Fund/Cancel，B 签 Claim。是否能同时保持两个会话以实际操作结果为准。
若要证明 Selene/Paytaca 真机兼容，必须另行在对应应用和设备验证，不能用 Cashonize 结果代替。
助记词和私钥不需要发到聊天中，也不需要导出到项目。

## 3. 连接并领取测试 BCH

1. 本地站点 Payer → Connect，用 A 扫码或把 Copy URI 的连接串粘贴到 Cashonize 的
   WizardConnect 入口。批准后点页面 Payer 短地址，复制 token-aware receive/0 地址。
2. 钱包必须处于 Chipnet；地址前缀应为 `bchtest:`。前缀不能区分 Chipnet/Testnet4，
   因此还须核对钱包网络设置。
3. 在 <https://tbch.googol.cash/> 填测试地址，**Network 选 chipnet**，由用户完成验证码和申请。
   该水龙头也提供其他网络，默认选项不代表 Chipnet。若暂时无币，等待或更换有来源依据的水龙头。
4. 为 A 准备约 250,000 sats 测试 BCH，另留发行代币的余量；这是准备量，
   水龙头实际发放金额和限额以当前页面为准。B 领取的金库手续费由金库承担。
5. Payee → Connect 连接 B，核对 A/B 不是同一密钥。

## 4. 创建测试代币

在 Cashonize 的 Wallet tools / Create tokens 创建 fungible 测试代币，命名为
`SV Chipnet Test`、小数位 **2**，供应量可用 **100.00（10,000 基础单位）**。
只在 Chipnet 创建，不命名为真实 PUSD，不附加美元价值或兑付承诺。
如提示缺少合适的 genesis UTXO，使用该工具提供的准备步骤；代币类别来自发行所花费的
`vout=0` 父交易 txid，**不是简单复制发行交易本身的 txid**。

创建后，把至少 3.00 个测试代币及测试 BCH 放在 A 连接后复制的 receive/0 地址上。
钱包总余额有币不代表 receive/0 有币。记录实际代币 category，在本地 Payroll 的
**Chipnet test token category** 输入框粘贴 64 位类别。
应用会拒绝空值、占位类别和正式 PUSD 类别；格式正确也不代表该类别已经发行，必须核对链上 UTXO。

## 5. Payroll 真钱包流程

填写 Per period `0.10`、Period `2`、Initial deposit `0.50`：

1. A 签 **Fund vault**，核对 50,000 sats 测试 BCH 缓冲和 0.50 个测试代币进入金库，保存交易链接。
2. 等确认并点 **Refresh**，直到 Next claim 为 `available now`。
3. Claim 金额 `0.10`；B 先拒绝签名，保存错误与时间，并核对金库 UTXO 未花费且无新交易广播。
4. 再点 Claim，B 同意签名，保存交易链接，核对 B 收到 0.10，金库剩余 0.40。
5. 等 Claim 的新金库输出确认且再满足 2 区块周期；Refresh 后点 **Cancel & reclaim**，A 签名。
   当前客户端取消也设置相对 sequence，所以不能在 Claim 后立即取消。
6. 保存 Cancel 链接，核对剩余测试代币及扣除消耗后的测试 BCH 返回 A。

整个过程保持钱包角色、category、每期额度与周期不变，避免查到不同金库。
切换 Agent 或刷新页面前保存完整 txid、类别、参数及地址；表格记录保存在组件内存中。

## 6. Agent 测试服务

取得真实测试代币类别后运行：

```powershell
npm run setup:chipnet-agent -- --category=<实际64位Chipnet测试代币类别>
```

命令生成新的 testnet WIF，把私钥只写入已被 Git 忽略的 `.env.chipnet.local`，
只输出 Agent 和 Service 的公开测试地址；已存在文件时拒绝覆盖。
它不导入生产私钥，不发送交易。不要把此文件上传、贴到聊天或给测试密钥充值主网资产。
本地系统环境中的同名变量优先，启动时会检查 Agent 网络必须为 Chipnet。

1. 向命令输出的 **Agent address** 转约 100,000 sats 测试 BCH。
2. 重启 `npm run dev:chipnet`，切 Agent → Live，连接 A，点 Refresh live status。
3. 核对后端 network=chipnet、category 与测试代币一致、每期 0.10 / 2 blocks、服务价 0.01。
4. A 签 Fund agent vault，当前存入 2.00 个测试代币及 50,000 sats 缓冲。
5. 等周期成熟后 Run paid request，保存 Claim 与 Agent pay 交易链接。
   Agent 原来有足够代币时只会支付，不会新领取。
6. 请求存储是本地内存；重启会丢失去重记录。发生广播状态不明时，先核对链上状态再决定重试。

## 7. 验收记录

2026-11-01 准备证据：原有 61 项 covenant/engine/agent/API/chain 检查与双网络地址派生通过；
新增 network-config 与隔离临时目录中的密钥生成/保留/拒绝主网配置检查通过；
`npm run test:e2e` 的两个浏览器用例通过，`npm run build` 与客户端私钥扫描通过。
只读查询 Chipnet 高度 330430；本地 API 已验证 disabled=503、错误方法=405、
畸形 JSON=400、过大请求=413。Terra 顺序检查确认本地界面默认 Payroll/Live/Chipnet，
网络选择器无 Mainnet，Cashonize 提供 Chipnet HD 开发钱包创建表单。
上述证据只证明准备工作，不证明真实钱包生命周期通过。

| 项目 | 待记录 |
| :--- | :--- |
| A/B 钱包版本、设备与系统 | 待用户操作 |
| Chipnet category、发行交易及 receive/0 地址 | 待用户操作 |
| Payroll Fund / Claim / Cancel 完整 txid、确认数 | 待用户操作 |
| 拒签时间、截图、未广播核对 | 待用户操作 |
| Agent Fund / Claim / Agent pay 完整 txid、确认数 | 待用户操作 |

每笔成功交易至少确认 1 次；相对锁定按区块判断，不按固定分钟数保证。
测试证据单独记录为 Chipnet，不修改主页的 Verified on BCH Mainnet 状态。

来源（2026-11-01 核查）：

- <https://github.com/cashonize/cashonize-wallet>：HD / WizardConnect 支持。
- `src/utils/wallet/networks.ts`、`src/components/settingsMenu.vue`、
  `src/components/settings/addWallet.vue`（上述仓库）：Chipnet 开发钱包与连接网络限制。
- <https://tbch.googol.cash/>：当前表单包含 chipnet 选项。
- <https://cashtokens.org/docs/spec/chip/>：代币 genesis 类别与 vout=0 规则。
