# Export verification — 2026-11-11

- Source working tree clean before export; HEAD matches Site version 1 source SHA.
- `node tests/engine.mjs`: PASS, exit 0.
- `node node_modules/typescript/bin/tsc --noEmit`: PASS, exit 0.
- Clean-export portable-profile `npm run build`: PASS, exit 0, all five Vinext stages complete. Existing locked node_modules reused with a temporary symlink; no fresh dependency installation claimed. Symlink/build outputs excluded from ZIP.
- Vinext reports `/api/workspace` as an API route and `/` as statically unclassified; build succeeds. This is a framework analysis warning, not a passed SSR acceptance test.
- Every original tracked source file hash matches its export location in SOURCE_MANIFEST.json.
- Production database rows, secrets, provider keys and deployment runtime files were not exported.
- No authenticated browser session, independent VPS image, restore test or real FP integration verified during this export.
