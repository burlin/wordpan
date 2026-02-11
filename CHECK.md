# Чеклист запуска Wordpan

## 1. Supabase (обязательно)

```powershell
npx supabase start
```

Проверить: `npx supabase status` — должен быть "running"

## 2. Docker-контейнеры

```powershell
docker compose up -d
```

Проверить: `docker compose ps` — все сервисы (web, ai, phoenix, phoenix-db) должны быть "Up"

## 3. Файл ai/.env (обязательно)

Должны быть заполнены:
- `GROQ_API_KEY` — получить на https://console.groq.com/keys
- `SUPABASE_URL` — `http://host.docker.internal:54321` (для Docker)
- `SUPABASE_ANON_KEY` — из `npx supabase status`
- `SUPABASE_SERVICE_ROLE_KEY` — из `npx supabase status` (Secret key)

## 4. Файл web/.env.local (обязательно)

- `VITE_SUPABASE_URL` — `http://127.0.0.1:54321`
- `VITE_SUPABASE_ANON_KEY` — из supabase status (Publishable)

## 5. Открыть приложение

- **Через Docker**: http://localhost:5173
- **Локально** (pnpm dev в web/): http://localhost:5173 или 5174

## Быстрая проверка

```powershell
# Supabase
npx supabase status

# Docker
docker compose ps

# AI health (PowerShell)
Invoke-WebRequest http://localhost:8000/health -UseBasicParsing
```

## Важно: Origin для CORS

AI принимает запросы с портов **5173** и **5174**. Если фронт на другом порту — добавь в `ai/run.py` в список `origins`.
