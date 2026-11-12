# FP Mission Control — source export and local startup

Exported on 2026-11-11 from the original source, not reconstructed from screenshots.

**Source:** deployed Site version 1, commit `2c62f904ee540ea5462d2bd7fad23a6a4d2dc988`.
**Site:** https://d8ma-fp-mission-control.sunnyplatypus5.chatgpt.site

The export preserves the Mission Dashboard, Advanced / Operator View, backend route, domain engine, tests, assets, locked dependencies, SQL migration and build tooling. The original deployed README is preserved under `provenance/README.deployed.md`. Export documentation and migration examples are additions; application code is unchanged.

## What this application is

A React/Vinext application deployed as a Cloudflare Worker. It stores per-user workspace documents in D1. Its planning is a fixed five-task template. Its server MockAdapter generates deterministic simulated results and receipts. It is not connected to FP V1, real AI agents, provider APIs or a production receipt issuer.

`VERIFIED` means `MOCK_CONTRACT_ONLY`: matching task/mission identity, successful receipt and a result reference. It is not independent execution verification or proof that a task's business goal was completed.

## Prerequisites

- Node.js 24 LTS is recommended for the existing `.ts` domain tests. Package engine minimum is Node 22.13, but the tests import TypeScript directly and were checked using Node 24.22.1.
- npm (the repository includes `package-lock.json`).
- A supported OS/CPU for Cloudflare's workerd/Miniflare native dependencies; Ubuntu x86_64 is the intended migration development host.
- Internet access to install the locked npm packages. Local development requires no production credentials or Cloudflare account.

## Local startup — original Cloudflare emulator, development only

Unzip the archive, open the project directory, then run:

```bash
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_brown_rick_jones.sql
npm run dev
```

On a clean export the execution profile defaults to `portable` and the dev server requests port 5173. Use the URL actually printed by the server if that port is occupied.

Visit this URL on the SAME computer running the dev server:

```text
http://localhost:5173/signin-with-chatgpt?return_to=/
```

This is the starter's **loopback-only development sign-in simulation**, not real ChatGPT authentication. It signs in as a fixed local development user. The middleware strips incoming `oai-authenticated-user-*` headers and supplies the test identity only after the development cookie is set. Production identity still belongs to Sites dispatch. The UI's visible Ritvars name is currently static presentation text, not an identity assertion.

Do not expose this dev server or the Wrangler emulator directly on a public VPS. Local mock sign-in intentionally rejects non-loopback hosts/clients. Do not work around that by forwarding arbitrary identity headers.

The SQL command creates a NEW local empty database only. Do not reapply the initial SQL to an already initialized database. Local persistent data resides below `.wrangler/state`; none is included in this archive. There is no production data snapshot.

### Local verification

```bash
node tests/engine.mjs
npx tsc --noEmit
npm run build
```

There is no `npm test` script. `npm run lint` exists but was not run as part of this export. No browser acceptance suite is shipped. Build and domain tests do not establish full authenticated end-to-end acceptance.

### Other commands

| Command | Meaning |
| --- | --- |
| `npm run dev` | Vinext/Vite development server; portable profile uses local mock sign-in |
| `npm run build` | Builds Worker server and browser assets |
| `npm start` | Wrangler local preview of built Worker, loopback only; NOT a standalone Node production server and NOT a login emulator |
| `npm run db:generate` | Generate schema SQL after intentional schema changes; do not regenerate merely to initialize |
| `npm run install:ci` | Original environment-aware locked installer; ordinary local setup can use `npm ci` |

Production build output is under `dist/server` and `dist/client`. `.openai/hosting.json` retains the original project's non-secret identity for provenance. **Do not run Sites publication helpers against that project ID.** The export itself does not deploy anything.

## Package contents and integrity

- `app/`: UI, CSS, metadata, auth helper and `/api/workspace` route.
- `lib/engine.ts`: mission planning, readiness, reservation and simulation transition engine.
- `db/`, `drizzle/`: schema definition and versioned SQL migration.
- `worker/`, `vite.config.ts`, `.openai/`: Worker/Sites build and binding configuration.
- `public/`, `vendor/`: tracked assets, CSS and bundled notices.
- `components/`, `hooks/`, `examples/`, connector helpers: complete original starter source, much of it unused by this MVP.
- `tests/engine.mjs`: domain transition assertions.
- `PORTABILITY_REPORT.md`: findings, blockers, capability map and migration sequence.
- `migration/`: illustrative future Compose/Caddy/environment templates; not implemented deployment tooling.
- `provenance/SOURCE_MANIFEST.json`: every original tracked file and its SHA-256, plus its archive location.
- `DEPENDENCY_INVENTORY.json`: declared and lockfile dependency inventory. Preserving source does not transfer third-party package rights; retain bundled licenses and review dependency licenses before redistribution.

Excluded: `.git`, dependencies, builds, logs, `.sites-runtime`, `.wrangler`, local database files, caches, live records, credentials and tokens. Installed dependencies are reproducible from the lockfile. A credential-pattern scan is supplementary, not a legal or formal security certification.

## Independent production deployment

The exported app is **not ready to run as a secure standalone Contabo production service**. Docker alone cannot replace D1, Worker bindings or Sites authentication. See `PORTABILITY_REPORT.md` before choosing or implementing the port. The migration examples are intentionally non-runnable until the runtime/storage/auth port is completed and tested.
