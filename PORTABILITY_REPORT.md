# FP Mission Control — source and portability audit

Date: 2026-11-11. Scope: read-only source/metadata inspection, export and migration assessment. No production changes, credentials, provider calls, data export or FP V1 contract modifications.

## 1. Verdict and provenance

**Source export: PASS. Independent production deployment: BLOCKED pending port. Authenticated browser acceptance: NOT RE-TESTED in this audit.**

| Evidence | Observed result |
| --- | --- |
| Original checkout | `/workspace/sites/fp-mission-control`; clean tracked working tree at inspection |
| Git HEAD | `2c62f904ee540ea5462d2bd7fad23a6a4d2dc988` |
| Sites saved version 1 | Source metadata reports the exact same commit |
| Saved version ID | `appgprj_6af4c9c475288191a080d8f0218527a1~appgver_e95f7de4f62c8191a65f821fd72192bb` |
| Sites project | `appgprj_6af4c9c475288191a080d8f0218527a1` |
| Deployment ownership | Current caller role is owner; custom access contains owner only, no editors, other viewers, groups or external visitors |
| Live storage metadata | Binding `DB`, table `fp_workspaces`; no production rows read |
| Source repository | Original local Git repository is accessible. This checkout has NO configured remote. The read-only Site metadata does not expose its Git clone endpoint; no write credential was minted merely to discover it. This is not evidence of a GitHub repository. |

Original source bytes were exported from Git, preserving all tracked files, rather than copying screenshots or deployment bundles. Each original file is accounted for in `provenance/SOURCE_MANIFEST.json`. Root README is augmented for portability; its original is retained separately. No remote URL, access token or Git history is required to use the ZIP or initialize a user-owned Git repository.

## 2. Technology, code structure and dependencies

| Layer | Implementation / direct code evidence | Portability |
| --- | --- | --- |
| Browser UI | React 19.2.6, TypeScript; `app/page.tsx` is a client component using hooks and fetch | Preserve component, markup and CSS as visual baseline |
| Design | `app/globals.css`, dark D8MA palette, CSS responsive layouts, lucide-react icons; `public/favicon.svg` | No screenshot reconstruction or external image/font service required |
| Framework | Vinext 1.0.0-beta.5 and Vite 8.0.13; Next-style app router/shims; `next` 16.3.4 remains a declared dependency | This is NOT an ordinary Next Node standalone deployment; migration must verify framework support or port to Next Node/Vite SPA |
| Backend | `app/api/workspace/route.ts`: GET/POST handlers, request identity, D1 reads and compare-and-swap writes | Replace Worker-specific DB binding and auth trust boundary |
| Domain | `lib/engine.ts`: pure state transitions plus server clock/UUIDs | Reusable for bounded simulation; not FP V1 contract implementation |
| Worker entry | `worker/index.ts`: Vinext fetch handler and request-scoped connector wrapper | Requires Cloudflare runtime today |
| Storage | Cloudflare D1, SQL through `env.DB.prepare().bind().first()/run()` | Cannot be replaced by setting DATABASE_URL; adapter must be implemented |
| Schema tools | drizzle-orm 0.45.2, drizzle-kit 0.31.10; `db/index.ts` exists but API uses direct D1 SQL | Preserve schema/migrations; choose new driver deliberately |
| Styling/tooling | Tailwind 4.2.1 plus plain application CSS, TypeScript 5.9.3, Wrangler 4.92.0 | Keep dev dependencies for builds; production subset requires review |
| Starter extras | UI component catalog, examples, connectors and local preview worker | Mostly unused by application; retained for complete source, removable in a later scoped cleanup |

`DEPENDENCY_INVENTORY.json` enumerates all declared dependencies and locked package entries. The lockfile, not semver ranges alone, is the reproducibility baseline. No vulnerability or full license audit was performed. Existing MIT and other bundled notices are retained; repository-level ownership metadata does not establish licenses for every third-party dependency.

### Persistence model

`drizzle/0000_brown_rick_jones.sql` declares:

| Column | SQLite type | Constraint / meaning |
| --- | --- | --- |
| `owner` | TEXT | Primary key; Sites-scoped authenticated user ID |
| `revision` | INTEGER | NOT NULL; optimistic concurrency revision |
| `document` | TEXT | NOT NULL; JSON containing all missions, tasks, receipts and events for one owner |
| `updated_at` | TEXT | NOT NULL; ISO timestamp |

