# Agent Note: verify-agents 机械门禁与 CI 接线

Status: implemented

## Problem

.agents 体系的四类机械不变量——根 AGENTS.md 字符预算、笔记格式、全树链接可达、归档冻结——此前只靠评审把关：归档回改无法被机械发现，预算条款无校验，断链静默累积。且仓库没有 CI，人工复核连固定的触发时机都没有。

## Alternatives considered

- **搬运上游全套 verify 工具链**（agent-note-tree.ts、双语 sidecar、独立归档校验脚本）：语料规模小，笔记 README 对比表已否决过全套搬运。
- **维持纯人工把关**：预算与归档冻结恰是人工最不可靠的两类，且改动者在提交当下缺乏机械反馈。

## Decision

单脚本 `scripts/verify-agents.mjs`（`npm run verify:agents`，与 mcp-abap-adt 同源同内容）覆盖四类不变量；归档由 `.archive-manifest.json`（SHA-256，append-only，`--write` 仅新增、拒绝覆盖已封存哈希）机械封存，清单随归档一并提交。已用沙盒破坏性用例验证：断链、缺预算条款、超预算、Status 与目录不一致、篡改、删除、追加全部按预期拦截或放行。门禁接入新建的最小 CI（build + test + verify:agents，矩阵 ubuntu/windows × node 22/24）。隔离 checkout（含 CI）无法解析指向兄弟仓库的相对链接，故根文件不用 `../mcp-abap-adt` 相对链接。

## Consequences

- 归档操作新增一步 `npm run verify:agents -- --write`，清单只增不改，回改归档即门禁失败。
- AGENTS.md 预算余量收窄（约 1991/2000），增改根文件前先考虑搬家到笔记或 README。
- CI 中 `npm test` 以空 `setenv.js` 运行，只覆盖 mock 套件；集成套件仍需本地真实系统（仓库无 lockfile，CI 用 `npm install`）。
- 门禁同时拒绝逃出仓库根的相对链接：兄弟仓库在本机"假可达"，隔离 checkout（CI）必死链——该形态已在 mcp 仓库实际拦下过（test-dont-assume 技能的 `../../../../abap-adt-api`）；跨仓库引用一律用绝对 GitHub URL。
