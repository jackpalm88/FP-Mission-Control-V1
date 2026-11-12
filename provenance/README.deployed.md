# D8MA FP Mission Control MVP

Private Sites app with per-user Cloudflare D1 persistence. Mission Dashboard is the default; Fractal Graph is the Advanced / Operator View.

## Implemented
- Create missions, generate deterministic five-task dependency plans.
- Server-side readiness, five-minute reservations, human approval gate and permissions.
- Server MockAdapter success/failure scenarios; receipt-bound EXECUTED and mock-contract VERIFIED transitions.
- Task details, immutable receipt identity/results with appended verification, event history and JSON export.
- Revision compare-and-swap rejects concurrent stale writes.

## Boundaries
This is a standalone backend-backed MVP. It does not connect to the existing FP production backend, real agent runtimes or LLM providers. Named AI roles are assignment labels. Plan generation uses a fixed template. MockAdapter executes only deterministic isolated server logic. VERIFIED applies only to the mock receipt contract; it never establishes production readiness. Real execution is rejected server-side.

## Next integration
Replace deterministic planning and mock execution behind the existing action boundary with a versioned authenticated FP backend adapter. Preserve receipt/task/mission identity binding, permission checks, approval semantics, idempotency and revision validation. Implement actual worker reservations/heartbeats and result evidence verification before enabling production execution.

## Development
Use the supplied Sites build/dev helpers. Schema is in db/schema.ts; migrations in drizzle/. Auth uses Sites-injected user identity. API: GET/POST /api/workspace. Never accept browser-provided execution receipts.