GET selects the caller's row. POST reads the revision, applies a server operation, then uses conditional UPDATE or INSERT OR IGNORE; a stale/conflicting write returns 409. SQL parameters are bound. Event history is capped at 100 entries; missions and receipt lists have no application cap. It is a document-per-user MVP, not a normalized durable execution ledger. Source does not declare backups, restore workflows, quotas or retention policies. The actual region, encryption configuration, platform administrator access and backup guarantees were not established by these read-only responses.

### Authentication and sensitive-data handling

- The hosted private gate is provided by Sites. API routes require `oai-authenticated-user-id` and scope all DB access to that value. The frontend owner profile is hardcoded display text.
- `/signin-with-chatgpt`, signout and callback are platform routes, not standalone OAuth handlers in this application. `app/chatgpt-auth.ts` is a helper; the workspace API reads the header directly.
- **Critical migration blocker:** putting this Worker/API behind a normal public reverse proxy without replacing authentication would allow header impersonation wherever client-supplied identity headers reach the app. A public VPS must authenticate sessions itself or use a trusted auth gateway that strips and securely sets identity, with no direct app ingress.
- Development mock authentication is only in the Vite plugin, limited to loopback, and absent from the production build. It is not suitable for a public server.
- POST rejects a mismatching Origin when supplied, but does not require it. Replace this with explicit cookie/session and CSRF protections for the target deployment; do not treat an optional Origin check as a complete standalone security boundary.
- No API-key entry/storage UI or provider-key integration is implemented. Goal text and simulation arguments/results are stored in the workspace document. JSON export includes the current workspace's contents. Do not enter secrets into mission text merely because no key field exists.
- The app lacks explicit request-size limits, API rate limits and robust action-schema validation; the single document can grow without bound. Add these before broad external use.

### Environment and external infrastructure

| Name / dependency | Current role |
| --- | --- |
| `DB` | Cloudflare D1 binding, not an environment URL/string |
| `BUCKET` / R2 | Type support exists, but R2 is null in hosting manifest and unused by this app |
| `CONNECTORS` | Starter Worker/context support; no workspace feature calls connected apps |
| Sites identity headers and gate | Required hosted authentication; must be replaced off Sites |
| `.openai/hosting.json` | Original Site identity and D1/R2 declarations; do not use for accidental publication |
| `SITES_RUNTIME_ROOT`, Wrangler/Miniflare paths, metrics flags | Local tooling defaults in `scripts/tool-environment.mjs` |
| `.sites-runtime/execution-profile.json` | Ignored local selection; absent in export means portable profile |
| npm registry / native workerd packages | Needed for dependency installation and local emulator tooling |
| LLM providers, OpenCB, FP V1, external receipt issuer | Not configured or called |

No product secret environment variable is required by current application code. Live hosted environment variable values were deliberately not requested. Future `DATABASE_URL`, `PUBLIC_ORIGIN`, `SESSION_SECRET` and proxy domain in the migration examples are proposed target settings, not variables already consumed by this app.

## 3. Capability map and semantic limits

