# abap-adt-api — Agent Instructions

TypeScript client library for SAP's ABAP Developer Tools (ADT) REST API. Fork of [marcellourbani/abap-adt-api](https://github.com/marcellourbani/abap-adt-api), published as `@lingc-sun/abap-adt-api`; upstream consumer [vscode_abap_remote_fs](https://github.com/marcellourbani/vscode_abap_remote_fs), fork consumer [mcp-abap-adt](../mcp-abap-adt).

## Commands

```bash
npm run build    # tsc → build/
npm run watch    # tsc -w (watch mode)
npm test         # jest (all tests; integration tests skip if ADT_URL unset)
```

No linter config — TypeScript strict mode (`strict: true`) is the code quality gate.

## Architecture

```txt
src/
  index.ts          # Re-exports everything public
  AdtClient.ts      # Thin delegating client (~120 methods)
  AdtHTTP.ts        # HTTP transport: CSRF, OAuth, sessions
  AdtException.ts   # Exception types + type guards
  utilities.ts      # XML helpers, type guards
  api/              # One module per domain (activate, debugger, atc, …)
  test/             # Integration + unit tests
```

**Adding a new API endpoint**: create `src/api/<domain>.ts` with functions taking `AdtHTTP` as first argument, add delegation methods to `AdtClient.ts`, and re-export types from `src/index.ts`.

## Key Conventions

### API function signature

All `src/api/` functions follow:

```typescript
export async function doThing(h: AdtHTTP, param: Type, ...): Promise<Result>
```

`AdtClient` methods simply delegate: `doThing(this.h, ...)`.

### XML parsing

most SAP ADT responses are XML. `fast-xml-parser` maps them to objects with these rules:

- Namespace prefix preserved: `<adtcore:uri>` → key `"adtcore:uri"` (or stripped with `stripNs()`)
- Attributes prefixed with `@_`: `<foo bar="x">` → `{ "@_bar": "x" }`
- Use `xmlArray()` for repeated elements (handles both single-object and array cases)
- Use `xmlNode()` to navigate paths safely

### Runtime validation

Use `io-ts` codecs (`t.type`, `t.union`, etc.) when validating external API responses.

### Type guards / error handling

Use `isAdtError()`, `isHttpError()`, `isLoginError()` for error discrimination. Throw `AdtErrorException` for typed errors.

### Naming

- Interfaces and types: PascalCase, no `I` prefix
- No enums — use `const` objects or union types

## Testing

Integration tests require a live SAP system. Copy `setenv_sample.js` → `setenv.js` and fill in credentials. Tests skip gracefully when `ADT_URL` is unset.

```javascript
// Minimum setenv.js
process.env.ADT_URL = "https://host:44300/"
process.env.ADT_USER = "developer"
process.env.ADT_PASS = "secret"
```

Tests use the `runTest(f)` helper from `src/test/login.ts` — it creates the client and calls `logout()` in a `finally` block.

Unit/mock tests use sample data in `testdata/src/` and don't need a SAP system.

Set `ADT_ENABLE_ALL=YES` to enable destructive tests (create/delete objects, release transports).

## Output

Compiled JS and `.d.ts` files go to `build/` (gitignored). Never edit files in `build/` directly.

## Fork Invariants

- **Fork 补丁少而聚焦**：一个提交只修一个行为缺陷，根因写全在提交信息里，便于上游合入后对冲（[rationale](.agents/notes/implemented/process/2026-09-18-fork-maintenance-policy.md)）。
- **版本号跟随上游 tag**（8.4.x）：依赖范围永远可读为"上游某版 + fork 补丁"；merge 上游后必须重验 fork 补丁仍然生效（[rationale](.agents/notes/implemented/process/2026-09-18-fork-maintenance-policy.md)）。

## Agent Notes

Fork 维护政策与决策记录在 [.agents/notes/](.agents/notes/AGENTS.md)。非平凡变更必须在同一提交新增或更新至少一篇 Agent Note（[规则](.agents/notes/README.md#何时必须写)）；每篇新笔记触发 supersession 检查。写服务端行为断言时用 [test-dont-assume](.agents/skills/test-dont-assume/SKILL.md) 技能。

