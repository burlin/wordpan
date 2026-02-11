# Диагностика: почему нет ответа от AI

## 1. Запрос вообще доходит до сервера?

**Логи AI:**
```powershell
docker compose logs -f ai
```

Сделай запрос (Generate / Random Phrase). Смотри в логах:

| Что видно | Значит |
|-----------|--------|
| `[API] POST /api/random-phrase` | Запрос дошёл |
| `[DEBUG] random-phrase: handler started` | Обработчик запустился |
| Только `OPTIONS`, нет `POST` | CORS блокирует — запрос не отправляется |

## 2. Ошибка аутентификации?

| В логах | Значит |
|---------|--------|
| `[DEBUG] Auth failed: ...` | JWT не проходит проверку. Проверь `SUPABASE_ANON_KEY` в ai/.env — должен совпадать с ключом из web |
| `401` в браузере | Тот же сценарий |

## 3. Ошибка в самом хэндлере?

| В логах | Значит |
|---------|--------|
| `[DEBUG] random-phrase: user_id=..., words=[...]` | Auth прошёл, идёт генерация |
| `[DEBUG] random-phrase: calling CrewAI...` | Вызов LLM |
| `[API] random-phrase error: ...` | Падение в CrewAI/LLM (часто нет GROQ_API_KEY или лимит) |

## 4. Проверка в браузере (DevTools F12)

**Network:**
- Найди запрос к `localhost:8000/api/random-phrase`
- Status: 200 = ок, 401 = auth, 500 = ошибка на бэке, CORS error = нет CORS-заголовков
- Response: посмотри тело ответа

**Console:**
- Ошибки CORS или "Failed to fetch" — запрос не доходит до сервера

## 5. Generate AI (word-pairs/enrich)

Те же шаги: смотри `docker compose logs -f ai`. При нажатии Generate AI:

| В логах | Значит |
|---------|--------|
| `[API] POST /api/word-pairs/enrich` | Запрос дошёл |
| `[DEBUG] word-pairs/enrich: handler started` | Обработчик запущен |
| `[DEBUG] word-pairs/enrich: returning cached` | Уже было в кэше |
| `[DEBUG] word-pairs/enrich: pair not found` | pair_id не найден в word_pairs |
| `[DEBUG] word-pairs/enrich: word data not found` | Нет слов в таблице words |
| `[DEBUG] word-pairs/enrich: calling CrewAI...` | Идёт вызов LLM |
| `[API] word-pairs/enrich error: ...` | Ошибка (CrewAI, GROQ и т.п.) |

**Браузер:** если есть ошибка, она показывается красным текстом под кнопкой Generate AI.

## 6. Ручная проверка API (PowerShell)

```powershell
# Требуется JWT из браузера (DevTools → Application → Local Storage → supabase auth)
$token = "твой_jwt_токен"
$body = '{"words":["hello","world","test"]}'
Invoke-RestMethod -Uri "http://localhost:8000/api/random-phrase" -Method POST -Headers @{
  "Content-Type"="application/json"; "Authorization"="Bearer $token"
} -Body $body
```

## Итоговая схема

```
Браузер --[POST]--> localhost:8000
                        |
                        v
              [CORS] OPTIONS 200?
                        |
                   [Auth] JWT valid?
                        |
                   [CrewAI] GROQ OK?
                        |
                   [Response] 200 + JSON
```

Где нет ответа — там и ищи проблему.