| Capability | Label | Verified boundary |
| --- | --- | --- |
| Dashboard, task drawer, workstream graph, settings/activity/evidence navigation | FUNCTIONAL IN MVP | React UI; graph is grouped mission/workstream/task presentation, not a recursive FP planner |
| Mission creation and per-user workspace persistence | FUNCTIONAL IN MVP | Server API plus D1; authenticated full-session browser acceptance not retested here |
| Revision conflict rejection | FUNCTIONAL IN MVP | SQL compare-and-swap in API; no distributed execution scheduler |
| Dependency gating, approval flag, readiness check and 5-minute reservation | FUNCTIONAL IN MVP | Server-enforced local MVP state rules; reservation is stored in the document and checked at simulate time, not an external worker lease/heartbeat system |
| JSON workspace export and event display | FUNCTIONAL IN MVP | Source includes browser download; not a source-code export feature |
| Five-task plan generation | MOCK / DEMONSTRATION ONLY | Fixed titles and serial dependencies regardless of goal; goal is stored/echoed, no semantic planning or VS-1 invocation |
| Planner/Architect/Verifier AI assignments | MOCK / DEMONSTRATION ONLY | Labels only; no agent sessions, registry or orchestration |
| MockAdapter execution, error scenario and receipt | MOCK / DEMONSTRATION ONLY | Synchronous local logic, deliberately selected success/error; no external side effects |
| `PLANNED → EXECUTED → VERIFIED` | MOCK / DEMONSTRATION ONLY | Successful mock receipt enables EXECUTED; verification checks IDs/status/reference only and appends mock verification |
| `mock://results/...` evidence reference | MOCK / DEMONSTRATION ONLY | Logical identifier with inline result; not a separately retrievable artifact store or signed evidence package |
| Permissions/autonomy panel | MOCK / DEMONSTRATION ONLY | Fixed `mock:execute` scope and rejection of non-simulation mode; no general RBAC/policy evaluator or budgets |
| Human handoff decision | FUNCTIONAL IN MVP | Owner can set approval only after dependencies; does not authorize production execution or confer multi-user governance |
| FP V1 planning, materialized graph and authoritative plan IDs | REQUIRES FP V1 INTEGRATION | No FP client or mapping contract exists |
| VS-2A/runtime integration, real worker/provider calls | REQUIRES FP V1 INTEGRATION | Disconnected and explicitly rejected |
| Real receipt issuer, evidence retrieval and independent validation | REQUIRES FP V1 INTEGRATION | Not implemented |
| Authoritative runtime permissions, approvals and reservations | REQUIRES FP V1 INTEGRATION | Must come from responsible runtime/governance service; UI local booleans are insufficient |

Semantic caveats for integration: the readiness helper may still describe an expired reservation as READY; simulate enforces expiry. The release action lacks lifecycle/lease-owner checks, although owner-scoped workspace access limits current exposure. Approval is a boolean plus event rather than a signed policy decision. Receipts are JSON in a mutable document, without cryptographic issuer attestation; verification mutates their verification field. Duplicate simulation after success is phase-blocked, but transport retries have no explicit idempotency key. A VERIFIED task alone does not prove task output satisfies acceptance criteria. These rules must not become accidental substitutes for frozen FP/runtime contracts.

## 4. Verification performed and limits

- Read current source and compared clean Git HEAD with native saved Site version source SHA: matched.
- Inspected current Site ownership/access metadata and D1 table names; no production records or secrets read.
- Re-ran `node tests/engine.mjs`: PASS for dependency/approval/readiness gates, wrong execution mode, failed simulation/retry, missing successful receipt and phase-based duplicate rejection.
- Re-ran TypeScript checking on original source: see `provenance/VERIFICATION.md` for result.
- Ran a clean-export portable-profile build using the existing locked installed dependencies via a temporary symlink; see verification record. This is not a fresh npm install or a VPS deployment test.
- Original application source hashes were compared against exported copies. Credentials-pattern scan and archive exclusion checks were run.
- No authenticated browser workflow, new-session persistence, production API mutations, production DB row access, Docker deployment or FP V1 integration test was performed in this audit. Prior deployment/browser observations do not replace those tests.

## 5. Independent-deployment blockers

| Priority | Blocker | Required resolution |
| --- | --- | --- |
| P0 | Worker-only runtime and `cloudflare:workers` imports | Port server execution to Node-supported framework/runtime, or explicitly design/support another runtime; ordinary `node dist/server/index.js` is not a deployment plan |
| P0 | D1 binding and driver | Implement local SQLite/PostgreSQL repository adapter with transactions/CAS, migrations, backups and restore validation |
| P0 | Sites-only authentication | Add real session/OIDC authentication, server-side owner resolution and header trust protection before any public exposure |
| P1 | No standalone production Docker image/entrypoint | Build and validate an immutable image, health checks, persistent storage, graceful restart and rollback |
| P1 | Public-service hardening | Request validation/size limits, CSRF, secure cookies, rate limits, bounded state, actionable logging and error handling |
| P1 | Production data migration | Separately authorize a snapshot/export; preserve owner mapping and provenance. No data is in this ZIP |
| P1 | FP V1 and runtime integration absent | Implement adapters against verified contracts; do not convert mock VERIFIED into real evidence |
| P2 | Full acceptance evidence missing | Run isolated authenticated E2E, reload/new-session, expiry, concurrency, duplicate/retry and failure tests |

