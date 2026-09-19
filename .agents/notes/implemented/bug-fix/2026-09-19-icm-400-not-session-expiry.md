# Agent Note: ICM 错误页不按会话过期分类

Status: implemented

## Problem

会话过期修复（见 [会话过期 POST 自动重登](../feature/2026-09-18-session-expiry-auto-relogin.md)）引入的启发式把"裸 400 且 body 非 ADT 异常 XML"一律分类为 `AdtCsrfException` 以触发重登。上游 8.4.3 合入的契约测试证明该启发式过宽：ICM 错误页（响应头带 `x-sap-icm-err-id` / `sap-err-id`，body 为 HTML）也是裸 400，被劫持成 `AdtCsrfException` 后 `fromException` 不再保留 `HttpClientException` 的 status/code（`ERR_NETWORK` 等），诊断信息丢失，main.test.ts 两个 mock 测试失败。

## Alternatives considered

- **回退整个裸-400 启发式**：过期 POST 自愈随之消失，已验证的线上痛点复现。
- **按 body 文本匹配 session 字样**：SAP 文案有本地化变体，ICM 页面也可能含 session 字样，不可靠。
- **下放给调用方区分**：异常分类是传输层的持续义务（见会话过期笔记的 Consequences），下放违背既有决策。

## Decision

裸 400 判定为会话过期候选时排除 ICM 错误页：响应头带 `x-sap-icm-err-id` 或 `sap-err-id` 的 400 走原有的 `HttpClientException` 保留路径；无 ICM 头的裸 400 维持 `AdtCsrfException` 分类。新增 mock 测试锁定 fork 场景（裸 400 "Session timed out" → `isCsrfError`）；上游两个 ICM 契约测试恢复通过，fork 补丁与上游契约同时成立（8.4.4）。

## Consequences

- 若真实系统上的会话过期实际表现为 ICM 错误页，自愈对该形态失效——需在 S/4HANA 上复测；若复现，判别应基于更精确的错误形态而非请求头存在性，而不是简单回退本修正。
- 上游若调整 ICM 契约测试，本分支需重验"保留"与"自愈"两个方向同时成立。
