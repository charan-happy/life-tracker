# Docker Quick Start Guide

## Prerequisites
- Docker Desktop installed and running
- Your Gemini API key (get from https://aistudio.google.com/apikey)
- Optional: Neon database URL (get from https://neon.tech)

## Setup Steps

### 1. Configure Environment Variables
Edit `.env` file and replace `PLACEHOLDER_API_KEY` with your actual Gemini API key:

```bash
GEMINI_API_KEY=your_actual_key_here
```

Optional: Add Neon database URL to enable Cloud Sync:
```bash
DATABASE_URL=postgres://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### 2. Build and Start Containers

From the project root directory:

```bash
docker compose up --build
```

This will:
- Build the backend API (Express server)
- Build the frontend (Vite React app)
- Start both services
- Backend runs on http://localhost:4000
- Frontend runs on http://localhost:3000

### 3. Access Your App

Open your browser to: **http://localhost:3000**

### 4. Stop Containers

Press `Ctrl+C` in the terminal, then run:

```bash
docker compose down
```

## Useful Commands

```bash
# Start in detached mode (background)
docker compose up -d

# View logs
docker compose logs -f

# Stop containers
docker compose down

# Rebuild after code changes
docker compose up --build

# Remove all containers and images
docker compose down --rmi all --volumes
```

## Troubleshooting

**Port already in use?**
- Stop any local dev servers (npm run dev)
- Check what's using port 3000: `lsof -ti:3000 | xargs kill -9`
- Check what's using port 4000: `lsof -ti:4000 | xargs kill -9`

**Build errors?**
- Make sure Docker Desktop is running
- Try: `docker compose down && docker compose up --build`

**Database connection errors?**
- Cloud Sync is optional - app works without DATABASE_URL
- If you see DB warnings, that's normal without Neon setup
