# LTM Dashboard

A Next.js 16 / React 19 dashboard visualizing Airbus **Lab Test Means** (LTM) — physical test benches, their locations, lifecycle state, and their dependencies on each other. It is a read-only client for the `atom-synchronizer-dev` backend API, built as a static site and deployed behind nginx.

## Screens
- **Catalogue** — paginated, filterable grid of every bench.
- **Map** — geographic view of benches across Airbus sites.
- **Bench detail** — photo gallery, lifecycle, access, and program info for a single bench.
- **Dependency Graph** — interactive node/edge graph of a bench's relations, with progressive exploration.
- **Dependency View** — circular view of relations across the current filtered set.

## Quick start
```bash
npm install
npm run dev   # http://localhost:3002
```
See [docs/user-guide/installation.md](docs/user-guide/installation.md) for prerequisites and production build steps.

## Documentation
- [Documentation index](docs/index.md)
- [User Guide](docs/user-guide/installation.md) — installation, configuration, usage.
- [Developer Guide](docs/developer-guide/architecture.md) — architecture, local development, API.
- [Operations](docs/operations/deployment.md) — deployment, monitoring.
- [Releases](docs/releases/v1.1.0.md) — v1.0.0, v1.1.0.
