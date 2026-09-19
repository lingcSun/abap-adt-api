# abap-adt-api — Agent Instructions

TypeScript client library for SAP's ABAP Developer Tools (ADT) REST API. Fork of [marcellourbani/abap-adt-api](https://github.com/marcellourbani/abap-adt-api), published as `@lingc-sun/abap-adt-api`; upstream consumer [vscode_abap_remote_fs](https://github.com/marcellourbani/vscode_abap_remote_fs), fork consumer `mcp-abap-adt`（不用相对链接，隔离 checkout 会断链）.

## Commands

```bash
npm run build   # tsc → build/（gitignored，勿手改产物）
npm test        # jest；未配置 ADT_URL 时集成测试自动跳过
```

无 linter 配置——TypeScript strict 模式即代码质量门禁。

## Layout

`src/`：`api/` 每域一个模块（activate、debugger、atc…）；`AdtClient.ts` 约 120 个委托方法的薄客户端；`AdtHTTP.ts` 传输（CSRF/OAuth/session）；`AdtException.ts` 异常与类型守卫；`utilities.ts` XML 辅助；`test/`。**新增端点**：`src/api/<域>.ts` 写函数（首参 `AdtHTTP`）→ `AdtClient.ts` 加委托 → `index.ts` 导出类型。

## Fork Invariants

- **Fork 补丁少而聚焦**：一个提交只修一个行为缺陷，根因写全在提交信息里，便于上游合入后对冲（[rationale](.agents/notes/implemented/process/2026-09-18-fork-maintenance-policy.md)）。
- **版本号跟随上游 tag**（8.4.x）：依赖范围永远可读为"上游某版 + fork 补丁"；merge 上游后必须重验 fork 补丁仍然生效（[rationale](.agents/notes/implemented/process/2026-09-18-fork-maintenance-policy.md)）。
- **commit 分两类**：可上游（不含 scoped 包名与 agent 语料、能并入上游库）与 fork 专属（`(fork)` scope + `Fork-only: yes` 尾注）；可上游在前、fork 专属在后，`for-upstream` 指向可上游段顶端，发上游 PR 从它出发（[rationale](.agents/notes/implemented/process/2026-09-19-fork-upstream-commit-discipline.md)）。

## Conventions

- API 函数签名统一 `async function doThing(h: AdtHTTP, …): Promise<Result>`；`AdtClient` 方法仅委托。
- XML：fast-xml-parser 保留命名空间前缀（`adtcore:uri`），属性带 `@_` 前缀；重复元素用 `xmlArray()`，安全路径导航用 `xmlNode()`。
- 外部响应校验用 io-ts codec；错误判别用 `isAdtError()` / `isHttpError()` / `isLoginError()`，抛 `AdtErrorException`。
- 类型 PascalCase 无 `I` 前缀；不用 enum，用 const 对象或 union。
- 测试细则（setenv.js 模板、runTest 助手、testdata 样本、破坏性测试开关）见 [README Testing](README.md#testing)。

本文件预算 ≤ 2300 字符（按字符计，中英文同口径）。超出先搬家（挪到笔记或 README）、再压缩；确需更多才改这个数字，并在提交说明里给理由。

## Agent Notes

Fork 维护政策与决策记录在 [.agents/notes/](.agents/notes/AGENTS.md)。非平凡变更必须在同一提交新增或更新至少一篇 Agent Note（[规则](.agents/notes/README.md#何时必须写)）；每篇新笔记触发 supersession 检查。写服务端行为断言时用 [test-dont-assume](.agents/skills/test-dont-assume/SKILL.md) 技能。门禁 `npm run verify:agents` 校验根文件预算、笔记格式与链接。
