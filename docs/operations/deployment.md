# Deployment

## Build artifact
In production mode (`NODE_ENV=production`), `next build` produces a fully static site in `out/` (`output: "export"` in `next.config.mjs`). This is what gets shipped — there is no Node server running in production.

## Docker image
`Dockerfile` builds an **nginx:1.27-alpine** image:
- The static `out/` directory is copied to `/usr/share/nginx/html/atom-ltm-dashboard`.
- The container runs as uid 101 (non-root).
- The image `EXPOSE`s port **8080**.

## Helm chart
`deployment/helm/` contains the chart:
- `Chart.yaml`, `values.yaml`, and templates for `deployment`, `service`, `istio`, and `service-account`.
- `service.port: 8080`.
- Liveness and readiness probes both hit `/health` (see [Monitoring](monitoring.md)).
- Default resource requests/limits: 64Mi/50m → 128Mi/200m.

Per-environment overrides live at the top level: `deployment/values-val.yaml` and `deployment/values-prod.yaml`.

## CI/CD pipeline (Jenkinsfile)
Parameters: `execDockerBuild`, `execDeploy`, `targetEnv` (`val` or `prod`). Stages:
1. Environment check.
2. `npm install`.
3. `next build`, with `BASE_HREF`, `NEXT_PUBLIC_BASE_HREF`, and the environment-specific `NEXT_PUBLIC_ATOM_API_BASE_URL` (gateway URL) injected as build-time variables.
4. Stash `out/`, the `Dockerfile`, and nginx configs.
5. Build and push the Docker image to Artifactory as `transversal/ltm-dashboard:{version}-{val|prod}` — the backend URL is baked into the image, so val and prod images must never share a tag.
6. `helm upgrade --install` into namespace `7dae-atom-{val|prod}`, using `deployment/values-{env}.yaml`.

Because `NEXT_PUBLIC_*` variables are baked in at build time, changing the backend URL or environment label for a given deployment requires a rebuild — there's no runtime config override.
