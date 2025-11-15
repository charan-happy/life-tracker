# DevOps for Life Tracker

This document covers CI/CD, environments, deployments, and key problems fixed while containerizing and wiring the app.

## CI (Continuous Integration)

Workflow: `.github/workflows/ci.yml`
- Triggers on PRs and pushes to main
- Node 20 with npm cache
- Steps:
  - Install root deps, build frontend with Vite
  - Install server deps and build API
  - Validate Docker Compose builds (ensures Dockerfiles are healthy)

Secrets needed (set in repo Settings → Secrets and variables → Actions):
- `GEMINI_API_KEY` (optional for build, required at runtime for AI features)

## CD (Docker image publish)

Workflow: `.github/workflows/docker-publish.yml`
- Builds and pushes two images to GHCR on tag pushes (vX.Y.Z) or on main pushes
- Images:
  - `ghcr.io/<owner>/<repo>/web`
  - `ghcr.io/<owner>/<repo>/server`
- Build args for frontend:
  - `GEMINI_API_KEY` (provided from repository Secrets)
  - `VITE_API_BASE_URL` (provided from repository Variables)

After images are published, you can deploy them to:
- A VM (docker compose pull; docker compose up -d)
- Kubernetes (K8s manifests/Helm charts not included here, but images are ready)
- Render/Railway/Fly.io/Google Cloud Run etc.

## Environments

- Local dev
  - `npm run dev` for frontend (Vite)
  - `cd server && npm run dev` for backend (Express)
- Docker (local)
  - `docker compose up --build`
  - Frontend: http://localhost:3000
  - API: http://localhost:4000
- Production
  - Use published images from GHCR
  - Provide environment variables:
    - Frontend build args: `GEMINI_API_KEY`, `VITE_API_BASE_URL`
    - Backend env: `DATABASE_URL`, `PORT` (default 4000)

## Monitoring & Health

- API healthcheck: `GET /api/health` → `{ ok: true }`
- Docker healthcheck configured for the server in `docker-compose.yml`
- Add basic logging shipping (e.g., Docker stdout to CloudWatch/Stackdriver) per platform

## Security & Secrets

- Never commit real secrets to the repository
- Put keys in `.env` locally and in GitHub Secrets for CI/CD
- The `.env` currently contains a real-looking API key and database URL; rotate them immediately
  - Generate a new Gemini API key
  - Rotate Neon credentials and invalidate old password
- Use Secrets in Actions and platform-specific secret managers in production

## Problems Faced & Fixes

1) React and TypeScript JSX errors in components
- Symptoms: `Property 'div' does not exist on type 'JSX.IntrinsicElements'` and `Type '() => JSX.Element' is not assignable to type 'FC<{}>'`
- Root cause: Inconsistent React versions (React 19 with React 18 types), TS server cache noise
- Fixes:
  - Standardized to React 18.3.x and matching `@types` versions
  - Added `vite-env.d.ts` for Vite env typing
  - Ensured `tsconfig.json` includes `vite-env.d.ts`
  - Verified `npm run build` works; the IDE red squiggles were false positives (resolved on reload)

2) Vite env typing `import.meta.env` error
- Symptom: `Property 'env' does not exist on type 'ImportMeta'`
- Fix: Added `vite-env.d.ts` and ensured it’s included by tsconfig; temporarily used `// @ts-ignore` until file was added

3) Frontend Docker build tried to compile backend
- Symptom: TypeScript error referencing `server/src/...` during frontend Docker build
- Fix: Updated root `.dockerignore` to exclude `server/` from the frontend build context

4) Server TypeScript config failing in Docker
- Symptom: `error TS5083: Cannot read file '/tsconfig.json'`
- Root cause: `server/tsconfig.json` extended the parent tsconfig that wasn’t in the image context
- Fix: Made `server/tsconfig.json` standalone (removed `extends`)

5) ES module resolution on Node 20 (`.js` extensions)
- Symptom: `ERR_MODULE_NOT_FOUND: Cannot find module '/app/dist/db'`
- Root cause: ESM requires explicit extension in import for compiled JS
- Fix: Updated `server/src/index.ts` import to `./db.js`

6) Rancher Desktop vs Docker Desktop socket
- Symptom: `Cannot connect to the Docker daemon at unix:///Users/.../.rd/docker.sock`
- Fixes:
  - Ensured Rancher Desktop running (moby engine)
  - Used `docker context use rancher-desktop` and/or DOCKER_HOST to point to `~/.rd/docker.sock`
  - Added guidance to `docker-start.sh` for Rancher restart

