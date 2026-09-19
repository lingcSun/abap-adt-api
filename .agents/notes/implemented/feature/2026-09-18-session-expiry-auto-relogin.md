# Agent Note: 会话过期 POST 自动重登与 CSRF 异常分类修复

Status: implemented

## Problem

对 S/4HANA 长时间使用（数小时）后，所有 POST 工具（lock、setObjectSource、runQuery、searchObject，甚至 login/dropSession）开始报 400，GET 仍正常；恢复只能手动重登或重启服务器。根因：SAP 对过期会话的 POST 回 400 "Session timed out" 或带 `x-csrf-token: Required` 的裸 403，但异常分类从未把它们归为 `AdtCsrfException`——`isCsrfException()` 存在，却没被 `fromError()`/`fromResponse()` 调用——`request()` 里的自动重登分支因此永远不触发。伴生缺陷：`login()` 没有返回语句，MCP 的 login 工具把 `undefined` 序列化后 `content[0].text` 缺失，客户端按 schema 无效拒绝一个实际已成功的登录。

## Decision

（850e99e，fork 补丁）

- **异常分类**：`fromError()` 与 `fromResponse()` 都把"403 加 `x-csrf-token: Required`"与"裸 400 且 body 不是 ADT 异常 XML"分类为 `AdtCsrfException`，且检查先于空 body 短路——过期 POST 的 body 接近为空，晚于短路就永远检查不到。
- **重登路径**：`request()` 捕获 `AdtCsrfException` 后置 `csrfToken = FETCH_CSRF_TOKEN`、重登、原请求重试一次；自动重登只覆盖非 stateful 路径（stateful 会话的中断恢复是 MCP 层职责，见下游决策）。
- **`login()` 返回响应**，调用方可序列化真实值。

## Alternatives considered

- **调用方（MCP 层）自行重试**：每个工具都要包一层重试样板，且看不到异常分类这一根因。
- **定时保活刷新会话**：keepalive 已存在，只能延缓而不能消除过期窗口。
- **只修 `login()` 返回值**：表面症状（login 工具报错）消失，真正的批量 POST 失效仍在。

## Consequences

- 过期会话在第一个失效 POST 上自愈（重登 + 单次重试），不再需要人工干预。
- 异常分类的完备性成为传输层的持续义务：新错误形态出现时先分类，再决定重登或上抛。
- 2026-09-19 修正：裸 400 启发式排除 ICM 错误页，见 [ICM 错误页不按会话过期分类](../bug-fix/2026-09-19-icm-400-not-session-expiry.md)。
- 该修复是 fork 补丁的范例：单一行为缺陷、根因写全、上游可直接合入；对冲条件见 [Fork 维护政策](../process/2026-09-18-fork-maintenance-policy.md)。
