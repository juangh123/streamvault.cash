# Organizer disclosure and roll-call notes

Prepared: 2026-10-17 (Asia/Shanghai)

Use this message in the official BCH BLAZE Telegram group before the Information Session. Do not mark
the attendance or Telegram requirements complete until an organizer responds or the team actually
joins the session.

## English message

> Hello BCH BLAZE organizers. Before submitting, we want to disclose the state of our repository.
>
> Project: StreamVault.cash
> Team: Autonomous Cash
> Repo: https://github.com/juangh123/streamvault.cash
> Baseline tag: `v0-prehackathon-baseline`
>
> The repository contains a prototype built on 2026-10-14 and 2026-10-15, before the official build
> period. It includes a CashScript covenant, a sandbox cockpit, tests, documentation, a draft deck and
> a draft explainer video. The prototype has no project-owned BCH Mainnet PUSD transaction, and the
> browser wallet flow currently supports pairing but not transaction signing.
>
> We are not presenting the prototype as work completed during BCH BLAZE 2026. During the build period
> (2026-11-14 to 2026-11-22) we plan to implement and submit a safer contract v2, real WizardConnect
> wallet transactions, a live Agent budget demo, Mainnet transaction evidence and the final media.
> The build-period commit range and transaction evidence will be documented in
> `docs/BUILT_DURING_BLAZE.md`.
>
> Could you confirm whether this is acceptable under the rules? If pre-existing code cannot be used,
> we will rebuild the core product from an empty repository during the build period. Thank you.

## Chinese version

> BCH BLAZE 主办方你好，提交前我们想主动披露仓库现状。
>
> 项目：StreamVault.cash
> 团队：Autonomous Cash
> 仓库：https://github.com/juangh123/streamvault.cash
> 赛前基线标签：`v0-prehackathon-baseline`
>
> 仓库里有一份在 2026-10-14 和 2026-10-15 完成的原型，早于正式赛期。原型包含 CashScript 合约、
> 沙盒界面、测试、文档、草稿演示文稿和草稿视频。原型没有项目自己的 BCH 主网 PUSD 交易，浏览器
> 钱包目前只完成了配对，还没有交易签名。
>
> 我们不会把这份原型当成 BCH BLAZE 2026 赛期内完成的工作。赛期（2026-11-14 至 2026-11-22）
> 我们会实现并提交更安全的合约 v2、真实 WizardConnect 钱包交易、Agent 预算演示、主网交易证据和
> 最终 Media，并在 `docs/BUILT_DURING_BLAZE.md` 记录赛期提交范围和链上证据。
>
> 请问这种处理是否符合规则？如果赛前代码不能使用，我们会在赛期内从空仓库重建核心产品。谢谢。

## Questions to ask at the 10/17 session

1. Is disclosed seed code allowed if it is frozen, excluded from the claimed build-period diff and
   materially improved during the event?
2. Does "significant improvement" have a minimum requirement, or is the written commit range enough?
3. May the pre-event deck, brand and documentation be reused, or must they also be rebuilt?
4. Should the DoraHacks submission link the baseline tag and commit directly?
5. Is a Mainnet PUSD transaction enough for the live-transaction requirement, or is an Agent service
   payment also expected?

## Roll-call checklist

- Join the Information Session at 22:00 Beijing time on 2026-10-17.
- State the team and project name during roll call.
- Ask at least the seed-code question above if the format allows.
- Record the organizer's answer, time, and channel.
- Capture a screenshot or message link as evidence.
- Update `docs/COMPLIANCE.md` only after attendance or verification actually happens.
- If the answer is restrictive, switch to the empty-repository rebuild plan before writing v2 code.
