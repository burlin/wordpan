-- Add current_phrase_index to track which phrase user is viewing
alter table public.word_pair_ai_cache
  add column if not exists current_phrase_index integer not null default 0;