7) Network timeouts pulling base images
- Symptom: timeouts when pulling `node:20-alpine`
- Fix: Pulled the image explicitly (`docker pull node:20-alpine`), then re-ran compose

8) DB env var warnings
- Symptom: `DATABASE_URL not set` warnings
- Fix: Clarified that Cloud Sync is optional; app runs without DB; set `DATABASE_URL` in `.env` for Neon

## Suggested Next Steps

- Add linters and formatters (ESLint + Prettier) and enforce in CI
- Add unit tests (Vitest) for client utilities and minimal API e2e tests (supertest)
- Add Helm charts or K8s manifests if deploying to Kubernetes
- Add staged environments (dev/staging/prod) with per-env variables
- Enable Dependabot for dependency updates
- Add Sentry or similar for frontend error monitoring

---
If you want, I can add Helm manifests or a Render / Railway deployment config next.

## Extended Implementation Steps

Below are deeper DevOps expansions you can implement incrementally. Each section lists objective, tooling, and concrete commands / files to add.

### 1. Branching & Release Strategy
- Adopt: `main` (deployable), feature branches, `release/*` branches for staging hardening.
- Tag releases: `vX.Y.Z` (semantic version) triggers Docker publish workflow.
- Optional protection: enable required checks (CI build + code owners) before merge.

### 2. Quality Gates & Testing
- Add ESLint + Prettier: `.github/workflows/ci.yml` new job `lint`.
- Unit tests: Vitest for hooks/services. Example commands:
  ```bash
  npm install -D vitest @testing-library/react @testing-library/dom jsdom
  npm run test
  ```
- API tests: `supertest` in `server/tests`. Run separately in CI.

### 3. Infrastructure as Code (IaC)
- If deploying to cloud VMs: add Terraform module for:
  - Neon (skip – managed), compute instance, security groups.
  - S3 (optional for backups / assets).
- If using Kubernetes: create `k8s/` manifests or Helm chart:
  - `Deployment` for web & server
  - `Service` (ClusterIP) and optional `Ingress`
  - ConfigMap for non-secret env, Secret for keys.

### 4. Observability & Monitoring
- Logging: aggregate container stdout with platform collector (e.g., Loki + Promtail, or Cloud provider default).
- Metrics: integrate Prometheus compatible metrics (express: `prom-client`). Endpoint `/metrics`.
- Tracing: add OpenTelemetry SDK; export to OTLP collector or vendor (Grafana Tempo / Jaeger / Honeycomb).
- Frontend errors: add Sentry browser SDK.

### 5. Security Hardening
- Image scanning: enable `anchore/grype-action` or `aquasecurity/trivy-action` in CI.
- Dependency scanning: Dependabot + `npm audit` job (non-blocking) separate workflow.
- Secrets rotation checklist:
  - Gemini API key quarterly
  - Neon DB password on role changes / suspected leak
- Add HTTP security headers (server): `helmet` middleware.

### 6. Performance & Scaling
- Horizontal scale: run multiple server replicas behind a load balancer / K8s Deployment.
- DB connection pooling: Neon provides pooling endpoint; ensure `DATABASE_URL` uses pooler host for concurrency.
- CDN: serve built frontend behind a CDN (Cloudflare/Fastly) for static caching.
- Build profiling: `vite build --profile` and analyze chunk sizes.

### 7. Backup & Restore Strategy
- Data model is a single JSON row per user in `user_data`.
- Simple logical backup:
  ```bash
  pg_dump --column-inserts --table=user_data $DATABASE_URL > user_data_backup.sql
  ```
- Restore:
  ```bash
  psql $DATABASE_URL -f user_data_backup.sql
  ```
- Schedule: daily if critical, else weekly.

### 8. Disaster Recovery
- RPO: time between backups (e.g., 24h if daily).
- RTO: time to provision new Neon instance + restore (<30 min target).
- Document procedure in `docs/DR.md` (create later).

### 9. Incident Response Playbook (Draft)
1. Detect anomaly (error rate spike, failed health checks).
2. Check recent deployments (GitHub Actions runs).
3. Roll back by redeploying previous tag: `docker pull ghcr.io/<repo>/server:<prev_tag>`.
4. If DB corruption suspected: restore last good backup; notify users.
5. Postmortem template in `docs/POSTMORTEM.md` (future addition).

