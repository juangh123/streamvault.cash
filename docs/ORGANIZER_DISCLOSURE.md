# Organizer disclosure and roll-call notes

Prepared: 2026-10-17 (Asia/Shanghai)

Use this message in the official BCH BLAZE Telegram group before the Information Session. Do not mark
the attendance or Telegram requirements complete until an organizer responds or the team actually
joins the session.

Status: the English message was posted to BCH BLAZE Chat on 2026-10-17 at 20:18
(Asia/Shanghai). The group membership and message were visible in Telegram Web. Organizer response is
still pending.

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
> a draft explainer video. The baseline prototype has no project-owned BCH Mainnet PUSD transaction.
> The current sprint now adds the v1.2 contract hardening, persistent WizardConnect signing path and
> Agent budget API; real Mainnet evidence is still pending.
>
> We are not presenting the prototype as work completed during BCH BLAZE 2026. The current sprint adds
> a hardened v1.2 contract, real WizardConnect signing code, an Agent budget Sandbox/API and an updated
> deck. We still need to publish real Mainnet evidence and finish the official slides/media.
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
> 沙盒界面、测试、文档、草稿演示文稿和草稿视频。原型没有项目自己的 BCH 主网 PUSD 交易。当前
> 冲刺分支已加入 v1.2 合约加固、持久化 WizardConnect 签名路径和 Agent 预算 API，主网证据仍在准备。
>
> 我们不会把这份原型当成 BCH BLAZE 2026 赛期内完成的工作。赛期（2026-11-14 至 2026-11-22）
> 当前冲刺已加入更安全的 v1.2 合约、WizardConnect 签名代码、Agent 预算 Sandbox/API 和更新后的
> deck；我们仍需发布真实主网证据并完成官方 slides/media，并在 `docs/BUILT_DURING_BLAZE.md`
> 记录赛期提交范围和链上证据。
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
