# Configuration

## Environment variables

All runtime-relevant variables are `NEXT_PUBLIC_*`, meaning they are inlined into the client bundle at build time (via the `env` block in `next.config.mjs`). There is no server-side config to change after a build — a different value requires a rebuild.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_ATOM_API_BASE_URL` | Base URL of the `atom-synchronizer-dev` backend. Defaults to `http://localhost:8080/atom-synchronizer-dev` if unset. Every data fetch (`lib/atom-api.ts`) is relative to this. |
| `NEXT_PUBLIC_BASE_HREF` | Path prefix the app is served under (behind the AFTER gateway). Used for the logo path and in the About dialog. |
| `NEXT_PUBLIC_APP_VERSION` | Version string shown in the About dialog, from `package.json`. |
| `NEXT_PUBLIC_GIT_COMMIT` / `NEXT_PUBLIC_GIT_BRANCH` | Build provenance, shown in the About dialog. |
| `NEXT_PUBLIC_BUILD_TIME` | Build timestamp, shown in the About dialog. |
| `NEXT_PUBLIC_APP_ENV` | Target environment label (e.g. val/prod), shown in the About dialog. |
| `NEXT_PUBLIC_DEV_JWT` | Dev-only flag surfaced in the About dialog to indicate a local/dev auth mode. |

Build-only variables (read by `next.config.mjs`, not exposed to the client beyond the `NEXT_PUBLIC_*` ones above): `GIT_COMMIT`, `GIT_BRANCH` / `BRANCH_NAME`, `BASE_HREF`, `NODE_ENV`. These are set by the Jenkins pipeline — see [Deployment](../operations/deployment.md).

## Theme
The header includes a light/dark toggle. The choice is persisted in `localStorage` and applied before first paint (an inline anti-FOUC script in `app/layout.tsx`) to avoid a flash of the wrong theme; absent a stored preference, it falls back to the OS `prefers-color-scheme`.

## Ports
- **3002** — dev server (`npm run dev`) and local static preview (`npm start`).
- **8080** — the container port exposed by the production nginx image (see [Deployment](../operations/deployment.md)).