### 10. Cost Optimization
- Use Alpine Node images (already done).
- Auto-scale server only when traffic > threshold (via K8s HPA on CPU or custom metrics).
- Archive historical user_data rows older than X months (if model expands).

### 11. Supply Chain Integrity
- Pin base images: move to `node:20-alpine@sha256:<digest>` once stable.
- Enable GitHub Actions provenance (OIDC based deploy to cloud provider without long-lived secrets).
- Optionally sign images with `cosign`:
  ```bash
  cosign sign ghcr.io/<repo>/server:<tag>
  cosign verify ghcr.io/<repo>/server:<tag>
  ```

### 12. Promotion Workflow Example
1. Merge feature branch -> main (CI build passes).
2. Tag release `vX.Y.Z` -> Images published.
3. Deploy to staging: pull tagged images; run smoke tests.
4. Promote to production by reusing same tag (immutable artifact).
5. Record deployment in CHANGELOG.

### 13. Local Developer Experience Enhancements
- Add `make` targets: `make dev`, `make test`, `make docker-build`.
- Git pre-commit hook: run `eslint --fix` + `vitest --run` fast subset.

### 14. Secret Management Patterns
- Local: `.env` (ignored)
- CI: GitHub Actions Secrets
- Production: cloud secret manager (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault).
- Rotation script template in future `scripts/rotate-secrets.ts`.

### 15. Roadmap for Full Maturity
| Phase | Focus | Outcome |
|-------|-------|---------|
| 1 | CI + Docker + Basic Docs | Repeatable builds |
| 2 | Tests + Lint + Scan | Quality & security gates |
| 3 | Observability + Backups | Operability |
| 4 | IaC + Multi-env deploy | Scalable infra |
| 5 | DR + Incident playbooks | Resilience |
| 6 | Supply chain signing | Trust & integrity |

## Architecture Diagram

### High-Level Flow

```mermaid
flowchart LR
  subgraph Browser
    A[User] --> B[React/Vite Frontend]
  end
  B -->|REST /api/sync/*| S[Express Server]
  S -->|SQL (JSONB storage)| P[(Neon Postgres)]
  B -->|AI Prompt| G[(Gemini API)]
  subgraph CI/CD
    C1[GitHub Actions CI] --> C2[Build & Test]
    C2 --> C3[Docker Images]
    C3 --> R[GHCR Registry]
  end
  R -->|deploy pull| DEP[Runtime Env (VM/K8s)]
  DEP --> S
  style P fill:#4c6ef5,stroke:#1c3d8c,stroke-width:1,color:#fff
  style G fill:#ec4899,stroke:#8e1b5b,stroke-width:1,color:#fff
  style S fill:#6366f1,stroke:#4338ca,stroke-width:1,color:#fff
  style B fill:#0ea5e9,stroke:#075985,stroke-width:1,color:#fff
  style R fill:#334155,stroke:#1e293b,stroke-width:1,color:#fff
```

### ASCII Fallback

```
 [User]
    |
    v
 [React Frontend] --(REST)--> [Express Server] --(SQL JSONB)--> [Neon Postgres]
        |                               
        +--(Prompt)--> [Gemini API]

 CI/CD:
   [GitHub Actions] -> build/test -> docker images -> [GHCR] -> (pull) -> [Deployment Environment]

 Cloud Sync Path:
   localStorage <-> Save/Load buttons <-> /api/sync/save|load <-> user_data table
```

---
End of extended DevOps guidance. Iterate gradually—don’t attempt all phases at once.

## Deployment Options (Multi-Cloud & Platforms)

Below are plug-and-play ways to deploy the frontend (static SPA) and backend (Express API) across popular providers.

### 1. Netlify (Frontend Only)
Purpose: Host static built `dist/` with global CDN.

File: `netlify.toml` (added)
Build settings:
  - Build command: `npm run build`
  - Publish directory: `dist`
Environment Variables (set in Netlify UI):
  - `GEMINI_API_KEY`
  - `VITE_API_BASE_URL` → your backend URL (e.g., Render, Railway, Cloud Run)
Steps:
  1. Create new site from Git repo.
  2. Add env vars under Site Settings → Build & Deploy → Environment.
  3. Deploy. SPA routing handled via redirect in `netlify.toml`.

### 2. Render (Frontend + Backend Containers)
Purpose: Simple container deployment using `render.yaml`.

File: `render.yaml` (added)
Services:
  - `life-tracker-web`: Docker build of frontend image.
  - `life-tracker-server`: Docker build of backend.
