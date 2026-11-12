# Proposed deployment topology — NOT IMPLEMENTED

These templates are planning material only. They do not make the original Worker app deployable on Node. `fp-mission-control:ported` is a future image that must be implemented/tested, and `/healthz` is a future route. DATABASE_PATH, PUBLIC_ORIGIN and SESSION_SECRET_FILE are future adapter settings; the current application does not consume them.

After the port: create a non-root multi-stage Node image, use SQLite with WAL and tested backups or a PostgreSQL driver, implement secure auth and health checks, copy the Compose/Caddy templates into a separate deployment repository, supply an actual DNS hostname and secret file, and validate privately. Do not run this Compose template against production now. Only the proxy should publish ports. Session, issuer and CSRF settings depend on the chosen auth implementation and must not be guessed.

The original `.openai/hosting.json` identifies the existing Site. The example manifest shows how identity differs from runtime/storage declarations; do not overwrite or republish the original Site as part of migration.
