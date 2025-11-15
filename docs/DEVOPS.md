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
