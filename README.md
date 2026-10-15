[![npm](https://img.shields.io/npm/v/@lingc-sun/abap-adt-api?label=%40lingc-sun%2Fabap-adt-api)](https://www.npmjs.com/package/@lingc-sun/abap-adt-api)

# ADT - Abap Developer Tools client

This library simplifies access to the ADT REST interface.

Supports a good share of what Eclipse tools can do with a simple JS/TS interface.

Designed for general use, mostly used in [ABAP remote filesystem extension for visual studio code](https://github.com/marcellourbani/vscode_abap_remote_fs).

This is a fork of [marcellourbani/abap-adt-api](https://github.com/marcellourbani/abap-adt-api), published as [`@lingc-sun/abap-adt-api`](https://www.npmjs.com/package/@lingc-sun/abap-adt-api). Version numbers track the upstream tag they are based on (`8.4.x` = upstream `8.4` + fork patches), so the dependency range always reads as "some upstream version plus focused fixes". The fork exists mainly to serve [`mcp-abap-adt`](https://github.com/lingcSun/mcp-abap-adt), an MCP server exposing ABAP ADT development workflows to LLM clients.

## Installation

```sh
npm install @lingc-sun/abap-adt-api
```

If you don't need the fork patches, the unscoped upstream package `abap-adt-api` is the original.

## Sample usage

```typescript
// create a client object
import { ADTClient } from "@lingc-sun/abap-adt-api"
const client = new ADTClient(
  "https://vhcalnplci.bti.local:44300",
  "developer",
  "mypassword"
)

const nodes = await client.nodeContents("DEVC/K", "$TMP")
```

## Fork changes

Behavioral patches on top of upstream, kept small and focused so they can be upstreamed:

- Session-expiry `POST`s automatically re-login instead of failing; `login()` returns the login response.
- ICM error pages (HTML error bodies) are no longer misclassified as session expiry.
- `dumps` feed: query parameters fixed, XML entity expansion budgeted, defensive entry parsing.
- cloudFoundry suite no longer hard-crashes when `ADT_CP` is unset.

## Testing

`npm test` runs Jest. Unit/mock tests use sample data in `testdata/src/` and don't need a SAP system.

Integration tests require a live SAP system. Jest loads `setenv.js` (gitignored) at startup and aborts with a Validation Error when the file is missing, so copy `setenv_sample.js` → `setenv.js` and fill in credentials:

```javascript
// Minimum setenv.js
process.env.ADT_URL = "https://host:44300/"
process.env.ADT_USER = "developer"
process.env.ADT_PASS = "secret"
```

Tests skip gracefully while `ADT_URL` is unset. The shipped sample points at a placeholder host: copy it verbatim and the integration tests fail on connection errors — comment out its `ADT_URL` line to run only the mock tests. Tests use the `runTest(f)` helper from `src/test/login.ts` — it creates the client and calls `logout()` in a `finally` block. Set `ADT_ENABLE_ALL=YES` to enable destructive tests (create/delete objects, release transports).
