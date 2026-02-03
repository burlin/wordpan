-- Create word_pairs table
-- front = word from words table (word_id), back = translation/definition
create table public.word_pairs (
  id uuid default gen_random_uuid() primary key,
  word_id uuid references public.words(id) on delete cascade not null,
  back text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  unique (user_id, word_id)
);

-- Enable RLS
alter table public.word_pairs enable row level security;

-- RLS policies for word_pairs
create policy "Users can view own word pairs"
  on public.word_pairs for select
  using (auth.uid() = user_id);

create policy "Users can insert own word pairs"
  on public.word_pairs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own word pairs"
  on public.word_pairs for update
  using (auth.uid() = user_id);

create policy "Users can delete own word pairs"
  on public.word_pairs for delete
  using (auth.uid() = user_id);

-- Trigger for updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger word_pairs_updated_at
  before update on public.word_pairs
  for each row execute procedure public.update_updated_at_column();

-- Enable RLS on words and allow authenticated users to insert (for adding new words when creating pairs)
alter table public.words enable row level security;

-- Allow everyone to read words (anon + authenticated)
create policy "Anyone can read words"
  on public.words for select
  using (true);

-- Allow authenticated users to insert new words
create policy "Authenticated users can insert words"
  on public.words for insert
  with check (auth.role() = 'authenticated');
