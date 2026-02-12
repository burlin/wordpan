# Wordpan Startup Checklist

## 1. Supabase (required)

```powershell
npx supabase start
```

Check: `npx supabase status` — should show "running"

Migrations: `npx supabase db push` (applies all new migrations, including current_phrase_index)

## 2. Docker containers

```powershell
docker compose up -d
```

Check: `docker compose ps` — all services (web, ai, phoenix, phoenix-db) should be "Up"

## 3. File ai/.env (required)

Must be set:
- `GROQ_API_KEY` — get at https://console.groq.com/keys
- `SUPABASE_URL` — `http://host.docker.internal:54321` (for Docker)
- `SUPABASE_ANON_KEY` — from `npx supabase status`
- `SUPABASE_SERVICE_ROLE_KEY` — from `npx supabase status` (Secret key)

## 4. File web/.env.local (required)

- `VITE_SUPABASE_URL` — `http://127.0.0.1:54321`
- `VITE_SUPABASE_ANON_KEY` — from supabase status (Publishable)

## 5. Open the app

- **Via Docker**: http://localhost:5173
- **Locally** (pnpm dev in web/): http://localhost:5173 or 5174

## Quick check

```powershell
# Supabase
npx supabase status

# Docker
docker compose ps

# AI health (PowerShell)
Invoke-WebRequest http://localhost:8000/health -UseBasicParsing
```

## CORS origin

AI accepts requests from ports **5173** and **5174**. If the frontend runs on a different port, add it to the `origins` list in `ai/run.py`.