Setup:
  1. New Blueprint deploy in Render, point to repo.
  2. Add secret env vars in Render dashboard: `GEMINI_API_KEY`, `DATABASE_URL`.
  3. After deploy, copy server URL; update `VITE_API_BASE_URL` if needed.
AutoDeploy: enabled by default (can toggle).

### 3. Railway (Containers)
File: `railway.json` (added) – describes services referencing Dockerfiles.
Steps:
  1. Import repo into Railway.
  2. Add `DATABASE_URL`, `GEMINI_API_KEY` secrets.
  3. Deploy services; verify health endpoint `/api/health` for server.

### 4. Generic Docker Host / VM
Prereqs: Docker + domain + reverse proxy (optional).
Steps:
```bash
git clone <repo>
cd life-tracker
docker compose pull  # if using GHCR images
docker compose up -d
```
Expose ports 3000 (web) & 4000 (api) or put behind Nginx / Caddy.
Add TLS via Let's Encrypt (e.g., Caddy automatic HTTPS).

### 5. Cloud Run (Backend) + Netlify (Frontend)
Backend:
```bash
gcloud builds submit --tag gcr.io/<project>/life-tracker-server:latest server/
gcloud run deploy life-tracker-server \
  --image gcr.io/<project>/life-tracker-server:latest \
  --allow-unauthenticated \
  --region=us-central1 \
  --set-env-vars DATABASE_URL=$DATABASE_URL
```
Frontend: Deploy to Netlify with `VITE_API_BASE_URL` set to Cloud Run URL.

### 6. AWS (ECS Fargate or Elastic Beanstalk)
- Use published GHCR images or build in AWS CodeBuild.
- ECS Task Definitions for `web` and `server` each with environment variables.
- ALB routes / path-based mapping (`/api/*` to server).

### 7. Kubernetes (Any Cloud)
Sample minimal manifests (create `k8s/` later):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: life-tracker-server }
spec:
  replicas: 2
  selector: { matchLabels: { app: life-tracker-server }}
  template:
    metadata: { labels: { app: life-tracker-server }}
    spec:
      containers:
        - name: server
          image: ghcr.io/<owner>/<repo>/server:latest
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef: { name: db-secrets, key: DATABASE_URL }
          ports: [{ containerPort: 4000 }]
---
apiVersion: v1
kind: Service
metadata: { name: life-tracker-server }
spec:
  selector: { app: life-tracker-server }
  ports: [{ port: 80, targetPort: 4000 }]
```
Frontend similarly using `web` image; Ingress routes to web; web calls server internal service.

### 8. Environment Variable Matrix
| Variable | Frontend Build | Backend Runtime | Description |
|----------|----------------|-----------------|-------------|
| GEMINI_API_KEY | yes | optional | Google Gemini access for AI features |
| VITE_API_BASE_URL | yes | n/a | Base URL for backend API calls |
| DATABASE_URL | no | yes | Neon Postgres connection URI |
| PORT | no | yes (defaults 4000) | Express listening port |

### 9. Deployment Verification Checklist
1. Health endpoint `/api/health` returns `{ ok: true }`
2. Frontend loads and calls backend (network tab 200 responses)
3. Cloud Sync (Save/Load) works with Neon credentials
4. AI features return suggestions (Gemini key valid)
5. HTTPS enforced (redirect HTTP → HTTPS)
6. No secrets exposed in frontend bundle (search built JS for keys)

### 10. Rollback Strategy
- Keep previous tagged images (e.g., `ghcr.io/...:v1.2.3`).
- If deploy fails:
  - Redeploy last known good tag.
  - Verify health & logs.
- For Netlify: trigger redeploy of previous build (UI has rollback).

### 11. Cost & Scaling Tips
- Use one small container for server; scale only if `/api` latency increases.
- Serve frontend from static host (Netlify/CDN) instead of container for lower cost.
- Neon pooling endpoint for concurrency optimization.

### 12. Things NOT Done Yet (Future Enhancements)
- Helm charts
- Automated canary releases
- Blue/green deployments
- WAF / bot protection
- RUM (real user monitoring) metrics on frontend

### 13. Minimal One-Command Deployment (Local)
```bash
GEMINI_API_KEY=xxx DATABASE_URL=postgres://... VITE_API_BASE_URL=http://localhost:4000 \
docker compose up --build
```

---
For provider-specific deep dives, extend this section or create `docs/deploy/` with per-platform guides.
