-- Supabase SQL Editor에서 한 번 실행하면 추모관 방명록이 활성화됩니다.
create table if not exists public.guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 80),
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists guestbook_entries_pet_created_idx
  on public.guestbook_entries (pet_id, created_at desc);

alter table public.guestbook_entries enable row level security;

drop policy if exists "visible memorial guestbook read" on public.guestbook_entries;
create policy "visible memorial guestbook read" on public.guestbook_entries
for select using (
  exists (select 1 from public.pets where pets.id = guestbook_entries.pet_id
    and (pets.is_public or pets.owner_id = auth.uid()))
);

drop policy if exists "signed in visitors write guestbook" on public.guestbook_entries;
create policy "signed in visitors write guestbook" on public.guestbook_entries
for insert to authenticated with check (
  auth.uid() = author_id and exists (select 1 from public.pets
    where pets.id = guestbook_entries.pet_id and (pets.is_public or pets.owner_id = auth.uid()))
);

drop policy if exists "authors delete own guestbook entries" on public.guestbook_entries;
create policy "authors delete own guestbook entries" on public.guestbook_entries
for delete to authenticated using (auth.uid() = author_id);
