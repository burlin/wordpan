# AI Enrichment structure and phrase management

## Current state
- `examples`: example sentences
- `paraphrases`: paraphrased versions
- `similar_words`: `{ word_a: [...], word_b: [...] }` — synonyms per word

## Target structure

### 1. Word dicts
```json
{
  "word_a": {
    "word": "bridge",
    "synonyms": ["link", "connect", "span"]
  },
  "word_b": {
    "word": "advance",
    "synonyms": ["progress", "forward", "proceed"]
  }
}
```

### 2. Phrases (examples + paraphrases merged)
```json
{
  "phrases": [
    "The bridge helped advance trade between regions.",
    "We need to bridge the gap and advance our goals."
  ],
  "current_phrase_index": 0
}
```

### 3. Full cache structure
```json
{
  "word_pair_id": "uuid",
  "user_id": "uuid",
  "word_a_synonyms": ["link", "connect", "span"],
  "word_b_synonyms": ["progress", "forward", "proceed"],
  "phrases": ["phrase1", "phrase2", ...],
  "current_phrase_index": 0
}
```
*Words word_a/word_b come from the related pair, not duplicated.*

## DB schema (migration)

```sql
ALTER TABLE word_pair_ai_cache 
  ADD COLUMN current_phrase_index integer DEFAULT 0;
```

## How to change the current phrase

### Option A: Frontend only (simple)
- `useState(phraseIndex)` — index in memory
- Button "Next phrase" → `setPhraseIndex((i + 1) % len)`
- On pair switch — reset to 0
- **Downside**: resets on page reload

### Option B: Persist in DB (recommended)
1. On "Next phrase" / "Prev phrase" click:
   - Update UI
   - `supabase.from('word_pair_ai_cache').update({ current_phrase_index: newIndex })...`
2. On load: take `current_phrase_index` from cache
3. On first Generate AI: `current_phrase_index = 0`

### Option C: Separate user_preferences table
- More flexibility, more schema complexity

**Recommendation**: Option B — one table, one column, simple PATCH.

## Data flow

```
AI Response → parse into structure → save to cache
                                      ↓
Frontend loads cache → shows phrases[current_phrase_index]
                                      ↓
User clicks Next → PATCH current_phrase_index → UI updates
```
