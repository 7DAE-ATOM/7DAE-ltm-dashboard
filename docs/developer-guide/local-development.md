# Local Development

## Day-to-day workflow
```bash
npm run dev     # dev server on http://localhost:3002
npm run lint     # eslint .
```
There is no dedicated test script in this project.

## Stale `.next/` chunks after a refactor
When a refactor deletes routes or pages, `.next/` can hold on to stale build chunks, causing `dev`/`build` to throw `Cannot find module './<hash>.js'`. Fix by clearing the cache before rebuilding:
```bash
rm -rf .next
```

## Dev vs. production build modes
`next.config.mjs` only sets `output: "export"` when `NODE_ENV=production`. In dev (`npm run dev`) the app runs as a normal server-rendered Next.js app; in a production build (`npm run build`) it becomes a fully static export in `out/`. Keep this in mind when testing something that behaves differently under static export (e.g. avoid introducing dynamic route segments that aren't pre-generated).

`trailingSlash: true` is set project-wide — required behind the AFTER API gateway to avoid a redirect bug on the backend port. Don't remove it without checking that constraint still applies.

## Testing a production build locally
```bash
npm run build
npm start
```
`npm start` serves the static `out/` directory via `serve` on port 3002 — the closest local approximation of what the deployed nginx image serves.

## Backend dependency
The app has no mock data layer: everything renders from a live `atom-synchronizer-dev` instance. Point `NEXT_PUBLIC_ATOM_API_BASE_URL` at a reachable backend before expecting real content — see [Configuration](../user-guide/configuration.md) and [API](api.md).
