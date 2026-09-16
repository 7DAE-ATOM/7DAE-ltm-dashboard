# Installation

## Prerequisites
- Node.js **>= 20.9.0** (see `engines.node` in `package.json`).
- Network access to an `atom-synchronizer-dev` backend instance, which is the sole data source for the dashboard.

## Install dependencies
```bash
npm install
```

## Run in development
```bash
npm run dev
```
This starts `next dev -p 3002` — a full Next.js dev server (hot reload, no static export) on **http://localhost:3002**.

By default the app expects the backend at `http://localhost:8080/atom-synchronizer-dev`. To point at a different backend, set `NEXT_PUBLIC_ATOM_API_BASE_URL` before starting the dev server — see [Configuration](configuration.md) for the full list of variables.

## Build for production
```bash
npm run build
```
When `NODE_ENV=production`, `next.config.mjs` switches `output` to `"export"`: the build produces a fully static site in `out/`, instead of the server-rendered output used in dev. This is what the Docker image and CI pipeline consume — see [Deployment](../operations/deployment.md).

## Serve a production build locally
```bash
npm start
```
Serves the static `out/` directory (via `serve`) on port 3002, so you can sanity-check the exported build before shipping it.

## Lint
```bash
npm run lint
```
Runs ESLint over the project. There is no dedicated test script.
