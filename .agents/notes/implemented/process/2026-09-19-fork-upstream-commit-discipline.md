# Agent Note: fork 与上游的 commit 分类纪律

Status: implemented

## Problem

本仓库是 marcellourbani/abap-adt-api 的 fork，每个 commit 天然混杂两类改动：对上游有普适价值的功能与修复，以及 fork 专属的 scoped 发布名、agent 语料与 CI 工作流。历史上靠临场甄别：`for-upstream` 分支虽已存在，但"哪些 commit 能进上游"没有成文判据，发上游 PR 时要手工考古，漏选、错选都无机械防线。下游 [mcp-abap-adt](https://github.com/lingcSun/mcp-abap-adt) 已因同类失察把 26 个 commit（含 fork 专属内容）整体推给上游（其 PR #9，废弃后重开为 #25），本仓库需要同一纪律防患。

## Alternatives considered

- **每个上游主题一条长期分支**：分支数量随主题增长，rebase 成本高；单一指针（`for-upstream`）表达"当前可上游全集"，零额外分支。
- **在 commit message 里自由描述、靠评审分类**：非机械约定必然漂移，无法机器筛选。
- **把判据只写进 fork-maintenance-policy 笔记**：该笔记记录的是维护策略（合并节奏、版本对齐、补丁聚焦），不覆盖逐 commit 的分类动作；根 AGENTS.md 需要一行常驻规则供每次提交时对照。

## Decision

- 每个 commit 创建时归入两类之一：
  - **可上游**：不含 scoped 发布名（`@lingc-sun`）、agent 语料（AGENTS.md、`.agents/`、verify-agents）与 fork 专属 CI，能并入上游库并通过上游的构建与测试。
  - **fork 专属**：其余一律单独 commit，沿用本仓库 `(fork)` scope 惯例，并加 `Fork-only: yes` 尾注——尾注使两个仓库共享同一机械过滤（`git log --grep "Fork-only: yes"`）。
- 分支排序固定：可上游 commit 在前、fork 专属在后；`for-upstream` 分支指向可上游段顶端，可上游 commit 落地时必须前移该指针；向上游发 PR 从它出发（上游推进后 rebase/重建）。
- 与下游 mcp-abap-adt 的纪律同源（其 AGENTS.md 同步记录）；两仓库判据按各自语境替换——本仓库的可上游判据是"能并入上游库"，下游是"能在公共依赖上编译"。
- 根 AGENTS.md 的 Fork Invariants 增加一条常驻规则（预算 2000 → 2300，理由见提交说明）。

## Consequences

- 向上游发 PR 成为机械操作：`for-upstream` 指针即 PR 内容，fork 专属改动不可能混入。
- `(fork)` scope 与 `Fork-only: yes` 尾注并存：scope 是本仓库既有阅读习惯，尾注提供跨仓库机械过滤。
- 代价：可上游改动不得顺手触碰 fork 专属文件（package.json 的发布名、CI 工作流），偶尔需要把一个自然改动拆成两个 commit。
- 新增流程义务：可上游 commit 落地时记得前移 `for-upstream`，否则指针过期、PR 内容缺最新修复。
