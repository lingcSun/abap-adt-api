# Agent Note: 移除 sprintf-js 依赖（GHSA-hp3w-g68c-fv3c）

Status: implemented

## Problem

mcp-abap-adt 的 verify-package 门禁（`npm audit --omit=dev`）报 3 个 moderate：sprintf-js 全版本存在 DoS 漏洞（无限精度说明符，GHSA-hp3w-g68c-fv3c），上游无修复版本，audit 显示 "No fix available"。依赖链 @lingc-sun/mcp-abap-adt → @lingc-sun/abap-adt-api → sprintf-js 令门禁必然失败。

本库对 sprintf 的使用仅在 objectcreator.ts 两处：把 parentName 代入 creationPath 模板。模板是源码内写死的静态字符串，至多含一个 `%s`（仅 FUGR/FF、FUGR/I 两个类型用到），精度/填充等说明符从未使用——漏洞在本库实际不可达，但 audit 只认依赖存在与否，唯一修复方式是移除。

## Alternatives considered

- **npm overrides 指向安全版本**：不存在修复版，没有可指目标。
- **fork 一份 sprintf-js 只留 %s 替换**：为单说明符替换维护整包 fork，成本不成比例。
- **保留依赖并在门禁里白名单**：verify-package 的语义是"生产依赖零已知漏洞"，白名单掏空门禁。

## Decision

objectcreator.ts 内用本地 `formatCreationPath(path, parent) = path.replace("%s", parent)` 替换两处 sprintf 调用，移除 sprintf-js 与 @types/sprintf-js。等价性论证：模板至多一个 `%s`，`replace` 只替换首个出现且无匹配时原样返回，与原调用一致；`encodeURIComponent` 输出必不含 `$`（`$` 编码为 `%24`），故替换串的 `$&`/`$1` 特殊模式不可能触发。新增纯单元测试锁定 FUGR/FF 与 FUGR/I 的生成路径（此前该路径仅有需真实 SAP 系统的集成覆盖）。以 8.4.5 发布。

## Consequences

- 生产依赖树零 sprintf-js，下游 mcp-abap-adt 的 audit 门禁可通过；dev 树中 jest 工具链（@istanbuljs/load-nyc-config）仍传递依赖 sprintf-js@1.0.3，`--omit=dev` 不受影响，若将来要求 dev 树同样干净需更换测试工具链。
- 若未来 creationPath 模板需要多参数或更复杂格式，须重新评估格式化方案（选择无漏洞的实现，而非回退 sprintf-js）。
- 上游若自行处理，本补丁是纯减法，无合并冲突，可正常对冲。
