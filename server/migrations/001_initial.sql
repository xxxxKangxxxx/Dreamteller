-- DreamTeller initial schema
-- Apply via Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Idempotent: safe to re-run.

-- ============================================================
-- 1. TABLES
-- ============================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  avatar_url  text,
  plan        text not null default 'FREE' check (plan in ('FREE', 'PREMIUM')),
  created_at  timestamptz not null default now()
);

create table if not exists public.dreams (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  title            text,
  raw_content      text not null,
  chat_history     jsonb,
  emotion          text not null default 'NEUTRAL'
                   check (emotion in ('POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED')),
  illustration_url text,
  is_lucid         boolean not null default false,
  recorded_at      timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

create table if not exists public.interpretations (
  id                    uuid primary key default gen_random_uuid(),
  dream_id              uuid not null unique references public.dreams(id) on delete cascade,
  symbol_analysis       text,
  psychological_meaning text,
  unconscious_message   text,
  created_at            timestamptz not null default now()
);

create table if not exists public.dream_characters (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  relation     text,
  appear_count int not null default 1
);

create table if not exists public.dream_character_links (
  dream_id     uuid not null references public.dreams(id) on delete cascade,
  character_id uuid not null references public.dream_characters(id) on delete cascade,
  primary key (dream_id, character_id)
);

create table if not exists public.dream_places (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  appear_count int not null default 1
);

create table if not exists public.dream_place_links (
  dream_id uuid not null references public.dreams(id) on delete cascade,
  place_id uuid not null references public.dream_places(id) on delete cascade,
  primary key (dream_id, place_id)
);

create table if not exists public.dream_tags (
  id       uuid primary key default gen_random_uuid(),
  dream_id uuid not null references public.dreams(id) on delete cascade,
  label    text not null
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

create index if not exists dreams_user_recorded_idx
  on public.dreams (user_id, recorded_at desc);

create index if not exists dream_tags_dream_idx
  on public.dream_tags (dream_id);

create index if not exists dream_characters_user_idx
  on public.dream_characters (user_id);

create index if not exists dream_places_user_idx
  on public.dream_places (user_id);

-- ============================================================
-- 3. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users who signed up before this trigger existed
insert into public.profiles (id, name)
select id, raw_user_meta_data->>'name'
from auth.users
on conflict (id) do nothing;

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles              enable row level security;
alter table public.dreams                enable row level security;
alter table public.interpretations       enable row level security;
alter table public.dream_characters      enable row level security;
alter table public.dream_character_links enable row level security;
alter table public.dream_places          enable row level security;
alter table public.dream_place_links     enable row level security;
alter table public.dream_tags            enable row level security;

-- profiles: 본인 row만
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- dreams: 본인 user_id 데이터만
drop policy if exists "dreams_all_own" on public.dreams;
create policy "dreams_all_own" on public.dreams
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- interpretations: 부모 dream의 user_id 기준
drop policy if exists "interpretations_all_via_dream" on public.interpretations;
create policy "interpretations_all_via_dream" on public.interpretations
  for all using (
    exists (
      select 1 from public.dreams d
      where d.id = interpretations.dream_id and d.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.dreams d
      where d.id = interpretations.dream_id and d.user_id = auth.uid()
    )
  );

-- dream_characters / dream_places
drop policy if exists "dream_characters_all_own" on public.dream_characters;
create policy "dream_characters_all_own" on public.dream_characters
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "dream_places_all_own" on public.dream_places;
create policy "dream_places_all_own" on public.dream_places
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- link tables / tags: 부모 dream의 user_id 기준
drop policy if exists "dream_character_links_via_dream" on public.dream_character_links;
create policy "dream_character_links_via_dream" on public.dream_character_links
  for all using (
    exists (
      select 1 from public.dreams d
      where d.id = dream_character_links.dream_id and d.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.dreams d
      where d.id = dream_character_links.dream_id and d.user_id = auth.uid()
    )
  );

drop policy if exists "dream_place_links_via_dream" on public.dream_place_links;
create policy "dream_place_links_via_dream" on public.dream_place_links
  for all using (
    exists (
      select 1 from public.dreams d
      where d.id = dream_place_links.dream_id and d.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.dreams d
      where d.id = dream_place_links.dream_id and d.user_id = auth.uid()
    )
  );

drop policy if exists "dream_tags_via_dream" on public.dream_tags;
create policy "dream_tags_via_dream" on public.dream_tags
  for all using (
    exists (
      select 1 from public.dreams d
      where d.id = dream_tags.dream_id and d.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.dreams d
      where d.id = dream_tags.dream_id and d.user_id = auth.uid()
    )
  );
