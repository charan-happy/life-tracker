<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## Life Tracker – Local, Docker, Neon, and DevOps

This project now includes:
- Frontend: Vite + React app in this folder
- Backend: Lightweight Express API (server/) for cloud sync, backed by Neon Postgres
- Docker: Compose to run both together

### Prerequisites
- Node.js 20+
- Docker (optional, for containerized run)
- A Neon.tech Postgres database (free tier works)

### Env configuration
Copy `.env.example` to `.env` and fill values:

- GEMINI_API_KEY: your Google AI Studio key
- DATABASE_URL: your Neon connection string (must include `sslmode=require`)

You can also keep using `.env.local` for the frontend-only run (GEMINI_API_KEY).

### Run locally (two terminals)
1) Install deps at root and in server
   - npm install
   - (cd server && npm install)
2) Start backend API (Neon required for sync)
   - From server/: `npm run dev` (listens on http://localhost:4000)
3) Start frontend
   - From project root: `npm run dev` (opens on http://localhost:3000)

Tip: set VITE_API_BASE_URL in `.env` or environment to `http://localhost:4000` so the app can use Cloud Sync.

### Run with Docker
- Ensure `.env` has GEMINI_API_KEY and DATABASE_URL
- Start both services:

```
docker compose up --build
```

Then open http://localhost:3000. The API is at http://localhost:4000.

### CI/CD and DevOps

- Continuous Integration: see `.github/workflows/ci.yml`
- Docker image publishing: see `.github/workflows/docker-publish.yml`
- Full DevOps guide: see `docs/DEVOPS.md`

Security note: Never commit real secrets to the repo. Use `.env` locally and GitHub Actions Secrets in CI.

### Neon.tech setup
1) Create a Neon project at https://neon.tech
2) Create a database and a role; copy the connection string
3) Ensure your string includes `?sslmode=require`
4) Add it to your `.env` as DATABASE_URL
5) The server auto-creates one table `user_data` for Cloud Sync on start

### Cloud Sync feature
In the sidebar, set a “Cloud Sync ID” (or click “New”). Use Save/Load to upload/download all your local data (ideas, habits, weekly/monthly/yearly) to Neon via the API.

### Notes
- Existing app behavior (localStorage) remains unchanged; Cloud Sync is optional.
- Styling updated for a subtle gradient and glass feel; no breaking changes.
