# Debugging: why AI is not responding

## 1. Does the request reach the server?

**AI logs:**
```powershell
docker compose logs -f ai
```

Make a request (Generate / Random Phrase). Check the logs:

| In logs | Means |
|---------|-------|
| `[API] POST /api/random-phrase` | Request reached the server |
| `[DEBUG] random-phrase: handler started` | Handler started |
| Only `OPTIONS`, no `POST` | CORS blocking — request is not sent |

## 2. Auth error?

| In logs | Means |
|---------|-------|
| `[DEBUG] Auth failed: ...` | JWT validation failed. Check `SUPABASE_ANON_KEY` in ai/.env — must match key from web |
| `401` in browser | Same scenario |

## 3. Error in the handler?

| In logs | Means |
|---------|-------|
| `[DEBUG] random-phrase: user_id=..., words=[...]` | Auth passed, generating |
| `[DEBUG] random-phrase: calling CrewAI...` | Calling LLM |
| `[API] random-phrase error: ...` | Failure in CrewAI/LLM (often no GROQ_API_KEY or rate limit) |

## 4. Browser check (DevTools F12)

**Network:**
- Find the request to `localhost:8000/api/random-phrase`
- Status: 200 = ok, 401 = auth, 500 = backend error, CORS error = missing CORS headers
- Response: check the response body

**Console:**
- CORS errors or "Failed to fetch" — request does not reach the server

## 5. Generate AI (word-pairs/enrich)

Same steps: watch `docker compose logs -f ai`. When clicking Generate AI:

| In logs | Means |
|---------|-------|
| `[API] POST /api/word-pairs/enrich` | Request reached |
| `[DEBUG] word-pairs/enrich: handler started` | Handler started |
| `[DEBUG] word-pairs/enrich: returning cached` | Already in cache |
| `[DEBUG] word-pairs/enrich: pair not found` | pair_id not found in word_pairs |
| `[DEBUG] word-pairs/enrich: word data not found` | No words in words table |
| `[DEBUG] word-pairs/enrich: calling CrewAI...` | Calling LLM |
| `[API] word-pairs/enrich error: ...` | Error (CrewAI, GROQ, etc.) |

**Browser:** if there is an error, it appears in red below the Generate AI button.

## 6. Manual API test (PowerShell)

```powershell
# Requires JWT from browser (DevTools → Application → Local Storage → supabase auth)
$token = "your_jwt_token"
$body = '{"words":["hello","world","test"]}'
Invoke-RestMethod -Uri "http://localhost:8000/api/random-phrase" -Method POST -Headers @{
  "Content-Type"="application/json"; "Authorization"="Bearer $token"
} -Body $body
```

## Flow overview

```
Browser --[POST]--> localhost:8000
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

Where there is no response — that is where to look for the problem.
