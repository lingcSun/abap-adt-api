# Agent Note: Fork 维护政策——跟上游、少而聚焦的补丁、版本对齐

Status: implemented

## Problem

本仓库是 marcellourbani/abap-adt-api 的 fork，以 `@lingc-sun/abap-adt-api` 发布。下游 mcp-abap-adt 需要若干上游未合入的修复（会话过期自动重登、dumps feed 修复等）；只等上游 PR 意味着 MCP 侧被外部阻塞，硬分叉则随上游演进而失血。

## Decision

- **合并跟踪**：定期 merge 上游（如 262d12e "merge upstream 8.4.3"），保持历史同源；冲突面集中在 fork 改过的文件。
- **fork 补丁少而聚焦**：每个 fork 提交只修一个行为缺陷，并把根因写全（见 850e99e、c0169bd 的提交说明），便于上游合入后对冲。
- **版本对齐**：版本号跟随上游 tag（8.4.x），发布为 scoped 包名；下游依赖范围因此始终可读——"上游 8.4.3 + fork 补丁"。
- **发布身份统一**：包元数据指向 fork 仓库（262d12e 恢复 scoped 发布名）；下游 mcp-abap-adt 的 server.json 与 README 同步。

## Alternatives considered

- **硬分叉不再合并**：上游持续演进（传输 API、调试器步骤、inactive 对象类型……），失血速度远超维护合并的成本。
- **只向上游提 PR、fork 不带补丁**：上游响应周期不可控，MCP 侧缺陷修复被外部阻塞。
- **把库 vendor 进 mcp-abap-adt**：失去独立库消费方与独立测试面，上游合并更难做。

## Consequences

- 每次 merge 上游后必须重验 fork 补丁仍然生效——补丁小而聚焦正是为了让这件事可做。
- "上游已修复同一问题"的对冲成为常规动作；版本对齐让对冲点可定位。
- 下游锁定本 scoped 包；换回上游包之前必须确认补丁全部上游化。