## 6. Recommended migration sequence — Ubuntu on Contabo

1. **Preserve baseline:** unpack ZIP into a user-owned Git repository, commit the source and audit documents; keep original Site unchanged. Tag source commit/provenance and keep visual snapshots locally for comparison. Do not push the original `.openai` project identity through a deploy workflow.
2. **Port a simulation-only application first:** retain `app/page.tsx`/CSS and API response shapes; introduce repository and identity interfaces. Recommended target for a small owner-operated instance is Node 24 + a supported Next Node server + SQLite on a persistent volume. PostgreSQL is preferable once concurrent agent writes and normalized ledgers are required. Framework/driver upgrades need their own compatibility tests; no version upgrade was made here.
3. **Replace infrastructure dependencies:** replace direct D1 SQL access with the chosen DB driver and transactions, remove Worker/connector/Sites wrappers from the target runtime, and implement real session authentication. Keep portable development auth restricted to local environments. Add import/export with explicit owner mapping only when data migration is authorized.
4. **Prove behavior and preserve UI:** use the current CSS/component as the design baseline. Verify API isolation, CAS conflicts, reservations/expiry, approval guards, failed/retried simulation, receipt binding, page reload and a new authenticated session. Capture before/after UI comparisons and prove no accidental provider calls.
5. **Prepare isolated deployment artifacts:** multi-stage Docker image with lockfile install/build, non-root runtime; Compose with app + Caddy, internal app network, persistent database and Caddy certificate volumes. Only Caddy publishes 80/443. Keep secrets outside image/source with restricted permissions. Configure DNS, firewall, security updates, backup jobs and tested restore. The examples in `migration/` describe this future topology, not a working port.
6. **Stage, then ask for production approval:** test on an isolated staging hostname with synthetic data. Validate HTTPS, sessions, restart/backup/restore, image rollback and logs. Production DNS, real data transfer and deployment require separate explicit authorization.
7. **Integrate FP after the simulation baseline is stable:** use explicit capability adapters and preserve original backend ownership. Import canonical IDs/revisions and authoritative snapshots; do not mirror mutable plan/execution logic into the UI database. Keep simulation and real views/evidence separate and source-labeled.

### Avoiding a second source of truth

| Domain | Intended authority after integration | Mission Control responsibility |
| --- | --- | --- |
| Plan tree, versions, materialization and planning history | Existing FP V1 backend, according to its frozen contracts | Render canonical IDs/revisions; submit commands; refresh authoritative snapshot |
| Execution queue, reservations, provider calls and execution state | Execution runtime | Display runtime state and command receipts; never infer execution from UI action completion |
| Authorization, autonomy, human approvals and budgets | Runtime/governance authority responsible for managed execution | Present policy requirements and send explicit decisions; no client-side grants |
| Execution receipts and evidence verification | Receipt issuer/runtime and designated verifier | Display issuer/source/scope and evidence links; distinguish mock from real |
| Knowledge/evidence persistence | OpenCB where authorized by the existing architecture | Query/project evidence; do not assign scheduling/enforcement duties to the kernel |
| UI preferences and caches | Mission Control | Store layout/preferences and disposable revision-tagged projections only |

FP's planning boundary must remain respected; showing execution in Mission Control does not imply FP V1 itself owns execution. The mapping above is a migration recommendation, not a claim that this audit inspected or changed FP V1 code.

## 7. Next three highest-value improvements

1. Complete isolated authenticated end-to-end acceptance with persistence and failure evidence before treating this as a validated product candidate.
2. Introduce and test storage/identity boundaries for the independent Node port while preserving the Dashboard unchanged; close header impersonation risk before any public VPS service.
3. Write the UI-to-FP/runtime integration contract around canonical IDs/revisions, command idempotency and receipt provenance; retain explicit `MOCK_CONTRACT_ONLY` semantics until real authorities are connected.

**Stop condition met:** source and assessment only. No application feature development, no infrastructure deployment, no new Site version, no secret configuration and no FP V1 modifications.
